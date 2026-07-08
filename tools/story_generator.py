#!/usr/bin/env python3
"""WhatIs... Daily Trivia — daily Instagram story generator (v2 design).

Reads the day's category from the monthly question bank and builds an on-brand
1080x1920 story graphic (themed per category, with depth + glow) plus a caption.

Usage:
  python3 story_generator.py            # builds TOMORROW's story (ET)
  python3 story_generator.py today
  python3 story_generator.py 2026-07-04

Outputs to content/daily/<YYYY-MM-DD>/ -> story_<category>.png, caption_<category>.txt, meta.txt
(category slug is lowercase, non-alphanumerics -> "_", e.g. story_us_politics.png)
Requires: cairosvg  (pip install cairosvg --break-system-packages)
"""
import json, os, sys, math, datetime, re
try:
    from zoneinfo import ZoneInfo
    ET = ZoneInfo("America/New_York")
except Exception:
    ET = None

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.normpath(os.path.join(BASE, "..", "data"))
OUTROOT = os.path.join(BASE, "daily")
LINK = "whatisdailytrivia.onrender.com"
BG = "#08080B"
GOLD, OFFWHITE, MUTED = "#C9A84C", "#F5F3EE", "#7C766C"
SERIF = "Caladea, 'Century Schoolbook L', 'DejaVu Serif', serif"
MONO = "'DejaVu Sans Mono', monospace"
MONTHS = ["january","february","march","april","may","june","july","august",
          "september","october","november","december"]

THEME = {
    "Finance":                {"color": "#D9B65A", "light": "#F0D789", "icon": "coins",  "hook": "Follow the money."},
    "History":                {"color": "#CD8B45", "light": "#E8B279", "icon": "column", "hook": "Today, in the books."},
    "Music":                  {"color": "#3FB950", "light": "#7BE0A0", "icon": "note",   "hook": "Name that tune."},
    "Science":                {"color": "#9B7BE0", "light": "#C2AEF0", "icon": "flask",  "hook": "The lab is open."},
    "Sports & Entertainment": {"color": "#5E97F0", "light": "#A2C2F7", "icon": "trophy", "hook": "Game on."},
    "US Politics":            {"color": "#D9534F", "light": "#EE908D", "icon": "flag",   "hook": "Today, in politics."},
    "Wildcard":               {"color": "#E0685E", "light": "#F0A39C", "icon": "spark",  "hook": "Anything goes."},
}
DEFAULT = {"color": GOLD, "light": "#EBCB77", "icon": "spark", "hook": "Today's question is live."}
CANON = {"Sports & Ent.": "Sports & Entertainment", "Sports & Ent": "Sports & Entertainment",
         "Sports": "Sports & Entertainment", "Geopolitics": "US Politics"}


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def target_date(arg):
    now = datetime.datetime.now(ET) if ET else datetime.datetime.now()
    if not arg or arg.lower() == "tomorrow":
        return (now + datetime.timedelta(days=1)).date()
    if arg.lower() == "today":
        return now.date()
    return datetime.date.fromisoformat(arg)


def category_for(d):
    path = os.path.join(DATA, "questions_%s_%d.json" % (MONTHS[d.month - 1], d.year))
    if not os.path.exists(path):
        return None
    bank = json.load(open(path, encoding="utf-8"))
    idx = d.day - 1
    if idx < 0 or idx >= len(bank):
        return None
    return (bank[idx] or {}).get("category")


def dot_grid(ox, oy, rows, step, flip, c):
    out = []
    for i in range(rows):
        for j in range(rows - i):
            x = ox + (j * step if not flip else -j * step)
            y = oy + (i * step if not flip else -i * step)
            op = 0.55 - (i + j) * 0.045
            if op < 0.08:
                op = 0.08
            col = c if (i + j) % 2 == 0 else GOLD
            out.append('<circle cx="%d" cy="%d" r="5" fill="%s" opacity="%.2f"/>' % (x, y, col, op))
    return "".join(out)


