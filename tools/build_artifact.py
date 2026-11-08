"""한 파일짜리 플레이 버전(play.html)을 만든다: CSS/JS 인라인, 에셋 탐색 끔."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist' / 'play.html'
html = (root / 'index.html').read_text()
css = (root / 'css' / 'style.css').read_text()
body = re.search(r'<body>(.*?)<script src=', html, re.S).group(1)
scripts = re.findall(r'<script src="((?:js|assets)/[^"]+)"></script>', html)
js = '\n'.join((root / s).read_text() for s in scripts)
override = 'html,body{height:100%;background:#08061a}:root{color-scheme:dark}#app{height:100%}'
page = f'''<title>몬스터 키우기</title>
<meta name="theme-color" content="#140f33">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
<style>{css}
{override}</style>
{body}
<script>window.NO_ASSET_PROBE = true;
{js}
Assets.init(); Sound.init(); Game.init(); UI.init();
</script>
'''
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page)
print(out, len(page))
