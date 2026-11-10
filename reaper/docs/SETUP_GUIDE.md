# 저승사자 키우기 — 로그인 · 결제 · 광고 넣기 (순서대로, 앱 전용)

> 게임은 **앱(구글 플레이 · 앱스토어)으로만** 내요. 웹 로그인 설정은 하지 않아요.
> 웹 주소가 필요한 곳은 **개인정보처리방침 페이지 하나**뿐이에요(D).

위에서부터 하나씩 하면 돼요. 각 단계 끝의 **📮 Claude 에게** 부분은 받은 값을 Claude 에게 보내면 코드에 넣어 준다는 뜻이에요.

> 🔐 **채팅에 보내도 되는 값 / 안 되는 값**
> - 보내도 됨 (공개용): Supabase **Project URL**, **anon(Publishable) 키**, AdMob **앱 ID · 광고 단위 ID**, 문의 이메일, 운영자 이름
> - **절대 보내지 말 것**: Supabase `service_role`(secret) 키, 카카오 · 구글 · 네이버 **Client Secret**, 애플 `.p8` 파일 내용
>   → 이런 값은 **Supabase 화면에만** 직접 넣어요.

---

## A. 서버 · 로그인 (Supabase)

### A-1. 프로젝트 만들기
1. https://supabase.com → 가입 → **New project**
   - 이름: `reaper` / 비밀번호: 아무거나(메모) / 지역: **Northeast Asia (Seoul)**
2. 만들어지면 왼쪽 아래 ⚙️ **Project Settings** 로 가요.
   - **Data API**(또는 API) → `Project URL` 복사 (예: `https://abcdefgh.supabase.co`)
   - **API Keys** → `anon` `public` 키 복사 (없으면 `Publishable key` `sb_publishable_…`)
- 📮 **Claude 에게:** Project URL 과 anon 키 → `js/config.js` 에 넣어 줘요.

### A-2. 데이터베이스 표 만들기
1. 왼쪽 **SQL Editor** → **New query**
2. 저장소의 `reaper/server/schema.sql` 내용을 통째로 붙여 넣고 **Run**
   - (GitHub 에서 파일 열기 → 오른쪽 위 **Copy raw file** 버튼)
3. "Success" 가 뜨면 끝. 여러 번 실행해도 괜찮아요.

### A-3. 로그인 후 돌아올 주소 (앱 전용)
**Authentication → URL Configuration**
- **Site URL:** `com.jeoseungsaja.idle://login` (필수 칸이라 앱 주소를 그대로 넣어요)
- **Redirect URLs → Add URL** 로 하나만 추가
  ```
  com.jeoseungsaja.idle://login
  ```
- 웹 주소(`https://…github.io…`)는 웹에서 로그인할 때만 필요해서 넣지 않아요.

아래 로그인 콘솔들에 넣는 **콜백 주소**는 모두 이거예요 (`<프로젝트ID>` = Project URL 의 앞부분):
```
https://<프로젝트ID>.supabase.co/auth/v1/callback
```

### A-4. 구글 로그인
1. https://console.cloud.google.com → 위쪽 프로젝트 선택 → **새 프로젝트** (`reaper`)
2. **API 및 서비스 → OAuth 동의 화면**(또는 **Google 인증 플랫폼**) → 시작하기
   - 앱 이름 `저승사자 키우기`, 지원 이메일, 대상 **외부**, 연락처 이메일 → 만들기
   - **대상(Audience)** 에서 **앱 게시**(프로덕션)로 바꿔요. 테스트 상태면 등록한 사람만 로그인돼요.
3. **사용자 인증 정보(클라이언트) → 만들기 → OAuth 클라이언트 ID**
   - 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI** 에 위 콜백 주소
4. 나온 **클라이언트 ID** · **클라이언트 보안 비밀번호**를
   Supabase **Authentication → Sign In / Providers → Google** 에 넣고 **Enable** → Save

