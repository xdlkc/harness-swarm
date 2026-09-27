"""全片数据、拍点网格、分镜表与年代校验。

拍点即时钟：每卷取整数「帧/拍」，BPM = 60*FPS/帧每拍，
因此每一拍、每一个切点都精确落在整帧上，音频按帧换算到采样点。
"""
import json
import os
import sys

FPS = 30
SR = 44100
W, H = 1920, 1080
SPF = SR // FPS  # 每帧 1470 个采样点
assert SR % FPS == 0

SHOT_BEATS = 8
CARD_BEATS = 4
OPEN_BEATS = 8
END_BEATS = 12
TAIL_FRAMES = 60

NUMERALS = "一二三四五六七八九"
MODES = ["宫", "商", "角", "徵", "羽"]

# 朝代（时期）起止，负数为公元前，用于校验每镜年份
DYNASTY_RANGES = {
    "新石器时代": (-10000, -2070),
    "夏": (-2070, -1600),
    "商": (-1600, -1046),
    "西周": (-1046, -771),
    "春秋": (-770, -476),
    "战国": (-475, -221),
    "秦": (-221, -207),
    "西汉": (-202, 8),
    "东汉": (25, 220),
    "三国": (220, 280),
    "东晋": (317, 420),
    "前秦": (351, 394),
    "南朝宋": (420, 479),
    "隋": (581, 618),
    "唐": (618, 907),
    "北宋": (960, 1127),
    "南宋": (1127, 1279),
    "元": (1271, 1368),
    "明": (1368, 1644),
    "清": (1644, 1912),
    "中华人民共和国": (1949, 9999),
}


def S(art, dyn, year, groups, caption, basis, approx=False):
    return dict(art=art, dyn=dyn, year=year, groups=groups, caption=caption,
                basis=basis, approx=approx)


