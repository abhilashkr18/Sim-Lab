/* SIM LAB - examples_drones.js : 6 drone technology / robotics / future-idea simulations for HTML (Three.js).
   Load AFTER examples.js and BEFORE app.js. */
(function () {
const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
E.html.push({
  name: "\ud83d\ude81 Drone Anatomy - how a quadcopter flies",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Drone Anatomy - how a quadcopter flies</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#000;color:#dfe;font-family:system-ui,sans-serif}
#hud{position:fixed;left:8px;top:8px;background:rgba(0,0,0,.55);padding:8px 10px;border-radius:10px;font-size:12px;width:190px;z-index:5}
#hud b{font-size:14px}#hud label{display:block;margin-top:6px}#hud input[type=range]{width:100%}
#hud button{margin-top:6px;padding:6px 10px;border:0;border-radius:6px;background:#2563eb;color:#fff}
canvas{display:block;touch-action:none}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body>
<div id="hud">
<b>Quadcopter: how it flies</b><br>Mixer: stick &rarr; 4 motor speeds
<label>Throttle <input id="th" type="range" min="0" max="1" step="0.01" value="0.5"></label>
<label>Roll (left/right) <input id="ro" type="range" min="-1" max="1" step="0.01" value="0"></label>
<label>Pitch (fwd/back) <input id="pi" type="range" min="-1" max="1" step="0.01" value="0"></label>
<label>Yaw (turn) <input id="ya" type="range" min="-1" max="1" step="0.01" value="0"></label>
<div id="bars" style="margin-top:8px"></div>
<button id="rs">Reset sticks</button>
<div id="info" style="margin-top:6px;color:#9fc;line-height:1.35"></div>
</div>

<script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $ = id => document.getElementById(id);
const SH = id => document.getElementById(id).textContent;
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1, 0.6, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
function glowSprite(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.15, 'rgba(' + r + ',' + g + ',' + b + ',0.9)');
  gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
}
function starField(n, R) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
    p[i * 3] = R * s * Math.cos(a); p[i * 3 + 1] = R * u; p[i * 3 + 2] = R * s * Math.sin(a);
    const k = 0.35 + Math.random() * 0.65, w = Math.random();
    c[i * 3] = k * (0.75 + 0.25 * w); c[i * 3 + 1] = k * 0.88; c[i * 3 + 2] = k * (1 - 0.25 * w);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({size: 2, vertexColors: true, sizeAttenuation: false, depthWrite: false}));
}
let tickFn = () => {};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  tickFn(t, dt); controls.update(); composer.render();
});

// ---- procedural quadcopter model (front = -Z) ----
function makeDrone(size, tint) {
  const g = new THREE.Group(), props = [];
  const dark = new THREE.MeshStandardMaterial({color: 0x161a22, roughness: 0.45, metalness: 0.5});
  const shell = new THREE.MeshStandardMaterial({color: tint || 0xe8eef7, roughness: 0.3, metalness: 0.2});
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.6), shell));
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, 6.2832, 0, 1.5708), shell);
  top.scale.set(1.2, 0.55, 0.9); top.position.y = 0.11; g.add(top);
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), dark); cam.position.set(0, -0.1, -0.33); g.add(cam);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({color: 0x66ccff}));
  lens.position.set(0, -0.1, -0.43); g.add(lens);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => {
    const x = c[0] * 0.95, z = c[1] * 0.95, L = Math.hypot(x, z);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.12), dark);
    arm.position.set(x / 2, 0, z / 2); arm.rotation.y = -Math.atan2(z, x); g.add(arm);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 16), dark); motor.position.set(x, 0.08, z); g.add(motor);
    const p = new THREE.Group(); p.position.set(x, 0.19, z);
    p.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.012, 0.09), new THREE.MeshStandardMaterial({color: 0x2a313d})));
    p.add(new THREE.Mesh(new THREE.CircleGeometry(0.56, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({color: 0x66ccff, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false})));
    p.userData.dir = (i === 0 || i === 3) ? 1 : -1; props.push(p); g.add(p);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({color: c[1] < 0 ? 0xff3355 : 0x33ff88}));
    led.position.set(x, 0.0, z * 1.08); led.material.color.multiplyScalar(3); g.add(led);
  });
  [-0.35, 0.35].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9), dark); s.position.set(x, -0.28, 0); g.add(s);
    [-0.3, 0.3].forEach(z => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), dark); l.position.set(x, -0.17, z); g.add(l); }); });
  g.scale.setScalar(size || 1);
  return {g, props};
}
function lights() {
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x223044, 1.1));
  const d = new THREE.DirectionalLight(0xfff0d8, 2.4); d.position.set(8, 14, 6); scene.add(d);
}

camera.position.set(6, 4.5, 8); controls.target.set(0, 2, 0); controls.maxPolarAngle = Math.PI * 0.52;
scene.background = new THREE.Color(0x0b1220); scene.fog = new THREE.Fog(0x0b1220, 25, 70);
lights();
bloom.strength = 0.35; bloom.threshold = 0.6;
scene.add(new THREE.Mesh(new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: 0x16202e, roughness: 0.9})));
const grid = new THREE.GridHelper(60, 60, 0x2f6ea5, 0x1b2c42); grid.position.y = 0.01; scene.add(grid);
const D = makeDrone(1.4); const drone = new THREE.Group(); drone.add(D.g); scene.add(drone);
// thrust cones above every rotor (length = motor command)
const cones = D.props.map(p => {
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1, 14).translate(0, 0.5, 0).rotateX(Math.PI),
    new THREE.MeshBasicMaterial({color: 0xffb020, transparent: true, opacity: 0.85}));
  c.position.copy(p.position); c.position.y = -0.1; D.g.add(c); return c;
});
const names = ['Front-Left', 'Front-Right', 'Back-Left', 'Back-Right'];
const bars = $('bars'), fill = [];
names.forEach((n, i) => {
  const r = document.createElement('div'); r.style.cssText = 'font-size:11px;margin-top:3px';
  r.innerHTML = n + (D.props[i].userData.dir > 0 ? ' (CW)' : ' (CCW)') + '<div style="background:#223;height:8px;border-radius:4px"><div style="height:8px;border-radius:4px;background:#fb2;width:50%"></div></div>';
  bars.appendChild(r); fill.push(r.querySelector('div > div'));
});
$('rs').onclick = () => { $('th').value = 0.5; $('ro').value = 0; $('pi').value = 0; $('ya').value = 0; };
let yaw = 0, vy = 0, shake = 0;
tickFn = (t, dt) => {
  const T = +$('th').value, r = +$('ro').value, p = +$('pi').value, y = +$('ya').value;
  // X-quad mixer: FL FR BL BR (front = -Z, nose-down pitch = p > 0)
  const m = [T - p * 0.5 + r * 0.5 - y * 0.4, T - p * 0.5 - r * 0.5 + y * 0.4, T + p * 0.5 + r * 0.5 + y * 0.4, T + p * 0.5 - r * 0.5 - y * 0.4].map(v => Math.min(1, Math.max(0, v)));
  m.forEach((v, i) => {
    D.props[i].rotation.y += D.props[i].userData.dir * (6 + v * 70) * dt;
    cones[i].scale.set(1, 0.2 + v * 1.8, 1);
    fill[i].style.width = (v * 100).toFixed(0) + '%';
  });
  const avg = m.reduce((a, b) => a + b, 0) / 4;
  vy += ((avg - 0.5) * 6 - vy * 1.5) * dt;
  drone.position.y = Math.min(9, Math.max(0.5, drone.position.y + vy * dt));
  yaw -= y * 1.6 * dt;
  const sp = p * 5, st = r * 5;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  drone.position.x = Math.max(-22, Math.min(22, drone.position.x + (fx * sp + rx * st) * dt));
  drone.position.z = Math.max(-22, Math.min(22, drone.position.z + (fz * sp + rz * st) * dt));
  const onGround = drone.position.y <= 0.52;
  drone.rotation.set(onGround ? 0 : -p * 0.45, yaw, onGround ? 0 : -r * 0.45, 'YXZ');
  D.g.position.y = Math.sin(t * 30) * 0.004 * avg;
  controls.target.lerp(drone.position, 0.08);
  $('info').innerHTML = 'Lift: ' + (avg > 0.5 ? 'climbing' : avg < 0.5 ? 'descending' : 'hover') +
    '<br>Pitch: front motors slow, back fast = nose down = fly forward.<br>Yaw: CW and CCW props speed differently (torque).';
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude81 PID Flight Controller Lab",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>PID Flight Controller Lab</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#000;color:#dfe;font-family:system-ui,sans-serif}
#hud{position:fixed;left:8px;top:8px;background:rgba(0,0,0,.55);padding:8px 10px;border-radius:10px;font-size:12px;width:190px;z-index:5}
#hud b{font-size:14px}#hud label{display:block;margin-top:6px}#hud input[type=range]{width:100%}
#hud button{margin-top:6px;padding:6px 10px;border:0;border-radius:6px;background:#2563eb;color:#fff}
canvas{display:block;touch-action:none}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body>
<div id="hud">
<b>PID Flight Controller Lab</b><br>Tune the altitude controller
<label>Kp (reaction): <span id="vp">14</span><input id="kp" type="range" min="0" max="60" step="0.5" value="14"></label>
<label>Ki (memory): <span id="vi">4</span><input id="ki" type="range" min="0" max="30" step="0.5" value="4"></label>
<label>Kd (damping): <span id="vd">7</span><input id="kd" type="range" min="0" max="20" step="0.5" value="7"></label>
<button id="p1">Only P</button> <button id="p2">Soft</button> <button id="p3">Good</button> <button id="p4">Wild</button>
<button id="gust">Wind gust</button>
<div id="stat" style="margin-top:6px;color:#9fc"></div>
</div>

<script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $ = id => document.getElementById(id);
const SH = id => document.getElementById(id).textContent;
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1, 0.6, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
function glowSprite(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.15, 'rgba(' + r + ',' + g + ',' + b + ',0.9)');
  gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
}
function starField(n, R) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
    p[i * 3] = R * s * Math.cos(a); p[i * 3 + 1] = R * u; p[i * 3 + 2] = R * s * Math.sin(a);
    const k = 0.35 + Math.random() * 0.65, w = Math.random();
    c[i * 3] = k * (0.75 + 0.25 * w); c[i * 3 + 1] = k * 0.88; c[i * 3 + 2] = k * (1 - 0.25 * w);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({size: 2, vertexColors: true, sizeAttenuation: false, depthWrite: false}));
}
let tickFn = () => {};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  tickFn(t, dt); controls.update(); composer.render();
});

