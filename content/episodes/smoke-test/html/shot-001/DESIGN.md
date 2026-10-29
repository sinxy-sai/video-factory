# Shot 001 · 管线自检 / 美术系统 A「深空天文台」

5.0 秒 / 150 帧的仪器面板镜头，用来验证整条生产管线。复制自 `templates/shot-starter`，改了文案、时长与遥测读数。

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` | DOM 结构、设计令牌、全部 CSS、时间轴注册（284 行） |
| `assets/shot-timeline.js` | GSAP paused timeline 构造器、星场/网格/刻度生成、卫星轨道几何 |
| `assets/gsap.min.js` | 项目锁定的 GSAP 3.14.2 本地副本 |

## 画面结构（12 层，从后到前）

| z | 层 | 内容 | 动效职责 |
|---|---|---|---|
| 0 | `#sky` | 冷青径向辉光 + 暖琥珀反差 + 左栏压暗 scrim | 建立：0–0.4 s 渐显，4.0 s 辉光回落 |
| 1 | `#field` | 48 颗种子星、3 个十字星芒、96px 经纬网格、径线掩膜 | 建立 + 远景视差推近（scale 1→1.022） |
| 2 | `#orbits` | 水平仪器轴、四层同心环、三段刻度弧、行星（大气/明暗/临边光/细环）、准星、卫星 | 主体：环弧绘制、卫星绕行、3.6 s 弧线收束 |
| 3 | `#dust` | 4 个模糊浮尘点 | 前景景深：全程缓慢漂移 |
| 4 | `#sweep` | 竖直扫描光带 | 过程：1.9–2.9 s 横穿仪器视场 |
| 5 | `#vignette` | 径向暗角 + 上下压暗 | 光影：静态，压住四角、托起主体 |
| 6 | `#type` | eyebrow、中文副题、240px 巨型比值、单位、两行元数据 | 建立：0.30–0.74 s 逐级上浮 |
| 7 | `#readout` | 右上遥测三行 + 琥珀刻度线 | 建立：0.52–0.58 s 右对齐淡入 |
| 8 | `#scale` | 顶部方位标尺（45 个刻度 + 4 个时间标签 + TIMELINE） | 建立：0.18–0.55 s 从左绘出 |
| 9 | `#frame` | 四角定位角 + 上下中线标记 | 建立：静帧画框 |
| 10 | `#grain` | `feTurbulence` 静帧颗粒（opacity .075，overlay） | 材质：确定性，不参与动画 |
| 11 | `#scanlines` | 4px 极轻扫描线（opacity .16） | 材质：确定性，不参与动画 |

## 本镜文案（关系标签，不含标题/镜号/字幕）

- eyebrow：`DETERMINISTIC RENDER`
- 中文副题：`帧时间驱动 · 逐帧复现`
- hero 比值：`1:1`，单位 `帧对帧复现`，拉丁注记 `FRAME-EXACT`
- 元数据：`T+0.000 s` / `T+5.000 s`
- 遥测：`FRAME 0150` / `SEED 20261028` / `REPRODUCIBLE`
- 标尺：`T+0.0` / `T+1.7` / `T+3.4` / `T+5.0`，右端 `TIMELINE`

ShotBrief 标题「管线自检」、`SHOT 001`、整句字幕都不在 HTML 内——字幕由 Remotion 绘制。

## 时间轴（5.0 s）

| 时间 | beat | 发生什么 |
|---|---|---|
| 0.00–1.10 | enter | 大气、网格、星场、轨道系统、排版依次显影；环弧以 `stroke-dashoffset` 绘出 |
| 1.10–3.60 | process | 卫星沿椭圆（rx 336 / ry 132 / −14°）运行一整圈，64 段线性 tween |
| 1.90–2.90 | process | 扫描光带横穿仪器视场（不越过左栏文字） |
| 3.60–4.60 | resolve | 主弧加粗、准星收紧到 0.965、行星临边光提亮、比值转白、辉光回落 |
| 全程 | ambient | 远景推近 1→1.022、环系进动 2.4°、辉光呼吸 2 次、浮尘漂移 |

## 硬约束

- 根节点 `data-composition-id="shot-001"` / `data-width="1920"` / `data-height="1080"` / `data-duration="5"`；12 个时间元素的 `data-duration` 全部同步为 5。
- `.clip` 元素自身不 tween `opacity` / `visibility` / `autoAlpha`，淡入一律作用于子元素。
- 没有 `Date.now()`、`Math.random()`、hover 或网络请求（本镜已移除远程字体 `<link>`，字体走系统栈回退）。
- y > 886px 是 Remotion 字幕带，本镜只在那里放浮尘、扫描线与颗粒。

## 验收

```powershell
npx hyperframes check content/episodes/smoke-test/html/shot-001 --strict   # 0 findings
npx hyperframes snapshot content/episodes/smoke-test/html/shot-001 --at 0.6,2.4,4.4
```

截图自检三点：首帧（0–0.5 s）不空、中段（2.4 s）卫星在轨道中段且扫描光带刚离场、尾帧（4.4 s）读数完整且没有元素压在字幕带。