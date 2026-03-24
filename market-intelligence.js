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
        all.forEach(r => {
            const w = (r.strength || 0.5);
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

        const level = avg >= 0.75 ? '🔥 Severely Overextended'
            : avg >= 0.5  ? '⚠️ Overextended'
            : avg >= 0.3  ? '🟡 Slightly Stretched'
            : 'Normal';

        return { score: Math.round(avg * 100), level, dir: dominantDir, contributors: scores.map(s => s.label) };
    },

    _classifyMarket(allResults, exhaustion, longPct) {
        const ema = allResults.find(r => r.id === 'ema_ribbon');
        const adx = allResults.find(r => r.id === 'adx_trend');
        const squeeze = allResults.find(r => r.id === 'squeeze_momentum');
        const isTrending  = adx && adx.value > 25;
        const isSqueezed  = squeeze && squeeze.details.includes('IN SQUEEZE');
        const isExhausted = exhaustion.score >= 60;

        if (isExhausted && isTrending) return { label: '🔥 Trend Exhaustion', color: '#f97316',
            description: 'Strong trend but indicators show overextension. Reversal risk is HIGH. Avoid chasing.' };
        if (isExhausted) return { label: '⚠️ Overextended', color: '#ef4444',
            description: 'Price has moved too far too fast. High chance of pullback or consolidation soon.' };
        if (isSqueezed)  return { label: '🟡 Pre-Breakout Squeeze', color: '#eab308',
            description: 'Market is coiling — BB inside Keltner. An explosive move is building. Do NOT trade yet, wait for the pivot.' };
        if (isTrending && longPct >= 60) return { label: '🟢 Strong Uptrend', color: '#22c55e',
            description: 'Indicators strongly aligned bullish. Trend-following longs are favored. Manage risk with trailing stops.' };
        if (isTrending && longPct < 40)  return { label: '🔴 Strong Downtrend', color: '#ef4444',
            description: 'Indicators strongly aligned bearish. Trend-following shorts are favored.' };
        if (longPct >= 55) return { label: '📈 Moderate Bullish', color: '#86efac',
            description: 'Majority of indicators are bullish but trend strength is moderate. Proceed with manageable position size.' };
        if (longPct <= 45) return { label: '📉 Moderate Bearish', color: '#fca5a5',
            description: 'Majority of indicators are bearish. Short positions may have an edge.' };
        return { label: '⚪ Ranging / Neutral', color: '#94a3b8',
            description: 'Indicators are conflicting. Market is likely ranging or transitioning. Best to wait for clearer signals.' };
    },

    _buildRecommendation(bias, state, exhaustion, longPct, shortPct, buyVotes, sellVotes, total) {
        const confString = (pct) => pct >= 75 ? 'Very High' : pct >= 60 ? 'High' : pct >= 50 ? 'Moderate' : 'Low';

        if (exhaustion.score >= 75) {
            const reverseDir = exhaustion.dir === 'up' ? 'SHORT / Sell' : 'LONG / Buy';
            return {
                action: '⚠️ WAIT / Fade with caution',
                color: '#f97316',
                confidence: 'Cautious',
                message: `Price is severely overextended ${exhaustion.dir === 'up' ? 'upward' : 'downward'} (${exhaustion.score}% exhaustion score). Going ${reverseDir} now carries HIGH risk of being squeezed. Better to wait for indicators to reset or use very small size. Contributors: ${exhaustion.contributors.join(', ')}.`
            };
        }

        if (state.label.includes('Squeeze')) {
            return {
                action: '⏳ WAIT — Pre-Breakout',
                color: '#eab308',
                confidence: 'Stand-by',
                message: `The market is in a squeeze (BB inside Keltner). A major move is building but direction is unknown. DO NOT enter now. Wait for Squeeze Momentum to fire (dot turns from gray to colored) then enter in the direction of the breakout.`
            };
        }

        if (bias === 'BULLISH') {
            return {
                action: '✅ LONG Favorable',
                color: '#22c55e',
                confidence: confString(longPct),
                message: `${buyVotes}/${total} indicators are bullish (${longPct}% weighted score). ${state.description} Suggested: Enter long on the next pullback to support. Stop below recent low or key MA. ${exhaustion.score > 30 ? '⚠️ Note: some overextension detected — consider waiting for a small pullback before entry.' : ''}`
            };
        }

        if (bias === 'BEARISH') {
            return {
                action: '🔻 SHORT Favorable',
                color: '#ef4444',
                confidence: confString(shortPct),
                message: `${sellVotes}/${total} indicators are bearish (${shortPct}% weighted score). ${state.description} Suggested: Enter short on the next rally to resistance. Stop above recent high or key MA. ${exhaustion.score > 30 ? '⚠️ Note: some downside exhaustion — consider partial entry only.' : ''}`
            };
        }

        return {
            action: '⚪ NEUTRAL — Wait',
            color: '#94a3b8',
            confidence: 'Low',
            message: `Indicators are split (${buyVotes} buy / ${sellVotes} sell out of ${total}). ${state.description} No high-probability trade setup right now. Best action: sit out or reduce exposure until signals align.`
        };
    }
};

window.MarketIntelligence = MarketIntelligence;
