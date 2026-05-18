import asyncio
import websockets
import json
import http.server
import socketserver
import threading
import os

# Set to keep track of all connected browser tabs (Client and Hacker)
connected_clients = set()

# --- PART 1: THE WEB HOSTING (HTTP) ---
def run_http_server():
    # Serves files from the current folder for localhost:8000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", 8000), handler) as httpd:
        print("[HTTP] Hosting files at http://localhost:8000")
        httpd.serve_forever()

# --- PART 2: THE SECURE BACKEND & BROADCASTER (WEBSOCKET) ---
async def handle_connection(websocket):
    # Register the new tab
    connected_clients.add(websocket)
    session_established = False
    
    print(f"[WS] New connection established. Total active tabs: {len(connected_clients)}")

    try:
        async for message in websocket:
            data = json.loads(message)
            action = data.get("action")

            if action == "HANDSHAKE":
                print("\n[TLS 1.3] Handshake Initiated...")
                session_established = True
                # Notify ALL tabs that a handshake occurred
                broadcast_msg = json.dumps({"status": "HANDSHAKE_COMPLETE", "info": "Tunnel Established"})
                for client in connected_clients:
                    await client.send(broadcast_msg)

            elif action == "LOGIN":
                if not session_established:
                    await websocket.send(json.dumps({"status": "ERROR", "msg": "No TLS Session!"}))
                    continue

                ciphertext = data.get("payload")
                print(f"\n[WIRE] Intercepted Packet: {ciphertext[:40]}...")
                
                # Notify ALL tabs (including hacker) that a packet flew by
                broadcast_msg = json.dumps({
                    "status": "SUCCESS", 
                    "msg": "Encrypted credentials received.",
                    "intercepted_payload": ciphertext # The hacker can "see" the noise
                })
                for client in connected_clients:
                    await client.send(broadcast_msg)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Unregister when a tab is closed
        connected_clients.remove(websocket)
        print(f"[WS] Connection closed. Total active tabs: {len(connected_clients)}")

async def main():
    # Start HTTP server in a background thread
    threading.Thread(target=run_http_server, daemon=True).start()
    
    # Start WebSocket server
    print("[WS] Secure Simulation Server starting on ws://127.0.0.1:8765")
    async with websockets.serve(handle_connection, "127.0.0.1", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[SYSTEM] Server shutting down.")