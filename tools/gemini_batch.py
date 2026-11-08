"""Gemini API로 프롬프트북 그림을 일괄 생성한다.

준비
  1) https://aistudio.google.com/apikey 에서 API 키 발급 (이미지 생성은 결제 연결 필요할 수 있음)
  2) 둘 중 하나로 키를 넣는다
     - 환경 변수:  export GEMINI_API_KEY=발급받은키
     - Claude 클라우드 환경: Network secrets 에 host=generativelanguage.googleapis.com,
       header=x-goog-api-key 로 저장 (이 경우 키 없이 실행해도 프록시가 붙여줌)

사용
  python3 tools/gemini_batch.py --list                 # 쓸 수 있는 이미지 모델 확인
  python3 tools/gemini_batch.py --group motion          # 그룹 하나 생성 (motion, skillfx, map, gear, ui ...)
  python3 tools/gemini_batch.py --only grid_m01_atk.png # 파일 하나만
  옵션: --model 모델이름  --out art_out  --dry (요청 없이 계획만 출력)

결과는 art_out/ 에 저장되고, 이미 있는 파일은 건너뛴다 (중간에 끊겨도 이어서 실행 가능).
첨부(📎)가 필요한 항목은 art_src/ 의 원본 그림을 자동으로 같이 보낸다.
"""
import argparse, base64, json, os, pathlib, re, sys, time, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = 'https://generativelanguage.googleapis.com/v1beta'
KEY = os.environ.get('GEMINI_API_KEY', '')


def call(method, url, body=None):
    headers = {'Content-Type': 'application/json'}
    if KEY:
        headers['x-goog-api-key'] = KEY
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'API 오류 {e.code}: {e.read().decode()[:600]}')


def list_image_models():
    res = call('GET', f'{API}/models?pageSize=200')
    out = []
    for m in res.get('models', []):
        name = m['name'].split('/')[-1]
        if 'generateContent' in m.get('supportedGenerationMethods', []) and 'image' in name:
            out.append(name)
    return out


def pick_model():
    models = list_image_models()
    if not models:
        raise SystemExit('이미지 생성 모델을 찾지 못했어요. --list 로 확인하거나 --model 로 지정하세요.')
    pref = [m for m in models if 'flash' in m and 'preview' not in m] or [m for m in models if 'flash' in m] or models
    return sorted(pref)[-1]


def ref_for(attach):
    """첨부 설명 → art_src/ 의 참고 이미지"""
    if not attach:
        return None
    m = re.search(r'(grid_[em]\d\d|hero_[a-z]+_[mf])', attach)
    if m and (ROOT / 'art_src' / f'{m.group(1)}.jpg').exists():
        return ROOT / 'art_src' / f'{m.group(1)}.jpg'
    if '이펙트' in attach:
        return ROOT / 'art_src' / 'fx_water.jpg'
    if 'grid_h_all' in attach:
        return ROOT / 'art_src' / 'hero_human_m.jpg'
    return ROOT / 'art_src' / 'grid_m01.jpg'


def generate(model, prompt, ref):
    parts = []
    if ref:
        parts.append({'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(ref.read_bytes()).decode()}})
    parts.append({'text': prompt})
    body = {'contents': [{'parts': parts}], 'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}}
    res = call('POST', f'{API}/models/{model}:generateContent', body)
    for c in res.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            d = p.get('inlineData') or p.get('inline_data')
            if d and d.get('data'):
                return base64.b64decode(d['data']), d.get('mimeType', d.get('mime_type', 'image/png'))
    raise RuntimeError('이미지가 응답에 없어요: ' + json.dumps(res)[:400])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--group')
    ap.add_argument('--only')
    ap.add_argument('--model')
    ap.add_argument('--out', default='art_out')
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()
    if a.list:
        print('\n'.join(list_image_models()))
        return
    groups = json.loads((ROOT / 'docs' / 'prompts_grid.json').read_text())
    items = [it for g in groups if (not a.group or g['id'] == a.group) for it in g['items'] if (not a.only or it['file'] == a.only)]
    if not items:
        raise SystemExit('대상이 없어요. --group 이름: ' + ', '.join(g['id'] for g in groups))
    out = ROOT / a.out
    out.mkdir(exist_ok=True)
    model = a.model or (None if a.dry else pick_model())
    print(f'모델: {model} · {len(items)}개')
    for i, it in enumerate(items, 1):
        dst = out / it['file']
        if any(dst.with_suffix(s).exists() for s in ('.png', '.jpg', '.webp')):
            print(f'[{i}/{len(items)}] 건너뜀 (이미 있음) {it["file"]}')
            continue
        ref = ref_for(it.get('attach'))
        print(f'[{i}/{len(items)}] {it["file"]}  ({it["name"]})  첨부: {ref.name if ref else "-"}')
        if a.dry:
            continue
        for attempt in range(3):
            try:
                data, mime = generate(model, it['prompt'], ref)
                ext = '.jpg' if 'jpeg' in mime else '.webp' if 'webp' in mime else '.png'
                dst.with_suffix(ext).write_bytes(data)
                break
            except (RuntimeError, urllib.error.URLError) as e:
                print('   재시도:', str(e)[:200])
                time.sleep(5 * (attempt + 1))
        time.sleep(1)
    print('완료 →', out)


if __name__ == '__main__':
    main()
