# 🎨 아트 제작 가이드: 귀여운 도트(픽셀) 스타일 · Gemini용

> 🧩 **최신: 한 장에 9마리씩 그리는 격자 프롬프트 16개는 [PROMPTS_GRID.md](PROMPTS_GRID.md)** (`node tools/gen_grid_prompts.js`). 아래 92개 단일 프롬프트([PROMPTS.md](PROMPTS.md))는 예전 몬스터 목록 기준이에요. (`python3 tools/gen_prompts.py`로 다시 생성)

게임은 `assets/` 폴더에서 **정해진 파일 이름**의 그림을 자동으로 찾아서 씁니다.
없는 그림은 지금의 기본 그림으로 나오므로 **조금씩 만들어서 넣어도 됩니다.**
(게임 안 ⚙️ 설정 → "에셋 상태"에서 몇 장이 적용됐는지 볼 수 있어요)

---

## 0. 먼저 읽기: 제미나이로 도트 그림을 잘 뽑는 법

### ① 공통 스타일 문장 (모든 프롬프트 맨 앞에 그대로 붙이기)

```
Cute chibi pixel art sprite for a mobile idle RPG, 16-bit retro SNES style,
64x64 pixel sprite upscaled with crisp hard pixel edges, every pixel clearly visible,
no anti-aliasing, no blur, no gradients, limited 16-color palette, dark 1-pixel outline,
big head small body proportions, big shiny eyes, soft cel shading with 2-3 tones,
single character, full body, centered, facing right in 3/4 side view,
flat solid magenta #FF00FF background, no shadow, no text, no watermark, square 1:1
```

### ② 일관성 유지 요령 (중요)
1. **기준 그림을 먼저 정하세요.** 마음에 드는 첫 그림(예: 주인공 전사)이 나오면, 이후 요청마다 그 그림을 첨부하고
   `"첨부한 그림과 완전히 같은 도트 화풍, 같은 외곽선 두께, 같은 픽셀 크기로 그려줘"`를 붙이세요.