def icon(kind, cx, cy, c, light):
    hl = "#FFFFFF"
    if kind == "coins":
        return ('<ellipse cx="%d" cy="%d" rx="150" ry="42" fill="#9A7030"/>'
                '<ellipse cx="%d" cy="%d" rx="150" ry="42" fill="url(#gold)"/>'
                '<ellipse cx="%d" cy="%d" rx="150" ry="42" fill="url(#gold)"/>'
                '<ellipse cx="%d" cy="%d" rx="120" ry="22" fill="%s" opacity="0.25"/>'
                '<text x="%d" y="%d" text-anchor="middle" fill="#5A4416" font-family="%s" font-size="128" font-weight="700">$</text>'
                % (cx, cy + 72, cx, cy + 24, cx, cy - 30, cx, cy - 48, hl, cx, cy + 64, SERIF))
    if kind == "flask":
        return ('<rect x="%d" y="%d" width="58" height="98" rx="6" fill="none" stroke="%s" stroke-width="12"/>'
                '<path d="M%d %d L%d %d Q%d %d %d %d L%d %d Q%d %d %d %d L%d %d Z" fill="%s" fill-opacity="0.18" stroke="%s" stroke-width="12" stroke-linejoin="round"/>'
                '<path d="M%d %d L%d %d Q%d %d %d %d L%d %d Q%d %d %d %d L%d %d Z" fill="%s"/>'
                '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="9" stroke-linecap="round" opacity="0.6"/>'
                '<circle cx="%d" cy="%d" r="12" fill="%s"/><circle cx="%d" cy="%d" r="8" fill="%s" opacity="0.85"/>'
                % (cx - 29, cy - 158, c,
                   cx - 22, cy - 60, cx - 124, cy + 150, cx - 132, cy + 180, cx - 94, cy + 180, cx + 94, cy + 180, cx + 132, cy + 180, cx + 124, cy + 150, cx + 22, cy - 60, c, c,
                   cx - 96, cy + 92, cx - 122, cy + 150, cx - 130, cy + 178, cx - 94, cy + 178, cx + 94, cy + 178, cx + 130, cy + 178, cx + 122, cy + 150, cx + 96, cy + 92, light,
                   cx - 70, cy + 20, cx - 88, cy + 120, hl,
                   cx - 28, cy + 132, GOLD, cx + 30, cy + 150, OFFWHITE))
    if kind == "column":
        flutes = "".join('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="7" opacity="0.5"/>'
                         % (cx + dx, cy - 108, cx + dx, cy + 128, light) for dx in (-66, -22, 22, 66))
        return ('<rect x="%d" y="%d" width="290" height="40" rx="6" fill="%s"/>'
                '<rect x="%d" y="%d" width="226" height="244" fill="%s"/>%s'
                '<rect x="%d" y="%d" width="310" height="46" rx="6" fill="%s"/>'
                '<rect x="%d" y="%d" width="350" height="14" rx="7" fill="%s" opacity="0.85"/>'
                % (cx - 145, cy - 150, c, cx - 113, cy - 110, c, flutes,
                   cx - 155, cy + 150, c, cx - 175, cy + 196, light))
    if kind == "bulb":
        rays = "".join('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="10" stroke-linecap="round" opacity="0.8"/>'
                       % p for p in [(cx - 170, cy - 70, cx - 210, cy - 90, light), (cx + 170, cy - 70, cx + 210, cy - 90, light), (cx, cy - 175, cx, cy - 220, light)])
        return ('%s<circle cx="%d" cy="%d" r="118" fill="%s" fill-opacity="0.22" stroke="%s" stroke-width="12"/>'
                '<path d="M%d %d Q%d %d %d %d" fill="none" stroke="%s" stroke-width="14" stroke-linecap="round" opacity="0.7"/>'
                '<path d="M%d %d L%d %d L%d %d L%d %d" fill="none" stroke="%s" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'
                '<rect x="%d" y="%d" width="104" height="44" rx="8" fill="%s"/><rect x="%d" y="%d" width="82" height="30" rx="12" fill="%s" opacity="0.85"/>'
                % (rays, cx, cy - 36, c, c,
                   cx - 70, cy - 70, cx - 40, cy - 130, cx + 6, cy - 116, hl,
                   cx - 34, cy - 36, cx - 12, cy + 10, cx + 12, cy - 22, cx + 34, cy + 22, light,
                   cx - 52, cy + 80, c, cx - 41, cy + 124, light))
    if kind == "trophy":
        return ('<path d="M%d %d L%d %d Q%d %d %d %d Q%d %d %d %d L%d %d Z" fill="%s" stroke="%s" stroke-width="2"/>'
                '<path d="M%d %d Q%d %d %d %d" fill="none" stroke="%s" stroke-width="12"/>'
                '<path d="M%d %d Q%d %d %d %d" fill="none" stroke="%s" stroke-width="12"/>'
                '<path d="M%d %d Q%d %d %d %d" fill="none" stroke="%s" stroke-width="10" stroke-linecap="round" opacity="0.7"/>'
                '<rect x="%d" y="%d" width="34" height="72" fill="%s"/>'
                '<rect x="%d" y="%d" width="190" height="36" rx="9" fill="%s"/>'
                % (cx - 96, cy - 150, cx - 86, cy - 16, cx - 80, cy + 54, cx, cy + 54, cx + 80, cy + 54, cx + 86, cy - 16, cx + 96, cy - 150, c, light,
                   cx - 96, cy - 128, cx - 156, cy - 86, cx - 84, cy - 26, c,
                   cx + 96, cy - 128, cx + 156, cy - 86, cx + 84, cy - 26, c,
                   cx - 58, cy - 120, cx - 50, cy - 40, cx - 30, cy + 30, hl,
                   cx - 17, cy + 54, c, cx - 95, cy + 124, light))
    if kind == "star":
        pts = []
        for i in range(10):
            r = 152 if i % 2 == 0 else 66
            a = -math.pi / 2 + i * math.pi / 5
            pts.append("%d,%d" % (cx + r * math.cos(a), cy + r * math.sin(a)))
        return ('<polygon points="%s" fill="%s"/>'
                '<polygon points="%s" fill="%s" opacity="0.0"/>'
                '<path d="M%d %d L%d %d L%d %d" fill="none" stroke="%s" stroke-width="8" stroke-linecap="round" opacity="0.6"/>'
                % (" ".join(pts), c, " ".join(pts), light, cx - 40, cy - 70, cx - 10, cy - 20, cx + 36, cy - 64, hl))
    if kind == "brain":
        outer = (f'M{cx-150} {cy} C {cx-162} {cy-78} {cx-112} {cy-128} {cx-58} {cy-118} '
                 f'C {cx-46} {cy-158} {cx+16} {cy-158} {cx+28} {cy-116} '
                 f'C {cx+86} {cy-138} {cx+156} {cy-92} {cx+142} {cy-18} '
                 f'C {cx+176} {cy+16} {cx+150} {cy+86} {cx+88} {cy+100} '
                 f'C {cx+66} {cy+132} {cx-70} {cy+132} {cx-92} {cy+98} '
                 f'C {cx-156} {cy+86} {cx-178} {cy+16} {cx-150} {cy} Z')
        folds = (
            f'<path d="M{cx} {cy-108} C {cx-18} {cy-60} {cx+18} {cy-24} {cx} {cy+18} '
            f'C {cx-16} {cy+56} {cx+12} {cy+92} {cx} {cy+118}" fill="none" stroke="{light}" stroke-width="9" stroke-linecap="round" opacity="0.9"/>'
            f'<path d="M{cx-112} {cy-54} C {cx-72} {cy-78} {cx-58} {cy-16} {cx-26} {cy-30}" fill="none" stroke="{light}" stroke-width="8" stroke-linecap="round" opacity="0.7"/>'
            f'<path d="M{cx-124} {cy+34} C {cx-82} {cy+10} {cx-66} {cy+64} {cx-30} {cy+50}" fill="none" stroke="{light}" stroke-width="8" stroke-linecap="round" opacity="0.7"/>'
            f'<path d="M{cx+112} {cy-54} C {cx+72} {cy-78} {cx+58} {cy-16} {cx+26} {cy-30}" fill="none" stroke="{light}" stroke-width="8" stroke-linecap="round" opacity="0.7"/>'
            f'<path d="M{cx+124} {cy+34} C {cx+82} {cy+10} {cx+66} {cy+64} {cx+30} {cy+50}" fill="none" stroke="{light}" stroke-width="8" stroke-linecap="round" opacity="0.7"/>'
        )
        return (f'<path d="{outer}" fill="{c}" fill-opacity="0.20" stroke="{c}" stroke-width="13" stroke-linejoin="round"/>'
                f'{folds}'
                f'<path d="M{cx-150} {cy} C {cx-162} {cy-78} {cx-112} {cy-128} {cx-58} {cy-118} '
                f'C {cx-46} {cy-158} {cx+16} {cy-158} {cx+28} {cy-116}" fill="none" stroke="{hl}" stroke-width="6" stroke-linecap="round" opacity="0.5"/>')
    if kind == "flag":
        fw, fh = 320, 196
        fx, fy = cx - 142, cy - 138
        sh = fh / 7.0
        stripes = "".join(
            f'<rect x="{fx}" y="{fy + i*sh:.1f}" width="{fw}" height="{sh+1:.1f}" '
            f'fill="{"#C0303A" if i % 2 == 0 else "#F5F1E8"}"/>'
            for i in range(7))
        ch = sh * 4
        canton = f'<rect x="{fx}" y="{fy}" width="148" height="{ch:.1f}" fill="#33356B"/>'
        stars = "".join(
            f'<circle cx="{fx+22+col*26:.1f}" cy="{fy+16+row*((ch-26)/3.0):.1f}" r="4.5" fill="#FFFFFF"/>'
            for row in range(4) for col in range(5))
        pole = (f'<rect x="{fx-16}" y="{cy-156}" width="12" height="312" rx="6" fill="url(#gold)"/>'
                f'<circle cx="{fx-10}" cy="{cy-156}" r="13" fill="url(#gold)"/>')
        border = (f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" fill="none" '
                  f'stroke="{light}" stroke-width="3" opacity="0.45"/>')
        return pole + stripes + canton + stars + border
    if kind == "note":
        # two beamed eighth notes
        beam = (f'<path d="M{cx-94} {cy-150} L{cx+104} {cy-178} L{cx+104} {cy-134} L{cx-94} {cy-106} Z" fill="{c}"/>')
        stems = (f'<rect x="{cx-94}" y="{cy-150}" width="16" height="250" rx="6" fill="{c}"/>'
                 f'<rect x="{cx+88}" y="{cy-178}" width="16" height="248" rx="6" fill="{c}"/>')
        heads = (f'<ellipse cx="{cx-122}" cy="{cy+98}" rx="54" ry="39" fill="{c}" transform="rotate(-20 {cx-122} {cy+98})"/>'
                 f'<ellipse cx="{cx+60}" cy="{cy+68}" rx="54" ry="39" fill="{c}" transform="rotate(-20 {cx+60} {cy+68})"/>'
                 f'<ellipse cx="{cx-132}" cy="{cy+88}" rx="22" ry="13" fill="{hl}" opacity="0.45" transform="rotate(-20 {cx-132} {cy+88})"/>'
                 f'<ellipse cx="{cx+50}" cy="{cy+58}" rx="22" ry="13" fill="{hl}" opacity="0.4" transform="rotate(-20 {cx+50} {cy+58})"/>')
        return beam + stems + heads
    # spark / wildcard: gold "?" emblem with rays
    rays = "".join('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="11" stroke-linecap="round"/>'
                   % (cx + math.cos(t) * 150, cy + math.sin(t) * 150, cx + math.cos(t) * 195, cy + math.sin(t) * 195, c)
                   for t in [math.radians(a) for a in (-90, -34, 34, 90, 146, 214)])
    return ('%s<circle cx="%d" cy="%d" r="120" fill="%s" fill-opacity="0.18" stroke="%s" stroke-width="12"/>'
            '<text x="%d" y="%d" text-anchor="middle" fill="url(#gold)" font-family="%s" font-size="190" font-weight="700">?</text>'
            % (rays, cx, cy, c, c, cx, cy + 60, SERIF))


