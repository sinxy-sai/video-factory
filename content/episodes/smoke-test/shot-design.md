---
state: shot-design-approved
approvals:
  content: true
  storyboard: true
  shot-design: true
---

# smoke-test 镜头设计（单镜 / 5.0 s）

## 美术系统

采用 `docs/ART_DIRECTION.md` 的 **系统 A「深空天文台 / 科研仪器」**：近黑底色、冷青测量光、琥珀时钟色、紫参考轨道，Cormorant Garamond 数字 + JetBrains Mono 遥测 + Noto Sans SC 中文短标签。系统 A 的仪器感正好对应"管线自检"这件事本身——画面看起来像一台在测自己的探测器。

## shot-001 管线自检 / 5.0 s / 150 帧

- **英雄帧（hero frame）**：左侧 240px 的 `1:1` 巨型比值、下方两行元数据（`T+0.000 s` / `T+5.000 s`），右侧轨道系统里一颗卫星停在轨道最高点，右上角三行遥测（`FRAME 0150` / `SEED 20261028` / `REPRODUCIBLE`）。英雄帧在 3.6 s，也就是过程结束、结论成立的那一帧。
- **构图原型**：非对称三分——文字压在左三分之一并为左栏 scrim 托底，轨道系统圆心在 (1252, 452) 占据右三分之二，顶部方位标尺横贯全宽，四角定位角把画面钉成一块仪器面板。
- **焦点**：`1:1` 巨型比值与右侧行星在视线上的夹角；两者之间没有任何元素抢注意力。
- **层级**：① 巨型比值 → ② 中文单位与拉丁注记 → ③ 行星与轨道系统 → ④ 遥测与标尺 → ⑤ 颗粒、扫描线、浮尘。
- **调色板**：`#04070E` 画布底 / `#07101C` 大气 / `#EAF2FA` 主文字 / `#A9BFD2` 次级 / `#7E93AA` 注释 / `#5FE3D0` 青（测量）/ `#F2A65A` 琥珀（时钟）/ `#8E7CFF` 紫（参考轨道）。
- **质感**：`feTurbulence` 静帧颗粒 7.5%、1px/4px 扫描线 16%、径向暗角、96px 经纬网格、48 颗种子星与 3 处十字星芒。
- **运动中职责**：
  - 显影（0–1.1 s）——建立：大气、网格、星场、轨道、排版依次到位，让观众先看到"仪器在开机"。
  - 卫星绕行（1.1–3.6 s）——过程：唯一连续位移，证明时间轴可以被任意 seek 到任意帧而不跳变。
  - 扫描光带（1.9–2.9 s）——过程：横穿仪器视场，制造一次"测量"动作，且不越过左栏文字。
  - 结论（3.6–4.6 s）——强调：主弧加粗、准星收紧到 0.965、临边光提亮、比值转白。
- **转场**：`fade-through-black` 收尾（本片是单镜，收尾即淡出到黑）。

## 字幕与文字归属

Remotion 负责唯一一条字幕："这支片子只由帧时间驱动，任何一帧都能重跑复现。" 镜头内只保留拉丁仪器标签和 `1:1`、`帧对帧复现` 这类短关系标签；ShotBrief 标题「管线自检」、`SHOT 001`、整句字幕都不进 HTML。

## 连续性

单镜，无 `inherits`。`leaves` 声明 `orbit-system`、`hero-ratio`、`instrument-frame`，供后续若扩展为多镜时复用。

## 实现

- 渲染器：`browser`（HyperFrames + 本地 GSAP 3.14.2 副本）。
- 源码：`html/shot-001/index.html` + `assets/shot-timeline.js`，结构行数 ≤300，时间轴逻辑放在 assets 里。
- 字体：本镜不引用远程 Google Fonts，`font-family` 走系统已装字体栈（Cormorant Garamond / JetBrains Mono / Noto Sans SC 依次回退到 serif / monospace / sans-serif），保证离线可复现。
- 确定性：只用 `mulberry32(20261028)` 播种随机；不使用 `Date.now()`、`Math.random()`、hover 或网络请求。
- 验收命令：`npx hyperframes check content/episodes/smoke-test/html/shot-001 --strict`（0 findings）、`npm run validate-episode-shots -- smoke-test`、`npm run render-episode -- smoke-test`、`npm run verify-episode-output -- smoke-test`。