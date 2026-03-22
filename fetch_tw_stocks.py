import urllib.request
import json
import os

ENDPOINTS = [
    {"url": "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL", "type": "TWSE", "board": "MAINBOARD"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes", "type": "TPEx", "board": "MAINBOARD"},
    {"url": "https://www.tpex.org.tw/openapi/v1/tpex_emg_quotes", "type": "TPEx", "board": "EMERGING"},
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
                        all_symbols.append({
                            "symbol": str(symbol).strip(),
                            "baseAsset": str(name).strip(),
                            "quoteAsset": "TWD",
                            "raw": {**item, "type": ep['type']}
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