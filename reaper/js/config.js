// ===== 서버 설정 (Supabase) =====
// Supabase 대시보드 > Project Settings > API 에서 복사해 넣으세요.
// anonKey 는 공개용 키라 웹에 들어가도 괜찮아요. (service_role 키는 절대 여기에 넣지 마세요)
// 비워 두면 서버 없이 기기 저장만으로 동작합니다. claude.ai 안에서 열면 claude.ai 공유 저장소를 씁니다.
const CLOUD = {
  url: '',            // 예: 'https://abcdefgh.supabase.co'
  anonKey: '',        // 예: 'eyJhbGciOi...'
  providers: ['google', 'kakao', 'naver', 'apple'], // 로그인 화면에 보일 버튼
  naverFunction: 'naver-auth',                      // 네이버 로그인용 Edge Function 이름
  sdk: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js',
};
