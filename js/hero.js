// Hero: a pile of role tiles that falls into place, can be dragged and thrown
// (mouse/pen), flicked (touch, without blocking page scroll), and links each tile
// to its path card. Physics by Matter.js; drawing is our own so tiles match the type system.
// Loop sleeps when the pile settles or the hero leaves the viewport.

const canvas = document.getElementById('hero-canvas');
const MATTER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js';

const C = { blue: '#1A73E8', red: '#EA4335', yellow: '#FBBC04', green: '#34A853' };
// [label, colour, path anchor]. colour 'ink' = text colour fill, 'line' = outlined.
const TILES = [
  ['Game Dev', 'red', 'role-game'], ['Web', 'blue', 'role-web'], ['AI/ML', 'yellow', 'role-ai'],
  ['UI/UX', 'line', 'role-design'], ['Flutter', 'green', 'role-mobile'], ['Cloud', 'ink', 'role-cloud'],
  ['Unity', 'line', 'role-game'], ['Figma', 'red', 'role-design'], ['Data', 'green', 'role-data'],
  ['Security', 'ink', 'role-security'], ['Android', 'green', 'role-mobile'], ['Gemini', 'blue', 'role-ai'],
  ['</>', 'yellow', 'role-web'], ['Godot', 'blue', 'role-game'], ['Python', 'line', 'role-data'],
  ['Firebase', 'yellow', 'role-cloud'], ['Kotlin', 'line', 'role-mobile'], ['React', 'ink', 'role-web'],
  ['Blender', 'line', 'role-game'], ['SQL', 'red', 'role-data'], ['TensorFlow', 'line', 'role-ai'],
  ['Linux', 'line', 'role-security'], ['Pixel art', 'yellow', 'role-game'], ['Git', 'red', 'role-web'],
];
const SHAPES = [['circle', 'blue'], ['triangle', 'green'], ['square', 'red'], ['circle', 'yellow'], ['triangle', 'red'], ['square', 'blue']];

// Skip the physics (and its ~80KB library) on data-saver or very slow connections.
const conn = navigator.connection || {};
const lowData = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');

if (canvas && !lowData) {
  const load = () => {
    const s = document.createElement('script');
    s.src = MATTER_SRC;
    s.onload = () => document.fonts.ready.then(start);
    document.head.appendChild(s);
  };
  // Let the page finish its own work first
  'requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 1500 }) : setTimeout(load, 300);
}

