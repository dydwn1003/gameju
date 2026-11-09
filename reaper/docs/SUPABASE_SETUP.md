# 저승사자 키우기 — Supabase · 로그인 설정 안내

코드는 다 들어가 있어요. 아래 단계대로 콘솔에서 설정하고 `js/config.js` 에 주소와 공개 키만 넣으면 됩니다.
`config.js` 가 비어 있으면 지금처럼 기기 저장만으로 동작하고, claude.ai 안에서 열면 claude.ai 공유 저장소를 씁니다.

> ⚠️ **로그인은 claude.ai 아티팩트 안에서는 안 돼요.** OAuth 로그인 창이 iframe 안에서 막히기 때문입니다.
> 게임을 따로 호스팅해야 합니다(6번).

---

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 에 가입하고 **New project** 를 누릅니다. 지역은 `Northeast Asia (Seoul)` 을 고르세요.
2. 왼쪽 아래 톱니바퀴 **Project Settings** 에서 두 값을 복사합니다.
   - **Data API**(또는 API) 화면의 `Project URL`
   - **API Keys** 화면의 공개 키. **Legacy API keys** 탭에 `anon` `public` 키가 있으면 그것을, 없으면 `Publishable key`(sb_publishable_…)를 씁니다.
   - `Project URL` (예: `https://abcdefgh.supabase.co`)
   - `anon public` 키
   - `service_role` 키는 **절대 게임 코드에 넣지 마세요.** 이 키는 Supabase 서버 안에서만 씁니다.

## 2. 데이터베이스 만들기
**SQL Editor** 에 `server/schema.sql` 을 통째로 붙여 넣고 **Run** 합니다. 여러 번 실행해도 안전합니다.

만들어지는 것:
- `saves`: 한 사람당 한 줄. 게임 저장은 1~6KB 정도라 무료 요금제(500MB)로 수만 명까지 충분합니다.
- `docs`: 순위·집무실·방문/방명록·공지·우편.
- `admins`: 운영자 목록.

접근 규칙(RLS)이 켜져 있어서 다음처럼만 허용됩니다.
- 저장은 자기 것만 읽고 씁니다.
- 순위·집무실은 자기 문서만 고칠 수 있습니다.
- 공지·우편은 운영자만 씁니다.

## 3. 로그인 주소 등록 (공통)
**Authentication → URL Configuration** 에서 설정합니다.
- **Site URL**: 게임 주소 (예: `https://내아이디.github.io/gameju/reaper/`)
- **Redirect URLs**: 같은 주소를 추가합니다. 테스트용 `http://localhost:8080/` 도 넣어 두면 편합니다.

아래 각 로그인 콘솔에 넣는 **콜백 주소**는 모두 이것입니다.
```
https://<프로젝트ID>.supabase.co/auth/v1/callback
```

## 4. 로그인 제공자 켜기 (Authentication → Providers)

### 카카오
1. https://developers.kakao.com → **내 애플리케이션 → 애플리케이션 추가**
2. **앱 키 → REST API 키**를 복사해 Supabase 의 Kakao **Client ID** 에 넣습니다.
3. **보안 → Client Secret** 을 생성하고 활성화한 뒤, Supabase **Client Secret** 에 넣습니다.
4. **카카오 로그인**을 활성화하고 **Redirect URI** 에 위 콜백 주소를 넣습니다.
5. **동의항목**에서 닉네임·프로필 사진을 켭니다.
   - 이메일(account_email)은 비즈 앱 전환이 필요합니다.
   - 비즈 앱이 아니면 Supabase Kakao 설정에서 **Allow users without an email** 을 켜세요.
6. **플랫폼 → Web** 에 게임 도메인을 등록합니다.

### 구글
1. https://console.cloud.google.com → 프로젝트를 만들고 **API 및 서비스 → OAuth 동의 화면**을 설정합니다(외부, 앱 이름).
2. **사용자 인증 정보 → OAuth 클라이언트 ID** 를 만듭니다(웹 애플리케이션).
   - 승인된 리디렉션 URI 에 위 콜백 주소를 넣습니다.
3. 클라이언트 ID 와 보안 비밀을 Supabase Google 설정에 넣습니다.

### 애플
- **Apple Developer 유료 계정(연 $99)** 이 필요합니다. 없으면 `config.js` 의 `providers` 에서 `'apple'` 을 빼 두세요.
1. Certificates, IDs & Profiles 로 갑니다.
   - **Identifiers** 에서 App ID 를 만들고 *Sign in with Apple* 을 체크합니다.
   - 같은 곳에서 **Services ID** 를 만듭니다(이것이 Client ID). 도메인과 Return URL 에 위 콜백 주소를 넣습니다.
2. **Keys** 에서 Sign in with Apple 키를 만들고 `.p8` 파일을 받습니다.
3. Supabase Apple 설정에 Services ID, Team ID, Key ID, `.p8` 로 만든 Secret 을 넣습니다. Supabase 화면에 생성 도구 안내가 있습니다.
4. 애플 Secret 은 6개월마다 새로 만들어 넣어야 합니다.

