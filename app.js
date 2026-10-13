/* =========================================================
   SIM LAB - app.js  (FINAL, multi-file project support included)
   Depends on: index.html (IDs), style.css, examples.js,
   examples3d.js, project.js, Monaco loader, Pyodide, Plotly
   ========================================================= */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const MONACO = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min';

/* ---------- language table ---------- */
const LANGS = {
  python:     { label: 'Python',          ext: 'py',   judge: 71, local: true },
  javascript: { label: 'JavaScript',      ext: 'js',   judge: 63, local: true },
  html:       { label: 'HTML / CSS / JS', ext: 'html', judge: 0,  local: true },
  cpp:        { label: 'C++',             ext: 'cpp',  judge: 54 },
  c:          { label: 'C',               ext: 'c',    judge: 50 },
  java:       { label: 'Java',            ext: 'java', judge: 62 },
  rust:       { label: 'Rust',            ext: 'rs',   judge: 73 },
  go:         { label: 'Go',              ext: 'go',   judge: 60 }
};

/* ---------- storage helpers ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

const DEFAULT_SETTINGS = { url: 'https://ce.judge0.com', key: '', host: '', font: 14, autorun: false };
let settings = Object.assign({}, DEFAULT_SETTINGS, LS.get('simlab.settings', {}));
let state    = Object.assign({ lang: 'python', codes: {}, input: '', params: [], json: '' }, LS.get('simlab.state', {}));
let theme    = LS.get('simlab.theme', 'dark');

/* ---------- globals ---------- */
let editor = null;
let running = false;
let abortCtl = null;
let pyodide = null;
let mplReady = false;
let hasPlot = false;
const files = {};            // Files tab uploads: name -> { bytes, text, size }

/* =========================================================
   UTILITIES
   ========================================================= */
function b64enc(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64dec(b64) {
  if (!b64) return '';
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
const toUrlB64   = s => b64enc(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromUrlB64 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return b64dec(s); };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const fail  = msg => { const e = new Error(msg); e.pretty = msg; return e; };

function fmtArg(a) {
  if (a instanceof Error) return a.message;
  if (typeof a === 'object' && a !== null) { try { return JSON.stringify(a); } catch { return String(a); } }
  return String(a);
}

function setStatus(msg, kind) {
  $('status-msg').textContent = msg;
  $('statusbar').className = kind === 'busy' ? 'busy' : kind === 'error' ? 'error' : '';
}

function out(text, cls) {
  const pre = $('output');
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.textContent = text;
  pre.appendChild(span);
  pre.scrollTop = pre.scrollHeight;
}

/* =========================================================
   TABS
   ========================================================= */
function showTab(group, tab) {
  document.querySelectorAll('.tabs[data-group="' + group + '"] .tab')
    .forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-body[data-group="' + group + '"]')
    .forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (group === 'output' && tab === 'graph' && hasPlot) {
    try { Plotly.Plots.resize($('plotly-div')); } catch {}
  }
}

function initTabs() {
  document.querySelectorAll('.tabs').forEach(bar => {
    bar.addEventListener('click', e => {
      const b = e.target.closest('.tab');
      if (b) showTab(bar.dataset.group, b.dataset.tab);
    });
  });
}

/* =========================================================
   PARAMETERS
   ========================================================= */
function addParamRow(name = '', value = '') {
  const row = document.createElement('div');
  row.className = 'param-row';
  row.innerHTML =
    '<input class="p-name" type="text" placeholder="name">' +
    '<input class="p-val" type="text" placeholder="value">' +
    '<button title="Remove">✕</button>';
  row.querySelector('.p-name').value = name;
  row.querySelector('.p-val').value = value;
  row.addEventListener('input', persist);
  row.querySelector('button').addEventListener('click', () => { row.remove(); persist(); });
  $('params-list').appendChild(row);
}

function renderParams(pairs) {
  $('params-list').innerHTML = '';
  const arr = Array.isArray(pairs) ? pairs : Object.entries(pairs || {});
  arr.forEach(([k, v]) => addParamRow(k, String(v)));
}

function paramPairs() {
  return [...document.querySelectorAll('.param-row')].map(r => [
    r.querySelector('.p-name').value.trim(),
    r.querySelector('.p-val').value
  ]).filter(p => p[0]);
}

function getParams() {
  const o = {};
  paramPairs().forEach(([k, v]) => {
    const t = v.trim();
    if (t !== '' && !isNaN(Number(t))) o[k] = Number(t);
    else if (t === 'true') o[k] = true;
    else if (t === 'false') o[k] = false;
    else o[k] = v;
  });
  return o;
}

/* =========================================================
   JSON INPUT
   ========================================================= */
function validateJson() {
  const t = $('json-input').value.trim();
  const el = $('json-status');
  if (!t) { el.textContent = ''; el.className = 'hint'; return; }
  try { JSON.parse(t); el.textContent = '✓ Valid JSON'; el.className = 'hint ok'; }
  catch (e) { el.textContent = '✗ ' + e.message; el.className = 'hint bad'; }
}

function getData() {
  const t = $('json-input').value.trim();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return undefined; }
}

/* =========================================================
   FILES TAB (data uploads)
   ========================================================= */
async function addFiles(list) {
  for (const f of list) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    files[f.name] = { bytes, size: f.size, text: f.size < 2e6 ? new TextDecoder().decode(bytes) : '' };
  }
  renderFiles();
}

