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
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  DIY Indicators (28 unique indicators from Pine Script collection)
    // ═══════════════════════════════════════════════════════════════════════
    {
        id: 'diy_range_filter', name: 'Range Filter', type: 'diy_trend',
        description: 'Filters noise via dynamic range. Flip UP = bullish, DOWN = bearish. ~65% win rate.',
        params: { period: 50, multiplier: 3 },
        paramConfig: {
            period: { label: 'Period', min: 10, max: 100, step: 5, default: 50 },
            multiplier: { label: 'Multiplier', min: 1, max: 5, step: 0.5, default: 3 }
        }
    },
    {
        id: 'diy_ssl_channel', name: 'SSL Channel', type: 'diy_trend',
        description: 'Dynamic S/R channel. SSL Up > Down = bullish. Clean trend flips. ~60-65%.',
        params: { period: 10 },
        paramConfig: {
            period: { label: 'Period', min: 5, max: 30, step: 1, default: 10 }
        }
    },
    {
        id: 'diy_cci', name: 'CCI', type: 'diy_momentum',
        description: 'CCI > +100 = bullish breakout; < -100 = bearish. Best in trending markets.',
        params: { period: 20 },
        paramConfig: {
            period: { label: 'Period', min: 10, max: 40, step: 1, default: 20 }
        }
    },
    {
        id: 'diy_chandelier_exit', name: 'Chandelier Exit', type: 'diy_trend',
        description: 'ATR-based trailing stop. Flip = high-probability entry. ~65% trend-following.',
        params: { period: 22, multiplier: 3 },
        paramConfig: {
            period: { label: 'ATR Period', min: 10, max: 40, step: 1, default: 22 },
            multiplier: { label: 'Multiplier', min: 1, max: 5, step: 0.5, default: 3 }
        }
    },
    {
        id: 'diy_cmf', name: 'Chaikin Money Flow', type: 'diy_volume',
        description: 'Volume confirmation: CMF > +0.05 = institutional buying. ~60% standalone.',
        params: { period: 20 },
        paramConfig: {
            period: { label: 'Period', min: 10, max: 40, step: 1, default: 20 }
        }
    },
    {
        id: 'diy_roc', name: 'Rate of Change (ROC)', type: 'diy_momentum',
        description: 'Zero-line cross = momentum shift. Catches early trend starts. ~58-62%.',
        params: { period: 9 },
        paramConfig: {
            period: { label: 'Period', min: 5, max: 25, step: 1, default: 9 }
        }
    },
    {
        id: 'diy_volatility_osc', name: 'Volatility Oscillator', type: 'diy_volatility',
        description: 'Detects explosive candles after consolidation. ~62-68% on breakout candles.',
        params: { period: 100 },
        paramConfig: {
            period: { label: 'Period', min: 50, max: 200, step: 10, default: 100 }
        }
    },
    {
        id: 'diy_hull_suite', name: 'Hull Suite (HMA)', type: 'diy_trend',
        description: 'Low-lag trend MA. Rising = bullish, falling = bearish. Less whipsaw. ~63%.',
        params: { period: 9 },
        paramConfig: {
            period: { label: 'Period', min: 5, max: 30, step: 1, default: 9 }
        }
    },
    {
        id: 'diy_bull_bear_power', name: 'Bull Bear Power', type: 'diy_momentum',
        description: 'Trend score based on distance from highs/lows relative to ATR. ~60%.',
        params: { period: 50 },
        paramConfig: {
            period: { label: 'Period', min: 20, max: 100, step: 5, default: 50 }
        }
    },
    {
        id: 'diy_bxtrender', name: 'B-Xtrender', type: 'diy_momentum',
        description: 'RSI-based dual timeframe agreement. Both positive = strong buy. ~62%.',
        params: { shortPeriod: 5, longPeriod: 20 },
        paramConfig: {
            shortPeriod: { label: 'Short Period', min: 3, max: 10, step: 1, default: 5 },
            longPeriod: { label: 'Long Period', min: 10, max: 40, step: 1, default: 20 }
        }
    },
    {
        id: 'diy_wae', name: 'Waddah Attar Explosion', type: 'diy_volatility',
        description: 'MACD × BB width explosion. Avoids false signals with deadzone. ~65-70%.',
        params: { sensitivity: 150, bbPeriod: 20 },
        paramConfig: {
            sensitivity: { label: 'Sensitivity', min: 50, max: 300, step: 10, default: 150 },
            bbPeriod: { label: 'BB Period', min: 10, max: 40, step: 1, default: 20 }
        }
    },
    {
        id: 'diy_stc', name: 'Schaff Trend Cycle', type: 'diy_momentum',
        description: 'Faster than MACD, smoother than RSI. Key levels: 25 (buy) / 75 (sell). ~65%.',
        params: { fastLength: 23, slowLength: 50, cycleLength: 10 },
        paramConfig: {
            fastLength: { label: 'Fast EMA', min: 10, max: 40, step: 1, default: 23 },
            slowLength: { label: 'Slow EMA', min: 30, max: 80, step: 5, default: 50 },
            cycleLength: { label: 'Cycle', min: 5, max: 20, step: 1, default: 10 }
        }
    },
    {
        id: 'diy_vegas_tunnel', name: 'Vegas Tunnel (144/169)', type: 'diy_trend',
        description: 'Fibonacci EMA tunnel. Price above = bullish, inside = no trade. ~65-70%.',
        params: { ema12: 12, ema144: 144, ema169: 169 },
        paramConfig: {
            ema12: { label: 'Fast EMA', min: 8, max: 20, step: 1, default: 12 },
            ema144: { label: 'Tunnel EMA 1', min: 100, max: 200, step: 1, default: 144 },
            ema169: { label: 'Tunnel EMA 2', min: 130, max: 220, step: 1, default: 169 }
        }
    },
    {
        id: 'diy_psar', name: 'Parabolic SAR', type: 'diy_trend',
        description: 'Trend-following with auto trailing stop. Flip = high-probability entry. ~65%.',
        params: { start: 0.02, increment: 0.02, max: 0.2 },
        paramConfig: {
            start: { label: 'Start', min: 0.01, max: 0.05, step: 0.005, default: 0.02 },
            increment: { label: 'Increment', min: 0.01, max: 0.05, step: 0.005, default: 0.02 },
            max: { label: 'Max', min: 0.1, max: 0.4, step: 0.05, default: 0.2 }
        }
    },
    {
        id: 'diy_keltner', name: 'Keltner Channel', type: 'diy_volatility',
        description: 'ATR-based channel. Breakout above upper = buy. Used with Squeeze. ~65%.',
        params: { emaPeriod: 20, atrPeriod: 10, multiplier: 1.5 },
        paramConfig: {
            emaPeriod: { label: 'EMA Period', min: 10, max: 40, step: 1, default: 20 },
            atrPeriod: { label: 'ATR Period', min: 5, max: 20, step: 1, default: 10 },
            multiplier: { label: 'Multiplier', min: 1, max: 3, step: 0.25, default: 1.5 }
        }
    },
    {
        id: 'diy_squeeze_momentum', name: 'Squeeze Momentum', type: 'diy_volatility',
        description: '🔥 BB inside KC = squeeze coiling. Squeeze fire = explosive breakout entry. ~64%.',
        params: { bbLength: 20, bbMult: 2, kcLength: 20, kcMult: 1.5 },
        paramConfig: {
            bbLength: { label: 'BB Length', min: 10, max: 40, step: 1, default: 20 },
            bbMult: { label: 'BB Mult', min: 1, max: 3, step: 0.25, default: 2 },
            kcLength: { label: 'KC Length', min: 10, max: 40, step: 1, default: 20 },
            kcMult: { label: 'KC Mult', min: 1, max: 3, step: 0.25, default: 1.5 }
        }
    },
    {
        id: 'diy_aroon', name: 'Aroon Indicator', type: 'diy_trend',
        description: 'Measures trend freshness. Up > 70 + Down < 30 = new uptrend. ~59-61%.',
        params: { period: 25 },
        paramConfig: {
            period: { label: 'Period', min: 10, max: 50, step: 1, default: 25 }
        }
    },
    {
        id: 'diy_williams_r', name: 'Williams %R', type: 'diy_reversal',
        description: 'Fast RSI alt. %R cross -80 = buy, cross -20 = sell. ~65% on reversals.',
        params: { period: 14 },
        paramConfig: {
            period: { label: 'Period', min: 5, max: 25, step: 1, default: 14 }
        }
    },
    {
        id: 'diy_mfi', name: 'Money Flow Index (MFI)', type: 'diy_volume',
        description: 'Volume-weighted RSI. MFI < 20 = oversold buy; > 80 = overbought sell. ~62-68%.',
        params: { period: 14 },
        paramConfig: {
            period: { label: 'Period', min: 7, max: 28, step: 1, default: 14 }
        }
    },
    {
        id: 'diy_fisher', name: 'Fisher Transform', type: 'diy_reversal',
        description: 'Gaussian-normalized oscillator. Sharp spikes = reversal points. ~65%.',
        params: { period: 10 },
        paramConfig: {
            period: { label: 'Period', min: 5, max: 20, step: 1, default: 10 }
        }
    },
    {
        id: 'diy_tsi', name: 'True Strength Index (TSI)', type: 'diy_momentum',
        description: 'Double-smoothed momentum. Far less whipsaw than MACD. Signal cross = entry. ~63%.',
        params: { longPeriod: 25, shortPeriod: 13, signalPeriod: 7 },
        paramConfig: {
            longPeriod: { label: 'Long', min: 15, max: 40, step: 1, default: 25 },
            shortPeriod: { label: 'Short', min: 7, max: 20, step: 1, default: 13 },
            signalPeriod: { label: 'Signal', min: 3, max: 15, step: 1, default: 7 }
        }
    },
    {
        id: 'diy_qqe_mod', name: 'QQE Mod', type: 'diy_momentum',
        description: 'Smoothed RSI with dynamic bands. Zero cross = signal. ~62-65%.',
        params: { rsiPeriod: 6, smoothFactor: 5 },
        paramConfig: {
            rsiPeriod: { label: 'RSI Period', min: 3, max: 14, step: 1, default: 6 },
            smoothFactor: { label: 'Smooth Factor', min: 2, max: 10, step: 1, default: 5 }
        }
    },
    {
        id: 'diy_mcginley', name: 'McGinley Dynamic MA', type: 'diy_trend',
        description: 'Self-adjusting MA — faster in fast markets, slower in slow ones. ~63%.',
        params: { period: 14 },
        paramConfig: {
            period: { label: 'Period', min: 5, max: 30, step: 1, default: 14 }
        }
    },
    {
        id: 'diy_vortex', name: 'Vortex Indicator', type: 'diy_trend',
        description: 'VI+ cross above VI- = new uptrend. Catches reversals early. ~60%.',
        params: { period: 14 },
        paramConfig: {
            period: { label: 'Period', min: 7, max: 30, step: 1, default: 14 }
        }
    },
    {
        id: 'diy_elder_impulse', name: 'Elder Impulse System', type: 'diy_trend',
        description: 'EMA + MACD alignment. Green = buy, Red = sell, Gray = no trade. ~65-70%.',
        params: { emaPeriod: 13 },
        paramConfig: {
            emaPeriod: { label: 'EMA Period', min: 8, max: 21, step: 1, default: 13 }
        }
    },
    {
        id: 'diy_tema', name: 'TEMA Crossover', type: 'diy_trend',
        description: 'Triple-smoothed EMA vs SMA. Catches changes 1-2 candles early. ~62%.',
        params: { temaPeriod: 9, smaPeriod: 20 },
        paramConfig: {
            temaPeriod: { label: 'TEMA Period', min: 5, max: 20, step: 1, default: 9 },
            smaPeriod: { label: 'SMA Period', min: 10, max: 50, step: 1, default: 20 }
        }
    },
    {
        id: 'diy_lin_reg_slope', name: 'Linear Regression Slope', type: 'diy_trend',
        description: 'Quantifies trend angle. Positive + increasing = strong momentum. ~60-63%.',
        params: { period: 14 },
        paramConfig: {
            period: { label: 'Period', min: 7, max: 30, step: 1, default: 14 }
        }
    },
    {
        id: 'diy_dpo', name: 'Detrended Price Osc. (DPO)', type: 'diy_reversal',
        description: 'Removes long-term trend to isolate cycles. DPO < 0 in uptrend = buy dip. ~60%.',
        params: { period: 20 },
        paramConfig: {
            period: { label: 'Period', min: 10, max: 40, step: 1, default: 20 }
        }
    }
];

window.StrategyConfigs = StrategyConfigs;