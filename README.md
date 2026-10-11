# 鸣域 · Resonia
HTML5 在线音乐游戏，播放 VOS/VOW 谱面（7K）。

- `index.html`：游戏本体（单文件）。
- `songs/`：可选的在线曲库。把 .vos/.vow 放进去，运行 `python3 tools/make-index.py` 更新清单 `songs/index.json`，页面里就会出现“曲库”卡片。
- 公开仓库里的曲库谁都能下载，请只放你有权公开的曲目。


## 工具与插件

- **Studio 工具页**（`studio/`，Pages 上为 `/studio/`）：导入 BMS 文件夹 / 压缩包 / VOS / `.rsm` / `.rsc`，勾选谱面，一次导出为 `.rsm` 曲包（多张谱面共用同一份音频和 BGA）或 `.rsc`。谱面编辑器开发中。
- **第三方插件**（游戏页“第三方”栏）：在本机载入 `.js` 插件来读取更多格式，接口见 `docs/PLUGIN-API.md`，示例 `plugins/example-demo.js`。Studio 页与游戏页各自内置一份解析代码（`parseBms` / `parseVos` / ZIP 读写），修改时需要同步。