function renderFiles() {
  const ul = $('file-list');
  ul.innerHTML = '';
  Object.entries(files).forEach(([name, f]) => {
    const li = document.createElement('li');
    const n = document.createElement('span'); n.className = 'fname'; n.textContent = name;
    const s = document.createElement('span'); s.className = 'fsize';
    s.textContent = f.size > 1024 ? (f.size / 1024).toFixed(1) + ' KB' : f.size + ' B';
    const b = document.createElement('button'); b.textContent = '✕'; b.title = 'Remove';
    b.onclick = () => { delete files[name]; renderFiles(); };
    li.append(n, s, b);
    ul.appendChild(li);
  });
}

function initFiles() {
  $('data-files').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
  const dz = $('dropzone');
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));
}

/* =========================================================
   OUTPUT: GRAPHS
   ========================================================= */
function themeLayout(l) {
  const dark = document.documentElement.dataset.theme !== 'light';
  const ax = { gridcolor: dark ? '#444' : '#ddd', zerolinecolor: dark ? '#666' : '#bbb' };
  l = l || {};
  return Object.assign(
    { paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: dark ? '#ddd' : '#222' } },
    l,
    { xaxis: Object.assign({}, ax, l.xaxis), yaxis: Object.assign({}, ax, l.yaxis) }
  );
}

function plotNew(el, data, layout, config) {
  showTab('output', 'graph');
  $('graph-hint').hidden = true;
  hasPlot = true;
  return Plotly.newPlot(el || $('plotly-div'), data, themeLayout(layout), Object.assign({ responsive: true }, config));
}

// Python (via `import js`) in dono ko call karta hai
window.simShowPlot = s => {
  const fig = typeof s === 'string' ? JSON.parse(s) : s;
  plotNew($('plotly-div'), fig.data || [], fig.layout || {}, fig.config);
};
window.simShowImage = b64 => {
  showTab('output', 'graph');
  $('graph-hint').hidden = true;
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  $('image-area').appendChild(img);
};

function resetOutput() {
  $('output').textContent = '';
  try { Plotly.purge($('plotly-div')); } catch {}
  $('plotly-div').innerHTML = '';
  $('image-area').innerHTML = '';
  $('graph-hint').hidden = false;
  hasPlot = false;
}

/* =========================================================
   RUNNER: PYTHON (Pyodide)
   ========================================================= */
const PY_SETUP = String.raw`
import js, json
def _sim_show_plot(fig):
    if hasattr(fig, "to_json"):
        s = fig.to_json()
    elif hasattr(fig, "to_dict"):
        s = json.dumps(fig.to_dict(), default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o))
    else:
        s = json.dumps(fig, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o))
    js.simShowPlot(s)
`;

