# Science Video Factory

> 打开目录，对 AI 说一个视频主题，它就能从创意一路做到成片的 **AI 视频工作流引擎**。

Science Video Factory 把「浏览器镜头 + 代码动画 + 总合成 + 字幕 + 编码」串成一条 AI 可以独立走完的生产管线。镜头用 HTML/CSS/SVG/Canvas/Three.js 编写，由 **HyperFrames** 检查、预览和渲染；**GSAP** 负责镜头内的确定性动效；**Remotion** 负责 episode 时间轴、字幕、转场和最终合成；**FFmpeg** 负责图层合成、编码与封装；数学、几何、公式镜头可以交给 **Manim**（可选，项目内 `.venv`）。

一条视频就是 `content/episodes/<id>/` 下的自包含模块：剧本、分镜、逐镜契约、镜头源码、manifest 和素材都在里面。`renders/<id>/final.mp4` 是唯一标准输出。

## 两种模式

| 模式 | 时长 | 字幕 | 适用场景 | 生产重心 |
|---|---|---|---|---|
| **explainer** 科普 / 知识 | 40–90 s | 必须 | B 站/YouTube 科普、知识解释、原理拆解 | 每镜一个知识关系；机制、因果、对比清楚 |
| **cinematic** 视觉 PV | 15–30 s | 可选 / 可无 | 开场片头、预告、品牌 PV、社媒氛围片 | motion-first：大字、硬切、光照、氛围、节奏 |

模式不是配置项，而是 AI 读完需求后的第一判断。画幅支持横屏 1920×1080 与竖屏（由 manifest 的 `format` / `width` / `height` 决定），默认 30 fps。

## 两支自举样片

项目用自己的流程做样片，验证「AI 能不能独立做出有质感的片子」：

| 样片 | 模式 | 内容 | 目标产物（完成后位置） |
|---|---|---|---|
| Transformer 注意力机制 | explainer | 一条讲清 Q/K/V、注意力权重与多头机制的科普片 | `renders/transformer-attention/final.mp4` |
| 怪盗月夜 20s PV | cinematic | 月夜黑色电影 + 漫画印刷质感的原创视觉 PV，无字幕 | `renders/kid-phantom-pv/final.mp4` |

两支样片的目标产物如下；成片是否就绪以对应路径为准（制作中时该文件尚未生成）。README 暂不放置截图，避免展示未完成的中间帧。另有 `renders/smoke-test/final.mp4` 用于验证渲染管线本身是否健康，不代表视觉水准。

## 5 分钟上手

环境要求：Node.js ≥ 20（仓库在 Node 24 / Windows 上验证），首次渲染会自动下载 Remotion 的 Chrome Headless Shell。

```powershell
git clone https://github.com/sinxy-sai/science-video-factory.git
cd science-video-factory

npm install
npm run doctor          # 依赖体检：本地 .venv / tools/ffmpeg / Chrome
npm run check-agent-harness
npm run setup:python    # 可选：只有要用 Manim 时才需要
```

建一个空白 episode：

```powershell
npm run create-episode -- my-video
```

然后用任意 AI 编码工具（Claude Code / Codex / 其他支持 AGENTS.md 的 agent）打开这个目录，直接说需求。AI 会读 `AGENTS.md` → `skills/science-video-workflow/SKILL.md` → 文档与美术规范，然后自己推进。

依赖查找优先使用项目内的 `.venv` 与 `tools/ffmpeg/bin`，不要求系统 PATH 配好 Python/Manim/FFmpeg。

## 对 AI 说

不需要记命令，把主题、受众、时长、画幅、平台说清楚即可：

- 「帮我做一支 60 秒的 Transformer 注意力机制科普视频，B 站横屏」
- 「做一条 20 秒的怪盗月夜风格视觉 PV，无旁白，抖音竖屏」
- 「把这篇论文做成 90 秒科普短片，受众是高中生，要中文字幕」
- 「给我们的开源项目做一支 15 秒开场片头，深空天文台风格」

AI 会自动走完：**创意简报 → 3 个概念方向 → hero frame（静态帧先行）→ animatic（时间轴/字幕）→ 逐镜制作 → QC 与交付**，并在模式、受众、事实边界、品牌素材、是否要旁白这些问题上主动问你。质量底线、禁止事项和交付标准写在根目录 `AGENTS.md`（与 `CLAUDE.md` 内容一致）里。

## 命令

主链路（`<id>` 为 episode id，如 `my-video`）：

