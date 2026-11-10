// ===== 나라별 가격 =====
// 앱에서는 스토어(구글 플레이 · 앱스토어)가 알려 주는 현지 가격이 먼저 쓰임 (Native.price).
// 그 값이 아직 없을 때(웹 · 스토어 연결 전)는 이 표에서 기기 지역(없으면 고른 언어)에 맞는 통화로 보여 줌.
// 스토어 콘솔에 넣는 나라별 가격도 이 표와 같게 맞춰 두면 됨 (docs/APP_RELEASE.md).
const LocalPrice = (() => {
  const KRW = [1200, 1900, 2500, 3300, 3900, 4900, 5900, 6900, 7900, 9900, 12000];
  const T = {
    KRW: KRW,
    USD: [0.99, 1.49, 1.99, 2.49, 2.99, 3.99, 4.49, 4.99, 5.99, 7.99, 9.99],
    JPY: [160, 250, 320, 400, 480, 650, 730, 800, 980, 1200, 1500],
    CNY: [6, 10, 12, 18, 22, 28, 30, 35, 40, 50, 68],
    TWD: [30, 50, 60, 90, 100, 120, 150, 170, 190, 240, 300],
    HKD: [8, 12, 15, 20, 23, 30, 35, 38, 45, 58, 78],
    EUR: [0.99, 1.49, 1.99, 2.49, 2.99, 3.99, 4.49, 4.99, 5.99, 7.99, 9.99],
    GBP: [0.99, 1.49, 1.99, 2.49, 2.99, 3.49, 3.99, 4.49, 4.99, 6.99, 8.99],
    CAD: [1.39, 1.99, 2.79, 3.49, 3.99, 5.49, 5.99, 6.99, 7.99, 10.99, 13.99],
    AUD: [1.49, 2.49, 2.99, 3.99, 4.49, 5.99, 6.99, 7.99, 8.99, 11.99, 14.99],
    SGD: [1.48, 1.98, 2.68, 3.48, 3.98, 5.48, 5.98, 6.98, 7.98, 10.98, 13.98],
  };
  const REGION = { KR: 'KRW', JP: 'JPY', CN: 'CNY', TW: 'TWD', HK: 'HKD', MO: 'HKD', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', SG: 'SGD' };
  ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'FI', 'IE', 'PT', 'GR', 'SK', 'SI', 'LU', 'EE', 'LV', 'LT', 'MT', 'CY', 'HR'].forEach(r => REGION[r] = 'EUR');
  const BY_LANG = { ko: 'KRW', ja: 'JPY', zh: 'CNY', en: 'USD' };
  function currency() {
    const tags = [].concat(navigator.languages || [], navigator.language || []);
    for (const t of tags) { const m = String(t).match(/[-_]([A-Za-z]{2})\b/); if (m && REGION[m[1].toUpperCase()]) return REGION[m[1].toUpperCase()]; }
    return BY_LANG[typeof I18N !== 'undefined' ? I18N.lang : 'ko'] || 'KRW';
  }
  const cur = currency();
  function fmt(v, c) {
    try { return new Intl.NumberFormat(c === 'KRW' ? 'ko-KR' : c === 'JPY' ? 'ja-JP' : c === 'CNY' ? 'zh-CN' : c === 'HKD' ? 'zh-HK' : 'en-US', { style: 'currency', currency: c, minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(v); }
    catch (e) { return c + ' ' + v; }
  }
  // '₩3,300' 또는 3300 → 현지 가격 글자
  function of(krw, c = cur) {
    const n = typeof krw === 'number' ? krw : +String(krw).replace(/[^\d]/g, '');
    let i = KRW.indexOf(n);
    if (i < 0) { if (c === 'KRW') return fmt(n, c); i = KRW.reduce((b, k, j) => Math.abs(k - n) < Math.abs(KRW[b] - n) ? j : b, 0); }
    return fmt(T[c][i], c);
  }
  return { of, currency: () => cur, table: T, KRW };
})();
