/* =========================================================
   SIM LAB - examples3d5.js
   Machines: slider-crank engine, inverted pendulum cart, four-bar linkage
   NOTE: String.raw ke andar backtick ya dollar-brace mat likhna.
   ========================================================= */
(function () {
'use strict';

const HEAD = String.raw`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#0b1020;font-family:system-ui,sans-serif;color:#fff}
#ui{position:absolute;top:8px;left:8px;width:230px;max-height:80vh;overflow:auto;background:rgba(0,0,0,.6);padding:8px 10px;border-radius:8px;font-size:12px}
#ui label{display:block;margin-top:6px}
#ui input[type=range]{width:100%}
#ui button{margin-top:6px;margin-right:4px;padding:4px 8px}
#hud{position:absolute;bottom:8px;left:8px;font:12px/1.5 monospace;background:rgba(0,0,0,.6);padding:6px 10px;border-radius:6px;white-space:pre}
</style>
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}
</script>
</head>
<body>
`;

const COMMON = String.raw`import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = id => document.getElementById(id);
const V = id => +$(id).value;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const mat = (c, r = 0.5, m = 0.2) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

function addLights(size) {
  scene.add(new THREE.HemisphereLight(0xbcd7ff, 0x1a2233, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(15, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const c = sun.shadow.camera;
  c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.far = 200;
  scene.add(sun);
}

function addGround(size, col) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size * 2), mat(col || 0x1c2a3f, 0.9, 0));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  scene.add(g);
  const grid = new THREE.GridHelper(size * 2, size, 0x4a6fa5, 0x2b3d5c);
  grid.position.y = 0.01;
  scene.add(grid);
}

function bindSliders(ids) {
  ids.forEach(id => {
    const el = $(id), o = $('v' + id);
    const f = () => { if (o) o.textContent = el.value; };
    el.addEventListener('input', f);
    f();
  });
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
function place(mesh, a, b) {
  const d = b.clone().sub(a), len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, d.normalize());
  mesh.scale.set(1, len, 1);
}
`;

function page(ui, js) {
  return HEAD + ui + '\n<div id="hud"></div>\n<script type="module">\n' + COMMON + js +
         '\n</' + 'script>\n</body>\n</html>\n';
}

/* =========================================================
   1) SLIDER-CRANK ENGINE (single cylinder, 4-stroke)
   ========================================================= */
const engUI = String.raw`<div id="ui"><b>🔧 Slider-crank engine</b>
<label>Crank radius R: <span id="vR"></span> mm<input id="R" type="range" min="20" max="80" step="1" value="45"></label>
<label>Rod length L: <span id="vL"></span> mm<input id="L" type="range" min="80" max="250" step="5" value="140"></label>
<label>Bore: <span id="vbore"></span> mm<input id="bore" type="range" min="40" max="120" step="2" value="80"></label>
<label>Peak pressure: <span id="vpk"></span> bar<input id="pk" type="range" min="10" max="80" step="1" value="45"></label>
<label>Engine speed: <span id="vrpm"></span> rpm<input id="rpm" type="range" min="500" max="8000" step="100" value="3000"></label>
<label>Animation slow-motion: <span id="vslow"></span>x<input id="slow" type="range" min="0.01" max="0.5" step="0.01" value="0.05"></label>
<div style="margin-top:6px;opacity:.8">Gas color: blue = low, red = high pressure. Pressure curve illustrative hai.</div>
</div>`;

const engJS = String.raw`
scene.background = new THREE.Color(0x0e1424);
camera.position.set(5, 3.5, 9); controls.target.set(0, 2.2, 0);
addLights(15); addGround(20);
bindSliders(['R', 'L', 'bore', 'pk', 'rpm', 'slow']);

const S = 0.01;                                   // 1 mm = 0.01 unit
const eng = new THREE.Group(); eng.position.y = 1.8; scene.add(eng);

const flyG = new THREE.Group(); eng.add(flyG);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.25, 48), mat(0x64748b, 0.4, 0.8));
disc.rotation.x = Math.PI / 2; disc.castShadow = true; flyG.add(disc);
const mark = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.1), mat(0xfacc15, 0.4, 0.3));
mark.position.set(0, 0.75, 0.15); flyG.add(mark);

const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.1), mat(0xf97316, 0.4, 0.5));
crankArm.castShadow = true; eng.add(crankArm);
const rod = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1, 0.08), mat(0x22d3ee, 0.4, 0.6));
rod.castShadow = true; eng.add(rod);
const pinA = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), mat(0xffffff, 0.3, 0.8)); eng.add(pinA);
const pinB = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), mat(0xffffff, 0.3, 0.8)); eng.add(pinB);

const piston = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), mat(0x9ca3af, 0.3, 0.8));
piston.castShadow = true; eng.add(piston);
const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 40, 1, true),
  new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
eng.add(wall);
const head = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1, 40), mat(0x475569, 0.5, 0.6));
eng.add(head);
const gas = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55 }));
eng.add(gas);

function pres(deg, pk) {                         // 4-stroke, 0 = TDC firing (illustrative)
  if (deg < 180) return 1 + (pk - 1) * (0.15 + 0.85 * Math.exp(-deg / 45));
  if (deg < 360) return 1.1;
  if (deg < 540) return 0.9;
  const u = (deg - 540) / 180;
  return 1 + pk * 0.25 * u * u * u;
}
function stroke(deg) { return deg < 180 ? 'POWER' : deg < 360 ? 'EXHAUST' : deg < 540 ? 'INTAKE' : 'COMPRESSION'; }

let th = 0, avgT = 0;
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const R = V('R'), L = V('L'), bore = V('bore'), pk = V('pk'), rpm = V('rpm'), slow = V('slow');
  const w = rpm * 2 * Math.PI / 60;
  const dth = w * dt * slow;
  th += dth;

  const s = Math.sin(th), c = Math.cos(th);
  const sq = Math.sqrt(L * L - R * R * s * s);
  const x = R * c + sq;                                    // mm, piston pin height
  const dxdth = -R * s - R * R * s * c / sq;               // mm/rad

  const deg = ((th * 180 / Math.PI) % 720 + 720) % 720;
  const p = pres(deg, pk);
  const A = Math.PI * Math.pow(bore / 1000, 2) / 4;
  const Fg = p * 1e5 * A;                                  // N
  const torque = Fg * (-dxdth / 1000);                     // N.m
  avgT += (torque - avgT) * Math.min(1, dth / (4 * Math.PI));
  const vp = dxdth * w / 1000;                             // m/s

  flyG.rotation.z = -th;
  const P = new THREE.Vector3(R * s * S, R * c * S, 0.35);
  const Q = new THREE.Vector3(0, x * S, 0.35);
  place(crankArm, new THREE.Vector3(0, 0, 0.15), new THREE.Vector3(P.x, P.y, 0.15));
  place(rod, P, Q);
  pinA.position.copy(P); pinB.position.copy(Q);

  const rad = bore / 2 * S, ph = bore * 0.45 * S;
  piston.scale.set(rad, ph, rad); piston.position.set(0, x * S, 0.35);
  const top = x * S + ph / 2;
  const headY = (L + R) * S + ph / 2 + 0.12;
  const botY = (L - R) * S - ph / 2;
  wall.scale.set(rad * 1.06, headY - botY, rad * 1.06); wall.position.set(0, (headY + botY) / 2, 0.35);
  head.scale.set(rad * 1.1, 1, rad * 1.1); head.position.set(0, headY + 0.05, 0.35);
  gas.scale.set(rad * 0.97, Math.max(headY - top, 0.01), rad * 0.97); gas.position.set(0, (headY + top) / 2, 0.35);
  gas.material.color.setHSL(0.62 * (1 - Math.min((p - 1) / Math.max(pk - 1, 1), 1)), 0.9, 0.5);

  $('hud').textContent =
    'Stroke      ' + stroke(deg) + '  (' + deg.toFixed(0) + ' deg / 720)\n' +
    'Pressure    ' + p.toFixed(1) + ' bar   Gas force ' + (Fg / 1000).toFixed(2) + ' kN\n' +
    'Torque now  ' + torque.toFixed(1) + ' N.m\n' +
    'Torque avg  ' + avgT.toFixed(1) + ' N.m  ->  Power ' + (avgT * w / 1000).toFixed(1) + ' kW\n' +
    'Piston vel  ' + vp.toFixed(1) + ' m/s   Mean speed ' + (4 * R * rpm / 60 / 1000).toFixed(1) + ' m/s\n' +
    'Stroke      ' + (2 * R) + ' mm   Displacement ' + (A * 2 * R / 1000 * 1e6).toFixed(0) + ' cc\n' +
    'L/R ratio   ' + (L / R).toFixed(2) + (L / R < 2.5 ? '  (chhota: side force zyada)' : '');
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   2) INVERTED PENDULUM ON CART (state feedback)
   ========================================================= */
const ipUI = String.raw`<div id="ui"><b>⚖ Inverted pendulum cart</b>
<label>Cart mass M: <span id="vM"></span> kg<input id="M" type="range" min="0.3" max="5" step="0.1" value="1"></label>
<label>Pole mass m: <span id="vm"></span> kg<input id="m" type="range" min="0.05" max="2" step="0.05" value="0.3"></label>
<label>Pole length l: <span id="vl"></span> m<input id="l" type="range" min="0.3" max="1.5" step="0.05" value="0.8"></label>
<label>Angle gain kθ: <span id="vkt"></span><input id="kt" type="range" min="0" max="120" step="1" value="40"></label>
<label>Angle-rate gain kω: <span id="vkw"></span><input id="kw" type="range" min="0" max="30" step="0.5" value="8"></label>
<label>Position gain kx: <span id="vkx"></span><input id="kx" type="range" min="0" max="10" step="0.5" value="2"></label>
<label>Velocity gain kv: <span id="vkv"></span><input id="kv" type="range" min="0" max="10" step="0.5" value="3"></label>
<label>Max motor force: <span id="vfm"></span> N<input id="fm" type="range" min="5" max="100" step="1" value="40"></label>
<label><input id="on" type="checkbox" checked> Controller ON</label>
<button id="push">👉 Push pole</button><button id="rs">↺ Reset</button>
<div style="margin-top:6px;opacity:.8">Control law: u = kθ·θ + kω·ω + kx·x + kv·v. Orange bar = motor force.</div>
</div>`;

const ipJS = String.raw`
scene.background = new THREE.Color(0x0e1424);
camera.position.set(0, 2.3, 8); controls.target.set(0, 1.3, 0);
addLights(15); addGround(20);
bindSliders(['M', 'm', 'l', 'kt', 'kw', 'kx', 'kv', 'fm']);

const TRK = 3, G = 9.81, PY = 0.75;
const rail = new THREE.Mesh(new THREE.BoxGeometry(TRK * 2 + 1.4, 0.08, 0.5), mat(0x475569, 0.6, 0.5));
rail.position.y = 0.25; rail.receiveShadow = true; scene.add(rail);
[-TRK - 0.7, TRK + 0.7].forEach(xx => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.6), mat(0xef4444, 0.5, 0.2));
  b.position.set(xx, 0.45, 0); scene.add(b);
});
const cart = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 0.6), mat(0x3b82f6, 0.4, 0.5));
cart.castShadow = true; scene.add(cart);
const wheels = [-0.3, 0.3].map(dx => {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), mat(0x111827, 0.6, 0.3));
  w.rotation.x = Math.PI / 2; w.userData.dx = dx; scene.add(w); return w;
});
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 12), mat(0xe5e7eb, 0.4, 0.6));
pole.castShadow = true; scene.add(pole);
const bob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), mat(0x22c55e, 0.4, 0.3));
bob.castShadow = true; scene.add(bob);
const fbar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
scene.add(fbar);