| 阶段 | 命令 |
|---|---|
| 新建 / 删除 | `npm run create-episode -- <id>` · `npm run remove-episode -- <id>` |
| 规划批准 / 校验 | `npm run approve-episode -- <id>`（新增）· `npm run validate-episode-planning -- <id>` |
| 生成镜头工作区 | `npm run author-episode-shots -- <id>` |
| 镜头校验 / 预览 / 渲染 | `npm run validate-episode-shots -- <id>` · `npm run preview-episode-shots -- <id> [--shot <shot-id>]` · `npm run render-episode-shots -- <id> [--shot <shot-id>]` |
| 资产准备 | `npm run prepare-episode-assets -- <id>` |
| 整集校验 | `npm run validate-episode -- <id>` · `npm run validate-all-episodes` |
| 节奏预览 / 单帧 | `npm run preview-episode -- <id>` · `npm run render-still-frame -- <id> --frame 30` |
| 成片渲染 | `npm run render-episode -- <id>` |
| 审片与验证 | `npm run generate-contact-sheet -- <id>` · `npm run compare-episode-visual-regression -- <id>` · `npm run verify-episode-output -- <id>` |
| 工程维护 | `npm run doctor` · `npm run setup:python` · `npm run generate-episode-registry` · `npm run test` |
| Harness 同步 | `npm run sync-agent-harness-skill` · `npm run check-agent-harness` |

`remove-episode` 只清理该 episode 自己的目录与产物（`content/episodes/<id>/`、`renders/<id>/`、`static/episodes/<id>/`、`.remotion/<id>.props.json`、对应的 `styles/<id>/`），不会动共享依赖或工具。

### AI 快速迭代命令（本版新增）

| 命令 | 作用 |
|---|---|
| `npm run approve-episode -- <id> [--state <state>]` | 校验并批准 `content-plan.md` / `shot-design.md`，一次写全 front matter（默认 `shot-design-approved`） |
| `npm run episode-status -- <id>` | 输出规划/分镜/镜头/素材/渲染/输出的 checklist 与下一条应执行命令，供 AI 自主推进 |
| 单镜迭代（新增 `--shot`） | `npm run validate-episode-shots -- <id> --shot <shot-id>`、`npm run preview-episode-shots -- <id> --shot <shot-id>`、`npm run render-episode-shots -- <id> --shot <shot-id>`，渲染长片时不必反复跑全量 |

## 工作流

1. **Brief**：确认模式、画幅、时长、受众、事实与资料来源，写进 `content-plan.md`。
2. **Creative direction**：从 `docs/ART_DIRECTION.md` 选一套命名美术系统，写 `visual-style.md` 与每镜视觉方向；给出 3 个概念方向并推荐一个。
3. **Hero frames**：先做静态画面，截图检查构图、景深、字体层级、安全区，再上动效。
4. **Animatic**：定 `manifest.ts` 的 scenes/beats/captions、`episode.ts` 的视觉枚举、每镜 `ShotBrief`，跑通时长与连续性。
5. **Shots**：逐镜编写 `html/<shot-id>/`（或 Manim / 分层合成），每镜过 `npx hyperframes check --strict`。
6. **QC & Delivery**：`prepare-episode-assets` → `validate-episode` → `render-episode` → 接触表/单帧复核 → `verify-episode-output`。

规划文档必须先批准才能写镜头源码：`approve-episode` 会先校验内容再写入 front matter（`state: shot-design-approved` + 三项 approvals），之后 `validate-episode-planning` 才会通过。不确定进度时用 `episode-status` 看 checklist 和下一条命令。

完整的阶段验收标准与质量 rubric 见 `skills/science-video-workflow/SKILL.md`。

## 质量体系

过去「模型画出来的东西很平庸」的根因不是技术栈，而是缺少美术指导和质量门禁。本版补上三层：

- **美术方向**：`docs/ART_DIRECTION.md`（本版新增）提供 4 套命名美术系统（深空天文台 / 月夜怪盗 / 纸本编辑 / 霓虹东京），每套有精确色板、1080p 字号阶、网格与安全区、材质颗粒配方、镜头语言，以及 12 种构图原型和「反 PPT 清单」。
- **镜头模板**：`templates/shot-starter/`（深空天文台）与 `templates/shot-starter-noir/`（月夜怪盗）（本版新增）是可复制的 HyperFrames 镜头骨架，自带多层背景、字体系统、GSAP seekable timeline、`window.__timelines` 注册，并且已通过 `npx hyperframes check --strict`。
- **质量门禁**：`docs/QUALITY.md`（本版新增）给出「三点截图法」（首帧/中段/尾帧）和分门别类的镜头 QC 清单；所有 browser 镜头过 `npx hyperframes check --strict`，整集过 `validate-episode`（ShotBrief/manifest/连续性/字幕覆盖/文字归属），最后用 contact sheet 与三点截图复核。

硬规则（会被校验强制）：标题、镜号、完整字幕不得画进镜头；旁白/字幕/未来配音共用同一 scene-relative 帧轴；渲染必须确定性可复现；`render-episode` 只接受 `--scale 1`，输出固定为 `renders/<id>/final.mp4`。

## 技术栈

