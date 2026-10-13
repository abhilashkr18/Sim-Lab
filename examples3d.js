/* =========================================================
   SIM LAB - examples3d.js
   3D engineering templates (Three.js) + Python 3D (Plotly)
   Ye file examples.js ke BAAD load hoti hai aur dropdown me
   naye examples jod deti hai.
   NOTE: String.raw ke andar backtick ya dollar-brace mat likhna.
   ========================================================= */
(function () {
'use strict';

/* ---------- common HTML head (Three.js importmap) ---------- */
const HEAD = String.raw`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#0b1020;font-family:system-ui,sans-serif;color:#fff}
#ui{position:absolute;top:8px;left:8px;width:210px;background:rgba(0,0,0,.6);padding:8px 10px;border-radius:8px;font-size:12px}
#ui label{display:block;margin-top:6px}
#ui input[type=range]{width:100%}
#ui button{margin-top:8px;padding:4px 10px}
#hud{position:absolute;bottom:8px;left:8px;font:12px/1.5 monospace;background:rgba(0,0,0,.55);padding:6px 10px;border-radius:6px;white-space:pre}
</style>
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}
</script>
</head>
<body>
`;

/* ---------- common Three.js setup (har template me shamil) ---------- */
const COMMON = String.raw`import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = id => document.getElementById(id);
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
`;

function page(ui, js) {
  return HEAD + ui + '\n<div id="hud"></div>\n<script type="module">\n' + COMMON + js +
         '\n</' + 'script>\n</body>\n</html>\n';
}

/* =========================================================
   1) QUADCOPTER DRONE
   ========================================================= */
const droneUI = String.raw`<div id="ui"><b>🚁 Quadcopter drone</b>
<label>Mass: <span id="vm"></span> kg<input id="m" type="range" min="0.5" max="6" step="0.1" value="1.5"></label>
<label>Wind: <span id="vw"></span> m/s<input id="w" type="range" min="0" max="10" step="0.5" value="2"></label>
<label>Aggressiveness: <span id="vs"></span><input id="s" type="range" min="0.5" max="3" step="0.1" value="1"></label>
</div>`;

const droneJS = String.raw`
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x0b1020, 40, 140);
camera.position.set(12, 8, 14);
addLights(25); addGround(60);
bindSliders(['m', 'w', 's']);

const G = 9.81, MAXT = 40;           // max total thrust (N)

/* --- drone 3D model --- */
const drone = new THREE.Group(); scene.add(drone);
const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), mat(0xff7a1a));
body.castShadow = true; drone.add(body);
const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), mat(0x111111, 0.3, 0.8));
gimbal.position.set(0, -0.13, 0.15); drone.add(gimbal);
const rotors = [];
[[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], i) => {
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.05), mat(0x222831));
  arm.position.set(sx * 0.3, 0, sz * 0.3);
  arm.rotation.y = Math.atan2(-sz, sx);
  arm.castShadow = true; drone.add(arm);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 20), mat(0x888888, 0.3, 0.9));
  motor.position.set(sx * 0.6, 0.05, sz * 0.6); drone.add(motor);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.012, 0.07), mat(sz > 0 ? 0xff3355 : 0x22d3ee));
  rotor.position.set(sx * 0.6, 0.12, sz * 0.6); rotor.castShadow = true; drone.add(rotor);
  rotors.push({ mesh: rotor, dir: i % 2 ? 1 : -1 });
});

/* --- waypoints --- */
const wps = [[0, 4, 0], [9, 6, 0], [9, 4, 9], [-9, 7, 9], [-9, 3, -6], [0, 5, -9]]
  .map(a => new THREE.Vector3(a[0], a[1], a[2]));
wps.forEach((w, i) => {
  const h = i / wps.length;
  const s = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(h, 0.9, 0.55), emissive: new THREE.Color().setHSL(h, 0.9, 0.3) })
  );
  s.position.copy(w); scene.add(s);
});

/* --- flight trail (colored by speed) --- */
const trail = [];
const trailGeo = new THREE.BufferGeometry();
const trailLine = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
trailLine.frustumCulled = false; scene.add(trailLine);
function updateTrail() {
  const pos = new Float32Array(trail.length * 3), col = new Float32Array(trail.length * 3);
  trail.forEach((q, i) => {
    pos[i * 3] = q.p.x; pos[i * 3 + 1] = q.p.y; pos[i * 3 + 2] = q.p.z;
    const c = new THREE.Color().setHSL(0.66 - Math.min(q.s / 8, 1) * 0.66, 1, 0.55);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  });
  trailGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  trailGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

/* --- physics (point mass + tilt controller + wind + motor limit) --- */
const p = new THREE.Vector3(0, 0.1, 0), v = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0), desiredUp = new THREE.Vector3(0, 1, 0);
let wi = 0, t = 0, thrustNow = 0, accum = 0;

function step(dt) {
  const m = +$('m').value, wind = +$('w').value, sp = +$('s').value;
  t += dt;
  if (p.distanceTo(wps[wi]) < 0.7) wi = (wi + 1) % wps.length;
  const a = wps[wi].clone().sub(p).multiplyScalar(1.4 * sp).sub(v.clone().multiplyScalar(1.8));
  a.clampLength(0, 5 + 3 * sp);
  const f = a.clone(); f.y += G;
  if (f.y < 2) f.y = 2;
  const hmax = f.y * Math.tan(0.65), hl = Math.hypot(f.x, f.z);   // max tilt ~37 deg
  if (hl > hmax) { f.x *= hmax / hl; f.z *= hmax / hl; }
  desiredUp.copy(f).normalize();
  thrustNow = Math.min(m * f.length(), MAXT);                       // motor saturation
  const acc = f.clone().normalize().multiplyScalar(thrustNow / m);
  acc.y -= G;
  const wv = new THREE.Vector3(Math.sin(t * 0.3) * wind, 0, Math.cos(t * 0.21) * wind * 0.6);
  acc.add(wv.sub(v).multiplyScalar(0.25 / m));                      // wind + drag
  v.addScaledVector(acc, dt);
  p.addScaledVector(v, dt);
  if (p.y < 0.1) { p.y = 0.1; if (v.y < 0) v.y = 0; v.x *= 0.9; v.z *= 0.9; }
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  accum += Math.min(clock.getDelta(), 0.05);
  while (accum >= 1 / 120) { step(1 / 120); accum -= 1 / 120; }
  drone.position.copy(p);
  drone.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(up, desiredUp), 0.15);
  const pw = thrustNow / MAXT;
  rotors.forEach(r => { r.mesh.rotation.y += r.dir * (0.4 + pw * 1.6); });
  trail.push({ p: p.clone(), s: v.length() });
  if (trail.length > 700) trail.shift();
  updateTrail();
  controls.target.lerp(p, 0.05); controls.update();
  $('hud').textContent =
    'Speed    ' + v.length().toFixed(1) + ' m/s\n' +
    'Altitude ' + p.y.toFixed(1) + ' m\n' +
    'Thrust   ' + (pw * 100).toFixed(0) + ' %' + (pw >= 0.999 ? '  ⚠ MOTOR LIMIT' : '') + '\n' +
    'Waypoint ' + (wi + 1) + '/' + wps.length;
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   2) ROBOTIC ARM (inverse kinematics)
   ========================================================= */
const armUI = String.raw`<div id="ui"><b>🦾 Robotic arm (IK)</b>
<label>Link 1: <span id="vl1"></span> m<input id="l1" type="range" min="0.8" max="2.5" step="0.1" value="1.4"></label>
<label>Link 2: <span id="vl2"></span> m<input id="l2" type="range" min="0.8" max="2.5" step="0.1" value="1.2"></label>
<label>Path radius: <span id="vrad"></span> m<input id="rad" type="range" min="0.1" max="1.6" step="0.05" value="0.7"></label>
<label>Speed: <span id="vsp"></span><input id="sp" type="range" min="0.2" max="3" step="0.1" value="1"></label>
</div>`;

const armJS = String.raw`
scene.background = new THREE.Color(0x10151f);
camera.position.set(4.5, 3.5, 5); controls.target.set(1.2, 1, 0);
addLights(10); addGround(15);
bindSliders(['l1', 'l2', 'rad', 'sp']);

const H = 0.8, HS = 1.1, GL = 0.3;       // base height, shoulder height, gripper length
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, H, 32), mat(0x4b5563, 0.4, 0.6));
base.position.y = H / 2; base.castShadow = true; scene.add(base);

