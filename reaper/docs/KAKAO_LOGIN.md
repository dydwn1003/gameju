# 카카오 로그인: 계정 선택 창 + 계정 삭제 때 연결 끊기

## 1. 로그인할 때마다 계정 선택 창 (앱에 이미 들어감)
- 카카오 · 구글 로그인을 누르면 매번 **계정 선택 창**이 떠요 (`prompt=select_account`).
- 로그아웃한 뒤 다른 계정으로 바꿔 로그인할 수 있어요.
- 따로 할 일 없음. 새 APK 를 설치하면 바로 적용돼요.

## 2. 계정 삭제 때 카카오 연결 끊기 (직접 해야 할 일 2가지)
계정을 삭제하면 카카오의 "연결된 서비스"에서도 우리 앱이 빠져서, 다음 카카오 로그인 때 **동의 창이 처음처럼** 다시 떠요.

### ① 카카오 Admin 키를 Supabase 비밀값에 넣기
> Admin 키는 모든 권한을 가진 비밀 키예요. **채팅 · 코드 · 깃허브에 붙여 넣지 말고**, 아래 Supabase 화면에만 넣어 주세요.

1. https://developers.kakao.com → 로그인 → **내 애플리케이션** → 저승사자 키우기 앱 선택
2. 왼쪽 메뉴 **앱 키** (새 화면에서는 **앱 → 플랫폼 키 / 앱 키**) → **Admin 키** 옆 복사
3. https://supabase.com/dashboard → 프로젝트 선택 → 왼쪽 **Edge Functions** → 위쪽 **Secrets** (또는 Manage secrets)
4. **Add new secret**
   - Name: `KAKAO_ADMIN_KEY`
   - Value: 복사한 Admin 키
5. **Save**

### ② delete-account 함수 다시 배포
1. Supabase → **Edge Functions** → `delete-account` 클릭 → **Code** 탭
2. 내용을 모두 지우고, 깃허브의 `reaper/server/supabase/functions/delete-account/index.ts` 내용을 통째로 붙여 넣기
   (깃허브 → 파일 열기 → 오른쪽 위 **Raw** 또는 복사 버튼)
3. **Deploy** (Deploy updates) 누르기

### 확인
1. 새 APK 에서 카카오로 로그인 → 설정 → **계정 삭제**
2. 카카오톡 → 설정 → 카카오계정 → **연결된 서비스 관리**에서 저승사자 키우기가 사라졌는지 확인
3. 다시 카카오 로그인 → **동의 창**이 뜨면 성공

- Admin 키를 안 넣어도 계정 삭제는 그대로 돼요 (카카오 연결만 남아 있음).
- 이미 삭제한 예전 계정의 카카오 연결은 카카오톡 → 연결된 서비스 관리에서 직접 **연결 끊기** 해 주세요.
