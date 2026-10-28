// TEAM IRONIC — OVERVIEW ROBOT ARM
//
// Everything for the robot arm on the home page countdown card lives
// in this one file, so index.html and script.js stay clean. Only
// index.html loads it (one <script> tag at the bottom). Styles are in
// style.css section 25.
//
// This file has three parts:
//   1. ROBOT_ARM_SVG   the arm artwork (converted from "Robot Arm.ai").
//                      It gets dropped into #countdownCard on load.
//   2. ARM_SETTINGS    how often he does a move. The only part you'd
//                      normally edit.
//   3. The animation   rig math, the moves, and the main loop.
//
// How he works:
//   - The artwork is split into nested groups, one per joint:
//       .j1 shoulder (turns on the base)
//         .j2 elbow
//           .j3 wrist link
//             .ft / .fb  the two gripper fingers
//     Animating him is just rotating those groups. Because they're
//     nested, turning the shoulder carries everything above it along,
//     same as a real arm. Path classes: af = light teal fill,
//     ad = dark teal joint centers, al = outline. Don't rename any of
//     these, the code and CSS look for them.
//   - When the card first scrolls into view, the number box is empty.
//     He swings the day count over, drops it in, and bows.
//   - Then he mostly just "breathes" (tiny idle sway). Every
//     restMin to restMax seconds he does ONE random move from the
//     moves list, then goes back to resting.
//   - Hovering the card makes him wave (at most once every
//     waveCooldown seconds).
//   - Phones never see him (the whole card is hidden there), people
//     with "Reduce motion" turned on get the number right away and a
//     still arm, and he pauses while scrolled off screen.
//
// New artwork? Re-export the .ai and the SVG below gets regenerated;
// the group/class names have to stay the same.


