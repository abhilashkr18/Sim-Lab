/* =========================================================
   SIM LAB - examples_more.js
   Extra examples: full GAMES, CAD-style outputs (DXF / OBJ / G-code),
   structures, electronics, control and space simulations.
   Load it AFTER examples.js (and the other examples3d*.js) and BEFORE app.js.
   ========================================================= */
(function () {
const E = (window.EXAMPLES = window.EXAMPLES || {});
['python', 'cpp', 'c', 'java', 'rust', 'go'].forEach(function (k) { E[k] = E[k] || []; });

/* ---------------- CPP ---------------- */
E.cpp.push({
  name: "GAME - Snake with autopilot (BFS) - full game",
  input: "24 10 150 50 7",
  code: String.raw`// SNAKE - complete game with an autopilot (BFS shortest path to food).
// Stdin: width height steps print_every seed
#include <iostream>
#include <vector>
#include <deque>
#include <queue>
#include <random>
using namespace std;

struct P { int x, y; };
int W, H;
const int DX[4] = {1, -1, 0, 0}, DY[4] = {0, 0, 1, -1};

bool blocked(int x, int y, const vector<vector<int>>& g) {
    return x < 0 || y < 0 || x >= W || y >= H || g[y][x];
}

// BFS: returns direction index of the first step towards the food, or -1
int bfs(P s, P f, const vector<vector<int>>& g) {
    vector<vector<int>> from(H, vector<int>(W, -2));
    queue<P> q; q.push(s); from[s.y][s.x] = -1;
    while (!q.empty()) {
        P c = q.front(); q.pop();
        if (c.x == f.x && c.y == f.y) break;
        for (int d = 0; d < 4; d++) {
            int nx = c.x + DX[d], ny = c.y + DY[d];
            if (blocked(nx, ny, g) || from[ny][nx] != -2) continue;
            from[ny][nx] = d; q.push({nx, ny});
        }
    }
    if (from[f.y][f.x] == -2) return -1;
    int x = f.x, y = f.y, first = -1;
    while (!(x == s.x && y == s.y)) { first = from[y][x]; x -= DX[first]; y -= DY[first]; }
    return first;
}

void draw(const deque<P>& sn, P food, int step, int score) {
    vector<string> b(H, string(W, ' '));
    b[food.y][food.x] = '*';
    for (size_t i = 0; i < sn.size(); i++) b[sn[i].y][sn[i].x] = (i == 0 ? '@' : 'o');
    cout << "Step " << step << "   Score " << score << "\n+" << string(W, '-') << "+\n";
    for (auto& r : b) cout << "|" << r << "|\n";
    cout << "+" << string(W, '-') << "+\n";
}

int main() {
    int steps, every, seed;
    cin >> W >> H >> steps >> every >> seed;
    mt19937 rng(seed);
    deque<P> sn; sn.push_back({W / 2, H / 2});
    P food{0, 0};
    auto place = [&]() {
        vector<P> freeC;
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
            bool on = false; for (auto& p : sn) if (p.x == x && p.y == y) on = true;
            if (!on) freeC.push_back({x, y});
        }
        if (freeC.empty()) return false;
        food = freeC[rng() % freeC.size()]; return true;
    };
    place();
    int score = 0, step = 0; string end = "Time over";
    draw(sn, food, 0, 0);
    for (step = 1; step <= steps; step++) {
        vector<vector<int>> g(H, vector<int>(W, 0));
        for (size_t i = 0; i + 1 < sn.size(); i++) g[sn[i].y][sn[i].x] = 1;   // tail will move away
        int d = bfs(sn.front(), food, g);
        if (d < 0) for (int k = 0; k < 4; k++) if (!blocked(sn.front().x + DX[k], sn.front().y + DY[k], g)) { d = k; break; }
        if (d < 0) { end = "Trapped - GAME OVER"; break; }
        P nh{sn.front().x + DX[d], sn.front().y + DY[d]};
        sn.push_front(nh);
        if (nh.x == food.x && nh.y == food.y) { score++; if (!place()) { end = "Board full - YOU WIN"; break; } }
        else sn.pop_back();
        if (step % every == 0) draw(sn, food, step, score);
    }
    draw(sn, food, step, score);
    cout << end << ". Final length = " << sn.size() << ", food eaten = " << score << "\n";
}
`
});

E.cpp.push({
  name: "GAME - Tic-Tac-Toe vs unbeatable AI (minimax)",
  input: "1 9 4 3 6 8 2",
  code: String.raw`// TIC-TAC-TOE vs an UNBEATABLE AI (minimax). You are X, AI is O.
// Stdin: your moves as cell numbers 1-9 (1 = top-left, 9 = bottom-right)
#include <iostream>
#include <vector>
using namespace std;

char B[9];
int LINES[8][3] = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};

char winner() {
    for (auto& l : LINES) if (B[l[0]] != ' ' && B[l[0]] == B[l[1]] && B[l[1]] == B[l[2]]) return B[l[0]];
    for (int i = 0; i < 9; i++) if (B[i] == ' ') return 0;
    return 'D';   // draw
}
int minimax(bool aiTurn, int depth) {
    char w = winner();
    if (w == 'O') return 10 - depth;
    if (w == 'X') return depth - 10;
    if (w == 'D') return 0;
    int best = aiTurn ? -100 : 100;
    for (int i = 0; i < 9; i++) if (B[i] == ' ') {
        B[i] = aiTurn ? 'O' : 'X';
        int s = minimax(!aiTurn, depth + 1);
        B[i] = ' ';
        best = aiTurn ? max(best, s) : min(best, s);
    }
    return best;
}
void show() {
    for (int r = 0; r < 3; r++) {
        cout << " " << B[r*3] << " | " << B[r*3+1] << " | " << B[r*3+2] << "\n";
        if (r < 2) cout << "---+---+---\n";
    }
    cout << "\n";
}
int main() {
    for (auto& c : B) c = ' ';
    int cell;
    cout << "You = X, AI = O\n\n"; show();
    while (!winner() && (cin >> cell)) {
        if (cell < 1 || cell > 9 || B[cell-1] != ' ') { cout << "Cell " << cell << " is not free, skipped.\n"; continue; }
        B[cell-1] = 'X';
        cout << "You -> " << cell << "\n";
        if (!winner()) {
            int bestI = -1, bestS = -100;
            for (int i = 0; i < 9; i++) if (B[i] == ' ') {
                B[i] = 'O'; int s = minimax(false, 1); B[i] = ' ';
                if (s > bestS) { bestS = s; bestI = i; }
            }
            B[bestI] = 'O'; cout << "AI  -> " << bestI + 1 << "\n";
        }
        show();
    }
    char w = winner();
    if (w == 'X') cout << "You win!\n"; else if (w == 'O') cout << "AI wins (it never loses).\n";
    else if (w == 'D') cout << "Draw.\n"; else cout << "Game not finished - give more moves in Stdin.\n";
}
`
});

E.cpp.push({
  name: "GAME - Maze generator + BFS solver",
  input: "41 15 12",
  code: String.raw`// MAZE generator (recursive backtracker) + BFS solver.   Stdin: width height seed  (odd numbers)
#include <iostream>
#include <vector>
#include <queue>
#include <random>
#include <algorithm>
using namespace std;

int main() {
    int W, H, seed; cin >> W >> H >> seed;
    if (W % 2 == 0) W++; if (H % 2 == 0) H++;
    mt19937 rng(seed);
    vector<string> m(H, string(W, '#'));
    vector<pair<int,int>> st; st.push_back({1, 1}); m[1][1] = ' ';
    int dx[4] = {2, -2, 0, 0}, dy[4] = {0, 0, 2, -2};
    while (!st.empty()) {
        int x = st.back().first, y = st.back().second;
        vector<int> d = {0, 1, 2, 3}; shuffle(d.begin(), d.end(), rng);
        bool moved = false;
        for (int k : d) {
            int nx = x + dx[k], ny = y + dy[k];
            if (nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1 && m[ny][nx] == '#') {
                m[y + dy[k] / 2][x + dx[k] / 2] = ' '; m[ny][nx] = ' ';
                st.push_back({nx, ny}); moved = true; break;
            }
        }
        if (!moved) st.pop_back();
    }
    // BFS from (1,1) to (W-2,H-2)
    vector<vector<int>> par(H, vector<int>(W, -1));
    queue<pair<int,int>> q; q.push({1, 1}); par[1][1] = 4;
    int mx[4] = {1, -1, 0, 0}, my[4] = {0, 0, 1, -1};
    while (!q.empty()) {
        int x = q.front().first, y = q.front().second; q.pop();
        for (int k = 0; k < 4; k++) {
            int nx = x + mx[k], ny = y + my[k];
            if (m[ny][nx] == ' ' && par[ny][nx] < 0) { par[ny][nx] = k; q.push({nx, ny}); }
        }
    }
    int x = W - 2, y = H - 2, len = 0;
    while (!(x == 1 && y == 1)) { m[y][x] = '.'; int k = par[y][x]; x -= mx[k]; y -= my[k]; len++; }
    m[1][1] = 'S'; m[H - 2][W - 2] = 'E';
    for (auto& r : m) cout << r << "\n";
    cout << "\nPath length: " << len << " steps (S = start, E = exit, . = solution)\n";
}
`
});

E.cpp.push({
  name: "CAD - L-bracket drawing, area, mass, centre of gravity",
  input: "120 90 20 10 2 7.85 5",
  code: String.raw`// CAD-STYLE: flat L-BRACKET - ASCII drawing + area, volume, mass, centre of gravity.
// Stdin: a b t holeD holesPerLeg density_g_cm3 plateThickness      (mm)
//   a = horizontal leg length, b = vertical leg height, t = leg width
#include <iostream>
#include <vector>
#include <cmath>
#include <iomanip>
using namespace std;

int main() {
    double a, b, t, hd, dens, th; int nh;
    cin >> a >> b >> t >> hd >> nh >> dens >> th;
    const double PI = acos(-1.0);

    // ---- hole centres: nh holes on each leg centre line
    vector<pair<double,double>> holes;
    for (int i = 0; i < nh; i++) {
        double f = (i + 1.0) / (nh + 1.0);
        holes.push_back({t + (a - t) * f, t / 2});          // on horizontal leg
        holes.push_back({t / 2, t + (b - t) * f});          // on vertical leg
    }
    // ---- analytic area & centroid (L = rectangle 1 + rectangle 2) minus holes
    double A1 = a * t,           x1 = a / 2, y1 = t / 2;
    double A2 = (b - t) * t,     x2 = t / 2, y2 = t + (b - t) / 2;
    double Ah = PI * hd * hd / 4;
    double A = A1 + A2 - Ah * holes.size();
    double mx = A1 * x1 + A2 * x2, my = A1 * y1 + A2 * y2;
    for (auto& h : holes) { mx -= Ah * h.first; my -= Ah * h.second; }
    double cx = mx / A, cy = my / A;
    double vol = A * th / 1000.0;                // cm3
    double mass = vol * dens;                    // g

    // ---- ASCII drawing (1 char = 5 mm wide, 10 mm tall)
    int cols = (int)ceil(a / 5.0), rows = (int)ceil(b / 10.0);
    vector<string> g(rows, string(cols, ' '));
    for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) {
        double X = (c + 0.5) * 5.0, Y = (r + 0.5) * 10.0;       // Y measured from the TOP of the drawing
        double Yb = b - Y;                                         // height from the bottom
        bool inside = (Yb <= t) || (X <= t);
        // convert: drawing y=0 is the bottom of bracket
        if (inside) g[r][c] = '#';
        for (auto& h : holes) {
            double dxx = X - h.first, dyy = Yb - h.second;
            if (dxx * dxx + dyy * dyy <= hd * hd / 4 * 1.6) g[r][c] = 'O';
        }
    }
    int gr = (int)(rows - cy / 10.0), gc = (int)(cx / 5.0);
    if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) g[gr][gc] = '+';

    cout << "      <---------------- " << a << " ---------------->\n";
    for (int r = 0; r < rows; r++) {
        cout << "      " << g[r];
        if (r == rows / 2) cout << "   ^ " << b << " mm";
        cout << "\n";
    }
    cout << "\n  # = metal   O = hole (dia " << hd << ")   + = centre of gravity\n\n";
    cout << fixed << setprecision(2);
    cout << "Leg width t         : " << t << " mm      Plate thickness : " << th << " mm\n";
    cout << "Holes               : " << holes.size() << " x dia " << hd << " mm\n";
    cout << "Area (net)          : " << A << " mm2\n";
    cout << "Volume              : " << vol << " cm3\n";
    cout << "Mass (" << dens << " g/cm3)  : " << mass << " g\n";
    cout << "Centre of gravity   : x = " << cx << " mm, y = " << cy << " mm  (from outer corner)\n";
    cout << "Hole centres (x, y) :\n";
    for (auto& h : holes) cout << "   (" << h.first << ", " << h.second << ")\n";
}
`
});

E.cpp.push({
  name: "STRUCTURE - 2D truss solver (stiffness method)",
  input: "5 7\n0 0\n4 0\n8 0\n2 3\n6 3\n0 1 10 200\n1 2 10 200\n0 3 10 200\n3 1 10 200\n3 4 10 200\n1 4 10 200\n4 2 10 200\n2\n0 1 1\n2 0 1\n2\n3 0 -20\n4 0 -10",
  code: String.raw`// STRUCTURAL: 2D TRUSS SOLVER (direct stiffness method).
// Stdin:
//   nNodes nMembers
//   x y                      (nNodes lines, metres)
//   n1 n2 A_cm2 E_GPa        (nMembers lines, nodes are 0-based)
//   nSupports                then   node fixX fixY   (1 = fixed)
//   nLoads                   then   node Fx Fy       (kN, +x right, +y up)
#include <iostream>
#include <vector>
#include <cmath>
#include <iomanip>
using namespace std;

struct Mem { int a, b; double A, E, L, c, s; };

vector<double> solve(vector<vector<double>> K, vector<double> f) {      // Gauss elimination
    int n = f.size();
    for (int i = 0; i < n; i++) {
        int p = i; for (int r = i + 1; r < n; r++) if (fabs(K[r][i]) > fabs(K[p][i])) p = r;
        swap(K[i], K[p]); swap(f[i], f[p]);
        for (int r = i + 1; r < n; r++) {
            double m = K[r][i] / K[i][i];
            for (int c = i; c < n; c++) K[r][c] -= m * K[i][c];
            f[r] -= m * f[i];
        }
    }
    vector<double> x(n);
    for (int i = n - 1; i >= 0; i--) {
        double s = f[i]; for (int c = i + 1; c < n; c++) s -= K[i][c] * x[c];
        x[i] = s / K[i][i];
    }
    return x;
}
int main() {
    int N, M; cin >> N >> M;
    vector<double> X(N), Y(N);
    for (int i = 0; i < N; i++) cin >> X[i] >> Y[i];
    vector<Mem> mem(M);
    for (auto& m : mem) {
        cin >> m.a >> m.b >> m.A >> m.E;
        m.A *= 1e-4; m.E *= 1e6;                       // cm2 -> m2 , GPa -> kN/m2
        double dx = X[m.b] - X[m.a], dy = Y[m.b] - Y[m.a];
        m.L = hypot(dx, dy); m.c = dx / m.L; m.s = dy / m.L;
    }
    vector<vector<double>> K(2 * N, vector<double>(2 * N, 0));
    for (auto& m : mem) {
        double k = m.E * m.A / m.L;
        int d[4] = {2 * m.a, 2 * m.a + 1, 2 * m.b, 2 * m.b + 1};
        double v[4] = {m.c, m.s, -m.c, -m.s};
        for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) K[d[i]][d[j]] += k * v[i] * v[j];
    }
    vector<int> fixd(2 * N, 0); int ns; cin >> ns;
    for (int i = 0; i < ns; i++) { int n, fx, fy; cin >> n >> fx >> fy; fixd[2 * n] = fx; fixd[2 * n + 1] = fy; }
    vector<double> F(2 * N, 0); int nl; cin >> nl;
    for (int i = 0; i < nl; i++) { int n; double fx, fy; cin >> n >> fx >> fy; F[2 * n] += fx; F[2 * n + 1] += fy; }
    vector<int> fr; for (int i = 0; i < 2 * N; i++) if (!fixd[i]) fr.push_back(i);
    vector<vector<double>> Kr(fr.size(), vector<double>(fr.size()));
    vector<double> Fr(fr.size());
    for (size_t i = 0; i < fr.size(); i++) { Fr[i] = F[fr[i]]; for (size_t j = 0; j < fr.size(); j++) Kr[i][j] = K[fr[i]][fr[j]]; }
    vector<double> u = solve(Kr, Fr), U(2 * N, 0);
    for (size_t i = 0; i < fr.size(); i++) U[fr[i]] = u[i];

    cout << fixed << setprecision(3);
    cout << "NODE DISPLACEMENTS (mm)\n";
    for (int i = 0; i < N; i++) cout << "  node " << i << "  ux = " << setw(8) << U[2*i]*1000 << "   uy = " << setw(8) << U[2*i+1]*1000 << "\n";
    cout << "\nMEMBER FORCES (kN)   + = tension, - = compression\n";
    double maxF = 0; int worst = 0;
    for (int i = 0; i < M; i++) {
        auto& m = mem[i];
        double e = ((U[2*m.b] - U[2*m.a]) * m.c + (U[2*m.b+1] - U[2*m.a+1]) * m.s) / m.L;
        double Fm = m.E * m.A * e, stress = Fm / (m.A * 1e4) * 10;   // kN/cm2 -> MPa
        cout << "  member " << i << " (" << m.a << "-" << m.b << ")  L = " << setw(6) << m.L << " m   F = " << setw(9) << Fm << " kN  "
             << (Fm > 1e-6 ? "TENSION    " : Fm < -1e-6 ? "COMPRESSION" : "zero       ") << "  stress = " << setw(7) << stress << " MPa\n";
        if (fabs(Fm) > maxF) { maxF = fabs(Fm); worst = i; }
    }
    cout << "\nREACTIONS (kN)\n";
    for (int i = 0; i < 2 * N; i++) if (fixd[i]) {
        double r = -F[i]; for (int j = 0; j < 2 * N; j++) r += K[i][j] * U[j];
        cout << "  node " << i / 2 << (i % 2 ? "  Ry = " : "  Rx = ") << r << "\n";
    }
    cout << "\nCritical member: " << worst << "  (|F| = " << maxF << " kN)\n";
}
`
});

E.cpp.push({
  name: "GAME - Sudoku solver (backtracking)",
  input: "530070000\n600195000\n098000060\n800060003\n400803001\n700020006\n060000280\n000419005\n000080079",
  code: String.raw`// SUDOKU solver (backtracking). Stdin: 9 lines of 9 characters, 0 or . = empty
#include <iostream>
using namespace std;
int g[9][9]; long long calls = 0;

bool ok(int r, int c, int v) {
    for (int i = 0; i < 9; i++) if (g[r][i] == v || g[i][c] == v) return false;
    int br = r / 3 * 3, bc = c / 3 * 3;
    for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) if (g[br + i][bc + j] == v) return false;
    return true;
}
bool solve() {
    calls++;
    for (int r = 0; r < 9; r++) for (int c = 0; c < 9; c++) if (!g[r][c]) {
        for (int v = 1; v <= 9; v++) if (ok(r, c, v)) { g[r][c] = v; if (solve()) return true; g[r][c] = 0; }
        return false;
    }
    return true;
}
void show() {
    for (int r = 0; r < 9; r++) {
        if (r % 3 == 0) cout << "+-------+-------+-------+\n";
        for (int c = 0; c < 9; c++) { if (c % 3 == 0) cout << "| "; cout << g[r][c] << " "; }
        cout << "|\n";
    }
    cout << "+-------+-------+-------+\n";
}
int main() {
    for (int r = 0; r < 9; r++) { string s; cin >> s; for (int c = 0; c < 9; c++) g[r][c] = (s[c] >= '1' && s[c] <= '9') ? s[c] - '0' : 0; }
    cout << "PUZZLE\n"; show();
    if (solve()) { cout << "\nSOLVED (" << calls << " recursive calls)\n"; show(); } else cout << "No solution\n";
}
`
});

/* ---------------- C ---------------- */
E.c.push({
  name: "GAME - Pong AI vs AI (ASCII frames)",
  input: "400 100 5",
  code: String.raw`/* PONG - complete game, AI vs AI, ASCII frames.  Stdin: frames print_every seed */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#define W 40
#define H 14

void draw(double bx, double by, double ly, double ry, int sl, int sr, int f) {
    char b[H][W + 1];
    for (int y = 0; y < H; y++) { for (int x = 0; x < W; x++) b[y][x] = ' '; b[y][W] = 0; }
    for (int y = 0; y < H; y++) b[y][W / 2] = ':';
    for (int k = -1; k <= 1; k++) {
        int a = (int)ly + k, c = (int)ry + k;
        if (a >= 0 && a < H) b[a][1] = '|';
        if (c >= 0 && c < H) b[c][W - 2] = '|';
    }
    int ix = (int)bx, iy = (int)by;
    if (ix >= 0 && ix < W && iy >= 0 && iy < H) b[iy][ix] = 'O';
    printf("Frame %d     LEFT %d  -  %d RIGHT\n+", f, sl, sr);
    for (int x = 0; x < W; x++) putchar('-'); puts("+");
    for (int y = 0; y < H; y++) printf("|%s|\n", b[y]);
    putchar('+'); for (int x = 0; x < W; x++) putchar('-'); puts("+");
}
int main(void) {
    int frames, every, seed;
    if (scanf("%d %d %d", &frames, &every, &seed) != 3) return 1;
    srand(seed);
    double bx = W / 2.0, by = H / 2.0, vx = 0.9, vy = 0.5, ly = H / 2.0, ry = H / 2.0;
    int sl = 0, sr = 0;
    for (int f = 0; f <= frames; f++) {
        bx += vx; by += vy;
        if (by < 0) { by = -by; vy = -vy; }
        if (by >= H - 1) { by = 2 * (H - 1) - by; vy = -vy; }
        /* paddles follow the ball with limited speed (this is the "AI") */
        double sp = 0.45;
        if (vx < 0) ly += fmax(-sp, fmin(sp, by - ly));
        if (vx > 0) ry += fmax(-sp, fmin(sp, by - ry));
        if (bx <= 2 && vx < 0) {
            if (fabs(by - ly) <= 1.6) { vx = -vx * 1.03; vy += (by - ly) * 0.3; bx = 2; }
            else { sr++; bx = W / 2.0; by = H / 2.0; vx = 0.9; vy = (rand() % 100) / 100.0 - 0.5; }
        }
        if (bx >= W - 3 && vx > 0) {
            if (fabs(by - ry) <= 1.6) { vx = -vx * 1.03; vy += (by - ry) * 0.3; bx = W - 3; }
            else { sl++; bx = W / 2.0; by = H / 2.0; vx = -0.9; vy = (rand() % 100) / 100.0 - 0.5; }
        }
        if (vx > 1.8) vx = 1.8; if (vx < -1.8) vx = -1.8;
        if (f % every == 0) draw(bx, by, ly, ry, sl, sr, f);
    }
    printf("FINAL SCORE:  LEFT %d - %d RIGHT\n", sl, sr);
    return 0;
}
`
});

E.c.push({
  name: "GAME - Minesweeper (flood fill + flags)",
  input: "21  4 4  -1 7 7",
  code: String.raw`/* MINESWEEPER - full game with flood-fill. 8x8 board, 10 mines.
   Stdin: seed, then moves as  r c   (row col, 0..7). Prefix flag moves with -1: "-1 r c"  */
#include <stdio.h>
#include <stdlib.h>
#define N 8
#define MINES 10
int mine[N][N], nb[N][N], open_[N][N], flag[N][N], placed = 0;

void place(int sr, int sc) {          /* first click is always safe */
    int k = 0;
    while (k < MINES) {
        int r = rand() % N, c = rand() % N;
        if (mine[r][c] || (abs(r - sr) <= 1 && abs(c - sc) <= 1)) continue;
        mine[r][c] = 1; k++;
    }
    for (int r = 0; r < N; r++) for (int c = 0; c < N; c++) {
        int n = 0;
        for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
            int a = r + i, b = c + j;
            if (a >= 0 && b >= 0 && a < N && b < N) n += mine[a][b];
        }
        nb[r][c] = n;
    }
    placed = 1;
}
void flood(int r, int c) {
    if (r < 0 || c < 0 || r >= N || c >= N || open_[r][c] || flag[r][c]) return;
    open_[r][c] = 1;
    if (nb[r][c] == 0) for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) flood(r + i, c + j);
}
void show(int reveal) {
    printf("    0 1 2 3 4 5 6 7\n   -----------------\n");
    for (int r = 0; r < N; r++) {
        printf(" %d |", r);
        for (int c = 0; c < N; c++) {
            char ch = '.';
            if (flag[r][c]) ch = 'F';
            if (open_[r][c]) ch = nb[r][c] ? '0' + nb[r][c] : ' ';
            if (reveal && mine[r][c]) ch = '*';
            printf("%c ", ch);
        }
        printf("|\n");
    }
    printf("   -----------------\n");
}
int closed_safe(void) { int n = 0; for (int r = 0; r < N; r++) for (int c = 0; c < N; c++) if (!open_[r][c] && !mine[r][c]) n++; return n; }
int main(void) {
    int seed; if (scanf("%d", &seed) != 1) return 1;
    srand(seed);
    int a, r, c; show(0);
    while (scanf("%d", &a) == 1) {
        int isflag = 0;
        if (a == -1) { isflag = 1; if (scanf("%d %d", &r, &c) != 2) break; } else { r = a; if (scanf("%d", &c) != 1) break; }
        if (r < 0 || c < 0 || r >= N || c >= N) { printf("Out of board\n"); continue; }
        if (isflag) { flag[r][c] = !flag[r][c]; printf("Flag toggled at (%d,%d)\n", r, c); show(0); continue; }
        if (!placed) place(r, c);
        printf("Open (%d,%d)\n", r, c);
        if (mine[r][c]) { printf("BOOM! You hit a mine - GAME OVER\n"); show(1); return 0; }
        flood(r, c); show(0);
        if (closed_safe() == 0) { printf("YOU WIN - all safe cells opened!\n"); return 0; }
    }
    printf("Game not finished. Safe cells left: %d\n", closed_safe());
    return 0;
}
`
});

E.c.push({
  name: "CAD - Spur gear pair calculator + involute points",
  input: "2 20 45 20 25 5.5 1450",
  code: String.raw`/* CAD-STYLE: SPUR GEAR PAIR DESIGN CALCULATOR + involute tooth profile points
   Stdin: module_mm  z1  z2  pressure_angle_deg  face_width_mm  power_kW  rpm_pinion */
#include <stdio.h>
#include <math.h>
#define PI 3.14159265358979323846
int main(void) {
    double m, z1, z2, pa, fw, P, n1;
    if (scanf("%lf %lf %lf %lf %lf %lf %lf", &m, &z1, &z2, &pa, &fw, &P, &n1) != 7) return 1;
    double al = pa * PI / 180;
    double d1 = m * z1, d2 = m * z2;                       /* pitch diameters   */
    double db1 = d1 * cos(al), db2 = d2 * cos(al);         /* base diameters    */
    double da1 = d1 + 2 * m, da2 = d2 + 2 * m;             /* outside diameters */
    double df1 = d1 - 2.5 * m, df2 = d2 - 2.5 * m;         /* root diameters    */
    double a = (d1 + d2) / 2, ratio = z2 / z1;
    double eps = (sqrt(da1*da1/4 - db1*db1/4) + sqrt(da2*da2/4 - db2*db2/4) - a * sin(al)) / (PI * m * cos(al));
    double w1 = 2 * PI * n1 / 60, T1 = P * 1000 / w1;      /* N.m               */
    double Ft = T1 / (d1 / 2000), Fr = Ft * tan(al);
    printf("=========== SPUR GEAR PAIR ===========\n");
    printf("Module m             : %.2f mm      Pressure angle : %.1f deg\n", m, pa);
    printf("Teeth                : z1 = %.0f   z2 = %.0f   ratio = %.3f\n\n", z1, z2, ratio);
    printf("                        PINION      GEAR\n");
    printf("Pitch diameter  (mm)  %8.2f  %8.2f\n", d1, d2);
    printf("Base diameter   (mm)  %8.2f  %8.2f\n", db1, db2);
    printf("Outside dia.    (mm)  %8.2f  %8.2f\n", da1, da2);
    printf("Root diameter   (mm)  %8.2f  %8.2f\n", df1, df2);
    printf("Circular pitch  (mm)  %8.3f\n", PI * m);
    printf("Tooth depth     (mm)  %8.3f\n", 2.25 * m);
    printf("Centre distance (mm)  %8.2f\n", a);
    printf("Contact ratio         %8.3f   %s\n\n", eps, eps >= 1.2 ? "(good, >1.2)" : "(too low!)");
    printf("Pinion speed %.0f rpm -> gear speed %.1f rpm\n", n1, n1 / ratio);
    printf("Torque: pinion %.2f N.m -> gear %.2f N.m\n", T1, T1 * ratio);
    printf("Tangential force Ft = %.1f N,  radial force Fr = %.1f N\n", Ft, Fr);
    printf("Lewis bending stress (rough, Y=0.30): %.1f MPa\n\n", Ft / (fw * m * 0.30));
    printf("Involute tooth flank of the PINION (x, y in mm, centre = 0,0):\n");
    printf("   r(mm)    theta(deg)      x         y\n");
    double rb = db1 / 2, ra = da1 / 2;
    int steps = 10;
    for (int i = 0; i <= steps; i++) {
        double r = rb + (ra - rb) * i / steps;
        double ap = acos(rb / r), inv = tan(ap) - ap;      /* involute function */
        printf("  %7.3f   %9.4f   %8.3f  %8.3f\n", r, inv * 180 / PI, r * cos(inv), r * sin(inv));
    }
    return 0;
}
`
});

E.c.push({
  name: "STRUCTURE - Beam shear / moment / deflection diagram",
  input: "6 5 2  2 20  4.5 10  200 8000",
  code: String.raw`/* STRUCTURAL: SIMPLY SUPPORTED BEAM - shear force, bending moment, deflection (ASCII diagrams)
   Stdin: L_m  udl_kN_per_m  nPoint  (pos_m  P_kN)...  E_GPa  I_cm4 */
#include <stdio.h>
#include <math.h>
#define NP 61
int main(void) {
    double L, w, E, I, pos[10], P[10]; int n;
    if (scanf("%lf %lf %d", &L, &w, &n) != 3) return 1;
    for (int i = 0; i < n; i++) scanf("%lf %lf", &pos[i], &P[i]);
    scanf("%lf %lf", &E, &I);
    double EI = E * 1e6 * I * 1e-8;                        /* kN.m2 */
    double RB = w * L * L / 2; for (int i = 0; i < n; i++) RB += P[i] * pos[i];
    RB /= L; double RA = w * L + 0; for (int i = 0; i < n; i++) RA += P[i]; RA -= RB;
    printf("Reactions: RA = %.2f kN   RB = %.2f kN\n\n", RA, RB);
    double x[NP], V[NP], M[NP], y[NP], th[NP], dx = L / (NP - 1), Mmax = 0, Vmax = 0, xm = 0;
    for (int k = 0; k < NP; k++) {
        x[k] = k * dx; V[k] = RA - w * x[k]; M[k] = RA * x[k] - w * x[k] * x[k] / 2;
        for (int i = 0; i < n; i++) if (x[k] >= pos[i]) { V[k] -= P[i]; M[k] -= P[i] * (x[k] - pos[i]); }
        if (fabs(M[k]) > fabs(Mmax)) { Mmax = M[k]; xm = x[k]; }
        if (fabs(V[k]) > Vmax) Vmax = fabs(V[k]);
    }
    /* deflection: integrate M/EI twice, then fix boundary conditions y(0)=y(L)=0 */
    th[0] = 0; y[0] = 0;
    for (int k = 1; k < NP; k++) { th[k] = th[k-1] + 0.5 * (M[k] + M[k-1]) / EI * dx; y[k] = y[k-1] + 0.5 * (th[k] + th[k-1]) * dx; }
    double c = -y[NP-1] / L, ymax = 0, xy = 0;
    for (int k = 0; k < NP; k++) { y[k] += c * x[k]; if (fabs(y[k]) > fabs(ymax)) { ymax = y[k]; xy = x[k]; } }
    printf(" x(m)   V(kN)    M(kN.m)   defl(mm)   Bending moment diagram\n");
    for (int k = 0; k < NP; k += 3) {
        int bars = (int)(fabs(M[k]) / fabs(Mmax) * 40 + 0.5);
        printf("%5.2f %8.2f %9.2f %9.3f   ", x[k], V[k], M[k], y[k] * 1000);
        for (int b = 0; b < bars; b++) putchar('#'); putchar('\n');
    }
    printf("\nMax |V| = %.2f kN\nMax |M| = %.2f kN.m at x = %.2f m\n", Vmax, fabs(Mmax), xm);
    printf("Max deflection = %.3f mm at x = %.2f m   (span/%.0f)\n", fabs(ymax) * 1000, xy, L / fabs(ymax));
    printf("%s\n", L / fabs(ymax) >= 360 ? "Deflection check: OK (L/360)" : "Deflection check: TOO FLEXIBLE (> L/360)");
    return 0;
}
`
});

E.c.push({
  name: "ELECTRONICS - DC circuit solver (nodal analysis)",
  input: "5 6  1 2 100  2 3 220  2 4 330  3 0 470  4 0 150  1 4 680  1 12",
  code: String.raw`/* ELECTRONICS: DC CIRCUIT SOLVER (nodal analysis + Gauss elimination).
   Stdin:  nNodes  nResistors  (a b R_ohm)...  sourceNode  V_source      (node 0 = ground) */
#include <stdio.h>
#include <math.h>
#define MX 20
int main(void) {
    int n, m, a[50], b[50]; double R[50], V;
    int sn;
    if (scanf("%d %d", &n, &m) != 2) return 1;
    for (int i = 0; i < m; i++) scanf("%d %d %lf", &a[i], &b[i], &R[i]);
    scanf("%d %lf", &sn, &V);
    double G[MX][MX + 1] = {{0}};
    for (int i = 0; i < m; i++) {
        double g = 1.0 / R[i];
        G[a[i]][a[i]] += g; G[b[i]][b[i]] += g; G[a[i]][b[i]] -= g; G[b[i]][a[i]] -= g;
    }
    /* ground node 0: V0 = 0 ; source node: Vs = V */
    for (int j = 0; j <= n; j++) { G[0][j] = 0; G[sn][j] = 0; }
    G[0][0] = 1; G[sn][sn] = 1; G[sn][n] = V;
    for (int i = 0; i < n; i++) {
        int p = i; for (int r = i + 1; r < n; r++) if (fabs(G[r][i]) > fabs(G[p][i])) p = r;
        for (int c = 0; c <= n; c++) { double t = G[i][c]; G[i][c] = G[p][c]; G[p][c] = t; }
        for (int r = 0; r < n; r++) if (r != i) {
            double f = G[r][i] / G[i][i];
            for (int c = i; c <= n; c++) G[r][c] -= f * G[i][c];
        }
    }
    double v[MX]; for (int i = 0; i < n; i++) v[i] = G[i][n] / G[i][i];
    printf("NODE VOLTAGES\n"); for (int i = 0; i < n; i++) printf("  V%d = %8.4f V\n", i, v[i]);
    printf("\nRESISTOR   R(ohm)   V(volt)    I(mA)     P(mW)\n");
    double Ptot = 0;
    for (int i = 0; i < m; i++) {
        double dv = v[a[i]] - v[b[i]], I = dv / R[i], P = dv * I;
        printf("  R%-2d %2d-%-2d %7.1f  %8.4f %9.3f %9.3f\n", i + 1, a[i], b[i], R[i], dv, I * 1000, P * 1000);
        Ptot += P;
    }
    printf("\nTotal power dissipated = %.3f mW  (source delivers the same)\n", Ptot * 1000);
    return 0;
}
`
});

E.c.push({
  name: "CONTROL - PID loop with ASCII chart",
  input: "10 10 3 8 10",
  code: String.raw`/* CONTROL: PID MOTOR / DRONE ALTITUDE LOOP with an ASCII chart.
   Stdin: setpoint  Kp Ki Kd  time_s   (plant: mass-like system with drag + a gust at 60% of the time) */
#include <stdio.h>
#include <math.h>
int main(void) {
    double sp, Kp, Ki, Kd, T;
    if (scanf("%lf %lf %lf %lf %lf", &sp, &Kp, &Ki, &Kd, &T) != 5) return 1;
    double dt = 0.01, y = 0, v = 0, I = 0, prev = sp, ymax = 0, settle = T;
    int steps = (int)(T / dt), cols = 60, shown = 0;
    printf(" t(s)    y      u(N)   0%*s%.1f\n", cols - 2, "", sp * 1.4);
    for (int k = 0; k <= steps; k++) {
        double t = k * dt, e = sp - y;
        I += e * dt;
        double u = Kp * e + Ki * I + Kd * (e - prev) / dt;  prev = e;
        if (u > 40) u = 40; if (u < 0) u = 0;                 /* actuator limits */
        double gust = (t > 0.6 * T && t < 0.6 * T + 1.0) ? -3.0 : 0.0;
        double a = (u - 9.81 * 1.0 * 0 + gust) / 1.0 - 1.2 * v - 4.0;   /* mass 1 kg, drag, constant load */
        v += a * dt; y += v * dt;
        if (y > ymax) ymax = y;
        if (fabs(e) > 0.02 * sp) settle = t;
        if (k % (steps / 25) == 0) {
            int pos = (int)(y / (sp * 1.4) * cols); if (pos < 0) pos = 0; if (pos > cols) pos = cols;
            int tgt = (int)(sp / (sp * 1.4) * cols);
            printf("%5.2f %7.3f %7.2f   ", t, y, u);
            for (int c = 0; c <= cols; c++) putchar(c == pos ? '*' : (c == tgt ? '|' : ' '));
            putchar('\n'); shown++;
        }
    }
    printf("\nSetpoint %.2f | Overshoot %.1f %% | ~2%% settling time %.2f s | final y = %.3f\n", sp, (ymax - sp) / sp * 100, settle, y);
    printf("Tip: raise Kd to damp the overshoot, raise Ki to remove steady error.\n");
    return 0;
}
`
});

/* ---------------- JAVA ---------------- */
E.java.push({
  name: "GAME - Dungeon text adventure",
  input: "go west\ntake iron sword\ngo east\ngo east\ntake rusty key\ngo west\nuse rusty key\ngo north\nattack\nattack\nattack\ntake golden crown",
  code: String.raw`// TEXT ADVENTURE - a complete dungeon game with rooms, items, a locked door and a monster.
// Stdin: one command per line:  look, go north/south/east/west, take <item>, use <item>, inventory, attack
import java.util.*;

public class Main {
    static class Room {
        String name, desc; Map<String, String> exits = new LinkedHashMap<>(); List<String> items = new ArrayList<>();
        Room(String n, String d) { name = n; desc = d; }
    }
    static Map<String, Room> world = new HashMap<>();
    static Room here; static List<String> bag = new ArrayList<>();
    static boolean doorOpen = false, monsterAlive = true; static int hp = 30, golemHp = 25;

    static void room(String id, String n, String d, String... items) { Room r = new Room(n, d); r.items.addAll(Arrays.asList(items)); world.put(id, r); }
    static void link(String a, String dir, String b, String back) { world.get(a).exits.put(dir, b); world.get(b).exits.put(back, a); }

    static void look() {
        System.out.println("\n== " + here.name + " ==\n" + here.desc);
        if (!here.items.isEmpty()) System.out.println("You see: " + here.items);
        System.out.println("Exits: " + here.exits.keySet());
        if (here == world.get("vault") && monsterAlive) System.out.println("A STONE GOLEM blocks the treasure! (type: attack)");
    }
    public static void main(String[] args) {
        room("hall", "Entrance Hall", "Dusty torches light a stone hall.", "torch");
        room("lib", "Old Library", "Shelves of rotten books. Something shiny under a desk.", "rusty key");
        room("forge", "Ancient Forge", "A cold forge. A weapon rack stands against the wall.", "iron sword");
        room("vault", "Treasure Vault", "Gold glitters in the dark.", "golden crown");
        link("hall", "east", "lib", "west"); link("hall", "west", "forge", "east"); link("hall", "north", "vault", "south");
        here = world.get("hall");
        System.out.println("*** DUNGEON ESCAPE ***  Get the golden crown!   (HP " + hp + ")");
        look();
        Scanner sc = new Scanner(System.in); int turns = 0;
        while (sc.hasNextLine()) {
            String cmd = sc.nextLine().trim().toLowerCase(); if (cmd.isEmpty()) continue;
            turns++; System.out.println("\n> " + cmd);
            if (cmd.equals("look")) look();
            else if (cmd.equals("inventory")) System.out.println("You carry: " + bag);
            else if (cmd.startsWith("go ")) {
                String d = cmd.substring(3);
                if (!here.exits.containsKey(d)) { System.out.println("You can't go " + d + "."); continue; }
                if (here == world.get("hall") && d.equals("north") && !doorOpen) { System.out.println("The vault door is LOCKED. (use rusty key)"); continue; }
                if (here == world.get("vault") && monsterAlive && d.equals("south")) { System.out.println("The golem blocks your way!"); continue; }
                here = world.get(here.exits.get(d)); look();
            } else if (cmd.startsWith("take ")) {
                String it = cmd.substring(5);
                if (here == world.get("vault") && monsterAlive) System.out.println("The golem will crush you if you touch anything.");
                else if (here.items.remove(it)) { bag.add(it); System.out.println("Taken: " + it);
                    if (it.equals("golden crown")) { System.out.println("\n*** YOU WIN in " + turns + " turns! HP left " + hp + " ***"); return; }
                } else System.out.println("No " + it + " here.");
            } else if (cmd.startsWith("use ")) {
                String it = cmd.substring(4);
                if (it.equals("rusty key") && bag.contains(it) && here == world.get("hall")) { doorOpen = true; System.out.println("CLICK! The vault door opens."); }
                else System.out.println("Nothing happens.");
            } else if (cmd.equals("attack")) {
                if (here != world.get("vault") || !monsterAlive) System.out.println("Nothing to attack.");
                else {
                    int dmg = bag.contains("iron sword") ? 12 : 2; int hit = 2 + (turns * 7) % 4;
                    golemHp -= dmg; hp -= hit;
                    System.out.println("You hit the golem for " + dmg + " (golem HP " + Math.max(0, golemHp) + "). It hits you for " + hit + " (your HP " + hp + ").");
                    monsterAlive = golemHp > 0;
                    if (!monsterAlive) System.out.println("The golem crumbles to dust!");
                    if (hp <= 0) { System.out.println("YOU DIED."); return; }
                }
            } else System.out.println("Unknown command.");
        }
        System.out.println("\n(Commands ended - game not finished)");
    }
}
`
});

E.java.push({
  name: "GAME - Connect Four vs minimax AI",
  input: "4 4 3 5 2 6 7",
  code: String.raw`// CONNECT FOUR vs minimax AI (alpha-beta, depth 6). You = X, AI = O.
// Stdin: your columns 1-7, e.g.  4 4 3 5 ...
import java.util.*;

public class Main {
    static final int R = 6, C = 7; static char[][] b = new char[R][C];

    static boolean drop(int c, char p) { for (int r = R - 1; r >= 0; r--) if (b[r][c] == '.') { b[r][c] = p; return true; } return false; }
    static void undo(int c) { for (int r = 0; r < R; r++) if (b[r][c] != '.') { b[r][c] = '.'; return; } }
    static boolean win(char p) {
        int[][] d = {{0,1},{1,0},{1,1},{1,-1}};
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) for (int[] v : d) {
            int k = 0; for (; k < 4; k++) { int rr = r + v[0]*k, cc = c + v[1]*k; if (rr < 0 || cc < 0 || rr >= R || cc >= C || b[rr][cc] != p) break; }
            if (k == 4) return true;
        }
        return false;
    }
    static boolean full() { for (int c = 0; c < C; c++) if (b[0][c] == '.') return false; return true; }
    static int score() {
        int s = 0;
        for (int r = 0; r < R; r++) if (b[r][3] == 'O') s += 3; else if (b[r][3] == 'X') s -= 3;
        int[][] d = {{0,1},{1,0},{1,1},{1,-1}};
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) for (int[] v : d) {
            int o = 0, x = 0; boolean ok = true;
            for (int k = 0; k < 4; k++) { int rr = r + v[0]*k, cc = c + v[1]*k; if (rr < 0 || cc < 0 || rr >= R || cc >= C) { ok = false; break; } if (b[rr][cc] == 'O') o++; else if (b[rr][cc] == 'X') x++; }
            if (!ok) continue;
            if (x == 0) s += o == 3 ? 12 : o == 2 ? 3 : 0;
            if (o == 0) s -= x == 3 ? 14 : x == 2 ? 3 : 0;
        }
        return s;
    }
    static int search(int depth, int a, int bt, boolean ai) {
        if (win('O')) return 100000 + depth; if (win('X')) return -100000 - depth;
        if (depth == 0 || full()) return score();
        int[] order = {3, 2, 4, 1, 5, 0, 6};
        int best = ai ? -1000000 : 1000000;
        for (int c : order) {
            if (!drop(c, ai ? 'O' : 'X')) continue;
            int v = search(depth - 1, a, bt, !ai); undo(c);
            if (ai) { best = Math.max(best, v); a = Math.max(a, v); } else { best = Math.min(best, v); bt = Math.min(bt, v); }
            if (a >= bt) break;
        }
        return best;
    }
    static void show() {
        System.out.println(" 1 2 3 4 5 6 7");
        for (char[] row : b) { StringBuilder s = new StringBuilder("|"); for (char ch : row) s.append(ch).append('|'); System.out.println(s); }
        System.out.println("---------------");
    }
    public static void main(String[] x) {
        for (char[] r : b) Arrays.fill(r, '.');
        Scanner sc = new Scanner(System.in);
        System.out.println("CONNECT FOUR - you are X, AI is O"); show();
        while (sc.hasNextInt()) {
            int c = sc.nextInt() - 1;
            if (c < 0 || c >= C || !drop(c, 'X')) { System.out.println("Column not possible, skipped."); continue; }
            System.out.println("You -> column " + (c + 1));
            if (win('X')) { show(); System.out.println("YOU WIN!"); return; }
            if (full()) { show(); System.out.println("Draw."); return; }
            int bestC = -1, bestV = -2000000;
            for (int cc : new int[]{3, 2, 4, 1, 5, 0, 6}) {
                if (!drop(cc, 'O')) continue;
                int v = search(5, -2000000, 2000000, false); undo(cc);
                if (v > bestV) { bestV = v; bestC = cc; }
            }
            drop(bestC, 'O'); System.out.println("AI  -> column " + (bestC + 1) + "   (eval " + bestV + ")");
            show();
            if (win('O')) { System.out.println("AI WINS!"); return; }
            if (full()) { System.out.println("Draw."); return; }
        }
        System.out.println("(moves ended)");
    }
}
`
});

E.java.push({
  name: "SIM - Elevator controller (OOP, SCAN algorithm)",
  input: "10\n0 1 8\n1 5 1\n2 9 3\n6 3 10\n9 7 2\n-1",
  code: String.raw`// ELEVATOR CONTROLLER SIMULATION (OOP, SCAN algorithm). Stdin: floors, then requests "time from to".
// Example:  10   then lines like  0 1 8   (at t=0 passenger on floor 1 wants floor 8)  ... end with  -1
import java.util.*;

public class Main {
    static class Passenger { int id, from, to, t; double waitStart, boardAt = -1, doneAt = -1;
        Passenger(int i, int t, int f, int to) { id = i; this.t = t; from = f; this.to = to; waitStart = t; } }
    static class Elevator {
        int floor = 1, dir = 0, cap = 4; List<Passenger> in = new ArrayList<>();
        void log(int t, String m) { System.out.printf("t=%3d  floor %2d  %-6s [%s] %s%n", t, floor, dir > 0 ? "UP" : dir < 0 ? "DOWN" : "IDLE", ids(), m); }
        String ids() { StringBuilder s = new StringBuilder(); for (Passenger p : in) s.append("P").append(p.id).append(' '); return s.toString().trim(); }
    }
    public static void main(String[] a) {
        Scanner sc = new Scanner(System.in); int F = sc.nextInt();
        List<Passenger> all = new ArrayList<>(); int id = 1;
        while (sc.hasNextInt()) { int t = sc.nextInt(); if (t < 0) break; all.add(new Passenger(id++, t, sc.nextInt(), sc.nextInt())); }
        List<Passenger> waiting = new ArrayList<>(), done = new ArrayList<>(); Elevator e = new Elevator();
        int t = 0, moves = 0;
        while (done.size() < all.size() && t < 500) {
            for (Passenger p : all) if (p.t == t) { waiting.add(p); e.log(t, "P" + p.id + " calls from " + p.from + " to " + p.to); }
            Iterator<Passenger> it = e.in.iterator();
            while (it.hasNext()) { Passenger p = it.next(); if (p.to == e.floor) { it.remove(); p.doneAt = t; done.add(p); e.log(t, "P" + p.id + " gets OFF"); } }
            Iterator<Passenger> w = waiting.iterator();
            while (w.hasNext()) { Passenger p = w.next(); if (p.from == e.floor && e.in.size() < e.cap) { w.remove(); e.in.add(p); p.boardAt = t; e.log(t, "P" + p.id + " boards"); } }
            // SCAN: keep direction while someone needs it, else reverse / go idle
            boolean above = false, below = false;
            for (Passenger p : e.in) { if (p.to > e.floor) above = true; if (p.to < e.floor) below = true; }
            for (Passenger p : waiting) { if (p.from > e.floor) above = true; if (p.from < e.floor) below = true; }
            if (e.dir >= 0 && above) e.dir = 1; else if (e.dir <= 0 && below) e.dir = -1; else if (above) e.dir = 1; else if (below) e.dir = -1; else e.dir = 0;
            if (e.dir != 0) { e.floor = Math.max(1, Math.min(F, e.floor + e.dir)); moves++; }
            t++;
        }
        double avgWait = 0, avgTrip = 0; for (Passenger p : done) { avgWait += p.boardAt - p.waitStart; avgTrip += p.doneAt - p.waitStart; }
        System.out.println("\nAll " + done.size() + " passengers delivered at t=" + t + ".  Floors travelled: " + moves);
        System.out.printf("Average wait: %.1f s   Average total time: %.1f s%n", avgWait / done.size(), avgTrip / done.size());
    }
}
`
});

E.java.push({
  name: "CAD - Parametric pipe -> OBJ 3D file + mass",
  input: "60 50 120 24 7.85",
  code: String.raw`// CAD-STYLE: PARAMETRIC PIPE / FLANGE -> Wavefront .OBJ file + volume, area, mass.
// Stdin: outerD_mm innerD_mm length_mm segments density_g_cm3
// Copy the OBJ text (between the === lines) to a file "pipe.obj" and open it in any 3D viewer / Blender / FreeCAD.
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double od = sc.nextDouble(), id = sc.nextDouble(), len = sc.nextDouble(); int n = sc.nextInt(); double rho = sc.nextDouble();
        double ro = od / 2, ri = id / 2;
        double areaRing = n * 0.5 * Math.sin(2 * Math.PI / n) * (ro * ro - ri * ri);       // polygon approximation
        double vol = areaRing * len / 1000.0, mass = vol * rho;
        double surf = n * 2 * ro * Math.sin(Math.PI / n) * len + n * 2 * ri * Math.sin(Math.PI / n) * len + 2 * areaRing;
        System.out.println("PARAMETRIC PIPE:  OD " + od + "  ID " + id + "  length " + len + " mm   (" + n + " segments)");
        System.out.printf("Wall thickness : %.2f mm%nMaterial volume: %.2f cm3%nMass           : %.1f g  (%.3f kg)%nSurface area    : %.0f mm2%n", (od - id) / 2, vol, mass, mass / 1000, surf);
        System.out.printf("Bore flow area : %.1f mm2   Second moment I = %.0f mm4%n%n", Math.PI * ri * ri, Math.PI / 64 * (Math.pow(od, 4) - Math.pow(id, 4)));
        System.out.println("=== pipe.obj ===");
        System.out.println("o Pipe");
        // vertex order per ring: outer-bottom, outer-top, inner-bottom, inner-top
        for (int i = 0; i < n; i++) {
            double a = 2 * Math.PI * i / n, c = Math.cos(a), s = Math.sin(a);
            System.out.printf(Locale.US, "v %.4f 0 %.4f%nv %.4f %.4f %.4f%nv %.4f 0 %.4f%nv %.4f %.4f %.4f%n", ro * c, ro * s, ro * c, len, ro * s, ri * c, ri * s, ri * c, len, ri * s);
        }
        for (int i = 0; i < n; i++) {
            int j = (i + 1) % n; int ob = 4 * i + 1, ot = ob + 1, ib = ob + 2, it = ob + 3, nob = 4 * j + 1, not = nob + 1, nib = nob + 2, nit = nob + 3;
            System.out.println("f " + ob + " " + nob + " " + not + " " + ot);       // outer wall
            System.out.println("f " + ib + " " + it + " " + nit + " " + nib);       // inner wall
            System.out.println("f " + ot + " " + not + " " + nit + " " + it);       // top ring
            System.out.println("f " + ob + " " + ib + " " + nib + " " + nob);       // bottom ring
        }
        System.out.println("=== end ===");
    }
}
`
});

E.java.push({
  name: "DRONE - Altitude PID with gust + battery sag",
  input: "10 1.5 30 5 0.5 7 14",
  code: String.raw`// DRONE ALTITUDE SIMULATION - mass, thrust limit, wind gust, battery sag, PID controller.
// Stdin: targetAlt_m  mass_kg  maxThrustTotal_N  Kp Ki Kd  duration_s
import java.util.*;

public class Main {
    static class Battery { double v = 16.8, cap = 5200; // 4S, mAh
        void use(double amps, double dt) { cap -= amps * 1000 * dt / 3600; v = 13.2 + (16.8 - 13.2) * Math.max(0, cap / 5200) - amps * 0.015; } }
    static class Pid { double kp, ki, kd, i, prev; Pid(double p, double ii, double d) { kp = p; ki = ii; kd = d; }
        double step(double e, double dt) { i += e * dt; i = Math.max(-20, Math.min(20, i)); double d = (e - prev) / dt; prev = e; return kp * e + ki * i + kd * d; } }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double target = sc.nextDouble(), m = sc.nextDouble(), tmax = sc.nextDouble(), kp = sc.nextDouble(), ki = sc.nextDouble(), kd = sc.nextDouble(), dur = sc.nextDouble();
        Pid pid = new Pid(kp, ki, kd); Battery bat = new Battery();
        double z = 0, v = 0, dt = 0.01, g = 9.81, maxZ = 0, rise = -1, settle = dur; int sat = 0;
        System.out.println("  t(s)   alt(m)  vel(m/s)  thrust(N)  volts   wind   altitude chart");
        for (int k = 0; k <= (int)(dur / dt); k++) {
            double t = k * dt, wind = (t > dur * 0.55 && t < dur * 0.55 + 1.5) ? -0.35 * m * g : 0;   // downdraft gust
            double u = m * g + pid.step(target - z, dt);
            if (u > tmax) { u = tmax; sat++; } if (u < 0) u = 0;
            u *= bat.v / 16.8;                                  // battery sag lowers thrust
            double acc = (u + wind) / m - g - 0.4 * v * Math.abs(v) / m;
            if (z <= 0 && acc < 0) { acc = 0; v = Math.max(v, 0); }
            v += acc * dt; z += v * dt; if (z < 0) z = 0;
            bat.use(u / 9.0, dt);
            maxZ = Math.max(maxZ, z);
            if (rise < 0 && z >= 0.9 * target) rise = t;
            if (Math.abs(z - target) > 0.05 * target) settle = t;
            if (k % (int)(dur / dt / 24) == 0) {
                int pos = (int)Math.round(z / (target * 1.3) * 50), tg = (int)Math.round(target / (target * 1.3) * 50);
                StringBuilder s = new StringBuilder(); for (int c = 0; c <= 50; c++) s.append(c == pos ? '*' : c == tg ? '|' : ' ');
                System.out.printf("%6.2f %8.2f %9.2f %10.1f %6.2f %6.1f   %s%n", t, z, v, u, bat.v, wind, s);
            }
        }
        System.out.printf("%nRise time (90%%): %.2f s | Overshoot: %.1f %% | Settling (5%%): %.2f s | Thrust saturated %.1f %% of the time%n", rise, (maxZ - target) / target * 100, settle, 100.0 * sat / (dur / dt));
        System.out.printf("Hover thrust needed: %.1f N  (%.0f %% of max)  |  Battery left: %.0f mAh%n", m * g, 100 * m * g / tmax, bat.cap);
    }
}
`
});

/* ---------------- RUST ---------------- */
E.rust.push({
  name: "ART - Mandelbrot set in ASCII",
  input: "72 28 60",
  code: String.raw`// MANDELBROT SET in ASCII (complex numbers by hand).  Stdin: width height max_iter [center_x center_y zoom]
use std::io::{self, Read};

fn main() {
    let mut s = String::new();
    io::stdin().read_to_string(&mut s).unwrap();
    let v: Vec<f64> = s.split_whitespace().filter_map(|x| x.parse().ok()).collect();
    let (w, h, maxit) = (v[0] as usize, v[1] as usize, v[2] as u32);
    let (cx, cy, zoom) = if v.len() >= 6 { (v[3], v[4], v[5]) } else { (-0.5, 0.0, 1.0) };
    let palette: Vec<char> = " .,:;ox%#@".chars().collect();
    let scale = 3.0 / zoom / w as f64;
    let mut inside = 0;
    for py in 0..h {
        let mut line = String::new();
        for px in 0..w {
            let x0 = cx + (px as f64 - w as f64 / 2.0) * scale;
            let y0 = cy + (py as f64 - h as f64 / 2.0) * scale * 2.0;   // characters are ~2x taller than wide
            let (mut x, mut y, mut i) = (0.0f64, 0.0f64, 0u32);
            while x * x + y * y <= 4.0 && i < maxit {
                let t = x * x - y * y + x0;
                y = 2.0 * x * y + y0;
                x = t;
                i += 1;
            }
            if i == maxit { inside += 1; line.push('#'); }
            else { line.push(palette[(i as usize) % (palette.len() - 1)]); }
        }
        println!("{}", line);
    }
    println!("\nPoints inside the set: {} of {} ({:.1} %)", inside, w * h, 100.0 * inside as f64 / (w * h) as f64);
    println!("Tip: try zoom -> \"70 30 200 -0.745 0.113 40\"  (Seahorse valley)");
}
`
});

E.rust.push({
  name: "GAME - A* pathfinding on a map (walls + mud)",
  input: "####################\n#S   #     ~~~     #\n# ## # ###  ~~~ ## #\n# #  #   #       # #\n# # #### ######### #\n# #      #  ~~~  # #\n# ######## # ~~~ # #\n#          #     #G#\n####################",
  code: String.raw`// A* PATHFINDING GAME MAP - find the shortest path from S to G around walls (#) and mud (~, costs 5).
// Stdin: the map as text lines (S = start, G = goal)
use std::collections::BinaryHeap;
use std::cmp::Reverse;
use std::io::{self, Read};

fn main() {
    let mut s = String::new();
    io::stdin().read_to_string(&mut s).unwrap();
    let mut g: Vec<Vec<char>> = s.lines().filter(|l| !l.trim().is_empty()).map(|l| l.chars().collect()).collect();
    let (h, w) = (g.len(), g.iter().map(|r| r.len()).max().unwrap());
    for r in g.iter_mut() { while r.len() < w { r.push('#'); } }
    let (mut st, mut gl) = ((0, 0), (0, 0));
    for y in 0..h { for x in 0..w { if g[y][x] == 'S' { st = (y, x); } if g[y][x] == 'G' { gl = (y, x); } } }
    let heur = |p: (usize, usize)| ((p.0 as i32 - gl.0 as i32).abs() + (p.1 as i32 - gl.1 as i32).abs()) as u32;
    let mut dist = vec![vec![std::u32::MAX; w]; h];
    let mut prev = vec![vec![(std::usize::MAX, std::usize::MAX); w]; h];
    let mut heap = BinaryHeap::new();
    dist[st.0][st.1] = 0;
    heap.push(Reverse((heur(st), 0u32, st)));
    let mut expanded = 0;
    while let Some(Reverse((_, d, (y, x)))) = heap.pop() {
        if d > dist[y][x] { continue; }
        expanded += 1;
        if (y, x) == gl { break; }
        let dirs: [(i32, i32); 4] = [(0, 1), (1, 0), (0, -1), (-1, 0)];
        for (dy, dx) in dirs.iter() {
            let (ny, nx) = (y as i32 + dy, x as i32 + dx);
            if ny < 0 || nx < 0 || ny >= h as i32 || nx >= w as i32 { continue; }
            let (ny, nx) = (ny as usize, nx as usize);
            if g[ny][nx] == '#' { continue; }
            let cost = if g[ny][nx] == '~' { 5 } else { 1 };
            let nd = d + cost;
            if nd < dist[ny][nx] {
                dist[ny][nx] = nd; prev[ny][nx] = (y, x);
                heap.push(Reverse((nd + heur((ny, nx)), nd, (ny, nx))));
            }
        }
    }
    if dist[gl.0][gl.1] == std::u32::MAX { println!("No path!"); return; }
    let mut cur = gl; let mut steps = 0;
    while cur != st { cur = prev[cur.0][cur.1]; if cur != st { g[cur.0][cur.1] = '*'; } steps += 1; }
    for r in &g { println!("{}", r.iter().collect::<String>()); }
    println!("\nPath: {} steps, total cost {}, nodes expanded {}", steps, dist[gl.0][gl.1], expanded);
    println!("(* = route, ~ = mud (cost 5), # = wall)");
}
`
});

E.rust.push({
  name: "SPACE - Satellite orbit (RK4) + orbit plot",
  input: "600 8.2 2",
  code: String.raw`// SPACE: SATELLITE ORBIT with RK4 integration + energy check + ASCII orbit plot.
// Stdin: altitude_km  speed_km_s  periods_to_simulate     (Earth: mu = 398600.4418 km3/s2, R = 6371 km)
use std::io::{self, Read};
const MU: f64 = 398600.4418;
const RE: f64 = 6371.0;

fn acc(x: f64, y: f64) -> (f64, f64) { let r = (x * x + y * y).sqrt(); let k = -MU / (r * r * r); (k * x, k * y) }

fn main() {
    let mut s = String::new(); io::stdin().read_to_string(&mut s).unwrap();
    let v: Vec<f64> = s.split_whitespace().map(|x| x.parse().unwrap()).collect();
    let (alt, speed, periods) = (v[0], v[1], v[2]);
    let r0 = RE + alt;
    let vc = (MU / r0).sqrt();
    let energy = |x: f64, y: f64, vx: f64, vy: f64| 0.5 * (vx * vx + vy * vy) - MU / (x * x + y * y).sqrt();
    let a = 1.0 / (2.0 / r0 - speed * speed / MU);
    let period = if a > 0.0 { 2.0 * std::f64::consts::PI * (a * a * a / MU).sqrt() } else { 0.0 };
    println!("Start radius {:.0} km | circular speed here = {:.3} km/s | you chose {:.3} km/s", r0, vc, speed);
    if a <= 0.0 { println!("Speed >= escape speed ({:.3} km/s): the satellite leaves Earth!", (2.0 * MU / r0).sqrt()); return; }
    let ecc = ((r0 * speed * speed / MU - 1.0).powi(2)).sqrt();
    println!("Semi-major axis {:.0} km | eccentricity {:.3} | period {:.1} min", a, ecc, period / 60.0);
    println!("Perigee/Apogee radius: {:.0} / {:.0} km", a * (1.0 - ecc), a * (1.0 + ecc));
    let (mut x, mut y, mut vx, mut vy) = (r0, 0.0, 0.0, speed);
    let e0 = energy(x, y, vx, vy);
    let dt = 5.0; let n = (periods * period / dt) as usize;
    let (cols, rows) = (61usize, 25usize);
    let mut grid = vec![vec![' '; cols]; rows];
    let ext = a * (1.0 + ecc) * 1.1;
    let (mut rmin, mut rmax) = (std::f64::MAX, 0.0f64);
    for _ in 0..n {
        let (k1x, k1y) = (vx, vy); let (a1x, a1y) = acc(x, y);
        let (k2x, k2y) = (vx + 0.5 * dt * a1x, vy + 0.5 * dt * a1y); let (a2x, a2y) = acc(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
        let (k3x, k3y) = (vx + 0.5 * dt * a2x, vy + 0.5 * dt * a2y); let (a3x, a3y) = acc(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
        let (k4x, k4y) = (vx + dt * a3x, vy + dt * a3y); let (a4x, a4y) = acc(x + dt * k3x, y + dt * k3y);
        x += dt / 6.0 * (k1x + 2.0 * k2x + 2.0 * k3x + k4x); y += dt / 6.0 * (k1y + 2.0 * k2y + 2.0 * k3y + k4y);
        vx += dt / 6.0 * (a1x + 2.0 * a2x + 2.0 * a3x + a4x); vy += dt / 6.0 * (a1y + 2.0 * a2y + 2.0 * a3y + a4y);
        let r = (x * x + y * y).sqrt(); rmin = rmin.min(r); rmax = rmax.max(r);
        let c = ((x / ext + 1.0) / 2.0 * (cols as f64 - 1.0)).round() as i32;
        let rw = ((1.0 - (y / ext + 1.0) / 2.0) * (rows as f64 - 1.0)).round() as i32;
        if c >= 0 && rw >= 0 && (c as usize) < cols && (rw as usize) < rows { grid[rw as usize][c as usize] = '.'; }
    }
    // Earth in the middle
    for rw in 0..rows { for c in 0..cols {
        let px = (c as f64 / (cols as f64 - 1.0) * 2.0 - 1.0) * ext; let py = (1.0 - rw as f64 / (rows as f64 - 1.0) * 2.0) * ext;
        if (px * px + py * py).sqrt() < RE { grid[rw][c] = 'E'; }
    } }
    for r in &grid { println!("{}", r.iter().collect::<String>()); }
    let e1 = energy(x, y, vx, vy);
    println!("\nSimulated {} steps of {} s ({:.2} orbits)", n, dt, periods);
    println!("Min/Max radius reached: {:.0} / {:.0} km", rmin, rmax);
    println!("Energy drift (RK4 accuracy): {:.2e} relative", ((e1 - e0) / e0).abs());
    if rmin < RE { println!("WARNING: orbit dips below Earth's surface -> re-entry!"); }
}
`
});

E.rust.push({
  name: "PUZZLE - N-Queens (counts all solutions)",
  input: "8",
  code: String.raw`// N-QUEENS puzzle - counts ALL solutions with bitmasks and draws the first one.  Stdin: N
use std::io::{self, Read};

fn solve(n: usize, row: usize, cols: u32, d1: u32, d2: u32, cur: &mut Vec<usize>, first: &mut Option<Vec<usize>>) -> u64 {
    if row == n { if first.is_none() { *first = Some(cur.clone()); } return 1; }
    let mut count = 0;
    let mut free = !(cols | d1 | d2) & ((1u32 << n) - 1);
    while free != 0 {
        let bit = free & free.wrapping_neg();
        free ^= bit;
        cur.push(bit.trailing_zeros() as usize);
        count += solve(n, row + 1, cols | bit, ((d1 | bit) << 1) & ((1u32 << n) - 1), (d2 | bit) >> 1, cur, first);
        cur.pop();
    }
    count
}
fn main() {
    let mut s = String::new(); io::stdin().read_to_string(&mut s).unwrap();
    let n: usize = s.trim().parse().unwrap_or(8);
    let mut first = None; let mut cur = Vec::new();
    let t = std::time::Instant::now();
    let total = solve(n, 0, 0, 0, 0, &mut cur, &mut first);
    println!("{}-Queens: {} solutions  ({:.1} ms)\n", n, total, t.elapsed().as_secs_f64() * 1000.0);
    if let Some(sol) = first {
        for r in 0..n {
            let mut line = String::new();
            for c in 0..n { line.push_str(if sol[r] == c { " Q" } else if (r + c) % 2 == 0 { " ." } else { " ," }); }
            println!("{}", line);
        }
        println!("\nColumns of queens per row: {:?}", sol);
    } else { println!("No solution exists for N = {}", n); }
}
`
});

E.rust.push({
  name: "CAD/CAM - G-code generator (bolt circle + pocket)",
  input: "100 80  60 6 8  50 30 6  300 10",
  code: String.raw`// CAD/CAM: G-CODE GENERATOR for a CNC mill - bolt-circle drilling + rectangular pocket.
// Stdin: plateW plateH  boltCircleDia nHoles holeDia  pocketW pocketH  depth  feed_mm_min  tool_dia   (all mm)
use std::io::{self, Read};
use std::f64::consts::PI;

fn main() {
    let mut s = String::new(); io::stdin().read_to_string(&mut s).unwrap();
    let v: Vec<f64> = s.split_whitespace().map(|x| x.parse().unwrap()).collect();
    let (pw, ph, bcd, n, hd, kw, kh, depth, feed, tool) = (v[0], v[1], v[2], v[3] as usize, v[4], v[5], v[6], v[7], v[8], v[9]);
    let (cx, cy) = (pw / 2.0, ph / 2.0);
    let mut len = 0.0f64; let mut lines = 0;
    println!("(PLATE {} x {} mm, bolt circle D{} x {} holes D{}, pocket {} x {} x {} deep)", pw, ph, bcd, n, hd, kw, kh, depth);
    println!("G21 G90 G17 (mm, absolute, XY plane)\nG54\nM6 T1 (drill D{})\nS3000 M3", hd);
    println!("(--- BOLT CIRCLE DRILLING ---)");
    let mut last = (0.0, 0.0);
    println!("G00 Z5");
    for i in 0..n {
        let a = 2.0 * PI * i as f64 / n as f64;
        let (x, y) = (cx + bcd / 2.0 * a.cos(), cy + bcd / 2.0 * a.sin());
        println!("G00 X{:.3} Y{:.3}", x, y);
        println!("G83 X{:.3} Y{:.3} Z-{:.2} R2 Q2 F{:.0}   (hole {})", x, y, depth, feed / 2.0, i + 1);
        len += ((x - last.0).powi(2) + (y - last.1).powi(2)).sqrt(); last = (x, y); lines += 2;
    }
    println!("G80\nG00 Z25\nM5\nM6 T2 (end mill D{})\nS8000 M3", tool);
    println!("(--- RECTANGULAR POCKET, spiral out, stepover = half the tool ---)");
    let (hw, hh) = (kw / 2.0 - tool / 2.0, kh / 2.0 - tool / 2.0);
    println!("G00 X{:.3} Y{:.3}\nG00 Z2\nG01 Z-{:.2} F{:.0}   (plunge to full depth)", cx, cy, depth, feed / 3.0);
    let mut k = 0.0; let mut done = 0.0f64; let mut pass = 0;
    while done < 1.0 {
        k += (tool * 0.5).max(0.5);
        let (a, b) = ((k).min(hw), (k).min(hh));
        done = if a >= hw && b >= hh { 1.0 } else { 0.0 };
        println!("G01 X{:.3} Y{:.3} F{:.0}", cx - a, cy - b, feed);
        println!("G01 X{:.3} Y{:.3}", cx + a, cy - b);
        println!("G01 X{:.3} Y{:.3}", cx + a, cy + b);
        println!("G01 X{:.3} Y{:.3}", cx - a, cy + b);
        println!("G01 X{:.3} Y{:.3}", cx - a, cy - b);
        len += 2.0 * (2.0 * a + 2.0 * b); lines += 5; pass += 1;
    }
    println!("G00 Z25\nM5\nG28 G91 Z0\nM30");
    println!("(--- SUMMARY ---)");
    println!("(Holes: {}  Pocket passes: {}  Cutting path ~{:.0} mm  Est. time ~{:.1} min)", n, pass, len, len / feed + n as f64 * 0.1);
    let _ = lines;
}
`
});

/* ---------------- GO ---------------- */
E.go.push({
  name: "CONCURRENCY - Prime sieve with goroutines",
  input: "60",
  code: String.raw`// CONCURRENT PRIME SIEVE - goroutines connected by channels (the classic Go pipeline).
// Stdin: how many primes to print
package main

import "fmt"

func generate(ch chan<- int) {
	for i := 2; ; i++ {
		ch <- i
	}
}

func filter(in <-chan int, out chan<- int, prime int) {
	for {
		i := <-in
		if i%prime != 0 {
			out <- i
		}
	}
}

func main() {
	var n int
	fmt.Scan(&n)
	ch := make(chan int)
	go generate(ch)
	fmt.Println("Each prime creates a NEW goroutine that filters its multiples:")
	line := ""
	for i := 0; i < n; i++ {
		prime := <-ch
		line += fmt.Sprintf("%d ", prime)
		if (i+1)%12 == 0 {
			fmt.Println(line)
			line = ""
		}
		ch1 := make(chan int)
		go filter(ch, ch1, prime)
		ch = ch1
	}
	if line != "" {
		fmt.Println(line)
	}
	fmt.Printf("\nDone: %d primes using %d goroutines running at the same time\n", n, n+1)
}
`
});

E.go.push({
  name: "GAME - 2048 with auto-player",
  input: "400 3",
  code: String.raw`// 2048 - complete game with an auto-player. Stdin: number_of_moves seed
// The auto-player tries LEFT/UP/RIGHT/DOWN in a corner-priority order and plays until the board is stuck.
package main

import (
	"fmt"
	"math/rand"
)

type Board [4][4]int

func slideLeft(row [4]int) ([4]int, int, bool) {
	var out [4]int
	score, idx := 0, 0
	last := 0
	for _, v := range row {
		if v == 0 {
			continue
		}
		if last == v {
			out[idx-1] = v * 2
			score += v * 2
			last = 0
		} else {
			out[idx] = v
			last = v
			idx++
		}
	}
	return out, score, out != row
}

func (b *Board) move(dir int) (int, bool) { // 0 left, 1 up, 2 right, 3 down
	total, moved := 0, false
	for i := 0; i < 4; i++ {
		var row [4]int
		for j := 0; j < 4; j++ {
			switch dir {
			case 0:
				row[j] = b[i][j]
			case 2:
				row[j] = b[i][3-j]
			case 1:
				row[j] = b[j][i]
			case 3:
				row[j] = b[3-j][i]
			}
		}
		nr, sc, ch := slideLeft(row)
		total += sc
		moved = moved || ch
		for j := 0; j < 4; j++ {
			switch dir {
			case 0:
				b[i][j] = nr[j]
			case 2:
				b[i][3-j] = nr[j]
			case 1:
				b[j][i] = nr[j]
			case 3:
				b[3-j][i] = nr[j]
			}
		}
	}
	return total, moved
}

func (b *Board) spawn(r *rand.Rand) {
	var free [][2]int
	for i := 0; i < 4; i++ {
		for j := 0; j < 4; j++ {
			if b[i][j] == 0 {
				free = append(free, [2]int{i, j})
			}
		}
	}
	if len(free) == 0 {
		return
	}
	c := free[r.Intn(len(free))]
	v := 2
	if r.Intn(10) == 0 {
		v = 4
	}
	b[c[0]][c[1]] = v
}

func (b Board) show(title string) {
	fmt.Println(title)
	fmt.Println("+------+------+------+------+")
	for i := 0; i < 4; i++ {
		for j := 0; j < 4; j++ {
			if b[i][j] == 0 {
				fmt.Print("|      ")
			} else {
				fmt.Printf("| %4d ", b[i][j])
			}
		}
		fmt.Println("|\n+------+------+------+------+")
	}
}

func main() {
	var moves int
	var seed int64
	fmt.Scan(&moves, &seed)
	r := rand.New(rand.NewSource(seed))
	var b Board
	b.spawn(r)
	b.spawn(r)
	score, made := 0, 0
	names := []string{"LEFT", "UP", "RIGHT", "DOWN"}
	order := []int{0, 3, 2, 1}
	b.show("START")
	for made < moves {
		moved := false
		for _, d := range order {
			t := b
			if sc, ok := t.move(d); ok {
				b = t
				score += sc
				moved = true
				made++
				b.spawn(r)
				if made%40 == 0 {
					b.show(fmt.Sprintf("After move %d (%s)  score %d", made, names[d], score))
				}
				break
			}
		}
		if !moved {
			break
		}
	}
	best := 0
	for i := range b {
		for j := range b[i] {
			if b[i][j] > best {
				best = b[i][j]
			}
		}
	}
	b.show(fmt.Sprintf("FINAL after %d moves", made))
	fmt.Printf("Score: %d | Best tile: %d | %s\n", score, best, map[bool]string{true: "YOU REACHED 2048!", false: "no 2048 this time - try another seed or more moves"}[best >= 2048])
}
`
});

E.go.push({
  name: "ECOLOGY - Predator-prey (Lotka-Volterra, RK4)",
  input: "10 5 1.0 0.1 0.075 1.5 30",
  code: String.raw`// ECOLOGY: LOTKA-VOLTERRA predator-prey model (RK4) with an ASCII time-series.
// Stdin: prey0 predator0 alpha beta delta gamma  years
//   prey' = alpha*x - beta*x*y      predator' = delta*x*y - gamma*y
package main

import (
	"fmt"
	"math"
	"strings"
)

func main() {
	var x, y, a, b, d, g, T float64
	fmt.Scan(&x, &y, &a, &b, &d, &g, &T)
	f := func(x, y float64) (float64, float64) { return a*x - b*x*y, d*x*y - g*y }
	h := 0.01
	n := int(T / h)
	H0 := d*x - g*math.Log(x) + b*y - a*math.Log(y) // conserved quantity (check of RK4 accuracy)
	maxv := 0.0
	type row struct{ t, x, y float64 }
	var rows []row
	for i := 0; i <= n; i++ {
		if i%(n/40) == 0 {
			rows = append(rows, row{float64(i) * h, x, y})
		}
		maxv = math.Max(maxv, math.Max(x, y))
		k1x, k1y := f(x, y)
		k2x, k2y := f(x+h/2*k1x, y+h/2*k1y)
		k3x, k3y := f(x+h/2*k2x, y+h/2*k2y)
		k4x, k4y := f(x+h*k3x, y+h*k3y)
		x += h / 6 * (k1x + 2*k2x + 2*k3x + k4x)
		y += h / 6 * (k1y + 2*k2y + 2*k3y + k4y)
	}
	fmt.Println("year    prey   predators   (R = prey rabbits, F = predator foxes)")
	for _, r := range rows {
		w := 60
		px, py := int(r.x/maxv*float64(w)), int(r.y/maxv*float64(w))
		line := []byte(strings.Repeat(" ", w+1))
		line[px] = 'R'
		line[py] = 'F'
		if px == py {
			line[px] = 'X'
		}
		fmt.Printf("%5.1f %7.1f %8.1f   %s\n", r.t, r.x, r.y, string(line))
	}
	H1 := d*x - g*math.Log(x) + b*y - a*math.Log(y)
	fmt.Printf("\nEquilibrium point: prey = %.1f, predators = %.1f\n", g/d, a/b)
	fmt.Printf("Conserved-quantity drift after %.0f years: %.2e (smaller = more accurate)\n", T, math.Abs(H1-H0))
}
`
});

E.go.push({
  name: "CAD - Spur gear -> DXF file (AutoCAD / LibreCAD)",
  input: "2 24 20 8",
  code: String.raw`// CAD: PARAMETRIC SPUR GEAR -> DXF FILE (opens in AutoCAD, LibreCAD, FreeCAD, QCAD).
// Stdin: module  teeth  pressureAngleDeg  boreDiameter_mm
// Copy ALL the output text into a file named gear.dxf. Units = mm.
package main

import (
	"fmt"
	"math"
)

func inv(a float64) float64 { return math.Tan(a) - a }

func main() {
	var m, z, pa, bore float64
	fmt.Scan(&m, &z, &pa, &bore)
	al := pa * math.Pi / 180
	r := m * z / 2
	rb := r * math.Cos(al)
	ra := r + m
	rf := r - 1.25*m
	if rf < 0.1 {
		rf = 0.1
	}
	// angular half-thickness of a tooth at the pitch circle
	half := math.Pi/(2*z) + inv(al)
	var pts [][2]float64
	steps := 8
	for t := 0; t < int(z); t++ {
		base := 2 * math.Pi * float64(t) / z
		// right flank (root -> tip), then tip arc, then left flank (tip -> root)
		flank := func(sign float64) [][2]float64 {
			var out [][2]float64
			for i := 0; i <= steps; i++ {
				rr := math.Max(rb, rf) + (ra-math.Max(rb, rf))*float64(i)/float64(steps)
				ap := math.Acos(math.Min(1, rb/rr))
				ang := base + sign*(half-inv(ap))
				out = append(out, [2]float64{rr * math.Cos(ang), rr * math.Sin(ang)})
			}
			return out
		}
		right := flank(-1)
		left := flank(1)
		pts = append(pts, [2]float64{rf * math.Cos(base - half), rf * math.Sin(base - half)})
		pts = append(pts, right...)
		for i := len(left) - 1; i >= 0; i-- {
			pts = append(pts, left[i])
		}
		pts = append(pts, [2]float64{rf * math.Cos(base + half), rf * math.Sin(base + half)})
		nb := 2 * math.Pi * float64(t+1) / z
		pts = append(pts, [2]float64{rf * math.Cos(nb - half), rf * math.Sin(nb - half)})
	}
	fmt.Printf("999\nSpur gear m=%.2f z=%.0f alpha=%.1f deg  pitch dia=%.2f  outside dia=%.2f  root dia=%.2f  bore=%.1f\n", m, z, pa, 2*r, 2*ra, 2*rf, bore)
	fmt.Println("0\nSECTION\n2\nENTITIES")
	fmt.Printf("0\nLWPOLYLINE\n8\nGEAR\n90\n%d\n70\n1\n", len(pts))
	for _, p := range pts {
		fmt.Printf("10\n%.4f\n20\n%.4f\n", p[0], p[1])
	}
	fmt.Printf("0\nCIRCLE\n8\nBORE\n10\n0\n20\n0\n30\n0\n40\n%.3f\n", bore/2)
	fmt.Printf("0\nCIRCLE\n8\nPITCH_CIRCLE\n6\nDASHED\n10\n0\n20\n0\n30\n0\n40\n%.3f\n", r)
	fmt.Println("0\nENDSEC\n0\nEOF")
}
`
});

E.go.push({
  name: "THERMAL - 2D heat conduction heat-map",
  input: "60 20 8 200 20",
  code: String.raw`// THERMAL: 2D HEAT CONDUCTION in a metal plate (finite differences) - ASCII heat-map.
// Stdin: nx ny seconds  hotTemp coldTemp    (hot spot in the centre, one cold edge on the right)
package main

import (
	"fmt"
	"math"
)

func main() {
	var nx, ny int
	var secs, hot, cold float64
	fmt.Scan(&nx, &ny, &secs, &hot, &cold)
	alpha := 97e-6 // aluminium thermal diffusivity, m2/s
	dx := 0.1 / float64(nx)
	dt := 0.2 * dx * dx / alpha
	steps := int(secs / dt)
	T := make([][]float64, ny)
	N := make([][]float64, ny)
	for j := range T {
		T[j] = make([]float64, nx)
		N[j] = make([]float64, nx)
		for i := range T[j] {
			T[j][i] = 20
		}
	}
	shades := []rune(" .:-=+*#%@")
	show := func(t float64) {
		fmt.Printf("\n--- t = %.1f s ---\n", t)
		for j := 0; j < ny; j++ {
			line := make([]rune, nx)
			for i := 0; i < nx; i++ {
				k := int((T[j][i] - cold) / (hot - cold) * 9.99)
				if k < 0 {
					k = 0
				}
				if k > 9 {
					k = 9
				}
				line[i] = shades[k]
			}
			fmt.Println(string(line))
		}
	}
	snaps := map[int]bool{steps / 4: true, steps / 2: true, steps - 1: true}
	for s := 0; s < steps; s++ {
		for j := 0; j < ny; j++ {
			for i := 0; i < nx; i++ {
				if i == nx-1 {
					N[j][i] = cold
					continue
				}
				up, dn, lf, rt := T[maxI(j-1, 0)][i], T[minI(j+1, ny-1)][i], T[j][maxI(i-1, 0)], T[j][minI(i+1, nx-1)]
				N[j][i] = T[j][i] + alpha*dt/(dx*dx)*(up+dn+lf+rt-4*T[j][i])
			}
		}
		for j := ny/2 - 1; j <= ny/2+1; j++ { // heater keeps the centre hot
			for i := nx/3 - 1; i <= nx/3+1; i++ {
				N[j][i] = hot
			}
		}
		T, N = N, T
		if snaps[s] {
			show(float64(s) * dt)
		}
	}
	maxT, sum := -1e9, 0.0
	for j := range T {
		for i := range T[j] {
			maxT = math.Max(maxT, T[j][i])
			sum += T[j][i]
		}
	}
	fmt.Printf("\nPlate 100 mm wide (aluminium), %d steps of %.4f s.  Max %.1f C, average %.1f C\n", steps, dt, maxT, sum/float64(nx*ny))
	fmt.Println("Legend: ' ' cold ... '@' hot")
}

func maxI(a, b int) int {
	if a > b {
		return a
	}
	return b
}
func minI(a, b int) int {
	if a < b {
		return a
	}
	return b
}
`
});

/* ---------------- PYTHON (3D CAD) ---------------- */
E.python.push({
  name: "CAD 3D - Spur gear (extruded involute, rotate with mouse)",
  params: {"module": 2, "teeth": 24, "width": 12, "bore": 10, "pressure": 20},
  code: String.raw`# CAD 3D: parametric SPUR GEAR (extruded involute profile) as a Plotly mesh - rotate it with the mouse!
# Change numbers in Parameters (module, teeth, width, bore, pressure) and press Run.
import numpy as np

m     = float(PARAMS.get("module", 2.0))      # mm
z     = int(float(PARAMS.get("teeth", 24)))
width = float(PARAMS.get("width", 12.0))      # mm (thickness)
bore  = float(PARAMS.get("bore", 10.0))       # mm
pa    = np.radians(float(PARAMS.get("pressure", 20)))

r  = m * z / 2; rb = r * np.cos(pa); ra = r + m; rf = max(r - 1.25 * m, bore / 2 + 1.0)
inv = lambda a: np.tan(a) - a
half = np.pi / (2 * z) + inv(pa)              # half tooth angle at pitch circle

def flank(base, sign, n=8):
    rr = np.linspace(max(rb, rf), ra, n)
    ap = np.arccos(np.minimum(1, rb / rr))
    ang = base + sign * (half - inv(ap))
    return np.c_[rr * np.cos(ang), rr * np.sin(ang)]

prof = []
for t in range(z):
    base = 2 * np.pi * t / z
    prof.append([rf * np.cos(base - half), rf * np.sin(base - half)])
    prof.extend(flank(base, -1))
    prof.extend(flank(base, +1)[::-1])
    prof.append([rf * np.cos(base + half), rf * np.sin(base + half)])
prof = np.array(prof)
n = len(prof)
ang = np.arctan2(prof[:, 1], prof[:, 0])
bore_pts = np.c_[bore / 2 * np.cos(ang), bore / 2 * np.sin(ang)]     # same angles -> easy ring triangles

# vertices: [outer bottom | outer top | bore bottom | bore top]
V = np.vstack([np.c_[prof, np.zeros(n)], np.c_[prof, np.full(n, width)],
               np.c_[bore_pts, np.zeros(n)], np.c_[bore_pts, np.full(n, width)]])
ob, ot, ib, it = 0, n, 2 * n, 3 * n
F = []
for i in range(n):
    j = (i + 1) % n
    F += [(ob + i, ob + j, ot + j), (ob + i, ot + j, ot + i)]          # outer wall
    F += [(ib + j, ib + i, it + i), (ib + j, it + i, it + j)]          # bore wall
    F += [(ot + i, ot + j, it + j), (ot + i, it + j, it + i)]          # top face ring
    F += [(ob + j, ob + i, ib + i), (ob + j, ib + i, ib + j)]          # bottom face ring
F = np.array(F)
rad = np.hypot(V[:, 0], V[:, 1])

print(f"Spur gear  m={m}  z={z}  width={width} mm  bore={bore} mm")
print(f"Pitch diameter {2*r:.2f} mm | outside {2*ra:.2f} mm | root {2*rf:.2f} mm")
print(f"Triangles: {len(F)}   Vertices: {len(V)}")
area = 0.5 * abs(np.sum(prof[:, 0] * np.roll(prof[:, 1], -1) - np.roll(prof[:, 0], -1) * prof[:, 1])) - np.pi * (bore / 2) ** 2
print(f"Volume {area * width / 1000:.2f} cm3  |  steel mass {area * width / 1000 * 7.85:.1f} g")

show_plot({
  "data": [{"type": "mesh3d", "x": V[:, 0].tolist(), "y": V[:, 1].tolist(), "z": V[:, 2].tolist(),
            "i": F[:, 0].tolist(), "j": F[:, 1].tolist(), "k": F[:, 2].tolist(),
            "intensity": rad.tolist(), "colorscale": "Portland", "flatshading": False, "showscale": False,
            "lighting": {"ambient": 0.55, "diffuse": 0.9, "specular": 0.6, "roughness": 0.35}}],
  "layout": {"title": f"Spur gear m={m}, z={z}", "scene": {"aspectmode": "data", "camera": {"eye": {"x": 1.4, "y": 1.2, "z": 1.1}},
             "xaxis": {"title": "x (mm)"}, "yaxis": {"title": "y (mm)"}, "zaxis": {"title": "z (mm)"}}}
})
`
});

E.python.push({
  name: "CAD 3D - Twisted propeller (airfoil blades)",
  params: {"diameter_in": 5, "pitch_in": 4.3, "blades": 3, "rpm": 30000, "thickness": 0.08},
  code: String.raw`# CAD 3D: twisted PROPELLER (airfoil sections, pitch angle from the pitch/diameter) as a Plotly mesh.
# Parameters: diameter_in, pitch_in, blades, rpm, thickness
import numpy as np

D    = float(PARAMS.get("diameter_in", 5.0)) * 25.4        # mm
P    = float(PARAMS.get("pitch_in", 4.3)) * 25.4           # mm per revolution
B    = int(float(PARAMS.get("blades", 3)))
rpm  = float(PARAMS.get("rpm", 30000))
tc   = float(PARAMS.get("thickness", 0.08))                # max thickness / chord
R    = D / 2; hub = 0.12 * R
ns, nc = 22, 28                                            # stations, points around the airfoil

x = np.linspace(0, 1, nc // 2 + 1)
yt = 5 * tc * (0.2969 * np.sqrt(x) - 0.126 * x - 0.3516 * x**2 + 0.2843 * x**3 - 0.1015 * x**4)   # NACA 00xx thickness
af = np.r_[np.c_[x, yt], np.c_[x[::-1][1:], -yt[::-1][1:]]]     # closed airfoil, x = chord fraction

V = []
for s in range(ns):
    rr = hub + (R - hub) * s / (ns - 1)
    chord = R * 0.30 * np.sin(np.pi * (0.15 + 0.85 * s / (ns - 1)) ) ** 0.7 + 0.02 * R           # wide in the middle, thin tip
    beta = np.arctan(P / (2 * np.pi * rr))                                                       # local pitch angle
    for px, py in af:
        c = (px - 0.35) * chord; t = py * chord
        # rotate section by pitch angle about the radial axis, place along +x
        tx = c * np.cos(beta) - t * np.sin(beta); tz = c * np.sin(beta) + t * np.cos(beta)
        V.append([rr, tx, tz])
V = np.array(V); m = len(af)
F = []
for s in range(ns - 1):
    for k in range(m):
        a, b = s * m + k, s * m + (k + 1) % m; c, d = a + m, b + m
        F += [(a, b, d), (a, d, c)]
for k in range(1, m // 2 - 1):                      # close the tip cap
    F += [((ns - 1) * m, (ns - 1) * m + k, (ns - 1) * m + k + 1)]
F = np.array(F)

allV, allF, off = [], [], 0
for bl in range(B):
    a = 2 * np.pi * bl / B
    Rm = np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]])
    w = V @ Rm.T
    allV.append(w); allF.append(F + off); off += len(V)
# hub cylinder
th = np.linspace(0, 2 * np.pi, 33)[:-1]
hv = np.vstack([np.c_[hub * 0.95 * np.cos(th), hub * 0.95 * np.sin(th), np.full(32, -0.045 * D)],
                np.c_[hub * 0.95 * np.cos(th), hub * 0.95 * np.sin(th), np.full(32, 0.045 * D)]])
hf = []
for i in range(32):
    j = (i + 1) % 32
    hf += [(i, j, 32 + j), (i, 32 + j, 32 + i)]
    hf += [(0, i, j)] if False else []
allV.append(hv); allF.append(np.array(hf) + off)
VV = np.vstack(allV); FF = np.vstack(allF)
col = np.hypot(VV[:, 0], VV[:, 1])

tip_speed = np.pi * (D / 1000) * rpm / 60
print(f"Propeller {D/25.4:.1f} x {P/25.4:.1f} in, {B} blades, {rpm:.0f} rpm")
print(f"Tip speed = {tip_speed:.0f} m/s  (Mach {tip_speed/343:.2f})  {'WARNING: near sonic!' if tip_speed > 240 else 'OK'}")
print(f"Pitch speed (zero-thrust airspeed) = {P/1000*rpm/60:.1f} m/s = {P/1000*rpm/60*3.6:.0f} km/h")
print(f"Pitch angle: hub {np.degrees(np.arctan(P/(2*np.pi*hub))):.0f} deg -> tip {np.degrees(np.arctan(P/(2*np.pi*R))):.0f} deg")

show_plot({
  "data": [{"type": "mesh3d", "x": VV[:, 0].tolist(), "y": VV[:, 1].tolist(), "z": VV[:, 2].tolist(),
            "i": FF[:, 0].tolist(), "j": FF[:, 1].tolist(), "k": FF[:, 2].tolist(),
            "intensity": col.tolist(), "colorscale": "Turbo", "showscale": False,
            "lighting": {"ambient": 0.5, "diffuse": 0.9, "specular": 0.7, "roughness": 0.3}}],
  "layout": {"title": f"{D/25.4:.0f}-inch {B}-blade propeller", "scene": {"aspectmode": "data", "camera": {"eye": {"x": 1.1, "y": 1.1, "z": 1.3}},
             "xaxis": {"title": "mm"}, "yaxis": {"title": "mm"}, "zaxis": {"title": "mm"}}}
})
`
});

/* ---------------- JAVASCRIPT ---------------- */
E.javascript.push({
  name: "CAD 2D - Flange drawing with dimensions (Plotly)",
  params: {"outerD": 180, "boreD": 60, "boltCircleD": 130, "bolts": 6, "boltD": 14, "thickness": 20},
  code: String.raw`// CAD 2D: FLANGE DRAWING with bolt circle, centre lines and dimensions (Plotly). Edit PARAMS and press Run.
const D  = +PARAMS.outerD, d = +PARAMS.boreD, bc = +PARAMS.boltCircleD, n = Math.round(+PARAMS.bolts), bd = +PARAMS.boltD;
const circle = (cx, cy, r) => { const x = [], y = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * 2 * Math.PI; x.push(cx + r * Math.cos(a)); y.push(cy + r * Math.sin(a)); } return { x, y }; };
const line = (x, y, name, dash, color, w) => ({ x, y, mode: "lines", name, showlegend: false, line: { color, width: w || 2, dash: dash || "solid" } });
const tr = [];
const o = circle(0, 0, D / 2), b = circle(0, 0, d / 2);
tr.push({ x: o.x, y: o.y, mode: "lines", fill: "toself", fillcolor: "rgba(120,160,220,0.35)", line: { color: "#2563eb", width: 3 }, name: "flange" });
tr.push({ x: b.x, y: b.y, mode: "lines", fill: "toself", fillcolor: "rgba(255,255,255,1)", line: { color: "#2563eb", width: 3 }, name: "bore" });
const pc = circle(0, 0, bc / 2); tr.push(line(pc.x, pc.y, "bolt circle", "dashdot", "#dc2626", 1.5));
for (let i = 0; i < n; i++) {
  const a = 2 * Math.PI * i / n, cx = bc / 2 * Math.cos(a), cy = bc / 2 * Math.sin(a), h = circle(cx, cy, bd / 2);
  tr.push({ x: h.x, y: h.y, mode: "lines", fill: "toself", fillcolor: "rgba(255,255,255,1)", line: { color: "#2563eb", width: 2 }, showlegend: false });
  tr.push(line([cx - bd, cx + bd], [cy, cy], "", "dashdot", "#dc2626", 1)); tr.push(line([cx, cx], [cy - bd, cy + bd], "", "dashdot", "#dc2626", 1));
}
const R = D / 2 * 1.18;
tr.push(line([-R, R], [0, 0], "", "dashdot", "#dc2626", 1)); tr.push(line([0, 0], [-R, R], "", "dashdot", "#dc2626", 1));
// dimension lines with arrows
const ann = [];
const dim = (x0, y0, x1, y1, text) => ann.push({ x: x1, y: y1, ax: x0, ay: y0, xref: "x", yref: "y", axref: "x", ayref: "y", showarrow: true, arrowhead: 2, arrowside: "end+start", arrowcolor: "#059669", text: "" }, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, text: text, showarrow: false, font: { color: "#059669", size: 13 }, bgcolor: "rgba(255,255,255,0.8)", yshift: 10 });
dim(-D / 2, -D / 2 * 1.12, D / 2, -D / 2 * 1.12, "D" + D);
dim(-d / 2, 0.0, d / 2, 0.0, "d" + d);
dim(0, 0, bc / 2 * Math.cos(Math.PI / n), bc / 2 * Math.sin(Math.PI / n), "PCD " + bc);
const area = Math.PI / 4 * (D * D - d * d - n * bd * bd), t = +PARAMS.thickness || 20;
console.log("Flange D" + D + " / bore d" + d + " / " + n + " bolts D" + bd + " on PCD " + bc);
console.log("Face area:", area.toFixed(0), "mm2   Volume:", (area * t / 1000).toFixed(1), "cm3   Steel mass:", (area * t * 7.85e-6).toFixed(2), "kg  (t = " + t + " mm)");
console.log("Bolt spacing on PCD:", (Math.PI * bc / n).toFixed(1), "mm   Edge distance:", ((D - bc) / 2 - bd / 2).toFixed(1), "mm");
Plotly.newPlot(PLOT, tr, { title: "Flange drawing (mm)", showlegend: false, xaxis: { scaleanchor: "y", zeroline: false }, yaxis: { zeroline: false }, annotations: ann, margin: { t: 50 } });
`
});
E.javascript.push({
  name: "CAD 3D - Lathe / revolve (vase, bottle, nozzle)",
  params: {"height": 160, "radius": 40, "shape": "vase"},
  code: String.raw`// CAD 3D: LATHE / REVOLVE - draw a profile curve and spin it 360 degrees (like a CNC lathe, vase, bottle, rocket nozzle).
// Plotly "surface" is used as the 3D viewer. Change PARAMS: shape = vase | bottle | nozzle
const H = +PARAMS.height, R = +PARAMS.radius, shape = String(PARAMS.shape);
const profile = (u) => {                       // u = 0..1 along the height, returns radius
  if (shape === "bottle") return R * (u < 0.62 ? 1 - 0.04 * Math.sin(u * 8) : 0.28 + 0.72 * Math.pow(Math.max(0, (1 - u) / 0.38), 0.6)) * (u > 0.93 ? 1.1 : 1);
  if (shape === "nozzle") return R * (0.35 + 0.65 * Math.pow(u, 0.55)) * (u < 0.15 ? 1.3 - 0.3 * u / 0.15 : 1);
  return R * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + 0.12 * Math.sin(u * 20));     // vase
};
const nu = 70, nv = 64, X = [], Y = [], Z = [], C = [];
for (let i = 0; i <= nu; i++) {
  const u = i / nu, r = profile(u), rx = [], ry = [], rz = [], rc = [];
  for (let j = 0; j <= nv; j++) { const a = j / nv * 2 * Math.PI; rx.push(r * Math.cos(a)); ry.push(r * Math.sin(a)); rz.push(u * H); rc.push(r); }
  X.push(rx); Y.push(ry); Z.push(rz); C.push(rc);
}
let vol = 0; for (let i = 0; i < nu; i++) { const r = (profile(i / nu) + profile((i + 1) / nu)) / 2; vol += Math.PI * r * r * H / nu; }
console.log("Shape:", shape, " Height", H, "mm  Max radius", R, "mm");
console.log("Solid volume (revolve):", (vol / 1000).toFixed(1), "cm3  -> as a hollow part with 2 mm wall, mass of aluminium ~", (vol / 1000 * 0.1 * 2.7).toFixed(0), "g (rough)");
Plotly.newPlot(PLOT, [{ type: "surface", x: X, y: Y, z: Z, surfacecolor: C, colorscale: "Viridis", showscale: false,
  lighting: { ambient: 0.5, diffuse: 0.9, specular: 0.8, roughness: 0.25 } }],
  { title: "Revolved part: " + shape, scene: { aspectmode: "data", camera: { eye: { x: 1.5, y: 1.3, z: 0.8 } } }, margin: { t: 50 } });
`
});
E.javascript.push({
  name: "GAME - Game of Life: Gosper glider gun",
  input: "120 30",
  code: String.raw`// GAME: CONWAY'S GAME OF LIFE with a GOSPER GLIDER GUN - prints generations as text.
// Input (stdin): generations_to_run  print_every
const [gens, every] = INPUT.trim().split(/\s+/).map(Number);
const W = 60, H = 22; let g = Array.from({ length: H }, () => Array(W).fill(0));
const gun = ["........................O...........", "......................O.O...........", "............OO......OO............OO", "...........O...O....OO............OO", "OO........O.....O...OO..............", "OO........O...O.OO....O.O...........", "..........O.....O.......O...........", "...........O...O....................", "............OO......................"];
gun.forEach((row, y) => [...row].forEach((c, x) => { if (c === "O") g[y + 2][x + 1] = 1; }));
const step = (a) => a.map((row, y) => row.map((v, x) => { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += (a[y + dy] || [])[x + dx] || 0; return n === 3 || (v && n === 2) ? 1 : 0; }));
const pop = (a) => a.flat().reduce((s, v) => s + v, 0);
for (let t = 0; t <= gens; t++) {
  if (t % every === 0) { console.log("Generation " + t + "   alive: " + pop(g)); console.log(g.map(r => r.map(v => v ? "#" : ".").join("")).join("\n")); }
  g = step(g);
}
console.log("Gosper gun: a new glider is fired every 30 generations, so population keeps growing.");
`
});

})();
