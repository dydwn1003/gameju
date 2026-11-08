"""제미나이 격자 이미지 → 칸별로 잘라 마젠타 배경 제거 → assets/ 에 저장
사용: python3 tools/slice_grids.py <격자이미지 폴더>
      python3 tools/slice_grids.py <폴더> --suffix _cast   (마법 쓰는 모습 격자)
      python3 tools/slice_grids.py --hero <폴더> fox_f,fox_m,goblin_f,goblin_m,human_f,human_m
  폴더 안 파일 이름: grid_e01.jpg/png ... grid_m10.jpg/png (페이지 순서대로 p-000.jpg ... 도 지원)
"""
import sys, re, pathlib, json
import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCALE = 0.5  # 원본 → 게임용 축소 비율 (모든 몬스터 같은 비율 → 크기 차이 유지)
SUFFIX = ''   # '_cast' 이면 마법 쓰는 모습 격자

def load_order():
    """js/data.js 에서 몬스터/적 id 순서를 읽는다 (node 없이 정규식으로)"""
    src = (ROOT / 'js/data.js').read_text()
    raw = src[src.index('const LINES_RAW'):src.index('const LINES =')]
    lines = re.findall(r"\{ id: '([a-z_]+)',\s*el:\s*'(\w+)',\s*r:\s*'(\w+)'", raw)
    ens = src[src.index('const ENEMIES'):src.index('const ENEMY_MAP')]
    enemies = re.findall(r"\{ id: '([a-z_]+)'", ens)
    normal = [i for i, el, r in lines if r != 'SSS']
    sss = [i for i, el, r in lines if r == 'SSS']
    return normal, sss, enemies

def grids():
    normal, sss, enemies = load_order()
    out = []
    for k in range(3):
        out.append((f'grid_e{k + 1:02d}', 3, 3, enemies[k * 9:(k + 1) * 9], 'enemies'))
    chunks = [normal[i:i + 9] for i in range(0, len(normal), 9)]
    for k, ch in enumerate(chunks):
        out.append((f'grid_m{k + 1:02d}', 3, 3, ch, 'monsters'))
    out.append((f'grid_m{len(chunks) + 1:02d}', 1, 3, sss, 'monsters'))
    return out

