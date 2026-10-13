/* =========================================================
   SIM LAB - examples3d2.js
   More 3D engineering templates (Three.js)
   Gear train, Earthquake building, Beam bending, Wind around tower
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
#ui{position:absolute;top:8px;left:8px;width:220px;max-height:70vh;overflow:auto;background:rgba(0,0,0,.6);padding:8px 10px;border-radius:8px;font-size:12px}
#ui label{display:block;margin-top:6px}
#ui input[type=range]{width:100%}
#ui select{width:100%;margin-top:4px}
#ui button{margin-top:8px;margin-right:4px;padding:4px 10px}
#hud{position:absolute;bottom:8px;left:8px;font:12px/1.5 monospace;background:rgba(0,0,0,.55);padding:6px 10px;border-radius:6px;white-space:pre}
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
  return sun;
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
   1) GEAR TRAIN (2-stage, simplified trapezoid teeth)
   ========================================================= */
const gearUI = String.raw`<div id="ui"><b>⚙ Gear train (2 stage)</b>
<label>Gear 1 teeth (motor): <span id="vn1"></span><input id="n1" type="range" min="8" max="40" step="1" value="16"></label>
<label>Gear 2 teeth: <span id="vn2"></span><input id="n2" type="range" min="8" max="60" step="1" value="40"></label>
<label>Gear 3 teeth (Gear 2 ke shaft par): <span id="vn3"></span><input id="n3" type="range" min="8" max="40" step="1" value="18"></label>
<label>Gear 4 teeth (output): <span id="vn4"></span><input id="n4" type="range" min="8" max="60" step="1" value="45"></label>
<label>Motor RPM: <span id="vrpm"></span><input id="rpm" type="range" min="10" max="300" step="5" value="120"></label>
<label>Motor torque: <span id="vtq"></span> N.m<input id="tq" type="range" min="1" max="100" step="1" value="10"></label>
</div>`;

