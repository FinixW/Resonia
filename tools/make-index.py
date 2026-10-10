#!/usr/bin/env python3
"""递归扫描 songs/ 下（含子文件夹）的 .vos/.vow，生成 songs/index.json。
子文件夹名作为分组（如 Lv03）。用法：python3 tools/make-index.py"""
import json, os, re
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'songs')
nat = lambda t: [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', t)]
out = []
for dp, _, fs in os.walk(root):
    rel = os.path.relpath(dp, root).replace(os.sep, '/')
    grp = '' if rel == '.' else rel
    for f in fs:
        if f.lower().endswith(('.vos', '.vow')):
            out.append({'file': (grp + '/' if grp else '') + f, 'title': os.path.splitext(f)[0], 'group': grp})
out.sort(key=lambda m: (nat(m['group']), nat(m['title'])))
json.dump(out, open(os.path.join(root, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(f'已生成 songs/index.json，共 {len(out)} 首')