// ---- procedural quadcopter model (front = -Z) ----
function makeDrone(size, tint) {
  const g = new THREE.Group(), props = [];
  const dark = new THREE.MeshStandardMaterial({color: 0x161a22, roughness: 0.45, metalness: 0.5});
  const shell = new THREE.MeshStandardMaterial({color: tint || 0xe8eef7, roughness: 0.3, metalness: 0.2});
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.6), shell));
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, 6.2832, 0, 1.5708), shell);
  top.scale.set(1.2, 0.55, 0.9); top.position.y = 0.11; g.add(top);
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), dark); cam.position.set(0, -0.1, -0.33); g.add(cam);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({color: 0x66ccff}));
  lens.position.set(0, -0.1, -0.43); g.add(lens);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => {
    const x = c[0] * 0.95, z = c[1] * 0.95, L = Math.hypot(x, z);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.12), dark);
    arm.position.set(x / 2, 0, z / 2); arm.rotation.y = -Math.atan2(z, x); g.add(arm);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 16), dark); motor.position.set(x, 0.08, z); g.add(motor);
    const p = new THREE.Group(); p.position.set(x, 0.19, z);
    p.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.012, 0.09), new THREE.MeshStandardMaterial({color: 0x2a313d})));
    p.add(new THREE.Mesh(new THREE.CircleGeometry(0.56, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({color: 0x66ccff, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false})));
    p.userData.dir = (i === 0 || i === 3) ? 1 : -1; props.push(p); g.add(p);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({color: c[1] < 0 ? 0xff3355 : 0x33ff88}));
    led.position.set(x, 0.0, z * 1.08); led.material.color.multiplyScalar(3); g.add(led);
  });
  [-0.35, 0.35].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9), dark); s.position.set(x, -0.28, 0); g.add(s);
    [-0.3, 0.3].forEach(z => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), dark); l.position.set(x, -0.17, z); g.add(l); }); });
  g.scale.setScalar(size || 1);
  return {g, props};
}
function lights() {
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x223044, 1.1));
  const d = new THREE.DirectionalLight(0xfff0d8, 2.4); d.position.set(8, 14, 6); scene.add(d);
}

camera.position.set(14, 6, 16); controls.target.set(0, 4, 0); controls.maxDistance = 50;
scene.background = new THREE.Color(0x0b1220); scene.fog = new THREE.Fog(0x0b1220, 30, 90);
lights(); bloom.strength = 0.4; bloom.threshold = 0.55;
scene.add(new THREE.Mesh(new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color: 0x16202e, roughness: 0.9})));
const grid = new THREE.GridHelper(60, 60, 0x2f6ea5, 0x1b2c42); grid.position.y = 0.01; scene.add(grid);
const D = makeDrone(1.3); const drone = new THREE.Group(); drone.add(D.g); scene.add(drone);
const target = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 8, 64).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x4cffb0}));
target.material.color.multiplyScalar(2.5); scene.add(target);
const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 12, 6).translate(0, 6, 0), new THREE.MeshBasicMaterial({color: 0x2f6ea5})); scene.add(rod);
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 14).translate(0, -0.5, 0), new THREE.MeshBasicMaterial({color: 0xffaa33, transparent: true, opacity: 0.8}));
flame.position.y = -0.4; drone.add(flame);
// chart overlay
const cv = document.createElement('canvas');
cv.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;width:calc(100% - 16px);height:130px;background:rgba(0,0,0,.6);border-radius:10px;z-index:4';
document.body.appendChild(cv);
const hist = []; const HT = 10;
function chart(t) {
  const W = cv.width = cv.clientWidth * 2, H = cv.height = 260, x = cv.getContext('2d');
  x.fillStyle = '#0006'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#2f6ea544'; x.lineWidth = 1;
  for (let i = 0; i <= 8; i += 2) { const yy = H - i / 8 * H * 0.85 - 14; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
  const line = (key, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); hist.forEach((h, i) => { const px = (h.t - (t - HT)) / HT * W, py = H - h[key] / 8 * H * 0.85 - 14; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); };
  line('r', '#ffffff', 3); line('y', '#38e8ff', 4);
  x.fillStyle = '#fff'; x.font = '22px sans-serif'; x.fillText('white = target altitude   cyan = drone altitude (last 10 s)', 12, 28);
}
const P = {y: 2, v: 0, I: 0, thr: 9.81, r: 2, d: 0, gust: 0, peak: 0, y0: 2, over: 0, nextStep: 3, err2: 0, n: 0};
const sl = {kp: $('kp'), ki: $('ki'), kd: $('kd')};
function setG(a, b, c) { sl.kp.value = a; sl.ki.value = b; sl.kd.value = c; show(); }
function show() { $('vp').textContent = sl.kp.value; $('vi').textContent = sl.ki.value; $('vd').textContent = sl.kd.value; }
['kp', 'ki', 'kd'].forEach(k => sl[k].oninput = show);
$('p1').onclick = () => setG(14, 0, 0); $('p2').onclick = () => setG(6, 1, 6); $('p3').onclick = () => setG(14, 4, 7); $('p4').onclick = () => setG(45, 12, 2);
$('gust').onclick = () => { P.gust = 1.0; };
let acc = 0, time = 0;
tickFn = (t, dt) => {
  acc += dt; const h = 1 / 240;
  while (acc >= h) {
    acc -= h; time += h;
    if (time >= P.nextStep) { P.y0 = P.y; P.r = P.r < 4 ? 7 : 2; P.nextStep += 5; P.peak = P.y; }
    const e = P.r - P.y;
    P.I = Math.max(-8, Math.min(8, P.I + e * h));
    const u = Math.max(0, Math.min(30, 9.81 + (+sl.kp.value) * e + (+sl.ki.value) * P.I - (+sl.kd.value) * P.v));
    P.thr += (u - P.thr) * (h / 0.06);
    P.gust = Math.max(0, P.gust - h);
    const a = P.thr - 9.81 - 0.4 * P.v - (P.gust > 0 ? 7 : 0);
    P.v += a * h; P.y += P.v * h;
    if (P.y < 0.6) { P.y = 0.6; P.v = Math.max(0, P.v); }
    if (P.y > P.peak) P.peak = P.y;
    P.err2 += e * e; P.n++;
  }
  const step = P.r - P.y0;
  P.over = step > 0 ? Math.max(0, (P.peak - P.r) / step * 100) : 0;
  drone.position.y = P.y; target.position.y = P.r;
  flame.scale.y = 0.2 + P.thr / 12; flame.visible = true;
  D.props.forEach(p => p.rotation.y += p.userData.dir * (10 + P.thr * 4) * dt * 6);
  hist.push({t: time, y: P.y, r: P.r}); while (hist.length && hist[0].t < time - HT) hist.shift();
  chart(time);
  $('stat').innerHTML = 'Altitude: ' + P.y.toFixed(2) + ' m &nbsp; Target: ' + P.r + ' m<br>Overshoot (last step): ' + P.over.toFixed(0) + '%<br>RMS error: ' + Math.sqrt(P.err2 / Math.max(1, P.n)).toFixed(2) + ' m';
  controls.target.y += (P.y - controls.target.y) * 0.05;
};
show();
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude81 Drone Swarm Light Show - 343 drones",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Drone Swarm Light Show - 343 drones</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#000;color:#dfe;font-family:system-ui,sans-serif}
#hud{position:fixed;left:8px;top:8px;background:rgba(0,0,0,.55);padding:8px 10px;border-radius:10px;font-size:12px;width:190px;z-index:5}
#hud b{font-size:14px}#hud label{display:block;margin-top:6px}#hud input[type=range]{width:100%}
#hud button{margin-top:6px;padding:6px 10px;border:0;border-radius:6px;background:#2563eb;color:#fff}
canvas{display:block;touch-action:none}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body>
<div id="hud">
<b>Drone Swarm Light Show</b><br>343 drones &middot; one formation after another
<div id="btns" style="margin-top:6px"></div>
<label>Auto change <input id="auto" type="checkbox" checked></label>
<label>Glow <input id="bl" type="range" min="0" max="3" step="0.05" value="1.4"></label>
<div id="sn" style="margin-top:4px;color:#9fc"></div>
</div>
<script type="x-shader/x-vertex" id="vs">
attribute vec3 aC;
uniform float uPx, uTime;
varying vec3 vC; varying float vB;
void main(){
  vC = aC;
  vB = 0.75 + 0.25 * sin(uTime * 6.0 + position.x * 3.1 + position.z * 2.3);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * 170.0 / (-mv.z);
}
</script>
<script type="x-shader/x-fragment" id="fs">
varying vec3 vC; varying float vB;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = pow(1.0 - d, 1.6);
  gl_FragColor = vec4(vC * vB * (0.4 + 2.0 * a * a), a);
}
</script>

