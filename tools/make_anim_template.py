"""도트 애니메이션 시트 템플릿 생성기.

assets/anim/TEMPLATE.png (실제 크기) 와 TEMPLATE_x4.png (보기용 4배)를 만든다.
칸마다 발 위치(빨간 선)와 가운데 선(파란 점선)이 그려져 있어 그 위에 그리면 된다.
사용: python3 tools/make_anim_template.py [칸너비 칸높이]
"""
import sys
from PIL import Image, ImageDraw

FW, FH = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (32, 48)
COLS = ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'atk1', 'atk2', 'atk3', 'hurt']
ROWS = ['down', 'up', 'side(R)']

img = Image.new('RGBA', (FW * len(COLS), FH * len(ROWS)), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
for r in range(len(ROWS)):
    for c in range(len(COLS)):
        x, y = c * FW, r * FH
        shade = (40, 40, 60, 40) if (r + c) % 2 else (60, 60, 90, 40)
        d.rectangle([x, y, x + FW - 1, y + FH - 1], fill=shade, outline=(120, 120, 160, 160))
        d.line([x + 2, y + FH - 3, x + FW - 3, y + FH - 3], fill=(255, 60, 60, 200))          # 발 위치
        for yy in range(y + 2, y + FH - 3, 3):
            d.point((x + FW // 2, yy), fill=(80, 150, 255, 160))                                # 가운데 선
img.save('assets/anim/TEMPLATE.png')

big = img.resize((img.width * 4, img.height * 4), Image.NEAREST)
bd = ImageDraw.Draw(big)
for c, name in enumerate(COLS):
    bd.text((c * FW * 4 + 4, 2), f'{c}:{name}', fill=(255, 255, 255, 255))
for r, name in enumerate(ROWS):
    bd.text((4, r * FH * 4 + FH * 4 - 30), f'row{r}:{name}', fill=(255, 220, 120, 255))
big.save('assets/anim/TEMPLATE_x4.png')
print('saved', img.size, big.size)