### A-5. 카카오 로그인
1. https://developers.kakao.com → **내 애플리케이션 → 애플리케이션 추가** (앱 이름, 회사명 = 본인 이름)
2. **앱 키**의 **REST API 키** 복사 → Supabase **Kakao → Client ID(REST API Key)**
3. **카카오 로그인 → 활성화 ON**, **Redirect URI** 에 위 콜백 주소 등록
   - (화면이 바뀐 경우: **앱 → 플랫폼 키 → REST API 키** 안에 리다이렉트 URI 칸이 있어요)
4. **보안(또는 REST API 키 설정) → Client Secret → 코드 생성 → 사용함**
   → 그 코드를 Supabase **Kakao → Client Secret** 에
5. **카카오 로그인 → 동의항목**: 닉네임 · 프로필 사진 **필수/선택 동의**
   - 이메일은 비즈 앱 전환이 필요해요. 그래서 Supabase Kakao 설정의 **Allow users without an email** 을 켜요.
6. Supabase 에서 **Enable** → Save

### A-6. 애플 로그인 (iOS 앱에는 필수)
1. https://developer.apple.com/account → **Certificates, IDs & Profiles → Identifiers**
   - `com.jeoseungsaja.idle` 을 열어 **Sign in with Apple** 체크 → Save
2. **Identifiers → + → Services IDs**
   - Description `Reaper Login`, Identifier `com.jeoseungsaja.idle.login` → Register
   - 만든 Services ID 를 열어 **Sign in with Apple → Configure**
     - Primary App ID: `com.jeoseungsaja.idle`
     - Domains: `<프로젝트ID>.supabase.co`
     - Return URLs: 위 콜백 주소 → Save
3. **Keys → +** → 이름 `Reaper SIWA`, **Sign in with Apple** 체크 → Configure(앱 선택) → 만들기
   - `.p8` 파일 받기 (**한 번만** 받을 수 있어요), **Key ID** 메모
4. Supabase **Apple** 설정
   - **Client IDs:** `com.jeoseungsaja.idle.login,com.jeoseungsaja.idle`
   - **Secret Key:** Supabase Apple 설정 화면의 안내 링크(Secret 생성 도구)에서 Team ID `V9RLBAGQZD` · Services ID · Key ID · `.p8` 내용으로 만든 값
   - **Enable** → Save
   - ⏰ 이 Secret 은 **6개월마다** 다시 만들어 넣어야 해요(달력에 적어 두기).

### A-7. 네이버 로그인
1. https://developers.naver.com → **Application → 애플리케이션 등록**
   - 사용 API: **네이버 로그인** → 이메일 · 별명 체크
   - 환경: **PC 웹** → 서비스 URL 은 웹 주소 형식이면 아무거나 돼요 (예: `https://<프로젝트ID>.supabase.co`). 실제로 쓰는 건 아래 Callback URL 이에요.
   - Callback URL:
     ```
     https://<프로젝트ID>.supabase.co/functions/v1/naver-auth/callback
     ```
   - 만들면 **Client ID** · **Client Secret** 이 나와요.
2. Supabase **Edge Functions → Secrets** 에 3개 추가
   | Name | Value |
   |---|---|
   | `NAVER_CLIENT_ID` | 네이버 Client ID |
   | `NAVER_CLIENT_SECRET` | 네이버 Client Secret |
   | `ALLOWED_REDIRECTS` | `com.jeoseungsaja.idle://login` |
3. **Edge Functions → Deploy a new function → Via Editor**
   - 이름 **`naver-auth`**
   - `reaper/server/supabase/functions/naver-auth/index.ts` 내용을 붙여 넣고 **Deploy**
   - 배포 후 함수 **Details** 에서 **Verify JWT(Enforce JWT verification) 끄기** ← 꼭!
4. 네이버 앱은 처음에 **개발 중**이라 등록한 테스터만 돼요. 출시 전에 **검수 요청**하세요.

### A-8. 계정 삭제 함수 (스토어 필수)
1. **Edge Functions → Deploy a new function → Via Editor**
2. 이름 **`delete-account`**, `reaper/server/supabase/functions/delete-account/index.ts` 붙여 넣기 → **Deploy**
3. 이건 **Verify JWT 켠 채로** 둬요(기본값).

