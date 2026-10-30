import React from 'react';
import {useCurrentFrame} from 'remotion';

/**
 * 电影感叠加层：暗角 + 上下压暗 + 极轻颗粒 + 扫描线。
 *
 * 约束：
 * - 纯视觉叠加，不读写 manifest，不改变任何时间轴语义；
 * - 颗粒位移只由当前帧号派生（且每 3 帧一档），可 seek、可重放，不使用 Date.now / Math.random；
 * - z-index 10，位于镜头资产之上、字幕层（z-index 20）之下，保证字幕永远清晰。
 */
const GRAIN_SIZE = 512;
const GRAIN_SVG = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${GRAIN_SIZE}" height="${GRAIN_SIZE}">`,
  '<filter id="n">',
  '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" seed="17"/>',
  '<feColorMatrix type="saturate" values="0"/>',
  '</filter>',
  `<rect width="${GRAIN_SIZE}" height="${GRAIN_SIZE}" filter="url(#n)"/>`,
  '</svg>',
].join('');

const GRAIN_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN_SVG)}")`;

type CinematicOverlayProps = {
  grainOpacity?: number;
  scanlineOpacity?: number;
  vignetteOpacity?: number;
};

export const CinematicOverlay: React.FC<CinematicOverlayProps> = ({
  grainOpacity = 0.05,
  scanlineOpacity = 0.07,
  vignetteOpacity = 1,
}) => {
  const frame = useCurrentFrame();
  // 确定性颗粒抖动：每 3 帧位移 1px，模拟胶片颗粒的呼吸感
  const jitterX = (frame % 3) - 1;
  const jitterY = (Math.floor(frame / 3) % 3) - 1;

  return (
    <div className="cinematic-overlay" aria-hidden="true">
      <div className="cinematic-overlay__vignette" style={{opacity: vignetteOpacity}} />
      <div
        className="cinematic-overlay__grain"
        style={{
          backgroundImage: GRAIN_URL,
          backgroundSize: `${GRAIN_SIZE}px ${GRAIN_SIZE}px`,
          backgroundRepeat: 'repeat',
          opacity: grainOpacity,
          transform: `translate(${jitterX}px, ${jitterY}px)`,
        }}
      />
      <div className="cinematic-overlay__scanlines" style={{opacity: scanlineOpacity}} />
    </div>
  );
};