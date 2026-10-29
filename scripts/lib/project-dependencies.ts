import {existsSync, mkdirSync} from 'node:fs';
import {delimiter, join, resolve} from 'node:path';

export type ProjectDependencyPaths = {
  root: string;
  python: string | null;
  manim: string | null;
  ffmpegBin: string | null;
  ffmpeg: string | null;
  ffprobe: string | null;
};

const firstExisting = (candidates: string[]): string | null => candidates.find((candidate) => existsSync(candidate)) ?? null;

export function resolveDependencyPaths(projectRoot = process.cwd()): ProjectDependencyPaths {
  const root = resolve(projectRoot);
  const windows = process.platform === 'win32';
  const scripts = windows ? 'Scripts' : 'bin';
  const executable = (name: string) => windows ? `${name}.exe` : name;
  const venvBin = join(root, '.venv', scripts);
  const ffmpegBin = firstExisting([
    join(root, 'tools', 'ffmpeg', 'bin'),
    join(root, 'tools', 'ffmpeg'),
  ]);
  return {
    root,
    python: firstExisting([join(venvBin, executable('python')), join(venvBin, executable('python3'))]),
    manim: firstExisting([join(venvBin, executable('manim'))]),
    ffmpegBin,
    ffmpeg: ffmpegBin ? firstExisting([join(ffmpegBin, executable('ffmpeg'))]) : null,
    ffprobe: ffmpegBin ? firstExisting([join(ffmpegBin, executable('ffprobe'))]) : null,
  };
}

export function projectDependencyEnv(projectRoot = process.cwd()): NodeJS.ProcessEnv {
  const paths = resolveDependencyPaths(projectRoot);
  const pathEntries = [paths.ffmpegBin, paths.python ? join(paths.root, process.platform === 'win32' ? '.venv/Scripts' : '.venv/bin') : null, process.env.PATH].filter(Boolean);
  // HyperFrames writes captured frames and intermediate MP4s through FFmpeg into
  // the OS temp directory. Under sandboxed hosts that directory can be
  // write-denied for child binaries, which surfaces as
  // "Error opening output files: Permission denied" during the encode stage.
  // Pin a workspace-local temp dir and the project FFmpeg so every renderer
  // (HyperFrames, Remotion, Manim) uses the same writable, reproducible tools.
  const tempDir = join(paths.root, '.tmp');
  try {
    mkdirSync(tempDir, {recursive: true});
  } catch {
    // If the directory cannot be created, keep the host default temp dir.
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: pathEntries.join(delimiter),
  };
  if (paths.ffmpeg) env.HYPERFRAMES_FFMPEG_PATH = paths.ffmpeg;
  if (paths.ffprobe) env.HYPERFRAMES_FFPROBE_PATH = paths.ffprobe;
  if (existsSync(tempDir)) {
    env.TEMP = tempDir;
    env.TMP = tempDir;
    env.TMPDIR = tempDir;
  }
  return env;
}

export function missingProjectDependencies(projectRoot = process.cwd()): string[] {
  const paths = resolveDependencyPaths(projectRoot);
  const missing: string[] = [];
  if (!paths.python) missing.push('project Python (.venv)');
  if (!paths.manim) missing.push('Manim (.venv)');
  if (!paths.ffmpeg) missing.push('FFmpeg (tools/ffmpeg)');
  if (!paths.ffprobe) missing.push('FFprobe (tools/ffmpeg)');
  return missing;
}