<script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $ = id => document.getElementById(id);
const SH = id => document.getElementById(id).textContent;
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1, 0.6, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
function glowSprite(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.15, 'rgba(' + r + ',' + g + ',' + b + ',0.9)');
  gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
}
function starField(n, R) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
    p[i * 3] = R * s * Math.cos(a); p[i * 3 + 1] = R * u; p[i * 3 + 2] = R * s * Math.sin(a);
    const k = 0.35 + Math.random() * 0.65, w = Math.random();
    c[i * 3] = k * (0.75 + 0.25 * w); c[i * 3 + 1] = k * 0.88; c[i * 3 + 2] = k * (1 - 0.25 * w);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({size: 2, vertexColors: true, sizeAttenuation: false, depthWrite: false}));
}
let tickFn = () => {};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  tickFn(t, dt); controls.update(); composer.render();
});

camera.position.set(0, 14, 62); controls.target.set(0, 20, 0); controls.maxDistance = 160; controls.minDistance = 10;
controls.maxPolarAngle = Math.PI * 0.52; controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
scene.background = new THREE.Color(0x01020a);
scene.add(starField(3500, 1500));
const ground = new THREE.Mesh(new THREE.CircleGeometry(300, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x03050d}));
ground.position.y = -0.05; scene.add(ground);
const N = 343, CY = 22;
const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), col = new Float32Array(N * 3), tcol = new Float32Array(N * 3);
const tgt = new Float32Array(N * 3);
for (let i = 0; i < N; i++) { pos[i * 3] = ((i % 19) - 9) * 3.2; pos[i * 3 + 1] = 0.3; pos[i * 3 + 2] = (Math.floor(i / 19) - 9) * 3.2; }
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('aC', new THREE.BufferAttribute(col, 3));
const mat = new THREE.ShaderMaterial({uniforms: {uPx: {value: renderer.getPixelRatio()}, uTime: {value: 0}}, vertexShader: SH('vs'), fragmentShader: SH('fs'),
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
const R = Math.random, PI2 = Math.PI * 2;
const SH_ = [
  ['Sphere', [0.2, 0.7, 1], [0.9, 0.2, 1], (i) => { const k = (i + 0.5) / N, a = Math.acos(1 - 2 * k), b = Math.PI * (1 + Math.sqrt(5)) * i; return [14 * Math.sin(a) * Math.cos(b), CY + 14 * Math.cos(a), 14 * Math.sin(a) * Math.sin(b)]; }],
  ['Heart', [1, 0.1, 0.3], [1, 0.5, 0.7], (i) => { const t = R() * PI2, s = Math.sqrt(R()) * 0.98 + 0.02; const x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); return [x * 0.85 * s, CY + y * 0.85 * s, (R() - 0.5) * 7 * s]; }],
  ['Torus knot', [0.1, 1, 0.6], [1, 0.9, 0.2], (i) => { const u = i / N * PI2 * 1, p = 2, q = 3, r = 1 + 0.45 * Math.cos(q * u); const a = (R() - 0.5) * 1.2; return [12 * r * Math.cos(p * u) + a, CY + 12 * 0.45 * 2 * Math.sin(q * u) + a, 12 * r * Math.sin(p * u) + a]; }],
  ['DNA', [0.2, 0.9, 1], [1, 0.3, 0.8], (i) => { const k = i % 3, u = Math.floor(i / 3) / (N / 3) * 4 * Math.PI - 2 * Math.PI; if (k === 2) { const f = R() * 2 - 1; return [Math.cos(u) * 8 * f, CY + u * 2.3, Math.sin(u) * 8 * f]; } const s = k === 0 ? 1 : -1; return [Math.cos(u) * 8 * s, CY + u * 2.3, Math.sin(u) * 8 * s]; }],
  ['Saturn', [1, 0.75, 0.3], [0.4, 0.8, 1], (i) => { if (i < 120) { const k = (i + 0.5) / 120, a = Math.acos(1 - 2 * k), b = Math.PI * (1 + Math.sqrt(5)) * i; return [7 * Math.sin(a) * Math.cos(b), CY + 7 * Math.cos(a), 7 * Math.sin(a) * Math.sin(b)]; } const t = (i - 120) / (N - 120) * PI2 * 3, r = 11 + ((i - 120) % 3) * 2.2; const x = r * Math.cos(t), z = r * Math.sin(t); return [x * Math.cos(0.45), CY + x * Math.sin(0.45), z]; }],
  ['Cube', [0.3, 1, 0.4], [0.1, 0.5, 1], (i) => { const a = i % 7, b = Math.floor(i / 7) % 7, c = Math.floor(i / 49); return [(a - 3) * 3.6, CY + (b - 3) * 3.6, (c - 3) * 3.6]; }],
  ['Wave', [0.1, 0.8, 1], [0.7, 0.2, 1], (i, t) => { const x = (i % 19 - 9) * 2.6, z = (Math.floor(i / 19) - 9) * 2.6; return [x, CY - 4 + 4 * Math.sin(Math.hypot(x, z) * 0.35 - t * 2.5), z]; }],
  ['Ring of fire', [1, 0.3, 0.05], [1, 0.9, 0.1], (i, t) => { const a = i / N * PI2 * 5, ring = Math.floor(i / (N / 5)), r = 6 + ring * 3.2, ang = a * 0.2 + ring + t * 0.2; return [r * Math.cos(ang * 5), CY + (ring - 2) * 3, r * Math.sin(ang * 5)]; }]
];
let cur = -1, tshape = 0;
const btns = $('btns');
SH_.forEach((s, i) => { const b = document.createElement('button'); b.textContent = s[0]; b.style.margin = '2px'; b.onclick = () => { set(i); tshape = 0; }; btns.appendChild(b); });
function set(i) {
  cur = i; const s = SH_[i]; const idx = [...Array(N).keys()].sort(() => R() - 0.5);
  for (let k = 0; k < N; k++) {
    const p = s[3](idx[k], 0); tgt[k * 3] = p[0]; tgt[k * 3 + 1] = p[1]; tgt[k * 3 + 2] = p[2];
    const m = Math.min(1, Math.max(0, (p[1] - CY + 14) / 28 * 0.5 + (Math.atan2(p[2], p[0]) / PI2 + 0.5) * 0.5));
    for (let c = 0; c < 3; c++) tcol[k * 3 + c] = s[1][c] * (1 - m) + s[2][c] * m;
  }
  $('sn').textContent = 'Formation: ' + s[0];
}
$('bl').oninput = e => { bloom.strength = +e.target.value; };
bloom.strength = 1.4; bloom.radius = 0.5; bloom.threshold = 0.05;
set(0);
tickFn = (t, dt) => {
  tshape += dt;
  if ($('auto').checked && tshape > 8) { tshape = 0; set((cur + 1) % SH_.length); }
  const s = SH_[cur];
  if (cur === 6 || cur === 7) { // moving formations: recompute targets every frame (index order from 'idx' ignored = fine)
    for (let k = 0; k < N; k++) { const p = s[3](k, t); tgt[k * 3] = p[0]; tgt[k * 3 + 1] = p[1]; tgt[k * 3 + 2] = p[2]; }
  }
  const h = Math.min(dt, 0.033);
  for (let k = 0; k < N; k++) for (let c = 0; c < 3; c++) {
    const j = k * 3 + c;
    const a = (tgt[j] - pos[j]) * 7 - vel[j] * 4.2;
    vel[j] += a * h; pos[j] += vel[j] * h;
    col[j] += (tcol[j] - col[j]) * Math.min(1, h * 2.5);
  }
  geo.attributes.position.needsUpdate = true; geo.attributes.aC.needsUpdate = true;
  mat.uniforms.uTime.value = t;
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude81 LiDAR Mapping Drone - 3D point cloud",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>LiDAR Mapping Drone - 3D point cloud</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#000;color:#dfe;font-family:system-ui,sans-serif}
#hud{position:fixed;left:8px;top:8px;background:rgba(0,0,0,.55);padding:8px 10px;border-radius:10px;font-size:12px;width:190px;z-index:5}
#hud b{font-size:14px}#hud label{display:block;margin-top:6px}#hud input[type=range]{width:100%}
#hud button{margin-top:6px;padding:6px 10px;border:0;border-radius:6px;background:#2563eb;color:#fff}
canvas{display:block;touch-action:none}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body>
<div id="hud">
<b>LiDAR Mapping Drone</b><br>Survey flight builds a 3D point cloud
<label>Drone speed <input id="sp" type="range" min="4" max="30" step="1" value="14"></label>
<button id="rs">Restart survey</button>
<div id="st" style="margin-top:6px;color:#9fc"></div>
</div>

<script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $ = id => document.getElementById(id);
const SH = id => document.getElementById(id).textContent;
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1, 0.6, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
function glowSprite(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.15, 'rgba(' + r + ',' + g + ',' + b + ',0.9)');
  gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
}
function starField(n, R) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
    p[i * 3] = R * s * Math.cos(a); p[i * 3 + 1] = R * u; p[i * 3 + 2] = R * s * Math.sin(a);
    const k = 0.35 + Math.random() * 0.65, w = Math.random();
    c[i * 3] = k * (0.75 + 0.25 * w); c[i * 3 + 1] = k * 0.88; c[i * 3 + 2] = k * (1 - 0.25 * w);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({size: 2, vertexColors: true, sizeAttenuation: false, depthWrite: false}));
}
let tickFn = () => {};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  tickFn(t, dt); controls.update(); composer.render();
});

