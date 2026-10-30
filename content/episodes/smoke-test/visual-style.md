# smoke-test 视觉风格（美术系统 A「深空天文台 / 科研仪器」）

## 为什么选系统 A

这支片子要说的事是"管线在自检"，所以画面本身就做成一台在测自己的仪器：冷青测量光、琥珀时钟色、紫参考轨道、遥测读数。系统 A 的全部构件（经纬网格、同心环、刻度弧、四角定位角、方位标尺）都天然是"读数"而不是"装饰"，不必再额外发明视觉语言。

## 色板（角色化）

| 色值 | 角色 | 用在哪 |
|---|---|---|
| `#04070E` | 画布底 | 全画面底色、遮幅黑边 |
| `#07101C` | 大气 | 径向冷辉光的中心色 |
| `#0C1A28` | 仪器面板 | 环系内部填充、行星暗面 |
| `#1B3247` / `#2A4A63` | 结构线 / 高亮结构线 | 经纬网格、水平仪器轴、标尺基线 |
| `#EAF2FA` | 主文字 | `1:1` 比值、星点、临边光 |
| `#A9BFD2` | 次级文字 | 中文单位标签、元数据（对比度 ≈8.9:1） |
| `#7E93AA` | 注释 | 标尺刻度与角度标签（≈6.0:1） |
| `#5FE3D0` | 青 · 测量 / 锁定 | eyebrow、主弧、扫描光带、卫星 |
| `#F2A65A` | 琥珀 · 目标 / 时钟 | 遥测首行、内环、行星细环 |
| `#8E7CFF` | 紫 · 参考轨道 | 卫星椭圆路径与第三段刻度弧 |

## 字体与字号阶（1920×1080）

| 角色 | 字体 / 字重 | 字号 | 字距 |
|---|---|---|---|
| hero 比值 | Cormorant Garamond 500 | 240px / lh 0.78 | −0.012em |
| 中文单位 | Noto Sans SC 500 | 27px | 0.16em |
| 中文副题 | Noto Sans SC 400 | 24px | 0.40em |
| 拉丁注记 | JetBrains Mono 400 | 14px | 0.24em |
| eyebrow | JetBrains Mono 500 | 19px | 0.34em |
| 元数据 / 遥测 | JetBrains Mono 400 | 16–17px | 0.06–0.14em |
| 标尺标签 | JetBrains Mono 400 | 14px | 1.6px |

字体栈全部回退到系统已有族名（`Cormorant Garamond, serif` / `JetBrains Mono, monospace` / `Noto Sans SC, sans-serif`），本镜不引用远程字体服务，保证离线与 CI 可复现。

## 构图与网格

- 内容左界 156px、上界 96px；hero 比值基线区 372–626px；轨道圆心 (1252, 452)、外环 r=336；顶部标尺 y=118。
- **y > 886px 是 Remotion 字幕带**，只放装饰（浮尘、扫描线、颗粒），不放任何正文。
- 12 层 z-index 明确排序：0 sky → 1 field → 2 orbits → 3 dust → 4 sweep → 5 vignette → 6 type → 7 readout → 8 scale → 9 frame → 10 grain → 11 scanlines。

## 运动语言

| 运动 | 职责 | 缓动 |
|---|---|---|
| 大气 / 网格 / 星场显影 | 建立 | `power1.out` – `power2.out` |
| 环弧 `stroke-dashoffset` 绘出 | 建立 | `power2.inOut` |
| 卫星绕行（64 段线性） | 过程 | `none`（保证任意 seek 精确） |
| 扫描光带横穿 | 过程 | `power2.inOut` |
| 准星收紧 / 弧加粗 / 比值转白 | 强调 | `power2.out` |
| 浮尘漂移 / 辉光呼吸 | 氛围 | `sine.inOut` |

不使用 `back.out`（会把元素顶出安全区），不使用任何随时间随机或交互触发的动画。

## 材质与叠加

- `feTurbulence` 静帧颗粒，`opacity .075`、`mix-blend-mode: overlay`，确定性。
- 4px 极轻扫描线，`opacity .16`，静态。
- 径向暗角压在主体之上、文字之下：既保留空气感，又不牺牲文字对比度（对比度检查 60/60 通过）。

## 连续性规则

单镜，无继承。声明 `leaves`：`orbit-system`、`hero-ratio`、`instrument-frame`——如果这支片子将来扩成多镜，后续镜头只允许继承这三样，其余必须重新设计。

## 边界

`captionMode: required` 的一条字幕（138/150 帧）让 Remotion 字幕层被真实渲染一次；`theme` 使用 `clear-science`，与美术系统 A 的冷色仪器感一致。