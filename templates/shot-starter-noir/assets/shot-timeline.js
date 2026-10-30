/* shot-starter-noir · 美术系统 B（月夜怪盗 / 黑色电影）时间轴构造器
 * 契约：index.html 在 document.fonts.ready 后调用 window.__buildShotTimeline()，
 * 并把返回的 paused timeline 注册到 window.__timelines["shot-starter-noir"]。
 * 所有状态只由时间驱动；随机只用 seeded PRNG。
 */
(function () {
  'use strict';

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
  var rand = mulberry32(18881107);
  function ns(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }

  /* ── 雨：400px 高的雨带重复 3 份，整组下移 400px 后无缝衔接 ── */
  var rain = document.getElementById('rain-system');
  for (var i = 0; i < 38; i++) {
    var x = rand() * 1920;
    var y = rand() * 400;
    var len = 18 + rand() * 30;
    var op = 0.10 + rand() * 0.18;
    for (var k = 0; k < 3; k++) {
      var l = ns('line');
      l.setAttribute('x1', x.toFixed(1)); l.setAttribute('y1', (y + k * 400).toFixed(1));
      l.setAttribute('x2', (x - 7).toFixed(1)); l.setAttribute('y2', (y + k * 400 + len).toFixed(1));
      l.setAttribute('opacity', op.toFixed(2));
      rain.appendChild(l);
    }
  }

  /* ── 窗灯：剪影上的暖点，入场 stagger ───────────────────────── */
  var windows = document.getElementById('windows');
  [[104, 906], [214, 920], [300, 938], [452, 930], [560, 948], [676, 956],
   [812, 964], [936, 970], [1064, 976], [1196, 982], [1330, 986], [1478, 994],
   [1606, 998], [1742, 1004]].forEach(function (p) {
    var r = ns('rect');
    r.setAttribute('x', p[0]); r.setAttribute('y', p[1]);
    r.setAttribute('width', 9); r.setAttribute('height', 13);
    r.setAttribute('opacity', '.85'); r.setAttribute('class', 'win');
    windows.appendChild(r);
  });

  /* ── 时间轴构造器 ────────────────────────────────────────────── */
  window.__buildShotTimeline = function () {
    var tl = gsap.timeline({paused: true});
    function from(sel, fromVars, toVars, at, dur, ease) {
      tl.fromTo(sel, fromVars, Object.assign({duration: dur, ease: ease || 'power3.out'}, toVars), at);
    }

    /* 0.00–1.90 建立：遮幅、月亮、光柱、城市剪影、窗灯 */
    from('.bar--top', {scaleY: 0}, {scaleY: 1, transformOrigin: '50% 0'}, 0.00, 0.55, 'power2.out');
    from('.bar--bottom', {scaleY: 0}, {scaleY: 1, transformOrigin: '50% 100%'}, 0.00, 0.55, 'power2.out');
    from('#moon-system', {y: 46, opacity: 0, scale: 0.97}, {y: 0, opacity: 1, scale: 1}, 0.10, 1.40, 'power2.out');
    from('#moon-halo', {opacity: 0, scale: 0.9}, {opacity: 1, scale: 1}, 0.20, 1.60, 'power2.out');
    from('#shaft-system', {opacity: 0, x: -160}, {opacity: 1, x: 0}, 0.30, 1.50, 'power2.out');
    from('#skyline-shape', {opacity: 0, y: 20}, {opacity: 1, y: 0}, 0.60, 1.20, 'power2.out');
    tl.fromTo('.win', {opacity: 0}, {opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power1.out'}, 0.80);

    /* 0.90–2.15 名片落下：加速下坠后回稳，影子同步跟进 */
    var cardX = 1120, cardY = 300, cardR = -12;
    from('#card-system', {x: cardX, y: 20, rotation: -26, opacity: 0},
      {x: cardX, y: cardY, rotation: cardR, opacity: 1}, 0.90, 1.10, 'power3.out');
    from('#card-shadow', {x: cardX + 4, y: 24, rotation: -26, opacity: 0},
      {x: cardX + 6, y: cardY + 4, rotation: cardR, opacity: 0.55}, 1.05, 1.10, 'power3.out');

    /* 1.20–2.25 巨型字与竖排字 */
    from('#glyph', {opacity: 0, y: 30}, {opacity: 0.92, y: 0}, 1.20, 1.00, 'power3.out');
    from('.type__vertical', {opacity: 0, y: 18}, {opacity: 1, y: 0}, 1.30, 0.80, 'power3.out');
    from('.type__vertical-en', {opacity: 0, y: 12}, {opacity: 1, y: 0}, 1.45, 0.80, 'power3.out');

    /* 1.40–2.00 左下遥测 */
    tl.fromTo('.meta__row', {opacity: 0, y: 12},
      {opacity: 1, y: 0, duration: 0.5, stagger: 0.10, ease: 'power3.out'}, 1.40);

    /* 0.00–8.00 雨：4 个 2s 循环、每循环下移 400px，与雨带周期一致 */
    tl.fromTo('#rain-system', {y: 0}, {y: 1600, duration: 2.00, repeat: 3, ease: 'none'}, 0.00);

    /* 2.20–7.80 环境：月亮漂移 / 光柱微转 / 卡片高光扫过 / 影子伸长 */
    tl.to('#moon-system', {y: -16, duration: 5.60, ease: 'sine.inOut'}, 2.20);
    tl.fromTo('#shaft-system', {rotation: 0}, {rotation: 2.4, duration: 5.60, ease: 'sine.inOut', transformOrigin: '1200px 480px'}, 2.20);
    tl.fromTo('#card-glint', {x: -420}, {x: 460, duration: 1.40, ease: 'power2.inOut'}, 2.60);
    tl.to('#card-shadow', {opacity: 0.76, scaleX: 1.05, scaleY: 1.08, duration: 2.40, ease: 'sine.inOut', transformOrigin: '50% 50%'}, 3.40);

    /* 5.60–8.00 解决：月光增强、光柱回稳、字形提亮、印章一次脉动 */
    tl.to('#moon-halo', {opacity: 1, duration: 1.20, ease: 'power2.out'}, 5.60);
    tl.to('#shaft-system', {opacity: 0.86, duration: 1.10, ease: 'sine.inOut'}, 5.70);
    tl.to('#glyph', {color: '#FFFFFF', duration: 0.80, ease: 'power2.out'}, 5.80);
    tl.fromTo('#card-seal', {scale: 1}, {scale: 1.18, duration: 0.50, yoyo: true, repeat: 1, ease: 'sine.inOut'}, 6.00);

    return tl;
  };
})();