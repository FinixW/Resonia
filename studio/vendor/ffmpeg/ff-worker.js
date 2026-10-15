// 鸣域 Studio：在 Worker 里跑 ffmpeg.wasm（@ffmpeg/core 0.12.6，单线程版，不需要 SharedArrayBuffer）
// 消息：{id, files:[{name,data}], args:[...], out:'文件名'} → {id, ok, data} / {log} / {progress}
importScripts('ffmpeg-core.js');
let ff = null;
onmessage = async e => {
  const { id, files, args, out } = e.data;
  try {
    if (!ff) {
      ff = await createFFmpegCore({});
      ff.setLogger(d => postMessage({ log: d.message || String(d) }));
      ff.setProgress(d => postMessage({ progress: d.progress, time: d.time }));
    }
    for (const f of files || []) ff.FS.writeFile(f.name, f.data);
    ff.exec(...args);
    const ret = ff.ret; ff.reset();
    if (ret !== 0) throw new Error('ffmpeg 返回 ' + ret);
    const data = ff.FS.readFile(out);
    for (const f of files || []) try { ff.FS.unlink(f.name) } catch (x) { }
    try { ff.FS.unlink(out) } catch (x) { }
    postMessage({ id, ok: true, data }, [data.buffer]);
  } catch (err) { postMessage({ id, ok: false, err: String(err && err.message || err) }); }
};
