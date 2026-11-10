# 스토어 등록정보 글 + 인앱 상품 번역표 만들기 (글자 수 자동 확인)
# 실행: python3 tools/build_store_text.py  →  reaper/docs/store/STORE_LISTING.md
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'reaper', 'docs', 'store', 'STORE_LISTING.md')
LANGS = [('ko', '한국어 (ko-KR)'), ('en', 'English (en-US)'), ('ja', '日本語 (ja-JP)'), ('zhs', '简体中文 (zh-CN)'), ('zht', '繁體中文 (zh-TW)')]

L = {}
L['ko'] = dict(
 name='저승사자 키우기',
 subtitle='혼을 거두고 염라대왕이 되자',
 short='떠도는 혼을 거두고 승진해 염라대왕이 되자! 꺼 둬도 자라는 도트 방치형 키우기',
 promo='명부를 들고 저승 마을을 누비는 꼬마 저승사자! 혼을 거두고, 영물을 모으고, 집무실을 꾸미며 수습 차사에서 염라대왕까지 승진해 보세요.',
 keywords='방치형,키우기,도트,픽셀,저승,염라대왕,귀신,요괴,영물,뽑기,집무실,꾸미기,힐링,클리커,오프라인',
 desc='''🏮 명부를 들고 떠도는 혼을 거두는 꼬마 저승사자!
수습 차사로 시작해 승진 시험을 통과하고, 저승 최고 자리인 염라대왕까지 올라가 보세요.

■ 터치 한 번, 꺼 둬도 쑥쑥
• 혼령을 터치해 거두고, 졸개 차사를 고용해 자동으로 모아요
• 게임을 꺼 둬도 저승 장부에 혼이 쌓여요 (최대 24시간)
• 명부 필력 · 축지법 · 거둠의 손길 등 성장은 끝없이!

■ 9단계 승진과 저승 이야기
• 수습 차사 → 차사 → 판관 → 시왕 → 염라대왕
• 계급마다 새로운 지역과 이야기, 화려해지는 발밑 마법진
• 승진 시험에서는 원귀를 퇴치해야 해요

■ 영물 53종 수집
• 흑묘, 까치, 구미호부터 SSS 신수까지
• 같은 영물을 모아 별을 올리고, 합성해 더 높은 등급으로
• 소환 확률은 게임 안에서 모두 공개돼요

■ 나만의 집무실
• 의자 · 병풍 · 화분 등 소품을 모아 집무실을 꾸며요
• 이웃 집무실에 놀러 가 방명록을 남기고 좋아요를 받아요
• 결재 서류 · 부하 파견 · 망자 심판으로 보상도 두둑하게

■ 매일 즐길 거리
• 출석 · 의뢰 · 까치 우편 · 백귀야행 이벤트
• 꽃 키우기, 주막의 탕약, 도깨비 상인
• 서버 순위로 다른 저승사자와 경쟁

■ 이런 분께 추천해요
• 가볍게 켜 두고 키우는 방치형 게임을 좋아하는 분
• 귀여운 도트 그래픽과 한국 저승 설화를 좋아하는 분

※ 일부 아이템은 유료로 구매할 수 있어요. 게스트로 시작하면 로그인 없이 바로 즐길 수 있어요.
문의: dydwn1003@gmail.com''')

L['en'] = dict(
 name='Grim Reaper Idle',
 subtitle='Reap souls, become King Yeomra',
 short='Reap wandering souls and climb the afterlife ranks! A cozy pixel idle game.',
 promo='A tiny grim reaper with a ledger of the dead! Reap souls, collect mythical pets, decorate your office and rise from Trainee Envoy to King Yeomra.',
 keywords='idle,clicker,pixel,incremental,afterlife,reaper,ghost,yokai,pets,gacha,cozy,offline,tycoon,korean',
 desc='''🏮 A little grim reaper with a ledger, gathering wandering souls!
Start as a Trainee Envoy, pass promotion tests and climb all the way to King Yeomra, ruler of the afterlife.

■ Tap once, grow even while offline
• Tap spirits to reap them, or hire minion envoys to collect automatically
• Souls pile up in your ledger even when the game is closed (up to 24h)
• Endless upgrades: Ledger Pen, Shrink-Earth Step, Reaping Hand and more

■ 9 ranks and a Korean afterlife story
• Trainee Envoy → Envoy → Judge → Ten Kings → King Yeomra
• New regions and story chapters at every rank, with a flashier aura
• Defeat vengeful ghosts to pass each promotion test

■ Collect 53 mythical pets
• From black cats and magpies to nine-tailed foxes and SSS divine beasts
• Raise stars with duplicates and fuse them into higher grades
• All summon rates are shown in the game

■ Your own office
• Decorate with chairs, folding screens, plants and more
• Visit neighbors' offices, sign their guestbooks and collect likes
• Paperwork, dispatch missions and judging the dead for extra rewards

■ Something new every day
• Daily check-in, requests, magpie mail and the Night Parade event
• Grow flowers, brew tavern potions, trade with the goblin merchant
• Compete with other reapers on the server leaderboard

Some items can be purchased. Start as a guest and play right away — no login needed.
Contact: dydwn1003@gmail.com''')

