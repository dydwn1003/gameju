// ===== 서버 · 앱 설정 =====
// Supabase 대시보드 > Project Settings 에서 복사해 넣으세요.
// anonKey 는 공개용 키라 웹/앱에 들어가도 괜찮아요. (service_role · secret 키는 절대 여기에 넣지 마세요)
// 비워 두면 서버 없이 기기 저장만으로 동작합니다. claude.ai 안에서 열면 claude.ai 공유 저장소를 씁니다.
const CLOUD = {
  url: 'https://eurinhfamcdygqxepmdg.supabase.co',
  anonKey: 'sb_publishable_6eRHjUVJ3CJG37CcG_DB6g_hl-DDmhu', // 공개용(publishable) 키
  providers: ['google', 'kakao', 'apple'], // 로그인 화면에 보일 버튼 (Apple 은 iOS 앱에서만, 아이폰 기본 로그인 창으로)
  naverFunction: 'naver-auth',                      // 네이버 로그인용 Edge Function 이름
  deleteFunction: 'delete-account',                 // 계정 삭제용 Edge Function 이름 (스토어 필수)
  sdk: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js',
};

// ===== 앱(구글 플레이 · 앱스토어) 설정 =====
// 웹에서는 쓰이지 않고, Capacitor 로 감싼 앱 안에서만 쓰입니다.
const APP = {
  // 로그인 후 앱으로 돌아오는 주소. app/capacitor.config.json 의 appId 와 같게 두세요.
  // Supabase > Authentication > URL Configuration > Redirect URLs 에도 이 주소를 넣어야 해요.
  authRedirect: 'com.jeoseungsaja.idle://login',
  privacyUrl: 'privacy.html',
  // 업데이트 안내 창의 '스토어 가기' 주소
  // iosId: App Store Connect → 앱 → 앱 정보 → 'Apple ID' (숫자, 비밀값 아님). 비워 두면 앱스토어 검색으로 열어요.
  store: { android: 'com.jeoseungsaja.idle', iosId: '6832605954', name: '저승사자 키우기' },
  supportEmail: 'dydwn1003@gmail.com', // 문의 받을 이메일 (스토어 등록에도 씀)
  version: '1.0.0',  // 앱 안에 포함된 개인정보처리방침 (스토어에는 웹 주소를 따로 적어요)
  // 구글 로그인 클라이언트 ID (공개용 값 · 보안 비밀번호는 여기에 넣지 않음)
  // 지금은 브라우저 창 로그인(Supabase)이라 쓰이지 않고, 앱 안 계정 선택 창(네이티브 로그인)으로 바꿀 때 씀
  google: {
    web: '',  // 웹 애플리케이션 클라이언트 ID
    ios: '371373550806-j0f7s7dpr8r8ogai1hq9ut8sdim8qg14.apps.googleusercontent.com',
    iosUrlScheme: 'com.googleusercontent.apps.371373550806-j0f7s7dpr8r8ogai1hq9ut8sdim8qg14',
  },
  // AdMob 보상형 광고 단위 ID. 비워 두면 구글이 주는 테스트 광고가 나옵니다(출시 전 꼭 채우기).
  admob: {
    android: 'ca-app-pub-7300932926935302/9313976058', // 보상형 광고 단위 (안드로이드)
    ios: 'ca-app-pub-7300932926935302/4346388700', // 보상형 광고 단위 (iOS)
    testing: false, // 출시 빌드: 실제 광고 (개발 중 테스트 광고는 true)
  },
  // 스토어에 등록할 상품 ID (구글 플레이 콘솔 · 앱스토어 커넥트에 똑같이 만들기)
  // type: consumable(여러 번 구매) · nonconsumable(한 번만, 복원 가능)
  products: {
    jade100: { id: 'jade_100', type: 'consumable' },
    jade550: { id: 'jade_550', type: 'consumable' },
    jade1200: { id: 'jade_1200', type: 'consumable' },
    starter: { id: 'starter_pack', type: 'nonconsumable' },
    promo: { id: 'promo_pack', type: 'consumable' },
    perm2: { id: 'yeomra_seal_7d', type: 'consumable' },
    noads: { id: 'remove_ads', type: 'nonconsumable' },
  },
};
