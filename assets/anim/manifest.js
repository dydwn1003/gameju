// 도트 프레임 애니메이션 등록표
// 여기 등록한 캐릭터·몬스터는 디자인 시트 한 장 대신 프레임 이미지로 움직인다.
// 자세한 규격은 docs/ART_SPEC.md 참고. 예시:
//
// R.ANIM_SHEETS.GLADIATOR = {
//   src: 'assets/anim/GLADIATOR.png',
//   fw: 32, fh: 48,                     // 한 칸(프레임) 크기 (px)
//   scale: 1,                           // 이미지 1px = 게임 논리 1px (3배로 그린 경우 3)
//   rows: { down: 0, up: 1, side: 2 },  // 줄 = 방향 (side는 오른쪽을 본 그림, 왼쪽은 좌우 반전)
//   idle: [0], walk: [1, 2, 3, 4], attack: [5, 6, 7], hurt: [8],   // 칸 번호
// };
'use strict';
R.ANIM_SHEETS = {};

// 검투사 걷기 (assets/anim/src/GLADIATOR_walk.webp → tools/extract_walk.py 로 변환)
R.ANIM_SHEETS.GLADIATOR = {"src": "assets/anim/GLADIATOR.png", "fw": 96, "fh": 84, "scale": 3, "rows": {"down": 0, "up": 1, "left": 2, "right": 3}, "idle": {"down": [0], "up": [0], "left": [0], "right": [1]}, "walk": {"down": [0, 1, 2, 3, 4, 5, 6], "up": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "left": [0, 1, 2, 3, 4, 5, 6], "right": [0, 1, 2, 3, 4, 5, 6]}, "walkPerTile": {"down": 3.5, "up": 6.0, "left": 3.5, "right": 3.5}};
