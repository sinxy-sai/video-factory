import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import type {SceneManifest} from '../../content/schema';
import {getActiveCaption} from '../motion/captions';

/**
 * 字幕层：时间轴语义不变 —— 显示区间仍完全由 manifest 的 `captions` 决定。
 * 这里只负责 1080p 下的排版与入场/退场动效：
 * - 入场：8 帧内上浮 14px + 淡入（符合 24–30fps 下 0.27–0.33s 的阅读预备）
 * - 退场：最后 6 帧淡出并继续上移 6px，避免与下一句字幕硬切
 * - 强调色：使用 scene.accent（manifest 可选字段），缺省用青色信号色
 */
const ENTER_FRAMES = 8;
const EXIT_FRAMES = 6;
const DEFAULT_ACCENT = '#5FE3D0';

export const CaptionLayer: React.FC<{scene: SceneManifest}> = ({scene}) => {
  const frame = useCurrentFrame();
  const caption = getActiveCaption(scene, frame);
  if (!caption) return null;

  const localFrame = frame - caption.startFrame;
  const end = caption.durationInFrames;
  const enterProgress = interpolate(localFrame, [0, Math.min(ENTER_FRAMES, end)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitProgress = interpolate(localFrame, [Math.max(0, end - EXIT_FRAMES), end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enterProgress, exitProgress);
  const rise = interpolate(enterProgress, [0, 1], [14, 0]);
  const exitRise = interpolate(exitProgress, [0, 1], [-6, 0]);
  const translateY = rise + exitRise;
  const accent = scene.accent ?? DEFAULT_ACCENT;

  return (
    <div
      className="caption-layer"
      style={{opacity, transform: `translateY(${translateY}px)`}}
    >
      <span className="caption-layer__accent" style={{backgroundColor: accent, opacity: enterProgress}} />
      <span className="caption-layer__text">{caption.text}</span>
    </div>
  );
};