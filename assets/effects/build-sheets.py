"""Original move sprite sheets for STARTER LAB. Build with Python and Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

ROOT = Path(__file__).resolve().parents[2]
MOVES = "노말 불꽃 물 전기 풀 얼음 격투 독 땅 비행 에스퍼 벌레 바위 고스트 드래곤 악 강철 페어리".split()
STYLES = {"gold-silver": (4, 3, 0), "diamond-pearl": (7, 5, 1), "black-white": (10, 7, 2)}

def rock(draw, x, y, size):
    draw.polygon([(x-size,y-2),(x-2,y-size),(x+size,y-size+3),(x+size,y+3),(x,y+size),(x-size,y+3)], fill="#9d7958", outline="#594338")
    draw.line([(x-size+2,y),(x+1,y-3),(x+2,y+size-2)], fill="#dfb586", width=2)

def frame(move, index, count, style, impact):
    t = index / max(1, count-1)
    image = Image.new("RGBA", (48,48))
    d = ImageDraw.Draw(image)
    detail = 2 + style
    if move == "물":
        for x in range(0,48,3):
            wave = round(math.sin(x/7 + t*12)*2)
            d.rectangle((x,17+wave,x+3,30+wave), fill="#2474d1")
            d.rectangle((x,20+wave,x+3,24+wave), fill="#93eaff")
        if impact:
            for i in range(6):
                a=i*math.pi/3
                x,y=24+round(math.cos(a)*(7+13*t)),24+round(math.sin(a)*(7+13*t))
                d.rectangle((x-2,y-3,x+2,y+2), fill="#68d4ff")
    elif move in ("에스퍼","드래곤"):
        palette = ["#d44dc7","#6473e8","#78e6d9","#ffbd7c"] if move=="에스퍼" else ["#5440ad","#8c48d3","#4bd3ee","#eefbff"]
        for x in range(0,48,2):
            center=24+round(math.sin(x/5+t*10)*4)
            radius=4+round((x/48)*6) if move=="드래곤" else 6
            d.rectangle((x,center-radius,x+2,center+radius),fill=palette[(x//4+index)%len(palette)])
            d.rectangle((x,center-1,x+2,center+1),fill="#f8eaff")
    elif move == "전기":
        radius=5+round(t*17)
        d.ellipse((24-radius,24-radius,24+radius,24+radius),outline="#ffce2e",width=3)
        d.ellipse((26-radius,26-radius,22+radius,22+radius),outline="#fff9bc",width=1)
        for i in range(detail+2):
            a=i*math.pi*2/(detail+2)+t
            x,y=24+round(math.cos(a)*radius),24+round(math.sin(a)*radius)
            d.line([(x-3,y-4),(x+1,y-1),(x-1,y+2),(x+3,y+4)],fill="#fff18a",width=2)
    elif move in ("악","독"):
        gap=round((1-t)*11) if impact else round((1-t)*6+5)
        d.line([(9,15-gap),(24,11-gap),(39,15-gap)],fill="#56516b",width=3)
        d.line([(9,33+gap),(24,37+gap),(39,33+gap)],fill="#56516b",width=3)
        for x in (12,20,28,36):
            color="#dab2ff" if move=="독" else "#fff2db"
            d.polygon([(x-3,15-gap),(x+2,15-gap),(x,23-gap)],fill=color)
            d.polygon([(x-3,33+gap),(x+2,33+gap),(x,25+gap)],fill=color)
        if move=="독" and impact:
            for i in range(detail+1):
                x=9+i*8; y=24+round(t*12)+i%2*3
                d.rectangle((x,y,x+3,y+4),fill="#a041c9")
                d.point((x+1,y),fill="#efb7ff")
    elif move in ("격투","바위"):
        if impact and move=="격투":
            for i in range(detail+1):
                a=i*math.pi*2/(detail+1)
                rock(d,24+round(math.cos(a)*(4+13*t)),17+round(math.sin(a)*(3+9*t)),max(2,6-round(t*3)))
        else:
            rock(d,24,17 if move=="격투" else 24,11 if move=="격투" else 9)
            if move=="격투":
                d.line([(24,6),(20,14),(27,18),(22,27)],fill="#3b302d",width=2)
    elif move == "고스트":
        top=36-round(t*29)
        d.rounded_rectangle((17,top,30,44),radius=5,fill="#d77eab",outline="#863c79",width=2)
        d.line((24,top+6,24,40),fill="#f2b6d2",width=2)
    elif move == "얼음":
        for i in range(detail+3):
            x=(i*13+index*2)%44+2;y=(i*9+index*6)%44+2
            d.line((x-2,y,x+2,y),fill="#c4efff")
            d.line((x,y-2,x,y+2),fill="#fff")
    elif move == "땅":
        for i in range(detail+1):
            x=15+i*5;y=18+(i%3)*4
            if impact:
                d.rectangle((x-2,y-3,x+3+round(t*3),y+3),fill="#865337")
                d.rectangle((x,y-1,x+2,y+1),fill="#c6975b")
            else:
                d.ellipse((x-3,y-3,x+3,y+3),fill="#865337")
    elif move == "비행":
        wing=Image.new("RGBA",(48,48));w=ImageDraw.Draw(wing)
        w.polygon([(5,32),(15,17),(39,6),(33,17),(38,15),(30,25),(34,24),(25,33),(26,36),(16,39)],fill="#e5edf7",outline="#8394b8")
        for i in range(3): w.line((12+i*5,32,28+i*3,15),fill="#a1b6cf",width=2)
        image=wing.rotate(-55+round(t*100),resample=Image.Resampling.NEAREST)
    elif move == "강철":
        tail=Image.new("RGBA",(48,48));w=ImageDraw.Draw(tail)
        w.polygon([(5,38),(10,27),(19,20),(29,10),(41,5),(37,18),(25,26),(17,36)],fill="#98acbb",outline="#44586c")
        w.line([(8,35),(18,25),(30,15),(38,9)],fill="#f3ffff",width=3)
        image=tail.rotate(-65+round(t*130),resample=Image.Resampling.NEAREST)
    elif move == "벌레":
        for i in range(detail+1):
            x=9+i*8;y=15+(i%2)*11
            d.polygon([(x-5,y+3),(x+8,y-3),(x,y+7)],fill="#e5f2a6",outline="#668b3e")
            d.line((x-7,y+5,x-12,y+8),fill="#8ca66a",width=2)
    elif move == "페어리":
        d.polygon([(24,38),(5,20),(5,12),(11,6),(18,6),(24,12),(30,6),(37,6),(43,12),(43,20)],fill="#f57bb2",outline="#ac326e")
        d.rectangle((11,11,17,14),fill="#ffe2f3")
    elif move == "풀":
        leaf=Image.new("RGBA",(48,48));w=ImageDraw.Draw(leaf)
        w.polygon([(9,33),(13,18),(37,8),(35,27),(22,36)],fill="#4fa742",outline="#246336")
        w.line((11,33,34,12),fill="#cef48b",width=2)
        image=leaf.rotate(round(t*270),resample=Image.Resampling.NEAREST)
    elif move == "불꽃":
        for i in range(detail):
            x=15+i*8;y=25+int(math.sin(index+i)*4)
            d.polygon([(x-5,y+7),(x-7,y-1),(x-1,y-6),(x+1,y-13),(x+5,y-5),(x+7,y+4)],fill="#e34922")
            d.polygon([(x-2,y+5),(x-3,y-2),(x+2,y-6),(x+4,y+4)],fill="#ffd16a")
    else:
        radius=5+round(t*15)
        points=[]
        for i in range(16):
            a=i*math.pi/8;r=radius if i%2==0 else radius/3
            points.append((24+round(math.cos(a)*r),24+round(math.sin(a)*r)))
        d.polygon(points,fill="#ffe7a7",outline="#b78560")
    if style==0:
        # Lower color count and coarser pixels for the GBC treatment.
        image=image.resize((24,24),Image.Resampling.NEAREST).resize((48,48),Image.Resampling.NEAREST)
    return image

for name,(flight,impact,style) in STYLES.items():
    sheet=Image.new("RGBA",(48*(flight+impact),48*len(MOVES)))
    for row,move in enumerate(MOVES):
        for col in range(flight+impact):
            hit=col>=flight
            image=frame(move,col-flight if hit else col,impact if hit else flight,style,hit)
            sheet.alpha_composite(image,(48*col,48*row))
    sheet.save(ROOT/"assets/effects"/name/"moves.png",optimize=True)
