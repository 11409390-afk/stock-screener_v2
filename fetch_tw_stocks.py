import urllib.request
import json
import os

ENDPOINTS = [
    {"url": "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL", "type": "TWSE", "board": "MAINBOARD"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes", "type": "TPEx", "board": "MAINBOARD"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_emg_quotes", "type": "TPEx", "board": "EMERGING"},
    {"url": "https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX20", "type": "TWSE", "board": "WARRANTS"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_warrant_daily_close_quotes", "type": "TPEx", "board": "WARRANTS"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_cb_daily_close_quotes", "type": "TPEx", "board": "BONDS"}
]

def fetch_data():
    all_symbols = []
    
    for ep in ENDPOINTS:
        try:
            print(f"Fetching {ep['url']}...")
            req = urllib.request.Request(ep['url'], headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
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
                        
                        all_symbols.append({
                            "symbol": str(symbol).strip(),
                            "baseAsset": str(name).strip(),
                            "quoteAsset": "TWD",
                            "board": ep["board"],
                            "raw": {
                                **item, 
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