/**
 * Internationalization (i18n) Dictionary
 * English (en) to Traditional Chinese (zh-TW)
 */

window.i18n = {
    current: 'en', // default language
    
    // UI Elements
    ui: {
        'Assets Selector': '資產策略分析器',
        'Market Selection': '市場選擇',
        'Market Source': '市場來源',
        'Crypto (BingX)': '加密貨幣 (BingX)',
        'Taiwan Stock': '台灣股市',
        'Market Board': '市場板塊',
        'Trading Pair': '交易標的',
        'Search or select pair (e.g., ETH, BTC...)': '搜尋或選擇標的 (例如：ETH, 2330...)',
        'Timeframe': '時間級別',
        '1 Minute': '1 分鐘',
        '5 Minutes': '5 分鐘',
        '15 Minutes': '15 分鐘',
        '30 Minutes': '30 分鐘',
        '1 Hour': '1 小時',
        '4 Hours': '4 小時',
        '1 Day': '日線',
        '1 Week': '週線',
        '1 Month': '月線',
        'Load Markets': '載入市場',
        'Trading Strategies': '交易策略',
        'Select All': '全選',
        'Clear All': '清空',
        'Enable Resonance': '啟用共振',
        'Boost score when indicators agree': '當不同指標方向一致時提高總分',
        'Analyze Selected': '分析所選策略',
        'MTF Analyze': '多時間級別分析',
        'View Chart': '查看圖表',
        'Backtest': '策略回測',
        'Screen Top 50': '篩選前50大',
        'Export Results': '匯出結果',
        'Market Overview': '市場總覽',
        'Price': '最新價格',
        '24h Change': '24小時漲跌幅',
        '24h Volume': '24小時交易額',
        '24h High': '24小時最高',
        '24h Low': '24小時最低',
        '🧠 Market Intelligence': '🧠 市場智能分析',
        'Long Probability': '做多機率 (Long)',
        'Short Probability': '做空機率 (Short)',
        'Price Exhaustion Score': '價格動能衰竭指數',
        'Run analysis to see trade recommendation': '執行分析以查看交易建議',
        'Total:': '總計:',
        'Buy:': '買入:',
        'Sell:': '賣出:',
        'Neutral:': '中立:',
        'Strategy Signals': '策略訊號',
        'Select strategies and click Analyze to see signals': '選擇策略並點擊分析以查看訊號',
        'Buy': '看漲 (Buy)',
        'Sell': '看跌 (Sell)',
        'Neutral': '中立 (Neutral)',
        'Overall Score': '綜合評分',
        'Refresh MTF': '更新多級別',
        'No Analysis': '尚未分析',
        'Screening Results': '篩選結果',
        'All': '全部',
        'Rank': '排名',
        'Symbol': '標的',
        'Industry': '產業別',
        'Score': '評分',
        'Signal': '訊號',
        'Action': '操作',
        'Company Basic Information': '公司基本資料',
        'Loading...': '載入中...',
        'Indicators': '技術指標',
        'Clear All': '清除全部',
        'Last:': '最新:',
        'Backtest Results': '回測結果',
        'Win Rate': '勝率',
        'Trades': '交易次數',
        'PnL': '淨利 (PnL)',
        'Type': '類型',
        'Time': '時間',
        'Multi-Timeframe Analysis': '多時間級別分析',
        'Comparing signals across multiple timeframes to detect macro/micro convergence.': '比較多個時間級別的訊號，偵測宏觀與微觀趨勢的共振。',
        'Overall Signal': '綜合訊號',
        'Indicator': '指標'
    },

    // Category mappings
    categories: {
        'Trend Following': '趨勢追蹤 (Trend)',
        'Momentum': '動能指標 (Momentum)',
        'Volatility': '波動率 (Volatility)',
        'Volume': '成交量 (Volume)',
        'Price Action': '價格行為 (Price Action)',
        'Statistical': '統計學 (Statistical)',
        'Mean Reversion': '均值回歸 (Mean Reversion)',
        'Multi-Factor': '多因子 (Multi-Factor)',
        'Multi-Timeframe': '多時間級別 (MTF)',
        'Macro Trend': '宏觀趨勢 (Macro Trend)',
        'Arbitrage': '套利 (Arbitrage)',
        'DIY Trend': '自訂趨勢 (DIY Trend)',
        'DIY Momentum': '自訂動能 (DIY Momentum)',
        'DIY Volatility': '自訂波動 (DIY Volatility)',
        'DIY Volume': '自訂成交量 (DIY Volume)',
        'DIY Reversal': '自訂反轉 (DIY Reversal)'
    },

    // Strategy Names & Descriptions (Prefix mapped by ID)
    strategies: {
        'rsi_divergence': { name: 'RSI 背離', desc: 'RSI < 超賣 = 買, RSI > 超買 = 賣。偵測背離型態。' },
        'macd_crossover': { name: 'MACD 交叉', desc: 'MACD 向上交叉信號線 = 買, 向下交叉 = 賣。' },
        'bollinger_squeeze': { name: '布林帶擠壓', desc: '偵測突破前的低波動擠壓狀態。' },
        'ema_ribbon': { name: 'EMA 均線帶', desc: '多條 EMA 顯示趨勢方向。全部排列一致 = 強勢趨勢。' },
        'volume_momentum': { name: '量價動能', desc: '由高於平均的成交量確認價格動能。' },
        'support_resistance': { name: '支撐/阻力突破', desc: '交易關鍵支撐/阻力位的突破。' },
        'mean_reversion': { name: '均值回歸', desc: '價格低於均值 N 個標準差 = 買, 高於 = 賣。' },
        'ichimoku': { name: '一目均衡表', desc: '價格在雲層之上且呈現多頭交叉 = 買, 雲下 = 賣。' },
        'stoch_rsi': { name: '隨機 RSI', desc: 'StochRSI < 20 = 買, > 80 = 賣 (搭配 K/D 交叉)。' },
        'adx_trend': { name: 'ADX 趨勢強度', desc: 'ADX > 閾值 = 強勢趨勢。方向由 +DI 與 -DI 決定。' },
        'vwap': { name: 'VWAP 策略', desc: '上升趨勢中買入回踩 VWAP, 下降趨勢中賣出反彈。' },
        'triple_screen': { name: '三重濾網', desc: '結合 3 個時間級別: 週線趨勢, 日線動能, 4小時進場。' },
        'kdj': { name: 'KDJ 指標', desc: 'K < 買入閾值 = 買, K > 賣出閾值 = 賣。' },
        'connors_rsi': { name: 'Connors RSI', desc: 'RSI(2) < 10 且 收盤 > SMA(200) = 買。多頭回調中的均值回歸。' },
        'donchian_breakout': { name: '唐奇安通道突破', desc: '價格 > N 週期最高價 = 買。強勢趨勢啟動。' },
        'golden_cross': { name: '黃金/死亡交叉', desc: 'SMA(50) 向上交叉 SMA(200) = 買。長線趨勢指標。' },
        'supertrend': { name: '超級趨勢 (SuperTrend)', desc: '收盤 > SuperTrend 且 回調 < 1% = 買。趨勢跟蹤進場。' },
        'vpt_breakout': { name: 'VPT 量價突破', desc: '成交量價格趨勢 > SMA(50) 且 漲幅 < 2% = 籌碼收集訊號。' },
        'obv_divergence': { name: 'OBV 背離', desc: '價格創新低但 OBV 走高 = 看漲背離，反轉訊號。' },
        'funding_rate': { name: '資金費率套利', desc: '資金費率 > 0.03% (8h) = 在牛市中收取資金費率。' },
        
        // DIY Indicators
        'diy_range_filter': { name: '區間過濾 (Range Filter)', desc: '透過動態區間過濾雜訊。翻綠 = 看漲, 翻紅 = 看跌。' },
        'diy_ssl_channel': { name: 'SSL 通道', desc: '動態支撐阻力通道。SSL 上線 > 下線 = 看漲。乾淨的趨勢翻轉。' },
        'diy_cci': { name: 'CCI', desc: 'CCI > +100 = 看漲突破; < -100 = 看跌。在趨勢市場中效果最佳。' },
        'diy_chandelier_exit': { name: '吊燈停損 (Chandelier Exit)', desc: '基於 ATR 的移動停損。翻轉 = 高勝率進場。' },
        'diy_cmf': { name: '蔡金資金流量 (CMF)', desc: '成交量確認: CMF > +0.05 = 機構買盤介入。' },
        'diy_roc': { name: '變動率 (ROC)', desc: '穿越零軸 = 動能轉換。可捕捉早期趨勢起點。' },
        'diy_volatility_osc': { name: '波動率震盪器', desc: '偵測盤整後的爆發性K線。突破K線勝率極高。' },
        'diy_hull_suite': { name: '赫爾移動平均 (HMA)', desc: '低延遲趨勢均線。上升 = 看漲, 下降 = 看跌。減少假訊號。' },
        'diy_bull_bear_power': { name: '牛熊力量', desc: '基於距離高低點與 ATR 的趨勢分數。' },
        'diy_bxtrender': { name: 'B-Xtrender', desc: '基於 RSI 的雙時間級別共振。兩者皆正 = 強烈買進。' },
        'diy_wae': { name: 'Waddah Attar Explosion', desc: 'MACD × 布林帶寬度爆發。透過死區避免假訊號。' },
        'diy_stc': { name: '沙夫趨勢週期 (STC)', desc: '比 MACD 快，比 RSI 平滑。關鍵水位: 25 (買) / 75 (賣)。' },
        'diy_vegas_tunnel': { name: '維加斯通道 (Vegas Tunnel)', desc: '斐波那契 EMA 通道。價格在上方 = 看漲，通道內 = 不交易。' },
        'diy_psar': { name: '拋物線 SAR', desc: '自帶移動停損的趨勢跟蹤。翻轉 = 高勝率進場。' },
        'diy_keltner': { name: '肯特納通道 (Keltner)', desc: '基於 ATR 的通道。突破上軌 = 買。常與擠壓指標搭配使用。' },
        'diy_squeeze_momentum': { name: '擠壓動能 (Squeeze)', desc: '🔥 BB 進入 KC = 擠壓蓄力。擠壓釋放 = 爆發性突破進場。' },
        'diy_aroon': { name: '阿隆指標 (Aroon)', desc: '測量趨勢新鮮度。Up > 70 + Down < 30 = 新的上升趨勢。' },
        'diy_williams_r': { name: '威廉指標 (%R)', desc: '快速 RSI 替代品。%R 穿越 -80 = 買, 穿越 -20 = 賣。' },
        'diy_mfi': { name: '資金流量指標 (MFI)', desc: '以成交量加權的 RSI。MFI < 20 = 超賣買進; > 80 = 超買賣出。' },
        'diy_fisher': { name: '費雪轉換 (Fisher)', desc: '高斯常態化震盪器。尖銳的峰值 = 反轉點。' },
        'diy_tsi': { name: '真實強度指數 (TSI)', desc: '雙重平滑動能。假訊號遠少於 MACD。訊號線交叉 = 進場。' },
        'diy_qqe_mod': { name: 'QQE Mod', desc: '帶有動態帶的平滑 RSI。穿越零軸 = 訊號。' },
        'diy_mcginley': { name: '麥克金利動態均線', desc: '自我調節均線 — 在快市中反應快，在慢市中反應慢。' },
        'diy_vortex': { name: '渦旋指標 (Vortex)', desc: 'VI+ 向上交叉 VI- = 新的上升趨勢。及早捕捉反轉。' },
        'diy_elder_impulse': { name: '艾爾德強弱指標', desc: 'EMA + MACD 共振。綠色 = 買, 紅色 = 賣, 灰色 = 不交易。' },
        'diy_tema': { name: 'TEMA 交叉', desc: '三重平滑 EMA 對 SMA。比普通均線提早 1-2 根 K 線捕捉變化。' },
        'diy_lin_reg_slope': { name: '線性回歸斜率', desc: '量化趨勢角度。正值且遞增 = 強大動能。' },
        'diy_dpo': { name: '去趨勢價格震盪器', desc: '去除長期趨勢以隔離週期。上升趨勢中 DPO < 0 = 逢低買進。' }
    },
    
    // Generic terms for dynamic signal text (from DIY analyzers)
    signalTerms: {
        'buy': '買入', 'sell': '賣出', 'neutral': '中立',
        'BUY': '買入', 'SELL': '賣出', 'NEUTRAL': '中立',
        'LONG': '做多', 'SHORT': '做空',
        'Bullish': '看漲', 'Bearish': '看跌', 'bullish': '看漲', 'bearish': '看跌',
        'Trend is UP': '趨勢向上', 'Trend is DOWN': '趨勢向下',
        'trend confirmed UP': '趨勢確認向上', 'trend confirmed DOWN': '趨勢確認向下',
        'trend is up': '趨勢向上', 'trend is down': '趨勢向下', 
        'Enter long': '進場做多', 'Enter short': '進場做空', 'Go long': '做多', 'Go short': '做空',
        'breakout': '突破', 'Breakout': '突破', 'breakdown': '跌破', 'Breakdown': '跌破',
        'Oversold': '超賣', 'oversold': '超賣', 'Overbought': '超買', 'overbought': '超買',
        'Reversal': '反轉', 'reversal': '反轉', 'Momentum': '動能', 'momentum': '動能',
        'Volume': '成交量', 'volume': '成交量',
        'Resistance': '壓力位', 'resistance': '壓力位', 'Support': '支撐位', 'support': '支撐位',
        'crossed above': '向上穿越', 'Crossed above': '向上穿越',
        'crossed below': '向下穿越', 'Crossed below': '向下穿越',
        'Price above': '價格高於', 'Price below': '價格低於',
        'Wait for': '等待', 'Wait': '等待', 'Stand aside': '空手觀望',
        'Best on': '最適合於', 'Use': '使用', 'win rate': '勝率', 'Filter is flat': '濾網持平',
        'market is ranging': '市場處於震盪', 'Filter flipped UP': '濾網向上翻轉', 'Filter flipped DOWN': '濾網向下翻轉',
        'Filter:': '濾網:', 'Direction:': '方向:', 'FLAT': '持平', 'UP': '向上', 'DOWN': '向下',
        'Strength:': '訊號強度:', 'Up:': '上線:', 'Down:': '下線:', 'Long Stop:': '做多停損:', 'Short Stop:': '做空停損:',
        'Dir:': '方向:', 'JUST FLIPPED': '剛剛翻轉', 'Oscillator:': '指標值:', 'Trend Score:': '趨勢分數:',
        'Bull:': '多頭:', 'Bear:': '空頭:', 'Spike:': '突刺:', 'Upper:': '上軌:', 'Lower:': '下軌:',
        'High-probability': '高勝率', 'high-probability': '高勝率',
        'Positive': '正向', 'Negative': '負向', 'Above zero': '零軸之上', 'Below zero': '零軸之下',
        'Strong': '強烈', 'strong': '強烈', 'Weak': '微弱', 'weak': '微弱',
        'Above': '高於', 'Below': '低於', 'Signal:': '訊號線:', 'Zero:': '零軸:',
        'Prev:': '前值:', 'Mid:': '中軌:'
    },
    
    // Dynamic text replacements helper
    translate: function(text, type = 'ui') {
        if (this.current === 'en') return text;
        if (this[type] && this[type][text]) {
            return this[type][text];
        }
        return text; // Fallback
    },

    translateDynamic: function(text) {
        if (this.current === 'en' || !text) return text;
        let res = text;
        // Sort keys by length descending to match longest phrases first
        const keys = Object.keys(this.signalTerms).sort((a, b) => b.length - a.length);
        for (const k of keys) {
            // Case-sensitive exact matching is preferred for technical terms, but we can do a global replace
            res = res.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), this.signalTerms[k]);
        }
        return res;
    }
};
