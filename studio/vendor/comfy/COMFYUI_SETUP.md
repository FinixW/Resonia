# ComfyUI 设置（RTX 4090 · Wan 2.2）

这份素材包配好了两种用法：

- **一键批量**：ComfyUI 开着，在素材包文件夹里运行 `python comfy_batch.py`，所有镜头自动生成到 `out/`
- **手动单个镜头**：把 `comfy/` 里的工作流 JSON 拖进 ComfyUI 窗口，换图、换提示词、点 Run

工作流基于 ComfyUI 官方的 Wan 2.2 模板，只用 ComfyUI 自带节点，不需要装插件。

---

## 1. 安装 / 更新 ComfyUI

用 **ComfyUI Desktop**（Windows 安装版）或便携版都可以。要求是 **2025 年 8 月以后的版本**（自带 Wan 2.2 节点）。已经装了就更新到最新：

- Desktop 版：菜单里检查更新
- 便携版：运行 `update/update_comfyui.bat`

## 2. 下载模型（放到 ComfyUI 的 `models/` 下对应文件夹）

**两种模式都要的：**

| 放到 | 文件 | 大小 |
|---|---|---|
| `models/text_encoders/` | [umt5_xxl_fp8_e4m3fn_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors) | 约 6.7 GB |
| `models/vae/` | [wan_2.1_vae.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors) | 小 |
| `models/loras/` | [wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors) | 较小 |
| `models/loras/` | [wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors) | 较小 |

**首尾帧模式（flf2v，默认）：**

| 放到 | 文件 | 大小 |
|---|---|---|
| `models/diffusion_models/` | [wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors) | 约 14 GB |
| `models/diffusion_models/` | [wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors) | 约 14 GB |

**保留原动作模式（control）：**

| 放到 | 文件 | 大小 |
|---|---|---|
| `models/diffusion_models/` | [wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors) | 约 14 GB |
| `models/diffusion_models/` | [wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors) | 约 14 GB |

文件名不要改，工作流和脚本按这些名字找模型。

## 3. 其他要装的

- **Python 3**（运行 `comfy_batch.py` 和 `assemble.py`，只用标准库，不用 pip 装东西）
- **ffmpeg**，并加进 PATH（`assemble.py` 拼视频、control 模式转控制视频要用）。Windows 可以 `winget install ffmpeg`

## 4. 一键批量生成

1. 启动 ComfyUI，确认浏览器能打开 `http://127.0.0.1:8188`
2. 在素材包文件夹打开命令行：

```
python comfy_batch.py                       # 首尾帧模式，4 步加速
python comfy_batch.py --quality best        # 20 步，不加速，动作更丰富、慢 6~7 倍
python comfy_batch.py --mode control        # 保留原版构图和动作（线稿控制）
python comfy_batch.py --only shot_003,shot_010   # 只做指定镜头（先拿一两个试效果）
python comfy_batch.py --redo                # 重做已经生成过的
python comfy_batch.py --size 832x624        # 显存紧张时用小一点的尺寸
python comfy_batch.py --seed 123            # 换一组随机种子
```

- 默认跳过 `out/` 里已经有的镜头，中途停了直接再运行一次就会接着做
- 不满意某个镜头：删掉 `out/shot_XXX.mp4`，换个 `--seed` 或改 `shots.json` 里那条提示词，再 `--only shot_XXX`
- 重画过的关键帧放进 `keyframes/`（文件名 `shot_XXX_first.png` / `shot_XXX_last.png`），脚本会优先用它们

**4090 上大概的耗时（960×720）：**

| 设置 | 5 秒（81 帧）一段 | 全曲 |
|---|---|---|
| 4 步加速（fast，默认） | 约 2~3 分钟 | 约 1~1.5 小时 |
| 20 步（best） | 约 15 分钟 | 约 6~8 小时，适合挂一晚 |

官方测试数据：4090D 上 640×640、81 帧，加速版约 71 秒，不加速约 513 秒。

## 5. 拼回去

```
python assemble.py --size 1920x1080 --fps 60
```

得到 `bga_remake.mp4`，回 Studio 点“导入重制好的 BGA 视频”，再导出 .rsm。

## 6. 想要更高画质（可选，需要装插件）

Wan 2.2 出来是 960×720、16fps。要更清晰、更顺滑，在拼回去之前对 `out/` 里的每段做：

- **放大**：装 [ComfyUI-SeedVR2_VideoUpscaler](https://github.com/numz/ComfyUI-SeedVR2_VideoUpscaler)（ComfyUI Manager 里搜 SeedVR2），用 3B 或 7B 模型放大到 1080p
- **补帧**：装 [ComfyUI-Frame-Interpolation](https://github.com/Fannovel16/ComfyUI-Frame-Interpolation)，用 RIFE 把 16fps 补到 64fps

处理完的文件用同样的名字放回 `out/`，再运行 `assemble.py`。不做这一步也能用：`assemble.py` 会用 lanczos 放大，并把帧率换算成 60fps（重复帧，不是补帧）。

## 常见问题

- **脚本报“连不上 ComfyUI”**：ComfyUI 没开，或者端口不是 8188（用 `--server http://127.0.0.1:端口`）
- **报模型找不到**：检查第 2 步的文件名和文件夹
- **显存不够（OOM）**：用 `--size 832x624`，或在 ComfyUI 设置里打开低显存模式
- **画面闪、人物变脸**：同一角色的描述保持一致；用重画的关键帧；或者改用 `--mode control`