### A-9. 운영자(나) 등록 — 앱에서 처음 로그인한 뒤
1. 게임에서 내 계정으로 로그인
2. Supabase **Authentication → Users** 에서 내 **User UID** 복사
3. **SQL Editor** 에서 실행
   ```sql
   insert into public.admins (user_id) values ('여기에-UID');
   ```
→ 설정 화면에 공지 쓰기 · 전체 우편 · 문의 답변이 보여요.

---

## B. 인앱 결제

### B-1. 돈 받을 계좌 · 계약 (이게 없으면 결제 상품이 안 떠요)
- **사업자:** 유료 아이템을 팔려면 **사업자 등록 + 통신판매업 신고**가 필요할 수 있어요(홈택스 · 정부24). 구글 · 애플 정산 정보에도 써요.
- **구글:** Play Console → **설정 → 결제 프로필** 만들기 (판매자 계정, 계좌 · 세금 정보)
- **애플:** App Store Connect → **비즈니스(계약, 세금 및 금융 정보)** → **유료 앱(Paid Apps) 계약** 동의 + 은행 · 세금 정보 입력 → 상태가 **활성**이 될 때까지 기다려요(며칠 걸릴 수 있음)

### B-2. 구글 플레이 상품 만들기
1. **첫 AAB 올리기:** GitHub **Releases** 의 `reaper-1.0.0-104.aab` 받기 → Play Console → **테스트 → 내부 테스트 → 새 버전 만들기** 에 올리고 출시
2. **수익 창출 → 제품 → 인앱 상품 → 상품 만들기** 를 아래 표대로 반복
3. 각 상품: 제품 ID → 이름 · 설명 → **가격 설정**에 원화 입력(다른 나라는 자동 변환) → 저장 → **활성화**

| 제품 ID | 이름 | 가격 |
|---|---|---|
| `jade_100` | 옥 100개 | ₩1,200 |
| `jade_550` | 옥 550개 | ₩5,900 |
| `jade_1200` | 옥 1,200개 | ₩12,000 |
| `starter_pack` | 신입 차사 패키지 | ₩1,200 |
| `promo_pack` | 승진 응원 패키지 | ₩3,300 |
| `yeomra_seal_7d` | 염라의 인장 (7일) | ₩9,900 |
| `remove_ads` | 광고 제거 | ₩6,900 |
| `chair_cc0` | 특제 수습 차사의 걸상 | ₩1,200 |
| `chair_cc1` | 특제 말단 차사의 교의 | ₩1,900 |
| `chair_cc2` | 특제 차사의 옻칠 교의 | ₩2,500 |
| `chair_cc3` | 특제 선임 차사의 비단 교의 | ₩3,300 |
| `chair_cc4` | 특제 차사장의 자개 교의 | ₩3,900 |
| `chair_cc5` | 특제 판관의 붉은 칠 교의 | ₩4,900 |
| `chair_cc6` | 특제 명부 판관의 흑단 교의 | ₩5,900 |
| `chair_cc7` | 특제 시왕의 금칠 교의 | ₩7,900 |
| `chair_cc8` | 특제 염라대왕의 옥 교의 | ₩9,900 |

4. **결제 테스트:** 모든 앱 목록 화면 → **설정 → 라이선스 테스트** 에 내 구글 이메일 추가 → 돈이 안 나가요.
5. (선택) **자동 업로드:** 서비스 계정 JSON 을 GitHub Secret `PLAY_SERVICE_ACCOUNT_JSON` 에 넣고, Play Console **사용자 및 권한**에서 그 계정에 이 앱 권한을 주면 다음부터 "안드로이드 빌드 돌려줘"로 자동 업로드돼요.

### B-3. 앱스토어 상품 만들기
1. App Store Connect → **나의 앱 → 저승사자 키우기 → 수익화 → 앱 내 구입 → +**
2. 위 표와 **같은 제품 ID** 로 만들어요.
   - **비소모성:** `starter_pack`, `remove_ads`
   - **소모성:** 나머지 전부 (옥 · 패키지 · 인장 · 의자)
