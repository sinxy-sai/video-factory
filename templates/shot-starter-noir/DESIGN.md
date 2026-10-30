# shot-starter-noir · 美术系统 B「月夜怪盗 / 黑色电影」

第二套可直接复制的 HyperFrames 镜头骨架，用于 PV、开场、预告与氛围镜头（`cinematic` 模式）。默认 1920×1080、8 秒。

```powershell
Copy-Item templates/shot-starter-noir -Destination content/episodes/<id>/html/<shot-id> -Recurse
npx hyperframes check content/episodes/<id>/html/<shot-id> --strict
npx hyperframes preview content/episodes/<id>/html/<shot-id>
```

`npx hyperframes check templates/shot-starter-noir --strict` 必须保持 **0 findings**。

## 与 A 套的分工

| | A 深空天文台 | B 月夜怪盗 |
| --- | --- | --- |
| 情感 | 冷静、测量、可信 | 危险、浪漫、悬念 |
| 光 | 冷青辉光 + 环形仪器 | 硬边斜切主光 + 月光逆光 |
| 形状 | 同心圆、网格、刻度 | 斜线、剪影、遮幅 |
| 字 | Cormorant 数字 + 等宽标签 | Noto Serif 巨型汉字 + 竖排 |
| 动效 | 绘制、绕行、扫描 | 下坠、扫光、闪烁、雨 |
| 适用 | 机制/数据/尺度解释 | 开场/转折/结论宣言 |

## 文件

| 文件 | 作用 |
| --- | --- |
| `index.html` | DOM、设计令牌、CSS、时间轴注册（≤300 结构行） |
| `assets/shot-timeline.js` | 雨/窗灯生成，GSAP paused timeline 构造器 |
| `assets/gsap.min.js` | 项目锁定 GSAP 3.14.2 本地副本 |
| `DESIGN.md` | 本文件 |

## 画面结构（12 层）

| z | 层 | 内容 | 动效职责 |
| --- | --- | --- | --- |
| 0 | `#sky` | 夜雾渐变、月亮雾、地平线暖雾、左栏压暗 | 建立底色 |
| 1 | `#moon` | 直径 596px 月亮 + 5 个陨石坑 + 外辉光（模糊 30px） | 0.1–1.5s 升起；2.2s 起缓慢上漂 16px |
| 2 | `#shaft` | 斜切光柱多边形（−260,−120 → 1640,1080），硬边高光 | 0.3–1.8s 从左侧扫入；2.2s 起转 2.4° |
| 3 | `#skyline` | 城市剪影（单条 path）+ 14 个琥珀窗灯 | 0.6–1.8s 上浮；窗灯 0.8s 起 stagger |
| 4 | `#vignette` | 径向暗角 + 上下压暗 | 静态；压住四角，托出月光 |
| 5 | `#rain` | 114 条雨线（38 × 3 段），400px 周期无缝循环 | 全程下移，2s 一循环 ×4 |
| 6 | `#card` | 怪盗名片：240×140 纸片 + 红色封印 + 高光扫过 | 0.9–2.0s 从画外下坠并回稳 |
| 7 | `#type` | 600px「月」巨型字 + 竖排「月影」+ 竖排等宽标签 | 1.2–2.25s 淡入上浮 |
| 8 | `#meta` | 左下三行遥测（NIGHT / MOONLIGHT / SILHOUETTE） | 1.4s 起 stagger |
| 9 | `#bars` | 上下 74px 遮幅（近似 2.39:1） | 0–0.55s 从边缘压入，建立电影画幅 |
| 10 | `#grain` | feTurbulence 颗粒，opacity .12 | 确定性静帧 |
| 11 | `#scratches` | 胶片划痕 + 极轻扫描线 | 确定性静帧 |

## 设计令牌

```css
--noir-0 #05060A   画布底          --bone    #F4F0E6  主文字 / 名片纸
--noir-1 #0A0D14   夜雾            --silver  #C3CDDA  次文字（≈9:1）
--noir-2 #141924   剪影面          --slate   #8794A6  注释（≈5.2:1）
--moon   #DCE9F5   月光            --amber   #E8A24C  街灯 / 时间码
--crimson #C2453E  封印红（仅作图形，不做文字色）
```

字号阶：

