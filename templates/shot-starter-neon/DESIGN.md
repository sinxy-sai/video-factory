# shot-starter-neon · 美术系统 D「霓虹东京 / 科技」

第四套可直接复制的 HyperFrames 镜头骨架，适合芯片、AI、网络、城市数据、代码类 `explainer` 与科技感 `cinematic` 镜头。默认 1920×1080、8 秒、30fps 语境。

```powershell
# 复制到 episode 的镜头目录
Copy-Item templates/shot-starter-neon -Destination content/episodes/<id>/html/<shot-id> -Recurse
npx hyperframes check content/episodes/<id>/html/<shot-id> --strict
npx hyperframes preview content/episodes/<id>/html/<shot-id>
```

`npx hyperframes check templates/shot-starter-neon --strict` 必须保持 **0 findings**。

## 与 A / B / C 的分工

| | A 深空天文台 | B 月夜怪盗 | C 纸本编辑 | D 霓虹东京 |
| --- | --- | --- | --- | --- |
| 情绪 | 冷静、测量 | 危险、浪漫 | 克制、权威 | 高能、未来 |
| 光 | 冷青辉光 | 硬边斜切主光 | 暖白纸光 | 双色霓虹雾 + 扫描光带 |
| 形状 | 同心圆、刻度 | 斜线、剪影 | 双线框、纸片 | 透视走廊、HUD、矩阵 |
| 字 | Cormorant 数字 | Noto Serif 巨型字 | Noto Serif + 朱批 | Noto Sans 900 + 等宽 |
| 动效 | 绘制、绕行、扫描 | 下坠、雨、扫光 | 线刻、纸片错位 | 打字、glitch、whip pan |
| 适用 | 机制 / 数据 / 尺度 | 开场 / 转折 / 宣言 | 文献 / 分类 / 历史 | 芯片 / AI / 城市数据 |

## 文件

| 文件 | 作用 | 改不改 |
| --- | --- | --- |
| `index.html` | DOM 结构、设计令牌、全部 CSS、时间轴注册 | 改标签文案与色板 |
| `assets/shot-timeline.js` | 透视网格/城市/热区矩阵/刻度生成，GSAP paused timeline | 改几何与节奏 |
| `assets/gsap.min.js` | 项目锁定的 GSAP 3.14.2 本地副本（与 `create-episode` 一致） | 不修改 |
| `DESIGN.md` | 本文件 | 可重写为具体镜头说明 |

字体走 Google Fonts 自动缓存（`Noto Sans SC` 400/900 + `JetBrains Mono` 400/500）。

## 画面结构（13 层，从后到前）

| z | 层 | 内容 | 动效职责 |
| --- | --- | --- | --- |
| 0 | `#sky` | 夜色渐变、青/品红/紫三团霓虹雾、三面压暗 scrim | 建立：0–1.7s 渐显 |
| 1 | `#field` | 透视网格走廊（灭点 930,520）、近排实心楼体 + 远排描边楼体、窗灯、地平线光带 | 过程：0.2–7.4s 整体 scale 1→1.30 向观众推进 |
| 2 | `#core` | 数据核心：辉光盘、玻璃盘面、四层同心环、51 根径向刻度、6×4 热区矩阵、四角准星 | 主体：环绘制、矩阵点亮、进度收束 |
| 3 | `#fore` | 两团模糊光斑 + 4 粒浮尘，压过主体边缘 | 前景景深：全程缓慢漂移 |
| 4 | `#sweep` | 竖直扫描光带 | 过程：0.25–1.30s 与 4.30–5.65s 两次横穿 |
| 5 | `#vignette` | 径向暗角 + 上下压暗 | 光影：静态，压住四角、托起主体 |
| 6 | `#type` | 左栏：eyebrow、标题、hero 数据、单位、四行终端、注释 | 建立：0.06–0.94s 逐级上浮；终端 1.05s 起打字 |
| 6b | `#corelabel` | 核心状态字样 `SCANNING` → `ZONE LOCK`，与主体同向 whip pan | 过程：3.5s 切换 |
| 7 | `#hud` | 右栏 LIVE FEED：LATENCY / FLOW / NODES / HEAT 四行、进度条、LINK STABLE | 建立 + 落定：1.3s 起填充，5.7s 更新到第二组值 |
| 8 | `#scale` | 顶部界面条：1px 紫线、品红当前段、72 个刻度 | 建立：0.18–1.0s 从左绘出 |
| 9 | `#frame` | 四角 HUD 边角括号 + 四条中线标记 | 建立：0.3–0.64s 逐角画出 |
| 10 | `#grain` | `feTurbulence` 静帧颗粒（seed 11，overlay） | 材质：确定性，不参与动画 |
| 11 | `#texture` | 4px 扫描线 + 3 条 glitch 故障切片 | 过程：3.00–3.14s 4 帧硬切 |

