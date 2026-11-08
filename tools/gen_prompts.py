"""제미나이용 그림 프롬프트 생성기.
출력: docs/PROMPTS.md (저장소용) + 복사 버튼 달린 HTML 페이지 (인자로 경로 지정)
사용: python3 tools/gen_prompts.py [html_out_path]
"""
import json, sys, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent

STYLE = ("Cute chibi pixel art sprite for a mobile idle RPG, 16-bit retro SNES style, "
         "64x64 pixel sprite upscaled with crisp hard pixel edges, every pixel clearly visible, "
         "no anti-aliasing, no blur, no gradients, limited 16-color palette, dark 1-pixel outline, "
         "big head small body proportions, big shiny eyes, soft cel shading with 2-3 tones, "
         "single character, full body, centered, facing right in 3/4 side view, "
         "flat solid magenta #FF00FF background, no shadow, no text, no watermark, square 1:1")
ITEM_STYLE = ("Pixel art RPG item icon sprite sheet, 16-bit retro style, 5 items in a single horizontal row, "
              "evenly spaced, same size, each item 64x64 pixels upscaled, crisp hard pixel edges, no anti-aliasing, "
              "dark 1-pixel outline, limited palette, flat solid magenta #FF00FF background, no text, no watermark")
BG_STYLE = ("Cute pixel art game battle background, 16-bit retro SNES style, vertical 3:4 portrait, "
            "upper 45% sky and distant scenery, lower 55% wide flat open ground where characters stand, "
            "crisp hard pixel edges, no anti-aliasing, limited palette, no characters, no text, no watermark")
UI_STYLE = ("Pixel art game UI icon sprite sheet, 16-bit retro style, icons in a grid, each 64x64 pixels upscaled, "
            "crisp hard pixel edges, no anti-aliasing, dark 1-pixel outline, glossy cute look, "
            "flat solid magenta #FF00FF background, no text, no watermark")
ATTACH = ("Same pixel art style, same outline thickness and pixel size as the attached image. ")
EVOLVE = ("Evolved form of the attached character: keep the same main colors and signature features, "
          "make it bigger, stronger and cooler. ")

HEROES = [
    ("m_warrior", "남자 전사", "young boy knight hero, short spiky brown hair, red tunic with small silver shoulder armor, gold belt, silver headband, holding a short broadsword in right hand, brave smile"),
    ("f_warrior", "여자 전사", "young girl knight hero, red ponytail hair with pink ribbon, red tunic with small silver shoulder armor, short skirt, holding a short broadsword in right hand, confident smile"),
    ("m_rogue", "남자 도적", "young boy thief hero, dark navy hood, cloth mask covering mouth, dark gray leather outfit, brown belt with pouches, holding a dagger in right hand, sharp eyes"),
    ("f_rogue", "여자 도적", "young girl thief hero, purple hair peeking from dark hood, cloth mask over mouth, dark gray leather outfit, holding a dagger in right hand, playful eyes"),
    ("m_mage", "남자 마법사", "young boy wizard hero, silver-white hair, big purple pointed wizard hat with gold band, purple robe, holding a wooden staff with a glowing cyan orb in right hand"),
    ("f_mage", "여자 마법사", "young girl witch hero, long lavender hair, big purple pointed wizard hat with gold band, purple robe, holding a wooden staff with a glowing cyan orb in right hand, cheerful"),
    ("m_archer", "남자 궁수", "young boy ranger hero, blonde hair, green cap with a red feather, green tunic, brown boots, holding a wooden longbow in right hand, quiver on back"),
    ("f_archer", "여자 궁수", "young girl elf ranger hero, long light-green hair, small pointed ears, green cap with a red feather, green tunic, holding a wooden longbow in right hand"),
]

