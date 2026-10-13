/* =========================================================
   SIM LAB - project.js  (multi-file projects)
   app.js ke BAAD load hoti hai.
   ========================================================= */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const KEY = 'simlab.project';

/* extension -> runner language / monaco language */
const RUN = { py: 'python', js: 'javascript', mjs: 'javascript', html: 'html', htm: 'html',
              c: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', java: 'java', rs: 'rust', go: 'go' };
const MLANG = { py: 'python', js: 'javascript', mjs: 'javascript', html: 'html', htm: 'html',
                css: 'css', json: 'json', md: 'markdown', c: 'c', cpp: 'cpp', cc: 'cpp',
                cxx: 'cpp', h: 'cpp', hpp: 'cpp', java: 'java', rs: 'rust', go: 'go' };
const DEF = { python: 'main.py', javascript: 'main.js', html: 'index.html', cpp: 'main.cpp',
              c: 'main.c', java: 'Main.java', rust: 'main.rs', go: 'main.go' };
const ENTRY = ['index.html', 'main.py', 'main.js', 'main.cpp', 'main.c', 'Main.java', 'main.rs', 'main.go'];

const extOf = n => (n.split('.').pop() || '').toLowerCase();

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

const enc = s => {
  const b = new TextEncoder().encode(s); let t = '';
  b.forEach(x => { t += String.fromCharCode(x); });
  return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const dec = s => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
};

let S = null, editor = null, bar = null;
let files = new Map();          // name -> { model, vs }
let active = '';
let lastLang = null;

/* =========================================================
   MODELS / SNAPSHOT / SAVE
   ========================================================= */
function mk(name, text) {
  const uri = monaco.Uri.parse('file:///' + encodeURI(name));
  const old = monaco.editor.getModel(uri);
  if (old) old.dispose();
  const m = monaco.editor.createModel(text, MLANG[extOf(name)] || 'plaintext', uri);
  m.onDidChangeContent(saveSoon);
  return m;
}

function snap() {
  const o = {};
  files.forEach((f, n) => { o[n] = f.model.getValue(); });
  return o;
}

let saveTimer = null;
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => LS.set(KEY, { files: snap(), active }), 400);
}

