# 🎨 아트 제작 가이드 (Gemini 이미지 생성용)

게임은 `assets/` 폴더에서 **정해진 파일 이름**의 이미지를 자동으로 찾아 씁니다.
파일이 없으면 지금의 코드 그림이 그대로 나오므로, **하나씩 만들어 넣어도 됩니다.**
(설정 ⚙️ → "에셋 상태"에서 몇 개가 적용됐는지 확인 가능)

---

## 1. 공통 스타일 (모든 프롬프트 앞에 붙이기)

통일감이 퀄리티의 핵심입니다. 아래 문장을 **매번 똑같이** 앞에 붙여 주세요.

```
Cute chibi fantasy monster for a mobile idle RPG game, original character design,
soft 3D render style with clean outlines, vibrant saturated colors, big expressive eyes,
full body, single character centered, facing right, 3/4 side view,
plain solid pure white background, no shadow on background, no text, no logo, square 1:1
```

### 제미나이에서 잘 뽑는 요령
1. **1단계를 먼저 만들고**, 그 이미지를 첨부한 뒤 `"이 캐릭터가 진화한 모습으로 그려줘 (같은 색·특징 유지)"` 라고 2·3단계를 만드세요 → 진화 라인이 일관됩니다.
2. 마음에 드는 몬스터 1장을 **스타일 기준 이미지**로 계속 첨부하면 22종 전체 화풍이 맞춰집니다.
3. 배경은 투명이 잘 안 되므로 **순백색 단색 배경**으로 요청 → 저에게 주시면 배경 제거해서 넣어드립니다.
   (직접 투명 PNG로 만들 수 있으면 그대로 넣어도 됩니다)
4. 모든 몬스터는 **오른쪽을 바라보게** (아군은 오른쪽을 봄, 적은 게임이 자동으로 좌우 반전)

---

## 2. 몬스터 (22종 × 3단계 = 66장) — 가장 중요

- 경로: `assets/monsters/{id}_{단계}.png` (단계: 0 = 1단계, 1 = 2단계, 2 = 3단계)
- 크기: 1024×1024 (512 이상이면 OK), 캐릭터가 화면의 80% 정도 차지
- 1단계 = 작고 귀여운 아기 / 2단계 = 성장, 특징 강화 / 3단계 = 멋있고 강해 보이는 최종형 (오라·왕관 등)

| id | 속성 | 등급 | 이름 (1→2→3단계) | 컨셉 프롬프트 (공통 스타일 뒤에 붙이기) |
|---|---|---|---|---|
| ember | 불 | SSR | 불꼬미 → 화염꼬리 → 염룡제 | orange fox-like fire creature with a flame on its head and a fiery tail; final form is a majestic fire dragon emperor |
| salam | 불 | SR | 불도롱 → 화염도롱 → 용암룡 | red salamander with small horns and a long tail; final form is a lava dragon with glowing cracks |
| coal | 불 | R | 깜부기 → 숯불곰 → 화산곰 | chubby brown coal bear cub with a small flame on head; final form is a volcano bear with magma armor |
| firefly | 불 | N | 불똥벌레 → 반딧불이 → 화염나방 | round glowing firefly bug with tiny wings and antennae; final form is a flame moth with big burning wings |
| koi | 물 | SSR | 꼬마잉어 → 청룡잉어 → 해룡왕 | red-white koi fish spirit with whiskers; final form is an oriental sea dragon king with golden crest |
| whale | 물 | SR | 물방울 → 파도핀 → 해신고래 | blue water-drop creature with fins; final form is a giant sacred whale with wave patterns |
| icecat | 물 | R | 얼음냥 → 빙결묘 → 설원표범 | light-blue kitten with ice crystals on head; final form is a snow leopard with crystal armor |
| clam | 물 | N | 조개롱 → 진주게 → 심해크랩 | pink round creature wearing a clam shell; final form is a deep-sea armored crab |
| golem | 풀 | SSR | 이끼돌 → 바위골렘 → 대지거신 | small mossy rock creature; final form is a huge earth golem titan covered in moss and flowers |
| sprout | 풀 | SR | 새싹이 → 잎사귀토 → 숲의수호자 | green rabbit-like sprout with two leaves on head; final form is a forest guardian with leaf crown |
| shroom | 풀 | R | 독버섯 → 독포자 → 균사마왕 | purple creature with red spotted mushroom cap; final form is a mushroom demon lord with spores |
| acorn | 풀 | N | 도토롱 → 도토리곰 → 고목왕 | tiny brown bear wearing an acorn cap; final form is an ancient tree king |
| angel | 빛 | SSR | 반짝이 → 빛날개 → 성천사 | yellow glowing spirit with a halo and small wings; final form is a holy angel with six radiant wings |
| deer | 빛 | SR | 빛사슴 → 은빛사슴 → 태양록 | cream-colored fawn with small golden antlers; final form is a sun stag with glowing antlers |
| cloud | 빛 | R | 솜구름 → 번개구름 → 뇌운신 | fluffy white cloud creature; final form is a thunder cloud god with lightning |
| star | 빛 | N | 별사탕 → 별조각 → 유성 | star-shaped candy creature with sparkles; final form is a blazing meteor star |
| bat | 어둠 | SSR | 그림자 → 어둠박쥐 → 밤의군주 | purple bat-eared shadow creature with fangs and wings; final form is a vampire night lord |
| wolf | 어둠 | SR | 밤늑대 → 그림자늑대 → 월식랑 | dark navy wolf pup with spiky mane; final form is an eclipse wolf with moon aura |
| ghost | 어둠 | R | 꼬마유령 → 망령 → 명계왕 | cute pale ghost with a blue wisp flame; final form is an underworld king ghost with crown |
| octo | 어둠 | N | 먹물이 → 먹구름문어 → 심연문어 | purple baby octopus; final form is an abyss octopus with glowing tentacles |
| dragon | 빛 | UR | 시원알 → 시원룡 → 창세룡 | 1st: cracked golden egg with baby dragon peeking; 2nd: white-gold baby dragon with wings; final: genesis dragon, divine, cosmic glow |
| abyss | 어둠 | UR | 심연알 → 심연룡 → 종말룡 | 1st: dark purple egg with eyes; 2nd: shadow dragon with bat wings; final: apocalypse dragon with dark flames |

