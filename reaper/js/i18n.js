// ===== 다국어 (한국어 · 日本語 · 中文 · English) =====
// 게임 코드는 한국어로 쓰고, 화면(DOM)에 한국어 글자가 나타나면 고른 언어로 바꿔 끼운다.
// - 사전: I18N_DATA[lang] = { '한국어 문장': '번역', '옥 {0}개': 'Jade ×{0}', … } (i18n_ja.js · i18n_zh.js · i18n_en.js)
// - {0},{1}… 은 바뀌는 값(숫자 · 이름), {~} 는 한국어 조사(을/를 · 이/가) 자리
// - 숫자 단위(만 · 억 · 조 …)는 언어에 맞게 바꿈 (영어 K · M · B · T, 일본어 万 · 億 · 兆, 중국어 万 · 亿 · 兆)
const I18N = (() => {
  const LANGS = [['ko', '한국어'], ['ja', '日本語'], ['zh', '中文'], ['en', 'English']];
  const KEY = 'reaper_lang';
  const guess = () => { const n = (navigator.language || 'ko').toLowerCase(); return n.startsWith('ja') ? 'ja' : n.startsWith('zh') ? 'zh' : n.startsWith('en') ? 'en' : 'ko'; };
  let chosen = null; try { chosen = localStorage.getItem(KEY); } catch (e) {}
  const lang = LANGS.some(l => l[0] === chosen) ? chosen : guess();
  const H = /[가-힣]/;
  const dict = (typeof I18N_DATA !== 'undefined' && I18N_DATA[lang]) || {};
  const on = lang !== 'ko';

  // ---------- 숫자 단위 ----------
  const KU = { '만': 1e4, '억': 1e8, '조': 1e12, '경': 1e16, '해': 1e20 };
  const LOCAL_U = { ja: { '만': '万', '억': '億', '조': '兆', '경': '京', '해': '垓' }, zh: { '만': '万', '억': '亿', '조': '兆', '경': '京', '해': '垓' } };
  const EN_U = [['Sx', 1e21], ['Qi', 1e18], ['Qa', 1e15], ['T', 1e12], ['B', 1e9], ['M', 1e6], ['K', 1e3]];
  function num(text) {
    return text.replace(/(\d[\d.,]*)(만|억|조|경|해)(?![가-힣])/g, (m, n, u) => {
      if (LOCAL_U[lang]) return n + LOCAL_U[lang][u];
      const v = parseFloat(n.replace(/,/g, '')) * KU[u];
      for (const [s, d] of EN_U) if (v >= d) { const x = v / d; return (x >= 100 ? Math.floor(x) : x >= 10 ? +x.toFixed(1) : +x.toFixed(2)) + s; }
      return String(Math.floor(v));
    });
  }

  // ---------- 틀이 있는 문장 ({0} · {~}) ----------
  const esc = s => s.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
  const pats = [];
  for (const k of Object.keys(dict)) {
    if (!/\{(\d+|~)\}/.test(k)) continue;
    // 바로 붙은 자리표시({0}{1})는 한 덩어리로 잡은 뒤 나눌 곳을 하나씩 시험
    const parts = k.split(/(\{\d+\}|\{~\})/).filter(x => x !== '');
    const groups = []; let src = '^', prevCap = false;
    for (const part of parts) {
      if (part === '{~}') { src += '(?:을|를|이|가)?'; prevCap = false; }
      else if (/^\{\d+\}$/.test(part)) { const n = +part.slice(1, -1); if (prevCap) groups[groups.length - 1].push(n); else { groups.push([n]); src += '(.*?)'; } prevCap = true; }
      else { src += esc(part); prevCap = false; }
    }
    const statics = k.split(/\{\d+\}|\{~\}/).map(x => x.trim()).filter(Boolean);
    if (!statics.some(x => H.test(x))) continue;
    pats.push({ re: new RegExp(src + '$'), groups, val: dict[k], statics, len: statics.join('').length, startsCap: /^\{\d+\}/.test(k) });
  }
  pats.sort((a, b) => b.len - a.len);
  // 사전의 단어들 (긴 것부터) — 마지막 방법: 문장 속 단어 바꿔 끼우기
  const words = Object.keys(dict).filter(k => !/[{}]/.test(k) && k.length >= 2 && H.test(k)).sort((a, b) => b.length - a.length);
  const wordRe = words.length ? new RegExp(words.map(esc).join('|'), 'g') : null;
  const done = r => r != null && !H.test(r);
  // 번역이 안 된 조각이라도 짧은 한 단어(닉네임 같은 것)면 그대로 둠
  const nameLike = x => !/\s/.test(x.trim()) && x.trim().length <= 8;

  function core(s, depth) {
    if (!H.test(s)) return s;
    if (dict[s] != null) return dict[s];
    if (depth > 4) return null;
    // 2) 틀 맞추기 (모든 칸이 번역돼야 인정)
    for (const P of pats) {
      if (!P.statics.every(x => s.includes(x))) continue;
      const mm = s.match(P.re); if (!mm) continue;
      const vals = {}; let ok = true;
      P.groups.forEach((g, gi) => {
        if (!ok) return; const cap = mm[gi + 1];
        if (gi === 0 && P.startsCap && !cap.trim()) { ok = false; return; } // '{0}장' 이 '장' 한 글자에 걸리지 않게
        const tr = x => { if (!H.test(x)) return x; const r = core(x.trim(), depth + 1); return done(r) ? x.replace(x.trim(), r) : null; };
        if (g.length === 1) { const r = tr(cap); if (r == null) { if (nameLike(cap)) vals[g[0]] = cap; else ok = false; } else vals[g[0]] = r; return; }
        // 붙은 두 칸: 나눌 곳 찾기
        let found = false;
        for (let cut = 1; cut < cap.length && !found; cut++) { const a = tr(cap.slice(0, cut)), b = tr(cap.slice(cut)); if (a != null && b != null) { vals[g[0]] = a; vals[g[1]] = b; found = true; } }
        if (!found) ok = false;
      });
      if (!ok) continue;
      return P.val.replace(/\{(\d+)\}/g, (_, i) => vals[i] != null ? vals[i] : '').replace(/\{~\}/g, '');
    }
    // 2-1) 앞뒤의 기호 · 숫자 · 이모지를 떼고
    const m = s.match(/^([^가-힣]*?)([가-힣](?:.*[가-힣])?)([^가-힣]*)$/);
    if (m && (m[1] || m[3])) { const r = core(m[2].trim(), depth + 1); if (done(r)) return m[1] + r + m[3]; }
    // 3) 구분 기호(· → / , :)로 나눠서 하나씩
    const seg = s.split(/(\s*(?:·|→|\||\/|,|:|·)\s*)/);
    if (seg.length > 1) { const out = seg.map((x, i) => i % 2 ? x : (H.test(x) ? core(x.trim(), depth + 1) : x)); if (out.every(x => x != null) && done(out.join(''))) return out.join(''); }
    // 4) 문장 속 아는 단어 바꿔 끼우기 (한국어가 하나도 안 남을 때만)
    if (wordRe) { const r = s.replace(wordRe, w => dict[w]); if (done(r)) return r; }
    return null;
  }

  const cache = new Map();
  function t(text) {
    if (!on || !text || !H.test(text)) return text;
    const c = cache.get(text); if (c !== undefined) return c;
    const lead = text.match(/^\s*/)[0], tail = text.match(/\s*$/)[0];
    const s = num(text.trim().replace(/\s+/g, ' '));
    let r = core(s, 0);
    if (r == null) r = s; // 끝내 모르면 (숫자 단위만 바꾼 채) 그대로
    r = lead + r + tail;
    if (cache.size > 6000) cache.clear();
    cache.set(text, r); return r;
  }

  // ---------- 화면에 적용 ----------
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  function fixNode(n) {
    if (n.nodeType === 3) {
      const p = n.parentNode; if (!p || SKIP.has(p.nodeName) || (p.closest && p.closest('[translate="no"]'))) return;
      const v = n.nodeValue; if (!H.test(v)) return;
      const r = t(v); if (r !== v) n.nodeValue = r;
    } else if (n.nodeType === 1) {
      if (SKIP.has(n.nodeName) && n.nodeName !== 'INPUT' && n.nodeName !== 'TEXTAREA') return;
      for (const a of ATTRS) { const v = n.getAttribute && n.getAttribute(a); if (v && H.test(v)) n.setAttribute(a, t(v)); }
      if (n.nodeName === 'INPUT' || n.nodeName === 'TEXTAREA' || n.closest('[translate="no"]')) return;
      const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let x; while ((x = w.nextNode())) { if (x.nodeType === 3) fixNode(x); else for (const a of ATTRS) { const v = x.getAttribute(a); if (v && H.test(v)) x.setAttribute(a, t(v)); } }
    }
  }
  function start() {
    document.documentElement.lang = lang;
    if (!on) return;
    document.title = t(document.title);
    fixNode(document.body);
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') fixNode(m.target);
        else if (m.type === 'attributes') fixNode(m.target);
        else m.addedNodes.forEach(fixNode);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  function choose(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }
  return { lang, LANGS, t, choose, chosen: () => !!chosen, on };
})();
