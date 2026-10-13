/* =========================================================
   SIM LAB - examples3d3.js
   Advanced drone: rigid body + cascaded PID + motor failure
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
#ui{position:absolute;top:8px;left:8px;width:230px;max-height:75vh;overflow:auto;background:rgba(0,0,0,.6);padding:8px 10px;border-radius:8px;font-size:12px}
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
`;

function page(ui, js) {
  return HEAD + ui + '\n<div id="hud"></div>\n<script type="module">\n' + COMMON + js +
         '\n</' + 'script>\n</body>\n</html>\n';
}

const UI = String.raw`<div id="ui"><b>🚁 Drone PID + motor failure</b>
<label>Mass: <span id="vm"></span> kg<input id="m" type="range" min="0.5" max="5" step="0.1" value="1.5"></label>
<label>Thrust/weight ratio: <span id="vtwr"></span><input id="twr" type="range" min="1.3" max="4" step="0.1" value="2.5"></label>
<label>Wind: <span id="vwind"></span> m/s<input id="wind" type="range" min="0" max="10" step="0.5" value="2"></label>
<label>Position gain: <span id="vkp"></span><input id="kp" type="range" min="0.5" max="6" step="0.1" value="2.5"></label>
<label>Attitude bandwidth: <span id="vatt"></span> rad/s<input id="att" type="range" min="4" max="30" step="1" value="14"></label>
<div style="margin-top:6px"><b>Motor fail:</b></div>
<button id="k0" style="border-left:6px solid #ff3355">M1</button><button id="k1" style="border-left:6px solid #ff3355">M2</button><button id="k2" style="border-left:6px solid #22d3ee">M3</button><button id="k3" style="border-left:6px solid #22d3ee">M4</button>
<br><button id="rest">Restore motors</button><button id="gust">💨 Gust</button><button id="rs">↺ Reset</button>
<div style="margin-top:6px;opacity:.8">Controller motor-fail ko handle NAHI karta (quad me ek motor gaya to yaw/tilt control chala jata hai). Isi se dikhta hai kyun redundancy (hexa/octo) use hoti hai.</div>
</div>`;

const JS = String.raw`
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x0b1020, 50, 160);
camera.position.set(9, 6, 11);
addLights(25); addGround(60);
bindSliders(['m', 'twr', 'wind', 'kp', 'att']);

const G = 9.81, D = 0.15, KY = 0.02;          // D = motor offset per axis (m), KY = yaw torque per N
const MOT = [{ x: 1, z: 1, s: 1 }, { x: -1, z: 1, s: -1 }, { x: -1, z: -1, s: 1 }, { x: 1, z: -1, s: -1 }];
const MCOL = [0xff3355, 0xff3355, 0x22d3ee, 0x22d3ee];

/* ---------- 3D model (visual scale = 3x) ---------- */
const drone = new THREE.Group(); drone.scale.setScalar(3); scene.add(drone);
const body = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.17), mat(0xff7a1a)); body.castShadow = true; drone.add(body);
const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.08), mat(0x22c55e)); nose.position.set(0, 0.0, -0.1); drone.add(nose);
const rotors = [];
MOT.forEach((mo, i) => {
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.02), mat(0x222831));
  arm.position.set(mo.x * D * 0.5, 0, mo.z * D * 0.5);
  arm.rotation.y = Math.atan2(-mo.z, mo.x); drone.add(arm);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16), mat(0x888888, 0.3, 0.9));
  motor.position.set(mo.x * D, 0.02, mo.z * D); drone.add(motor);
  const rm = mat(MCOL[i], 0.5, 0.1);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.005, 0.025), rm);
  rotor.position.set(mo.x * D, 0.05, mo.z * D); rotor.castShadow = true; drone.add(rotor);
  rotors.push({ mesh: rotor, mat: rm, color: MCOL[i], dir: mo.s });
});

/* ---------- waypoints ---------- */
const wps = [[0, 4, 0], [8, 6, 0], [8, 4, 8], [-8, 7, 8], [-8, 3, -6], [0, 5, -8]].map(a => new THREE.Vector3(a[0], a[1], a[2]));
wps.forEach((w, i) => {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(i / wps.length, 0.9, 0.55), emissive: new THREE.Color().setHSL(i / wps.length, 0.9, 0.3) }));
  s.position.copy(w); scene.add(s);
});