| 角色 | 字体 / 字重 | 字号 | 字距 | 颜色 |
| --- | --- | --- | --- | --- |
| 巨型字 | Noto Serif SC 600 | 600px / lh .92 | 0 | `--bone` (opacity .92) |
| 中文竖排 | Noto Serif SC 600 | 40px | .46em | `--silver` |
| 名片数字 | Cormorant Garamond 600 italic | 30px | 0 | `--noir-2`（深字压浅纸） |
| 竖排等宽 | JetBrains Mono 400 | 14px | .5em | `--slate` |
| 遥测 | JetBrains Mono 400 | 17px | .18em | `--slate` / `--silver` / `--amber` |

构图：巨型字从左上出血（left −66 / top −168），月亮压在右上（圆心 1576,332），斜切光柱把画面分成两个三角，城市剪影压底，名片落在光学中心偏右（1120,300，−12°）。所有文字都避开月亮亮面，保证对比度。

## 时间轴（8s）

| 时间 | beat | 发生什么 |
| --- | --- | --- |
| 0.00–0.55 | enter | 上下遮幅压入，画幅成立 |
| 0.10–1.80 | enter | 月亮升起 + 辉光扩散 + 光柱从左侧扫入 |
| 0.60–1.80 | enter | 城市剪影上浮，14 盏窗灯依次点亮 |
| 0.90–2.15 | enter | 名片从画外下坠、旋转 −26°→−12° 落定，影子跟进 |
| 1.20–2.25 | enter | 巨型「月」淡入，竖排字与遥测 stagger |
| 0.00–8.00 | ambient | 雨持续下落（2s × 4 循环，400px 周期） |
| 2.20–7.80 | process | 月亮上漂、光柱微转、卡片高光扫过、影子伸长 |
| 5.60–8.00 | resolve | 月光增强、光柱回稳、字形提亮、红色封印脉动一次 |

缓动：下坠用 `power3.out`（重力感，不用 `bounce`），环境用 `sine.inOut`，雨用 `none`，日落式入场不用 `elastic`。

## 改造成具体镜头

1. **换字**：`#type` 的巨型字（默认「月」）换成该镜头的主视觉汉字或数据；竖排字 ≤6 字；左下遥测换成三条真实标签（时间 / 环境 / 结论量）。**不要**写 ShotBrief 标题、镜号或整句 caption。
2. **换名片**：`#card` 里的 `02:47` 与封印可换成任何"物件"——票根、坐标、签名；它的职责是"画外之物入画"，不是标题卡。
3. **换光**：`#shaft` 多边形两点决定光柱角度（当前约 33°）。改角度时同步检查 `data-layout-allow-overflow`，并避免光柱扫过月亮亮面造成对比度下降。
4. **换节奏**：`assets/shot-timeline.js` 中的 `cardX/cardY/cardR` 控制名片落点；雨循环在 `#rain-system` 的两条 tween 中。

## 三种常见转写

- **PV 开场**：去掉名片与遥测，巨型字换成两字主标题字（≤2 字，作图形用），遮幅改成全黑 120px，加一次白线硬切。
- **悬念转折**：名片改为"一小片证据"（照片边角的几何抽象），光柱缩窄，雨加密，尾帧压暗到只剩月亮轮廓。
- **结论宣言**：巨型字换成结论数字（`0.42` / `72%`），竖排字换成一句 ≤6 字结论，名片换成时间戳。

## 硬约束（与 A 套相同，另加 noir 专属）

- 根节点 `data-composition-id="shot-starter-noir"`；12 个 clip 的 `data-duration` 必须与根节点一致。
- `.clip` 上禁止 tween `opacity` / `visibility` / `autoAlpha`；淡入一律 tween 子元素。
- 用 `data-layout-allow-caption-zone` 标注遮幅、雨、剪影等覆盖字幕带的装饰层；y > 886px 不放正文。
- 深色文字只能压在浅色物件上（名片内的 `#141924` 压 `#F4F0E6`），禁止在月光与暗角交界处放小字。
- 雨/星等生成器只能用 seeded PRNG；本模板 `mulberry32(18881107)`。
- 单个 composition HTML ≤300 结构行；时间轴逻辑放 `assets/shot-timeline.js`。

## 验收

```powershell
npx hyperframes check templates/shot-starter-noir --strict   # 0 findings
npx hyperframes snapshot templates/shot-starter-noir --at 1.2,2.6,6.6
```

三点自检：0–0.5s 有画幅与月光、2–5s 名片已落定且雨在动、6.5–8s 月亮最亮且文字仍清晰可读。