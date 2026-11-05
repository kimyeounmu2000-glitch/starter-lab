"""Build STARTER LAB's original transparent pixel sheets. Requires Pillow."""
from pathlib import Path
import math
import re
from PIL import Image, ImageColor, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
source = (ROOT / "js/data.js").read_text(encoding="utf-8")
masks = dict(re.findall(r'^    (\S+): "([012/]+)",', source, re.MULTILINE))
colors = dict(re.findall(r'^    (\S+): \["[^"]+", "(#[0-9a-f]+)"', source, re.MULTILINE))
# row order is shared with the runtime manifest
moves = "노말 불꽃 물 전기 풀 얼음 격투 독 땅 비행 에스퍼 벌레 바위 고스트 드래곤 악 강철 페어리".split()
masks["벌레"] = "1000001/0101010/0011100/0112110/0011100/0101010/1000001"
masks["물"] = "0001000/0011100/0012100/0112100/1122110/1111110/0111100"
profiles = {
    "노말": (1, 4, 0, 0), "불꽃": (3, 7, 4, 30), "물": (4, 10, 1, -12),
    "전기": (2, 8, 6, 18), "풀": (3, 8, 5, 180), "얼음": (5, 7, 11, 65),
    "격투": (2, 5, 5, 36), "독": (2, 4, 8, 0), "땅": (4, 7, 7, 46),
    "비행": (2, 5, 5, -95), "에스퍼": (3, 4, 3, 90), "벌레": (5, 7, 7, 120),
    "바위": (3, 4, 11, 35), "고스트": (2, 6, 3, -30), "드래곤": (3, 9, 4, 125),
    "악": (1, 1, 0, 0), "강철": (2, 4, 5, 135), "페어리": (3, 6, 9, -30),
}
styles = {
    "gold-silver": (4, 3, 0),
    "diamond-pearl": (7, 5, 1),
    "black-white": (10, 7, 2),
}
highlights = {"불꽃": "#ffd26f", "물": "#c6f2ff", "전기": "#fff7a5", "풀": "#c7f187",
              "얼음": "#d7f5ff", "악": "#f7d6b3", "고스트": "#f6a0cd"}

def glyph(move, size, angle, style):
    image = Image.new("RGBA", (7, 7))
    palette = [None, colors[move], highlights.get(move, "#fff0ca")]
    if style == 0:
        palette[2] = "#fff6d5"
    for y, row in enumerate(masks[move].split("/")):
        for x, pixel in enumerate(row):
            if pixel != "0":
                image.putpixel((x, y), ImageColor.getcolor(palette[int(pixel)], "RGBA"))
    image = image.resize((size, size), Image.Resampling.NEAREST)
    return image.rotate(angle, resample=Image.Resampling.NEAREST, expand=True)

def stamp(frame, tile, x, y):
    frame.alpha_composite(tile, (round(x - tile.width / 2), round(y - tile.height / 2)))

def water_frame(index, count, style, impact):
    t = index / max(1, count - 1)
    image = Image.new("RGBA", (48, 48))
    d = ImageDraw.Draw(image)
    if not impact:
        # Dense jet with a narrow mouth, broad crest and running highlights.
        for x in range(0,48,2):
            spread=3+round(x/48*6)
            wave=round(math.sin(x/6-t*18)*1.5)
            d.rectangle((x,24-spread+wave,x+2,24+spread+wave),fill="#258ee7")
            d.rectangle((x,22-spread//3+wave,x+2,25+spread//3+wave),fill="#a6f4ff")
            if (x//2+index)%5==0:
                d.rectangle((x,22+wave,x+3,24+wave),fill="#fff")
    else:
        # Water rises from the contact point then falls outwards.
        for i in range(7):
            spread=i-3
            x=24+round(spread*(2+4*t))
            y=29-round(math.sin(math.pi*t)*(15-abs(spread)*2))+round(t*spread*spread/2)
            d.rectangle((x-2,y-5,x+2,y+2),fill="#3eb8f4")
            d.rectangle((x-1,y-4,x+1,y),fill="#c6f9ff")
        d.rectangle((12,32,36,34),fill="#78dcff")
    return image

def draw_frame(move, frame_index, count, style, impact):
    if move == "물":
        return water_frame(frame_index, count, style, impact)
    t = frame_index / max(count - 1, 1)
    frame = Image.new("RGBA", (48, 48))
    copies, horizontal, vertical, rotation = profiles[move]
    if style == 0:
        copies = min(copies, 2)
    if move == "전기" and impact and frame_index % 2:
        return frame
    if move in ("독", "악") and impact:
        tile = glyph(move, 19, 0, style)
        top = tile.crop((0, 0, 19, 9))
        bottom = tile.crop((0, 10, 19, 19))
        gap = 13 * abs(1 - 2 * t)
        stamp(frame, top, 24, 20 - gap)
        stamp(frame, bottom, 24, 28 + gap)
        return frame
    for i in range(copies):
        spread = i - (copies - 1) / 2
        if impact:
            if t > 0.75 and i % 2:
                continue
            angle = 2 * math.pi * i / copies
            radius = (3 + 13 * t) * (0.75 if style == 0 else 1)
            x, y = 24 + math.cos(angle) * radius, 24 + math.sin(angle) * radius
            size = max(4, round(14 * (1 - 0.65 * t)))
        else:
            x = 24 + spread * horizontal
            y = 24 + spread * vertical / 2 + math.sin(t * math.pi * 2 + i) * vertical / 3
            if style == 2:
                x += math.sin(t * math.pi + i) * 4
                y += math.sin(t * math.pi * 2 + i) * 3
            size = round(8 + 6 * t + (style if i == 0 else 0))
        if move == "노말":
            size += round(9 * (1 - abs(1 - 2 * t)))
        if move == "전기":
            size += 6
        stamp(frame, glyph(move, size, rotation * (t + spread * 0.15), style), x, y)
    return frame

for name, (travel, hit, style) in styles.items():
    sheet = Image.new("RGBA", (48 * (travel + hit), 48 * len(moves)))
    for row, move in enumerate(moves):
        for col in range(travel + hit):
            impact = col >= travel
            tile = draw_frame(move, col - travel if impact else col, hit if impact else travel, style, impact)
            sheet.alpha_composite(tile, (48 * col, 48 * row))
    sheet.save(ROOT / "assets/effects" / name / "moves.png", optimize=True)
