/* smoke-test shot-001 · 美术系统 A（深空天文台）5 秒时间轴构造器
 * 契约：index.html 在 document.fonts.ready 后调用 window.__buildShotTimeline()，
 * 并把返回的 paused timeline 注册到 window.__timelines["shot-001"]。
 * 所有状态只由时间驱动，禁止 Date.now / Math.random / 交互 / 未播种随机。
 * 本镜头是管线健康检查片：同一帧时间必须产出同一画面。
 */
(function () {
  'use strict';

  var W = 1920, H = 1080;
  var DURATION = 5.0;
  var BEAT = {enter: 0.0, build: 1.1, process: 1.9, resolve: 3.6, end: DURATION};

  /* 确定性 PRNG：mulberry32，仅用于星场分布 */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20261028);
  function ns(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }

  /* ── 星场：48 颗，深浅三档；3 颗带十字星芒 ───────────────────── */
  var stars = document.getElementById('stars');
  var glints = document.getElementById('glints');
  for (var i = 0; i < 48; i++) {
    var depth = rand();
    var c = ns('circle');
    c.setAttribute('cx', (620 + rand() * 1240).toFixed(1));
    c.setAttribute('cy', (40 + rand() * 860).toFixed(1));
    c.setAttribute('r', (0.6 + depth * 1.5).toFixed(2));
    c.setAttribute('opacity', (0.12 + depth * 0.55).toFixed(2));
    c.setAttribute('class', 'star');
    stars.appendChild(c);
  }
  [[1560, 196, 9], [742, 344, 6], [1698, 792, 7]].forEach(function (g) {
    var glint = ns('g');
    glint.setAttribute('opacity', '.3');
    glint.innerHTML =
      '<line x1="' + (g[0] - g[2]) + '" y1="' + g[1] + '" x2="' + (g[0] + g[2]) + '" y2="' + g[1] + '"></line>' +
      '<line x1="' + g[0] + '" y1="' + (g[1] - g[2]) + '" x2="' + g[0] + '" y2="' + (g[1] + g[2]) + '"></line>';
    glints.appendChild(glint);
  });

  /* ── 经纬网格 ────────────────────────────────────────────────── */
  var grid = document.getElementById('grid-lines');
  for (var x = 0; x <= W; x += 96) {
    var v = ns('line');
    v.setAttribute('x1', x); v.setAttribute('y1', 0); v.setAttribute('x2', x); v.setAttribute('y2', H);
    grid.appendChild(v);
  }
  for (var y = 0; y <= H; y += 96) {
    var h = ns('line');
    h.setAttribute('x1', 0); h.setAttribute('y1', y); h.setAttribute('x2', W); h.setAttribute('y2', y);
    grid.appendChild(h);
  }

  /* ── 顶部标尺刻度：每 4 格一主刻度 ───────────────────────────── */
  var ruler = document.getElementById('ruler-ticks');
  for (var rx = 156, k = 0; rx <= 1764; rx += 36, k++) {
    var major = k % 4 === 0;
    var t = ns('line');
    t.setAttribute('x1', rx); t.setAttribute('x2', rx);
    t.setAttribute('y1', 118); t.setAttribute('y2', major ? 106 : 112);
    t.setAttribute('opacity', major ? 0.75 : 0.38);
    t.setAttribute('class', 'ruler-tick');
    ruler.appendChild(t);
  }

  /* ── 卫星椭圆轨道：参数预计算，逐段线性 tween（可任意 seek） ── */
  var CX = 1252, CY = 452, RX = 336, RY = 132, ROT = -14 * Math.PI / 180;
  var SEGMENTS = 64;
  var path = [];
  for (var s = 0; s <= SEGMENTS; s++) {
    var a = -Math.PI / 2 + (s / SEGMENTS) * Math.PI * 2;
    var px = Math.cos(a) * RX, py = Math.sin(a) * RY;
    path.push([
      +(CX + px * Math.cos(ROT) - py * Math.sin(ROT)).toFixed(2),
      +(CY + px * Math.sin(ROT) + py * Math.cos(ROT)).toFixed(2)
    ]);
  }
  gsap.set(['#sat', '#sat-glow'], {attr: {cx: path[0][0], cy: path[0][1]}});

  /* ── 时间轴构造器：由 index.html 在字体就绪后调用并注册 ────────── */
  window.__buildShotTimeline = function () {
    var tl = gsap.timeline({paused: true});
    function from(sel, fromVars, toVars, at, dur, ease) {
      tl.fromTo(sel, fromVars, Object.assign({duration: dur, ease: ease || 'power3.out'}, toVars), at);
    }

    /* 建立 0.0–1.1：大气 / 网格 / 星场 / 轨道 / 排版依次进场 */
    from('.sky__base', {opacity: 0}, {opacity: 1}, 0.00, 0.40, 'power2.out');
    from('.sky__scrim', {opacity: 0}, {opacity: 1}, 0.08, 0.62, 'power1.out');
    from('.sky__glow', {opacity: 0, scale: 1.06}, {opacity: 1, scale: 1}, 0.05, 0.85, 'power2.out');
    from('.sky__warm', {opacity: 0}, {opacity: 1}, 0.12, 1.00, 'power2.out');
    from('#grid', {opacity: 0}, {opacity: 1}, 0.10, 0.70, 'power2.out');
    from('#grid-lines', {y: 10, opacity: 0}, {y: 0, opacity: 1}, 0.10, 0.80, 'power2.out');
    tl.from('.star', {opacity: 0, duration: 0.55, stagger: {each: 0.006, from: 'start'}, ease: 'power1.out'}, 0.14);
    tl.from('#glints', {opacity: 0, duration: 0.70, ease: 'power1.out'}, 0.30);
    from('#orbit-system', {scale: 0.94, opacity: 0}, {scale: 1, opacity: 1}, 0.08, 0.75);
    from('#horizon-scan', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 0.28, 0.55, 'power2.inOut');
    from('#arc-main', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 0.30, 0.65, 'power2.inOut');
    from('#rings > *', {opacity: 0}, {opacity: 1, stagger: 0.03}, 0.25, 0.55, 'power1.out');
    from('#arcs > *', {opacity: 0}, {opacity: 1}, 0.40, 0.55, 'power1.out');
    from('#planet-halo-glow', {opacity: 0, scale: 0.82}, {opacity: 1, scale: 1}, 0.28, 0.80, 'power2.out');
    from('#planet-group', {opacity: 0}, {opacity: 1}, 0.30, 0.50, 'power2.out');
    from('#reticle', {opacity: 0, scale: 1.08}, {opacity: 1, scale: 1}, 0.42, 0.55, 'power3.out');
    from('#frame-marks', {opacity: 0}, {opacity: 1}, 0.34, 0.55, 'power1.out');

    /* 排版：eyebrow → 主体数字 → 单位 → 元数据，逐级上浮 */
    from('.type__eyebrow', {y: 14, opacity: 0}, {y: 0, opacity: 1}, 0.30, 0.32, 'power3.out');
    from('.type__subject', {y: 16, opacity: 0}, {y: 0, opacity: 1}, 0.36, 0.34, 'power3.out');
    from('.type__rule', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1}, 0.42, 0.32, 'power3.out');
    from('#rule-live', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1}, 0.62, 0.28, 'power3.out');
    from('#hero-figure', {y: 34, opacity: 0}, {y: 0, opacity: 1}, 0.46, 0.50, 'power4.out');
    from('.type__hero-unit', {y: 18, opacity: 0}, {y: 0, opacity: 1}, 0.62, 0.38, 'power3.out');
    from('.type__hero-en', {x: -12, opacity: 0}, {x: 0, opacity: 1}, 0.70, 0.38, 'power3.out');
    tl.fromTo('.type__meta', {y: 14, opacity: 0}, {y: 0, opacity: 1, duration: 0.34, stagger: 0.06, ease: 'power3.out'}, 0.74);

    /* 遥测与标尺 */
    from('.readout__tick', {scaleY: 0, opacity: 0}, {scaleY: 1, opacity: 1}, 0.52, 0.22, 'power2.out');
    tl.fromTo('.readout__row', {y: 10, opacity: 0}, {y: 0, opacity: 1, duration: 0.28, stagger: 0.06, ease: 'power3.out'}, 0.58);
    from('#scale-line', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1, transformOrigin: 'left center'}, 0.18, 0.55, 'power3.inOut');
    tl.fromTo('.ruler-tick', {scaleY: 0, opacity: 0}, {scaleY: 1, opacity: 1, duration: 0.28, stagger: {each: 0.007, from: 'start'}, ease: 'power2.out'}, 0.28);
    tl.fromTo('#scale text', {opacity: 0}, {opacity: 1, duration: 0.36, stagger: 0.04, ease: 'power1.out'}, 0.46);

    /* 过程 1.1–3.6：卫星绕行（逐段线性，可任意 seek） */
    var span = 2.5;
    for (var i = 1; i <= SEGMENTS; i++) {
      tl.to(['#sat', '#sat-glow'], {
        attr: {cx: path[i][0], cy: path[i][1]},
        duration: span / SEGMENTS,
        ease: 'none'
      }, BEAT.build + ((i - 1) * span) / SEGMENTS);
    }

    /* 过程 1.9–2.9：一道扫描光带横穿仪器视场（只扫主体，不压文字） */
    from('.sweep__beam', {x: 700, opacity: 0}, {x: 700, opacity: 1}, 1.90, 0.22, 'power1.out');
    tl.to('.sweep__beam', {x: 1810, duration: 0.80, ease: 'power2.inOut'}, 2.12);
    tl.to('.sweep__beam', {opacity: 0, duration: 0.26, ease: 'power1.in'}, 2.66);

    /* 环境微动：远景推近 / 轨道进动 / 辉光呼吸 / 浮尘漂移 */
    from('#field', {scale: 1, x: 0}, {scale: 1.022, x: -7}, 0.80, 4.20, 'none');
    from('#rings', {rotation: 0}, {rotation: 2.4, transformOrigin: '1252px 452px'}, 0.80, 4.20, 'none');
    from('#sat-path', {rotation: -14}, {rotation: -16.6, transformOrigin: '1252px 452px'}, 0.80, 4.20, 'none');
    tl.to('#planet-halo-glow', {opacity: 0.72, duration: 1.10, yoyo: true, repeat: 1, ease: 'sine.inOut'}, 1.40);
    from('.mote--a', {y: 0}, {y: 18}, 0.40, 4.60, 'sine.inOut');
    from('.mote--b', {y: 0}, {y: -21}, 0.50, 4.50, 'sine.inOut');
    from('.mote--c', {y: 0}, {y: 13}, 0.30, 4.70, 'sine.inOut');
    from('.mote--d', {y: 0}, {y: -11}, 0.60, 4.40, 'sine.inOut');

    /* 解决 3.6–4.6：主弧收束 / 准星收紧 / 临边光提亮 / 辉光回落 */
    tl.to('#arc-main', {strokeWidth: 3, duration: 0.55, ease: 'power2.out'}, 3.60);
    tl.to('#arc-live', {opacity: 1, duration: 0.50, ease: 'power2.out'}, 3.60);
    tl.to('#reticle', {scale: 0.965, duration: 0.60, ease: 'power2.inOut'}, 3.72);
    tl.to('#hero-figure', {color: '#FFFFFF', duration: 0.55, ease: 'power2.out'}, 3.80);
    tl.to('#planet-limb', {opacity: 1, duration: 0.60, ease: 'power2.out'}, 3.86);
    tl.to('.sky__glow', {opacity: 0.82, duration: 0.90, ease: 'sine.inOut'}, 4.00);

    return tl;
  };
})();