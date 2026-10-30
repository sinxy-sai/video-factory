# 工作流

## 从主题到视频

```text
用户需求和资料
  ↓
多轮内容讨论与用户确认
  ↓
content-plan.md + shot-design.md（计划内容、批准状态）
  ↓
观众、学习目标与知识关系
  ↓
  完整旁白剧本：content/episodes/<id>/script.md
  ↓
  长分镜表：storyboard.md（镜头语言 + 视觉关系 + 动画 beats + 字幕意图）
  ↓
  每镜 ShotBrief：shot-briefs/shot-*.json（连续性 + 技术路线 + 素材）
  ↓
  每镜实现：HTML/CSS/JavaScript + SVG/Canvas 2D/Three.js-WebGL + GSAP
  ↓
  静态 hero frame 与动效设计
  ↓
  content/episodes/<id>/manifest.ts
  ↓
  npm run prepare-episode-assets -- <id>
  ↓
  Schema、连续性、分镜一致性与字幕覆盖校验
  ↓
Remotion Studio / HyperFrames preview 动态预览
  ↓
代表帧、节奏和可视化检查
  ↓
Remotion 总合成与 MP4 渲染
```

## 命令

```powershell
npm run create-episode -- my-topic
npm run approve-episode -- my-topic
npm run validate-episode-planning -- my-topic
npm run episode-status -- my-topic
npm run author-episode-shots -- my-topic
npm run validate-episode-shots -- my-topic
npm run preview-episode-shots -- my-topic
npm run render-episode-shots -- my-topic
npm run prepare-episode-assets -- my-topic
npm run validate-episode -- my-topic
npm run preview-episode -- my-topic
npm run render-still-frame -- my-topic --frame 30
npm run remove-episode -- my-topic
npm run render-episode -- my-topic
npm run verify-episode-output -- my-topic
npm run generate-contact-sheet -- my-topic
npm run compare-episode-visual-regression -- my-topic
npm run generate-episode-registry
npm run validate-all-episodes
npm run doctor
npm run check-agent-harness
npm run sync-agent-harness-skill
npm run setup:python
```

`approve-episode -- <id> [--state shot-design-approved]` 是计划批准门禁：它检查 `content-plan.md` 和 `shot-design.md` 存在、非空、没有 placeholder，正文达到最低规模（各 300 个非空白字符、至少 2 段），然后把两份 front matter 的 `state` 与 `content`/`storyboard`/`shot-design` 三个 approvals 一次性写成批准状态。未批准前 `validate-episode-planning`、`author-episode-shots`、镜头渲染都会失败。

`episode-status -- <id>` 汇总规划、分镜、镜头源文件、素材、渲染和输出的磁盘状态，并给出下一条应执行的命令，供 AI 在没有上下文时自主推进。它是只读命令，不会触发渲染。

`validate-episode-shots`、`render-episode-shots` 和 `preview-episode-shots` 都支持只处理单个镜头：`--shot shot-002`（preview 也可以继续用位置参数 `shot-002`）。逐镜迭代时先用 `--shot` 跑通校验和预览，再渲染整集。

`create-episode` 生成的默认浏览器镜头已经满足 `npx hyperframes check --strict`：所有 timed element 都带 `class="clip"`；脚手架的 manifest scene 声明 `captionMode: 'required'`。

`npm run doctor` 是渲染前的依赖发现入口：它优先检查项目 `.venv` 中的 Python/Manim，以及 `tools/ffmpeg/bin` 中的 FFmpeg/FFprobe，不依赖系统 PATH。`npm run setup:python` 按 `requirements.txt` 创建或补齐项目 `.venv`。

工作流 skill 的规范源是 `skills/science-video-workflow/SKILL.md`，并通过三个 harness 入口共享：`.agents/skills/science-video-workflow/SKILL.md`、`.claude/skills/science-video-workflow/SKILL.md` 和 `.codex/skills/science-video-workflow/SKILL.md`。四份文件必须内容一致，并且都要求读取本文件、`docs/SCENE_GUIDE.md` 和 `docs/COMPONENT_GUIDE.md`。修改规范源后运行 `npm run sync-agent-harness-skill`，`npm run check-agent-harness` 检查源文件和入口存在、内容哈希一致和 guide 引用完整。`AGENTS.md` 或 `CLAUDE.md` 可以补充宿主指令，但不是工作流规则的必要入口。

`create-episode` 会生成完整目录骨架：`content-plan.md`、`shot-design.md`、`script.md`、`storyboard.md`、`visual-style.md`、`shot-briefs/`、`html/`、`manim/` 和 `assets/generated/`，并保留一个可选的 `scenes/` 目录作为脚手架。计划文档必须经过讨论、内容、分镜和制作批准，并且不能为空。

新 episode 默认使用 `browser`。每个镜头在 `html/<shot-id>/` 中直接按官方 HyperFrames skill 编写和检查。Remotion 不绘制镜头内容，只合成已渲染的镜头资产。

`validate-episode-planning` 先检查计划文档和批准状态，并确认文档非空且没有重复段落。`validate-episode-shots` 按 ShotBrief 的 renderer 路由：`browser` 通过 HyperFrames `check`，Manim 通过项目 `.venv` 执行，`composite` 逐层校验各 renderer；Blender 在没有执行器时明确失败。通过后才进入资产准备和最终合成。