const yawG = new THREE.Group(); yawG.position.y = H; scene.add(yawG);
const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32), mat(0x2563eb, 0.4, 0.5));
turret.position.y = 0.15; turret.castShadow = true; yawG.add(turret);

const shoulder = new THREE.Group(); shoulder.position.y = HS - H; yawG.add(shoulder);
const jointGeo = new THREE.SphereGeometry(0.16, 20, 20);
const jointMat = mat(0xfacc15, 0.3, 0.6);
shoulder.add(new THREE.Mesh(jointGeo, jointMat));

const boxGeo = new THREE.BoxGeometry(1, 0.2, 0.2);
const link1 = new THREE.Mesh(boxGeo, mat(0x3b82f6, 0.4, 0.5)); link1.castShadow = true; shoulder.add(link1);

const elbow = new THREE.Group(); shoulder.add(elbow);
elbow.add(new THREE.Mesh(jointGeo, jointMat));
const link2 = new THREE.Mesh(boxGeo, mat(0xf97316, 0.4, 0.5)); link2.castShadow = true; elbow.add(link2);

const wrist = new THREE.Group(); elbow.add(wrist);
wrist.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), jointMat));
const finger = (z) => {
  const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.04), mat(0x22c55e, 0.4, 0.4));
  f.position.set(0.15, 0, z); wrist.add(f);
};
finger(0.07); finger(-0.07);
const tip = new THREE.Object3D(); tip.position.set(GL, 0, 0); wrist.add(tip);

