/* =========================================================
   SIM LAB - examples3d6.js
   Realistic drone + colourful city (auto / manual flight)
   NOTE: String.raw ke andar backtick ya dollar-brace mat likhna.
   ========================================================= */
(function () {
'use strict';

const HEAD = String.raw`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#0b1020;font-family:system-ui,sans-serif;color:#fff}
#ui{position:absolute;top:8px;left:8px;width:210px;max-height:78vh;overflow:auto;background:rgba(0,0,0,.6);padding:8px 10px;border-radius:8px;font-size:12px}
#ui label{display:block;margin-top:6px}
#ui input[type=range],#ui select{width:100%}
#ui button{margin-top:6px;padding:4px 10px}
#tg{position:absolute;top:8px;right:8px;padding:6px 10px;font-size:16px}
#hud{position:absolute;bottom:8px;left:8px;font:12px/1.5 monospace;background:rgba(0,0,0,.6);padding:6px 10px;border-radius:6px;white-space:pre}
#pad{position:absolute;bottom:8px;right:8px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;touch-action:none;user-select:none;-webkit-user-select:none}
#pad .row{display:flex;gap:4px}
#pad button{width:44px;height:40px;font-size:16px;background:rgba(0,0,0,.55);color:#fff;border:1px solid #666;border-radius:8px;touch-action:none}
#pad button.w{width:70px}
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
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
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
function bindSliders(ids) {
  ids.forEach(id => {
    const el = $(id), o = $('v' + id);
    const f = () => { if (o) o.textContent = el.value; };
    el.addEventListener('input', f); f();
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

const UI = String.raw`<button id="tg">☰</button>
<div id="ui"><b>🚁 Drone over City</b>
<label>Mode<select id="mode"><option value="auto">Auto flight</option><option value="man">Manual (pad / WASD)</option></select></label>
<label>Camera<select id="cam"><option value="chase">Chase</option><option value="orbit">Orbit (free drag)</option><option value="fpv">FPV (drone camera)</option><option value="top">Top view</option></select></label>
<label>Cruise altitude: <span id="valt"></span> m<input id="alt" type="range" min="30" max="160" step="5" value="95"></label>
<label>Speed: <span id="vsp"></span> m/s<input id="sp" type="range" min="4" max="40" step="1" value="18"></label>
<label>Wind: <span id="vw"></span> m/s<input id="w" type="range" min="0" max="12" step="0.5" value="2"></label>
<label>Drone size: <span id="vsz"></span>x<input id="sz" type="range" min="2" max="10" step="0.5" value="4"></label>
<label><input id="night" type="checkbox"> 🌙 Night</label>
<button id="rs">↺ Reset</button>
<div style="margin-top:6px;opacity:.8">Keys: W/S aage-peeche, A/D side, Q/E ghumo, R/F upar-neeche</div>
</div>
<div id="pad">
<div class="row"><button data-k="yl">⟲</button><button data-k="f">▲</button><button data-k="yr">⟳</button></div>
<div class="row"><button data-k="l">◀</button><button data-k="b">▼</button><button data-k="r">▶</button></div>
<div class="row"><button class="w" data-k="u">⬆ Up</button><button class="w" data-k="d">⬇ Down</button></div>
</div>`;

const JS = String.raw`
let night = false;
const N = 8, P = 36, B = 28, HALF = N * P / 2;
const rc = i => (i - N / 2) * P;
let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

controls.enabled = false;
bindSliders(['alt', 'sp', 'w', 'sz']);

/* ---------- sky, fog, lights ---------- */
function skyTex(stops) {
  const c = document.createElement('canvas'); c.width = 2; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s));
  g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const SKY_DAY = skyTex(['#1f5fd0', '#5aa8f5', '#bfe0ff', '#eaf5ff']);
const SKY_NIGHT = skyTex(['#02040d', '#0a1233', '#1a2a5c', '#2b3a73']);
scene.background = SKY_DAY;
scene.fog = new THREE.Fog(0xbfe0ff, 150, 700);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a5a40, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536); sun.shadow.bias = -0.0005;
{ const c = sun.shadow.camera; c.left = -110; c.right = 110; c.top = 110; c.bottom = -110; c.near = 10; c.far = 400; }
scene.add(sun, sun.target);