const gearJS = String.raw`
scene.background = new THREE.Color(0x0e1424);
camera.position.set(6, 4, 12); controls.target.set(3, 1.5, 0.4);
addLights(15); addGround(20);
bindSliders(['n1', 'n2', 'n3', 'n4', 'rpm', 'tq']);

const MOD = 0.12, DEPTH = 0.5, COLS = [0xff7a1a, 0x3b82f6, 0x22d3ee, 0x22c55e];
const root = new THREE.Group(); scene.add(root);
let gears = [], N = [16, 40, 18, 45];

function gearMesh(n, color) {
  const r = MOD * n / 2, ra = r + MOD, rr = r - 1.25 * MOD, p = 2 * Math.PI / n;
  const sh = new THREE.Shape();
  let first = true;
  const pt = (rad, a) => {
    const x = rad * Math.cos(a), y = rad * Math.sin(a);
    if (first) { sh.moveTo(x, y); first = false; } else sh.lineTo(x, y);
  };
  for (let k = 0; k < n; k++) {
    const c = k * p;
    pt(rr, c - 0.30 * p); pt(ra, c - 0.12 * p); pt(ra, c + 0.12 * p); pt(rr, c + 0.30 * p);
  }
  sh.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, Math.min(0.18, rr * 0.4), 0, Math.PI * 2, true);
  sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: DEPTH, bevelEnabled: false });
  g.translate(0, 0, -DEPTH / 2);
  const m = new THREE.Mesh(g, mat(color, 0.35, 0.7));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function shaft(x, z0, z1) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 20), mat(0xb0b8c4, 0.3, 0.9));
  o.rotation.x = Math.PI / 2; o.scale.y = z1 - z0; o.position.set(x, 0, (z0 + z1) / 2);
  o.castShadow = true; root.add(o);
}

function build() {
  while (root.children.length) {
    const o = root.children[0]; root.remove(o); if (o.geometry) o.geometry.dispose();
  }
  N = [V('n1'), V('n2'), V('n3'), V('n4')];
  const R = N.map(n => MOD * n / 2);
  const x2 = R[0] + R[1], x4 = x2 + R[2] + R[3];
  const pos = [[0, 0, 0], [x2, 0, 0], [x2, 0, 0.8], [x4, 0, 0.8]];
  const maxR = Math.max(...R) + MOD;
  root.position.y = maxR + 0.8;
  gears = N.map((n, i) => {
    const g = gearMesh(n, COLS[i]);
    g.position.set(pos[i][0], pos[i][1], pos[i][2]);
    root.add(g); return g;
  });
  shaft(0, -0.55, 0.55); shaft(x2, -0.55, 1.35); shaft(x4, 0.25, 1.35);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(x4 + maxR * 2 + 1, 0.12, 2.0), mat(0x374151, 0.8, 0.2));
  plate.position.set(x4 / 2, -maxR - 0.35, 0.4); plate.receiveShadow = true; root.add(plate);
  controls.target.set(x4 / 2, root.position.y, 0.4);
}
['n1', 'n2', 'n3', 'n4'].forEach(id => $(id).addEventListener('input', build));
build();

let th = 0;
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const rpm = V('rpm'), tq = V('tq');
  th += rpm / 60 * 2 * Math.PI * dt * 0.15;               // slow-motion 0.15x
  const th2 = Math.PI + Math.PI / N[1] - th * N[0] / N[1];
  const th4 = Math.PI + Math.PI / N[3] - th2 * N[2] / N[3];
  gears[0].rotation.z = th;
  gears[1].rotation.z = th2;
  gears[2].rotation.z = th2;
  gears[3].rotation.z = th4;

  const ratio = (N[1] / N[0]) * (N[3] / N[2]);
  const eff = 0.98 * 0.98;
  const pin = tq * rpm * 2 * Math.PI / 60;
  $('hud').textContent =
    'Ratio (in/out) ' + ratio.toFixed(2) + ' : 1\n' +
    'Output speed   ' + (rpm / ratio).toFixed(1) + ' rpm\n' +
    'Output torque  ' + (tq * ratio * eff).toFixed(1) + ' N.m (eff ' + (eff * 100).toFixed(0) + '%)\n' +
    'Power in/out   ' + pin.toFixed(0) + ' / ' + (pin * eff).toFixed(0) + ' W\n' +
    'Animation 0.15x slow-motion' +
    (N.some(n => n < 17) ? '\n⚠ <17 teeth: involute gear me undercut hota hai' : '');
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   2) EARTHQUAKE: 5-storey shear building (modal + time history)
   ========================================================= */
const quakeUI = String.raw`<div id="ui"><b>🏢 Earthquake / vibration</b>
<label>Storey stiffness k: <span id="vk"></span> MN/m<input id="k" type="range" min="20" max="400" step="5" value="120"></label>
<label>Floor mass: <span id="vm"></span> t<input id="m" type="range" min="50" max="600" step="10" value="200"></label>
<label>Damping: <span id="vz"></span> %<input id="z" type="range" min="1" max="20" step="0.5" value="5"></label>
<label>Ground shaking freq: <span id="vfq"></span> Hz<input id="fq" type="range" min="0.2" max="6" step="0.05" value="1"></label>
<label>Ground amplitude: <span id="vam"></span> cm<input id="am" type="range" min="1" max="30" step="1" value="5"></label>
<label>Visual exaggeration: <span id="vex"></span>x<input id="ex" type="range" min="1" max="30" step="1" value="8"></label>
<label><input id="shake" type="checkbox" checked> Shaking ON</label>
<button id="res">Set f = f1 (resonance)</button><button id="rs">Reset</button>
<div style="margin-top:6px;opacity:.8">Column color: green safe, red = drift 1% (illustrative limit)</div>
</div>`;

const quakeJS = String.raw`
scene.background = new THREE.Color(0x0b1224);
camera.position.set(16, 11, 20); controls.target.set(0, 8, 0);
addLights(25); addGround(40);
bindSliders(['k', 'm', 'z', 'fq', 'am', 'ex']);

const NS = 5, H = 3.2, HW = 1.8, BASE = 0.3;

function jacobi(A) {
  const n = A.length, a = A.map(r => r.slice());
  for (let sw = 0; sw < 60; sw++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
    if (off < 1e-12) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-14) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
      for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => x - y);
}

