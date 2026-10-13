const samples = {
  python: 'print("Hello from Python")',
  javascript: 'console.log("Hello from JS");',
  html: '<h1>Hello HTML</h1>',
  cpp: '#include <iostream>\nint main(){ std::cout << "Hello C++"; }',
  c: '#include <stdio.h>\nint main(){ printf("Hello C"); }',
  java: 'public class Main {\n  public static void main(String[] a){\n    System.out.println("Hello Java");\n  }\n}'
};

let editor;
const $ = id => document.getElementById(id);

require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create($('editor'), {
    value: samples.python,
    language: 'python',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false }
  });
});

$('lang').addEventListener('change', e => {
  const lang = e.target.value;
  monaco.editor.setModelLanguage(editor.getModel(), lang);
  editor.setValue(samples[lang]);
});

// Step 3 me yaha real runners aayenge
const runners = {};

$('run').addEventListener('click', async () => {
  const lang = $('lang').value;
  const code = editor.getValue();
  const input = $('input').value;
  $('output').textContent = `[${lang}] runner abhi nahi bana (Step 3).\n\nCode length: ${code.length}`;
});
