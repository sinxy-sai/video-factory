# 质量检查：镜头三点截图与交付清单

本文件是镜头级 QC 的可执行版本。所有命令在仓库根目录 PowerShell 下运行，`<id>` 是 episode id，`<shot-id>` 是镜头目录名（如 `shot-001`）。规范依据见 `docs/ART_DIRECTION.md` 与 `docs/WORKFLOW.md`。

---

## 1. 三点截图法（每镜必做）

一个镜头只截一帧说明不了问题。固定取三个时刻：

| 采样点 | 时刻（8s 镜头） | 看什么 | 不合格表现 |
| --- | --- | --- | --- |
| 首帧 | 0.2–0.5s | 焦点是否在 0.5s 内可辨；底色/光是否成立；是否空镜 | 只有底色、主体还没出现、观众不知道该看哪 |
| 中段 | 40%–60%（3.2–4.8s） | 是否发生了第二个有意义的状态变化；运动是否有职责 | 和首帧几乎一样、只有循环旋转、画面信息已读完却还在拖 |
| 尾帧 | 90%–95%（7.2–7.6s） | 信息是否完整；结论/当前值是否可见；能否接下一镜 | 元素消失、文字被压、结束在运动中而没有落点 |

另外各加一张**降采样灰度图**（或肉眼眯眼）检查明度分层：主体与背景明度差应 ≥0.25，画面至少 3 个明度台阶。

### 1.1 截取模板 / 单镜静帧（HyperFrames）

```powershell
# 一套模板的三点截图（输出 PNG + contact-sheet.jpg）
npx hyperframes snapshot templates/shot-starter --at 0.4,4.0,7.4 --no-end -o .tmp/qc/shot-starter

# 某个 episode 镜头（目录即 composition 目录）
npx hyperframes snapshot content/episodes/<id>/html/<shot-id> --at 0.4,4.0,7.4 --no-end -o .tmp/qc/<id>-<shot-id>

# 需要核对转场接缝时，加采样点
npx hyperframes snapshot content/episodes/<id>/html/<shot-id> --at 0.4,2.0,4.0,6.0,7.4 --no-end -o .tmp/qc/<id>-<shot-id>
```

`--no-end` 表示只截 `--at` 指定的时刻；去掉它会额外截一张片尾帧。

### 1.2 截取最终合成帧（Remotion）

前置条件：`npm run prepare-episode-assets -- <id>` 已把镜头素材放进 `static/episodes/<id>/`，否则 Remotion 找不到素材。

```powershell
# 最终合成中的第 30 帧（含字幕、暗角、颗粒）
npm run render-still-frame -- <id> --frame 30

# 字幕换行/字号最容易出问题的中段
npm run render-still-frame -- <id> --frame 120

# 片尾
npm run render-still-frame -- <id> --frame 210
```

输出在 `renders/<id>/` 下的静帧目录（命令会打印实际路径）。用它检查**字幕**（42px、底部 6.4%、四层投影）和**电影感叠加层**（暗角不压字、颗粒不脏、扫描线不闪）。

### 1.3 生成接触表

```powershell
npm run generate-contact-sheet -- <id>
```

输出 `renders/<id>/contact-sheet*.png`，用于横向比对整条片子的节奏与色调连续性；不是三点截图的替代品。

### 1.4 目视记录

每镜在 `content/episodes/<id>/shots.md`（或 `notes.md`）里记一行：

```text
| shot-002 | 0.4s ✅ 焦点在③号轨道 | 4.0s ✅ 卫星入轨+扫描 | 7.4s ✅ 锁定弧成型 | 通过 |
```

---

## 2. 镜头 QC 清单

每项只有"通过 / 不通过"。**任一类别出现 2 项不通过，该镜重做构图，不进入调参阶段。**

### A. 层次与景深（5）

- [ ] 存在至少 3 层：背景/氛围层、主体层、前景细节层（浮尘、刻度、暗角、遮挡）。
- [ ] 背景不是纯色：有渐变、纹理、网格或星场中的至少两种。
- [ ] 主体与背景有明确的空间关系（遮挡、透视、视差、光影），不是"贴"在同一平面。
- [ ] 有一处前景元素压过主体边缘（制造深度），且不遮挡关键信息。
- [ ] 画面四角与边缘被有意识地处理（暗角、压暗、结构线），不是空白。

### B. 明度与对比（4）