L['ja'] = dict(
 name='冥土の使者を育てよう',
 subtitle='魂を集めて閻魔大王を目指そう',
 short='さまよう魂を集めて昇進し、閻魔大王を目指そう!放置でも育つドット育成ゲーム',
 promo='冥簿を手にあの世の村をめぐるちびっこ死神!魂を集め、霊獣をコレクションし、執務室を飾りながら見習い使者から閻魔大王まで昇進しよう。',
 keywords='放置,育成,ドット,ピクセル,あの世,死神,閻魔,妖怪,幽霊,ペット,ガチャ,癒し,クリッカー,オフライン',
 desc='''🏮 冥簿を手にさまよう魂を集める、ちびっこ死神!
見習い使者から始めて昇進試験に合格し、あの世の頂点・閻魔大王まで上りつめよう。

■ タップひとつ、放置でもぐんぐん
• 霊をタップして回収、子分の使者を雇えば自動で集めてくれる
• ゲームを閉じていても冥簿に魂がたまる(最大24時間)
• 冥簿の筆力・縮地法・刈り取りの手など、成長はどこまでも!

■ 9段階の昇進とあの世の物語
• 見習い使者 → 使者 → 判官 → 十王 → 閻魔大王
• 階級ごとに新しい地域と物語、足元の魔法陣もどんどん豪華に
• 昇進試験では怨霊を退治しよう

■ 霊獣53種をコレクション
• 黒猫やカササギから九尾の狐、SSSの神獣まで
• 同じ霊獣で星を上げ、合成でさらに上の等級へ
• 召喚確率はすべてゲーム内で公開

■ 自分だけの執務室
• 椅子・屏風・鉢植えなどの小物で執務室を飾ろう
• お隣の執務室を訪ねてゲストブックに書き込み、いいねをもらおう
• 決裁書類・部下の派遣・亡者の審判で報酬もたっぷり

■ 毎日の楽しみ
• 出席・依頼・カササギ便・百鬼夜行イベント
• 花の栽培、居酒屋の湯薬、トッケビ商人
• サーバーランキングで他の死神と競争

※ 一部アイテムは有料で購入できます。ゲストで始めればログインなしですぐ遊べます。
お問い合わせ:dydwn1003@gmail.com''')

L['zhs'] = dict(
 name='冥府使者养成记',
 subtitle='收集魂魄,晋升阎罗王',
 short='收集游荡的魂魄,一路晋升成为阎罗王!关掉也能成长的像素放置养成游戏',
 promo='手持冥簿穿梭冥府村庄的小小勾魂使者!收集魂魄、收藏灵兽、装饰办公室,从见习差使一路晋升到阎罗王。',
 keywords='放置,养成,像素,冥府,阎罗王,鬼怪,妖怪,宠物,抽卡,治愈,点击,离线,挂机',
 desc='''🏮 手持冥簿、收集游荡魂魄的小小勾魂使者!
从见习差使开始,通过晋升考试,一路登上冥府之巅——阎罗王。

■ 轻点一下,离线也能成长
• 点击魂灵即可收取,雇佣小鬼差还能自动收集
• 关闭游戏时魂魄也会在冥簿中累积(最长24小时)
• 冥簿笔力、缩地法、收魂之手……成长永无止境!

■ 9级晋升与冥府故事
• 见习差使 → 差使 → 判官 → 十王 → 阎罗王
• 每个官阶都有新地区与新剧情,脚下法阵也越来越华丽
• 晋升考试中需要击退怨鬼

■ 收集53种灵兽
• 从黑猫、喜鹊到九尾狐,再到SSS神兽
• 收集同款灵兽升星,合成可获得更高品级
• 召唤概率在游戏内完全公开

■ 专属办公室
• 用椅子、屏风、盆栽等摆件装饰办公室
• 拜访邻居的办公室,留言并收获点赞
• 批阅公文、派遣手下、审判亡者,奖励满满

■ 每日乐趣
• 签到、委托、喜鹊信件、百鬼夜行活动
• 种花、酒馆汤药、鬼怪商人
• 在服务器排行榜上与其他勾魂使者一较高下

※ 部分道具可付费购买。以游客身份开始,无需登录即可游玩。
联系我们:dydwn1003@gmail.com''')