/* target + workspace ring + trail */
const targetMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x115522 }));
scene.add(targetMesh);
const ring = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 96),
  new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring);

const trail = [];
const tGeo = new THREE.BufferGeometry();
const tLine = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
tLine.frustumCulled = false; scene.add(tLine);

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
let t = 0, last = {};

function ik(x, y, z) {
  const L1 = +$('l1').value, L2 = +$('l2').value;
  const yaw = Math.atan2(z, x);
  const r = Math.hypot(x, z), dy = (y + GL) - HS;        // wrist point = target + gripper
  let d = Math.hypot(r, dy);
  const dmax = L1 + L2 - 0.01, dmin = Math.abs(L1 - L2) + 0.01;
  const reachable = d <= dmax && d >= dmin;
  d = clamp(d, dmin, dmax);
  const sh = Math.atan2(dy, r) + Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const inner = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  const el = -(Math.PI - inner);
  yawG.rotation.y = -yaw;
  shoulder.rotation.z = sh;
  elbow.position.x = L1; elbow.rotation.z = el;
  wrist.position.x = L2; wrist.rotation.z = -Math.PI / 2 - sh - el;   // gripper always points down
  link1.scale.x = L1; link1.position.x = L1 / 2;
  link2.scale.x = L2; link2.position.x = L2 / 2;
  ring.scale.setScalar(L1 + L2);
  last = { yaw, sh, el, reachable };
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  t += clock.getDelta();
  const R = +$('rad').value, a = t * +$('sp').value;
  const tg = new THREE.Vector3(1.6 + R * Math.cos(a), 1.0 + 0.5 * Math.sin(a * 1.7) + 0.3, R * Math.sin(a * 1.3));
  ik(tg.x, tg.y, tg.z);
  targetMesh.position.copy(tg);
  targetMesh.material.color.set(last.reachable ? 0x22c55e : 0xef4444);

  scene.updateMatrixWorld(true);
  const tp = new THREE.Vector3(); tip.getWorldPosition(tp);
  trail.push({ p: tp, h: (t * 0.1) % 1 });
  if (trail.length > 500) trail.shift();
  const pos = new Float32Array(trail.length * 3), col = new Float32Array(trail.length * 3);
  trail.forEach((q, i) => {
    pos[i * 3] = q.p.x; pos[i * 3 + 1] = q.p.y; pos[i * 3 + 2] = q.p.z;
    const c = new THREE.Color().setHSL(q.h, 1, 0.55);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  });
  tGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  tGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const deg = r => (r * 180 / Math.PI).toFixed(1);
  $('hud').textContent =
    'Base yaw : ' + deg(last.yaw) + ' deg\n' +
    'Shoulder : ' + deg(last.sh) + ' deg\n' +
    'Elbow    : ' + deg(last.el) + ' deg\n' +
    (last.reachable ? 'Target reachable' : '⚠ TARGET OUT OF REACH');
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   3) ARCHITECTURE: parametric building + sun study
   ========================================================= */
