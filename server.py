#!/usr/bin/env python3
"""Serve Fiveish locally, on a LAN, or through a temporary public tunnel."""

from __future__ import annotations

import argparse
import errno
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import threading
from urllib.parse import urlsplit


PUBLIC_FILES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/styles.css": "styles.css",
    "/app.js": "app.js",
    "/manifest.webmanifest": "manifest.webmanifest",
    "/sw.js": "sw.js",
    "/icons/icon-192.png": "icons/icon-192.png",
    "/icons/icon-512.png": "icons/icon-512.png",
    "/icons/maskable-512.png": "icons/maskable-512.png",
}
PUBLIC_URL_PATTERN = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")


class FiveishHandler(SimpleHTTPRequestHandler):
    """Only expose files required by the browser app."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        super().end_headers()

    def translate_path(self, path: str) -> str:
        route = urlsplit(path).path
        filename = PUBLIC_FILES.get(route)
        if filename is None:
            return str(Path.cwd() / "__not_found__")
        return str(Path.cwd() / filename)

    def do_GET(self) -> None:
        route = urlsplit(self.path).path
        if route == "/favicon.ico":
            self.send_response(HTTPStatus.NO_CONTENT)
            self.end_headers()
            return
        if route not in PUBLIC_FILES:
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        route = urlsplit(self.path).path
        if route not in PUBLIC_FILES:
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        super().do_HEAD()

    def log_message(self, format: str, *args: object) -> None:
        if self.command not in {"GET", "HEAD"} or args[1] not in {"200", "304"}:
            super().log_message(format, *args)


def find_lan_address() -> str | None:
    """Return the primary private-network IPv4 address when available."""
    connection = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        connection.connect(("8.8.8.8", 80))
        address = connection.getsockname()[0]
        return address if not address.startswith("127.") else None
    except OSError:
        return None
    finally:
        connection.close()


def create_server(host: str, starting_port: int) -> tuple[ThreadingHTTPServer, int]:
    for port in range(starting_port, starting_port + 20):
        try:
            return ThreadingHTTPServer((host, port), FiveishHandler), port
        except OSError as exc:
            if exc.errno != errno.EADDRINUSE:
                raise
    raise RuntimeError(
        f"No open port found between {starting_port} and {starting_port + 19}."
    )


def stream_tunnel_output(process: subprocess.Popen[str]) -> None:
    public_url_found = False
    assert process.stdout is not None

    for line in process.stdout:
        match = PUBLIC_URL_PATTERN.search(line)
        if match and not public_url_found:
            public_url_found = True
            public_url = match.group(0)
            print("\n" + "=" * 68, flush=True)
            print("PUBLIC URL - 이 주소를 외부 사람에게 공유하세요", flush=True)
            print(public_url, flush=True)
            print("=" * 68 + "\n", flush=True)
        elif " ERR " in line or " WRN " in line:
            print(f"[tunnel] {line.strip()}", flush=True)

    if not public_url_found and process.poll() is not None:
        print(
            "Public tunnel stopped before creating a URL. "
            "Check your internet connection and cloudflared configuration.",
            flush=True,
        )


def start_public_tunnel(port: int) -> subprocess.Popen[str]:
    cloudflared = shutil.which("cloudflared")
    if not cloudflared:
        raise RuntimeError(
            "cloudflared is not installed. Install it with: brew install cloudflared"
        )

    process = subprocess.Popen(
        [
            cloudflared,
            "tunnel",
            "--protocol",
            "http2",
            "--url",
            f"http://127.0.0.1:{port}",
            "--no-autoupdate",
            "--loglevel",
            "info",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    threading.Thread(
        target=stream_tunnel_output,
        args=(process,),
        daemon=True,
    ).start()
    return process


def stop_process(process: subprocess.Popen[str] | None) -> None:
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Fiveish English tutoring app.")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Bind address. Use 127.0.0.1 to allow this Mac only.",
    )
    parser.add_argument(
        "--share",
        action="store_true",
        help="Create a temporary public trycloudflare.com URL.",
    )
    args = parser.parse_args()

    app_dir = Path(__file__).resolve().parent
    os.chdir(app_dir)
    server, selected_port = create_server(args.host, args.port)
    tunnel_process = None

    if selected_port != args.port:
        print(f"Port {args.port} is busy, using {selected_port} instead.")

    print(f"This Mac: http://127.0.0.1:{selected_port}")
    if args.host in {"0.0.0.0", ""}:
        lan_address = find_lan_address()
        if lan_address:
            print(f"Same Wi-Fi: http://{lan_address}:{selected_port}")

    if args.share:
        print("Creating a temporary public URL...")
        tunnel_process = start_public_tunnel(selected_port)
    else:
        print("Internet sharing: run `python3 server.py --share`")

    print("Press Control-C to stop sharing.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Fiveish...")
    finally:
        server.server_close()
        stop_process(tunnel_process)
        print("Server stopped.")


if __name__ == "__main__":
    main()