function clean(n, quiet) {
  n = (n || '').trim().replace(/^\.\//, '').replace(/^\/+/, '');
  const ok = n && /^[\w.\- ]+(\/[\w.\- ]+)*$/.test(n) && !n.split('/').some(s => s === '..' || s === '.');
  if (!ok) { if (n && !quiet) alert('Naam galat hai. Sirf letters, numbers, . _ - aur folder ke liye / use karo.'); return ''; }
  return n;
}

function uniq(n) {
  if (!files.has(n)) return n;
  const i = n.lastIndexOf('.');
  const base = i > 0 ? n.slice(0, i) : n, ext = i > 0 ? n.slice(i) : '';
  for (let k = 2; ; k++) if (!files.has(base + '_' + k + ext)) return base + '_' + k + ext;
}

/* =========================================================
   TAB BAR
   ========================================================= */
function render() {
  bar.innerHTML = '';
  const tabs = document.createElement('div');
  tabs.className = 'fb-tabs';
  files.forEach((f, n) => {
    const b = document.createElement('button');
    b.className = 'fb-tab' + (n === active ? ' active' : '');
    b.title = n + '  (double-click = rename)';
    const s = document.createElement('span'); s.textContent = n;
    const x = document.createElement('span'); x.className = 'fb-x'; x.textContent = '✕'; x.title = 'Delete';
    x.onclick = e => { e.stopPropagation(); remove(n); };
    b.append(s, x);
    b.onclick = () => activate(n);
    b.ondblclick = () => rename(n);
    tabs.appendChild(b);
  });

  const acts = document.createElement('div');
  acts.className = 'fb-actions';
  [['＋', 'Nayi file', newFile],
   ['✎', 'Rename', () => rename(active)],
   ['⬆', 'Files / ZIP import', () => $('open-file').click()],
   ['ZIP', 'Project ZIP download', downloadZip]
  ].forEach(([t, tt, fn]) => {
    const b = document.createElement('button');
    b.className = 'btn small'; b.textContent = t; b.title = tt; b.onclick = fn;
    acts.appendChild(b);
  });

  bar.append(tabs, acts);
  const a = tabs.querySelector('.active');
  if (a) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function refreshLang() {
  const lang = RUN[extOf(active)];
  const sel = $('lang');
  if (lang) {
    sel.value = lang;
    if (lastLang !== lang) { lastLang = lang; S.fillExamples(lang); }
    $('status-lang').textContent = sel.selectedOptions[0].textContent;
  } else {
    $('status-lang').textContent = extOf(active).toUpperCase();
  }
}

function activate(name) {
  if (!files.has(name)) return;
  if (name === active && editor.getModel() === files.get(name).model) return;
  const cur = files.get(active);
  if (cur) cur.vs = editor.saveViewState();
  active = name;
  const f = files.get(name);
  editor.setModel(f.model);
  if (f.vs) editor.restoreViewState(f.vs);
  refreshLang();
  render();
  saveSoon();
}

/* =========================================================
   FILE OPERATIONS
   ========================================================= */
function newFile() {
  const n = clean(prompt('Naya file ka naam (extension ke saath)\nJaise: utils.py, style.css, lib/math.js, util.h'));
  if (!n) return;
  if (files.has(n)) { activate(n); return; }
  files.set(n, { model: mk(n, ''), vs: null });
  activate(n);
}

function rename(name) {
  const n = clean(prompt('Naya naam:', name));
  if (!n || n === name) return;
  if (files.has(n)) { alert('Is naam ki file pehle se hai.'); return; }
  const f = files.get(name), text = f.model.getValue(), oldModel = f.model;
  const next = new Map();
  files.forEach((v, k) => {
    if (k === name) next.set(n, { model: mk(n, text), vs: null });
    else next.set(k, v);
  });
  files = next;
  if (name === active) { active = n; editor.setModel(files.get(n).model); }
  oldModel.dispose();
  refreshLang(); render(); saveSoon();
}

function remove(name) {
  if (files.size <= 1) { alert('Kam se kam ek file honi chahiye.'); return; }
  if (!confirm(name + ' delete karni hai?')) return;
  const keys = [...files.keys()], i = keys.indexOf(name);
  const f = files.get(name);
  files.delete(name);
  if (name === active) {
    const nxt = keys[i + 1] || keys[i - 1];
    active = '';
    activate(nxt);
  } else { render(); saveSoon(); }
  f.model.dispose();
}

function openLang(lang) {
  const n = DEF[lang];
  if (!n) return;
  if (files.has(n)) { activate(n); return; }
  files.set(n, { model: mk(n, ''), vs: null });
  activate(n);
  const ex = ((window.EXAMPLES || {})[lang] || [])[0];
  if (ex) S.loadExample(ex);
}

/* =========================================================
   IMPORT / ZIP / DOWNLOAD / SHARE
   ========================================================= */
function needZip() {
  return window.JSZip ? Promise.resolve() : new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    s.onload = ok; s.onerror = () => bad(new Error('JSZip load nahi hua (internet check karo)'));
    document.head.appendChild(s);
  });
}