L['zht'] = dict(
 name='冥府使者養成記',
 subtitle='收集魂魄,晉升閻羅王',
 short='收集遊蕩的魂魄,一路晉升成為閻羅王!關掉也能成長的像素放置養成遊戲',
 promo='手持冥簿穿梭冥府村莊的小小勾魂使者!收集魂魄、收藏靈獸、裝飾辦公室,從見習差使一路晉升到閻羅王。',
 keywords='放置,養成,像素,冥府,閻羅王,鬼怪,妖怪,寵物,抽卡,療癒,點擊,離線,掛機',
 desc='''🏮 手持冥簿、收集遊蕩魂魄的小小勾魂使者!
從見習差使開始,通過晉升考試,一路登上冥府之巔——閻羅王。

■ 輕點一下,離線也能成長
• 點擊魂靈即可收取,僱用小鬼差還能自動收集
• 關閉遊戲時魂魄也會在冥簿中累積(最長24小時)
• 冥簿筆力、縮地法、收魂之手……成長永無止境!

■ 9級晉升與冥府故事
• 見習差使 → 差使 → 判官 → 十王 → 閻羅王
• 每個官階都有新地區與新劇情,腳下法陣也越來越華麗
• 晉升考試中需要擊退怨鬼

■ 收集53種靈獸
• 從黑貓、喜鵲到九尾狐,再到SSS神獸
• 收集同款靈獸升星,合成可獲得更高品級
• 召喚機率在遊戲內完全公開

■ 專屬辦公室
• 用椅子、屏風、盆栽等擺件裝飾辦公室
• 拜訪鄰居的辦公室,留言並收穫按讚
• 批閱公文、派遣手下、審判亡者,獎勵滿滿

■ 每日樂趣
• 簽到、委託、喜鵲信件、百鬼夜行活動
• 種花、酒館湯藥、鬼怪商人
• 在伺服器排行榜上與其他勾魂使者一較高下

※ 部分道具可付費購買。以遊客身分開始,無需登入即可遊玩。
聯絡我們:dydwn1003@gmail.com''')