VOLUMES = [
    dict(title=["文明", "曙光"], span="约前7000 — 前2070", knot=-7000, fpb=30, mode=4,
         instr="骨笛 · 陶埙 · 石磬", color=(160, 82, 45), color_name="赭石",
         pattern="caitao", pattern_name="彩陶纹", pt=(0.0, 1.0), shots=[
             S("bone_flute", "新石器时代", -7000, ["贾湖", "骨笛"], "约公元前7000年 · 河南舞阳贾湖",
               "贾湖遗址约前7000—前5800年，出土七孔骨笛", True),
             S("hemudu", "新石器时代", -5000, ["河姆渡", "稻作"], "约公元前5000年 · 浙江余姚",
               "河姆渡文化约前5000—前3300年，干栏式建筑与稻作遗存", True),
             S("painted_basin", "新石器时代", -4500, ["仰韶", "彩陶"], "约公元前4500年 · 半坡鱼纹彩陶盆",
               "仰韶文化约前5000—前3000年，半坡类型约前4800—前4300年", True),
             S("jade_cong", "新石器时代", -3000, ["良渚", "玉琮"], "约公元前3000年 · 浙江余杭",
               "良渚文化约前3300—前2300年", True),
         ]),
    dict(title=["夏商", "西周"], span="约前2070 — 前771", knot=-2070, fpb=28, mode=1,
         instr="编钟 · 石磬 · 鼓", color=(62, 122, 107), color_name="青铜",
         pattern="taotie", pattern_name="饕餮纹", pt=(0.0, 0.6), shots=[
             S("jue", "夏", -1750, ["二里头", "青铜爵"], "二里头遗址 · 约前1750—前1530年",
               "二里头文化约前1750—前1530年（新测年），出土早期青铜爵", True),
             S("oracle_bone", "商", -1250, ["甲骨", "文字"], "殷墟 · 约前1250—前1046年",
               "殷墟甲骨文自武丁时期起，约前1250年", True),
             S("ding", "商", -1200, ["后母戊", "鼎"], "商代晚期 · 河南安阳",
               "后母戊鼎为商代晚期（约前13—前12世纪）器物", True),
             S("chime_stones", "西周", -1046, ["制礼", "作乐"], "公元前1046年 · 周代商",
               "夏商周断代工程定武王克商为前1046年"),
         ]),
    dict(title=["春秋", "战国"], span="前770 — 前221", knot=-770, fpb=26, mode=2,
         instr="编钟 · 古琴 · 建鼓", color=(31, 94, 140), color_name="石青",
         pattern="taotie", pattern_name="饕餮纹 → 蟠螭纹", pt=(0.6, 1.0), shots=[
             S("map_east", "春秋", -770, ["平王", "东迁"], "公元前770年 · 镐京迁都洛邑（示意）",
               "周平王东迁洛邑，前770年，春秋时期开始"),
             S("bamboo_slips", "春秋", -500, ["诸子", "百家"], "约公元前6世纪起 · 百家争鸣",
               "孔子生于前551年、卒于前479年，诸子之学兴于春秋末至战国", True),
             S("bell_set", "战国", -433, ["曾侯乙", "编钟"], "约公元前433年 · 湖北随州",
               "曾侯乙墓下葬约前433年，出土六十五件编钟", True),
             S("dujiangyan", "战国", -256, ["都江堰"], "约公元前256年 · 蜀郡守李冰",
               "都江堰约建于秦昭王末年，前256年前后", True),
         ]),
    dict(title=["秦汉"], span="前221 — 220", knot=-221, fpb=24, mode=0,
         instr="古琴 · 箫 · 大鼓", color=(139, 46, 31), color_name="玄赤",
         pattern="yunqi", pattern_name="云气纹", pt=(0.0, 0.7), shots=[
             S("map_qin", "秦", -221, ["书同文", "车同轨"], "公元前221年 · 秦统一六国（示意）",
               "秦王政二十六年，前221年统一"),
             S("great_wall", "秦", -214, ["万里", "长城"], "约公元前214年 · 连缀诸国长城",
               "秦统一后遣蒙恬北击匈奴，约前215—前214年起筑长城", True),
             S("map_silk", "西汉", -138, ["丝绸", "之路"], "公元前138年 · 张骞出使西域（示意）",
               "建元三年（前138年）张骞首次出使西域"),
             S("paper", "东汉", 105, ["蔡伦", "造纸"], "公元105年 · 元兴元年",
               "《后汉书》载蔡伦于元兴元年（105年）奏上所造纸"),
             S("seismoscope", "东汉", 132, ["候风", "地动仪"], "公元132年 · 阳嘉元年 · 张衡",
               "张衡于阳嘉元年（132年）制候风地动仪"),
         ]),
    dict(title=["魏晋", "南北朝"], span="220 — 589", knot=220, fpb=22, mode=4,
         instr="古琴 · 阮 · 箫", color=(94, 140, 127), color_name="青瓷",
         pattern="yunqi", pattern_name="云气纹 → 忍冬", pt=(0.7, 1.0), shots=[
             S("map_three", "三国", 220, ["三国", "鼎立"], "公元220年 · 魏蜀吴（示意）",
               "220年曹丕代汉，三国时期至280年"),
             S("lanting", "东晋", 353, ["兰亭", "集序"], "公元353年 · 永和九年 · 会稽山阴",
               "王羲之《兰亭集序》作于永和九年（353年）"),
             S("mogao", "前秦", 366, ["莫高窟"], "公元366年 · 前秦建元二年 · 敦煌",
               "据唐《李君莫高窟佛龛碑》，乐僔于前秦建元二年（366年）始凿"),
             S("pi_circle", "南朝宋", 462, ["圆周率"], "公元462年 · 祖冲之《大明历》",
               "祖冲之于大明六年（462年）上《大明历》，推得π在3.1415926与3.1415927之间"),
         ]),
    dict(title=["隋唐", "五代"], span="581 — 960", knot=581, fpb=20, mode=3,
         instr="琵琶 · 横笛 · 羯鼓", color=(200, 145, 46), color_name="赤金",
         pattern="juancao", pattern_name="卷草纹", pt=(0.0, 1.0), shots=[
             S("zhaozhou", "隋", 595, ["赵州桥"], "约公元595—605年 · 李春",
               "赵州桥（安济桥）建于隋开皇末至大业初，约595—605年", True),
             S("map_canal", "隋", 605, ["大运河"], "公元605年 · 开通济渠（示意）",
               "隋炀帝大业元年（605年）开通济渠"),
             S("changan", "唐", 640, ["长安", "万国"], "唐长安城 · 一百零八坊（示意）",
               "唐长安城沿隋大兴城格局，通常记为一百零八坊；年份取贞观年间", True),
             S("tang_poem", "唐", 713, ["盛唐", "诗歌"], "公元713年 · 开元元年",
               "唐玄宗改元开元，713年"),
             S("sutra", "唐", 868, ["金刚经"], "公元868年 · 咸通九年 · 雕版印刷",
               "敦煌藏经洞《金刚经》题记咸通九年（868年）"),
         ]),
    dict(title=["宋元"], span="960 — 1368", knot=960, fpb=18, mode=1,
         instr="古筝 · 笛 · 拍板", color=(123, 163, 168), color_name="天青",
         pattern="chanzhi", pattern_name="缠枝纹", pt=(0.0, 1.0), shots=[
             S("movable_type", "北宋", 1045, ["活字", "印刷"], "庆历年间（1041—1048年） · 毕昇",
               "《梦溪笔谈》记庆历中毕昇为活版", True),
             S("compass", "北宋", 1088, ["指南针"], "约公元1088年 · 《梦溪笔谈》",
               "沈括《梦溪笔谈》成书约1086—1093年，记磁针水浮、缕悬诸法", True),
             S("ru_vase", "北宋", 1100, ["汝窑", "天青"], "北宋晚期 · 约1086—1125年",
               "汝窑为宫廷烧造青瓷约在北宋哲宗至徽宗时期", True),
             S("linan", "南宋", 1138, ["临安", "西湖"], "公元1138年 · 绍兴八年定都临安",
               "南宋绍兴八年（1138年）定临安为行在"),
             S("armillary", "元", 1281, ["授时历"], "公元1281年 · 至元十八年 · 郭守敬",
               "《授时历》于至元十八年（1281年）颁行"),
         ]),
    dict(title=["明清"], span="1368 — 1912", knot=1368, fpb=16, mode=3,
         instr="二胡 · 琵琶 · 锣鼓", color=(31, 58, 147), color_name="青花",
         pattern="huiwen", pattern_name="回纹", pt=(0.0, 0.5), shots=[
             S("treasure_ship", "明", 1405, ["郑和", "下西洋"], "公元1405年 · 永乐三年",
               "郑和首次下西洋，永乐三年（1405年）"),
             S("palace", "明", 1420, ["紫禁城"], "公元1420年 · 永乐十八年建成",
               "北京宫殿于永乐十八年（1420年）建成"),
             S("herb", "明", 1578, ["本草", "纲目"], "公元1578年 · 万历六年 · 李时珍",
               "《本草纲目》于万历六年（1578年）成书"),
             S("water_wheel", "明", 1637, ["天工", "开物"], "公元1637年 · 崇祯十年 · 宋应星",
               "《天工开物》初刊于崇祯十年（1637年）"),
             S("siku", "清", 1782, ["四库", "全书"], "公元1782年 · 乾隆四十七年",
               "第一部《四库全书》于乾隆四十七年（1782年）缮成"),
         ]),
    dict(title=["近代", "现代"], span="1840 — 今", knot=1840, fpb=15, mode=0,
         instr="管弦乐 · 定音鼓 · 编钟", color=(192, 40, 45), color_name="中国红",
         pattern="huiwen", pattern_name="回纹（复合）", pt=(0.5, 1.0), shots=[
             S("ships_1840", "清", 1840, ["鸦片", "战争"], "公元1840年 · 中国近代史开端",
               "第一次鸦片战争1840年爆发，通常作为中国近代史开端"),
             S("gate_1911", "清", 1911, ["辛亥", "革命"], "公元1911年 · 帝制终结",
               "辛亥革命1911年爆发，1912年清帝退位"),
             S("huabiao", "中华人民共和国", 1949, ["中华人民", "共和国"], "公元1949年 · 成立",
               "中华人民共和国1949年10月1日成立"),
             S("skyline", "中华人民共和国", 1978, ["改革", "开放"], "公元1978年 · 十一届三中全会",
               "1978年12月中共十一届三中全会作出改革开放决策"),
             S("rocket", "中华人民共和国", 2003, ["神舟", "五号"], "公元2003年 · 首次载人航天",
               "2003年10月15日神舟五号载人飞船发射"),
         ]),
]
END_YEAR = 2026
KNOTS = [v["knot"] for v in VOLUMES] + [END_YEAR]


