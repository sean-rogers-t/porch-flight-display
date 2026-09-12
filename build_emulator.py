"""Build the LED emulator as a standalone page and a conversation fragment.

Usage: python build_emulator.py
Requires Python 3.10+, standard library only. No network access is used.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ICON_NAMES = (
    'us-new-york', 'gb-london', 'fr-paris',
    'us-san-francisco', 'us-seattle', 'jp-tokyo',
)


def build() -> None:
    artwork = json.loads((ROOT / 'assets' / 'landmark-pixels.json').read_text(encoding='utf-8'))
    if artwork.get('version') != 1 or set(artwork.get('images', {})) != set(ICON_NAMES):
        raise ValueError('Expected pixel artwork for all six cities')
    for name in ICON_NAMES:
        svg = (ROOT / 'assets' / f'{name}.svg').read_bytes()
        if b'<svg' not in svg or b'<script' in svg.lower() or b'<foreignobject' in svg.lower():
            raise ValueError(f'Unexpected icon content: {name}')
        art = artwork['images'][name]
        if art['sourceSha256'] != hashlib.sha256(svg).hexdigest():
            raise ValueError(f'Artwork changed: run node rasterize_artwork.cjs for {name}')
        alpha = bytes.fromhex(art['alpha'])
        if not (0 < art['width'] <= 240 and 0 < art['height'] <= 240):
            raise ValueError(f'Unexpected artwork dimensions: {name}')
        if len(alpha) != art['width'] * art['height'] or not any(alpha):
            raise ValueError(f'Empty or incomplete pixel artwork: {name}')

    template = (ROOT / 'porch-display.template.html').read_text(encoding='utf-8')
    if template.count('__ICON_DATA__') != 1:
        raise ValueError('Expected exactly one artwork marker in the template')
    fragment = template.replace('__ICON_DATA__', json.dumps(artwork, separators=(',', ':')))
    if len(fragment.encode('utf-8')) >= 1_000_000:
        raise ValueError('Conversation fragment exceeds 1 MB')

    css = (ROOT / 'standalone.css').read_text(encoding='utf-8')
    page = '\n'.join((
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<meta name="description" content="Compare amber LED flight-origin layouts with larger city landmarks.">',
        '<title>Porch Flight Display</title>',
        '<style>', css, '</style>',
        '</head>',
        '<body><main>', fragment, '</main></body>',
        '</html>', '',
    ))
    for filename, content in [('porch-display.html', fragment), ('index.html', page)]:
        (ROOT / filename).write_text(content, encoding='utf-8', newline='\n')
        print(f'Built {filename}: {len(content.encode("utf-8")):,} bytes')


if __name__ == '__main__':
    build()