`author-episode-shots` 读取当前 episode 的 `visual-style.md`，风格必须根据话题确定。`preview-episode-shots` 按 ShotBrief 启动对应的 HyperFrames 或 Manim 预览；`render-episode-shots` 生成各 ShotBrief 声明的镜头输出（MP4、WebM 或帧序列）到 `renders/<episode-id>/shots/`；`verify-episode-output` 检查最终 `final.mp4` 并写入 `output-verification.json`。

`generate-contact-sheet` 会把代表帧合成为可审阅的 PNG 接触表；`compare-episode-visual-regression` 可对比 `baselines/` 下的历史帧。最终 `render-episode` 只接受 `--scale 1`，缩放输出不能写入标准 `final.mp4`；预览请使用 `render-still-frame` 或 Remotion 直接输出到临时路径。`prepare-episode-assets` 会校验 ShotBrief 声明的输出，并将镜头素材和生成素材复制到 `static/episodes/<episode-id>/`，写入 `shots/assets.manifest.json`。`static/` 是 Remotion 的运行时静态资源根目录，由脚本生成，不作为源素材维护。

输出统一为 `renders/<episode-id>/final.mp4`，并带有 `final.manifest.json` 快照，方便追溯生成输入。不要再使用带多个历史命名的 MP4 文件作为标准输出。

删除视频项目时，`remove-episode` 会同时清理对应的 episode 目录、`static/episodes/<episode-id>/`、`styles/<episode-id>/`（如果存在）、渲染目录和 `.remotion/<episode-id>.props.json`，然后重新生成 registry。共享工具代码不会随 episode 删除。

## 技术分工

- **HTML / CSS / JavaScript**：镜头布局、文字和 UI 视觉。
- **SVG**：图示、路径、箭头、标签和精确矢量元素。
- **Canvas 2D**：粒子、密集重复绘制和程序化纹理。
- **Three.js / WebGL / GLSL**：3D、空间运动、光照和着色器。
- **GSAP**：镜头内动画时间轴、缓动、stagger 和路径编排。
- **HyperFrames**：驱动浏览器镜头、检查、预览和渲染。
- **Remotion**：总时间轴、字幕、转场、镜头资产合成和最终视频。
- **FFmpeg**：编码、封装和音视频复用。

一个 ShotBrief 可以使用 `renderer: "composite"` 和 `implementation.composition: "layered"` 组合多个图层。每层声明自己的 renderer、源文件、`zIndex` 和输出；例如浏览器/Three.js 作为不透明背景，Manim 作为透明 PNG 序列叠加层。各层先独立渲染，再由 FFmpeg 按 zIndex 合成为一个镜头 MP4，Remotion 继续负责字幕、转场和 episode 级合成。所有图层必须共享镜头的尺寸、fps 和时长，最底层必须不透明。

默认不添加音效、配乐或配音音频。旁白文案、屏幕字幕和未来的配音音频必须共享同一套 scene-relative 帧时间轴：`script.md`/ShotBrief 保存文案，manifest captions 保存显示区间，未来 voiceover cue 必须复用这些区间。当前尚未生成配音音频，但不能另起一套时间轴。字幕由 Remotion 的 CaptionLayer 统一渲染。`validate` 会强制检查剧本、分镜、ShotBrief、连续性、实现文件和字幕覆盖率。

字幕覆盖率由每个 scene 的 `captionMode` 决定：`required`（默认，未声明时等价）要求字幕覆盖至少 80% 镜头时长；`optional` 允许稀疏字幕或没有字幕，不检查覆盖率；`none` 用于无字幕的 cinematic/PV 镜头，出现任何 caption 都会失败。浏览器镜头与 caption 的重复检测按 10 个连续汉字片段判断，常见连接短语不会误杀；ShotBrief 标题和镜号仍然禁止出现在镜头画面里。

### 画面文字与字幕分工

- `ShotBrief.title`、manifest 的 `scene.title` 和镜头序号是元数据，不得自动绘制到浏览器镜头。
- 浏览器镜头默认不得出现 `SHOT / 001`、`镜头 01`、episode 标题或“标题 + 副标题 + 图表”的 PPT 式页眉。
- narration/caption 文案由 Remotion 统一渲染。HTML/CSS/SVG/Canvas/Three.js 只绘制解释关系和必要的短标签。
- 图内标签必须和 caption 分工，不能逐字重复完整 caption；只保留读懂关系所需的词，例如“缓存”“远处来源”“需要更新”。
- `validate-episode` 会检查 browser source 中的标题、序号和完整 caption 重复，发现后失败。

## 内容原则

- 每场景一个主要知识关系。
- 每场景先写分镜 beats，再写视觉组件。
- 图示直接标注，核心信息不依赖 hover。
- 动画解释变化、过程、因果或对比。
- 4 秒以上的场景至少包含两个有意义的状态变化。
- 先做静态布局，再加帧动画。
- 先用 SVG/CSS，只有需要密集重绘时才使用 Canvas。
- 不把所有镜头压缩成“标题 + 图表 + 淡入”；每镜要选择合适的镜头语言和动画类型。
- 镜头必须展示状态变化、因果、比较、尺度变化或视线引导中的至少一种。

## 分镜 beats

每个场景的 `beats` 使用相对场景起点的帧号：

```ts
beats: [
  {id: 'enter', purpose: 'enter', startFrame: 0, durationInFrames: 24},
  {id: 'process', purpose: 'process', startFrame: 24, durationInFrames: 90},
  {id: 'resolve', purpose: 'resolve', startFrame: 114, durationInFrames: 40},
]
```

设计分镜时检查：观众先看到什么？关系如何建立？过程是否经历了两个状态？最后是否有结论或自然转场？

最终视频不渲染调试型进度条。

