/**
 * Strategy Analyzers - Signal Generation Logic
 * Evaluates mathematical indicators to produce Buy/Sell/Neutral signals
 */

const StrategyAnalyzers = {
    analyzeRsiDivergence(klines) {
        const closes = klines.map(k => k.close);
        const rsi = window.Indicators.rsi(closes, 14);
        const currentRsi = rsi[rsi.length - 1];

        let signal = 'neutral', strength = 0, details = '';

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
        }

        return { strategyId: 'rsi_divergence', signal, strength: Math.min(strength, 1), value: currentRsi, details };
    },

    analyzeMacdCrossover(klines) {
        const closes = klines.map(k => k.close);
        const { macdLine, signalLine, histogram } = window.Indicators.macd(closes);

        const currentMacd = macdLine[macdLine.length - 1];
        const currentSignal = signalLine[signalLine.length - 1];
        const prevMacd = macdLine[macdLine.length - 2];
        const prevSignal = signalLine[signalLine.length - 2];
        const currentHist = histogram[histogram.length - 1];

        let signal = 'neutral', strength = 0, details = '';

        const bullishCross = prevMacd <= prevSignal && currentMacd > currentSignal;
        const bearishCross = prevMacd >= prevSignal && currentMacd < currentSignal;

        if (bullishCross) {
            signal = 'buy'; strength = 0.8; details = 'Bullish MACD crossover detected';
        } else if (bearishCross) {
            signal = 'sell'; strength = 0.8; details = 'Bearish MACD crossover detected';
        } else if (currentMacd > currentSignal) {
            signal = 'buy'; strength = 0.4; details = `MACD above signal (Histogram: ${currentHist.toFixed(4)})`;
        } else {
            signal = 'sell'; strength = 0.4; details = `MACD below signal (Histogram: ${currentHist.toFixed(4)})`;
        }

        return { strategyId: 'macd_crossover', signal, strength, value: currentHist, details };
    },

    analyzeBollingerSqueeze(klines) {
        const closes = klines.map(k => k.close);
        const { upper, lower, bandwidth } = window.Indicators.bollingerBands(closes);

        const currentClose = closes[closes.length - 1];
        const currentUpper = upper[upper.length - 1];
        const currentLower = lower[lower.length - 1];
        const currentBandwidth = bandwidth[bandwidth.length - 1];

        const recentBandwidths = bandwidth.slice(-20).filter(b => b !== null);
        const avgBandwidth = recentBandwidths.reduce((a, b) => a + b, 0) / recentBandwidths.length;
        const isSqueeze = currentBandwidth < avgBandwidth * 0.8;

        let signal = 'neutral', strength = 0, details = '';

        if (currentClose > currentUpper) {
            signal = 'buy'; strength = 0.7; details = 'Price broke above upper band - Bullish breakout';
        } else if (currentClose < currentLower) {
            signal = 'sell'; strength = 0.7; details = 'Price broke below lower band - Bearish breakdown';
        } else if (isSqueeze) {
            signal = 'neutral'; strength = 0.5; details = 'Bollinger Band squeeze detected - Breakout imminent';
        } else {
            details = `Price within bands (Width: ${(currentBandwidth * 100).toFixed(2)}%)`;
        }

        return { strategyId: 'bollinger_squeeze', signal, strength, value: currentBandwidth, details };
    },

    analyzeEmaRibbon(klines) {
        const closes = klines.map(k => k.close);
        const periods = [8, 13, 21, 34, 55];
        const emas = periods.map(p => window.Indicators.ema(closes, p));
        const currentEmas = emas.map(e => e[e.length - 1]);
        const currentClose = closes[closes.length - 1];

        let bullishStack = true, bearishStack = true;
        for (let i = 0; i < currentEmas.length - 1; i++) {
            if (currentEmas[i] <= currentEmas[i + 1]) bullishStack = false;
            if (currentEmas[i] >= currentEmas[i + 1]) bearishStack = false;
        }

        let signal = 'neutral', strength = 0, details = '';

        if (bullishStack && currentClose > currentEmas[0]) {
            signal = 'buy'; strength = 0.9; details = 'Strong bullish trend - All EMAs aligned upward';
        } else if (bearishStack && currentClose < currentEmas[0]) {
            signal = 'sell'; strength = 0.9; details = 'Strong bearish trend - All EMAs aligned downward';
        } else if (currentClose > currentEmas[2]) {
            signal = 'buy'; strength = 0.5; details = 'Price above middle EMAs - Moderate bullish';
        } else if (currentClose < currentEmas[2]) {
            signal = 'sell'; strength = 0.5; details = 'Price below middle EMAs - Moderate bearish';
        } else {
            details = 'EMAs not aligned - Choppy market';
        }

        return { strategyId: 'ema_ribbon', signal, strength, value: currentEmas[0], details };
    },

    analyzeVolumeMomentum(klines) {
        const closes = klines.map(k => k.close);
        const volumes = klines.map(k => k.volume);
        const momentumPeriod = 10, volumePeriod = 20;

        const currentClose = closes[closes.length - 1];
        const pastClose = closes[closes.length - 1 - momentumPeriod];
        const momentum = ((currentClose - pastClose) / pastClose) * 100;

        const avgVolume = window.Indicators.sma(volumes, volumePeriod);
        const volumeRatio = volumes[volumes.length - 1] / avgVolume[avgVolume.length - 1];

        let signal = 'neutral', strength = 0, details = '';

        if (momentum > 0 && volumeRatio > 1.5) {
            signal = 'buy'; strength = Math.min(momentum / 10, 1) * 0.8;
            details = `Strong momentum (+${momentum.toFixed(2)}%) with ${volumeRatio.toFixed(1)}x avg volume`;
        } else if (momentum < 0 && volumeRatio > 1.5) {
            signal = 'sell'; strength = Math.min(Math.abs(momentum) / 10, 1) * 0.8;
            details = `Strong downward momentum (${momentum.toFixed(2)}%) with ${volumeRatio.toFixed(1)}x avg volume`;
        } else if (momentum > 0) {
            signal = 'buy'; strength = 0.4; details = `Positive momentum (+${momentum.toFixed(2)}%) but weak volume`;
        } else if (momentum < 0) {
            signal = 'sell'; strength = 0.4; details = `Negative momentum (${momentum.toFixed(2)}%) but weak volume`;
        }

        return { strategyId: 'volume_momentum', signal, strength, value: momentum, details };
    },

    analyzeSupportResistance(klines) {
        const lookback = 20, threshold = 0.005;
        const recentKlines = klines.slice(-lookback);
        const resistance = Math.max(...recentKlines.map(k => k.high));
        const support = Math.min(...recentKlines.map(k => k.low));
        const currentClose = klines[klines.length - 1].close;

        let signal = 'neutral', strength = 0, details = '';

        if (currentClose > resistance * (1 + threshold)) {
            signal = 'buy'; strength = 0.75; details = `Breakout above resistance at ${resistance.toFixed(4)}`;
        } else if (currentClose < support * (1 - threshold)) {
            signal = 'sell'; strength = 0.75; details = `Breakdown below support at ${support.toFixed(4)}`;
        } else if (currentClose >= resistance * 0.98) {
            signal = 'neutral'; strength = 0.3; details = `Testing resistance at ${resistance.toFixed(4)}`;
        } else if (currentClose <= support * 1.02) {
            signal = 'neutral'; strength = 0.3; details = `Testing support at ${support.toFixed(4)}`;
        } else {
            details = `Trading between S: ${support.toFixed(4)} and R: ${resistance.toFixed(4)}`;
        }

        return { strategyId: 'support_resistance', signal, strength, value: currentClose, details };
    },

    analyzeMeanReversion(klines) {
        const closes = klines.map(k => k.close);
        const period = 20, deviations = 2;
        const smaValues = window.Indicators.sma(closes, period);
        const stdValues = window.Indicators.stdDev(closes, period);

        const currentClose = closes[closes.length - 1];
        const currentSma = smaValues[smaValues.length - 1];
        const currentStd = stdValues[stdValues.length - 1];
        const zScore = (currentClose - currentSma) / currentStd;

        let signal = 'neutral', strength = 0, details = '';

        if (zScore < -deviations) {
            signal = 'buy'; strength = Math.min(Math.abs(zScore) / 3, 1);
            details = `Price ${Math.abs(zScore).toFixed(2)} std devs below mean - Expect reversion up`;
        } else if (zScore > deviations) {
            signal = 'sell'; strength = Math.min(zScore / 3, 1);
            details = `Price ${zScore.toFixed(2)} std devs above mean - Expect reversion down`;
        } else {
            details = `Price within normal range (Z-score: ${zScore.toFixed(2)})`;
        }

        return { strategyId: 'mean_reversion', signal, strength, value: zScore, details };
    },

    analyzeIchimoku(klines) {
        const { tenkanSen, kijunSen, senkouA, senkouB } = window.Indicators.ichimoku(klines);
        const currentClose = klines[klines.length - 1].close;
        const currentTenkan = tenkanSen[tenkanSen.length - 1];
        const currentKijun = kijunSen[kijunSen.length - 1];
        const cloudTop = Math.max(senkouA[senkouA.length - 1] || 0, senkouB[senkouB.length - 1] || 0);
        const cloudBottom = Math.min(senkouA[senkouA.length - 1] || 0, senkouB[senkouB.length - 1] || 0);

        const aboveCloud = currentClose > cloudTop;
        const belowCloud = currentClose < cloudBottom;
        const tkCross = currentTenkan > currentKijun;

        let signal = 'neutral', strength = 0, details = '';

        if (aboveCloud && tkCross) {
            signal = 'buy'; strength = 0.85; details = 'Price above cloud with bullish TK cross';
        } else if (belowCloud && !tkCross) {
            signal = 'sell'; strength = 0.85; details = 'Price below cloud with bearish TK cross';
        } else if (aboveCloud) {
            signal = 'buy'; strength = 0.5; details = 'Price above cloud but TK not crossed';
        } else if (belowCloud) {
            signal = 'sell'; strength = 0.5; details = 'Price below cloud but TK not crossed';
        } else {
            details = 'Price inside cloud - Wait for breakout';
        }

        return { strategyId: 'ichimoku', signal, strength, value: currentClose - cloudTop, details };
    },

    analyzeStochRsi(klines) {
        const closes = klines.map(k => k.close);
        const { k, d } = window.Indicators.stochRsi(closes);

        const currentK = k[k.length - 1], currentD = d[d.length - 1];
        const prevK = k[k.length - 2], prevD = d[d.length - 2];

        let signal = 'neutral', strength = 0, details = '';
        const bullishCross = prevK <= prevD && currentK > currentD;
        const bearishCross = prevK >= prevD && currentK < currentD;

        if (currentK < 20 && bullishCross) {
            signal = 'buy'; strength = 0.9; details = 'StochRSI oversold with bullish K/D cross';
        } else if (currentK > 80 && bearishCross) {
            signal = 'sell'; strength = 0.9; details = 'StochRSI overbought with bearish K/D cross';
        } else if (currentK < 20) {
            signal = 'buy'; strength = 0.5; details = `StochRSI oversold at ${currentK.toFixed(1)}`;
        } else if (currentK > 80) {
            signal = 'sell'; strength = 0.5; details = `StochRSI overbought at ${currentK.toFixed(1)}`;
        } else {
            details = `StochRSI at ${currentK.toFixed(1)} - Neutral zone`;
        }

        return { strategyId: 'stoch_rsi', signal, strength, value: currentK, details };
    },

    analyzeAdxTrend(klines) {
        const { adx, plusDI, minusDI } = window.Indicators.adx(klines);
        const currentAdx = adx[adx.length - 1];
        const currentPlusDI = plusDI[plusDI.length - 1];
        const currentMinusDI = minusDI[minusDI.length - 1];

        let signal = 'neutral', strength = 0, details = '';

        if (currentAdx >= 25) {
            if (currentPlusDI > currentMinusDI) {
                signal = 'buy'; strength = Math.min(currentAdx / 50, 1);
                details = `Strong uptrend (ADX: ${currentAdx.toFixed(1)}, +DI: ${currentPlusDI.toFixed(1)})`;
            } else {
                signal = 'sell'; strength = Math.min(currentAdx / 50, 1);
                details = `Strong downtrend (ADX: ${currentAdx.toFixed(1)}, -DI: ${currentMinusDI.toFixed(1)})`;
            }
        } else {
            details = `Weak trend (ADX: ${currentAdx.toFixed(1)}) - Range-bound market`;
        }
        return { strategyId: 'adx_trend', signal, strength, value: currentAdx, details };
    },

    analyzeVwap(klines) {
        const vwapValues = window.Indicators.vwap(klines);
        const closes = klines.map(k => k.close);
        const deviation = ((closes[closes.length - 1] - vwapValues[vwapValues.length - 1]) / vwapValues[vwapValues.length - 1]) * 100;

        let signal = 'neutral', strength = 0, details = '';

        if (deviation > 3) {
            signal = 'sell'; strength = Math.min(deviation / 5, 1) * 0.7; details = `Price ${deviation.toFixed(2)}% above VWAP - Overextended`;
        } else if (deviation < -3) {
            signal = 'buy'; strength = Math.min(Math.abs(deviation) / 5, 1) * 0.7; details = `Price ${Math.abs(deviation).toFixed(2)}% below VWAP - Undervalued`;
        } else if (deviation > 0) {
            signal = 'buy'; strength = 0.3; details = `Price ${deviation.toFixed(2)}% above VWAP - Bullish bias`;
        } else {
            signal = 'sell'; strength = 0.3; details = `Price ${Math.abs(deviation).toFixed(2)}% below VWAP - Bearish bias`;
        }
        return { strategyId: 'vwap', signal, strength, value: deviation, details };
    },

    analyzeTripleScreen(klines) {
        const closes = klines.map(k => k.close);
        const ema50 = window.Indicators.ema(closes, 50);
        const trend = closes[closes.length - 1] > ema50[ema50.length - 1] ? 'up' : 'down';
        const rsi = window.Indicators.rsi(closes);
        const currentRsi = rsi[rsi.length - 1];
        const recentCloses = closes.slice(-5);
        const recentTrend = recentCloses[4] > recentCloses[0] ? 'up' : 'down';

        let signal = 'neutral', strength = 0, details = '';

        if (trend === 'up' && currentRsi < 50 && recentTrend === 'up') {
            signal = 'buy'; strength = 0.75; details = 'Triple screen: Uptrend + oversold + bullish entry';
        } else if (trend === 'down' && currentRsi > 50 && recentTrend === 'down') {
            signal = 'sell'; strength = 0.75; details = 'Triple screen: Downtrend + overbought + bearish entry';
        } else if (trend === 'up') {
            signal = 'buy'; strength = 0.4; details = 'Long-term uptrend but waiting for pullback entry';
        } else {
            signal = 'sell'; strength = 0.4; details = 'Long-term downtrend but waiting for rally entry';
        }
        return { strategyId: 'triple_screen', signal, strength, value: currentRsi, details };
    },

    analyzeKdj(klines) {
        const { k, d, j } = window.Indicators.kdj(klines, 9, 3, 3);
        const currentK = k[k.length - 1], currentD = d[d.length - 1], currentJ = j[j.length - 1];
        const prevK = k[k.length - 2], prevD = d[d.length - 2];

        let signal = 'neutral', strength = 0, details = '';

        if (currentK < 15) {
            signal = 'buy'; strength = 0.95; details = `K9 at ${currentK.toFixed(1)} < 15 - STRONG BUY signal`;
        } else if (currentK > 70) {
            signal = 'sell'; strength = 0.85; details = `K9 at ${currentK.toFixed(1)} > 70 - SELL signal`;
        } else if (currentK < 20 && prevK <= prevD && currentK > currentD) {
            signal = 'buy'; strength = 0.8; details = `K9 at ${currentK.toFixed(1)} with bullish K/D cross`;
        } else if (currentK > 80 && prevK >= prevD && currentK < currentD) {
            signal = 'sell'; strength = 0.8; details = `K9 at ${currentK.toFixed(1)} with bearish K/D cross`;
        } else if (currentJ > 100) {
            signal = 'sell'; strength = 0.7; details = `J at ${currentJ.toFixed(1)} > 100 - Extreme overbought`;
        } else if (currentJ < 0) {
            signal = 'buy'; strength = 0.7; details = `J at ${currentJ.toFixed(1)} < 0 - Extreme oversold`;
        } else {
            details = `K=${currentK.toFixed(1)}, D=${currentD.toFixed(1)}, J=${currentJ.toFixed(1)} - Neutral`;
        }
        return { strategyId: 'kdj', signal, strength, value: currentK, details };
    },

    analyzeConnorsRsi(klines) {
        const params = window.Strategies.getParams('connors_rsi');
        const closes = klines.map(k => k.close);
        const rsi2 = window.Indicators.rsi(closes, params.rsiPeriod || 2);
        const sma200 = window.Indicators.sma(closes, params.smaPeriod || 200);

        const currentRsi = rsi2[rsi2.length - 1];
        const currentClose = closes[closes.length - 1];
        const currentSma = sma200[sma200.length - 1];

        let signal = 'neutral', strength = 0, details = '';

        if (currentSma && currentRsi !== null) {
            if (currentRsi < (params.oversold || 10) && currentClose > currentSma) {
                signal = 'buy'; strength = 0.85; details = `RSI(2) at ${currentRsi.toFixed(1)} < 10 with price above SMA(200) - Bull dip buy`;
            } else if (currentRsi > (params.overbought || 90) && currentClose < currentSma) {
                signal = 'sell'; strength = 0.85; details = `RSI(2) at ${currentRsi.toFixed(1)} > 90 with price below SMA(200) - Bear rally sell`;
            } else if (currentClose > currentSma) {
                signal = 'buy'; strength = 0.3; details = `RSI(2) at ${currentRsi.toFixed(1)}, price above SMA(200) - Bullish bias`;
            } else {
                signal = 'sell'; strength = 0.3; details = `RSI(2) at ${currentRsi.toFixed(1)}, price below SMA(200) - Bearish bias`;
            }
        } else {
            details = 'Insufficient data for SMA(200)';
        }
        return { strategyId: 'connors_rsi', signal, strength, value: currentRsi, details };
    },

    analyzeDonchianBreakout(klines) {
        const params = window.Strategies.getParams('donchian_breakout');
        const period = params.period || 20;
        const lookbackKlines = klines.slice(-period - 1, -1);
        const highestHigh = Math.max(...lookbackKlines.map(k => k.high));
        const lowestLow = Math.min(...lookbackKlines.map(k => k.low));
        const currentClose = klines[klines.length - 1].close;

        let signal = 'neutral', strength = 0, details = '';

        if (currentClose > highestHigh) {
            signal = 'buy'; strength = 0.8; details = `Price broke above ${period}-period high at ${highestHigh.toFixed(4)} - Bullish breakout`;
        } else if (currentClose < lowestLow) {
            signal = 'sell'; strength = 0.8; details = `Price broke below ${period}-period low at ${lowestLow.toFixed(4)} - Bearish breakdown`;
        } else {
            const position = (currentClose - lowestLow) / (highestHigh - lowestLow);
            details = `Price in range (${(position * 100).toFixed(0)}% from low). High: ${highestHigh.toFixed(4)}, Low: ${lowestLow.toFixed(4)}`;
        }
        return { strategyId: 'donchian_breakout', signal, strength, value: currentClose, details };
    },

    analyzeGoldenCross(klines) {
        const params = window.Strategies.getParams('golden_cross');
        const closes = klines.map(k => k.close);
        const fastSma = window.Indicators.sma(closes, params.fastPeriod || 50);
        const slowSma = window.Indicators.sma(closes, params.slowPeriod || 200);

        const currentFast = fastSma[fastSma.length - 1], currentSlow = slowSma[slowSma.length - 1];
        const prevFast = fastSma[fastSma.length - 2], prevSlow = slowSma[slowSma.length - 2];

        let signal = 'neutral', strength = 0, details = '';

        if (currentSlow && currentFast) {
            if (prevFast <= prevSlow && currentFast > currentSlow) {
                signal = 'buy'; strength = 0.9; details = `Golden Cross! SMA(${params.fastPeriod || 50}) crossed above SMA(${params.slowPeriod || 200})`;
            } else if (prevFast >= prevSlow && currentFast < currentSlow) {
                signal = 'sell'; strength = 0.9; details = `Death Cross! SMA(${params.fastPeriod || 50}) crossed below SMA(${params.slowPeriod || 200})`;
            } else if (currentFast > currentSlow) {
                signal = 'buy'; strength = 0.5; details = `Bullish: SMA(${params.fastPeriod || 50}) above SMA(${params.slowPeriod || 200})`;
            } else {
                signal = 'sell'; strength = 0.5; details = `Bearish: SMA(${params.fastPeriod || 50}) below SMA(${params.slowPeriod || 200})`;
            }
        } else {
            details = 'Insufficient data for SMA calculation';
        }
        return { strategyId: 'golden_cross', signal, strength, value: currentFast - currentSlow, details };
    },

    analyzeSuperTrend(klines) {
        const params = window.Strategies.getParams('supertrend');
        const { supertrend, direction } = window.Indicators.superTrend(klines, params.period || 10, params.multiplier || 3);
        
        const currentClose = klines[klines.length - 1].close;
        const currentST = supertrend[supertrend.length - 1];
        const currentDir = direction[direction.length - 1];
        const prevDir = direction[direction.length - 2];
        const pullbackPct = ((currentClose - currentST) / currentST) * 100;

        let signal = 'neutral', strength = 0, details = '';

        if (prevDir === -1 && currentDir === 1) {
            signal = 'buy'; strength = 0.85; details = 'SuperTrend flipped bullish - Trend reversal';
        } else if (prevDir === 1 && currentDir === -1) {
            signal = 'sell'; strength = 0.85; details = 'SuperTrend flipped bearish - Trend reversal';
        } else if (currentDir === 1 && pullbackPct < (params.pullbackPct || 1) && pullbackPct > 0) {
            signal = 'buy'; strength = 0.7; details = `Uptrend pullback ${pullbackPct.toFixed(2)}% - Entry opportunity`;
        } else if (currentDir === 1) {
            signal = 'buy'; strength = 0.4; details = 'Price above SuperTrend - Bullish trend';
        } else {
            signal = 'sell'; strength = 0.4; details = 'Price below SuperTrend - Bearish trend';
        }
        return { strategyId: 'supertrend', signal, strength, value: currentST, details };
    },

    analyzeVptBreakout(klines) {
        const params = window.Strategies.getParams('vpt_breakout');
        const vptValues = window.Indicators.vpt(klines);
        const vptSma = window.Indicators.sma(vptValues, params.smaPeriod || 50);

        const currentVpt = vptValues[vptValues.length - 1];
        const currentVptSma = vptSma[vptSma.length - 1];
        const closes = klines.map(k => k.close);
        const priceGain = ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100;

        let signal = 'neutral', strength = 0, details = '';

        if (currentVptSma) {
            if (currentVpt > currentVptSma && priceGain < (params.maxGain || 2) && priceGain > 0) {
                signal = 'buy'; strength = 0.75; details = `VPT above SMA with small gain (${priceGain.toFixed(2)}%) - Accumulation detected`;
            } else if (currentVpt < currentVptSma && priceGain > -(params.maxGain || 2) && priceGain < 0) {
                signal = 'sell'; strength = 0.75; details = `VPT below SMA with small loss (${priceGain.toFixed(2)}%) - Distribution detected`;
            } else if (currentVpt > currentVptSma) {
                signal = 'buy'; strength = 0.4; details = 'VPT above SMA - Bullish volume trend';
            } else {
                signal = 'sell'; strength = 0.4; details = 'VPT below SMA - Bearish volume trend';
            }
        } else {
            details = 'Insufficient data for VPT calculation';
        }
        return { strategyId: 'vpt_breakout', signal, strength, value: currentVpt, details };
    },

    analyzeObvDivergence(klines) {
        const params = window.Strategies.getParams('obv_divergence');
        const lookback = params.lookback || 20;
        const obvValues = window.Indicators.obv(klines);
        const closes = klines.map(k => k.close);

        const recentCloses = closes.slice(-lookback);
        const recentObv = obvValues.slice(-lookback);
        const currentClose = closes[closes.length - 1];
        const currentObv = obvValues[obvValues.length - 1];
        const lowestClose = Math.min(...recentCloses);
        const lowestObvAtLow = recentObv[recentCloses.indexOf(lowestClose)];

        let signal = 'neutral', strength = 0, details = '';

        if (currentClose <= lowestClose * 1.02 && currentObv > lowestObvAtLow * 1.1) {
            signal = 'buy'; strength = 0.8; details = 'Bullish divergence: Price at lows but OBV rising - Reversal signal';
        }
        
        const highestClose = Math.max(...recentCloses);
        const highestObvAtHigh = recentObv[recentCloses.indexOf(highestClose)];
        if (currentClose >= highestClose * 0.98 && currentObv < highestObvAtHigh * 0.9) {
            signal = 'sell'; strength = 0.8; details = 'Bearish divergence: Price at highs but OBV falling - Reversal signal';
        }

        if (signal === 'neutral') details = `OBV at ${currentObv.toFixed(0)} - No divergence detected`;
        return { strategyId: 'obv_divergence', signal, strength, value: currentObv, details };
    },

    analyzeFundingRate(klines) {
        const volumes = klines.slice(-8).map(k => k.volume);
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const closes = klines.map(k => k.close);
        const priceChange = ((closes[closes.length - 1] - closes[closes.length - 8]) / closes[closes.length - 8]) * 100;

        let signal = 'neutral', strength = 0, details = '';

        if (priceChange > 2 && volumes[volumes.length - 1] > avgVolume * 1.2) {
            signal = 'sell'; strength = 0.6; details = `High volume bullish move (+${priceChange.toFixed(2)}%) - Potential funding squeeze`;
        } else if (priceChange < -2 && volumes[volumes.length - 1] > avgVolume * 1.2) {
            signal = 'buy'; strength = 0.6; details = `High volume bearish move (${priceChange.toFixed(2)}%) - Potential short squeeze`;
        } else {
            details = `8h price change: ${priceChange.toFixed(2)}% - Neutral funding environment`;
        }
        return { strategyId: 'funding_rate', signal, strength, value: priceChange, details };
    }
};

window.StrategyAnalyzers = StrategyAnalyzers;