#!/usr/bin/env python3
"""
Simple HTTP server to host FortniteAssist APK for download
"""

import http.server
import socketserver
import os
import mimetypes
from urllib.parse import unquote
import datetime

class APKServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="/workspace/project/Testy", **kwargs)
    
    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            # Get APK file info
            apk_path = "/workspace/project/Testy/android/app/build/outputs/apk/debug/app-debug.apk"
            apk_size = "Unknown"
            apk_date = "Unknown"
            
            if os.path.exists(apk_path):
                stat = os.stat(apk_path)
                apk_size = f"{stat.st_size / (1024*1024):.1f} MB"
                apk_date = datetime.datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            
            html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FortniteAssist APK Download</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }}
        .container {{
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }}
        h1 {{
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }}
        .subtitle {{
            text-align: center;
            margin-bottom: 30px;
            font-size: 1.2em;
            opacity: 0.9;
        }}
        .download-section {{
            text-align: center;
            margin: 40px 0;
        }}
        .download-btn {{
            display: inline-block;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.2em;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            margin: 10px;
        }}
        .download-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }}
        .apk-info {{
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }}
        .warning {{
            background: rgba(255, 193, 7, 0.2);
            border: 1px solid rgba(255, 193, 7, 0.5);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
        }}
        .features {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        .feature {{
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }}
        .feature-icon {{
            font-size: 2em;
            margin-bottom: 10px;
        }}
        .ethics {{
            background: rgba(0, 123, 255, 0.2);
            border: 1px solid rgba(0, 123, 255, 0.5);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            opacity: 0.8;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 FortniteAssist</h1>
        <div class="subtitle">Assistive Technology for Fortnite Mobile</div>
        
        <div class="ethics">
            <h3>🛡️ Ethical Assistive Technology</h3>
            <p><strong>This is NOT a cheat tool.</strong> FortniteAssist is designed specifically as an assistive technology to help blind, visually impaired, and physically disabled individuals play Fortnite Mobile independently.</p>
        </div>
        
        <div class="apk-info">
            <h3>📱 APK Information</h3>
            <div class="info-row">
                <span><strong>Version:</strong></span>
                <span>1.0.0 (Debug Build)</span>
            </div>
            <div class="info-row">
                <span><strong>Size:</strong></span>
                <span>{apk_size}</span>
            </div>
            <div class="info-row">
                <span><strong>Build Date:</strong></span>
                <span>{apk_date}</span>
            </div>
            <div class="info-row">
                <span><strong>Target SDK:</strong></span>
                <span>Android API 34+</span>
            </div>
            <div class="info-row">
                <span><strong>Architecture:</strong></span>
                <span>Universal (ARM64, ARM, x86, x86_64)</span>
            </div>
        </div>
        
        <div class="download-section">
            <a href="/android/app/build/outputs/apk/debug/app-debug.apk" class="download-btn">
                📥 Download FortniteAssist APK
            </a>
        </div>
        
        <div class="warning">
            <h4>⚠️ Installation Requirements</h4>
            <ul>
                <li>Android 10+ (API 29+) recommended</li>
                <li>Enable "Install from Unknown Sources" in Settings</li>
                <li>Grant accessibility permissions when prompted</li>
                <li>Minimum 4GB RAM, 2GB free storage</li>
            </ul>
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">👁️</div>
                <h4>AI Vision</h4>
                <p>Real-time enemy detection and aim guidance using on-device AI</p>
            </div>
            <div class="feature">
                <div class="feature-icon">♿</div>
                <h4>Full Accessibility</h4>
                <p>Complete TalkBack support, haptic feedback, and audio cues</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🔒</div>
                <h4>Privacy First</h4>
                <p>All processing happens locally - no data leaves your device</p>
            </div>
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <h4>Optimized Performance</h4>
                <p>Efficient processing with minimal battery impact</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Built with ❤️ for the accessibility community</p>
            <p>React Native 0.74.0 • Android SDK 35 • TensorFlow Lite 2.14.0</p>
        </div>
    </div>
</body>
</html>
            """
            
            self.wfile.write(html_content.encode('utf-8'))
            return
        
        # Handle APK download with proper headers
        if self.path.endswith('.apk'):
            file_path = unquote(self.path[1:])  # Remove leading slash
            full_path = os.path.join("/workspace/project/Testy", file_path)
            
            if os.path.exists(full_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/vnd.android.package-archive')
                self.send_header('Content-Disposition', 'attachment; filename="FortniteAssist-v1.0.0.apk"')
                self.send_header('Content-Length', str(os.path.getsize(full_path)))
                self.end_headers()
                
                with open(full_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
        
        # Default handler for other files
        super().do_GET()

def run_server(port=12000):
    """Run the APK hosting server"""
    handler = APKServerHandler
    
    with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
        print(f"🚀 FortniteAssist APK Server running at:")
        print(f"   Local: http://localhost:{port}")
        print(f"   Network: https://work-1-koelkfqdtzqukiqw.prod-runtime.all-hands.dev")
        print(f"📱 APK Size: {os.path.getsize('/workspace/project/Testy/android/app/build/outputs/apk/debug/app-debug.apk') / (1024*1024):.1f} MB")
        print("🔗 Ready for download!")
        print("\nPress Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    run_server()