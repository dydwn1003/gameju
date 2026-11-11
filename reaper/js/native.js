// ===== 앱(Capacitor) 연결: 안드로이드 · iOS 에서만 동작, 웹에서는 아무것도 하지 않음 =====
// - 뒤로가기 버튼, 로그인 후 앱으로 돌아오는 주소(딥링크), 바깥 브라우저 열기
// - 보상형 광고 (AdMob) · 인앱 결제 (구글 플레이 결제 / App Store, cordova-plugin-purchase)
const Native = (() => {
  const C = () => window.Capacitor;
  const isApp = () => !!(C() && C().isNativePlatform && C().isNativePlatform());
  const platform = () => (isApp() ? C().getPlatform() : 'web');
  const P = name => (C() && C().Plugins ? C().Plugins[name] : null);
  let onBack = null, onPause = null, onResume = null;
  const urlHandlers = [];

  async function init() {
    if (!isApp()) return;
    document.documentElement.classList.add('native', 'native-' + platform());
    const App = P('App');
    if (App) {
      App.addListener('appUrlOpen', e => urlHandlers.forEach(f => f(e.url)));
      App.addListener('backButton', () => { if (!onBack || !onBack()) confirmExit(); });
      App.addListener('pause', () => onPause && onPause());
      App.addListener('resume', () => onResume && onResume());
      try { const l = await App.getLaunchUrl(); if (l && l.url) setTimeout(() => urlHandlers.forEach(f => f(l.url)), 0); } catch (e) {}
    }
    initAds().catch(() => {});
    initStore();
  }
  let exitAsk = 0;
  function confirmExit() {
    // 두 번 연속 누르면 종료 (안드로이드 게임에서 흔한 방식)
    if (Date.now() - exitAsk < 2000) { const App = P('App'); if (App) App.exitApp(); return; }
    exitAsk = Date.now(); if (typeof toast === 'function') toast('한 번 더 누르면 게임이 종료돼요');
  }
  const hideSplash = () => { const S = P('SplashScreen'); if (S) S.hide().catch(() => {}); };
  // 설치된 앱의 빌드 번호 (안드로이드 versionCode · iOS 빌드 번호). 웹이면 0
  async function appBuild() { const A = P('App'); if (!A || !isApp()) return 0; try { const i = await A.getInfo(); return parseInt(i.build, 10) || 0; } catch (e) { return 0; } }
  // 스토어 열기: 구글 → 플레이 스토어 앱, 애플 → 앱스토어 앱
  function openStore() {
    const st = APP.store || {};
    if (platform() === 'ios') location.href = st.iosId ? `itms-apps://apps.apple.com/app/id${st.iosId}` : `itms-apps://search.itunes.apple.com/WebObjects/MZSearch.woa/wa/search?media=software&term=${encodeURIComponent(st.name || '')}`;
    else if (platform() === 'android') location.href = `market://details?id=${st.android}`;
    else window.open(`https://play.google.com/store/apps/details?id=${st.android}`, '_blank');
  }
  async function openUrl(url) { const B = P('Browser'); if (B) await B.open({ url, presentationStyle: 'popover' }); else location.href = url; }
  async function closeBrowser() { const B = P('Browser'); if (B) try { await B.close(); } catch (e) {} }

  // ---------- 로컬 알림 ----------
  const LN = () => P('LocalNotifications');
  let chan = false;
  async function notifyPerm() { const L = LN(); if (!L) return 'none'; try { return (await L.checkPermissions()).display; } catch (e) { return 'none'; } }
  async function notifyAsk() { const L = LN(); if (!L) return false; try { return (await L.requestPermissions()).display === 'granted'; } catch (e) { return false; } }
  async function notifyClear() {
    const L = LN(); if (!L) return;
    const p = await L.getPending(); if (p.notifications && p.notifications.length) await L.cancel({ notifications: p.notifications.map(n => ({ id: n.id })) });
    try { await L.removeAllDeliveredNotifications(); } catch (e) {}
  }
  async function notifySchedule(list) {
    const L = LN(); if (!L || (await notifyPerm()) !== 'granted') return;
    if (!chan && platform() === 'android') { try { await L.createChannel({ id: 'reaper', name: I18N.t('게임 알림'), description: I18N.t('보상 · 파견 · 출석 알림'), importance: 4, visibility: 1 }); } catch (e) {} chan = true; }
    await notifyClear();
    if (!list.length) return;
    // isExactNotification:false — 정확한 알람 권한(알람 및 리마인더)을 요구하지 않음. 몇 분 늦어도 괜찮은 알림이라 설정 화면이 뜨지 않게
    await L.schedule({ notifications: list.map(n => ({ id: n.id, title: I18N.t(n.title), body: n.body.split('\n').map(x => I18N.t(x)).join('\n'), channelId: 'reaper', smallIcon: 'ic_stat_reaper', iconColor: '#E8424F', schedule: { at: new Date(n.at), allowWhileIdle: true }, isExactNotification: false })) });
  }

  // ---------- 보상형 광고 (AdMob) ----------
  let adReady = false, adBusy = false;
  const adId = () => (APP.admob[platform()] || '');
  async function initAds() {
    const A = P('AdMob'); if (!A) return;
    await A.initialize({ initializeForTesting: APP.admob.testing });
    // iOS: 앱 추적 투명성(ATT) 허용 묻기 · 유럽 등: 동의 화면 (구글 UMP)
    try { if (platform() === 'ios') { const t = await A.trackingAuthorizationStatus(); if (t.status === 'notDetermined') await A.requestTrackingAuthorization(); } } catch (e) {}
    try { const ci = await A.requestConsentInfo(); if (ci.isConsentFormAvailable && ci.status === 'REQUIRED') await A.showConsentForm(); } catch (e) {}
    adReady = true; prepareAd();
  }
  let adLoaded = null;
  function prepareAd() {
    const A = P('AdMob'); if (!A || !adReady) return;
    adLoaded = A.prepareRewardVideoAd({ adId: adId() || undefined, isTesting: APP.admob.testing || !adId() }).then(() => true, () => false);
  }
  // 광고를 끝까지 보면 onReward. 광고를 못 띄우면 onFail(사유)
  // 보상은 ① showRewardVideoAd 가 끝까지 봤을 때 돌려주는 결과 ② 'Reward' 신호 중 먼저 오는 것으로 확인하고,
  // 광고가 닫힌 것은 ③ 'Dismissed' 신호 ④ 게임 화면이 다시 보이는 순간 ⑤ 2분 안전장치 중 먼저 오는 것으로 확인
  // (어느 한 신호가 오지 않아도 게임이 '광고 중'으로 멈추지 않게)
  let adStartedAt = 0;
  async function rewardAd(onReward, onFail) {
    const A = P('AdMob');
    if (!A || !adReady) { onFail && onFail('광고를 준비 중이에요. 잠시 후 다시 눌러 주세요'); return; }
    if (adBusy && Date.now() - adStartedAt < 120000) return;
    adBusy = true; adStartedAt = Date.now();
    let got = false, finished = false, shown = false; const subs = [];
    const finish = why => {
      if (finished) return; finished = true;
      subs.forEach(s => Promise.resolve(s).then(h => h && h.remove && h.remove()).catch(() => {}));
      document.removeEventListener('visibilitychange', onVis); clearTimeout(safety);
      adBusy = false; setTimeout(prepareAd, 400);
      if (got) onReward(); else onFail && onFail(why || '끝까지 보면 보상을 받아요');
    };
    const onVis = () => { if (!document.hidden && shown) setTimeout(() => finish(), 1200); };
    const safety = setTimeout(() => finish('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요'), 120000);
    document.addEventListener('visibilitychange', onVis);
    try {
      subs.push(A.addListener('onRewardedVideoAdReward', () => { got = true; }));
      subs.push(A.addListener('onRewardedVideoAdShowed', () => { shown = true; }));
      subs.push(A.addListener('onRewardedVideoAdDismissed', () => { shown = true; setTimeout(() => finish(), 500); }));
      subs.push(A.addListener('onRewardedVideoAdFailedToShow', () => finish('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요')));
    } catch (e) {}
    // 미리 받아 둔 광고가 없거나 실패했으면 다시 받아 봄 (최대 2번, 각 10초)
    const wait = p => Promise.race([p, new Promise(r => setTimeout(() => r(false), 10000))]);
    let ok = false;
    for (let i = 0; i < 2 && !ok; i++) {
      if (!adLoaded || i > 0) prepareAd();
      const slow = setTimeout(() => typeof toast === 'function' && toast('광고를 불러오는 중…', 1500), 700);
      ok = await wait(adLoaded || Promise.resolve(false)); clearTimeout(slow);
    }
    if (!ok) { finish('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요'); return; }
    adLoaded = null; shown = true;
    // 끝까지 보면 이 약속이 보상 정보와 함께 끝남 (닫기만 하면 끝나지 않을 수 있음)
    A.showRewardVideoAd().then(() => { got = true; }, () => finish('광고를 불러오지 못했어요'));
  }

  // ---------- 인앱 결제 ----------
  // 지급은 onGrant(게임 상품 id) 로 넘기고, 같은 거래를 두 번 지급하지 않도록 거래 번호를 기억해 둔다.
  let store = null, onGrant = null, onRestoreOwned = null, onTxDone = null, payReady = false, pendingTx = [], buying = false, restoring = false;
  // 상품 목록: config.js 의 APP.products + 현금 의자(소품) 는 'decor:<id>' → 스토어 id 'chair_<id>'
  const prods = () => { if (prods.m) return prods.m; const m = Object.assign({}, APP.products); (typeof DECOR !== 'undefined' ? DECOR : []).filter(d => d.cash).forEach(d => (m['decor:' + d.id] = { id: 'chair_' + d.id, type: 'consumable' })); return (prods.m = m); };
  const byStoreId = sid => Object.keys(prods()).find(k => prods()[k].id === sid);
  const doneKey = 'reaper_tx_done';
  const doneTx = () => { try { return JSON.parse(localStorage.getItem(doneKey) || '[]'); } catch (e) { return []; } };
  const markTx = id => { try { const a = doneTx(); a.push(id); localStorage.setItem(doneKey, JSON.stringify(a.slice(-300))); } catch (e) {} };
  // 이미 지급한 거래인지: 이 기기 기록 + 게임 저장(계정에 함께 저장되어 다시 설치해도 남음)
  const isDone = key => doneTx().includes(key) || !!(onTxDone && onTxDone(key));
  // 결제 승인 처리: 지급 → 저장 → 거래 끝내기 (게임이 준비되기 전에 온 거래는 끝내지 않고 기다렸다가 지급)
  function handleTx(tx) {
    const sid = tx.products && tx.products[0] && tx.products[0].id, gid = byStoreId(sid);
    const key = tx.transactionId || tx.purchaseId || (sid ? sid + ':' + (tx.purchaseDate ? +new Date(tx.purchaseDate) : '') : '');
    if (!gid) { tx.finish(); return; }
    if (!onGrant) { if (!pendingTx.includes(tx)) pendingTx.push(tx); return; }
    if (key && isDone(key)) { tx.finish(); return; } // 같은 거래 두 번 지급 안 함
    try { onGrant(gid, key); } catch (e) { return; } // 지급 중 오류면 끝내지 않음 → 다음에 다시 지급 시도
    if (key) markTx(key);
    tx.finish();
  }
  function initStore() {
    const go = () => {
      if (!window.CdvPurchase) return;
      const { store: st, ProductType, Platform, LogLevel } = window.CdvPurchase;
      store = st; store.verbosity = LogLevel.WARNING;
      const plat = platform() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;
      store.register(Object.values(prods()).map(p => ({ id: p.id, platform: plat, type: p.type === 'consumable' ? ProductType.CONSUMABLE : ProductType.NON_CONSUMABLE })));
      store.when()
        .approved(tx => handleTx(tx))
        .productUpdated(() => { if (onPriceChange) onPriceChange(); });
      store.initialize([plat]).then(() => { payReady = true; ownedCheck(); if (onPriceChange) onPriceChange(); });
    };
    if (window.CdvPurchase) go(); else document.addEventListener('deviceready', go, { once: true });
  }
  let onPriceChange = null;
  function ownedCheck() {
    if (!store) return;
    Object.keys(prods()).forEach(gid => { const p = prods()[gid]; if (p.type === 'nonconsumable' && store.owned(p.id) && onRestoreOwned) onRestoreOwned(gid); });
  }
  const payOn = () => !!(store && payReady);
  // 스토어에서 받은 현지 가격 (예: ₩1,200). 아직 모르면 null
  function price(gid) {
    if (!payOn() || !prods()[gid]) return null;
    const p = store.get(prods()[gid].id); const o = p && p.getOffer && p.getOffer();
    return o && o.pricingPhases && o.pricingPhases[0] ? o.pricingPhases[0].price : null;
  }
  async function buy(gid) {
    if (!payOn()) return '결제를 준비 중이에요. 잠시 후 다시 시도해 주세요';
    if (buying) return '결제를 진행하고 있어요. 잠시만 기다려 주세요'; // 버튼을 여러 번 눌러도 한 번만
    buying = true; try { return await buyNow(gid); } finally { buying = false; }
  }
  async function buyNow(gid) {
    if (!prods()[gid]) return '상품 정보가 없어요';
    const p = store.get(prods()[gid].id), o = p && p.getOffer && p.getOffer();
    if (!o) return '스토어에서 상품을 찾지 못했어요';
    const err = await o.order();
    if (err) return err.code === window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED ? '' : (err.message || '결제에 실패했어요');
    return '';
  }
  async function restore() { if (!payOn() || restoring) return false; restoring = true; try { await store.restorePurchases(); ownedCheck(); return true; } catch (e) { return false; } finally { restoring = false; } }

  return {
    isApp, platform, plugin: P, init, hideSplash, openUrl, appBuild, openStore, closeBrowser, rewardAd, price, buy, restore, payOn,
    onUrl: f => urlHandlers.push(f), setBack: f => (onBack = f), setPause: f => (onPause = f), setResume: f => (onResume = f),
    notifyPerm, notifyAsk, notifyClear, notifySchedule,
    setPay: (grant, owned, priceChange, txDone) => { onGrant = grant; onRestoreOwned = owned; onPriceChange = priceChange; onTxDone = txDone; const q = pendingTx; pendingTx = []; q.forEach(handleTx); if (payOn()) ownedCheck(); },
  };
})();
