#!/usr/bin/env python3
"""Draws the bot's custom-emoji artwork: one 100x100 PNG per icon, in the brand style
(a rounded tile in signal red with a white line pictogram). Telegram accepts static
custom emoji as 100x100 PNG, so these files are ready to upload with
scripts/create-emoji-set.js. Run: python3 scripts/make-emoji-art.py"""
import math, os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "emoji")
S = 400           # draw at 4x and downscale for smooth edges
SIG = (232, 70, 42, 255)
SIG_DARK = (176, 42, 22, 255)
WHITE = (255, 255, 255, 255)
W = 26            # stroke width at 4x (about 6.5px at 100px)

def tile():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    grad = Image.new("RGBA", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / (S - 1)
        c = tuple(int(SIG[i] * (1 - t) + SIG_DARK[i] * t) for i in range(3)) + (255,)
        gd.line([(0, y), (S, y)], fill=c)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=96, fill=255)
    img.paste(grad, (0, 0), mask)
    return img

def rr(d, box, r, w=W):
    d.rounded_rectangle(box, radius=r, outline=WHITE, width=w)

def line(d, pts, w=W):
    d.line(pts, fill=WHITE, width=w, joint="curve")
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=WHITE)

def circle(d, cx, cy, r, w=W):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=WHITE, width=w)

def dot(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)

def poly(d, pts, w=W):
    d.line(pts + [pts[0]], fill=WHITE, width=w, joint="curve")

def draw(name, d):
    if name == "file":
        poly(d, [(120, 90), (230, 90), (290, 150), (290, 310), (120, 310)])
        line(d, [(230, 90), (230, 150), (290, 150)])
        line(d, [(160, 200), (250, 200)]); line(d, [(160, 245), (250, 245)]); line(d, [(160, 290), (220, 290)])
    elif name == "image":
        rr(d, [80, 100, 320, 300], 36)
        line(d, [(110, 270), (180, 190), (230, 240), (265, 205), (300, 270)])
        dot(d, 265, 150, 22)
    elif name == "summary":
        for y in (120, 200, 280):
            dot(d, 120, y, 18)
            line(d, [(170, y), (290, y)])
    elif name == "quiz":
        circle(d, 200, 200, 120)
        line(d, [(160, 165), (160, 150)]) if False else None
        d.arc([150, 130, 250, 220], start=190, end=20, fill=WHITE, width=W)
        line(d, [(200, 200), (200, 230)])
        dot(d, 200, 275, 17)
    elif name == "cards":
        rr(d, [140, 90, 300, 260], 26)
        rr(d, [100, 140, 260, 310], 26)
    elif name == "concepts":
        circle(d, 200, 165, 88)
        line(d, [(170, 265), (230, 265)]); line(d, [(178, 300), (222, 300)])
    elif name == "explain":
        circle(d, 180, 180, 84)
        line(d, [(240, 240), (310, 310)], w=36)
    elif name == "ask":
        rr(d, [80, 100, 320, 270], 50)
        poly(d, [(150, 262), (150, 320), (210, 268)])
        dot(d, 140 + 60, 185, 16); dot(d, 200, 185, 16); dot(d, 260, 185, 16)
    elif name == "upload":
        line(d, [(200, 290), (200, 110)])
        line(d, [(130, 180), (200, 110), (270, 180)])
        line(d, [(110, 300), (110, 320), (290, 320), (290, 300)])
    elif name == "home":
        poly(d, [(90, 200), (200, 100), (310, 200)])
        line(d, [(140, 180), (140, 300), (260, 300), (260, 180)])
    elif name == "credits":
        circle(d, 200, 200, 110)
        circle(d, 200, 200, 58, w=18)
    elif name == "stats":
        line(d, [(120, 300), (120, 220)], w=44)
        line(d, [(200, 300), (200, 160)], w=44)
        line(d, [(280, 300), (280, 110)], w=44)
    elif name == "next":
        line(d, [(110, 200), (290, 200)])
        line(d, [(220, 130), (290, 200), (220, 270)])
    elif name == "done":
        line(d, [(120, 205), (175, 260), (285, 140)], w=36)
    elif name == "wrong":
        line(d, [(135, 135), (265, 265)], w=36)
        line(d, [(265, 135), (135, 265)], w=36)
    elif name == "warn":
        poly(d, [(200, 90), (320, 300), (80, 300)])
        line(d, [(200, 160), (200, 220)])
        dot(d, 200, 262, 15)
    elif name == "back":
        line(d, [(290, 200), (110, 200)])
        line(d, [(180, 130), (110, 200), (180, 270)])
    elif name == "lang":
        circle(d, 200, 200, 110, w=20)
        d.ellipse([130, 110, 270, 290], outline=WHITE, width=18)
        line(d, [(90, 200), (310, 200)], w=18)
    elif name == "reset":
        d.arc([110, 110, 290, 290], start=30, end=330, fill=WHITE, width=W)
        line(d, [(255, 105), (300, 150), (245, 165)])
    elif name == "topic":
        circle(d, 200, 200, 115, w=20)
        circle(d, 200, 200, 62, w=20)
        dot(d, 200, 200, 22)
    elif name == "spark":
        pts = []
        for i in range(8):
            a = math.pi / 4 * i - math.pi / 2
            r = 120 if i % 2 == 0 else 34
            pts.append((200 + r * math.cos(a), 200 + r * math.sin(a)))
        d.polygon(pts, fill=WHITE)
    elif name == "clock":
        circle(d, 200, 200, 115)
        line(d, [(200, 200), (200, 120)])
        line(d, [(200, 200), (265, 230)])
    elif name == "trophy":
        d.arc([95, 90, 175, 170], start=90, end=270, fill=WHITE, width=W)
        d.arc([225, 90, 305, 170], start=-90, end=90, fill=WHITE, width=W)
        poly(d, [(120, 95), (280, 95), (260, 230), (140, 230)])
        line(d, [(200, 230), (200, 290)], w=30)
        line(d, [(140, 310), (260, 310)], w=34)

NAMES = ["file", "image", "summary", "quiz", "cards", "concepts", "explain", "ask", "upload", "home",
         "credits", "stats", "next", "done", "wrong", "warn", "back", "lang", "reset", "topic", "spark",
         "clock", "trophy"]

os.makedirs(OUT, exist_ok=True)
for name in NAMES:
    img = tile()
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw(name, ImageDraw.Draw(layer))
    img = Image.alpha_composite(img, layer)
    img = img.resize((100, 100), Image.LANCZOS)
    img.save(os.path.join(OUT, f"{name}.png"), optimize=True)
print(f"wrote {len(NAMES)} icons to {os.path.abspath(OUT)}")
