# ⚛ Sim Lab

Browser me chalne wala online **code + simulation playground**. Python, JavaScript, HTML/CSS/JS, C, C++, Java, Rust aur Go me code likho, input data do, aur graphs ya 3D simulation dekho. Poora frontend GitHub Pages pe free host hota hai.

## Features

- VS Code wala editor (Monaco), dark/light theme
- **Python browser me hi chalta hai** (Pyodide): NumPy, SciPy, Matplotlib, Pandas
- JavaScript aur HTML/CSS/JS browser me chalte hain
- C, C++, Java, Rust, Go: Judge0 API se (Settings me URL daalo)
- Input: stdin, Parameters (name = value), JSON, file upload (CSV/JSON/TXT)
- Output: Console, interactive Plotly graphs (2D/3D), matplotlib images, HTML/3D preview
- 3D templates: drone, robotic arm, building + sun study, truss bridge stress
- Save, Open, Share link, auto-save in browser
- Drag se panels resize, mobile layout

## Project files

```
index.html     page structure
style.css      design, themes, layout
examples.js    basic simulations (Python/JS/HTML/C/C++/Java/Rust/Go)
examples3d.js  3D engineering templates (Three.js) + Python 3D (Plotly)
app.js         saara logic (editor, runners, graphs, settings)
README.md      ye file
```

## Deploy

1. Saari files repo ke root me rakho.
2. Settings → Pages → Branch `main`, folder `/ (root)` → Save.
3. Link: `https://<username>.github.io/<repo>/`

## Code me inputs kaise milte hain

| Input | Python | JavaScript / HTML | C / C++ / Java / Rust / Go |
|---|---|---|---|
| Stdin tab | `input()` ya `INPUT` | `INPUT` | `cin`, `scanf`, `Scanner` |
| Parameters | `PARAMS["name"]` | `PARAMS.name` | stdin ke pehle `name=value` lines |
| JSON tab | `DATA` | `DATA` | supported nahi |
| Files tab | `open("/data/file.csv")` | `FILES["file.csv"]` | supported nahi |

## Graphs

- **Python (Plotly):** `show_plot({"data": [...], "layout": {...}})`. 3D ke liye `scatter3d`, `surface`, `mesh3d` use karo.
- **Python (matplotlib):** `plt.show()` image Graph tab me dikhata hai.
- **JavaScript:** `Plotly.newPlot(PLOT, data, layout)`.
- **3D animation:** HTML mode me Three.js use karo. Examples dropdown me ready templates hain.

## 3D templates ko apne project ke liye badalna

Dropdown se template chuno, code editor me dikhega. Physics wale numbers (mass, EA, link length, floor height) code ke upar constants me hain, wahi badalo. Naye parts ke liye Three.js docs: https://threejs.org/docs

## Limits (zaroori)

- Python/JS me infinite loop doge to tab freeze hoga, page reload karna padega.
- C/C++/Java/Rust/Go ke liye internet aur Judge0 server chahiye. Public free instance par rate limit ho sakti hai.
- Ye templates **educational/approximate** physics hain (point-mass drone, spring-based truss). Real engineering design ya safety decision ke liye proper tools (FEA, CFD, standards) use karo.
- Python kuch libraries (jo C extensions maangti hain, jaise TensorFlow) Pyodide me nahi chalti.

## Libraries (CDN)

Monaco Editor, Pyodide, Plotly.js, Three.js
