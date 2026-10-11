// 鸣域 Resonia 插件示例：读取一个极简的文本谱面（.demo），每行 "毫秒 轨道(0-6)"。
// 用法：游戏页 → 第三方 → 载入插件… → 选这个文件；再选一个 .demo 谱面文件即可。
// 完整接口说明见 docs/PLUGIN-API.md
Resonia.register({
  id: 'example-demo',
  name: '示例：.demo 文本谱面',
  version: '1',
  exts: ['demo'],                       // 这个插件接管的扩展名
  // files：用户选中的、扩展名匹配的文件 [{path, ab()}]；ctx.find(名字) 可按文件名找到同一文件夹/压缩包里的其他文件
  async open(files, ctx) {
    const items = [];
    for (const f of files) {
      const text = ctx.api.textDecode(await f.ab());
      items.push({
        name: f.path.split('/').pop(),            // 显示在顶部的谱面名
        label: f.path.split('/').pop(),           // 多张谱面时下拉框里的文字
        // build 在用户真正选中这张谱面时才调用；返回 api.makeSong(...) 的结果
        async build(say) {
          const sr = 44100, buf = new AudioBuffer({ length: sr / 5, sampleRate: sr });   // 0.2 秒的“嘀”声
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.sin(2 * Math.PI * 880 * i / sr) * (1 - i / d.length) * 0.5;
          const notes = text.split('\n').map(l => l.trim().split(/\s+/).map(Number))
            .filter(a => a.length >= 2 && !isNaN(a[0]) && !isNaN(a[1]))
            .map(([t, lane]) => ({ t, lane, snd: { s: 'tick', vel: 110, ch: 0, ins: 0, p: 60, dur: 0 } }));
          return ctx.api.makeSong({ title: f.path.split('/').pop(), notes, samples: { tick: buf }, kind: 'DEMO' });
        }
      });
    }
    return items;
  }
});