2. **진화 2·3단계는 1단계 그림을 첨부하고** `"이 캐릭터가 진화한 모습. 색과 특징은 유지하고 더 크고 멋있게"`라고 요청하세요.
3. **배경은 마젠타(#FF00FF) 단색**으로 요청하세요. 흰색은 캐릭터 안의 흰 부분과 섞여서 지우기 어렵습니다.
   마젠타 배경 그대로 주시면 제가 **배경 제거와 픽셀 정리(흐릿한 픽셀 보정)** 를 해서 넣어 드립니다.
4. 결과가 "가짜 도트"(흐릿하거나 픽셀 크기가 들쭉날쭉)면 `"더 낮은 해상도, 더 큰 픽셀, 색 수를 줄여서"`라고 다시 요청하세요.
5. 모든 캐릭터는 **오른쪽을 보게** 해주세요. 적은 게임이 자동으로 좌우 반전합니다.

### ③ 여러 장을 한 번에 (장비 아이콘 등)
`"Sprite sheet, 5 items in a single horizontal row, evenly spaced, same size"`처럼 **한 줄에 5개**로 요청하면 빠릅니다.
시트 그대로 주시면 제가 잘라서 파일로 나눠 넣을게요.

---

## 1. 메인 캐릭터 (8장): 가장 먼저 만들 것

- 경로: `assets/hero/{성별}_{직업}.png` (예: `f_mage.png`)
- 성별: `m` 남자, `f` 여자 / 직업: `warrior` `rogue` `mage` `archer`
- **무기는 오른손**, 같은 성별끼리는 **같은 얼굴형·키**로 (옷과 무기만 다르게)

공통 스타일 문장 뒤에 아래를 붙이세요.

| 파일 | 추가 프롬프트 |
|---|---|
| `m_warrior.png` | young boy knight hero, short spiky brown hair, red tunic with small silver shoulder armor, gold belt, silver headband, holding a short broadsword, brave smile |
| `f_warrior.png` | young girl knight hero, red ponytail hair with pink ribbon, red tunic and silver shoulder armor, short skirt, holding a short broadsword, confident smile |
| `m_rogue.png` | young boy thief hero, dark navy hood, face mask covering mouth, dark gray leather outfit, brown belt with pouches, holding a dagger in reverse grip, sharp eyes |
| `f_rogue.png` | young girl thief hero, purple hair under dark hood, mask over mouth, dark gray leather outfit, holding two small daggers, playful eyes |
| `m_mage.png` | young boy wizard hero, silver-white hair, big purple pointed wizard hat with gold band, purple robe, holding a wooden staff with glowing cyan orb |
| `f_mage.png` | young girl witch hero, long lavender hair, big purple pointed hat with gold band, purple robe, holding a wooden staff with glowing cyan orb, cheerful |
| `m_archer.png` | young boy ranger hero, blonde hair, green feathered cap with red feather, green tunic, brown boots, holding a wooden longbow, quiver on back |
| `f_archer.png` | young girl elf ranger hero, long light-green hair, small pointed ears, green cap with red feather, green tunic, holding a wooden longbow |

> 💡 나중에 원하면 **공격 포즈**(`m_warrior_atk.png` 등)도 추가할 수 있어요. 지금은 기본 포즈 1장이면 충분합니다.

---

## 2. 파트너 몬스터 (22종 × 3단계 = 66장)

- 경로: `assets/monsters/{id}_{단계}.png` (단계: `0`=1단계 아기, `1`=2단계 성장, `2`=3단계 최종)
- 1단계는 **작고 둥글고 귀엽게**, 2단계는 **특징이 커지게**, 3단계는 **멋있고 강하게(오라·왕관 등)**
- 우선순위: ① 시작 몬스터 `coal` `clam` `acorn` → ② SSR·UR → ③ 나머지

**프롬프트 쓰는 법:** 공통 스타일 문장 + `pixel monster,` + 아래 단계별 설명

| id | 속성·등급 | 1단계 (`_0`) | 2단계 (`_1`) | 3단계 (`_2`) |
|---|---|---|---|---|
| ember | 불 SSR | 불꼬미: tiny orange fox cub with a small flame on head | 화염꼬리: fox with blazing flame tail and mane | 염룡제: majestic fire dragon emperor, crown of flames |
| salam | 불 SR | 불도롱: small red salamander with tiny horns | 화염도롱: bigger salamander, fiery back spikes | 용암룡: lava dragon with glowing magma cracks |
| coal | 불 R | 깜부기: chubby brown coal bear cub, tiny flame on head | 숯불곰: bear with glowing ember paws | 화산곰: volcano bear with magma armor |
| firefly | 불 N | 불똥벌레: round glowing firefly bug, tiny wings | 반딧불이: firefly with bright glowing tail | 화염나방: flame moth with big burning wings |
| koi | 물 SSR | 꼬마잉어: tiny red-white koi fish spirit with whiskers | 청룡잉어: koi turning into blue dragon, fins like wings | 해룡왕: oriental sea dragon king with golden crest |
| whale | 물 SR | 물방울: blue water-drop creature with small fins | 파도핀: dolphin-like wave creature | 해신고래: giant sacred whale with wave patterns |
| icecat | 물 R | 얼음냥: light-blue kitten with ice crystal on head | 빙결묘: cat with crystal ears and frosty tail | 설원표범: snow leopard with ice crystal armor |
| clam | 물 N | 조개롱: pink round blob wearing a clam shell | 진주게: crab holding a pearl | 심해크랩: deep-sea armored crab, big claws |
| golem | 풀 SSR | 이끼돌: small mossy rock creature | 바위골렘: rock golem with flowers on shoulders | 대지거신: huge earth titan covered in moss and trees |
| sprout | 풀 SR | 새싹이: green bunny with two leaf sprouts on head | 잎사귀토: rabbit with leafy ears | 숲의수호자: forest guardian deer-rabbit with leaf crown |
| shroom | 풀 R | 독버섯: purple blob with red spotted mushroom cap | 독포자: mushroom creature puffing spores | 균사마왕: mushroom demon lord with spore cape |
| acorn | 풀 N | 도토롱: tiny brown bear wearing an acorn cap | 도토리곰: bear with big acorn helmet | 고목왕: ancient tree king with branch crown |
| angel | 빛 SSR | 반짝이: yellow glowing spirit with halo and tiny wings | 빛날개: angel creature with larger feather wings | 성천사: holy angel with six radiant wings |
| deer | 빛 SR | 빛사슴: cream fawn with small golden antlers | 은빛사슴: silver deer with glowing antlers | 태양록: sun stag with blazing golden antlers |
| cloud | 빛 R | 솜구름: fluffy white cloud creature | 번개구름: cloud with lightning bolts | 뇌운신: thunder cloud god riding storm |
| star | 빛 N | 별사탕: star-shaped candy creature with sparkles | 별조각: shining star crystal creature | 유성: blazing meteor star with fiery trail |
| bat | 어둠 SSR | 그림자: purple round bat-eared creature with fangs | 어둠박쥐: bat with big wings | 밤의군주: vampire bat lord with cape and crown |
| wolf | 어둠 SR | 밤늑대: dark navy wolf pup with spiky mane | 그림자늑대: shadow wolf with glowing eyes | 월식랑: eclipse wolf with moon aura |
| ghost | 어둠 R | 꼬마유령: cute pale ghost with blue wisp flame | 망령: ghost with chains and lantern | 명계왕: underworld ghost king with crown |
| octo | 어둠 N | 먹물이: purple baby octopus | 먹구름문어: octopus with ink cloud | 심연문어: abyss octopus with glowing tentacles |
| dragon | 빛 UR | 시원알: golden egg with baby dragon peeking out | 시원룡: white-gold baby dragon with wings | 창세룡: genesis dragon, divine cosmic glow |
| abyss | 어둠 UR | 심연알: dark purple egg with glowing eyes | 심연룡: shadow dragon with bat wings | 종말룡: apocalypse dragon with dark flames |

---

## 3. 장비 아이콘 (45장)

- 크기: 아이콘 1개당 64×64 도트 (512×512로 업스케일 OK), 마젠타 배경
- **등급별 디자인 규칙** (같은 장비를 5단계로):
  - `N`: plain iron and wood, dull colors
  - `R`: blue trim, polished
  - `SR`: purple gems, decorated
  - `SSR`: ornate gold, glowing
  - `UR`: legendary rainbow aura, sparkles, most elaborate

| 파일 이름 | 장비 | 프롬프트 (공통 스타일 문장 대신 이걸 사용) |
|---|---|---|
| `weapon_warrior_{N,R,SR,SSR,UR}.png` | 전사 검 | `Pixel art RPG item icon sprite sheet, 5 swords in one row from common to legendary (iron, blue, purple gem, gold, rainbow legendary), 16-bit style, crisp pixels, dark outline, magenta #FF00FF background` |
| `weapon_rogue_….png` | 도적 단검 | 같은 문장에서 `5 daggers` |
| `weapon_mage_….png` | 마법사 지팡이 | `5 magic staffs with glowing orbs` |
| `weapon_archer_….png` | 궁수 활 | `5 bows` |
| `armor_….png` | 갑옷 | `5 chest armors` |
| `helmet_….png` | 투구 | `5 helmets` |
| `ring_….png` | 반지 | `5 rings with gems` |
| `collar_….png` | 몬스터 목걸이 | `5 cute pet collars with charm pendant` |
| `charm_….png` | 몬스터 부적 | `5 magic talisman charms (paper talisman / amulet)` |

경로: `assets/gear/` (예: `assets/gear/weapon_mage_SSR.png`, `assets/gear/collar_N.png`)
→ **시트(한 줄 5개)로 9장만 주시면** 제가 45개 파일로 잘라 넣습니다.

---

## 4. 전투 배경 (5장)

- 경로: `assets/bg/{grass,water,fire,dark,light}.png`
- 크기: **세로 3:4** (예: 768×1024), 위 45%는 하늘·풍경, **아래 55%는 캐릭터가 서는 평평한 땅**

```
Cute pixel art game battle background, 16-bit retro style, vertical 3:4,
upper part sky and distant scenery, lower half wide flat open ground for characters to stand,
crisp pixels, limited palette, no characters, no text
```
| 파일 | 추가 설명 |
|---|---|
| grass | sunny green meadow, rolling hills, small flowers |
| water | sandy beach, blue sea, palm trees |
| fire | volcano land, lava rivers in distance, orange sky |
| dark | haunted night forest, purple full moon, fog |
| light | sky temple above clouds, golden light |

---

## 5. UI 아이콘 (선택, 각 64×64 도트)

경로: `assets/ui/{이름}.png`. 시트로 한 번에 요청해도 됩니다.
`Pixel art game UI icon sprite sheet, 16-bit style, crisp pixels, dark outline, magenta #FF00FF background, items:` 뒤에 나열하세요.

| 이름 | 내용 | 이름 | 내용 |
|---|---|---|---|
| gold | 금화 더미 | gems | 다이아몬드 (다이아) |
| stones | 진화석 (보라 크리스탈 구슬) | ench | 강화석 (망치 + 빛나는 돌) |
| attend | 달력 | quest | 두루마리 |
| chest | 보물상자 | boost | 번개 |
| arena | 트로피 | exped | 나침반 |
| bag | 가방 | hero | 주인공 얼굴 |
| nav_home | 교차된 검 | nav_hero | 주인공 얼굴 |
| nav_mons | 발바닥 | nav_summon | 빛나는 알 |
| nav_adv | 보물 지도 | nav_shop | 상점 가방 |
| banner | 소환 배너 (가로 2:1, 몬스터 3마리, 글자 없이) | logo | 게임 로고 "몬스터 키우기" |

---

## 6. 추천 제작 순서

1. **주인공 1장**(예: `f_mage`)으로 화풍 확정 → 나머지 7장
2. 시작 몬스터 `coal_0` `clam_0` `acorn_0`
3. 장비 시트 9장
4. 배경 `grass` (1챕터)
5. 나머지 몬스터 → UI 아이콘

## 7. 전달 방법
파일 이름을 위 규칙대로 붙여서 대화창에 올려주세요. 마젠타 배경 그대로 괜찮습니다.
**배경 제거 · 픽셀 정리 · 시트 자르기 · 폴더 배치 · 게임 적용 테스트**는 제가 하겠습니다.

> 효과음·배경음악은 제미나이로 만들기 어려워 지금은 게임이 직접 합성한 칩튠 소리를 씁니다.
> 원하면 `assets/sfx/`, `assets/bgm/`에 mp3를 넣어 교체할 수 있어요 (이름은 README 참고).
