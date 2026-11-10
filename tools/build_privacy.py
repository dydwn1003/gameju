# 저승사자 키우기 개인정보처리방침 (한국어 · English · 日本語 · 中文) 만들기
# 실행: python3 tools/build_privacy.py
#  → reaper/privacy.html (게임 안 · 웹, 언어 탭)  +  reaper/docs/privacy_notion.md (노션에 붙여 넣기)
# 내용을 고칠 때는 이 파일의 글을 고치고 다시 실행하세요.
import html, os

ROOT = os.path.join(os.path.dirname(__file__), '..', 'reaper')
OP = {'ko': '갓주모바일', 'en': 'Gatju Mobile (갓주모바일)', 'ja': 'Gatju Mobile(갓주모바일)', 'zh': 'Gatju Mobile(갓주모바일)'}
MAIL = 'dydwn1003@gmail.com'
DATE = {'ko': '2026년 11월 10일', 'en': 'November 10, 2026', 'ja': '2026年11月10日', 'zh': '2026年11月10日'}

# 각 언어: (제목, 시행일 라벨, 머리말, [(소제목, 내용)]) — 내용: 'p:문장' · 'ul:[..]' · 'table:[[머리],[줄]..]'
T = {}
T['ko'] = ('저승사자 키우기 개인정보처리방침', '시행일', f'{OP["ko"]}(이하 "운영자")은 모바일 게임 「저승사자 키우기」(이하 "게임")를 이용하는 분의 개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을 지킵니다.', [
  ('1. 수집하는 정보와 목적', [('table', [['구분', '항목', '목적'],
    ['소셜 로그인 (선택)', '로그인 서비스(구글 · 카카오 · Apple)에서 받는 고유 식별자, 이메일 주소(제공 시), 닉네임', '계정 만들기, 여러 기기에서 기록 이어 하기, 본인 확인'],
    ['게임 기록', '게임 닉네임, 진행 상황(계급 · 재화 · 소품 · 펫 등), 순위 점수, 집무실 꾸미기, 방명록 글', '저장 · 불러오기, 순위표와 집무실 방문 등 다른 이용자와 함께하는 기능'],
    ['결제', '구매한 상품, 거래 번호 (카드 정보 등 결제 수단은 Google Play · App Store 가 처리하며 운영자는 받지 않음)', '상품 지급, 환불 · 결제 문의 처리'],
    ['광고', '광고 식별자(Android 광고 ID · iOS IDFA, 이용자가 허용한 경우), 기기 정보', '보상형 광고 표시 (Google AdMob)'],
    ['1:1 문의', '문의 내용, 기기 · 앱 버전 정보', '문의 답변, 오류 확인']]),
    ('p', '게스트로 플레이하면 기록은 이용자의 기기에만 저장되고 운영자에게 보내지지 않습니다.')]),
  ('2. 보관 기간', [('p', '계정을 삭제하거나 서비스가 끝날 때까지 보관하고, 그 뒤에는 바로 지웁니다. 단, 전자상거래법 등 법령이 정한 경우(결제 기록 5년 등)에는 그 기간 동안 보관합니다.')]),
  ('3. 제3자 제공 및 처리 위탁', [('p', '운영자는 이용자의 개인정보를 제3자에게 팔거나 제공하지 않습니다. 서비스 운영을 위해 아래 업체에 처리를 맡깁니다.'), ('table', [['업체', '맡기는 일'],
    ['Supabase Inc.', '로그인 · 게임 기록 저장 (서버 위치: 대한민국 서울 리전)'], ['Google LLC (AdMob, Google Play)', '광고 표시, 결제 처리'], ['Apple Inc. (App Store)', '결제 처리, Apple 로그인'], ['카카오 · 구글 · Apple', '소셜 로그인']])]),
  ('4. 이용자의 권리와 계정 삭제', [('ul', ['게임의 <b>설정 → 계정 삭제</b>에서 언제든 계정과 모든 게임 기록을 지울 수 있습니다. 지운 기록은 되돌릴 수 없습니다.',
    '내 정보의 열람 · 정정 · 삭제 · 처리 정지를 아래 이메일로 요청할 수 있으며, 본인 확인 뒤 지체 없이(늦어도 7일 안에) 처리합니다.',
    '광고 맞춤 설정은 기기 설정(Android: 설정 → Google → 광고 / iOS: 설정 → 개인정보 보호 → 추적)에서 끌 수 있습니다.'])]),
  ('5. 해외 이용자', [('p', '게임 정보는 대한민국(Supabase 서울 리전)과, 광고 · 결제를 처리하는 업체의 서버(미국 등)에 저장될 수 있습니다. 유럽(GDPR) · 영국 · 미국 캘리포니아(CCPA) 등 해외 이용자는 각 지역 법이 정한 권리(열람, 정정, 삭제, 이동, 처리 반대 등)를 위 이메일로 행사할 수 있습니다. 운영자는 개인정보를 판매하지 않습니다.')]),
  ('6. 아동의 개인정보', [('p', '이 게임은 만 13세 미만 아동을 대상으로 하지 않습니다. 대한민국에서 만 14세 미만 아동은 법정대리인의 동의를 받아 이용해야 합니다. 동의 없이 수집된 사실을 알게 되면 바로 지웁니다.')]),
  ('7. 안전하게 지키기 위한 조치', [('p', '모든 통신은 암호화(HTTPS)되며, 데이터베이스는 본인 기록만 읽고 쓸 수 있도록 접근을 제한합니다.')]),
  ('8. 문의처 (개인정보 보호 책임자)', [('p', f'책임자: {OP["ko"]}<br>이메일: {MAIL}<br>게임 안 <b>설정 → 1:1 문의</b>로도 문의할 수 있습니다.')]),
  ('9. 방침의 변경', [('p', '이 방침이 바뀌면 시행 7일 전에 게임 공지사항으로 알립니다.')]),
])
T['en'] = ('Grim Reaper Idle — Privacy Policy', 'Effective date', f'{OP["en"]} ("we") respects the privacy of everyone who plays the mobile game "Grim Reaper Idle" (저승사자 키우기, the "Game") and complies with applicable laws, including the Korean Personal Information Protection Act.', [
  ('1. Information we collect and why', [('table', [['Category', 'Data', 'Purpose'],
    ['Social login (optional)', 'Unique ID, email address (if provided) and nickname from the login service (Google, Kakao, Apple)', 'Create your account, continue on other devices, verify identity'],
    ['Game records', 'Nickname, progress (rank, currencies, items, pets, etc.), ranking score, office decoration, guestbook posts', 'Save/load, leaderboards, office visits and other shared features'],
    ['Purchases', 'Purchased items and transaction IDs (payment methods such as card details are handled by Google Play / App Store; we never receive them)', 'Deliver items, handle refunds and payment inquiries'],
    ['Advertising', 'Advertising ID (Android Advertising ID / iOS IDFA, if you allow it), device information', 'Show rewarded ads (Google AdMob)'],
    ['Support inquiries', 'Message content, device and app version', 'Answer inquiries, fix bugs']]),
    ('p', 'If you play as a guest, your records stay only on your device and are not sent to us.')]),
  ('2. Retention', [('p', 'We keep your data until you delete your account or the service ends, then delete it promptly — except where the law requires longer retention (e.g., purchase records for 5 years under Korean e-commerce law).')]),
  ('3. Sharing and processors', [('p', 'We do not sell or give your personal information to third parties. We use the following service providers to run the Game:'), ('table', [['Provider', 'Service'],
    ['Supabase Inc.', 'Login and game data storage (server region: Seoul, Republic of Korea)'], ['Google LLC (AdMob, Google Play)', 'Advertising, payments'], ['Apple Inc. (App Store)', 'Payments, Sign in with Apple'], ['Kakao, Google, Apple', 'Social login']])]),
  ('4. Your rights and account deletion', [('ul', ['You can delete your account and all game data at any time in <b>Settings → Delete account</b>. Deleted data cannot be recovered.',
    'You may request access, correction, deletion or restriction of processing by emailing us; we will respond after verifying your identity, within 7 days at the latest.',
    'You can turn off ad personalization in your device settings (Android: Settings → Google → Ads / iOS: Settings → Privacy & Security → Tracking).'])]),
  ('5. International users (GDPR / UK GDPR / CCPA)', [('p', 'Game data may be stored in the Republic of Korea (Supabase Seoul region) and on servers of our advertising and payment providers (including the United States). If you are in the EU/EEA, the UK, California or another region with privacy laws, you may exercise your rights (access, correction, deletion, portability, objection, etc.) by emailing us. Our legal basis is performance of the service you request and, for personalized ads, your consent. We do not sell or "share" personal information as defined by the CCPA.')]),
  ('6. Children', [('p', 'The Game is not directed to children under 13. In Korea, children under 14 need consent from a legal guardian. If we learn that we collected data without the required consent, we will delete it immediately.')]),
  ('7. Security', [('p', 'All communication is encrypted (HTTPS), and the database restricts access so that each player can read and write only their own records.')]),
  ('8. Contact (privacy officer)', [('p', f'Officer: {OP["en"]}<br>Email: {MAIL}<br>You can also contact us in the Game via <b>Settings → 1:1 Inquiry</b>.')]),
  ('9. Changes', [('p', 'If this policy changes, we will announce it in the Game\'s notices at least 7 days before it takes effect.')]),
])
T['ja'] = ('冥土の使者を育てよう(저승사자 키우기)プライバシーポリシー', '施行日', f'{OP["ja"]}(以下「運営者」)は、モバイルゲーム「冥土の使者を育てよう」(以下「本ゲーム」)をご利用の皆さまの個人情報を大切に扱い、韓国「個人情報保護法」などの関連法令を遵守します。', [
  ('1. 収集する情報と目的', [('table', [['区分', '項目', '目的'],
    ['ソーシャルログイン(任意)', 'ログインサービス(Google・Kakao・Apple)から受け取る固有ID、メールアドレス(提供された場合)、ニックネーム', 'アカウント作成、複数端末での引き継ぎ、本人確認'],
    ['ゲーム記録', 'ニックネーム、進行状況(階級・通貨・小物・ペットなど)、ランキングスコア、執務室の飾り付け、ゲストブックの投稿', 'セーブ・ロード、ランキングや執務室訪問など他のプレイヤーと遊ぶ機能'],
    ['決済', '購入した商品、取引番号(カード情報などの決済手段は Google Play・App Store が処理し、運営者は受け取りません)', '商品の付与、返金・決済のお問い合わせ対応'],
    ['広告', '広告ID(Android 広告ID・iOS IDFA、許可した場合)、端末情報', 'リワード広告の表示(Google AdMob)'],
    ['お問い合わせ', 'お問い合わせ内容、端末・アプリのバージョン', '回答、不具合の確認']]),
    ('p', 'ゲストでプレイした場合、記録は端末内にのみ保存され、運営者には送信されません。')]),
  ('2. 保存期間', [('p', 'アカウントの削除またはサービス終了まで保存し、その後すみやかに削除します。ただし、法令で定められた場合(決済記録5年など)はその期間保存します。')]),
  ('3. 第三者提供と業務委託', [('p', '運営者は個人情報を第三者に販売・提供しません。サービス運営のため、以下の事業者に処理を委託します。'), ('table', [['事業者', '委託内容'],
    ['Supabase Inc.', 'ログイン・ゲーム記録の保存(サーバー:韓国ソウルリージョン)'], ['Google LLC (AdMob, Google Play)', '広告表示、決済処理'], ['Apple Inc. (App Store)', '決済処理、Apple でサインイン'], ['Kakao・Google・Apple', 'ソーシャルログイン']])]),
  ('4. 利用者の権利とアカウント削除', [('ul', ['ゲームの<b>設定 → アカウント削除</b>から、いつでもアカウントとすべてのゲーム記録を削除できます。削除した記録は元に戻せません。',
    '個人情報の開示・訂正・削除・利用停止は下記メールでご依頼いただけます。本人確認のうえ、遅くとも7日以内に対応します。',
    '広告のパーソナライズは端末の設定(Android:設定 → Google → 広告/iOS:設定 → プライバシーとセキュリティ → トラッキング)でオフにできます。'])]),
  ('5. 海外の利用者', [('p', 'ゲーム情報は韓国(Supabase ソウルリージョン)および広告・決済事業者のサーバー(米国など)に保存されることがあります。EU(GDPR)・英国・米国カリフォルニア州(CCPA)などの利用者は、各地域の法律に基づく権利(開示、訂正、削除、データポータビリティ、異議申立てなど)を下記メールで行使できます。運営者は個人情報を販売しません。')]),
  ('6. 子どもの個人情報', [('p', '本ゲームは13歳未満の子どもを対象としていません。韓国では14歳未満の子どもは法定代理人の同意が必要です。同意なく収集したことが判明した場合は、すぐに削除します。')]),
  ('7. 安全管理措置', [('p', 'すべての通信は暗号化(HTTPS)され、データベースは各プレイヤーが自分の記録のみ読み書きできるようアクセスを制限しています。')]),
  ('8. お問い合わせ(個人情報保護責任者)', [('p', f'責任者:{OP["ja"]}<br>メール:{MAIL}<br>ゲーム内の<b>設定 → お問い合わせ</b>からもご連絡いただけます。')]),
  ('9. ポリシーの変更', [('p', '本ポリシーを変更する場合は、施行の7日前までにゲーム内のお知らせで告知します。')]),
])
T['zh'] = ('冥府使者养成记(저승사자 키우기)隐私政策', '生效日期', f'{OP["zh"]}(以下称"运营者")重视使用手机游戏《冥府使者养成记》(以下称"本游戏")的每一位用户的个人信息,并遵守韩国《个人信息保护法》等相关法律。', [
  ('1. 收集的信息及目的', [('table', [['类别', '项目', '目的'],
    ['社交登录(可选)', '从登录服务(Google、Kakao、Apple)获得的唯一标识、电子邮箱(如提供)、昵称', '创建账号、多设备继续游戏、身份确认'],
    ['游戏记录', '昵称、进度(官阶、货币、道具、宠物等)、排行分数、办公室装饰、留言板内容', '存档与读取、排行榜、拜访办公室等与其他玩家互动的功能'],
    ['支付', '购买的商品、交易编号(银行卡等支付信息由 Google Play、App Store 处理,运营者不会获取)', '发放商品、处理退款及支付咨询'],
    ['广告', '广告标识符(Android 广告 ID、iOS IDFA,经用户允许时)、设备信息', '展示激励广告(Google AdMob)'],
    ['客服咨询', '咨询内容、设备及应用版本', '回复咨询、排查问题']]),
    ('p', '以游客身份游玩时,记录仅保存在您的设备上,不会发送给运营者。')]),
  ('2. 保存期限', [('p', '保存至您删除账号或服务终止为止,之后立即删除。但法律规定需保存的(如支付记录5年)将在规定期限内保存。')]),
  ('3. 向第三方提供及委托处理', [('p', '运营者不会出售或向第三方提供您的个人信息。为运营服务,委托以下企业处理:'), ('table', [['企业', '委托内容'],
    ['Supabase Inc.', '登录、游戏记录存储(服务器:韩国首尔区域)'], ['Google LLC (AdMob, Google Play)', '广告展示、支付处理'], ['Apple Inc. (App Store)', '支付处理、通过 Apple 登录'], ['Kakao、Google、Apple', '社交登录']])]),
  ('4. 用户的权利及删除账号', [('ul', ['可随时在游戏的<b>设置 → 删除账号</b>中删除账号及全部游戏记录。删除后无法恢复。',
    '可通过下方邮箱申请查阅、更正、删除或停止处理您的个人信息,运营者将在确认身份后最迟7日内处理。',
    '可在设备设置中关闭个性化广告(Android:设置 → Google → 广告/iOS:设置 → 隐私与安全性 → 跟踪)。'])]),
  ('5. 海外用户', [('p', '游戏信息可能存储在韩国(Supabase 首尔区域)以及广告、支付服务商的服务器(包括美国等)。欧盟(GDPR)、英国、美国加利福尼亚州(CCPA)等地区的用户,可通过下方邮箱行使当地法律规定的权利(查阅、更正、删除、数据可携、反对处理等)。运营者不会出售个人信息。')]),
  ('6. 儿童个人信息', [('p', '本游戏不以13岁以下儿童为对象。在韩国,14岁以下儿童需取得法定代理人同意后使用。如发现未经同意收集的信息,将立即删除。')]),
  ('7. 安全保护措施', [('p', '所有通信均经过加密(HTTPS),数据库限制为每位玩家只能读写自己的记录。')]),
  ('8. 联系方式(个人信息保护负责人)', [('p', f'负责人:{OP["zh"]}<br>邮箱:{MAIL}<br>也可通过游戏内<b>设置 → 一对一咨询</b>联系我们。')]),
  ('9. 政策变更', [('p', '本政策如有变更,将在生效7日前通过游戏公告通知。')]),
])
NAMES = {'ko': '한국어', 'en': 'English', 'ja': '日本語', 'zh': '中文'}