/* ---------- trail (speed colored) ---------- */
const trail = [];
const tGeo = new THREE.BufferGeometry();
const tLine = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
tLine.frustumCulled = false; scene.add(tLine);
function drawTrail() {
  const pos = new Float32Array(trail.length * 3), col = new Float32Array(trail.length * 3), c = new THREE.Color();
  trail.forEach((q, i) => {
    pos[i * 3] = q.p.x; pos[i * 3 + 1] = q.p.y; pos[i * 3 + 2] = q.p.z;
    c.setHSL(0.66 - Math.min(q.s / 8, 1) * 0.66, 1, 0.55);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  });
  tGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  tGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

/* ---------- simulation state ---------- */
const p = new THREE.Vector3(0, 0.05, 0), v = new THREE.Vector3(), w = new THREE.Vector3();
const q = new THREE.Quaternion();
const T = [0, 0, 0, 0], alive = [true, true, true, true];
const integ = new THREE.Vector3();
let wi = 0, t = 0, gust = 0, airborne = false, crashed = false, impact = 0, sat = false, Tmax = 1, accum = 0;

function reset() {
  p.set(0, 0.05, 0); v.set(0, 0, 0); w.set(0, 0, 0); q.identity();
  T.fill(0); alive.fill(true); integ.set(0, 0, 0);
  wi = 0; t = 0; gust = 0; airborne = false; crashed = false; impact = 0; trail.length = 0;
}
reset();
[0, 1, 2, 3].forEach(i => $('k' + i).addEventListener('click', () => { alive[i] = false; }));
$('rest').addEventListener('click', () => alive.fill(true));
$('gust').addEventListener('click', () => { gust = 12; });
$('rs').addEventListener('click', reset);

const UP = new THREE.Vector3(0, 1, 0);
const bUp = new THREE.Vector3(), a = new THREE.Vector3(), f = new THREE.Vector3(), dUp = new THREE.Vector3();
const eW = new THREE.Vector3(), qi = new THREE.Quaternion(), dq = new THREE.Quaternion();
const Iw = new THREE.Vector3(), gyro = new THREE.Vector3(), wv = new THREE.Vector3();

function step(dt) {
  const m = V('m'), kp = V('kp'), kd = 1.8 * Math.sqrt(kp), wn = V('att');
  const Ix = m * 0.02, Iy = m * 0.04, Iz = m * 0.02;
  Tmax = V('twr') * m * G / 4;
  t += dt;

  if (p.distanceTo(wps[wi]) < 0.6) wi = (wi + 1) % wps.length;

  /* --- outer loop: position PID -> desired acceleration --- */
  const e = wps[wi].clone().sub(p);
  integ.addScaledVector(e, dt); if (integ.length() > 3) integ.setLength(3);
  a.copy(e).multiplyScalar(kp).addScaledVector(v, -kd).addScaledVector(integ, 0.6);
  const h = Math.hypot(a.x, a.z); if (h > 6) { a.x *= 6 / h; a.z *= 6 / h; }
  a.y = Math.min(7, Math.max(-5, a.y));
  f.copy(a); f.y += G; f.multiplyScalar(m);                    // desired force vector (N)

  /* --- middle loop: attitude PD (tilt) + yaw rate damping --- */
  bUp.copy(UP).applyQuaternion(q);
  const Tcmd = Math.max(0, f.dot(bUp));
  dUp.copy(f).normalize();
  eW.copy(bUp).cross(dUp);
  qi.copy(q).invert(); eW.applyQuaternion(qi);                  // error in body frame
  const tx = Ix * (wn * wn * eW.x - 1.6 * wn * w.x);
  const tz = Iz * (wn * wn * eW.z - 1.6 * wn * w.z);
  const ty = Iy * (-4 * w.y);

  /* --- mixer: (thrust, torques) -> 4 motor thrusts --- */
  sat = false;
  for (let i = 0; i < 4; i++) {
    const mo = MOT[i];
    let c = Tcmd / 4 - mo.z * tx / (4 * D) + mo.x * tz / (4 * D) + mo.s * ty / (4 * KY);
    if (c >= Tmax) sat = true;
    c = Math.min(Tmax, Math.max(0, c));
    if (!alive[i]) c = 0;
    T[i] += (c - T[i]) * (1 - Math.exp(-dt / 0.03));             // motor lag 30 ms
    if (!alive[i]) T[i] = 0;
  }

  /* --- rigid body dynamics --- */
  const Tt = T[0] + T[1] + T[2] + T[3];
  let txA = 0, tzA = 0, tyA = 0;
  for (let i = 0; i < 4; i++) { txA += -MOT[i].z * D * T[i]; tzA += MOT[i].x * D * T[i]; tyA += MOT[i].s * KY * T[i]; }
  Iw.set(Ix * w.x, Iy * w.y, Iz * w.z);
  gyro.copy(w).cross(Iw);
  w.x += (txA - gyro.x) / Ix * dt;
  w.y += (tyA - gyro.y) / Iy * dt;
  w.z += (tzA - gyro.z) / Iz * dt;
  if (w.length() > 1e-9) { dq.setFromAxisAngle(w.clone().normalize(), w.length() * dt); q.multiply(dq).normalize(); }

  gust *= Math.exp(-dt / 1.0);
  const W = V('wind');
  wv.set(Math.sin(t * 0.3) * W + gust, 0, Math.cos(t * 0.21) * W * 0.6);
  bUp.copy(UP).applyQuaternion(q);
  const acc = bUp.multiplyScalar(Tt / m);
  acc.y -= G;
  acc.addScaledVector(wv.sub(v), 0.3 / m);                      // aerodynamic drag vs wind
  v.addScaledVector(acc, dt);
  p.addScaledVector(v, dt);

  /* --- ground --- */
  if (p.y > 1) airborne = true;
  if (p.y < 0.05) {
    if (airborne) { crashed = true; impact = v.length(); }
    p.y = 0.05; if (v.y < 0) v.y = 0; v.x *= 0.9; v.z *= 0.9;
  }
}

const bar = x => { const n = Math.max(0, Math.min(10, Math.round(x * 10))); return '█'.repeat(n) + '░'.repeat(10 - n); };
const eul = new THREE.Euler();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  accum += Math.min(clock.getDelta(), 0.05);
  const DT = 1 / 250;
  while (accum >= DT) { if (!crashed) step(DT); accum -= DT; }

  drone.position.copy(p);
  drone.quaternion.copy(q);
  rotors.forEach((r, i) => {
    if (alive[i]) { r.mesh.rotation.y += r.dir * (0.2 + 2.5 * T[i] / Tmax); r.mat.color.setHex(r.color); }
    else r.mat.color.setHex(0x333333);
  });
  if (!crashed) {
    trail.push({ p: p.clone(), s: v.length() });
    if (trail.length > 900) trail.shift();
    drawTrail();
  }
  controls.target.lerp(p, 0.05); controls.update();

  eul.setFromQuaternion(q, 'YXZ');
  const d = r => (r * 180 / Math.PI).toFixed(0);
  const dead = alive.map((x, i) => x ? '' : 'M' + (i + 1)).filter(Boolean).join(' ');
  $('hud').textContent =
    'Alt ' + p.y.toFixed(1) + ' m   Speed ' + v.length().toFixed(1) + ' m/s   WP ' + (wi + 1) + '/' + wps.length + '\n' +
    'Roll ' + d(eul.z) + '   Pitch ' + d(eul.x) + '   Yaw rate ' + (w.y * 57.3).toFixed(0) + ' deg/s\n' +
    'M1 ' + bar(T[0] / Tmax) + '  M2 ' + bar(T[1] / Tmax) + '\n' +
    'M3 ' + bar(T[2] / Tmax) + '  M4 ' + bar(T[3] / Tmax) + '\n' +
    (crashed ? '💥 CRASHED, impact ' + impact.toFixed(1) + ' m/s  (Reset dabao)'
             : dead ? '🔴 MOTOR FAILED: ' + dead
             : sat ? '🟠 MOTOR SATURATION (thrust limit)' : '🟢 NORMAL');
  renderer.render(scene, camera);
}
animate();
`;

const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
E.html.splice(Math.min(8, E.html.length), 0,
  { name: "3D Drone PRO - PID + motor failure + gust", code: page(UI, JS) });

})();
