#!/usr/bin/env python3
# 把 src/rbga.js 嵌进 index.html 与 studio/index.html（两处标记之间）。改了 src/rbga.js 后运行一次。
import re,sys,os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=open(os.path.join(root,'src/rbga.js'),encoding='utf-8').read().rstrip('\n')
for f in ['index.html','studio/index.html']:
    p=os.path.join(root,f);s=open(p,encoding='utf-8').read()
    blk='/*RBGA-BEGIN*/\n'+src+'\n/*RBGA-END*/'
    if '/*RBGA-BEGIN*/' in s:
        s=re.sub(r'/\*RBGA-BEGIN\*/.*?/\*RBGA-END\*/',lambda m:blk,s,flags=re.S)
    else:
        a='// ---------- 第三方插件（格式导入）----------' if f=='index.html' else '// ================= 第三方插件（载入模式）================='
        assert a in s,f
        s=s.replace(a,blk+'\n'+a,1)
    open(p,'w',encoding='utf-8').write(s);print('ok',f)
