#!/usr/bin/env python3
"""唯一的 Python:OCR 常驻服务。Go 把 PNG 字节 POST /ocr,返回 [[x,y,text,score],...]。
RapidOCR 只初始化一次。用法: python ocr_server.py [port=8781]"""
import sys, json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_ENG = None
def engine():
    global _ENG
    if _ENG is None:
        from rapidocr_onnxruntime import RapidOCR
        _ENG = RapidOCR()
    return _ENG

def run_ocr(png_bytes):
    res, _ = engine()(png_bytes)
    out = []
    for box, text, score in (res or []):
        out.append([int(box[0][0]), int(box[0][1]), text, float(score)])
    return out

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"ok": True})
        else:
            self._send(404, {"error": "not found"})
    def do_POST(self):
        if self.path != "/ocr":
            self._send(404, {"error": "not found"}); return
        n = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(n)
        try:
            self._send(200, {"boxes": run_ocr(data)})
        except Exception as e:
            self._send(500, {"error": str(e)})

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8781
    engine()  # 预热,避免首个请求慢
    print("OCR sidecar on :%d" % port, flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()

if __name__ == "__main__":
    main()
