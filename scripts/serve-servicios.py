"""Local static preview with the same clean URLs as the Nginx deployment."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1] / 'mock-servicios'
ROUTES = {'/': '/index.html', '/servicios': '/servicios.html',
          '/nosotros': '/nosotros.html', '/contacto': '/contacto.html'}


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlsplit(self.path)
        suffix = '?' + parsed.query if parsed.query else ''
        path = parsed.path
        redirect = None
        if path == '/index.html':
            redirect = '/' + suffix
        elif path in ['/cobertura', '/cobertura/', '/cobertura.html']:
            redirect = '/' + suffix + '#cobertura'
        elif path.removesuffix('.html').removesuffix('/') in list(ROUTES)[1:] and path not in ROUTES:
            redirect = path.removesuffix('.html').removesuffix('/') + suffix
        if redirect:
            self.send_response(301)
            self.send_header('Location', redirect)
            self.end_headers()
            return
        self.path = ROUTES.get(path, path) + suffix
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8917
    print(f'ASESPRO Servicios: http://127.0.0.1:{port}/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=ROOT)).serve_forever()