let x, xd, th, thd, t, hit, fallen, sign = 1, accum = 0, u = 0;
function reset() { x = 0; xd = 0; th = 0.05; thd = 0; t = 0; hit = false; fallen = false; u = 0; }
reset();
$('rs').addEventListener('click', reset);
$('push').addEventListener('click', () => { thd += 1.5 * sign; sign = -sign; });

const clamp = (a, lo, hi) => Math.min(hi, Math.max(lo, a));
function step(dt) {
  const M = V('M'), m = V('m'), l = V('l');
  u = $('on').checked ? V('kt') * th + V('kw') * thd + V('kx') * x + V('kv') * xd : 0;
  u = clamp(u, -V('fm'), V('fm'));
  const s = Math.sin(th), c = Math.cos(th);
  const xdd = (u + m * l * thd * thd * s - m * G * s * c) / (M + m * s * s);
  const thdd = (G * s - xdd * c) / l;
  xd += xdd * dt; x += xd * dt;
  thd += thdd * dt; th += thd * dt;
  if (Math.abs(x) > TRK) { x = Math.sign(x) * TRK; xd = 0; hit = true; }
  if (Math.abs(th) > 1.4) { fallen = true; }
  t += dt;
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  accum += Math.min(clock.getDelta(), 0.05);
  while (accum >= 0.002) { if (!fallen) step(0.002); accum -= 0.002; }

  const l = V('l'), fm = V('fm');
  cart.position.set(x, PY - 0.2, 0);
  wheels.forEach(w => w.position.set(x + w.userData.dx, 0.37, 0));
  const piv = new THREE.Vector3(x, PY, 0);
  const tip = new THREE.Vector3(x + l * Math.sin(th), PY + l * Math.cos(th), 0);
  place(pole, piv, tip);
  bob.position.copy(tip);
  bob.material.color.setHSL(0.33 * (1 - Math.min(Math.abs(th) / 0.5, 1)), 0.9, 0.5);
  const fl = u / fm * 1.5;
  fbar.scale.x = Math.abs(fl) + 0.001; fbar.position.set(x + fl / 2, 0.08, 0.45);
  controls.target.x += (x * 0.3 - controls.target.x) * 0.05;

  const kt = V('kt'), need = (1 + V('m') / V('M')) * G * V('M') / 1;
  $('hud').textContent =
    'Angle     ' + (th * 57.296).toFixed(1) + ' deg   Rate ' + (thd * 57.296).toFixed(0) + ' deg/s\n' +
    'Cart pos  ' + x.toFixed(2) + ' m    Vel ' + xd.toFixed(2) + ' m/s\n' +
    'Force u   ' + u.toFixed(1) + ' N' + (Math.abs(u) >= fm - 1e-6 ? '  (SATURATED)' : '') + '\n' +
    (fallen ? '🔴 POLE GIR GAYA (Reset dabao)\n' : hit ? '🟠 Track end se takraya\n' : '🟢 Balanced\n') +
    'Time      ' + t.toFixed(1) + ' s\n' +
    'Hint: linear model me kθ > (M+m)g/M * l... se kam ho to pole ko pakad nahi sakta';
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   3) FOUR-BAR LINKAGE + coupler curve
   ========================================================= */