def is_magenta(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    mn = np.minimum(r, b)
    return (r > 90) & (b > 90) & (g < mn * 0.62) & (np.abs(r - b) < 80)

def is_pinkish(a):  # 배경과 섞인 가장자리 (반투명 섞임)
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (r > 120) & (b > 110) & (g < np.minimum(r, b) * 0.8) & (np.abs(r - b) < 90)

def key_out(cell):
    a = np.asarray(cell.convert('RGB'))
    h, w = a.shape[:2]
    cand = is_magenta(a)
    m = Image.fromarray((cand * 255).astype(np.uint8), 'L').copy()
    for x in range(w):
        for y in (0, h - 1):
            if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
    for y in range(h):
        for x in (0, w - 1):
            if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
    bg = np.asarray(m) == 128
    pink = is_pinkish(a)
    for _ in range(2):  # 배경에 붙은 분홍 테두리 정리
        nb = np.zeros_like(bg)
        nb[1:] |= bg[:-1]; nb[:-1] |= bg[1:]; nb[:, 1:] |= bg[:, :-1]; nb[:, :-1] |= bg[:, 1:]
        bg = bg | (nb & pink)
    # 배경 안쪽에 갇힌 마젠타(꼬리 사이 등)도 제거
    bg = bg | (cand & is_magenta(a))
    rgba = np.dstack([a, np.where(bg, 0, 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')

def remove_watermark(img):
    """제미나이 반짝이 워터마크(오른쪽 아래) 제거"""
    a = np.array(img)
    h, w = a.shape[:2]
    y0, x0 = int(h * 0.86), int(w * 0.93)
    box = a[y0:, x0:]
    r, g, b = box[..., 0].astype(int), box[..., 1].astype(int), box[..., 2].astype(int)
    light = (np.minimum(r, b) > 160) & (g > 100)
    box[light] = [255, 0, 255]
    return Image.fromarray(a)

def process(path, rows, cols, ids, kind, outdir):
    img = Image.open(path).convert('RGB')
    img = remove_watermark(img)
    W, H = img.size
    cw, ch = W / cols, H / rows
    res = {}
    for i, mid in enumerate(ids):
        r, c = divmod(i, cols)
        pad = 6
        cell = img.crop((int(c * cw) + pad, int(r * ch) + pad, int((c + 1) * cw) - pad, int((r + 1) * ch) - pad))
        cell = cell.resize((int(cell.width * SCALE), int(cell.height * SCALE)), Image.LANCZOS)
        rgba = key_out(cell)
        bbox = rgba.getchannel('A').point(lambda v: 255 if v > 0 else 0).getbbox()
        if not bbox:
            print('  ! 비어있음', mid); continue
        x0, y0, x1, y1 = bbox
        rgba = rgba.crop((max(0, x0 - 2), max(0, y0 - 2), min(rgba.width, x1 + 2), min(rgba.height, y1 + 2)))
        out = outdir / kind / f'{mid}{SUFFIX}.png'
        out.parent.mkdir(parents=True, exist_ok=True)
        rgba.save(out, optimize=True)
        res[mid + SUFFIX] = rgba.size
    return res

def main():
    src = pathlib.Path(sys.argv[1])
    files = sorted([p for p in src.iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png')])
    by_name = {p.stem: p for p in files}
    plan = grids()
    pages = [p for p in files if p.stem.startswith('p-')]
    sizes = {}
    for idx, (name, rows, cols, ids, kind) in enumerate(plan):
        path = by_name.get(name) or (pages[idx] if idx < len(pages) else None)
        if not path:
            print('없음:', name); continue
        print(f'{name} ← {path.name} ({len(ids)}칸)')
        sizes.update(process(path, rows, cols, ids, kind, ROOT / 'assets'))
    # 이미지 크기 표 (게임에서 몬스터끼리 크기 비율 유지용)
    merge_sizes(sizes)
    print('완료:', len(sizes), '장')



# ===================== 캐릭터 (동작 시트 + 큰 그림) =====================
def components(alpha):
    """알파 마스크의 연결 덩어리 목록 [(넓이, (x0,y0,x1,y1), 라벨이미지값)]"""
    m = Image.fromarray(np.where(alpha > 0, 255, 0).astype(np.uint8), 'L').copy()
    a = np.asarray(m).copy()
    h, w = a.shape
    comps = []
    lab = 1
    ys, xs = np.nonzero(a == 255)
    for y, x in zip(ys, xs):
        if m.getpixel((int(x), int(y))) != 255: continue
        ImageDraw.floodfill(m, (int(x), int(y)), lab)
        arr = np.asarray(m) == lab
        yy, xx = np.nonzero(arr)
        comps.append((len(yy), (xx.min(), yy.min(), xx.max(), yy.max()), lab))
        lab += 1
        if lab >= 250: break
    return comps, np.asarray(m)

def drop_strays(rgba, strict=False):
    """본체에서 멀리 떨어진 작은 조각(잘못 그려진 발, 작은 머리 등) 제거"""
    a = np.array(rgba)
    comps, labels = components(a[..., 3])
    if not comps: return rgba
    big = max(comps)
    bx0, by0, bx1, by1 = big[1]
    mw, mh = (bx1 - bx0) * 0.08, (by1 - by0) * 0.08
    for area, (x0, y0, x1, y1), lab in comps:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        inside = bx0 - mw <= cx <= bx1 + mw and by0 - mh <= cy <= by1 + mh
        if (strict and area < big[0] * 0.06) or (area < big[0] * 0.08 and not inside):
            a[labels == lab, 3] = 0
    return Image.fromarray(a, 'RGBA')

def process_hero(sheet_path, portrait_path, key, outdir, scale=0.45, pscale=0.3):
    """동작 시트(2x3: 서기·달리기·공격·기모으기·발사·피격)를 같은 틀로 잘라 프레임 정렬"""
    img = remove_watermark(Image.open(sheet_path).convert('RGB'))
    W, H = img.size
    cw, ch = W / 3, H / 2
    cells = []
    for i in range(6):
        r, c = divmod(i, 3)
        cell = img.crop((int(c * cw) + 16, int(r * ch) + 16, int((c + 1) * cw) - 16, int((r + 1) * ch) - 16))
        cell = cell.resize((int(cell.width * scale), int(cell.height * scale)), Image.LANCZOS)
        cells.append(drop_strays(key_out(cell)))
    boxes = [c.getchannel('A').point(lambda v: 255 if v else 0).getbbox() for c in cells]
    boxes = [b for b in boxes if b]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    d = outdir / 'hero'
    d.mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(cells):
        c.crop((x0, y0, x1, y1)).save(d / f'{key}_p{i}.png', optimize=True)
    p = remove_watermark(Image.open(portrait_path).convert('RGB'))
    p = p.resize((int(p.width * pscale), int(p.height * pscale)), Image.LANCZOS)
    pr = drop_strays(key_out(p), strict=True)
    pr = pr.crop(pr.getchannel('A').point(lambda v: 255 if v else 0).getbbox())
    pr.save(d / f'{key}.png', optimize=True)
    return {f'hero_{key}': [x1 - x0, y1 - y0]}

def merge_sizes(new):
    f = ROOT / 'assets' / 'sizes.js'
    cur = {}
    if f.exists():
        t = f.read_text()
        cur = json.loads(t[t.index('{'):t.rindex('}') + 1])
    cur.update(new)
    f.write_text('window.ASSET_SIZES = ' + json.dumps(cur, separators=(',', ':')) + ';\n')

def main_hero(src, order):
    """src 폴더의 이미지 순서: (동작시트, 큰그림) 쌍이 order 순서대로"""
    files = sorted([p for p in pathlib.Path(src).iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png') and p.stem.startswith('p-')])
    sizes = {}
    for k, key in enumerate(order):
        sheet, portrait = files[k * 2], files[k * 2 + 1]
        print(f'{key} ← {sheet.name}, {portrait.name}')
        sizes.update(process_hero(sheet, portrait, key, ROOT / 'assets'))
    merge_sizes(sizes)
    print('완료:', sizes)


if __name__ == '__main__':
    if sys.argv[1] == '--hero':
        main_hero(sys.argv[2], sys.argv[3].split(','))
    else:
        if '--suffix' in sys.argv: SUFFIX = sys.argv[sys.argv.index('--suffix') + 1]
        main()
