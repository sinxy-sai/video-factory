# shot-starter-editorial · 美术系统 C「纸本编辑 / 博物馆」

第三套可直接复制的 HyperFrames 镜头骨架，适合历史、生物分类、地理、艺术、文献解读类 `explainer` 镜头。默认 1920×1080、8 秒、30fps 语境。

```powershell
# 复制到 episode 的镜头目录
Copy-Item templates/shot-starter-editorial -Destination content/episodes/<id>/html/<shot-id> -Recurse
npx hyperframes check content/episodes/<id>/html/<shot-id> --strict
npx hyperframes preview content/episodes/<id>/html/<shot-id>
```

`npx hyperframes check templates/shot-starter-editorial --strict` 必须保持 **0 findings**。改动后先跑这条命令，再改内容。

## 与 A / B / D 的分工

| | A 深空天文台 | B 月夜怪盗 | C 纸本编辑 | D 霓虹东京 |
| --- | --- | --- | --- | --- |
| 情绪 | 冷静、测量 | 危险、浪漫 | 克制、权威 | 高能、未来 |
| 光 | 冷青辉光 | 硬边斜切主光 | 暖白纸光 + 纸边暗角 | 霓虹雾 + 透视走廊 |
| 形状 | 同心圆、刻度 | 斜线、剪影 | 双线框、纸片、线刻 | 网格、HUD、矩阵 |
| 字 | Cormorant 数字 | Noto Serif 巨型字 | Noto Serif 标题 + 朱批编号 | Noto Sans 900 + 等宽数据 |
| 动效 | 绘制、绕行、扫描 | 下坠、雨、扫光 | 线刻绘制、纸片错位、朱批 | 打字、glitch、whip pan |
| 适用 | 机制 / 数据 / 尺度 | 开场 / 转折 / 宣言 | 文献 / 分类 / 历史 | 芯片 / AI / 城市数据 |

## 文件

| 文件 | 作用 | 改不改 |
| --- | --- | --- |
| `index.html` | DOM 结构、设计令牌、全部 CSS、时间轴注册 | 改标签文案与色板 |
| `assets/shot-timeline.js` | GSAP paused timeline、叶片/脉序/剖面几何生成、朱批路径 | 改几何与节奏 |
| `assets/gsap.min.js` | 项目锁定的 GSAP 3.14.2 本地副本（与 `create-episode` 一致） | 不修改 |
| `DESIGN.md` | 本文件 | 可重写为具体镜头说明 |

不要从 `content/episodes/` 之外引用运行时文件；字体走 Google Fonts 自动缓存（`Noto Serif SC` / `Cormorant Garamond` / `Noto Sans SC` / `JetBrains Mono`）。

## 画面结构（10 层，从后到前）

| z | 层 | 内容 | 动效职责 |
| --- | --- | --- | --- |
| 0 | `#paper` | 暖白纸底渐变、三处老化色斑、暖色纸边暗角 | 建立：0–1.5s 渐显 |
| 1 | `#fiber` | `feTurbulence` 低频纸纤维（seed 3），正片叠底 | 材质：确定性静帧 |
| 2 | `#sheets` | 图版下两张垫纸（paper-deep），露出 8–14px 错位 | 过程：1.2s 起两张垫纸分别横移 8 / 13px |
| 3 | `#plate` | 双线图版框、银杏叶线刻、二叉脉序、叶背剖面插图、引线、编号、比例尺、朱批圈注/下划线 | 主体：轮廓 → 主脉 → 分叉 → 末梢 → 剖面逐段绘制 |
| 4 | `#fore` | 压过图版右下角的纸片 + 5 条纤维浮尘 | 前景景深：纸片从画外落定，浮尘缓慢漂移 |
| 5 | `#type` | 页眉、大标题、拉丁引文、两行正文、结论标签、页脚 | 建立：0.04–1.5s 逐级上浮 |
| 6 | `#caption` | 图注编号（朱批）+ 图注说明，贴图版左下 16px | 建立：3.35s 起淡入 |
| 7 | `#legend` | 右栏 LEGEND：三个编号与说明 | 建立：3.75s 起 stagger |
| 8 | `#frame` | 1px 竖规线、四角裁切标记、朱印 | 建立 + 落定：6.3s 朱印锁定 |
| 9 | `#tooth` | 高频纸齿颗粒（seed 11），压在全部文字之上、极轻 | 材质：确定性静帧 |