// ---- procedural quadcopter model (front = -Z) ----
function makeDrone(size, tint) {
  const g = new THREE.Group(), props = [];
  const dark = new THREE.MeshStandardMaterial({color: 0x161a22, roughness: 0.45, metalness: 0.5});
  const shell = new THREE.MeshStandardMaterial({color: tint || 0xe8eef7, roughness: 0.3, metalness: 0.2});
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.6), shell));
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, 6.2832, 0, 1.5708), shell);
  top.scale.set(1.2, 0.55, 0.9); top.position.y = 0.11; g.add(top);
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), dark); cam.position.set(0, -0.1, -0.33); g.add(cam);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({color: 0x66ccff}));
  lens.position.set(0, -0.1, -0.43); g.add(lens);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => {
    const x = c[0] * 0.95, z = c[1] * 0.95, L = Math.hypot(x, z);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.12), dark);
    arm.position.set(x / 2, 0, z / 2); arm.rotation.y = -Math.atan2(z, x); g.add(arm);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 16), dark); motor.position.set(x, 0.08, z); g.add(motor);
    const p = new THREE.Group(); p.position.set(x, 0.19, z);
    p.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.012, 0.09), new THREE.MeshStandardMaterial({color: 0x2a313d})));
    p.add(new THREE.Mesh(new THREE.CircleGeometry(0.56, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({color: 0x66ccff, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false})));
    p.userData.dir = (i === 0 || i === 3) ? 1 : -1; props.push(p); g.add(p);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({color: c[1] < 0 ? 0xff3355 : 0x33ff88}));
    led.position.set(x, 0.0, z * 1.08); led.material.color.multiplyScalar(3); g.add(led);
  });
  [-0.35, 0.35].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9), dark); s.position.set(x, -0.28, 0); g.add(s);
    [-0.3, 0.3].forEach(z => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), dark); l.position.set(x, -0.17, z); g.add(l); }); });
  g.scale.setScalar(size || 1);
  return {g, props};
}
function lights() {
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x223044, 1.1));
  const d = new THREE.DirectionalLight(0xfff0d8, 2.4); d.position.set(8, 14, 6); scene.add(d);
}

