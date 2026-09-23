"""걷기 애니메이션 리소스 시트(양피지 배경) → 게임용 프레임 시트 변환.

사용: python3 tools/extract_walk.py <원본 이미지> <키> [--height 78]
 - 원본: "왼쪽으로 걷기 / 오른쪽으로 걷기 / 아래쪽으로 걷기 / 위쪽으로 걷기" 줄로 캐릭터가 나열된 이미지
 - 결과: assets/anim/<키>.png  (줄 순서: 0 아래, 1 위, 2 왼쪽, 3 오른쪽)
         assets/anim/<키>.json (manifest.js 에 넣을 설정)
배경 제거는 가장자리에서 양피지색을 flood-fill 하므로 윤곽선 안쪽의 밝은 색(피부 등)은 지워지지 않는다.
"""
import json
import sys
from collections import deque

import numpy as np
from PIL import Image
from scipy import ndimage

src, key = sys.argv[1], sys.argv[2]
TARGET_H = int(sys.argv[sys.argv.index('--height') + 1]) if '--height' in sys.argv else 78   # 몸 높이 (3배 해상도 px)

img = Image.open(src).convert('RGB')
a = np.asarray(img).astype(int)
H, W, _ = a.shape
R_, G_, B_ = a[..., 0], a[..., 1], a[..., 2]
# 양피지(배경) 색 범위
bgish = (R_ >= 222) & (G_ >= 192) & (B_ >= 150) & ((R_ - B_) >= 15) & ((R_ - B_) <= 80) & ((R_ - G_) <= 40)

# 가장자리에서 flood-fill → 바깥 배경
bg = np.zeros((H, W), bool)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if bgish[y, x]: bg[y, x] = True; q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if bgish[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not bg[ny, nx] and bgish[ny, nx]:
            bg[ny, nx] = True; q.append((ny, nx))
fg = ~bg
fg = ndimage.binary_opening(fg, iterations=1)          # 잡티 제거

# 캐릭터 덩어리 찾기 (칼이 떨어져 있어도 한 덩어리로 묶이도록 살짝 팽창)
lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=4))
blobs = []
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    ys, xs = sl
    h, w = ys.stop - ys.start, xs.stop - xs.start
    area = (lab[sl] == i).sum()
    if h < 60 or w < 30 or area < 1500: continue       # 글자·잡티 제외
    blobs.append({'y0': ys.start, 'y1': ys.stop, 'x0': xs.start, 'x1': xs.stop, 'id': i})

# 줄 나누기 (세로 위치로 묶기)
blobs.sort(key=lambda b: (b['y0'] + b['y1']) / 2)
rows, cur = [], []
for b in blobs:
    cy = (b['y0'] + b['y1']) / 2
    if cur and abs(cy - np.mean([(c['y0'] + c['y1']) / 2 for c in cur])) > 60:
        rows.append(cur); cur = []
    cur.append(b)
if cur: rows.append(cur)
rows = [r for r in rows if np.median([b['y1'] - b['y0'] for b in r]) >= 90]   # 제목 글자 줄 제외
for r in rows: r.sort(key=lambda b: b['x0'])
print('rows:', [len(r) for r in rows])

# 시트 구성: 첫 줄 = 왼쪽(앞 절반) + 오른쪽(뒤 절반), 둘째 줄 = 아래, 셋째 줄 = 위
def split_half(r):
    mid = W / 2
    return [b for b in r if (b['x0'] + b['x1']) / 2 < mid], [b for b in r if (b['x0'] + b['x1']) / 2 >= mid]
left, right = split_half(rows[0])
down = split_half(rows[1])[0] or rows[1]
up = rows[2]
groups = {'down': down, 'up': up, 'left': left, 'right': right}

def crop(b):
    m = (lab[b['y0']:b['y1'], b['x0']:b['x1']] == b['id']) & fg[b['y0']:b['y1'], b['x0']:b['x1']]
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    m = m[y0:y1, x0:x1]
    rgb = a[b['y0'] + y0:b['y0'] + y1, b['x0'] + x0:b['x0'] + x1]
    # 기준점: 발(아래 25%)의 가로 중심
    fy = int(m.shape[0] * 0.75)
    fx = np.nonzero(m[fy:])[1].mean()
    return {'rgb': rgb, 'm': m, 'ax': fx, 'h': m.shape[0]}

frames = {k: [crop(b) for b in v] for k, v in groups.items()}
body_h = np.median([f['h'] for f in frames['down']])
s = TARGET_H / body_h
print('body height', body_h, 'scale', round(s, 3))

def scaled(f):
    h, w = f['m'].shape
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    rgb = Image.fromarray(f['rgb'].astype(np.uint8)).resize((nw, nh), Image.LANCZOS)
    al = Image.fromarray((f['m'] * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)
    al = al.point(lambda v: 255 if v >= 110 else 0)
    im = rgb.convert('RGBA'); im.putalpha(al)
    return im, f['ax'] * s

out = {k: [scaled(f) for f in v] for k, v in frames.items()}
L = max(max(ax for im, ax in v) for v in out.values())
Rr = max(max(im.width - ax for im, ax in v) for v in out.values())
half = int(np.ceil(max(L, Rr))) + 1
FW = half * 2
FH = int(max(im.height for v in out.values() for im, _ in v)) + 2
FW += (6 - FW % 6) % 6; FH += (3 - FH % 3) % 3              # 3배 해상도 → 논리 픽셀로 딱 나누어지게
half = FW // 2
order = ['down', 'up', 'left', 'right']
cols = max(len(out[k]) for k in order)
sheet = Image.new('RGBA', (FW * cols, FH * len(order)), (0, 0, 0, 0))
idle = {}
for r, k in enumerate(order):
    spread = []
    for c, (im, ax) in enumerate(out[k]):
        sheet.alpha_composite(im, (c * FW + int(round(half - ax)), r * FH + FH - 1 - im.height))
        # 다리를 가장 모은 프레임 = 대기 자세
        al = np.asarray(im)[..., 3] > 0
        spread.append(np.ptp(np.nonzero(al[int(al.shape[0] * 0.85):])[1]) if al[int(al.shape[0] * 0.85):].any() else 99)
    idle[k] = int(np.argmin(spread))
sheet.save(f'assets/anim/{key}.png')
cfg = {
    'src': f'assets/anim/{key}.png', 'fw': FW, 'fh': FH, 'scale': 3,
    'rows': {k: i for i, k in enumerate(order)},
    'idle': {k: [idle[k]] for k in order},
    'walk': {k: list(range(len(out[k]))) for k in order},
    'walkPerTile': {k: len(out[k]) / 2 for k in order},     # 두 칸에 한 사이클
}
json.dump(cfg, open(f'assets/anim/{key}.json', 'w'), ensure_ascii=False)
print(json.dumps(cfg, ensure_ascii=False))