EL = {"fire": "불", "water": "물", "grass": "풀", "light": "빛", "dark": "어둠"}
MONSTERS = [
    ("ember", "fire", "SSR", [("불꼬미", "tiny orange fox cub with a small flame on its head"), ("화염꼬리", "fox with a blazing flame tail and fiery mane"), ("염룡제", "majestic fire dragon emperor with a crown of flames")]),
    ("salam", "fire", "SR", [("불도롱", "small red salamander with tiny horns and a long tail"), ("화염도롱", "bigger red salamander with fiery spikes on its back"), ("용암룡", "lava dragon with glowing magma cracks on its body")]),
    ("coal", "fire", "R", [("깜부기", "chubby brown coal bear cub with a tiny flame on its head"), ("숯불곰", "brown bear with glowing ember paws and a flame on its head"), ("화산곰", "big volcano bear wearing magma rock armor")]),
    ("firefly", "fire", "N", [("불똥벌레", "round glowing firefly bug with tiny wings and antennae"), ("반딧불이", "firefly with a bright glowing tail and bigger wings"), ("화염나방", "flame moth with big burning wings")]),
    ("koi", "water", "SSR", [("꼬마잉어", "tiny red and white koi fish spirit with long whiskers"), ("청룡잉어", "koi turning into a blue dragon, fins like wings"), ("해룡왕", "oriental sea dragon king with a golden crest")]),
    ("whale", "water", "SR", [("물방울", "blue water-drop creature with small fins"), ("파도핀", "dolphin-like wave creature with a wave crest"), ("해신고래", "giant sacred whale with glowing wave patterns")]),
    ("icecat", "water", "R", [("얼음냥", "light-blue kitten with an ice crystal on its head"), ("빙결묘", "cat with crystal ears and a frosty tail"), ("설원표범", "snow leopard wearing ice crystal armor")]),
    ("clam", "water", "N", [("조개롱", "pink round blob creature wearing a clam shell"), ("진주게", "cute crab holding a shiny pearl"), ("심해크랩", "deep-sea armored crab with big claws")]),
    ("golem", "grass", "SSR", [("이끼돌", "small mossy rock creature with a tiny flower"), ("바위골렘", "rock golem with flowers growing on its shoulders"), ("대지거신", "huge earth titan covered in moss and small trees")]),
    ("sprout", "grass", "SR", [("새싹이", "green bunny with two leaf sprouts on its head"), ("잎사귀토", "rabbit with long leafy ears"), ("숲의수호자", "forest guardian deer-rabbit with a leaf crown")]),
    ("shroom", "grass", "R", [("독버섯", "purple blob with a red spotted mushroom cap"), ("독포자", "mushroom creature puffing purple spores"), ("균사마왕", "mushroom demon lord with a spore cape")]),
    ("acorn", "grass", "N", [("도토롱", "tiny brown bear wearing an acorn cap"), ("도토리곰", "bear wearing a big acorn helmet"), ("고목왕", "ancient tree king with a branch crown")]),
    ("angel", "light", "SSR", [("반짝이", "yellow glowing spirit with a halo and tiny wings"), ("빛날개", "angel creature with larger feathered wings"), ("성천사", "holy angel with six radiant wings")]),
    ("deer", "light", "SR", [("빛사슴", "cream-colored fawn with small golden antlers"), ("은빛사슴", "silver deer with glowing antlers"), ("태양록", "sun stag with blazing golden antlers")]),
    ("cloud", "light", "R", [("솜구름", "fluffy white cloud creature"), ("번개구름", "cloud creature crackling with small lightning bolts"), ("뇌운신", "thunder cloud god riding a storm")]),
    ("star", "light", "N", [("별사탕", "star-shaped candy creature with sparkles"), ("별조각", "shining star crystal creature"), ("유성", "blazing meteor star with a fiery trail")]),
    ("bat", "dark", "SSR", [("그림자", "purple round bat-eared creature with tiny fangs"), ("어둠박쥐", "bat creature with big wings"), ("밤의군주", "vampire bat lord with a cape and crown")]),
    ("wolf", "dark", "SR", [("밤늑대", "dark navy wolf pup with a spiky mane"), ("그림자늑대", "shadow wolf with glowing eyes"), ("월식랑", "eclipse wolf with a moon aura")]),
    ("ghost", "dark", "R", [("꼬마유령", "cute pale ghost with a blue wisp flame"), ("망령", "ghost with chains and a lantern"), ("명계왕", "underworld ghost king with a crown")]),
    ("octo", "dark", "N", [("먹물이", "purple baby octopus"), ("먹구름문어", "octopus surrounded by an ink cloud"), ("심연문어", "abyss octopus with glowing tentacles")]),
    ("dragon", "light", "UR", [("시원알", "golden egg with a baby dragon peeking out of a crack"), ("시원룡", "white and gold baby dragon with small wings"), ("창세룡", "divine genesis dragon with a cosmic glow")]),
    ("abyss", "dark", "UR", [("심연알", "dark purple egg with glowing eyes"), ("심연룡", "shadow dragon with bat wings"), ("종말룡", "apocalypse dragon with dark flames")]),
]
PRIORITY = {"coal", "clam", "acorn"}

