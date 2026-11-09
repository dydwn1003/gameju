# 저승사자 키우기 — 구글 플레이 · 앱스토어 출시 안내

웹 게임을 **Capacitor**로 감싸서 안드로이드 · iOS 앱으로 만들어요.
앱 프로젝트는 `reaper/app/` 에 있고, 게임 코드(`reaper/js`, `css`, `fonts`)를 그대로 가져다 씁니다.

앱에 이미 들어가 있는 것:
- **로그인**: 구글 · 카카오 · 네이버 · Apple. 앱 안 브라우저로 로그인한 뒤 `com.jeoseungsaja.idle://login` 으로 앱에 돌아와요.
  - iOS 에서는 Apple 로그인이 항상 보여요(앱스토어 규정 4.8).
- **인앱 결제**: Google Play 결제 / App Store 결제 (`cordova-plugin-purchase`).
  - 가격은 스토어에서 받아 그 나라 통화로 보여요.
  - 같은 거래는 두 번 지급하지 않아요.
  - **설정 → 구매 복원**이 있어요.
- **보상형 광고**: Google AdMob. iOS 추적 허용 묻기(ATT)와 유럽 동의 화면(UMP)을 포함해요.
- **설정**:
  - 로그아웃
  - **계정 삭제** (두 번 확인. 서버의 계정과 모든 기록 삭제, 스토어 필수)
  - **1:1 문의** (게임 안에서 보내고 답변 확인. 운영자는 **📨 문의 답변**에서 답장)
  - **개인정보처리방침** (`reaper/privacy.html`)
- **안드로이드 뒤로가기**: 열린 창 닫기. 두 번 누르면 종료.
- **기타**: 세로 화면 고정, 노치 · 홈 바 영역 피하기, 아이콘 · 스플래시(`app/assets/` 에서 생성).

---

## 0. 먼저 준비할 것

| 무엇 | 비용 | 비고 |
|---|---|---|
| Google Play 개발자 계정 | $25 (한 번) | https://play.google.com/console |
| Apple Developer Program | $99 / 년 | https://developer.apple.com/programs |
| AdMob 계정 | 무료 | https://admob.google.com |
| PC + Android Studio | 무료 | 안드로이드 빌드 (Windows · Mac 모두 가능) |
| **Mac** + Xcode | 무료 | **iOS 빌드는 Mac 에서만 가능** |
| Node.js 22 이상 | 무료 | https://nodejs.org |

> ⚠️ **개인 개발자 계정으로 구글 플레이에 처음 출시할 때**
> 정식 출시 전에 **비공개 테스트에 테스터 12명 이상이 14일 연속 참여**해야 합니다.
> 친구 · 가족 12명의 구글 이메일을 미리 모아 두세요.

> ⚠️ **유료 아이템을 팔려면**
> 한국에서는 **사업자 등록**과 **통신판매업 신고**가 필요할 수 있어요(세무서 · 구청).
> 구글 · 애플 판매자 정산 정보에도 필요합니다.

> ✅ **확률 공개**
> 확률형 아이템 확률 공개(게임산업법)는 이미 되어 있어요. 영물 소환과 합성 화면에 확률이 표시됩니다.
> 국내 게임 등급은 스토어의 자체 등급 설문(IARC)으로 받습니다.

### 앱 ID 정하기 (출시 후에는 못 바꿔요!)
지금은 **`com.jeoseungsaja.idle`** 로 되어 있어요. 바꾸려면 첫 업로드 **전에** 아래 4곳을 같게 바꾸세요.
1. `reaper/app/capacitor.config.json` 의 `appId`
2. `reaper/js/config.js` 의 `APP.authRedirect` (`<앱ID>://login`)
3. `reaper/app/android/app/src/main/AndroidManifest.xml` 의 `android:scheme`, `android/app/build.gradle` 의 `applicationId` · `namespace`
4. `reaper/app/ios/App/App/Info.plist` 의 `CFBundleURLSchemes`, Xcode 의 Bundle Identifier

---

## 1. 앱 빌드 준비 (처음 한 번)
터미널에서 실행합니다.
```bash
cd reaper/app
```
```bash
npm install
```
```bash
npm run sync
```
`npm run sync` 는 게임 파일을 `www/` 로 모으고 안드로이드 · iOS 프로젝트에 복사해요.

> 게임 코드를 고칠 때마다 `npm run sync` 를 다시 실행하면 앱에 반영됩니다.

---

## 2. Supabase 추가 설정 (앱용)
`SUPABASE_SETUP.md` 를 먼저 끝낸 뒤 아래를 더 해 주세요.

1. **SQL Editor** 에서 `reaper/server/schema.sql` 을 **다시 한 번** 실행합니다. 1:1 문의 표가 추가돼요. 여러 번 실행해도 안전합니다.
2. **Authentication → URL Configuration → Redirect URLs** 에 앱 주소를 추가합니다.
   ```
   com.jeoseungsaja.idle://login
   ```