camera.position.set(-70, 60, 70); controls.target.set(0, 5, 0); controls.maxDistance = 220;
scene.background = new THREE.Color(0x03060d); scene.fog = new THREE.Fog(0x03060d, 120, 320);
lights(); bloom.strength = 0.55; bloom.threshold = 0.3; bloom.radius = 0.5;
// ---- world: terrain + buildings + trees, height function shared by mesh and laser ----
const bld = [], trees = [];
for (let i = 0; i < 14; i++) bld.push({x: (Math.random() - 0.5) * 70, z: (Math.random() - 0.5) * 70, w: 4 + Math.random() * 6, d: 4 + Math.random() * 6, h: 6 + Math.random() * 14});
for (let i = 0; i < 70; i++) trees.push({x: (Math.random() - 0.5) * 84, z: (Math.random() - 0.5) * 84, r: 1.2 + Math.random() * 1.2, h: 4 + Math.random() * 5});
function terrain(x, z) { return 5 + 4 * Math.sin(x * 0.07 + 1) * Math.cos(z * 0.06) + 2 * Math.sin(x * 0.13 + z * 0.11) + 0.8 * Math.sin(x * 0.31) * Math.sin(z * 0.27); }
function H(x, z) {
  let h = terrain(x, z);
  for (const b of bld) if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) h = Math.max(h, terrain(b.x, b.z) + b.h);
  for (const t of trees) { const d = Math.hypot(x - t.x, z - t.z); if (d < t.r) h = Math.max(h, terrain(t.x, t.z) + t.h * (1 - d / t.r)); }
  return h;
}
const gm = new THREE.PlaneGeometry(110, 110, 150, 150).rotateX(-Math.PI / 2);
{ const p = gm.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, terrain(p.getX(i), p.getZ(i)) - 0.15); gm.computeVertexNormals(); }
scene.add(new THREE.Mesh(gm, new THREE.MeshStandardMaterial({color: 0x1a2433, roughness: 1, flatShading: true})));
const dm = new THREE.MeshStandardMaterial({color: 0x2b3547, roughness: 0.8});
bld.forEach(b => { const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), dm); m.position.set(b.x, terrain(b.x, b.z) + b.h / 2, b.z); scene.add(m); });
trees.forEach(t => { const m = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 8), new THREE.MeshStandardMaterial({color: 0x1c3a2a, roughness: 1})); m.position.set(t.x, terrain(t.x, t.z) + t.h / 2, t.z); scene.add(m); });
// ---- point cloud ----
const MAXP = 220000, pp = new Float32Array(MAXP * 3), pc = new Float32Array(MAXP * 3);
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3)); pg.setDrawRange(0, 0);
const cloud = new THREE.Points(pg, new THREE.PointsMaterial({size: 2.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95}));
cloud.frustumCulled = false; scene.add(cloud);
function ramp(v) { v = Math.min(1, Math.max(0, v)); const r = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 3))), g = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 2))), b = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 1))); return [r, g, b]; }
// ---- drone + laser fan ----
const D = makeDrone(1.6, 0xffcc44); const drone = new THREE.Group(); drone.add(D.g); scene.add(drone);
const fanN = 15, fanGeo = new THREE.BufferGeometry(); fanGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fanN * 6), 3));
const fan = new THREE.LineSegments(fanGeo, new THREE.LineBasicMaterial({color: 0xff2a2a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending}));
fan.frustumCulled = false; scene.add(fan);
// ---- lawn-mower flight path ----
const ALT = 34, LANES = 5, SP = 18, X0 = -42, X1 = 42, path = [];
for (let l = 0; l < LANES; l++) {
  const z = (l - (LANES - 1) / 2) * SP, dir = l % 2 === 0 ? 1 : -1, a = dir > 0 ? X0 : X1, b = dir > 0 ? X1 : X0;
  path.push({x: a, z, scan: true}); path.push({x: b, z, scan: true});
  if (l < LANES - 1) for (let k = 1; k <= 12; k++) { const ang = k / 13 * Math.PI; path.push({x: b + dir * Math.sin(ang) * SP / 2, z: z + (1 - Math.cos(ang)) * SP / 2, scan: false}); }
}
const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));
const total = cum[cum.length - 1];
let dist = 0, count = 0, wrap = 0, done = 0;
const cells = new Uint8Array(46 * 46); let filled = 0;
function pathAt(s) { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const f = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); const a = path[i - 1], b = path[i]; return {x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, scan: b.scan && a.scan, dx: b.x - a.x, dz: b.z - a.z}; }
function shoot(ox, oy, oz, dy, dz) { // ray in the Y-Z plane (across track)
  let t = 0; const step = 0.9;
  for (let i = 0; i < 90; i++) { t += step; const y = oy - dy * t, z = oz + dz * t; if (y <= H(ox, z)) { let lo = t - step, hi = t; for (let k = 0; k < 5; k++) { const m = (lo + hi) / 2; (oy - dy * m <= H(ox, oz + dz * m)) ? hi = m : lo = m; } return hi; } }
  return -1;
}
function reset() { count = 0; dist = 0; filled = 0; cells.fill(0); pg.setDrawRange(0, 0); done = 0; }
$('rs').onclick = reset;
const fp = fan.geometry.attributes.position;
tickFn = (t, dt) => {
  const sp = +$('sp').value;
  if (done > 0) { done -= dt; if (done <= 0) reset(); }
  else { dist += sp * dt; if (dist >= total) { dist = total - 0.01; done = 4; } }
  const q = pathAt(dist);
  drone.position.set(q.x, ALT + Math.sin(t * 2) * 0.15, q.z);
  drone.rotation.y = Math.atan2(-q.dx, -q.dz);
  drone.rotation.x = -0.12;
  D.props.forEach(p => p.rotation.y += p.userData.dir * 60 * dt);
  // scan: sweep across track, 3 passes per frame for density
  for (let pass = 0; pass < 3 && q.scan && done <= 0; pass++) {
    for (let k = 0; k < fanN; k++) {
      const phi = ((k + Math.random()) / fanN - 0.5) * 1.05;
      const dy = Math.cos(phi), dz = Math.sin(phi);
      const hit = shoot(q.x, ALT, q.z, dy, dz);
      if (hit > 0) {
        const hx = q.x + (Math.random() - 0.5) * 0.3, hz = q.z + dz * hit, hy = ALT - dy * hit;
        if (count < MAXP) { const i = count++; pp[i * 3] = hx; pp[i * 3 + 1] = hy; pp[i * 3 + 2] = hz; const c = ramp((hy - 3) / 22); pc[i * 3] = c[0]; pc[i * 3 + 1] = c[1]; pc[i * 3 + 2] = c[2]; }
        if (pass === 0) { fp.setXYZ(k * 2, q.x, ALT, q.z); fp.setXYZ(k * 2 + 1, hx, hy, hz); }
        const cx = Math.floor((hx + 46) / 2), cz = Math.floor((hz + 46) / 2);
        if (cx >= 0 && cx < 46 && cz >= 0 && cz < 46 && !cells[cx * 46 + cz]) { cells[cx * 46 + cz] = 1; filled++; }
      }
    }
  }
  if (!q.scan) for (let i = 0; i < fanN * 2; i++) fp.setXYZ(i, q.x, ALT, q.z);
  fp.needsUpdate = true;
  pg.setDrawRange(0, count); pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
  $('st').innerHTML = 'Points: ' + count.toLocaleString() + '<br>Coverage: ' + Math.min(100, Math.round(filled / (42 * 42) * 100)) + '%<br>' + (done > 0 ? 'Survey complete!' : q.scan ? 'Scanning...' : 'Turning...');
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude81 eVTOL Air Taxi - tilt-rotor flight",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>eVTOL Air Taxi - tilt-rotor flight</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#000;color:#dfe;font-family:system-ui,sans-serif}
#hud{position:fixed;left:8px;top:8px;background:rgba(0,0,0,.55);padding:8px 10px;border-radius:10px;font-size:12px;width:190px;z-index:5}
#hud b{font-size:14px}#hud label{display:block;margin-top:6px}#hud input[type=range]{width:100%}
#hud button{margin-top:6px;padding:6px 10px;border:0;border-radius:6px;background:#2563eb;color:#fff}
canvas{display:block;touch-action:none}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body>
<div id="hud">
<b>eVTOL Air Taxi</b><br>Tilt-rotor flight: lift off &rarr; transition &rarr; cruise
<button id="cam">Camera: Follow</button>
<label>Manual tilt <input id="mt" type="checkbox"></label>
<label>Tilt <input id="tl" type="range" min="0" max="1" step="0.01" value="0"></label>
<div id="st" style="margin-top:6px;color:#9fc;line-height:1.4"></div>
</div>
<script type="x-shader/x-vertex" id="bvs">
attribute float aSeed;
varying vec3 vW; varying vec3 vN; varying float vSeed;
void main(){
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(instanceMatrix) * normal);
  vSeed = aSeed;
  gl_Position = projectionMatrix * viewMatrix * w;
}
</script>
<script type="x-shader/x-fragment" id="bfs">
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying float vSeed;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 neon = vSeed < 0.33 ? vec3(0.1, 0.9, 1.0) : (vSeed < 0.66 ? vec3(1.0, 0.15, 0.75) : vec3(1.0, 0.7, 0.2));
  vec3 col = vec3(0.03, 0.025, 0.06);
  if (abs(vN.y) < 0.5) {
    float u = abs(vN.x) > 0.5 ? vW.z : vW.x;
    vec2 g = vec2(u * 1.1, vW.y * 0.7);
    vec2 cell = floor(g), f = fract(g);
    float win = step(0.25, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.75);
    float on = step(0.62, h(cell + vSeed * 91.0));
    float flick = 0.8 + 0.2 * sin(uTime * 3.0 + h(cell) * 30.0);
    col += neon * win * on * flick * 1.6;
    col += neon * step(0.985, fract(vW.y * 0.125 + vSeed)) * 1.2;
  } else if (vN.y > 0.5) {
    col += neon * 0.18;
  }
  float d = length(vW - cameraPosition);
  float fg = 1.0 - exp(-d * d * 0.00012);
  col = mix(col, vec3(0.09, 0.02, 0.16), clamp(fg, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
</script>
<script type="x-shader/x-vertex" id="gvs">
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
</script>
<script type="x-shader/x-fragment" id="gfs">
uniform float uTime;
varying vec3 vW;
void main(){
  vec2 q = abs(fract(vW.xz / 6.0 + 0.5) - 0.5) * 6.0;
  float road = max(step(q.x, 1.2), step(q.y, 1.2));
  vec3 col = vec3(0.02, 0.015, 0.04) + road * vec3(0.035, 0.03, 0.06);
  float edge = max(step(abs(q.x - 1.2), 0.07) * step(q.y, 99.0), step(abs(q.y - 1.2), 0.07));
  col += vec3(0.0, 0.7, 0.95) * edge * 0.9;
  float dashX = step(q.x, 0.06) * step(0.5, fract(vW.z * 0.4));
  float dashZ = step(q.y, 0.06) * step(0.5, fract(vW.x * 0.4));
  col += vec3(1.0, 0.2, 0.8) * max(dashX, dashZ) * 0.8;
  float d = length(vW - cameraPosition);
  float fg = 1.0 - exp(-d * d * 0.00012);
  col = mix(col, vec3(0.09, 0.02, 0.16), clamp(fg, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
</script>

<script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $ = id => document.getElementById(id);
const SH = id => document.getElementById(id).textContent;
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1, 0.6, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
function glowSprite(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.15, 'rgba(' + r + ',' + g + ',' + b + ',0.9)');
  gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
}
function starField(n, R) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
    p[i * 3] = R * s * Math.cos(a); p[i * 3 + 1] = R * u; p[i * 3 + 2] = R * s * Math.sin(a);
    const k = 0.35 + Math.random() * 0.65, w = Math.random();
    c[i * 3] = k * (0.75 + 0.25 * w); c[i * 3 + 1] = k * 0.88; c[i * 3 + 2] = k * (1 - 0.25 * w);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({size: 2, vertexColors: true, sizeAttenuation: false, depthWrite: false}));
}
let tickFn = () => {};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  tickFn(t, dt); controls.update(); composer.render();
});