/* ---------- ground + roads ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat(0x4b8f4f, 1, 0));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF + 8, 2 * HALF + 8), mat(0x2b2f36, 0.95, 0));
asphalt.rotation.x = -Math.PI / 2; asphalt.position.y = 0.05; asphalt.receiveShadow = true; scene.add(asphalt);

{
  const per = Math.floor(2 * HALF / 8), cnt = (N + 1) * per;
  const m = new THREE.MeshStandardMaterial({ color: 0xf5d742, roughness: 0.6 });
  const a = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.02, 3.2), m, cnt);
  const b = new THREE.InstancedMesh(new THREE.BoxGeometry(3.2, 0.02, 0.4), m, cnt);
  const d = new THREE.Object3D(); let n = 0;
  for (let r = 0; r <= N; r++) for (let k = 0; k < per; k++) {
    const t = -HALF + (k + 0.5) * 8;
    d.position.set(rc(r), 0.07, t); d.updateMatrix(); a.setMatrixAt(n, d.matrix);
    d.position.set(t, 0.07, rc(r)); d.updateMatrix(); b.setMatrixAt(n, d.matrix);
    n++;
  }
  scene.add(a, b);
}

/* ---------- building textures ---------- */
function winCanvas(lit) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = lit ? '#000' : '#f4f1ea'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x = i * 32 + 6, y = j * 32 + 7;
    if (lit) { if (Math.random() < 0.55) { g.fillStyle = '#ffd27a'; g.fillRect(x, y, 20, 18); } }
    else { g.fillStyle = '#6e9bd1'; g.fillRect(x, y, 20, 18); g.fillStyle = '#9cc3ee'; g.fillRect(x, y, 20, 6); }
  }
  return c;
}
const BASEC = winCanvas(false), LITC = winCanvas(true);
const texCache = {};
function tex(rx, ry) {
  const k = rx + '_' + ry;
  if (!texCache[k]) {
    const mk = c => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    texCache[k] = { m: mk(BASEC), e: mk(LITC) };
  }
  return texCache[k];
}

/* ---------- city ---------- */
const boxes = [], bMats = [], trees = [];
const acMat = mat(0x9ca3af, 0.7, 0.3), antMat = mat(0x6b7280, 0.5, 0.5);
const redLed = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 1.5 });

function addBuilding(cx, cz, w, d, h) {
  const col = new THREE.Color().setHSL(rnd(), 0.35 + rnd() * 0.35, 0.55 + rnd() * 0.15);
  const tx = tex(Math.max(1, Math.round(d / 6)), Math.max(1, Math.round(h / 7)));
  const tz = tex(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 7)));
  const side = t => {
    const m = new THREE.MeshStandardMaterial({ color: col, map: t.m, emissive: 0xffffff, emissiveMap: t.e, emissiveIntensity: night ? 1.2 : 0, roughness: 0.55, metalness: 0.1 });
    bMats.push(m); return m;
  };
  const roof = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.6), roughness: 0.9 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side(tx), side(tx), roof, roof, side(tz), side(tz)]);
  mesh.position.set(cx, 0.4 + h / 2, cz);
  mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  const top = h + 0.4;
  boxes.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, h: top });
  if (rnd() < 0.6) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, 1.6, d * 0.3), acMat);
    ac.position.set(cx + (rnd() - 0.5) * w * 0.3, top + 0.8, cz + (rnd() - 0.5) * d * 0.3); scene.add(ac);
  }
  if (rnd() < 0.3) {
    const an = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 8, 6), antMat);
    an.position.set(cx, top + 4, cz); scene.add(an);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), redLed);
    led.position.set(cx, top + 8, cz); scene.add(led);
  }
}