def build_svg(category, theme, d):
    c, light = theme["color"], theme["light"]
    cat = esc(category)
    date_main = "%s %d" % (MONTHS[d.month - 1].upper(), d.day)
    date_year = str(d.year)
    W, H, cx = 1080, 1920, 540
    chip_w = max(300, len(category) * 26 + 90)
    defs = (
        '<defs>'
        '<radialGradient id="hg" cx="50%%" cy="50%%" r="50%%">'
        '<stop offset="0%%" stop-color="%s" stop-opacity="0.40"/>'
        '<stop offset="55%%" stop-color="%s" stop-opacity="0.10"/>'
        '<stop offset="100%%" stop-color="%s" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="vig" cx="50%%" cy="40%%" r="80%%">'
        '<stop offset="62%%" stop-color="#000000" stop-opacity="0"/>'
        '<stop offset="100%%" stop-color="#000000" stop-opacity="0.55"/></radialGradient>'
        '<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0%%" stop-color="#EBCB77"/><stop offset="55%%" stop-color="#C9A84C"/>'
        '<stop offset="100%%" stop-color="#9A7030"/></linearGradient>'
        '</defs>' % (c, c, c)
    )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">' % (W, H, W, H) + defs +
        '<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG) +
        '<circle cx="%d" cy="1140" r="520" fill="url(#hg)"/>' % cx +
        '<rect width="%d" height="%d" fill="url(#vig)"/>' % (W, H) +
        '<rect x="26" y="26" width="%d" height="%d" rx="44" fill="none" stroke="%s" stroke-opacity="0.35" stroke-width="2"/>' % (W - 52, H - 52, c) +
        dot_grid(70, 80, 5, 34, False, c) + dot_grid(1010, 1840, 5, 34, True, c) +
        # logo lockup
        '<circle cx="118" cy="150" r="48" fill="none" stroke="url(#gold)" stroke-width="6"/>' +
        '<text x="118" y="174" text-anchor="middle" fill="url(#gold)" font-family="%s" font-size="60" font-weight="700">?</text>' % SERIF +
        '<text x="198" y="150" fill="%s" font-family="%s" font-size="56" font-weight="700">WhatIs<tspan fill="%s" font-style="italic">...</tspan></text>' % (OFFWHITE, SERIF, GOLD) +
        '<text x="200" y="196" fill="%s" font-family="%s" font-size="25" letter-spacing="8">DAILY TRIVIA</text>' % (MUTED, MONO) +
        # date stamp (top-right, balances the logo)
        '<text x="962" y="142" text-anchor="end" fill="url(#gold)" font-family="%s" font-size="38" font-weight="700" letter-spacing="3">%s</text>' % (MONO, esc(date_main)) +
        '<line x1="828" y1="160" x2="962" y2="160" stroke="%s" stroke-opacity="0.5" stroke-width="2"/>' % c +
        '<text x="962" y="192" text-anchor="end" fill="%s" font-family="%s" font-size="22" letter-spacing="8">%s</text>' % (MUTED, MONO, date_year) +
        # headline
        '<text x="%d" y="610" text-anchor="middle" fill="%s" font-family="%s" font-size="80" letter-spacing="1">Question of</text>' % (cx, OFFWHITE, MONO) +
        '<text x="%d" y="702" text-anchor="middle" fill="%s" font-family="%s" font-size="80" letter-spacing="1">the Day</text>' % (cx, OFFWHITE, MONO) +
        '<text x="%d" y="800" text-anchor="middle" fill="%s" font-family="%s" font-size="58" font-weight="700" letter-spacing="3">is LIVE</text>' % (cx, c, MONO) +
        # category chip
        '<rect x="%d" y="850" width="%d" height="62" rx="31" fill="%s" fill-opacity="0.14" stroke="%s" stroke-opacity="0.6" stroke-width="2"/>' % (cx - chip_w // 2, chip_w, c, c) +
        '<text x="%d" y="891" text-anchor="middle" fill="%s" font-family="%s" font-size="30" letter-spacing="3">%s</text>' % (cx, light, MONO, esc(category.upper())) +
        # hero icon (with halo)
        '<circle cx="%d" cy="1140" r="300" fill="none" stroke="%s" stroke-opacity="0.12" stroke-width="2"/>' % (cx, c) +
        '<circle cx="%d" cy="1140" r="244" fill="none" stroke="%s" stroke-opacity="0.18" stroke-width="2"/>' % (cx, c) +
        '<g>%s</g>' % icon(theme["icon"], cx, 1140, c, light) +
        # arrow
        '<line x1="%d" y1="1500" x2="%d" y2="1556" stroke="%s" stroke-width="6" stroke-linecap="round" opacity="0.85"/>' % (cx, cx, OFFWHITE) +
        '<polyline points="%d,1534 %d,1562 %d,1534" fill="none" stroke="%s" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>' % (cx - 24, cx, cx + 24, OFFWHITE) +
        # (CTA pill removed 2026-07-06 — the IG link sticker is placed below the arrow
        #  as the sole pill, so a baked-in pill would be redundant to align to.)
        # footer detail
        '<text x="%d" y="1800" text-anchor="middle" fill="%s" font-family="%s" font-size="26" letter-spacing="2">NEW QUESTION EVERY MORNING  ·  6 AM ET</text>' % (cx, MUTED, MONO) +
        '</svg>'
    )