const bldUI = String.raw`<div id="ui"><b>🏢 Building + sun study</b>
<label>Floors: <span id="vfl"></span><input id="fl" type="range" min="2" max="40" step="1" value="12"></label>
<label>Width: <span id="vw"></span> m<input id="w" type="range" min="12" max="60" step="1" value="30"></label>
<label>Depth: <span id="vd"></span> m<input id="d" type="range" min="12" max="60" step="1" value="20"></label>
<label>Time of day: <span id="vhr"></span> h<input id="hr" type="range" min="5" max="19" step="0.25" value="14"></label>
<label><input id="xr" type="checkbox"> X-ray (structure dikhao)</label>
</div>`;

const bldJS = String.raw`
scene.background = new THREE.Color(0x87a7d6);
camera.position.set(55, 32, 60); controls.target.set(0, 12, 0);
bindSliders(['fl', 'w', 'd', 'hr']);

const hemi = new THREE.HemisphereLight(0xbcd7ff, 0x445566, 0.7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
{ const c = sun.shadow.camera; c.left = -80; c.right = 80; c.top = 80; c.bottom = -80; c.far = 300; }
scene.add(sun);
addGround(90, 0x6b7f6a);

/* surrounding city blocks (fixed random) */
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 45; i++) {
  const ang = rnd() * Math.PI * 2, r = 34 + rnd() * 45;
  const w = 5 + rnd() * 8, d = 5 + rnd() * 8, h = 6 + rnd() * 34;
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    mat(new THREE.Color().setHSL(0.6, 0.1 + 0.1 * rnd(), 0.35 + 0.3 * rnd()), 0.8, 0.1));
  b.position.set(Math.cos(ang) * r, h / 2, Math.sin(ang) * r);
  b.castShadow = true; b.receiveShadow = true; scene.add(b);
}

/* parametric building */
const FH = 3.4;
const bGroup = new THREE.Group(); scene.add(bGroup);
function box(w, h, d, m, x, y, z, shadow) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = shadow !== false; o.receiveShadow = true;
  bGroup.add(o); return o;
}

function build() {
  while (bGroup.children.length) {
    const o = bGroup.children[0]; bGroup.remove(o); if (o.geometry) o.geometry.dispose();
  }
  const n = +$('fl').value, W = +$('w').value, D = +$('d').value, xr = $('xr').checked;
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x4aa8ff, transparent: true, opacity: xr ? 0.07 : 0.38,
    roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false
  });
  const gh = FH - 0.35;
  for (let i = 0; i < n; i++) {
    const y = i * FH, gy = y + 0.35 + gh / 2;
    box(W, 0.35, D, mat(new THREE.Color().setHSL(0.08 + 0.5 * i / n, 0.4, 0.62), 0.8, 0), 0, y + 0.175, 0);
    box(W, gh, 0.08, glass, 0, gy, D / 2, false);
    box(W, gh, 0.08, glass, 0, gy, -D / 2, false);
    box(0.08, gh, D, glass, W / 2, gy, 0, false);
    box(0.08, gh, D, glass, -W / 2, gy, 0, false);
  }
  const H = n * FH;
  const nx = Math.max(2, Math.ceil(W / 6) + 1), nz = Math.max(2, Math.ceil(D / 6) + 1);
  const cm = mat(0x94a3b8, 0.5, 0.5);
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    box(0.5, H, 0.5, cm, -W / 2 + 0.3 + (W - 0.6) * i / (nx - 1), H / 2, -D / 2 + 0.3 + (D - 0.6) * k / (nz - 1));
  }
  box(W / 5, H + 3, D / 5, mat(0xb08968, 0.9, 0), 0, (H + 3) / 2, 0);            // lift core
  box(W + 0.6, 0.5, D + 0.6, mat(0x6b7280, 0.7, 0.1), 0, H + 0.25, 0);          // roof
  box(W / 4, 1.6, D / 4, mat(0xef4444, 0.6, 0.1), W / 5, H + 1.3, D / 5);        // plant room

  const gfa = W * D * n, glaz = 2 * (W + D) * gh * n;
  stats = 'Height   ' + H.toFixed(1) + ' m\n' +
          'GFA      ' + gfa.toFixed(0) + ' m2\n' +
          'Glazing  ' + glaz.toFixed(0) + ' m2\n' +
          'Columns  ' + (nx * nz) + ' (6 m grid)';
  sunUpdate();
}

let stats = '';
function sunUpdate() {
  const h = +$('hr').value, a = (h - 6) / 12 * Math.PI, s = Math.sin(a);
  sun.position.set(-Math.cos(a) * 90, Math.max(s, 0.03) * 90, 35);
  sun.intensity = Math.max(0.1, s * 2.2);
  hemi.intensity = 0.2 + 0.6 * Math.max(s, 0);
  scene.background.set(0x0a1020).lerp(new THREE.Color(0x87a7d6), Math.max(s, 0));
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  $('hud').textContent = stats + '\nTime     ' + hh + ':' + (mm < 10 ? '0' : '') + mm +
    '\nSun alt  ' + Math.max(0, Math.asin(Math.max(s, 0)) * 180 / Math.PI).toFixed(0) + ' deg (approx)';
}

['fl', 'w', 'd', 'xr'].forEach(id => $(id).addEventListener('input', build));
$('hr').addEventListener('input', sunUpdate);
build();

(function loop() {
  requestAnimationFrame(loop);
  controls.update();
  renderer.render(scene, camera);
})();
`;