// ---- procedural quadcopter model (front = -Z) ----
function makeDrone(size, tint) {
  const g = new THREE.Group(), props = [];
  const dark = new THREE.MeshStandardMaterial({color: 0x161a22, roughness: 0.45, metalness: 0.5});
  const shell = new THREE.MeshStandardMaterial({color: tint || 0xe8eef7, roughness: 0.3, metalness: 0.2});
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.6), shell));
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, 6.2832, 0, 1.5708), shell);
  top.scale.set(1.2, 0.55, 0.9); top.position.y = 0.11; g.add(top);
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), dark); cam.position.set(0, -0.1, -0.33); g.add(cam);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({color: 0x66ccff}));
  lens.position.set(0, -0.1, -0.43); g.add(lens);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => {
    const x = c[0] * 0.95, z = c[1] * 0.95, L = Math.hypot(x, z);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.12), dark);
    arm.position.set(x / 2, 0, z / 2); arm.rotation.y = -Math.atan2(z, x); g.add(arm);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 16), dark); motor.position.set(x, 0.08, z); g.add(motor);
    const p = new THREE.Group(); p.position.set(x, 0.19, z);
    p.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.012, 0.09), new THREE.MeshStandardMaterial({color: 0x2a313d})));
    p.add(new THREE.Mesh(new THREE.CircleGeometry(0.56, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({color: 0x66ccff, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false})));
    p.userData.dir = (i === 0 || i === 3) ? 1 : -1; props.push(p); g.add(p);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({color: c[1] < 0 ? 0xff3355 : 0x33ff88}));
    led.position.set(x, 0.0, z * 1.08); led.material.color.multiplyScalar(3); g.add(led);
  });
  [-0.35, 0.35].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9), dark); s.position.set(x, -0.28, 0); g.add(s);
    [-0.3, 0.3].forEach(z => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), dark); l.position.set(x, -0.17, z); g.add(l); }); });
  g.scale.setScalar(size || 1);
  return {g, props};
}
function lights() {
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x223044, 1.1));
  const d = new THREE.DirectionalLight(0xfff0d8, 2.4); d.position.set(8, 14, 6); scene.add(d);
}

