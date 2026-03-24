/**
 * Market Intelligence Engine
 * Aggregates ALL signals (existing strategies + DIY indicators) to produce:
 * - Long / Short probability score
 * - Price exhaustion / overextension score
 * - Market state classification
 * - Trade recommendation with risk context
 */
const MarketIntelligence = {

    /**
     * Main analysis function.
     * @param {Array} strategyResults - from StrategyAnalyzers (existing 20)
     * @param {Array} diyResults      - from DIYAnalyzers (new 28)
     * @param {Array} klines          - raw OHLCV data
     * @returns {Object} intelligence report
     */
    analyze(strategyResults, diyResults, klines) {
        const all = [...(strategyResults || []), ...(diyResults || [])].filter(r => r && r.signal);
        if (all.length === 0 || !klines || klines.length < 20) return null;

        // ── 1. Vote Count ────────────────────────────────────────────────────
        let buyVotes = 0, sellVotes = 0, neutralVotes = 0;
        let buyWeight = 0, sellWeight = 0;

        // "Alpha" Indicators that historically provide higher conviction signals get a multiplier
        const ALPHA_MULTIPLIERS = {
            'diy_squeeze_momentum': 2.0,
            'diy_vegas_tunnel': 2.0,
            'diy_wae': 1.8,
            'diy_chandelier_exit': 1.5,
            'diy_hull_suite': 1.5,
            'diy_qqe_mod': 1.5,
            'diy_bxtrender': 1.5,
            'ichimoku': 1.5,
            'supertrend': 1.5,
            'macd_crossover': 1.2,
            'golden_cross': 1.5
        };

        all.forEach(r => {
            const multiplier = ALPHA_MULTIPLIERS[r.id] || 1.0;
            const w = (r.strength || 0.5) * multiplier;
            
            if (r.signal === 'buy')     { buyVotes++;     buyWeight  += w; }
            else if (r.signal === 'sell') { sellVotes++;   sellWeight += w; }
            else                          { neutralVotes++; }
        });

        const total = all.length;
        const longPct  = Math.round((buyWeight  / (buyWeight + sellWeight + 0.001)) * 100);
        const shortPct = Math.round((sellWeight / (buyWeight + sellWeight + 0.001)) * 100);

        // ── 2. Overextension / Price-Gone-Too-Far Score ───────────────────────
        const exhaustion = this._calcExhaustion(klines, all);

        // ── 3. Market State ────────────────────────────────────────────────────
        const state = this._classifyMarket(all, exhaustion, longPct);

        // ── 4. Consensus Bias ──────────────────────────────────────────────────
        const bias = longPct >= 60 ? 'BULLISH' : shortPct >= 60 ? 'BEARISH' : 'MIXED';

        // ── 5. Trade Recommendation ────────────────────────────────────────────
        const rec = this._buildRecommendation(bias, state, exhaustion, longPct, shortPct, buyVotes, sellVotes, total);

        return {
            total, buyVotes, sellVotes, neutralVotes,
            longPct, shortPct,
            bias, state, exhaustion,
            recommendation: rec,
            topBuySignals:  all.filter(r => r.signal === 'buy').sort((a,b) => b.strength - a.strength).slice(0, 3),
            topSellSignals: all.filter(r => r.signal === 'sell').sort((a,b) => b.strength - a.strength).slice(0, 3),
        };
    },

    _calcExhaustion(klines, allResults) {
        const closes = klines.map(k => k.close);
        const scores = [];

        // RSI overextension
        try {
            const rsi = window.Indicators.rsi(closes, 14);
            const rsiVal = rsi[rsi.length - 1];
            if (rsiVal !== null) {
                if (rsiVal >= 75) scores.push({ label: 'RSI', score: (rsiVal - 70) / 30, dir: 'up' });
                else if (rsiVal <= 25) scores.push({ label: 'RSI', score: (30 - rsiVal) / 30, dir: 'down' });
            }
        } catch(e) {}

        // Z-score (distance from 20-period SMA in std devs)
        try {
            const sma20 = window.Indicators.sma(closes, 20);
            const std20 = window.Indicators.stdDev(closes, 20);
            const c = closes[closes.length - 1];
            const z = (c - sma20[sma20.length - 1]) / (std20[std20.length - 1] || 1);
            if (Math.abs(z) > 2) scores.push({ label: 'Z-Score', score: Math.min(Math.abs(z) / 3, 1), dir: z > 0 ? 'up' : 'down' });
        } catch(e) {}

        // Bollinger Band extremes
        try {
            const { upper, lower } = window.Indicators.bollingerBands(closes);
            const c = closes[closes.length - 1];
            const u = upper[upper.length - 1], l = lower[lower.length - 1];
            if (u && c > u) scores.push({ label: 'BB', score: Math.min((c - u) / (u - l) * 5, 1), dir: 'up'   });
            if (l && c < l) scores.push({ label: 'BB', score: Math.min((l - c) / (u - l) * 5, 1), dir: 'down' });
        } catch(e) {}

        // DIY Williams %R
        const wrSignal = allResults.find(r => r.id === 'williams_r');
        if (wrSignal && Math.abs(wrSignal.value) <= 10)
            scores.push({ label: 'Williams%R', score: 0.8, dir: wrSignal.value >= -10 ? 'up' : 'down' });

        // MFI extreme
        const mfiSignal = allResults.find(r => r.id === 'mfi');
        if (mfiSignal && mfiSignal.value !== null) {
            if (mfiSignal.value >= 80) scores.push({ label: 'MFI', score: (mfiSignal.value - 80) / 20, dir: 'up' });
            if (mfiSignal.value <= 20) scores.push({ label: 'MFI', score: (20 - mfiSignal.value) / 20, dir: 'down' });
        }

        // Distance from VWAP
        try {
            const vwap = window.Indicators.vwap(klines);
            const c = closes[closes.length - 1];
            const v = vwap[vwap.length - 1];
            const dev = (c - v) / v * 100;
            if (Math.abs(dev) > 4) scores.push({ label: 'VWAP', score: Math.min(Math.abs(dev) / 8, 1), dir: dev > 0 ? 'up' : 'down' });
        } catch(e) {}

        if (scores.length === 0) return { score: 0, level: 'Normal', dir: 'neutral', contributors: [] };

        const upScores   = scores.filter(s => s.dir === 'up');
        const downScores = scores.filter(s => s.dir === 'down');
        const dominantDir = upScores.length >= downScores.length ? 'up' : 'down';
        const domScores  = dominantDir === 'up' ? upScores : downScores;
        const avg = domScores.reduce((a, s) => a + s.score, 0) / (domScores.length || 1);

        const isZh = window.i18n && window.i18n.current === 'zh-TW';
        const level = avg >= 0.75 ? (isZh ? '🔥 嚴重超買/超賣' : '🔥 Severely Overextended')
            : avg >= 0.5  ? (isZh ? '⚠️ 超買/超賣' : '⚠️ Overextended')
            : avg >= 0.3  ? (isZh ? '🟡 略微超買/超賣' : '🟡 Slightly Stretched')
            : (isZh ? '正常 (Normal)' : 'Normal');

        return { score: Math.round(avg * 100), level, dir: dominantDir, contributors: scores.map(s => s.label) };
    },

    _classifyMarket(allResults, exhaustion, longPct) {
        const ema = allResults.find(r => r.id === 'ema_ribbon');
        const adx = allResults.find(r => r.id === 'adx_trend');
        const squeeze = allResults.find(r => r.id === 'squeeze_momentum');
        const isTrending  = adx && adx.value > 25;
        const isSqueezed  = squeeze && squeeze.details.includes('IN SQUEEZE');
        const isExhausted = exhaustion.score >= 60;
        
        const isZh = window.i18n && window.i18n.current === 'zh-TW';

        if (isExhausted && isTrending) return { label: isZh ? '🔥 趨勢衰竭' : '🔥 Trend Exhaustion', color: '#f97316',
            description: isZh ? '強烈趨勢但指標顯示過度擴張。反轉風險極高，避免追高/追空。' : 'Strong trend but indicators show overextension. Reversal risk is HIGH. Avoid chasing.' };
        if (isExhausted) return { label: isZh ? '⚠️ 過度擴張' : '⚠️ Overextended', color: '#ef4444',
            description: isZh ? '價格走得太快太遠。短期內極可能發生回調或盤整。' : 'Price has moved too far too fast. High chance of pullback or consolidation soon.' };
        if (isSqueezed)  return { label: isZh ? '🟡 突破前擠壓' : '🟡 Pre-Breakout Squeeze', color: '#eab308',
            description: isZh ? '市場正在蓄力（布林帶收斂至肯特納通道內）。即將爆發大行情，請等待方向確立後再進場。' : 'Market is coiling — BB inside Keltner. An explosive move is building. Do NOT trade yet, wait for the pivot.' };
        if (isTrending && longPct >= 60) return { label: isZh ? '🟢 強勢多頭' : '🟢 Strong Uptrend', color: '#22c55e',
            description: isZh ? '各大指標強烈看漲。順勢做多勝率高，請使用移動停損控制風險。' : 'Indicators strongly aligned bullish. Trend-following longs are favored. Manage risk with trailing stops.' };
        if (isTrending && longPct < 40)  return { label: isZh ? '🔴 強勢空頭' : '🔴 Strong Downtrend', color: '#ef4444',
            description: isZh ? '各大指標強烈看跌。順勢做空勝率高。' : 'Indicators strongly aligned bearish. Trend-following shorts are favored.' };
        if (longPct >= 55) return { label: isZh ? '📈 溫和看漲' : '📈 Moderate Bullish', color: '#86efac',
            description: isZh ? '多數指標看漲，但趨勢強度普通。請使用較小的倉位進行交易。' : 'Majority of indicators are bullish but trend strength is moderate. Proceed with manageable position size.' };
        if (longPct <= 45) return { label: isZh ? '📉 溫和看跌' : '📉 Moderate Bearish', color: '#fca5a5',
            description: isZh ? '多數指標看跌。做空可能較具優勢。' : 'Majority of indicators are bearish. Short positions may have an edge.' };
        return { label: isZh ? '⚪ 盤整 / 中立' : '⚪ Ranging / Neutral', color: '#94a3b8',
            description: isZh ? '指標產生分歧。市場可能處於盤整或過渡期。最好等待更明確的訊號。' : 'Indicators are conflicting. Market is likely ranging or transitioning. Best to wait for clearer signals.' };
    },

    _buildRecommendation(bias, state, exhaustion, longPct, shortPct, buyVotes, sellVotes, total) {
        const confString = (pct) => pct >= 75 ? 'Very High' : pct >= 60 ? 'High' : pct >= 50 ? 'Moderate' : 'Low';
        const isZh = window.i18n && window.i18n.current === 'zh-TW';
        const confStr = isZh ? (longPct >= 75 ? '極高' : longPct >= 60 ? '高' : longPct >= 50 ? '中等' : '低') : confString(longPct);
        const shortConfStr = isZh ? (shortPct >= 75 ? '極高' : shortPct >= 60 ? '高' : shortPct >= 50 ? '中等' : '低') : confString(shortPct);

        if (exhaustion.score >= 75) {
            const reverseDir = exhaustion.dir === 'up' ? 'SHORT / Sell' : 'LONG / Buy';
            const reverseDirZh = exhaustion.dir === 'up' ? '做空 / 賣出' : '做多 / 買入';
            return {
                action: isZh ? '⚠️ 觀望 / 謹慎逆勢操作' : '⚠️ WAIT / Fade with caution',
                color: '#f97316',
                confidence: isZh ? '謹慎' : 'Cautious',
                message: isZh 
                    ? `價格已嚴重向下/向上延伸 (${exhaustion.score}% 衰竭指數)。現在 ${reverseDirZh} 會有極高機率被軋空/軋多。最好等待指標修復或使用極小倉位。觸發指標: ${exhaustion.contributors.join(', ')}.`
                    : `Price is severely overextended ${exhaustion.dir === 'up' ? 'upward' : 'downward'} (${exhaustion.score}% exhaustion score). Going ${reverseDir} now carries HIGH risk of being squeezed. Better to wait for indicators to reset or use very small size. Contributors: ${exhaustion.contributors.join(', ')}.`
            };
        }

        if (state.label.includes('Squeeze') || state.label.includes('擠壓')) {
            return {
                action: isZh ? '⏳ 觀望 — 蓄力突破中' : '⏳ WAIT — Pre-Breakout',
                color: '#eab308',
                confidence: isZh ? '待命' : 'Stand-by',
                message: isZh 
                    ? `市場正在擠壓蓄力。大行情正在醞釀但方向不明。現在請勿進場。等待擠壓動能指標 (Squeeze Momentum) 釋放訊號並跟隨突破方向進場。`
                    : `The market is in a squeeze (BB inside Keltner). A major move is building but direction is unknown. DO NOT enter now. Wait for Squeeze Momentum to fire (dot turns from gray to colored) then enter in the direction of the breakout.`
            };
        }

        if (bias === 'BULLISH') {
            return {
                action: isZh ? '✅ 偏向做多 (LONG)' : '✅ LONG Favorable',
                color: '#22c55e',
                confidence: confStr,
                message: isZh 
                    ? `${total} 個指標中有 ${buyVotes} 個看漲 (加權分數 ${longPct}%)。${state.description} 建議: 在回調至支撐位時做多。停損設於近期低點或關鍵均線下方。${exhaustion.score > 30 ? '⚠️ 注意：偵測到一定程度的超買，考慮等待小幅回調後再進場。' : ''}`
                    : `${buyVotes}/${total} indicators are bullish (${longPct}% weighted score). ${state.description} Suggested: Enter long on the next pullback to support. Stop below recent low or key MA. ${exhaustion.score > 30 ? '⚠️ Note: some overextension detected — consider waiting for a small pullback before entry.' : ''}`
            };
        }

        if (bias === 'BEARISH') {
            return {
                action: isZh ? '🔻 偏向做空 (SHORT)' : '🔻 SHORT Favorable',
                color: '#ef4444',
                confidence: shortConfStr,
                message: isZh
                    ? `${total} 個指標中有 ${sellVotes} 個看跌 (加權分數 ${shortPct}%)。${state.description} 建議: 在反彈至壓力位時做空。停損設於近期高點或關鍵均線上方。${exhaustion.score > 30 ? '⚠️ 注意：偵測到一定程度的超賣，考慮減少進場倉位。' : ''}`
                    : `${sellVotes}/${total} indicators are bearish (${shortPct}% weighted score). ${state.description} Suggested: Enter short on the next rally to resistance. Stop above recent high or key MA. ${exhaustion.score > 30 ? '⚠️ Note: some downside exhaustion — consider partial entry only.' : ''}`
            };
        }

        return {
            action: isZh ? '⚪ 中立 — 觀望' : '⚪ NEUTRAL — Wait',
            color: '#94a3b8',
            confidence: isZh ? '低' : 'Low',
            message: isZh
                ? `指標產生分歧 (${buyVotes} 買 / ${sellVotes} 賣，共 ${total} 個)。${state.description} 目前無高勝率的交易機會。最佳行動：空手觀望或減少曝險，直到訊號一致。`
                : `Indicators are split (${buyVotes} buy / ${sellVotes} sell out of ${total}). ${state.description} No high-probability trade setup right now. Best action: sit out or reduce exposure until signals align.`
        };
    }
};

window.MarketIntelligence = MarketIntelligence;