function dl(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

async function downloadZip() {
  try {
    await needZip();
    const z = new JSZip();
    files.forEach((f, n) => z.file(n, f.model.getValue()));
    dl(await z.generateAsync({ type: 'blob' }), 'simlab-project.zip');
    S.setStatus('ZIP download ho gaya');
  } catch (e) { S.setStatus(e.message, 'error'); }
}

let lastPut = '';
function put(name, text) {
  if (text.indexOf('\u0000') >= 0) return false;              // binary skip
  const n = clean(name, true);
  if (!n) return false;
  if (files.has(n)) {
    if (!confirm(n + ' pehle se hai. Overwrite karna hai?')) return false;
    files.get(n).model.setValue(text);
  } else files.set(n, { model: mk(n, text), vs: null });
  lastPut = n;
  return true;
}

async function importFiles(list) {
  let added = 0, skipped = 0;
  lastPut = '';
  try {
    for (const f of list) {
      if (/\.zip$/i.test(f.name)) {
        await needZip();
        const z = await JSZip.loadAsync(f);
        for (const [p, e] of Object.entries(z.files)) {
          if (e.dir || /(^|\/)(\.|__MACOSX)/.test(p)) continue;
          if (put(p, await e.async('string'))) added++; else skipped++;
        }
      } else if (f.size < 1e6 && put(f.name, await f.text())) added++;
      else skipped++;
    }
  } catch (e) { S.setStatus(e.message, 'error'); return; }
  if (lastPut) activate(lastPut);
  render(); saveSoon();
  S.setStatus(added + ' file import hui' + (skipped ? ', ' + skipped + ' skip (binary/bada/cancel)' : ''));
}

function share(e) {
  e.stopImmediatePropagation();
  const payload = { files: snap(), active, input: $('input').value, params: S.paramPairs(), json: $('json-input').value };
  const link = location.origin + location.pathname + '#p=' + enc(JSON.stringify(payload));
  if (link.length > 8000) S.setStatus('Project bada hai, link kuch browsers me na khule', 'error');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(
      () => S.setStatus('Project share link copy ho gaya'),
      () => window.prompt('Link copy karo:', link));
  } else window.prompt('Link copy karo:', link);
}

/* =========================================================
   RUN SUPPORT (app.js ye functions call karta hai)
   ========================================================= */
function findEntry(s) {
  const k = Object.keys(s);
  return ENTRY.find(n => n in s) || k.find(n => RUN[extOf(n)]) || '';
}