# 인앱 상품: id → 언어별 (이름, 설명)  (애플 설명은 45자 이하)
IAP = [
 ('jade_100', '₩1,200', {'ko': ('옥 100개', '옥 100개'), 'en': ('Jade ×100', '100 Jade'), 'ja': ('玉 100個', '玉100個'), 'zhs': ('玉 100个', '玉100个'), 'zht': ('玉 100個', '玉100個')}),
 ('jade_550', '₩5,900', {'ko': ('옥 550개', '옥 550개 (+10% 보너스)'), 'en': ('Jade ×550', '550 Jade (+10% bonus)'), 'ja': ('玉 550個', '玉550個(+10%ボーナス)'), 'zhs': ('玉 550个', '玉550个(+10%奖励)'), 'zht': ('玉 550個', '玉550個(+10%獎勵)')}),
 ('jade_1200', '₩12,000', {'ko': ('옥 1,200개', '옥 1,200개 (+20% 보너스)'), 'en': ('Jade ×1,200', '1,200 Jade (+20% bonus)'), 'ja': ('玉 1,200個', '玉1,200個(+20%ボーナス)'), 'zhs': ('玉 1,200个', '玉1,200个(+20%奖励)'), 'zht': ('玉 1,200個', '玉1,200個(+20%獎勵)')}),
 ('starter_pack', '₩1,200', {'ko': ('신입 차사 패키지', '옥 200 + 졸개 2명 즉시 고용 (1회 한정)'), 'en': ('Rookie Envoy Pack', '200 Jade + 2 minions (one-time)'), 'ja': ('新人使者パック', '玉200+子分2人を即雇用(1回限定)'), 'zhs': ('新人差使礼包', '玉200+立即雇用2名小鬼差(限购1次)'), 'zht': ('新人差使禮包', '玉200+立即僱用2名小鬼差(限購1次)')}),
 ('promo_pack', '₩3,300', {'ko': ('승진 응원 패키지', '옥 300 + 4시간치 혼 + 2배 부적 60분'), 'en': ('Promotion Pack', '300 Jade + 4h of souls + 60-min 2× Talisman'), 'ja': ('昇進応援パック', '玉300+4時間分の魂+2倍の御札60分'), 'zhs': ('晋升应援礼包', '玉300+4小时的魂+双倍符咒60分钟'), 'zht': ('晉升應援禮包', '玉300+4小時的魂+雙倍符咒60分鐘')}),
 ('yeomra_seal_7d', '₩9,900', {'ko': ('염라의 인장 (7일)', '7일 동안 모든 혼 수확 2배'), 'en': ("Yeomra's Seal (7 days)", '2× all soul harvest for 7 days'), 'ja': ('閻魔の印章(7日)', '7日間すべての魂の収穫2倍'), 'zhs': ('阎罗印章(7天)', '7天内所有魂收获翻倍'), 'zht': ('閻羅印章(7天)', '7天內所有魂收穫翻倍')}),
 ('remove_ads', '₩6,900', {'ko': ('광고 제거', '광고 없이 광고 보상을 즉시 받아요'), 'en': ('Remove Ads', 'Get ad rewards instantly, no ads'), 'ja': ('広告削除', '広告なしで広告報酬をすぐ受け取れます'), 'zhs': ('去除广告', '无需看广告即可直接领取广告奖励'), 'zht': ('移除廣告', '無需看廣告即可直接領取廣告獎勵')}),
]
CH = [('수습 차사의 걸상', "Trainee Envoy's Stool", '見習い使者の腰掛け', '见习差使的板凳', '見習差使的板凳', '₩1,200'),
      ('말단 차사의 교의', "Junior Envoy's Chair", '末端の使者の交椅', '末等差使的交椅', '末等差使的交椅', '₩1,900'),
      ('차사의 옻칠 교의', "Envoy's Lacquer Chair", '使者の漆塗りの交椅', '差使的漆交椅', '差使的漆交椅', '₩2,500'),
      ('선임 차사의 비단 교의', "Senior Envoy's Silk Chair", '上級使者の絹の交椅', '资深差使的丝绸交椅', '資深差使的絲綢交椅', '₩3,300'),
      ('차사장의 자개 교의', "Chief Envoy's Pearl Chair", '使者長の螺鈿の交椅', '差使长的螺钿交椅', '差使長的螺鈿交椅', '₩3,900'),
      ('판관의 붉은 칠 교의', "Judge's Red Lacquer Chair", '判官の赤漆の交椅', '判官的红漆交椅', '判官的紅漆交椅', '₩4,900'),
      ('명부 판관의 흑단 교의', "Ledger Judge's Ebony Chair", '冥簿判官の黒檀の交椅', '冥簿判官的黑檀交椅', '冥簿判官的黑檀交椅', '₩5,900'),
      ('시왕의 금칠 교의', "Ten Kings' Gold Chair", '十王の金漆の交椅', '十王的金漆交椅', '十王的金漆交椅', '₩7,900'),
      ('염라대왕의 옥 교의', "King Yeomra's Jade Chair", '閻魔大王の玉の交椅', '阎罗王的玉交椅', '閻羅王的玉交椅', '₩9,900')]
CHD = {'ko': '집무실을 꾸미는 특제 의자', 'en': 'A special chair for your office', 'ja': '執務室を飾る特製の椅子', 'zhs': '装饰办公室的特制椅子', 'zht': '裝飾辦公室的特製椅子'}
PFX = {'ko': '특제 ', 'en': '', 'ja': '特製 ', 'zhs': '特制 ', 'zht': '特製 '}
for i, c in enumerate(CH):
    IAP.append((f'chair_cc{i}', c[5], {k: (PFX[k] + c[j], CHD[k]) for j, k in enumerate(['ko', 'en', 'ja', 'zhs', 'zht'])}))