3. **Edge Functions → Secrets** 의 `ALLOWED_REDIRECTS` 를 쉼표로 이어서 고칩니다(네이버 로그인용).
   ```
   https://<아이디>.github.io/gameju/reaper/,com.jeoseungsaja.idle://login
   ```
4. **계정 삭제 함수 배포**
   - **Edge Functions → Deploy a new function → Via Editor**
   - 이름: **`delete-account`**
   - `reaper/server/supabase/functions/delete-account/index.ts` 내용을 붙여 넣고 **Deploy**
   - 이 함수는 **Verify JWT 를 켠 채로** 둡니다(기본값). 로그인한 본인만 자기 계정을 지울 수 있어요.
5. `reaper/js/config.js` 의 `APP.supportEmail` 에 문의 받을 이메일을 넣습니다. 스토어 등록에도 필요해요.

---

## 3. AdMob 광고 설정
1. https://admob.google.com → **앱 → 앱 추가**. 안드로이드와 iOS 를 각각 하나씩 만듭니다.
   - 아직 스토어에 없으면 "아니요"를 고르면 돼요.
2. 각 앱에서 **광고 단위 → 보상형** 을 만듭니다(보상 1개).
3. 받은 값을 넣습니다.

   | AdMob 에서 | 넣을 곳 |
   |---|---|
   | 안드로이드 **앱 ID** (`ca-app-pub-…~…`) | `app/android/app/src/main/AndroidManifest.xml` 의 `com.google.android.gms.ads.APPLICATION_ID` 값 |
   | iOS **앱 ID** | `app/ios/App/App/Info.plist` 의 `GADApplicationIdentifier` |
   | 안드로이드 **보상형 광고 단위 ID** (`ca-app-pub-…/…`) | `js/config.js` → `APP.admob.android` |
   | iOS **보상형 광고 단위 ID** | `js/config.js` → `APP.admob.ios` |

4. **출시 빌드 직전**에 `APP.admob.testing` 을 `false` 로 바꿉니다. 테스트 중에 진짜 광고를 누르면 계정이 정지될 수 있어요.
5. 게임 웹사이트(GitHub Pages) 최상위에 `app-ads.txt` 를 올립니다. AdMob 이 안내하는 한 줄입니다.

---

## 4. 구글 플레이 출시

### 4-1. 앱 서명 키 만들기 (처음 한 번, **절대 잃어버리면 안 됨**)
1. `npm run android` 를 실행하면 Android Studio 가 열려요.
2. **Build → Generate Signed App Bundle / APK → Android App Bundle → Create new…** 를 누릅니다.
   - 키 파일(`.jks`)과 비밀번호를 **안전한 곳 두 군데 이상에** 보관하세요. 저장소(GitHub)에는 올리지 마세요.
3. **release** 로 빌드하면 `app-release.aab` 가 생깁니다.

### 4-2. Play Console 에 앱 만들기
1. **앱 만들기** → 이름 `저승사자 키우기`, 언어 한국어, **게임**, **무료**를 고릅니다.
2. **대시보드 → 앱 설정**의 항목을 차례로 채웁니다.
   - **개인정보처리방침**: `https://<아이디>.github.io/gameju/reaper/privacy.html`
     - 올리기 전에 `privacy.html` 안의 `[운영자 이름]` `[문의 이메일]` `[시행일]` 을 실제 정보로 바꾸세요.
   - **앱 액세스**: "모든 기능을 제한 없이 이용 가능"을 고릅니다. 게스트로 시작할 수 있어요.
   - **광고**: **예, 광고 포함**
   - **콘텐츠 등급**: 설문에 답합니다(폭력성 거의 없음, 앱 내 구매 있음, 사용자 간 소통 있음(방명록)).
   - **타겟층**: 만 13세 이상을 권장해요. 어린이 대상이면 광고 · 로그인 규정이 훨씬 까다로워요.
   - **데이터 보안**: 아래 표대로 답합니다.

     | 데이터 | 수집 | 목적 |
     |---|---|---|
     | 이메일 주소 · 사용자 ID | 예 (소셜 로그인 시) | 계정 관리 |
     | 게임 진행 · 닉네임 · 방명록 | 예 | 앱 기능 |
     | 구매 기록 | 예 | 앱 기능 |
     | 기기 또는 기타 ID (광고 ID) | 예 | 광고 |
     | 앱 상호작용 · 비정상 종료 로그 | 아니요 | — |

     - 전송 중 암호화: **예**
     - 계정 삭제 요청 방법: **앱 안 설정 → 계정 삭제**, 웹 주소에는 개인정보처리방침 주소를 적어요.
3. **스토어 등록정보**에 넣을 것:
   - 앱 아이콘 512×512: `app/assets/icon-only.png` 를 512로 줄여서
   - 그래픽 이미지 1024×500
   - 휴대전화 스크린샷 2장 이상: `docs/store/` 의 스크린샷
   - 간단한 설명(80자)과 자세한 설명
