"""Check the public Services URL contract against a candidate or deployed server.

Usage: python scripts/check-servicios-urls.py [http://127.0.0.1:PORT]
Only reads public pages; does not submit forms or request external links.
"""
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'https://asespro.com.uy').rstrip('/')
ORIGIN = 'https://asespro.com.uy'
PAGES = ['/', '/servicios', '/nosotros', '/contacto']


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.canonical = None
        self.meta = {}
        self.links = []
        self.h1 = 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'meta':
            self.meta[attrs.get('name', attrs.get('property', ''))] = attrs.get('content', '')
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if tag == 'h1':
            self.h1 += 1


opener = urllib.request.build_opener(NoRedirect)


def fetch(path):
    request = urllib.request.Request(BASE + path, headers={'User-Agent': 'ASESPRO-URL-validation/1.0'})
    try:
        response = opener.open(request, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read().decode('utf-8', errors='replace')


checked_links = set()
for path in PAGES:
    status, headers, html = fetch(path)
    page = Page(html)
    assert status == 200, (path, status)
    assert headers.get_content_type() == 'text/html', (path, headers)
    assert 'noindex' not in headers.get('X-Robots-Tag', '').lower(), path
    assert 'noindex' not in page.meta.get('robots', '').lower(), path
    assert page.canonical == ORIGIN + path, (path, page.canonical)
    assert page.meta.get('og:url') == page.canonical, path
    assert page.meta.get('description') and page.h1 == 1, path
    assert 'no-cache' in headers.get('Cache-Control', ''), path
    for link in page.links:
        parsed = urllib.parse.urlsplit(urllib.parse.urljoin(ORIGIN + path, link))
        if parsed.scheme not in ['http', 'https'] or parsed.netloc != 'asespro.com.uy':
            continue
        # Cloudflare wraps protected email links in a CDN-owned endpoint.
        if parsed.path.startswith('/cdn-cgi/'):
            continue
        assert not parsed.path.endswith('.html'), (path, link)
        target = urllib.parse.urlunsplit(('', '', parsed.path, parsed.query, ''))
        target = urllib.parse.quote(target, safe='/%?=&:+')
        if target not in checked_links:
            assert fetch(target)[0] == 200, (path, target)
            checked_links.add(target)
    print('PAGE 200:', path, 'canonical:', page.canonical)

redirects = {
    '/index.html': '/',
    '/index.html?ref=consulta': '/?ref=consulta',
    '/servicios.html': '/servicios',
    '/nosotros.html': '/nosotros',
    '/contacto.html': '/contacto',
    '/servicios/': '/servicios',
    '/nosotros/': '/nosotros',
    '/contacto/': '/contacto',
    '/contacto.html?service=Comercios&city=Durazno': '/contacto?service=Comercios&city=Durazno',
    '/servicios/?ref=consulta': '/servicios?ref=consulta',
    '/cobertura.html': '/#cobertura',
    '/cobertura': '/#cobertura',
}
for path, expected in redirects.items():
    status, headers, _ = fetch(path)
    assert status == 301, (path, status)
    location = headers.get('Location')
    assert location == expected, (path, location, expected)
    assert fetch(urllib.parse.urldefrag(location)[0])[0] == 200, (path, location)
    print('REDIRECT 301:', path, '->', location)

status, _, robots = fetch('/robots.txt')
assert status == 200 and 'Disallow: /' not in robots and ORIGIN + '/sitemap.xml' in robots
status, _, sitemap = fetch('/sitemap.xml')
assert status == 200
urls = [node.text for node in ET.fromstring(sitemap).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert urls == [ORIGIN + path for path in PAGES], urls
assert fetch('/no-existe-seo-check')[0] == 404, 'Missing pages must return a real 404'
print(json.dumps({'result': 'PASS', 'pages': len(PAGES), 'redirects': len(redirects), 'internal_links': len(checked_links), 'sitemap': urls}))
