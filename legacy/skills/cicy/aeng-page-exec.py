#!/usr/bin/env python3
"""执行 JS 代码到前端页面并获取返回值"""
import json, sys, time, requests, websocket

def load_token():
    with open('/home/w3c_offical/global.json') as f:
        return json.load(f)['api_token']

API = 'http://localhost:8008'
WS = 'ws://localhost:8008'

def exec_js(code, pane='w-10001'):
    token = load_token()
    request_id = f"exec-{int(time.time()*1000)}"

    # Connect WS to receive response
    ws = websocket.create_connection(f"{WS}/api/chat/ws?pane={pane}&token={token}", timeout=10)
    ws.settimeout(3)

    resp = requests.post(f'{API}/api/chat/push',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json={'pane': pane, 'type': 'desktop_event', 'data': {'type': 'eval', 'code': code, 'requestId': request_id}})

    if resp.status_code != 200:
        print(f"❌ 推送失败: {resp.text}")
        ws.close()
        return None

    # Wait for pong with matching requestId
    for _ in range(20):
        try:
            msg = ws.recv()
            data = json.loads(msg)
            if data.get('type') == 'pong' and data.get('data', {}).get('requestId') == request_id:
                ws.close()
                result = data['data']
                if 'error' in result:
                    print(f"❌ Error: {result['error']}")
                    return None
                return result.get('result')
        except websocket.WebSocketTimeoutException:
            continue
        except:
            pass

    print("❌ 超时")
    ws.close()
    return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python3 aeng-page-exec.py '<js代码>'")
        sys.exit(1)
    
    result = exec_js(sys.argv[1])
    if result is not None:
        print(result)