const fbUI = String.raw`<div id="ui"><b>🔗 Four-bar linkage</b>
<label>Ground link d: <span id="vd"></span><input id="d" type="range" min="2" max="7" step="0.1" value="4"></label>
<label>Crank a: <span id="va"></span><input id="a" type="range" min="0.5" max="4" step="0.1" value="1"></label>
<label>Coupler b: <span id="vb"></span><input id="b" type="range" min="2" max="7" step="0.1" value="4"></label>
<label>Rocker c: <span id="vc"></span><input id="c" type="range" min="2" max="7" step="0.1" value="3"></label>
<label>Tracer point along coupler: <span id="vp"></span> x b<input id="p" type="range" min="0" max="1.5" step="0.05" value="0.5"></label>
<label>Tracer offset: <span id="vq"></span><input id="q" type="range" min="-4" max="4" step="0.1" value="1.5"></label>
<label>Crank speed: <span id="vsp"></span> rad/s<input id="sp" type="range" min="0.2" max="4" step="0.1" value="1"></label>
<button id="flip">Flip assembly</button><button id="clr">Clear trail</button>
<div style="margin-top:6px;opacity:.8">Trail rang = time. Crank = orange, coupler = cyan, rocker = green.</div>
</div>`;

const fbJS = String.raw`
scene.background = new THREE.Color(0x0e1424);
camera.position.set(2.5, 3.8, 11); controls.target.set(2.5, 3.5, 0);
addLights(15); addGround(20);
bindSliders(['d', 'a', 'b', 'c', 'p', 'q', 'sp']);

const mech = new THREE.Group(); mech.position.y = 3.5; scene.add(mech);
const bar = (col, w, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), mat(col, 0.4, 0.5)); m.castShadow = true; mech.add(m); return m; };
const crank = bar(0xf97316, 0.16, 0.12), coup = bar(0x22d3ee, 0.16, 0.12), rock = bar(0x22c55e, 0.16, 0.12);
const plate1 = bar(0x0ea5b7, 0.07, 0.08), plate2 = bar(0x0ea5b7, 0.07, 0.08);
const ball = (col, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), mat(col, 0.3, 0.7)); mech.add(m); return m; };
const jA = ball(0xffffff, 0.16), jB = ball(0xffffff, 0.13), jC = ball(0xffffff, 0.13), jD = ball(0xffffff, 0.16);
const jP = ball(0xfacc15, 0.15);
const ped = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), mat(0x475569, 0.7, 0.2)); scene.add(m); return m; });

const trailPts = [];
const tGeo = new THREE.BufferGeometry();
const tLine = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
tLine.frustumCulled = false; mech.add(tLine);

let flip = 1, th = 0.3, dir = 1, tm = 0, muMin = 180, rMin = 1e9, rMax = -1e9, locked = false;
function resetStats() { trailPts.length = 0; muMin = 180; rMin = 1e9; rMax = -1e9; }
['d', 'a', 'b', 'c', 'p', 'q'].forEach(id => $(id).addEventListener('input', resetStats));
$('flip').addEventListener('click', () => { flip = -flip; resetStats(); });
$('clr').addEventListener('click', resetStats);

function solve(a1) {
  const d = V('d'), a = V('a'), b = V('b'), c = V('c');
  const Bx = a * Math.cos(a1), By = a * Math.sin(a1);
  const dx = d - Bx, dy = -By, e = Math.hypot(dx, dy);
  if (e > b + c - 1e-6 || e < Math.abs(b - c) + 1e-6) return null;
  const aa = (b * b - c * c + e * e) / (2 * e), h = Math.sqrt(Math.max(b * b - aa * aa, 0));
  const ux = dx / e, uy = dy / e;
  const Cx = Bx + aa * ux - flip * h * uy, Cy = By + aa * uy + flip * h * ux;
  const tx = (Cx - Bx) / b, ty = (Cy - By) / b;
  const pl = V('p') * b, q = V('q');
  return { Bx, By, Cx, Cy, Px: Bx + pl * tx - q * ty, Py: By + pl * ty + q * tx,
           mu: Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - e * e) / (2 * b * c)))) * 180 / Math.PI };
}
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const d = V('d');
  let n = solve(th + dir * V('sp') * dt);
  if (n) { th += dir * V('sp') * dt; locked = false; }
  else { dir = -dir; n = solve(th); locked = !n; }

  ped[0].position.set(0, 3.5 - 0.6, 0); ped[1].position.set(d, 3.5 - 0.6, 0);
  jA.position.set(0, 0, 0); jD.position.set(d, 0, 0);

  if (n) {
    const zc = 0.18;
    place(crank, v3(0, 0, 0), v3(n.Bx, n.By, 0));
    place(rock, v3(d, 0, 0), v3(n.Cx, n.Cy, 0));
    place(coup, v3(n.Bx, n.By, zc), v3(n.Cx, n.Cy, zc));
    place(plate1, v3(n.Bx, n.By, zc), v3(n.Px, n.Py, zc));
    place(plate2, v3(n.Cx, n.Cy, zc), v3(n.Px, n.Py, zc));
    jB.position.set(n.Bx, n.By, zc * 0.5); jC.position.set(n.Cx, n.Cy, zc * 0.5);
    jP.position.set(n.Px, n.Py, zc);

    tm += dt;
    trailPts.push({ x: n.Px, y: n.Py, h: (tm * 0.15) % 1 });
    if (trailPts.length > 1500) trailPts.shift();
    const pos = new Float32Array(trailPts.length * 3), col = new Float32Array(trailPts.length * 3), c = new THREE.Color();
    trailPts.forEach((q, i) => {
      pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = 0.18;
      c.setHSL(q.h, 1, 0.55); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    });
    tGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    tGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    muMin = Math.min(muMin, Math.min(n.mu, 180 - n.mu));
    const ra = Math.atan2(n.Cy, n.Cx - d) * 180 / Math.PI;
    rMin = Math.min(rMin, ra); rMax = Math.max(rMax, ra);
  }

  const L = [d, V('a'), V('b'), V('c')].slice().sort((x, y) => x - y);
  const grashof = L[0] + L[3] <= L[1] + L[2];
  const type = !grashof ? 'Non-Grashof: crank poora ghoom nahi sakta (rocking)'
    : (Math.abs(V('a') - L[0]) < 1e-9 ? 'Grashof: crank-rocker (crank poora ghoomta hai)' : 'Grashof: dusra type (drag-link/double-rocker)');
  $('hud').textContent =
    (locked ? '🔴 LOCKED: ye lengths assemble nahi hote\n' : '') +
    type + '\n' +
    'Crank angle   ' + ((th * 180 / Math.PI) % 360).toFixed(0) + ' deg\n' +
    'Transmission  min ' + (muMin > 179 ? '-' : muMin.toFixed(0)) + ' deg' + (muMin < 40 ? '  ⚠ kharab (<40)' : '') + '\n' +
    'Rocker swing  ' + (rMax > rMin ? (rMax - rMin).toFixed(0) + ' deg' : '-');
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
E.html.splice(Math.min(10, E.html.length), 0,
  { name: "3D Machine - slider-crank engine (torque, power)",   code: page(engUI, engJS) },
  { name: "3D Control - inverted pendulum cart (gains)",         code: page(ipUI, ipJS) },
  { name: "3D Mechanism - four-bar linkage (coupler curve)",     code: page(fbUI, fbJS) }
);

})();
