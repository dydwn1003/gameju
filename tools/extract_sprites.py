"""디자인 시트(assets/design/design-sheet.webp)에서 캐릭터/몬스터를 잘라 스프라이트 아틀라스를 만든다.

사용법:  python3 tools/extract_sprites.py
출력:    assets/sprites.png, js/sheet-data.js
필요:    pip install pillow numpy scipy
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/design/design-sheet.webp'
SCALE = 3  # 게임 캔버스 배율 (R.SCALE)

# key: (x0, y0, x1, y1, 게임 내 논리 높이 px, 원본이 바라보는 방향 1=오른쪽 -1=왼쪽 0=정면)
# LOOSE: 격자선이 배경 제거를 막는 큰 스프라이트는 더 넓은 기준으로 배경을 지운다
SPRITES = {
    # 직업 / 전직
    'GLADIATOR': (108, 255, 188, 360, 26, 0),
    'RANGER': (103, 466, 184, 577, 26, 0),
    'MAGE': (108, 680, 212, 792, 27, 1),
    'ASSASSIN': (106, 903, 188, 1010, 26, 0),
    'GUARDIAN': (333, 253, 437, 359, 27, 0),
    'BERSERKER': (576, 253, 707, 359, 28, 1),
    'SNIPER': (328, 466, 447, 577, 27, 1),
    'TRAPPER': (570, 476, 684, 577, 26, 1),
    'ARCHMAGE': (346, 673, 440, 794, 29, 1),
    'WARLOCK': (558, 673, 684, 792, 29, 0),
    'ASSASSIN2': (318, 903, 447, 1010, 27, 0),
    'NINJA': (543, 908, 687, 1010, 27, -1),
    # 1지역
    'slime': (1148, 273, 1217, 324, 12, 0),
    'goblin': (1270, 246, 1337, 324, 20, 0),
    'mushroom': (1390, 253, 1460, 324, 17, 0),
    'wolf': (1490, 243, 1612, 324, 19, 1),
    'spider': (1638, 253, 1737, 324, 15, 0),
    'forest_beast': (1798, 188, 1922, 324, 50, 0),
    # 2지역
    'skeleton': (1153, 403, 1234, 497, 23, 0),
    'ghost': (1306, 396, 1397, 494, 21, 0),
    'bandit': (1483, 406, 1567, 497, 22, 1),
    'gargoyle': (1618, 396, 1747, 499, 27, 0),
    'fallen_knight': (1813, 413, 1912, 497, 48, 0),
    # 3지역
    'mine_goblin': (1158, 581, 1227, 669, 21, 0),
    'golem': (1296, 558, 1412, 669, 30, 0),
    'bat': (1456, 580, 1580, 650, 14, 0),
    'lava_worm': (1618, 576, 1744, 669, 22, 1),
    'iron_golem': (1798, 577, 1917, 669, 52, 0),
    # 4지역
    'ice_wolf': (1123, 758, 1262, 842, 20, 1),
    'frost_mage': (1318, 736, 1410, 842, 25, 1),
    'ice_knight': (1476, 720, 1567, 842, 26, 0),
    'ice_king': (1798, 708, 1920, 842, 54, 0),
    # 5지역
    'demon': (1128, 913, 1242, 1017, 27, 0),
    'fallen_angel': (1296, 898, 1404, 1017, 27, 0),
    'hellhound': (1460, 918, 1584, 1017, 21, -1),
    'demon_knight': (1628, 898, 1737, 1017, 28, 0),
    'void_king': (1788, 878, 1930, 1017, 58, 0),
}

LOOSE = {'forest_beast', 'fallen_knight', 'iron_golem', 'ice_king', 'void_king'}
# PLAIN: 밝은 칼날이 종이색과 비슷해서 기본 기준만 쓰는 스프라이트
PLAIN = {'BERSERKER'}


def grid_lines(img):
    """모눈종이 격자선(중간 회색, 약 33px 간격)의 x/y 좌표를 찾는다."""
    a = np.array(img.convert('RGB')).astype(int)
    mx, mn = a.max(2), a.min(2)
    g = (mn > 100) & (mx < 215) & ((mx - mn) < 25)
    reg = g[130:1060, 40:1960]
    cols = {i + 40 for i, v in enumerate(reg.mean(0)) if v > 0.3}
    rows = {i + 130 for i, v in enumerate(reg.mean(1)) if v > 0.3}
    return cols, rows


def cut(img, box, grid, loose=False, bone=False, plain=False):
    x0, y0, x1, y1 = box
    a = np.array(img.crop((x0, y0, x1, y1)).convert('RGB')).astype(int)
    mx, mn = a.max(2), a.min(2)
    cols, rows = grid
    on_grid = np.zeros(mx.shape, bool)
    for c in cols:
        for d in (-1, 0, 1):
            if 0 <= c + d - x0 < mx.shape[1]:
                on_grid[:, c + d - x0] = True
    for r in rows:
        for d in (-1, 0, 1):
            if 0 <= r + d - y0 < mx.shape[0]:
                on_grid[r + d - y0, :] = True
    gridpx = on_grid & (mn > 95) & (mx < 190) & ((mx - mn) < 30)
    # 모눈종이 배경(밝은 베이지)과 격자선(회색)은 채도가 낮고 밝다
    r, g_, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    # 종이색: 따뜻한 베이지(r ≥ g ≥ b, r-b 4~55). 비네팅으로 밝기가 달라서 범위를 넓게 잡는다
    paper_hue = (mn > 170) & (r >= g_) & (g_ >= b - 4) & (r - b >= 4) & (r - b <= 55)
    bgish = ((mx - mn) < 48) & (mn > 115) if loose else ((mx - mn) < 34) & (mn > 150)
    if plain:
        paper_hue = (mn > 195) & ((mx - mn) < 32) & (r - b >= 10)
        gridpx &= False
    bgish |= paper_hue
    bgish |= gridpx
    lab, _ = nd.label(bgish)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    fg = ~bg
    # 무기와 몸 사이 등에 갇힌 모눈종이 조각 제거 (뼈 색과 비슷한 해골병사는 제외)
    if not bone:
        paper = paper_hue & (mn > 185)
        plab, pn = nd.label(paper)
        if pn:
            psz = nd.sum(paper, plab, range(1, pn + 1))
            fg &= ~np.isin(plab, [i + 1 for i, v in enumerate(psz) if v >= 6])
    # 격자선 위에서 선 양옆이 모두 배경인 픽셀은 종이 위의 선이므로 지운다
    H_, W_ = fg.shape
    for _ in range(2):
        kill = np.zeros_like(fg)
        for c in cols:
            x = c - x0
            for xx in (x - 1, x, x + 1):
                if 2 <= xx < W_ - 2:
                    kill[:, xx] |= fg[:, xx] & ~fg[:, xx - 2] & ~fg[:, xx + 2]
        for rr in rows:
            y = rr - y0
            for yy in (y - 1, y, y + 1):
                if 2 <= yy < H_ - 2:
                    kill[yy, :] |= fg[yy, :] & ~fg[yy - 2, :] & ~fg[yy + 2, :]
        fg &= ~kill
    # 자잘한 격자 조각 제거: 가장 큰 덩어리 + 그에 가까운 조각만 남긴다
    flab, n = nd.label(fg)
    if n > 1:
        sizes = nd.sum(fg, flab, range(1, n + 1))
        keep = np.zeros_like(fg)
        big = sizes.max()
        for i, sz in enumerate(sizes, 1):
            if sz >= max(25, big * 0.02):
                keep |= flab == i
        fg = keep
    rgba = np.dstack([a, np.where(fg, 255, 0)]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    bb = im.getbbox()
    return im.crop(bb)


def main():
    sheet = Image.open(SRC)
    grid = grid_lines(sheet)
    frames, tiles = {}, []
    for key, (x0, y0, x1, y1, h, face) in SPRITES.items():
        im = cut(sheet, (x0, y0, x1, y1), grid, key in LOOSE, key == 'skeleton', key in PLAIN)
        ph = h * SCALE
        pw = max(SCALE * 2, round(im.width * ph / im.height))
        res = Image.LANCZOS if ph < im.height else Image.NEAREST
        im = im.resize((pw, ph), res)
        # 알파 경계를 선명하게 (픽셀아트 느낌 유지)
        al = np.array(im)[:, :, 3]
        arr = np.array(im)
        arr[:, :, 3] = np.where(al > 110, 255, 0)
        im = Image.fromarray(arr, 'RGBA')
        # 폭/높이를 6의 배수로 맞춰 논리 좌표 절반이 정수 물리 픽셀이 되게 한다
        W = -(-im.width // 6) * 6
        H = -(-im.height // 6) * 6
        pad = Image.new('RGBA', (W, H))
        pad.paste(im, ((W - im.width) // 2, H - im.height))
        tiles.append((key, pad, face))
    # 선반(shelf) 방식 아틀라스 배치
    AW = 1024
    x = y = rowh = 0
    place = []
    for key, im, face in sorted(tiles, key=lambda t: -t[1].height):
        if x + im.width > AW:
            x, y, rowh = 0, y + rowh + 2, 0
        place.append((key, im, face, x, y))
        x += im.width + 2
        rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (AW, y + rowh))
    for key, im, face, px, py in place:
        atlas.paste(im, (px, py))
        frames[key] = {'x': px, 'y': py, 'w': im.width, 'h': im.height, 'face': face}
    atlas.save(ROOT / 'assets/sprites.png', optimize=True)
    js = '// 자동 생성: tools/extract_sprites.py — 직접 수정하지 말 것\n'
    js += "'use strict';\nR.SHEET = " + json.dumps({'src': 'assets/sprites.png', 'scale': SCALE, 'frames': frames}, ensure_ascii=False) + ';\n'
    (ROOT / 'js/sheet-data.js').write_text(js, encoding='utf-8')
    print(f'{len(frames)} sprites → atlas {atlas.size}')


if __name__ == '__main__':
    main()