const padMat = mat(0x9aa3ad, 0.95, 0), parkMat = mat(0x4fae52, 0.95, 0);
const padGeo = new THREE.BoxGeometry(B, 0.4, B);
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
  const cx = rc(i) + P / 2, cz = rc(j) + P / 2;
  const park = ((i * 3 + j * 5) % 7 === 0);
  const pad = new THREE.Mesh(padGeo, park ? parkMat : padMat);
  pad.position.set(cx, 0.2, cz); pad.receiveShadow = true; scene.add(pad);
  if (park) { for (let k = 0; k < 8; k++) trees.push({ x: cx + (rnd() - 0.5) * B * 0.8, z: cz + (rnd() - 0.5) * B * 0.8, s: 0.8 + rnd() * 0.8 }); continue; }
  const tall = Math.max(0.15, 1 - Math.hypot(cx, cz) / HALF);
  const hf = () => 10 + rnd() * rnd() * 55 * tall + 8 * tall;
  if (rnd() < 0.5) addBuilding(cx, cz, 16 + rnd() * 8, 16 + rnd() * 8, hf());
  else {
    const s = rnd() < 0.5 ? 1 : -1;
    addBuilding(cx - 7, cz - 7 * s, 10 + rnd() * 3, 10 + rnd() * 3, hf());
    addBuilding(cx + 7, cz + 7 * s, 10 + rnd() * 3, 10 + rnd() * 3, hf());
  }
}

/* trees */
{
  const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.4, 0.5, 3, 6), mat(0x7c5a3a, 1, 0), trees.length);
  const cr = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 6, 8), mat(0xffffff, 0.9, 0), trees.length);
  const d = new THREE.Object3D(), c = new THREE.Color();
  trees.forEach((t, i) => {
    d.position.set(t.x, 0.4 + 1.5 * t.s, t.z); d.scale.setScalar(t.s); d.updateMatrix(); tr.setMatrixAt(i, d.matrix);
    d.position.set(t.x, 0.4 + 6 * t.s, t.z); d.updateMatrix(); cr.setMatrixAt(i, d.matrix);
    c.setHSL(0.28 + rnd() * 0.08, 0.6, 0.28 + rnd() * 0.12); cr.setColorAt(i, c);
  });
  tr.castShadow = cr.castShadow = true; scene.add(tr, cr);
}

/* cars */
const NC = 70;
const cars = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 1.2, 4.4), new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.5 }), NC);
const carData = [];
{ const c = new THREE.Color();
  for (let i = 0; i < NC; i++) {
    carData.push({ axis: rnd() < 0.5 ? 0 : 1, rc: (Math.floor(rnd() * (N + 1)) - N / 2) * P, lane: rnd() < 0.5 ? -1.8 : 1.8, t: (rnd() - 0.5) * 2 * HALF, sp: 6 + rnd() * 8 });
    c.setHSL(rnd(), 0.8, 0.5); cars.setColorAt(i, c);
  }
}
cars.castShadow = true; scene.add(cars);
const cd = new THREE.Object3D();
function updateCars(dt) {
  carData.forEach((c, i) => {
    const dir = c.lane > 0 ? 1 : -1;
    c.t += dir * c.sp * dt;
    if (c.t > HALF) c.t = -HALF; if (c.t < -HALF) c.t = HALF;
    if (c.axis === 0) { cd.position.set(c.rc + c.lane, 0.65, c.t); cd.rotation.y = 0; }
    else { cd.position.set(c.t, 0.65, c.rc + c.lane); cd.rotation.y = Math.PI / 2; }
    cd.updateMatrix(); cars.setMatrixAt(i, cd.matrix);
  });
  cars.instanceMatrix.needsUpdate = true;
}