/* =========================================================
   4) STRUCTURAL: truss bridge with moving load (strain colors)
   ========================================================= */
const trussUI = String.raw`<div id="ui"><b>🌉 Truss bridge</b>
<label>Vehicle load: <span id="vld"></span><input id="ld" type="range" min="0" max="400" step="5" value="100"></label>
<label>Member yield strain: <span id="vlim"></span> %<input id="lim" type="range" min="1" max="10" step="0.5" value="4"></label>
<label>Deflection x: <span id="vex"></span><input id="ex" type="range" min="1" max="100" step="1" value="25"></label>
<label>Vehicle position: <span id="vpos"></span> m<input id="pos" type="range" min="0" max="18" step="0.1" value="9"></label>
<label><input id="auto" type="checkbox" checked> Vehicle automatic chale</label>
<button id="rs">↺ Reset (toota hua fix)</button>
<div style="margin-top:6px;opacity:.8">Blue = tension, Red = compression, hidden = TOOTA hua member</div>
</div>`;

const trussJS = String.raw`
scene.background = new THREE.Color(0x9fc3e8);
scene.fog = new THREE.Fog(0x9fc3e8, 60, 200);
camera.position.set(9, 6, 17); controls.target.set(9, 0, 0);
addLights(30);
bindSliders(['ld', 'lim', 'ex', 'pos']);

const NP = 6, L = 3, HT = 3, ZW = 1.6, SPAN = NP * L;
const EA = 6000, SELF = 3, DT = 0.004, DAMP = 0.992, SUB = 25;

/* river + banks */
const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(0x1e5a8a, 0.2, 0.1));
water.rotation.x = -Math.PI / 2; water.position.y = -5; water.receiveShadow = true; scene.add(water);
[-6, SPAN + 6].forEach(x => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 12), mat(0x7c5c3b, 0.95, 0));
  b.position.set(x, -2.5, 0); b.receiveShadow = true; b.castShadow = true; scene.add(b);
});

/* topology (Warren truss, statically determinate) */
const nodes = [];
for (let i = 0; i <= NP; i++) nodes.push({ x0: i * L, y0: 0 });
for (let i = 0; i < NP; i++) nodes.push({ x0: (i + 0.5) * L, y0: HT });
nodes[0].fx = true; nodes[0].fy = true; nodes[NP].fy = true;      // pin + roller

const cyl = new THREE.CylinderGeometry(0.07, 0.07, 1, 10);
const mem = [];
function add(a, b) {
  const m = { a, b, L0: Math.hypot(nodes[a].x0 - nodes[b].x0, nodes[a].y0 - nodes[b].y0), broken: false, strain: 0 };
  m.meshes = [-ZW, ZW].map(z => {
    const o = new THREE.Mesh(cyl, mat(0x9aa5b1, 0.5, 0.6));
    o.castShadow = true; o.userData.z = z; scene.add(o); return o;
  });
  mem.push(m);
}
for (let i = 0; i < NP; i++) add(i, i + 1);                         // bottom chord
for (let i = 0; i < NP - 1; i++) add(NP + 1 + i, NP + 2 + i);       // top chord
for (let i = 0; i < NP; i++) { add(i, NP + 1 + i); add(NP + 1 + i, i + 1); }   // diagonals

/* cross beams, deck, supports, vehicle */
const cross = nodes.map(() => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2 * ZW, 8), mat(0x64748b, 0.5, 0.6));
  o.rotation.x = Math.PI / 2; scene.add(o); return o;
});
const deck = [];
for (let i = 0; i < NP; i++) {
  const d = new THREE.Mesh(new THREE.BoxGeometry(L, 0.12, 2 * ZW + 0.4), mat(0x475569, 0.8, 0.1));
  d.receiveShadow = true; d.castShadow = true; scene.add(d); deck.push(d);
}
const pin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 4), mat(0xfacc15, 0.4, 0.3));
pin.position.set(0, -0.5, 0); pin.rotation.y = Math.PI / 4; scene.add(pin);
const roller = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), mat(0xfacc15, 0.4, 0.3));
roller.position.set(SPAN, -0.45, 0); scene.add(roller);

const vehicle = new THREE.Group(); scene.add(vehicle);
const vb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.6), mat(0xdc2626, 0.5, 0.3)); vb.castShadow = true; vehicle.add(vb);
const vc = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.4), mat(0x1e293b, 0.3, 0.5)); vc.position.set(0.3, 0.5, 0); vehicle.add(vc);

function reset() {
  nodes.forEach(n => { n.x = n.x0; n.y = n.y0; n.vx = 0; n.vy = 0; });
  mem.forEach(m => { m.broken = false; m.strain = 0; m.meshes.forEach(o => { o.visible = true; }); });
}
reset();
$('rs').addEventListener('click', reset);

let xv = 9, dirV = 1;

function step() {
  const P = +$('ld').value, lim = +$('lim').value / 100;
  nodes.forEach(n => { n.fxn = 0; n.fyn = -SELF; });
  for (const m of mem) {
    if (m.broken) continue;
    const A = nodes[m.a], B = nodes[m.b];
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    m.strain = (len - m.L0) / m.L0;
    if (Math.abs(m.strain) > lim) { m.broken = true; m.meshes.forEach(o => { o.visible = false; }); continue; }
    const F = EA * m.strain, fx = F * dx / len, fy = F * dy / len;
    A.fxn += fx; A.fyn += fy; B.fxn -= fx; B.fyn -= fy;
  }
  const u = Math.min(Math.max(xv / L, 0), NP - 1e-6), i = Math.floor(u), f = u - i;
  nodes[i].fyn -= P * (1 - f); nodes[i + 1].fyn -= P * f;
  for (const n of nodes) {
    if (!n.fx) { n.vx = (n.vx + n.fxn * DT) * DAMP; n.x += n.vx * DT; } else n.vx = 0;
    if (!n.fy) { n.vy = (n.vy + n.fyn * DT) * DAMP; n.y += n.vy * DT; } else n.vy = 0;
  }
}

const Y = new THREE.Vector3(0, 1, 0);
function place(mesh, a, b) {
  const d = b.clone().sub(a), len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(Y, d.normalize());
  mesh.scale.set(1, len, 1);
}

const gcol = new THREE.Color(0xbac4cf), tcol = new THREE.Color(0x2563eb), ccol = new THREE.Color(0xef4444);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dtF = Math.min(clock.getDelta(), 0.05);
  if ($('auto').checked) {
    xv += dirV * 1.5 * dtF;
    if (xv > SPAN) { xv = SPAN; dirV = -1; }
    if (xv < 0) { xv = 0; dirV = 1; }
    $('pos').value = xv.toFixed(1); $('vpos').textContent = xv.toFixed(1);
  } else xv = +$('pos').value;

  for (let s = 0; s < SUB; s++) step();

  const sc = +$('ex').value, lim = +$('lim').value / 100;
  const dp = nodes.map(n => ({ x: n.x0 + (n.x - n.x0) * sc, y: n.y0 + (n.y - n.y0) * sc }));
  let maxS = 0, broken = 0;
  for (const m of mem) {
    if (m.broken) { broken++; continue; }
    maxS = Math.max(maxS, Math.abs(m.strain));
    const col = gcol.clone().lerp(m.strain > 0 ? tcol : ccol, Math.min(Math.abs(m.strain) / lim, 1));
    m.meshes.forEach(o => {
      o.material.color.copy(col);
      place(o, new THREE.Vector3(dp[m.a].x, dp[m.a].y, o.userData.z), new THREE.Vector3(dp[m.b].x, dp[m.b].y, o.userData.z));
    });
  }
  cross.forEach((o, i) => o.position.set(dp[i].x, dp[i].y, 0));
  deck.forEach((d, i) => {
    const a = dp[i], b = dp[i + 1];
    d.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.1, 0);
    d.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    d.scale.x = Math.hypot(b.x - a.x, b.y - a.y) / L;
  });
  const u = Math.min(Math.max(xv / L, 0), NP - 1e-6), i = Math.floor(u), f = u - i;
  vehicle.position.set(dp[i].x + (dp[i + 1].x - dp[i].x) * f, dp[i].y + (dp[i + 1].y - dp[i].y) * f + 0.55, 0);
  vehicle.rotation.z = Math.atan2(dp[i + 1].y - dp[i].y, dp[i + 1].x - dp[i].x);

  const defl = nodes[NP / 2].y - nodes[NP / 2].y0, util = maxS / lim;
  $('hud').textContent =
    'Max strain  ' + (maxS * 100).toFixed(2) + ' %  (utilisation ' + (util * 100).toFixed(0) + ' %)\n' +
    'Mid deflect ' + defl.toFixed(3) + ' m (real)\n' +
    'Broken      ' + broken + ' member(s)\n' +
    (broken > 0 ? '🔴 STRUCTURE DAMAGED' : util > 0.8 ? '🟠 WARNING: near yield' : '🟢 SAFE');
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

/* =========================================================
   Python 3D examples (Plotly)
   ========================================================= */
const pyDrone = String.raw`import numpy as np