暗角（z5）压在主体之上、文字之下；`#corelabel` 单独提到 z6 并在暗角之上，避免核心状态字被暗角压暗。除装饰层外，正文全部落在 y < 886px。

## 设计令牌（`index.html` 顶部 `:root`）

```css
--night-0  #05030A   画布底            --paper    #F2F5FF  主文字
--night-1  #0B0616   深紫黑            --mist     #A6B2CC  次级文字（≈8.5:1）
--panel    #120B22   HUD / 终端        --magenta  #FF2E88  主强调 / 当前项
--cyan     #00E5FF   数据 / 进度       --lime     #B6FF3C  成功 / 在线
--amber    #FFB020   警示              --violet   #7A5CFF  辅助 / 梯度
```

1920×1080 字号阶（本骨架实际使用值）：

| 角色 | 字体 / 字重 | 字号 | 字距 | 颜色 |
| --- | --- | --- | --- | --- |
| 标题 | Noto Sans SC 900 | 76px / lh 1.02 | −.01em | `--paper` |
| hero 数据 | JetBrains Mono 500 | 148px / lh .9 | −.02em | `--cyan` |
| 终端正文 | JetBrains Mono 400 | 25px / lh 1.6 | .02em | `--mist` |
| HUD 标签 | JetBrains Mono 400 | 14–15px | .22–.30em | `--magenta` / `--mist` |
| HUD 数值 | JetBrains Mono 500 | 20px | .04em | `--paper` |
| 图内注释 | Noto Sans SC 400 | 23px | .04em | `--mist` |
| 核心状态 | JetBrains Mono 400 | 15px | .28em | `--magenta` / `--lime` |

## 构图（原型 11「透视网格走廊」）

- 灭点 (930,520)，主体圆心 (930,620)：外环 r=266、索引环 r=212、进度环 r=160，热区矩阵 6×4、单元格 30px、间距 8px。
- 左栏 x=156、宽 ≤600：eyebrow y=148，标题 y=186，hero y=316（148px），单位 y=496，终端四行 y=560–680，注释 y=744。
- 右栏 HUD 距右 156px、宽 288px：表头 y=148、横规 y=188、四行参数 y=216–490、状态 y=536；刻度梯在右 444px。
- 顶部界面条 y=96；四角括号内缩 96px；底部 886–1080px 只放扫描线/颗粒/暗角，不放文字。
- 高饱和色只出现在 10% 面积内：青色留给 hero 与进度，品红留给强调/当前项，lime 只做「在线/成功」状态。

## 时间轴（8s）

| 时间 | beat | 发生什么 |
| --- | --- | --- |
| 0.00–1.45 | enter | 大气、透视网格、地平线、楼体、窗灯、数据核心、顶部界面条、HUD 括号建立 |
| 0.06–0.94 | enter | eyebrow → 标题 → hero 72.4% → 单位逐级上浮（首帧 0.4s 已有标题与 hero 数值） |
| 0.45–1.45 | enter | 主环画出、四层副环/刻度/准星入场，矩阵以 dim 亮度出现 |
| 1.05–3.00 | process | 终端三行逐字硬显（每行约 8 帧），`>` 前缀随行出现 |
| 0.85–1.95 | enter | HUD 表头、横规、刻度梯、四行参数与进度条 stagger |
| 3.00–3.14 | process | 4 帧 glitch 硬切；主体与核心状态字 900px / 0.1s whip pan 出画再回位 |
| 3.34–3.60 | process | 热区矩阵从 dim 点亮到 lit、索引弧扫入、第四行 `ZONE B LOCK` 打字、状态字切为 `ZONE LOCK` |
| 4.30–5.65 | process | 扫描光带第二次横穿主体 |
| 5.55–7.60 | resolve | 进度环收束到 28%、索引环收紧、HUD 进度条更新到第二组值、状态转 lime、品红下划线画出、峰值热区格脉冲一次 |
| 全程 | ambient | 网格持续推进（scale 1→1.30）、辉光呼吸、浮尘/光斑漂移 |