// ----------------------------------------------------------
// 1. Artwork
// ----------------------------------------------------------
const ROBOT_ARM_SVG = `
<g class="arm-root">
<g class="j1"><g class="j2"><g class="j3">
<g class="fb"><path class="af" d="M 392.08 240.63 L 388.00 322.21 L 408.73 323.25 L 461.84 308.54 L 462.91 300.46 L 411.45 293.66 L 419.73 242.02 Z M 392.08 240.63 "/><path class="al" transform="matrix(1, 0, 0, -1, 392.09, 240.63)" d="M -0.00 0.00 L -4.08 -81.58 L 16.64 -82.61 L 69.75 -67.90 L 70.81 -59.82 L 19.36 -53.02 L 27.64 -1.38 L -0.00 0.00 "/></g><g class="ft"><path class="af" d="M 431.62 202.09 L 513.14 207.17 L 511.85 227.89 L 491.28 279.02 L 483.13 279.17 L 482.15 227.28 L 429.90 229.71 Z M 431.62 202.09 "/><path class="al" transform="matrix(1, 0, 0, -1, 431.62, 202.09)" d="M 0.00 0.00 L 81.52 -5.08 L 80.23 -25.79 L 59.66 -76.92 L 51.51 -77.07 L 50.52 -25.18 L -1.72 -27.62 L 0.00 0.00 "/></g><path class="af al" transform="matrix(1, 0, 0, -1, 267.70, 159.63)" d="M 0.00 -0.00 L 41.65 57.28 L 167.52 -44.65 L 135.76 -88.33 L 0.00 -0.00 L 41.65 57.28 "/><path class="af" d="M 431.08 260.26 C 410.73 269.67 386.59 260.80 377.18 240.44 C 367.76 220.08 376.64 195.95 397 186.53 C 417.35 177.12 441.49 186 450.90 206.35 C 460.32 226.71 451.44 250.85 431.08 260.26 "/><path class="al" transform="matrix(1, 0, 0, -1, 431.09, 260.26)" d="M -0.00 0.00 C -20.35 -9.41 -44.49 -0.54 -53.90 19.81 C -63.32 40.17 -54.44 64.30 -34.09 73.72 C -13.73 83.13 10.40 74.26 19.81 53.90 C 29.23 33.54 20.35 9.41 -0.00 0.00 Z M -0.00 0.00 "/>
</g><path class="af al" transform="matrix(1, 0, 0, -1, 206.00, 300.58)" d="M -0.00 0.00 L -68.75 63.79 L 50.37 175.82 L 102.80 127.18 L -0.00 0.00 L -68.75 63.79 "/><path class="af" d="M 318.95 187.82 C 290.87 200.80 257.58 188.57 244.59 160.48 C 231.61 132.40 243.85 99.11 271.93 86.13 C 300.01 73.14 333.30 85.38 346.28 113.46 C 359.27 141.54 347.03 174.83 318.95 187.82 "/><path class="al" transform="matrix(1, 0, 0, -1, 318.95, 187.82)" d="M -0.00 -0.00 C -28.08 -12.98 -61.37 -0.74 -74.35 27.33 C -87.34 55.41 -75.10 88.70 -47.02 101.68 C -18.93 114.67 14.35 102.43 27.33 74.35 C 40.31 46.27 28.08 12.98 -0.00 -0.00 Z M -0.00 -0.00 "/><path class="ad" d="M 309.97 168.39 C 327.32 160.37 334.89 139.80 326.86 122.44 C 318.84 105.09 298.26 97.53 280.91 105.55 C 263.55 113.57 255.99 134.15 264.01 151.50 C 272.04 168.85 292.61 176.42 309.97 168.39 "/><path class="al" transform="matrix(1, 0, 0, -1, 309.97, 168.40)" d="M -0.00 0.00 C 17.35 8.02 24.91 28.59 16.89 45.95 C 8.87 63.30 -11.70 70.86 -29.05 62.84 C -46.41 54.82 -53.97 34.24 -45.95 16.89 C -37.92 -0.45 -17.35 -8.02 -0.00 0.00 Z M -0.00 0.00 "/></g><path class="af al" transform="matrix(1, 0, 0, -1, 320.93, 435.13)" d="M -0.00 -0.00 L -95.82 -48.82 L -169.38 123.65 L -96.31 160.89 L -0.00 -0.00 L -95.82 -48.82 "/><path class="af" d="M 244.14 269.01 C 247.03 304.37 220.71 335.37 185.35 338.26 C 149.99 341.15 118.98 314.83 116.10 279.47 C 113.21 244.11 139.53 213.11 174.89 210.22 C 210.25 207.33 241.25 233.65 244.14 269.01 "/><path class="al" transform="matrix(1, 0, 0, -1, 244.14, 269.01)" d="M -0.00 -0.00 C 2.88 -35.35 -23.43 -66.36 -58.79 -69.25 C -94.14 -72.14 -125.15 -45.81 -128.04 -10.46 C -130.93 24.89 -104.60 55.90 -69.25 58.79 C -33.89 61.67 -2.88 35.35 -0.00 -0.00 Z M -0.00 -0.00 "/><path class="ad" d="M 219.68 271.01 C 217.90 249.16 198.73 232.89 176.88 234.67 C 155.03 236.46 138.76 255.62 140.55 277.47 C 142.33 299.32 161.50 315.59 183.35 313.80 C 205.20 312.02 221.47 292.86 219.68 271.01 "/><path class="al" transform="matrix(1, 0, 0, -1, 219.68, 271.01)" d="M 0.00 0.00 C -1.78 21.85 -20.94 38.11 -42.79 36.33 C -64.64 34.54 -80.91 15.38 -79.13 -6.46 C -77.34 -28.31 -58.18 -44.58 -36.33 -42.79 C -14.47 -41.01 1.78 -21.85 0.00 0.00 Z M 0.00 0.00 "/></g><path class="af" d="M 373.87 559.05 L 170.76 559.05 C 168.55 559.05 166.76 557.26 166.76 555.05 L 166.76 535.31 C 166.76 533.10 168.55 531.31 170.76 531.31 L 373.87 531.31 C 376.08 531.31 377.87 533.10 377.87 535.31 L 377.87 555.05 C 377.87 557.26 376.08 559.05 373.87 559.05 "/><path class="al" transform="matrix(1, 0, 0, -1, 373.87, 559.05)" d="M -0.00 -0.00 L -203.11 -0.00 C -205.32 -0.00 -207.11 1.79 -207.11 3.99 L -207.11 23.73 C -207.11 25.94 -205.32 27.73 -203.11 27.73 L -0.00 27.73 C 2.21 27.73 3.99 25.94 3.99 23.73 L 3.99 3.99 C 3.99 1.79 2.21 -0.00 -0.00 -0.00 Z M -0.00 -0.00 "/><path class="af al" transform="matrix(1, 0, 0, -1, 208.08, 531.31)" d="M -0.00 0.00 L -0.00 68.61 C 0.00 72.92 0.44 95.58 18.72 113.93 C 37.11 132.41 59.96 132.84 64.23 132.84 C 68.81 132.83 90.74 132.30 108.84 114.82 C 127.99 96.33 128.45 72.80 128.46 68.61 L 128.46 0.00 Z M -0.00 0.00 "/><path class="ad" d="M 312.01 467.08 C 312.01 445.16 294.24 427.38 272.32 427.38 C 250.39 427.38 232.62 445.16 232.62 467.08 C 232.62 489.00 250.39 506.78 272.32 506.78 C 294.24 506.78 312.01 489.00 312.01 467.08 "/><path class="al" transform="matrix(1, 0, 0, -1, 312.01, 467.08)" d="M 0.00 0.00 C 0.00 21.92 -17.77 39.69 -39.69 39.69 C -61.61 39.69 -79.39 21.92 -79.39 0.00 C -79.39 -21.92 -61.61 -39.69 -39.69 -39.69 C -17.77 -39.69 0.00 -21.92 0.00 0.00 Z M 0.00 0.00 "/>
</g>
`;


