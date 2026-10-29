# shot-starter · 美术系统 A「深空天文台 / 科研仪器」

一套可直接复制、改内容就能出片的 HyperFrames 浏览器镜头骨架。默认 1920×1080、8 秒、30fps 语境。

```powershell
# 复制到 episode 的镜头目录
Copy-Item templates/shot-starter -Destination content/episodes/<id>/html/<shot-id> -Recurse
npx hyperframes check content/episodes/<id>/html/<shot-id> --strict
npx hyperframes preview content/episodes/<id>/html/<shot-id>
```

`npx hyperframes check templates/shot-starter --strict` 必须保持 **0 findings**。改动后先跑这条命令，再改内容。

## 文件

| 文件 | 作用 | 改不改 |
| --- | --- | --- |
| `index.html` | DOM 结构、设计令牌、全部 CSS、时间轴注册 | 改标签文案与色板 |
| `assets/shot-timeline.js` | GSAP paused timeline 构造器、星场/网格/刻度生成、卫星轨道几何 | 改节奏与几何 |
| `assets/gsap.min.js` | 项目锁定的 GSAP 3.14.2 本地副本（与 `create-episode` 一致） | 不修改 |
| `DESIGN.md` | 本文件 | 可重写为具体镜头说明 |

不要从 `content/episodes/` 之外引用运行时文件；字体走 Google Fonts 自动缓存（`Cormorant Garamond` / `JetBrains Mono` / `Noto Sans SC`）。

## 画面结构（12 层，从后到前）

| z | 层 | 内容 | 动效职责 |
| --- | --- | --- | --- |
| 0 | `#sky` | 冷青径向辉光 + 暖琥珀反差 + 左栏压暗 scrim | 建立：0–1.8s 渐显，6.2s 辉光回落 |
| 1 | `#field` | 48 颗种子星、3 个十字星芒、96px 经纬网格、径线掩膜 | 建立 + 远景视差推近（scale 1→1.025） |
| 2 | `#orbits` | 水平仪器轴、四层同心环、三段刻度弧、行星（大气/明暗/临边光/细环）、准星、卫星 | 主体：环弧绘制、卫星绕行、5.6s 弧线收束 |
| 3 | `#dust` | 4 个模糊浮尘点 | 前景景深：全程缓慢漂移（±14–26px） |
| 4 | `#sweep` | 竖直扫描光带 | 过程：2.35–3.95s 横穿仪器视场 |
| 5 | `#vignette` | 径向暗角 + 上下压暗 | 光影：静态，压住四角、托起主体 |
| 6 | `#type` | eyebrow、中文副题、240px 主数字、单位、两行元数据 | 建立：0.55–1.75s 逐级上浮 |
| 7 | `#readout` | 右上遥测三行 + 琥珀刻度线 | 建立：0.9–1.35s 右对齐淡入 |
| 8 | `#scale` | 顶部方位标尺（45 个刻度 + 4 个角度标签 + AZIMUTH） | 建立：0.3–1.7s 从左绘出 |
| 9 | `#frame` | 四角定位角 + 上下中线标记 | 建立：静帧画框 |
| 10 | `#grain` | `feTurbulence` 静帧颗粒（opacity .075，overlay） | 材质：确定性，不参与动画 |
| 11 | `#scanlines` | 4px 极轻扫描线（opacity .16） | 材质：确定性，不参与动画 |

层与层之间用 z-index 明确排序，**不要**靠 DOM 顺序隐式叠放。暗角压在主体之上、文字之下，既保留空气感又不牺牲文字对比度。

## 设计令牌（`index.html` 顶部 `:root`）

```css
--ink-0 #04070E   画布底          --paper   #EAF2FA  主文字
--ink-1 #07101C   大气            --mist    #A9BFD2  次级文字（对比度 ≈8.9:1）
--ink-2 #0C1A28   仪器面板        --dim     #7E93AA  注释（≈6.0:1）
--line  #1B3247   结构线          --signal  #5FE3D0  青：测量/锁定
--line-hi #2A4A63 高亮结构线      --amber   #F2A65A  琥珀：目标/时钟
                                  --violet  #8E7CFF  紫：参考轨道
```

1920×1080 字号阶（本骨架实际使用值）：

| 角色 | 字体 / 字重 | 字号 | 字距 | 颜色 |
| --- | --- | --- | --- | --- |
| hero 数字 | Cormorant Garamond 500 | 240px / lh .78 | −.012em | `--paper` |
| 中文副题 | Noto Sans SC 400 | 24px | .40em | `--mist` |
| 单位标签 | Noto Sans SC 500 | 27px | .16em | `--paper` |
| eyebrow | JetBrains Mono 500 | 19px | .34em | `--signal` |
| 元数据 | JetBrains Mono 400 | 17px | .06em | `--mist` |
| 遥测 | JetBrains Mono 400 | 16px | .14em | `--mist` / `--amber` |
| 标尺标签 | JetBrains Mono 400 | 14px | 1.6px | `--dim` |