### 네이버 (Edge Function 사용)
Supabase 는 네이버를 기본 지원하지 않아서 `server/supabase/functions/naver-auth` 함수가 대신 처리합니다.
네이버로 로그인하면 같은 이메일의 Supabase 계정을 만들거나 찾아서 매직 링크로 로그인시킵니다.

1. https://developers.naver.com → **Application → 애플리케이션 등록**
   - 사용 API: **네이버 로그인**. 이메일·별명을 필수 또는 추가로 지정합니다.
   - 서비스 URL: 게임 주소
   - Callback URL:
     ```
     https://<프로젝트ID>.supabase.co/functions/v1/naver-auth/callback
     ```
2. **쉬운 방법 (대시보드만 사용):**
   - Supabase 왼쪽 메뉴 **Edge Functions → Secrets** 에서 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `ALLOWED_REDIRECTS`(게임 주소) 세 개를 추가합니다.
   - **Edge Functions → Deploy a new function → Via Editor** 를 누르고, 이름을 `naver-auth` 로 정한 뒤 `server/supabase/functions/naver-auth/index.ts` 내용을 통째로 붙여 넣고 **Deploy** 합니다.
   - 배포된 함수의 **Details(설정)** 에서 **Verify JWT** (Enforce JWT verification) 를 **끕니다.**

   **CLI 방법 (선택):** Supabase CLI 를 설치하고 함수를 배포합니다. PC 터미널에서 실행하세요.
   ```bash
   npm i -g supabase
   ```
   ```bash
   supabase login
   ```
   ```bash
   cd reaper/server && supabase link --project-ref <프로젝트ID>
   ```
   ```bash
   supabase secrets set NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... ALLOWED_REDIRECTS=https://내아이디.github.io/gameju/reaper/
   ```
   ```bash
   supabase functions deploy naver-auth --no-verify-jwt
   ```
   - `--no-verify-jwt` 는 꼭 붙이세요. 네이버가 로그인 토큰 없이 콜백을 부르기 때문입니다.
   - 함수는 `server/supabase/functions/naver-auth/` 에 있어요. 명령은 꼭 `reaper/server` 에서 실행하세요.
   - `config.toml` 이 없다고 나오면 `server/` 에서 `supabase init` 을 한 번 실행하세요(기존 파일은 그대로 둡니다).
3. 네이버 앱은 처음에 **개발 중** 상태라 등록한 테스터만 로그인됩니다. 출시 전에 **검수 요청**을 하세요.

## 5. 게임에 연결
`js/config.js` 를 엽니다.
```js
url: 'https://abcdefgh.supabase.co',
anonKey: 'eyJhbGciOi...',          // anon public 키 (service_role 아님!)
providers: ['google', 'kakao', 'naver'],  // 애플 계정 없으면 'apple' 빼기
```

### 운영자 등록
1. 게임에서 내 계정으로 한 번 로그인합니다.
2. Supabase **Authentication → Users** 에서 내 User UID 를 복사합니다.
3. SQL Editor 에서 실행합니다.
   ```sql
   insert into public.admins (user_id) values ('내-UID');
   ```

이제 설정 화면에 공지 쓰기와 전체 우편 보내기가 보입니다.

## 6. 호스팅 (로그인을 쓰려면 필수)
`reaper/` 폴더(`index.html`, `js/`, `css/`, `fonts/`)를 그대로 올리면 됩니다.

- **GitHub Pages**:
  1. 저장소 **Settings → Pages → Branch: main / root** 를 고릅니다.
  2. 주소는 `https://<아이디>.github.io/gameju/reaper/` 가 됩니다.
- **Vercel / Netlify**: 저장소를 연결하고 Root Directory 를 `reaper` 로 둡니다.
- **앱 출시(나중)**: Capacitor 로 감싸서 iOS/Android 로 내보낼 수 있습니다.
  - 이때는 딥링크 주소를 Redirect URLs 에 추가해야 합니다.
  - iOS 에 다른 소셜 로그인을 넣으면 애플 정책상 Apple 로그인도 함께 필요합니다.

호스팅 주소가 정해지면 다음 세 곳에 같은 주소를 넣었는지 확인하세요.
- 3번의 Site URL / Redirect URLs
- 카카오 플랫폼 도메인
- 네이버 서비스 URL / `ALLOWED_REDIRECTS`

---

## 동작 방식 요약
- **처음 실행** (로그인 안 됨):
  - 로그인 화면이 뜹니다(구글/카카오/네이버/애플 + **게스트로 시작**).
  - 게스트는 기기에만 저장되고, 나중에 설정 → **계정 연동**으로 올릴 수 있습니다.
- **로그인하면**:
  - 클라우드 저장만 있으면 → 불러옵니다.
  - 기기 저장만 있으면 → 클라우드로 올립니다.
  - 둘 다 있고 다르면 → 어느 쪽을 쓸지 고르는 창이 뜹니다.
- **저장**: 기기에 바로 저장하고, 클라우드에는 30초마다, 그리고 앱을 닫거나 내릴 때 올립니다.
- **순위·집무실 방문·방명록·공지·우편**: 모두 `docs` 테이블로 공유됩니다.