> **우선순위**: 시작 몬스터(coal, clam, acorn) → SSR/UR(ember, koi, golem, angel, bat, dragon, abyss) → 나머지

---

## 3. 전투 배경 (5장)

- 경로: `assets/bg/{속성}.jpg` — `grass`, `water`, `fire`, `dark`, `light`
- 크기: **1080×1440 (세로 3:4)**, 위 45%는 하늘/풍경, **아래 55%는 캐릭터가 서는 평평한 땅**
- 공통 프롬프트:
```
Mobile game battle background, cute fantasy painted style, vertical 3:4,
upper half sky and distant scenery, lower half wide flat open ground for characters to stand,
no characters, no text, soft lighting, vibrant
```
| 파일 | 추가 설명 |
|---|---|
| grass.jpg | sunny green meadow, rolling hills, flowers |
| water.jpg | sandy beach, blue sea, palm trees |
| fire.jpg | volcano land, lava rivers in distance, orange sky |
| dark.jpg | haunted night forest, purple moon, mist |
| light.jpg | sky temple above clouds, golden light |

---

## 4. UI 아이콘 (선택, 512×512 PNG, 투명 또는 흰 배경)

- 경로: `assets/ui/{이름}.png`
- 공통: `Game UI icon, glossy cute cartoon style, thick outline, centered, plain white background, no text`

| 파일 이름 | 내용 |
|---|---|
| gold | 금화 더미 |
| food | 고기 (먹이) |
| gems | 보라/파란 보석 |
| stones | 진화석 (빛나는 보라 크리스탈 구슬) |
| attend | 달력 |
| quest | 두루마리 |
| chest | 보물상자 |
| boost | 번개 |
| raid | 용 머리 / 해골 방패 |
| arena | 트로피 |
| exped | 나침반 |
| nav_home | 교차된 검 |
| nav_mons | 발바닥 |
| nav_summon | 빛나는 알 |
| nav_adv | 보물 지도 |
| nav_shop | 상점 가방 |
| banner | 소환 배너 (가로 2:1, 몬스터 3마리 + 반짝이는 배경, 글자 없이) |
| logo | 게임 로고 (글자 "몬스터 키우기") |

---

## 5. 사운드 (선택)

제미나이는 효과음 제작에 적합하지 않아서, 지금은 **게임 안에서 직접 합성한 칩튠 사운드**가 나옵니다.
더 좋은 사운드를 원하면 아래 이름의 mp3를 넣으면 자동 교체됩니다.

- 효과음 `assets/sfx/`: hit, crit, skill, blast, heal, shield, coin, win, lose, click, levelup, evolve, gacha, rare, warning, reward, die
- 배경음악 `assets/bgm/`: stage (일반), boss (보스), raid (레이드), arena (아레나) — 1~2분 루프

---

## 6. 전달 방법

이미지를 만드시면 **파일 이름만 위 규칙대로** 해서 대화창에 올려주세요.
배경 제거·크기 정리·폴더 배치·적용 테스트는 제가 하겠습니다.