function modes() {
  const kk = 1000 * V('k') / V('m');               // MN/m / tonne -> 1/s^2
  const A = Array.from({ length: NS }, () => new Array(NS).fill(0));
  for (let i = 0; i < NS; i++) {
    A[i][i] = (i < NS - 1 ? 2 : 1) * kk;
    if (i > 0) A[i][i - 1] = -kk;
    if (i < NS - 1) A[i][i + 1] = -kk;
  }
  return jacobi(A).map(l => Math.sqrt(Math.max(l, 0)) / (2 * Math.PI));
}
let fr = modes();
['k', 'm'].forEach(id => $(id).addEventListener('input', () => { fr = modes(); }));

/* geometry */
const ground = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 + 2, BASE, HW * 2 + 2), mat(0x475569, 0.9, 0));
ground.position.y = BASE / 2; ground.receiveShadow = true; scene.add(ground);
const floors = [], colMats = [], cols = [];
for (let i = 0; i < NS; i++) {
  const f = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 + 0.8, 0.3, HW * 2 + 0.8),
    mat(new THREE.Color().setHSL(0.58, 0.35, 0.45 + i * 0.04), 0.7, 0.1));
  f.castShadow = true; f.receiveShadow = true; scene.add(f); floors.push(f);
  const cm = mat(0x22c55e, 0.5, 0.4); colMats.push(cm);
  const row = [];
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(s => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1, 10), cm);
    c.castShadow = true; scene.add(c); row.push({ mesh: c, ox: s[0] * HW * 0.85, oz: s[1] * HW * 0.85 });
  });
  cols.push(row);
}

/* dynamics */
let u = new Array(NS).fill(0), v = new Array(NS).fill(0);
let ph = 0, ampNow = 0, peakDrift = 0, accum = 0;
const DT = 0.001;

function step() {
  const kk = 1000 * V('k') / V('m');
  const zeta = V('z') / 100, w1 = 2 * Math.PI * fr[0];
  const cc = (2 * zeta / w1) * kk;                 // stiffness-proportional damping (mode 1)
  const f = V('fq'), target = $('shake').checked ? V('am') / 100 : 0;
  ampNow += (target - ampNow) * Math.min(1, DT * 2);
  ph += 2 * Math.PI * f * DT;
  const ug = ampNow * Math.sin(ph), vg = ampNow * 2 * Math.PI * f * Math.cos(ph);
  const acc = new Array(NS);
  for (let i = 0; i < NS; i++) {
    const dL = u[i] - (i ? u[i - 1] : ug), dvL = v[i] - (i ? v[i - 1] : vg);
    let F = -kk * dL - cc * dvL;
    if (i < NS - 1) F += kk * (u[i + 1] - u[i]) + cc * (v[i + 1] - v[i]);
    acc[i] = F;
  }
  for (let i = 0; i < NS; i++) { v[i] += acc[i] * DT; u[i] += v[i] * DT; }
  return ug;
}

$('res').addEventListener('click', () => {
  $('fq').value = fr[0].toFixed(2); $('vfq').textContent = fr[0].toFixed(2);
});
$('rs').addEventListener('click', () => { u.fill(0); v.fill(0); peakDrift = 0; ampNow = 0; });

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  accum += Math.min(clock.getDelta(), 0.05);
  let ug = 0;
  while (accum >= DT) { ug = step(); accum -= DT; }
  const ex = V('ex');
  ground.position.x = ug * ex;
  let maxNow = 0;
  for (let i = 0; i < NS; i++) {
    const lo = (i ? u[i - 1] : ug) * ex, hi = u[i] * ex;
    const y0 = BASE + i * H, y1 = BASE + (i + 1) * H;
    floors[i].position.set(hi, y1, 0);
    cols[i].forEach(c => place(c.mesh, new THREE.Vector3(lo + c.ox, y0, c.oz), new THREE.Vector3(hi + c.ox, y1, c.oz)));
    const ratio = Math.abs(u[i] - (i ? u[i - 1] : ug)) / H;
    maxNow = Math.max(maxNow, ratio);
    colMats[i].color.setHSL(0.33 * (1 - Math.min(ratio / 0.01, 1)), 0.9, 0.5);
  }
  peakDrift = Math.max(peakDrift, maxNow);
  const f = V('fq');
  $('hud').textContent =
    'Natural freq  f1 ' + fr[0].toFixed(2) + ' | f2 ' + fr[1].toFixed(2) + ' | f3 ' + fr[2].toFixed(2) + ' Hz\n' +
    'Shaking f     ' + f.toFixed(2) + ' Hz  (f/f1 = ' + (f / fr[0]).toFixed(2) + ')\n' +
    'Roof disp.    ' + (u[NS - 1] * 100).toFixed(1) + ' cm\n' +
    'Peak drift    ' + (peakDrift * 100).toFixed(2) + ' %  (now ' + (maxNow * 100).toFixed(2) + ' %)\n' +
    (peakDrift > 0.01 ? '🔴 DRIFT LIMIT CROSSED' : peakDrift > 0.005 ? '🟠 WARNING' : '🟢 OK');
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   3) BEAM BENDING (simply supported / cantilever, point load)
   ========================================================= */
