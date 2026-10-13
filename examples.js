/* =========================================================
   SIM LAB - examples.js
   Format:  window.EXAMPLES[lang] = [ { name, code, input, params, json } ]
   - input  : stdin text (optional)
   - params : { name: value } (optional)
   - json   : object (optional)
   app.js is list se "📂 Examples" dropdown banayega aur
   select karne par code + input + params + json bhar dega.
   ========================================================= */

window.EXAMPLES = {

/* ======================= PYTHON ======================= */
python: [

{
  name: "Hello + stdin",
  input: "Rahul\n5",
  code: String.raw`name = input("Naam: ")
n = int(input())
print("Hello,", name)
print("Squares:", [i * i for i in range(1, n + 1)])
print("Poora input text:", repr(INPUT))
`
},

{
  name: "Projectile motion (Parameters + Graph)",
  params: { v0: 30, angle: 45, g: 9.81, drag: 0.0 },
  code: String.raw`import numpy as np

v0    = float(PARAMS.get("v0", 30))
angle = np.radians(float(PARAMS.get("angle", 45)))
g     = float(PARAMS.get("g", 9.81))
drag  = float(PARAMS.get("drag", 0.0))   # 0 = no air resistance

dt = 0.01
x, y = 0.0, 0.0
vx, vy = v0 * np.cos(angle), v0 * np.sin(angle)
xs, ys = [x], [y]

while y >= 0:
    ax = -drag * vx
    ay = -g - drag * vy
    vx += ax * dt
    vy += ay * dt
    x  += vx * dt
    y  += vy * dt
    xs.append(x); ys.append(y)

print(f"Range      : {max(xs):.2f} m")
print(f"Max height : {max(ys):.2f} m")
print(f"Flight time: {len(xs) * dt:.2f} s")

show_plot({
    "data": [{"x": xs, "y": ys, "type": "scatter", "mode": "lines", "name": "path"}],
    "layout": {"title": "Projectile Trajectory",
               "xaxis": {"title": "x (m)"},
               "yaxis": {"title": "y (m)", "scaleanchor": "x"}}
})
`
},

{
  name: "Planet orbit (2-body, Leapfrog)",
  params: { steps: 4000, dt: 0.01, ecc: 0.5 },
  code: String.raw`import numpy as np

steps = int(float(PARAMS.get("steps", 4000)))
dt    = float(PARAMS.get("dt", 0.01))
ecc   = float(PARAMS.get("ecc", 0.5))     # 0 = circle, <1 = ellipse

GM = 4 * np.pi ** 2          # AU^3 / yr^2 units
r  = np.array([1.0, 0.0])
v  = np.array([0.0, 2 * np.pi * np.sqrt(1 + ecc)])

def acc(r):
    return -GM * r / np.linalg.norm(r) ** 3

xs, ys, E = [], [], []
a = acc(r)
for _ in range(steps):
    v += 0.5 * dt * a
    r += dt * v
    a = acc(r)
    v += 0.5 * dt * a
    xs.append(float(r[0])); ys.append(float(r[1]))
    E.append(0.5 * float(v @ v) - GM / float(np.linalg.norm(r)))

print("Energy start :", round(E[0], 5))
print("Energy end   :", round(E[-1], 5))
print("Drift        :", abs(E[-1] - E[0]))

show_plot({
    "data": [
        {"x": xs, "y": ys, "mode": "lines", "name": "orbit"},
        {"x": [0], "y": [0], "mode": "markers", "marker": {"size": 14, "color": "orange"}, "name": "Sun"}
    ],
    "layout": {"title": "Orbit", "yaxis": {"scaleanchor": "x"}}
})
`
},

{
  name: "SIR epidemic model (matplotlib)",
  params: { beta: 0.35, gamma: 0.1, days: 160, N: 1000000, I0: 10 },
  code: String.raw`import numpy as np
import matplotlib.pyplot as plt

beta  = float(PARAMS.get("beta", 0.35))
gamma = float(PARAMS.get("gamma", 0.1))
days  = int(float(PARAMS.get("days", 160)))
N     = float(PARAMS.get("N", 1e6))
I0    = float(PARAMS.get("I0", 10))

S, I, R = N - I0, I0, 0.0
hist = []
for t in range(days):
    dS = -beta * S * I / N
    dI =  beta * S * I / N - gamma * I
    dR =  gamma * I
    S += dS; I += dI; R += dR
    hist.append((S, I, R))

h = np.array(hist)
print("R0 =", round(beta / gamma, 2))
print("Peak infected:", int(h[:, 1].max()), "on day", int(h[:, 1].argmax()))

plt.figure(figsize=(8, 4.5))
plt.plot(h[:, 0], label="Susceptible")
plt.plot(h[:, 1], label="Infected")
plt.plot(h[:, 2], label="Recovered")
plt.xlabel("Days"); plt.ylabel("People")
plt.title("SIR Model")
plt.legend(); plt.grid(alpha=0.3)
plt.show()
`
},

{
  name: "1D Heat diffusion (finite difference)",
  params: { alpha: 0.01, nx: 101, steps: 2000, snapshots: 5 },
  code: String.raw`import numpy as np

alpha = float(PARAMS.get("alpha", 0.01))
nx    = int(float(PARAMS.get("nx", 101)))
steps = int(float(PARAMS.get("steps", 2000)))
snaps = int(float(PARAMS.get("snapshots", 5)))

L  = 1.0
dx = L / (nx - 1)
dt = 0.4 * dx * dx / alpha          # stable (< 0.5)
x  = np.linspace(0, L, nx)
u  = np.where((x > 0.4) & (x < 0.6), 100.0, 0.0)   # hot strip in middle

traces = []
every = max(1, steps // snaps)
for n in range(steps + 1):
    if n % every == 0:
        traces.append({"x": x.tolist(), "y": u.tolist(), "mode": "lines",
                       "name": f"t = {n * dt:.3f}"})
    un = u.copy()
    u[1:-1] = un[1:-1] + alpha * dt / dx**2 * (un[2:] - 2 * un[1:-1] + un[:-2])
    u[0] = u[-1] = 0.0

print("dt used:", dt)
print("Final max temp:", float(u.max()))
show_plot({"data": traces, "layout": {"title": "Heat Diffusion",
           "xaxis": {"title": "x"}, "yaxis": {"title": "Temperature"}}})
`
},

{
  name: "Spring-mass-damper (JSON input)",
  json: { mass: 1.0, k: 20.0, c: 0.4, x0: 1.0, v0: 0.0, t_end: 15, dt: 0.005 },
  code: String.raw`import numpy as np

m, k, c = DATA["mass"], DATA["k"], DATA["c"]
x, v    = DATA["x0"], DATA["v0"]
dt, T   = DATA["dt"], DATA["t_end"]

t_list, x_list = [], []
t = 0.0
while t < T:
    a = (-k * x - c * v) / m
    v += a * dt
    x += v * dt
    t += dt
    t_list.append(t); x_list.append(x)

wn   = np.sqrt(k / m)
zeta = c / (2 * np.sqrt(k * m))
print(f"Natural freq : {wn:.3f} rad/s")
print(f"Damping ratio: {zeta:.3f}",
      "(underdamped)" if zeta < 1 else "(critical/over-damped)")

show_plot({"data": [{"x": t_list, "y": x_list, "mode": "lines", "name": "x(t)"}],
           "layout": {"title": "Spring-Mass-Damper",
                      "xaxis": {"title": "time (s)"},
                      "yaxis": {"title": "displacement"}}})
`
},

{
  name: "Monte Carlo estimate of Pi",
  params: { samples: 200000 },
  code: String.raw`import numpy as np

n = int(float(PARAMS.get("samples", 200000)))
rng = np.random.default_rng(1)
pts = rng.random((n, 2))
inside = (pts ** 2).sum(axis=1) <= 1
print("Pi estimate:", 4 * inside.mean())
print("Error      :", abs(4 * inside.mean() - np.pi))

k = min(n, 3000)
show_plot({"data": [
    {"x": pts[:k][inside[:k], 0].tolist(), "y": pts[:k][inside[:k], 1].tolist(),
     "mode": "markers", "marker": {"size": 3}, "name": "inside"},
    {"x": pts[:k][~inside[:k], 0].tolist(), "y": pts[:k][~inside[:k], 1].tolist(),
     "mode": "markers", "marker": {"size": 3}, "name": "outside"}],
  "layout": {"title": "Monte Carlo Pi", "yaxis": {"scaleanchor": "x"}}})
`
},

{
  name: "Read uploaded CSV (Files tab)",
  code: String.raw`# Files tab me "data.csv" upload karo (pehli line header, numeric columns)
import csv

with open("/data/data.csv") as f:
    rows = list(csv.DictReader(f))

print("Rows   :", len(rows))
print("Columns:", list(rows[0].keys()))

cols = list(rows[0].keys())
x = list(range(len(rows)))
traces = []
for c in cols:
    try:
        traces.append({"x": x, "y": [float(r[c]) for r in rows], "mode": "lines", "name": c})
    except ValueError:
        pass      # non-numeric column skip

show_plot({"data": traces, "layout": {"title": "CSV data"}})
`
}

],

/* ===================== JAVASCRIPT ===================== */
javascript: [

{
  name: "Hello + INPUT",
  input: "line one\nline two",
  code: String.raw`console.log("Input lines:", INPUT.split("\n"));
console.log("Sum 1..100 =", Array.from({length: 100}, (_, i) => i + 1).reduce((a, b) => a + b));
`
},

{
  name: "Pendulum (Plotly, PARAMS)",
  params: { L: 1.5, theta0: 60, g: 9.81, tEnd: 12 },
  code: String.raw`const L = +PARAMS.L, g = +PARAMS.g;
let th = (+PARAMS.theta0) * Math.PI / 180, w = 0;
const dt = 0.002, T = +PARAMS.tEnd;
const t = [], theta = [], omega = [];

for (let s = 0; s * dt < T; s++) {
  const a = -(g / L) * Math.sin(th);
  w += a * dt;           // semi-implicit Euler
  th += w * dt;
  if (s % 10 === 0) { t.push(s * dt); theta.push(th * 180 / Math.PI); omega.push(w); }
}

console.log("Small-angle period:", (2 * Math.PI * Math.sqrt(L / g)).toFixed(3), "s");

Plotly.newPlot(PLOT, [
  { x: t, y: theta, name: "theta (deg)" },
  { x: t, y: omega, name: "omega (rad/s)" }
], { title: "Nonlinear Pendulum", xaxis: { title: "time (s)" } });
`
},

{
  name: "Random walk (JSON input)",
  json: { walkers: 5, steps: 1000 },
  code: String.raw`const { walkers, steps } = DATA;
const traces = [];
for (let k = 0; k < walkers; k++) {
  let x = 0, y = 0;
  const xs = [0], ys = [0];
  for (let i = 0; i < steps; i++) {
    const a = Math.random() * 2 * Math.PI;
    x += Math.cos(a); y += Math.sin(a);
    xs.push(x); ys.push(y);
  }
  traces.push({ x: xs, y: ys, mode: "lines", name: "walker " + (k + 1) });
  console.log("walker", k + 1, "distance:", Math.hypot(x, y).toFixed(2));
}
Plotly.newPlot(PLOT, traces, { title: "2D Random Walk", yaxis: { scaleanchor: "x" } });
`
},

{
  name: "Logistic map / chaos",
  params: { rMin: 2.5, rMax: 4.0, points: 600 },
  code: String.raw`const rs = [], xs = [];
const n = +PARAMS.points;
for (let i = 0; i < n; i++) {
  const r = +PARAMS.rMin + (+PARAMS.rMax - +PARAMS.rMin) * i / n;
  let x = 0.5;
  for (let k = 0; k < 300; k++) x = r * x * (1 - x);   // transient
  for (let k = 0; k < 80; k++) { x = r * x * (1 - x); rs.push(r); xs.push(x); }
}
Plotly.newPlot(PLOT, [{ x: rs, y: xs, mode: "markers", marker: { size: 1.5 } }],
  { title: "Bifurcation diagram", xaxis: { title: "r" }, yaxis: { title: "x" } });
console.log("points plotted:", rs.length);
`
}

],

/* ========================== HTML ========================== */
html: [

{
  name: "Bouncing particles (canvas)",
  code: String.raw`<!DOCTYPE html>
<html>
<body style="margin:0;background:#0b1020;color:#fff;font-family:sans-serif">
<canvas id="c" style="width:100%;height:100vh;display:block"></canvas>
<script>
const c = document.getElementById("c"), ctx = c.getContext("2d");
function fit(){ c.width = c.clientWidth; c.height = c.clientHeight; }
fit(); addEventListener("resize", fit);

const P = Array.from({length: 120}, () => ({
  x: Math.random()*c.width, y: Math.random()*c.height,
  vx: (Math.random()-.5)*4, vy: (Math.random()-.5)*4,
  r: 3 + Math.random()*5, h: Math.random()*360
}));
let mouse = null;
c.onmousemove = e => { const b = c.getBoundingClientRect(); mouse = {x:e.clientX-b.left, y:e.clientY-b.top}; };
c.onmouseleave = () => mouse = null;

(function loop(){
  ctx.fillStyle = "rgba(11,16,32,0.25)"; ctx.fillRect(0,0,c.width,c.height);
  for (const p of P){
    if (mouse){ const dx = mouse.x-p.x, dy = mouse.y-p.y, d = Math.hypot(dx,dy)+1;
      p.vx += dx/d*0.15; p.vy += dy/d*0.15; }
    p.vx *= 0.99; p.vy *= 0.99;
    p.x += p.vx; p.y += p.vy;
    if (p.x<0||p.x>c.width)  p.vx *= -1;
    if (p.y<0||p.y>c.height) p.vy *= -1;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7);
    ctx.fillStyle = "hsl("+p.h+",80%,60%)"; ctx.fill();
  }
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
`
},

{
  name: "Three.js rotating cube (3D)",
  code: String.raw`<!DOCTYPE html>
<html>
<body style="margin:0;overflow:hidden;background:#111">
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script>
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
cam.position.z = 4;
const r = new THREE.WebGLRenderer({antialias:true});
r.setSize(innerWidth, innerHeight);
document.body.appendChild(r.domElement);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.6,1.6,1.6),
  new THREE.MeshNormalMaterial()
);
scene.add(cube);

(function loop(){
  cube.rotation.x += 0.01; cube.rotation.y += 0.015;
  r.render(scene, cam);
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
`
}

],

/* ========================== C++ ========================== */
cpp: [

{
  name: "Hello + stdin",
  input: "5\n1 2 3 4 5",
  code: String.raw`#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n; cin >> n;
    vector<int> a(n);
    long long sum = 0;
    for (auto &x : a) { cin >> x; sum += x; }
    cout << "n = " << n << ", sum = " << sum << endl;
    return 0;
}
`
},

{
  name: "Projectile (stdin: v0 angle)",
  input: "30 45",
  code: String.raw`#include <iostream>
#include <cmath>
#include <iomanip>
using namespace std;

int main() {
    double v0, ang; cin >> v0 >> ang;
    const double g = 9.81, dt = 0.001, PI = acos(-1.0);
    double x = 0, y = 0, vx = v0 * cos(ang * PI / 180), vy = v0 * sin(ang * PI / 180);
    double hmax = 0, t = 0;
    while (y >= 0) {
        vy -= g * dt; x += vx * dt; y += vy * dt; t += dt;
        if (y > hmax) hmax = y;
    }
    cout << fixed << setprecision(3);
    cout << "Range  : " << x << " m\n";
    cout << "Hmax   : " << hmax << " m\n";
    cout << "Time   : " << t << " s\n";
}
`
},

{
  name: "Matrix multiplication",
  input: "3\n1 2 3\n4 5 6\n7 8 9\n9 8 7\n6 5 4\n3 2 1",
  code: String.raw`#include <iostream>
#include <vector>
using namespace std;
typedef vector<vector<double>> M;

int main() {
    int n; cin >> n;
    M A(n, vector<double>(n)), B = A, C = A;
    for (auto &r : A) for (auto &v : r) cin >> v;
    for (auto &r : B) for (auto &v : r) cin >> v;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            for (int k = 0; k < n; k++)
                C[i][j] += A[i][k] * B[k][j];
    for (auto &r : C) { for (auto v : r) cout << v << " "; cout << "\n"; }
}
`
}

],

/* ========================== C ========================== */
c: [

{
  name: "Primes up to N (sieve)",
  input: "50",
  code: String.raw`#include <stdio.h>
#include <stdlib.h>

int main() {
    int n; scanf("%d", &n);
    char *s = calloc(n + 1, 1);
    for (int i = 2; i * i <= n; i++)
        if (!s[i]) for (int j = i * i; j <= n; j += i) s[j] = 1;
    int cnt = 0;
    for (int i = 2; i <= n; i++) if (!s[i]) { printf("%d ", i); cnt++; }
    printf("\nTotal primes: %d\n", cnt);
    free(s);
    return 0;
}
`
},

{
  name: "Newton cooling (stdin: T0 Tenv k time)",
  input: "90 25 0.1 30",
  code: String.raw`#include <stdio.h>

int main() {
    double T, Te, k, tend;
    scanf("%lf %lf %lf %lf", &T, &Te, &k, &tend);
    double dt = 0.01;
    for (double t = 0; t <= tend + 1e-9; t += dt) {
        if ((int)(t / dt + 0.5) % 500 == 0) printf("t=%6.2f  T=%7.3f\n", t, T);
        T += -k * (T - Te) * dt;
    }
    return 0;
}
`
}

],

/* ========================= JAVA ========================= */
java: [

{
  name: "Hello + Scanner",
  input: "Rahul 7",
  code: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.next();
        int n = sc.nextInt();
        System.out.println("Hello, " + name);
        long f = 1;
        for (int i = 2; i <= n; i++) f *= i;
        System.out.println(n + "! = " + f);
    }
}
`
},

{
  name: "Game of Life (text)",
  input: "20 10",
  code: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int gens = sc.nextInt(), size = sc.nextInt();
        boolean[][] g = new boolean[size][size];
        g[1][2] = g[2][3] = g[3][1] = g[3][2] = g[3][3] = true;   // glider
        for (int t = 0; t <= gens; t++) {
            if (t % 5 == 0) {
                System.out.println("Gen " + t);
                for (boolean[] r : g) {
                    StringBuilder sb = new StringBuilder();
                    for (boolean c : r) sb.append(c ? '#' : '.');
                    System.out.println(sb);
                }
            }
            boolean[][] n = new boolean[size][size];
            for (int i = 0; i < size; i++)
                for (int j = 0; j < size; j++) {
                    int c = 0;
                    for (int di = -1; di <= 1; di++)
                        for (int dj = -1; dj <= 1; dj++)
                            if ((di != 0 || dj != 0)
                                && g[(i + di + size) % size][(j + dj + size) % size]) c++;
                    n[i][j] = g[i][j] ? (c == 2 || c == 3) : (c == 3);
                }
            g = n;
        }
    }
}
`
}

],

/* ========================= RUST ========================= */
rust: [

{
  name: "Fibonacci (stdin)",
  input: "20",
  code: String.raw`use std::io;

fn main() {
    let mut s = String::new();
    io::stdin().read_line(&mut s).unwrap();
    let n: usize = s.trim().parse().unwrap();
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 0..n {
        print!("{} ", a);
        let t = a + b; a = b; b = t;
    }
    println!();
}
`
}

],

/* ========================== GO ========================== */
go: [

{
  name: "Sum of squares (stdin)",
  input: "10",
  code: String.raw`package main

import "fmt"

func main() {
	var n int
	fmt.Scan(&n)
	sum := 0
	for i := 1; i <= n; i++ {
		sum += i * i
	}
	fmt.Println("Sum of squares 1..", n, "=", sum)
}
`
}

]

};