def h_block(kind, v):
    if kind == 'p': return f'<p>{v}</p>'
    if kind == 'ul': return '<ul>' + ''.join(f'<li>{x}</li>' for x in v) + '</ul>'
    rows = ''.join('<tr>' + ''.join(f'<t{"h" if i == 0 else "d"}>{c}</t{"h" if i == 0 else "d"}>' for c in r) + '</tr>' for i, r in enumerate(v))
    return f'<table>{rows}</table>'

def m_block(kind, v):
    clean = lambda s: s.replace('<br>', '  \n').replace('<b>', '**').replace('</b>', '**')
    if kind == 'p': return clean(v)
    if kind == 'ul': return '\n'.join('- ' + clean(x) for x in v)
    out = ['| ' + ' | '.join(v[0]) + ' |', '|' + '---|' * len(v[0])] + ['| ' + ' | '.join(clean(c) for c in r) + ' |' for r in v[1:]]
    return '\n'.join(out)

# ---- privacy.html (언어 탭, ?lang= 또는 게임 언어 · 브라우저 언어로 자동 선택)
secs = []
for k, (title, dl, intro, parts) in T.items():
    body = f'<h1>{title}</h1><p class="muted">{dl}: {DATE[k]}</p><p>{intro}</p>' + ''.join(f'<h2>{h}</h2>' + ''.join(h_block(a, b) for a, b in blocks) for h, blocks in parts)
    secs.append(f'<section lang="{k}" id="{k}">{body}</section>')
