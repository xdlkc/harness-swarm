"""逐帧渲染：宣纸白描 / 玄底泥金交替，HUD、书法词组、勾线动画、朱印冲击转场。

用法：
  python3 render.py --still 400 1234 ...   渲染若干静帧到 out/stills/
  python3 render.py --video [--jobs 4]      多进程分段编码并与 out/music.wav 合成 out/中华文明史.mp4
"""
import argparse
import bisect
import math
import os
import subprocess
import sys
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import art
import timeline as TL

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
W, H, FPS = TL.W, TL.H, TL.FPS

F_KAI = "/usr/share/fonts/truetype/arphic/ukai.ttc"
F_SERIF_B = ("/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", 2)
F_SERIF = ("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc", 2)

INK = (28, 25, 22)
GOLD = (214, 176, 100)
SEAL = (182, 38, 44)
PAPER = (238, 230, 212)
XUAN_BG = (236, 228, 209)
JIN_BG = (17, 15, 13)

ART_X, ART_Y = 880, 140
TOP_BAND = (230, 44, 1700, 92)
BOT_BAND = (120, 860, 1860, 902)
STRIP = (150, 934, 1450, 1026)
SEAL_HUD = (56, 34, 176, 174)
SEAL_BIG = (280, 322)
SEAL_CENTER = (960, 440)


@lru_cache(maxsize=None)
def font(kind, size):
    if kind == "kai":
        return ImageFont.truetype(F_KAI, size)
    path, idx = F_SERIF_B if kind == "serifb" else F_SERIF
    return ImageFont.truetype(path, size, index=idx)


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3


def scale_mask(m, a):
    if a >= 0.999:
        return m
    lut = [int(i * max(0.0, a)) for i in range(256)]
    return m.point(lut)


def lighten(c, k):
    return tuple(int(v + (255 - v) * k) for v in c)


def darken(c, k):
    return tuple(int(v * (1 - k)) for v in c)


