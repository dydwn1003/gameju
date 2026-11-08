"""제미나이 격자 이미지 → 칸별로 잘라 마젠타 배경 제거 → assets/ 에 저장
사용: python3 tools/slice_grids.py <격자이미지 폴더>
  폴더 안 파일 이름: grid_e01.jpg/png ... grid_m10.jpg/png (페이지 순서대로 p-000.jpg ... 도 지원)
"""
import sys, re, pathlib, json
import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCALE = 0.5  # 원본 → 게임용 축소 비율 (모든 몬스터 같은 비율 → 크기 차이 유지)

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
    m = Image.fromarray((cand * 255).astype(np.uint8), 'L')
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
        out = outdir / kind / f'{mid}.png'
        out.parent.mkdir(parents=True, exist_ok=True)
        rgba.save(out, optimize=True)
        res[mid] = rgba.size
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
    js = 'window.ASSET_SIZES = ' + json.dumps(sizes, separators=(',', ':')) + ';\n'
    (ROOT / 'assets' / 'sizes.js').write_text(js)
    print('완료:', len(sizes), '장')

if __name__ == '__main__':
    main()
