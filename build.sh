#!/usr/bin/env bash
# MATi-MoTE release build:
#   1. recompiles Tailwind and inlines it into index.html
#   2. stamps a new build number into index.html, sw.js, version.json and manifest.json,
#      which is what makes every installed copy update itself after you upload to GitHub.
# Needs the Tailwind v3 standalone CLI (github.com/tailwindlabs/tailwindcss/releases) or npx.
# Usage: TAILWIND=./tailwindcss ./build.sh          (BUILD=... to set the number yourself)
set -euo pipefail
cd "$(dirname "$0")"
TW="${TAILWIND:-npx tailwindcss@3}"
BUILD="${BUILD:-$(date -u +%Y.%m.%d.%H%M)}"
$TW -c tailwind/tailwind.config.js -i tailwind/input.css -o tailwind/out.css --minify
BUILD="$BUILD" python3 - <<'PY'
import json, os, re
b = os.environ['BUILD']
html = open('index.html', encoding='utf-8').read()
css = open('tailwind/out.css', encoding='utf-8').read().replace('\\', '\\\\')
html = re.sub(r'/\*TW-START\*/.*?/\*TW-END\*/', '/*TW-START*/' + css + '/*TW-END*/', html, flags=re.S)
html = re.sub(r"const BUILD = '[^']*';", f"const BUILD = '{b}';", html)
html = re.sub(r'(manifest\.json|apple-touch-icon\.png)\?v=[^"]*"', lambda m: f'{m.group(1)}?v={b}"', html)
open('index.html', 'w', encoding='utf-8').write(html)
sw = open('sw.js', encoding='utf-8').read()
open('sw.js', 'w', encoding='utf-8').write(re.sub(r"const VERSION = '[^']*';", f"const VERSION = 'mati-{b}';", sw))
open('version.json', 'w').write(json.dumps({'build': b}) + '\n')
m = json.load(open('manifest.json', encoding='utf-8'))
for ic in m['icons']: ic['src'] = ic['src'].split('?')[0] + f'?v={b}'
open('manifest.json', 'w', encoding='utf-8').write(json.dumps(m, indent=2, ensure_ascii=False) + '\n')
print('Build', b, '· inlined', len(css), 'bytes of Tailwind CSS')
PY
rm -f tailwind/out.css