LIMIT = dict(name=30, subtitle=30, short=80, promo=170, keywords=100, desc=4000)
warn = []
md = ['# 저승사자 키우기 — 스토어 등록정보 (5개 언어)', '',
      '> 자동 생성: `python3 tools/build_store_text.py` · 글자 수는 스토어 제한 안에 맞춰져 있어요.', '',
      '## 어디에 넣나요', '',
      '| 항목 | 구글 Play Console | App Store Connect | 제한 |', '|---|---|---|---|',
      '| 앱 이름 | 스토어 등록정보 → 앱 이름 | 앱 정보 → 이름 | 30자 |',
      '| 부제 | (없음) | 앱 정보 → 부제 | 30자 |',
      '| 짧은 설명 | 간단한 설명 | (없음) | 80자 |',
      '| 프로모션 텍스트 | (없음) | 버전 → 프로모션 텍스트 | 170자 |',
      '| 키워드 | (없음) | 버전 → 키워드 (쉼표로 구분, 띄어쓰기 없이) | 100자 |',
      '| 자세한 설명 | 자세한 설명 | 버전 → 설명 | 4000자 |', '',
      '- **언어 추가:** Play Console → 스토어 등록정보 → **번역 관리 → 직접 번역 추가** / App Store Connect → 오른쪽 위 언어 선택 → **언어 추가**',
      '- 중국어: 구글은 `중국어(간체) zh-CN` · `중국어(번체) zh-TW`, 애플은 `简体中文` · `繁體中文` 를 각각 추가해요.', '']
md += ['## 이미지 (언어별 폴더: `ko` · `en` · `ja` · `zh-CN` · `zh-TW`)', '',
       '| 파일 | 크기 | 넣는 곳 |', '|---|---|---|',
       '| `iphone_1~5.jpg` | 1206×2622 | App Store Connect → 버전 → **iPhone 6.9″ / 6.3″ 디스플레이** 스크린샷 (순서대로) |',
       '| `android_1~5.jpg` | 1080×1920 | Play Console → 스토어 등록정보 → **휴대전화 스크린샷** |',
       '| `google_feature.jpg` | 1024×500 | Play Console → 스토어 등록정보 → **그래픽 이미지** |',
       '| `header.jpg` | 1920×1080 | 가로 헤더 · 배너가 필요한 곳 (애플 제품 페이지 헤더 · 홍보용 · SNS) |', '',
       '- **검색 결과:** 앱스토어 · 플레이 검색 결과에는 **스크린샷 앞 3장**이 보여요. 그래서 1 마을 · 2 집무실 · 3 영물 순서로 가장 눈에 띄는 장면을 앞에 뒀어요.',
       '- 앱 아이콘(1024 · 512): `app/assets/icon-only.png` (구글은 512×512 로 줄여서).', '']
for k, title in LANGS:
    d = L[k]
    md += ['---', '', f'## {title}', '']
    for f, lab in [('name', '앱 이름'), ('subtitle', '부제 (애플)'), ('short', '짧은 설명 (구글)'), ('promo', '프로모션 텍스트 (애플)'), ('keywords', '키워드 (애플)')]:
        n = len(d[f]); md += [f'**{lab}** ({n}/{LIMIT[f]}자)', '```', d[f], '```', '']
        if n > LIMIT[f]: warn.append(f'{k}.{f} {n}>{LIMIT[f]}')
    n = len(d['desc']); md += [f'**자세한 설명** ({n}/4000자)', '```', d['desc'], '```', '']
md += ['---', '', '## 인앱 상품 이름 · 설명 번역', '',
       '- 구글: 상품 화면 → **번역 추가**(또는 언어 추가)에서 언어마다 이름 · 설명을 넣어요.',
       '- 애플: 상품 화면 → **App Store 현지화 → +** 에서 언어마다 표시 이름(30자) · 설명(45자)을 넣어요.', '']
for pid, price, t in IAP:
    md += [f'### `{pid}` · {price}', '', '| 언어 | 이름 | 설명 |', '|---|---|---|']
    for k, title in LANGS:
        nm, ds = t[k]; md.append(f'| {title.split(" (")[0]} | {nm} | {ds} |')
        if len(nm) > 30 or len(ds) > 45: warn.append(f'{pid}.{k} {len(nm)}/{len(ds)}')
    md.append('')
open(OUT, 'w').write('\n'.join(md))
print('warn:', warn or '없음')
