# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases use semantic versioning where practical.

## [0.2.0] - 2026-10-28

AI 原生工作流与视觉体系升级：从「能渲染」到「能做出有美术指导的片子」。

### Added

- **视觉体系**：新增 `docs/ART_DIRECTION.md`（4 套命名美术系统：深空天文台 / 月夜怪盗 / 纸本编辑 / 霓虹东京，含精确色板、1080p 字号阶、网格与安全区、材质颗粒、镜头语言、构图原型与反 PPT 清单）、`docs/QUALITY.md`（镜头质检清单）和 `templates/shot-starter/` 可直接复制的 HyperFrames 镜头骨架。
- **AI 快速迭代命令**：`approve-episode`（校验并一次写入规划批准）、`episode-status`（输出 checklist 与下一条命令），以及 `validate/preview/render-episode-shots` 的单镜 `--shot <shot-id>` 选项。
- `content/schema.ts` 增加 `captionMode: 'required' | 'optional' | 'none'`，让 cinematic 视觉 PV 可以合法无字幕，同时保留 explainer 的字幕覆盖要求。
- 两支自举样片（目标产物）：Transformer 注意力机制科普（`renders/transformer-attention/final.mp4`）与怪盗月夜 20s PV（`renders/kid-phantom-pv/final.mp4`）。

### Changed

- **入口文档改为 AI 原生**：重写 `README.md`、根目录 `AGENTS.md` / `CLAUDE.md` 和 `skills/science-video-workflow/SKILL.md`（六阶段 playbook、质量 rubric、常见失败模式、命令表、ShotBrief/manifest 契约），并同步到 `.agents/`、`.claude/`、`.codex/`。
- **渲染管线硬化**：项目依赖解析把 `TEMP`/`TMP`/`TMPDIR` 指向项目 `.tmp/`，并注入 `HYPERFRAMES_FFMPEG_PATH` / `HYPERFRAMES_FFPROBE_PATH`，修复 HyperFrames 编码阶段的 `Permission denied`。
- `create-episode` 脚手架默认镜头补齐 `class="clip"` 等约定，默认即可通过 `npx hyperframes check --strict`，不再把 strict 失败留给用户。
- 中文字幕重复检测从任意 6 字片段放宽到 10 字片段，减少常见短语误杀；标题、镜号、完整字幕的禁令保持不变。

## [Unreleased]

### Added

- Open source contribution, security, conduct, and release workflows.

## [0.1.0-alpha.4]

- Added project-local dependency discovery and `requirements.txt` based Manim setup.
- Added Manim shot routing and layered shot composition, including FFmpeg compositing of browser and transparent Manim layers.
- Shared the workflow skill across Codex, Claude Code, and agent harness project discovery paths, with guide-reference and content-hash checks.
- Added browser-shot text ownership validation so titles, shot numbers, and full captions remain outside authored visuals.
- Added cross-platform renderer contract tests for Windows and Linux executable paths.

## [0.1.0-alpha.3]

- Browser-first shot routing through HyperFrames for HTML/CSS/JavaScript, SVG, Canvas 2D, and Three.js/WebGL.
- Remotion now composes prepared shot assets with the episode timeline, captions, and transitions.
- Added the Three.js dependency and removed the obsolete planning character-count threshold.

## [0.1.0-alpha.2]

- Initial workflow hardening release.