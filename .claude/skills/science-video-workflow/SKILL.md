---
name: science-video-workflow
description: AI-native production playbook for turning a topic into an explainer or cinematic video in this repo. Use for briefs, creative direction, hero frames, animatics, browser/Manim shot authoring, validation, rendering, QC, and delivery with HyperFrames, GSAP, Remotion, and FFmpeg.
---

# Science Video Workflow

This repository is an AI video workflow engine: a user opens the folder, says a topic, and you deliver `renders/<episode-id>/final.mp4`. Act as the whole production crew. Clarity is the floor, not the ceiling — every shot must look art-directed, never like a slide.

## Modes

| Mode | Length | Captions | Intent |
|---|---|---|---|
| `explainer` | 40–90 s | required | Science/knowledge explainer: one knowledge relationship per shot, mechanism, cause/effect, comparison. Default 1920×1080, 30 fps, zh-CN. |
| `cinematic` | 15–30 s | optional / `none` | Visual PV, opening, teaser: motion-first, big type, hard cuts, grade and atmosphere lead. |

Infer the mode from the request. Topic + ~60 s + "科普" → `explainer`; PV/预告/开场/15–30 s → `cinematic`. State your inference and the assumed audience, format, and duration in the brief; ask only if the request is genuinely ambiguous.

## Before you touch code

Read these from the repository root, in order. Do not assume you read them in an earlier turn:

1. `docs/WORKFLOW.md` — lifecycle, commands, output paths, renderer ownership.
2. `docs/SCENE_GUIDE.md` — episode structure, ShotBrief contract, continuity, beats.
3. `docs/COMPONENT_GUIDE.md` — component boundaries and implementation constraints.
4. `docs/ART_DIRECTION.md` — named art systems, palettes, type scales, composition archetypes, anti-PPT rules.
5. `docs/QUALITY.md` — frame-level QC checklist and the commands that produce evidence.

Then:

- Run `npm run doctor` before any renderer work. Use `npm run setup:python` if Manim is needed and `.venv` is missing.
- Check the episode state with `npm run episode-status -- <episode-id>`; it prints a checklist and the next command.
- Never edit `scripts/**`, `src/**`, schema, or another episode's content to make your episode pass. Fix your episode.
- Never leave placeholder text (`Replace with…`, `Define palette…`, `TODO`) in planning docs, ShotBriefs, or shots — validation rejects it.

Ask the user only for: mode/format if the request is ambiguous, audience and target length if unstated, factual or sourcing requirements, brand/asset constraints, or whether a voiceover track is expected. Otherwise decide, write the assumption in the brief, and proceed.

## Six stages

### 1. Brief

```powershell
npm run create-episode -- <episode-id>
```

`create-episode` scaffolds `content-plan.md`, `shot-design.md`, `script.md`, `storyboard.md`, `visual-style.md`, `shot-briefs/`, `html/`, `manim/`, `assets/generated/`. Its placeholders intentionally fail validation.

Fill `content-plan.md` with: mode, format, dimensions/fps, target duration, audience, one-sentence promise, 3–6 factual claims with sources, beat-by-beat outline, audio intent. Fill `shot-design.md` with per-shot hero frame, focal point, composition archetype, motion states, transition, renderer, and continuity.

Acceptance: no placeholders; claim chain is factually defensible; runtime matches the mode (40–90 s explainer, 15–30 s cinematic).

```powershell
npm run approve-episode -- <episode-id>       # new in this upgrade: validates and writes approvals
npm run validate-episode-planning -- <episode-id>
```

`validate-episode-planning` only passes once both planning files are approved. If `approve-episode` rejects the documents, fix the content (placeholders, size, repeated paragraphs) instead of hand-editing approvals. Do not start renderer source before planning is approved.

### 2. Creative direction

- Choose one named art system from `docs/ART_DIRECTION.md` (A dark observatory / B moonlit noir / C paper editorial / D neon Tokyo). Do not invent a default palette.
- Write `visual-style.md`: 5–7 hex colors with roles, type stack and size scale, composition archetype, texture/grain recipe, motion language, continuity rules.
- Draft three concept directions — literal mechanism, visual metaphor, graphic/typographic — one sentence each plus a reference. Recommend one and say why.
- Break the reference down into layers, light, type, and motion (not "make it look like this").

Acceptance: `visual-style.md` no longer contains the scaffold text; three named directions exist with one recommendation; `npm run author-episode-shots -- <episode-id>` succeeds. Keep `visualStyle: "episode-defined"` — external style packs are not supported.