scene.background = new THREE.Color(0x12041f); lights();
bloom.strength = 1.0; bloom.threshold = 0.25; bloom.radius = 0.5;
camera.far = 2500; camera.updateProjectionMatrix();
const ctime = {value: 0};
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({uniforms: {uTime: ctime}, vertexShader: SH('gvs'), fragmentShader: SH('gfs')})));
// skyline: low downtown inside the loop, taller ring outside
const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), seeds = [];
const bm = new THREE.ShaderMaterial({uniforms: {uTime: ctime}, vertexShader: SH('bvs'), fragmentShader: SH('bfs')});
const blds = new THREE.InstancedMesh(geo, bm, 900), m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
let nb = 0;
for (let i = -16; i < 16; i++) for (let j = -16; j < 16; j++) {
  const x = (i + 0.5) * 6, z = (j + 0.5) * 6, r = Math.hypot(x, z);
  if (r < 8 || (r > 52 && r < 70) || Math.random() < 0.15) continue;
  let h = r < 52 ? 3 + Math.random() * 12 : 8 + Math.random() * 45 * Math.min(1, (r - 60) / 60);
  pv.set(x, 0, z); sv.set(2.2 + Math.random() * 1.4, h, 2.2 + Math.random() * 1.4);
  m4.compose(pv, q0, sv); blds.setMatrixAt(nb, m4); seeds.push(Math.random()); nb++;
}
blds.count = nb; geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1)); scene.add(blds);
// vertiport
const pad = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.3, 48), new THREE.MeshStandardMaterial({color: 0x222a38}));
pad.position.set(60, 0.15, 0); scene.add(pad);
const padRing = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.09, 8, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x44ffaa}));
padRing.material.color.multiplyScalar(3); padRing.position.set(60, 0.35, 0); scene.add(padRing);
// ---- the aircraft (nose = +X, wing span along Z) ----
const ac = new THREE.Group(), body = new THREE.Group(); ac.add(body); scene.add(ac);
const white = new THREE.MeshStandardMaterial({color: 0xf2f5fa, roughness: 0.25, metalness: 0.3});
const glass = new THREE.MeshStandardMaterial({color: 0x10202e, roughness: 0.05, metalness: 0.9});
const darkM = new THREE.MeshStandardMaterial({color: 0x1a1f29, roughness: 0.5, metalness: 0.5});
const fus = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), white); fus.scale.set(4.2, 0.95, 1.1); body.add(fus);
const can = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), glass); can.scale.set(1.8, 0.75, 0.95); can.position.set(1.7, 0.35, 0); body.add(can);
const wing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 12), white); wing.position.set(-0.3, 0.45, 0); body.add(wing);
const tailV = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.08), white); tailV.position.set(-4, 1.1, 0); body.add(tailV);
const tailH = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 4), white); tailH.position.set(-4.1, 1.7, 0); body.add(tailH);
const pods = [];
[1.4, 3.3, 5.2].forEach(z0 => [1, -1].forEach(sg => {
  const pivot = new THREE.Group(); pivot.position.set(0.8, 0.55, z0 * sg);
  pivot.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.5, 14), darkM));
  const rot = new THREE.Group(); rot.position.y = 0.3;
  rot.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.14), darkM));
  rot.add(new THREE.Mesh(new THREE.CircleGeometry(0.85, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x88ddff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false})));
  pivot.add(rot); pods.push({pivot, rot, dir: pods.length % 2 ? 1 : -1}); body.add(pivot);
}));
// nav lights
[[-0.3, 0.45, 6, 0xff2244], [-0.3, 0.45, -6, 0x22ff66], [-4.6, 0.3, 0, 0xffffff]].forEach(l => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({color: l[3]})); m.material.color.multiplyScalar(4); m.position.set(l[0], l[1], l[2]); body.add(m); });
// light trail
const TR = 260, tr = new Float32Array(TR * 3), trg = new THREE.BufferGeometry(); trg.setAttribute('position', new THREE.BufferAttribute(tr, 3));
const trail = new THREE.Line(trg, new THREE.LineBasicMaterial({color: 0x66ddff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending})); trail.frustumCulled = false; scene.add(trail);
let trn = 0, tcount = 0;
// ---- flight plan ----
const R = 60, VC = 14, TA = 5, ALT = 26;
const lap = 2 * Math.PI * R, cruiseT = (lap - VC * TA) / VC;
const ph = [6, TA, cruiseT, TA, 6, 3]; const cumT = []; ph.reduce((a, b, i) => (cumT[i] = a + b), 0);
const TOTAL = cumT[5], names = ['Vertical take-off', 'Transition to wing-borne flight', 'Cruise', 'Transition to hover', 'Vertical landing', 'Parked'];
const ease = x => x * x * (3 - 2 * x);
function plan(t) {
  t = t % TOTAL; let i = 0; while (i < 5 && t > cumT[i]) i++;
  const t0 = i ? cumT[i - 1] : 0, u = (t - t0) / ph[i];
  let s = 0, y = 0, tilt = 0, v = 0;
  if (i === 0) { y = ALT * ease(u); }
  else if (i === 1) { y = ALT; tilt = ease(u); v = VC * u; s = VC * ph[1] * u * u / 2; }
  else if (i === 2) { y = ALT; tilt = 1; v = VC; s = VC * TA / 2 + VC * (t - t0); }
  else if (i === 3) { y = ALT; tilt = 1 - ease(u); v = VC * (1 - u); s = VC * TA / 2 + VC * cruiseT + VC * ph[3] * (u - u * u / 2); }
  else if (i === 4) { y = ALT * (1 - ease(u)); s = lap; }
  else { s = lap; }
  if (i === 0) s = 0;
  return {s, y: Math.max(0.5, y), tilt, v, i, u};
}
let follow = true; $('cam').onclick = () => { follow = !follow; $('cam').textContent = 'Camera: ' + (follow ? 'Follow' : 'Free'); };
camera.position.set(95, 22, 25); controls.target.set(60, 6, 0); controls.maxDistance = 260;
const tmp = new THREE.Vector3();
tickFn = (t, dt) => {
  ctime.value = t;
  const P = plan(t), th = P.s / R;
  ac.position.set(R * Math.cos(th), P.y, R * Math.sin(th));
  const tilt = $('mt').checked ? +$('tl').value : P.tilt;
  ac.rotation.set(0, -(th + Math.PI / 2), 0);
  body.rotation.x = (P.i === 2 ? -0.18 : 0);
  pods.forEach(p => { p.pivot.rotation.z = -tilt * Math.PI / 2; p.rot.rotation.y += p.dir * (30 - tilt * 10) * dt; });
  padRing.scale.setScalar(1 + 0.05 * Math.sin(t * 4));
  // trail
  tr.copyWithin(3, 0, (TR - 1) * 3); tr[0] = ac.position.x; tr[1] = ac.position.y; tr[2] = ac.position.z; trg.attributes.position.needsUpdate = true;
  if (follow) { tmp.copy(ac.position); controls.target.lerp(tmp, 0.12); }
  $('st').innerHTML = names[P.i] + '<br>Altitude: ' + (P.y * 3.28).toFixed(0) + ' ft<br>Speed: ' + (P.v * 3.6).toFixed(0) + ' km/h<br>Rotor tilt: ' + (tilt * 90).toFixed(0) + ' deg';
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude81 Sky Delivery Network - future drone city",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Sky Delivery Network - future drone city</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#000;color:#dfe;font-family:system-ui,sans-serif}
#hud{position:fixed;left:8px;top:8px;background:rgba(0,0,0,.55);padding:8px 10px;border-radius:10px;font-size:12px;width:190px;z-index:5}
#hud b{font-size:14px}#hud label{display:block;margin-top:6px}#hud input[type=range]{width:100%}
#hud button{margin-top:6px;padding:6px 10px;border:0;border-radius:6px;background:#2563eb;color:#fff}
canvas{display:block;touch-action:none}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body>
<div id="hud">
<b>Sky Delivery Network</b><br>Autonomous drones between smart hubs
<div id="st" style="margin-top:6px;color:#9fc;line-height:1.4"></div>
<label>Drones <input id="nd" type="range" min="10" max="80" step="5" value="50"></label>
<label>Glow <input id="bl" type="range" min="0" max="2.5" step="0.05" value="1.2"></label>
<button id="cam">Camera: Orbit</button>
</div>
<script type="x-shader/x-vertex" id="bvs">
attribute float aSeed;
varying vec3 vW; varying vec3 vN; varying float vSeed;
void main(){
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(instanceMatrix) * normal);
  vSeed = aSeed;
  gl_Position = projectionMatrix * viewMatrix * w;
}
</script>
<script type="x-shader/x-fragment" id="bfs">
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying float vSeed;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 neon = vSeed < 0.33 ? vec3(0.1, 0.9, 1.0) : (vSeed < 0.66 ? vec3(1.0, 0.15, 0.75) : vec3(1.0, 0.7, 0.2));
  vec3 col = vec3(0.03, 0.025, 0.06);
  if (abs(vN.y) < 0.5) {
    float u = abs(vN.x) > 0.5 ? vW.z : vW.x;
    vec2 g = vec2(u * 1.1, vW.y * 0.7);
    vec2 cell = floor(g), f = fract(g);
    float win = step(0.25, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.75);
    float on = step(0.62, h(cell + vSeed * 91.0));
    float flick = 0.8 + 0.2 * sin(uTime * 3.0 + h(cell) * 30.0);
    col += neon * win * on * flick * 1.6;
    col += neon * step(0.985, fract(vW.y * 0.125 + vSeed)) * 1.2;
  } else if (vN.y > 0.5) {
    col += neon * 0.18;
  }
  float d = length(vW - cameraPosition);
  float fg = 1.0 - exp(-d * d * 0.00012);
  col = mix(col, vec3(0.09, 0.02, 0.16), clamp(fg, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
</script>
<script type="x-shader/x-vertex" id="gvs">
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
</script>
<script type="x-shader/x-fragment" id="gfs">
uniform float uTime;
varying vec3 vW;
void main(){
  vec2 q = abs(fract(vW.xz / 6.0 + 0.5) - 0.5) * 6.0;
  float road = max(step(q.x, 1.2), step(q.y, 1.2));
  vec3 col = vec3(0.02, 0.015, 0.04) + road * vec3(0.035, 0.03, 0.06);
  float edge = max(step(abs(q.x - 1.2), 0.07) * step(q.y, 99.0), step(abs(q.y - 1.2), 0.07));
  col += vec3(0.0, 0.7, 0.95) * edge * 0.9;
  float dashX = step(q.x, 0.06) * step(0.5, fract(vW.z * 0.4));
  float dashZ = step(q.y, 0.06) * step(0.5, fract(vW.x * 0.4));
  col += vec3(1.0, 0.2, 0.8) * max(dashX, dashZ) * 0.8;
  float d = length(vW - cameraPosition);
  float fg = 1.0 - exp(-d * d * 0.00012);
  col = mix(col, vec3(0.09, 0.02, 0.16), clamp(fg, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
</script>

<script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $ = id => document.getElementById(id);
const SH = id => document.getElementById(id).textContent;
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1, 0.6, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
function glowSprite(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.15, 'rgba(' + r + ',' + g + ',' + b + ',0.9)');
  gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
}
function starField(n, R) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
    p[i * 3] = R * s * Math.cos(a); p[i * 3 + 1] = R * u; p[i * 3 + 2] = R * s * Math.sin(a);
    const k = 0.35 + Math.random() * 0.65, w = Math.random();
    c[i * 3] = k * (0.75 + 0.25 * w); c[i * 3 + 1] = k * 0.88; c[i * 3 + 2] = k * (1 - 0.25 * w);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({size: 2, vertexColors: true, sizeAttenuation: false, depthWrite: false}));
}
let tickFn = () => {};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  tickFn(t, dt); controls.update(); composer.render();
});