- [ ] 明度台阶 ≥3，主体/背景明度差 ≥0.25。
- [ ] 有明确主光方向，主体有高光与暗部（至少一处轮廓光或投影）。
- [ ] 正文/标签对比度 ≥4.5:1；≥36px 粗体 ≥3:1。
- [ ] 没有文字压在渐变边缘、光带、月亮亮面等局部高亮上。

### C. 安全区与字幕（4）

- [ ] y > 886px（82%）没有任何可读文字；装饰层已声明 `data-layout-allow-caption-zone`。
- [ ] 左右 156px、顶部 96px 内没有需要读的内容（结构线/出血图形除外）。
- [ ] 字幕在最终合成里不被镜头内元素遮挡（`CinematicOverlay` 位于字幕之下）。
- [ ] 中文断行正常：没有单字孤行、没有把标点放在行首、没有超长行（≤22em）。

### D. 文字层级（5）

- [ ] 至少 3 档字号：hero / 标签 / 注释，且有明确大小比例（建议 ≥2.5× 递减）。
- [ ] 字体搭配符合所选美术系统（见 ART_DIRECTION §1），没有默认 Arial/系统黑体。
- [ ] 镜头内只有短标签（≤8 汉字或 ≤14 字符），没有 ShotBrief 标题、镜号、整句 caption。
- [ ] 所有标签与 caption 分工，不逐字重复字幕。
- [ ] 单位、数字、度号、上下标正确（如 `23.4°`、`λ 656.3 nm`、`10⁻¹⁵`）。

### E. 动效职责（5）

- [ ] 每个动画都能回答"它解释了引入/强调/比较/过程/因果中的哪一个"。
- [ ] 4 秒以上镜头至少两个有意义的状态变化（不是同一动作循环）。
- [ ] 入场不超过 30 帧，观众不需要等待内容出现。
- [ ] 尾帧有落点（定格或进入转场），不是"停在半路"。
- [ ] 同一 episode 内入场方式不重复（至少混用三种）。

### F. 确定性与契约（5）

- [ ] `npx hyperframes check <dir> --strict` 输出 `Check passed`，0 findings（warning 也算失败）。
- [ ] 根节点有 `data-composition-id` / `data-width` / `data-height` / `data-duration`，且所有 clip 的 `data-duration` ≤ 根时长。
- [ ] 时间元素带 `class="clip"` + `data-start` + `data-duration` + `data-track-index`（每轨 ≤3 个）。
- [ ] 没有 `Date.now()`、`Math.random()`、hover/交互依赖；随机只来自 seeded PRNG。
- [ ] 没有 tween `.clip` 自身的 `opacity` / `visibility` / `autoAlpha`；淡入都发生在子元素上。

### G. 反 PPT（见 ART_DIRECTION §3）

- [ ] 15 条反 PPT 清单中命中 ≤1 条。
- [ ] 一句话自查：截图给没看过分镜的人，他能在 1 秒内指出焦点并说出"这里在发生什么变化"。

---

## 3. 校验命令（交付前必跑）

```powershell
# 1) 镜头级：HyperFrames 静态 + 运行时 + 布局 + 动效 + 对比度
npx hyperframes check content/episodes/<id>/html/<shot-id> --strict

# 2) 模板级（改模板后）
npx hyperframes check templates/shot-starter --strict
npx hyperframes check templates/shot-starter-noir --strict

# 3) 路由与分镜一致性（browser / manim / layered）
npm run validate-episode-shots -- <id>

# 4) 素材准备与 episode 级校验（含字幕覆盖率、连续性）
npm run prepare-episode-assets -- <id>
npm run validate-episode -- <id>

# 5) TypeScript（src 改动）
npm run typecheck

# 6) 三点截图
npx hyperframes snapshot content/episodes/<id>/html/<shot-id> --at 0.4,4.0,7.4 --no-end -o .tmp/qc/<id>-<shot-id>

# 7) 最终合成帧（含字幕）
npm run render-still-frame -- <id> --frame 30

# 8) 接触表
npm run generate-contact-sheet -- <id>
```

全部通过才允许 `npm run render-episode -- <id>`。

---

## 4. `check --strict` 常见 finding 与修法