### 3. Hero frames

Build static frames first; motion is added only after the still works. Prototype one composed hero frame per shot (the first pass can be rough geometry, but it must be composed).

- Author `html/<shot-id>/index.html` and `DESIGN.md` for each shot.
- Capture stills:

```powershell
npx hyperframes snapshot content/episodes/<id>/html/<shot-id> --at 0,2.5 --output .tmp/<id>/<shot-id>
```

Acceptance: every shot has a static hero frame that reads at thumbnail size; the first shot is polished enough to set the visual language for the rest; three depth layers (background / subject / foreground); clear focal point; type hierarchy; content inside safe areas. No episode title, shot number, or full caption in the image (see Text ownership).

### 4. Animatic

Bind the hero frames to time.

- `manifest.ts`: scenes with `id`, `title`, `claim`, `visual`, `durationInFrames`, sorted non-overlapping `beats`, `captions`.
- `episode.ts`: local `z.enum([...])` visual schema; it classifies content, it does not draw a component.
- One `shot-briefs/shot-<NNN>.json` per scene, with `durationInFrames` matching the scene and continuity `inherits` declared by the previous shot's `leaves`.
- Captions live on the same scene-relative frame timeline as narration; cover ≥80% of a shot unless the scene sets `captionMode` to `optional` or `none` (new in this upgrade; `none` requires an empty `captions` array).

Acceptance: `npm run validate-episode-shots -- <episode-id>` passes (it requires every declared implementation file to already exist); timing adds up; every scene has a ShotBrief with a filled `visualDirection`/`motion` (no placeholders); each 4 s+ scene has at least two meaningful state changes. Preview one shot at a time:

```powershell
npm run preview-episode-shots -- <episode-id> --shot <shot-id>
```

### 5. Shots

Work one shot at a time in a tight loop: edit → gate → look → fix.

```powershell
npx hyperframes check content/episodes/<id>/html/<shot-id> --strict
npx hyperframes snapshot content/episodes/<id>/html/<shot-id> --at 0,2.5,5
npm run preview-episode-shots -- <episode-id> --shot <shot-id>
npm run render-episode-shots -- <episode-id> --shot <shot-id>   # new --shot flag
```

Rules: three depth layers minimum; deterministic motion only (`hf-seek`/GSAP frame time, no `Date.now()`, no unseeded randomness, no hover); every 4 s+ scene shows two state changes; vary motion across the sequence (push, parallax, transform, trace, stagger, morph, particles); do not render debug UI. Use SVG for labeled diagrams, Canvas for dense redraw, Three.js for depth/light/shader, Manim for math layers, `composite` + layered implementation for mixed renderers.

Acceptance: `check --strict` reports 0 findings; stills show the relationship changing; no caption duplication or baked titles.

### 6. QC and delivery

```powershell
npm run prepare-episode-assets -- <episode-id>
npm run validate-episode -- <episode-id>
npm run preview-episode -- <episode-id>
npm run render-still-frame -- <episode-id> --frame <frame>
npm run render-episode -- <episode-id>
npm run generate-contact-sheet -- <episode-id>
npm run verify-episode-output -- <episode-id>
```

`render-episode` writes the single standard output `renders/<episode-id>/final.mp4` and only accepts `--scale 1`. `render-still-frame` samples whole-episode frames; `generate-contact-sheet` builds the review PNG; `verify-episode-output` writes `output-verification.json`.

Acceptance: validation green, contact sheet reviewed shot by shot, first/middle/last frame checked, duration within mode, and a delivery report naming path, resolution/fps, mode, QC evidence, and known issues.

## Quality rubric

A shot ships only if every row passes.

| Criterion | Pass | Fail signal |
|---|---|---|
| Composition | Named archetype, off-center or intentional center, one focal point | Centered title + chart + bullet list |
| Depth | 3 layers minimum, light/atmosphere separates them | Flat single layer on a gray background |
| Typography | System from ART_DIRECTION, 3-level hierarchy, video-sized text | Default font, body-size labels, 6 different styles |
| Motion duty | Each motion introduces, emphasizes, compares, explains process, or shows cause | Decorative float, spin, or fade with no meaning |
| Color | Role-based palette, contrast ≥ WCAG AA where text matters | Rainbow accents, low-contrast text |
| Edges / safe area | Nothing clipped, text inside caption-safe margins | Content under captions or cut at frame edge |
| Captions / text ownership | Remotion owns captions and titles; shots use short relationship labels | Baked title, `SHOT 001`, verbatim caption in HTML |
| Rhythm | 2+ state changes per 4 s; cuts on beat; runtime in mode range | 8 s static hold, uneven scene lengths |

