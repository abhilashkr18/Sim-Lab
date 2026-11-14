/* SIM LAB - examples3d7.js : 6 ultra 3D visualizations for HTML (Three.js, bloom, shaders).
   Load AFTER examples.js and BEFORE app.js. */
(function () {
const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
E.html.push({
  name: "\ud83d\ude80 Black Hole - Interstellar style",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Black Hole - Interstellar style</title>
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
<b>Black Hole</b><br>Drag = rotate &middot; Pinch = zoom
<label>Glow <input id="bl" type="range" min="0" max="2" step="0.05" value="0.9"></label>
<label>Disk tilt <input id="tl" type="range" min="-0.6" max="0.6" step="0.02" value="0.2"></label>
</div>
<script type="x-shader/x-vertex" id="dvs">
varying vec2 vP;
void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
</script>
<script type="x-shader/x-fragment" id="dfs">
uniform float uTime, uIn, uOut;
varying vec2 vP;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main(){
  float r = length(vP);
  float t = clamp((r - uIn) / (uOut - uIn), 0.0, 1.0);
  float a = atan(vP.y, vP.x);
  float ang = a - uTime * 2.5 / pow(r, 1.5);
  vec2 q = vec2(cos(ang), sin(ang)) * 3.0 + vec2(r * 2.2, 0.0);
  float v = n(q) * 0.55 + n(q * 2.3 + 7.0) * 0.3 + n(q * 5.1) * 0.15;
  vec3 hot = vec3(1.0, 0.93, 0.75), mid = vec3(1.0, 0.5, 0.12), cold = vec3(0.55, 0.08, 0.02);
  vec3 col = t < 0.5 ? mix(hot, mid, t * 2.0) : mix(mid, cold, (t - 0.5) * 2.0);
  float dop = 0.55 + 0.9 * (0.5 + 0.5 * cos(a - 0.6));
  float br = (1.4 * pow(1.0 - t, 1.6) + 0.25) * dop * (0.4 + 1.3 * v);
  float al = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.7, 1.0, t));
  gl_FragColor = vec4(col * br * 1.6, al);
}
</script>
<script type="x-shader/x-vertex" id="pvs">
attribute float aR, aA, aY, aS;
uniform float uTime, uPx;
varying float vT;
void main(){
  float a = aA - uTime * 2.5 / pow(aR, 1.5);
  vec3 p = vec3(cos(a) * aR, aY, sin(a) * aR);
  vT = (aR - 1.6) / 6.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aS * uPx * 60.0 / (-mv.z);
}
</script>
<script type="x-shader/x-fragment" id="pfs">
varying float vT;
void main(){
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  if (d > 0.5) discard;
  vec3 col = mix(vec3(1.0, 0.9, 0.7), vec3(1.0, 0.4, 0.1), clamp(vT, 0.0, 1.0));
  gl_FragColor = vec4(col * (1.0 - d * 2.0) * 1.5, 1.0);
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

camera.position.set(0, 5, 16);
controls.minDistance = 4; controls.maxDistance = 70;
controls.autoRotate = true; controls.autoRotateSpeed = 0.4;
scene.background = new THREE.Color(0x000004);
scene.add(starField(5000, 900));

// event horizon (pure black sphere)
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({color: 0x000000})));

// accretion disk
const disk = new THREE.Group(); scene.add(disk);
function diskMat(a, b) {
  return new THREE.ShaderMaterial({
    uniforms: {uTime: {value: 0}, uIn: {value: a}, uOut: {value: b}},
    vertexShader: SH('dvs'), fragmentShader: SH('dfs'),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
}
const mDisk = diskMat(1.5, 7.5), mLens = diskMat(1.1, 2.6), mRing = diskMat(1.0, 1.25);
const flat = new THREE.Mesh(new THREE.RingGeometry(1.5, 7.5, 180, 1), mDisk);
flat.rotation.x = -Math.PI / 2; disk.add(flat);
// camera-facing rings fake the light bent over/under the hole
const lens = new THREE.Mesh(new THREE.RingGeometry(1.1, 2.6, 128, 1), mLens);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.25, 128, 1), mRing);
scene.add(lens, ring);

// orbiting glowing particles
const N = 14000, aR = new Float32Array(N), aA = new Float32Array(N), aY = new Float32Array(N), aS = new Float32Array(N), pp = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const r = 1.8 + Math.pow(Math.random(), 1.4) * 6.2;
  aR[i] = r; aA[i] = Math.random() * 6.2832;
  aY[i] = (Math.random() + Math.random() + Math.random() - 1.5) * 0.12 * (0.4 + r * 0.15);
  aS[i] = 0.4 + Math.random() * 0.9;
}
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
pg.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
pg.setAttribute('aA', new THREE.BufferAttribute(aA, 1));
pg.setAttribute('aY', new THREE.BufferAttribute(aY, 1));
pg.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
const pm = new THREE.ShaderMaterial({
  uniforms: {uTime: {value: 0}, uPx: {value: renderer.getPixelRatio()}},
  vertexShader: SH('pvs'), fragmentShader: SH('pfs'),
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
const parts = new THREE.Points(pg, pm); parts.frustumCulled = false; disk.add(parts);

bloom.strength = 0.9;
$('bl').oninput = e => { bloom.strength = +e.target.value; };
$('tl').oninput = e => { disk.rotation.z = +e.target.value; };
disk.rotation.z = 0.2;

tickFn = (t) => {
  mDisk.uniforms.uTime.value = t; mLens.uniforms.uTime.value = t; mRing.uniforms.uTime.value = t;
  pm.uniforms.uTime.value = t;
  lens.quaternion.copy(camera.quaternion); ring.quaternion.copy(camera.quaternion);
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude80 Spiral Galaxy - 50,000 stars",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Spiral Galaxy - 50,000 stars</title>
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
<b>Spiral Galaxy</b><br>Drag = rotate &middot; Pinch = zoom
<label>Stars <input id="n" type="range" min="20000" max="90000" step="10000" value="50000"></label>
<label>Arms <input id="arms" type="range" min="2" max="6" step="1" value="4"></label>
<label>Twist <input id="tw" type="range" min="1" max="10" step="0.5" value="4.5"></label>
<label>Spin <input id="sp" type="range" min="0" max="3" step="0.1" value="1"></label>
</div>
<script type="x-shader/x-vertex" id="gvs">
attribute vec3 aC;
attribute float aS;
uniform float uTime, uPx, uSpin;
varying vec3 vC;
void main(){
  vC = aC;
  float r = length(position.xz);
  float w = uSpin * uTime * 1.2 / (1.0 + r * 0.35);
  float c = cos(w), s = sin(w);
  vec3 p = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aS * uPx * 45.0 / (-mv.z);
}
</script>
<script type="x-shader/x-fragment" id="gfs">
varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = pow(1.0 - d, 2.0);
  gl_FragColor = vec4(vC * a * 0.8, a);
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

camera.position.set(0, 24, 36);
controls.autoRotate = true; controls.autoRotateSpeed = 0.3; controls.maxDistance = 140; controls.minDistance = 3;
scene.background = new THREE.Color(0x01010a);
scene.add(starField(3000, 1500));
const mat = new THREE.ShaderMaterial({
  uniforms: {uTime: {value: 0}, uPx: {value: renderer.getPixelRatio()}, uSpin: {value: 1}},
  vertexShader: SH('gvs'), fragmentShader: SH('gfs'),
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
let pts = null;
function build() {
  if (pts) { scene.remove(pts); pts.geometry.dispose(); }
  const N = +$('n').value, arms = +$('arms').value, twist = +$('tw').value, R = 20;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), sz = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = Math.pow(Math.random(), 1.7) * R + 0.15;
    const ang = (i % arms) / arms * 6.2832 + r * twist * 0.12;
    const sc = Math.pow(Math.random(), 3) * 0.5 * r * (Math.random() < 0.5 ? 1 : -1);
    const sc2 = Math.pow(Math.random(), 3) * 0.5 * r * (Math.random() < 0.5 ? 1 : -1);
    pos[i * 3] = Math.cos(ang) * r + sc;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 1.4 * Math.exp(-r / 9);
    pos[i * 3 + 2] = Math.sin(ang) * r + sc2;
    const k = r / R, pink = Math.random() < 0.07 && k > 0.35;
    let cr = 1.0 - 0.7 * k, cg = 0.72 - 0.22 * k, cb = 0.4 + 0.6 * k;
    if (pink) { cr = 1.0; cg = 0.25; cb = 0.65; }
    const dim = 0.4 + Math.random() * 0.6;
    col[i * 3] = cr * dim; col[i * 3 + 1] = cg * dim; col[i * 3 + 2] = cb * dim;
    sz[i] = 0.35 + Math.random() * 0.9 + (pink ? 0.8 : 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aC', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(sz, 1));
  pts = new THREE.Points(g, mat); pts.frustumCulled = false; scene.add(pts);
}
build();
const core = glowSprite(255, 190, 110); core.scale.set(11, 11, 1); scene.add(core);
bloom.strength = 0.8; bloom.radius = 0.7;
['n', 'arms', 'tw'].forEach(id => $(id).onchange = build);
$('sp').oninput = e => { mat.uniforms.uSpin.value = +e.target.value; };
tickFn = t => { mat.uniforms.uTime.value = t; };
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude80 Cyber City - neon night flight",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Cyber City - neon night flight</title>
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
<b>Cyber City</b><br>Neon night flight
<button id="mode">Mode: Orbit</button>
<label>Glow <input id="bl" type="range" min="0" max="2.5" step="0.05" value="1.1"></label>
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
controls.maxPolarAngle = Math.PI * 0.495; controls.maxDistance = 220;
camera.far = 1500; camera.updateProjectionMatrix();
const G = 26, S = 6;
const ctime = {value: 0};
// ground
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500).rotateX(-Math.PI / 2),
  new THREE.ShaderMaterial({uniforms: {uTime: ctime}, vertexShader: SH('gvs'), fragmentShader: SH('gfs')}));
scene.add(ground);
// buildings
const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const seeds = new Float32Array(G * G);
const bmat = new THREE.ShaderMaterial({uniforms: {uTime: ctime}, vertexShader: SH('bvs'), fragmentShader: SH('bfs')});
const blds = new THREE.InstancedMesh(geo, bmat, G * G);
const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
let nb = 0;
for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
  if (Math.random() < 0.12) continue;
  const x = (i - G / 2 + 0.5) * S, z = (j - G / 2 + 0.5) * S;
  const d = Math.min(1, Math.hypot(x, z) / 95);
  let hgt = 4 + Math.pow(Math.random(), 2.2) * 42 * (1.25 - d) + (Math.random() < 0.05 ? 16 : 0);
  hgt = Math.min(hgt, 52);
  const w = 2.2 + Math.random() * 1.4, dd = 2.2 + Math.random() * 1.4;
  pv.set(x, 0, z); sv.set(w, hgt, dd);
  m4.compose(pv, q0, sv); blds.setMatrixAt(nb, m4);
  seeds[nb++] = Math.random();
}
blds.count = nb;
geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
scene.add(blds);
// traffic
const NC = 260, cars = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0xffffff}), NC);
const cdat = [], tmpC = new THREE.Color();
for (let i = 0; i < NC; i++) {
  const alongX = Math.random() < 0.5, lane = Math.floor(Math.random() * G) - G / 2;
  const side = Math.random() < 0.5 ? 0.5 : -0.5;
  cdat.push({alongX, line: lane * S + side, off: Math.random() * G * S, sp: (6 + Math.random() * 10) * (side > 0 ? 1 : -1)});
  tmpC.setHSL(Math.random() < 0.5 ? 0.52 : 0.92, 1, 0.55).multiplyScalar(2.6);
  cars.setColorAt(i, tmpC);
}
scene.add(cars);
const span = G * S;
function updateCars(t) {
  for (let i = 0; i < NC; i++) {
    const c = cdat[i];
    const p = ((c.off + c.sp * t) % span + span) % span - span / 2;
    if (c.alongX) { pv.set(p, 0.3, c.line); sv.set(1.6, 0.35, 0.6); }
    else { pv.set(c.line, 0.3, p); sv.set(0.6, 0.35, 1.6); }
    m4.compose(pv, q0, sv); cars.setMatrixAt(i, m4);
  }
  cars.instanceMatrix.needsUpdate = true;
}
// fade overlay for street cuts
const fade = document.createElement('div');
fade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none';
document.body.appendChild(fade);
let mode = 0, streetX = 0, lastZ = 999;
const names = ['Orbit', 'Street', 'Free'];
$('mode').onclick = () => { mode = (mode + 1) % 3; $('mode').textContent = 'Mode: ' + names[mode]; controls.enabled = mode === 2; fade.style.opacity = 0; };
$('bl').oninput = e => { bloom.strength = +e.target.value; };
bloom.strength = 1.1; bloom.radius = 0.5; bloom.threshold = 0.2;
const look = new THREE.Vector3();
tickFn = (t) => {
  ctime.value = t; updateCars(t);
  if (mode === 0) {
    const a = t * 0.12;
    camera.position.set(Math.sin(a) * 70, 24 + 12 * Math.sin(t * 0.23), Math.cos(a) * 70);
    camera.lookAt(0, 10, 0);
  } else if (mode === 1) {
    const z = 95 - ((t * 15) % 190);
    if (z > lastZ) streetX = (Math.floor(Math.random() * 14) - 7) * S;
    lastZ = z;
    camera.position.set(streetX + Math.sin(t * 0.7) * 0.25, 5 + Math.sin(t * 0.9) * 0.6, z);
    look.set(streetX, 7, z - 30); camera.lookAt(look);
    fade.style.opacity = Math.min(1, Math.max(0, (Math.abs(z) - 82) / 12));
  }
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude80 Living Planet - day/night, clouds, moon",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Living Planet - day/night, clouds, moon</title>
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
<b>Living Planet</b><br>Drag = rotate &middot; Pinch = zoom
<label>Sun angle <input id="sun" type="range" min="0" max="6.28" step="0.01" value="0.8"></label>
<label>Auto day/night <input id="auto" type="checkbox" checked></label>
<label>Planet spin <input id="spin" type="range" min="0" max="1" step="0.02" value="0.15"></label>
</div>
<script type="x-shader/x-vertex" id="vs">
varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){
  vP = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
</script>
<script type="x-shader/x-fragment" id="noise">
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise3(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * noise3(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s;
}
</script>
<script type="x-shader/x-fragment" id="earth">
uniform vec3 uSun;
varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 p = normalize(vP);
  float e = fbm(p * 2.2 + 3.0) * 1.15 + fbm(p * 7.0) * 0.12;
  float sea = 0.52;
  float land = smoothstep(sea - 0.01, sea + 0.01, e);
  float hgt = clamp((e - sea) / 0.35, 0.0, 1.0);
  vec3 ocean = mix(vec3(0.0, 0.04, 0.18), vec3(0.05, 0.32, 0.58), smoothstep(0.25, sea, e));
  vec3 ground = mix(vec3(0.12, 0.38, 0.09), vec3(0.5, 0.38, 0.2), smoothstep(0.0, 0.5, hgt));
  ground = mix(ground, vec3(0.95), smoothstep(0.7, 0.95, hgt));
  vec3 col = mix(ocean, ground, land);
  float lat = abs(p.y);
  float ice = smoothstep(0.8, 0.93, lat + (e - 0.5) * 0.25);
  col = mix(col, vec3(0.95, 0.97, 1.0), ice);
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float dif = max(dot(N, uSun), 0.0);
  float night = 1.0 - smoothstep(-0.08, 0.12, dot(N, uSun));
  float oc = (1.0 - land) * (1.0 - ice);
  vec3 H = normalize(uSun + V);
  float spec = pow(max(dot(N, H), 0.0), 70.0) * oc;
  float city = step(0.74, noise3(p * 55.0)) * night * land * (1.0 - ice) * step(0.2, hgt + 0.1) * smoothstep(0.1, 0.4, fbm(p * 9.0));
  vec3 c = col * (0.03 + dif) + spec * vec3(1.0, 0.9, 0.7) * 0.9 + city * vec3(1.0, 0.75, 0.35) * 2.2;
  float tw = smoothstep(0.0, 0.25, dif) * (1.0 - smoothstep(0.25, 0.6, dif));
  c += vec3(0.9, 0.3, 0.1) * tw * 0.12;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  c += vec3(0.25, 0.5, 1.0) * fres * (0.15 + dif * 0.9);
  gl_FragColor = vec4(c, 1.0);
}
</script>
<script type="x-shader/x-fragment" id="cloud">
uniform vec3 uSun; uniform float uTime;
varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 p = normalize(vP);
  float c = fbm(p * 3.2 + vec3(0.0, 0.0, uTime * 0.02));
  float a = smoothstep(0.5, 0.74, c);
  vec3 N = normalize(vN);
  float dif = max(dot(N, uSun), 0.0);
  vec3 col = vec3(1.0) * (0.04 + dif * 1.05);
  gl_FragColor = vec4(col, a * 0.9);
}
</script>
<script type="x-shader/x-fragment" id="atmo">
uniform vec3 uSun;
varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float f = pow(clamp(0.9 + dot(N, V), 0.0, 1.0), 3.5);
  float lit = clamp(0.25 + dot(normalize(vW), uSun) * 1.2, 0.0, 1.0);
  gl_FragColor = vec4(vec3(0.3, 0.6, 1.0) * f * lit * 2.2, f * lit);
}
</script>
<script type="x-shader/x-fragment" id="moon">
uniform vec3 uSun;
varying vec3 vP; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 p = normalize(vP);
  float m = fbm(p * 4.0) * 0.6 + fbm(p * 14.0) * 0.4;
  float crater = smoothstep(0.45, 0.5, noise3(p * 9.0)) * 0.25;
  vec3 col = vec3(0.62, 0.6, 0.57) * (0.45 + 0.7 * m - crater);
  float dif = max(dot(normalize(vN), uSun), 0.0);
  gl_FragColor = vec4(col * (0.02 + dif * 1.15), 1.0);
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