function target() {
  if (!files.size) return null;
  const s = snap(), keys = Object.keys(s);
  let name = active;
  const ext = extOf(name);

  if (ext === 'css' || ext === 'js' || ext === 'mjs') {
    // web project: agar koi HTML is file ko use karta hai to HTML chalao
    const base = name.split('/').pop();
    const h = keys.find(n => RUN[extOf(n)] === 'html' && s[n].includes(base));
    if (h) name = h;
  } else if (!RUN[ext]) {
    name = findEntry(s);
    if (!name) return null;
  }

  const lang = RUN[extOf(name)];
  if (!lang) return null;
  const mainRx = lang === 'java' ? /static\s+void\s+main/ : /\bmain\s*\(/;
  if ((lang === 'c' || lang === 'cpp' || lang === 'java') && !mainRx.test(s[name])) {
    const alt = keys.find(n => RUN[extOf(n)] === lang && mainRx.test(s[n]));
    if (alt) name = alt;
  }
  return { name, lang, code: s[name], files: s };
}

function inlineHtml(html, all) {
  const get = ref => all[ref.replace(/^\.\//, '').replace(/^\//, '').split(/[?#]/)[0]];
  html = html.replace(/<link\b[^>]*>/gi, tag => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    const m = /href\s*=\s*["']([^"']+)["']/i.exec(tag);
    const t = m && get(m[1]);
    return t == null ? tag : '<style>\n' + t.replace(/<\/style/gi, '<\\/style') + '\n</style>';
  });
  html = html.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (whole, a, src, b) => {
    const t = get(src);
    return t == null ? whole : '<script' + a + b + '>\n' + t.replace(/<\/script/gi, '<\\/script') + '\n</' + 'script>';
  });
  return html;
}

function inlineIncludes(code, all, lang, entry) {
  const done = new Set([entry]);
  const expand = (src, depth) => src.replace(/^[ \t]*#\s*include\s*"([^"]+)"[ \t]*$/gm, (whole, name) => {
    const n = name.replace(/^\.\//, '');
    if (!(n in all)) return whole;
    if (done.has(n) || depth > 8) return '';
    done.add(n);
    return '// ---- ' + n + '\n' + expand(all[n], depth + 1);
  });
  let out = expand(code, 0);
  const rx = lang === 'c' ? /\.c$/ : /\.(cpp|cc|cxx)$/;
  Object.keys(all).forEach(n => {
    if (n !== entry && rx.test(n) && !done.has(n)) {
      done.add(n);
      out += '\n// ---- ' + n + '\n' + expand(all[n], 1);
    }
  });
  return out;
}

function inlineJava(code, all, entry) {
  const imports = new Set();
  const strip = (src, isEntry) => {
    src = src.replace(/^\s*package\s+[^;]+;[ \t]*$/gm, '')
             .replace(/^\s*import\s+[^;]+;[ \t]*$/gm, m => { imports.add(m.trim()); return ''; });
    return isEntry ? src : src.replace(/^(\s*)public\s+(?=(?:final\s+|abstract\s+)?(?:class|interface|enum|record)\b)/gm, '$1');
  };
  let body = strip(code, true);
  Object.keys(all).forEach(n => {
    if (n !== entry && /\.java$/.test(n)) body += '\n' + strip(all[n], false);
  });
  return [...imports].join('\n') + '\n' + body;
}

window.SimLabProject = { target, inlineHtml, inlineIncludes, inlineJava };

/* =========================================================
   INIT
   ========================================================= */
function init() {
  S = window.SimLab;
  editor = S.editor;
  const old = editor.getModel();
  const lang0 = $('lang').value, code0 = editor.getValue();
  const saved = LS.get(KEY, null);
  let start = null, startActive = '';

  const hp = /^#p=(.+)$/.exec(location.hash);
  if (hp) {
    try {
      const p = JSON.parse(dec(hp[1]));
      if (p && p.files && Object.keys(p.files).length) {
        if (saved) LS.set(KEY + '.backup', saved);          // purana project backup
        start = p.files; startActive = p.active || '';
        $('input').value = p.input || '';
        $('json-input').value = p.json || '';
        S.renderParams(p.params || []);
        S.validateJson();
      }
    } catch {}
  }
  if (!start && saved && saved.files && Object.keys(saved.files).length) { start = saved.files; startActive = saved.active; }

  if (start) {
    Object.entries(start).forEach(([n, t]) => {
      n = clean(n, true);
      if (n) files.set(n, { model: mk(n, String(t)), vs: null });
    });
  }
  if (!files.size) {
    const n = DEF[lang0] || 'main.txt';
    files.set(n, { model: mk(n, code0), vs: null });
    startActive = n;
  } else if (/^#s=/.test(location.hash)) {                   // purana single-file share link
    const n = uniq(DEF[lang0] || 'main.txt');
    files.set(n, { model: mk(n, code0), vs: null });
    startActive = n;
  }
  if (!files.has(startActive)) startActive = [...files.keys()][0];

  bar = document.createElement('div');
  bar.id = 'filebar';
  $('pane-editor').insertBefore(bar, $('editor'));

  active = '';
  activate(startActive);
  if (old && old !== editor.getModel()) old.dispose();

  /* app.js ke handlers ko project-aware banao (capture = pehle chalta hai) */
  $('lang').addEventListener('change', e => { e.stopImmediatePropagation(); openLang(e.target.value); }, true);

  $('btn-save').addEventListener('click', e => {
    e.stopImmediatePropagation();
    dl(new Blob([files.get(active).model.getValue()], { type: 'text/plain' }), active.split('/').pop());
    S.setStatus('Saved: ' + active);
  }, true);

  $('btn-share').addEventListener('click', share, true);

  $('open-file').multiple = true;
  $('open-file').addEventListener('change', e => {
    e.stopImmediatePropagation();
    const list = [...e.target.files];
    e.target.value = '';
    importFiles(list);
  }, true);
}

if (window.SimLab) init(); else window.addEventListener('simlab-ready', init);

})();
