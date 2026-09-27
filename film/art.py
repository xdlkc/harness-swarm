"""线稿与纹样：全部以折线描述，坐标系为 800×700 的画框（纹样为带状坐标）。

每幅线稿按笔画顺序记录，渲染时按累计长度逐步勾出。
线稿只画器物、建筑、山川与示意地图，不画人物。
"""
import math

import numpy as np

ART_W, ART_H = 800, 700


def catmull(pts, closed=False, n=10):
    p = [np.asarray(q, float) for q in pts]
    if len(p) < 3:
        return np.array(p)
    if closed:
        p = [p[-1]] + p + [p[0], p[1]]
    else:
        p = [2 * p[0] - p[1]] + p + [2 * p[-1] - p[-2]]
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(p[-2])
    return np.array(out)


def resample(pts, step):
    pts = np.asarray(pts, float)
    seg = np.hypot(*np.diff(pts, axis=0).T)
    cum = np.concatenate([[0], np.cumsum(seg)])
    if cum[-1] == 0:
        return pts
    s = np.arange(0, cum[-1], step)
    s = np.append(s, cum[-1])
    return np.stack([np.interp(s, cum, pts[:, 0]), np.interp(s, cum, pts[:, 1])], 1)


def offset_curve(pts, d):
    pts = np.asarray(pts, float)
    t = np.gradient(pts, axis=0)
    t /= np.maximum(np.hypot(t[:, 0], t[:, 1])[:, None], 1e-9)
    n = np.stack([-t[:, 1], t[:, 0]], 1)
    return pts + n * d


