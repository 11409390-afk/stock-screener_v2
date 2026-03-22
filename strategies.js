/**
 * Trading Strategies Implementation
 * 13 technical analysis strategies for crypto selection
 * All parameters are adjustable via UI
 */

const Strategies = {
    // Load definitions from strategy-configs.js
    definitions: window.StrategyConfigs || [],

    // User-customized parameters (loaded from localStorage)
    customParams: {},

    // Get parameters for a strategy (custom or default)
    getParams(strategyId) {
        return this.customParams[strategyId] ||
            this.definitions.find(s => s.id === strategyId)?.params || {};
    },

    // Set custom parameters for a strategy
    setParams(strategyId, params) {
        this.customParams[strategyId] = { ...this.getParams(strategyId), ...params };
        this.saveToStorage();
    },

    // Reset strategy parameters to defaults
    resetParams(strategyId) {
        delete this.customParams[strategyId];
        this.saveToStorage();
    },

    // Save custom params to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('cryptoSelector_strategyParams', JSON.stringify(this.customParams));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    },

    // Load custom params from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('cryptoSelector_strategyParams');
            if (saved) {
                this.customParams = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
    },

    /**
     * Run all selected strategies on kline data
     */
    analyzeAll(klines, selectedStrategies = null) {
        const results = [];
        const strategies = selectedStrategies || this.definitions.map(d => d.id);

        for (const strategyId of strategies) {
            let result;

            switch (strategyId) {
                case 'rsi_divergence':
                    result = window.StrategyAnalyzers.analyzeRsiDivergence(klines);
                    break;
                case 'macd_crossover':
                    result = window.StrategyAnalyzers.analyzeMacdCrossover(klines);
                    break;
                case 'bollinger_squeeze':
                    result = window.StrategyAnalyzers.analyzeBollingerSqueeze(klines);
                    break;
                case 'ema_ribbon':
                    result = window.StrategyAnalyzers.analyzeEmaRibbon(klines);
                    break;
                case 'volume_momentum':
                    result = window.StrategyAnalyzers.analyzeVolumeMomentum(klines);
                    break;
                case 'support_resistance':
                    result = window.StrategyAnalyzers.analyzeSupportResistance(klines);
                    break;
                case 'mean_reversion':
                    result = window.StrategyAnalyzers.analyzeMeanReversion(klines);
                    break;
                case 'ichimoku':
                    result = window.StrategyAnalyzers.analyzeIchimoku(klines);
                    break;
                case 'stoch_rsi':
                    result = window.StrategyAnalyzers.analyzeStochRsi(klines);
                    break;
                case 'adx_trend':
                    result = window.StrategyAnalyzers.analyzeAdxTrend(klines);
                    break;
                case 'vwap':
                    result = window.StrategyAnalyzers.analyzeVwap(klines);
                    break;
                case 'triple_screen':
                    result = window.StrategyAnalyzers.analyzeTripleScreen(klines);
                    break;
                case 'kdj':
                    result = window.StrategyAnalyzers.analyzeKdj(klines);
                    break;
                case 'connors_rsi':
                    result = window.StrategyAnalyzers.analyzeConnorsRsi(klines);
                    break;
                case 'donchian_breakout':
                    result = window.StrategyAnalyzers.analyzeDonchianBreakout(klines);
                    break;
                case 'golden_cross':
                    result = window.StrategyAnalyzers.analyzeGoldenCross(klines);
                    break;
                case 'supertrend':
                    result = window.StrategyAnalyzers.analyzeSuperTrend(klines);
                    break;
                case 'vpt_breakout':
                    result = window.StrategyAnalyzers.analyzeVptBreakout(klines);
                    break;
                case 'obv_divergence':
                    result = window.StrategyAnalyzers.analyzeObvDivergence(klines);
                    break;
                case 'funding_rate':
                    result = window.StrategyAnalyzers.analyzeFundingRate(klines);
                    break;
            }

            if (result) {
                results.push(result);
            }
        }

        return results;
    },

    /**
     * Backtest a strategy on historical data
     * @param {string} strategyId 
     * @param {Array} klines 
     * @returns {Object} Backtest results { winRate, totalTrades, pnl, trades }
     */
    backtest(strategyId, klines, feeRate = 0.001) {
        if (!klines || klines.length < 50) return { error: 'Not enough data' };

        const closes = klines.map(k => k.close);
        const highs = klines.map(k => k.high);
        const lows = klines.map(k => k.low);
        let signals = []; // 1 (buy), -1 (sell), 0 (neutral)

        // Pre-calculate indicators based on strategy
        // We use a simplified signal generation loop here

        if (strategyId === 'golden_cross') {
            const sma50 = window.Indicators.sma(closes, 50);
            const sma200 = window.Indicators.sma(closes, 200);
            for (let i = 200; i < klines.length; i++) {
                if (sma50[i] > sma200[i] && sma50[i - 1] <= sma200[i - 1]) signals[i] = 1;
                else if (sma50[i] < sma200[i] && sma50[i - 1] >= sma200[i - 1]) signals[i] = -1;
            }
        }
        else if (strategyId === 'supertrend') {
            const { supertrend } = window.Indicators.superTrend(klines);
            for (let i = 1; i < klines.length; i++) {
                if (closes[i] > supertrend[i] && closes[i - 1] <= supertrend[i - 1]) signals[i] = 1;
                else if (closes[i] < supertrend[i] && closes[i - 1] >= supertrend[i - 1]) signals[i] = -1;
            }
        }
        else if (strategyId === 'rsi_divergence') {
            const params = this.getParams('rsi_divergence');
            const rsi = window.Indicators.rsi(closes, params.period || 14);
            for (let i = 14; i < klines.length; i++) {
                if (rsi[i] < 30 && rsi[i - 1] >= 30) signals[i] = 1;
                else if (rsi[i] > 70 && rsi[i - 1] <= 70) signals[i] = -1;
            }
        }
        else if (strategyId === 'macd_crossover') {
            const params = this.getParams('macd_crossover');
            const { histogram } = window.Indicators.macd(closes, params.fast || 12, params.slow || 26, params.signal || 9);
            for (let i = 26; i < klines.length; i++) {
                if (histogram[i] > 0 && histogram[i - 1] <= 0) signals[i] = 1;
                else if (histogram[i] < 0 && histogram[i - 1] >= 0) signals[i] = -1;
            }
        }
        else if (strategyId === 'connors_rsi') {
            const params = this.getParams('connors_rsi');
            const rsi2 = window.Indicators.rsi(closes, params.rsiPeriod || 2);
            for (let i = 200; i < klines.length; i++) {
                if (rsi2[i] < 10) signals[i] = 1;
                else if (rsi2[i] > 90) signals[i] = -1;
            }
        }
        else if (strategyId === 'donchian_breakout') {
            const params = this.getParams('donchian_breakout');
            const period = params.period || 20;
            // Naive Donchian implementation inside loop
            for (let i = period; i < klines.length; i++) {
                // High of last N periods (excluding current)
                let highest = -Infinity;
                let lowest = Infinity;
                for (let j = 1; j <= period; j++) {
                    if (highs[i - j] > highest) highest = highs[i - j];
                    if (lows[i - j] < lowest) lowest = lows[i - j];
                }
                if (closes[i] > highest) signals[i] = 1;
                else if (closes[i] < lowest) signals[i] = -1;
            }
        }
        else if (strategyId === 'kdj') {
            const params = this.getParams('kdj');
            const { k } = window.Indicators.kdj(klines, params.period || 9, params.kSmooth || 3, params.dSmooth || 3);
            for (let i = 10; i < klines.length; i++) {
                if (k[i] < (params.buyThreshold || 15) && k[i - 1] >= (params.buyThreshold || 15)) signals[i] = 1;
                else if (k[i] > (params.sellThreshold || 70) && k[i - 1] <= (params.sellThreshold || 70)) signals[i] = -1;
            }
        }
        else {
            // Default generic fallback? 
            // Return empty for unsupported strategies
            return { error: 'Strategy not supported for backtest' };
        }

        // Simulate Trades
        let position = 0; // 0: flat, 1: long, -1: short
        let entryPrice = 0;
        let totalTrades = 0;
        let wins = 0;
        let pnl = 0;
        let trades = [];

        // Simple loop
        for (let i = 0; i < klines.length; i++) {
            const price = closes[i];
            const signal = signals[i];

            if (position === 0) {
                if (signal === 1) {
                    position = 1;
                    entryPrice = price;
                    trades.push({ type: 'buy', price, time: klines[i].time });
                } else if (signal === -1) {
                    // Assuming Long-Only for simplicity right now unless shorting is requested?
                    // Let's do Long/Short
                    position = -1;
                    entryPrice = price;
                    trades.push({ type: 'sell', price, time: klines[i].time });
                }
            } else if (position === 1) {
                if (signal === -1) {
                    // Close Long
                    const diff = ((price - entryPrice) / entryPrice) - (feeRate * 2);
                    pnl += diff;
                    totalTrades++;
                    if (diff > 0) wins++;
                    position = -1; // Flip to short
                    entryPrice = price;
                    trades.push({ type: 'close_long_open_short', price, time: klines[i].time, pnl: diff });
                }
            } else if (position === -1) {
                if (signal === 1) {
                    // Close Short
                    const diff = ((entryPrice - price) / entryPrice) - (feeRate * 2);
                    pnl += diff;
                    totalTrades++;
                    if (diff > 0) wins++;
                    position = 1; // Flip to long
                    entryPrice = price;
                    trades.push({ type: 'close_short_open_long', price, time: klines[i].time, pnl: diff });
                }
            }
        }

        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        return {
            winRate: winRate.toFixed(1),
            totalTrades,
            pnl: (pnl * 100).toFixed(2) + '%',
            trades
        };
    },

    /**
     * Calculate overall score from strategy results
     */
    calculateOverallScore(results, useResonance = true) {
        if (results.length === 0) return { score: 50, signal: 'neutral', recommendation: '' };

        let buyScore = 0;
        let sellScore = 0;
        let totalWeight = 0;
        
        // Track category convergence
        const categorySignals = { buy: new Map(), sell: new Map() };

        for (const result of results) {
            const weight = result.strength;
            totalWeight += weight;

            // Find the strategy definition to get its category (type)
            const strategyDef = this.definitions.find(d => d.id === result.strategyId);
            const category = strategyDef ? strategyDef.type : 'other';
            const name = strategyDef ? strategyDef.name : result.strategyId;

            if (result.signal === 'buy') {
                buyScore += weight;
                if (!categorySignals.buy.has(category)) categorySignals.buy.set(category, []);
                categorySignals.buy.get(category).push(name);
            } else if (result.signal === 'sell') {
                sellScore += weight;
                if (!categorySignals.sell.has(category)) categorySignals.sell.set(category, []);
                categorySignals.sell.get(category).push(name);
            }
        }
        
        // Calculate Resonance Effect based on category agreement
        let resonanceLevel = 'None';
        let resonanceBoost = 0;
        let resonatingIndicators = [];
        
        if (useResonance) {
            if (categorySignals.buy.size >= 3 && buyScore > sellScore) {
                resonanceLevel = 'Strong Bullish Resonance';
                resonanceBoost = 10;
                resonatingIndicators = Array.from(categorySignals.buy.values()).flat();
            } else if (categorySignals.sell.size >= 3 && sellScore > buyScore) {
                resonanceLevel = 'Strong Bearish Resonance';
                resonanceBoost = -10;
                resonatingIndicators = Array.from(categorySignals.sell.values()).flat();
            } else if (categorySignals.buy.size === 2 && buyScore > sellScore) {
                resonanceLevel = 'Moderate Bullish Resonance';
                resonanceBoost = 5;
                resonatingIndicators = Array.from(categorySignals.buy.values()).flat();
            } else if (categorySignals.sell.size === 2 && sellScore > buyScore) {
                resonanceLevel = 'Moderate Bearish Resonance';
                resonanceBoost = -5;
                resonatingIndicators = Array.from(categorySignals.sell.values()).flat();
            }
        }

        // Normalize to 0-100 scale
        let netScore = totalWeight > 0 ? ((buyScore - sellScore) / totalWeight) * 50 + 50 : 50;
        netScore = Math.max(0, Math.min(100, netScore + resonanceBoost)); // Apply boost and clamp 0-100

        let signal = 'neutral';
        let recommendation = '';

        if (netScore >= 70) {
            signal = 'buy';
            recommendation = 'Strong buy signals detected. Multiple strategies align bullish.';
        } else if (netScore >= 55) {
            signal = 'buy';
            recommendation = 'Moderate buy signals. Consider entering with proper risk management.';
        } else if (netScore <= 30) {
            signal = 'sell';
            recommendation = 'Strong sell signals detected. Consider reducing exposure or shorting.';
        } else if (netScore <= 45) {
            signal = 'sell';
            recommendation = 'Moderate sell signals. Caution advised for long positions.';
        } else {
            signal = 'neutral';
            recommendation = 'Mixed signals. Wait for clearer confirmation before trading.';
        }
        
        // Append Resonance context to recommendation
        if (resonanceLevel.includes('Strong')) {
            recommendation += ' 🌟 HIGH CONVERGENCE: Multiple indicator types agree. High probability setup.';
        }

        return {
            score: Math.round(netScore),
            signal,
            resonanceLevel,
            resonatingIndicators,
            recommendation,
            buyCount: results.filter(r => r.signal === 'buy').length,
            sellCount: results.filter(r => r.signal === 'sell').length,
            neutralCount: results.filter(r => r.signal === 'neutral').length
        };
    },

    /**
     * Combined Backtest - Runs multiple strategies and trades only when N strategies agree
     * @param {Array} strategyIds - List of strategy IDs to combine
     * @param {Array} klines - OHLCV data
     * @param {Number} confirmThreshold - Minimum strategies required to agree (default 2)
     */
    combinedBacktest(strategyIds, klines, confirmThreshold = 2, feeRate = 0.001) {
        if (!klines || klines.length < 50) {
            return { error: 'Not enough data for combined backtest' };
        }

        const closes = klines.map(k => k.close);
        const highs = klines.map(k => k.high);
        const lows = klines.map(k => k.low);

        // Collect signals from all strategies
        const allSignals = {}; // { strategyId: [0, 1, -1, ...] }

        strategyIds.forEach(strategyId => {
            const signals = new Array(klines.length).fill(0);

            try {
                if (strategyId === 'golden_cross') {
                    const params = this.getParams('golden_cross');
                    const fastSMA = window.Indicators.sma(closes, params.fastPeriod || 50);
                    const slowSMA = window.Indicators.sma(closes, params.slowPeriod || 200);
                    for (let i = 200; i < klines.length; i++) {
                        if (fastSMA[i] > slowSMA[i] && fastSMA[i - 1] <= slowSMA[i - 1]) signals[i] = 1;
                        else if (fastSMA[i] < slowSMA[i] && fastSMA[i - 1] >= slowSMA[i - 1]) signals[i] = -1;
                    }
                }
                else if (strategyId === 'supertrend') {
                    // Simplified: use ATR-based trend
                    const atr = this.atr(klines, 10);
                    for (let i = 20; i < klines.length; i++) {
                        const band = atr[i] * 3;
                        if (closes[i] > closes[i - 1] + band * 0.5) signals[i] = 1;
                        else if (closes[i] < closes[i - 1] - band * 0.5) signals[i] = -1;
                    }
                }
                else if (strategyId === 'rsi_divergence') {
                    const params = this.getParams('rsi_divergence');
                    const rsi = window.Indicators.rsi(closes, params.period || 14);
                    for (let i = 14; i < klines.length; i++) {
                        if (rsi[i] < 30 && rsi[i - 1] >= 30) signals[i] = 1;
                        else if (rsi[i] > 70 && rsi[i - 1] <= 70) signals[i] = -1;
                    }
                }
                else if (strategyId === 'macd_crossover') {
                    const params = this.getParams('macd_crossover');
                    const { histogram } = window.Indicators.macd(closes, params.fast || 12, params.slow || 26, params.signal || 9);
                    for (let i = 26; i < klines.length; i++) {
                        if (histogram[i] > 0 && histogram[i - 1] <= 0) signals[i] = 1;
                        else if (histogram[i] < 0 && histogram[i - 1] >= 0) signals[i] = -1;
                    }
                }
                else if (strategyId === 'kdj') {
                    const params = this.getParams('kdj');
                    const { k } = window.Indicators.kdj(klines, params.period || 9, params.kSmooth || 3, params.dSmooth || 3);
                    for (let i = 10; i < klines.length; i++) {
                        if (k[i] < (params.buyThreshold || 15) && k[i - 1] >= (params.buyThreshold || 15)) signals[i] = 1;
                        else if (k[i] > (params.sellThreshold || 70) && k[i - 1] <= (params.sellThreshold || 70)) signals[i] = -1;
                    }
                }
                else if (strategyId === 'bollinger_squeeze') {
                    const params = this.getParams('bollinger_squeeze');
                    const { upper, lower, middle } = window.Indicators.bollingerBands(closes, params.period || 20, params.stdDev || 2);
                    for (let i = 20; i < klines.length; i++) {
                        if (closes[i] > upper[i]) signals[i] = 1;
                        else if (closes[i] < lower[i]) signals[i] = -1;
                    }
                }
                else if (strategyId === 'ema_ribbon') {
                    const ema8 = window.Indicators.ema(closes, 8);
                    const ema55 = window.Indicators.ema(closes, 55);
                    for (let i = 55; i < klines.length; i++) {
                        if (ema8[i] > ema55[i] && ema8[i - 1] <= ema55[i - 1]) signals[i] = 1;
                        else if (ema8[i] < ema55[i] && ema8[i - 1] >= ema55[i - 1]) signals[i] = -1;
                    }
                }
                // Add more strategies as needed...
            } catch (e) {
                console.warn(`combinedBacktest: Strategy ${strategyId} failed:`, e);
            }

            allSignals[strategyId] = signals;
        });

        // Combine signals: count votes per candle
        const combinedSignals = new Array(klines.length).fill(0);

        for (let i = 0; i < klines.length; i++) {
            let buyVotes = 0;
            let sellVotes = 0;

            strategyIds.forEach(sid => {
                const sig = allSignals[sid]?.[i] || 0;
                if (sig === 1) buyVotes++;
                else if (sig === -1) sellVotes++;
            });

            // Trade only when threshold is met
            if (buyVotes >= confirmThreshold) combinedSignals[i] = 1;
            else if (sellVotes >= confirmThreshold) combinedSignals[i] = -1;
        }

        // Simulate trades using combined signals
        let position = 0;
        let entryPrice = 0;
        let totalTrades = 0;
        let wins = 0;
        let pnl = 0;
        let trades = [];

        for (let i = 0; i < klines.length; i++) {
            const price = closes[i];
            const signal = combinedSignals[i];

            if (position === 0) {
                if (signal === 1) {
                    position = 1;
                    entryPrice = price;
                    trades.push({ type: 'buy', price, time: klines[i].time });
                } else if (signal === -1) {
                    position = -1;
                    entryPrice = price;
                    trades.push({ type: 'sell', price, time: klines[i].time });
                }
            } else if (position === 1) {
                if (signal === -1) {
                    const diff = ((price - entryPrice) / entryPrice) - (feeRate * 2);
                    pnl += diff;
                    totalTrades++;
                    if (diff > 0) wins++;
                    position = -1;
                    entryPrice = price;
                    trades.push({ type: 'close_long_open_short', price, time: klines[i].time, pnl: diff });
                }
            } else if (position === -1) {
                if (signal === 1) {
                    const diff = ((entryPrice - price) / entryPrice) - (feeRate * 2);
                    pnl += diff;
                    totalTrades++;
                    if (diff > 0) wins++;
                    position = 1;
                    entryPrice = price;
                    trades.push({ type: 'close_short_open_long', price, time: klines[i].time, pnl: diff });
                }
            }
        }

        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        return {
            winRate: winRate.toFixed(1),
            totalTrades,
            pnl: (pnl * 100).toFixed(2) + '%',
            trades,
            strategiesUsed: strategyIds.length,
            confirmThreshold
        };
    }
};

// Make available globally
window.Strategies = Strategies;
