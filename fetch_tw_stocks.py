import urllib.request
import json
import os
import ssl

# Create an unverified SSL context to bypass TWSE/TPEx certificate errors
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

ENDPOINTS = [
    {"url": "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL", "type": "TWSE", "board": "MAINBOARD"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes", "type": "TPEx", "board": "MAINBOARD"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_emg_quotes", "type": "TPEx", "board": "EMERGING"},
    {"url": "https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX20", "type": "TWSE", "board": "WARRANTS"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_warrant_daily_close_quotes", "type": "TPEx", "board": "WARRANTS"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_cb_daily_close_quotes", "type": "TPEx", "board": "BONDS"}
]

# TWSE & TPEx Official Industry Codes Mapping
INDUSTRY_CODES = {
    "01": "水泥工業 (Cement)",
    "02": "食品工業 (Food)",
    "03": "塑膠工業 (Plastics)",
    "04": "紡織纖維 (Textiles)",
    "05": "電機機械 (Electric Machinery)",
    "06": "電器電纜 (Electrical Cables)",
    "07": "化學工業 (Chemicals)",
    "08": "玻璃陶瓷 (Glass & Ceramics)",
    "09": "造紙工業 (Paper & Pulp)",
    "10": "鋼鐵工業 (Iron & Steel)",
    "11": "橡膠工業 (Rubber)",
    "12": "汽車工業 (Automobiles)",
    "13": "電子工業 (Electronics)",
    "14": "建材營造 (Building & Construction)",
    "15": "航運業 (Shipping & Transportation)",
    "16": "觀光餐旅 (Tourism & Hospitality)",
    "17": "金融保險業 (Financial & Insurance)",
    "18": "貿易百貨業 (Trading & Consumers)",
    "19": "綜合企業 (Conglomerates)",
    "20": "其他業 (Others)",
    "21": "化學工業 (Chemicals)",
    "22": "生技醫療業 (Biotech & Medical Care)",
    "23": "油電燃氣業 (Oil, Gas & Electricity)",
    "24": "半導體業 (Semiconductors)",
    "25": "電腦及週邊設備業 (Computer & Peripherals)",
    "26": "光電業 (Optoelectronics)",
    "27": "通信網路業 (Communications & Internet)",
    "28": "電子零組件業 (Electronic Parts/Components)",
    "29": "電子通路業 (Electronic Info Distribution)",
    "30": "資訊服務業 (Information Services)",
    "31": "其他電子業 (Other Electronics)",
    "32": "文化創意業 (Cultural & Creative)",
    "33": "農業科技業 (Agricultural Tech)",
    "34": "電子商務業 (E-Commerce)",
    "35": "綠能環保 (Green Energy)",
    "36": "數位雲端 (Digital & Cloud Services)",
    "37": "運動休閒 (Sports & Leisure)",
    "38": "居家生活 (Household)",
    "80": "管理股票 (Managed Stocks)",
    "91": "存託憑證 (TDR)"
}

def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=25, context=ssl_ctx) as res:
            data = json.loads(res.read().decode('utf-8'))
            return data if isinstance(data, list) else (data.get('data') or list(data.values())[0] or [])
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return []

