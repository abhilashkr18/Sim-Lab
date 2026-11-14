/* =========================================================
   SIM LAB - runner.js
   Judge0 client for C, C++, Java, Rust, Go.
   Used by app.js (Run button) and tests.html (self-test page).
   Load it BEFORE app.js.

   What it does for every user program:
   - picks the NEWEST compiler the Judge0 server offers (falls back to old fixed ids)
   - Java: fixes package line, wrong class name, several public classes
   - keeps Stdin exactly as typed (Parameters go to the program as command-line args)
   - asks for more CPU time / memory (retries without if the server refuses)
   - retries on busy server (429 / 5xx / network blips)
   - explains common failures in plain words (timeout, crash, missing input ...)
   ========================================================= */
(function (root) {
'use strict';

const FALLBACK_ID = { c: 50, cpp: 54, java: 62, rust: 73, go: 60 };
const PICK = {
  c:    /^C \(GCC ([\d.]+)\)/,
  cpp:  /^C\+\+ \(GCC ([\d.]+)\)/,
  java: /^Java \(OpenJDK ([\d.]+)\)/,
  rust: /^Rust \(([\d.]+)\)/,
  go:   /^Go \(([\d.]+)\)/
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const abortErr = () => { try { return new DOMException('Aborted', 'AbortError'); } catch (e) { const x = new Error('Aborted'); x.name = 'AbortError'; return x; } };
const fail = msg => Object.assign(new Error(msg), { pretty: msg });

function enc(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function dec(b64) {
  if (!b64) return '';
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
const verArr = v => String(v).split('.').map(n => parseInt(n, 10) || 0);
function cmpVer(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; }
  return 0;
}

/* ---------- fetch with retry (busy server, flaky network) ---------- */
async function jfetch(url, opt, signal, tries) {
  let last;
  tries = tries || 4;
  for (let i = 0; i < tries; i++) {
    if (signal && signal.aborted) throw abortErr();
    try {
      const r = await fetch(url, Object.assign({}, opt, { signal }));
      if (r.status === 429 || r.status >= 500) {
        last = new Error('HTTP ' + r.status);
        const ra = parseFloat(r.headers && r.headers.get ? r.headers.get('Retry-After') : '') || 0;
        if (i < tries - 1) await sleep(Math.max(ra * 1000, 700 * (i + 1) * (i + 1)));
        else return r;
        continue;
      }
      return r;
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      last = e;
      if (i < tries - 1) await sleep(600 * (i + 1));
    }
  }
  throw last || new Error('network');
}

/* ---------- language list (newest compiler) ---------- */
const memCache = {};
async function languages(base, headers, signal) {
  if (memCache[base]) return memCache[base];
  const key = 'simlab.langs.' + base;
  try {
    if (typeof localStorage !== 'undefined') {
      const s = JSON.parse(localStorage.getItem(key) || 'null');
      if (s && Date.now() - s.t < 864e5 && Array.isArray(s.list)) return (memCache[base] = s.list);
    }
  } catch (e) {}
  const r = await jfetch(base + '/languages', { headers }, signal, 2);
  if (!r.ok) return null;
  const list = await r.json();
  if (!Array.isArray(list)) return null;
  memCache[base] = list;
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify({ t: Date.now(), list })); } catch (e) {}
  return list;
}
function pickLang(list, lang) {
  const rx = PICK[lang]; let best = null;
  (list || []).forEach(l => {
    const m = rx && rx.exec(l.name || '');
    if (!m || /\[Test\]|Maven|Gradle|Kotlin/i.test(l.name)) return;
    if (!best || cmpVer(verArr(m[1]), verArr(best.v)) > 0) best = { id: l.id, v: m[1], name: l.name };
  });
  return best;
}

/* ---------- Java fixes ---------- */
function maskLiterals(src) {          // replaces comments / strings with spaces (same length)
  let out = '', i = 0;
  const blank = s => s.replace(/[^\n]/g, ' ');
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    let j = -1;
    if (c === '/' && n === '/') { j = src.indexOf('\n', i); if (j < 0) j = src.length; }
    else if (c === '/' && n === '*') { j = src.indexOf('*/', i + 2); j = j < 0 ? src.length : j + 2; }
    else if (src.startsWith('"""', i)) { j = src.indexOf('"""', i + 3); j = j < 0 ? src.length : j + 3; }
    else if (c === '"' || c === "'") { j = i + 1; while (j < src.length && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; } j++; }
    if (j >= 0) { out += blank(src.slice(i, j)); i = j; } else { out += c; i++; }
  }
  return out;
}
function topLevelTypes(src) {
  const m = maskLiterals(src), res = [];
  let depth = 0;
  const rx = /^((?:public|final|abstract|static|sealed|strictfp)\s+)*(class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/;
  for (let i = 0; i < m.length; i++) {
    const ch = m[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 0 && /[a-z@]/.test(ch) && (i === 0 || /[\s;}]/.test(m[i - 1]))) {
      const mm = rx.exec(m.slice(i, i + 200));
      if (mm) {
        let j = m.indexOf('{', i), d = 0, k = j;
        for (; k < m.length; k++) { if (m[k] === '{') d++; else if (m[k] === '}') { d--; if (d === 0) break; } }
        res.push({ name: mm[3], start: i, end: k, isPublic: /(^|\s)public\s/.test(mm[0] + ' '), head: mm[0] });
        i = k; // skip the body (depth stays 0)
      }
    }
  }
  return res;
}
function replaceInCode(src, fn) {      // apply fn only to non-literal parts
  const m = maskLiterals(src);
  let out = '', i = 0;
  while (i < src.length) {
    const lit = m[i] === ' ' && src[i] !== ' ' && src[i] !== '\t';
    let j = i;
    if (lit) { while (j < src.length && m[j] === ' ' && src[j] !== '\n') j++; out += src.slice(i, j); }
    else { while (j < src.length && !(m[j] === ' ' && src[j] !== ' ' && src[j] !== '\t')) j++; out += fn(src.slice(i, j)); }
    if (j === i) { out += src[i]; j = i + 1; }
    i = j;
  }
  return out;
}
function fixJava(code) {
  const notes = [];
  let src = code;
  if (/^\s*package\s+[\w.]+\s*;/m.test(maskLiterals(src))) {
    src = replaceInCode(src, s => s.replace(/^\s*package\s+[\w.]+\s*;[ \t]*/m, ''));
    notes.push('removed the "package" line (Judge0 runs a single file)');
  }
  let types = topLevelTypes(src);
  const mask = maskLiterals(src);
  const mainType = types.find(t => /static\s+void\s+main\s*\(/.test(mask.slice(t.start, t.end + 1)));
  if (mainType && mainType.name !== 'Main' && !types.some(t => t.name === 'Main')) {
    const old = mainType.name;
    src = replaceInCode(src, s => s.replace(new RegExp('(^|[^\\w$.])' + old.replace(/\$/g, '\\$') + '(?![\\w$])', 'g'), '$1Main'));
    notes.push('class ' + old + ' was renamed to Main (Judge0 needs the main class to be called Main)');
    types = topLevelTypes(src);
  }
  const edits = types.filter(t => t.name !== 'Main' && /(^|\s)public\s/.test(t.head + ' '));
  if (edits.length) {
    edits.sort((a, b) => b.start - a.start).forEach(t => {
      const head = src.slice(t.start, t.start + t.head.length).replace(/(^|\s)public\s+/, '$1');
      src = src.slice(0, t.start) + head + src.slice(t.start + t.head.length);
    });
    notes.push('removed "public" from other top-level classes (only Main may be public)');
  }
  return { code: src, notes };
}

/* ---------- friendly explanation of failures ---------- */
function explain(r, ctx) {
  const id = r.status ? r.status.id : 0;
  const err = (r.stderr || '') + (r.message || '');
  const noInput = !(ctx.stdin || '').trim();
  const wantsInput = /EOF|NoSuchElement|InputMismatch|No line found|unexpected end of file|failed to read|read_line|Unexpected end|stdin/i.test(err);
  let h = '';
  switch (id) {
    case 3: break;
    case 5: h = 'Time limit exceeded. Possible reasons: infinite loop, too much computation for the free server (try smaller numbers), or the program is WAITING FOR INPUT that you did not type in the Stdin box.'; break;
    case 6: h = 'Compilation failed - read the error lines above (they show the line number). Nothing was run.'; break;
    case 7: h = 'Segmentation fault: the program touched invalid memory. Usual causes: array/vector index out of range, null pointer, or endless recursion (stack overflow).'; break;
    case 8: h = 'Output was too large. Print less (for example only every 100th step).'; break;
    case 9: h = 'Arithmetic error: most likely division by zero (or integer overflow in a division).'; break;
    case 10: h = 'Program aborted (abort/assert failed, uncaught C++ exception, bad_alloc, double free ...).'; break;
    case 11: h = 'The program exited with an error code. Java/Python: uncaught exception. Rust/Go: panic. C/C++: main() returned non-zero. See the error text above.'; break;
    case 12: h = 'The program was killed. Often this means it used more memory than allowed (try smaller arrays) or it crashed in a library call.'; break;
    case 13: h = 'The Judge0 server had an internal problem. Press Run again in a few seconds.'; break;
    case 14: h = 'Judge0 could not start the program (wrong compiler setup on the server). Try again or choose a different Judge0 server in Settings.'; break;
    default: break;
  }
  if (id !== 3 && noInput && wantsInput) h = 'Your program is trying to READ INPUT but the Stdin box is empty. Type the input values in the Stdin box (one run = all input must be typed before pressing Run).' + (h ? '\n' + h : '');
  return h;
}

/* ---------- main entry ---------- */
async function run(o) {
  const lang = o.lang;
  if (!FALLBACK_ID[lang]) throw fail('Language "' + lang + '" is not supported by the Judge0 runner.');
  if (!o.base) throw fail('Open Settings and enter the Judge0 API URL.');
  const base = String(o.base).replace(/\/+$/, '');
  const headers = {};
  if (o.key) headers['X-RapidAPI-Key'] = o.key;
  if (o.host) headers['X-RapidAPI-Host'] = o.host;
  const signal = o.signal, say = o.onStatus || function () {};
  const notes = [];

  // 1. compiler id
  let picked = null;
  if (o.autoLang !== false) {
    try { picked = pickLang(await languages(base, headers, signal), lang); } catch (e) { if (e && e.name === 'AbortError') throw e; }
  }
  const tryIds = [];
  if (o.langId) tryIds.push({ id: o.langId, name: 'id ' + o.langId });
  else {
    if (picked) tryIds.push({ id: picked.id, name: picked.name });
    tryIds.push({ id: FALLBACK_ID[lang], name: 'default' });
  }

  // 2. source + stdin + args
  let code = o.code;
  if (lang === 'java') { const f = fixJava(code); code = f.code; f.notes.forEach(n => notes.push(n)); }
  let stdin = o.stdin || '';
  if (stdin && !/\n$/.test(stdin)) stdin += '\n';
  const pairs = Object.entries(o.params || {});
  const args = pairs.map(([k, v]) => "'" + (k + '=' + v).replace(/'/g, "'\\''") + "'").join(' ');

  let result = null;
  for (let ti = 0; ti < tryIds.length; ti++) {
    const lid = tryIds[ti];
    const plain = { language_id: lid.id, source_code: enc(code), stdin: enc(stdin) };
    if (args) plain.command_line_arguments = args;
    const opts = {};
    if (lang === 'cpp' && (!picked || ti > 0 || parseInt(picked.v, 10) < 11)) opts.compiler_options = '-std=c++17 -O2';
    if (lang === 'c' && (!picked || ti > 0)) opts.compiler_options = '-O2 -lm';
    const withOpts = Object.assign({}, plain, opts);
    const full = Object.assign({}, withOpts, { cpu_time_limit: 10, wall_time_limit: 20, memory_limit: 256000 });
    // try the richest request first; if the server refuses extra fields, fall back step by step
    const bodies = [full, withOpts, plain];

    say('Running on Judge0 (' + lid.name + ') ...\n');
    let token = null, lastText = '';
    for (const body of bodies) {
      let r;
      try {
        r = await jfetch(base + '/submissions?base64_encoded=true&wait=false',
          { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body) }, signal, 4);
      } catch (e) {
        if (e && (e.name === 'AbortError')) throw e;
        throw fail('Could not reach the Judge0 server (' + base + ').\nCheck your internet, or the Judge0 URL in Settings. The free public server can also be busy - try again in a minute.');
      }
      if (r.ok) { token = (await r.json()).token; break; }
      lastText = (await r.text()).slice(0, 300);
      if (r.status === 429) throw fail('The free Judge0 server says "too many requests" (HTTP 429). Wait ~30 seconds and press Run again, or use your own Judge0 server / RapidAPI key in Settings.');
      if (r.status === 401 || r.status === 403) throw fail('Judge0 refused the request (HTTP ' + r.status + '). The API key / host in Settings is wrong or missing.');
      // 400/422: maybe extra limits not allowed -> next (lite) body
    }
    if (!token) throw fail('Judge0 did not accept the program: ' + lastText);

    let j = null;
    for (let i = 0; i < 150; i++) {
      await sleep(i < 8 ? 600 : 1200);
      if (signal && signal.aborted) throw abortErr();
      const r = await jfetch(base + '/submissions/' + token + '?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory,exit_code',
        { headers }, signal, 4);
      if (!r.ok) throw fail('Judge0 result error (HTTP ' + r.status + ').');
      const jj = await r.json();
      if (jj.status && jj.status.id <= 2) continue;
      j = jj; break;
    }
    if (!j) throw fail('Judge0 did not finish in time (queue is busy). Press Run again.');
    result = j;
    // wrong compiler setup on the server -> try the old known id
    if (j.status && (j.status.id === 13 || j.status.id === 14) && ti < tryIds.length - 1) { notes.push('newest compiler failed on this server, retried with the default one'); continue; }
    break;
  }

  const res = {
    status: result.status || { id: 0, description: '?' },
    stdout: dec(result.stdout), stderr: dec(result.stderr), compile: dec(result.compile_output), message: dec(result.message),
    time: result.time, memory: result.memory, exitCode: result.exit_code, notes
  };
  res.hint = explain(res, { stdin: o.stdin, lang });
  return res;
}

const API = { run, languages, pickLang, fixJava, explain, FALLBACK_ID };
root.SimRunner = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