kp   = float(PARAMS.get("kp", 1.4))
kd   = float(PARAMS.get("kd", 1.8))
amax = float(PARAMS.get("amax", 6))
wind = float(PARAMS.get("wind", 1.5))
wps  = np.array(DATA["waypoints"], dtype=float)      # [x, altitude, z]

p = wps[0].copy(); v = np.zeros(3)
dt, t, i = 0.02, 0.0, 1
path = [p.copy()]; spd = [0.0]

while i < len(wps) and t < 120:
    a = kp * (wps[i] - p) - kd * v
    n = np.linalg.norm(a)
    if n > amax:
        a = a * (amax / n)
    w = np.array([np.sin(0.3 * t) * wind, 0.0, np.cos(0.21 * t) * wind * 0.6])
    a = a + 0.25 * (w - v)
    v = v + a * dt
    p = p + v * dt
    t += dt
    if np.linalg.norm(wps[i] - p) < 0.5:
        i += 1
    path.append(p.copy()); spd.append(float(np.linalg.norm(v)))

path = np.array(path)
dist = float(np.sum(np.linalg.norm(np.diff(path, axis=0), axis=1)))
print("Flight time :", round(t, 1), "s")
print("Distance    :", round(dist, 1), "m")
print("Max speed   :", round(max(spd), 2), "m/s")
print("Waypoints hit:", i - 1, "/", len(wps) - 1)