def fetch_data():
    # Fetch industry mapping dictionary
    industry_map = {}
    print("Fetching TWSE & TPEx industry mappings...")
    
    for item in fetch_json('https://openapi.twse.com.tw/v1/opendata/t187ap03_L'):
        code = item.get('公司代號') or item.get('CompanyCode') or item.get('Code')
        ind = item.get('產業別') or item.get('產業類別') or item.get('Industry')
        if code and ind:
            ind_str = str(ind).strip()
            industry_map[str(code).strip()] = INDUSTRY_CODES.get(ind_str, ind_str)
        
    for item in fetch_json('https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O'):
        code = item.get('公司代號') or item.get('CompanyCode') or item.get('Code')
        ind = item.get('產業別') or item.get('產業類別') or item.get('Industry')
        if code and ind:
            ind_str = str(ind).strip()
            industry_map[str(code).strip()] = INDUSTRY_CODES.get(ind_str, ind_str)
        
    for item in fetch_json('https://openapi.twse.com.tw/v1/exchangeReport/TWT38U'):
        code = item.get('Code') or item.get('CompanyCode')
        ind = item.get('Industry') or item.get('產業別') or item.get('產業類別')
        if code and ind:
            ind_str = str(ind).strip()
            industry_map[str(code).strip()] = INDUSTRY_CODES.get(ind_str, ind_str)

    print(f"DEBUG: Collected {len(industry_map)} industry mappings.")

    fundamentals = {}
    print("Fetching fundamental data (PE, Revenue, Dividends, etc.)...")
    
    # PE, PB, Yield
    for item in fetch_json('https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL'):
        code_raw = item.get('Code') or item.get('CompanyCode')
        if code_raw: 
            fundamentals.setdefault(str(code_raw).strip(), {}).update({
                'PE': item.get('PeRatio') or item.get('PEratio') or item.get('PERatio') or '-', 
                'PB': item.get('PbRatio') or item.get('PBratio') or item.get('PBRatio') or '-', 
                'Yield': item.get('DividendYield') or item.get('YieldRatio') or '-'
            })
    for item in fetch_json('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_perpeid_quotes'):
        code_raw = item.get('SecuritiesCompanyCode') or item.get('CompanyCode') or item.get('Code')
        if code_raw: 
            fundamentals.setdefault(str(code_raw).strip(), {}).update({
                'PE': item.get('PERatio') or item.get('PeRatio') or '-', 
                'PB': item.get('PBRatio') or item.get('PbRatio') or '-', 
                'Yield': item.get('YieldRatio') or item.get('DividendYield') or '-'
            })
        
    # Revenue (YoY, MoM, YTD)
    for url in ['https://openapi.twse.com.tw/v1/opendata/t187ap05_L', 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O']:
        for item in fetch_json(url):
            code_raw = item.get('公司代號') or item.get('CompanyCode') or item.get('Code')
            if code_raw: 
                fundamentals.setdefault(str(code_raw).strip(), {}).update({
                    'RevYoY': item.get('去年同月增減(%)') or item.get('營業收入-去年同月增減(%)') or item.get('MonthlyYoY') or '-',
                    'RevMoM': item.get('上月比較增減(%)') or item.get('營業收入-上月比較增減(%)') or item.get('MonthlyMoM') or '-',
                    'RevYTD': item.get('前期比較增減(%)') or item.get('累計營業收入-去年同期增減(%)') or item.get('CumulativeYoY') or '-'
                })
            
    # Dividends
    for url in ['https://openapi.twse.com.tw/v1/opendata/t187ap45_L', 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap45_O']:
        for item in fetch_json(url):
            code_raw = item.get('公司代號') or item.get('CompanyCode') or item.get('Code')
            if code_raw: 
                fundamentals.setdefault(str(code_raw).strip(), {}).update({
                    'CashDiv': item.get('盈餘分配之現金股利(元/股)') or item.get('CashDividend') or '-', 
                    'StockDiv': item.get('盈餘轉增資配股(元/股)') or item.get('StockDividend') or '-'
                })
            
    # Pledge Ratio (董監事質押)
    for url in ['https://openapi.twse.com.tw/v1/opendata/t187ap09_L', 'https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap09_O']:
        for item in fetch_json(url):
            code_raw = item.get('公司代號') or item.get('CompanyCode') or item.get('Code')
            if code_raw: 
                fundamentals.setdefault(str(code_raw).strip(), {}).update({
                    'PledgeRatio': item.get('董監事質權設定比') or item.get('設質比例') or item.get('PledgeRatio') or '-'
                })

    # --- DEBUG LOGGING ---
    print(f"DEBUG: Collected fundamentals for {len(fundamentals)} stocks.")
    if fundamentals:
        sample_code = list(fundamentals.keys())[0]
        print(f"DEBUG Sample ({sample_code}): {fundamentals[sample_code]}")

    all_symbols = []
    
    for ep in ENDPOINTS:
        try:
            print(f"Fetching {ep['url']}...")
            req = urllib.request.Request(ep['url'], headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30, context=ssl_ctx) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                # Handle different JSON structures
                data_list = data if isinstance(data, list) else (data.get('data') or data.get('aaData') or list(data.values())[0] or [])
                
                count = 0
                for item in data_list:
                    symbol = item.get('Code') or item.get('SecuritiesCompanyCode') or item.get('WarrantCode') or item.get('BondCode')
                    name = item.get('Name') or item.get('CompanyName') or item.get('WarrantName') or item.get('BondName')
                    
                    if symbol and name:
                        # Normalize prices and volumes for the JS application
                        close_price = item.get('ClosingPrice') or item.get('Close') or item.get('LatestPrice') or "0"
                        high_price = item.get('HighestPrice') or item.get('High') or "0"
                        low_price = item.get('LowestPrice') or item.get('Low') or "0"
                        change = item.get('Change') or "0"
                        vol = item.get('TradeVolume') or item.get('TradingVolume') or item.get('Volume') or "0"
                        
                        sym_str = str(symbol).strip()
                        f_data = fundamentals.get(sym_str, {})
                        
                        # Smart Industry Fallback for ETFs and Warrants
                        ind = industry_map.get(sym_str)
                        if not ind or ind == '未分類':
                            if sym_str.startswith('00'):
                                ind = 'ETF (指數型基金)'
                            elif ep['board'] == 'WARRANTS':
                                ind = 'Warrant (權證)'
                            elif ep['board'] == 'BONDS':
                                ind = 'Bond (可轉債)'
                            else:
                                ind = '未分類 (Unclassified)'

                        all_symbols.append({
                            "symbol": sym_str,
                            "baseAsset": str(name).strip(),
                            "quoteAsset": "TWD",
                            "industry": ind,
                            "board": ep["board"],
                            "raw": {
                                **item, 
                                **f_data,
                                "type": ep['type'],
                                "NormalizedClose": str(close_price).replace(',', ''),
                                "NormalizedHigh": str(high_price).replace(',', ''),
                                "NormalizedLow": str(low_price).replace(',', ''),
                                "NormalizedChange": str(change).replace(',', ''),
                                "NormalizedVolume": str(vol).replace(',', '')
                            }
                        })
                        count += 1
                print(f"Successfully processed {count} items for {ep['type']}")
        except Exception as e:
            print(f"Failed to fetch {ep['url']}: {e}")

    return all_symbols

if __name__ == "__main__":
    print("Starting TWSE/TPEx fetch process...")
    symbols = fetch_data()
    
    if len(symbols) > 1000:
        # Save to JSON
        with open("tw_stocks.json", "w", encoding="utf-8") as f:
            json.dump(symbols, f, ensure_ascii=False, separators=(',', ':'))
        print(f"Successfully saved {len(symbols)} symbols to tw_stocks.json")
    else:
        print("Error: Not enough data retrieved. Aborting save.")
        exit(1)