| 层 | 技术 | 职责 |
|---|---|---|
| 镜头画面 | HTML/CSS/JS、SVG、Canvas 2D、Three.js/WebGL | 布局、图示、粒子、3D、着色器 |
| 镜头动效 | GSAP + HyperFrames `hf-seek` | 确定性时间轴、缓动、stagger、路径 |
| 数学镜头 | Manim（可选，项目 `.venv`） | 公式、几何、向量、矩阵 |
| 总合成 | Remotion | episode 时间轴、字幕、转场、镜头资产合成 |
| 合成 / 编码 | FFmpeg / FFprobe（`tools/ffmpeg`） | 图层叠加、编码、封装、metadata |

## 目录

```text
content/episodes/<id>/     # 一条视频：计划、剧本、分镜、ShotBrief、html/manim 镜头、素材
  manifest.ts              # 场景、时长、beats、字幕
  episode.ts               # 本地视觉枚举与 schema
  shot-briefs/shot-NNN.json# 逐镜契约（renderer / 连续性 / 实现文件 / 输出）
  html/<shot-id>/          # 浏览器镜头源码（DESIGN.md + index.html + assets）
  manim/<shot-id>/         # Manim 镜头源码（可选）
src/                       # Remotion 合成、字幕层、镜头资产承载组件
scripts/                   # create/validate/preview/render/verify 等命令与库
production/                # 渲染路由、镜头契约、图层合成、视觉回归
docs/                      # WORKFLOW / SCENE_GUIDE / COMPONENT_GUIDE / ART_DIRECTION / QUALITY
skills/science-video-workflow/SKILL.md   # 生产 playbook 规范源
.agents/.claude/.codex/    # 三个 harness 的同步副本（内容必须一致）
templates/                 # 镜头骨架模板（本版新增）
renders/<id>/              # final.mp4 + final.manifest.json + 镜头资产 + 接触表
static/episodes/<id>/      # 由脚本生成的 Remotion 运行时静态资源
tools/ffmpeg/              # 项目内 FFmpeg / FFprobe
```

## 契约速览

- **manifest.ts**：`id`、`title`、`language`、`format`/`width`/`height`/`fps`、`theme`、`scenes[]`。每个 scene 有 `id`、`title`、`claim`、`visual`、`durationInFrames`、`beats`、`captions`。
- **episode.ts**：用本地 `z.enum([...])` 声明本集视觉类型；它只做分类校验，不会自动绘制组件。
- **ShotBrief**：每个 scene 一个 `shot-briefs/shot-NNN.json`，声明 `sceneId`、`durationInFrames`（必须等于场景时长）、`renderer`（`browser`/`manim`/`composite`/`blender`）、`visualStyle`（当前固定 `episode-defined`）、`visualDirection`、`motion`、`continuity`、`implementation`、`qualityChecks`、`assets`。
- **字幕**：scene-relative 帧号写在 manifest `captions`，由 Remotion 统一渲染；explainer 默认要求字幕覆盖 ≥80% 镜头时长，cinematic 可在 scene 上用 `captionMode: 'optional' | 'none'` 放宽或关闭（本版新增）。
- **确定性**：任何一帧都必须能从时间轴重建，禁止 `Date.now()`、未播种随机和 hover 依赖。

## 已知限制

- **没有自动配音 / 配乐 / 音效**：旁白目前是文本与字幕时间轴，尚未生成音频；未来的 voiceover cue 必须复用字幕的帧轴，不另起一套时间轴。
- **字体依赖回退**：模板优先使用 Google Fonts 在线拉取；离线或网络受限时回退到系统字体（中文思源 / Noto 系列），字重和字宽可能与设计稿有差异。
- **主要面向 Windows 验证**：脚本已做跨平台路径处理，CI 在 Linux 上跑 `npm test`，但实际渲染与样片验证主要在 Windows 完成；其他平台首次运行请先 `npm run doctor`。
- **Manim 可选**：未安装 `.venv` 时 Manim 镜头不可用；Blender 只有契约、没有执行器，会明确失败。
- **视觉质量仍取决于执行与审片**：`check`/`validate` 是底线门禁，不能替代对首帧、中段、尾帧和 contact sheet 的实际查看。
- **首次渲染较慢**：Remotion 会下载 Chrome Headless Shell；HyperFrames 编码依赖项目内 FFmpeg。

## 开发与贡献

```powershell
npm test                    # registry + typecheck + 全量校验 + 契约测试
npm run check-agent-harness # 四份 SKILL 内容哈希一致、guide 引用完整
```

工作流 skill 的规范源是 `skills/science-video-workflow/SKILL.md`，同步到 `.agents/`、`.claude/`、`.codex/` 三个 harness 目录。修改规范源后运行 `npm run sync-agent-harness-skill`，提交前运行 `npm run check-agent-harness`；四份文件必须完全一致。

贡献流程见 `CONTRIBUTING.md`，安全问题见 `SECURITY.md`，社区规范见 `CODE_OF_CONDUCT.md`。项目使用 `LICENSE` 中的开源许可。