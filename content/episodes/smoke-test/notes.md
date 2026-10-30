# smoke-test 备注

## 这支片子是什么

`smoke-test` 不是内容样片，是**管线健康检查**：一条 5 秒、单镜、带一条中文字幕的最小完整链路。它同时覆盖 HyperFrames 严格检查、浏览器逐帧渲染、Remotion 字幕合成、FFmpeg 编码和 `verify-episode-output` 五个环节。任何一环坏了，这支片子会先坏。

## 画面主张（可对着源码核对）

1. 5 秒帧时间的两个端点直接写在画面里：`T+0.000 s` 与 `T+5.000 s`。
2. 星场分布由固定种子 `20261028` 生成（`mulberry32`），重跑位置不变。
3. 卫星在 1.1–3.6 s 之间沿椭圆轨道走完一圈，用来观察 seek 是否精确。

三条都能在 `html/shot-001/index.html` 与 `html/shot-001/assets/shot-timeline.js` 里直接核对，不涉及任何外部事实来源。

## 为什么去掉远程字体

本镜最初引用了 Google Fonts 的 `<link>`，在离线或网络受限环境下 `npx hyperframes check --strict` 会报 `request_failed: net::ERR_CONNECTION_RESET`。健康检查片不应该依赖外网，所以这里改成纯系统字体栈回退。如果将来要恢复远程字体，先确认 `npx hyperframes check --strict` 在断网环境仍为 0 findings。

## 确定性

- 只用 `mulberry32(20261028)` 播种随机；没有 `Date.now()`、`Math.random()`、hover 或网络请求。
- 所有时间元素都有稳定 id，时间轴是 `gsap.timeline({paused: true})` 并注册到 `window.__timelines['shot-001']`。
- 字体就绪后（`document.fonts.ready`）才构建并注册时间轴，保证字宽与最终渲染一致。

## 已知取舍

- 5 秒只有 150 帧，节拍密度高于常规 explainer；这是为了让每次体检都快（整条链路在一分钟内跑完）。
- 字幕只有一条、覆盖 92%，不做逐句断句；健康检查只需要验证字幕层能被渲染且落在 y>886px 的安全带内。
- 没有旁白与配乐，`manifest.ts` 不声明 `audio`。