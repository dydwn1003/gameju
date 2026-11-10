# 저승사자 키우기 — 로그인 · 결제 · 광고 넣기 (앱 전용, 자세히)

> 게임은 **앱(구글 플레이 · 앱스토어)으로만** 내요. 웹 로그인 설정은 하지 않아요.
> 웹 주소가 필요한 곳은 **개인정보처리방침 페이지 하나**뿐이에요(D).
> **📮** 표시: 받은 값을 Claude 에게 보내면 코드에 넣어 줘요.

> 🔐 **채팅에 보내도 되는 값:** Supabase Project URL · anon 키, AdMob 앱 ID · 광고 단위 ID, 문의 이메일, 운영자 이름
> **절대 보내지 말 것:** `service_role` 키, 카카오 · 구글 · 네이버 Client Secret, 애플 `.p8` 내용 → Supabase 화면에만 직접 넣기

---

## 0. 미리 정해 두는 값 (모든 콘솔에 똑같이 써요)

| 항목 | 넣을 값 |
|---|---|
| 앱 이름 | `저승사자 키우기` |
| 앱 ID (번들 ID · 패키지 이름) | `com.jeoseungsaja.idle` |
| 애플 Team ID | `V9RLBAGQZD` |
| 문의(지원) 이메일 | 문의 받을 이메일. 개인 메일이 드러나는 게 싫으면 게임용 Gmail 을 새로 만들어 쓰기 |
| 운영자 이름 | 본인 이름 또는 상호 (사업자 등록했으면 상호) |
| 앱 돌아올 주소 | `com.jeoseungsaja.idle://login` |
| 프로젝트ID | `eurinhfamcdygqxepmdg` |
| 콜백 주소 | `https://eurinhfamcdygqxepmdg.supabase.co/auth/v1/callback` |

---

## A. 서버 · 로그인 (Supabase)

### A-1. 프로젝트 만들기
1. https://supabase.com → 오른쪽 위 **Start your project** → GitHub 계정으로 가입
2. **Organization** 만들기 (처음 한 번)
   - Name: `jeoseung` (아무거나) / Type: **Personal** / Plan: **Free** → **Create organization**
3. **New project**
   - Project name: `reaper`
   - Database Password: **Generate a password** 누르고 메모장에 복사해 두기
   - Region: **Northeast Asia (Seoul)**
   - **Create new project** → 1~2분 기다리기
4. 값 복사
   - 왼쪽 아래 ⚙️ **Project Settings → Data API**(또는 **API**) → **Project URL** 복사
     예: `https://abcdefghijk.supabase.co` → 여기서 `abcdefghijk` 가 **프로젝트ID**
   - **Project Settings → API Keys**
     - **Legacy API Keys** 탭에 `anon` `public` 키가 있으면 그것 복사 (`eyJ…` 로 시작)
     - 없으면 **Publishable key** (`sb_publishable_…`) 복사
     - ⚠️ `service_role` / `secret` 키는 복사하지 마세요
5. 📮 **Project URL + anon 키** 를 Claude 에게

### A-2. 데이터베이스 표 만들기
1. 브라우저 새 탭에서 GitHub → `gameju` 저장소 → 브랜치 `claude/sharp-ride-9hy1jz` → `reaper/server/schema.sql` 열기
2. 오른쪽 위 **Copy raw file** (📋 아이콘) 누르기
3. Supabase 왼쪽 메뉴 **SQL Editor** → **+ New query** (또는 빈 편집창)
4. 붙여 넣기 → 오른쪽 아래 **Run** (Ctrl+Enter)
5. 아래에 **Success. No rows returned** 가 나오면 끝

### A-3. 로그인 후 돌아올 주소
1. 왼쪽 **Authentication** → (Configuration 아래) **URL Configuration**
2. **Site URL** 칸: `com.jeoseungsaja.idle://login` → **Save changes**
3. **Redirect URLs** → **Add URL** → `com.jeoseungsaja.idle://login` → **Save URLs**

> 💡 **콜백 주소 쉽게 얻기:** Authentication → **Sign In / Providers** → 아무 제공자(예: Google) 클릭 → 아래쪽 **Callback URL (for OAuth)** 칸 옆 **Copy**.
> 구글 · 카카오 · 애플 모두 이 주소를 써요.