camera.position.set(0, 5, 19); controls.minDistance = 7.5; controls.maxDistance = 90;
scene.background = new THREE.Color(0x000006);
scene.add(starField(6000, 1800));
const sun = new THREE.Vector3(1, 0.25, 0.5).normalize();
const uSun = {value: sun}, uT = {value: 0};
const NOISE = SH('noise');
function mk(src, extra) {
  return new THREE.ShaderMaterial(Object.assign({
    uniforms: {uSun: uSun, uTime: uT}, vertexShader: SH('vs'), fragmentShader: NOISE + '\n' + SH(src)}, extra || {}));
}
const planet = new THREE.Mesh(new THREE.SphereGeometry(5, 128, 96), mk('earth'));
const clouds = new THREE.Mesh(new THREE.SphereGeometry(5.07, 96, 72), mk('cloud', {transparent: true, depthWrite: false}));
const atmo = new THREE.Mesh(new THREE.SphereGeometry(5.7, 96, 72), mk('atmo', {side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
const moon = new THREE.Mesh(new THREE.SphereGeometry(1.3, 64, 48), mk('moon'));
scene.add(planet, clouds, atmo, moon);
const sunSpr = glowSprite(255, 220, 160); sunSpr.scale.set(120, 120, 1); scene.add(sunSpr);
bloom.strength = 0.55; bloom.threshold = 0.5; bloom.radius = 0.6;
let sunA = 0.8;
$('sun').oninput = e => { sunA = +e.target.value; };
tickFn = (t, dt) => {
  if ($('auto').checked) { sunA = (sunA + dt * 0.12) % 6.2832; $('sun').value = sunA; }
  sun.set(Math.cos(sunA), 0.25, Math.sin(sunA)).normalize();
  sunSpr.position.copy(sun).multiplyScalar(500);
  const sp = +$('spin').value;
  planet.rotation.y += dt * sp * 0.4; clouds.rotation.y += dt * sp * 0.5;
  moon.position.set(Math.cos(t * 0.15) * 15, Math.sin(t * 0.15) * 2.5, Math.sin(t * 0.15) * 15);
  moon.rotation.y = t * 0.05;
  uT.value = t;
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude80 Ocean Sunset - waves + sailboat",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Ocean Sunset - waves + sailboat</title>
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
<b>Ocean Sunset</b><br>Drag = look around &middot; Pinch = zoom
<label>Time of day <input id="tod" type="range" min="0" max="1" step="0.005" value="0.18"></label>
<label>Wave height <input id="amp" type="range" min="0.2" max="2.5" step="0.05" value="1"></label>
</div>
<script type="x-shader/x-fragment" id="sky">
uniform vec3 uSunDir;
vec3 skyCol(vec3 d){
  float el = clamp(d.y, 0.0, 1.0);
  vec3 horizon = mix(vec3(1.0, 0.45, 0.15), vec3(0.65, 0.8, 1.0), clamp(uSunDir.y * 1.8, 0.0, 1.0));
  vec3 zenith = mix(vec3(0.04, 0.03, 0.18), vec3(0.1, 0.3, 0.7), clamp(uSunDir.y * 2.0 + 0.2, 0.0, 1.0));
  vec3 c = mix(horizon, zenith, pow(el, 0.5));
  float sd = max(dot(d, uSunDir), 0.0);
  c += vec3(1.0, 0.6, 0.3) * pow(sd, 8.0) * 0.6 + vec3(1.0, 0.9, 0.7) * pow(sd, 400.0) * 4.0;
  return c;
}
</script>
<script type="x-shader/x-vertex" id="svs">
varying vec3 vD;
void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
</script>
<script type="x-shader/x-fragment" id="sfs">
varying vec3 vD;
void main(){ gl_FragColor = vec4(skyCol(normalize(vD)), 1.0); }
</script>
<script type="x-shader/x-vertex" id="wvs">
uniform float uTime, uAmp, uQ;
uniform vec4 uW[4];
varying vec3 vW; varying vec3 vN; varying float vH;
void main(){
  vec3 p = position; vec3 n = vec3(0.0, 1.0, 0.0);
  float hsum = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 D = uW[i].xy; float w = uW[i].z, A = uW[i].w * uAmp;
    float ph = w * dot(D, position.xz) + sqrt(9.8 * w) * uTime;
    float c = cos(ph), s = sin(ph);
    p.x += uQ * A * D.x * c / 1.0; p.z += uQ * A * D.y * c; p.y += A * s;
    n.x -= D.x * w * A * c; n.z -= D.y * w * A * c; n.y -= uQ * w * A * s;
    hsum += s * uW[i].w;
  }
  vH = hsum;
  vN = normalize(n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
</script>
<script type="x-shader/x-fragment" id="wfs">
varying vec3 vW; varying vec3 vN; varying float vH;
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 deep = vec3(0.0, 0.07, 0.13), shallow = vec3(0.0, 0.3, 0.35);
  vec3 base = mix(deep, shallow, clamp(0.5 + vH * 0.6, 0.0, 1.0)) * (0.25 + uSunDir.y);
  vec3 col = mix(base, skyCol(R), fres);
  float sp = pow(max(dot(R, uSunDir), 0.0), 500.0);
  col += vec3(1.0, 0.8, 0.5) * sp * 4.0;
  col += vec3(1.0) * smoothstep(0.62, 0.95, vH) * 0.35;
  float d = length(vW - cameraPosition);
  col = mix(col, skyCol(normalize(vec3(-V.x, 0.03, -V.z))), 1.0 - exp(-d * 0.0035));
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

camera.position.set(0, 7, 28); controls.target.set(0, 3, 0);
controls.minDistance = 4; controls.maxDistance = 120; controls.maxPolarAngle = Math.PI * 0.49;
const sunDir = new THREE.Vector3(0, 0.1, -1);
const SKY = SH('sky');
const uSunDir = {value: sunDir};
const uTime = {value: 0}, uAmp = {value: 1};
const waves = [[1, 0.2, 34, 0.55], [0.6, 0.8, 19, 0.32], [-0.4, 0.9, 11, 0.18], [0.9, -0.5, 6.5, 0.1]];
const WV = waves.map(w => { const l = Math.hypot(w[0], w[1]); return new THREE.Vector4(w[0] / l, w[1] / l, 2 * Math.PI / w[2], w[3]); });
const Q = 0.55 / (WV[0].z * WV[0].w * 4);
// sky dome
scene.add(new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 24),
  new THREE.ShaderMaterial({uniforms: {uSunDir: uSunDir}, vertexShader: SH('svs'), fragmentShader: SKY + SH('sfs'), side: THREE.BackSide, depthWrite: false})));
// water
const water = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 240, 240).rotateX(-Math.PI / 2),
  new THREE.ShaderMaterial({
    uniforms: {uSunDir: uSunDir, uTime: uTime, uAmp: uAmp, uQ: {value: Q}, uW: {value: WV}},
    vertexShader: SH('wvs'), fragmentShader: SKY + SH('wfs')}));
water.frustumCulled = false; scene.add(water);
// little sailing boat that rides the same waves
function waveAt(x, z, t) {
  let y = 0, nx = 0, nz = 0;
  for (const w of WV) {
    const A = w.w * uAmp.value, ph = w.z * (w.x * x + w.y * z) + Math.sqrt(9.8 * w.z) * t;
    y += A * Math.sin(ph); nx += w.x * w.z * A * Math.cos(ph); nz += w.y * w.z * A * Math.cos(ph);
  }
  return {y, nx, nz};
}
const boat = new THREE.Group();
const hullMat = new THREE.MeshStandardMaterial({color: 0x7a3b1e, roughness: 0.6});
const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 1.1), hullMat); hull.position.y = 0.2; boat.add(hull);
const bow = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 4).rotateZ(-Math.PI / 2), hullMat); bow.position.set(2.1, 0.2, 0); bow.scale.set(1, 1, 1); boat.add(bow);
const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 8), new THREE.MeshStandardMaterial({color: 0xdddddd})); mast.position.y = 2.4; boat.add(mast);
const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(2.4, 0); sh.lineTo(0, 3.6); sh.lineTo(0, 0);
const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({color: 0xfff2dd, side: THREE.DoubleSide, roughness: 0.9}));
sail.position.set(-0.1, 0.8, 0); sail.rotation.y = Math.PI / 2; boat.add(sail);
const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({color: 0xffc060})); lamp.position.set(0, 4.5, 0); boat.add(lamp);
scene.add(boat);
const amb = new THREE.AmbientLight(0xffffff, 0.8), dl = new THREE.DirectionalLight(0xffd6a0, 2.5);
scene.add(amb, dl);
bloom.strength = 0.8; bloom.threshold = 0.6; bloom.radius = 0.5;
function setTime(v) {
  const el = -0.08 + v * 1.0;
  sunDir.set(0.25, Math.sin(el), -Math.cos(el)).normalize();
  dl.position.copy(sunDir).multiplyScalar(50);
  dl.color.setRGB(1, 0.55 + 0.4 * Math.min(1, sunDir.y * 2), 0.3 + 0.6 * Math.min(1, sunDir.y * 2));
  dl.intensity = 0.4 + Math.max(0, sunDir.y) * 3;
  amb.intensity = 0.25 + Math.max(0, sunDir.y) * 0.8;
}
$('tod').oninput = e => setTime(+e.target.value);
$('amp').oninput = e => { uAmp.value = +e.target.value; };
setTime(0.18);
tickFn = (t) => {
  uTime.value = t;
  const x = Math.sin(t * 0.05) * 18, z = -8 + Math.cos(t * 0.05) * 6;
  const w = waveAt(x, z, t);
  boat.position.set(x, w.y - 0.1, z);
  boat.rotation.set(-Math.atan(w.nz) * 0.7, -Math.cos(t * 0.05) * 0.5, Math.atan(w.nx) * 0.7);
};
</script>
</body></html>
`
});
E.html.push({
  name: "\ud83d\ude80 Mandelbulb - real 3D fractal",
  code: String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Mandelbulb - real 3D fractal</title>
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
<b>Mandelbulb</b><br>Real 3D fractal (ray-marched)<br>Drag = rotate &middot; Pinch = zoom
<label>Quality <input id="q" type="range" min="0.3" max="1.2" step="0.05" value="0.6"></label>
<label>Power <input id="pw" type="range" min="2" max="12" step="0.1" value="8"></label>
<label>Morph <input id="mo" type="checkbox" checked></label>
</div>
<script type="x-shader/x-vertex" id="vs">
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
</script>
<script type="x-shader/x-fragment" id="fs">
uniform vec2 uRes; uniform vec3 uCam; uniform mat3 uMat; uniform float uPow, uTime;
float de(vec3 p, out float trap){
  vec3 z = p; float dr = 1.0, r = 0.0; trap = 1e9;
  for (int i = 0; i < 8; i++) {
    r = length(z);
    if (r > 2.0) break;
    float th = acos(clamp(z.z / r, -1.0, 1.0)), ph = atan(z.y, z.x);
    dr = pow(r, uPow - 1.0) * uPow * dr + 1.0;
    float zr = pow(r, uPow); th *= uPow; ph *= uPow;
    z = zr * vec3(sin(th) * cos(ph), sin(th) * sin(ph), cos(th)) + p;
    trap = min(trap, dot(z, z));
  }
  return 0.5 * log(r) * r / dr;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = uCam, rd = normalize(uMat * vec3(uv, -1.3));
  float t = max(0.0, length(ro) - 1.4), trap = 0.0, md = 1e9, d = 1.0;
  int steps = 0; bool hit = false;
  for (int i = 0; i < 100; i++) {
    d = de(ro + rd * t, trap);
    md = min(md, d);
    if (d < 0.0006 * t) { hit = true; break; }
    t += d; steps = i;
    if (t > 6.0) break;
  }
  vec3 bg = mix(vec3(0.01, 0.015, 0.05), vec3(0.05, 0.03, 0.12), uv.y + 0.5);
  vec3 col = bg + vec3(0.2, 0.4, 1.0) * 0.012 / (md + 0.012);
  if (hit) {
    vec3 p = ro + rd * t; float tr, e = 0.002;
    vec3 n = normalize(vec3(de(p + vec3(e, 0, 0), tr) - de(p - vec3(e, 0, 0), tr),
                            de(p + vec3(0, e, 0), tr) - de(p - vec3(0, e, 0), tr),
                            de(p + vec3(0, 0, e), tr) - de(p - vec3(0, 0, e), tr)));
    de(p, trap);
    vec3 pal = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + sqrt(trap) * 0.9 + uTime * 0.02));
    vec3 L = normalize(vec3(cos(uTime * 0.4), 0.7, sin(uTime * 0.4)));
    float dif = max(dot(n, L), 0.0), ao = 1.0 - float(steps) / 100.0;
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    col = pal * (0.12 + dif * 1.0) * ao * ao + vec3(0.4, 0.6, 1.0) * rim * 0.35 + pal * 0.15 * ao;
  }
  col = pow(col * 1.1, vec3(0.4545));
  col *= 1.0 - 0.35 * dot(uv, uv);
  gl_FragColor = vec4(col, 1.0);
}
</script>

<script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $ = id => document.getElementById(id);
const SH = id => document.getElementById(id).textContent;
const renderer = new THREE.WebGLRenderer({antialias: false});
renderer.setPixelRatio(0.6);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
let tickFn = () => {};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  tickFn(t, dt); controls.update();
});

camera.position.set(0, 0.6, 3.2); controls.minDistance = 1.3; controls.maxDistance = 8;
controls.autoRotate = true; controls.autoRotateSpeed = 0.8;
const uni = {uRes: {value: new THREE.Vector2()}, uCam: {value: new THREE.Vector3()}, uMat: {value: new THREE.Matrix3()}, uPow: {value: 8}, uTime: {value: 0}};
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({uniforms: uni, vertexShader: SH('vs'), fragmentShader: SH('fs'), depthTest: false, depthWrite: false}));
quad.frustumCulled = false;
const scene = new THREE.Scene(), cam2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
scene.add(quad);
let pw = 8;
$('q').oninput = e => { renderer.setPixelRatio(+e.target.value); renderer.setSize(innerWidth, innerHeight); };
$('pw').oninput = e => { pw = +e.target.value; };
function frame(t) {
  uni.uTime.value = t;
  uni.uPow.value = $('mo').checked ? 8 + 2 * Math.sin(t * 0.25) : pw;
  uni.uCam.value.copy(camera.position);
  camera.updateMatrixWorld(); uni.uMat.value.setFromMatrix4(camera.matrixWorld);
  const s = renderer.getDrawingBufferSize(new THREE.Vector2());
  uni.uRes.value.copy(s);
  renderer.render(scene, cam2);
}
tickFn = frame;
</script>
</body></html>
`
});
})();