show_plot({
  "data": [
    {"type": "scatter3d", "mode": "lines", "name": "flight path",
     "x": path[:, 0].tolist(), "y": path[:, 2].tolist(), "z": path[:, 1].tolist(),
     "line": {"width": 7, "color": spd, "colorscale": "Turbo", "colorbar": {"title": "m/s"}}},
    {"type": "scatter3d", "mode": "markers+text", "name": "waypoints",
     "x": wps[:, 0].tolist(), "y": wps[:, 2].tolist(), "z": wps[:, 1].tolist(),
     "text": [str(k) for k in range(len(wps))],
     "marker": {"size": 6, "color": "white"}}
  ],
  "layout": {"title": "Drone 3D flight path (speed colored)",
             "scene": {"aspectmode": "data", "bgcolor": "rgba(0,0,0,0)",
                       "xaxis": {"title": "X (m)"}, "yaxis": {"title": "Z (m)"},
                       "zaxis": {"title": "Altitude (m)"}}}
})
`;

const pyPlate = String.raw`import numpy as np

a  = float(PARAMS.get("a", 2.0))        # plate length (m)
b  = float(PARAMS.get("b", 1.5))        # plate width (m)
q  = float(PARAMS.get("q", 5000))       # uniform pressure (N/m2)
t  = float(PARAMS.get("t", 0.02))       # thickness (m)
E  = float(PARAMS.get("E", 200e9))      # Young's modulus (Pa)
nu = float(PARAMS.get("nu", 0.3))