const beamUI = String.raw`<div id="ui"><b>📏 Beam bending</b>
<label>Type<select id="type"><option value="ss">Simply supported</option><option value="ct">Cantilever</option></select></label>
<label>Length: <span id="vL"></span> m<input id="L" type="range" min="1" max="8" step="0.5" value="4"></label>
<label>Depth h: <span id="vh"></span> mm<input id="h" type="range" min="50" max="400" step="10" value="200"></label>
<label>Width b: <span id="vb"></span> mm<input id="b" type="range" min="30" max="300" step="10" value="100"></label>
<label>E: <span id="vE"></span> GPa<input id="E" type="range" min="10" max="210" step="5" value="200"></label>
<label>Load P: <span id="vP"></span> kN<input id="P" type="range" min="1" max="100" step="1" value="20"></label>
<label>Load position: <span id="va"></span> x L<input id="a" type="range" min="0.05" max="1" step="0.01" value="0.5"></label>
<label>Yield stress: <span id="vsy"></span> MPa<input id="sy" type="range" min="20" max="500" step="10" value="250"></label>
<label>Deflection exaggeration: <span id="vex"></span>x<input id="ex" type="range" min="1" max="200" step="1" value="40"></label>
<label><input id="auto" type="checkbox"> Load automatic chale</label>
</div>`;