scene.background = new THREE.Color(0x12041f);
bloom.strength = 1.2; bloom.threshold = 0.25; bloom.radius = 0.5;
camera.far = 2500; camera.updateProjectionMatrix();
camera.position.set(90, 70, 110); controls.target.set(0, 20, 0); controls.maxDistance = 300; controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
const ctime = {value: 0};
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({uniforms: {uTime: ctime}, vertexShader: SH('gvs'), fragmentShader: SH('gfs')})));
// smart hubs on a ring
const HN = 6, hubs = [];
for (let i = 0; i < HN; i++) { const a = i / HN * 6.2832 + 0.3, r = 42 + (i % 2) * 14; hubs.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
const HT = 34;
// city (kept clear around hubs)
const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), seeds = [];
const bm = new THREE.ShaderMaterial({uniforms: {uTime: ctime}, vertexShader: SH('bvs'), fragmentShader: SH('bfs')});
const blds = new THREE.InstancedMesh(geo, bm, 1000), m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
let nb = 0;
for (let i = -17; i < 17; i++) for (let j = -17; j < 17; j++) {
  const x = (i + 0.5) * 6, z = (j + 0.5) * 6;
  if (hubs.some(h => Math.hypot(h.x - x, h.z - z) < 9) || Math.random() < 0.12) continue;
  const r = Math.hypot(x, z);
  const h = 4 + Math.pow(Math.random(), 2) * 30 * (1.2 - Math.min(1, r / 110));
  pv.set(x, 0, z); sv.set(2.2 + Math.random() * 1.4, h, 2.2 + Math.random() * 1.4);
  m4.compose(pv, q0, sv); blds.setMatrixAt(nb, m4); seeds.push(Math.random()); nb++;
}
blds.count = nb; geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1)); scene.add(blds);
// hub towers + glowing landing pads
const towerMat = new THREE.MeshStandardMaterial({color: 0x1b2233, roughness: 0.4, metalness: 0.7});
const rings = hubs.map((h, i) => {
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, HT, 20), towerMat); tw.position.set(h.x, HT / 2, h.z); scene.add(tw);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.5, 32), towerMat); top.position.set(h.x, HT + 0.25, h.z); scene.add(top);
  const rg = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.12, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color: new THREE.Color().setHSL(i / HN, 1, 0.6).multiplyScalar(3)}));
  rg.position.set(h.x, HT + 0.6, h.z); scene.add(rg);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 60, 6).translate(0, 30, 0), new THREE.MeshBasicMaterial({color: new THREE.Color().setHSL(i / HN, 1, 0.6).multiplyScalar(2), transparent: true, opacity: 0.5}));
  beam.position.set(h.x, HT, h.z); scene.add(beam);
  return rg;
});
// glowing sky highways (arcs between every pair of hubs)
const lanes = [];
for (let i = 0; i < HN; i++) for (let j = i + 1; j < HN; j++) {
  const alt = 42 + ((i + j) % 4) * 5;
  const c = new THREE.CatmullRomCurve3([hubs[i].clone().setY(HT + 1), hubs[i].clone().setY(alt), hubs[j].clone().setY(alt), hubs[j].clone().setY(HT + 1)]);
  const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(60)), new THREE.LineBasicMaterial({color: 0x3355ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending}));
  scene.add(ln); lanes.push({i, j, alt});
}
// instanced drones: body + 4 rotor discs + package + strobe
const MAXD = 80;
const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.35, 1.1), new THREE.MeshStandardMaterial({color: 0xdde6f5, roughness: 0.3}), MAXD);
const rotors = new THREE.InstancedMesh(new THREE.CircleGeometry(0.55, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0x99ddff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false}), MAXD * 4);
const pkg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.7}), MAXD);
const strobe = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({color: 0xffffff}), MAXD);
scene.add(body, rotors, pkg, strobe);
const tc = new THREE.Color();
const drones = [];
function plan(d, from) {
  let to; do { to = Math.floor(Math.random() * HN); } while (to === from);
  const a = Math.min(from, to), b = Math.max(from, to), L = lanes.find(l => l.i === a && l.j === b);
  const alt = L.alt + (Math.random() - 0.5) * 1.5;
  d.from = from; d.to = to;
  d.curve = new THREE.CatmullRomCurve3([hubs[from].clone().setY(HT + 1.2), hubs[from].clone().setY(alt), hubs[to].clone().setY(alt), hubs[to].clone().setY(HT + 1.2)]);
  d.len = d.curve.getLength(); d.u = 0; d.hold = 0; d.sp = 9 + Math.random() * 6;
  d.hasPkg = Math.random() < 0.8;
}
for (let i = 0; i < MAXD; i++) {
  const d = {}; plan(d, Math.floor(Math.random() * HN)); d.u = Math.random();
  tc.setHSL(Math.random(), 0.9, 0.55).multiplyScalar(2.2); d.col = tc.clone();
  d.pc = new THREE.Color().setHSL(Math.random(), 0.6, 0.5);
  drones.push(d); strobe.setColorAt(i, d.col); pkg.setColorAt(i, d.pc);
}
let delivered = 0, nD = 50;
$('nd').oninput = e => { nD = +e.target.value; };
$('bl').oninput = e => { bloom.strength = +e.target.value; };
let orbit = true; $('cam').onclick = () => { orbit = !orbit; controls.autoRotate = orbit; $('cam').textContent = 'Camera: ' + (orbit ? 'Orbit' : 'Free'); };
const p = new THREE.Vector3(), tg = new THREE.Vector3(), sc1 = new THREE.Vector3(1, 1, 1), sc0 = new THREE.Vector3(0, 0, 0), qq = new THREE.Quaternion(), eu = new THREE.Euler(), off = new THREE.Vector3();
const corner = [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]];
tickFn = (t, dt) => {
  ctime.value = t;
  for (let i = 0; i < MAXD; i++) {
    const d = drones[i];
    if (i >= nD) { m4.compose(p.set(0, -50, 0), qq, sc0); body.setMatrixAt(i, m4); pkg.setMatrixAt(i, m4); strobe.setMatrixAt(i, m4); for (let k = 0; k < 4; k++) rotors.setMatrixAt(i * 4 + k, m4); continue; }
    if (d.hold > 0) { d.hold -= dt; if (d.hold <= 0) plan(d, d.to); }
    else { d.u += d.sp * dt / d.len; if (d.u >= 1) { d.u = 1; d.hold = 1.2; delivered++; } }
    d.curve.getPoint(d.u, p); d.curve.getTangent(Math.min(0.999, d.u), tg);
    p.y += Math.sin(t * 3 + i) * 0.08;
    eu.set(tg.y * -0.25 * 0 + 0.12 * (d.hold > 0 ? 0 : 1), Math.atan2(-tg.x, -tg.z), 0, 'YXZ'); qq.setFromEuler(eu);
    m4.compose(p, qq, sc1); body.setMatrixAt(i, m4);
    off.set(0, -0.75, 0).applyQuaternion(qq); m4.compose(tg.copy(p).add(off), qq, d.hasPkg ? sc1 : sc0); pkg.setMatrixAt(i, m4);
    off.set(0, 0.28, 0).applyQuaternion(qq); m4.compose(tg.copy(p).add(off), qq, sc1); strobe.setMatrixAt(i, m4);
    for (let k = 0; k < 4; k++) { off.set(corner[k][0], 0.2, corner[k][1]).applyQuaternion(qq); m4.compose(tg.copy(p).add(off), qq, sc1); rotors.setMatrixAt(i * 4 + k, m4); }
  }
  body.instanceMatrix.needsUpdate = true; rotors.instanceMatrix.needsUpdate = true; pkg.instanceMatrix.needsUpdate = true; strobe.instanceMatrix.needsUpdate = true;
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  rings.forEach((r, i) => r.scale.setScalar(1 + 0.06 * Math.sin(t * 3 + i)));
  $('st').innerHTML = 'Active drones: ' + nD + '<br>Deliveries completed: ' + delivered + '<br>Hubs: ' + HN + ' &middot; sky lanes: ' + lanes.length;
};
</script>
</body></html>
`
});
})();