RARITY_ROW = ("from left to right: common plain iron and wood, rare with blue trim, "
              "epic with purple gems, legendary ornate gold with glow, mythic with rainbow aura and sparkles")
GEAR = [
    ("weapon_warrior", "전사 검 ×5", "5 short swords"),
    ("weapon_rogue", "도적 단검 ×5", "5 daggers"),
    ("weapon_mage", "마법사 지팡이 ×5", "5 magic staffs with glowing orbs"),
    ("weapon_archer", "궁수 활 ×5", "5 wooden bows"),
    ("armor", "갑옷 ×5", "5 chest armors"),
    ("helmet", "투구 ×5", "5 helmets"),
    ("ring", "반지 ×5", "5 rings with gems"),
    ("collar", "몬스터 목걸이 ×5", "5 cute pet collars with a charm pendant"),
    ("charm", "몬스터 부적 ×5", "5 magic talisman amulets"),
]
BGS = [
    ("grass", "풀 (1챕터)", "sunny green meadow, rolling hills, small flowers, blue sky with fluffy clouds"),
    ("water", "물 (2챕터)", "sandy beach, sparkling blue sea, palm trees, bright sky"),
    ("fire", "불 (3챕터)", "volcano land, lava rivers in the distance, orange sky, dark rocky ground"),
    ("dark", "어둠 (4챕터)", "haunted night forest, big purple full moon, light fog, dark grass"),
    ("light", "빛 (5챕터)", "sky temple above the clouds, golden sunlight, white marble floor"),
]
UIS = [
    ("ui_sheet_1", "재화·메뉴 아이콘 8개", "8 icons in 2 rows of 4: pile of gold coins, shiny blue diamond, glowing purple crystal orb, hammer with glowing stone, calendar, paper scroll, treasure chest, lightning bolt",
     "gold, gems, stones, ench, attend, quest, chest, boost"),
    ("ui_sheet_2", "모험·탭 아이콘 8개", "8 icons in 2 rows of 4: golden trophy, compass, adventurer backpack, crossed swords, paw print, glowing egg, treasure map, shop bag",
     "arena, exped, bag, nav_home, nav_mons, nav_summon, nav_adv, nav_shop"),
]