4. **수익 창출 → 인앱 상품**에서 아래 ID 로 **관리형 상품**을 만들고 가격을 정한 뒤 **활성화**합니다.

   | 상품 ID | 이름 | 기준 가격 |
   |---|---|---|
   | `jade_100` | 옥 100개 | ₩1,200 |
   | `jade_550` | 옥 550개 | ₩5,900 |
   | `jade_1200` | 옥 1,200개 | ₩12,000 |
   | `starter_pack` | 신입 차사 패키지 | ₩1,200 |
   | `promo_pack` | 승진 응원 패키지 | ₩3,300 |
   | `yeomra_seal_7d` | 염라의 인장 (7일) | ₩9,900 |
   | `remove_ads` | 광고 제거 | ₩6,900 |
   | `chair_cc0` ~ `chair_cc8` | 현금 의자 9종 | 게임 안 가격대로 |

   > 인앱 상품은 결제 기능이 든 빌드(AAB)를 **한 번 업로드한 뒤에** 만들 수 있어요.
5. **테스트 → 내부 테스트**에 AAB 를 올리고, 내 계정을 테스터로 넣어 결제를 시험합니다.
   - **라이선스 테스트** 계정은 실제로 돈이 나가지 않아요(설정 → 라이선스 테스트).
6. **비공개 테스트** 12명 · 14일을 마치고 → **프로덕션** 출시를 신청합니다.

---

## 5. 앱스토어 출시 (Mac 필요)

### 5-1. Xcode 설정
1. `npm run ios` 를 실행하면 Xcode 가 열려요.
2. 왼쪽 **App** → **Signing & Capabilities** 로 갑니다.
   - **Team**: 내 개발자 계정
   - **Bundle Identifier**: `com.jeoseungsaja.idle`
   - **+ Capability** 로 **In-App Purchase**, **Sign in with Apple** 을 추가해요.
3. **General → Deployment Info**: iPhone, 세로(Portrait)만 체크합니다.

### 5-2. App Store Connect
1. https://appstoreconnect.apple.com → **나의 앱 → + 신규 앱**
   - 번들 ID 를 고르고, SKU 는 `reaper001`, 기본 언어는 한국어로 합니다.
2. **앱 내 구입**에서 위 표와 **같은 상품 ID**로 만듭니다.
   - 옥 · 패키지 · 인장 · 의자는 **소모품**으로 만들어요.
   - `remove_ads` 와 `starter_pack` 은 **비소모품**으로 만들어요.
   - 각각 스크린샷과 설명이 있어야 심사에 낼 수 있어요.
3. **앱 개인정보 보호**: 위 데이터 보안 표와 같이 답합니다.
   - 광고 ID 는 "추적에 사용됨: 예"로 답해요.
4. **앱 정보**:
   - 개인정보처리방침 URL과 지원 URL(문의 이메일 페이지나 깃허브 주소)을 넣어요.
   - 연령 등급은 설문에 답해요.
5. **심사 메모**에 아래 내용을 적어요.
   - "게스트로 시작하면 로그인 없이 모든 기능을 확인할 수 있습니다."
   - "계정 삭제: 설정 → 계정 삭제"
6. Xcode 에서 **Product → Archive → Distribute App → App Store Connect** 로 올립니다.
7. **TestFlight** 에서 샌드박스 계정으로 결제를 시험한 뒤 **심사 제출**합니다.

---

## 6. 업데이트할 때
1. 게임 코드를 고칩니다.
2. `reaper/js/config.js` 의 `APP.version` 을 올립니다.
3. `npm run sync` 를 실행합니다.
4. 버전을 올립니다.
   - **안드로이드**: `app/android/app/build.gradle` 의 `versionCode`(1→2→3…, 꼭 올리기)와 `versionName`
   - **iOS**: Xcode 의 Version · Build
5. 다시 빌드해서 업로드합니다.

## 7. 나중에 하면 좋은 것
- **영수증 서버 검증**
  - 지금은 스토어가 승인한 결제를 앱에서 바로 지급해요.
  - 이용자가 많아지면 RevenueCat 이나 iaptic 같은 검증 서비스를 붙여서 결제 조작을 막는 걸 권장해요.
  - `cordova-plugin-purchase` 는 `store.validator` 한 줄로 연결할 수 있어요.
- **푸시 알림** (파견 완료, 꽃 수확 알림): `@capacitor/local-notifications` 로 추가할 수 있어요.

## 8. 아이콘 · 스플래시 다시 만들기
`app/assets/` 의 그림을 바꿉니다.
- `icon-only.png` (1024×1024)
- `icon-foreground.png` (안드로이드 적응형 아이콘)
- `splash.png` (2732×2732)

그다음 실행합니다.
```bash
npm run assets
```