class Sk:
    def __init__(self):
        self.items = []

    def poly(self, pts, w=1.0, closed=False, accent=False):
        pts = np.asarray(pts, float)
        if closed:
            pts = np.vstack([pts, pts[:1]])
        if len(pts) >= 2:
            self.items.append(dict(t="s", pts=pts, w=w, a=accent))

    def line(self, x0, y0, x1, y1, **k):
        self.poly([(x0, y0), (x1, y1)], **k)

    def bez(self, p0, p1, p2, p3, n=32, **k):
        t = np.linspace(0, 1, n)[:, None]
        p0, p1, p2, p3 = (np.asarray(q, float) for q in (p0, p1, p2, p3))
        self.poly(((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3, **k)

    def arc(self, cx, cy, rx, ry, a0, a1, rot=0.0, n=None, **k):
        n = n or max(8, int(abs(a1 - a0) / 4))
        a = np.radians(np.linspace(a0, a1, n))
        x, y = rx * np.cos(a), ry * np.sin(a)
        r = math.radians(rot)
        self.poly(np.stack([cx + x * math.cos(r) - y * math.sin(r), cy + x * math.sin(r) + y * math.cos(r)], 1), **k)

    def ellipse(self, cx, cy, rx, ry, rot=0.0, **k):
        self.arc(cx, cy, rx, ry, 0, 360, rot=rot, **k)

    def circle(self, cx, cy, r, **k):
        self.ellipse(cx, cy, r, r, **k)

    def rect(self, x, y, rw, rh, **k):
        self.poly([(x, y), (x + rw, y), (x + rw, y + rh), (x, y + rh)], closed=True, **k)

    def spline(self, pts, closed=False, **k):
        self.poly(catmull(pts, closed), **k)

    def dash(self, pts, on=14, off=10, **k):
        r = resample(pts, 2)
        step = on + off
        n = len(r)
        i = 0
        while i < n - 1:
            j = min(n, i + on // 2 + 1)
            self.poly(r[i:j], **k)
            i += step // 2

    def text(self, x, y, s, size=28, accent=False):
        self.items.append(dict(t="t", xy=(x, y), s=s, size=size, a=accent))

    def arrow_head(self, p, q, size=18, **k):
        d = np.asarray(q, float) - np.asarray(p, float)
        d /= max(1e-9, np.hypot(*d))
        n = np.array([-d[1], d[0]])
        q = np.asarray(q, float)
        self.poly([q - d * size + n * size * 0.55, q, q - d * size - n * size * 0.55], **k)


# ---------------------------------------------------------------- 通用构件

def lathe(sk, cx, prof, k=0.16, w=1.2, bands=(), rim=True):
    ys = [p[0] for p in prof]
    rs = [p[1] for p in prof]
    sk.spline([(cx - r, y) for y, r in prof], w=w)
    sk.spline([(cx + r, y) for y, r in prof], w=w)
    if rim:
        sk.ellipse(cx, ys[0], rs[0], rs[0] * k, w=w)
    sk.arc(cx, ys[-1], rs[-1], rs[-1] * k, 0, 180, w=w)
    for y in bands:
        r = float(np.interp(y, ys, rs))
        sk.arc(cx, y, r, r * k, 0, 180, w=0.7)
    return lambda y: float(np.interp(y, ys, rs))


def roof(sk, cx, y, ew, eh, w=1.0, tiles=True):
    sk.spline([(cx - ew, y - eh * 0.32), (cx - ew * 0.82, y - 2), (cx, y + 2), (cx + ew * 0.82, y - 2),
               (cx + ew, y - eh * 0.32)], w=w * 1.2)
    ridge = y - eh
    sk.spline([(cx - ew, y - eh * 0.32), (cx - ew * 0.7, y - eh * 0.55), (cx - ew * 0.45, ridge)], w=w)
    sk.spline([(cx + ew, y - eh * 0.32), (cx + ew * 0.7, y - eh * 0.55), (cx + ew * 0.45, ridge)], w=w)
    sk.line(cx - ew * 0.45, ridge, cx + ew * 0.45, ridge, w=w * 1.3)
    sk.arc(cx - ew * 0.45, ridge - 8, 7, 8, 90, 360, w=w)
    sk.arc(cx + ew * 0.45, ridge - 8, 7, 8, -180, 90, w=w)
    if tiles:
        for x in np.linspace(cx - ew * 0.72, cx + ew * 0.72, 14):
            f = abs(x - cx) / ew
            top = ridge + (y - ridge) * max(0, (f - 0.45)) * 1.6 if f > 0.45 else ridge
            sk.line(x, top + 4, x, y - 4, w=0.5)


def hall(sk, cx, base, bw, bh, roofs=2, cols=8, w=1.0):
    x0, x1, top = cx - bw / 2, cx + bw / 2, base - bh
    sk.line(x0 - 10, base, x1 + 10, base, w=w * 1.2)
    for i in range(cols + 1):
        x = x0 + i * bw / cols
        sk.line(x, top, x, base, w=0.8)
    sk.line(x0, top + 10, x1, top + 10, w=0.7)
    y = top
    for r in range(roofs):
        ew = bw / 2 * (1.28 - 0.3 * r)
        eh = bh * (0.55 if r == roofs - 1 else 0.35)
        if r < roofs - 1:
            sk.spline([(cx - ew, y - eh * 0.35), (cx - ew * 0.8, y - 2), (cx, y + 2), (cx + ew * 0.8, y - 2),
                       (cx + ew, y - eh * 0.35)], w=w * 1.2)
            sk.line(cx - ew * 0.9, y - eh * 0.3, cx - ew * 0.62, y - eh, w=w)
            sk.line(cx + ew * 0.9, y - eh * 0.3, cx + ew * 0.62, y - eh, w=w)
            for x in np.linspace(cx - ew * 0.8, cx + ew * 0.8, 16):
                sk.line(x, y - eh * 0.75, x, y - 4, w=0.45)
            y2 = y - eh
            sk.rect(cx - ew * 0.62, y2 - bh * 0.22, ew * 1.24, bh * 0.22, w=0.8)
            y = y2 - bh * 0.22
        else:
            roof(sk, cx, y, ew, eh, w=w)


def mountains(sk, y, amp, x0=0, x1=ART_W, seed=0, w=0.9, n=9):
    rng = np.random.default_rng(seed)
    xs = np.linspace(x0, x1, n)
    ys = y - amp * rng.random(n)
    sk.spline(list(zip(xs, ys)), w=w)
    return lambda x: float(np.interp(x, catmull(list(zip(xs, ys)))[:, 0], catmull(list(zip(xs, ys)))[:, 1]))


def waves(sk, y0, y1, x0=20, x1=780, rows=4, seed=1, w=0.8):
    rng = np.random.default_rng(seed)
    for r, y in enumerate(np.linspace(y0, y1, rows)):
        x = x0 + (r % 2) * 30
        while x < x1 - 40:
            L = 50 + rng.random() * 30
            sk.bez((x, y), (x + L * 0.3, y - 14), (x + L * 0.7, y - 14), (x + L, y), w=w)
            sk.arc(x + L * 0.62, y - 8, 7, 6, 180, 420, w=w * 0.8)
            x += L + 8


def glyph(sk, cx, cy, s, rng, w=0.8):
    for _ in range(rng.integers(2, 5)):
        if rng.random() < 0.5:
            y = cy + (rng.random() - 0.5) * s
            sk.line(cx - s * 0.45 * rng.random(), y, cx + s * 0.45 * rng.random(), y, w=w)
        else:
            x = cx + (rng.random() - 0.5) * s
            sk.line(x, cy - s * 0.45 * rng.random(), x + (rng.random() - 0.5) * s * 0.3, cy + s * 0.45, w=w)


# 示意地图：抽象陆块与两条示意河流，不表示实际疆域与边界
LAND = [(90, 300), (150, 200), (260, 150), (380, 120), (500, 90), (620, 70), (720, 110), (740, 190), (650, 230),
        (680, 290), (640, 360), (665, 430), (600, 520), (520, 590), (420, 620), (320, 600), (230, 560), (140, 500),
        (90, 410)]
YELLOW = [(150, 300), (220, 260), (290, 220), (330, 170), (390, 160), (400, 230), (412, 290), (520, 280),
          (600, 262), (655, 245)]
YANGTZE = [(140, 430), (230, 452), (320, 420), (400, 440), (480, 420), (560, 404), (655, 395)]
WEI = [(240, 316), (330, 306), (412, 292)]
PLACES = {"镐京": (300, 318), "咸阳": (318, 300), "长安": (318, 312), "洛邑": (470, 300), "洛阳": (470, 300),
          "涿郡": (560, 160), "江都": (600, 404), "余杭": (622, 470)}


def map_base(sk, ox=0.0, oy=0.0, sc=1.0, wei=False):
    T = lambda pts: [(x * sc + ox, y * sc + oy) for x, y in pts]
    sk.spline(T(LAND), closed=True, w=1.3)
    sk.spline(T(offset_curve(catmull(LAND, True), 10)[::3]), closed=True, w=0.4)
    sk.spline(T(YELLOW), w=0.9)
    sk.spline(T(YANGTZE), w=0.9)
    if wei:
        sk.spline(T(WEI), w=0.7)
    sk.text(ox + 690 * sc, oy + 640 * sc, "示意图", size=22)
    return lambda name: (PLACES[name][0] * sc + ox, PLACES[name][1] * sc + oy)


def place(sk, p, name, capital=False, dx=12, dy=-40, accent=False):
    sk.circle(p[0], p[1], 6, w=1.2, accent=accent)
    if capital:
        sk.circle(p[0], p[1], 12, w=0.9, accent=accent)
    sk.text(p[0] + dx, p[1] + dy, name, size=26, accent=accent)


# ---------------------------------------------------------------- 线稿

def bone_flute(sk):
    A, B = np.array([110.0, 540.0]), np.array([690.0, 190.0])
    L = np.hypot(*(B - A))
    d = (B - A) / L
    n = np.array([-d[1], d[0]])
    ang = math.degrees(math.atan2(d[1], d[0]))
    s = np.linspace(0, 1, 80)
    r = 24 + 10 * np.exp(-((s - 0.0) / 0.05) ** 2) + 10 * np.exp(-((s - 1.0) / 0.05) ** 2) + 3 * np.sin(s * 9)
    P = A + np.outer(s * L, d)
    sk.poly(P + n * r[:, None], w=1.4)
    sk.poly(P - n * r[:, None], w=1.4)
    sk.ellipse(*A, 10, r[0], rot=ang, w=1.1)
    sk.ellipse(*B, 10, r[-1], rot=ang, w=1.1)
    sk.ellipse(*B, 5, r[-1] * 0.5, rot=ang, w=0.8)
    for sh in np.linspace(0.28, 0.84, 7):
        c = A + d * sh * L - n * 3
        sk.ellipse(*c, 8, 6, rot=ang, w=1.0)
    for a, b, o in [(0.08, 0.22, 0.5), (0.4, 0.55, -0.55), (0.62, 0.7, 0.45), (0.88, 0.95, -0.4)]:
        sk.poly([A + d * a * L + n * 24 * o, A + d * b * L + n * 22 * o], w=0.5)
    for i, rad in enumerate((60, 95, 130)):
        sk.arc(*B, rad, rad, ang - 28, ang + 28, w=0.7 - i * 0.12, accent=True)


def hemudu(sk):
    g = 600
    sk.spline([(30, g + 10), (200, g), (420, g + 8), (780, g - 4)], w=1.0)
    for x in np.linspace(140, 440, 6):
        sk.line(x, g, x, 440, w=1.1)
    sk.line(110, 440, 470, 440, w=1.3)
    sk.line(110, 452, 470, 452, w=0.8)
    for x in np.linspace(140, 440, 13):
        sk.line(x, 440, x, 452, w=0.5)
    sk.rect(150, 340, 280, 100, w=1.1)
    for x in np.linspace(160, 420, 14):
        sk.line(x, 345, x, 435, w=0.4)
    sk.rect(250, 370, 60, 70, w=0.9)
    sk.poly([(110, 355), (290, 210), (470, 355)], w=1.4)
    sk.poly([(135, 350), (290, 228), (445, 350)], w=0.6)
    for t in np.linspace(0.08, 0.92, 16):
        x = 110 + t * 360
        yt = 355 - (1 - abs(2 * t - 1)) * 145
        sk.line(x, yt, x + (6 if t < 0.5 else -6), yt + 22, w=0.5)
    sk.poly([(470, g), (500, 452)], w=0.9)
    sk.poly([(500, g), (530, 452)], w=0.9)
    for y in np.linspace(470, 585, 6):
        f = (y - 452) / (g - 452)
        sk.line(500 - 30 * f + 30, y, 530 - 30 * f + 30, y, w=0.6)
    for i, x in enumerate(np.linspace(580, 750, 6)):
        top = (x + 40 * math.sin(i), 250 + 30 * math.cos(i * 2))
        sk.bez((x, g), (x - 5, 480), (x + 10, 340), top, w=0.9)
        head = [top]
        for k in range(1, 9):
            head.append((top[0] + k * 7, top[1] + k * k * 1.3))
        sk.poly(head, w=0.7)
        for k, (hx, hy) in enumerate(head[1:]):
            sk.ellipse(hx + 5, hy + 3, 5, 2.5, rot=50 + k * 4, w=0.6)
        sk.bez((x, g - 60), (x - 30, g - 110), (x - 45, g - 150), (x - 60, g - 170), w=0.6)
    for x in range(40, 780, 70):
        sk.line(x, g + 30, x + 36, g + 30, w=0.4)


def painted_basin(sk):
    cx = 400
    prof = [(240, 300), (262, 312), (330, 292), (420, 240), (495, 160), (515, 130)]
    lathe(sk, cx, prof, k=0.2, w=1.4)
    sk.ellipse(cx, 240, 282, 54, w=0.8)
    pts = []
    for i, a in enumerate(np.linspace(18, 162, 25)):
        rr = 300 if i % 2 == 0 else 296
        yy = 262 + 60 * math.sin(math.radians(a)) + (0 if i % 2 == 0 else 20)
        pts.append((cx + rr * math.cos(math.radians(a)), yy))
    sk.poly(pts, w=0.8, accent=True)
    fx, fy = 400, 380
    top = [(fx - 90, fy), (fx - 30, fy - 48), (fx + 40, fy - 44), (fx + 95, fy)]
    bot = [(fx - 90, fy), (fx - 30, fy + 46), (fx + 40, fy + 42), (fx + 95, fy)]
    sk.bez(*top, w=1.2, accent=True)
    sk.bez(*bot, w=1.2, accent=True)
    sk.poly([(fx - 90, fy), (fx - 135, fy - 36), (fx - 128, fy), (fx - 135, fy + 36)], closed=True, w=1.1, accent=True)
    sk.circle(fx + 58, fy - 10, 7, w=1.0, accent=True)
    for k in range(-3, 4):
        x = fx + k * 18
        sk.line(x - 16, fy - 32 + abs(k) * 4, x + 16, fy + 32 - abs(k) * 4, w=0.5, accent=True)
        sk.line(x + 16, fy - 32 + abs(k) * 4, x - 16, fy + 32 - abs(k) * 4, w=0.5, accent=True)
    for sx in (-1, 1):
        sk.spline([(fx + sx * 190, fy - 30), (fx + sx * 230, fy - 5), (fx + sx * 215, fy + 25), (fx + sx * 180, fy + 30)],
                  w=0.7, accent=True)


def jade_cong(sk):
    sk.rect(250, 250, 200, 360, w=1.4)
    sk.poly([(450, 250), (570, 200), (570, 560), (450, 610)], w=1.4)
    sk.poly([(250, 250), (370, 200), (570, 200)], w=1.2)
    cx, cy = 410, 225
    sk.ellipse(cx, cy, 82, 24, w=1.0)
    sk.ellipse(cx, cy - 34, 82, 24, w=1.2)
    sk.line(cx - 82, cy - 34, cx - 82, cy, w=1.0)
    sk.line(cx + 82, cy - 34, cx + 82, cy, w=1.0)
    sk.ellipse(cx, cy - 34, 48, 14, w=1.0)
    for y in (370, 490):
        sk.line(250, y, 450, y, w=0.8)
        sk.line(450, y, 570, y - 50, w=0.8)
    for y0 in (250, 370, 490):
        sk.circle(432, y0 + 38, 8, w=0.9, accent=True)
        sk.circle(472, y0 + 30, 8, w=0.9, accent=True)
        sk.line(420, y0 + 78, 446, y0 + 78, w=0.7, accent=True)
        sk.line(458, y0 + 72, 486, y0 + 64, w=0.7, accent=True)
        sk.line(420, y0 + 12, 446, y0 + 12, w=0.5)
        sk.line(458, y0 + 6, 490, y0 - 6, w=0.5)
        sk.circle(262, y0 + 38, 8, w=0.8)
        sk.line(252, y0 + 78, 276, y0 + 78, w=0.6)
    sk.ellipse(410, 640, 170, 22, w=0.4)


def jue(sk):
    cx = 400
    sk.spline([(330, 270), (326, 350), (335, 420), (360, 445), (400, 450), (440, 445), (465, 420), (474, 350),
               (470, 270)], w=1.4)
    sk.ellipse(cx, 270, 70, 14, w=1.1)
    sk.poly([(330, 268), (250, 240), (160, 225)], w=1.2)
    sk.poly([(160, 225), (190, 258), (250, 262), (330, 280)], w=1.2)
    sk.poly([(470, 268), (560, 248), (620, 235)], w=1.2)
    sk.poly([(620, 235), (575, 262), (470, 282)], w=1.1)
    for x in (352, 382):
        sk.line(x, 262, x, 200, w=1.1)
        sk.poly([(x - 9, 200), (x, 186), (x + 9, 200)], closed=True, w=1.0)
    sk.spline([(470, 300), (512, 310), (518, 360), (474, 380)], w=1.1)
    for bx, tip in ((350, (292, 640)), (400, (400, 610)), (452, (512, 640))):
        sk.poly([(bx - 14, 440), tip, (bx + 14, 442)], w=1.2)
    sk.line(330, 330, 472, 330, w=0.6)
    sk.line(332, 372, 472, 372, w=0.6)
    for x in np.linspace(345, 455, 7):
        sk.circle(x, 351, 5, w=0.7, accent=True)
    sk.ellipse(400, 640, 180, 20, w=0.4)


def oracle_bone(sk):
    rng = np.random.default_rng(3)
    sk.spline([(260, 110), (400, 88), (540, 110), (590, 200), (602, 330), (580, 470), (540, 590), (460, 642),
               (400, 628), (340, 642), (260, 590), (220, 470), (198, 330), (210, 200)], closed=True, w=1.5)
    sk.spline([(400, 95), (396, 250), (404, 400), (398, 628)], w=0.6)
    for y, bend in ((220, 18), (380, -14), (520, 16)):
        sk.spline([(215, y + bend), (300, y), (400, y + 6), (500, y), (588, y + bend)], w=0.5)
    for row, y in enumerate(range(160, 600, 88)):
        for x in (270, 340, 460, 530):
            if rng.random() < 0.2:
                continue
            sk.ellipse(x - 14, y + 18, 6, 12, w=0.6)
            sk.line(x, y, x, y + 40, w=0.9, accent=True)
            s = 1 if x > 400 else -1
            sk.poly([(x, y + 16), (x + s * 10, y + 22), (x + s * 20, y + 20)], w=0.8, accent=True)
            for k in range(3):
                glyph(sk, x + s * 34, y + k * 22 - 6, 16, rng, w=0.8)


def ding(sk):
    sk.rect(230, 270, 330, 190, w=1.5)
    sk.poly([(560, 270), (620, 240), (620, 430), (560, 460)], w=1.4)
    sk.poly([(230, 270), (290, 240), (620, 240)], w=1.2)
    sk.poly([(250, 262), (300, 246), (598, 246)], w=0.6)
    for x0 in (262, 500):
        sk.poly([(x0, 256), (x0 + 6, 160), (x0 + 72, 160), (x0 + 78, 250)], w=1.3)
        sk.poly([(x0 + 18, 252), (x0 + 22, 182), (x0 + 56, 182), (x0 + 60, 250)], w=0.9)
    for lx in (262, 528):
        sk.line(lx - 20, 460, lx - 18, 628, w=1.3)
        sk.line(lx + 20, 460, lx + 18, 628, w=1.3)
        sk.arc(lx, 628, 18, 6, 0, 180, w=1.0)
        sk.arc(lx, 500, 20, 6, 0, 180, w=0.6)
    sk.line(596, 440, 598, 600, w=1.0)
    sk.line(620, 430, 620, 590, w=1.0)
    sk.rect(248, 286, 294, 158, w=0.6)
    for x in np.linspace(258, 532, 13):
        sk.circle(x, 296, 3.5, w=0.6)
        sk.circle(x, 434, 3.5, w=0.6)
    for y in np.linspace(318, 410, 5):
        for x in (262, 528):
            sk.circle(x, y, 3.5, w=0.6)
    cx, cy = 395, 360
    for s in (-1, 1):
        sk.ellipse(cx + s * 42, cy, 14, 10, w=1.2, accent=True)
        sk.circle(cx + s * 42, cy, 3, w=1.0, accent=True)
        sk.spline([(cx + s * 12, cy - 24), (cx + s * 50, cy - 34), (cx + s * 92, cy - 22), (cx + s * 100, cy + 4),
                   (cx + s * 84, cy + 14)], w=1.0, accent=True)
        sk.spline([(cx + s * 60, cy + 22), (cx + s * 100, cy + 40), (cx + s * 110, cy + 62)], w=0.8, accent=True)
        sk.arc(cx + s * 118, cy - 10, 12, 12, 0, 300, w=0.7, accent=True)
    sk.line(cx, cy - 34, cx, cy + 36, w=0.9, accent=True)
    sk.arc(cx, cy + 40, 26, 10, 0, 180, w=0.9, accent=True)
    sk.ellipse(420, 640, 250, 18, w=0.4)


def chime_stones(sk):
    sk.spline([(50, 150), (70, 168), (400, 172), (730, 168), (750, 150)], w=1.4)
    sk.line(70, 184, 730, 184, w=0.9)
    for x in (95, 705):
        sk.line(x - 10, 184, x - 10, 630, w=1.3)
        sk.line(x + 10, 184, x + 10, 630, w=1.3)
        sk.poly([(x - 50, 650), (x - 10, 630), (x + 10, 630), (x + 50, 650)], w=1.2)
        sk.line(x - 50, 650, x + 50, 650, w=1.2)
    for i, (hx, s) in enumerate(zip(np.linspace(185, 620, 6), np.linspace(118, 70, 6))):
        hy = 250 + i * 12
        sk.line(hx, 184, hx, hy, w=0.6)
        sk.poly([(hx - 5, hy), (hx - s * 1.15, hy + s * 0.55), (hx - s * 1.08, hy + s * 0.86), (hx, hy + s * 0.34),
                 (hx + s * 0.58, hy + s * 0.64), (hx + s * 0.7, hy + s * 0.42), (hx + 5, hy)], closed=True, w=1.2)
        sk.circle(hx, hy + 10, 4, w=0.7)
        sk.line(hx - s * 0.9, hy + s * 0.6, hx - s * 0.2, hy + s * 0.34, w=0.4, accent=True)
    sk.line(560, 600, 690, 520, w=1.2)
    sk.ellipse(700, 514, 18, 10, rot=-30, w=1.1)


def map_east(sk):
    P = map_base(sk, wei=True)
    a, b = P("镐京"), P("洛邑")
    place(sk, a, "镐京", capital=True, dx=-60, dy=12)
    place(sk, b, "洛邑", capital=True, dx=16, dy=6, accent=True)
    path = catmull([a, ((a[0] + b[0]) / 2, a[1] - 90), b], n=20)
    sk.dash(path, w=1.4, accent=True)
    sk.arrow_head(path[-6], path[-1], w=1.4, accent=True)
    sk.text(345, 200, "东迁", size=34, accent=True)


def bamboo_slips(sk):
    rng = np.random.default_rng(7)
    xs = np.arange(110, 540, 38)
    for i, x in enumerate(xs):
        dy = (i % 3) * 3
        sk.rect(x, 150 + dy, 30, 440, w=1.0)
        for y in np.arange(176 + dy, 570, 30):
            if y in range(215, 245) or y in range(495, 525) or rng.random() < 0.12:
                continue
            glyph(sk, x + 15, y, 16, rng, w=0.7)
    for y in (230, 510):
        t = np.linspace(95, 575, 200)
        sk.poly(np.stack([t, y + 5 * np.sin((t - 110) / 38 * math.pi)], 1), w=0.9, accent=True)
        sk.poly(np.stack([t, y + 5 * np.sin((t - 110) / 38 * math.pi + math.pi)], 1), w=0.9, accent=True)
    cx = 650
    sk.line(cx - 75, 150, cx - 75, 590, w=1.2)
    sk.line(cx + 75, 150, cx + 75, 590, w=1.2)
    for r in (75, 58, 42, 27, 12):
        sk.ellipse(cx, 150, r, r * 0.3, w=0.9 if r == 75 else 0.6)
    sk.arc(cx, 590, 75, 22, 0, 180, w=1.2)
    for x in np.linspace(cx - 60, cx + 60, 6):
        sk.line(x, 170, x, 575, w=0.35)
    sk.poly([(575, 230), (cx - 75, 236)], w=0.9, accent=True)
    sk.poly([(575, 510), (cx - 75, 516)], w=0.9, accent=True)


def bell(sk, cx, ty, w, h, shank=True, knobs=True):
    sk.bez((cx - w * 0.36, ty), (cx - w * 0.4, ty + h * 0.4), (cx - w * 0.46, ty + h * 0.7), (cx - w / 2, ty + h), w=1.2)
    sk.bez((cx + w * 0.36, ty), (cx + w * 0.4, ty + h * 0.4), (cx + w * 0.46, ty + h * 0.7), (cx + w / 2, ty + h), w=1.2)
    sk.bez((cx - w / 2, ty + h), (cx - w * 0.3, ty + h * 0.9), (cx - w * 0.1, ty + h * 0.86), (cx, ty + h * 0.86), w=1.2)
    sk.bez((cx + w / 2, ty + h), (cx + w * 0.3, ty + h * 0.9), (cx + w * 0.1, ty + h * 0.86), (cx, ty + h * 0.86), w=1.2)
    sk.line(cx - w * 0.36, ty, cx + w * 0.36, ty, w=1.1)
    if shank:
        sk.rect(cx - w * 0.08, ty - h * 0.32, w * 0.16, h * 0.32, w=0.9)
        sk.ellipse(cx, ty - h * 0.14, w * 0.14, h * 0.04, w=0.7)
    else:
        sk.arc(cx, ty, w * 0.14, h * 0.14, 180, 360, w=0.9)
    sk.line(cx - w * 0.12, ty + h * 0.06, cx - w * 0.14, ty + h * 0.7, w=0.5)
    sk.line(cx + w * 0.12, ty + h * 0.06, cx + w * 0.14, ty + h * 0.7, w=0.5)
    if knobs:
        for side in (-1, 1):
            for r in range(3):
                for c in range(3):
                    x = cx + side * (w * 0.2 + c * w * 0.075)
                    y = ty + h * (0.14 + r * 0.17)
                    sk.circle(x, y, max(2.0, w * 0.028), w=0.6, accent=True)


def bell_set(sk):
    for y in (120, 292, 474):
        sk.spline([(40, y - 12), (60, y), (400, y + 2), (740, y), (760, y - 12)], w=1.4)
        sk.line(60, y + 12, 740, y + 12, w=0.7)
    for x in (70, 730):
        sk.line(x - 9, 132, x - 9, 690, w=1.3)
        sk.line(x + 9, 132, x + 9, 690, w=1.3)
    for x in np.linspace(140, 660, 7):
        sk.line(x, 132, x, 152, w=0.6)
        bell(sk, x, 152, 50, 74, shank=False, knobs=False)
    for x in np.linspace(150, 650, 5):
        bell(sk, x, 336, 78, 110)
    for x in np.linspace(175, 625, 4):
        bell(sk, x, 528, 112, 148)


def dujiangyan(sk):
    rng = np.random.default_rng(5)
    mountains(sk, 170, 90, 300, 790, seed=2, w=1.1)
    mountains(sk, 120, 60, 420, 800, seed=4, w=0.6)
    L1 = [(60, 70), (180, 160), (300, 250), (360, 320)]
    R1 = [(170, 50), (280, 130), (390, 220), (440, 300)]
    sk.spline(L1, w=1.3)
    sk.spline(R1, w=1.3)
    sk.spline([(360, 320), (300, 450), (220, 580), (150, 690)], w=1.3)
    sk.spline([(390, 350), (380, 470), (330, 580), (280, 690)], w=0.9)
    sk.spline([(440, 300), (520, 380), (560, 450)], w=1.3)
    sk.spline([(410, 360), (470, 430), (520, 480)], w=0.9)
    sk.spline([(398, 318), (420, 350), (438, 420), (430, 470), (408, 520), (392, 470), (394, 400), (398, 318)], w=1.4,
              accent=True)
    cliff = [(560, 450), (600, 420), (650, 440), (700, 400), (760, 430), (780, 520), (700, 560), (620, 540), (575, 500)]
    sk.spline(cliff, closed=True, w=1.2)
    sk.spline([(520, 480), (540, 540), (600, 620), (660, 690)], w=1.1)
    sk.spline([(575, 500), (600, 560), (680, 640), (740, 690)], w=1.1)
    sk.poly([(430, 480), (470, 500), (515, 520)], w=2.0, accent=True)
    for _ in range(26):
        x, y = rng.uniform(180, 560), rng.uniform(180, 660)
        sk.arc(x, y, 9, 3, 200, 340, w=0.4)
    sk.text(440, 330, "鱼嘴", size=24, accent=True)
    sk.text(600, 580, "宝瓶口", size=24)
    sk.text(400, 540, "飞沙堰", size=24)
    sk.text(160, 470, "外江", size=24)
    sk.text(530, 400, "内江", size=24)


def map_qin(sk):
    P = map_base(sk, wei=True)
    c = np.mean(np.array(LAND), axis=0)
    inner = [(c + (np.array(p) - c) * 0.86) for p in LAND]
    sk.dash(catmull(inner, True), on=10, off=8, w=1.0, accent=True)
    place(sk, P("咸阳"), "咸阳", capital=True, dx=-66, dy=-44, accent=True)
    x, y = 150, 610
    sk.circle(x, y, 44, w=1.3)
    sk.circle(x, y, 40, w=0.5)
    sk.rect(x - 11, y - 11, 22, 22, w=1.1)
    sk.text(x - 40, y - 16, "半", size=24)
    sk.text(x + 16, y - 16, "两", size=24)


def great_wall(sk):
    mountains(sk, 250, 60, 0, 800, seed=11, w=0.5)
    far = mountains(sk, 340, 80, 0, 800, seed=12, w=0.7)
    xs = np.linspace(0, 800, 11)
    ys = [470, 420, 380, 430, 360, 330, 390, 350, 300, 360, 420]
    front = catmull(list(zip(xs, ys)), n=16)
    sk.poly(front, w=1.2)
    top = front + np.array([0, -26])
    sk.poly(top, w=1.1)
    r = resample(top, 16)
    for i in range(0, len(r) - 1, 2):
        (x0, y0), (x1, y1) = r[i], r[i + 1]
        sk.poly([(x0, y0), (x0, y0 - 8), (x1, y1 - 8), (x1, y1)], w=0.7)
    for tx in (110, 330, 540, 720):
        ty = float(np.interp(tx, front[:, 0], front[:, 1]))
        sk.rect(tx - 28, ty - 82, 56, 82, w=1.2)
        for k in range(4):
            sk.rect(tx - 28 + k * 16, ty - 92, 8, 10, w=0.7)
        sk.arc(tx, ty - 44, 9, 12, 180, 360, w=0.8)
        sk.line(tx - 9, ty - 44, tx - 9, ty - 26, w=0.8)
        sk.line(tx + 9, ty - 44, tx + 9, ty - 26, w=0.8)
    rng = np.random.default_rng(9)
    for _ in range(90):
        x = rng.uniform(0, 800)
        y = float(np.interp(x, front[:, 0], front[:, 1])) + rng.uniform(15, 220)
        if y < 690:
            sk.line(x, y, x + 12, y + 18, w=0.4)
    r2 = resample(catmull(list(zip(np.linspace(0, 800, 9), [340 - 70 * v for v in np.random.default_rng(12).random(9)]))), 30)
    sk.poly(r2 - np.array([0, 10]), w=0.5)


def map_silk(sk):
    sc, ox, oy = 0.7, 250, 110
    P = map_base(sk, ox=ox, oy=oy, sc=sc, wei=True)
    ca = P("长安")
    dunhuang = (270, 300)
    xiyu = (70, 330)
    path = catmull([ca, (360, 280), dunhuang, (170, 300), xiyu], n=18)
    sk.dash(path, w=1.5, accent=True)
    sk.arrow_head(path[-6], path[-1], w=1.5, accent=True)
    place(sk, ca, "长安", capital=True, dx=10, dy=10, accent=True)
    place(sk, dunhuang, "敦煌", dx=-24, dy=18)
    sk.text(40, 360, "西域", size=28)
    for x0, y0, wd in ((40, 470, 180), (150, 520, 220), (60, 580, 260), (230, 610, 160)):
        sk.bez((x0, y0), (x0 + wd * 0.3, y0 - 40), (x0 + wd * 0.6, y0 - 30), (x0 + wd, y0), w=0.7)
    for k, x in enumerate((110, 150, 190)):
        y = 420 + k * 3
        sk.spline([(x - 16, y), (x - 8, y - 12), (x, y - 6), (x + 8, y - 16), (x + 16, y - 2), (x + 18, y + 4)], w=0.8)
        sk.line(x - 12, y, x - 12, y + 16, w=0.6)
        sk.line(x + 12, y, x + 12, y + 16, w=0.6)


def paper(sk):
    sk.poly([(110, 430), (420, 430), (420, 590), (110, 590)], closed=True, w=1.3)
    sk.poly([(110, 430), (170, 390), (480, 390), (420, 430)], w=1.2)
    sk.poly([(480, 390), (480, 550), (420, 590)], w=1.2)
    for y in (402, 412):
        sk.spline([(150, y + 6), (250, y), (350, y + 6), (440, y)], w=0.4)
    q = np.array([(180, 250), (450, 228), (482, 332), (212, 356)], float)
    sk.poly(q, closed=True, w=1.3)
    sk.poly(q + [(8, 8), (-8, 8), (-8, -8), (8, -8)], closed=True, w=0.7)
    for t in np.linspace(0.06, 0.94, 26):
        a = q[0] + (q[1] - q[0]) * t
        b = q[3] + (q[2] - q[3]) * t
        sk.line(*a, *b, w=0.35)
    for i in range(8):
        o = -7 * i
        sk.poly([(500, 600 + o), (690, 590 + o), (740, 624 + o), (550, 636 + o)], closed=True, w=0.8 if i < 7 else 1.2)
    sk.line(470, 110, 780, 140, w=0.9)
    for x0 in (500, 590, 680):
        y0 = 113 + (x0 - 470) * 0.097
        sk.poly([(x0, y0), (x0 + 70, y0 + 7), (x0 + 66, y0 + 150), (x0 - 4, y0 + 143)], closed=True, w=1.0, accent=True)
    rng = np.random.default_rng(4)
    for _ in range(14):
        x = rng.uniform(560, 700)
        y = rng.uniform(560, 590)
        sk.line(x, y, x + rng.uniform(8, 30), y + rng.uniform(-3, 3), w=0.3)


def seismoscope(sk):
    cx = 400
    lathe(sk, cx, [(200, 80), (230, 160), (300, 205), (390, 210), (470, 185), (540, 140), (570, 120)], k=0.14, w=1.4,
          bands=(260, 330, 470), rim=False)
    sk.spline([(320, 200), (330, 150), (365, 118), (400, 110), (435, 118), (470, 150), (480, 200)], w=1.3)
    sk.circle(400, 98, 12, w=1.1)
    sk.ellipse(cx, 200, 80, 12, w=0.8)
    sk.ellipse(cx, 610, 250, 40, w=0.8)
    for a in np.linspace(15, 165, 5):
        ra = math.radians(a)
        bx, by = cx + 192 * math.cos(ra), 250 + 26 * math.sin(ra)
        dx = math.cos(ra)
        hx, hy = bx + dx * 34, by + 10
        sk.spline([(bx, by - 26), (bx + dx * 20, by - 22), (hx, hy - 6), (hx + dx * 10, hy + 6)], w=1.1, accent=True)
        sk.spline([(bx, by + 8), (bx + dx * 16, by + 14), (hx - dx * 2, hy + 14)], w=0.9, accent=True)
        sk.circle(hx + dx * 4, hy + 22, 7, w=1.0, accent=True)
        tx, ty = cx + 250 * math.cos(ra) * 0.92, 585 + 24 * math.sin(ra)
        sk.ellipse(tx, ty, 22, 13, w=1.0)
        sk.arc(tx, ty - 10, 10, 6, 180, 360, w=0.8)
        sk.circle(tx - 10, ty - 12, 3, w=0.6)
        sk.circle(tx + 10, ty - 12, 3, w=0.6)


def map_three(sk):
    map_base(sk)
    sk.dash(catmull([(100, 380), (250, 370), (380, 360), (520, 350), (660, 340)]), w=1.1, accent=True)
    sk.dash(catmull([(360, 362), (350, 450), (370, 540), (360, 612)]), w=1.1, accent=True)
    sk.text(430, 220, "魏", size=58, accent=True)
    sk.text(200, 430, "蜀", size=58, accent=True)
    sk.text(480, 450, "吴", size=58, accent=True)


def lanting(sk):
    rng = np.random.default_rng(8)
    c = catmull([(780, 150), (600, 210), (650, 330), (470, 370), (520, 490), (300, 530), (340, 650), (120, 700)], n=16)
    sk.poly(offset_curve(c, 30), w=1.2)
    sk.poly(offset_curve(c, -30), w=1.2)
    for _ in range(30):
        i = rng.integers(5, len(c) - 5)
        p = c[i] + rng.uniform(-18, 18, 2)
        sk.arc(p[0], p[1], 10, 3, 200, 340, w=0.4)
    for i in (int(len(c) * f) for f in (0.28, 0.5, 0.7, 0.86)):
        x, y = c[i]
        sk.ellipse(x, y, 16, 6, w=1.0, accent=True)
        sk.arc(x, y, 16, 10, 0, 180, w=0.8, accent=True)
        sk.ellipse(x - 20, y - 1, 5, 3, w=0.6, accent=True)
        sk.ellipse(x + 20, y - 1, 5, 3, w=0.6, accent=True)
    sk.poly([(60, 270), (320, 270), (330, 290), (50, 290)], closed=True, w=1.0)
    hall(sk, 190, 270, 170, 70, roofs=1, cols=4)
    for x in (80, 115, 140):
        for y0 in range(380, 690, 50):
            sk.line(x, y0, x + 2, y0 + 46, w=1.0)
            sk.line(x - 5, y0 + 46, x + 7, y0 + 46, w=0.6)
        for k in range(3):
            y = 380 + k * 70 + x % 30
            sk.bez((x, y), (x + 20, y - 20), (x + 40, y - 10), (x + 60, y - 4), w=0.6)
    sk.spline([(560, 620), (600, 580), (660, 590), (700, 640), (560, 640)], closed=True, w=1.0)
    sk.line(590, 600, 620, 630, w=0.4)


def mogao(sk):
    rng = np.random.default_rng(13)
    edge = [(0, 130)] + [(x, 120 + rng.uniform(-20, 20)) for x in range(60, 800, 60)] + [(800, 125)]
    sk.poly(edge, w=1.2)
    for y in (560,):
        sk.spline([(0, y), (200, y - 6), (400, y + 4), (600, y - 4), (800, y)], w=1.1)
    for _ in range(18):
        y = rng.uniform(150, 540)
        x = rng.uniform(0, 700)
        sk.line(x, y, x + rng.uniform(40, 120), y + rng.uniform(-3, 3), w=0.35)
    for r, y in enumerate((180, 300, 420)):
        x = 30 + r * 25
        while x < 740:
            w_ = rng.uniform(40, 70)
            h = w_ * 1.3
            sk.poly([(x, y + h)] + [(x + w_ / 2 + w_ / 2 * math.cos(a), y + w_ / 2 - w_ / 2 * math.sin(a))
                                     for a in np.linspace(math.pi, 0, 14)] + [(x + w_, y + h)], w=1.1)
            sk.poly([(x + 8, y + h)] + [(x + w_ / 2 + (w_ / 2 - 8) * math.cos(a), y + w_ / 2 + 4 - (w_ / 2 - 8) * math.sin(a))
                                         for a in np.linspace(math.pi, 0, 12)] + [(x + w_ - 8, y + h)], w=0.5)
            x += w_ + rng.uniform(25, 60)
        sk.line(20, y + 100, 780, y + 100, w=0.8)
        sk.line(20, y + 106, 780, y + 106, w=0.4)
    for x in (200, 520):
        for y0 in (286, 406):
            sk.line(x, y0, x, y0 + 114, w=0.6)
            sk.line(x + 20, y0, x + 20, y0 + 114, w=0.6)
            for y in range(int(y0) + 12, int(y0) + 114, 16):
                sk.line(x, y, x + 20, y, w=0.4)
    for x0, y0, wd in ((0, 640, 320), (250, 610, 360), (520, 650, 280)):
        sk.bez((x0, y0), (x0 + wd * 0.3, y0 - 50), (x0 + wd * 0.6, y0 - 44), (x0 + wd, y0), w=0.8)
    sk.circle(700, 70, 26, w=0.9, accent=True)


def pi_circle(sk):
    cx, cy, R = 380, 360, 250
    sk.circle(cx, cy, R, w=1.5)
    sk.poly([(cx + R * math.cos(a), cy + R * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 7)], w=1.0)
    sk.poly([(cx + R * math.cos(a), cy + R * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 13)], w=0.7)
    sk.poly([(cx + R * math.cos(a), cy + R * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 25)], w=0.5, accent=True)
    for a in np.linspace(0, 2 * math.pi, 7)[:-1]:
        sk.line(cx, cy, cx + R * math.cos(a), cy + R * math.sin(a), w=0.5)
    sk.circle(cx, cy, 4, w=1)
    sk.text(cx + 40, cy - 40, "r", size=30)
    sk.text(560, 90, "π≈3.1415926", size=30, accent=True)
    sk.text(600, 590, "密率 355/113", size=28)
    sk.text(600, 630, "约率 22/7", size=28)


def zhaozhou(sk):
    a, h = 290.0, 150.0
    R = (a * a + h * h) / (2 * h)
    cx, cy = 400.0, 390.0 + R
    t0 = math.degrees(math.atan2(540 - cy, 110 - cx))
    t1 = math.degrees(math.atan2(540 - cy, 690 - cx))
    sk.arc(cx, cy, R, R, t0, t1, n=80, w=1.6)
    sk.arc(cx, cy, R + 30, R + 30, t0 - 1, t1 + 1, n=80, w=1.2)
    for t in np.arange(t0 + 3, t1, 4.5):
        rt = math.radians(t)
        sk.line(cx + R * math.cos(rt), cy + R * math.sin(rt), cx + (R + 30) * math.cos(rt), cy + (R + 30) * math.sin(rt),
                w=0.4)
    for x, r in ((170, 26), (240, 20), (560, 20), (630, 26)):
        y = 440 - (1 - abs(x - 400) / 300) * 40
        sk.arc(x, y, r, r, 180, 360, w=1.1)
        sk.arc(x, y, r + 8, r + 8, 180, 360, w=0.6)
        sk.line(x - r, y, x - r, y + 10, w=0.8)
        sk.line(x + r, y, x + r, y + 10, w=0.8)
    deck = catmull([(60, 410), (230, 380), (400, 362), (570, 380), (740, 410)], n=20)
    sk.poly(deck, w=1.3)
    sk.poly(deck + [0, 18], w=0.8)
    rail = deck + [0, -32]
    sk.poly(rail, w=0.9)
    for p in resample(deck, 32)[1:-1]:
        sk.line(p[0], p[1], p[0], p[1] - 32, w=0.6)
    sk.poly([(20, 440), (110, 540), (60, 560), (0, 560)], w=0.9)
    sk.poly([(780, 440), (690, 540), (740, 560), (800, 560)], w=0.9)
    for y in (570, 600, 640, 680):
        for x in range(40 + y % 50, 760, 90):
            sk.line(x, y, x + 50, y, w=0.4)
    sk.dash(catmull([(120, 555), (400, 640), (680, 555)]), on=12, off=14, w=0.4)


def map_canal(sk):
    P = map_base(sk, wei=True)
    route = [P("涿郡"), (520, 230), P("洛阳"), (540, 360), P("江都"), P("余杭")]
    c = catmull(route, n=16)
    sk.poly(offset_curve(c, 3), w=1.2, accent=True)
    sk.poly(offset_curve(c, -3), w=1.2, accent=True)
    place(sk, P("涿郡"), "涿郡", dx=14, dy=-34)
    place(sk, P("洛阳"), "洛阳", capital=True, dx=-70, dy=-40)
    place(sk, P("江都"), "江都", dx=16, dy=-40)
    place(sk, P("余杭"), "余杭", dx=16, dy=0)


def changan(sk):
    x0, y0, x1, y1 = 100, 110, 700, 640
    sk.rect(x0, y0, x1 - x0, y1 - y0, w=1.6)
    sk.rect(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12, w=0.5)
    sk.rect(300, y0, 200, 80, w=1.3)
    sk.rect(300, y0 + 80, 200, 80, w=1.1)
    for x in np.linspace(x0, x1, 11)[1:-1]:
        if abs(x - 400) < 5:
            continue
        top = y0 + 160 if 300 <= x <= 500 else y0
        sk.line(x, top, x, y1, w=0.6)
    for y in np.linspace(y0, y1, 14)[1:-1]:
        if y < y0 + 160:
            sk.line(x0, y, 300, y, w=0.6)
            sk.line(500, y, x1, y, w=0.6)
        else:
            sk.line(x0, y, x1, y, w=0.6)
    sk.line(394, y0 + 160, 394, y1, w=1.2, accent=True)
    sk.line(406, y0 + 160, 406, y1, w=1.2, accent=True)
    for mx in (195, 545):
        sk.rect(mx, 330, 62, 70, w=1.1)
        sk.line(mx + 31, 330, mx + 31, 400, w=0.5)
        sk.line(mx, 365, mx + 62, 365, w=0.5)
    sk.text(415, 560, "朱雀大街", size=24, accent=True)
    sk.text(560, 300, "东市", size=24)
    sk.text(208, 300, "西市", size=24)
    sk.text(365, 128, "宫城", size=24)
    sk.text(690, 660, "示意图", size=22)


def tang_poem(sk):
    sk.circle(590, 190, 92, w=1.3, accent=True)
    sk.arc(590, 190, 78, 78, 200, 280, w=0.4, accent=True)
    mountains(sk, 430, 120, 0, 800, seed=21, w=1.1)
    mountains(sk, 500, 90, 0, 800, seed=22, w=0.8)
    sk.line(0, 560, 800, 560, w=0.9)
    for k, y in enumerate((585, 610, 640, 670)):
        sk.line(560 - 20 + k * 3, y, 620 + 10 - k * 3, y, w=1.0 - k * 0.15, accent=True)
        sk.line(80 + k * 60, y + 6, 180 + k * 60, y + 6, w=0.35)
    sk.bez((130, 700), (170, 560), (120, 420), (210, 290), w=1.6)
    sk.bez((140, 700), (185, 560), (135, 420), (218, 292), w=0.8)
    for bx, by, L in ((175, 400, 140), (200, 330, 110), (150, 480, 120)):
        sk.bez((bx, by), (bx + L * 0.3, by - 20), (bx + L * 0.7, by - 10), (bx + L, by - 24), w=1.0)
        for t in np.linspace(0.3, 1.0, 5):
            px, py = bx + L * t, by - 20 * t
            for a in np.linspace(-150, -30, 6):
                ra = math.radians(a)
                sk.line(px, py, px + 16 * math.cos(ra), py + 16 * math.sin(ra), w=0.4)
    sk.arc(480, 575, 50, 12, 0, 180, w=1.1)
    sk.arc(480, 568, 22, 16, 180, 360, w=0.8)
    for x, y in ((330, 130), (360, 150), (390, 125)):
        sk.poly([(x - 10, y - 5), (x, y), (x + 10, y - 5)], w=0.7)


def sutra(sk):
    rng = np.random.default_rng(17)
    sk.poly([(90, 250), (650, 250)], w=1.3)
    sk.poly([(90, 500), (650, 500)], w=1.3)
    sk.spline([(90, 250), (80, 320), (96, 400), (84, 500)], w=1.2)
    sk.line(650, 230, 650, 520, w=1.2)
    sk.line(700, 230, 700, 520, w=1.2)
    sk.ellipse(675, 230, 25, 8, w=1.1)
    sk.arc(675, 520, 25, 8, 0, 180, w=1.1)
    sk.line(675, 212, 675, 222, w=1.2)
    sk.line(675, 528, 675, 540, w=1.2)
    sk.rect(110, 270, 200, 210, w=1.0)
    cx, cy = 210, 410
    for a in np.linspace(-150, -30, 5):
        ra = math.radians(a)
        tip = (cx + 70 * math.cos(ra), cy + 70 * math.sin(ra))
        sk.bez((cx, cy), (cx + 40 * math.cos(ra - 0.4), cy + 40 * math.sin(ra - 0.4)),
               (tip[0] - 5, tip[1]), tip, w=0.9, accent=True)
        sk.bez((cx, cy), (cx + 40 * math.cos(ra + 0.4), cy + 40 * math.sin(ra + 0.4)),
               (tip[0] + 5, tip[1]), tip, w=0.9, accent=True)
    sk.arc(cx, cy + 4, 60, 14, 0, 180, w=0.9, accent=True)
    sk.arc(cx, 300, 80, 22, 180, 360, w=0.8)
    for x in range(330, 640, 22):
        for y in range(280, 480, 26):
            if rng.random() < 0.08:
                continue
            glyph(sk, x, y, 14, rng, w=0.6)
    sk.text(120, 520, "咸通九年", size=24, accent=True)


def movable_type(sk):
    chars = "活字印刷毕昇庆历胶泥版"
    rng = np.random.default_rng(19)
    sk.rect(140, 200, 520, 360, w=1.5)
    sk.rect(152, 212, 496, 336, w=0.6)
    k = 0
    for r in range(6):
        for c in range(9):
            x, y = 168 + c * 53, 228 + r * 53
            sk.rect(x, y, 44, 44, w=0.8)
            sk.poly([(x + 44, y), (x + 50, y - 6), (x + 50, y + 38), (x + 44, y + 44)], w=0.4)
            if rng.random() < 0.35:
                sk.text(x + 8, y + 2, chars[k % len(chars)], size=28)
                k += 1
            else:
                glyph(sk, x + 22, y + 22, 22, rng, w=0.6)
    for i, (x, y) in enumerate(((560, 600), (630, 616), (690, 596))):
        sk.rect(x, y, 56, 56, w=1.2)
        sk.poly([(x, y), (x + 10, y - 10), (x + 66, y - 10), (x + 56, y)], w=0.8)
        sk.poly([(x + 66, y - 10), (x + 66, y + 46), (x + 56, y + 56)], w=0.8)
        sk.text(x + 10, y + 6, "活字版"[i], size=34, accent=True)


def compass(sk):
    lathe(sk, 290, [(440, 180), (490, 168), (540, 120), (560, 80)], k=0.18, w=1.3)
    sk.ellipse(290, 452, 166, 28, w=0.6)
    sk.poly([(170, 448), (290, 440), (410, 456), (290, 452)], closed=True, w=1.3, accent=True)
    sk.line(640, 600, 640, 160, w=1.3)
    sk.line(626, 600, 626, 170, w=0.7)
    sk.line(640, 160, 500, 160, w=1.3)
    sk.poly([(590, 610), (680, 610)], w=1.2)
    sk.line(510, 160, 510, 330, w=0.4)
    sk.poly([(430, 330), (510, 325), (590, 332), (510, 336)], closed=True, w=1.2, accent=True)
    cx, cy = 180, 190
    for r in (95, 70, 42):
        sk.circle(cx, cy, r, w=0.9 if r == 95 else 0.6)
    for a in np.arange(0, 360, 15):
        ra = math.radians(a)
        sk.line(cx + 70 * math.cos(ra), cy + 70 * math.sin(ra), cx + 95 * math.cos(ra), cy + 95 * math.sin(ra), w=0.4)
    sk.text(cx - 12, cy - 140, "子", size=26)
    sk.text(cx - 12, cy + 104, "午", size=26)
    sk.poly([(cx, cy - 36), (cx + 8, cy), (cx, cy + 36), (cx - 8, cy)], closed=True, w=1.0, accent=True)


def ru_vase(sk):
    cx = 400
    prof = [(130, 32), (150, 28), (250, 26), (330, 30), (380, 80), (410, 150), (440, 158), (560, 158), (620, 150),
            (640, 140)]
    lathe(sk, cx, prof, k=0.14, w=1.4, bands=(410,))
    sk.ellipse(cx, 130, 22, 4, w=0.6)
    rng = np.random.default_rng(23)
    for _ in range(26):
        x = rng.uniform(260, 540)
        y = rng.uniform(430, 610)
        pts = [(x, y)]
        for _ in range(rng.integers(2, 5)):
            x += rng.uniform(-22, 22)
            y += rng.uniform(-18, 18)
            pts.append((min(max(x, 250), 550), min(max(y, 420), 620)))
        sk.poly(pts, w=0.35, accent=True)
    sk.ellipse(cx, 660, 260, 18, w=0.4)


def linan(sk):
    rng = np.random.default_rng(29)
    mountains(sk, 340, 90, 250, 800, seed=31, w=0.8)
    mountains(sk, 380, 60, 300, 800, seed=32, w=0.5)
    sk.spline([(0, 470), (80, 400), (180, 360), (300, 380), (380, 470)], w=1.1)
    y = 380
    for i, wd in enumerate(np.linspace(130, 70, 5)):
        sk.rect(190 - wd * 0.35, y - 42, wd * 0.7, 42, w=0.9)
        sk.line(190, y - 42, 190, y, w=0.4)
        roof(sk, 190, y - 42, wd * 0.62, 24, w=0.9, tiles=False)
        y -= 62
    sk.line(190, y + 20, 190, y - 30, w=1.1)
    for yy in (y - 10, y - 20):
        sk.ellipse(190, yy, 6, 2, w=0.6)
    sk.line(0, 470, 800, 470, w=1.0)
    for _ in range(40):
        x, yy = rng.uniform(20, 760), rng.uniform(490, 680)
        sk.line(x, yy, x + rng.uniform(20, 60), yy, w=0.35)
    sk.arc(560, 470, 110, 50, 180, 360, w=1.2)
    sk.arc(560, 470, 90, 36, 180, 360, w=0.7)
    sk.arc(560, 470, 110, 26, 0, 180, w=0.35, accent=True)
    sk.line(430, 422, 690, 422, w=0.9)
    for x in range(680, 800, 22):
        sk.bez((x, 0), (x - 10, 100), (x + 12, 220), (x - 4, 300 + (x % 60)), w=0.5)
    sk.arc(360, 560, 36, 8, 0, 180, w=0.9)
    sk.line(360, 550, 360, 520, w=0.6)


def armillary(sk):
    sk.poly([(150, 610), (650, 610), (710, 550), (210, 550)], closed=True, w=1.3)
    sk.line(180, 580, 680, 580, w=0.7)
    sk.line(400, 610, 460, 550, w=0.7)
    for x in (250, 560):
        sk.line(x, 575, x + 20, 420, w=1.2)
    cx, cy = 400, 330
    sk.circle(cx, cy, 225, w=1.4)
    sk.circle(cx, cy, 205, w=0.8)
    for a in np.arange(0, 360, 10):
        ra = math.radians(a)
        sk.line(cx + 205 * math.cos(ra), cy + 205 * math.sin(ra), cx + 225 * math.cos(ra), cy + 225 * math.sin(ra), w=0.35)
    sk.ellipse(cx, cy, 225, 70, rot=-24, w=1.2, accent=True)
    sk.ellipse(cx, cy, 208, 60, rot=-24, w=0.6, accent=True)
    sk.ellipse(cx, cy, 60, 225, rot=18, w=0.9)
    sk.line(cx - 120, cy - 240, cx + 120, cy + 240, w=0.9)
    r = math.radians(60)
    d = np.array([math.cos(r), math.sin(r)])
    n = np.array([-d[1], d[0]])
    a, b = np.array([cx, cy]) - d * 180, np.array([cx, cy]) + d * 180
    sk.poly([a + n * 7, b + n * 7, b - n * 7, a - n * 7], closed=True, w=1.0)
    for x, y in ((90, 80), (700, 60), (740, 180), (60, 200), (660, 110)):
        sk.circle(x, y, 3, w=0.8, accent=True)


def treasure_ship(sk):
    sk.spline([(100, 400), (170, 500), (300, 540), (520, 545), (660, 520), (730, 380)], w=1.6)
    sk.spline([(100, 400), (300, 440), (520, 440), (730, 380)], w=1.2)
    sk.spline([(130, 440), (300, 480), (520, 482), (700, 440)], w=0.5)
    sk.poly([(590, 438), (590, 350), (730, 330), (730, 380)], w=1.2)
    for x in (610, 640, 670, 700):
        sk.rect(x, 360, 16, 18, w=0.6)
    for mx, top, sw in ((170, 170, 70), (290, 90, 95), (410, 70, 105), (520, 110, 90), (640, 200, 60)):
        sk.line(mx, 440, mx, top - 20, w=1.1)
        sk.poly([(mx, top - 20), (mx + 24, top - 12), (mx, top - 4)], closed=True, w=0.9, accent=True)
        bottom = 400
        sail = [(mx - sw * 0.6, top), (mx + sw * 0.5, top + 8), (mx + sw * 0.6, bottom), (mx - sw * 0.7, bottom)]
        sk.poly(sail, closed=True, w=1.1)
        for t in np.linspace(0.12, 0.9, 6):
            a = np.array(sail[0]) + (np.array(sail[3]) - np.array(sail[0])) * t
            b = np.array(sail[1]) + (np.array(sail[2]) - np.array(sail[1])) * t
            sk.bez(a, a + (b - a) * 0.33 + [0, 5], a + (b - a) * 0.66 + [0, 5], b, n=12, w=0.5)
    sk.line(100, 400, 40, 370, w=0.9)
    waves(sk, 560, 680, rows=4, seed=3)


def palace(sk):
    tiers = [((90, 650), (710, 650), (120, 600), (680, 600)), ((140, 600), (660, 600), (160, 555), (640, 555)),
             ((180, 555), (620, 555), (200, 510), (600, 510))]
    for (a, b, c, d) in tiers:
        sk.poly([a, c, d, b], w=1.2)
        sk.line(c[0], c[1] - 12, d[0], d[1] - 12, w=0.6)
        for x in np.arange(c[0], d[0] + 1, 18):
            sk.line(x, c[1], x, c[1] - 12, w=0.5)
    sk.poly([(355, 650), (380, 510)], w=1.0)
    sk.poly([(445, 650), (420, 510)], w=1.0)
    for y in np.linspace(520, 640, 12):
        f = (650 - y) / 140
        sk.line(355 + 25 * f, y, 445 - 25 * f, y, w=0.4)
    sk.rect(385, 560, 30, 70, w=0.5, accent=True)
    hall(sk, 400, 510, 400, 120, roofs=2, cols=11)


def herb(sk):
    rng = np.random.default_rng(37)
    sk.line(300, 600, 780, 600, w=0.9)
    stem = catmull([(470, 600), (455, 480), (480, 360), (460, 240), (470, 160)], n=14)
    sk.poly(stem, w=1.4)
    for i, t in enumerate(np.linspace(0.12, 0.8, 7)):
        p = stem[int(t * (len(stem) - 1))]
        s = 1 if i % 2 else -1
        L = 130 - 60 * t
        ang = math.radians(-35 if s > 0 else -145) + (rng.random() - 0.5) * 0.3
        tip = p + L * np.array([math.cos(ang), math.sin(ang)])
        nrm = np.array([-math.sin(ang), math.cos(ang)]) * L * 0.25
        sk.bez(p, p + (tip - p) * 0.3 + nrm, p + (tip - p) * 0.7 + nrm, tip, w=1.0)
        sk.bez(p, p + (tip - p) * 0.3 - nrm, p + (tip - p) * 0.7 - nrm, tip, w=1.0)
        sk.line(*p, *tip, w=0.4)
        for f in (0.3, 0.5, 0.7):
            q = p + (tip - p) * f
            sk.line(*q, *(q + (tip - p) * 0.12 + nrm * 0.5), w=0.3)
    fx, fy = 470, 140
    for a in np.arange(0, 360, 40):
        sk.ellipse(fx + 26 * math.cos(math.radians(a)), fy + 26 * math.sin(math.radians(a)), 20, 9, rot=a, w=0.9,
                   accent=True)
    sk.circle(fx, fy, 10, w=1.0, accent=True)
    for _ in range(12):
        x0 = 470 + rng.uniform(-10, 10)
        pts = [(x0, 600)]
        x, y = x0, 600
        for _ in range(4):
            x += rng.uniform(-30, 30)
            y += rng.uniform(15, 25)
            pts.append((x, y))
        sk.spline(pts, w=0.6)
    sk.poly([(60, 560), (220, 540), (232, 660), (70, 680)], closed=True, w=1.0)
    sk.poly([(232, 660), (380, 640), (372, 520), (220, 540)], w=1.0)
    for x in range(90, 210, 24):
        glyph(sk, x, 600, 60, rng, w=0.5)
    sk.text(260, 560, "本草", size=24, accent=True)


def water_wheel(sk):
    cx, cy, R = 360, 330, 220
    sk.circle(cx, cy, R, w=1.4)
    sk.circle(cx, cy, R - 16, w=0.8)
    sk.circle(cx, cy, 34, w=1.1)
    sk.circle(cx, cy, 14, w=0.8)
    for a in np.arange(0, 360, 22.5):
        ra = math.radians(a)
        sk.line(cx + 34 * math.cos(ra), cy + 34 * math.sin(ra), cx + (R - 16) * math.cos(ra), cy + (R - 16) * math.sin(ra),
                w=0.6)
        p = np.array([cx + R * math.cos(ra), cy + R * math.sin(ra)])
        d = np.array([math.cos(ra), math.sin(ra)])
        t = np.array([-d[1], d[0]])
        sk.poly([p, p + d * 26], w=0.9)
        q = p + t * 14
        sk.poly([q - d * 4, q + d * 18, q + d * 18 + t * 12, q - d * 4 + t * 12], closed=True, w=0.6, accent=True)
    sk.line(300, 680, cx, cy, w=1.3)
    sk.line(420, 680, cx, cy, w=1.3)
    sk.line(320, 600, 400, 600, w=0.8)
    sk.poly([(470, 110), (790, 160)], w=1.2)
    sk.poly([(470, 130), (790, 180)], w=1.2)
    sk.line(700, 150, 700, 690, w=0.9)
    for k in range(4):
        sk.line(470 + k * 6, 95, 474 + k * 6, 130, w=0.5, accent=True)
    sk.line(0, 520, 800, 520, w=0.9)
    waves(sk, 560, 680, rows=3, seed=8, w=0.6)


def siku(sk):
    for x0, y0, wd, ht in ((80, 120, 280, 500), (420, 150, 260, 470)):
        sk.rect(x0, y0, wd, ht, w=1.4)
        sk.poly([(x0 + wd, y0), (x0 + wd + 34, y0 - 24), (x0 + wd + 34, y0 + ht - 24), (x0 + wd, y0 + ht)], w=1.0)
        sk.poly([(x0, y0), (x0 + 34, y0 - 24), (x0 + wd + 34, y0 - 24)], w=1.0)
        shelves = np.linspace(y0 + 10, y0 + ht - 10, 6)
        for a, b in zip(shelves, shelves[1:]):
            sk.line(x0 + 8, b, x0 + wd - 8, b, w=0.8)
            for k in range(4):
                bx = x0 + 14 + k * (wd - 28) / 4
                bw = (wd - 28) / 4 - 8
                sk.rect(bx, a + 8, bw, b - a - 12, w=0.7)
                sk.rect(bx + bw / 2 - 6, a + 16, 12, (b - a) * 0.5, w=0.5, accent=True)
    for i in range(5):
        y = 660 - i * 14
        sk.rect(700 - i * 3, y, 90, 12, w=0.8)
        for k in range(4):
            sk.circle(706 - i * 3, y + 3 + k * 2, 0.8, w=0.4)


def ships_1840(sk):
    rng = np.random.default_rng(41)
    for x0, y0, s in ((80, 460, 1.0), (470, 400, 0.6)):
        sk.spline([(x0, y0), (x0 + 60 * s, y0 + 50 * s), (x0 + 300 * s, y0 + 55 * s), (x0 + 380 * s, y0 - 5 * s)],
                  w=1.4 * s + 0.2)
        sk.line(x0, y0, x0 + 380 * s, y0 - 5 * s, w=1.0)
        for k in range(8):
            sk.rect(x0 + (50 + k * 38) * s, y0 + 12 * s, 12 * s, 9 * s, w=0.5)
        sk.line(x0, y0, x0 - 80 * s, y0 - 40 * s, w=0.8)
        for m, mx in enumerate((90, 190, 290)):
            X = x0 + mx * s
            top = y0 - (330 - m * 30 * (m % 2)) * s
            sk.line(X, y0, X, top, w=1.0)
            for j in range(3):
                yy = top + 30 * s + j * 85 * s
                hw = (48 + j * 12) * s
                sk.spline([(X - hw, yy), (X - hw * 1.05, yy + 34 * s), (X - hw * 0.95, yy + 66 * s)], w=0.8)
                sk.spline([(X + hw, yy), (X + hw * 1.05, yy + 34 * s), (X + hw * 0.95, yy + 66 * s)], w=0.8)
                sk.line(X - hw, yy, X + hw, yy, w=0.9)
                sk.arc(X, yy + 66 * s, hw * 0.95, 8 * s, 0, 180, w=0.7)
            sk.line(X - 80 * s, y0, X, top + 10 * s, w=0.3)
    for _ in range(4):
        x, y = rng.uniform(80, 700), rng.uniform(40, 150)
        for r in (30, 20, 10):
            sk.arc(x, y, r * 1.6, r, 180, 520, w=0.5)
    waves(sk, 540, 690, rows=5, seed=6, w=0.9)


def gate_1911(sk):
    cx, cy = 400, 330
    sk.arc(cx, cy, 150, 150, 180, 360, w=1.2, accent=True)
    for a in np.arange(186, 356, 10):
        ra = math.radians(a)
        sk.line(cx + 172 * math.cos(ra), cy + 172 * math.sin(ra), cx + 330 * math.cos(ra), cy + 330 * math.sin(ra), w=0.6,
                accent=True)
    sk.rect(30, 430, 740, 150, w=1.4)
    for k in range(24):
        sk.rect(34 + k * 31, 414, 18, 16, w=0.8)
    for y in range(452, 580, 22):
        sk.line(30, y, 330, y, w=0.3)
        sk.line(470, y, 770, y, w=0.3)
    sk.poly([(350, 580), (350, 500)] + [(400 + 50 * math.cos(a), 500 - 50 * math.sin(a))
                                         for a in np.linspace(math.pi, 0, 16)] + [(450, 580)], w=1.3)
    hall(sk, 400, 430, 270, 70, roofs=2, cols=7)
    sk.line(0, 620, 800, 620, w=0.8)


def huabiao(sk):
    cx = 400
    for a in np.arange(200, 341, 12):
        ra = math.radians(a)
        sk.line(cx + 170 * math.cos(ra), 300 + 170 * math.sin(ra), cx + 330 * math.cos(ra), 300 + 330 * math.sin(ra),
                w=0.6, accent=True)
    sk.line(cx - 30, 640, cx - 28, 190, w=1.5)
    sk.line(cx + 30, 640, cx + 28, 190, w=1.5)
    t = np.linspace(0, 1, 200)
    y = 620 - t * 400
    for ph in (0, math.pi):
        x = cx + 28 * np.sin(t * 5 * 2 * math.pi + ph)
        vis = np.cos(t * 5 * 2 * math.pi + ph) > 0
        pts = np.stack([x, y], 1)
        start = None
        for i, v in enumerate(vis):
            if v and start is None:
                start = i
            if (not v or i == len(vis) - 1) and start is not None:
                sk.poly(pts[start:i + 1], w=0.8)
                start = None
    for k in range(6):
        yy = 590 - k * 70
        sk.arc(cx - 8 + (k % 2) * 16, yy, 10, 8, 0, 300, w=0.6)
    sk.spline([(290, 262), (310, 240), (350, 250), (400, 236), (450, 250), (490, 240), (510, 262), (480, 270),
               (400, 258), (320, 270), (290, 262)], w=1.3)
    sk.arc(300, 250, 12, 10, 90, 380, w=0.8)
    sk.arc(500, 250, 12, 10, -200, 90, w=0.8)
    sk.ellipse(cx, 188, 62, 14, w=1.3)
    sk.ellipse(cx, 176, 62, 14, w=0.9)
    sk.spline([(cx - 20, 170), (cx - 22, 140), (cx - 6, 124), (cx + 12, 118), (cx + 20, 134), (cx + 18, 170)], w=1.1)
    sk.circle(cx + 10, 126, 3, w=0.6)
    sk.poly([(310, 640), (490, 640), (520, 682), (280, 682)], closed=True, w=1.3)
    sk.line(330, 640, 330, 682, w=0.5)
    sk.line(470, 640, 470, 682, w=0.5)
    for x in (160, 230, 570, 640):
        sk.line(x, 620, x, 690, w=0.9)
        sk.ellipse(x, 616, 6, 4, w=0.7)
    sk.line(160, 640, 230, 640, w=0.6)
    sk.line(570, 640, 640, 640, w=0.6)
    sk.line(160, 670, 230, 670, w=0.6)
    sk.line(570, 670, 640, 670, w=0.6)


def skyline(sk):
    rng = np.random.default_rng(43)
    sk.arc(560, 520, 110, 110, 180, 360, w=1.3, accent=True)
    base = 520
    x = 30
    while x < 760:
        w_ = rng.uniform(40, 80)
        h = rng.uniform(110, 360)
        if 480 < x < 640:
            h *= 0.5
        sk.rect(x, base - h, w_, h, w=1.0)
        for yy in np.arange(base - h + 14, base - 6, 18):
            sk.line(x + 7, yy, x + w_ - 7, yy, w=0.3)
        if rng.random() < 0.3:
            sk.line(x + w_ / 2, base - h, x + w_ / 2, base - h - 40, w=0.8)
        x += w_ + rng.uniform(4, 14)
    for mx, top in ((150, 60), (440, 100)):
        sk.line(mx - 8, base, mx - 8, top, w=0.9)
        sk.line(mx + 8, base, mx + 8, top, w=0.9)
        for yy in np.arange(top, base, 20):
            sk.line(mx - 8, yy, mx + 8, yy + 20, w=0.4)
        sk.line(mx - 60, top + 10, mx + 170, top + 10, w=1.0)
        sk.line(mx - 60, top + 22, mx + 170, top + 22, w=0.6)
        sk.line(mx, top - 30, mx + 170, top + 10, w=0.5)
        sk.line(mx, top - 30, mx - 60, top + 10, w=0.5)
        sk.line(mx + 130, top + 22, mx + 130, top + 120, w=0.4)
    sk.line(0, base, 800, base, w=1.2)
    sk.poly([(420, 600), (760, 600), (740, 640), (440, 640)], closed=True, w=1.2)
    for k in range(9):
        for j in range(2):
            sk.rect(450 + k * 32, 574 - j * 26, 30, 24, w=0.6, accent=(k + j) % 3 == 0)
    waves(sk, 620, 690, x0=0, x1=420, rows=2, seed=9, w=0.6)


def rocket(sk):
    rng = np.random.default_rng(47)
    cx = 480
    sk.rect(cx - 25, 240, 50, 330, w=1.4)
    sk.rect(cx - 30, 170, 60, 70, w=1.3)
    sk.poly([(cx - 30, 170), (cx - 14, 120), (cx + 14, 120), (cx + 30, 170)], w=1.3)
    sk.line(cx, 120, cx, 60, w=1.0)
    for y in (70, 90):
        sk.line(cx - 6, y + 10, cx, y, w=0.6)
        sk.line(cx + 6, y + 10, cx, y, w=0.6)
    for y in (300, 420, 500):
        sk.line(cx - 25, y, cx + 25, y, w=0.5)
    for s in (-1, 1):
        bx = cx + s * 43
        sk.rect(bx - 17, 340, 34, 230, w=1.2)
        sk.poly([(bx - 17, 340), (bx, 290), (bx + 17, 340)], w=1.2)
        sk.poly([(bx + s * 17, 540), (bx + s * 36, 575), (bx + s * 17, 575)], w=1.0)
    for x in (cx - 60, cx - 20, cx + 20, cx + 60):
        sk.poly([(x - 8, 570), (x - 12, 590), (x + 12, 590), (x + 8, 570)], w=0.9)
    for _ in range(16):
        x, y = rng.uniform(300, 660), rng.uniform(600, 690)
        r = rng.uniform(20, 46)
        sk.arc(x, y, r, r * 0.7, 180, 360, w=0.8)
    sk.line(200, 90, 200, 640, w=1.2)
    sk.line(270, 90, 270, 640, w=1.2)
    for y in range(90, 640, 55):
        sk.line(200, y, 270, y, w=0.7)
        sk.line(200, y, 270, y + 55, w=0.4)
        sk.line(270, y, 200, y + 55, w=0.4)
    for y in (200, 330, 460):
        sk.line(270, y, cx - 30, y, w=0.9)
        sk.line(270, y + 10, cx - 30, y + 10, w=0.5)
    sk.dash(catmull([(560, 60), (660, 90), (740, 170), (780, 280)]), w=0.8, accent=True)
    sk.circle(700, 115, 10, w=1.0, accent=True)
    for _ in range(12):
        sk.circle(rng.uniform(560, 790), rng.uniform(20, 300), 1.5, w=0.6)


ART = {f.__name__: f for f in [
    bone_flute, hemudu, painted_basin, jade_cong, jue, oracle_bone, ding, chime_stones, map_east, bamboo_slips,
    bell_set, dujiangyan, map_qin, great_wall, map_silk, paper, seismoscope, map_three, lanting, mogao, pi_circle,
    zhaozhou, map_canal, changan, tang_poem, sutra, movable_type, compass, ru_vase, linan, armillary, treasure_ship,
    palace, herb, water_wheel, siku, ships_1840, gate_1911, huabiao, skyline, rocket]}


def build_art(name):
    sk = Sk()
    ART[name](sk)
    return sk.items


# ---------------------------------------------------------------- 纹样（带状）

def sqspiral(sk, x, y, s, turns=2.5, w=0.8, flip=1):
    pts = [(x, y)]
    d = [(1, 0), (0, 1), (-1, 0), (0, -1)]
    L = s
    cx, cy = x, y
    for i in range(int(turns * 4)):
        dx, dy = d[i % 4]
        cx += dx * L * flip
        cy += dy * L
        pts.append((cx, cy))
        if i % 2 == 1:
            L *= 0.72
    sk.poly(pts, w=w)


def spiral(sk, cx, cy, r, turns=1.6, start=0.0, w=0.8, cw=1):
    a = np.linspace(0, turns * 2 * math.pi, int(40 * turns))
    rr = r * (1 - a / (turns * 2 * math.pi)) + 1
    sk.poly(np.stack([cx + rr * np.cos(start + cw * a), cy + rr * np.sin(start + cw * a)], 1), w=w)


def pattern(kind, t, width, h):
    """返回覆盖 width 的带状纹样折线；t∈[0,1] 为本卷内的演变进度。"""
    sk = Sk()
    cy = h / 2
    if kind == "caitao":
        tw = 110
        for ox in np.arange(-tw, width + tw, tw):
            spiral(sk, ox + 32, cy, h * 0.34, turns=1.5 + 0.5 * t, w=1.1)
            sk.bez((ox + 32, cy - h * 0.34), (ox + 60, cy - h * 0.5), (ox + 90, cy + h * 0.5), (ox + tw + 32, cy + h * 0.34),
                   w=1.0)
            sk.circle(ox + 82, cy - h * 0.2, 2.5, w=1.2)
            if t > 0.35:
                for k in range(4):
                    x = ox + k * tw / 4
                    sk.poly([(x, h * 0.96), (x + tw / 8, h * 0.78), (x + tw / 4, h * 0.96)], w=0.7)
            if t > 0.7:
                for k in range(3):
                    x = ox + 50 + k * 10
                    sk.line(x, h * 0.12, x + 10, h * 0.3, w=0.5)
                    sk.line(x + 10, h * 0.12, x, h * 0.3, w=0.5)
    elif kind == "taotie":
        tw = 150
        for ox in np.arange(-tw, width + tw, tw):
            c = ox + tw / 2
            if t < 0.3:
                for s in (-1, 1):
                    sk.ellipse(c + s * 20, cy, 8, 5, w=1.0)
                    sk.circle(c + s * 20, cy, 1.5, w=1.0)
                for k in range(6):
                    sk.circle(ox + 8 + k * 26, h * 0.14, 2, w=0.7)
                    sk.circle(ox + 8 + k * 26, h * 0.86, 2, w=0.7)
                sk.line(ox + 50, cy, ox + 10, cy, w=0.6)
                sk.line(ox + 100, cy, ox + 140, cy, w=0.6)
            elif t < 0.72:
                for s in (-1, 1):
                    sk.ellipse(c + s * 18, cy, 8, 5, w=1.1)
                    sk.circle(c + s * 18, cy, 1.6, w=1.0)
                    sk.spline([(c + s * 6, cy - 10), (c + s * 24, cy - 14), (c + s * 42, cy - 8), (c + s * 44, cy + 2)], w=0.9)
                    sk.spline([(c + s * 30, cy + 8), (c + s * 46, cy + 14), (c + s * 52, cy + h * 0.4)], w=0.8)
                    sk.arc(c + s * 52, cy - 8, 6, 6, 0, 300, w=0.7)
                    sqspiral(sk, c + s * 58, cy - 6, 9, turns=2, w=0.6, flip=-s)
                sk.line(c, cy - 14, c, cy + 12, w=0.9)
                sk.arc(c, cy + 13, 9, 4, 0, 180, w=0.8)
            else:
                x = np.linspace(ox, ox + tw, 60)
                for ph in (0, math.pi):
                    sk.poly(np.stack([x, cy + h * 0.28 * np.sin((x - ox) / tw * 2 * math.pi + ph)], 1), w=1.0)
                for k in range(2):
                    hx = ox + tw * (0.25 + 0.5 * k)
                    spiral(sk, hx, cy + (-1) ** k * h * 0.28, 6, turns=1.2, w=0.8)
                    sk.circle(hx + 8, cy + (-1) ** k * h * 0.28 - 3, 1.5, w=0.9)
                sqspiral(sk, ox + tw / 2 - 5, cy - 5, 9, turns=1.6, w=0.5)
    elif kind == "yunqi":
        tw = 170
        for ox in np.arange(-tw, width + tw, tw):
            sk.bez((ox + 10, cy + h * 0.28), (ox + 60, cy + h * 0.45), (ox + 110, cy - h * 0.45), (ox + tw - 10, cy - h * 0.28),
                   w=1.1)
            spiral(sk, ox + 18, cy + h * 0.16, h * 0.16, turns=1.3, start=math.pi / 2, w=0.9)
            spiral(sk, ox + tw - 18, cy - h * 0.16, h * 0.16, turns=1.3, start=-math.pi / 2, w=0.9)
            sk.bez((ox + 80, cy), (ox + 90, cy - h * 0.3), (ox + 110, cy - h * 0.4), (ox + 130, cy - h * 0.42), w=0.6)
            if t > 0.35:
                sk.bez((ox + 70, cy + 4), (ox + 60, cy + h * 0.35), (ox + 40, cy + h * 0.42), (ox + 26, cy + h * 0.44), w=0.5)
            if t > 0.75:
                lx = ox + tw / 2
                for a in (-60, -90, -120):
                    ra = math.radians(a)
                    sk.ellipse(lx + 8 * math.cos(ra), cy + h * 0.3 + 8 * math.sin(ra), 6, 3, rot=a, w=0.6)
    elif kind == "juancao":
        tw = 160
        for ox in np.arange(-tw, width + tw, tw):
            x = np.linspace(ox, ox + tw, 50)
            sk.poly(np.stack([x, cy + h * 0.18 * np.sin((x - ox) / tw * 2 * math.pi)], 1), w=1.1)
            for k, s in ((0.25, 1), (0.75, -1)):
                px = ox + tw * k
                py = cy - s * h * 0.18
                spiral(sk, px + 18, py + s * h * 0.2, h * 0.2, turns=1.1 + 0.6 * t, start=-s * math.pi / 2, w=0.9, cw=s)
                n_leaf = 2 + int(3 * t)
                for j in range(n_leaf):
                    a = math.radians(-s * (30 + j * 35))
                    sk.ellipse(px - 6 + 14 * math.cos(a), py + 14 * math.sin(a), 9, 3.5, rot=math.degrees(a), w=0.6)
    elif kind == "chanzhi":
        tw = 180
        for ox in np.arange(-tw, width + tw, tw):
            x = np.linspace(ox, ox + tw, 60)
            sk.poly(np.stack([x, cy + h * 0.3 * np.sin((x - ox) / tw * 2 * math.pi)], 1), w=1.0)
            for k, s in ((0.25, -1), (0.75, 1)):
                fx, fy = ox + tw * k, cy + s * h * 0.02
                sk.arc(fx, fy, h * 0.3, h * 0.3, 0, 330, w=0.7)
                npet = 6 + int(4 * t)
                for j in range(npet):
                    a = j * 360 / npet
                    ra = math.radians(a)
                    sk.ellipse(fx + h * 0.12 * math.cos(ra), fy + h * 0.12 * math.sin(ra), h * 0.1, h * 0.045, rot=a, w=0.6)
                if t > 0.5:
                    sk.circle(fx, fy, h * 0.2, w=0.4)
                sk.circle(fx, fy, h * 0.04, w=0.8)
            for k in (0.0, 0.5):
                lx = ox + tw * k
                sk.ellipse(lx + 8, cy - 6, 9, 3.5, rot=-40, w=0.6)
                sk.ellipse(lx - 8, cy + 6, 9, 3.5, rot=140, w=0.6)
    elif kind == "huiwen":
        u = h * 0.62
        tw = (u if t < 0.5 else u * 0.55) * 1.1
        rows = [(h * 0.19, 1)] if t < 0.5 else [(h * 0.05, 1), (h * 0.95, -1)]
        uu = u if t < 0.5 else u * 0.55
        for y0, s in rows:
            for ox in np.arange(-uu, width + uu, uu * 1.1):
                pts = [(ox, y0 + s * uu), (ox, y0), (ox + uu * 0.85, y0), (ox + uu * 0.85, y0 + s * uu * 0.72),
                       (ox + uu * 0.3, y0 + s * uu * 0.72), (ox + uu * 0.3, y0 + s * uu * 0.36), (ox + uu * 0.58, y0 + s * uu * 0.36)]
                sk.poly(pts, w=1.0)
                sk.line(ox, y0 + s * uu, ox + uu * 1.1, y0 + s * uu, w=1.0)
                if t > 0.8:
                    sk.poly(np.array(pts) + [uu * 0.08, s * uu * 0.08], w=0.4)
    return sk.items, tw