function start() {
  const { Engine, Bodies, Body, Composite, Query, Constraint, Sleeping } = window.Matter;
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;

  let W = 0, H = 0, dpr = 1, unit = 56, walls = [], tiles = [];
  let running = false, visible = true, last = 0, calm = 0;
  let theme = readTheme();

  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const v = n => `hsl(${cs.getPropertyValue(n).trim()})`;
    return { ink: v('--text-primary'), paper: v('--bg-tertiary'), line: v('--border-color'), bg: v('--bg-primary') };
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    unit = W < 640 ? 42 : W < 1024 ? 50 : 60;
  }

  function buildWalls() {
    Composite.remove(engine.world, walls);
    const t = 400;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);
  }

  function makeTile(def, x, y) {
    const [label, color, role] = def;
    ctx.font = `600 ${Math.round(unit * 0.4)}px Geist, system-ui, sans-serif`;
    const w = Math.ceil(ctx.measureText(label).width + unit * 0.9);
    const b = Bodies.rectangle(x, y, w, unit, {
      chamfer: { radius: unit / 2 - 1 }, restitution: 0.25, friction: 0.6, frictionStatic: 1, frictionAir: 0.015, density: 0.002,
      angle: (Math.random() - 0.5) * 0.8,
    });
    b.tile = { kind: 'chip', label, color, role, w, h: unit };
    return b;
  }

  function makeShape([kind, color], x, y) {
    const r = unit * 0.62;
    const opts = { restitution: 0.35, friction: 0.6, frictionStatic: 1, frictionAir: 0.015, density: 0.002, angle: Math.random() * 6 };
    const b = kind === 'circle' ? Bodies.circle(x, y, r, opts)
      : kind === 'triangle' ? Bodies.polygon(x, y, 3, r * 1.15, { ...opts, chamfer: { radius: 8 } })
      : Bodies.rectangle(x, y, r * 1.7, r * 1.7, { ...opts, chamfer: { radius: 12 } });
    b.tile = { kind, color, r };
    return b;
  }

  function populate(dropIn) {
    Composite.remove(engine.world, tiles);
    tiles = [];
    // Roughly one tile per 34k px² of hero, capped so the pile stays a band at the bottom
    const n = Math.max(10, Math.min(TILES.length, Math.round((W * H) / 34000)));
    const defs = TILES.slice(0, n);
    const shapes = SHAPES.slice(0, W < 640 ? 3 : SHAPES.length);
    const all = [...defs.map(d => ['t', d]), ...shapes.map(s => ['s', s])].sort(() => Math.random() - 0.5);
    all.forEach(([type, def], i) => {
      const x = unit + Math.random() * (W - unit * 2);
      const y = dropIn ? -unit * 2 - i * unit * 0.9 : H - unit - (i % 6) * unit;
      const b = type === 't' ? makeTile(def, x, y) : makeShape(def, x, y);
      tiles.push(b);
    });
    Composite.add(engine.world, tiles);
  }

  // ── Drawing ───────────────────────────────────
  function fillFor(color) {
    if (color === 'ink') return [theme.ink, theme.bg];
    if (color === 'line') return [theme.paper, theme.ink];
    return [C[color], color === 'yellow' ? '#202124' : '#fff'];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const b of tiles) {
      const t = b.tile;
      const [fill, text] = fillFor(t.color);
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = fill;
      ctx.beginPath();
      if (t.kind === 'chip') ctx.roundRect(-t.w / 2, -t.h / 2, t.w, t.h, t.h / 2);
      else if (t.kind === 'circle') ctx.arc(0, 0, t.r, 0, Math.PI * 2);
      else if (t.kind === 'square') ctx.roundRect(-t.r * 0.85, -t.r * 0.85, t.r * 1.7, t.r * 1.7, 12);
      else { // triangle: match Matter's polygon vertices in local space
        b.vertices.forEach((v, i) => {
          const dx = v.x - b.position.x, dy = v.y - b.position.y;
          const lx = dx * Math.cos(-b.angle) - dy * Math.sin(-b.angle);
          const ly = dx * Math.sin(-b.angle) + dy * Math.cos(-b.angle);
          i ? ctx.lineTo(lx, ly) : ctx.moveTo(lx, ly);
        });
        ctx.closePath();
      }
      ctx.fill();
      if (t.color === 'line') { ctx.lineWidth = 1.5; ctx.strokeStyle = theme.ink; ctx.stroke(); }
      if (t.kind === 'chip') {
        ctx.fillStyle = text;
        ctx.font = `600 ${Math.round(t.h * 0.4)}px Geist, system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.label, 0, 1);
      }
      ctx.restore();
    }
  }

  // ── Loop ──────────────────────────────────────
  function frame(now) {
    if (!running) return;
    const dt = Math.min(now - last || 16.67, 33);
    last = now;
    Engine.update(engine, dt);
    draw();
    // Matter rarely puts stacked bodies to sleep, so also stop after ~1s of near-stillness
    const still = tiles.every(b => b.isSleeping || (b.speed < 0.08 && Math.abs(b.angularSpeed) < 0.004));
    calm = still && !drag ? calm + 1 : 0;
    if (calm > 60 || !visible) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function wake() {
    if (running || reduceMotion || !visible) return;
    running = true; last = 0; calm = 0;
    requestAnimationFrame(frame);
  }

  // ── Pointer ───────────────────────────────────
  let drag = null, down = null;
  const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const hit = p => Query.point(tiles, p)[0];

  canvas.addEventListener('pointerdown', e => {
    const p = pt(e), b = hit(p);
    down = { p, t: performance.now(), b };
    if (!b) return;
    Sleeping.set(b, false);
    if (e.pointerType === 'touch') {
      // Flick only. No preventDefault, so the page still scrolls.
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 12, y: -14 - Math.random() * 6 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4);
      wake();
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    const local = { x: p.x - b.position.x, y: p.y - b.position.y };
    const rot = { x: local.x * Math.cos(-b.angle) - local.y * Math.sin(-b.angle), y: local.x * Math.sin(-b.angle) + local.y * Math.cos(-b.angle) };
    drag = Constraint.create({ pointA: p, bodyB: b, pointB: rot, stiffness: 0.15, damping: 0.08, length: 0 });
    Composite.add(engine.world, drag);
    canvas.classList.add('grabbing');
    wake();
  });

  canvas.addEventListener('pointermove', e => {
    const p = pt(e);
    if (drag) { drag.pointA = p; return; }
    if (e.pointerType !== 'mouse') return;
    canvas.classList.toggle('grabbable', !!hit(p));
    // Tiles near a fast-moving cursor get nudged away
    const speed = Math.hypot(e.movementX, e.movementY);
    if (speed < 6) return;
    for (const b of tiles) {
      const dx = b.position.x - p.x, dy = b.position.y - p.y, d = Math.hypot(dx, dy);
      if (d < unit * 1.6 && d > 0) {
        Sleeping.set(b, false);
        Body.applyForce(b, b.position, { x: (dx / d) * 0.0009 * b.mass * speed, y: (dy / d) * 0.0009 * b.mass * speed - 0.0004 * b.mass * speed });
        wake();
      }
    }
  });

  function release(e) {
    if (drag) { Composite.remove(engine.world, drag); drag = null; canvas.classList.remove('grabbing'); }
    if (!down) return;
    const p = pt(e);
    const tap = Math.hypot(p.x - down.p.x, p.y - down.p.y) < 6 && performance.now() - down.t < 300;
    if (tap && down.b?.tile.role && e.pointerType !== 'touch') goToRole(down.b.tile.role);
    down = null;
    wake();
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function goToRole(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    el.animate([{ outline: '3px solid #1A73E8', outlineOffset: '6px' }, { outline: '3px solid transparent', outlineOffset: '12px' }], { duration: 1400, delay: 500, easing: 'ease-out' });
  }

  // ── Lifecycle ─────────────────────────────────
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }).observe(canvas);
  const retheme = () => { theme = readTheme(); draw(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);
  document.addEventListener('themechange', retheme);

  let lastW = 0, resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const oldW = lastW;
      size(); buildWalls();
      if (Math.abs(W - oldW) > 80) { lastW = W; populate(false); settle(); }
      tiles.forEach(b => Sleeping.set(b, false));
      reduceMotion ? draw() : wake();
    }, 150);
  }).observe(canvas);

  function settle() { for (let i = 0; i < 400; i++) Engine.update(engine, 16.67); }

  size(); lastW = W; buildWalls();
  if (reduceMotion) { populate(false); settle(); draw(); }
  else { populate(true); wake(); }
}
