# 鸣域 Resonia 谱面与音频包格式（设计草案 v0.2）

> 状态：草案，供讨论。文件后缀、字段名都是暂定名，确认后再定稿。
> 目标：像 O2Jam 的 OJM（音频与 BGA）+ OJN（谱面）那样，**音频包**和**谱面**分开；
> 谱面模型要能装下 rmstZ 支持的各类音游谱面的要素，VOS 只做兼容读取。

## 1. 总体结构

```
歌曲 = 音频包 (.rsm) + 谱面文件 (.rsc)
```

| 文件 | 作用 | 容器 |
|---|---|---|
| `.rsm` 音频包（Resonia Music） | 存歌曲的全部素材：整首音乐、分轨/按键音采样、MIDI、BGA（背景视频/图片）、封面、预览 | 标准 ZIP（`manifest.json` + 资源文件），可用任何压缩工具打开 |
| `.rsc` 谱面（Resonia Chart） | 只存玩法信息：曲目信息、节奏表、一个或多个谱面（难度、键数、音符） | UTF-8 JSON（可再套 gzip）；以后需要时再出紧凑二进制版 |

为什么这样分：
- 一份音频包可以被多个谱面文件复用；一个谱面文件里可以放多个难度、多种键数，**音频只存一份**。
- 谱面是文本 JSON：好调试、好比对、转换工具好写、编辑器好做。体积不是问题（谱面本身很小）。
- 音频包用 ZIP：osz、mcz 等已经是这种做法，浏览器里直接能解。

## 2. 音频包 `.rsm`

`manifest.json`：

```json
{
  "rsm": 1,
  "id": "uuid",
  "tracks":  [{ "id":"bgm", "file":"audio/bgm.ogg", "offsetMs":0, "gain":1 }],
  "samples": [{ "id":"s001", "file":"samples/001.ogg" }],
  "midi":    [{ "id":"m1", "file":"midi/song.mid" }],
  "soundbank": { "kind":"gm", "hint":"Yamaha XG" },
  "media":   [{ "id":"v1", "file":"bga/intro.mp4", "type":"video" },
              { "id":"i1", "file":"bga/bg.png",    "type":"image" }],
  "cover": "cover.png", "preview": { "track":"bgm", "startMs":30000, "lenMs":15000 }
}
```

- **tracks**：整首/分轨音频（ogg、mp3、wav）。
- **samples**：按键音采样（BMS 的 WAV 通道、O2Jam 的 OJM 采样、IIDX 的 2dx 都属于这类）。
- **midi + soundbank**：保留 VOS 那种“MIDI + 音色库”的发声方式（音色库不打进包，只记一个提示）。
- **media**：BGA 素材；什么时候出现、怎么叠放写在谱面里（见 §5）。
- 同一首歌可以只有 `midi`（像 VOS），也可以只有 `tracks`（像录好的歌），也可以混用。

## 3. 谱面文件 `.rsc`

```json
{
  "rsc": 1,
  "meta":   { "title":"", "artist":"", "charter":"", "genre":"", "source":{"format":"vos","game":"CanMusic"} },
  "package":{ "rsm":"song.rsm" },
  "timing": { ... §4 ... },
  "charts": [ { ... §5 ... } ],
  "ext":    { }
}
```

- `rsc` 是格式主版本；**新增字段不改主版本**，读取方忽略不认识的字段；不认识的音符类型原样保留不丢弃。
- `ext` 存“来源游戏专有、暂时没有通用字段”的数据，保证从原格式转进来再转回去不丢信息。

## 4. 时间与节奏表

时间有两种基准，每个谱面选一种（`timebase`）：

- `"tick"`（默认）：位置用节拍刻度，每拍 `ppq` 刻度。`ppq` 可配置（VOS=768，BMS 常 192，MIDI 常 480/960），所以 VOS 可以**无损**导入。
- `"ms"`：位置直接用毫秒，给 osu!、Cytus、Arcaea 这类以毫秒为准的格式用。

节奏表 `timing`（可以每个“时间组”一份，见 `groups`）：

```json
"timing": {
  "ppq": 768,
  "events": [
    { "t":0,    "bpm":120, "sig":[4,4] },
    { "t":3072, "bpm":140 },
    { "t":6144, "stop":384 },
    { "t":9216, "scroll":1.5 }
  ]
}
```