def bpm_of(fpb):
    return 60.0 * FPS / fpb


def astro(y):
    """历史纪年（无公元0年）→ 天文纪年，便于连续插值。"""
    return y + 1 if y < 0 else y


def hist(a):
    a = int(round(a))
    return a - 1 if a <= 0 else a


def fmt_year(y):
    return ("公元前", -y) if y < 0 else ("公元", y)


def fmt_year_short(y):
    return f"前{-y}" if y < 0 else f"{y}"


def build():
    segs = []
    frame = 0
    counter = [0]

    def add(kind, vi, nbeats, shot=None, impact=False, seal="", year_to=None):
        v = VOLUMES[vi]
        fpb = v["fpb"]
        seg = dict(id=len(segs), kind=kind, vol=vi, shot=shot, start=frame, fpb=fpb,
                   nbeats=nbeats, end=frame + fpb * nbeats, impact=impact, seal=seal,
                   style="jin" if counter[0] % 2 == 0 else "xuan", year_to=year_to)
        counter[0] += 1
        segs.append(seg)
        return seg["end"]

    frame = add("open", 0, OPEN_BEATS, seal="序", year_to=VOLUMES[0]["knot"])
    for vi, v in enumerate(VOLUMES):
        frame = add("card", vi, CARD_BEATS, impact=True, seal="卷" + NUMERALS[vi], year_to=v["knot"])
        n = len(v["shots"])
        for si, s in enumerate(v["shots"]):
            frame = add("shot", vi, SHOT_BEATS, shot=si, seal="卷" + NUMERALS[vi], year_to=s["year"])
            a, b = v["pt"]
            segs[-1]["pt"] = a + (b - a) * (si / max(1, n - 1))
    frame = add("end", len(VOLUMES) - 1, END_BEATS, impact=True, seal="终", year_to=END_YEAR)
    total = frame + TAIL_FRAMES

    prev = VOLUMES[0]["knot"]
    for s in segs:
        s["year_from"] = prev
        prev = s["year_to"]
        if "pt" not in s:
            v = VOLUMES[s["vol"]]
            s["pt"] = v["pt"][0] if s["kind"] != "end" else v["pt"][1]

    beats = []
    for s in segs:
        for b in range(s["nbeats"]):
            f = s["start"] + b * s["fpb"]
            ev = []
            if b == 0:
                ev.append("impact" if s["impact"] else "cut")
            if s["kind"] == "shot":
                g = VOLUMES[s["vol"]]["shots"][s["shot"]]["groups"]
                if 1 <= b <= len(g):
                    ev.append(f"词组:{g[b - 1]}")
            beats.append(dict(i=len(beats), frame=f, t=round(f / FPS, 4), sample=f * SPF,
                              bpm=round(bpm_of(s["fpb"]), 3), seg=s["id"], beat=b,
                              bar_beat=b % 4, events=ev))
    return dict(fps=FPS, sr=SR, width=W, height=H, total_frames=total, segments=segs, beats=beats)