/* ---------- the drone model (built in metres, then scaled) ---------- */
const drone = new THREE.Group(); scene.add(drone);
const model = new THREE.Group(); drone.add(model);
const wMat = mat(0xf5f5f5, 0.35, 0.1), dark = mat(0x1f2937, 0.5, 0.4), carbon = mat(0x111111, 0.4, 0.3);

const shell = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.17, 6, 20), wMat);
shell.rotation.x = Math.PI / 2; shell.scale.set(1, 1, 0.6); model.add(shell);
const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.1), mat(0xff7a1a, 0.4, 0.2)); stripe.position.set(0, 0.046, 0.04); model.add(stripe);
const bat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.09), mat(0x2b3a67, 0.5, 0.3)); bat.position.set(0, 0.05, -0.07); model.add(bat);
const gps = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 16), wMat); gps.position.set(0, 0.07, -0.11); model.add(gps);
const gim = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), carbon); gim.position.set(0, -0.045, 0.11); model.add(gim);
const lens = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 1 }));
lens.position.set(0, -0.048, 0.14); model.add(lens);

const spin = [];
[[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], i) => {
  const col = sz > 0 ? 0xff3355 : 0x34d399;
  const mp = new THREE.Vector3(sx * 0.19, 0.012, sz * 0.19);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 8), dark);
  place(arm, new THREE.Vector3(sx * 0.04, 0, sz * 0.04), mp); model.add(arm);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.045, 16), mat(0x6b7280, 0.3, 0.9));
  motor.position.set(mp.x, mp.y + 0.018, mp.z); model.add(motor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.005, 8, 20), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(mp.x, mp.y + 0.038, mp.z); model.add(ring);
  const g = new THREE.Group(); g.position.set(mp.x, mp.y + 0.048, mp.z); model.add(g);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.004, 0.024), carbon));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12), mat(0xd1d5db, 0.3, 0.8)));
  [-1, 1].forEach(s => {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, 0.025), new THREE.MeshBasicMaterial({ color: col }));
    tip.position.x = s * 0.15; g.add(tip);
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.002; g.add(disc);
  spin.push({ g, disc, dir: i % 2 ? 1 : -1 });
});
[-1, 1].forEach(sx => {
  const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 8), carbon);
  skid.rotation.x = Math.PI / 2; skid.position.set(sx * 0.1, -0.105, 0); model.add(skid);
  [-1, 1].forEach(sz => {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1, 6), carbon);
    place(st, new THREE.Vector3(sx * 0.06, -0.02, sz * 0.07), new THREE.Vector3(sx * 0.1, -0.105, sz * 0.1)); model.add(st);
  });
});
model.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
const dlight = new THREE.PointLight(0x66ccff, 0, 80); dlight.position.set(0, -0.1, 0); model.add(dlight);

/* ---------- state ---------- */
const p = new THREE.Vector3(), v = new THREE.Vector3();
let yaw = 0, pitch = 0, roll = 0, wi = 0, climbing = true, t = 0, hitT = 0;
const K = { f: 0, b: 0, l: 0, r: 0, u: 0, d: 0, yl: 0, yr: 0 };
const WPS = [[1, 1], [7, 1], [7, 4], [4, 4], [4, 7], [1, 7], [1, 4], [4, 1]];
const WP = i => new THREE.Vector3(rc(WPS[i][0]), V('alt') + 12 * Math.sin(i * 1.7), rc(WPS[i][1]));
const gmin = () => 0.05 + 0.115 * V('sz');

function reset() { p.set(0, gmin(), 0); v.set(0, 0, 0); yaw = 0; pitch = 0; roll = 0; wi = 0; climbing = true; t = 0; hitT = 0; }
reset();