class Film:
    def __init__(self):
        self.g = TL.build()
        errs = TL.validate(self.g)
        if errs:
            raise SystemExit("\n".join(errs))
        self.segs = self.g["segments"]
        self.starts = [s["start"] for s in self.segs]
        self.impacts = [s["start"] for s in self.segs if s["impact"]]
        self.total = self.g["total_frames"]
        self.knots_a = [TL.astro(k) for k in TL.KNOTS]
        self._bg = {}
        self._art = {}
        self._full = {}
        self._band = {}
        self._text = {}
        self._seal = {}
        self._wash = {}

    # ------------------------------------------------------------ 基础
    def seg_at(self, f):
        i = bisect.bisect_right(self.starts, f) - 1
        return self.segs[max(0, min(i, len(self.segs) - 1))]

    def vol(self, seg):
        return TL.VOLUMES[seg["vol"]]

    def colors(self, seg):
        c = self.vol(seg)["color"]
        if seg["style"] == "xuan":
            return dict(bg=XUAN_BG, ink=INK, accent=darken(c, 0.08), faint=(200, 188, 165), strip=(226, 214, 188))
        return dict(bg=JIN_BG, ink=GOLD, accent=lighten(c, 0.25), faint=(70, 60, 45), strip=(32, 28, 24))

    def background(self, style):
        if style in self._bg:
            return self._bg[style]
        rng = np.random.default_rng(1 if style == "xuan" else 2)
        low = Image.fromarray((rng.random((27, 48)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        low = np.asarray(low, np.float32) / 255 - 0.5
        yy, xx = np.mgrid[0:H, 0:W]
        vig = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2
        grain = rng.normal(0, 1, (H, W)).astype(np.float32)
        base = np.array(XUAN_BG if style == "xuan" else JIN_BG, np.float32)
        if style == "xuan":
            img = base + low[..., None] * 14 + grain[..., None] * 2.2 - vig[..., None] * 22
        else:
            img = base + low[..., None] * 8 + grain[..., None] * 1.6 - vig[..., None] * 10
        im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        d = ImageDraw.Draw(im, "RGBA")
        for _ in range(900 if style == "xuan" else 260):
            x, y = rng.uniform(0, W), rng.uniform(0, H)
            if style == "xuan":
                L = rng.uniform(6, 40)
                a = rng.uniform(0, math.pi)
                d.line([(x, y), (x + L * math.cos(a), y + L * math.sin(a) * 0.4)], fill=(150, 130, 100, 26), width=1)
            else:
                r = rng.uniform(0.6, 1.8)
                d.ellipse([x - r, y - r, x + r, y + r], fill=GOLD + (int(rng.uniform(30, 110)),))
        self._bg[style] = im
        return im

    # ------------------------------------------------------------ 勾线
    def art_items(self, name):
        if name not in self._art:
            items = art.build_art(name)
            lens = []
            for it in items:
                if it["t"] == "s":
                    lens.append(float(np.hypot(*np.diff(it["pts"], axis=0).T).sum()))
                else:
                    lens.append(60.0)
            self._art[name] = (items, np.array(lens), float(sum(lens)))
        return self._art[name]

    def raster_art(self, name, progress):
        """返回 (墨线 mask, 主色 mask)，1× 尺寸 800×700；按累计笔长勾出。"""
        if progress >= 1 and name in self._full:
            return self._full[name]
        items, lens, total = self.art_items(name)
        S = 2
        mi = Image.new("L", (art.ART_W * S, art.ART_H * S), 0)
        ma = Image.new("L", mi.size, 0)
        di, da = ImageDraw.Draw(mi), ImageDraw.Draw(ma)
        budget = progress * total
        for it, L in zip(items, lens):
            if budget <= 0:
                break
            d = da if it["a"] else di
            if it["t"] == "s":
                pts = it["pts"]
                if budget < L:
                    seg = np.hypot(*np.diff(pts, axis=0).T)
                    cum = np.concatenate([[0], np.cumsum(seg)])
                    k = int(np.searchsorted(cum, budget))
                    pts = pts[:max(2, k + 1)]
                wpx = max(2, int(round(2.5 * S * it["w"])))
                d.line([tuple(p) for p in (pts * S)], fill=255, width=wpx, joint="curve")
                r = wpx / 2
                for p in (pts[0] * S, pts[-1] * S):
                    d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)
            else:
                x, y = it["xy"]
                d.text((x * S, y * S), it["s"], font=font("serifb", it["size"] * S), fill=255)
            budget -= L
        res = (mi.reduce(S), ma.reduce(S))
        if progress >= 1:
            self._full[name] = res
        return res

    def wash(self, seg):
        key = (seg["vol"], seg["style"])
        if key not in self._wash:
            c = self.vol(seg)["color"]
            w, h = 1000, 880
            yy, xx = np.mgrid[0:h, 0:w]
            r = ((xx - w / 2) / (w * 0.42)) ** 2 + ((yy - h / 2) / (h * 0.42)) ** 2
            a = np.exp(-r * 2.2) * (0.13 if seg["style"] == "xuan" else 0.16)
            m = Image.fromarray((a * 255).astype(np.uint8))
            self._wash[key] = (m, c)
        return self._wash[key]

    # ------------------------------------------------------------ 纹样带
    def band(self, kind, t, width, h, lw=1.0):
        key = (kind, round(t, 2), width, h, lw)
        if key not in self._band:
            items, tw = art.pattern(kind, t, width + 400, h)
            S = 2
            m = Image.new("L", ((width + 400) * S, h * S), 0)
            d = ImageDraw.Draw(m)
            for it in items:
                pts = [tuple(p) for p in it["pts"] * S]
                d.line(pts, fill=255, width=max(2, int(round(2.0 * S * it["w"] * lw))), joint="curve")
            self._band[key] = (m.reduce(S), tw)
        return self._band[key]

    def draw_band(self, img, seg, f, box, col, edge, alpha=1.0):
        v = self.vol(seg)
        x0, y0, x1, y1 = box
        m, tw = self.band(v["pattern"], seg["pt"], x1 - x0, y1 - y0 - 10)
        off = int((f * 0.8) % tw)
        crop = m.crop((off, 0, off + x1 - x0, y1 - y0 - 10))
        img.paste(col, (x0, y0 + 5, x1, y1 - 5), scale_mask(crop, alpha))
        d = ImageDraw.Draw(img)
        for yy in (y0, y1):
            d.line([(x0, yy), (x1, yy)], fill=edge, width=2)
        d.line([(x0, y0 + 3), (x1, y0 + 3)], fill=edge, width=1)
        d.line([(x0, y1 - 3), (x1, y1 - 3)], fill=edge, width=1)

    # ------------------------------------------------------------ 文字
    def text_mask(self, s, kind, size, brush=False):
        key = (s, kind, size, brush)
        if key not in self._text:
            f = font(kind, size)
            bb = f.getbbox(s, stroke_width=3 if brush else 0)
            w, h = bb[2] - bb[0] + 16, bb[3] - bb[1] + 16
            m = Image.new("L", (w, h), 0)
            ImageDraw.Draw(m).text((8 - bb[0], 8 - bb[1]), s, font=f, fill=255,
                                   stroke_width=3 if brush else 0, stroke_fill=255)
            if brush:
                rng = np.random.default_rng(abs(hash(s)) % 2 ** 32)
                a = np.asarray(m, np.float32)
                streak = rng.random((h, max(4, w // 22))).astype(np.float32)
                streak = np.asarray(Image.fromarray((streak * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR),
                                    np.float32) / 255
                a *= 0.78 + 0.22 * streak
                m = Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
            self._text[key] = m
        return self._text[key]

    def put_text(self, img, s, kind, size, xy, col, alpha=1.0, anchor="lt", brush=False, zoom=1.0, glow=False):
        m = self.text_mask(s, kind, size, brush)
        if zoom != 1.0:
            m = m.resize((max(1, int(m.width * zoom)), max(1, int(m.height * zoom))), Image.BILINEAR)
        x, y = xy
        if anchor[0] == "m":
            x -= m.width // 2
        elif anchor[0] == "r":
            x -= m.width
        if anchor[1] == "m":
            y -= m.height // 2
        elif anchor[1] == "b":
            y -= m.height
        x, y = int(x), int(y)
        if glow:
            g = m.filter(ImageFilter.GaussianBlur(8))
            img.paste(col, (x, y, x + m.width, y + m.height), scale_mask(g, 0.45 * alpha))
        img.paste(col, (x, y, x + m.width, y + m.height), scale_mask(m, alpha))
        return m.width, m.height

    def vtext(self, img, s, kind, size, x, y, col, alpha=1.0, step=None):
        step = step or int(size * 1.12)
        for i, ch in enumerate(s):
            if ch in "·":
                continue
            self.put_text(img, ch, kind, size, (x, y + i * step), col, alpha, anchor="mt")

    # ------------------------------------------------------------ 朱印
    def seal_img(self, s):
        if s not in self._seal:
            w, h = 480, 552
            im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            d = ImageDraw.Draw(im)
            d.rounded_rectangle([6, 6, w - 6, h - 6], radius=26, fill=SEAL + (255,))
            d.rounded_rectangle([34, 34, w - 34, h - 34], radius=12, outline=PAPER + (255,), width=12)
            if len(s) == 1:
                f = font("serifb", 330)
                d.text((w / 2, h / 2 + 6), s, font=f, fill=PAPER + (255,), anchor="mm")
            else:
                f = font("serifb", 215)
                d.text((w / 2, h * 0.3), s[0], font=f, fill=PAPER + (255,), anchor="mm")
                d.text((w / 2, h * 0.72), s[1], font=f, fill=PAPER + (255,), anchor="mm")
            rng = np.random.default_rng(len(s) * 131 + ord(s[-1]))
            a = np.asarray(im.getchannel("A"), np.float32)
            noise = rng.random((h // 6, w // 6))
            noise = np.asarray(Image.fromarray((noise * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)) / 255.0
            fine = rng.random((h, w))
            a *= np.where((noise > 0.8) & (fine > 0.35), 0.35, 1.0) * np.where(fine > 0.985, 0.0, 1.0)
            im.putalpha(Image.fromarray(a.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
            self._seal[s] = im
        return self._seal[s]

    def put_seal(self, img, s, cx, cy, w, alpha=1.0, shadow=False):
        src = self.seal_img(s)
        h = int(w * src.height / src.width)
        im = src.resize((max(2, int(w)), max(2, h)), Image.LANCZOS)
        a = scale_mask(im.getchannel("A"), alpha)
        x, y = int(cx - w / 2), int(cy - h / 2)
        if shadow:
            sh = a.filter(ImageFilter.GaussianBlur(14))
            img.paste((0, 0, 0), (x + 10, y + 16, x + 10 + im.width, y + 16 + im.height), scale_mask(sh, 0.5))
        img.paste(im.convert("RGB"), (x, y), a)

    # ------------------------------------------------------------ 年份与时间尺
    def year_astro(self, f):
        seg = self.seg_at(f)
        a0, a1 = TL.astro(seg["year_from"]), TL.astro(seg["year_to"])
        span = seg["fpb"] * (4 if seg["kind"] == "end" else 1)
        x = ease((f - seg["start"]) / span)
        return a0 + (a1 - a0) * x

    def u_of(self, a):
        k = self.knots_a
        a = min(max(a, k[0]), k[-1])
        i = min(len(k) - 2, bisect.bisect_right(k, a) - 1)
        return i + (a - k[i]) / (k[i + 1] - k[i])

    def draw_timeline(self, img, f, seg, C, pulse):
        x0, y0, x1, y1 = STRIP
        sw, sh = x1 - x0, y1 - y0
        strip = Image.new("RGB", (sw, sh), C["strip"])
        d = ImageDraw.Draw(strip)
        ya = self.year_astro(f)
        uc = self.u_of(ya)
        PPV = 560
        mx = sw // 2
        steps = [1000, 200, 100, 50, 50, 50, 50, 50, 20]
        fsmall = font("serif", 17)
        for vi, v in enumerate(TL.VOLUMES):
            k0, k1 = TL.KNOTS[vi], TL.KNOTS[vi + 1]
            xa = mx + (vi - uc) * PPV
            xb = mx + (vi + 1 - uc) * PPV
            if xb < -50 or xa > sw + 50:
                continue
            col = v["color"] if seg["style"] == "xuan" else lighten(v["color"], 0.2)
            d.rectangle([xa, sh - 16, xb, sh - 6], fill=col)
            d.text(((xa + xb) / 2, sh - 20), "卷" + TL.NUMERALS[vi] + " " + "".join(v["title"]), font=fsmall,
                   fill=C["ink"], anchor="mb")
            st = steps[vi]
            y = math.ceil(k0 / st) * st
            while y < k1:
                if y != 0:
                    x = mx + self.u_of(TL.astro(y)) * PPV - uc * PPV
                    major = y == k0 or y % (st * 5) == 0
                    d.line([(x, 14), (x, 14 + (20 if major else 11))], fill=C["ink"], width=2 if major else 1)
                    if -40 < x < sw + 40:
                        d.text((x + 3, 30), TL.fmt_year_short(y), font=fsmall if major else ftiny, fill=C["ink"])
                y += st
            d.line([(xa, 4), (xa, sh - 4)], fill=SEAL, width=2)
            for s in v["shots"]:
                x = mx + self.u_of(TL.astro(s["year"])) * PPV - uc * PPV
                d.polygon([(x, 6), (x + 5, 11), (x, 16), (x - 5, 11)], fill=col)
        d.line([(0, 14), (sw, 14)], fill=C["ink"], width=1)
        pw = 11 + int(5 * pulse)
        d.polygon([(mx - pw, 0), (mx + pw, 0), (mx, pw + 4)], fill=SEAL)
        d.line([(mx, 0), (mx, sh)], fill=SEAL, width=2)
        img.paste(strip, (x0, y0))
        D = ImageDraw.Draw(img)
        D.line([(x0, y0), (x1, y0)], fill=C["ink"], width=2)
        D.line([(x0, y1), (x1, y1)], fill=C["ink"], width=2)
        wood = (118, 74, 38) if seg["style"] == "xuan" else GOLD
        for xr in (x0 - 18, x1 + 4):
            D.rounded_rectangle([xr, y0 - 16, xr + 14, y1 + 16], radius=6, fill=wood)
            D.rectangle([xr - 3, y0 - 24, xr + 17, y0 - 16], fill=wood)
            D.rectangle([xr - 3, y1 + 16, xr + 17, y1 + 24], fill=wood)
        yh = TL.hist(ya)
        pre, num = TL.fmt_year(yh)
        cx = 1500
        D.rectangle([cx, y0 - 8, 1880, y1 + 8], outline=C["ink"], width=2)
        D.rectangle([cx + 6, y0 - 2, 1874, y1 + 2], outline=C["accent"], width=1)
        self.put_text(img, pre, "serifb", 30, (cx + 20, (y0 + y1) // 2), SEAL, anchor="lm")
        self.put_text(img, f"{num}", "serifb", 66, (1820, (y0 + y1) // 2 - 4), C["ink"], anchor="rm")
        self.put_text(img, "年", "serifb", 30, (1830, (y0 + y1) // 2), C["ink"], anchor="lm")

    # ------------------------------------------------------------ 帧
    def dyn_of(self, seg):
        v = self.vol(seg)
        if seg["kind"] == "shot":
            return v["shots"][seg["shot"]]["dyn"]
        if seg["kind"] == "card":
            return v["shots"][0]["dyn"]
        if seg["kind"] == "open":
            return "序章"
        return "今"

    def render(self, f):
        seg = self.seg_at(f)
        C = self.colors(seg)
        img = self.background(seg["style"]).copy()
        lf = f - seg["start"]
        lb = lf / seg["fpb"]
        beat = int(lb)
        phase = lf % seg["fpb"]
        pulse = max(0.0, 1 - phase / 5)
        v = self.vol(seg)

        if seg["kind"] == "shot":
            self.draw_shot(img, seg, C, lf, lb)
        elif seg["kind"] == "card":
            self.draw_card(img, seg, C, f, lb)
        else:
            self.draw_title(img, seg, C, f, lb)

        # HUD
        self.draw_band(img, seg, f, TOP_BAND, C["accent"], C["ink"])
        self.draw_band(img, seg, -f, BOT_BAND, C["accent"], C["ink"])
        d = ImageDraw.Draw(img)
        d.line([(1745, 130), (1745, 840)], fill=C["accent"], width=2)
        d.polygon([(1745, 116), (1753, 126), (1745, 136), (1737, 126)], fill=SEAL)
        dyn = self.dyn_of(seg)
        prev = self.segs[seg["id"] - 1] if seg["id"] > 0 else None
        changed = prev is None or self.dyn_of(prev) != dyn
        da = ease(lf / 8) if changed else 1.0
        size = 64 if len(dyn) <= 5 else 54
        self.vtext(img, dyn, "serifb", size, 1812, 150, C["ink"], alpha=da)
        self.put_text(img, "朝代", "serif", 20, (1812, 118), C["accent"], anchor="mm")

        hide_seal = False
        for F in self.impacts:
            if F - 4 <= f < F:
                hide_seal = False
            if F <= f < F + int(seg["fpb"] * 1.5):
                hide_seal = True
        if not hide_seal:
            sc = 1 + 0.06 * pulse * (beat % 4 == 0)
            self.put_seal(img, seg["seal"], (SEAL_HUD[0] + SEAL_HUD[2]) / 2, (SEAL_HUD[1] + SEAL_HUD[3]) / 2,
                          (SEAL_HUD[2] - SEAL_HUD[0]) * sc)
        self.draw_timeline(img, f, seg, C, pulse)

        img = self.transition(img, f, seg, C)

        fade = 1.0
        if f < 24:
            fade = f / 24
        if seg["kind"] == "end":
            fade = 1 - ease((lb - 8) / 4)
        if f >= self.segs[-1]["end"]:
            fade = 0.0
        if fade < 1:
            img = Image.blend(Image.new("RGB", img.size, (0, 0, 0)), img, max(0.0, fade))
        return img

    def draw_shot(self, img, seg, C, lf, lb):
        v = self.vol(seg)
        s = v["shots"][seg["shot"]]
        wm, wc = self.wash(seg)
        img.paste(wc, (ART_X - 100, ART_Y - 90, ART_X - 100 + wm.width, ART_Y - 90 + wm.height), wm)
        p = ease(lb / 3.5)
        mi, ma = self.raster_art(s["art"], p)
        z = 1.0 + 0.035 * lb / seg["nbeats"]
        if z > 1.0005:
            nw, nh = int(mi.width * z), int(mi.height * z)
            ox, oy = (nw - mi.width) // 2, (nh - mi.height) // 2
            mi = mi.resize((nw, nh), Image.BILINEAR).crop((ox, oy, ox + art.ART_W, oy + art.ART_H))
            ma = ma.resize((nw, nh), Image.BILINEAR).crop((ox, oy, ox + art.ART_W, oy + art.ART_H))
        box = (ART_X, ART_Y, ART_X + art.ART_W, ART_Y + art.ART_H)
        if seg["style"] == "jin":
            glow = Image.merge("L", [mi]).filter(ImageFilter.GaussianBlur(5))
            img.paste(GOLD, box, scale_mask(glow, 0.5))
        img.paste(C["ink"], box, mi)
        img.paste(C["accent"], box, ma)

        groups = s["groups"]
        ys = [250, 450] if len(groups) == 2 else [330]
        size = 176
        for i, g in enumerate(groups):
            d = lf - (i + 1) * seg["fpb"]
            if d < 0:
                continue
            a = min(1.0, d / 5)
            zoom = 1 + 0.22 * (1 - ease_out(d / 7))
            x = 150 + (i * 90 if len(groups) == 2 else 0)
            m = self.text_mask(g, "kai", size, True)
            cx, cy = x + m.width / 2, ys[i] + m.height / 2
            self.put_text(img, g, "kai", size, (cx, cy), C["ink"], a, anchor="mm", brush=True, zoom=zoom,
                          glow=seg["style"] == "jin")
        dcap = lf - (len(groups) + 1) * seg["fpb"]
        if dcap >= 0:
            a = min(1.0, dcap / 8)
            y = 690 if len(groups) == 2 else 560
            d = ImageDraw.Draw(img)
            d.rectangle([150, y + 6, 162, y + 38], fill=SEAL)
            self.put_text(img, s["caption"], "serifb", 32, (178, y), C["accent"], a)
            self.put_text(img, f"{s['dyn']}", "serif", 26, (178, y + 50), C["ink"], a * 0.8)

    def draw_card(self, img, seg, C, f, lb):
        v = self.vol(seg)
        lf = f - seg["start"]
        m, tw = self.band(v["pattern"], seg["pt"], W, 260, lw=2.2)
        off = int((f * 1.2) % tw)
        img.paste(C["accent"], (0, 330, W, 590), scale_mask(m.crop((off, 0, off + W, 260)), 0.16))
        groups = v["title"]
        size = 230
        widths = [self.text_mask(g, "kai", size, True).width for g in groups]
        gap = 40
        x = W / 2 - (sum(widths) + gap * (len(groups) - 1)) / 2
        for i, g in enumerate(groups):
            d = lf - (i + 1) * seg["fpb"]
            if d >= 0:
                zoom = 1 + 0.25 * (1 - ease_out(d / 7))
                self.put_text(img, g, "kai", size, (x + widths[i] / 2, 450), C["ink"], min(1.0, d / 5), anchor="mm",
                              brush=True, zoom=zoom, glow=seg["style"] == "jin")
            x += widths[i] + gap
        d3 = lf - 3 * seg["fpb"]
        if len(groups) == 1:
            d3 = lf - 2 * seg["fpb"]
        if d3 >= 0:
            a = min(1.0, d3 / 6)
            self.put_text(img, f"卷{TL.NUMERALS[seg['vol']]} · {v['span']}", "serifb", 44, (W / 2, 650), C["accent"], a,
                          anchor="mm")
            self.put_text(img, f"{TL.MODES[v['mode']]}调式 · {v['instr']} · ♩= {TL.bpm_of(v['fpb']):.1f} · "
                               f"主色 {v['color_name']} · {v['pattern_name']}", "serif", 28, (W / 2, 720), C["ink"],
                          a * 0.85, anchor="mm")

    def draw_title(self, img, seg, C, f, lb):
        lf = f - seg["start"]
        v = self.vol(seg)
        m, tw = self.band(v["pattern"], seg["pt"], W, 260, lw=2.2)
        off = int((f * 1.2) % tw)
        img.paste(C["accent"], (0, 330, W, 590), scale_mask(m.crop((off, 0, off + W, 260)), 0.10))
        if seg["kind"] == "open":
            groups, beats, sub, sub2 = ["中华", "文明史"], [2, 4], "九卷编年 · 自贾湖骨笛至今", "五声为律 · 以拍为钟"
        else:
            groups, beats, sub, sub2 = ["生生", "不息"], [2, 4], "中华文明史 · 终", "地图均为示意 · 年代经核对"
        size = 250
        widths = [self.text_mask(g, "kai", size, True).width for g in groups]
        gap = 50
        x = W / 2 - (sum(widths) + gap) / 2
        for i, g in enumerate(groups):
            d = lf - beats[i] * seg["fpb"]
            if d >= 0:
                zoom = 1 + 0.25 * (1 - ease_out(d / 8))
                self.put_text(img, g, "kai", size, (x + widths[i] / 2, 450), C["ink"], min(1.0, d / 6), anchor="mm",
                              brush=True, zoom=zoom, glow=seg["style"] == "jin")
            x += widths[i] + gap
        for k, (txt, sz, col, y) in enumerate(((sub, 44, C["accent"], 660), (sub2, 30, C["ink"], 730))):
            d = lf - (5 + k) * seg["fpb"]
            if d >= 0:
                self.put_text(img, txt, "serifb" if k == 0 else "serif", sz, (W / 2, y), col, min(1.0, d / 8), anchor="mm")

    # ------------------------------------------------------------ 冲击转场
    def transition(self, img, f, seg, C):
        for F in self.impacts:
            d = f - F
            if -4 <= d < 0:
                nxt = self.seg_at(F)
                s = {-4: 3.0, -3: 2.2, -2: 1.6, -1: 1.18}[d]
                self.put_seal(img, nxt["seal"], SEAL_CENTER[0], SEAL_CENTER[1], SEAL_BIG[0] * s, alpha=0.45 + 0.13 * (4 + d),
                              shadow=True)
                return img
            fpb = seg["fpb"]
            if 0 <= d < int(fpb * 1.5):
                if d < fpb:
                    self.splash(img, F, d / fpb)
                    self.put_seal(img, seg["seal"], SEAL_CENTER[0], SEAL_CENTER[1], SEAL_BIG[0] * (1 - 0.03 * math.exp(-d / 2)),
                                  shadow=True)
                else:
                    t = ease((d - fpb) / (fpb * 0.5))
                    hx, hy = (SEAL_HUD[0] + SEAL_HUD[2]) / 2, (SEAL_HUD[1] + SEAL_HUD[3]) / 2
                    x = SEAL_CENTER[0] + (hx - SEAL_CENTER[0]) * t
                    y = SEAL_CENTER[1] + (hy - SEAL_CENTER[1]) * t
                    w = SEAL_BIG[0] + (SEAL_HUD[2] - SEAL_HUD[0] - SEAL_BIG[0]) * t
                    self.put_seal(img, seg["seal"], x, y, w, shadow=t < 0.9)
                if d < 6:
                    fl = 0.55 * math.exp(-d / 1.6)
                    flash = (255, 244, 225) if seg["style"] == "xuan" else (255, 210, 170)
                    img = Image.blend(img, Image.new("RGB", img.size, flash), fl)
                if d < 12:
                    A = 22 * math.exp(-d / 3.5)
                    dx = int(A * math.sin(d * 2.3))
                    dy = int(A * math.cos(d * 3.1))
                    arr = np.asarray(img)
                    arr = np.roll(np.roll(arr, dx, axis=1), dy, axis=0)
                    img = Image.fromarray(arr)
                return img
        return img

    def splash(self, img, F, t):
        rng = np.random.default_rng(F)
        d = ImageDraw.Draw(img, "RGBA")
        a = int(200 * (1 - t))
        cx, cy = SEAL_CENTER
        for _ in range(70):
            ang = rng.uniform(0, 2 * math.pi)
            r0 = rng.uniform(170, 330) * (1 + 0.25 * ease_out(t))
            r = rng.uniform(2, 11) * (1 - 0.3 * t)
            x, y = cx + r0 * math.cos(ang), cy + r0 * math.sin(ang) * 0.85
            d.ellipse([x - r, y - r, x + r, y + r], fill=SEAL + (a,))
        for _ in range(16):
            ang = rng.uniform(0, 2 * math.pi)
            r0, r1 = 180, 180 + rng.uniform(60, 200) * ease_out(min(1, t * 3))
            d.line([(cx + r0 * math.cos(ang), cy + r0 * math.sin(ang)), (cx + r1 * math.cos(ang), cy + r1 * math.sin(ang))],
                   fill=SEAL + (a,), width=int(rng.uniform(2, 6)))


# ------------------------------------------------------------ 输出

_film = None


def _render_chunk(args):
    idx, a, b, path = args
    global _film
    if _film is None:
        _film = Film()
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-g", "60", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(a, b):
        p.stdin.write(_film.render(f).tobytes())
        if (f - a) % 300 == 0:
            print(f"  块{idx}: {f - a}/{b - a}", flush=True)
    p.stdin.close()
    p.wait()
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--still", type=int, nargs="*")
    ap.add_argument("--video", action="store_true")
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--range", type=int, nargs=2)
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if args.still is not None:
        film = Film()
        os.makedirs(os.path.join(OUT, "stills"), exist_ok=True)
        for f in args.still:
            film.render(f).save(os.path.join(OUT, "stills", f"f{f:05d}.png"))
            print("静帧", f)
        return
    if args.video:
        film = Film()
        a, b = args.range if args.range else (0, film.total)
        n = args.jobs * 3
        bounds = np.linspace(a, b, n + 1).astype(int)
        chunks = [(i, bounds[i], bounds[i + 1], os.path.join(OUT, f"chunk_{i:02d}.mp4")) for i in range(n)]
        with Pool(args.jobs) as pool:
            paths = pool.map(_render_chunk, chunks, chunksize=1)
        lst = os.path.join(OUT, "chunks.txt")
        with open(lst, "w") as fh:
            for p in paths:
                fh.write(f"file '{p}'\n")
        silent = os.path.join(OUT, "video_silent.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent],
                       check=True)
        music = os.path.join(OUT, "music.wav")
        final = os.path.join(OUT, "中华文明史.mp4")
        if os.path.exists(music):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", music, "-map", "0:v", "-map", "1:a",
                            "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", final], check=True)
            print("完成：", final)
        else:
            print("未找到 music.wav，仅输出无声视频：", silent)


if __name__ == "__main__":
    main()