def validate(grid):
    errs = []
    beat_frames = {b["frame"] for b in grid["beats"]}
    for s in grid["segments"]:
        if s["start"] not in beat_frames:
            errs.append(f"切点不在拍上：段{s['id']}")
        if s["nbeats"] % 4:
            errs.append(f"段{s['id']}拍数非整小节")
    prev_bpm = 0
    for vi, v in enumerate(VOLUMES):
        bpm = bpm_of(v["fpb"])
        if bpm <= prev_bpm:
            errs.append(f"卷{vi + 1} BPM 未随年代加快")
        prev_bpm = bpm
        lo, hi = KNOTS[vi], KNOTS[vi + 1]
        for s in v["shots"]:
            y = s["year"]
            if y == 0:
                errs.append(f"{s['groups']} 出现公元0年")
            if not (lo <= y <= hi):
                errs.append(f"{s['groups']} 年份 {y} 超出本卷 [{lo},{hi}]")
            a, b = DYNASTY_RANGES[s["dyn"]]
            if not (a <= y <= b):
                errs.append(f"{s['groups']} 年份 {y} 不在 {s['dyn']} [{a},{b}]")
            if max(len(g) for g in s["groups"]) > 4:
                errs.append(f"{s['groups']} 词组过长")
    years = [s["year"] for v in VOLUMES for s in v["shots"]]
    for a, b in zip(years, years[1:]):
        if b < a:
            errs.append(f"年份倒序：{a} → {b}")
    if KNOTS != sorted(KNOTS):
        errs.append("卷界年份非递增")
    return errs


def tc(frame):
    s = frame / FPS
    return f"{int(s // 60):02d}:{s % 60:05.2f}"


STYLE_NAME = {"xuan": "宣纸白描", "jin": "玄底泥金"}