const PY_MPL = String.raw`
import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as plt, io, base64, js
def _sim_mpl_show(*a, **k):
    for n in plt.get_fignums():
        buf = io.BytesIO()
        plt.figure(n).savefig(buf, format="png", dpi=110, bbox_inches="tight")
        js.simShowImage(base64.b64encode(buf.getvalue()).decode())
    plt.close("all")
plt.show = _sim_mpl_show
`;

function cleanPyError(msg) {
  const i = msg.indexOf('File "<exec>"');
  return i >= 0 ? 'Traceback (most recent call last):\n  ' + msg.slice(i) : msg;
}

async function runPython(c) {
  if (!pyodide) {
    out('Python load ho raha hai (pehli baar 10-20 sec)...\n', 'info');
    pyodide = await loadPyodide();
    pyodide.runPython(PY_SETUP);
  }
  const FS = pyodide.FS;
  try { FS.mkdirTree('/data'); } catch {}
  try { FS.readdir('/data').forEach(f => { if (f !== '.' && f !== '..') FS.unlink('/data/' + f); }); } catch {}
  Object.entries(files).forEach(([n, f]) => FS.writeFile('/data/' + n, f.bytes));

  /* multi-file project: sab files /project me likho, import chale */
  if (c.project) {
    pyodide.runPython("import os, shutil\nos.chdir('/')\nshutil.rmtree('/project', ignore_errors=True)\nos.makedirs('/project')");
    Object.entries(c.project).forEach(([n, t]) => {
      if (n.includes('/')) FS.mkdirTree('/project/' + n.slice(0, n.lastIndexOf('/')));
      FS.writeFile('/project/' + n, t);
    });
    pyodide.runPython(
      "import sys, os, importlib\n" +
      "if '/project' not in sys.path: sys.path.insert(0, '/project')\n" +
      "for k, m in list(sys.modules.items()):\n" +
      "    f = getattr(m, '__file__', None)\n" +
      "    if f and f.startswith('/project/'): del sys.modules[k]\n" +
      "importlib.invalidate_caches()\n" +
      "os.chdir('/project')");
  }

  const lines = c.stdin.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  let i = 0;
  pyodide.setStdin({ stdin: () => (i < lines.length ? lines[i++] : undefined) });
  pyodide.setStdout({ batched: s => out(s + '\n') });
  pyodide.setStderr({ batched: s => out(s + '\n', 'err') });

  const srcs = [c.code];
  if (c.project) Object.entries(c.project).forEach(([n, t]) => { if (n.endsWith('.py')) srcs.push(t); });
  for (const s of srcs) await pyodide.loadPackagesFromImports(s);
  if (srcs.some(s => /matplotlib/.test(s)) && !mplReady) { pyodide.runPython(PY_MPL); mplReady = true; }

  const ns = pyodide.globals.get('dict')();
  ns.set('__name__', '__main__');
  ns.set('INPUT', c.stdin);
  ns.set('PARAMS', pyodide.toPy(c.params));
  ns.set('DATA', pyodide.toPy(c.data));
  ns.set('show_plot', pyodide.globals.get('_sim_show_plot'));
  try {
    await pyodide.runPythonAsync(c.code, { globals: ns });
  } catch (e) {
    throw fail(cleanPyError(String(e.message || e)));
  } finally {
    ns.destroy();
  }
}

/* =========================================================
   RUNNER: JAVASCRIPT (require() support)
   ========================================================= */
