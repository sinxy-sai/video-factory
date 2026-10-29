import {copyFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {assertEpisodeId} from './episode-id';

export type EpisodeScaffoldOptions = {
  /** Project root containing content/, node_modules/, and .venv/. */
  projectRoot?: string;
  /** Override the GSAP runtime copied into the browser shot (used by tests). */
  gsapSource?: string;
};

export type EpisodeScaffold = {
  safeId: string;
  /** Workspace-relative directory, suitable for CLI output. */
  directory: string;
};

/**
 * Write the self-contained episode skeleton. The generated browser shot must
 * already pass `npx hyperframes check --strict`: every timed element carries
 * `class="clip"`, so new episodes do not start from a known strict failure.
 */
export function createEpisodeScaffold(episodeId: string, options: EpisodeScaffoldOptions = {}): EpisodeScaffold {
  const safeId = assertEpisodeId(episodeId);
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const directory = join(projectRoot, 'content', 'episodes', safeId);
  if (existsSync(directory)) {
    throw new Error(`Episode already exists: ${safeId}`);
  }

  mkdirSync(join(directory, 'assets'), {recursive: true});
  mkdirSync(join(directory, 'assets', 'generated'), {recursive: true});
  mkdirSync(join(directory, 'scenes'), {recursive: true});
  mkdirSync(join(directory, 'shot-briefs'), {recursive: true});
  mkdirSync(join(directory, 'html', 'shot-001', 'assets'), {recursive: true});
  mkdirSync(join(directory, 'manim'), {recursive: true});
  writeFileSync(join(directory, 'assets', '.gitkeep'), '', 'utf8');
  writeFileSync(join(directory, 'assets', 'generated', '.gitkeep'), '', 'utf8');
  writeFileSync(
    join(directory, 'notes.md'),
    `# ${safeId}\n\nDescribe the science claim, source notes, and visual plan here.\n`,
    'utf8',
  );
  writeFileSync(join(directory, 'content-plan.md'), `---\nstate: discussion\napprovals:\n  content: false\n  storyboard: false\n  shot-design: false\n---\n\n# ${safeId} Content Plan\n\nComplete the discussion-first content plan before authoring. Record the audience, learning objective, factual claims, narration, structure, sources, and audio intent.\n`, 'utf8');
  writeFileSync(join(directory, 'shot-design.md'), `---\nstate: discussion\napprovals:\n  content: false\n  storyboard: false\n  shot-design: false\n---\n\n# ${safeId} Shot Design\n\nAfter the content plan is approved, document every shot's hero frame, composition, focal point, hierarchy, motion states, transitions, subtitles, assets, renderer, and continuity.\n`, 'utf8');
  writeFileSync(join(directory, 'script.md'), `# ${safeId}\n\n## 目标\n\n在这里写完整旁白剧本。每个镜头的 narration 必须与最终配音一致。旁白、字幕和未来配音 cue 必须共用 manifest 的 scene-relative 帧时间轴。\n\n## 旁白\n\n在这里写本集完整旁白。\n`, 'utf8');
  writeFileSync(join(directory, 'storyboard.md'), `# ${safeId} 分镜表\n\n| 镜头 | 时间 | 画面 | 旁白 | 技术 |\n|---|---|---|---|---|\n| shot-001 | 00:00–00:05 | Replace with shot description | Replace with narration | Remotion |\n`, 'utf8');
  writeFileSync(join(directory, 'visual-style.md'), `# ${safeId} Visual Style\n\nDefine palette, typography, motion language, and continuity rules for this episode.\n`, 'utf8');
  writeFileSync(join(directory, 'html', 'README.md'), '# Browser shots\n\nEach shot is authored in `html/<shot-id>/` with HTML/CSS/JavaScript, SVG, Canvas 2D, or Three.js/WebGL. GSAP defines deterministic shot motion. HyperFrames drives validation, preview, and rendering.\n', 'utf8');
  writeFileSync(join(directory, 'manim', 'README.md'), '# Manim\n\nPlace Manim source files and rendered outputs here.\n', 'utf8');
  writeFileSync(join(directory, 'html', 'shot-001', 'DESIGN.md'), `# Shot 001 Design\n\nDefine the visual identity, hero frame, SVG/Canvas/WebGL layers, and GSAP motion before writing animation.\n`, 'utf8');
  const gsapSource = options.gsapSource ?? join(projectRoot, 'node_modules', 'gsap', 'dist', 'gsap.min.js');
  copyFileSync(gsapSource, join(directory, 'html', 'shot-001', 'assets', 'gsap.min.js'));
  writeFileSync(join(directory, 'html', 'shot-001', 'index.html'), `<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><title>${safeId} shot-001</title><script src="assets/gsap.min.js"></script><style>html,body{margin:0;width:1920px;height:1080px;background:#07111F;color:#E7F0FF;font-family:Arial,sans-serif}main{width:100%;height:100%;padding:140px 160px;box-sizing:border-box;display:flex;align-items:center;justify-content:center}.rule{height:8px;width:320px;background:#48D7C4;transform-origin:left}</style></head><body><div data-composition-id="shot-001" data-width="1920" data-height="1080" data-duration="5"><main><div id="rule" class="rule clip" data-start="0" data-duration="5" data-track-index="1"></div></main><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});tl.from('#rule',{scaleX:0,duration:.55,ease:'power4.out'},.2);window.__timelines['shot-001']=tl;</script></div></body></html>`, 'utf8');
  writeFileSync(join(directory, 'shot-briefs', 'shot-001.json'), JSON.stringify({id:'shot-001',sceneId:'intro',title:'Replace with a shot title',narration:'Replace with a short spoken line.',visual:'intro',durationInFrames:150,renderer:'browser',visualStyle:'episode-defined',visualDirection:{composition:'Replace with topic-specific composition',focalPoint:'Replace with topic-specific focal point',hierarchy:['Replace with primary visual element'],palette:'Replace with topic-specific palette',typography:'Replace with typography direction',texture:'optional texture or material'},motion:{entrance:'replace-with-entrance',transformation:'replace-with-transformation',exit:'transition-owned',transition:'replace-with-transition',pacing:'measured'},continuity:{leaves:['primary-subject'],inherits:[]},implementation:{sourceRoot:'html/shot-001',output:{kind:'mp4',path:`renders/${safeId}/shots/shot-001.mp4`,width:1920,height:1080,fps:30},composition:'asset',visualMode:'html',files:['html/shot-001/index.html']},qualityChecks:{lint:true,validate:true,inspect:true,animationMap:true,strict:true},assets:[]}, null, 2) + '\n', 'utf8');
  writeFileSync(
    join(directory, 'manifest.ts'),
    `import type {EpisodeManifest} from '../../schema';\nimport {LANDSCAPE_PRESET} from '../../presets';\n\nexport const manifest: EpisodeManifest = {\n  id: '${safeId}',\n  title: 'Replace with a topic',\n  language: 'zh-CN',\n  ...LANDSCAPE_PRESET,\n  theme: 'clear-science',\n  scenes: [\n    {\n      id: 'intro',\n      title: 'Replace with a scene title',\n      claim: 'Replace with one concise knowledge claim.',\n      visual: 'intro',\n      durationInFrames: 150,\n      captionMode: 'required',\n      beats: [\n        {id: 'enter', purpose: 'enter', startFrame: 0, durationInFrames: 24},\n        {id: 'resolve', purpose: 'resolve', startFrame: 24, durationInFrames: 60},\n      ],\n      captions: [\n        {id: 'intro-caption', text: 'Replace with a short spoken line.', startFrame: 18, durationInFrames: 60},\n      ],\n      supportingText: 'Replace with a short explanation.',\n    },\n  ],\n};\n`,
    'utf8',
  );
  writeFileSync(
    join(directory, 'scenes', 'IntroScene.tsx'),
    `\nexport const IntroScene: React.FC = () => (\n  <div style={{display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#F4F7FB', fontSize: 56}}>\n    Replace with your intro visual\n  </div>\n);\n`,
    'utf8',
  );
  writeFileSync(
    join(directory, 'episode.ts'),
    `import {z} from 'zod';\nimport type {EpisodeModule} from '../../episode-module';\nimport {episodeManifestSchema, sceneSchema} from '../../schema';\nimport {manifest} from './manifest';\n\nconst localVisualSchema = z.enum(['intro']);\nconst localManifestSchema = episodeManifestSchema.safeExtend({\n  scenes: z.array(sceneSchema.safeExtend({visual: localVisualSchema})),\n});\nconst validatedManifest = localManifestSchema.parse(manifest);\n\nexport const episode: EpisodeModule = {\n  manifest: validatedManifest,\n};\n`,
    'utf8',
  );

  return {safeId, directory: join('content', 'episodes', safeId)};
}