def storyboard_md(grid):
    L = ["# 《中华文明史》分镜表与拍点网格", "",
         f"- 规格：{W}×{H}，{FPS} fps，音频 {SR} Hz；总长 {grid['total_frames']} 帧（{tc(grid['total_frames'])}）",
         f"- 结构：序 {OPEN_BEATS} 拍 → 每卷【朱印冲击 + 卷首 {CARD_BEATS} 拍】+ 每镜 {SHOT_BEATS} 拍 → 终 {END_BEATS} 拍",
         "- 镜内拍位：第0拍切入并开始勾线；第1、2拍依次落下书法词组；再下一拍出字幕；线稿在前3.5拍内勾完",
         "- 帧每拍均为整数，所有切点、词组出现、冲击转场都精确落在整帧拍点上", "",
         "## 卷级网格", "",
         "| 卷 | 卷名 | 年代 | 帧/拍 | BPM | 调式 | 乐器 | 主色 | 纹样 | 起始 |",
         "|---|---|---|---|---|---|---|---|---|---|"]
    for vi, v in enumerate(VOLUMES):
        st = next(s for s in grid["segments"] if s["kind"] == "card" and s["vol"] == vi)
        L.append(f"| 卷{NUMERALS[vi]} | {''.join(v['title'])} | {v['span']} | {v['fpb']} | "
                 f"{bpm_of(v['fpb']):.2f} | {MODES[v['mode']]}调式 | {v['instr']} | {v['color_name']} | "
                 f"{v['pattern_name']} | {tc(st['start'])} |")
    L += ["", "## 分镜表", "",
          "| 镜 | 卷 | 类型 | 起始帧 | 时间码 | 拍 | BPM | 画风 | 朝代 | 年份 | 书法词组 | 线稿 | 字幕 |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for s in grid["segments"]:
        v = VOLUMES[s["vol"]]
        bpm = f"{bpm_of(s['fpb']):.2f}"
        if s["kind"] == "shot":
            d = v["shots"][s["shot"]]
            p, n = fmt_year(d["year"])
            L.append(f"| {s['id']} | 卷{NUMERALS[s['vol']]} | 镜 | {s['start']} | {tc(s['start'])} | {s['nbeats']} | {bpm} | "
                     f"{STYLE_NAME[s['style']]} | {d['dyn']} | {'约' if d['approx'] else ''}{p}{n}年 | "
                     f"{' / '.join(d['groups'])} | {d['art']} | {d['caption']} |")
        else:
            name = {"open": "序·片头", "card": "朱印冲击 + 卷首", "end": "朱印冲击 + 终"}[s["kind"]]
            title = {"open": "中华 / 文明史", "card": " / ".join(v["title"]), "end": "生生 / 不息"}[s["kind"]]
            L.append(f"| {s['id']} | {'序' if s['kind'] == 'open' else ('终' if s['kind'] == 'end' else '卷' + NUMERALS[s['vol']])} | "
                     f"{name} | {s['start']} | {tc(s['start'])} | {s['nbeats']} | {bpm} | {STYLE_NAME[s['style']]} | — | — | "
                     f"{title} | — | {v['span'] if s['kind'] == 'card' else ''} |")
    L += ["", "## 年代核对", "",
          "每镜年份须落在所属卷的起止与所属朝代起止之内、全片单调不减、不出现公元0年（由 `timeline.py --check` 自动校验）。", "",
          "| 词组 | 标注年份 | 朝代区间 | 依据 |", "|---|---|---|---|"]
    for v in VOLUMES:
        for d in v["shots"]:
            a, b = DYNASTY_RANGES[d["dyn"]]
            p, n = fmt_year(d["year"])
            L.append(f"| {''.join(d['groups'])} | {'约' if d['approx'] else ''}{p}{n}年 | {d['dyn']} "
                     f"{fmt_year_short(a)}—{fmt_year_short(b) if b < 9999 else '今'} | {d['basis']} |")
    L += ["", "说明：地图均为示意图，不表示实际疆域与边界；全片线稿只画器物、建筑、山川与示意图，不画人物。", ""]
    return "\n".join(L)


def main():
    grid = build()
    errs = validate(grid)
    if errs:
        print("年代/网格校验失败：")
        for e in errs:
            print("  -", e)
        sys.exit(1)
    print(f"校验通过：{len(grid['segments'])} 段，{len(grid['beats'])} 拍，{grid['total_frames']} 帧（{tc(grid['total_frames'])}）")
    if "--check" in sys.argv:
        return
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "beatgrid.json"), "w", encoding="utf-8") as f:
        json.dump(grid, f, ensure_ascii=False, indent=1)
    with open(os.path.join(here, "storyboard.md"), "w", encoding="utf-8") as f:
        f.write(storyboard_md(grid))
    print("已写出 beatgrid.json 与 storyboard.md")


if __name__ == "__main__":
    main()
