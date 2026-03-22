/**
 * Strategy Configurations & Metadata Registry
 */
const StrategyConfigs = [
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
];

window.StrategyConfigs = StrategyConfigs;