function setNight(n) {
  night = n;
  scene.background = n ? SKY_NIGHT : SKY_DAY;
  scene.fog.color.set(n ? 0x1a2a5c : 0xbfe0ff);
  hemi.intensity = n ? 0.3 : 1.0;
  sun.intensity = n ? 0.4 : 2.2;
  sun.color.set(n ? 0x8aa4ff : 0xfff1d6);
  bMats.forEach(m => { m.emissiveIntensity = n ? 1.2 : 0; });
  dlight.intensity = n ? 600 : 0;
}

$('night').addEventListener('change', e => setNight(e.target.checked));
$('rs').addEventListener('click', reset);
$('mode').addEventListener('change', e => { if (e.target.value === 'auto') climbing = true; });
$('cam').addEventListener('change', e => {
  controls.enabled = e.target.value === 'orbit';
  if (controls.enabled) { camera.position.set(p.x + 30, p.y + 18, p.z + 30); controls.target.copy(p); }
});
$('tg').addEventListener('click', () => { const u = $('ui'); u.style.display = u.style.display === 'none' ? '' : 'none'; });

const toManual = () => { if ($('mode').value !== 'man') $('mode').value = 'man'; };
document.querySelectorAll('#pad button').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); K[k] = 1; toManual(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { K[k] = 0; }));
});
const KEYS = { KeyW: 'f', KeyS: 'b', KeyA: 'l', KeyD: 'r', KeyQ: 'yl', KeyE: 'yr', KeyR: 'u', Space: 'u', KeyF: 'd', ShiftLeft: 'd', ArrowUp: 'f', ArrowDown: 'b', ArrowLeft: 'yl', ArrowRight: 'yr' };
addEventListener('keydown', e => { const k = KEYS[e.code]; if (k) { K[k] = 1; toManual(); e.preventDefault(); } });
addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) K[k] = 0; });

function collide() {
  const r = 1.5 + 0.25 * V('sz');
  let hit = false;
  for (const b of boxes) {
    if (p.x > b.x0 - r && p.x < b.x1 + r && p.z > b.z0 - r && p.z < b.z1 + r && p.y < b.h + r) {
      const c = [[p.x - (b.x0 - r), 0], [(b.x1 + r) - p.x, 1], [p.z - (b.z0 - r), 2], [(b.z1 + r) - p.z, 3], [b.h + r - p.y, 4]].sort((m, n) => m[0] - n[0])[0];
      if (c[1] === 0) { p.x = b.x0 - r; if (v.x > 0) v.x = 0; hit = true; }
      else if (c[1] === 1) { p.x = b.x1 + r; if (v.x < 0) v.x = 0; hit = true; }
      else if (c[1] === 2) { p.z = b.z0 - r; if (v.z > 0) v.z = 0; hit = true; }
      else if (c[1] === 3) { p.z = b.z1 + r; if (v.z < 0) v.z = 0; hit = true; }
      else { p.y = b.h + r; if (v.y < 0) v.y = 0; }
    }
  }
  if (hit) hitT = 1.2;
}

