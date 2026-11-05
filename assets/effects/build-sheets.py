"""Draw original move-specific pixel frames. Run with Python and Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

ROOT = Path(__file__).resolve().parents[2]
MOVES = "노말 불꽃 물 전기 풀 얼음 격투 독 땅 비행 에스퍼 벌레 바위 고스트 드래곤 악 강철 페어리".split()
STYLES = {"gold-silver": (4, 3, 0), "diamond-pearl": (7, 5, 1), "black-white": (10, 7, 2)}

def draw_rock(d,x,y,size):
    d.polygon([(x-size,y),(x-3,y-size),(x+size-2,y-size+2),(x+size,y+3),(x,y+size),(x-size,y+3)],fill="#986c48",outline="#503b2c")
    d.line([(x-size+2,y),(x,y-3),(x+2,y+size-2)],fill="#d6af78",width=2)

def leaf():
    im=Image.new("RGBA",(14,14));d=ImageDraw.Draw(im)
    d.polygon([(1,12),(3,4),(13,0),(12,10),(5,13)],fill="#64b33f",outline="#28682d")
    d.line((2,12,11,2),fill="#dcf7a1")
    return im

def stamp(image,part,x,y):
    image.alpha_composite(part,(round(x-part.width/2),round(y-part.height/2)))

def frame(move,index,count,style,impact):
    t=index/max(count-1,1)
    im=Image.new("RGBA",(48,48));d=ImageDraw.Draw(im)
    detail=3+style
    if move=="노말":
        if not impact: return im
        r=4+round(t*18)
        points=[]
        for i in range(16):
            a=i*math.pi/8;length=r if i%2==0 else r/3
            points.append((24+round(math.cos(a)*length),24+round(math.sin(a)*length)))
        d.polygon(points,fill="#fff1b6",outline="#e7a03b")
    elif move in ("물","드래곤","에스퍼"):
        palettes={
            "물":("#2383df","#7de1ff","#f3ffff"),
            "드래곤":("#6544c6","#9b83f1","#b6f8ff"),
            "에스퍼":("#b445c7","#fb8bd2","#fff1b0"),
        }
        dark,light,white=palettes[move]
        if not impact:
            for x in range(0,48,3):
                y=24+(round(math.sin(x/6-t*15)*2) if move!="물" else (index+x//3)%3-1)
                spread=4+round(x/48*5)
                d.rectangle((x,y-spread,x+2,y+spread),fill=dark)
                d.rectangle((x,y-3,x+2,y+3),fill=light)
                if (x//3+index)%4==0:d.rectangle((x,y-1,x+2,y+1),fill=white)
        else:
            for i in range(7):
                x=24+round((i-3)*(2+4*t))
                y=30-round(math.sin(math.pi*t)*(15-abs(i-3)*2))+round(t*(i-3)**2/2)
                d.rectangle((x-1,y-4,x+1,y+1),fill=light)
    elif move=="전기":
        r=4+round(t*18)
        # Angular stepped waves, drawn on the integer grid.
        for ring in range(2):
            q=max(2,r-ring*5)
            d.ellipse((24-q,24-q,24+q,24+q),outline="#ffe23e" if ring==0 else "#fff4a5",width=2)
        for i in range(detail+2):
            angle=i*math.pi*2/(detail+2)
            x,y=24+round(math.cos(angle)*r),24+round(math.sin(angle)*r)
            d.line([(x-2,y-3),(x+1,y),(x-1,y+1),(x+2,y+3)],fill="#fff39b")
    elif move=="격투":
        if not impact:
            y=3+round(t*18)
            # Extended fingers, palm and wrist form a downward chopping hand.
            d.polygon([(15,y),(19,y),(19,y-2),(23,y-2),(23,y),(27,y),(27,y+3),(30,y+3),(30,y+14),(25,y+19),(18,y+18),(14,y+11),(10,y+8),(10,y+4),(14,y+5)],fill="#ffe3b4",outline="#a7704f")
            for x in (19,23,27):d.line((x,y+2,x,y+10),fill="#c68b65")
            draw_rock(d,24,38,7)
        else:
            for i in range(5):
                a=i*math.pi*2/5
                draw_rock(d,24+round(math.cos(a)*(4+15*t)),32+round(math.sin(a)*9*t),max(2,5-round(t*3)))
    elif move=="바위":
        for i in range(detail):
            x=7+i*8
            if impact:
                draw_rock(d,x,32+round(t*8),max(2,5-round(t*3)))
            else:
                y=-14+round(t*48)+(i%3)*7
                draw_rock(d,x,y,5)
    elif move=="땅":
        for i in range(detail+1):
            x=10+i*6;y=19+i%3*5
            if impact:
                d.polygon([(x-4,y),(x-2,y-5),(x+2,y-3),(x+6,y-1),(x+2,y+3),(x+2,y+8),(x-1,y+4),(x-5,y+4)],fill="#805033")
                d.rectangle((x-1,y-2,x+2,y),fill="#c49358")
            else:
                d.polygon([(x-3,y),(x-1,y-4),(x+4,y-2),(x+3,y+3),(x-2,y+4)],fill="#805033",outline="#b98851")
    elif move=="고스트":
        top=10
        d.rounded_rectangle((17,top,31,37),radius=5,fill="#da77a4",outline="#86325e",width=2)
        d.line((24,top+6,24,33),fill="#ffa9c7",width=2)
    elif move=="불꽃":
        for i in range(detail+1):
            a=i*math.pi*2/(detail+1)+0.3
            r=4+round(t*17)
            x,y=24+round(math.cos(a)*r),24+round(math.sin(a)*r)
            d.line((x-3,y-3,x+3,y+3),fill="#ff8c33",width=2)
            d.line((x+3,y-3,x-3,y+3),fill="#ffe58e")
            d.rectangle((x-1,y-1,x+1,y+1),fill="#fff1b5")
    elif move=="얼음":
        for i in range(12+style*3):
            x=(i*13)%44+2;y=(i*11+round(t*18))%43+2
            d.line((x-2,y,x+2,y),fill="#8ccde7")
            d.line((x,y-2,x,y+2),fill="#efffff")
    elif move=="벌레":
        for i in range(3):
            x=15+i*6;y=14+i*10
            d.polygon([(x-10,y+4),(x+13,y),(x-7,y-3),(x-4,y)],fill="#f3efb7",outline="#739344")
            d.line((x-8,y+1,x+8,y),fill="#fffce4")
    elif move in ("악","독"):
        gap=round((1-t)*13) if not impact else 0
        d.line((3,13-gap,45,13-gap),fill="#615169",width=3)
        d.line((3,35+gap,45,35+gap),fill="#615169",width=3)
        for x in (7,15,24,33,41):
            color="#d0a4f1" if move=="독" else "#fff0cf"
            d.polygon([(x-3,14-gap),(x+3,14-gap),(x,24-gap)],fill=color)
            d.polygon([(x-3,34+gap),(x+3,34+gap),(x,24+gap)],fill=color)
        if move=="독" and impact:
            for i in range(4):
                x=9+i*10;y=25+round(t*12)
                d.rectangle((x,y,x+2,y+4),fill="#a450d6")
    elif move=="풀":
        for i in range(detail):
            part=leaf()
            stamp(im,part,9+i*7,14+i%3*9)
    elif move=="페어리":
        heart=Image.new("RGBA",(40,36));h=ImageDraw.Draw(heart)
        h.polygon([(20,34),(1,16),(1,8),(8,1),(15,1),(20,7),(25,1),(32,1),(39,8),(39,16)],fill="#f581b7",outline="#af3974")
        mask=heart.getchannel("A")
        stripes=Image.new("RGBA",heart.size)
        stripe_draw=ImageDraw.Draw(stripes)
        for radius in (7,16,25):
            stripe_draw.ellipse((20-radius,18-radius,20+radius,18+radius),outline="#fff8fb",width=4)
        stripes.putalpha(Image.composite(stripes.getchannel("A"),Image.new("L",heart.size),mask))
        heart.alpha_composite(stripes)
        h=ImageDraw.Draw(heart)
        h.rectangle((7,6,13,8),fill="#ffe5f2")
        size=round((0.5+0.5*t)*40) if not impact else round(40*(1-0.15*t))
        heart=heart.resize((size,round(size*.9)),Image.Resampling.NEAREST)
        stamp(im,heart,24,24)
    elif move=="강철":
        tail=Image.new("RGBA",(48,48));w=ImageDraw.Draw(tail)
        w.polygon([(3,39),(9,28),(20,23),(31,14),(40,3),(44,8),(37,24),(25,33),(12,37)],fill="#99aebb",outline="#465c70")
        w.line([(8,34),(22,28),(35,18),(40,9)],fill="#efffff",width=3)
        im=tail.rotate(-65+round(t*110),resample=Image.Resampling.NEAREST)
    elif move=="비행":
        wing=Image.new("RGBA",(48,48));w=ImageDraw.Draw(wing)
        w.polygon([(5,32),(14,16),(40,5),(32,18),(38,15),(28,28),(33,24),(23,35),(15,39)],fill="#d9e6ef",outline="#8dabc6")
        for i in range(3):w.line((12+i*5,32,29+i*3,14),fill="#a4baca",width=2)
        im=wing
    if impact and move not in ("노말","물","드래곤","에스퍼","격투","바위","땅","독"):
        # Fade out the completed move rather than restarting its trajectory.
        im.putalpha(im.getchannel("A").point(lambda value:round(value*(1-t*.85))))
    if style==0:
        im=im.resize((24,24),Image.Resampling.NEAREST).resize((48,48),Image.Resampling.NEAREST)
    return im

for name,(flight,impact,style) in STYLES.items():
    sheet=Image.new("RGBA",(48*(flight+impact),48*18))
    for row,move in enumerate(MOVES):
        for col in range(flight+impact):
            hit=col>=flight
            local=col-flight if hit else col
            # These sequences hold their final pose on impact.
            if hit and move in ("고스트","강철","비행","벌레","풀","얼음"):
                image=frame(move,flight-1,flight,style,False)
                image.putalpha(image.getchannel("A").point(lambda value:round(value*(1-local/max(1,impact-1)))))
            else:
                image=frame(move,local,impact if hit else flight,style,hit)
            sheet.alpha_composite(image,(48*col,48*row))
    sheet.save(ROOT/"assets/effects"/name/"moves.png",optimize=True)
