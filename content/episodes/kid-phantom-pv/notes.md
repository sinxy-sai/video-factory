# kid-phantom-pv 制作笔记

## 目标

20 秒、4 镜、1920x1080 / 30 fps 的月夜怪盗视觉 PV，用于自举验证 cinematic 模式。

## 约束记录

- 无旁白、无字幕：manifest 使用 `captionMode: 'none'`，captions 为空数组。
- 全部画面由浏览器镜头绘制（`renderer: browser`），不使用 Manim、Blender 或外部位图。
- 版权：只使用原创剪影与符号（礼帽、单片眼镜、披风、扑克牌、圆月、探照灯、预告函细线），不使用任何官方角色、Logo 或原画。
- 确定性：GSAP paused timeline 驱动，种子 PRNG 生成星空/颗粒，无 `Date.now()`、无未播种随机、无网络资源依赖（字体由 HyperFrames 编译期缓存为本地 @font-face）。

## 目录

- `html/shot-00X/index.html`：四镜画面源文件。
- `shot-briefs/shot-00X.json`：逐镜契约。
- `manifest.ts` / `episode.ts`：场景、时长、beats 与本地 visual 枚举。
- 渲染产物：`renders/kid-phantom-pv/shots/*.mp4` 与 `renders/kid-phantom-pv/final.mp4`。
- 视觉审查帧：`renders/kid-phantom-pv/review/`。