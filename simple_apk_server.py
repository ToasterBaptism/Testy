#!/usr/bin/env python3
"""
Simple APK Download Server for FortniteAssist
Serves the permission-fixed APK with proper headers
"""

import http.server
import socketserver
import os
import sys
from datetime import datetime

class APKHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="/workspace/project/Testy", **kwargs)
    
    def do_GET(self):
        if self.path == '/':
            self.serve_homepage()
        elif self.path == '/download':
            self.serve_apk()
        else:
            super().do_GET()
    
    def do_HEAD(self):
        if self.path == '/':
            self.serve_homepage()
        elif self.path == '/download':
            self.serve_apk_head()
        else:
            super().do_HEAD()
    
    def serve_homepage(self):
        apk_path = "/workspace/project/Testy/fortnite-assist-permission-fixed.apk"
        
        if not os.path.exists(apk_path):
            self.send_error(404, "APK file not found")
            return
        
        file_size = os.path.getsize(apk_path)
        file_size_mb = file_size / (1024 * 1024)
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>FortniteAssist APK Download</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 2.5em;
            color: #4CAF50;
            margin-bottom: 10px;
        }}
        .download-btn {{
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 1.2em;
            margin: 20px 0;
        }}
        .download-btn:hover {{
            background: #45a049;
        }}
        .info {{
            background: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .warning {{
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎮 FortniteAssist</div>
            <h1>Permission Fixed v1.1</h1>
            <p>Assistive Technology for Accessible Gaming</p>
        </div>
        
        <div class="info">
            <h3>📦 APK Information</h3>
            <ul>
                <li><strong>File Size:</strong> {file_size_mb:.1f} MB</li>
                <li><strong>Version:</strong> Permission Fixed v1.1</li>
                <li><strong>Android:</strong> API 34+ (Android 14+)</li>
                <li><strong>Architecture:</strong> Universal (ARM64, x86_64)</li>
            </ul>
        </div>
        
        <div class="warning">
            <h3>⚠️ Installation Notes</h3>
            <ul>
                <li>Enable "Install from Unknown Sources" in Android settings</li>
                <li>Grant all requested permissions for full functionality</li>
                <li>This is assistive technology, not a cheat tool</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="/download" class="download-btn">
                📱 Download FortniteAssist APK
            </a>
        </div>
        
        <div class="info">
            <h3>🔧 Recent Fixes</h3>
            <ul>
                <li>✅ Fixed permission status detection</li>
                <li>✅ Improved accessibility service checking</li>
                <li>✅ Enhanced status indicators</li>
                <li>✅ Better error handling and debugging</li>
            </ul>
        </div>
    </div>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Content-Length', str(len(html.encode('utf-8'))))
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_apk(self):
        apk_path = "/workspace/project/Testy/fortnite-assist-permission-fixed.apk"
        
        if not os.path.exists(apk_path):
            self.send_error(404, "APK file not found")
            return
        
        file_size = os.path.getsize(apk_path)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/vnd.android.package-archive')
        self.send_header('Content-Disposition', 'attachment; filename="fortnite-assist-permission-fixed.apk"')
        self.send_header('Content-Length', str(file_size))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        
        with open(apk_path, 'rb') as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                self.wfile.write(chunk)
    
    def serve_apk_head(self):
        apk_path = "/workspace/project/Testy/fortnite-assist-permission-fixed.apk"
        
        if not os.path.exists(apk_path):
            self.send_error(404, "APK file not found")
            return
        
        file_size = os.path.getsize(apk_path)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/vnd.android.package-archive')
        self.send_header('Content-Disposition', 'attachment; filename="fortnite-assist-permission-fixed.apk"')
        self.send_header('Content-Length', str(file_size))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
    
    def log_message(self, format, *args):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 12001
    
    print(f"🚀 FortniteAssist APK Server Starting...")
    print(f"📱 Port: {port}")
    print(f"🌐 Local: http://localhost:{port}")
    if port == 12000:
        print(f"🌐 Public: https://work-1-koelkfqdtzqukiqw.prod-runtime.all-hands.dev")
    elif port == 12001:
        print(f"🌐 Public: https://work-2-koelkfqdtzqukiqw.prod-runtime.all-hands.dev")
    else:
        print(f"🌐 Public: Not available on port {port} (use 12000 or 12001)")
    
    # Check if APK exists
    apk_path = "/workspace/project/Testy/fortnite-assist-permission-fixed.apk"
    if os.path.exists(apk_path):
        file_size = os.path.getsize(apk_path) / (1024 * 1024)
        print(f"📦 APK Found: {file_size:.1f} MB")
    else:
        print("❌ APK Not Found!")
        return
    
    print("=" * 60)
    
    with socketserver.TCPServer(("0.0.0.0", port), APKHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    main()