| 字段 | 含义 | 对应的游戏功能 |
|---|---|---|
| `bpm` | 变速（允许小数；负值表示倒走/时停，沿用 ksh 约定） | 全部 |
| `sig` | 拍号（小节线位置） | BMS 小节缩放、tja、msd |
| `stop` | 停止若干刻度（时间在走、谱面不走） | BMS STOP、sm |
| `scroll` | 流速倍率（谱面滚动速度变化，不改变音乐时间） | tja SCROLL、osu SV、HS 变化 |
| `delay` | 谱面整体延迟 | 各格式 offset |

## 5. 谱面 `charts[]`

```json
{
  "id":"7k-hard", "name":"Hard", "level":8, "mode":"keys", "keys":7,
  "timebase":"tick", "ppq":768, "groups":[ ... ], "lanes":[ ... ],
  "notes":[ ... ], "bga":[ ... ], "branches":[ ... ], "judge":{ ... }
}
```

### 5.1 通用音符

每个音符是一个对象，必有 `t`（位置）和 `k`（类型），其余按类型而定：

```json
{ "t":0, "k":"tap",  "lane":2, "snd":{"s":"s001","vel":100} }
{ "t":0, "k":"hold", "lane":3, "len":768 }
{ "t":0, "k":"tap",  "lane":5, "snd":{"midi":"m1","ch":3,"p":60,"vel":90,"len":384} }
```

- `lane`：轨道号；`snd`：按键音，可以是采样（`s`）或 MIDI 音（`midi/ch/p/vel/len`），也可以没有。
- `len`：持续时间（刻度或毫秒，跟 `timebase`）。
- 同一个谱面里的音符按 `t` 排序存放。

### 5.2 类型表（`k`）与它能装下的游戏

| `k` | 含义 | 主要字段 | 对应的游戏/格式 |
|---|---|---|---|
| `tap` | 单点 | lane | VOS、BMS/BME/PMS、IIDX、DTX、osu!mania、Malody key、QQX5 星动、乐动 |
| `hold` | 长条 | lane, len | 同上，含 osu!mania 长条 |
| `slide` | 滑键/带路径的长条 | lane 序列或 path | 节奏大师经典/星动的滑键、Malody slide、QQ 炫舞弦月 |
| `flick` | 划键 | lane/x, dir | Dynamix、Cytus2 |
| `drum` | 太鼓类（大/小、连打、气球） | color, big, len, hits | tja、osu!taiko、Malody taiko |
| `catch` | 接物（位置连续） | x, hdash | osu!catch、Malody catch |
| `step` | 踏板方向键 | lane, dir | msd/sm/ssc/dwi/ucs/pydance、Malody step、DDR |
| `knob` | 旋钮/激光（带路径、有 tilt） | side, path[], tilt | SOUND VOLTEX（vox/ksh） |
| `arc` | 空中弧线/地面轨道（含 anglex/angley） | from, to, easing, color, group | Arcaea（aff） |
| `circle` | 平面点击（x,y）与滑条曲线、转盘 | x, y, curve[], spin | osu!、Malody pad/ring |
| `page` | 扫描线分页的点击 | page, x, y, drag[] | Cytus、Cytus2 |
| `ext:<名字>` | 其他游戏的特殊音符 | 任意 | 不认识就保留、不播放 |

> “轨道/坐标”两套都有：键位类用 `lane`（整数），自由坐标类用 `x`/`y`（0～1 的小数，左上角为原点）。

### 5.3 时间组与分支（对应 Arcaea timinggroup、tja 分歧）

- `groups[]`：一个谱面可以有多个“时间组”，每组有自己的节奏表、流速、角度，音符用 `g` 指定所属组（默认主组）。
- `branches[]`：分歧谱面（普通/玉/达人等），每个分支是一组音符的覆盖，附带进入条件（准确率、连击等）。

### 5.4 BGA 与特效

```json
"bga": [
  { "t":0,    "media":"v1", "layer":0, "fit":"cover" },
  { "t":9216, "media":"i1", "layer":1, "alpha":0.6, "fade":384 }
]
```

- 以刻度/毫秒为准的出场时间、层级、透明度、淡入淡出；视频从包里解码。
- 还可以放“特效事件”（闪光、屏幕颤动、轨道变色等），用 `fx` 数组，不认识的特效忽略。

### 5.5 判定与计分

`judge`：判定窗口、生命条、计分规则可以按谱面单独指定，不指定则用游戏默认值（现在的 HIT ±120ms 等）。

## 6. 与 VOS 的关系