网格：内容左界 156px，上界 96px；主数字基线区 372–626px；轨道圆心 (1252, 452)、外环 r=336；顶部标尺 y=118；底部 886–1080px **留给 Remotion 字幕**，不放任何文字。

## 时间轴（8s）

| 时间 | beat | 发生什么 |
| --- | --- | --- |
| 0.00–1.40 | enter | 大气、网格、星场、轨道系统依次显影；环弧 `stroke-dashoffset` 从 1→0 绘出 |
| 0.55–1.75 | enter | eyebrow → 中文副题 → 主数字 → 单位 → 元数据逐级上浮 14–34px |
| 1.20–5.60 | process | 卫星沿椭圆（rx 336 / ry 132 / −14°）运行一整圈，64 段线性 tween |
| 2.35–3.95 | process | 扫描光带横穿仪器视场（不越过文字），制造"测量"动作 |
| 5.60–7.60 | resolve | 主弧加粗、准星收紧到 0.965、行星临边光提亮、辉光回落 |
| 全程 | ambient | 远景推近 1→1.025、环系进动 3.2°、辉光呼吸 2 次、浮尘漂移 |

缓动约定：入场 `power3.out` / `power4.out`（主数字），绘制 `power2.inOut`，环境运动 `none` 或 `sine.inOut`，不使用 `back.out`（会顶出安全区）。

## 改造成具体镜头（三步）

1. **换文案**：改 `index.html` 中 `#type` / `#readout` / `#scale` 里的短标签。单个标签 ≤8 个汉字或 ≤14 个字符；`#type` 左界固定 156px，别把 hero 数字改到 700px 宽以上（会压到轨道）。
   - hero 数字换成任意数据（`72%`、`3.8×`、`1.6 AU`、`10⁻¹⁵`），Cormorant 的旧式数字与百分号都齐备。
   - 禁止出现 ShotBrief 标题、`SHOT 001`、镜头序号或整句 caption —— 项目校验会拒绝，字幕只属于 Remotion 层。
2. **换几何**：`assets/shot-timeline.js` 顶部 `CX/CY/RX/RY/ROT` 控制卫星轨道；`index.html` 里 `#rings` / `#arcs` / `#planet-group` 的 `cx/cy/r` 控制环系。放大轨道时同步检查 `data-layout-allow-overflow` 标记。
3. **换节奏**：`BEAT` 常量与 `span`（卫星绕行时长）控制过程段；`data-duration`（根节点）与 `#sky` 等 12 个 clip 的 `data-duration` 必须同步改，否则 `clip_ends_past_root_duration` 会报警。

## 三种常见转写

- **数据揭示型**：主数字改为结论值，`#readout` 换成"基准 / 观测 / 差值"三行，卫星轨道改为一颗数据点绕环运行，5.6s 时把 `#arc-main` 换成高亮弧指向结论。
- **过程型（光变曲线 / 轨道周期）**：把 `#field` 换成折线图（SVG path + `stroke-dashoffset`），`#type` 只留一句 ≤6 字的过程标签，轨道系统缩写为右侧缩略图。
- **对比型**：复制一份 `#orbits` 作为左右双系统（同一 y，x 镜像），中间留 120px 缝，用两条不同颜色的 `#arc-main` 同时绘出，`#hero-figure` 换成比值。

## 硬约束（别踩）

- 根节点必须有 `data-composition-id="shot-starter"` / `data-width` / `data-height` / `data-duration`；时间元素带 `class="clip"` + `data-start` + `data-duration` + `data-track-index`（每轨 ≤3 个时间元素）。
- `.clip` 元素自身**不要** tween `opacity` / `visibility` / `autoAlpha`；要淡入就 tween 子元素（本骨架全部如此）。
- 禁止 `Date.now()`、`Math.random()`、hover、网络请求；随机只允许 seeded PRNG（本骨架 `mulberry32(20261028)`）。
- 不要用 CSS `transform` 给已有 GSAP 补间的元素设初值（会触发 `gsap_css_transform_conflict`）；初值一律写进 `fromTo`。
- 单个 composition HTML ≤300 结构行（`<style>` 内容不计）；时间轴逻辑放 `assets/shot-timeline.js`，既满足行数也便于 diff。
- 字体：`font-family` 里出现的每个非通用族都必须能从 Google Fonts 链接解析到，否则 `font_family_without_font_face` 直接失败。
- 留白：y > 886px 是 Remotion 字幕带，不放正文；装饰层用 `data-layout-allow-caption-zone` 显式声明。

## 验收

```powershell
npx hyperframes check templates/shot-starter --strict   # 0 findings
npx hyperframes snapshot templates/shot-starter --at 1.4,3.2,6.8
```

截图自检三点：首帧（0–0.5s）不空、中段（3–5s）有两个以上状态变化、尾帧（6.5–8s）信息完整且没有元素压在字幕带。