async function runJS(c) {
  const mk = cls => (...a) => out(a.map(fmtArg).join(' ') + '\n', cls);
  const con = { log: mk(), debug: mk(), info: mk('info'), warn: mk('info'), error: mk('err') };

  const P = Object.create(window.Plotly);
  P.newPlot = (el, d, l, cfg) => plotNew(el, d, l, cfg);

  const FILES = {};
  Object.entries(files).forEach(([n, f]) => { FILES[n] = f.text; });

  const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
  const proj = c.project || {};
  const cache = {};
  const REQUIRE = name => {
    const n = String(name).replace(/^\.\//, '').replace(/^\//, '');
    const key = [n, n + '.js', n + '/index.js'].find(k => k in proj);
    if (!key) throw new Error("Cannot find module '" + name + "'");
    if (cache[key]) return cache[key].exports;
    const mod = { exports: {} };
    cache[key] = mod;
    new Function('require', 'module', 'exports', 'console', 'INPUT', 'PARAMS', 'DATA', 'FILES', 'PLOT', 'Plotly', proj[key])
      (REQUIRE, mod, mod.exports, con, c.stdin, c.params, c.data, FILES, $('plotly-div'), P);
    return mod.exports;
  };
  const fn = new AsyncFn('console', 'INPUT', 'PARAMS', 'DATA', 'FILES', 'PLOT', 'Plotly', 'require', 'module', 'exports', c.code);
  const self = { exports: {} };
  await fn(con, c.stdin, c.params, c.data, FILES, $('plotly-div'), P, REQUIRE, self, self.exports);
}

/* =========================================================
   RUNNER: HTML (sandboxed iframe, CSS/JS files inline)
   ========================================================= */
function runHTML(c) {
  if (c.project) c.code = window.SimLabProject.inlineHtml(c.code, c.project);

  const J = v => JSON.stringify(v).replace(/</g, '\\u003c');
  const FILES = {};
  Object.entries(files).forEach(([n, f]) => { FILES[n] = f.text; });

  const inj =
    '<script>(function(){' +
    'var send=function(t,a){try{parent.postMessage({simLab:1,type:t,text:Array.prototype.map.call(a,function(x){' +
    'try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}};' +
    '["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){' +
    'send(k==="log"?"log":k==="error"?"error":"info",arguments);o.apply(console,arguments)}});' +
    'window.addEventListener("error",function(e){send("error",[e.message])});' +
    'window.INPUT=' + J(c.stdin) + ';window.PARAMS=' + J(c.params) + ';window.DATA=' + J(c.data) + ';window.FILES=' + J(FILES) + ';' +
    '})();' + '<' + '/script>';

  let html, m;
  if ((m = /<head[^>]*>/i.exec(c.code)) || (m = /<html[^>]*>/i.exec(c.code))) {
    const at = m.index + m[0].length;
    html = c.code.slice(0, at) + inj + c.code.slice(at);
  } else {
    html = '<!DOCTYPE html>' + inj + c.code;
  }
  $('preview').srcdoc = html;
  showTab('output', 'preview');
  out('HTML preview update ho gaya (Preview tab).\n', 'info');
}

window.addEventListener('message', e => {
  const d = e.data;
  if (!d || !d.simLab || e.source !== $('preview').contentWindow) return;
  out(d.text + '\n', d.type === 'error' ? 'err' : d.type === 'info' ? 'info' : undefined);
});

/* =========================================================
   RUNNER: JUDGE0 (C, C++, Java, Rust, Go)
   ========================================================= */
async function runJudge(c) {
  const s = settings;
  if (c.project) {
    const PJ = window.SimLabProject;
    if (c.lang === 'c' || c.lang === 'cpp') c.code = PJ.inlineIncludes(c.code, c.project, c.lang, c.entry);
    else if (c.lang === 'java') c.code = PJ.inlineJava(c.code, c.project, c.entry);
  }
  if (!s.url) throw fail('Settings (⚙) me Judge0 API URL daalo.');
  const base = s.url.replace(/\/+$/, '');
  const headers = {};
  if (s.key)  headers['X-RapidAPI-Key']  = s.key;
  if (s.host) headers['X-RapidAPI-Host'] = s.host;

  let stdin = c.stdin;
  const pk = Object.entries(c.params);
  if (pk.length) stdin = pk.map(([k, v]) => k + '=' + v).join('\n') + '\n' + stdin;

  out('Judge0 par compile & run ho raha hai...\n', 'info');

  let token;
  try {
    const r = await fetch(base + '/submissions?base64_encoded=true&wait=false', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      signal: abortCtl.signal,
      body: JSON.stringify({ language_id: LANGS[c.lang].judge, source_code: b64enc(c.code), stdin: b64enc(stdin) })
    });
    if (!r.ok) throw fail('Judge0 error ' + r.status + ': ' + (await r.text()).slice(0, 300));
    token = (await r.json()).token;
  } catch (e) {
    if (e.name === 'AbortError' || e.pretty) throw e;
    throw fail('Judge0 se connect nahi hua. Settings me URL / API key check karo (CORS ya network issue ho sakta hai).');
  }

  for (let i = 0; i < 80; i++) {
    await sleep(800);
    if (abortCtl.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const r = await fetch(
      base + '/submissions/' + token + '?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory',
      { headers, signal: abortCtl.signal }
    );
    if (!r.ok) throw fail('Judge0 poll error ' + r.status);
    const j = await r.json();
    if (j.status && j.status.id <= 2) continue;       // queue / processing

    if (j.compile_output) out(b64dec(j.compile_output) + '\n', 'err');
    if (j.stdout)         out(b64dec(j.stdout));
    if (j.stderr)         out(b64dec(j.stderr) + '\n', 'err');
    if (j.message)        out(b64dec(j.message) + '\n', 'err');
    out('\n[' + (j.status ? j.status.description : '?') +
        (j.time ? ' · ' + j.time + ' s' : '') +
        (j.memory ? ' · ' + j.memory + ' KB' : '') + ']\n', j.status && j.status.id === 3 ? 'ok' : 'err');
    return;
  }
  throw fail('Timeout: Judge0 ne time par result nahi diya.');
}

/* =========================================================
   RUN / STOP
   ========================================================= */
async function run() {
  if (running || !editor) return;
  const tgt = window.SimLabProject ? window.SimLabProject.target() : null;
  const lang = tgt ? tgt.lang : $('lang').value;

  const data = getData();
  if (data === undefined) { showTab('input', 'json'); setStatus('JSON galat hai (JSON tab dekho)', 'error'); return; }

  running = true;
  abortCtl = new AbortController();
  $('run').disabled = true;
  $('stop').hidden = !!LANGS[lang].local;
  resetOutput();
  showTab('output', 'console');
  setStatus('Running...', 'busy');
  const t0 = performance.now();

  const ctx = { lang, code: tgt ? tgt.code : editor.getValue(), stdin: $('input').value, params: getParams(), data,
                project: tgt ? tgt.files : null, entry: tgt ? tgt.name : '' };
  const runner = { python: runPython, javascript: runJS, html: runHTML }[lang] || runJudge;

  try {
    await runner(ctx);
    setStatus('Done');
  } catch (e) {
    if (e && e.name === 'AbortError') {
      out('\n[stopped]\n', 'info');
      setStatus('Stopped');
    } else {
      out((e && e.pretty ? e.pretty : (e.name + ': ' + e.message)) + '\n', 'err');
      setStatus('Error', 'error');
    }
  } finally {
    running = false;
    $('run').disabled = false;
    $('stop').hidden = true;
    $('status-time').textContent = ((performance.now() - t0) / 1000).toFixed(2) + ' s';
  }
}

/* =========================================================
   EXAMPLES + LANGUAGE SWITCH
   ========================================================= */
function fillExamples(lang) {
  const sel = $('examples');
  sel.innerHTML = '<option value="">📂 Examples</option>';
  ((window.EXAMPLES && window.EXAMPLES[lang]) || []).forEach((ex, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = ex.name;
    sel.appendChild(o);
  });
}

function loadExample(ex) {
  editor.setValue(ex.code);
  $('input').value = ex.input || '';
  renderParams(ex.params || {});
  $('json-input').value = ex.json ? JSON.stringify(ex.json, null, 2) : '';
  validateJson();
  persist();
}

function setLanguage(lang, opts) {
  opts = opts || {};
  if (editor) state.codes[state.lang] = editor.getValue();
  state.lang = lang;
  $('lang').value = lang;
  $('status-lang').textContent = LANGS[lang].label;
  monaco.editor.setModelLanguage(editor.getModel(), lang);
  fillExamples(lang);
  if (!opts.keepCode) {
    if (state.codes[lang] != null) editor.setValue(state.codes[lang]);
    else {
      const ex = ((window.EXAMPLES && window.EXAMPLES[lang]) || [])[0];
      if (ex) loadExample(ex); else editor.setValue('');
    }
  }
  persist();
}

/* =========================================================
   PERSIST (localStorage)
   ========================================================= */
let persistTimer = null;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (!editor) return;
    state.codes[state.lang] = editor.getValue();
    state.input  = $('input').value;
    state.params = paramPairs();
    state.json   = $('json-input').value;
    LS.set('simlab.state', state);
  }, 400);
}