| finding | 根因 | 修法 |
| --- | --- | --- |
| `missing_timeline_registry` | 注册写在外部 JS 里，或字体就绪后才注册但静态扫描看不到 | 在 `index.html` 的内联 script 里写 `window.__timelines["<id>"] = tl`；构建逻辑可以放在外部文件、返回 timeline |
| `font_family_without_font_face` | `font-family` 里的族名无法从 Google Fonts 链接解析 | 加 `<link href="https://fonts.googleapis.com/css2?family=...">`，或 `@font-face` + `src: local("字体名")` |
| `studio_missing_editable_id` | 时间元素没有 `id` | 每个 `.clip` 加稳定 id（`sky` / `orbits` / `type` …） |
| `nested_structure_needs_subcomposition` | 顶层时间元素里嵌了 `div` / `svg` 等块级结构 | 顶层行用 `<svg>` 或"只含 span 的 div"；复杂镜头拆 sub-composition |
| `composition_file_too_large` | composition HTML 结构行 >300（`<style>` 内不计） | 时间轴/生成逻辑移到 `assets/*.js`，或拆文件 |
| `container_overflow` / `panel_out_of_canvas` | 元素或画框超出画布/裁剪容器 | 收进画布，或声明 `data-layout-allow-overflow` |
| `text_occluded` | 有不透明层压在文字上（暗角、遮幅、面板） | 把暗角移到文字层下方，或在文字元素上声明 `data-layout-allow-occlusion` |
| `content_overlap` | 两个文字块包围盒相交（常见于超大数字与单位标签） | 拉开间距，或在文字上声明 `data-layout-allow-overlap` |
| `overlapping_gsap_tweens` | 同一属性上的两段 tween 时间交叠 | 让前一段先结束，或拆到不同属性 |
| `gsap_repeated_fromto_without_baseline` | 同一元素写了两次 `fromTo` | 第二次改成 `to`，或给后一次加 `immediateRender: false` |
| `gsap_animates_clip_element` | 直接 tween `.clip` 的 `opacity`/`visibility`/`autoAlpha` | 在 clip 内加子元素，动画只作用于子元素 |
| `clip_ends_past_root_duration` | 某个 clip 比根 `data-duration` 长 | 同步缩短 clip 或延长根时长 |
| `gsap_css_transform_conflict` | CSS 里给了初值 transform，GSAP 又 tween 同属性 | 初值写进 `fromTo`，CSS 不写 transform |
| `WA` 对比度失败 | 小字压在亮色/渐变上 | 加深底色 scrim、换到暗区、或增大字号/字重 |
| `browser session never ran` | 前面的 lint error 让运行时审计被跳过 | 先清 lint error，数字才有意义 |

---

## 5. 字幕与叠加层实拍校准

字幕是 Remotion 层，只有最终合成才看得到。校准步骤：

```powershell
npm run prepare-episode-assets -- smoke-test
npm run render-still-frame -- smoke-test --frame 30
```

检查点：

1. 字号：1080p 下观感应接近 42px 粗体；在 1920 宽截图里，一行常见中文（约 20 字）应占据宽度 55%–78%，超出说明字太大或没换行。
2. 位置：文字底部距画布底 6.4%（约 69px），强调条在文字上方 16px。
3. 可读性：在浅色镜头画面上仍然清晰（四层投影 + 0.6px 描边）；如果仍发虚，说明镜头画面局部太亮，应回镜头里压暗，而不是继续加字幕描边。
4. 入场：抽查字幕起点前 4 帧（如 `--frame 26`）应几乎不可见，第 8 帧完全可见；没有"突然出现"或"整段淡入淡出"。
5. 叠加层：暗角不压字、颗粒不脏、扫描线不可见抖动；不同场景之间叠加层强度一致。

---

## 6. 交付记录模板

```text
episode: <id>
mode: explainer | cinematic
systems: A | B | C | D
shots: N

| shot | check --strict | 首帧 | 中段 | 尾帧 | 字幕帧 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| shot-001 | passed | ✅ | ✅ | ✅ | ✅ | 通过 |
| shot-002 | passed | ✅ | ⚠️ 二次状态变化偏弱 | ✅ | ✅ | 需改 beat |
```

`⚠️` 必须在交付说明里列出具体位置与修法，不能以"整体可以"带过。

---

## 7. 红线（任一出现即阻塞交付）

1. `check --strict` 有任何 finding（含 warning）。
2. `validate-episode-shots` / `validate-episode` 失败。
3. 镜头里出现 ShotBrief 标题、镜号或整句 caption。
4. 字幕被镜头元素或叠加层遮挡，或压进 y>886px 的字幕带。
5. 存在 `Date.now()`、`Math.random()`、hover 依赖等非确定性来源。
6. 只有"灰底 + 单个图形"，或 15 条反 PPT 清单命中 ≥2 条。
7. 用临时占位符（`TODO` / `Replace with…` / 假数据）冒充完成画面。