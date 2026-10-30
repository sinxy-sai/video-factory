/* shot-starter-neon · 美术系统 D（霓虹东京 / 科技）时间轴构造器
 * 契约：index.html 在 document.fonts.ready 后调用 window.__buildShotTimeline()，
 * 并把返回的 paused timeline 注册到 window.__timelines["shot-starter-neon"]。
 * 所有状态只由时间驱动，禁止 Date.now / Math.random / 交互 / 未播种随机。
 * 改镜头时：改 VPX/VPY 换走廊灭点，改 CX/CY/R 换数据核心，改 BEAT 换节奏。
 */
(function () {
  'use strict';

  var W = 1920, H = 1080;
  var BEAT = {boot: 0.0, build: 0.35, type: 0.55, term: 1.05, cut: 3.02, heat: 3.34, sweep: 4.30, lock: 5.55, end: 8.0};
  /* 原型 11「透视网格走廊」的灭点与主体圆心 */
  var VPX = 930, VPY = 520;
  var CX = 930, CY = 620;

  /* 确定性 PRNG：mulberry32，仅用于热区矩阵 / 窗灯 / 浮尘分布 */
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

  function ns(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }
  function put(tag, attrs, parent) {
    var node = ns(tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  /* ── 透视网格走廊：地板 + 天花，灭点 (930, 520) ────────────────── */
  var DEPTH_LINES = 13;
  var floorG = document.getElementById('grid-floor');
  var ceilG = document.getElementById('grid-ceil');
  for (var d = 1; d <= DEPTH_LINES; d++) {
    var t = Math.pow(d / DEPTH_LINES, 1.65);
    put('line', {x1: 0, y1: (VPY + (H - VPY) * t).toFixed(1), x2: W, y2: (VPY + (H - VPY) * t).toFixed(1),
      'stroke-opacity': (0.1 + 0.2 * t).toFixed(2)}, floorG);
    if (d % 2 === 0) {
      put('line', {x1: 0, y1: (VPY - VPY * t).toFixed(1), x2: W, y2: (VPY - VPY * t).toFixed(1),
        'stroke-opacity': (0.06 + 0.1 * t).toFixed(2)}, ceilG);
    }
  }
  for (var bx = -1560; bx <= 3480; bx += 240) {
    put('line', {x1: bx, y1: H, x2: VPX, y2: VPY, 'stroke-opacity': .13}, floorG);
    put('line', {x1: bx, y1: 0, x2: VPX, y2: VPY, 'stroke-opacity': .07}, ceilG);
  }

  /* ── 线框城市：近排实心楼体 + 远排仅描边 + 窗灯 ────────────────── */
  var TOWERS = [
    [1148, 92, 54], [1208, 148, 54], [1268, 108, 54], [1328, 188, 54], [1388, 122, 54],
    [1448, 206, 54], [1508, 134, 54], [1568, 170, 54], [1628, 104, 54], [1688, 192, 54],
    [1748, 128, 54], [1808, 218, 54], [1868, 112, 52]
  ];
  var nearG = document.getElementById('skyline');
  var farG = document.getElementById('skyline-far');
  var winG = document.getElementById('windows');
  TOWERS.forEach(function (tw, i) {
    put('rect', {x: tw[0], y: 520 - tw[1], width: tw[2], height: tw[1]}, nearG);
    put('rect', {x: tw[0] + 26, y: 520 - tw[1] * 0.62, width: 30, height: (tw[1] * 0.62).toFixed(0), 'stroke-opacity': .16}, farG);
    var rows = Math.max(2, Math.round(tw[1] / 26));
    for (var r = 0; r < rows; r++) {
      if (rand() < 0.42) continue;
      var wx = tw[0] + 8 + (rand() < 0.5 ? 0 : 26);
      var wy = 520 - tw[1] + 12 + r * 22;
      if (wy > 506) continue;
      put('rect', {x: wx.toFixed(0), y: wy.toFixed(0), width: 4, height: 6,
        fill: rand() < 0.24 ? '#FFB020' : '#FF2E88',
        'fill-opacity': (0.3 + rand() * 0.45).toFixed(2),
        class: 'win', 'data-i': i}, winG);
    }
  });

  /* ── 数据核心刻度环：51 根径向刻度，每 5 根一主刻度 ───────────── */
  var tickG = document.getElementById('core-ticks');
  for (var a = -150, k = 0; a <= 150; a += 6, k++) {
    var rad = (a - 90) * Math.PI / 180;
    var major = k % 5 === 0;
    var r1 = 292, r2 = major ? 274 : 283;
    put('line', {
      x1: (CX + Math.cos(rad) * r1).toFixed(1), y1: (CY + Math.sin(rad) * r1).toFixed(1),
      x2: (CX + Math.cos(rad) * r2).toFixed(1), y2: (CY + Math.sin(rad) * r2).toFixed(1),
      'stroke-width': major ? 1.6 : 1, 'data-o': major ? 0.62 : 0.26, opacity: 0
    }, tickG);
  }

  /* ── 热区矩阵：6×4 格，值驱动颜色与两级亮度（dim / lit） ──────── */
  var COLS = 6, ROWS = 4, CELL = 30, GAP = 8;
  var mxG = document.getElementById('core-matrix');
  var x0 = CX - (COLS * CELL + (COLS - 1) * GAP) / 2;
  var y0 = CY - (ROWS * CELL + (ROWS - 1) * GAP) / 2;
  var hotIndex = 0, hotValue = -1, cellValues = [];
  for (var r2i = 0; r2i < ROWS; r2i++) {
    for (var c2i = 0; c2i < COLS; c2i++) {
      var v = rand();
      var idx = r2i * COLS + c2i;
      cellValues.push(v);
      if (v > hotValue) { hotValue = v; hotIndex = idx; }
      var fill = v > 0.86 ? '#FF2E88' : v > 0.66 ? '#B6FF3C' : v > 0.4 ? '#00E5FF' : '#7A5CFF';
      put('rect', {
        x: (x0 + c2i * (CELL + GAP)).toFixed(1), y: (y0 + r2i * (CELL + GAP)).toFixed(1),
        width: CELL, height: CELL, fill: fill, opacity: 0,
        'data-dim': (0.05 + v * 0.1).toFixed(2),
        'data-lit': (v > 0.4 ? 0.5 + v * 0.45 : 0.3 + v * 0.3).toFixed(2),
        class: 'mx'
      }, mxG);
    }
  }

  /* ── 顶部界面条刻度：每 24px 一格，每 96px 一主刻度 ───────────── */
  var scaleG = document.getElementById('scale-ticks');
  for (var sx = 156, si = 0; sx <= 1764; sx += 24, si++) {
    var big = si % 4 === 0;
    put('line', {x1: sx, y1: 96, x2: sx, y2: 96 + (big ? 9 : 4),
      stroke: big ? '#00E5FF' : '#A6B2CC', 'stroke-opacity': big ? .42 : .2}, scaleG);
  }

  /* ── 终端打字：把每行正文拆成单字 span，逐字硬显（steps） ─────── */
  Array.prototype.forEach.call(document.querySelectorAll('.t-txt'), function (line) {
    var text = (line.textContent || '').trim();
    line.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var ch = document.createElement('span');
      ch.textContent = text.charAt(i);
      ch.style.opacity = '0';
      line.appendChild(ch);
    }
  });

  /* ── 时间轴构造器：由 index.html 在字体就绪后调用并注册 ────────── */
  window.__buildShotTimeline = function () {
    var tl = gsap.timeline({paused: true});
    function from(sel, fromVars, toVars, at, dur, ease) {
      tl.fromTo(sel, fromVars, Object.assign({duration: dur, ease: ease || 'power3.out'}, toVars), at);
    }
    function num(attr) {
      return function (i, el) { return parseFloat(el.getAttribute(attr)); };
    }

    /* ══ 建立 0.00–1.45：大气 → 网格推进 → 城市 → 核心 → 排版 ══ */
    from('.sky__base', {opacity: 0}, {opacity: 1}, 0.00, 0.55, 'power2.out');
    from('.sky__glow-c', {opacity: 0, scale: 1.08}, {opacity: 1, scale: 1}, 0.10, 1.50, 'power2.out');
    from('.sky__glow-m', {opacity: 0}, {opacity: 1}, 0.30, 1.60, 'power2.out');
    from('.sky__glow-v', {opacity: 0}, {opacity: 1}, 0.36, 1.70, 'power2.out');
    from('.sky__scrim-l', {opacity: 0}, {opacity: 1}, 0.20, 1.00, 'power1.out');
    from('.sky__scrim-r', {opacity: 0}, {opacity: 1}, 0.28, 1.00, 'power1.out');
    from('.sky__scrim-b', {opacity: 0}, {opacity: 1}, 0.50, 1.20, 'power1.out');

    /* 透视网格向观众推进：0.2–7.4，匀速，尾部自然停 */
    from('#field-rig', {opacity: 0}, {opacity: 1}, 0.12, 0.90, 'power2.out');
    tl.fromTo('#field-rig', {scale: 1}, {scale: 1.30, duration: 7.20, ease: 'none', svgOrigin: VPX + ' ' + VPY}, 0.20);
    from('#horizon-haze', {opacity: 0}, {opacity: 1}, 0.25, 1.20, 'power1.out');
    from('#horizon', {opacity: 0}, {opacity: 1}, 0.30, 1.00, 'power1.out');
    from('#skyline', {opacity: 0, y: 18}, {opacity: 1, y: 0}, 0.35, 1.10, 'power2.out');
    from('#skyline-far', {opacity: 0, y: 10}, {opacity: 1, y: 0}, 0.45, 1.20, 'power2.out');
    tl.fromTo('.win', {opacity: 0}, {opacity: 1, duration: 0.3, stagger: 0.004, ease: 'steps(1)'}, 0.70);

    /* 数据核心：辉光 → 盘面 → 环 → 刻度 → 矩阵 → 准星 */
    from('#core-glow', {opacity: 0, scale: 0.8}, {opacity: 1, scale: 1}, 0.28, 1.40, 'power2.out');
    from('#core-rig', {opacity: 0}, {opacity: 1}, 0.30, 0.90, 'power2.out');
    from('#core-disc', {opacity: 0}, {opacity: 1}, 0.36, 1.00, 'power2.out');
    tl.fromTo('#ring-main', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}, duration: 1.00, ease: 'power2.inOut'}, 0.45);
    from('#ring-dash', {opacity: 0}, {opacity: 1}, 0.55, 0.80, 'power1.out');
    from('#ring-ghost-a', {opacity: 0}, {opacity: 1}, 0.60, 0.80, 'power1.out');
    from('#ring-ghost-b', {opacity: 0}, {opacity: 1}, 0.60, 0.80, 'power1.out');
    from('#ring-vio', {opacity: 0}, {opacity: 1}, 0.66, 0.80, 'power1.out');
    from('#ring-prog', {opacity: 0}, {opacity: 0.78}, 0.72, 0.80, 'power1.out');
    tl.fromTo('#core-ticks > *', {opacity: 0}, {opacity: num('data-o'), duration: 0.26, stagger: {each: 0.008, from: 'start'}, ease: 'power1.out'}, 0.55);
    tl.fromTo('#core-reticle path', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}, duration: 0.45, stagger: 0.05, ease: 'power2.inOut'}, 0.70);
    from('#core-tick-l', {opacity: 0}, {opacity: 1}, 1.00, 0.60, 'power1.out');
    from('#core-tick-r', {opacity: 0}, {opacity: 1}, 1.00, 0.60, 'power1.out');
    from('#core-tick-t', {opacity: 0}, {opacity: 1}, 1.06, 0.60, 'power1.out');
    from('#core-tick-b', {opacity: 0}, {opacity: 1}, 1.06, 0.60, 'power1.out');
    tl.fromTo('#core-matrix rect', {opacity: 0, scale: 0.5}, {opacity: num('data-dim'), scale: 1, duration: 0.30, stagger: 0.018, ease: 'power2.out'}, 0.95);
    from('.cl-a', {opacity: 0}, {opacity: 1}, 0.80, 0.50, 'power1.out');

    /* 左栏排版：eyebrow → 标题 → 分隔 → hero → 单位 → 终端 → 注释 */
    from('.t-eyebrow', {y: 14, opacity: 0}, {y: 0, opacity: 1}, 0.55, 0.50, 'power3.out');
    from('.t-title', {y: 22, opacity: 0, scale: 0.985}, {y: 0, opacity: 1, scale: 1}, 0.62, 0.70, 'power4.out');
    from('.t-rule', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1}, 0.72, 0.50, 'power3.out');
    from('.t-hero', {y: 34, opacity: 0}, {y: 0, opacity: 1}, 0.78, 0.85, 'power4.out');
    from('.t-unit', {y: 16, opacity: 0}, {y: 0, opacity: 1}, 1.02, 0.60, 'power3.out');
    from('.t-unit-en', {x: -10, opacity: 0}, {x: 0, opacity: 0.72}, 1.14, 0.60, 'power3.out');
    from('.t-note', {y: 12, opacity: 0}, {y: 0, opacity: 1}, 2.20, 0.55, 'power3.out');

    /* 右栏 HUD：表头 → 横规 → 刻度梯 → 四行参数 → 状态 */
    from('.h-head', {y: -10, opacity: 0}, {y: 0, opacity: 1}, 0.85, 0.50, 'power3.out');
    from('.h-rule', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1, transformOrigin: 'right center'}, 0.90, 0.60, 'power3.inOut');
    from('.h-ladder', {scaleY: 0, opacity: 0}, {scaleY: 1, opacity: 1, transformOrigin: 'top center'}, 1.00, 0.70, 'power2.out');
    tl.fromTo('.h-k', {x: 12, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out'}, 1.05);
    tl.fromTo('.h-v', {x: 12, opacity: 0}, {x: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out'}, 1.10);
    from('.h-status', {opacity: 0}, {opacity: 1}, 1.45, 0.50, 'power1.out');
    tl.fromTo('.h-fill', {scaleX: 0}, {scaleX: num('data-w'), duration: 0.80, stagger: 0.12, ease: 'power2.out', transformOrigin: 'right center'}, 1.30);

    /* 顶部界面条 */
    from('#scale-line', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1, transformOrigin: 'left center'}, 0.18, 0.90, 'power3.inOut');
    from('#scale-live', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1, transformOrigin: 'left center'}, 0.30, 0.50, 'power3.out');
    tl.fromTo('#scale-ticks > *', {scaleY: 0, opacity: 0}, {scaleY: 1, opacity: 1, duration: 0.35, stagger: {each: 0.008, from: 'start'}, ease: 'power2.out'}, 0.35);

    /* HUD 边角括号：逐角画出 */
    tl.fromTo('#frame-marks path', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0}, duration: 0.40, stagger: 0.06, ease: 'power2.inOut'}, 0.30);

    /* ══ 终端逐行打字：每行 12–14 字 × 0.026s ≈ 8 帧 ══ */
    ['.t-line--1', '.t-line--2', '.t-line--3'].forEach(function (sel, i) {
      var chars = document.querySelectorAll(sel + ' .t-txt span');
      tl.fromTo(chars, {opacity: 0}, {opacity: 1, duration: 0.012, stagger: 0.026, ease: 'none'}, BEAT.term + i * 0.50);
    });

    /* ══ 过程 0.25–1.25 / 4.30–5.35：扫描光带两次经过主体 ══ */
    from('.sweep__beam', {x: 180, opacity: 0}, {x: 180, opacity: 0.9}, 0.25, 0.20, 'power1.out');
    tl.to('.sweep__beam', {x: 1560, duration: 0.60, ease: 'power2.inOut'}, 0.45);
    tl.to('.sweep__beam', {opacity: 0, duration: 0.25, ease: 'power1.in'}, 1.05);
    tl.set('.sweep__beam', {x: 190}, 4.28);
    tl.to('.sweep__beam', {opacity: 0.85, duration: 0.15, ease: 'power1.out'}, 4.30);
    tl.to('.sweep__beam', {x: 1520, duration: 0.95, ease: 'power2.inOut'}, 4.45);
    tl.to('.sweep__beam', {opacity: 0, duration: 0.30, ease: 'power1.in'}, 5.35);

    /* ══ 3.00–3.14 glitch 硬切（4 帧）+ 主体 whip pan 900px / 0.25s ══ */
    tl.to('#glitch', {opacity: 0.40, duration: 0.033, ease: 'steps(1)'}, 3.00);
    tl.to('#glitch', {opacity: 0, duration: 0.033, ease: 'steps(1)'}, 3.033);
    tl.to('#glitch', {opacity: 0.32, duration: 0.033, ease: 'steps(1)'}, 3.066);
    tl.to('#glitch', {opacity: 0, duration: 0.050, ease: 'steps(1)'}, 3.10);
    tl.fromTo('#glitch', {x: 0}, {x: -18, duration: 0.13, ease: 'none'}, 3.00);
    tl.to('#field-rig', {x: -12, duration: 0.033, ease: 'steps(1)'}, 3.03);
    tl.to('#field-rig', {x: 0, duration: 0.033, ease: 'steps(1)'}, 3.10);
    tl.to('#core-rig', {x: -900, duration: 0.100, ease: 'power2.in'}, 3.02);
    tl.to('#cl-rig', {x: -900, duration: 0.100, ease: 'power2.in'}, 3.02);
    tl.set('#core-rig', {opacity: 0}, 3.120);
    tl.set('#core-rig', {x: 900}, 3.120);
    tl.set('#core-rig', {opacity: 1}, 3.135);
    tl.to('#core-rig', {x: 0, duration: 0.140, ease: 'power3.out'}, 3.135);
    tl.set('#cl-rig', {opacity: 0}, 3.120);
    tl.set('#cl-rig', {x: 900}, 3.120);
    tl.set('#cl-rig', {opacity: 1}, 3.135);
    tl.to('#cl-rig', {x: 0, duration: 0.140, ease: 'power3.out'}, 3.135);

    /* ══ 第二个状态：矩阵点亮 / 状态字样切换 / 索引弧扫入 / 第四行打字 ══ */
    tl.set('#core-matrix rect', {opacity: 0, scale: 0.42}, 3.130);
    tl.set('.cl-a', {opacity: 0}, 3.500);
    from('.cl-b', {opacity: 0}, {opacity: 1}, 3.520, 0.25, 'power1.out');
    tl.to('#core-matrix rect', {opacity: num('data-lit'), scale: 1, duration: 0.26,
      stagger: {each: 0.028, from: 'start'}, ease: 'power2.out'}, BEAT.heat);
    tl.fromTo('#ring-idx', {attr: {'stroke-dashoffset': 1}, opacity: 0},
      {attr: {'stroke-dashoffset': 0}, opacity: 1, duration: 0.70, ease: 'power2.out'}, 3.45);
    (function () {
      var chars = document.querySelectorAll('.t-line--4 .t-txt span');
      tl.fromTo(chars, {opacity: 0}, {opacity: 1, duration: 0.012, stagger: 0.026, ease: 'none'}, 3.55);
    })();

    /* ══ 环境微动：辉光呼吸 / 浮尘漂移 / 索引弧回摆 ══ */
    tl.to('#core-glow', {opacity: 0.74, duration: 1.90, yoyo: true, repeat: 1, ease: 'sine.inOut'}, 2.20);
    from('.mote--a', {y: 0}, {y: 26}, 0.60, 7.20, 'sine.inOut');
    from('.mote--b', {y: 0}, {y: -24}, 0.80, 7.00, 'sine.inOut');
    from('.mote--c', {y: 0}, {y: 16}, 0.40, 7.40, 'sine.inOut');
    from('.mote--d', {y: 0}, {y: -14}, 0.90, 6.80, 'sine.inOut');
    from('.bokeh--a', {y: 0, x: 0}, {y: -30, x: 18}, 0.50, 7.30, 'sine.inOut');
    from('.bokeh--b', {y: 0, x: 0}, {y: 24, x: -12}, 0.70, 7.00, 'sine.inOut');

    /* ══ 解决 5.55–7.60：青色环/进度收束 → 数据定格 → 品红下划线 ══ */
    tl.fromTo('#ring-prog', {attr: {'stroke-dashoffset': 1}}, {attr: {'stroke-dashoffset': 0.28}, duration: 1.50, ease: 'power2.inOut'}, 5.55);
    tl.to('#ring-vio', {attr: {r: 190}, duration: 1.20, ease: 'power2.inOut'}, 5.60);
    tl.to('#ring-idx', {attr: {r: 196}, duration: 1.20, ease: 'power2.inOut'}, 5.60);
    tl.to('#core-ticks', {scale: 0.965, duration: 1.20, ease: 'power2.inOut', svgOrigin: CX + ' ' + CY}, 5.60);
    tl.to('#core-reticle', {scale: 0.985, duration: 1.00, ease: 'power2.inOut', svgOrigin: CX + ' ' + CY}, 5.70);
    tl.to('.h-fill', {scaleX: num('data-w2'), duration: 1.10, ease: 'power2.inOut', transformOrigin: 'right center'}, 5.70);
    tl.to('.h-status', {color: '#B6FF3C', duration: 0.50, ease: 'power1.out'}, 6.30);
    tl.fromTo('.t-rule-live', {scaleX: 0, opacity: 0}, {scaleX: 1, opacity: 1, duration: 0.45, ease: 'power3.out', transformOrigin: 'left center'}, 5.92);
    tl.to('#core-glow', {opacity: 0.92, duration: 1.20, ease: 'sine.inOut'}, 6.40);
    /* 峰值热区格脉冲一次（有限循环，落回原位） */
    tl.to(mxG.children[hotIndex], {opacity: 1, scale: 1.16, duration: 0.34, yoyo: true, repeat: 1, ease: 'sine.inOut'}, 6.10);
    tl.to('#ring-main', {'stroke-width': 3.2, duration: 0.80, ease: 'power2.out'}, 5.60);

    return tl;
  };
})();