3. 각 상품마다
   - **가격 책정 → 가격 추가** → 기준 국가 **대한민국** → ₩ 가격에 가까운 단계 선택 (다른 나라는 자동)
   - **현지화(한국어)**: 표시 이름 · 설명
   - **심사 정보**: 상점 화면 스크린샷 1장
4. **사용자 및 액세스 → Sandbox → 테스터 +** 로 테스트용 애플 계정 만들기 → TestFlight 앱에서 결제 시험 (돈 안 나감)
5. 첫 심사 때 앱 버전 화면의 **앱 내 구입** 칸에 상품들을 함께 선택해서 제출해요.

---

## C. 광고 (AdMob)

### C-1. 계정 · 앱 만들기
1. https://admob.google.com → 가입 (구글 계정) → **결제(지급) 정보** 입력
2. **앱 → 앱 추가**
   - 플랫폼 **Android**, "스토어에 등록되어 있나요?" → 아직이면 **아니요**, 앱 이름 `저승사자 키우기`
   - 같은 방법으로 **iOS** 도 하나 더
3. 각 앱의 **앱 설정**에서 **앱 ID** 복사 (`ca-app-pub-숫자~숫자`, 물결표 `~` 있는 것)

### C-2. 보상형 광고 단위 만들기
1. 각 앱 → **광고 단위 → 광고 단위 추가 → 보상형**
   - 이름 `reward`, 보상 금액 1, 보상 항목 `reward` → 만들기
2. **광고 단위 ID** 복사 (`ca-app-pub-숫자/숫자`, 슬래시 `/` 있는 것)

- 📮 **Claude 에게:** 아래 4개를 보내 주면 제자리에 넣어 줘요.
  | 값 | 들어갈 곳 |
  |---|---|
  | Android 앱 ID (`~`) | `AndroidManifest.xml` |
  | iOS 앱 ID (`~`) | `Info.plist` |
  | Android 보상형 단위 ID (`/`) | `config.js` → `APP.admob.android` |
  | iOS 보상형 단위 ID (`/`) | `config.js` → `APP.admob.ios` |

### C-3. 동의 메시지 (유럽 · iOS)
- AdMob → **개인정보 보호 및 메시지**
  - **유럽 규정(GDPR)** 메시지 만들기 → 게시
  - **iOS IDFA 설명** 메시지(선택) → 게시
- 게임 코드에는 동의 창을 띄우는 부분이 이미 들어 있어요.

### C-4. 출시 직전
- 📮 **Claude 에게:** "광고 테스트 모드 꺼줘" → `testing: false`
  - ⚠️ 그 전에는 **내 폰에서 진짜 광고를 누르지 마세요.** 계정이 정지될 수 있어요.
- `app-ads.txt` (권장): 스토어에 적은 **개발자 웹사이트 최상위 주소**에 AdMob 이 알려 주는 한 줄을 올려요. 없어도 광고는 나오지만 수익이 줄 수 있어요.

---

## D. 개인정보처리방침 · 문의 이메일
- 📮 **Claude 에게:** 운영자 이름(또는 상호) · 문의 이메일 · 시행일 → `privacy.html` 과 `APP.supportEmail` 에 넣어 줘요.
- 앱 전용이어도 스토어에는 개인정보처리방침 **웹 주소**를 꼭 적어야 해요. 방법 둘 중 하나:
  - **GitHub Pages:** gameju → **Settings → Pages → Deploy from a branch** → 브랜치 선택 → `/ (root)` → 주소 `https://dydwn1003.github.io/gameju/reaper/privacy.html`
    (저장소가 비공개면 GitHub 유료 요금제가 필요해요)
  - **노션 공개 페이지**에 같은 내용을 붙여 넣고 그 주소를 써도 돼요.

---

## E. 다 넣었으면
📮 **Claude 에게:** "APK · AAB · TestFlight 빌드해줘" → 새 값이 들어간 앱이 만들어져요.
그 다음 확인할 것:
1. 로그인 4종 (구글 · 카카오 · 네이버 · 애플)
2. 라이선스 테스트 / Sandbox 계정으로 결제 → 구매 복원
3. 광고 보기 (테스트 광고)
4. 설정 → 계정 삭제
