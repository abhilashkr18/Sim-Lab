/* =========================================================
   SIM LAB - examples3d4.js
   Architecture: text floor plan -> 3D building
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
#ui{position:absolute;top:8px;left:8px;width:260px;max-height:92vh;overflow:auto;background:rgba(0,0,0,.65);padding:8px 10px;border-radius:8px;font-size:12px}
#ui label{display:block;margin-top:6px}
#ui input[type=range]{width:100%}
#ui select{width:100%;margin-top:4px}
#ui button{margin-top:6px;padding:4px 10px}
#plan{width:100%;box-sizing:border-box;margin-top:6px;background:#111;color:#ddd;border:1px solid #444;border-radius:4px;font:11px/1.4 monospace;white-space:pre}
#err{color:#f87171;margin-top:4px;white-space:pre-wrap}
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
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
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
function addGround(size, col) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size * 2), mat(col || 0x1c2a3f, 0.9, 0));
  g.rotation.x = -Math.PI / 2;
  g.position.y = -0.21;
  g.receiveShadow = true;
  scene.add(g);
}
`;

function page(ui, js) {
  return HEAD + ui + '\n<div id="hud"></div>\n<script type="module">\n' + COMMON + js +
         '\n</' + 'script>\n</body>\n</html>\n';
}

const UI = String.raw`<div id="ui"><b>🏠 Floor plan → 3D</b>
<select id="preset"><option value="0">Preset: Ghar (2 floors)</option><option value="1">Preset: Office (4 floors)</option></select>
<textarea id="plan" rows="14" spellcheck="false"></textarea>
<button id="go">▶ Build 3D</button>
<div id="err"></div>
<div style="opacity:.75;margin-top:6px">
Format (meter me):<br>
floors N &nbsp; height H<br>
room NAME X Y W D #color<br>
door X Y LEN h|v &nbsp; win X Y LEN h|v<br>
h = x-direction wall (y=Y line), v = y-direction wall (x=X line)
</div>
<label>Floors dikhao: <span id="vfl"></span><input id="fl" type="range" min="1" max="2" step="1" value="2"></label>
<label>Wall opacity: <span id="vop"></span><input id="op" type="range" min="0.1" max="1" step="0.05" value="1"></label>
<label>Time of day: <span id="vhr"></span> h<input id="hr" type="range" min="5" max="19" step="0.25" value="14"></label>
<label><input id="roof" type="checkbox" checked> Roof</label>
<label><input id="lab" type="checkbox" checked> Room labels</label>
</div>`;

const JS = String.raw`
scene.background = new THREE.Color(0x87a7d6);
addGround(80, 0x6b7f6a);

const hemi = new THREE.HemisphereLight(0xbcd7ff, 0x445566, 0.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
{ const c = sun.shadow.camera; c.left = -40; c.right = 40; c.top = 40; c.bottom = -40; c.far = 300; }
scene.add(sun);

const PRESETS = [
  [
    '# Ghar: 10 x 9 m, 2 floors',
    'floors 2',
    'height 3',
    'room Living 0 0 6 5 #e9d8a6',
    'room Kitchen 6 0 4 5 #b7e4c7',
    'room Bedroom 0 5 5 4 #cdb4db',
    'room Bath 5 5 2.5 4 #a2d2ff',
    'room Study 7.5 5 2.5 4 #ffc8dd',
    '# doors',
    'door 2 0 1.2 h',
    'door 6 2 1 v',
    'door 2.5 5 1 h',
    'door 5 6 0.9 v',
    'door 7.5 6 0.9 v',
    '# windows',
    'win 3.8 0 1.5 h',
    'win 7 0 2 h',
    'win 0 1 2 v',
    'win 0 6 2 v',
    'win 10 1 2 v',
    'win 1 9 2 h',
    'win 8 9 1.2 h'
  ],
  [
    '# Office: 19 x 14 m, 4 floors',
    'floors 4',
    'height 3.6',
    'room Lobby 0 0 8 6 #f4d58d',
    'room Meeting 8 0 6 6 #a8dadc',
    'room Open_Office 0 6 14 8 #cdeac0',
    'room Cabin 14 0 5 7 #e5b3fe',
    'room Pantry 14 7 5 7 #ffb5a7',
    'door 3 0 2 h',
    'door 8 2 1 v',
    'door 5 6 1.5 h',
    'door 11 6 1 h',
    'door 14 3 1 v',
    'door 14 9 1 v',
    'win 0.5 0 2 h',
    'win 5.5 0 2 h',
    'win 9 0 4 h',
    'win 15 0 3 h',
    'win 0 1 3 v',
    'win 0 8 4 v',
    'win 19 1 4 v',
    'win 19 9 4 v',
    'win 1 14 5 h',
    'win 8 14 5 h',
    'win 15 14 3 h'
  ]
];

const T = 0.15, U = 10, SL = 0.2;
const root = new THREE.Group(); scene.add(root);
const floorGroups = [];
let roofMesh = null;
const labels = [];
const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8, metalness: 0 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
const doorMat = mat(0x8b5e3c, 0.7, 0);

let info = null;

function parse(txt) {
  const o = { floors: 2, h: 3, rooms: [], doors: [], wins: [] };
  txt.split('\n').forEach((raw, i) => {
    const l = raw.trim();
    if (!l || l[0] === '#') return;
    const t = l.split(/\s+/), k = t[0].toLowerCase();
    const num = j => { const n = parseFloat(t[j]); if (isNaN(n)) throw new Error('Line ' + (i + 1) + ': number galat -> ' + l); return n; };
    if (k === 'floors') o.floors = Math.max(1, Math.min(30, Math.round(num(1))));
    else if (k === 'height') o.h = Math.max(2.2, Math.min(8, num(1)));
    else if (k === 'room') {
      if (t.length < 6) throw new Error('Line ' + (i + 1) + ': room NAME X Y W D #color');
      const r = { name: t[1], x: num(2), y: num(3), w: num(4), d: num(5), c: t[6] || '#dddddd' };
      if (r.w <= 0 || r.d <= 0) throw new Error('Line ' + (i + 1) + ': W aur D positive hone chahiye');
      o.rooms.push(r);
    } else if (k === 'door' || k === 'win') {
      const dir = (t[4] || '').toLowerCase();
      if (dir !== 'h' && dir !== 'v') throw new Error('Line ' + (i + 1) + ': last me h ya v likho');
      const p = { x: num(1), y: num(2), len: num(3), dir: dir };
      p.line = dir === 'h' ? p.y : p.x;
      p.s = dir === 'h' ? p.x : p.y;
      p.e = p.s + p.len;
      (k === 'door' ? o.doors : o.wins).push(p);
    } else throw new Error('Line ' + (i + 1) + ': samajh nahi aaya -> ' + l);
  });
  if (!o.rooms.length) throw new Error('Kam se kam ek room chahiye.');
  return o;
}

function runsOf(set) {
  const a = [...set].sort((x, y) => x - y), out = [];
  let s = null, p = null;
  a.forEach(v => {
    if (s === null) { s = v; p = v; }
    else if (v === p + 1) p = v;
    else { out.push([s, p + 1]); s = v; p = v; }
  });
  if (s !== null) out.push([s, p + 1]);
  return out;
}

function makeLabel(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#fff'; g.textAlign = 'center';
  const parts = text.split('|');
  g.font = 'bold 40px sans-serif'; g.fillText(parts[0], 128, 56);
  g.font = '34px sans-serif'; g.fillStyle = '#ffd166'; g.fillText(parts[1], 128, 100);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  s.renderOrder = 10;
  return s;
}

function clearAll() {
  const kill = o => {
    o.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      if (n.material && n.material.map) n.material.map.dispose();
    });
  };
  while (root.children.length) { const o = root.children[0]; root.remove(o); kill(o); }
  floorGroups.length = 0; labels.length = 0; roofMesh = null;
}

function build() {
  const err = $('err'); err.textContent = '';
  let P;
  try { P = parse($('plan').value); }
  catch (e) { err.textContent = e.message; return; }
  clearAll();

  /* walls: room edges -> 0.1 m unit edges -> dedupe -> merged runs */
  const EH = {}, EV = {};
  const addE = (m, line, a, b) => { (m[line] = m[line] || new Set()); for (let i = a; i < b; i++) m[line].add(i); };
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, foot = 0;
  P.rooms.forEach(r => {
    const x0 = Math.round(r.x * U), x1 = Math.round((r.x + r.w) * U), y0 = Math.round(r.y * U), y1 = Math.round((r.y + r.d) * U);
    addE(EH, y0, x0, x1); addE(EH, y1, x0, x1); addE(EV, x0, y0, y1); addE(EV, x1, y0, y1);
    minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.d);
    foot += r.w * r.d;
  });
  const walls = [];
  Object.keys(EH).forEach(k => runsOf(EH[k]).forEach(r => walls.push({ o: 'h', line: +k / U, a: r[0] / U, b: r[1] / U })));
  Object.keys(EV).forEach(k => runsOf(EV[k]).forEach(r => walls.push({ o: 'v', line: +k / U, a: r[0] / U, b: r[1] / U })));

  const H = P.h;
  let wallLen = 0, winArea = 0, doorCount = 0;
  walls.forEach(w => { wallLen += w.b - w.a; });
  P.wins.forEach(w => { winArea += w.len * 1.2; });
  doorCount = P.doors.length;

  for (let f = 0; f < P.floors; f++) {
    const grp = new THREE.Group(); grp.position.y = f * H; root.add(grp); floorGroups.push(grp);

    P.rooms.forEach(r => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(r.w, SL, r.d), mat(new THREE.Color(r.c), 0.85, 0));
      s.position.set(r.x + r.w / 2, -SL / 2, r.y + r.d / 2);
      s.receiveShadow = true; s.castShadow = true; grp.add(s);
      if (f === 0) {
        const lb = makeLabel(r.name.replace(/_/g, ' ') + '|' + (r.w * r.d).toFixed(1) + ' m2');
        lb.position.set(r.x + r.w / 2, 0.6, r.y + r.d / 2);
        lb.scale.set(Math.min(3.2, Math.max(1.6, r.w * 0.5)), 1.6 * 0.5 * Math.min(3.2, Math.max(1.6, r.w * 0.5)) / 1.6 * 0.5, 1);
        grp.add(lb); labels.push(lb);
      }
    });

    walls.forEach(w => {
      const ops = P.doors.map(d => ({ s: d.s, e: d.e, d: d, door: true, dir: d.dir, line: d.line }))
        .concat(P.wins.map(d => ({ s: d.s, e: d.e, d: d, door: false, dir: d.dir, line: d.line })))
        .filter(p => p.dir === w.o && Math.abs(p.line - w.line) < 0.06 && p.e > w.a && p.s < w.b)
        .sort((p, q) => p.s - q.s);

      const piece = (c0, c1, y0, y1, m, shadow) => {
        const len = c1 - c0;
        if (len < 0.01 || y1 - y0 < 0.01) return;
        const g = w.o === 'h' ? new THREE.BoxGeometry(len, y1 - y0, T) : new THREE.BoxGeometry(T, y1 - y0, len);
        const me = new THREE.Mesh(g, m);
        const mid = (c0 + c1) / 2, my = (y0 + y1) / 2;
        if (w.o === 'h') me.position.set(mid, my, w.line); else me.position.set(w.line, my, mid);
        me.castShadow = shadow !== false; me.receiveShadow = true;
        grp.add(me);
      };

      const a = w.a - T / 2, b = w.b + T / 2;
      let cur = a;
      ops.forEach(p => {
        const s = Math.max(p.s, cur), e = Math.min(p.e, b);
        if (e <= s) return;
        piece(cur, s, 0, H, wallMat);
        if (p.door) {
          piece(s, e, 2.1, H, wallMat);
        } else {
          piece(s, e, 0, 0.9, wallMat);
          piece(s, e, 2.1, H, wallMat);
          piece(s, e, 0.9, 2.1, glassMat, false);
        }
        cur = e;
      });
      piece(cur, b, 0, H, wallMat);
    });
  }

  /* roof */
  const bw = maxX - minX, bd = maxY - minY;
  roofMesh = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.6, SL, bd + 0.6), mat(0x6b7280, 0.7, 0.1));
  roofMesh.position.set(minX + bw / 2, P.floors * H + SL / 2, minY + bd / 2);
  roofMesh.castShadow = true; roofMesh.receiveShadow = true; root.add(roofMesh);

  /* UI sync */
  const fl = $('fl'); fl.max = P.floors; fl.value = P.floors; $('vfl').textContent = P.floors;
  const cx = minX + bw / 2, cz = minY + bd / 2, dist = Math.max(bw, bd) * 1.3 + P.floors * H * 0.8 + 6;
  camera.position.set(cx + dist * 0.8, P.floors * H * 0.9 + dist * 0.55, cz + dist);
  controls.target.set(cx, P.floors * H * 0.4, cz);

  info = { P, foot, wallLen, winArea, doorCount, H, h: P.floors * H, bw, bd };
  refresh();
}

