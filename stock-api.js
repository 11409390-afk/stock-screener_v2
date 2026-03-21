/**
 * Taiwan Stock API Integration (TWSE & TPEx)
 * Adapts local stock data to match BingX API interface for the app.
 */

const StockAPI = {
    // Cache
    cachedSymbols: [],
    lastSymbolFetch: 0,
    CACHE_DURATION: 1000 * 60 * 5, // 5 minutes

    /**
     * Helper: Request with CORS handling
     * Note: TWSE/TPEx enable CORS, so direct fetch might work. 
     * If not, we fall back to proxies.
     */
    // CORS Proxies for static web hosting
    CORS_PROXIES: [
        'http://localhost:8087/proxy?url=',       // 1. Instant local proxy (Dev / 2026 bypass)
        'https://api.allorigins.win/raw?url=',    // 2. Best for large payloads online
        'https://corsproxy.io/?',                 // 3. Online Fallback
        'https://thingproxy.freeboard.io/fetch/', // 4. Online Fallback
        'https://api.codetabs.com/v1/proxy?quest='// 5. Online Fallback
    ],

    /**
     * Request with robust CORS handling and proxy rotation
     */
    async request(url) {
        // 1. Try Direct Fetch (some APIs might allow it)
        try {
            const response = await fetch(url);
            if (response.ok) return await response.json();
            // If CORS error, it usually throws TypeError, so we catch it below.
            // If 4xx/5xx, we might throw or try proxy? Usually 4xx is real error.
            if (response.status >= 400 && response.status !== 403) {
                // 403 might be simple blocking, 404 is real.
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (e) {
            console.log(`Direct fetch failed for ${url}, trying proxies...`);
        }

        // 2. Try Proxies
        let lastError = null;
        
        // Append timestamp to prevent proxy caching
        const targetUrl = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();

        for (const proxy of this.CORS_PROXIES) {
            try {
                const proxyUrl = proxy + encodeURIComponent(targetUrl);
                // Only log public proxies to keep console clean, skip logging localhost
                if (!proxy.includes('localhost')) console.log(`Trying proxy: ${proxy}`);
                const response = await fetch(proxyUrl, {
                    cache: 'no-store'
                });

                if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);

                return await response.json();
            } catch (error) {
                // Don't clutter console if localhost isn't running
                if (!proxy.includes('localhost')) console.warn(`Proxy ${proxy} failed:`, error.message);
                lastError = error;
            }
        }

        throw new Error(`All proxies failed. Last error: ${lastError?.message}`);
    },

    /**
     * Get all listed stocks from TWSE and TPEx
     */
    async getSymbols(boardType = 'MAINBOARD') {
        try {
            let endpoints = [];
            
            if (boardType === 'MAINBOARD') {
                endpoints = [
                    { url: 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL', type: 'TWSE' },
                    { url: 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes', type: 'TPEx' }
                ];
            } else if (boardType === 'EMERGING') {
                endpoints = [{ url: 'https://www.tpex.org.tw/openapi/v1/tpex_emg_daily_avg_quotes', type: 'TPEx' }];
            } else if (boardType === 'WARRANTS') {
                endpoints = [{ url: 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_warrant_daily_close_quotes', type: 'TPEx' }];
            } else if (boardType === 'BONDS') {
                endpoints = [{ url: 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_cb_daily_close_quotes', type: 'TPEx' }];
            }
            
            const symbols = [];

            // Fetch endpoints sequentially with a slight delay to prevent free proxies 
            // from rate-limiting or blocking concurrent requests (fixes the 1343 limit)
            const results = [];
            for (const ep of endpoints) {
                try {
                    const data = await this.request(ep.url);
                    results.push({ status: 'fulfilled', value: { data, type: ep.type } });
                } catch (e) {
                    results.push({ status: 'rejected', reason: e });
                }
                await this.delay(2000); // 2000ms safe delay for public proxies to avoid 429/502 blocks
            }

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.data) {
                    const { data, type } = result.value;
                    
                    // Handle both direct arrays and nested structures from various APIs
                    const dataList = Array.isArray(data) ? data : (data.data || data.aaData || Object.values(data)[0] || []);
                    let count = 0;

                    if (Array.isArray(dataList)) {
                        dataList.forEach(item => {
                            // Safely extract names/codes regardless of which TWSE/TPEx board it is
                            const symbol = item.Code || item.SecuritiesCompanyCode || item.WarrantCode || item.BondCode;
                            const name = item.Name || item.CompanyName || item.WarrantName || item.BondName;
                            
                            if (symbol) {
                                symbols.push({
                                    symbol: String(symbol).trim(),
                                    baseAsset: String(name).trim(),
                                    quoteAsset: 'TWD',
                                    raw: { ...item, type }
                                });
                                count++;
                            }
                        });
                    }
                    console.log(`[StockAPI] Successfully loaded ${count} symbols for ${type}`);
                } else if (result.status === 'rejected') {
                    console.warn('One of the TWSE/TPEx boards failed to load:', result.reason);
                }
            });

            // As long as we successfully grabbed at least some data, continue
            if (symbols.length > 100) {
                this.cachedSymbols = symbols;
                return symbols;
            } else {
                throw new Error("Could not fetch full stock list.");
            }
            
        } catch (error) {
            console.error('TWSE/TPEx list fetch failed completely.', error);
            throw new Error('Failed to fetch the stock directory from Taiwan Exchanges.');
        }
    },

    /**
     * Get Ticker via Yahoo Finance Quote API
     */
    async get24hrTicker(symbol) {
        if (this.cachedSymbols.length === 0) {
            await this.getSymbols();
        }

        const stock = this.cachedSymbols.find(s => s.symbol === symbol);
        const type = stock ? stock.raw.type : 'TWSE'; // Default to TWSE
        const yahooSymbol = type === 'TWSE' ? `${symbol}.TW` : `${symbol}.TWO`;

        try {
            // Fetch live/delayed quote from Yahoo Finance
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbol}`;
            const res = await this.request(url);
            
            if (!res.quoteResponse || !res.quoteResponse.result || res.quoteResponse.result.length === 0) {
                throw new Error("No quote data returned");
            }

            const quote = res.quoteResponse.result[0];

            return {
                symbol: symbol,
                lastPrice: quote.regularMarketPrice || 0,
                priceChangePercent: quote.regularMarketChangePercent || 0,
                highPrice: quote.regularMarketDayHigh || 0,
                lowPrice: quote.regularMarketDayLow || 0,
                quoteVolume: quote.regularMarketVolume || 0,
                volume: quote.regularMarketVolume || 0
            };
        } catch (e) {
            console.warn(`Failed to fetch live quote for ${symbol}`, e);
            return null;
        }
    },

    async getAll24hrTickers() {
        if (this.cachedSymbols.length === 0) {
            await this.getSymbols();
        }

        // If we have TWSE/TPEx raw data (2000+ stocks), use it for the screener.
        // Yahoo Finance restricts URL lengths, so we can't request 2000 quotes at once.
        if (this.cachedSymbols.length > 100 && this.cachedSymbols[0].raw.ClosingPrice) {
            return this.cachedSymbols.map(stock => {
                const r = stock.raw;
                const close = parseFloat(r.ClosingPrice || 0);
                const change = parseFloat(r.Change || 0);
                const prevClose = close - change;
                
                return {
                    symbol: stock.symbol,
                    lastPrice: close,
                    priceChangePercent: prevClose !== 0 ? (change / prevClose) * 100 : 0,
                    highPrice: parseFloat(r.HighestPrice || 0),
                    lowPrice: parseFloat(r.LowestPrice || 0),
                    quoteVolume: parseFloat(r.TradeVolume || r.TradeAmount || 0)
                };
            });
        } else {
            // Fallback: Batch request the Top Stocks from Yahoo
            const symbolsList = this.cachedSymbols.map(s => s.raw.type === 'TWSE' ? `${s.symbol}.TW` : `${s.symbol}.TWO`).join(',');
            try {
                const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsList}`;
                const res = await this.request(url);
                if (!res.quoteResponse || !res.quoteResponse.result) return [];
                return res.quoteResponse.result.map(quote => ({
                    symbol: quote.symbol.replace('.TW', '').replace('.TWO', ''),
                    lastPrice: quote.regularMarketPrice || 0,
                    priceChangePercent: quote.regularMarketChangePercent || 0,
                    quoteVolume: quote.regularMarketVolume || 0
                }));
            } catch (e) { return []; }
        }
    },

    /**
     * Get Historical Data (Klines)
     * Fetches monthly data from TWSE/TPEx and stitches it.
     */
    async getKlines(symbol, interval, limit = 200) {
        // Determine type (TWSE or TPEx)
        if (this.cachedSymbols.length === 0) await this.getSymbols();
        const stock = this.cachedSymbols.find(s => s.symbol === symbol);
        const type = stock ? stock.raw.type : 'TWSE'; // Default to TWSE if unknown

        // Format symbol for Yahoo Finance (2330.TW for TWSE, XXXX.TWO for TPEx)
        const yahooSymbol = type === 'TWSE' ? `${symbol}.TW` : `${symbol}.TWO`;

        // Map BingX intervals to Yahoo Finance intervals
        const intervalMap = {
            '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
            '1h': '60m', '4h': '1d', // Yahoo doesn't perfectly support 4h, default to daily
            '1d': '1d', '1w': '1wk'
        };
        
        const yInterval = intervalMap[interval] || '1d';
        
        // Define range based on interval (Intraday is limited to 1 month on Yahoo)
        let range = '1y'; 
        if (['1m', '5m', '15m', '30m', '60m'].includes(yInterval)) range = '1mo';
        else if (yInterval === '1wk') range = '5y';

        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${yInterval}&range=${range}`;
            const res = await this.request(url);

            if (!res.chart || !res.chart.result || res.chart.result.length === 0) {
                throw new Error("No data returned from Yahoo Finance");
            }

            const result = res.chart.result[0];
            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];

            if (!timestamps || !quote) return [];

            const klines = [];
            for (let i = 0; i < timestamps.length; i++) {
                // Skip null values (common during market halts or holidays)
                if (quote.close[i] === null) continue;

                klines.push({
                    time: timestamps[i] * 1000, // Convert unix seconds to ms
                    open: quote.open[i],
                    high: quote.high[i],
                    low: quote.low[i],
                    close: quote.close[i],
                    volume: quote.volume[i] || 0
                });
            }

            // Return the requested limit of candles
            return klines.slice(-limit);

        } catch (e) {
            console.warn(`Failed to fetch klines for ${symbol} via Yahoo Finance`, e);
            throw e;
        }
    },

    // Search
    searchSymbols(query) {
        if (!query) return [];
        const q = query.toUpperCase();
        return this.cachedSymbols.filter(s =>
            String(s.symbol).toUpperCase().includes(q) ||
            (s.baseAsset && String(s.baseAsset).toUpperCase().includes(q))
        ).slice(0, 15);
    },

    // Formatter
    formatSymbol(symbol) {
        const s = this.cachedSymbols.find(x => x.symbol === symbol);
        return s ? `${s.symbol} ${s.baseAsset}` : symbol;
    },

    formatPrice(price) {
        return price.toFixed(2);
    },

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(0);
    },

    formatPercent(val) {
        return (val >= 0 ? '+' : '') + val.toFixed(2) + '%';
    },

    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
};

window.StockAPI = StockAPI;