const beamJS = String.raw`
scene.background = new THREE.Color(0x101826);
camera.position.set(0, 3.5, 10); controls.target.set(0, 2, 0);
addLights(15); addGround(20);
bindSliders(['L', 'h', 'b', 'E', 'P', 'a', 'sy', 'ex']);

const root = new THREE.Group(); root.position.y = 2; scene.add(root);
const NSEG = 80, segs = [];
const unit = new THREE.BoxGeometry(1, 1, 1);
for (let i = 0; i < NSEG; i++) {
  const m = new THREE.Mesh(unit, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }));
  m.castShadow = true; root.add(m); segs.push(m);
}
const coneG = new THREE.ConeGeometry(0.35, 1, 4);
const sup1 = new THREE.Mesh(coneG, mat(0xfacc15, 0.4, 0.3)); sup1.rotation.y = Math.PI / 4; root.add(sup1);
const sup2 = new THREE.Mesh(coneG, mat(0xfb923c, 0.4, 0.3)); sup2.rotation.y = Math.PI / 4; root.add(sup2);
const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1.4), mat(0x6b7280, 0.9, 0.1)); root.add(wall);

const arrow = new THREE.Group(); root.add(arrow);
const tip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 16), mat(0xef4444, 0.4, 0.2));
tip.rotation.z = Math.PI; tip.position.y = 0.2; arrow.add(tip);
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 12), mat(0xef4444, 0.4, 0.2));
arrow.add(stem);

let t = 0;
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if ($('auto').checked) {
    t += dt;
    const val = 0.1 + 0.8 * (0.5 + 0.5 * Math.sin(t * 0.6));
    $('a').value = val.toFixed(3); $('va').textContent = val.toFixed(2);
  }
  const L = V('L'), h = V('h') / 1000, b = V('b') / 1000, Eg = V('E'), P = V('P'), ex = V('ex'), sy = V('sy');
  const ct = $('type').value === 'ct';
  const I = b * h * h * h / 12, EI = Eg * 1e9 * I, Pn = P * 1e3;
  const a = ct ? V('a') * L : Math.min(Math.max(V('a'), 0.02), 0.98) * L;

  const defl = x => {
    if (ct) return x <= a ? Pn * x * x * (3 * a - x) / (6 * EI) : Pn * a * a * (3 * x - a) / (6 * EI);
    const bb = L - a;
    return x <= a ? Pn * bb * x * (L * L - bb * bb - x * x) / (6 * EI * L)
                  : Pn * a * (L - x) * (L * L - a * a - (L - x) * (L - x)) / (6 * EI * L);
  };
  const mom = x => {
    if (ct) return x <= a ? Pn * (a - x) : 0;
    return x <= a ? Pn * (L - a) * x / L : Pn * a * (L - x) / L;
  };

  const pts = [];
  let maxD = 0, maxDx = 0, maxS = 0;
  for (let i = 0; i <= NSEG; i++) {
    const x = L * i / NSEG, d = defl(x), s = Math.abs(mom(x)) * (h / 2) / I / 1e6;
    pts.push({ x, d, s });
    if (d > maxD) { maxD = d; maxDx = x; }
    if (s > maxS) maxS = s;
  }
  for (let i = 0; i < NSEG; i++) {
    const p = pts[i], q = pts[i + 1];
    const dx = q.x - p.x, dy = -(q.d - p.d) * ex, len = Math.hypot(dx, dy);
    const s = segs[i];
    s.position.set((p.x + q.x) / 2 - L / 2, -(p.d + q.d) / 2 * ex, 0);
    s.rotation.z = Math.atan2(dy, dx);
    s.scale.set(len * 1.02, h, b);
    const r = ((p.s + q.s) / 2) / sy;
    s.material.color.setHSL(r > 1 ? 0.83 : 0.33 * (1 - r), 0.9, 0.5);
  }

  sup1.visible = sup2.visible = !ct; wall.visible = ct;
  const ch = 2 - h / 2;
  [sup1, sup2].forEach(c => { c.scale.y = ch; c.position.y = -h / 2 - ch / 2; });
  sup1.position.x = -L / 2; sup2.position.x = L / 2;
  wall.position.set(-L / 2 - 0.25, 0, 0);

  const top = -defl(a) * ex + h / 2 + 0.02;
  const len = 0.4 + P / 100 * 1.4;
  arrow.position.set(a - L / 2, top, 0);
  stem.scale.y = len; stem.position.y = 0.4 + len / 2;

  const reaction = ct ? 'Fixed-end moment ' + (Pn * a / 1000).toFixed(1) + ' kN.m'
                      : 'Reactions ' + (Pn * (L - a) / L / 1000).toFixed(1) + ' / ' + (Pn * a / L / 1000).toFixed(1) + ' kN';
  const lim = L / 360;
  $('hud').textContent =
    'I (section)   ' + (I * 1e8).toFixed(0) + ' cm4\n' +
    'Max deflect   ' + (maxD * 1000).toFixed(2) + ' mm at x = ' + maxDx.toFixed(2) + ' m\n' +
    'L/' + (maxD > 0 ? (L / maxD).toFixed(0) : '-') + '  (limit L/360 = ' + (lim * 1000).toFixed(1) + ' mm) ' + (maxD <= lim ? 'OK' : 'EXCEEDS') + '\n' +
    'Max stress    ' + maxS.toFixed(1) + ' MPa  (yield ' + sy + ')\n' +
    'Safety factor ' + (maxS > 0 ? (sy / maxS).toFixed(2) : '-') + (maxS > sy ? '  🔴 YIELDS' : maxS > 0.7 * sy ? '  🟠' : '  🟢') + '\n' +
    reaction;
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   4) WIND AROUND A TOWER (ideal potential flow, particles)
   ========================================================= */
const windUI = String.raw`<div id="ui"><b>🌬 Wind around tower</b>
<label>Wind speed U: <span id="vu"></span> m/s<input id="u" type="range" min="1" max="40" step="1" value="15"></label>
<label>Tower radius: <span id="vr"></span> m<input id="r" type="range" min="0.5" max="3" step="0.1" value="1.5"></label>
<div style="margin-top:6px;opacity:.8">Particle: blue = slow, red = fast.<br>Tower: red = high pressure, blue = suction (Cp).</div>
</div>`;

const windJS = String.raw`
scene.background = new THREE.Color(0x0b1224);
camera.position.set(-8, 14, 22); controls.target.set(0, 4, 0);
addLights(20); addGround(30);
bindSliders(['u', 'r']);

