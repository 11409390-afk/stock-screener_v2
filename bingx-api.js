/**
 * BingX API Integration
 * Uses SWAP/Perpetual Futures API (no authentication required for public endpoints)
 * Includes CORS proxy for local file access
 */

const BingXAPI = {
    // API Configuration - Using SWAP API (more CORS-friendly)
    BASE_URL: 'https://open-api.bingx.com',

    // CORS Proxies for static web hosting
    CORS_PROXIES: [
        'http://localhost:8087/proxy?url=',
        'https://api.allorigins.win/raw?url=',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?',
        'https://proxy.cors.sh/'
    ],
    currentProxyIndex: 0,

    // Rate limiting
    lastRequestTime: 0,
    minRequestInterval: 300,

    // Cached symbols for search
    cachedSymbols: [],

    /**
     * Make API request with CORS proxy
     */
    async request(endpoint, params = {}) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await this.delay(this.minRequestInterval - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();

        // Build URL
        const originalUrl = new URL(this.BASE_URL + endpoint);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                originalUrl.searchParams.append(key, params[key]);
            }
        });

        // Add timestamp to bypass proxy and browser caching
        originalUrl.searchParams.append('_t', Date.now());

        let lastError = null;

        // 1. Try Direct Fetch first (in case CORS is enabled or user has an extension)
        try {
            console.log(`Trying direct fetch for ${endpoint}...`);
            const response = await fetch(originalUrl.toString(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.code !== undefined && data.code !== 0) {
                    throw new Error(`API Error ${data.code}: ${data.msg || 'Unknown'}`);
                }
                return data;
            }
        } catch (e) {
            console.log('Direct fetch failed, falling back to proxies...');
        }

        for (let attempt = 0; attempt < this.CORS_PROXIES.length; attempt++) {
            const proxyIndex = (this.currentProxyIndex + attempt) % this.CORS_PROXIES.length;
            const proxy = this.CORS_PROXIES[proxyIndex];
            const proxyUrl = proxy + encodeURIComponent(originalUrl.toString());

            try {
                console.log(`Trying proxy ${proxyIndex + 1}/${this.CORS_PROXIES.length}...`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-store',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.code !== undefined && data.code !== 0) {
                    throw new Error(`API Error ${data.code}: ${data.msg || 'Unknown'}`);
                }

                this.currentProxyIndex = proxyIndex;
                return data;

            } catch (error) {
                console.warn(`Proxy ${proxyIndex + 1} failed:`, error.message);
                lastError = error;
            }
        }

        console.error('All proxies failed:', lastError);
        throw new Error('API request failed. Try again later.');
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Get all SWAP contract symbols (no auth needed)
     */
    async getSymbols() {
        // Use SWAP API - /openApi/swap/v2/quote/contracts
        const data = await this.request('/openApi/swap/v2/quote/contracts');
        const contracts = data.data || [];

        // Transform to consistent format
        this.cachedSymbols = contracts.map(c => ({
            symbol: c.symbol,
            baseAsset: c.asset || c.symbol.replace('-USDT', ''),
            quoteAsset: 'USDT'
        }));

        return this.cachedSymbols;
    },

    /**
     * Get 24hr ticker for a symbol (SWAP API)
     */
    async get24hrTicker(symbol) {
        const data = await this.request('/openApi/swap/v2/quote/ticker', { symbol });
        const ticker = data.data;

        if (!ticker) return null;

        return {
            symbol: ticker.symbol,
            lastPrice: ticker.lastPrice,
            priceChangePercent: ticker.priceChangePercent,
            highPrice: ticker.highPrice,
            lowPrice: ticker.lowPrice,
            quoteVolume: ticker.quoteVolume || ticker.volume
        };
    },

    /**
     * Get 24hr tickers for all symbols
     */
    async getAll24hrTickers() {
        const data = await this.request('/openApi/swap/v2/quote/ticker');
        return (data.data || []).map(t => ({ ...t, industry: 'Crypto' }));
    },

    /**
     * Get candlestick/kline data (SWAP API)
     */
    async getKlines(symbol, interval = '1h', limit = 200) {
        // Map interval format for v2 API
        const intervalMap = {
            '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
            '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w', '1M': '1M',
            '1 Minute': '1m', '5 Minutes': '5m', '15 Minutes': '15m',
            '30 Minutes': '30m', '1 Hour': '1h', '4 Hours': '4h',
            '1 Day': '1d', '1 Week': '1w', '1 Month': '1M'
        };

        const mappedInterval = intervalMap[interval] || '1h';

        // Use v2 klines endpoint
        const data = await this.request('/openApi/swap/v2/quote/klines', {
            symbol,
            interval: mappedInterval,
            limit
        });

        const klines = data.data || [];

        // v2 API returns array format: [openTime, open, high, low, close, volume, closeTime, ...]
        // or object format depending on response
        return klines.map(k => {
            if (Array.isArray(k)) {
                return {
                    time: parseInt(k[0]),
                    open: parseFloat(k[1]),
                    high: parseFloat(k[2]),
                    low: parseFloat(k[3]),
                    close: parseFloat(k[4]),
                    volume: parseFloat(k[5])
                };
            } else {
                return {
                    time: k.time || k.openTime || k.t,
                    open: parseFloat(k.open || k.o),
                    high: parseFloat(k.high || k.h),
                    low: parseFloat(k.low || k.l),
                    close: parseFloat(k.close || k.c),
                    volume: parseFloat(k.volume || k.v || 0)
                };
            }
        });
    },

    /**
     * Search symbols (uses cached data)
     */
    searchSymbols(query) {
        if (!query || query.length < 1) return [];

        const q = query.toUpperCase();
        return this.cachedSymbols.filter(s =>
            s.symbol.toUpperCase().includes(q) ||
            s.baseAsset.toUpperCase().includes(q)
        ).slice(0, 15);
    },

    // Formatting utilities
    formatSymbol(symbol) {
        return symbol.replace('-', '/');
    },

    formatNumber(num, decimals = 2) {
        if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
        return num.toFixed(decimals);
    },

    formatPrice(price) {
        if (price >= 1000) return price.toFixed(2);
        if (price >= 1) return price.toFixed(4);
        if (price >= 0.0001) return price.toFixed(6);
        return price.toFixed(8);
    },

    formatPercent(value) {
        const sign = value >= 0 ? '+' : '';
        return sign + value.toFixed(2) + '%';
    }
};

window.BingXAPI = BingXAPI;