/* =========================================================
   SAVE / OPEN / SHARE / THEME
   (project.js ye handlers multi-file ke liye override karta hai)
   ========================================================= */
function saveFile() {
  const lang = $('lang').value;
  const name = lang === 'java' ? 'Main.java' : 'code.' + LANGS[lang].ext;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([editor.getValue()], { type: 'text/plain' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus('Saved: ' + name);
}

function openFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const lang = Object.keys(LANGS).find(k => LANGS[k].ext === ext) ||
               (ext === 'htm' ? 'html' : ext === 'cc' || ext === 'cxx' ? 'cpp' : null);
  const reader = new FileReader();
  reader.onload = () => {
    if (lang) setLanguage(lang, { keepCode: true });
    editor.setValue(String(reader.result));
    setStatus('Opened: ' + file.name);
  };
  reader.readAsText(file);
}

function shareLink() {
  const payload = {
    lang: $('lang').value, code: editor.getValue(), input: $('input').value,
    params: paramPairs(), json: $('json-input').value
  };
  const link = location.origin + location.pathname + '#s=' + toUrlB64(JSON.stringify(payload));
  if (link.length > 8000) setStatus('Code bada hai, link kuch browsers me na khule', 'error');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(
      () => setStatus('Share link copy ho gaya'),
      () => window.prompt('Link copy karo:', link)
    );
  } else window.prompt('Link copy karo:', link);
}

