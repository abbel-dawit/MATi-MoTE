#!/usr/bin/env bash
# Recompile Tailwind and inline it into index.html (between /*TW-START*/ and /*TW-END*/).
# Needs the Tailwind v3 standalone CLI: https://github.com/tailwindlabs/tailwindcss/releases (tailwindcss-<os>-<arch>)
# or `npx tailwindcss@3`. Usage: TAILWIND=./tailwindcss ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
TW="${TAILWIND:-npx tailwindcss@3}"
$TW -c tailwind/tailwind.config.js -i tailwind/input.css -o tailwind/out.css --minify
python3 - <<'PY'
import re
html = open('index.html', encoding='utf-8').read()
css = open('tailwind/out.css', encoding='utf-8').read().replace('\\', '\\\\')
html = re.sub(r'/\*TW-START\*/.*?/\*TW-END\*/', '/*TW-START*/' + css + '/*TW-END*/', html, flags=re.S)
open('index.html', 'w', encoding='utf-8').write(html)
print('Inlined', len(css), 'bytes of Tailwind CSS')
PY
rm -f tailwind/out.css