缓动：入场 `power3.out` / `power4.out`（hero），绘制 `power2.inOut`，glitch 用 `steps(1)` 的 2–3 帧切片，环境 `none` / `sine.inOut`；不使用 `repeat: -1`，循环一律有限次数。

## 改造成具体镜头（四步）

1. **换文案**：改 `#type` / `#hud` / `#corelabel` 的短标签。hero 换成任意指标（`12 ms`、`3.4 GB`、`99.2%`）；终端四行换成真实步骤；**不要**写 ShotBrief 标题、镜号或整句 caption。
2. **换几何**：`assets/shot-timeline.js` 顶部 `VPX/VPY`（灭点）与 `CX/CY`（核心圆心）控制透视与主体位置；`index.html` 中主环 `r` 决定三层环的半径比例，改环时同步改 `#ring-*` 的 `cx/cy/r`。
3. **换数据面**：`COLS/ROWS/CELL/GAP` 控制热区矩阵密度；`TOWERS` 控制线框城市轮廓；HUD 四行进度由 `data-w`（初始值）与 `data-w2`（落定值）驱动，改成真实数值时同步改这两个属性。
4. **换节奏**：`BEAT` 常量控制 build / term / cut / heat / sweep / lock；glitch 的 4 段 `tl.to('#glitch', ...)` 时间点改动能换切点，但总时长不得超过 4 帧，且不要超过 3Hz 闪烁。

## 三种常见转写

- **芯片流水线型**：热区矩阵改为 8×3 工位序列，`core` 换成晶圆/封装截面；终端四行改成「沉积 → 光刻 → 刻蚀 → 封装」，whip pan 改成品红进度条扫过工位。
- **网络状态型**：线框城市保留，核心换成节点拓扑（同心环上的节点 + 连线），HUD 显示延迟/丢包/在线率；glitch 改为链路中断一次。
- **终端日志型**：去掉核心环与热区矩阵，主体改为全屏终端窗口（右侧 HUD 保留），逐行打字成为主叙事；whip pan 改为整屏日志上滚一屏。

## 硬约束（别踩）

- 根节点必须有 `data-composition-id="shot-starter-neon"` / `data-width` / `data-height` / `data-duration`；每个时间元素带 `class="clip"` + `data-start` + `data-duration` + `data-track-index`（每轨 ≤3 个）。
- `.clip` 元素自身**不要** tween `opacity` / `visibility` / `autoAlpha`；淡入只作用于子元素。
- 禁止 `Date.now()`、`Math.random()`、hover、网络请求；随机只允许 seeded PRNG（本骨架 `mulberry32(20261030)`）。
- 不要让 CSS `transform` 与 GSAP 补间同一属性；初值一律写进 `fromTo`。
- 单个 composition HTML ≤300 结构行（`<style>` 不计）；时间轴与生成逻辑放 `assets/shot-timeline.js`。
- 字体：`font-family` 里的每个非通用族都必须能从 Google Fonts 链接解析到。
- 留白：y > 886px 只允许装饰层；`#sky` / `#field` / `#core` / `#fore` / `#sweep` / `#vignette` / `#frame` / `#grain` / `#texture` 已声明 `data-layout-allow-caption-zone`。
- 霓虹辉光的两层 `text-shadow` 必须同色系；色差不超过 ±1px；扫描线 opacity ≤ .085；禁止 >3Hz 的高频闪烁。

## 验收

```powershell
npx hyperframes check templates/shot-starter-neon --strict   # 0 findings
npx hyperframes snapshot templates/shot-starter-neon --at 0.4,4.0,7.4 --no-end
```

截图自检三点：首帧（0.4s）标题/hero 数值与透视网格已成立、焦点可辨；中段（4s）矩阵点亮、终端四行完成、状态字已切（第二个状态变化）；尾帧（7.4s）进度环收束、HUD 状态转 lime、品红下划线完成，且没有文字压进字幕带。