const f = new THREE.Vector3(), rt = new THREE.Vector3(), vd = new THREE.Vector3(), acc = new THREE.Vector3(), des = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt; hitT = Math.max(0, hitT - dt);
  const sz = V('sz'), sp = V('sp'), W = V('w'), alt = V('alt'), auto = $('mode').value === 'auto';
  f.set(Math.sin(yaw), 0, Math.cos(yaw)); rt.set(-Math.cos(yaw), 0, Math.sin(yaw));

  vd.set(0, 0, 0);
  if (auto) {
    if (climbing) { vd.set(0, 9, 0); if (p.y > alt - 4) climbing = false; }
    else {
      const e = WP(wi).sub(p), dist = e.length();
      if (dist < 7) wi = (wi + 1) % WPS.length;
      vd.copy(e.normalize().multiplyScalar(Math.min(sp, 3 + dist * 0.7)));
    }
    if (Math.hypot(v.x, v.z) > 1.5) {
      let d = Math.atan2(v.x, v.z) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      yaw += d * Math.min(1, dt * 2.5);
    }
  } else {
    yaw += (K.yl - K.yr) * 1.6 * dt;
    vd.addScaledVector(f, (K.f - K.b) * sp).addScaledVector(rt, (K.r - K.l) * sp);
    vd.y = (K.u - K.d) * 9;
  }

  acc.set((vd.x - v.x) * 2.5, (vd.y - v.y) * 3, (vd.z - v.z) * 2.5);
  acc.x += (Math.sin(t * 0.3) * W - v.x) * 0.1;
  acc.z += (Math.cos(t * 0.21) * W * 0.6 - v.z) * 0.1;
  const hl = Math.hypot(acc.x, acc.z);
  if (hl > 9) { acc.x *= 9 / hl; acc.z *= 9 / hl; }
  acc.y = Math.max(-7, Math.min(7, acc.y));
  v.addScaledVector(acc, dt); p.addScaledVector(v, dt);
  collide();
  if (p.y < gmin()) { p.y = gmin(); if (v.y < 0) v.y = 0; v.x *= 0.9; v.z *= 0.9; }

  const af = acc.x * f.x + acc.z * f.z, al = -(acc.x * rt.x + acc.z * rt.z);
  const k = 1 - Math.exp(-dt * 8);
  pitch += (Math.atan2(af, 9.81) - pitch) * k;
  roll += (-Math.atan2(al, 9.81) - roll) * k;
  drone.scale.setScalar(sz);
  drone.position.copy(p);
  drone.rotation.set(pitch, yaw, roll, 'YXZ');

  const thr = Math.min(1, 0.4 + acc.length() / 12);
  spin.forEach(s => { s.g.rotation.y += s.dir * (30 + 20 * thr) * dt; s.disc.material.opacity = 0.08 + 0.12 * thr; });
  updateCars(dt);

  sun.position.set(p.x + 70, p.y + 110, p.z + 45);
  sun.target.position.copy(p); sun.target.updateMatrixWorld();

  const cam = $('cam').value;
  if (cam === 'chase') {
    const d = 8 + sz * 2.5, h = 2.5 + sz * 1.2;
    des.set(p.x - f.x * d, Math.max(2, p.y + h), p.z - f.z * d);
    camera.position.lerp(des, 1 - Math.exp(-dt * 4));
    camera.lookAt(p.x + f.x * 5, p.y, p.z + f.z * 5);
  } else if (cam === 'fpv') {
    camera.position.set(p.x + f.x * 0.6 * sz, p.y + 0.1 * sz, p.z + f.z * 0.6 * sz);
    camera.lookAt(p.x + f.x * 40, p.y - 4, p.z + f.z * 40);
  } else if (cam === 'top') {
    camera.position.set(p.x, p.y + 90, p.z + 0.1);
    camera.lookAt(p);
  } else {
    controls.target.lerp(p, 0.1); controls.update();
  }

  $('hud').textContent =
    'Mode      ' + (auto ? 'AUTO' : 'MANUAL') + '\n' +
    'Altitude  ' + p.y.toFixed(0) + ' m\n' +
    'Speed     ' + v.length().toFixed(1) + ' m/s (' + (v.length() * 3.6).toFixed(0) + ' km/h)\n' +
    'Heading   ' + ((((yaw * 57.2958) % 360) + 360) % 360).toFixed(0) + ' deg\n' +
    'Tilt      pitch ' + (pitch * 57.3).toFixed(0) + '  roll ' + (roll * 57.3).toFixed(0) + '\n' +
    (hitT > 0 ? '💥 BUILDING SE TAKRAYA' : (climbing && auto) ? '⬆ Takeoff' : '🟢 Flying');
  renderer.render(scene, camera);
}
animate();
`;

const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
E.html.unshift({ name: "3D CITY - Realistic drone flying over colourful city", code: page(UI, JS) });

})();