- 游戏继续直接读 VOS（兼容），并把它转成内部的同一个谱面模型来玩。
- 提供 **VOS → .rsm + .rsc** 的转换器：VOS 的每条声部变成 `midi` 或采样音符，第 17 条谱面轨道变成一个 `7K` 谱面，`ppq=768`，节奏表来自内嵌 MIDI。
- VOS 里没有的东西（多难度、BGA）转换后为空，由编辑器补。

## 7. rmstZ 功能覆盖对照

| rmstZ 功能 | 新格式如何承接 |
|---|---|
| 38 种谱面的读入、部分写出 | 通用音符类型 + `ext` 无损保留；每种格式单独写读入/写出转换器（分批做） |
| 谱面播放（bms/tja/osu/imd/mc/aff/BanG Dream 风格） | 播放用同一个谱面模型，游戏里按 `mode` 选择画法（分阶段做，先 7K） |
| 音频解析与“音波采谱” | 编辑器里做：读 `tracks` 波形，生成 `tap` 音符 |
| 音频转换、图片缩放 | 打包工具里做（转 ogg、缩放封面/BGA） |
| 包文件提取（zip/osz/mcz/ojm/2dx/s3p/pak…） | 导入工具：解开后把音频放进 `.rsm`，谱面转成 `.rsc` |
| “音键作谱”（插件规则自动作谱） | 编辑器里的自动作谱插件（以后） |

## 8. 谱面制作工具（计划）

网页版，放在同一仓库里，用 Pages 直接打开，不需要安装：

1. **第一阶段（MVP）**：载入 `.rsm`，显示波形，7K 放置/删除/移动/复制音符（tap、hold），节奏表编辑，试玩，导出 `.rsc`；导入 VOS。
2. **第二阶段**：多难度、多键数（4K～8K）、按键音/采样绑定、BGA 时间轴、撤销/重做、自动保存。
3. **第三阶段**：其他音符类型与对应编辑界面、其他格式的导入导出、音波采谱、自动作谱插件。

## 9. 待定的问题

1. 文件后缀与名称（暂定 `.rsm` / `.rsc`）。
2. 谱面文件第一版用 JSON，是否同意？（以后再出二进制版）
3. 音频包的声音：先支持“MIDI + 音色库”和“录好的音频”两种，是否同意？
4. 第一批要优先支持的来源格式（除 VOS 以外）：例如 BMS、osu!mania、OJN？
5. rmstZ 的代码是否有授权？我只借鉴“它支持哪些功能”，**不会复制它的代码**；各格式的读写由我们自己实现。

## 10. 已实现的部分（游戏 v0.9.10）

- 读取：`.rsc`（单个 JSON，可含多个谱面/难度）、`.rsm`（ZIP：`manifest.json`、`charts/*.rsc`、`samples/*`、`bga/*`）；也可把 `.rsc` 与 `.rsm` 一起多选。
- 导出：游戏“转换”栏可把当前歌曲（VOS 或 BMS）导出为 `.rsm`（含谱面）或只导出 `.rsc`。
- 当前实现使用 `timebase:"ms"`；`tick` 基准、`timing` 节奏表、其他音符类型尚未实现（读取时忽略不认识的 `k`）。
- 在 §5 基础上新增了两个字段：
  - 谱面 `back[]`：自动播放的伴奏事件 `{t, snd}`（BMS 的 BGM 通道、VOS 的非按键声部）。
  - `ext.vos`：VOS 的 MIDI 控制信息（`ctl`、`mev`、`chan`、`tracks`），用来无损还原 VOS 的发声；音色库不打进包。
- 谱面 `scratch:true`：第 0 轨是转盘轨道（`lanes` 包含它）；`scroll`：谱面的流速倍率（如 DJMAX 的 MeasureScale、EZ2DJ 的 .ini）。游戏 v0.9.34 起读取。
- 谱面 `scene`：通用 BGA 场景模型（RBGA，见 RBGA.md），贴图为清单 `media` 里的图片素材。游戏 v0.9.35 起读取。
- `snd` 取值：采样 `{s:"采样id",vel}`，或 MIDI 音 `{midi:"vos",ch,ins,p,vel,len}`。
- BGA 事件：`{t, media:"素材id", layer:0|1|2}`，layer 0 为底层，1、2 为叠加层（纯黑当作透明）；叠加层引用未定义素材表示清空，底层引用未定义素材表示保持上一帧（BMS 兼容约定）。