def build():
    groups = []
    g = {"id": "hero", "title": "메인 캐릭터", "note": "8장 · assets/hero/ · 첫 장으로 화풍을 정하고, 이후엔 그 그림을 첨부해서 요청", "items": []}
    for i, (f, name, d) in enumerate(HEROES):
        g["items"].append({"file": f"{f}.png", "name": name, "tags": ["화풍 기준"] if i == 5 else [],
                           "attach": "" if i == 5 else "f_mage 그림(또는 첫 완성본) 첨부",
                           "prompt": ("" if i == 5 else ATTACH) + STYLE + ", " + d})
    # f_mage 를 맨 앞으로 (화풍 기준)
    g["items"].insert(0, g["items"].pop(5))
    groups.append(g)

    g = {"id": "monster", "title": "파트너 몬스터", "note": "66장 · assets/monsters/ · 2·3단계는 바로 전 단계 그림을 첨부", "items": []}
    order = sorted(MONSTERS, key=lambda m: (m[0] not in PRIORITY, ["UR", "SSR", "SR", "R", "N"].index(m[2])))
    for mid, el, r, forms in order:
        for k, (kn, d) in enumerate(forms):
            tags = [EL[el], r, f"{k + 1}단계"] + (["시작 몬스터"] if mid in PRIORITY else [])
            if k == 0:
                p = ATTACH + STYLE + ", pixel monster, baby form, small and round, " + d
                attach = "화풍 기준 그림 첨부"
            else:
                p = ATTACH + EVOLVE + STYLE + ", pixel monster, " + ("final form, aura of power, " if k == 2 else "") + d
                attach = f"{mid}_{k - 1}.png ({forms[k - 1][0]}) 첨부"
            g["items"].append({"file": f"{mid}_{k}.png", "name": kn, "tags": tags, "attach": attach, "prompt": p, "line": mid})
    groups.append(g)

    g = {"id": "gear", "title": "장비 아이콘", "note": "시트 9장 → 제가 45개 파일로 잘라 넣음 · assets/gear/", "items": []}
    for f, name, what in GEAR:
        g["items"].append({"file": f"{f}_sheet.png", "name": name, "tags": ["N→UR 5단계"], "attach": "",
                           "prompt": ITEM_STYLE + ", " + what + ", " + RARITY_ROW})
    groups.append(g)

    g = {"id": "bg", "title": "전투 배경", "note": "5장 · assets/bg/ · 세로 3:4 (예: 768×1024)", "items": []}
    for f, name, d in BGS:
        g["items"].append({"file": f"{f}.png", "name": name, "tags": [], "attach": "", "prompt": BG_STYLE + ", " + d})
    groups.append(g)

    g = {"id": "ui", "title": "UI 아이콘", "note": "시트 2장 + 배너 + 로고 · assets/ui/", "items": []}
    for f, name, d, keys in UIS:
        g["items"].append({"file": f"{f}.png", "name": name, "tags": [], "attach": "", "note": "파일 나누기 → " + keys, "prompt": UI_STYLE + ", " + d})
    g["items"].append({"file": "banner.png", "name": "소환 배너", "tags": ["가로 2:1"], "attach": "몬스터 그림 2~3장 첨부",
                       "prompt": "Cute pixel art gacha summon banner for a mobile RPG, 16-bit retro style, horizontal 2:1, three cute fantasy monsters (fire fox, holy angel, golden baby dragon) posing together, sparkling purple magic background with light rays, crisp pixels, no text, no watermark"})
    g["items"].append({"file": "logo.png", "name": "게임 로고", "tags": [], "attach": "",
                       "prompt": "Cute pixel art game logo, 16-bit retro style, Korean title text \"몬스터 키우기\" in chunky rounded pixel letters, purple and gold colors, small paw and star decorations, flat solid magenta #FF00FF background"})
    groups.append(g)
    return groups

def write_md(groups):
    out = ["# 🖌️ 제미나이 그림 프롬프트 (복사해서 바로 사용)", "",
           "- 각 프롬프트를 **통째로** 복사해서 제미나이에 붙여넣으세요.",
           "- `첨부:`라고 적힌 항목은 그 그림을 같이 올려야 화풍과 진화 모습이 맞춰져요.",
           "- 배경은 마젠타(#FF00FF) 그대로 주시면 배경 제거와 픽셀 정리는 제가 합니다.",
           "- 복사 버튼이 있는 페이지 버전도 있어요 (대화에 올린 링크).", ""]
    for g in groups:
        out += [f"## {g['title']}", "", f"> {g['note']}", ""]
        for it in g["items"]:
            tags = " · ".join(it["tags"])
            out.append(f"### `{it['file']}` {it['name']}" + (f" ({tags})" if tags else ""))
            if it.get("attach"): out.append(f"첨부: {it['attach']}")
            if it.get("note"): out.append(f"파일 나누기: {it['note']}")
            out += ["", "```", it["prompt"], "```", ""]
    (ROOT / "docs" / "PROMPTS.md").write_text("\n".join(out))

def write_html(groups, path):
    total = sum(len(g["items"]) for g in groups)
    data = json.dumps(groups, ensure_ascii=False)
    page = (ROOT / "tools" / "prompts_page.html").read_text()
    page = page.replace("__DATA__", data).replace("__TOTAL__", str(total))
    pathlib.Path(path).write_text(page)

if __name__ == "__main__":
    groups = build()
    write_md(groups)
    if len(sys.argv) > 1:
        write_html(groups, sys.argv[1])
    print("items:", sum(len(g["items"]) for g in groups))