function refresh() {
  if (!info) return;
  const n = V('fl'), P = info.P;
  $('vfl').textContent = n; $('vop').textContent = $('op').value;
  floorGroups.forEach((g, i) => { g.visible = i < n; });
  if (roofMesh) roofMesh.visible = $('roof').checked && n === P.floors;
  const op = V('op');
  wallMat.transparent = op < 1; wallMat.opacity = op; wallMat.needsUpdate = true;
  labels.forEach(l => { l.visible = $('lab').checked; });

  const h = V('hr'), a = (h - 6) / 12 * Math.PI, s = Math.sin(a);
  sun.position.set(-Math.cos(a) * 80, Math.max(s, 0.03) * 80, 30);
  sun.intensity = Math.max(0.1, s * 2.2);
  hemi.intensity = 0.2 + 0.6 * Math.max(s, 0);
  scene.background.set(0x0a1020).lerp(new THREE.Color(0x87a7d6), Math.max(s, 0));
  $('vhr').textContent = h;

  $('hud').textContent =
    'Rooms        ' + P.rooms.length + '\n' +
    'Footprint    ' + info.foot.toFixed(1) + ' m2 (' + info.bw.toFixed(1) + ' x ' + info.bd.toFixed(1) + ' m)\n' +
    'Floors       ' + P.floors + '  (dikh rahe: ' + n + ')   GFA ' + (info.foot * P.floors).toFixed(0) + ' m2\n' +
    'Height       ' + info.h.toFixed(1) + ' m\n' +
    'Wall length  ' + info.wallLen.toFixed(1) + ' m / floor\n' +
    'Doors ' + info.doorCount + '   Window area ' + info.winArea.toFixed(1) + ' m2 / floor\n' +
    'Window/floor ' + (info.winArea / info.foot * 100).toFixed(0) + ' %';
}

function loadPreset(i) { $('plan').value = PRESETS[i].join('\n'); build(); }

$('preset').addEventListener('change', e => loadPreset(+e.target.value));
$('go').addEventListener('click', build);
['fl', 'op', 'hr', 'roof', 'lab'].forEach(id => $(id).addEventListener('input', refresh));
loadPreset(0);

(function loop() {
  requestAnimationFrame(loop);
  controls.update();
  renderer.render(scene, camera);
})();
`;

const E = (window.EXAMPLES = window.EXAMPLES || {});
E.html = E.html || [];
E.html.splice(Math.min(9, E.html.length), 0,
  { name: "3D Architecture - Floor plan -> 3D building (editable)", code: page(UI, JS) });

})();
