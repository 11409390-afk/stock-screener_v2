import http.server
import socketserver
import urllib.request
import urllib.parse
import sys
import ssl

PORT = 8087

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Check if this is a proxy request
        if self.path.startswith('/proxy?url='):
            self.handle_proxy()
        else:
            # Default to serving files
            super().do_GET()

    def handle_proxy(self):
        # Extract the target URL
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        target_url = params.get('url', [None])[0]

        if not target_url:
            self.send_error(400, "Missing 'url' parameter")
            return

        try:
            print(f"Proxying request to: {target_url}")
            
            # Create unverified SSL context
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            # Create request with browser like headers
            req = urllib.request.Request(target_url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            
            with urllib.request.urlopen(req, context=ctx) as response:
                content = response.read()
                
                # Send success response
                self.send_response(200)
                
                # Add CORS headers
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                self.wfile.write(content)
                
        except urllib.error.HTTPError as e:
            self.send_error(e.code, e.reason)
        except Exception as e:
            print(f"Proxy error: {e}")
            self.send_error(500, str(e))

    # Handle OPTIONS for CORS preflight
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

Handler = ProxyHTTPRequestHandler

print(f"Starting server at http://localhost:{PORT}")
print(f"Proxy endpoint available at http://localhost:{PORT}/proxy?url=...")
print(f"Please open http://localhost:{PORT} in your browser")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