### A-4. 구글 로그인
**구글 쪽 (https://console.cloud.google.com)**
1. 위쪽 프로젝트 고르는 칸 → **새 프로젝트**
   - 프로젝트 이름: `jeoseung-reaper` → **만들기** → 만든 프로젝트 선택
2. ☰ 메뉴 → **API 및 서비스 → OAuth 동의 화면** (또는 **Google 인증 플랫폼**) → **시작하기**
   - 앱 이름: `저승사자 키우기`
   - 사용자 지원 이메일: 목록에서 내 Gmail 선택 → **다음**
   - 대상: **외부** → **다음**
   - 연락처 정보: 문의 이메일 → **다음**
   - 정책 동의 체크 → **계속 → 만들기**
3. 왼쪽 **대상(Audience)**
   - **앱 게시** 버튼이 회색이면(브랜딩 미완료) 지금은 **테스트 중** 그대로 두고, 아래 **테스트 사용자 → + Add users** 에 내 구글 이메일(테스트할 사람들)을 넣어요. 최대 100명.
   - 출시 전에: 브랜딩에 **홈페이지 · 개인정보처리방침 링크**(D 의 주소) + 그 도메인을 **승인된 도메인**에 넣고 저장 → **앱 게시**
   - (로고는 넣지 마세요. 로고를 넣으면 구글 심사가 생겨요)
4. 왼쪽 **클라이언트** → **+ 클라이언트 만들기** — **웹** (필수)
   - 애플리케이션 유형: **웹 애플리케이션** (로그인 결과를 받는 곳이 Supabase 서버라서 '웹'이에요)
   - 이름: `Supabase`
   - **승인된 리디렉션 URI → + URI 추가** → 콜백 주소 붙여 넣기
   - **만들기**
5. 뜨는 창의 **클라이언트 ID** 와 **클라이언트 보안 비밀번호** 복사
   - ⚠️ 보안 비밀번호는 이 창에서만 보일 수 있어요. **JSON 다운로드**도 눌러 두기

**(선택) 앱 안 계정 선택 창(네이티브 로그인)용 클라이언트** — 만든 뒤 Claude 에게 말하면 코드를 바꿔 줘요
- **Android** (2개 만들기: 앱 서명 키용 · 업로드 키용)
  1. Play Console → 저승사자 키우기 → **테스트 및 출시 → 설정 → 앱 무결성 → 앱 서명** 탭
     - **앱 서명 키 인증서**의 **SHA-1** 복사 (스토어에서 받은 앱용)
     - **업로드 키 인증서**의 **SHA-1** 복사 (GitHub 에서 받은 APK 용)
     - (첫 AAB 를 올린 뒤에 보여요 — B-2 의 1번)
  2. **+ 클라이언트 만들기** → 유형 **Android**
     - 이름: `Android (앱 서명)` / 패키지 이름: `com.jeoseungsaja.idle` / SHA-1: 앱 서명 키 SHA-1 → **만들기**
  3. 한 번 더: 이름 `Android (업로드)`, SHA-1 은 업로드 키 SHA-1
  - 안드로이드 클라이언트는 비밀번호가 없어요. 따로 넣을 값도 없어요(구글이 패키지 + SHA-1 로 알아봐요).
- **iOS**
  1. **+ 클라이언트 만들기** → 유형 **iOS**
     - 이름: `iOS` / 번들 ID: `com.jeoseungsaja.idle` / 팀 ID: `V9RLBAGQZD` / App Store ID: 비워 두기 → **만들기**
  2. 나온 **클라이언트 ID** 와 **iOS URL 스킴**(`com.googleusercontent.apps.…`) 복사 → 📮 Claude 에게 (공개용 값이에요)
- 📮 **웹 클라이언트 ID** 도 Claude 에게 (공개용 값, 비밀번호는 보내지 않기)

**Supabase 쪽**
6. **Authentication → Sign In / Providers → Google**
   - **Enable Sign in with Google** 켜기
   - **Client IDs**: 웹 클라이언트 ID (네이티브 로그인을 켜면 나중에 `웹ID,iOS ID,Android ID…` 처럼 쉼표로 이어 붙여요)
   - **Client Secret (for OAuth)**: 웹 클라이언트 보안 비밀번호
   - **Save**

### A-5. 카카오 로그인
**카카오 쪽 (https://developers.kakao.com)** — 카카오 계정으로 로그인
1. 위 메뉴 **내 애플리케이션 → 애플리케이션 추가하기**
   - 앱 아이콘: (선택) `reaper/app/assets/icon-only.png`
   - 앱 이름: `저승사자 키우기`
   - 회사명: 운영자 이름
   - 카테고리: **게임**
   - 운영정책 동의 체크 → **저장**
2. 만든 앱 클릭 → **앱 키**(또는 **앱 → 플랫폼 키**) → **REST API 키** 복사
3. **카카오 로그인** (제품 설정 아래)
   - **활성화 설정** → **ON**
   - **Redirect URI** → **Redirect URI 등록** → 콜백 주소 → **저장**
   - (화면이 바뀐 경우: **REST API 키** 를 눌러 들어간 화면에 **리다이렉트 URI** 칸이 있어요)
4. **보안**(또는 REST API 키 화면) → **Client Secret**
   - **코드 생성** → 나온 코드 복사
   - **활성화 상태** → **사용함** → 저장
5. **카카오 로그인 → 동의항목**
   - **닉네임**: 설정 → **필수 동의**, 동의 목적 `게임 닉네임 표시` → 저장
   - **프로필 사진**: 설정 → **선택 동의**, 동의 목적 `프로필 표시` → 저장

**Supabase 쪽**
6. **Authentication → Sign In / Providers → Kakao**
   - **Kakao enabled** 켜기
   - **REST API Key**: 2번 키
   - **Client Secret Code**: 4번 코드
   - **Allow users without an email** 켜기 (이메일 동의는 비즈 앱이 필요해서)
   - **Save**

### A-6. 애플 로그인 (iOS 전용 · 아이폰 기본 로그인 창)
> 앱이 아이폰 기본 **"Apple로 계속하기"** 창(Face ID)을 써요. 그래서 **Services ID · Key(.p8) · Secret Key 가 필요 없고, 6개월 갱신도 없어요.**
> 안드로이드에서는 애플 버튼이 안 보여요(구글 · 카카오 · 네이버만).

**애플 쪽 (https://developer.apple.com/account)**
1. **Certificates, IDs & Profiles → Identifiers** → `com.jeoseungsaja.idle` 클릭
   - Capabilities 목록에서 **Sign in with Apple** 체크
   - 옆에 **Edit** 가 있으면 **Enable as a primary App ID** → Save
   - 오른쪽 위 **Save** → **Confirm**
   - (빌드는 GitHub 에서 자동 서명하니 프로파일 경고는 무시해도 돼요)

**Supabase 쪽**
2. **Authentication → Sign In / Providers → Apple**
   - **Enable Sign in with Apple** 켜기
   - **Client IDs**: `com.jeoseungsaja.idle`
   - **Secret Key (for OAuth)**: **비워 두기**
   - **Save**

**앱 쪽 (Claude 가 이미 해 둠)**
- `@capgo/capacitor-social-login` 플러그인, `App.entitlements`(Sign in with Apple), 로그인 코드
- 새 TestFlight 빌드부터 적용돼요

### A-7. 네이버 로그인
**네이버 쪽 (https://developers.naver.com)**
1. 위 메뉴 **Application → 애플리케이션 등록**
   - 애플리케이션 이름: `저승사자 키우기`
   - 사용 API: **네이버 로그인**
     - 권한: **별명 · 이메일 주소** → **필수**, 프로필 사진 → 추가(선택)
   - 로그인 오픈 API 서비스 환경: **PC 웹** 추가
     - 서비스 URL: `https://eurinhfamcdygqxepmdg.supabase.co`
     - 네이버 로그인 Callback URL:
       ```
       https://eurinhfamcdygqxepmdg.supabase.co/functions/v1/naver-auth/callback
       ```
   - **등록하기**
2. **내 애플리케이션 → 저승사자 키우기 → 개요** 에서 **Client ID** · **Client Secret**(보기) 복사
3. **멤버관리 → 테스트 ID 등록** 에 내 네이버 아이디 추가 (검수 전엔 등록한 사람만 로그인돼요)

**Supabase 쪽**
4. 왼쪽 **Edge Functions → Secrets** (또는 Edge Functions 화면의 **Manage secrets**)
   | Name | Value |
   |---|---|
   | `NAVER_CLIENT_ID` | 네이버 Client ID |
   | `NAVER_CLIENT_SECRET` | 네이버 Client Secret |
   | `ALLOWED_REDIRECTS` | `com.jeoseungsaja.idle://login` |
   → **Save**
5. **Edge Functions → Deploy a new function → Via Editor**
   - GitHub 의 `reaper/server/supabase/functions/naver-auth/index.ts` 를 **Copy raw file** → 편집창 내용을 모두 지우고 붙여 넣기
   - 아래쪽 함수 이름: `naver-auth`
   - **Deploy function**
6. 배포된 `naver-auth` → **Details**(설정) → **Enforce JWT Verification**(Verify JWT) **끄기** → **Save** ← 꼭!
7. 출시 전: 네이버 **내 애플리케이션 → 검수 요청**

### A-8. 계정 삭제 함수 (스토어 필수)
1. **Edge Functions → Deploy a new function → Via Editor**
2. `reaper/server/supabase/functions/delete-account/index.ts` 붙여 넣기 → 이름 `delete-account` → **Deploy function**
3. **Verify JWT** 는 기본값 그대로 두면 돼요. 함수가 로그인 토큰을 직접 확인해서 꺼도 안전해요. 계정 삭제가 "401"로 실패하면 끄세요.

### A-9. 운영자(나) 등록 — 새 앱으로 처음 로그인한 뒤
1. 게임에서 내 계정으로 로그인 (구글 · 카카오 · 애플)
2. **SQL Editor → + New query**
   ```sql
   select add_admin('내이메일@gmail.com');   -- 또는 게임 닉네임
   ```
   → **Run** → 게임을 다시 켜면 `🛡️ 운영자 모드`
3. 자세한 운영 방법: `docs/OPERATOR_GUIDE.md`

---

## B. 인앱 결제

### B-1. 돈 받을 준비 (없으면 상품이 안 떠요)
- **사업자:** 유료 아이템을 팔려면 **사업자 등록**(홈택스) + **통신판매업 신고**(정부24)가 필요할 수 있어요.
- **구글 결제 프로필**
  1. Play Console 첫 화면(모든 앱) 왼쪽 **설정 → 결제 프로필** (또는 **수익 창출 설정**)
  2. **결제 프로필 만들기** → 국가 **대한민국**, 이름(운영자 이름), 주소, 연락처 → 저장
  3. 이어서 은행 계좌 · 세금 정보 입력 (payments.google.com 으로 넘어갈 수 있어요)
- **애플 유료 앱 계약**
  1. https://appstoreconnect.apple.com → **비즈니스**(계약, 세금 및 금융 정보)
  2. **유료 앱(Paid Apps)** → **보기 및 동의**
  3. **은행 계좌 추가** (예금주 · 은행 · 계좌번호), **세금 양식**(한국 개인이면 W-8BEN), 담당자 연락처
  4. 상태가 **활성**이 될 때까지 기다리기 (며칠 걸릴 수 있어요)

### B-2. 구글 플레이 상품 만들기
1. **첫 AAB 올리기** (처음 한 번)
   - GitHub → gameju → **Releases** → `reaper-1.0.0-110`(또는 최신) → `…aab` 다운로드
   - Play Console → 저승사자 키우기 → **테스트 및 출시 → 테스트 → 내부 테스트** → **새 버전 만들기**
   - 앱 서명: **Google 에서 생성한 키 사용**(기본) 그대로
   - **App Bundle 업로드** → aab 선택 → 출시 노트 `첫 테스트` → **다음 → 저장 및 게시**
   - **테스터** 탭 → **이메일 목록 만들기** → 이름 `나`, 내 구글 이메일 → 저장
2. **수익 창출 → 제품 → 인앱 상품**(새 화면에선 **일회성 제품**) → **상품 만들기**
   - 제품 ID: 아래 표 그대로 (나중에 못 바꿔요)
   - 이름 · 설명: 아래 표
   - (일회성 제품 화면이면) **구매 옵션 추가** → 옵션 ID `buy`, 유형 **구매**
   - **가격 설정** → 대한민국 ₩ 가격 입력 → **가격 업데이트** (다른 나라는 자동)
   - **저장 → 활성화**
3. 16개 모두 반복

| 제품 ID | 이름 | 설명 | 가격 |
|---|---|---|---|
| `jade_100` | 옥 100개 | 옥 100개 | ₩1,200 |
| `jade_550` | 옥 550개 | 옥 550개 (+10%) | ₩5,900 |
| `jade_1200` | 옥 1,200개 | 옥 1,200개 (+20%) | ₩12,000 |
| `starter_pack` | 신입 차사 패키지 | 옥 200 + 졸개 2명 즉시 고용 (1회 한정) | ₩1,200 |
| `promo_pack` | 승진 응원 패키지 | 옥 300 + 4시간치 혼 + 2배 부적 60분 | ₩3,300 |
| `yeomra_seal_7d` | 염라의 인장 (7일) | 7일 동안 모든 혼 수확 2배 | ₩9,900 |
| `remove_ads` | 광고 제거 | 광고 없이 광고 보상 즉시 받기 | ₩6,900 |
| `chair_cc0` | 특제 수습 차사의 걸상 | 집무실 특제 의자 | ₩1,200 |
| `chair_cc1` | 특제 말단 차사의 교의 | 집무실 특제 의자 | ₩1,900 |
| `chair_cc2` | 특제 차사의 옻칠 교의 | 집무실 특제 의자 | ₩2,500 |
| `chair_cc3` | 특제 선임 차사의 비단 교의 | 집무실 특제 의자 | ₩3,300 |
| `chair_cc4` | 특제 차사장의 자개 교의 | 집무실 특제 의자 | ₩3,900 |
| `chair_cc5` | 특제 판관의 붉은 칠 교의 | 집무실 특제 의자 | ₩4,900 |
| `chair_cc6` | 특제 명부 판관의 흑단 교의 | 집무실 특제 의자 | ₩5,900 |
| `chair_cc7` | 특제 시왕의 금칠 교의 | 집무실 특제 의자 | ₩7,900 |
| `chair_cc8` | 특제 염라대왕의 옥 교의 | 집무실 특제 의자 | ₩9,900 |

4. **결제 테스트 계정:** Play Console 첫 화면(모든 앱) → **설정 → 라이선스 테스트** → 내 구글 이메일 추가 → 라이선스 응답 `RESPOND_NORMALLY` → 저장
5. (선택) 자동 업로드: 서비스 계정 JSON 을 GitHub Secret `PLAY_SERVICE_ACCOUNT_JSON` 에 넣고, Play Console **사용자 및 권한**에서 그 이메일에 이 앱 **출시 관리** 권한 주기

### B-3. 앱스토어 상품 만들기
1. App Store Connect → **앱 → 저승사자 키우기** → 왼쪽 **수익화 → 앱 내 구입** → **+**(또는 **생성**)
   - 유형: `starter_pack` · `remove_ads` 는 **비소모성**, 나머지는 **소모성**
   - 참조 이름: 표의 이름 (내부용)
   - 제품 ID: 표의 제품 ID (구글과 똑같이)
   - **생성**
2. 만든 상품 화면에서
   - **사용 가능 여부(가용성)**: **모든 국가 또는 지역** → 저장
   - **가격 책정 → 가격 추가** → 기준 국가 **대한민국** → 표의 ₩ 에 가장 가까운 가격 → **다음 → 확인** (다른 나라는 자동)
   - **App Store 현지화 → +** → **한국어** → 표시 이름(표의 이름) · 설명(표의 설명) → 저장
   - **심사 정보**: 스크린샷 = 게임 상점 화면 캡처 1장, 심사 메모 `게임 안 상점 → 해당 상품`
   - 상태가 **제출 준비 완료**가 되면 OK
3. 16개 모두 반복
4. **샌드박스 테스터:** **사용자 및 액세스 → Sandbox → 테스터 +**
   - 이름 아무거나, 이메일은 **애플 계정으로 쓴 적 없는 새 주소** (예: Gmail 이면 `내아이디+sandbox@gmail.com`), 비밀번호, 국가 **대한민국**
   - 아이폰: **설정 → App Store → 맨 아래 샌드박스 계정** 에 로그인 → TestFlight 앱에서 결제 시험 (돈 안 나감)
5. 첫 심사 낼 때: 앱 버전 화면의 **앱 내 구입 및 구독** 칸에서 상품들을 선택해서 함께 제출

---

## C. 광고 (AdMob)

### C-1. 계정 만들기
1. https://admob.google.com → **시작하기** (구글 계정)
   - 국가: **대한민국**, 시간대: **(GMT+09:00) 서울**, 결제 통화: **KRW**
   - 이메일 수신 선택 → **AdMob 계정 만들기**
2. 지급 정보(계좌)는 수익이 쌓이면 **결제 → 지급 정보 추가**에서 넣어도 돼요

### C-2. 앱 추가 + 보상형 광고 단위 (안드로이드)
1. 왼쪽 **앱 → 앱 추가**
   - 플랫폼: **Android**
   - "지원되는 앱 스토어에 등록되어 있나요?" → **아니요**
   - 앱 이름: `저승사자 키우기` / 사용자 측정: 켜 둔 그대로 → **앱 추가**
2. **광고 단위 만들기** → **보상형** → **선택**
   - 광고 단위 이름: `reward`
   - 보상 설정: 보상 금액 `1`, 보상 항목 `reward`
   - (서버 측 확인은 끈 그대로) → **광고 단위 만들기**
3. 화면에 나오는 두 값 복사
   - **앱 ID**: `ca-app-pub-숫자~숫자` (물결표 `~`)
   - **광고 단위 ID**: `ca-app-pub-숫자/숫자` (슬래시 `/`)

### C-3. iOS 도 똑같이
- **앱 → 앱 추가** → 플랫폼 **iOS** → 나머지 C-2 와 똑같이
- 📮 **안드로이드 앱 ID · 광고 단위 ID, iOS 앱 ID · 광고 단위 ID (4개)** 를 Claude 에게

### C-4. 동의 메시지 (유럽 사용자용)
1. 왼쪽 **개인정보 보호 및 메시지** → **유럽 규정** → **메시지 만들기**
2. 앱: 두 앱 모두 선택, 개인정보처리방침 URL: D 에서 만든 주소, 언어: 한국어 · 영어 · 일본어 · 중국어
3. **게시**

### C-5. 출시 직전
- 📮 "광고 테스트 모드 꺼줘" → `testing: false`
- ⚠️ 그 전에는 **내 폰에서 진짜 광고를 누르지 마세요.** 계정이 정지될 수 있어요.
- 스토어에 올라간 뒤: AdMob **앱 → 앱 설정 → 앱 스토어 추가**로 스토어 링크 연결

---

## D. 개인정보처리방침 (앱 전용이어도 필요해요)
> ✅ **완료 (2026-11-10):** 운영자 갓주모바일 · 시행일 2026년 11월 10일
> **웹 주소:** https://whimsical-salt-0b8.notion.site/414e0d3e460280a09049dc1306b6df31
> 스토어 · AdMob · 구글 브랜딩에는 이 주소를 넣어요. 승인된 도메인은 `notion.site`.
1. 📮 Claude 에게 보낼 3가지
   - 운영자 이름(또는 상호)
   - 문의 이메일
   - 시행일 (예: `2026년 12월 1일`)
   → `privacy.html` 과 게임 설정의 문의 이메일에 넣어 줘요
2. 웹 주소 만들기 (둘 중 하나)
   - **노션 (쉬움):** 노션 새 페이지 → 제목 `저승사자 키우기 개인정보처리방침` → Claude 가 준 내용 붙여 넣기 → 오른쪽 위 **공유 → 게시 → 웹에 게시** → 링크 복사
   - **GitHub Pages:** gameju → **Settings → Pages** → Source **Deploy from a branch** → 브랜치 선택 → `/ (root)` → **Save**
     → `https://dydwn1003.github.io/gameju/reaper/privacy.html` (저장소가 비공개면 GitHub 유료 요금제 필요)
3. 이 주소를 넣는 곳
   - Play Console → **앱 콘텐츠 → 개인정보처리방침**
   - App Store Connect → **앱 개인정보 보호 → 개인정보 처리방침 URL**
   - AdMob 동의 메시지 (C-4)

---

## E. 마무리
1. 📮 다 넣었으면 Claude 에게 "APK · AAB · TestFlight 빌드해줘"
2. 새 빌드로 확인
   - 로그인 4종 (구글 · 카카오 · 네이버 · 애플)
   - 결제 → 설정 → 구매 복원
   - 광고 보기 (테스트 광고)
   - 설정 → 계정 삭제
