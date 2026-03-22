/**
 * Chart Module - TradingView Lightweight Charts Integration
 * Real-time candlestick chart with indicator overlays
 */

const ChartManager = {
    chart: null,
    candleSeries: null,
    volumeSeries: null,
    indicatorSeries: {},  // Store all indicator series
    indicatorPanes: {},   // Store separate panes for oscillators
    markerData: [],
    updateInterval: null,
    isUpdating: false,
    currentSymbol: null,
    currentTimeframe: null,
    timeZoneMode: 'local', // 'local' or 'utc'
    klineData: null,      // Store kline data for indicator calculations
    api: window.BingXAPI, // Default API

    // Indicator color schemes
    colors: {
        ema: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'],
        bollinger: { upper: '#3b82f6', middle: '#a0a0b0', lower: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },
        ichimoku: { tenkan: '#ef4444', kijun: '#3b82f6', senkouA: '#10b981', senkouB: '#ef4444' },
        vwap: '#f59e0b',
        kdj: { k: '#3b82f6', d: '#f59e0b', j: '#10b981' },
        rsi: '#8b5cf6',
        macd: { macd: '#3b82f6', signal: '#f59e0b', histogram: 'rgba(99, 102, 241, 0.5)' },
        stochRsi: { k: '#3b82f6', d: '#f59e0b' },
        adx: { adx: '#8b5cf6', plusDI: '#10b981', minusDI: '#ef4444' }
    },

    // DOM elements
    elements: {
        modal: null,
        container: null,
        symbolName: null,
        timeframe: null,
        timezone: null,
        status: null,
        lastPrice: null,
        priceChange: null,
        closeBtn: null,
        zoomIn: null,
        zoomOut: null,
        reset: null
    },

    // Initialize chart manager
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    cacheElements() {
        this.elements = {
            modal: document.getElementById('chartModal'),
            container: document.getElementById('chartContainer'),
            symbolName: document.getElementById('chartSymbolName'),
            timeframe: document.getElementById('chartTimeframe'),
            timezone: document.getElementById('chartTimezone'),
            status: document.getElementById('chartStatus'),
            lastPrice: document.getElementById('chartLastPrice'),
            priceChange: document.getElementById('chartPriceChange'),
            closeBtn: document.getElementById('chartCloseBtn'),
            zoomIn: document.getElementById('chartZoomIn'),
            zoomOut: document.getElementById('chartZoomOut'),
            reset: document.getElementById('chartReset'),
            indicatorSidebar: document.getElementById('indicatorSidebar'),
            clearIndicators: document.getElementById('clearIndicators')
        };
    },

    bindEvents() {
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.elements.zoomIn) {
            this.elements.zoomIn.addEventListener('click', () => this.zoom(0.5));
        }
        if (this.elements.zoomOut) {
            this.elements.zoomOut.addEventListener('click', () => this.zoom(2));
        }
        if (this.elements.reset) {
            this.elements.reset.addEventListener('click', () => this.resetView());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });

        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.close();
                }
            });
        }

        // Indicator toggle checkboxes
        document.querySelectorAll('.indicator-toggle input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.handleIndicatorToggle(e.target.dataset.indicator, e.target.checked);
            });
        });

        // Clear all indicators button
        if (this.elements.clearIndicators) {
            this.elements.clearIndicators.addEventListener('click', () => {
                this.clearAllIndicatorToggles();
            });
        }

        // Handle Timeframe changes directly inside the chart modal
        if (this.elements.timeframe) {
            this.elements.timeframe.addEventListener('change', async (e) => {
                this.currentTimeframe = e.target.value;
                
                // Sync the main page's timeframe select to match
                const mainTimeframe = document.getElementById('timeframe');
                if (mainTimeframe) mainTimeframe.value = e.target.value;

                this.clearIndicators();
                await this.loadChartData();

                // Re-apply any currently checked indicators to the new timeframe
                const activeStrategies = Array.from(document.querySelectorAll('.indicator-toggle input[type="checkbox"]:checked')).map(cb => cb.dataset.indicator);
                if (activeStrategies.length > 0) this.addIndicatorsForStrategies(activeStrategies);
            });
        }

        if (this.elements.timezone) {
            this.elements.timezone.addEventListener('change', async (e) => {
                this.timeZoneMode = e.target.value;
                
                this.clearIndicators();
                await this.loadChartData();

                const activeStrategies = Array.from(document.querySelectorAll('.indicator-toggle input[type="checkbox"]:checked')).map(cb => cb.dataset.indicator);
                if (activeStrategies.length > 0) this.addIndicatorsForStrategies(activeStrategies);
            });
        }
    },

    clearIndicators() {
        // Remove all indicator series from main chart
        for (const [id, series] of Object.entries(this.indicatorSeries)) {
            try {
                if (this.charts[0]) this.charts[0].removeSeries(series);
            } catch (e) { }
        }

        // Remove all indicator panels
        if (this.indicatorPanels) {
            for (const [id, panelObj] of Object.entries(this.indicatorPanels)) {
                try {
                    // Remove from charts array to stop syncing
                    this.charts = this.charts.filter(c => c !== panelObj.chart);
                    panelObj.panel.remove();
                } catch (e) { }
            }
        }

        this.indicatorSeries = {};
        this.indicatorPanels = {};
    },

    // Get time offset adjusted for timezone
    getAdjustedTime(timeMs) {
        const tzOffset = this.timeZoneMode === 'local' ? (new Date().getTimezoneOffset() * -60) : 0;
        return Math.floor(timeMs / 1000) + tzOffset;
    },

    // Handle individual indicator toggle
    handleIndicatorToggle(indicatorId, isEnabled) {
        if (!this.klineData || !this.charts || this.charts.length === 0) return;

        if (isEnabled) {
            // Add the indicator
            this.addIndicatorsForStrategies([indicatorId]);
        } else {
            // Remove the indicator(s) for this strategy
            this.removeIndicatorForStrategy(indicatorId);
        }
    },

    // Remove indicators for a specific strategy
    removeIndicatorForStrategy(strategyId) {
        const prefixes = {
            'ema_ribbon': ['ema_'],
            'bollinger_squeeze': ['bb_'],
            'ichimoku': ['ichimoku_'],
            'vwap': ['vwap'],
            'rsi_divergence': ['rsi'],
            'kdj': ['kdj_'],
            'macd_crossover': ['macd_', 'macd_line', 'macd_signal', 'macd_hist'],
            'stoch_rsi': ['stochrsi_'],
            'adx_trend': ['adx']
        };

        // Check if it's a separate panel
        if (this.indicatorPanels && this.indicatorPanels[strategyId]) {
            const { panel, chart } = this.indicatorPanels[strategyId];
            this.charts = this.charts.filter(c => c !== chart); // Stop syncing
            panel.remove(); // Remove DOM
            delete this.indicatorPanels[strategyId];
            return;
        }

        const toRemove = prefixes[strategyId] || [];
        for (const [id, series] of Object.entries(this.indicatorSeries)) {
            if (toRemove.some(prefix => id.startsWith(prefix) || id === prefix)) {
                try {
                    this.charts[0].removeSeries(series);
                    delete this.indicatorSeries[id];
                } catch (e) { }
            }
        }
    },

    // Clear all indicator toggles
    clearAllIndicatorToggles() {
        document.querySelectorAll('.indicator-toggle input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.clearIndicators();
    },

    // Add horizontal line helper
    addHorizontalLine(id, price, priceScaleId, color, lineStyle, targetChart = null) {
        const chart = targetChart || this.charts[0];
        if (!chart || !this.klineData || this.klineData.length === 0) return;

        const series = chart.addLineSeries({
            color: color,
            lineWidth: 1,
            lineStyle: lineStyle,
            priceScaleId: priceScaleId,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
            autoscaleInfoProvider: () => null
        });

        const data = this.klineData.map(k => ({
            time: this.getAdjustedTime(k.time),
            value: price
        }));
        series.setData(data);

        // Only track in indicatorSeries if on main chart
        if (targetChart === this.charts[0] && id) {
            this.indicatorSeries[id] = series;
        }

        return series;
    },

    // Pre-select indicators based on selected strategies
    preSelectIndicators(strategies) {
        // Clear all first
        document.querySelectorAll('.indicator-toggle input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Check the ones that match selected strategies
        strategies.forEach(strategyId => {
            const checkbox = document.querySelector(`.indicator-toggle input[data-indicator="${strategyId}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    },

    isOpen() {
        return this.elements.modal?.classList.contains('active');
    },

    // Open chart modal with symbol and selected strategies
    async open(symbol, timeframe = '1h', selectedStrategies = [], api = window.BingXAPI) {
        if (!symbol) {
            console.error('No symbol provided for chart');
            return;
        }

        this.currentSymbol = symbol;
        this.currentTimeframe = timeframe;
        this.api = api;

        // Show modal
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Update header info
        this.elements.symbolName.textContent = this.api.formatSymbol(symbol);
        if (this.elements.timeframe) this.elements.timeframe.value = timeframe;
        
        this.updateStatus('connecting');

        // Create chart if not exists
        if (!this.chart) {
            this.createChart();
        } else {
            // Clear existing indicators
            this.clearIndicators();
        }

        // Load initial data
        await this.loadChartData();

        // Pre-select indicator checkboxes based on selected strategies (but don't auto-add)
        // User can then toggle them on/off as desired
        if (selectedStrategies.length > 0) {
            this.preSelectIndicators(selectedStrategies);
        }

        // Start real-time updates
        this.startRealTimeUpdates();
    },

    // Close chart modal
    close() {
        this.stopRealTimeUpdates();
        this.clearIndicators();
        this.elements.modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    // Create TradingView Lightweight Chart
    createChart() {
        this.elements.container.innerHTML = '';
        this.charts = []; // Array to store all chart instances

        // Create main chart container
        const mainChartDiv = document.createElement('div');
        mainChartDiv.className = 'main-chart-wrapper';
        mainChartDiv.style.flex = '1';
        mainChartDiv.style.position = 'relative';
        mainChartDiv.style.minHeight = '300px';
        this.elements.container.appendChild(mainChartDiv);

        const chartOptions = {
            width: mainChartDiv.clientWidth,
            height: mainChartDiv.clientHeight,
            layout: {
                background: { type: 'solid', color: '#0a0a0f' },
                textColor: '#a0a0b0'
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: { color: 'rgba(99, 102, 241, 0.5)', width: 1, style: LightweightCharts.LineStyle.Dashed },
                horzLine: { color: 'rgba(99, 102, 241, 0.5)', width: 1, style: LightweightCharts.LineStyle.Dashed }
            },
            rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
            timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true, secondsVisible: false },
            handleScroll: { mouseWheel: true, pressedMouseMove: true },
            handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }
        };

        this.chart = LightweightCharts.createChart(mainChartDiv, chartOptions);
        this.charts.push(this.chart);

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444'
        });

        // CREATE SEPARATE VOLUME PANEL
        const { chart: volChart, panel: volPanel } = this.createSubChart('Volume', '100px');
        this.volumeChart = volChart;
        this.volumePanel = volPanel;

        this.volumeSeries = this.volumeChart.addHistogramSeries({
            color: 'rgba(99, 102, 241, 0.5)',
            priceFormat: { type: 'volume' }
        });

        // Setup synchronization
        this.setupChartSync();

        window.addEventListener('resize', () => this.handleResize());
    },

    handleResize() {
        if (this.charts && this.elements.container) {
            this.charts.forEach(chart => {
                const container = chart.chartElement().parentElement;
                if (container && container.clientWidth > 0) {
                    chart.applyOptions({
                        width: container.clientWidth,
                        height: container.clientHeight
                    });
                }
            });
        }
    },

    // Synchronize all charts
    setupChartSync() {
        // We will call this whenever we add a new chart
        this.charts.forEach(chart => {
            if (chart._hooked) return;
            chart._hooked = true;

            chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (this.isSyncing) return;
                this.isSyncing = true;
                this.charts.forEach(c => {
                    if (c !== chart) c.timeScale().setVisibleLogicalRange(range);
                });
                this.isSyncing = false;
            });

            chart.subscribeCrosshairMove(param => {
                if (this.isSyncingCrosshair) return;
                this.isSyncingCrosshair = true;
                this.charts.forEach(c => {
                    if (c !== chart) {
                        c.setCrosshairPosition(param.price, param.time, param.seriesData);
                    }
                });
                this.isSyncingCrosshair = false;
            });
        });
    },

    // Create a sub-chart for an indicator panel
    createSubChart(label, customHeight = null) {
        const panel = document.createElement('div');
        panel.className = 'indicator-panel';
        panel.style.position = 'relative';
        
        if (customHeight) {
            panel.style.flex = `0 0 ${customHeight}`;
            panel.style.height = customHeight;
        } else {
            panel.style.flex = '1';
            panel.style.minHeight = '150px';
        }

        // Add label/controls
        const labelDiv = document.createElement('div');
        labelDiv.className = 'chart-controls';
        labelDiv.style.position = 'absolute';
        labelDiv.style.top = '5px';
        labelDiv.style.left = '5px';
        labelDiv.style.zIndex = '10';
        labelDiv.innerHTML = `<span style="font-size:10px; color:#666; background:#111; padding:2px 4px; border-radius:4px; z-index: 10;">${label}</span>`;
        panel.appendChild(labelDiv);

        this.elements.container.appendChild(panel);

        const chartOptions = {
            width: panel.clientWidth,
            height: panel.clientHeight,
            layout: {
                background: { type: 'solid', color: '#0a0a0f' },
                textColor: '#a0a0b0'
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: { color: 'rgba(99, 102, 241, 0.5)', width: 1, style: LightweightCharts.LineStyle.Dashed }
            },
            rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
            timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true, secondsVisible: false },
        };

        const subChart = LightweightCharts.createChart(panel, chartOptions);
        this.charts.push(subChart);
        this.setupChartSync();

        // Sync initial range
        if (this.charts[0]) {
            const mainRange = this.charts[0].timeScale().getVisibleLogicalRange();
            if (mainRange) {
                subChart.timeScale().setVisibleLogicalRange(mainRange);
            }
        }

        return { chart: subChart, panel: panel };
    },

    // Load chart data from API
    async loadChartData() {
        try {
            this.updateStatus('loading');

            const limit = this.getKlineLimit(this.currentTimeframe);
            const klines = await this.api.getKlines(this.currentSymbol, this.currentTimeframe, limit);

            if (!klines || klines.length === 0) {
                this.updateStatus('error', 'No data available');
                return;
            }

            this.klineData = klines;

            const candleData = klines.map(k => ({
                time: this.getAdjustedTime(k.time),
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close
            }));

            const volumeData = klines.map(k => ({
                time: this.getAdjustedTime(k.time),
                value: k.volume,
                color: k.close >= k.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
            }));

            this.candleSeries.setData(candleData);
            this.volumeSeries.setData(volumeData);

            const lastCandle = candleData[candleData.length - 1];
            const firstCandle = candleData[0];
            this.updatePriceDisplay(lastCandle.close, firstCandle.close);

            this.chart.timeScale().fitContent();
            if (this.volumeChart) this.volumeChart.timeScale().fitContent();
            this.updateStatus('live');

        } catch (error) {
            console.error('Failed to load chart data:', error);
            this.updateStatus('error', error.message);
        }
    },

    getKlineLimit(timeframe) {
        const limits = { '1m': 1500, '5m': 1000, '15m': 800, '30m': 600, '1h': 500, '4h': 500, '1d': 365, '1w': 200, '1M': 120 };
        return limits[timeframe] || 500;
    },

    // ========== INDICATOR MANAGEMENT ==========

    clearIndicators() {
        // Remove all indicator series from main chart
        for (const [id, series] of Object.entries(this.indicatorSeries)) {
            try {
                if (this.chart) this.chart.removeSeries(series);
            } catch (e) { console.warn(e); }
        }

        // Remove all indicator panels from DOM and charts array
        if (this.indicatorPanels) {
            for (const [id, panelObj] of Object.entries(this.indicatorPanels)) {
                try {
                    // Remove from charts array to stop syncing
                    this.charts = this.charts.filter(c => c !== panelObj.chart);
                    if (panelObj.panel && panelObj.panel.parentNode) {
                        panelObj.panel.remove();
                    }
                } catch (e) { console.warn(e); }
            }
        }

        this.indicatorSeries = {};
        this.indicatorPanels = {};
        this.clearMarkers();
    },

    // Add indicators based on selected strategies
    addIndicatorsForStrategies(strategies) {
        if (!this.klineData || this.klineData.length === 0) return;

        const closes = this.klineData.map(k => k.close);
        const times = this.klineData.map(k => this.getAdjustedTime(k.time));

        strategies.forEach(strategyId => {
            try {
                switch (strategyId) {
                    case 'ema_ribbon':
                        this.addEmaRibbon(closes, times);
                        break;
                    case 'bollinger_squeeze':
                        this.addBollingerBands(closes, times);
                        break;
                    case 'ichimoku':
                        this.addIchimokuCloud(times);
                        break;
                    case 'vwap':
                        this.addVwap(times);
                        break;
                    case 'rsi_divergence':
                        this.addRsiPanel(closes, times);
                        break;
                    case 'kdj':
                        this.addKdjPanel(times);
                        break;
                    case 'macd_crossover':
                        this.addMacdPanel(closes, times);
                        break;
                    case 'stoch_rsi':
                        this.addStochRsiPanel(closes, times);
                        break;
                    case 'adx_trend':
                        this.addAdxPanel(times);
                        break;
                }
            } catch (e) {
                console.warn(`Failed to add indicator for ${strategyId}:`, e);
            }
        });
    },

    // ========== OVERLAY INDICATORS (on price chart) ==========

    addEmaRibbon(closes, times) {
        const periods = [8, 13, 21, 34, 55];
        periods.forEach((period, i) => {
            const ema = window.Indicators.ema(closes, period);
            const data = times.map((t, idx) => ({ time: t, value: ema[idx] })).filter(d => d.value !== null);

            const series = this.chart.addLineSeries({
                color: this.colors.ema[i],
                lineWidth: 1,
                priceScaleId: 'right',
                title: `EMA${period}`
            });
            series.setData(data);
            this.indicatorSeries[`ema_${period}`] = series;
        });
    },

    addBollingerBands(closes, times) {
        const params = Strategies.getParams('bollinger_squeeze');
        const { upper, middle, lower } = window.Indicators.bollingerBands(closes, params.period || 20, params.stdDev || 2);

        // Upper band
        const upperSeries = this.chart.addLineSeries({
            color: this.colors.bollinger.upper,
            lineWidth: 1,
            priceScaleId: 'right',
            lineStyle: LightweightCharts.LineStyle.Dashed
        });
        upperSeries.setData(times.map((t, i) => ({ time: t, value: upper[i] })).filter(d => d.value !== null));
        this.indicatorSeries['bb_upper'] = upperSeries;

        // Middle band
        const middleSeries = this.chart.addLineSeries({
            color: this.colors.bollinger.middle,
            lineWidth: 1,
            priceScaleId: 'right'
        });
        middleSeries.setData(times.map((t, i) => ({ time: t, value: middle[i] })).filter(d => d.value !== null));
        this.indicatorSeries['bb_middle'] = middleSeries;

        // Lower band
        const lowerSeries = this.chart.addLineSeries({
            color: this.colors.bollinger.lower,
            lineWidth: 1,
            priceScaleId: 'right',
            lineStyle: LightweightCharts.LineStyle.Dashed
        });
        lowerSeries.setData(times.map((t, i) => ({ time: t, value: lower[i] })).filter(d => d.value !== null));
        this.indicatorSeries['bb_lower'] = lowerSeries;
    },

    addIchimokuCloud(times) {
        const params = Strategies.getParams('ichimoku');
        const { tenkanSen, kijunSen, senkouA, senkouB } = window.Indicators.ichimoku(this.klineData, params.tenkan, params.kijun, params.senkou);

        const tenkanData = times.map((t, i) => ({ time: t, value: tenkanSen[i] })).filter(d => d.value !== null);
        const kijunData = times.map((t, i) => ({ time: t, value: kijunSen[i] })).filter(d => d.value !== null);

        const tenkanLine = this.chart.addLineSeries({ color: this.colors.ichimoku.tenkan, lineWidth: 1, priceScaleId: 'right' });
        tenkanLine.setData(tenkanData);
        this.indicatorSeries['ichimoku_tenkan'] = tenkanLine;

        const kijunLine = this.chart.addLineSeries({ color: this.colors.ichimoku.kijun, lineWidth: 1, priceScaleId: 'right' });
        kijunLine.setData(kijunData);
        this.indicatorSeries['ichimoku_kijun'] = kijunLine;
    },

    addVwap(times) {
        const vwapValues = window.Indicators.vwap(this.klineData);
        const data = times.map((t, i) => ({ time: t, value: vwapValues[i] })).filter(d => d.value !== null);

        const series = this.chart.addLineSeries({
            color: this.colors.vwap,
            lineWidth: 2,
            priceScaleId: 'right',
            title: 'VWAP'
        });
        series.setData(data);
        this.indicatorSeries['vwap'] = series;
    },

    // ========== SEPARATE PANEL INDICATORS ==========

    // ========== SEPARATE PANEL INDICATORS ==========

    addRsiPanel(closes, times) {
        const { chart, panel } = this.createSubChart('RSI');
        this.indicatorPanels['rsi_divergence'] = { chart, panel };

        const params = Strategies.getParams('rsi_divergence');
        const rsi = window.Indicators.rsi(closes, params.period || 14);
        const data = times.map((t, i) => ({ time: t, value: rsi[i] })).filter(d => d.value !== null);

        const series = chart.addLineSeries({
            color: this.colors.rsi,
            lineWidth: 2,
            title: 'RSI',
            priceFormat: { type: 'price', precision: 1, minMove: 0.1 }
        });

        series.setData(data);
        // this.indicatorSeries['rsi'] = series; // No need to track in flat map if managed by panel

        // Add overbought/oversold lines
        this.addHorizontalLine('rsi_70', 70, 'rsi', '#ef4444', LightweightCharts.LineStyle.Dashed, chart);
        this.addHorizontalLine('rsi_30', 30, 'rsi', '#10b981', LightweightCharts.LineStyle.Dashed, chart);
    },

    addKdjPanel(times) {
        const { chart, panel } = this.createSubChart('KDJ');
        this.indicatorPanels['kdj'] = { chart, panel };

        const params = Strategies.getParams('kdj');
        const { k, d, j } = window.Indicators.kdj(this.klineData, params.period || 9, params.kSmooth || 3, params.dSmooth || 3);

        const kData = times.map((t, i) => ({ time: t, value: k[i] })).filter(x => x.value !== null);
        const dData = times.map((t, i) => ({ time: t, value: d[i] })).filter(x => x.value !== null);
        const jData = times.map((t, i) => ({ time: t, value: j[i] })).filter(x => x.value !== null);

        // K line
        const kSeries = chart.addLineSeries({
            color: this.colors.kdj.k,
            lineWidth: 2,
            title: 'K'
        });
        kSeries.setData(kData);

        // D line
        const dSeries = chart.addLineSeries({
            color: this.colors.kdj.d,
            lineWidth: 1,
            title: 'D'
        });
        dSeries.setData(dData);

        // J line
        const jSeries = chart.addLineSeries({
            color: this.colors.kdj.j,
            lineWidth: 1,
            title: 'J'
        });
        jSeries.setData(jData);

        // Add threshold lines
        this.addHorizontalLine('kdj_buy', params.buyThreshold || 15, 'kdj', '#10b981', LightweightCharts.LineStyle.Dotted, chart);
        this.addHorizontalLine('kdj_sell', params.sellThreshold || 70, 'kdj', '#ef4444', LightweightCharts.LineStyle.Dotted, chart);
    },

    addMacdPanel(closes, times) {
        const { chart, panel } = this.createSubChart('MACD');
        this.indicatorPanels['macd_crossover'] = { chart, panel };

        const params = Strategies.getParams('macd_crossover');
        const { macdLine, signalLine, histogram } = window.Indicators.macd(closes, params.fast || 12, params.slow || 26, params.signal || 9);

        // MACD Line
        const macdData = times.map((t, i) => ({ time: t, value: macdLine[i] })).filter(d => d.value !== undefined);
        const macdSeries = chart.addLineSeries({
            color: this.colors.macd.macd,
            lineWidth: 2,
            title: 'MACD'
        });
        macdSeries.setData(macdData);

        // Signal Line
        const signalData = times.map((t, i) => ({ time: t, value: signalLine[i] })).filter(d => d.value !== undefined);
        const signalSeries = chart.addLineSeries({
            color: this.colors.macd.signal,
            lineWidth: 1,
            title: 'Signal'
        });
        signalSeries.setData(signalData);

        // Histogram
        const histData = times.map((t, i) => ({
            time: t,
            value: histogram[i],
            color: histogram[i] >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
        })).filter(d => d.value !== undefined);
        const histSeries = chart.addHistogramSeries({
            priceScaleId: 'right' // Use main right scale of subchart
        });
        histSeries.setData(histData);
    },

    addStochRsiPanel(closes, times) {
        const { chart, panel } = this.createSubChart('StochRSI');
        this.indicatorPanels['stoch_rsi'] = { chart, panel };

        const params = Strategies.getParams('stoch_rsi');
        const { k, d } = window.Indicators.stochRsi(closes, params.rsiPeriod || 14, params.stochPeriod || 14, params.kSmooth || 3, params.dSmooth || 3);

        const kData = times.slice(-k.length).map((t, i) => ({ time: t, value: k[i] })).filter(x => x.value !== null);
        const dData = times.slice(-d.length).map((t, i) => ({ time: t, value: d[i] })).filter(x => x.value !== null);

        const kSeries = chart.addLineSeries({
            color: this.colors.stochRsi.k,
            lineWidth: 2,
            title: '%K'
        });
        kSeries.setData(kData);

        const dSeries = chart.addLineSeries({
            color: this.colors.stochRsi.d,
            lineWidth: 1,
            title: '%D'
        });
        dSeries.setData(dData);

        this.addHorizontalLine('stochrsi_80', 80, 'stochrsi', '#ef4444', LightweightCharts.LineStyle.Dashed, chart);
        this.addHorizontalLine('stochrsi_20', 20, 'stochrsi', '#10b981', LightweightCharts.LineStyle.Dashed, chart);
    },

    addAdxPanel(times) {
        const { chart, panel } = this.createSubChart('ADX');
        this.indicatorPanels['adx_trend'] = { chart, panel };

        const params = Strategies.getParams('adx_trend');
        const { adx, plusDI, minusDI } = window.Indicators.adx(this.klineData, params.period || 14);

        const adxData = times.map((t, i) => ({ time: t, value: adx[i] })).filter(d => d.value !== null);
        const plusData = times.map((t, i) => ({ time: t, value: plusDI[i] })).filter(d => d.value !== null);
        const minusData = times.map((t, i) => ({ time: t, value: minusDI[i] })).filter(d => d.value !== null);

        const adxSeries = chart.addLineSeries({
            color: this.colors.adx.adx,
            lineWidth: 2,
            title: 'ADX'
        });
        adxSeries.setData(adxData);

        const plusSeries = chart.addLineSeries({
            color: this.colors.adx.plus,
            lineWidth: 1,
            title: '+DI'
        });
        plusSeries.setData(plusData);

        const minusSeries = chart.addLineSeries({
            color: this.colors.adx.minus,
            lineWidth: 1,
            title: '-DI'
        });
        minusSeries.setData(minusData);

        this.addHorizontalLine('adx_25', params.threshold || 25, 'adx', '#ffffff', LightweightCharts.LineStyle.Dotted, chart);
    },



    // ========== REAL-TIME UPDATES ==========

    startRealTimeUpdates() {
        this.stopRealTimeUpdates();

        this.updateInterval = setInterval(async () => {
            if (this.isUpdating || !this.isOpen()) return;

            this.isUpdating = true;
            try {
                const klines = await this.api.getKlines(this.currentSymbol, this.currentTimeframe, 2);

                if (klines && klines.length > 0) {
                    const latest = klines[klines.length - 1];

                    this.candleSeries.update({
                        time: this.getAdjustedTime(latest.time),
                        open: latest.open,
                        high: latest.high,
                        low: latest.low,
                        close: latest.close
                    });

                    this.volumeSeries.update({
                        time: this.getAdjustedTime(latest.time),
                        value: latest.volume,
                        color: latest.close >= latest.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                    });

                    this.elements.lastPrice.textContent = '$' + latest.close.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: latest.close < 1 ? 6 : 2
                    });
                }
            } catch (error) {
                console.warn('Real-time update failed:', error);
            }
            this.isUpdating = false;
        }, 5000);
    },

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },

    updateStatus(status, message) {
        const statusEl = this.elements.status;
        if (!statusEl) return;

        statusEl.className = 'chart-status ' + status;

        const statusTexts = {
            connecting: 'Connecting...',
            loading: 'Loading data...',
            live: 'Live',
            error: message || 'Error'
        };

        statusEl.innerHTML = `<span class="status-dot"></span><span>${statusTexts[status] || status}</span>`;
    },

    updatePriceDisplay(currentPrice, startPrice) {
        const priceChange = ((currentPrice - startPrice) / startPrice) * 100;

        this.elements.lastPrice.textContent = '$' + currentPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: currentPrice < 1 ? 6 : 2
        });

        const changeEl = this.elements.priceChange;
        changeEl.textContent = (priceChange >= 0 ? '+' : '') + priceChange.toFixed(2) + '%';
        changeEl.className = 'price-change ' + (priceChange >= 0 ? 'positive' : 'negative');
    },

    formatTimeframe(tf) {
        const formats = { '1m': '1M', '5m': '5M', '15m': '15M', '30m': '30M', '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W', '1M': '1M' };
        return formats[tf] || tf.toUpperCase();
    },

    zoom(factor) {
        if (!this.chart) return;
        const timeScale = this.chart.timeScale();
        const currentRange = timeScale.getVisibleLogicalRange();
        if (currentRange) {
            timeScale.setVisibleLogicalRange({ from: currentRange.from * factor, to: currentRange.to });
        }
    },

    resetView() {
        if (!this.chart) return;
        this.chart.timeScale().fitContent();
    },

    addSignalMarkers(signals) {
        if (!this.candleSeries) return;

        const markers = signals.map(signal => ({
            time: signal.time,
            position: signal.type === 'buy' ? 'belowBar' : 'aboveBar',
            color: signal.type === 'buy' ? '#10b981' : '#ef4444',
            shape: signal.type === 'buy' ? 'arrowUp' : 'arrowDown',
            text: signal.strategy || signal.type.toUpperCase()
        }));

        this.candleSeries.setMarkers(markers);
    },

    clearMarkers() {
        if (this.candleSeries) {
            this.candleSeries.setMarkers([]);
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ChartManager.init();
});