const TH = 9;
let R = V('r'), tower = null;

function buildTower() {
  if (tower) { scene.remove(tower); tower.geometry.dispose(); }
  R = V('r');
  const g = new THREE.CylinderGeometry(R, R, TH, 64, 1);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i), cp = 1 - 4 * (z / R) * (z / R);          // ideal flow: Cp = 1 - 4 sin^2
    const tt = Math.min(Math.max((cp + 3) / 4, 0), 1);
    c.setHSL(0.66 * (1 - tt), 0.9, 0.5);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  tower = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }));
  tower.position.y = TH / 2; tower.castShadow = true; scene.add(tower);
}
$('r').addEventListener('input', buildTower);
buildTower();

const NP = 4500;
const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), NP);
inst.frustumCulled = false; scene.add(inst);
const X = new Float32Array(NP), Y = new Float32Array(NP), Z = new Float32Array(NP);
function spawn(i, anywhere) {
  X[i] = anywhere ? -15 + Math.random() * 30 : -15;
  Y[i] = 0.2 + Math.random() * (TH + 0.8);
  Z[i] = (Math.random() - 0.5) * 16;
}
for (let i = 0; i < NP; i++) spawn(i, true);

const dummy = new THREE.Object3D(), colr = new THREE.Color();
inst.setColorAt(0, colr);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05) * 0.25;
  const U = V('u'), R2 = R * R;
  for (let i = 0; i < NP; i++) {
    let x = X[i], z = Z[i], sp = 1;
    for (let s = 0; s < 2; s++) {
      const r2 = x * x + z * z;
      if (r2 < R2 * 1.04) { spawn(i, false); x = X[i]; z = Z[i]; continue; }
      const q = R2 / (r2 * r2);
      const uu = U * (1 - q * (x * x - z * z)), ww = -U * 2 * q * x * z;
      x += uu * dt * 0.5; z += ww * dt * 0.5;
      sp = Math.hypot(uu, ww) / U;
    }
    if (x > 15) { spawn(i, false); x = X[i]; z = Z[i]; }
    X[i] = x; Z[i] = z;
    dummy.position.set(x, Y[i], z); dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
    colr.setHSL(0.66 * (1 - Math.min(sp / 2, 1)), 0.9, 0.55);
    inst.setColorAt(i, colr);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.instanceColor.needsUpdate = true;

  const q = 0.5 * 1.225 * U * U;
  $('hud').textContent =
    'Dynamic pressure q   ' + q.toFixed(0) + ' Pa\n' +
    'Windward (Cp=+1.0)   ' + q.toFixed(0) + ' Pa\n' +
    'Sides (Cp=-3.0)      ' + (-3 * q).toFixed(0) + ' Pa suction\n' +
    'Max air speed        ' + (2 * U).toFixed(0) + ' m/s (2U)\n' +
    'Ideal flow: wake/separation nahi dikhta';
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* ---------- register in dropdown (pehle 4 templates ke baad) ---------- */
const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
const items = [
  { name: "3D Mechanical - gear train (ratio, torque)",         code: page(gearUI, gearJS) },
  { name: "3D Structural - earthquake building (resonance)",    code: page(quakeUI, quakeJS) },
  { name: "3D Structural - beam bending (stress colors)",       code: page(beamUI, beamJS) },
  { name: "3D Fluid - wind flow around tower (particles)",      code: page(windUI, windJS) }
];
E.html.splice(Math.min(4, E.html.length), 0, ...items);

})();
