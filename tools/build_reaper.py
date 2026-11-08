"""저승사자 키우기 한 파일 플레이 버전: CSS/JS 인라인, 폰트는 fonts/ 로 함께 배포."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'reaper'
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist' / 'play.html'
html = (root / 'index.html').read_text()
css = (root / 'css' / 'style.css').read_text().replace("url('../fonts/", "url('fonts/")
body = re.search(r'<body>(.*?)<script src=', html, re.S).group(1)
scripts = re.findall(r'<script src="(js/[^"]+)"></script>', html)
js = '\n'.join((root / s).read_text() for s in scripts)
page = f'''<title>저승사자 키우기</title>
<meta name="theme-color" content="#0b0a1c">
<style>{css}
:root{{color-scheme:dark}}html,body{{height:100%;background:#08071a}}#app{{height:100%}}</style>
{body}
<script>
{js}
UI.init();
</script>
'''
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page)
print(out, len(page))