function readShare() {
  const m = /^#s=(.+)$/.exec(location.hash);
  if (!m) return null;
  try { return JSON.parse(fromUrlB64(m[1])); } catch { return null; }
}

function applyTheme(t) {
  theme = t;
  document.documentElement.dataset.theme = t;
  if (window.monaco) monaco.editor.setTheme(t === 'light' ? 'vs' : 'vs-dark');
  LS.set('simlab.theme', t);
}

/* =========================================================
   SETTINGS MODAL
   ========================================================= */
function openSettings() {
  $('set-judge-url').value = settings.url;
  $('set-judge-key').value = settings.key;
  $('set-judge-host').value = settings.host;
  $('set-font').value = settings.font;
  $('set-autorun').checked = !!settings.autorun;
  $('modal').hidden = false;
}
function closeSettings() { $('modal').hidden = true; }
function saveSettings() {
  settings = {
    url: $('set-judge-url').value.trim(),
    key: $('set-judge-key').value.trim(),
    host: $('set-judge-host').value.trim(),
    font: Math.min(28, Math.max(10, +$('set-font').value || 14)),
    autorun: $('set-autorun').checked
  };
  LS.set('simlab.settings', settings);
  editor.updateOptions({ fontSize: settings.font });
  closeSettings();
  setStatus('Settings saved');
}

/* =========================================================
   SPLITTERS (drag resize)
   ========================================================= */
const mobileMQ = window.matchMedia('(max-width: 900px)');

function dragSplitter(handle, onMove) {
  handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    const up = () => {
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });
}