层与层之间用 z-index 明确排序，**不要**靠 DOM 顺序隐式叠放。暗角属于第 0 层，压在纸底之上、文字之下；图版与文字都不进 y > 886px 的字幕带。

## 设计令牌（`index.html` 顶部 `:root`）

```css
--paper       #F3EDE1   纸底              --ink        #1E1A16  主墨
--paper-deep  #E7DECB   纸背 / 叠层       --ink-soft   #4A4238  次墨（≈8.5:1）
--paper-hi    #FBF7EC   图版纸            --rubric     #B23A2E  朱批（≈5.1:1）
--rule        #C9BBA2   纸规线            --museum     #2F5D7C  博物馆蓝：图版框
--leaf        #B8892F   金箔：极少量点缀
```

1920×1080 字号阶（本骨架实际使用值）：

| 角色 | 字体 / 字重 | 字号 | 字距 | 颜色 |
| --- | --- | --- | --- | --- |
| 大标题 | Noto Serif SC 700 | 104px / lh 1.16 | .02em | `--ink` |
| 拉丁引文 | Cormorant Garamond 500 italic | 48px / lh 1.3 | .01em | `--ink-soft` |
| 正文 | Noto Serif SC 400 | 34px / lh 1.7 | .03em | `--ink` |
| 结论标签 | Noto Serif SC 400 | 36px | .06em | `--ink` |
| 图注编号 | JetBrains Mono 500 | 16px | .24em | `--rubric` |
| 图注说明 | Noto Sans SC 400 | 22px | .04em | `--ink-soft` |
| 页眉 / 页脚 | JetBrains Mono 400 | 14px | .20–.34em | `--ink-soft` |
| 图版编号 | JetBrains Mono 500 | 16px | 1.2px | `--rubric` |

## 构图（原型 12「书页跨版」）

- 左栏正文 x=120、宽 ≤600：页眉 y=104，大标题 y=172（104px），引文 y=336，正文 y=458/516，结论 y=650，页脚 y=840。
- 右栏图版：外框 (792,112) 760×716，内框 (800,120) 744×700；双线间距 8px。
- 叶片基部 (1178,620)，扇形张角 212°–332°，外缘半径 356，顶端缺口深 60px；叶柄落至 y≈768。
- 剖面插图 (840,624) 236×138，位于图版左下，与主叶不重叠；比例尺 (1340,796) 长 120px。
- 图注贴图版左下：编号 x=792、说明 x=900，y≈838–860。
- 竖规线 x=776 从 y=96 到 y=886；四角裁切标记与 y>886px 仅作装饰。
- 右栏 LEGEND 从 x=1600 起，宽度落在 1764 安全线内；朱印 (1668,668) 46×46。

## 时间轴（8s）

| 时间 | beat | 发生什么 |
| --- | --- | --- |
| 0.00–1.00 | enter | 纸底、纤维、两张垫纸、图版纸面、双线框、竖规线建立 |
| 0.04–0.90 | enter | 页眉 → 大标题 → 引文 → 正文逐级上浮（首帧 0.4s 已有标题与图版框） |
| 0.78–1.83 | process | 叶片外轮廓（双线）与叶柄画出 |
| 1.42–2.50 | process | 9 支主脉、18 段分叉、36 段末梢按 `center` stagger 绘出 |
| 2.05–2.65 | process | 叶背剖面插图与 100+ 根组织刻度绘出 |
| 2.68–3.13 | process | 比例尺与 `5 mm` 标签一起出现 |
| 3.00–4.05 | resolve | 朱批圈注分叉、标题下划线画出；图注编号与说明入场 |
| 3.75–4.30 | resolve | 右栏 LEGEND 三行 stagger |
| 4.30–5.30 | hold | 分叉/末梢略加重、编号 2 脉冲一次，读得出「二分」 |
| 5.40–7.80 | resolve | 图版整体 1.5% 推近、纸张与文字反向位移 −4 / −5px |
| 5.50–6.85 | resolve | 结论「二叉脉序」、DICHOTOMOUS、页脚、朱印依次落定 |