tabs = ''.join(f'<a href="#{k}" data-l="{k}">{n}</a>' for k, n in NAMES.items())
page = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy · 개인정보처리방침</title>
<style>
  :root {{ color-scheme: light; }}
  body {{ margin: 0 auto; padding: 12px 16px 40px; font: 14px/1.7 -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Hiragino Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #222; background: #fff; max-width: 760px; }}
  nav {{ position: sticky; top: 0; background: #fff; padding: 8px 0; display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid #eee; }}
  nav a {{ padding: 4px 12px; border-radius: 999px; border: 1px solid #ddd; color: #333; text-decoration: none; font-size: 13px; }}
  nav a.on {{ background: #222; color: #fff; border-color: #222; }}
  section {{ display: none; }} section.on {{ display: block; }}
  h1 {{ font-size: 20px; margin: 14px 0 4px; }}
  h2 {{ font-size: 16px; margin: 24px 0 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  th, td {{ border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }}
  th {{ background: #f6f6f8; }}
  .muted {{ color: #777; font-size: 12px; }}
</style>
</head>
<body>
<nav>{tabs}</nav>
{''.join(secs)}
<script>
(function () {{
  var L = ['ko', 'en', 'ja', 'zh'];
  function pick() {{
    var h = location.hash.slice(1), q = (location.search.match(/lang=(\\w+)/) || [])[1], s = null;
    try {{ s = localStorage.getItem('reaper_lang'); }} catch (e) {{}}
    var n = (navigator.language || 'ko').slice(0, 2);
    return [h, q, s, n].filter(function (x) {{ return L.indexOf(x) >= 0; }})[0] || 'en';
  }}
  function show(l) {{
    document.querySelectorAll('section').forEach(function (e) {{ e.classList.toggle('on', e.id === l); }});
    document.querySelectorAll('nav a').forEach(function (e) {{ e.classList.toggle('on', e.dataset.l === l); }});
    document.documentElement.lang = l;
  }}
  show(pick());
  window.addEventListener('hashchange', function () {{ show(pick()); }});
}})();
</script>
</body>
</html>
'''
open(os.path.join(ROOT, 'privacy.html'), 'w').write(page)

# ---- 노션용 마크다운 (한 페이지에 4개 언어)
md = ['<!-- 노션 페이지 내용을 모두 지우고 이 파일 전체를 붙여 넣으세요 (이 줄은 빼고). 주소는 그대로 유지돼요. -->', '',
      '**한국어 · English · 日本語 · 中文** — 아래로 내리면 각 언어가 있어요 / Scroll down for your language.', '']
for k, (title, dl, intro, parts) in T.items():
    md += ['---', '', f'# {title}', '', f'{dl}: {DATE[k]}', '', intro, '']
    for h, blocks in parts:
        md += [f'## {h}', ''] + [m_block(a, b) + '\n' for a, b in blocks]
open(os.path.join(ROOT, 'docs', 'privacy_notion.md'), 'w').write('\n'.join(md))
print('ok')
