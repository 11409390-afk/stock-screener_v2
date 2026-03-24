/**
 * DIY Indicators — Extended Math Library
 * Implements unique indicators not in the base indicators.js
 */
const DIYIndicators = {

    // ─── Utility ──────────────────────────────────────────────────────────────

    ema(data, period) { return window.Indicators.ema(data, period); },
    sma(data, period) { return window.Indicators.sma(data, period); },
    atr(klines, period) { return window.Indicators.atr(klines, period); },

    highest(data, period) {
        return data.map((_, i) => i < period - 1 ? null
            : Math.max(...data.slice(i - period + 1, i + 1)));
    },
    lowest(data, period) {
        return data.map((_, i) => i < period - 1 ? null
            : Math.min(...data.slice(i - period + 1, i + 1)));
    },
    stdev(data, period) { return window.Indicators.stdDev(data, period); },

    // ─── 1. Range Filter ──────────────────────────────────────────────────────
    rangeFilter(closes, period = 100, multiplier = 3.0) {
        const smrng = [];
        const wper = period * 2 - 1;
        const absChange = closes.map((c, i) => i === 0 ? 0 : Math.abs(c - closes[i - 1]));
        const avrng = this.ema(absChange, period);
        for (let i = 0; i < closes.length; i++) {
            smrng.push(avrng[i] * multiplier);
        }
        const filt = [closes[0]];
        for (let i = 1; i < closes.length; i++) {
            const prev = filt[i - 1];
            const r = smrng[i];
            if (closes[i] > prev) filt.push(closes[i] - r < prev ? prev : closes[i] - r);
            else filt.push(closes[i] + r > prev ? prev : closes[i] + r);
        }
        const upward = filt.map((f, i) => i === 0 ? 0 : f > filt[i - 1] ? 1 : 0);
        const downward = filt.map((f, i) => i === 0 ? 0 : f < filt[i - 1] ? 1 : 0);
        return { filt, upward, downward };
    },

    // ─── 2. SSL Channel ───────────────────────────────────────────────────────
    sslChannel(klines, period = 10) {
        const highs = klines.map(k => k.high);
        const lows  = klines.map(k => k.low);
        const closes = klines.map(k => k.close);
        const smaHigh = this.sma(highs, period);
        const smaLow  = this.sma(lows, period);
        const hlv = [0]; // 1 = bullish, -1 = bearish
        for (let i = 1; i < closes.length; i++) {
            if (closes[i] > (smaHigh[i] || 0)) hlv.push(1);
            else if (closes[i] < (smaLow[i] || 0)) hlv.push(-1);
            else hlv.push(hlv[i - 1]);
        }
        const sslUp   = hlv.map((h, i) => h < 0 ? smaLow[i]  : smaHigh[i]);
        const sslDown = hlv.map((h, i) => h < 0 ? smaHigh[i] : smaLow[i]);
        return { sslUp, sslDown, hlv };
    },

    // ─── 3. CCI ────────────────────────────────────────────────────────────────
    cci(klines, period = 20) {
        const tp = klines.map(k => (k.high + k.low + k.close) / 3);
        const smaTP = this.sma(tp, period);
        return tp.map((t, i) => {
            if (smaTP[i] === null) return null;
            const slice = tp.slice(Math.max(0, i - period + 1), i + 1);
            const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
            const md = slice.reduce((a, b) => a + Math.abs(b - mean), 0) / slice.length;
            return md === 0 ? 0 : (t - smaTP[i]) / (0.015 * md);
        });
    },

    // ─── 4. Chandelier Exit ───────────────────────────────────────────────────
    chandelierExit(klines, period = 22, multiplier = 3.0) {
        const closes = klines.map(k => k.close);
        const atrArr = this.atr(klines, period);
        const highestClose = this.highest(closes, period);
        const lowestClose  = this.lowest(closes, period);
        const dir = [1];
        const longStop  = [];
        const shortStop = [];
        for (let i = 0; i < klines.length; i++) {
            const ls = (highestClose[i] || closes[i]) - (atrArr[i] || 0) * multiplier;
            const ss = (lowestClose[i]  || closes[i]) + (atrArr[i] || 0) * multiplier;
            const prevLS = i > 0 ? (longStop[i-1] || ls) : ls;
            const prevSS = i > 0 ? (shortStop[i-1] || ss) : ss;
            longStop.push(closes[i-1] > prevLS ? Math.max(ls, prevLS) : ls);
            shortStop.push(closes[i-1] < prevSS ? Math.min(ss, prevSS) : ss);
            const prevDir = dir[i] || 1;
            if (closes[i] > (shortStop[i-1] || ss)) dir.push(1);
            else if (closes[i] < (longStop[i-1] || ls)) dir.push(-1);
            else dir.push(prevDir);
        }
        return { longStop, shortStop, dir };
    },

    // ─── 5. Chaikin Money Flow (CMF) ─────────────────────────────────────────
    cmf(klines, period = 20) {
        const mfv = klines.map(k => {
            const hl = k.high - k.low;
            if (hl === 0) return 0;
            return ((k.close - k.low) - (k.high - k.close)) / hl * k.volume;
        });
        return mfv.map((_, i) => {
            if (i < period - 1) return null;
            const sumMFV = mfv.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            const sumVol = klines.slice(i - period + 1, i + 1).reduce((a, k) => a + k.volume, 0);
            return sumVol === 0 ? 0 : sumMFV / sumVol;
        });
    },

    // ─── 6. Rate of Change (ROC) ──────────────────────────────────────────────
    roc(closes, period = 9) {
        return closes.map((c, i) => i < period ? null
            : 100 * (c - closes[i - period]) / closes[i - period]);
    },

    // ─── 7. Volatility Oscillator ────────────────────────────────────────────
    volatilityOscillator(klines, period = 100) {
        const spike = klines.map(k => k.close - k.open);
        const upper = [];
        const lower = [];
        for (let i = 0; i < spike.length; i++) {
            if (i < period - 1) { upper.push(null); lower.push(null); continue; }
            const slice = spike.slice(i - period + 1, i + 1);
            const mean = slice.reduce((a, b) => a + b, 0) / period;
            const std  = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
            upper.push(std);
            lower.push(-std);
        }
        return { spike, upper, lower };
    },

    // ─── 8. Hull Moving Average (HMA) ────────────────────────────────────────
    hma(closes, period = 9) {
        const half = Math.floor(period / 2);
        const sqrt = Math.round(Math.sqrt(period));
        const wma1 = this.ema(closes, half);   // using ema as WMA approx
        const wma2 = this.ema(closes, period);
        const raw  = wma1.map((w, i) => w !== null && wma2[i] !== null
            ? 2 * w - wma2[i] : null);
        return this.ema(raw.filter(v => v !== null), sqrt);
    },

    // ─── 9. Keltner Channel ───────────────────────────────────────────────────
    keltnerChannel(klines, emaPeriod = 20, atrPeriod = 10, multiplier = 2) {
        const closes = klines.map(k => k.close);
        const midLine = this.ema(closes, emaPeriod);
        const atrArr  = this.atr(klines, atrPeriod);
        const upper = midLine.map((m, i) => m !== null ? m + multiplier * (atrArr[i] || 0) : null);
        const lower = midLine.map((m, i) => m !== null ? m - multiplier * (atrArr[i] || 0) : null);
        return { upper, midLine, lower };
    },

    // ─── 10. Squeeze Momentum (LazyBear) ─────────────────────────────────────
    squeezeMomentum(klines, bbPeriod = 20, bbMultiplier = 2, kcPeriod = 20, kcMultiplier = 1.5, momPeriod = 12) {
        const closes = klines.map(k => k.close);
        const { upper: bbUpper, lower: bbLower } = window.Indicators.bollingerBands(closes, bbPeriod, bbMultiplier);
        const { upper: kcUpper, lower: kcLower } = this.keltnerChannel(klines, kcPeriod, kcPeriod, kcMultiplier);

        const sqzOn  = bbUpper.map((b, i) => b !== null && kcUpper[i] !== null
            ? b < kcUpper[i] && bbLower[i] > kcLower[i] : false);
        const sqzOff = bbUpper.map((b, i) => b !== null && kcUpper[i] !== null
            ? b > kcUpper[i] && bbLower[i] < kcLower[i] : false);

        // Momentum = delta of midpoint of high/low range minus midpoint of BB
        const highestHigh = this.highest(klines.map(k => k.high), momPeriod);
        const lowestLow   = this.lowest(klines.map(k => k.low), momPeriod);
        const smaClose    = this.sma(closes, momPeriod);
        const momentum = closes.map((c, i) => {
            if (highestHigh[i] === null || lowestLow[i] === null || smaClose[i] === null) return null;
            const mid = (highestHigh[i] + lowestLow[i]) / 2;
            return c - (mid + smaClose[i]) / 2;
        });
        const momSmo = this.ema(momentum.filter(v => v !== null), 5);
        return { sqzOn, sqzOff, momentum, momSmo };
    },

    // ─── 11. Fisher Transform ─────────────────────────────────────────────────
    fisherTransform(klines, period = 9) {
        const hl2 = klines.map(k => (k.high + k.low) / 2);
        const highest = this.highest(hl2, period);
        const lowest  = this.lowest(hl2, period);
        const fisher  = [];
        const signal  = [null];
        let prevFish  = 0;
        for (let i = 0; i < hl2.length; i++) {
            if (highest[i] === null || lowest[i] === null) { fisher.push(null); continue; }
            const range = highest[i] - lowest[i];
            let val = range === 0 ? 0 : 2 * ((hl2[i] - lowest[i]) / range) - 1;
            val = Math.max(Math.min(val, 0.999), -0.999);
            const f = 0.5 * Math.log((1 + val) / (1 - val)) + 0.5 * prevFish;
            fisher.push(f);
            signal.push(prevFish);
            prevFish = f;
        }
        return { fisher, signal: signal.slice(0, fisher.length) };
    },

    // ─── 12. True Strength Index (TSI) ───────────────────────────────────────
    tsi(closes, longLen = 25, shortLen = 13, signalLen = 13) {
        const pc = closes.map((c, i) => i === 0 ? 0 : c - closes[i - 1]);
        const ds  = this.ema(this.ema(pc, longLen), shortLen);
        const ads = this.ema(this.ema(pc.map(Math.abs), longLen), shortLen);
        const tsi = ds.map((d, i) => ads[i] && ads[i] !== 0 ? 100 * d / ads[i] : 0);
        const sig = this.ema(tsi, signalLen);
        return { tsi, signal: sig };
    },

    // ─── 13. Williams %R ─────────────────────────────────────────────────────
    williamsR(klines, period = 14) {
        const closes = klines.map(k => k.close);
        const hh = this.highest(klines.map(k => k.high), period);
        const ll  = this.lowest(klines.map(k => k.low), period);
        return closes.map((c, i) => {
            if (hh[i] === null) return null;
            const range = hh[i] - ll[i];
            return range === 0 ? -50 : ((hh[i] - c) / range) * -100;
        });
    },

    // ─── 14. Money Flow Index (MFI) ──────────────────────────────────────────
    mfi(klines, period = 14) {
        const tp  = klines.map(k => (k.high + k.low + k.close) / 3);
        const mf  = tp.map((t, i) => t * klines[i].volume);
        return tp.map((_, i) => {
            if (i < period) return null;
            let posFlow = 0, negFlow = 0;
            for (let j = i - period + 1; j <= i; j++) {
                if (tp[j] > tp[j - 1]) posFlow += mf[j];
                else negFlow += mf[j];
            }
            if (negFlow === 0) return 100;
            const ratio = posFlow / negFlow;
            return 100 - 100 / (1 + ratio);
        });
    },

    // ─── 15. Aroon ────────────────────────────────────────────────────────────
    aroon(klines, period = 25) {
        const highs = klines.map(k => k.high);
        const lows  = klines.map(k => k.low);
        const up = [], down = [];
        for (let i = 0; i < klines.length; i++) {
            if (i < period) { up.push(null); down.push(null); continue; }
            const sliceH = highs.slice(i - period, i + 1);
            const sliceL = lows.slice(i - period, i + 1);
            const maxIdx = sliceH.indexOf(Math.max(...sliceH));
            const minIdx = sliceL.indexOf(Math.min(...sliceL));
            up.push(((period - (period - maxIdx)) / period) * 100);
            down.push(((period - (period - minIdx)) / period) * 100);
        }
        return { up, down };
    },

    // ─── 16. McGinley Dynamic ────────────────────────────────────────────────
    mcginley(closes, period = 14) {
        const result = [closes[0]];
        for (let i = 1; i < closes.length; i++) {
            const prev = result[i - 1];
            result.push(prev + (closes[i] - prev) / (period * Math.pow(closes[i] / prev, 4)));
        }
        return result;
    },

    // ─── 17. Schaff Trend Cycle (STC) ────────────────────────────────────────
    stc(closes, fastLen = 23, slowLen = 50, cycleLen = 10, d1 = 0.5, d2 = 0.5) {
        const emaFast = this.ema(closes, fastLen);
        const emaSlow = this.ema(closes, slowLen);
        const macd = emaFast.map((f, i) => f - emaSlow[i]);
        const hh = this.highest(macd.filter(v => !isNaN(v)), cycleLen);
        const ll = this.lowest(macd.filter(v => !isNaN(v)), cycleLen);
        // Simplified STC as smoothed stoch of MACD
        const rawStoch = macd.map((m, i) => {
            const h = hh[Math.min(i, hh.length - 1)] || 1;
            const l = ll[Math.min(i, ll.length - 1)] || 0;
            return h === l ? 50 : (m - l) / (h - l) * 100;
        });
        const stc = this.ema(this.ema(rawStoch, cycleLen), cycleLen);
        return stc;
    },

    // ─── 18. Vortex Indicator ────────────────────────────────────────────────
    vortex(klines, period = 14) {
        const vmp = [], vmm = [], atr1 = [];
        for (let i = 1; i < klines.length; i++) {
            vmp.push(Math.abs(klines[i].high - klines[i - 1].low));
            vmm.push(Math.abs(klines[i].low  - klines[i - 1].high));
            atr1.push(Math.max(
                klines[i].high - klines[i].low,
                Math.abs(klines[i].high - klines[i - 1].close),
                Math.abs(klines[i].low  - klines[i - 1].close)
            ));
        }
        const vip = [], vim = [];
        for (let i = period - 1; i < vmp.length; i++) {
            const sv = atr1.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            vip.push(vmp.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / sv);
            vim.push(vmm.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / sv);
        }
        return { vip, vim };
    },

    // ─── 19. TEMA ─────────────────────────────────────────────────────────────
    tema(closes, period = 9) {
        const e1 = this.ema(closes, period);
        const e2 = this.ema(e1, period);
        const e3 = this.ema(e2, period);
        return e1.map((e, i) => 3 * e - 3 * e2[i] + e3[i]);
    },

    // ─── 20. Linear Regression Slope ─────────────────────────────────────────
    linearRegressionSlope(closes, period = 14) {
        return closes.map((_, i) => {
            if (i < period - 1) return null;
            const y = closes.slice(i - period + 1, i + 1);
            const n = period;
            const sumX = n * (n - 1) / 2;
            const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = y.reduce((a, b, j) => a + j * b, 0);
            const denom = n * sumX2 - sumX * sumX;
            return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
        });
    },

    // ─── 21. Parabolic SAR ────────────────────────────────────────────────────
    psar(klines, start = 0.02, increment = 0.02, max = 0.2) {
        const sar = [], dir = [];
        let isBull = true, af = start, ep = klines[0].low, sarVal = klines[0].high;
        for (let i = 0; i < klines.length; i++) {
            if (i === 0) { sar.push(sarVal); dir.push(1); continue; }
            const prevSar = sar[i - 1];
            if (isBull) {
                sarVal = prevSar + af * (ep - prevSar);
                sarVal = Math.min(sarVal, klines[Math.max(0, i - 1)].low, klines[Math.max(0, i - 2)].low);
                if (klines[i].low < sarVal) {
                    isBull = false; sarVal = ep; ep = klines[i].low; af = start;
                } else {
                    if (klines[i].high > ep) { ep = klines[i].high; af = Math.min(af + increment, max); }
                }
            } else {
                sarVal = prevSar + af * (ep - prevSar);
                sarVal = Math.max(sarVal, klines[Math.max(0, i - 1)].high, klines[Math.max(0, i - 2)].high);
                if (klines[i].high > sarVal) {
                    isBull = true; sarVal = ep; ep = klines[i].high; af = start;
                } else {
                    if (klines[i].low < ep) { ep = klines[i].low; af = Math.min(af + increment, max); }
                }
            }
            sar.push(sarVal);
            dir.push(isBull ? 1 : -1);
        }
        return { sar, dir };
    },

    // ─── 22. Elder Impulse System ─────────────────────────────────────────────
    elderImpulse(closes) {
        const ema13 = this.ema(closes, 13);
        const { histogram } = window.Indicators.macd(closes, 12, 26, 9);
        const color = ema13.map((e, i) => {
            if (i === 0) return 'gray';
            const emaUp   = e > ema13[i - 1];
            const histUp  = histogram[i] > histogram[i - 1];
            if (emaUp && histUp)   return 'green';   // bullish impulse
            if (!emaUp && !histUp) return 'red';     // bearish impulse
            return 'gray';                            // neutral
        });
        return { ema13, histogram, color };
    },

    // ─── 23. Waddah Attar Explosion (WAE) ────────────────────────────────────
    wae(closes, sensitivity = 150, fastLen = 20, slowLen = 40, bbLen = 20, bbMult = 2.0) {
        const fastEma = this.ema(closes, fastLen);
        const slowEma = this.ema(closes, slowLen);
        const macdLine = fastEma.map((f, i) => (f - slowEma[i]) * sensitivity);
        const t1 = macdLine.map((m, i) => i === 0 ? 0 : m - macdLine[i - 1]);
        const { upper, lower } = window.Indicators.bollingerBands(closes, bbLen, bbMult);
        const e1 = upper.map((u, i) => u !== null ? u - lower[i] : null);
        const deadzone = this.ema(
            closes.map((_, i) => i === 0 ? 0 : Math.max(
                closes[i] - closes[i-1], Math.abs(closes[i] - closes[i-1])
            )), 100
        ).map(v => v * 3.7);
        const trendUp   = t1.map(t => t >= 0 ? t : 0);
        const trendDown = t1.map(t => t < 0 ? -t : 0);
        return { trendUp, trendDown, e1, deadzone };
    },

    // ─── 24. B-Xtrender ───────────────────────────────────────────────────────
    bxtrender(closes, s1 = 5, s2 = 20, s3 = 15, l1 = 5, l2 = 10) {
        const shortTerm = window.Indicators.rsi(
            this.ema(closes, s1).map((e, i) => e - (this.ema(closes, s2)[i] || 0))
        .filter((_, i) => i > 0), s3).map(r => r - 50);
        const longTerm = window.Indicators.rsi(this.ema(closes, l1), l2).map(r => r - 50);
        return { shortTerm, longTerm };
    },

    // ─── 25. Bull Bear Power (from DIY) ─────────────────────────────────────
    bullBearPower(klines) {
        const closes = klines.map(k => k.close);
        const atr5 = this.atr(klines, 5);
        const lowest50  = this.lowest(klines.map(k => k.low), 50);
        const highest50 = this.highest(klines.map(k => k.high), 50);
        const bullTrend = closes.map((c, i) =>
            lowest50[i] === null || atr5[i] === 0 ? null : (c - lowest50[i]) / atr5[i]);
        const bearTrend = closes.map((c, i) =>
            highest50[i] === null || atr5[i] === 0 ? null : (highest50[i] - c) / atr5[i]);
        const trend = bullTrend.map((b, i) =>
            b !== null && bearTrend[i] !== null ? b - bearTrend[i] : null);
        return { bullTrend, bearTrend, trend };
    },

    // ─── 26. Detrended Price Oscillator (DPO) ────────────────────────────────
    dpo(closes, period = 10) {
        const back = Math.floor(period / 2) + 1;
        const smaArr = this.sma(closes, period);
        return closes.map((c, i) => {
            const smaIdx = i - back;
            if (smaIdx < 0 || smaArr[smaIdx] === null) return null;
            return c - smaArr[smaIdx];
        });
    },

    // ─── 27. Vegas Tunnel ────────────────────────────────────────────────────
    vegasTunnel(closes) {
        const ema12  = this.ema(closes, 12);
        const ema144 = this.ema(closes, 144);
        const ema169 = this.ema(closes, 169);
        return { ema12, ema144, ema169 };
    },

    // ─── 28. QQE Mod (simplified) ────────────────────────────────────────────
    qqeMod(closes, rsiLen = 14, sfLen = 5, qqeFactor = 4.238) {
        const rsiArr = window.Indicators.rsi(closes, rsiLen);
        const rsiMa  = this.ema(rsiArr.filter(v => v !== null), sfLen);
        const wilders = rsiMa.map((_, i) => {
            if (i === 0) return 0;
            const change = Math.abs(rsiMa[i] - rsiMa[i - 1]);
            return change;
        });
        const atrRsi = this.ema(wilders, rsiLen * 2 - 1);
        const dar    = atrRsi.map(v => v * qqeFactor);
        const qqeLine = rsiMa.map((r, i) => r - 50); // centered at 0
        return { qqeLine, rsiMa, dar };
    }
};

window.DIYIndicators = DIYIndicators;
