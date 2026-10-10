#!/usr/bin/env python3
"""扫描 songs/ 目录里的 .vos/.vow，生成 songs/index.json（曲库清单）。用法：python3 tools/make-index.py"""
import json, os
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'songs')
fs = sorted(f for f in os.listdir(d) if f.lower().endswith(('.vos', '.vow')))
out = [{'file': f, 'title': os.path.splitext(f)[0]} for f in fs]
json.dump(out, open(os.path.join(d, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(f'已生成 songs/index.json，共 {len(out)} 首')
