/**
 * Trading Strategies Implementation
 * 13 technical analysis strategies for crypto selection
 * All parameters are adjustable via UI
 */

const Strategies = {
    // Strategy definitions with adjustable parameters
    definitions: [
        {
            id: 'rsi_divergence',
            name: 'RSI Divergence',
            type: 'momentum',
            description: 'RSI < oversold = buy, RSI > overbought = sell. Detects divergence patterns.',
            params: { period: 14, oversold: 30, overbought: 70 },
            paramConfig: {
                period: { label: 'Period', min: 5, max: 30, step: 1, default: 14 },
                oversold: { label: 'Oversold', min: 10, max: 40, step: 5, default: 30 },
                overbought: { label: 'Overbought', min: 60, max: 90, step: 5, default: 70 }
            }
        },
        {
            id: 'macd_crossover',
            name: 'MACD Crossover',
            type: 'trend',
            description: 'Buy when MACD crosses above signal, sell when it crosses below.',
            params: { fast: 12, slow: 26, signal: 9 },
            paramConfig: {
                fast: { label: 'Fast EMA', min: 5, max: 20, step: 1, default: 12 },
                slow: { label: 'Slow EMA', min: 15, max: 40, step: 1, default: 26 },
                signal: { label: 'Signal', min: 5, max: 15, step: 1, default: 9 }
            }
        },
        {
            id: 'bollinger_squeeze',
            name: 'Bollinger Band Squeeze',
            type: 'volatility',
            description: 'Detects low volatility squeeze before breakouts.',
            params: { period: 20, stdDev: 2 },
            paramConfig: {
                period: { label: 'Period', min: 10, max: 50, step: 5, default: 20 },
                stdDev: { label: 'Std Dev', min: 1, max: 3, step: 0.5, default: 2 }
            }
        },
        {
            id: 'ema_ribbon',
            name: 'EMA Ribbon',
            type: 'trend',
            description: 'Multiple EMAs showing trend direction. All aligned = strong trend.',
            params: { ema1: 8, ema2: 13, ema3: 21, ema4: 34, ema5: 55 },
            paramConfig: {
                ema1: { label: 'EMA 1', min: 3, max: 15, step: 1, default: 8 },
                ema2: { label: 'EMA 2', min: 10, max: 20, step: 1, default: 13 },
                ema3: { label: 'EMA 3', min: 15, max: 30, step: 1, default: 21 },
                ema4: { label: 'EMA 4', min: 25, max: 50, step: 1, default: 34 },
                ema5: { label: 'EMA 5', min: 40, max: 100, step: 5, default: 55 }
            }
        },
        {
            id: 'volume_momentum',
            name: 'Volume Weighted Momentum',
            type: 'momentum',
            description: 'Price momentum confirmed by above-average volume.',
            params: { momentumPeriod: 10, volumePeriod: 20, volumeMultiplier: 1.5 },
            paramConfig: {
                momentumPeriod: { label: 'Momentum Period', min: 5, max: 30, step: 1, default: 10 },
                volumePeriod: { label: 'Volume Period', min: 10, max: 50, step: 5, default: 20 },
                volumeMultiplier: { label: 'Volume Threshold', min: 1, max: 3, step: 0.25, default: 1.5 }
            }
        },
        {
            id: 'support_resistance',
            name: 'Support/Resistance Breakout',
            type: 'price_action',
            description: 'Trades breakouts from key support/resistance levels.',
            params: { lookback: 20, threshold: 0.5 },
            paramConfig: {
                lookback: { label: 'Lookback', min: 10, max: 100, step: 5, default: 20 },
                threshold: { label: 'Threshold %', min: 0.1, max: 2, step: 0.1, default: 0.5 }
            }
        },
        {
            id: 'mean_reversion',
            name: 'Mean Reversion',
            type: 'statistical',
            description: 'Buy when price is N std devs below mean, sell when N above.',
            params: { period: 20, deviations: 2 },
            paramConfig: {
                period: { label: 'Period', min: 10, max: 50, step: 5, default: 20 },
                deviations: { label: 'Std Deviations', min: 1, max: 3, step: 0.5, default: 2 }
            }
        },
        {
            id: 'ichimoku',
            name: 'Ichimoku Cloud',
            type: 'multi_factor',
            description: 'Price above cloud with bullish cross = buy, below = sell.',
            params: { tenkan: 9, kijun: 26, senkou: 52 },
            paramConfig: {
                tenkan: { label: 'Tenkan', min: 5, max: 15, step: 1, default: 9 },
                kijun: { label: 'Kijun', min: 15, max: 35, step: 1, default: 26 },
                senkou: { label: 'Senkou', min: 30, max: 80, step: 5, default: 52 }
            }
        },
        {
            id: 'stoch_rsi',
            name: 'Stochastic RSI',
            type: 'momentum',
            description: 'StochRSI < 20 = buy, > 80 = sell with K/D cross.',
            params: { rsiPeriod: 14, stochPeriod: 14, kSmooth: 3, dSmooth: 3 },
            paramConfig: {
                rsiPeriod: { label: 'RSI Period', min: 7, max: 21, step: 1, default: 14 },
                stochPeriod: { label: 'Stoch Period', min: 7, max: 21, step: 1, default: 14 },
                kSmooth: { label: 'K Smooth', min: 2, max: 5, step: 1, default: 3 },
                dSmooth: { label: 'D Smooth', min: 2, max: 5, step: 1, default: 3 }
            }
        },
        {
            id: 'adx_trend',
            name: 'ADX Trend Strength',
            type: 'trend',
            description: 'ADX > threshold = strong trend. Direction from +DI vs -DI.',
            params: { period: 14, threshold: 25 },
            paramConfig: {
                period: { label: 'Period', min: 7, max: 30, step: 1, default: 14 },
                threshold: { label: 'Threshold', min: 15, max: 40, step: 5, default: 25 }
            }
        },
        {
            id: 'vwap',
            name: 'VWAP Strategy',
            type: 'volume',
            description: 'Buy pullbacks to VWAP in uptrends, sell rallies in downtrends.',
            params: { deviations: 2 },
            paramConfig: {
                deviations: { label: 'Deviation %', min: 0.5, max: 3, step: 0.25, default: 2 }
            }
        },
        {
            id: 'triple_screen',
            name: 'Triple Screen',
            type: 'multi_timeframe',
            description: 'Combines 3 timeframes: weekly trend, daily momentum, 4h entry.',
            params: { trendPeriod: 20, momentumPeriod: 14 },
            paramConfig: {
                trendPeriod: { label: 'Trend Period', min: 10, max: 50, step: 5, default: 20 },
                momentumPeriod: { label: 'Momentum Period', min: 7, max: 21, step: 1, default: 14 }
            }
        },
        {
            id: 'kdj',
            name: 'KDJ Indicator',
            type: 'momentum',
            description: 'K < buyThreshold = buy, K > sellThreshold = sell.',
            params: { period: 9, kSmooth: 3, dSmooth: 3, buyThreshold: 15, sellThreshold: 70 },
            paramConfig: {
                period: { label: 'Period', min: 5, max: 21, step: 1, default: 9 },
                kSmooth: { label: 'K Smooth', min: 2, max: 5, step: 1, default: 3 },
                dSmooth: { label: 'D Smooth', min: 2, max: 5, step: 1, default: 3 },
                buyThreshold: { label: 'Buy < K', min: 5, max: 30, step: 5, default: 15 },
                sellThreshold: { label: 'Sell > K', min: 50, max: 95, step: 5, default: 70 }
            }
        },
        // ===== NEW STRATEGIES FROM EXCEL =====
        {
            id: 'connors_rsi',
            name: 'Connors RSI',
            type: 'mean_reversion',
            description: 'RSI(2) < 10 AND Close > SMA(200) = buy. Mean reversion on bull dips.',
            params: { rsiPeriod: 2, smaPeriod: 200, oversold: 10, overbought: 90 },
            paramConfig: {
                rsiPeriod: { label: 'RSI Period', min: 2, max: 5, step: 1, default: 2 },
                smaPeriod: { label: 'SMA Period', min: 100, max: 250, step: 50, default: 200 },
                oversold: { label: 'Oversold', min: 5, max: 20, step: 1, default: 10 },
                overbought: { label: 'Overbought', min: 80, max: 95, step: 1, default: 90 }
            }
        },
        {
            id: 'donchian_breakout',
            name: 'Donchian Breakout',
            type: 'trend',
            description: 'Price > highest high of N periods = buy. Strong trend initiation.',
            params: { period: 20 },
            paramConfig: {
                period: { label: 'Period', min: 10, max: 55, step: 5, default: 20 }
            }
        },
        {
            id: 'golden_cross',
            name: 'Golden Cross',
            type: 'macro_trend',
            description: 'SMA(50) crosses above SMA(200) = buy. Long-term trend indicator.',
            params: { fastPeriod: 50, slowPeriod: 200 },
            paramConfig: {
                fastPeriod: { label: 'Fast SMA', min: 20, max: 100, step: 10, default: 50 },
                slowPeriod: { label: 'Slow SMA', min: 100, max: 300, step: 50, default: 200 }
            }
        },
        {
            id: 'supertrend',
            name: 'SuperTrend',
            type: 'trend',
            description: 'Close > SuperTrend AND pullback < 1% = buy. Trend following entry.',
            params: { period: 10, multiplier: 3, pullbackPct: 1 },
            paramConfig: {
                period: { label: 'ATR Period', min: 5, max: 20, step: 1, default: 10 },
                multiplier: { label: 'Multiplier', min: 1, max: 5, step: 0.5, default: 3 },
                pullbackPct: { label: 'Pullback %', min: 0.5, max: 3, step: 0.5, default: 1 }
            }
        },
        {
            id: 'vpt_breakout',
            name: 'VPT Breakout',
            type: 'volume',
            description: 'Volume Price Trend > SMA(50) AND gain < 2% = accumulation signal.',
            params: { smaPeriod: 50, maxGain: 2 },
            paramConfig: {
                smaPeriod: { label: 'SMA Period', min: 20, max: 100, step: 10, default: 50 },
                maxGain: { label: 'Max Gain %', min: 1, max: 5, step: 0.5, default: 2 }
            }
        },
        {
            id: 'obv_divergence',
            name: 'OBV Divergence',
            type: 'volume',
            description: 'Price makes new low BUT OBV higher = bullish divergence, reversal signal.',
            params: { lookback: 20 },
            paramConfig: {
                lookback: { label: 'Lookback', min: 10, max: 50, step: 5, default: 20 }
            }
        },
        {
            id: 'funding_rate',
            name: 'Funding Rate Arbitrage',
            type: 'arbitrage',
            description: 'Funding Rate > 0.03% (8h) = collect funding in bull markets.',
            params: { minRate: 0.03, maxRate: 0.1 },
            paramConfig: {
                minRate: { label: 'Min Rate %', min: 0.01, max: 0.1, step: 0.01, default: 0.03 },
                maxRate: { label: 'Max Rate %', min: 0.05, max: 0.5, step: 0.05, default: 0.1 }
            }
        }
    ],

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

    // ========== Technical Indicator Calculations ==========

    /**
     * Simple Moving Average
     */
    sma(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                const slice = data.slice(i - period + 1, i + 1);
                result.push(slice.reduce((a, b) => a + b, 0) / period);
            }
        }
        return result;
    },

    /**
     * Exponential Moving Average
     */
    ema(data, period) {
        const result = [];
        const multiplier = 2 / (period + 1);

        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                result.push(data[0]);
            } else {
                result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
            }
        }
        return result;
    },

    /**
     * Standard Deviation
     */
    stdDev(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                const slice = data.slice(i - period + 1, i + 1);
                const mean = slice.reduce((a, b) => a + b, 0) / period;
                const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
                result.push(Math.sqrt(variance));
            }
        }
        return result;
    },

    /**
     * Relative Strength Index
     */
    rsi(closes, period = 14) {
        const gains = [];
        const losses = [];

        for (let i = 1; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        const avgGain = this.ema(gains, period);
        const avgLoss = this.ema(losses, period);

        const result = [null]; // First value has no change
        for (let i = 0; i < avgGain.length; i++) {
            if (avgLoss[i] === 0) {
                result.push(100);
            } else {
                const rs = avgGain[i] / avgLoss[i];
                result.push(100 - (100 / (1 + rs)));
            }
        }
        return result;
    },

    /**
     * MACD
     */
    macd(closes, fast = 12, slow = 26, signal = 9) {
        const emaFast = this.ema(closes, fast);
        const emaSlow = this.ema(closes, slow);

        const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
        const signalLine = this.ema(macdLine, signal);
        const histogram = macdLine.map((m, i) => m - signalLine[i]);

        return { macdLine, signalLine, histogram };
    },

    /**
     * Bollinger Bands
     */
    bollingerBands(closes, period = 20, stdDevMultiplier = 2) {
        const middle = this.sma(closes, period);
        const std = this.stdDev(closes, period);

        const upper = middle.map((m, i) => m !== null ? m + (std[i] * stdDevMultiplier) : null);
        const lower = middle.map((m, i) => m !== null ? m - (std[i] * stdDevMultiplier) : null);
        const bandwidth = middle.map((m, i) => m !== null ? (upper[i] - lower[i]) / m : null);

        return { upper, middle, lower, bandwidth };
    },

    /**
     * Average True Range
     */
    atr(klines, period = 14) {
        const trueRanges = [];

        for (let i = 0; i < klines.length; i++) {
            if (i === 0) {
                trueRanges.push(klines[i].high - klines[i].low);
            } else {
                const tr = Math.max(
                    klines[i].high - klines[i].low,
                    Math.abs(klines[i].high - klines[i - 1].close),
                    Math.abs(klines[i].low - klines[i - 1].close)
                );
                trueRanges.push(tr);
            }
        }

        return this.ema(trueRanges, period);
    },

    /**
     * ADX - Average Directional Index
     */
    adx(klines, period = 14) {
        const plusDM = [];
        const minusDM = [];

        for (let i = 1; i < klines.length; i++) {
            const upMove = klines[i].high - klines[i - 1].high;
            const downMove = klines[i - 1].low - klines[i].low;

            plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
            minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
        }

        const atr = this.atr(klines, period);
        const smoothPlusDM = this.ema(plusDM, period);
        const smoothMinusDM = this.ema(minusDM, period);

        const plusDI = [];
        const minusDI = [];
        const dx = [];

        for (let i = 0; i < smoothPlusDM.length; i++) {
            const atrVal = atr[i + 1];
            plusDI.push(atrVal ? (smoothPlusDM[i] / atrVal) * 100 : 0);
            minusDI.push(atrVal ? (smoothMinusDM[i] / atrVal) * 100 : 0);

            const diSum = plusDI[i] + minusDI[i];
            dx.push(diSum ? Math.abs(plusDI[i] - minusDI[i]) / diSum * 100 : 0);
        }

        const adxValues = this.ema(dx, period);

        return { adx: adxValues, plusDI, minusDI };
    },

    /**
     * KDJ Indicator
     */
    kdj(klines, period = 9, kSmooth = 3, dSmooth = 3) {
        const rsv = [];
        const k = [];
        const d = [];
        const j = [];

        for (let i = 0; i < klines.length; i++) {
            if (i < period - 1) {
                rsv.push(50);
                k.push(50);
                d.push(50);
                j.push(50);
            } else {
                // Get highest high and lowest low in period
                let highestHigh = -Infinity;
                let lowestLow = Infinity;

                for (let j = i - period + 1; j <= i; j++) {
                    highestHigh = Math.max(highestHigh, klines[j].high);
                    lowestLow = Math.min(lowestLow, klines[j].low);
                }

                // Calculate RSV
                const range = highestHigh - lowestLow;
                const currentRsv = range > 0 ? ((klines[i].close - lowestLow) / range) * 100 : 50;
                rsv.push(currentRsv);

                // Calculate K (smoothed RSV)
                const prevK = k.length > 0 ? k[k.length - 1] : 50;
                const currentK = (2 / 3) * prevK + (1 / 3) * currentRsv;
                k.push(currentK);

                // Calculate D (smoothed K)
                const prevD = d.length > 0 ? d[d.length - 1] : 50;
                const currentD = (2 / 3) * prevD + (1 / 3) * currentK;
                d.push(currentD);

                // Calculate J
                const currentJ = 3 * currentK - 2 * currentD;
                j.push(currentJ);
            }
        }

        return { k, d, j };
    },

    /**
     * Stochastic RSI
     */
    stochRsi(closes, rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3) {
        const rsiValues = this.rsi(closes, rsiPeriod);

        const stochRsi = [];
        for (let i = 0; i < rsiValues.length; i++) {
            if (i < stochPeriod - 1 || rsiValues[i] === null) {
                stochRsi.push(null);
            } else {
                const slice = rsiValues.slice(i - stochPeriod + 1, i + 1).filter(v => v !== null);
                const highest = Math.max(...slice);
                const lowest = Math.min(...slice);
                const range = highest - lowest;
                stochRsi.push(range > 0 ? ((rsiValues[i] - lowest) / range) * 100 : 50);
            }
        }

        const kLine = this.sma(stochRsi.filter(v => v !== null), kSmooth);
        const dLine = this.sma(kLine, dSmooth);

        return { stochRsi, k: kLine, d: dLine };
    },

    /**
     * Ichimoku Cloud
     */
    ichimoku(klines, tenkan = 9, kijun = 26, senkou = 52) {
        const tenkanSen = [];
        const kijunSen = [];
        const senkouA = [];
        const senkouB = [];

        for (let i = 0; i < klines.length; i++) {
            // Tenkan-sen
            if (i >= tenkan - 1) {
                let high = -Infinity, low = Infinity;
                for (let j = i - tenkan + 1; j <= i; j++) {
                    high = Math.max(high, klines[j].high);
                    low = Math.min(low, klines[j].low);
                }
                tenkanSen.push((high + low) / 2);
            } else {
                tenkanSen.push(null);
            }

            // Kijun-sen
            if (i >= kijun - 1) {
                let high = -Infinity, low = Infinity;
                for (let j = i - kijun + 1; j <= i; j++) {
                    high = Math.max(high, klines[j].high);
                    low = Math.min(low, klines[j].low);
                }
                kijunSen.push((high + low) / 2);
            } else {
                kijunSen.push(null);
            }

            // Senkou Span B
            if (i >= senkou - 1) {
                let high = -Infinity, low = Infinity;
                for (let j = i - senkou + 1; j <= i; j++) {
                    high = Math.max(high, klines[j].high);
                    low = Math.min(low, klines[j].low);
                }
                senkouB.push((high + low) / 2);
            } else {
                senkouB.push(null);
            }
        }

        // Senkou Span A
        for (let i = 0; i < klines.length; i++) {
            if (tenkanSen[i] !== null && kijunSen[i] !== null) {
                senkouA.push((tenkanSen[i] + kijunSen[i]) / 2);
            } else {
                senkouA.push(null);
            }
        }

        return { tenkanSen, kijunSen, senkouA, senkouB };
    },

    /**
     * VWAP - Volume Weighted Average Price
     */
    vwap(klines) {
        let cumulativeTPV = 0;
        let cumulativeVolume = 0;
        const vwapValues = [];

        for (const k of klines) {
            const typicalPrice = (k.high + k.low + k.close) / 3;
            cumulativeTPV += typicalPrice * k.volume;
            cumulativeVolume += k.volume;
            vwapValues.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice);
        }

        return vwapValues;
    },

    // ========== Strategy Analysis Functions ==========

    /**
     * Analyze RSI Divergence
     */
    analyzeRsiDivergence(klines) {
        const closes = klines.map(k => k.close);
        const rsi = this.rsi(closes, 14);
        const currentRsi = rsi[rsi.length - 1];
        const prevRsi = rsi[rsi.length - 2];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentRsi <= 30) {
            signal = 'buy';
            strength = (30 - currentRsi) / 30;
            details = `RSI at ${currentRsi.toFixed(1)} - Oversold territory`;
        } else if (currentRsi >= 70) {
            signal = 'sell';
            strength = (currentRsi - 70) / 30;
            details = `RSI at ${currentRsi.toFixed(1)} - Overbought territory`;
        } else {
            details = `RSI at ${currentRsi.toFixed(1)} - Neutral zone`;
            strength = 0;
        }

        return {
            strategyId: 'rsi_divergence',
            signal,
            strength: Math.min(strength, 1),
            value: currentRsi,
            details
        };
    },

    /**
     * Analyze MACD Crossover
     */
    analyzeMacdCrossover(klines) {
        const closes = klines.map(k => k.close);
        const { macdLine, signalLine, histogram } = this.macd(closes);

        const currentMacd = macdLine[macdLine.length - 1];
        const currentSignal = signalLine[signalLine.length - 1];
        const prevMacd = macdLine[macdLine.length - 2];
        const prevSignal = signalLine[signalLine.length - 2];
        const currentHist = histogram[histogram.length - 1];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        // Check for crossover
        const bullishCross = prevMacd <= prevSignal && currentMacd > currentSignal;
        const bearishCross = prevMacd >= prevSignal && currentMacd < currentSignal;

        if (bullishCross) {
            signal = 'buy';
            strength = 0.8;
            details = 'Bullish MACD crossover detected';
        } else if (bearishCross) {
            signal = 'sell';
            strength = 0.8;
            details = 'Bearish MACD crossover detected';
        } else if (currentMacd > currentSignal) {
            signal = 'buy';
            strength = 0.4;
            details = `MACD above signal (Histogram: ${currentHist.toFixed(4)})`;
        } else {
            signal = 'sell';
            strength = 0.4;
            details = `MACD below signal (Histogram: ${currentHist.toFixed(4)})`;
        }

        return {
            strategyId: 'macd_crossover',
            signal,
            strength,
            value: currentHist,
            details
        };
    },

    /**
     * Analyze Bollinger Band Squeeze
     */
    analyzeBollingerSqueeze(klines) {
        const closes = klines.map(k => k.close);
        const { upper, lower, bandwidth } = this.bollingerBands(closes);

        const currentClose = closes[closes.length - 1];
        const currentUpper = upper[upper.length - 1];
        const currentLower = lower[lower.length - 1];
        const currentBandwidth = bandwidth[bandwidth.length - 1];

        // Calculate average bandwidth for squeeze detection
        const recentBandwidths = bandwidth.slice(-20).filter(b => b !== null);
        const avgBandwidth = recentBandwidths.reduce((a, b) => a + b, 0) / recentBandwidths.length;

        const isSqueeze = currentBandwidth < avgBandwidth * 0.8;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentClose > currentUpper) {
            signal = 'buy'; // Breakout above
            strength = 0.7;
            details = 'Price broke above upper band - Bullish breakout';
        } else if (currentClose < currentLower) {
            signal = 'sell'; // Breakdown below
            strength = 0.7;
            details = 'Price broke below lower band - Bearish breakdown';
        } else if (isSqueeze) {
            signal = 'neutral';
            strength = 0.5;
            details = 'Bollinger Band squeeze detected - Breakout imminent';
        } else {
            details = `Price within bands (Width: ${(currentBandwidth * 100).toFixed(2)}%)`;
        }

        return {
            strategyId: 'bollinger_squeeze',
            signal,
            strength,
            value: currentBandwidth,
            details
        };
    },

    /**
     * Analyze EMA Ribbon
     */
    analyzeEmaRibbon(klines) {
        const closes = klines.map(k => k.close);
        const periods = [8, 13, 21, 34, 55];

        const emas = periods.map(p => this.ema(closes, p));
        const currentEmas = emas.map(e => e[e.length - 1]);
        const currentClose = closes[closes.length - 1];

        // Check if all EMAs are properly stacked
        let bullishStack = true;
        let bearishStack = true;

        for (let i = 0; i < currentEmas.length - 1; i++) {
            if (currentEmas[i] <= currentEmas[i + 1]) bullishStack = false;
            if (currentEmas[i] >= currentEmas[i + 1]) bearishStack = false;
        }

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (bullishStack && currentClose > currentEmas[0]) {
            signal = 'buy';
            strength = 0.9;
            details = 'Strong bullish trend - All EMAs aligned upward';
        } else if (bearishStack && currentClose < currentEmas[0]) {
            signal = 'sell';
            strength = 0.9;
            details = 'Strong bearish trend - All EMAs aligned downward';
        } else if (currentClose > currentEmas[2]) {
            signal = 'buy';
            strength = 0.5;
            details = 'Price above middle EMAs - Moderate bullish';
        } else if (currentClose < currentEmas[2]) {
            signal = 'sell';
            strength = 0.5;
            details = 'Price below middle EMAs - Moderate bearish';
        } else {
            details = 'EMAs not aligned - Choppy market';
        }

        return {
            strategyId: 'ema_ribbon',
            signal,
            strength,
            value: currentEmas[0],
            details
        };
    },

    /**
     * Analyze Volume Weighted Momentum
     */
    analyzeVolumeMomentum(klines) {
        const closes = klines.map(k => k.close);
        const volumes = klines.map(k => k.volume);

        const momentumPeriod = 10;
        const volumePeriod = 20;

        const currentClose = closes[closes.length - 1];
        const pastClose = closes[closes.length - 1 - momentumPeriod];
        const momentum = ((currentClose - pastClose) / pastClose) * 100;

        const avgVolume = this.sma(volumes, volumePeriod);
        const currentVolume = volumes[volumes.length - 1];
        const currentAvgVolume = avgVolume[avgVolume.length - 1];
        const volumeRatio = currentVolume / currentAvgVolume;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (momentum > 0 && volumeRatio > 1.5) {
            signal = 'buy';
            strength = Math.min(momentum / 10, 1) * 0.8;
            details = `Strong momentum (+${momentum.toFixed(2)}%) with ${volumeRatio.toFixed(1)}x avg volume`;
        } else if (momentum < 0 && volumeRatio > 1.5) {
            signal = 'sell';
            strength = Math.min(Math.abs(momentum) / 10, 1) * 0.8;
            details = `Strong downward momentum (${momentum.toFixed(2)}%) with ${volumeRatio.toFixed(1)}x avg volume`;
        } else if (momentum > 0) {
            signal = 'buy';
            strength = 0.4;
            details = `Positive momentum (+${momentum.toFixed(2)}%) but weak volume`;
        } else if (momentum < 0) {
            signal = 'sell';
            strength = 0.4;
            details = `Negative momentum (${momentum.toFixed(2)}%) but weak volume`;
        }

        return {
            strategyId: 'volume_momentum',
            signal,
            strength,
            value: momentum,
            details
        };
    },

    /**
     * Analyze Support/Resistance Breakout
     */
    analyzeSupportResistance(klines) {
        const lookback = 20;
        const threshold = 0.005;

        const recentKlines = klines.slice(-lookback);
        const resistance = Math.max(...recentKlines.map(k => k.high));
        const support = Math.min(...recentKlines.map(k => k.low));

        const currentClose = klines[klines.length - 1].close;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentClose > resistance * (1 + threshold)) {
            signal = 'buy';
            strength = 0.75;
            details = `Breakout above resistance at ${resistance.toFixed(4)}`;
        } else if (currentClose < support * (1 - threshold)) {
            signal = 'sell';
            strength = 0.75;
            details = `Breakdown below support at ${support.toFixed(4)}`;
        } else if (currentClose >= resistance * 0.98) {
            signal = 'neutral';
            strength = 0.3;
            details = `Testing resistance at ${resistance.toFixed(4)}`;
        } else if (currentClose <= support * 1.02) {
            signal = 'neutral';
            strength = 0.3;
            details = `Testing support at ${support.toFixed(4)}`;
        } else {
            details = `Trading between S: ${support.toFixed(4)} and R: ${resistance.toFixed(4)}`;
        }

        return {
            strategyId: 'support_resistance',
            signal,
            strength,
            value: currentClose,
            details
        };
    },

    /**
     * Analyze Mean Reversion
     */
    analyzeMeanReversion(klines) {
        const closes = klines.map(k => k.close);
        const period = 20;
        const deviations = 2;

        const smaValues = this.sma(closes, period);
        const stdValues = this.stdDev(closes, period);

        const currentClose = closes[closes.length - 1];
        const currentSma = smaValues[smaValues.length - 1];
        const currentStd = stdValues[stdValues.length - 1];

        const zScore = (currentClose - currentSma) / currentStd;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (zScore < -deviations) {
            signal = 'buy';
            strength = Math.min(Math.abs(zScore) / 3, 1);
            details = `Price ${Math.abs(zScore).toFixed(2)} std devs below mean - Expect reversion up`;
        } else if (zScore > deviations) {
            signal = 'sell';
            strength = Math.min(zScore / 3, 1);
            details = `Price ${zScore.toFixed(2)} std devs above mean - Expect reversion down`;
        } else {
            details = `Price within normal range (Z-score: ${zScore.toFixed(2)})`;
        }

        return {
            strategyId: 'mean_reversion',
            signal,
            strength,
            value: zScore,
            details
        };
    },

    /**
     * Analyze Ichimoku Cloud
     */
    analyzeIchimoku(klines) {
        const { tenkanSen, kijunSen, senkouA, senkouB } = this.ichimoku(klines);

        const currentClose = klines[klines.length - 1].close;
        const currentTenkan = tenkanSen[tenkanSen.length - 1];
        const currentKijun = kijunSen[kijunSen.length - 1];
        const currentSenkouA = senkouA[senkouA.length - 1];
        const currentSenkouB = senkouB[senkouB.length - 1];

        const cloudTop = Math.max(currentSenkouA || 0, currentSenkouB || 0);
        const cloudBottom = Math.min(currentSenkouA || 0, currentSenkouB || 0);

        const aboveCloud = currentClose > cloudTop;
        const belowCloud = currentClose < cloudBottom;
        const tkCross = currentTenkan > currentKijun;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (aboveCloud && tkCross) {
            signal = 'buy';
            strength = 0.85;
            details = 'Price above cloud with bullish TK cross';
        } else if (belowCloud && !tkCross) {
            signal = 'sell';
            strength = 0.85;
            details = 'Price below cloud with bearish TK cross';
        } else if (aboveCloud) {
            signal = 'buy';
            strength = 0.5;
            details = 'Price above cloud but TK not crossed';
        } else if (belowCloud) {
            signal = 'sell';
            strength = 0.5;
            details = 'Price below cloud but TK not crossed';
        } else {
            details = 'Price inside cloud - Wait for breakout';
        }

        return {
            strategyId: 'ichimoku',
            signal,
            strength,
            value: currentClose - cloudTop,
            details
        };
    },

    /**
     * Analyze Stochastic RSI
     */
    analyzeStochRsi(klines) {
        const closes = klines.map(k => k.close);
        const { k, d } = this.stochRsi(closes);

        const currentK = k[k.length - 1];
        const currentD = d[d.length - 1];
        const prevK = k[k.length - 2];
        const prevD = d[d.length - 2];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        const bullishCross = prevK <= prevD && currentK > currentD;
        const bearishCross = prevK >= prevD && currentK < currentD;

        if (currentK < 20 && bullishCross) {
            signal = 'buy';
            strength = 0.9;
            details = 'StochRSI oversold with bullish K/D cross';
        } else if (currentK > 80 && bearishCross) {
            signal = 'sell';
            strength = 0.9;
            details = 'StochRSI overbought with bearish K/D cross';
        } else if (currentK < 20) {
            signal = 'buy';
            strength = 0.5;
            details = `StochRSI oversold at ${currentK.toFixed(1)}`;
        } else if (currentK > 80) {
            signal = 'sell';
            strength = 0.5;
            details = `StochRSI overbought at ${currentK.toFixed(1)}`;
        } else {
            details = `StochRSI at ${currentK.toFixed(1)} - Neutral zone`;
        }

        return {
            strategyId: 'stoch_rsi',
            signal,
            strength,
            value: currentK,
            details
        };
    },

    /**
     * Analyze ADX Trend Strength
     */
    analyzeAdxTrend(klines) {
        const { adx, plusDI, minusDI } = this.adx(klines);

        const currentAdx = adx[adx.length - 1];
        const currentPlusDI = plusDI[plusDI.length - 1];
        const currentMinusDI = minusDI[minusDI.length - 1];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentAdx >= 25) {
            if (currentPlusDI > currentMinusDI) {
                signal = 'buy';
                strength = Math.min(currentAdx / 50, 1);
                details = `Strong uptrend (ADX: ${currentAdx.toFixed(1)}, +DI: ${currentPlusDI.toFixed(1)})`;
            } else {
                signal = 'sell';
                strength = Math.min(currentAdx / 50, 1);
                details = `Strong downtrend (ADX: ${currentAdx.toFixed(1)}, -DI: ${currentMinusDI.toFixed(1)})`;
            }
        } else {
            details = `Weak trend (ADX: ${currentAdx.toFixed(1)}) - Range-bound market`;
        }

        return {
            strategyId: 'adx_trend',
            signal,
            strength,
            value: currentAdx,
            details
        };
    },

    /**
     * Analyze VWAP Strategy
     */
    analyzeVwap(klines) {
        const vwapValues = this.vwap(klines);
        const closes = klines.map(k => k.close);

        const currentClose = closes[closes.length - 1];
        const currentVwap = vwapValues[vwapValues.length - 1];

        const deviation = ((currentClose - currentVwap) / currentVwap) * 100;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (deviation > 3) {
            signal = 'sell';
            strength = Math.min(deviation / 5, 1) * 0.7;
            details = `Price ${deviation.toFixed(2)}% above VWAP - Overextended`;
        } else if (deviation < -3) {
            signal = 'buy';
            strength = Math.min(Math.abs(deviation) / 5, 1) * 0.7;
            details = `Price ${Math.abs(deviation).toFixed(2)}% below VWAP - Undervalued`;
        } else if (deviation > 0) {
            signal = 'buy';
            strength = 0.3;
            details = `Price ${deviation.toFixed(2)}% above VWAP - Bullish bias`;
        } else {
            signal = 'sell';
            strength = 0.3;
            details = `Price ${Math.abs(deviation).toFixed(2)}% below VWAP - Bearish bias`;
        }

        return {
            strategyId: 'vwap',
            signal,
            strength,
            value: deviation,
            details
        };
    },

    /**
     * Analyze Triple Screen (simplified - uses current timeframe)
     */
    analyzeTripleScreen(klines) {
        // This is a simplified version - in practice would use multiple timeframes
        const closes = klines.map(k => k.close);

        // Screen 1: Trend (using EMA 50)
        const ema50 = this.ema(closes, 50);
        const trend = closes[closes.length - 1] > ema50[ema50.length - 1] ? 'up' : 'down';

        // Screen 2: Momentum (using RSI)
        const rsi = this.rsi(closes);
        const currentRsi = rsi[rsi.length - 1];

        // Screen 3: Entry (using recent price action)
        const recentCloses = closes.slice(-5);
        const recentTrend = recentCloses[4] > recentCloses[0] ? 'up' : 'down';

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (trend === 'up' && currentRsi < 50 && recentTrend === 'up') {
            signal = 'buy';
            strength = 0.75;
            details = 'Triple screen: Uptrend + oversold + bullish entry';
        } else if (trend === 'down' && currentRsi > 50 && recentTrend === 'down') {
            signal = 'sell';
            strength = 0.75;
            details = 'Triple screen: Downtrend + overbought + bearish entry';
        } else if (trend === 'up') {
            signal = 'buy';
            strength = 0.4;
            details = 'Long-term uptrend but waiting for pullback entry';
        } else {
            signal = 'sell';
            strength = 0.4;
            details = 'Long-term downtrend but waiting for rally entry';
        }

        return {
            strategyId: 'triple_screen',
            signal,
            strength,
            value: currentRsi,
            details
        };
    },

    /**
     * Analyze KDJ Indicator
     * K9 < 15 = Strong Buy
     * K9 > 70 = Sell
     */
    analyzeKdj(klines) {
        const { k, d, j } = this.kdj(klines, 9, 3, 3);

        const currentK = k[k.length - 1];
        const currentD = d[d.length - 1];
        const currentJ = j[j.length - 1];
        const prevK = k[k.length - 2];
        const prevD = d[d.length - 2];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        // Primary signals based on K9 thresholds
        if (currentK < 15) {
            signal = 'buy';
            strength = 0.95;
            details = `K9 at ${currentK.toFixed(1)} < 15 - STRONG BUY signal`;
        } else if (currentK > 70) {
            signal = 'sell';
            strength = 0.85;
            details = `K9 at ${currentK.toFixed(1)} > 70 - SELL signal`;
        } else if (currentK < 20 && prevK <= prevD && currentK > currentD) {
            signal = 'buy';
            strength = 0.8;
            details = `K9 at ${currentK.toFixed(1)} with bullish K/D cross`;
        } else if (currentK > 80 && prevK >= prevD && currentK < currentD) {
            signal = 'sell';
            strength = 0.8;
            details = `K9 at ${currentK.toFixed(1)} with bearish K/D cross`;
        } else if (currentJ > 100) {
            signal = 'sell';
            strength = 0.7;
            details = `J at ${currentJ.toFixed(1)} > 100 - Extreme overbought`;
        } else if (currentJ < 0) {
            signal = 'buy';
            strength = 0.7;
            details = `J at ${currentJ.toFixed(1)} < 0 - Extreme oversold`;
        } else {
            details = `K=${currentK.toFixed(1)}, D=${currentD.toFixed(1)}, J=${currentJ.toFixed(1)} - Neutral`;
        }

        return {
            strategyId: 'kdj',
            signal,
            strength,
            value: currentK,
            details
        };
    },

    // ========== NEW STRATEGY ANALYSIS FUNCTIONS ==========

    /**
     * Volume Price Trend (VPT) calculation
     */
    vpt(klines) {
        const vptValues = [0];
        for (let i = 1; i < klines.length; i++) {
            const priceChange = (klines[i].close - klines[i - 1].close) / klines[i - 1].close;
            vptValues.push(vptValues[i - 1] + klines[i].volume * priceChange);
        }
        return vptValues;
    },

    /**
     * On-Balance Volume (OBV) calculation
     */
    obv(klines) {
        const obvValues = [klines[0].volume];
        for (let i = 1; i < klines.length; i++) {
            if (klines[i].close > klines[i - 1].close) {
                obvValues.push(obvValues[i - 1] + klines[i].volume);
            } else if (klines[i].close < klines[i - 1].close) {
                obvValues.push(obvValues[i - 1] - klines[i].volume);
            } else {
                obvValues.push(obvValues[i - 1]);
            }
        }
        return obvValues;
    },

    /**
     * SuperTrend calculation
     */
    superTrend(klines, period = 10, multiplier = 3) {
        const atr = this.atr(klines, period);
        const supertrend = [];
        const direction = [];

        for (let i = 0; i < klines.length; i++) {
            const hl2 = (klines[i].high + klines[i].low) / 2;
            const upperBand = hl2 + (multiplier * (atr[i] || 0));
            const lowerBand = hl2 - (multiplier * (atr[i] || 0));

            if (i === 0) {
                supertrend.push(lowerBand);
                direction.push(1); // 1 = uptrend
            } else {
                if (supertrend[i - 1] === (direction[i - 1] === 1 ? lowerBand : upperBand)) {
                    // Previous was lower band (uptrend)
                    if (klines[i].close > supertrend[i - 1]) {
                        supertrend.push(Math.max(lowerBand, supertrend[i - 1]));
                        direction.push(1);
                    } else {
                        supertrend.push(upperBand);
                        direction.push(-1);
                    }
                } else {
                    // Previous was upper band (downtrend)
                    if (klines[i].close < supertrend[i - 1]) {
                        supertrend.push(Math.min(upperBand, supertrend[i - 1]));
                        direction.push(-1);
                    } else {
                        supertrend.push(lowerBand);
                        direction.push(1);
                    }
                }
            }
        }
        return { supertrend, direction };
    },

    /**
     * Analyze Connors RSI
     */
    analyzeConnorsRsi(klines) {
        const params = this.getParams('connors_rsi');
        const closes = klines.map(k => k.close);

        const rsi2 = this.rsi(closes, params.rsiPeriod || 2);
        const sma200 = this.sma(closes, params.smaPeriod || 200);

        const currentRsi = rsi2[rsi2.length - 1];
        const currentClose = closes[closes.length - 1];
        const currentSma = sma200[sma200.length - 1];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentSma && currentRsi !== null) {
            if (currentRsi < (params.oversold || 10) && currentClose > currentSma) {
                signal = 'buy';
                strength = 0.85;
                details = `RSI(2) at ${currentRsi.toFixed(1)} < 10 with price above SMA(200) - Bull dip buy`;
            } else if (currentRsi > (params.overbought || 90) && currentClose < currentSma) {
                signal = 'sell';
                strength = 0.85;
                details = `RSI(2) at ${currentRsi.toFixed(1)} > 90 with price below SMA(200) - Bear rally sell`;
            } else if (currentClose > currentSma) {
                details = `RSI(2) at ${currentRsi.toFixed(1)}, price above SMA(200) - Bullish bias`;
                strength = 0.3;
                signal = 'buy';
            } else {
                details = `RSI(2) at ${currentRsi.toFixed(1)}, price below SMA(200) - Bearish bias`;
                strength = 0.3;
                signal = 'sell';
            }
        } else {
            details = 'Insufficient data for SMA(200)';
        }

        return { strategyId: 'connors_rsi', signal, strength, value: currentRsi, details };
    },

    /**
     * Analyze Donchian Breakout
     */
    analyzeDonchianBreakout(klines) {
        const params = this.getParams('donchian_breakout');
        const period = params.period || 20;

        const lookbackKlines = klines.slice(-period - 1, -1);
        const highestHigh = Math.max(...lookbackKlines.map(k => k.high));
        const lowestLow = Math.min(...lookbackKlines.map(k => k.low));

        const currentClose = klines[klines.length - 1].close;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentClose > highestHigh) {
            signal = 'buy';
            strength = 0.8;
            details = `Price broke above ${period}-period high at ${highestHigh.toFixed(4)} - Bullish breakout`;
        } else if (currentClose < lowestLow) {
            signal = 'sell';
            strength = 0.8;
            details = `Price broke below ${period}-period low at ${lowestLow.toFixed(4)} - Bearish breakdown`;
        } else {
            const range = highestHigh - lowestLow;
            const position = (currentClose - lowestLow) / range;
            details = `Price in range (${(position * 100).toFixed(0)}% from low). High: ${highestHigh.toFixed(4)}, Low: ${lowestLow.toFixed(4)}`;
        }

        return { strategyId: 'donchian_breakout', signal, strength, value: currentClose, details };
    },

    /**
     * Analyze Golden Cross
     */
    analyzeGoldenCross(klines) {
        const params = this.getParams('golden_cross');
        const closes = klines.map(k => k.close);

        const fastSma = this.sma(closes, params.fastPeriod || 50);
        const slowSma = this.sma(closes, params.slowPeriod || 200);

        const currentFast = fastSma[fastSma.length - 1];
        const currentSlow = slowSma[slowSma.length - 1];
        const prevFast = fastSma[fastSma.length - 2];
        const prevSlow = slowSma[slowSma.length - 2];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentSlow && currentFast) {
            const goldenCross = prevFast <= prevSlow && currentFast > currentSlow;
            const deathCross = prevFast >= prevSlow && currentFast < currentSlow;

            if (goldenCross) {
                signal = 'buy';
                strength = 0.9;
                details = `Golden Cross! SMA(${params.fastPeriod || 50}) crossed above SMA(${params.slowPeriod || 200})`;
            } else if (deathCross) {
                signal = 'sell';
                strength = 0.9;
                details = `Death Cross! SMA(${params.fastPeriod || 50}) crossed below SMA(${params.slowPeriod || 200})`;
            } else if (currentFast > currentSlow) {
                signal = 'buy';
                strength = 0.5;
                details = `Bullish: SMA(${params.fastPeriod || 50}) above SMA(${params.slowPeriod || 200})`;
            } else {
                signal = 'sell';
                strength = 0.5;
                details = `Bearish: SMA(${params.fastPeriod || 50}) below SMA(${params.slowPeriod || 200})`;
            }
        } else {
            details = 'Insufficient data for SMA calculation';
        }

        return { strategyId: 'golden_cross', signal, strength, value: currentFast - currentSlow, details };
    },

    /**
     * Analyze SuperTrend
     */
    analyzeSuperTrend(klines) {
        const params = this.getParams('supertrend');
        const { supertrend, direction } = this.superTrend(klines, params.period || 10, params.multiplier || 3);

        const currentClose = klines[klines.length - 1].close;
        const currentST = supertrend[supertrend.length - 1];
        const currentDir = direction[direction.length - 1];
        const prevDir = direction[direction.length - 2];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        // Check for trend flip
        const flipBullish = prevDir === -1 && currentDir === 1;
        const flipBearish = prevDir === 1 && currentDir === -1;

        // Check pullback
        const pullbackPct = ((currentClose - currentST) / currentST) * 100;

        if (flipBullish) {
            signal = 'buy';
            strength = 0.85;
            details = 'SuperTrend flipped bullish - Trend reversal';
        } else if (flipBearish) {
            signal = 'sell';
            strength = 0.85;
            details = 'SuperTrend flipped bearish - Trend reversal';
        } else if (currentDir === 1 && pullbackPct < (params.pullbackPct || 1) && pullbackPct > 0) {
            signal = 'buy';
            strength = 0.7;
            details = `Uptrend pullback ${pullbackPct.toFixed(2)}% - Entry opportunity`;
        } else if (currentDir === 1) {
            signal = 'buy';
            strength = 0.4;
            details = 'Price above SuperTrend - Bullish trend';
        } else {
            signal = 'sell';
            strength = 0.4;
            details = 'Price below SuperTrend - Bearish trend';
        }

        return { strategyId: 'supertrend', signal, strength, value: currentST, details };
    },

    /**
     * Analyze VPT Breakout
     */
    analyzeVptBreakout(klines) {
        const params = this.getParams('vpt_breakout');
        const vptValues = this.vpt(klines);
        const vptSma = this.sma(vptValues, params.smaPeriod || 50);

        const currentVpt = vptValues[vptValues.length - 1];
        const currentVptSma = vptSma[vptSma.length - 1];

        const closes = klines.map(k => k.close);
        const currentClose = closes[closes.length - 1];
        const prevClose = closes[closes.length - 2];
        const priceGain = ((currentClose - prevClose) / prevClose) * 100;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        if (currentVptSma) {
            if (currentVpt > currentVptSma && priceGain < (params.maxGain || 2) && priceGain > 0) {
                signal = 'buy';
                strength = 0.75;
                details = `VPT above SMA with small gain (${priceGain.toFixed(2)}%) - Accumulation detected`;
            } else if (currentVpt < currentVptSma && priceGain > -(params.maxGain || 2) && priceGain < 0) {
                signal = 'sell';
                strength = 0.75;
                details = `VPT below SMA with small loss (${priceGain.toFixed(2)}%) - Distribution detected`;
            } else if (currentVpt > currentVptSma) {
                signal = 'buy';
                strength = 0.4;
                details = 'VPT above SMA - Bullish volume trend';
            } else {
                signal = 'sell';
                strength = 0.4;
                details = 'VPT below SMA - Bearish volume trend';
            }
        } else {
            details = 'Insufficient data for VPT calculation';
        }

        return { strategyId: 'vpt_breakout', signal, strength, value: currentVpt, details };
    },

    /**
     * Analyze OBV Divergence
     */
    analyzeObvDivergence(klines) {
        const params = this.getParams('obv_divergence');
        const lookback = params.lookback || 20;
        const obvValues = this.obv(klines);
        const closes = klines.map(k => k.close);

        const recentCloses = closes.slice(-lookback);
        const recentObv = obvValues.slice(-lookback);

        const currentClose = closes[closes.length - 1];
        const currentObv = obvValues[obvValues.length - 1];
        const lowestClose = Math.min(...recentCloses);
        const lowestObvAtLow = recentObv[recentCloses.indexOf(lowestClose)];

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        // Check for bullish divergence: price at/near low but OBV higher
        if (currentClose <= lowestClose * 1.02 && currentObv > lowestObvAtLow * 1.1) {
            signal = 'buy';
            strength = 0.8;
            details = 'Bullish divergence: Price at lows but OBV rising - Reversal signal';
        }
        // Check for bearish divergence: price at/near high but OBV lower
        const highestClose = Math.max(...recentCloses);
        const highestObvAtHigh = recentObv[recentCloses.indexOf(highestClose)];
        if (currentClose >= highestClose * 0.98 && currentObv < highestObvAtHigh * 0.9) {
            signal = 'sell';
            strength = 0.8;
            details = 'Bearish divergence: Price at highs but OBV falling - Reversal signal';
        }

        if (signal === 'neutral') {
            details = `OBV at ${currentObv.toFixed(0)} - No divergence detected`;
        }

        return { strategyId: 'obv_divergence', signal, strength, value: currentObv, details };
    },

    /**
     * Analyze Funding Rate (crypto-specific)
     * Note: This requires funding rate data which may not be in klines
     */
    analyzeFundingRate(klines) {
        const params = this.getParams('funding_rate');

        // Funding rate would typically come from a separate API
        // For now, we'll use volume trend as a proxy for market sentiment
        const volumes = klines.slice(-8).map(k => k.volume);
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const closes = klines.map(k => k.close);
        const priceChange = ((closes[closes.length - 1] - closes[closes.length - 8]) / closes[closes.length - 8]) * 100;

        let signal = 'neutral';
        let strength = 0;
        let details = '';

        // High volume + rising prices suggests high funding (long bias)
        if (priceChange > 2 && volumes[volumes.length - 1] > avgVolume * 1.2) {
            signal = 'sell';  // Contrarian - high funding = too many longs
            strength = 0.6;
            details = `High volume bullish move (+${priceChange.toFixed(2)}%) - Potential funding squeeze`;
        } else if (priceChange < -2 && volumes[volumes.length - 1] > avgVolume * 1.2) {
            signal = 'buy';  // Contrarian - negative funding = too many shorts
            strength = 0.6;
            details = `High volume bearish move (${priceChange.toFixed(2)}%) - Potential short squeeze`;
        } else {
            details = `8h price change: ${priceChange.toFixed(2)}% - Neutral funding environment`;
        }

        return { strategyId: 'funding_rate', signal, strength, value: priceChange, details };
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
                    result = this.analyzeRsiDivergence(klines);
                    break;
                case 'macd_crossover':
                    result = this.analyzeMacdCrossover(klines);
                    break;
                case 'bollinger_squeeze':
                    result = this.analyzeBollingerSqueeze(klines);
                    break;
                case 'ema_ribbon':
                    result = this.analyzeEmaRibbon(klines);
                    break;
                case 'volume_momentum':
                    result = this.analyzeVolumeMomentum(klines);
                    break;
                case 'support_resistance':
                    result = this.analyzeSupportResistance(klines);
                    break;
                case 'mean_reversion':
                    result = this.analyzeMeanReversion(klines);
                    break;
                case 'ichimoku':
                    result = this.analyzeIchimoku(klines);
                    break;
                case 'stoch_rsi':
                    result = this.analyzeStochRsi(klines);
                    break;
                case 'adx_trend':
                    result = this.analyzeAdxTrend(klines);
                    break;
                case 'vwap':
                    result = this.analyzeVwap(klines);
                    break;
                case 'triple_screen':
                    result = this.analyzeTripleScreen(klines);
                    break;
                case 'kdj':
                    result = this.analyzeKdj(klines);
                    break;
                // ===== NEW STRATEGIES =====
                case 'connors_rsi':
                    result = this.analyzeConnorsRsi(klines);
                    break;
                case 'donchian_breakout':
                    result = this.analyzeDonchianBreakout(klines);
                    break;
                case 'golden_cross':
                    result = this.analyzeGoldenCross(klines);
                    break;
                case 'supertrend':
                    result = this.analyzeSuperTrend(klines);
                    break;
                case 'vpt_breakout':
                    result = this.analyzeVptBreakout(klines);
                    break;
                case 'obv_divergence':
                    result = this.analyzeObvDivergence(klines);
                    break;
                case 'funding_rate':
                    result = this.analyzeFundingRate(klines);
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
    backtest(strategyId, klines) {
        if (!klines || klines.length < 50) return { error: 'Not enough data' };

        const closes = klines.map(k => k.close);
        const highs = klines.map(k => k.high);
        const lows = klines.map(k => k.low);
        let signals = []; // 1 (buy), -1 (sell), 0 (neutral)

        // Pre-calculate indicators based on strategy
        // We use a simplified signal generation loop here

        if (strategyId === 'golden_cross') {
            const sma50 = this.sma(closes, 50);
            const sma200 = this.sma(closes, 200);
            for (let i = 200; i < klines.length; i++) {
                if (sma50[i] > sma200[i] && sma50[i - 1] <= sma200[i - 1]) signals[i] = 1;
                else if (sma50[i] < sma200[i] && sma50[i - 1] >= sma200[i - 1]) signals[i] = -1;
            }
        }
        else if (strategyId === 'supertrend') {
            const { supertrend } = this.superTrend(klines);
            for (let i = 1; i < klines.length; i++) {
                if (closes[i] > supertrend[i] && closes[i - 1] <= supertrend[i - 1]) signals[i] = 1;
                else if (closes[i] < supertrend[i] && closes[i - 1] >= supertrend[i - 1]) signals[i] = -1;
            }
        }
        else if (strategyId === 'rsi_divergence') {
            const params = this.getParams('rsi_divergence');
            const rsi = this.rsi(closes, params.period || 14);
            for (let i = 14; i < klines.length; i++) {
                if (rsi[i] < 30 && rsi[i - 1] >= 30) signals[i] = 1;
                else if (rsi[i] > 70 && rsi[i - 1] <= 70) signals[i] = -1;
            }
        }
        else if (strategyId === 'macd_crossover') {
            const params = this.getParams('macd_crossover');
            const { histogram } = this.macd(closes, params.fast || 12, params.slow || 26, params.signal || 9);
            for (let i = 26; i < klines.length; i++) {
                if (histogram[i] > 0 && histogram[i - 1] <= 0) signals[i] = 1;
                else if (histogram[i] < 0 && histogram[i - 1] >= 0) signals[i] = -1;
            }
        }
        else if (strategyId === 'connors_rsi') {
            const params = this.getParams('connors_rsi');
            const rsi2 = this.rsi(closes, params.rsiPeriod || 2);
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
            const { k } = this.kdj(klines, params.period || 9, params.kSmooth || 3, params.dSmooth || 3);
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
                    const diff = (price - entryPrice) / entryPrice;
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
                    const diff = (entryPrice - price) / entryPrice;
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
    calculateOverallScore(results) {
        if (results.length === 0) return { score: 50, signal: 'neutral', recommendation: '' };

        let buyScore = 0;
        let sellScore = 0;
        let totalWeight = 0;

        for (const result of results) {
            const weight = result.strength;
            totalWeight += weight;

            if (result.signal === 'buy') {
                buyScore += weight;
            } else if (result.signal === 'sell') {
                sellScore += weight;
            }
        }

        // Normalize to 0-100 scale
        const netScore = totalWeight > 0
            ? ((buyScore - sellScore) / totalWeight) * 50 + 50
            : 50;

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

        return {
            score: Math.round(netScore),
            signal,
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
    combinedBacktest(strategyIds, klines, confirmThreshold = 2) {
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
                    const fastSMA = this.sma(closes, params.fastPeriod || 50);
                    const slowSMA = this.sma(closes, params.slowPeriod || 200);
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
                    const rsi = this.rsi(closes, params.period || 14);
                    for (let i = 14; i < klines.length; i++) {
                        if (rsi[i] < 30 && rsi[i - 1] >= 30) signals[i] = 1;
                        else if (rsi[i] > 70 && rsi[i - 1] <= 70) signals[i] = -1;
                    }
                }
                else if (strategyId === 'macd_crossover') {
                    const params = this.getParams('macd_crossover');
                    const { histogram } = this.macd(closes, params.fast || 12, params.slow || 26, params.signal || 9);
                    for (let i = 26; i < klines.length; i++) {
                        if (histogram[i] > 0 && histogram[i - 1] <= 0) signals[i] = 1;
                        else if (histogram[i] < 0 && histogram[i - 1] >= 0) signals[i] = -1;
                    }
                }
                else if (strategyId === 'kdj') {
                    const params = this.getParams('kdj');
                    const { k } = this.kdj(klines, params.period || 9, params.kSmooth || 3, params.dSmooth || 3);
                    for (let i = 10; i < klines.length; i++) {
                        if (k[i] < (params.buyThreshold || 15) && k[i - 1] >= (params.buyThreshold || 15)) signals[i] = 1;
                        else if (k[i] > (params.sellThreshold || 70) && k[i - 1] <= (params.sellThreshold || 70)) signals[i] = -1;
                    }
                }
                else if (strategyId === 'bollinger_squeeze') {
                    const params = this.getParams('bollinger_squeeze');
                    const { upper, lower, middle } = this.bollingerBands(closes, params.period || 20, params.stdDev || 2);
                    for (let i = 20; i < klines.length; i++) {
                        if (closes[i] > upper[i]) signals[i] = 1;
                        else if (closes[i] < lower[i]) signals[i] = -1;
                    }
                }
                else if (strategyId === 'ema_ribbon') {
                    const ema8 = this.ema(closes, 8);
                    const ema55 = this.ema(closes, 55);
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
                    const diff = (price - entryPrice) / entryPrice;
                    pnl += diff;
                    totalTrades++;
                    if (diff > 0) wins++;
                    position = -1;
                    entryPrice = price;
                    trades.push({ type: 'close_long_open_short', price, time: klines[i].time, pnl: diff });
                }
            } else if (position === -1) {
                if (signal === 1) {
                    const diff = (entryPrice - price) / entryPrice;
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
