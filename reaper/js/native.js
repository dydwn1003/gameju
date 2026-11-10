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
  async function rewardAd(onReward, onFail) {
    const A = P('AdMob');
    if (!A || !adReady) { onFail && onFail('광고를 준비 중이에요. 잠시 후 다시 눌러 주세요'); return; }
    if (adBusy) return; adBusy = true;
    let got = false; const subs = [];
    const done = () => { subs.forEach(s => s.then(h => h.remove())); adBusy = false; prepareAd(); };
    subs.push(A.addListener('onRewardedVideoAdReward', () => { got = true; }));
    subs.push(A.addListener('onRewardedVideoAdDismissed', () => { done(); if (got) onReward(); else onFail && onFail('끝까지 보면 보상을 받아요'); }));
    subs.push(A.addListener('onRewardedVideoAdFailedToShow', () => { done(); onFail && onFail('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요'); }));
    const ok = await (adLoaded || Promise.resolve(false));
    if (!ok) { done(); onFail && onFail('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요'); return; }
    try { await A.showRewardVideoAd(); } catch (e) { done(); onFail && onFail('광고를 불러오지 못했어요'); }
  }

  // ---------- 인앱 결제 ----------
  // 지급은 onGrant(게임 상품 id) 로 넘기고, 같은 거래를 두 번 지급하지 않도록 거래 번호를 기억해 둔다.
  let store = null, onGrant = null, onRestoreOwned = null, payReady = false;
  // 상품 목록: config.js 의 APP.products + 현금 의자(소품) 는 'decor:<id>' → 스토어 id 'chair_<id>'
  const prods = () => { if (prods.m) return prods.m; const m = Object.assign({}, APP.products); (typeof DECOR !== 'undefined' ? DECOR : []).filter(d => d.cash).forEach(d => (m['decor:' + d.id] = { id: 'chair_' + d.id, type: 'consumable' })); return (prods.m = m); };
  const byStoreId = sid => Object.keys(prods()).find(k => prods()[k].id === sid);
  const doneKey = 'reaper_tx_done';
  const doneTx = () => { try { return JSON.parse(localStorage.getItem(doneKey) || '[]'); } catch (e) { return []; } };
  const markTx = id => { try { const a = doneTx(); a.push(id); localStorage.setItem(doneKey, JSON.stringify(a.slice(-300))); } catch (e) {} };
  function initStore() {
    const go = () => {
      if (!window.CdvPurchase) return;
      const { store: st, ProductType, Platform, LogLevel } = window.CdvPurchase;
      store = st; store.verbosity = LogLevel.WARNING;
      const plat = platform() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;
      store.register(Object.values(prods()).map(p => ({ id: p.id, platform: plat, type: p.type === 'consumable' ? ProductType.CONSUMABLE : ProductType.NON_CONSUMABLE })));
      store.when()
        .approved(tx => {
          const key = tx.transactionId || '';
          const gid = byStoreId(tx.products && tx.products[0] && tx.products[0].id);
          if (gid && key && !doneTx().includes(key)) {
            if (onGrant) onGrant(gid);
            markTx(key);
          }
          tx.finish();
        })
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
    if (!prods()[gid]) return '상품 정보가 없어요';
    const p = store.get(prods()[gid].id), o = p && p.getOffer && p.getOffer();
    if (!o) return '스토어에서 상품을 찾지 못했어요';
    const err = await o.order();
    if (err) return err.code === window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED ? '' : (err.message || '결제에 실패했어요');
    return '';
  }
  async function restore() { if (!payOn()) return false; await store.restorePurchases(); ownedCheck(); return true; }

  return {
    isApp, platform, plugin: P, init, hideSplash, openUrl, closeBrowser, rewardAd, price, buy, restore, payOn,
    onUrl: f => urlHandlers.push(f), setBack: f => (onBack = f), setPause: f => (onPause = f), setResume: f => (onResume = f),
    notifyPerm, notifyAsk, notifyClear, notifySchedule,
    setPay: (grant, owned, priceChange) => { onGrant = grant; onRestoreOwned = owned; onPriceChange = priceChange; },
  };
})();
