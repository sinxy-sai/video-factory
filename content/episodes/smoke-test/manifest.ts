import type {EpisodeManifest} from '../../schema';
import {LANDSCAPE_PRESET} from '../../presets';

export const manifest: EpisodeManifest = {
  id: 'smoke-test',
  title: '管线自检',
  language: 'zh-CN',
  ...LANDSCAPE_PRESET,
  theme: 'clear-science',
  scenes: [
    {
      id: 'pipeline-check',
      title: '管线自检',
      claim: '整条生产管线在当前依赖下能产出 5 秒、1920x1080、30fps 的成片。',
      visual: 'pipeline-check',
      durationInFrames: 150,
      beats: [
        {id: 'enter', purpose: 'enter', startFrame: 0, durationInFrames: 33},
        {id: 'process', purpose: 'process', startFrame: 33, durationInFrames: 75},
        {id: 'resolve', purpose: 'resolve', startFrame: 108, durationInFrames: 42},
      ],
      captions: [
        {id: 'pipeline-caption', text: '这支片子只由帧时间驱动，任何一帧都能重跑复现。', startFrame: 12, durationInFrames: 138},
      ],
      supportingText: '深空天文台仪器面板：帧时间、帧号、随机种子与可复现状态。',
    },
  ],
};