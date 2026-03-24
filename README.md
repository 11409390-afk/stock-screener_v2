# Crypto Selector Tool v2 💎🚀

An advanced, high-performance asset selection and analysis dashboard built with pure JavaScript, HTML5, and CSS3. Designed for professional traders seeking institutional-grade technical analysis across Crypto and Stock markets.

## 🌟 Key Features

### 1. Robust Technical Library
- **48 Institutional Indicators**: 20 core strategies + 28 custom "Alpha" indicators meticulously translated from Pine Script.
- **DIY Indicators**: High-conviction tools including **Vegas Tunnel**, **Squeeze Momentum**, **Range Filter**, **Waddah Attar Explosion**, **Hull Suite**, and **Chandelier Exit**.
- **Real-time Tweaking**: Interactive parameter sliders with instant feedback on charts.

### 2. 🌍 Multi-Language Support (EN/ZH-TW)
- **Global Localization**: One-click toggle between English and Traditional Chinese.
- **Dynamic Analysis Translation**: Not just the UI—all generated market intelligence reports and strategy signal details are translated dynamically using a pattern-matching engine.

### 3. 🧠 Market Intelligence Engine 
- **Alpha-Weighted Scoring**: Sophisticated aggregation where high-conviction strategies receive 1.5x-2.0x multipliers.
- **Probability Analysis**: Calculates Long/Short conviction based on indicator resonance.
- **Price Exhaustion Tracking**: Detects volume/volatility peaks to anticipate reversals.

### 4. ⏱️ Advanced Analysis Tools
- **Multi-Timeframe (MTF) Analysis**: Compare signals across 4+ timeframes simultaneously to detect macro/micro convergence.
- **Screening Top 50**: Automatically scan the top 50 market assets to identify the highest "Intelligence Score" opportunities.
- **Combined Backtesting**: Validate strategy efficacy over historical data with multi-indicator confirmation.

### 5. 🔔 Smart Alerts & Notifications
- **Real-time Monitoring**: Periodic background analysis (every 3 minutes) with "Strong Buy" detection.
- **Institutional Chimes**: Audio notifications for key entries.
- **Browser Push Notifications**: Stay informed even when the tab is in the background.

### 6. 🎨 Professional Workspace
- **Bloomberg Terminal Aesthetics**: A sleek, dark glassmorphism theme with high-density data visualization.
- **Flexible Layout**: Foldable/collapsible panels (7 main sections) to maximize screen real estate.
- **Ultra-Wide Charts**: Expandable TradingView Lightweight Charts occupying 95% of the viewport for deep analysis.
- **Data Portability**: Full Excel (.xlsx) export support for all screening and analysis results.

## 📁 Project Structure
- `app.js`: Master application orchestration and UI logic.
- `i18n.js`: Internationalization dictionary and dynamic translation engine.
- `market-intelligence.js`: The "Brain" - scoring, weighting, and recommendation logic.
- `diy-indicators.js` / `diy-analyzers.js`: Mathematical core for the 48 technical indicators.
- `bingx-api.js` / `stock-api.js`: Multi-source data integration layers.
- `server.py`: Local Python bridge for clean, CORS-compliant Yahoo Finance data.

## 🚀 Getting Started
1. **Launch Server**: Run `python server.py` to enable Stock data fetching.
2. **Open App**: Open `index.html` in any modern browser.
3. **Analyze**: Select your target (Crypto or Stocks), pick your strategies, and hit **Analyze Selected**.

---
*Built for the next generation of data-driven traders.*
