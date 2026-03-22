/**
 * Pure Mathematical Indicators Library
 */
const Indicators = {
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
        const result = [null];
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

    macd(closes, fast = 12, slow = 26, signal = 9) {
        const emaFast = this.ema(closes, fast);
        const emaSlow = this.ema(closes, slow);
        const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
        const signalLine = this.ema(macdLine, signal);
        const histogram = macdLine.map((m, i) => m - signalLine[i]);
        return { macdLine, signalLine, histogram };
    },

    bollingerBands(closes, period = 20, stdDevMultiplier = 2) {
        const middle = this.sma(closes, period);
        const std = this.stdDev(closes, period);
        const upper = middle.map((m, i) => m !== null ? m + (std[i] * stdDevMultiplier) : null);
        const lower = middle.map((m, i) => m !== null ? m - (std[i] * stdDevMultiplier) : null);
        const bandwidth = middle.map((m, i) => m !== null ? (upper[i] - lower[i]) / m : null);
        return { upper, middle, lower, bandwidth };
    },

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
                let highestHigh = -Infinity;
                let lowestLow = Infinity;
                for (let j = i - period + 1; j <= i; j++) {
                    highestHigh = Math.max(highestHigh, klines[j].high);
                    lowestLow = Math.min(lowestLow, klines[j].low);
                }
                const range = highestHigh - lowestLow;
                const currentRsv = range > 0 ? ((klines[i].close - lowestLow) / range) * 100 : 50;
                rsv.push(currentRsv);

                const prevK = k.length > 0 ? k[k.length - 1] : 50;
                const currentK = (2 / 3) * prevK + (1 / 3) * currentRsv;
                k.push(currentK);

                const prevD = d.length > 0 ? d[d.length - 1] : 50;
                const currentD = (2 / 3) * prevD + (1 / 3) * currentK;
                d.push(currentD);

                const currentJ = 3 * currentK - 2 * currentD;
                j.push(currentJ);
            }
        }
        return { k, d, j };
    },

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

    ichimoku(klines, tenkan = 9, kijun = 26, senkou = 52) {
        const tenkanSen = [];
        const kijunSen = [];
        const senkouA = [];
        const senkouB = [];
        for (let i = 0; i < klines.length; i++) {
            if (i >= tenkan - 1) {
                let high = -Infinity, low = Infinity;
                for (let j = i - tenkan + 1; j <= i; j++) {
                    high = Math.max(high, klines[j].high);
                    low = Math.min(low, klines[j].low);
                }
                tenkanSen.push((high + low) / 2);
            } else tenkanSen.push(null);

            if (i >= kijun - 1) {
                let high = -Infinity, low = Infinity;
                for (let j = i - kijun + 1; j <= i; j++) {
                    high = Math.max(high, klines[j].high);
                    low = Math.min(low, klines[j].low);
                }
                kijunSen.push((high + low) / 2);
            } else kijunSen.push(null);

            if (i >= senkou - 1) {
                let high = -Infinity, low = Infinity;
                for (let j = i - senkou + 1; j <= i; j++) {
                    high = Math.max(high, klines[j].high);
                    low = Math.min(low, klines[j].low);
                }
                senkouB.push((high + low) / 2);
            } else senkouB.push(null);
        }
        for (let i = 0; i < klines.length; i++) {
            if (tenkanSen[i] !== null && kijunSen[i] !== null) {
                senkouA.push((tenkanSen[i] + kijunSen[i]) / 2);
            } else senkouA.push(null);
        }
        return { tenkanSen, kijunSen, senkouA, senkouB };
    },

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

    vpt(klines) {
        const vptValues = [0];
        for (let i = 1; i < klines.length; i++) {
            const priceChange = (klines[i].close - klines[i - 1].close) / klines[i - 1].close;
            vptValues.push(vptValues[i - 1] + klines[i].volume * priceChange);
        }
        return vptValues;
    },

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
                direction.push(1);
            } else {
                if (supertrend[i - 1] === (direction[i - 1] === 1 ? lowerBand : upperBand)) {
                    if (klines[i].close > supertrend[i - 1]) {
                        supertrend.push(Math.max(lowerBand, supertrend[i - 1]));
                        direction.push(1);
                    } else {
                        supertrend.push(upperBand);
                        direction.push(-1);
                    }
                } else {
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
    }
};

window.Indicators = Indicators;