## Common failures

- **Flat single layer** — one background and one diagram. Add depth: glow/backdrop, midground subject, foreground grain/particles/vignette.
- **PPT default** — centered title, subtitle, then a chart. Start from the visual relationship, not a header.
- **Default fonts / weak type** — unset `font-family`, tiny labels. Use the ART_DIRECTION stack and size scale.
- **Meaningless animation** — everything fades and floats. Give motion a job, then cut what has none.
- **Over-strict paralysis** — `hyperframes check` also reports warnings. Fix errors and layout/motion findings; do not loop forever on cosmetic warnings. Distinguish `--strict` failures from advisory output.
- **Text-ownership violation** — ShotBrief title, shot number, or caption text inside browser HTML. Move it to metadata/Remotion.
- **Nondeterminism** — wall-clock time, unseeded random, hover. Render must reproduce any frame.
- **Skipped hero frame or animatic** — motion built on an unresolved layout. Freeze the still first.
- **Rendering too early** — `prepare-episode-assets` needs declared, rendered shot files; `validate` fails otherwise.
- **Placeholder escape** — `Replace with…` left in a brief or doc. Validation will reject the episode after you have done the work.

## Command reference

| Group | Command |
|---|---|
| Setup | `npm install`, `npm run doctor`, `npm run setup:python` |
| Harness skill | `npm run sync-agent-harness-skill`, `npm run check-agent-harness` |
| Episode | `npm run create-episode -- <id>`, `npm run remove-episode -- <id>`, `npm run generate-episode-registry`, `npm run validate-all-episodes` |
| Planning | `npm run approve-episode -- <id> [--state <state>]` (new), `npm run validate-episode-planning -- <id>`, `npm run author-episode-shots -- <id>`, `npm run episode-status -- <id>` (new) |
| Shots | `npm run validate-episode-shots -- <id> [--shot <shot-id>]`, `npm run preview-episode-shots -- <id> [--shot <shot-id>]`, `npm run render-episode-shots -- <id> [--shot <shot-id>]` (new flag) |
| Delivery | `npm run prepare-episode-assets -- <id>`, `npm run validate-episode -- <id>`, `npm run preview-episode -- <id>`, `npm run render-still-frame -- <id> --frame <n>`, `npm run render-episode -- <id>`, `npm run generate-contact-sheet -- <id>`, `npm run compare-episode-visual-regression -- <id>`, `npm run verify-episode-output -- <id>` |
| Shot-level gates | `npx hyperframes check <shot-dir> --strict`, `npx hyperframes snapshot <shot-dir> --at <sec,sec>` |

## Contract reminders

- **manifest.ts** — `id` (kebab-case), `title`, `language`, `format` + `width`/`height`/`fps` (use `LANDSCAPE_PRESET`), `theme`, `scenes[]`. Beats are scene-relative, sorted, non-overlapping, inside the duration. Captions are scene-relative, sorted, non-overlapping, inside the duration.
- **episode.ts** — parse the manifest through a local `z.enum` visual schema. Never hardcode an episode into a shared Remotion scene.
- **ShotBrief** — file `shot-<NNN>.json`: `id`, `sceneId`, `title`, `narration`, `visual`, `renderer` (`browser|manim|composite|blender`), `visualStyle: "episode-defined"`, `visualDirection`, `motion`, `durationInFrames` (must equal its manifest scene), `continuity`, `implementation`, `qualityChecks`, `assets`. `implementation.sourceRoot` is `html/shot-<NNN>` or `manim/shot-<NNN>`; declared files must exist. Layered implementation requires `renderer: "composite"`, unique `zIndex`, an opaque bottom layer, and per-layer dimensions/fps equal to the shot output.
- **Captions and text ownership** — Remotion renders narration captions; browser shots draw only short relationship labels and must never contain the ShotBrief title, `SHOT 001`-style numbering, or verbatim caption phrases. One scene-relative timeline is shared by script, captions, and any future voiceover cue.
- **Continuity** — a shot may only inherit what the previous shot declared it leaves.
- **Determinism** — every frame must be reproducible from the timeline alone. Prefer `hf-seek` + GSAP paused timelines and `window.__timelines`.
- **Guides are contract** — if a guide conflicts with a higher-priority project or user instruction, follow the instruction and update the guide when the contract changes.