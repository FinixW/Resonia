# ffmpeg.wasm（只在 Studio 导出 BMS 的 BGA 视频为 .mpg / .mp4 时才会下载）

- `ffmpeg-core.js`、`ffmpeg-core.wasm`：来自 npm 包 `@ffmpeg/core@0.12.6`（单线程版，MIT 许可的封装；内含的 FFmpeg 及 x264 等库按各自的 LGPL/GPL 许可发布，源码见 https://github.com/ffmpegwasm/ffmpeg.wasm 与 https://ffmpeg.org ）。
- `ff-worker.js`：鸣域 Studio 自己写的 Worker 封装（同源加载，不需要 SharedArrayBuffer / 特殊响应头）。