def caption_for(category, theme):
    return ("%s\nQuestion of the Day is LIVE — %s.\nOne question. Every morning. Monthly prizes.\n\nPlay: https://%s"
            % (theme["hook"], category, LINK))


def main():
    import cairosvg
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    d = target_date(arg)
    raw = category_for(d)
    if not raw:
        print("NO_CATEGORY for %s — check the monthly question file." % d)
        sys.exit(2)
    category = CANON.get(raw.strip(), raw.strip()).rstrip(".")
    theme = THEME.get(category, DEFAULT)
    svg = build_svg(category, theme, d)
    caption = caption_for(category, theme)
    slug = re.sub(r"[^a-z0-9]+", "_", category.lower()).strip("_")
    outdir = os.path.join(OUTROOT, d.isoformat())
    os.makedirs(outdir, exist_ok=True)
    png = os.path.join(outdir, "story_%s.png" % slug)
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=png, output_width=1080, output_height=1920)
    open(os.path.join(outdir, "caption_%s.txt" % slug), "w", encoding="utf-8").write(caption)
    open(os.path.join(outdir, "meta.txt"), "w", encoding="utf-8").write(
        "date: %s\ncategory: %s\npng: %s\n" % (d.isoformat(), category, png))
    print("OK"); print("date=%s" % d.isoformat()); print("category=%s" % category); print("png=%s" % png)
    print("---CAPTION---"); print(caption)


if __name__ == "__main__":
    main()