D = E * t**3 / (12 * (1 - nu**2))
x = np.linspace(0, a, 41); y = np.linspace(0, b, 41)
X, Y = np.meshgrid(x, y)
w = np.zeros_like(X)
for m in range(1, 20, 2):
    for n in range(1, 20, 2):
        w += (16 * q / (np.pi**6 * D * m * n * (m**2 / a**2 + n**2 / b**2) ** 2)
              * np.sin(m * np.pi * X / a) * np.sin(n * np.pi * Y / b))

wmm = w * 1000
print("Flexural rigidity D :", round(D, 1), "N.m")
print("Max deflection      :", round(float(wmm.max()), 4), "mm (centre)")
print("Span/deflection     :", round(min(a, b) / float(w.max())))

show_plot({
  "data": [{"type": "surface", "x": x.tolist(), "y": y.tolist(), "z": (-wmm).tolist(),
            "colorscale": "Jet", "colorbar": {"title": "w (mm)"},
            "contours": {"z": {"show": True, "usecolormap": True, "project": {"z": True}}}}],
  "layout": {"title": "Simply supported plate - deflection (Navier series)",
             "scene": {"bgcolor": "rgba(0,0,0,0)",
                       "xaxis": {"title": "x (m)"}, "yaxis": {"title": "y (m)"},
                       "zaxis": {"title": "deflection (mm)"}}}
})
`;

/* ---------- register in dropdown ---------- */
const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
E.python = E.python || [];

E.html.unshift(
  { name: "3D Drone - quadcopter (wind, mass, motor limit)", code: page(droneUI, droneJS) },
  { name: "3D Robotic arm - inverse kinematics",              code: page(armUI, armJS) },
  { name: "3D Architecture - parametric building + sun",      code: page(bldUI, bldJS) },
  { name: "3D Structural - truss bridge, strain colors",      code: page(trussUI, trussJS) }
);

E.python.push(
  { name: "3D Drone waypoint path (Plotly, colored)",
    params: { kp: 1.4, kd: 1.8, amax: 6, wind: 1.5 },
    json: { waypoints: [[0, 2, 0], [8, 6, 0], [8, 4, 8], [-6, 7, 6], [-8, 3, -6], [0, 2, 0]] },
    code: pyDrone },
  { name: "3D Plate deflection surface (engineering)",
    params: { a: 2.0, b: 1.5, q: 5000, t: 0.02, E: 200000000000, nu: 0.3 },
    code: pyPlate }
);

})();