// ----------------------------------------------------------
// 2. Settings
// ----------------------------------------------------------
// To make moves more or less common, change the numbers below. To
// drop a move, delete its name from the moves list.
const ARM_SETTINGS = {
  restMin: 14,           // shortest rest between moves (seconds)
  restMax: 28,           // longest rest between moves (seconds)
  firstMove: 10,         // wait this long after the bow before the first move
  waveCooldown: 20,      // hover-wave at most once per this many seconds
  moves: ['dance', 'stretch', 'lookAround', 'inspect', 'nap', 'twirl', 'wave']
};


// ----------------------------------------------------------
// 3. Animation
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('countdownCard');
  const num = document.getElementById('cd-days');
  if (!card || !num) return; // not the overview page

  // turn the card into his workcell: floor, divider, tag, then the
  // arm artwork. "has-arm" switches on the wide cell layout in
  // style.css section 25.
  card.insertAdjacentHTML('beforeend',
    '<div class="arm-floor" aria-hidden="true"></div>' +
    '<div class="arm-divider" aria-hidden="true"></div>' +
    '<span class="arm-cell-tag" aria-hidden="true">Cell 01</span>' +
    '<svg class="home-arm" viewBox="100 60 430 510" aria-hidden="true" focusable="false">' + ROBOT_ARM_SVG + '</svg>');
  card.classList.add('has-arm');
  const svg = card.querySelector('.home-arm');

  if (getComputedStyle(card).display === 'none') return; // phones: whole card is hidden
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return; // number shows normally, arm stays in its drawn pose

  // --- rig math (numbers are pivot points measured from the .ai art) ---
  const PIV = { B:[272.5,467], E:[180,274.5], T:[295.5,137], W:[414,223.5] };
  const REST = [-115.66, -49.97, 36.13];   // each link's angle as drawn
  const L1 = 213.6, L2 = 179.6, L3 = 146.7;
  const TIP = [452, 272];                   // point between the fingers
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const parts = { j1: svg.querySelector('.j1'), j2: svg.querySelector('.j2'), j3: svg.querySelector('.j3'),
                  ft: svg.querySelector('.ft'), fb: svg.querySelector('.fb') };
  // a pose is { a: shoulder, b: elbow, c: wrist, g: gripper open } in degrees
  function setPose(p) {
    parts.j1.setAttribute('transform', `rotate(${p.a} ${PIV.B})`);
    parts.j2.setAttribute('transform', `rotate(${p.b} ${PIV.E})`);
    parts.j3.setAttribute('transform', `rotate(${p.c} ${PIV.T})`);
    parts.ft.setAttribute('transform', `rotate(${-p.g} ${PIV.W})`);
    parts.fb.setAttribute('transform', `rotate(${p.g} ${PIV.W})`);
  }
  const rotPt = ([x, y], d, [cx, cy]) => { const r = rad(d), c = Math.cos(r), s = Math.sin(r); return [cx + (x-cx)*c - (y-cy)*s, cy + (x-cx)*s + (y-cy)*c]; };
  const fk = (pt, p) => rotPt(rotPt(rotPt(pt, p.c, PIV.T), p.b, PIV.E), p.a, PIV.B);
  const mix = (p, q, t) => ({ a: lerp(p.a, q.a, t), b: lerp(p.b, q.b, t), c: lerp(p.c, q.c, t), g: lerp(p.g, q.g, t) });
  // moves are written in "absolute" angles: 0° = toward the number, -90° = straight up
  const fromAbs = ([A1, A2, A3], g = 8) => ({ a: A1 - REST[0], b: (A2 - REST[1]) - (A1 - REST[0]), c: (A3 - REST[2]) - (A2 - REST[1]), g });
  const toAbs = p => [REST[0] + p.a, REST[1] + p.a + p.b, REST[2] + p.a + p.b + p.c];
  // inverse kinematics: find a pose that puts the wrist on point X
  function ik(X, g = 0) {
    const [bx, by] = PIV.B, D = Math.hypot(X[0]-bx, X[1]-by) || 1;
    const qx = bx + (X[0]-bx) / D * Math.max(D - L3, 40), qy = by + (X[1]-by) / D * Math.max(D - L3, 40);
    const d = clamp(Math.hypot(qx-bx, qy-by), Math.abs(L1-L2) + 10, L1 + L2 - 4);
    const al = Math.acos(clamp((L1*L1 + d*d - L2*L2) / (2*L1*d), -1, 1));
    const a1 = clamp(Math.atan2(qy-by, qx-bx) - al, rad(-175), rad(-20));
    const ex = bx + L1*Math.cos(a1), ey = by + L1*Math.sin(a1);
    const a2 = Math.atan2(qy-ey, qx-ex);
    const wx = ex + L2*Math.cos(a2), wy = ey + L2*Math.sin(a2);
    return fromAbs([deg(a1), deg(a2), deg(Math.atan2(X[1]-wy, X[0]-wx))], g);
  }
  // keyframes: [[time 0..1, [A1,A2,A3], gripper], ...]
  function kf(frames, t) {
    let i = 0; while (i < frames.length - 2 && t > frames[i+1][0]) i++;
    const [t0, p0, g0] = frames[i], [t1, p1, g1] = frames[i+1], u = ease(clamp((t - t0) / ((t1 - t0) || 1), 0, 1));
    return fromAbs([lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), lerp(p0[2], p1[2], u)], lerp(g0, g1, u));
  }
  const toSvg = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return [r.x, r.y]; };
  const toScreen = ([x, y]) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(svg.getScreenCTM()); return [r.x, r.y]; };

  // --- state ---
  const HOME = { a:-6, b:-18, c:36, g:8 }, START = { a:12, b:-6, c:-20, g:6 }, H = toAbs(HOME);
  let cur = { ...HOME }, move = null, script = null, nextAt = Infinity, onScreen = false, lastWave = -99, lastMove = null;
  let flags = {}, beat = -1;
  setPose(cur);

  const tile = document.createElement('div');
  tile.className = 'arm-tile';
  tile.setAttribute('aria-hidden', 'true');
  card.appendChild(tile);
  num.classList.add('arm-waiting'); // box looks empty until he drops the number in

  const once = (key, cond) => (cond && !flags[key]) ? (flags[key] = true) : false;
  const every = (lt, period) => { const k = Math.floor(lt / period); if (k !== beat) { beat = k; return true; } return false; };
  function bounce(px) { svg.style.translate = `0 ${-px}px`; }
  function poke() { num.classList.remove('arm-boop'); void num.offsetWidth; num.classList.add('arm-boop'); }
  // little floating text/emoji next to his gripper
  function fx(text, kind) {
    const [x, y] = toScreen(fk(TIP, cur)), r = card.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'arm-fx ' + kind; el.textContent = text; el.setAttribute('aria-hidden', 'true');
    el.style.left = (x - r.left) + 'px'; el.style.top = (y - r.top - 10) + 'px';
    el.style.setProperty('--dx', rand(-24, 24) + 'px'); el.style.setProperty('--rot', rand(-20, 20) + 'deg');
    card.appendChild(el); setTimeout(() => el.remove(), 1700);
  }

  // --- the moves. dur = seconds, k = how snappy (0..1) ---
  const MOVES = {
    dance: { dur: 5.2, k: .3, pose(lt) {
      const w = lt * Math.PI * 2 * 1.8; bounce(Math.abs(Math.sin(w)) * 7);
      if (every(lt, .55)) fx(pick(['♪', '♫']), 'note');
      return fromAbs([H[0] + 7*Math.sin(w/2), H[1] + 20*Math.sin(w/2 + 1.2), H[2] + 38*Math.sin(w)], 8 + 22*Math.max(0, Math.sin(w))); },
      end() { bounce(0); } },
    stretch: { dur: 4.6, k: .16, pose(lt, t) {
      const p = kf([[0,H,8],[.22,[-92,-88,-90],40],[.42,[-92,-88,-90],40],[.6,[-126,-128,-150],30],[.78,[-62,-22,15],20],[1,H,8]], t);
      if (t > .22 && t < .42) { p.b += 1.6*Math.sin(lt*48); p.c += 2*Math.sin(lt*41); }
      if (once('mmm', t > .25)) fx('mmm…', 'talk');
      return p; } },
    wave: { dur: 3, k: .2, pose(lt, t) {
      const p = kf([[0,H,8],[.18,[-104,-78,-48],30],[.82,[-104,-78,-48],30],[1,H,8]], t);
      if (t > .18 && t < .82) p.c += 32*Math.sin(lt*13);
      if (once('hi', t > .2)) fx('hi!', 'talk');
      return p; } },
    lookAround: { dur: 4.4, k: .22, pose(lt, t) {
      if (once('dbl', t > .73)) fx('!', 'alert');
      return kf([[0,H,8],[.14,[H[0],H[1]-8,H[2]-80],8],[.34,[H[0],H[1]-8,H[2]-80],8],[.46,[H[0]+6,H[1]+6,H[2]+55],8],
                 [.62,[H[0]+6,H[1]+6,H[2]+55],8],[.67,[H[0],H[1],H[2]-40],8],[.73,[H[0]+6,H[1]+6,H[2]+60],24],[1,H,8]], t); } },
    inspect: { dur: 3.8, k: .14,
      start() { const b = num.getBoundingClientRect(); this.near = ik(toSvg(b.left + b.width/2, b.top - 20), 6); fx('?', 'alert'); },
      pose(lt, t) {
        const p = t < .2 ? mix(HOME, this.near, ease(t/.2)) : t > .8 ? mix(this.near, HOME, ease((t-.8)/.2)) : { ...this.near };
        if (t > .25 && t < .75) { p.g = 6 + 20*Math.abs(Math.sin(lt*9)); p.c += 6*Math.sin(lt*5); }
        if (once('boop', t > .5)) poke();
        return p; } },
    nap: { dur: 6.5, k: .2, pose(lt, t) {
      const p = kf([[0,H,8],[.32,[-104,-14,72],0],[.74,[-104,-14,72],0],[.78,[-92,-92,-96],38],[.88,[-92,-92,-96],38],[1,H,8]], t);
      if (t > .32 && t < .74) { p.a += 1.5*Math.sin(lt*2.2); p.b += 3*Math.sin(lt*2.2 + .4); if (every(lt, .9)) fx('z', 'z'); }
      if (t > .78 && t < .88) p.c += 10*Math.sin(lt*40);
      if (once('wake', t > .77)) fx('!', 'alert');
      return p; } },
    twirl: { dur: 2.4, k: 1, pose(lt, t) {
      const p = kf([[0,H,8],[.15,[H[0]+6,H[1]+4,H[2]-20],30],[.75,[H[0]+6,H[1]+4,H[2]-20],30],[1,H,8]], t);
      p.c += t < .15 ? 0 : t > .75 ? 360 : 360 * ease((t - .15) / .6);
      return p; },
      end() { cur.c -= 360; } },
    bow: { dur: 2.4, k: .16, start() { this.from = toAbs(cur); },
      pose(lt, t) { return kf([[0,this.from,8],[.35,[-64,-14,78],0],[.6,[-64,-14,78],0],[1,H,8]], t); } }
  };

  function play(name) {
    if (move && move.m.end) move.m.end();
    flags = {}; beat = -1;
    move = { m: MOVES[name], name, t0: performance.now() };
    if (move.m.start) move.m.start();
  }

  // --- pick and place: carry the number over and drop it in ---
  function deliver() {
    tile.textContent = num.textContent.trim() || '--';
    tile.style.opacity = 1;
    const b = num.getBoundingClientRect();
    const target = toSvg(b.left + b.width/2, b.top - tile.offsetHeight - 14);
    let aim = [...target], over = ik(aim, 6);
    for (let k = 0; k < 4; k++) { // nudge so the gripper tip, not the wrist, lands over the box
      const tp = fk(TIP, over); aim = [aim[0] + (target[0]-tp[0]) * .8, aim[1] + (target[1]-tp[1]) * .8]; over = ik(aim, 6);
    }
    const open = { ...over, g: 32 };
    script = { t0: performance.now(), i: 0, steps: [
      { from: START, to: START, ms: 450,  carry: true },
      { from: START, to: over,  ms: 1400, carry: true },
      { from: over,  to: open,  ms: 250,  carry: true },
      { from: open,  to: open,  ms: 420,  fall: true },
      { from: open,  to: HOME,  ms: 900 }
    ]};
  }
  function runScript(now) {
    const s = script.steps[script.i], t = Math.min(1, (now - script.t0) / s.ms);
    cur = mix(s.from, s.to, ease(t));
    const tip = toScreen(fk(TIP, cur)), r = card.getBoundingClientRect();
    const place = ([x, y]) => { tile.style.left = (x - r.left) + 'px'; tile.style.top = (y - r.top) + 'px'; };
    if (s.carry) place(tip);
    if (s.fall) {
      if (!script.from) script.from = tip;
      const b = num.getBoundingClientRect(), tt = t * t;
      place([lerp(script.from[0], b.left + b.width/2, tt), lerp(script.from[1], b.top, tt)]);
      if (t >= 1) { tile.style.opacity = 0; num.classList.remove('arm-waiting'); num.classList.add('arm-placed'); }
    }
    if (t >= 1) {
      script.i++; script.t0 = now;
      if (script.i >= script.steps.length) { script = null; play('bow'); nextAt = now/1000 + ARM_SETTINGS.firstMove; }
    }
  }

  // --- main loop ---
  function loop(now) {
    requestAnimationFrame(loop);
    if (!onScreen) return;
    const t = now / 1000;
    if (script) { runScript(now); setPose(cur); return; }
    let goal, k = .12;
    if (move) {
      const lt = (now - move.t0) / 1000, mt = Math.min(1, lt / move.m.dur);
      goal = move.m.pose(lt, mt); k = move.m.k;
      if (mt >= 1) { if (move.m.end) move.m.end(); move = null; nextAt = t + rand(ARM_SETTINGS.restMin, ARM_SETTINGS.restMax); }
    } else {
      // resting: slow breathing sway
      goal = fromAbs([H[0] + 2*Math.sin(t*1.6), H[1] + 3*Math.sin(t*1.6 + .8), H[2] + 7*Math.sin(t*1.1 + 2)], HOME.g);
      if (t > nextAt && num.classList.contains('arm-placed')) {
        const options = ARM_SETTINGS.moves.filter(n => n !== lastMove && MOVES[n]);
        if (options.length) { lastMove = pick(options); play(lastMove); }
      }
    }
    for (const key of ['a', 'b', 'c', 'g']) cur[key] += (goal[key] - cur[key]) * k;
    setPose(cur);
  }
  requestAnimationFrame(loop);

  // hover the card: he waves (with a cooldown)
  card.addEventListener('mouseenter', () => {
    const t = performance.now() / 1000;
    if (script || move || !num.classList.contains('arm-placed') || t - lastWave < ARM_SETTINGS.waveCooldown) return;
    lastWave = t; play('wave');
  });

  // start the delivery the first time the card is on screen, and
  // pause everything while it's scrolled away
  let delivered = false;
  new IntersectionObserver(entries => entries.forEach(e => {
    onScreen = e.isIntersecting;
    if (onScreen && !delivered && e.intersectionRatio >= .5) { delivered = true; deliver(); }
  }), { threshold: [0, .5] }).observe(card);
});
