import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {getEpisodeModule} from '../../content/episodes/registry.generated';
import type {EpisodeModule} from '../../content/episode-module';
import {totalDurationInFrames, type EpisodeManifest} from '../../content/schema';
import type {ShotBrief} from '../../content/shot-brief';
import type {ShotAssetRecord} from '../../production/shot-assets';
import {isLayeredImplementation} from '../../production/shot-contract';
import {projectDependencyEnv} from './project-dependencies';
import {assertEpisodeId} from './episode-id';

export {assertEpisodeId};

export async function loadEpisodeModule(id: string): Promise<EpisodeModule> {
  const safeId = assertEpisodeId(id);
  return getEpisodeModule(safeId);
}

export async function loadEpisodeManifest(id: string): Promise<EpisodeManifest> {
  return (await loadEpisodeModule(id)).manifest;
}

export function writePropsFile(manifest: EpisodeManifest): string {
  const tempDir = resolve('.remotion');
  mkdirSync(tempDir, {recursive: true});
  const path = join(tempDir, `${manifest.id}.props.json`);
  writeFileSync(path, JSON.stringify({manifest: hydrateManifestWithShotAssets(manifest)}, null, 2), 'utf8');
  return path;
}

export function loadPreparedShotAssets(episodeId: string): ShotAssetRecord[] {
  const path = join(staticEpisodeRoot(episodeId), 'shots', 'assets.manifest.json');
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8')) as ShotAssetRecord[];
}

export function hydrateManifestWithShotAssets(manifest: EpisodeManifest): EpisodeManifest {
  const assets = new Map(loadPreparedShotAssets(manifest.id).map((asset) => [asset.sceneId, asset]));
  return {
    ...manifest,
    scenes: manifest.scenes.map((scene) => {
      if (scene.shotAsset) return scene;
      const asset = assets.get(scene.id);
      if (!asset) return scene;
      return {
        ...scene,
        shotAsset: {
          path: asset.path,
          kind: asset.kind,
          width: asset.width,
          height: asset.height,
          fps: asset.fps,
        },
      };
    }),
  };
}

export function ensureRenderDir(manifest: EpisodeManifest): string {
  const directory = resolve('renders', manifest.id);
  mkdirSync(directory, {recursive: true});
  return directory;
}

export function episodeRoot(id: string): string {
  return resolve('content', 'episodes', assertEpisodeId(id));
}

export function staticEpisodeRoot(id: string): string {
  return resolve('static', 'episodes', assertEpisodeId(id));
}

export function shotSourceDirectory(episodeId: string, brief: ShotBrief): string {
  if (isLayeredImplementation(brief.implementation)) return episodeRoot(episodeId);
  return resolve(episodeRoot(episodeId), brief.implementation.sourceRoot);
}

export function shotOutputPath(episodeId: string, brief: ShotBrief): string {
  return resolve('renders', assertEpisodeId(episodeId), 'shots', `${brief.id}.${brief.implementation.output.kind === 'frame-sequence' ? 'frames' : brief.implementation.output.kind}`);
}

export function shotAssetPath(episodeId: string, brief: ShotBrief): string {
  const extension = brief.implementation.output.kind === 'frame-sequence' ? 'frames' : brief.implementation.output.kind;
  return `episodes/${assertEpisodeId(episodeId)}/shots/${brief.id}.${extension}`;
}

export function writeManifestSnapshot(manifest: EpisodeManifest, directory: string, filename: string): string {
  const path = join(directory, `${filename}.manifest.json`);
  writeFileSync(path, JSON.stringify(manifest, null, 2), 'utf8');
  return path;
}

export function describeManifest(manifest: EpisodeManifest): string {
  return `${manifest.id}: ${manifest.title} | ${manifest.width}x${manifest.height} @ ${manifest.fps}fps | ${totalDurationInFrames(manifest)} frames`;
}

export function parseFlag(args: string[], flag: string, fallback: string): string {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

export function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function pathExists(path: string): boolean {
  return existsSync(path);
}

export function getBrowserExecutable(): string | null {
  const candidate = resolve('node_modules', '.remotion', 'chrome-headless-shell', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
  return existsSync(candidate) ? candidate : null;
}

export function browserArgs(): string[] {
  const executable = getBrowserExecutable();
  return executable ? [`--browser-executable=${executable}`] : [];
}

export function projectToolEnv(projectRoot = process.cwd()): NodeJS.ProcessEnv {
  return projectDependencyEnv(projectRoot);
}
