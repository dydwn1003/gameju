// ===== 에셋 교체 시스템 =====
// assets/ 폴더에 정해진 이름으로 파일을 넣으면 자동으로 코드 그림/합성음 대신 사용됩니다.
// 파일 이름 규칙은 docs/ART_GUIDE.md 참고.
const Assets = (() => {
  const img = {};
  const listeners = [];
  let pending = 0;

  const UI_KEYS = ['gold', 'gems', 'stones', 'ench', 'hero', 'bag', 'attend', 'quest', 'chest', 'boost', 'raid', 'arena', 'exped',
    'nav_home', 'nav_hero', 'nav_mons', 'nav_summon', 'nav_adv', 'nav_shop', 'logo', 'banner'];

  function probe(key, urls) {
    pending++;
    const tryNext = i => {
      if (i >= urls.length) { pending--; return; }
      const im = new Image();
      im.onload = () => { img[key] = urls[i]; pending--; changed(); };
      im.onerror = () => tryNext(i + 1);
      im.src = urls[i];
    };
    tryNext(0);
  }

  let tmr = null;
  function changed() {
    clearTimeout(tmr);
    tmr = setTimeout(() => listeners.forEach(f => f()), 150);
  }

  function init() {
    if (window.NO_ASSET_PROBE) return;
    // 프로토콜이 file:// 이든 http 이든 동작 (없는 파일은 조용히 무시)
    for (const L of LINES) if (!SIZES()[L.id]) for (let f = 0; f < 3; f++) probe(`m_${L.id}_${f}`, [`assets/monsters/${L.id}_${f}.png`, `assets/monsters/${L.id}_${f}.webp`]);
    for (const el of Object.keys(ELEMENTS)) probe(`bg_${el}`, [`assets/bg/${el}.jpg`, `assets/bg/${el}.png`, `assets/bg/${el}.webp`]);
    for (const k of UI_KEYS) probe(`ui_${k}`, [`assets/ui/${k}.png`, `assets/ui/${k}.webp`]);
    for (const g of ['m', 'f']) for (const c of Object.keys(CLASSES)) probe(`hero_${g}_${c}`, [`assets/hero/${g}_${c}.png`]);
    for (const sl of Object.keys(GEAR_SLOTS)) for (const r of RARITY_ORDER) {
      if (sl === 'weapon') for (const c of Object.keys(CLASSES)) probe(`gear_weapon_${c}_${r}`, [`assets/gear/weapon_${c}_${r}.png`]);
      else probe(`gear_${sl}_${r}`, [`assets/gear/${sl}_${r}.png`]);
    }
  }

  // 제미나이 격자에서 잘라낸 그림 (assets/sizes.js 에 크기 목록)
  // opts.battle: 전투 화면 (몬스터끼리 실제 크기 비율 유지) / 그 외: 칸에 맞춰 표시
  const SIZES = () => window.ASSET_SIZES || {};
  function sized(id, form, opts, path) {
    const sil = opts.silhouette ? ' silhouette' : '';
    if (opts.battle) {
      // 키 기준: (가로/세로) × 목표 키 ÷ 칸 너비 비율 → 칸 너비 대비 %
      const [w, h] = SIZES()[id], cs = SIZES()[id + '_cast'];
      const pct = (w / h) * sizeOf(id) * [0.8, 0.92, 1][form] * (opts.boost || 1) / (opts.cw || 1) * 100;
      // 마법 쓰는 모습: 같은 왼쪽·아래 기준으로 겹쳐 두었다가 스킬 쓸 때만 보임
      const cast = cs ? `<img class="mimg cast" src="${path.replace('.png', '_cast.png')}" style="width:${Math.round((cs[0] / w) * 100)}%" draggable="false" alt="">` : '';
      return `<div class="natbox"><span class="natwrap" style="width:${Math.round(pct)}%"><img class="mimg nat${sil}" src="${path}" draggable="false" alt="">${cast}</span></div>`;
    }
    return `<div class="fitbox f${form}"><img class="mimg fit${sil}" src="${path}" draggable="false" alt=""></div>`;
  }
  function monster(id, form, opts = {}) {
    const u = img[`m_${id}_${form}`];
    if (u) return `<img class="mimg${opts.silhouette ? ' silhouette' : ''}" src="${u}" draggable="false" alt="">`;
    if (SIZES()[id]) return sized(id, form, opts, `assets/monsters/${id}.png`);
    return MonArt.monster(id, form, opts);
  }
  // 스킬 그림 (상세 화면용)
  function castArt(id) {
    if (!SIZES()[id + '_cast']) return '';
    const dir = id.startsWith('e_') || id.startsWith('r_') ? 'enemies' : 'monsters';
    return `<img class="mimg skillart" src="assets/${dir}/${id}_cast.png" draggable="false" alt="">`;
  }
  function enemy(id, form, opts = {}) {
    if (SIZES()[id]) return sized(id, form, opts, `assets/enemies/${id}.png`);
    return MonArt.enemy(id, form, opts);
  }
  const bg = el => img[`bg_${el}`] || null;
  const icon = (k, emoji) => (img[`ui_${k}`] ? `<img class="ic" src="${img[`ui_${k}`]}" alt="">` : emoji);
  const has = k => !!img[k];
  const raw = (k, cls = 'mimg') => (img[k] ? `<img class="${cls}" src="${img[k]}" draggable="false" alt="">` : '');
  function stats() {
    const keys = Object.keys(img);
    return {
      monsters: LINES.filter(l => SIZES()[l.id]).length + keys.filter(k => k.startsWith('m_')).length, monstersTotal: LINES.length,
      enemies: ENEMIES.filter(e => SIZES()[e.id]).length, enemiesTotal: ENEMIES.length,
      bg: keys.filter(k => k.startsWith('bg_')).length, bgTotal: 5,
      ui: keys.filter(k => k.startsWith('ui_')).length, uiTotal: UI_KEYS.length,
      hero: keys.filter(k => k.startsWith('hero_')).length, heroTotal: 8,
      gear: keys.filter(k => k.startsWith('gear_')).length, gearTotal: 45,
    };
  }
  const onChange = f => listeners.push(f);

  return { init, monster, enemy, castArt, bg, icon, has, raw, stats, onChange };
})();
