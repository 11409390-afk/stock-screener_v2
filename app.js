/**
 * Crypto Selector - Main Application Controller
 * Connects UI, BingX API, and Trading Strategies
 */

class CryptoSelectorApp {
    constructor() {
        // State
        this.symbols = [];
        this.selectedSymbol = null;
        this.selectedStrategies = new Set();
        this.klineData = null;
        this.tickerData = null;
        this.analysisResult = null;  // Store last analysis result
        this.isLoading = false;

        // Multi-API Support
        this.currentSource = 'CRYPTO'; // 'CRYPTO' or 'STOCK'
        this.currentAPI = BingXAPI; // Default

        // DOM Elements
        this.elements = {};
        this.searchTimeout = null;

        // Initialize
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.renderStrategies();
        this.showToast('Welcome! Click "Load Markets" to start.', 'info');
    }

    cacheElements() {
        this.elements = {
            // Controls
            marketSource: document.getElementById('marketSource'),
            stockTypeGroup: document.getElementById('stockTypeGroup'),
            stockType: document.getElementById('stockType'),
            loadMarketsBtn: document.getElementById('loadMarketsBtn'),
            symbolSearch: document.getElementById('symbolSearch'),
            searchResults: document.getElementById('searchResults'),
            symbolSelect: document.getElementById('symbolSelect'),
            timeframe: document.getElementById('timeframe'),
            selectAllBtn: document.getElementById('selectAllBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),

            // Analysis
            analyzeBtn: document.getElementById('analyzeBtn'),
            viewChartBtn: document.getElementById('viewChartBtn'),
            screenAllBtn: document.getElementById('screenAllBtn'),
            exportBtn: document.getElementById('exportBtn'),
            backtestBtn: document.getElementById('backtestBtn'),

            // Backtest Modal
            backtestModal: document.getElementById('backtestModal'),
            backtestTitle: document.getElementById('backtestTitle'),
            closeBacktestBtn: document.getElementById('closeBacktestBtn'),
            btWinRate: document.getElementById('btWinRate'),
            btTrades: document.getElementById('btTrades'),
            btPnl: document.getElementById('btPnl'),
            backtestTradesList: document.getElementById('backtestTradesList'),

            // Display
            connectionStatus: document.getElementById('connectionStatus'),
            strategiesGrid: document.getElementById('strategiesGrid'),

            // Results
            currentSymbol: document.getElementById('currentSymbol'),
            currentPrice: document.getElementById('currentPrice'),
            priceChange: document.getElementById('priceChange'),
            volume24h: document.getElementById('volume24h'),
            high24h: document.getElementById('high24h'),
            low24h: document.getElementById('low24h'),

            // Signals
            signalsGrid: document.getElementById('signalsGrid'),
            signalSummary: document.getElementById('signalSummary'),

            // Score
            overallScore: document.getElementById('overallScore'),
            scoreLabel: document.getElementById('scoreLabel'),
            gaugeFill: document.getElementById('gaugeFill'),
            recommendation: document.getElementById('recommendation'),

            // Screening
            screeningResults: document.getElementById('screeningResults'),
            screeningTableBody: document.getElementById('screeningTableBody'),

            // Loading
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText'),

            // Toast
            toastContainer: document.getElementById('toastContainer')
        };
    }

    bindEvents() {
        // Backtest handlers
        if (this.elements.backtestBtn) {
            this.elements.backtestBtn.addEventListener('click', () => this.handleBacktest());
        }
        if (this.elements.closeBacktestBtn) {
            this.elements.closeBacktestBtn.addEventListener('click', () => {
                this.elements.backtestModal.classList.remove('active');
            });
        }
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.backtestModal) {
                this.elements.backtestModal.classList.remove('active');
            }
        });

        // Load markets
        if (this.elements.loadMarketsBtn) {
            this.elements.loadMarketsBtn.addEventListener('click', () => this.loadMarkets());
        }

        // Market Source Change
        if (this.elements.marketSource) {
            this.elements.marketSource.addEventListener('change', (e) => this.handleSourceChange(e.target.value));
        }

        // Market Board Change (TW Stock specific)
        // Removed auto-load on change to prevent unwanted API requests

        // Refresh Button - Reset page to default state
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.resetPage());
        }

        // Symbol search
        this.elements.symbolSearch.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.handleSearch(e.target.value), 200);
        });
        this.elements.symbolSearch.addEventListener('focus', (e) => {
            this.handleSearch(e.target.value);
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.control-group')) {
                this.hideSearchResults();
            }
        });

        // Symbol select
        this.elements.symbolSelect.addEventListener('change', (e) => {
            this.selectedSymbol = e.target.value;
            // Sync the text input to match what was selected in the dropbox
            this.elements.symbolSearch.value = this.currentAPI.formatSymbol(e.target.value);
            this.hideSearchResults();
            this.updateAnalyzeButton();
        });

        // Strategy selection
        this.elements.selectAllBtn.addEventListener('click', () => this.selectAllStrategies());
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllStrategies());

        // Analysis
        this.elements.analyzeBtn.addEventListener('click', () => this.analyze());
        this.elements.viewChartBtn.addEventListener('click', () => this.openChart());
        this.elements.screenAllBtn.addEventListener('click', () => this.screenAll());
        this.elements.exportBtn.addEventListener('click', () => this.exportResults());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterResults(e.target.dataset.filter));
        });

        // Load saved strategy parameters
        Strategies.loadFromStorage();
    }

    // Open chart modal
    // Open chart modal
    async openChart() {
        if (!this.selectedSymbol) {
            this.showToast('Please select a trading pair first', 'warning');
            return;
        }
        const timeframe = this.elements.timeframe.value;
        const strategies = Array.from(this.selectedStrategies);
        await ChartManager.open(this.selectedSymbol, timeframe, strategies, this.currentAPI);

        // Restore signals if available
        if (this.currentSignals && this.currentSignals.length > 0) {
            ChartManager.addSignalMarkers(this.currentSignals);
        }
    }

    // ========== Market Loading ==========

    async handleSourceChange(source) {
        this.currentSource = source;
        this.currentAPI = source === 'STOCK' ? StockAPI : BingXAPI;

        // Reset and reload
        this.resetPage();
        this.symbols = []; // Clear cached symbols of previous source
        this.elements.symbolSearch.value = '';
        this.elements.symbolSearch.placeholder = 'Search...';

        // Toggle Market Board Sub-menu visibility
        this.elements.stockTypeGroup.style.display = source === 'STOCK' ? 'flex' : 'none';

        // Clear select options
        this.elements.symbolSelect.innerHTML = '';

        this.showToast(`Switched to ${source === 'STOCK' ? 'Taiwan Stock' : 'Crypto'} mode. Click 'Load Markets' to start.`, 'info');
    }

    async loadMarkets() {
        this.showLoading(`Fetching ${this.currentSource === 'STOCK' ? 'Stock' : 'Crypto'} markets...`);

        try {
            const filterOption = this.currentSource === 'STOCK' ? this.elements.stockType.value : null;
            this.symbols = await this.currentAPI.getSymbols(filterOption);

            if (this.symbols.length === 0) {
                throw new Error('No symbols returned from API');
            }

            // Sort alphabetically
            this.symbols.sort((a, b) => a.symbol.localeCompare(b.symbol));

            // Update placeholder to indicate ready state
            this.elements.symbolSearch.placeholder = `Type to search ${this.symbols.length} pairs (e.g., ETH, BTC...)`;

            // Clear the hidden select box entirely so it doesn't freeze the browser
            // with 15,000 hidden HTML elements!
            this.elements.symbolSelect.innerHTML = '';

            this.elements.connectionStatus.textContent = 'Connected';
            this.elements.connectionStatus.classList.add('connected');

            this.showToast(`Loaded ${this.symbols.length} pairs successfully!`, 'success');
            
            this.updateAnalyzeButton();

        } catch (error) {
            console.error('Failed to load markets:', error);
            this.showToast('Failed to load markets. Check console for details.', 'error');
            this.elements.connectionStatus.textContent = 'Error';
        }

        this.hideLoading();
    }

    // ========== Reset Page to Default ==========
    resetPage() {
        // Clear selections
        this.selectedSymbol = null;
        this.selectedStrategies.clear();
        this.klineData = null;
        this.tickerData = null;
        this.analysisResult = null;
        this.currentSignals = [];

        // Clear UI elements
        this.elements.symbolSearch.value = '';
        this.elements.symbolSearch.placeholder = 'Search or select pair (e.g., ETH, BTC...)';
        this.elements.searchResults.innerHTML = '';
        this.hideSearchResults();

        // Deselect all strategy cards
        document.querySelectorAll('.strategy-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Reset results display
        this.elements.currentSymbol.textContent = '--';
        this.elements.currentPrice.textContent = '--';
        this.elements.priceChange.textContent = '--';
        this.elements.volume24h.textContent = '--';
        this.elements.high24h.textContent = '--';
        this.elements.low24h.textContent = '--';
        this.elements.signalsGrid.innerHTML = '<div class="empty-state"><span>📊</span><p>Select strategies and click Analyze to see signals</p></div>';
        this.elements.signalSummary.innerHTML = '<span class="buy-count">0 Buy</span><span class="sell-count">0 Sell</span><span class="neutral-count">0 Neutral</span>';
        this.elements.overallScore.textContent = '--';
        this.elements.scoreLabel.textContent = 'No Analysis';
        this.elements.recommendation.innerHTML = '<span class="rec-icon">💡</span><p>Run analysis to see recommendation</p>';

        // Reset connection status
        this.elements.connectionStatus.textContent = 'Disconnected';
        this.elements.connectionStatus.classList.remove('connected');

        // Clear chart
        ChartManager.clearIndicators();

        // Update button states
        this.updateAnalyzeButton();

        this.showToast('Page reset to default', 'success');
    }

    // ========== Search ==========

    handleSearch(query) {
        // Clear previous results
        this.elements.searchResults.innerHTML = '';

        // Check if we have symbols loaded
        if (this.symbols.length === 0) {
            const noDataItem = document.createElement('div');
            noDataItem.className = 'search-result-item';
            noDataItem.innerHTML = '<span style="color: #888;">Click "Load Markets" first</span>';
            this.elements.searchResults.appendChild(noDataItem);
            this.elements.searchResults.classList.add('active');
            return;
        }

        let filtered = [];
        
        // If the query is empty (user just clicked the box), show the top 100 choices immediately
        if (!query || query.trim() === '') {
            filtered = this.symbols.slice(0, 100);
        } else {
            // Use API's search method
            filtered = this.currentAPI.searchSymbols(query);
            
            // Sort exact symbol matches to the top
            filtered.sort((a, b) => {
                const q = query.toUpperCase();
                const aExact = a.symbol.toUpperCase() === q;
                const bExact = b.symbol.toUpperCase() === q;
                return (aExact === bExact) ? 0 : aExact ? -1 : 1;
            });
        }

        // Enforce a hard limit to prevent the UI from freezing when rendering the results
        const displayLimit = Math.min(filtered.length, 100);

        if (displayLimit === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'search-result-item';
            noResults.innerHTML = '<span style="color: #888;">No matches found</span>';
            this.elements.searchResults.appendChild(noResults);
        } else {
            for (let i = 0; i < displayLimit; i++) {
                const s = filtered[i];
                const item = document.createElement('div');
                item.className = 'search-result-item';
                const displaySymbol = this.currentAPI.formatSymbol(s.symbol);
                item.innerHTML = `
                    <span><strong>${displaySymbol}</strong></span>
                `;
                item.addEventListener('click', () => {
                    // Select value
                    this.elements.symbolSelect.value = s.symbol;
                    this.selectedSymbol = s.symbol;
                    this.elements.symbolSearch.value = displaySymbol;
                    this.hideSearchResults();
                    this.updateAnalyzeButton();
                    this.showToast(`Selected: ${displaySymbol}`, 'success');
                });
                this.elements.searchResults.appendChild(item);
            }
        }

        // Always show results when there's a query
        this.elements.searchResults.classList.add('active');
    }

    showSearchResults() {
        if (this.elements.searchResults.children.length > 0) {
            this.elements.searchResults.classList.add('active');
        }
    }

    hideSearchResults() {
        this.elements.searchResults.classList.remove('active');
    }

    // ========== Strategies ==========

    renderStrategies() {
        this.elements.strategiesGrid.innerHTML = '';

        Strategies.definitions.forEach(strategy => {
            const card = document.createElement('div');
            card.className = 'strategy-card';
            card.dataset.id = strategy.id;

            let typeClass = '';
            switch (strategy.type) {
                case 'momentum': typeClass = 'momentum'; break;
                case 'trend': typeClass = 'trend'; break;
                case 'volatility': typeClass = 'volatility'; break;
                default: typeClass = '';
            }

            // Build parameter sliders HTML
            let paramsHtml = '';
            if (strategy.paramConfig) {
                const currentParams = Strategies.getParams(strategy.id);
                paramsHtml = '<div class="strategy-params">';
                for (const [key, config] of Object.entries(strategy.paramConfig)) {
                    const value = currentParams[key] ?? config.default;
                    paramsHtml += `
                        <div class="param-row">
                            <span class="param-label">${config.label}</span>
                            <div class="param-slider-container">
                                <input type="range" 
                                    class="param-slider" 
                                    data-strategy="${strategy.id}" 
                                    data-param="${key}"
                                    min="${config.min}" 
                                    max="${config.max}" 
                                    step="${config.step}" 
                                    value="${value}">
                                <span class="param-value">${value}</span>
                            </div>
                        </div>
                    `;
                }
                paramsHtml += `<button class="param-reset-btn" data-strategy="${strategy.id}">Reset to Default</button>`;
                paramsHtml += '</div>';
            }

            card.innerHTML = `
                <div class="strategy-header">
                    <span class="strategy-name">${strategy.name}</span>
                    <span class="strategy-type ${typeClass}">${strategy.type.replace('_', ' ')}</span>
                </div>
                <p class="strategy-description">${strategy.description}</p>
                <div class="strategy-checkbox"></div>
                ${strategy.paramConfig ? '<button class="strategy-settings-btn" title="Adjust Parameters">⚙️</button>' : ''}
                ${paramsHtml}
            `;

            // Toggle selection on card click (but not on settings button or sliders)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.strategy-settings-btn') &&
                    !e.target.closest('.strategy-params') &&
                    !e.target.closest('.param-reset-btn')) {
                    this.toggleStrategy(strategy.id, card);
                }
            });

            this.elements.strategiesGrid.appendChild(card);
        });

        // Bind settings button events
        this.bindStrategyParamEvents();
    }

    bindStrategyParamEvents() {
        // Settings button toggle
        document.querySelectorAll('.strategy-settings-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.strategy-card');
                card.classList.toggle('params-open');
            });
        });

        // Parameter sliders
        document.querySelectorAll('.param-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                e.stopPropagation();
                const strategyId = slider.dataset.strategy;
                const paramKey = slider.dataset.param;
                const value = parseFloat(slider.value);

                // Update display
                slider.nextElementSibling.textContent = value;

                // Save to Strategies
                Strategies.setParams(strategyId, { [paramKey]: value });
            });

            slider.addEventListener('click', (e) => e.stopPropagation());
        });

        // Reset buttons
        document.querySelectorAll('.param-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const strategyId = btn.dataset.strategy;
                Strategies.resetParams(strategyId);

                // Re-render to update slider values
                this.renderStrategies();
                this.showToast('Parameters reset to defaults', 'success');
            });
        });
    }

    toggleStrategy(id, card) {
        if (this.selectedStrategies.has(id)) {
            this.selectedStrategies.delete(id);
            card.classList.remove('selected');
        } else {
            this.selectedStrategies.add(id);
            card.classList.add('selected');
        }
        this.updateAnalyzeButton();
    }

    selectAllStrategies() {
        document.querySelectorAll('.strategy-card').forEach(card => {
            card.classList.add('selected');
            this.selectedStrategies.add(card.dataset.id);
        });
        this.updateAnalyzeButton();
    }

    clearAllStrategies() {
        document.querySelectorAll('.strategy-card').forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedStrategies.clear();
        this.updateAnalyzeButton();
        ChartManager.clearIndicators();
    }

    updateAnalyzeButton() {
        const hasSymbol = !!this.selectedSymbol;
        const hasStrategies = this.selectedStrategies.size > 0;
        const hasSymbols = this.symbols.length > 0;

        this.elements.analyzeBtn.disabled = !(hasSymbol && hasStrategies);
        this.elements.viewChartBtn.disabled = !hasSymbol;
        this.elements.screenAllBtn.disabled = !(hasSymbols && hasStrategies);
        this.elements.exportBtn.disabled = !this.analysisResult && !this.screeningData; // Enable after analysis or screening

        if (this.elements.backtestBtn) {
            this.elements.backtestBtn.disabled = !(hasSymbol && hasStrategies);
        }
    }

    // ========== Analysis ==========

    async handleBacktest() {
        if (!this.selectedSymbol || this.selectedStrategies.size === 0) {
            this.showToast('Select a symbol and at least one strategy', 'error');
            return;
        }

        const strategyIds = Array.from(this.selectedStrategies);
        this.showLoading('Running Combined Backtest...');

        try {
            const timeframe = this.elements.timeframe.value;
            // Max candles for BingX API (limit is 1440)
            const limit = 1440;
            const klines = await this.currentAPI.getKlines(this.selectedSymbol, timeframe, limit);

            if (!klines || klines.length < 50) throw new Error('Not enough data');

            // Use combined backtest for unified results (require 2+ strategies to agree)
            const confirmThreshold = Math.min(2, strategyIds.length);
            const results = Strategies.combinedBacktest(strategyIds, klines, confirmThreshold);

            if (results.error) throw new Error(results.error);

            // Render Results Summary
            this.elements.btWinRate.textContent = results.winRate + '%';
            this.elements.btTrades.textContent = results.totalTrades;
            this.elements.btPnl.textContent = results.pnl;

            // Render Table
            const tbody = this.elements.backtestTradesList;
            tbody.innerHTML = '';

            // Add info header
            const infoRow = document.createElement('tr');
            infoRow.innerHTML = `
                <td colspan="4" style="background: rgba(99,102,241,0.1); padding: 10px; font-weight: bold;">
                    Combined Backtest (${strategyIds.length} strategies, require ${confirmThreshold}+ to agree)
                </td>
            `;
            tbody.appendChild(infoRow);

            // Add trades (most recent first)
            results.trades.slice().reverse().forEach(trade => {
                const tr = document.createElement('tr');
                const date = new Date(trade.time).toLocaleString();
                const pnlClass = trade.pnl > 0 ? 'trade-win' : (trade.pnl < 0 ? 'trade-loss' : '');
                const pnlText = trade.pnl ? (trade.pnl * 100).toFixed(2) + '%' : '-';

                tr.innerHTML = `
                    <td>${trade.type.toUpperCase()}</td>
                    <td>${date}</td>
                    <td>${trade.price.toFixed(4)}</td>
                    <td class="${pnlClass}">${pnlText}</td>
                `;
                tbody.appendChild(tr);
            });

            this.elements.backtestTitle.textContent = `Combined Backtest Results`;
            this.elements.backtestModal.classList.add('active');

        } catch (e) {
            console.error(e);
            this.showToast('Backtest failed: ' + e.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async analyze() {
        if (!this.selectedSymbol || this.selectedStrategies.size === 0) {
            this.showToast('Please select a symbol and at least one strategy', 'error');
            return;
        }

        this.showLoading('Fetching market data...');

        try {
            // Fetch kline data
            const timeframe = this.elements.timeframe.value;
            this.klineData = await this.currentAPI.getKlines(this.selectedSymbol, timeframe, 200);

            if (!this.klineData || this.klineData.length === 0) {
                throw new Error('No kline data returned');
            }

            // Fetch ticker data
            this.tickerData = await this.currentAPI.get24hrTicker(this.selectedSymbol);

            this.showLoading('Running strategy analysis...');

            // Run analysis
            const strategies = Array.from(this.selectedStrategies);
            const results = Strategies.analyzeAll(this.klineData, strategies);
            const overall = Strategies.calculateOverallScore(results);

            // Update UI
            // Store analysis result for export
            this.analysisResult = {
                symbol: this.selectedSymbol,
                timeframe: timeframe,
                ticker: this.tickerData,
                strategies: results,
                overall: overall,
                timestamp: new Date().toISOString()
            };

            this.updateMarketOverview();
            this.renderSignals(results);
            this.renderScore(overall);

            this.elements.exportBtn.disabled = false;

            // Generate and display historical signal markers
            const allSignals = [];
            strategies.forEach(strategyId => {
                try {
                    const history = Strategies.backtest(strategyId, this.klineData);
                    if (history && history.trades) {
                        history.trades.forEach(trade => {
                            let type = null;
                            const t = trade.type.toLowerCase();

                            // Map trade types to buy/sell signals
                            if (t.includes('open_long') || t.includes('close_short')) {
                                type = 'buy';
                            } else if (t.includes('open_short') || t.includes('close_long')) {
                                type = 'sell';
                            }

                            if (type) {
                                allSignals.push({
                                    time: Math.floor(trade.time / 1000),
                                    type: type,
                                    strategy: strategyId
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to generate markers for ${strategyId}:`, e);
                }
            });

            // Sort by time
            allSignals.sort((a, b) => a.time - b.time);
            this.currentSignals = allSignals; // Store for chart reopening
            ChartManager.addSignalMarkers(allSignals);

            this.showToast('Analysis complete!', 'success');

        } catch (error) {
            console.error('Analysis failed:', error);
            this.showToast(`Analysis failed: ${error.message}`, 'error');
        }

        this.hideLoading();
    }

    updateMarketOverview() {
        this.elements.currentSymbol.textContent = this.currentAPI.formatSymbol(this.selectedSymbol);

        if (this.tickerData) {
            const price = parseFloat(this.tickerData.lastPrice || this.tickerData.c || 0);
            const change = parseFloat(this.tickerData.priceChangePercent || this.tickerData.P || 0);
            const volume = parseFloat(this.tickerData.quoteVolume || this.tickerData.qv || 0);
            const high = parseFloat(this.tickerData.highPrice || this.tickerData.h || 0);
            const low = parseFloat(this.tickerData.lowPrice || this.tickerData.l || 0);

            this.elements.currentPrice.textContent = '$' + this.currentAPI.formatPrice(price);
            this.elements.priceChange.textContent = this.currentAPI.formatPercent(change);
            this.elements.priceChange.className = 'stat-value ' + (change >= 0 ? 'positive' : 'negative');
            this.elements.volume24h.textContent = '$' + this.currentAPI.formatNumber(volume);
            this.elements.high24h.textContent = '$' + this.currentAPI.formatPrice(high);
            this.elements.low24h.textContent = '$' + this.currentAPI.formatPrice(low);
        }
    }

    renderSignals(results) {
        this.elements.signalsGrid.innerHTML = '';

        let buyCount = 0, sellCount = 0, neutralCount = 0;

        results.forEach(result => {
            const strategy = Strategies.definitions.find(s => s.id === result.strategyId);

            const card = document.createElement('div');
            card.className = `signal-card ${result.signal}`;
            card.innerHTML = `
                <div class="signal-header">
                    <span class="signal-name">${strategy?.name || result.strategyId}</span>
                    <span class="signal-badge ${result.signal}">${result.signal.toUpperCase()}</span>
                </div>
                <div class="signal-details">
                    <p>${result.details}</p>
                    <p>Strength: <span class="signal-value">${(result.strength * 100).toFixed(0)}%</span></p>
                </div>
            `;
            this.elements.signalsGrid.appendChild(card);

            if (result.signal === 'buy') buyCount++;
            else if (result.signal === 'sell') sellCount++;
            else neutralCount++;
        });

        // Update summary
        this.elements.signalSummary.innerHTML = `
            <span class="buy-count">${buyCount} Buy</span>
            <span class="sell-count">${sellCount} Sell</span>
            <span class="neutral-count">${neutralCount} Neutral</span>
        `;
    }

    renderScore(overall) {
        this.elements.overallScore.textContent = overall.score;

        // Update gauge
        const percentage = overall.score / 100;
        const dashOffset = 251 - (251 * percentage);
        this.elements.gaugeFill.style.strokeDashoffset = dashOffset;

        // Color based on score
        let color;
        if (overall.score >= 60) color = '#10b981';
        else if (overall.score <= 40) color = '#ef4444';
        else color = '#f59e0b';
        this.elements.gaugeFill.style.stroke = color;

        // Label
        this.elements.scoreLabel.textContent = overall.signal.toUpperCase();
        this.elements.scoreLabel.style.color = color;

        // Recommendation
        this.elements.recommendation.innerHTML = `
            <span class="rec-icon">${overall.signal === 'buy' ? '📈' : overall.signal === 'sell' ? '📉' : '⚖️'}</span>
            <p>${overall.recommendation}</p>
        `;
    }

    // ========== Screening ==========

    async screenAll() {
        if (this.selectedStrategies.size === 0) {
            this.showToast('Please select at least one strategy', 'error');
            return;
        }

        this.showLoading('Screening top coins...');

        try {
            // Get all tickers
            const tickers = await this.currentAPI.getAll24hrTickers();

            // Filter and sort by volume
            const topSymbols = tickers
                .filter(t => t.symbol && (this.currentSource === 'STOCK' || t.symbol.endsWith('-USDT')))
                .sort((a, b) => parseFloat(b.quoteVolume || 0) - parseFloat(a.quoteVolume || 0))
                .slice(0, 50);

            const results = [];
            const timeframe = this.elements.timeframe.value;

            for (let i = 0; i < topSymbols.length; i++) {
                const ticker = topSymbols[i];
                this.showLoading(`Analyzing ${ticker.symbol} (${i + 1}/${topSymbols.length})...`);

                try {
                    const klines = await this.currentAPI.getKlines(ticker.symbol, timeframe, 100);
                    if (klines.length < 50) continue;

                    const strategies = Array.from(this.selectedStrategies);
                    const analysis = Strategies.analyzeAll(klines, strategies);
                    const overall = Strategies.calculateOverallScore(analysis);

                    // Capture individual strategy signals for Excel Export
                    const stratSignals = {};
                    analysis.forEach(a => {
                        const sDef = Strategies.definitions.find(d => d.id === a.strategyId);
                        stratSignals[sDef ? sDef.name : a.strategyId] = a.signal.toUpperCase();
                    });

                    results.push({
                        symbol: ticker.symbol,
                        price: parseFloat(ticker.lastPrice || 0),
                        change: parseFloat(ticker.priceChangePercent || 0),
                        volume: parseFloat(ticker.quoteVolume || 0),
                        score: overall.score,
                        signal: overall.signal,
                        stratSignals: stratSignals
                    });

                    // Small delay to avoid rate limiting
                    await this.currentAPI.delay(100);
                } catch (err) {
                    console.warn(`Failed to analyze ${ticker.symbol}:`, err);
                }
            }

            // Sort by score
            results.sort((a, b) => b.score - a.score);

            // Store for export
            this.screeningData = results;

            // Render results
            this.renderScreeningResults(results);
            this.elements.screeningResults.style.display = 'block';
            this.elements.exportBtn.disabled = false;

            this.showToast(`Screened ${results.length} coins`, 'success');

        } catch (error) {
            console.error('Screening failed:', error);
            this.showToast(`Screening failed: ${error.message}`, 'error');
        }

        this.hideLoading();
    }

    renderScreeningResults(results) {
        this.elements.screeningTableBody.innerHTML = '';

        results.forEach((result, index) => {
            const row = document.createElement('tr');
            row.dataset.signal = result.signal;
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${this.currentAPI.formatSymbol(result.symbol)}</strong></td>
                <td>$${this.currentAPI.formatPrice(result.price)}</td>
                <td class="${result.change >= 0 ? 'positive' : 'negative'}">${this.currentAPI.formatPercent(result.change)}</td>
                <td><strong>${result.score}</strong>/100</td>
                <td><span class="signal-badge ${result.signal}">${result.signal.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-sm" onclick="app.analyzeSymbol('${result.symbol}')">
                        Analyze
                    </button>
                </td>
            `;
            this.elements.screeningTableBody.appendChild(row);
        });
    }

    filterResults(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        document.querySelectorAll('#screeningTableBody tr').forEach(row => {
            if (filter === 'all') {
                row.style.display = '';
            } else {
                row.style.display = row.dataset.signal === filter ? '' : 'none';
            }
        });
    }

    async analyzeSymbol(symbol) {
        this.elements.symbolSelect.value = symbol;
        this.selectedSymbol = symbol;
        await this.analyze();

        // Scroll to results
        document.getElementById('signalsPanel').scrollIntoView({ behavior: 'smooth' });
    }

    // ========== Export ==========

    exportResults() {
        if (!window.XLSX) {
            this.showToast('Excel export library not loaded. Please refresh.', 'error');
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();
        let filename = '';

        // Check if we have screening data
        if (this.screeningData && this.screeningData.length > 0) {
            const data = this.screeningData.map((r, i) => {
                const row = {
                    Rank: i + 1,
                    Symbol: this.currentAPI.formatSymbol(r.symbol),
                    Price: r.price,
                    '24h Change %': r.change.toFixed(2),
                    Score: r.score,
                    'Overall Signal': r.signal.toUpperCase()
                };
                
                // Append dynamically used strategies as columns
                if (r.stratSignals) {
                    Object.assign(row, r.stratSignals);
                }
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Screening Results");
            filename = `crypto-screening-${new Date().toISOString().split('T')[0]}.xlsx`;
        }
        // Check if we have single analysis result
        else if (this.analysisResult) {
            const result = this.analysisResult;

            // Sheet 1: Overview
            const overviewData = [{
                'Symbol': this.currentAPI.formatSymbol(result.symbol),
                'Timeframe': result.timeframe,
                'Price': result.ticker?.lastPrice || '--',
                '24h Change %': result.ticker?.priceChangePercent || '--',
                'Overall Score': result.overall.score,
                'Recommendation': result.overall.recommendation,
                'Timestamp': result.timestamp
            }];
            const wsOverview = XLSX.utils.json_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

            // Sheet 2: Strategy Details
            const strategyData = result.strategies.map(s => ({
                Strategy: Strategies.definitions.find(d => d.id === s.strategyId)?.name || s.strategyId,
                Signal: s.signal,
                Strength: (s.strength * 100).toFixed(0) + '%',
                Value: s.value?.toFixed(4) || '--',
                Details: s.details || ''
            }));
            const wsStrategies = XLSX.utils.json_to_sheet(strategyData);
            XLSX.utils.book_append_sheet(wb, wsStrategies, "Strategies");

            filename = `${result.symbol}-analysis-${new Date().toISOString().split('T')[0]}.xlsx`;
        }
        else {
            this.showToast('No data to export. Run an analysis first!', 'error');
            return;
        }

        // Export file
        XLSX.writeFile(wb, filename);
        this.showToast('Results exported to Excel (.xlsx)', 'success');
    }

    // ========== UI Helpers ==========

    showLoading(text = 'Loading...') {
        this.isLoading = true;
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.isLoading = false;
        this.elements.loadingOverlay.classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CryptoSelectorApp();
});
