/* shot-starter-editorial · 美术系统 C（纸本编辑 / 博物馆）时间轴构造器
 * 契约：index.html 在 document.fonts.ready 后调用 window.__buildShotTimeline()，
 * 并把返回的 paused timeline 注册到 window.__timelines["shot-starter-editorial"]。
 * 所有状态只由时间驱动，禁止 Date.now / Math.random / 交互 / 未播种随机。
 * 改镜头时：改 BASE/RIM 换图版几何，改 VEINS/FORK 换脉序密度，改 BEAT 换节奏。
 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  /* 节奏：建立 0–1.2s / 线刻 1.2–3.2s / 朱批 3.0–4.4s / 落定 5.5–7.6s */
  var BEAT = {enter: 0.0, draw: 1.20, marks: 3.00, hold: 4.40, resolve: 5.50, end: 8.0};

  /* 确定性 PRNG：mulberry32，只用于脉序弧线与纸纤维的分布 */
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
  var rand = mulberry32(20261030);
  function ns(tag) { return document.createElementNS(SVGNS, tag); }
  function f(n) { return n.toFixed(1); }
  function r2(n) { return Math.round(n * 10) / 10; }

  /* ── 图版几何：叶片基部、扇形张角、缺口深度（改这三组即可换标本） ── */
  var BASE = {x: 1178, y: 620};
  var SPREAD = {from: 212, to: 332, count: 9};
  var RIM = {edge: 356, notch: 60, sigma: 26};

  function rimR(deg) {
    var d = deg - 270;
    return RIM.edge - RIM.notch * Math.exp(-(d * d) / (RIM.sigma * RIM.sigma));
  }
  function pt(r, deg) {
    var a = deg * Math.PI / 180;
    return [BASE.x + r * Math.cos(a), BASE.y + r * Math.sin(a)];
  }
  /* 二次贝塞尔：两端点 + 垂直方向弯度，避免直线感 */
  function seg(p0, p1, bow) {
    var mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    return 'M' + f(p0[0]) + ' ' + f(p0[1]) + ' Q' + f(mx - dy / len * bow) + ' ' +
      f(my + dx / len * bow) + ' ' + f(p1[0]) + ' ' + f(p1[1]);
  }

  /* ── 脉序：每支主脉两级二叉分叉（1 + 2 + 4 = 7 段）───────────── */
  var veins = document.getElementById('veins');
  var FORK = null;
  var drawn = [];
  function addPath(d, cls, w, op) {
    var p = ns('path');
    p.setAttribute('d', d);
    p.setAttribute('class', cls);
    p.setAttribute('pathLength', '1');
    p.setAttribute('stroke-dasharray', '1 1');
    p.setAttribute('stroke-dashoffset', '1');
    p.setAttribute('stroke-width', w);
    p.setAttribute('stroke-opacity', op);
    veins.appendChild(p);
    drawn.push(p);
    return p;
  }
  for (var i = 0; i < SPREAD.count; i++) {
    var th = SPREAD.from + i * ((SPREAD.to - SPREAD.from) / (SPREAD.count - 1));
    var jit = (rand() - 0.5) * 1.6;
    var r1 = 150 + rand() * 12;
    var p1 = pt(r1, th + jit);
    addPath(seg(pt(46, th), p1, (i - 4) * 1.6), 'v-main', 1.2, .92);
    if (i === 7) FORK = p1;
    var f1 = [th - 5.2, th + 5.2];
    for (var k = 0; k < 2; k++) {
      var r2v = Math.min(r1 + 76, rimR(f1[k]) - 58);
      var p2 = pt(r2v, f1[k] + jit * 0.3);
      addPath(seg(p1, p2, (k ? 1 : -1) * 1.4), 'v-fork', .95, .82);
      for (var m = 0; m < 2; m++) {
        var ta = f1[k] + (m ? 4.4 : -4.4);
        var r3v = Math.min(r2v + 54, rimR(ta) - 24);
        var p3 = pt(r3v + rand() * 6, ta);
        addPath(seg(p2, p3, (m ? 1 : -1) * 1.1), 'v-tip', .72, .72);
      }
    }
  }
  /* 双线：内轮廓按基部等比内收 1.8%，与主线错开 1 帧绘出 */
  var inner = document.getElementById('leaf-a').cloneNode(true);
  inner.removeAttribute('id');
  inner.setAttribute('class', 'leaf-inner');
  inner.setAttribute('transform', 'translate(1178 620) scale(.982) translate(-1178 -620)');
  inner.setAttribute('stroke-width', '1.1');
  inner.setAttribute('stroke-opacity', '.5');
  document.getElementById('leaf-a').parentNode.insertBefore(inner, document.getElementById('leaf-a').nextSibling);

  /* ── 剖面插图：上表皮 / 栅栏 / 海绵 / 下表皮 + 气孔 ────────────── */
  var ticks = document.getElementById('inset-ticks');
  function tick(x1, y1, x2, y2, w, op) {
    var p = ns('path');
    p.setAttribute('d', 'M' + f(x1) + ' ' + f(y1) + 'L' + f(x2) + ' ' + f(y2));
    p.setAttribute('class', 'tick');
    p.setAttribute('pathLength', '1');
    p.setAttribute('stroke-dasharray', '1 1');
    p.setAttribute('stroke-dashoffset', '1');
    p.setAttribute('stroke-width', w || .8);
    p.setAttribute('stroke-opacity', op || .8);
    ticks.appendChild(p);
  }
  var x;
  for (x = 848; x <= 1066; x += 11) tick(x, 626, x, 648, .7, .62);      /* 上表皮细胞 */
  tick(841, 650, 1075, 650, 1, .85);                                      /* 分界 */
  for (x = 846; x <= 1068; x += 15) tick(x, 650, x, 707, .8, .8);         /* 栅栏组织 */
  tick(841, 708, 1075, 708, 1, .85);
  for (var s = 0; s < 3; s++) {                                           /* 海绵组织：波状透气腔 */
    var d = 'M846 ' + (716 + s * 10);
    for (x = 858; x <= 1068; x += 12) d += ' Q' + f(x - 6) + ' ' + f(716 + s * 10 + (rand() - .5) * 7) + ' ' + f(x) + ' ' + f(716 + s * 10 + (rand() - .5) * 3);
    var wg = ns('path');
    wg.setAttribute('d', d);
    wg.setAttribute('class', 'tick');
    wg.setAttribute('pathLength', '1');
    wg.setAttribute('stroke-dasharray', '1 1');
    wg.setAttribute('stroke-dashoffset', '1');
    wg.setAttribute('stroke-width', '.7');
    wg.setAttribute('stroke-opacity', '.55');
    ticks.appendChild(wg);
  }
  tick(841, 748, 1075, 748, 1, .85);
  for (x = 848; x <= 1066; x += 10) tick(x, 748, x, 761, .6, .55);       /* 下表皮 */
  tick(999, 761, 999, 749, .9, .9);
  tick(1027, 761, 1027, 749, .9, .9);
  var stoma = ns('path');
  stoma.setAttribute('d', 'M999 761 C997 749 1004 743 1013 743 C1022 743 1029 749 1027 761');
  stoma.setAttribute('class', 'tick');
  stoma.setAttribute('pathLength', '1');
  stoma.setAttribute('stroke-dasharray', '1 1');
  stoma.setAttribute('stroke-dashoffset', '1');
  stoma.setAttribute('stroke-width', '1');
  stoma.setAttribute('stroke-opacity', '.95');
  ticks.appendChild(stoma);

  /* ── 引线与朱批圈注：挂到真实分叉点上，保证标注对得上几何 ────── */
  if (FORK) {
    var ld = document.getElementById('ld-b');
    ld.setAttribute('d', 'M' + f(FORK[0]) + ' ' + f(FORK[1]) + ' L' + f(FORK[0] + 44) + ' ' + f(FORK[1] - 36));
    var nb = document.getElementById('num-b');
    nb.setAttribute('x', f(FORK[0] + 54));
    nb.setAttribute('y', f(FORK[1] - 40));
    var ring = '', steps = 44;
    for (var q = 0; q <= steps; q++) {
      var t = q / steps * Math.PI * 2;
      var wob = 1 + Math.sin(t * 3 + 0.6) * 0.05 + Math.cos(t * 5 + 1.1) * 0.035;
      var ex = Math.cos(t) * 50 * wob, ey = Math.sin(t) * 32 * wob;
      var a2 = -0.55;
      ring += (q ? ' L' : 'M') + f(FORK[0] + ex * Math.cos(a2) - ey * Math.sin(a2)) + ' ' +
        f(FORK[1] + ex * Math.sin(a2) + ey * Math.cos(a2));
    }
    document.getElementById('mark-circle').setAttribute('d', ring + ' Z');
  }

  /* ── 时间轴构造器：由 index.html 在字体就绪后调用并注册 ────────── */
  window.__buildShotTimeline = function () {
    var tl = gsap.timeline({paused: true});
    function from(sel, fromVars, toVars, at, dur, ease) {
      tl.fromTo(sel, fromVars, Object.assign({duration: dur, ease: ease || 'power3.out'}, toVars), at);
    }

    /* 建立 0.0–1.2：纸底 / 纤维 / 纸片叠层 / 双线图版框 / 竖规线 */
    from('.paper__base', {opacity: 0}, {opacity: 1}, 0.00, 0.55, 'power2.out');
    from('.paper__blotch', {opacity: 0}, {opacity: 1}, 0.10, 1.20, 'power1.out');
    from('.paper__edge', {opacity: 0}, {opacity: 1}, 0.16, 1.30, 'power1.out');
    from('#fiber-tex', {opacity: 0}, {opacity: .55}, 0.04, 0.80, 'power1.out');
    from('.sheet--a', {x: -34, opacity: 0}, {x: 0, opacity: 1}, 0.18, 0.90, 'power2.out');
    from('.sheet--b', {x: -58, opacity: 0}, {x: 0, opacity: 1}, 0.06, 1.00, 'power2.out');
    from('#plate-face', {opacity: 0}, {opacity: 1}, 0.20, 0.70, 'power2.out');
    from('#rule-outer', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 0.22, 0.78, 'power2.inOut');
    from('#rule-inner', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 0.40, 0.80, 'power2.inOut');
    from('#gutter', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 0.16, 0.95, 'power2.inOut');

    /* 左栏排版：页眉 → 大标题 → 引文 → 正文，逐级上浮 */
    from('.type__head', {y: 10, opacity: 0}, {y: 0, opacity: 1}, 0.42, 0.50);
    from('.type__rule', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1}, 0.52, 0.50);
    from('.type__title', {y: 26, opacity: 0}, {y: 0, opacity: 1}, 0.58, 0.80, 'power4.out');
    from('.type__quote', {y: 16, opacity: 0}, {y: 0, opacity: 1}, 0.78, 0.60);
    tl.fromTo('.type__body', {y: 14, opacity: 0}, {y: 0, opacity: 1, duration: 0.50, stagger: 0.09, ease: 'power3.out'}, 0.92);

    /* 前景纸片：从右下画外落定，随后极缓上浮 */
    from('#chip-move', {x: 44, y: 22, opacity: 0}, {x: 0, y: 0, opacity: 1}, 0.55, 1.10, 'power3.out');
    from('#tooth-tex', {opacity: 0}, {opacity: .30}, 0.30, 1.20, 'power1.out');

    /* 线刻 1.20–3.20：轮廓 → 叶柄 → 主脉 → 分叉 → 末梢 → 剖面 */
    from('#leaf-a', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 1.20, 1.05, 'power2.inOut');
    from('.leaf-inner', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 1.32, 1.05, 'power2.inOut');
    from('.stem', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 1.34, 0.55, 'power2.inOut');
    tl.fromTo('.v-main', {attr: {'stroke-dashoffset': 1}},
      {attr: {'stroke-dashoffset': 0}, duration: 0.55, stagger: {each: 0.055, from: 'center'}, ease: 'power2.inOut'}, 1.42);
    tl.fromTo('.v-fork', {attr: {'stroke-dashoffset': 1}},
      {attr: {'stroke-dashoffset': 0}, duration: 0.45, stagger: {each: 0.03, from: 'center'}, ease: 'power2.inOut'}, 1.96);
    tl.fromTo('.v-tip', {attr: {'stroke-dashoffset': 1}},
      {attr: {'stroke-dashoffset': 0}, duration: 0.40, stagger: {each: 0.02, from: 'center'}, ease: 'power2.inOut'}, 2.24);
    from('#inset', {opacity: 0}, {opacity: 1}, 2.05, 0.60, 'power2.out');
    tl.fromTo('.tick', {attr: {'stroke-dashoffset': 1}},
      {attr: {'stroke-dashoffset': 0}, duration: 0.30, stagger: {each: 0.008, from: 'start'}, ease: 'power1.out'}, 2.10);
    tl.fromTo('.numeral', {opacity: 0, y: 5}, {opacity: 1, y: 0, duration: 0.40, stagger: 0.10, ease: 'power3.out'}, 2.86);
    from('#ld-a', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 2.80, 0.40, 'power2.inOut');
    from('#ld-b', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 2.90, 0.40, 'power2.inOut');
    from('#ld-c', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 3.00, 0.40, 'power2.inOut');
    from('#scalebar', {opacity: 0}, {opacity: 1}, 2.68, 0.45, 'power2.out');

    /* 朱批 3.00–4.40：圈注分叉 + 标题下划线 + 图注编号 + 图例 */
    from('#mark-circle', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 3.00, 0.85, 'power2.inOut');
    from('#mark-underline', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}}, 3.45, 0.60, 'power2.inOut');
    from('.cap__num', {y: 8, opacity: 0}, {y: 0, opacity: 1}, 3.35, 0.45);
    from('.cap__text', {y: 8, opacity: 0}, {y: 0, opacity: 1}, 3.48, 0.50);
    tl.fromTo('.lg', {x: 14, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power3.out'}, 3.75);

    /* 悬停 4.40–5.50：纸片错位 8–14px，末梢与分叉略加重（读得出"二分"） */
    tl.to('.sheet--a', {x: 8, duration: 2.0, ease: 'power2.inOut'}, BEAT.draw + 0.10);
    tl.to('.sheet--b', {x: 13, duration: 2.0, ease: 'power2.inOut'}, BEAT.draw + 0.10);
    tl.to('.v-fork', {strokeWidth: 1.18, duration: 1.0, ease: 'sine.inOut'}, 4.30);
    tl.to('.v-tip', {strokeOpacity: .92, duration: 1.0, ease: 'sine.inOut'}, 4.30);
    tl.to('#num-b', {scale: 1.12, duration: 0.55, yoyo: true, repeat: 1, ease: 'sine.inOut'}, 4.40);

    /* 落定 5.50–7.60：结论标签 / 页脚 / 朱印锁定 + 整体 1.5% 缓推 */
    from('.type__res-rule', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1}, BEAT.resolve, 0.50);
    from('.type__res-bar', {scaleY: 0, opacity: 0}, {scaleY: 1, opacity: 1}, 5.58, 0.45);
    from('.type__res', {y: 16, opacity: 0}, {y: 0, opacity: 1}, 5.62, 0.65);
    from('.type__res-en', {y: 10, opacity: 0}, {y: 0, opacity: 1}, 5.80, 0.60);
    from('.type__foot', {y: 8, opacity: 0}, {y: 0, opacity: 1}, 6.10, 0.50);
    from('#stamp', {opacity: 0, scale: .78}, {opacity: 1, scale: 1}, 6.30, 0.55, 'power2.out');
    from('#plate-body', {scale: 1, x: 0}, {scale: 1.015, x: -6, transformOrigin: '1172px 470px'}, 5.40, 2.40, 'power2.inOut');
    from('#sheets', {x: 0}, {x: -4}, 5.40, 2.40, 'power2.inOut');
    from('#type', {x: 0}, {x: -5}, 5.40, 2.40, 'power2.inOut');

    /* 环境：纤维浮尘极轻漂移（sine.inOut，≤20px） */
    tl.fromTo('.fib', {x: 0, y: 0}, {x: 7, y: -11, duration: 6.40, stagger: 0.42, ease: 'sine.inOut'}, 0.60);
    tl.to('#chip-move', {y: -9, duration: 3.00, ease: 'sine.inOut'}, 2.30);

    return tl;
  };
})();