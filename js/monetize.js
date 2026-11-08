// ===== 수익화 모듈: 보상형 광고 + 인앱결제 =====
// 실제 광고: Google H5 Games Ads(AdSense for Games)의 adBreak API를 사용합니다.
//   index.html의 광고 스크립트 주석을 풀고 ca-pub ID를 넣으면 실제 광고가 나옵니다.
// 앱 출시 시: Capacitor + AdMob 플러그인으로 감싸고 Monetize.showRewarded만 교체하면 됩니다.
// 결제: 현재는 테스트 결제(실제 과금 없음). Google Play Billing 연동 시 purchase()만 교체하세요.
const Monetize = (() => {
  const TEST_MODE = true; // 광고가 준비되지 않으면 테스트 광고로 대체

  function hasH5Ads() { return typeof window.adBreak === 'function'; }

  function showRewarded(placement) {
    return new Promise(resolve => {
      if (G.state.adFree) { resolve(true); return; } // 광고 제거 패스: 즉시 보상
      if (!hasH5Ads()) { mockAd(placement, resolve); return; }
      let done = false;
      const fin = v => { if (!done) { done = true; resolve(v); } };
      window.adBreak({
        type: 'reward',
        name: placement,
        beforeAd() { Game.pauseAudio && Game.pauseAudio(); },
        afterAd() {},
        beforeReward(showAdFn) { showAdFn(); },
        adDismissed() { fin(false); },
        adViewed() { fin(true); },
        adBreakDone(info) {
          if (done) return;
          if (info && info.breakStatus !== 'viewed' && info.breakStatus !== 'dismissed' && TEST_MODE) mockAd(placement, fin);
          else fin(false);
        },
      });
    });
  }

  // 테스트용 가짜 광고 (5초)
  function mockAd(placement, resolve) {
    const ov = document.createElement('div');
    ov.className = 'ad-overlay';
    ov.innerHTML = `<div class="ad-box">
      <div class="ad-tag">AD · 테스트 광고</div>
      <div class="ad-art">📺</div>
      <div class="ad-title">보상형 광고 영역</div>
      <div class="ad-sub">실제 배포 시 Google 광고가 표시됩니다<br><small>(${placement})</small></div>
      <div class="ad-timer">5</div>
      <button class="btn ad-close" disabled>보상 받기</button>
      <button class="ad-skip">닫기 (보상 없음)</button>
    </div>`;
    document.body.appendChild(ov);
    let t = 5;
    const timer = ov.querySelector('.ad-timer'), btn = ov.querySelector('.ad-close');
    const iv = setInterval(() => {
      t--; timer.textContent = t > 0 ? t : '✓';
      if (t <= 0) { clearInterval(iv); btn.disabled = false; }
    }, 1000);
    btn.onclick = () => { clearInterval(iv); ov.remove(); resolve(true); };
    ov.querySelector('.ad-skip').onclick = () => { clearInterval(iv); ov.remove(); resolve(false); };
  }

  function purchase(product) {
    return new Promise(resolve => {
      UI.confirm(`<b>${product.name}</b><br>${product.price}<br><br><small class="muted">테스트 결제입니다. 실제로 과금되지 않습니다.</small>`, '구매하기')
        .then(ok => resolve(ok));
    });
  }

  return { showRewarded, purchase };
})();