缓动约定：入场 `power3.out` / `power4.out`（大标题），线刻 `power2.inOut`，朱批 `power2.inOut`，环境 `sine.inOut`，**不用** `bounce` / `back.out`。

## 改造成具体镜头（四步）

1. **换文案**：改 `#type` / `#caption` / `#legend` 里的短标签与 `#scale-label` 的单位。单个标签 ≤8 个汉字或 ≤14 个字符；`ShotBrief.title`、`SHOT 001`、整句 caption 一律禁止出现在镜头里。
2. **换标本**：`assets/shot-timeline.js` 顶部 `BASE`（基部坐标）、`SPREAD`（扇形张角与主脉数）、`RIM`（外缘半径/缺口深度/缺口宽度）控制叶形；脉序密度由 `SPREAD.count` 与两级分叉循环决定。放大图版时同步检查 `#plate` / `#fore` 的 `data-layout-allow-overflow`。
3. **换剖面**：`assets/shot-timeline.js` 中 `#inset-ticks` 的三段循环（上表皮 / 栅栏 / 海绵 / 下表皮）可替换成任意组织剖面；保持 4 条横向分界线与 1 处气孔即可读懂层次。
4. **换节奏**：`BEAT` 常量控制 resolve 起点；`data-duration`（根节点）与 10 个 clip 的 `data-duration` 必须同步改，否则 `clip_ends_past_root_duration` 会报警。

## 三种常见转写

- **文献解读型**：左栏换成「原文一句 + 出处」，右栏图版换成手稿页的局部放大；线刻改为描红字迹，朱批圈注落在关键词上。
- **分类图版型**：图版内并置 3–4 个同科标本剪影，编号引线指向差异部位；LEGEND 换成「共同点 / 差异点」两栏。
- **地理剖面型**：叶片换成地层剖面或器物剖视，`RIM` 改为水平层线，朱批下划线标出年代分界；结论标签换成深度或年代数字（Cormorant 48px 可承担数字）。

## 硬约束（别踩）

- 根节点必须有 `data-composition-id="shot-starter-editorial"` / `data-width` / `data-height` / `data-duration`；每个时间元素带 `class="clip"` + `data-start` + `data-duration` + `data-track-index`（每轨 ≤3 个）。
- `.clip` 元素自身**不要** tween `opacity` / `visibility` / `autoAlpha`；淡入只作用于子元素。
- 禁止 `Date.now()`、`Math.random()`、hover、网络请求；随机只允许 seeded PRNG（本骨架 `mulberry32(20261030)`）。
- 不要用 CSS `transform` 给已有 GSAP 补间的元素设初值；初值一律写进 `fromTo`。
- 单个 composition HTML ≤300 结构行（`<style>` 不计）；时间轴与几何生成放 `assets/shot-timeline.js`。
- 字体：`font-family` 里的每个非通用族都必须能从 Google Fonts 链接解析到，否则 `font_family_without_font_face` 直接失败。
- 留白：y > 886px 只允许装饰层；`#paper` / `#fiber` / `#sheets` / `#fore` / `#tooth` 已声明 `data-layout-allow-caption-zone`。
- 朱批红 `#B23A2E` 只用于编号、圈注、下划线、朱印；**不要**用它铺大面积色块或当正文色。

## 验收

```powershell
npx hyperframes check templates/shot-starter-editorial --strict   # 0 findings
npx hyperframes snapshot templates/shot-starter-editorial --at 0.4,4.0,7.4 --no-end
```

截图自检三点：首帧（0.4s）标题/引文与图版框已成立、焦点可辨；中段（4s）线刻完成、朱批与图注出现（第二个状态变化）；尾帧（7.4s）结论、图例、朱印齐全，且没有任何可读文字压进字幕带。