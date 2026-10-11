# 鸣域 Resonia 插件接口（第三方模式）v1

用途：让游戏读取更多谱面/曲包格式（如 OJN/OJM、PAK/PT），而**不把这些代码放进公开仓库**。
插件是一个普通 `.js` 文件，由用户在游戏页“第三方 → 载入插件…”里选择；插件源码只保存在用户本机浏览器（IndexedDB），下次打开自动恢复，可随时“移除”。

> 安全：插件是会在页面里运行的程序，只载入你信任的文件。游戏载入前会弹出确认。

## 注册

```js
Resonia.register({
  id: 'my-format',          // 唯一 id（同 id 再次注册会替换旧的）
  name: '显示名', version: '1',
  exts: ['ojn', 'ojm'],     // 接管的扩展名（不带点）；游戏的文件选择框会自动加上这些后缀
  pairs: [['ojn','ojm']],   // 可选：配对格式。只选了其中一种时，游戏会提示并让用户补选另一种
  hide: ['ini'],            // 可选：辅助扩展名。只选了这些文件时不触发本插件，但会一并交给 open()
  match(ents) { return false },   // 可选：扩展名没命中时，仍想处理这批文件就返回 true
  async open(files, ctx) { return [ { name, label, build } ] }
});
```

- `files`：扩展名匹配的文件 `[{ path, ab() }]`（`ab()` 返回 `Promise<ArrayBuffer>`；zip/文件夹里的文件 `path` 带相对路径）。
- `ctx.ents`：这次导入的**全部**文件（含音频、图片）；`ctx.find(文件名, kind)` 按名字找到其中一个（`kind` 为 `'a'` 音频或 `'v'` 图片/视频），找不到返回 `null`。
- `open` 返回谱面条目数组；一条一张谱面。选中时游戏调用 `build(say)`（`say(文字)` 可显示进度），返回歌曲模型。

## 工具 `ctx.api`

| 函数 | 作用 |
|---|---|
| `decodeAudio(arrayBuffer)` | 解码 wav/ogg/mp3/flac → `Promise<AudioBuffer>` |
| `readZip(arrayBuffer)` | 读 ZIP → `[{path, ab()}]` |
| `textDecode(arrayBuffer, 编码)` | 文本解码，编码如 `'utf-8'`、`'shift_jis'`、`'gbk'` |
| `loadBgaAssets([{id, e}])` | 载入 BGA 素材（`e` 为文件对象）→ `{bmps, miss}` |
| `buildRsc(R, 谱面序号, manifest, find, say)` | 如果插件能先转成 `.rsc` 对象，可直接交给游戏构建 |
| `makeSong(o)` | 补全成游戏内部模型（见下） |
| `kv.get(key)` / `kv.set(key, value)` / `kv.del(key)` | 插件私有的本机存储（IndexedDB），值可以是对象或 Uint8Array |

## 歌曲模型 `makeSong(o)`

```js
makeSong({
  title, artist, level, chartName, bpm,
  notes: [{ t:毫秒, lane:0..6, hold:false, end:毫秒(长条), snd:{ s:'采样id', vel:100 } }],
  back:  [{ t:毫秒, s:'采样id', vel:100 }],       // 自动播放的伴奏/BGM
  samples: { 采样id: AudioBuffer },                // 有 samples → 走“音频播放”，设置里显示声卡输出
  bga:  [{ t:毫秒, id:'素材id', l:0|1|2 }], bmps: { 素材id: { i:ImageBitmap } 或 { v:HTMLVideoElement } },
  kind: '显示用的类型名'
})
```

没有 `samples` 时按 MIDI 歌曲处理（需要 `ctl/mev/chan` 等，详见 VOS 解析，一般不需要）。
音符里的 `snd` 若用采样，必须带 `s`；`lane` 为 0～6（7 轨）。

示例见 `plugins/example-demo.js`。

## 配对（pairs）的两种写法

- `['ojn','ojm']`：同名互配。只选了一种，游戏先在已授权的文件夹里找同名的另一种，找不到才提示补选。
- 一对多：`{ a:'pak', b:['pt','ini'], ab:(base,文件名)=>布尔, ba:文件名=>'要找的a文件名', hint:base=>'显示给用户的名字' }`。
  选了 `a` 却没有 `b[0]` 时，用 `ab` 在文件夹里找出全部属于它的文件；选了 `b[0]` 却没有 `a` 时，用 `ba` 算出 `a` 的文件名再找。

插件抛出的错误如果带 `notice = true`，游戏只显示消息本身，不加“导入失败”。