function initSplitters() {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  dragSplitter($('splitter'), e => {
    const r = $('workspace').getBoundingClientRect();
    if (mobileMQ.matches) {
      const pct = clamp((e.clientY - r.top) / r.height * 100, 20, 80);
      $('workspace').style.gridTemplateRows = pct + '% 6px 1fr';
    } else {
      const pct = clamp((e.clientX - r.left) / r.width * 100, 20, 80);
      document.documentElement.style.setProperty('--editor-w', pct + '%');
    }
  });

  dragSplitter($('splitter-h'), e => {
    const r = $('pane-side').getBoundingClientRect();
    const pct = clamp((e.clientY - r.top) / r.height * 100, 15, 75);
    document.documentElement.style.setProperty('--input-h', pct + '%');
  });

  window.addEventListener('resize', () => {
    if (!mobileMQ.matches) $('workspace').style.gridTemplateRows = '';
  });
}

/* =========================================================
   INIT
   ========================================================= */
window.MonacoEnvironment = {
  getWorkerUrl() {
    return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(
      "self.MonacoEnvironment={baseUrl:'" + MONACO + "/'};importScripts('" + MONACO + "/vs/base/worker/workerMain.js');"
    );
  }
};

document.documentElement.dataset.theme = theme;
require.config({ paths: { vs: MONACO + '/vs' } });

require(['vs/editor/editor.main'], () => {
  const shared = readShare();
  if (shared && LANGS[shared.lang]) {
    state.lang = shared.lang;
    state.codes[shared.lang] = shared.code;
    state.input = shared.input || '';
    state.params = shared.params || [];
    state.json = shared.json || '';
  }

  editor = monaco.editor.create($('editor'), {
    value: state.codes[state.lang] != null ? state.codes[state.lang] : '',
    language: state.lang,
    theme: theme === 'light' ? 'vs' : 'vs-dark',
    automaticLayout: true,
    fontSize: settings.font,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    tabSize: 4
  });

  /* restore side panels */
  $('lang').value = state.lang;
  $('status-lang').textContent = LANGS[state.lang].label;
  $('input').value = state.input || '';
  $('json-input').value = state.json || '';
  renderParams(state.params);
  validateJson();
  fillExamples(state.lang);

  /* pehli baar: koi saved code nahi -> pehla example */
  if (state.codes[state.lang] == null) {
    const ex = ((window.EXAMPLES && window.EXAMPLES[state.lang]) || [])[0];
    if (ex) loadExample(ex);
  }

  /* events */
  let autoTimer = null;
  editor.onDidChangeModelContent(() => {
    persist();
    if (settings.autorun && $('lang').value === 'html') {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(run, 800);
    }
  });
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, run);

  $('lang').addEventListener('change', e => setLanguage(e.target.value));
  $('examples').addEventListener('change', e => {
    const i = e.target.value;
    if (i !== '') {
      const ex = window.EXAMPLES[$('lang').value][+i];
      if (ex) loadExample(ex);
    }
    e.target.value = '';
  });

  $('run').addEventListener('click', run);
  $('stop').addEventListener('click', () => abortCtl && abortCtl.abort());
  $('clear-output').addEventListener('click', resetOutput);

  $('input').addEventListener('input', persist);
  $('json-input').addEventListener('input', () => { validateJson(); persist(); });
  $('add-param').addEventListener('click', () => { addParamRow(); persist(); });

  $('btn-save').addEventListener('click', saveFile);
  $('btn-open').addEventListener('click', () => $('open-file').click());
  $('open-file').addEventListener('change', e => { if (e.target.files[0]) openFile(e.target.files[0]); e.target.value = ''; });
  $('btn-share').addEventListener('click', shareLink);
  $('btn-theme').addEventListener('click', () => applyTheme(theme === 'light' ? 'dark' : 'light'));
  $('btn-settings').addEventListener('click', openSettings);
  $('modal-close').addEventListener('click', closeSettings);
  $('set-save').addEventListener('click', saveSettings);
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeSettings(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSettings();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  });

  initTabs();
  initFiles();
  initSplitters();
  setStatus('Ready');

  /* project.js ke liye expose karo */
  window.SimLab = { editor, fillExamples, loadExample, setStatus, renderParams, paramPairs, validateJson };
  window.dispatchEvent(new Event('simlab-ready'));
});

})();
