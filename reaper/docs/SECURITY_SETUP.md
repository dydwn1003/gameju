# 가짜 결제 막기 + 계정 정지 설정

조작된 앱(Lucky Patcher 같은 것)은 구글 결제 창 대신 가짜 창을 띄우고 "결제 성공"과 가짜 영수증(GPA 번호)을 게임에 넘긴다.
게임이 그 말만 믿고 옥을 주면 돈을 안 내고도 옥을 얻는다. 그래서 **서버가 구글 · 애플에 직접 물어본 뒤에만 지급**하게 바꿨다 (1.0.4부터).

순서대로 하면 된다. 비밀값(키)은 **채팅에 붙이지 말고 Supabase 대시보드에만** 넣는다.

---

## 1. SQL 실행 (계정 정지 · 결제 기록 표)

Supabase → SQL Editor → `docs/security_update.sql` 내용을 통째로 붙여 넣고 Run.

정지 · 해제 · 목록:
```sql
select ban_user('9A9D13D8', '변조된 앱으로 결제를 조작');   -- 회원 코드 · 닉네임 · 이메일 아무거나
select unban_user('9A9D13D8');
select * from ban_list;
```
- 정지되면 순위 · 집무실에서 바로 내려가고, 서버에 저장 · 순위를 더 쓸 수 없다 (서버에서 막음 · 옛 버전도 적용).
- **정지 화면**(게임을 못 하게 막는 창)은 1.0.4 이상에서 뜬다. 켜 둔 게임도 1분 안에 막힌다.

## 2. 구글 서비스 계정 만들기 (안드로이드 결제 확인용)

1. Google Cloud 콘솔(https://console.cloud.google.com) → Play Console 과 연결된 프로젝트 선택
   (없으면 새 프로젝트 만들기)
2. **API 및 서비스 → 라이브러리** → `Google Play Android Developer API` 검색 → **사용**
3. **IAM 및 관리자 → 서비스 계정 → 서비스 계정 만들기** → 이름 `iap-verify` → 만들기 (역할은 안 줘도 됨)
4. 만든 계정 → **키** 탭 → 키 추가 → 새 키 만들기 → **JSON** → 파일이 내려받아진다 (이 파일이 비밀값)
5. Play Console → **사용자 및 권한** → 새 사용자 초대 → 서비스 계정 이메일(`iap-verify@….iam.gserviceaccount.com`) 입력
   → 앱 권한에서 저승사자 키우기 선택 → **"재무 데이터 보기"**, **"주문 및 구독 관리"** 체크 → 초대
   (권한이 반영되는 데 최대 하루쯤 걸릴 수 있다)

## 3. 애플 앱 내 구입 키 만들기 (아이폰 결제 확인용)

1. App Store Connect → **사용자 및 액세스 → 통합 → 앱 내 구입** → 키 생성(+) → 이름 `iap-verify`
2. **Issuer ID**, **Key ID** 를 적어 두고, 키 파일(`SubscriptionKey_XXXX.p8`)을 내려받는다 (한 번만 받을 수 있음)

## 4. Supabase 에 비밀값 넣기

Supabase → **Edge Functions → Secrets** (Manage secrets) 에 추가:

| 이름 | 값 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT` | 2번 JSON 파일 내용 **전체** |
| `APPLE_ISSUER_ID` | 3번 Issuer ID |
| `APPLE_KEY_ID` | 3번 Key ID |
| `APPLE_PRIVATE_KEY` | 3번 .p8 파일 내용 전체 (`-----BEGIN PRIVATE KEY-----` 부터 끝까지) |

## 5. 결제 확인 함수 배포

Supabase → **Edge Functions → Deploy a new function → Via Editor**
- 이름: `verify-purchase`
- 내용: `server/supabase/functions/verify-purchase/index.ts` 통째로 붙여 넣기 → Deploy
- 함수 설정에서 **Verify JWT 끄기** (게스트도 결제할 수 있어서. 로그인 토큰은 함수 안에서 확인)

## 6. 1.0.4 출시 후 결제 검증 켜기

```sql
select set_iap_verify(true);    -- 켜기
select set_iap_verify(false);   -- 끄기 (문제가 생겼을 때 임시로)
```
- 켜기 전에 **진짜 결제를 한 번 해 보고** 옥이 잘 들어오는지 확인하는 걸 추천 (내부 테스트 트랙 · 테스트 카드).
- 켜면 1.0.4 이상 게임은 서버가 "진짜"라고 한 결제만 지급한다. 가짜면 "결제를 확인할 수 없어요" 안내만 뜬다.
- 서버에 잠깐 못 닿으면 지급을 미뤘다가 다음에 다시 확인한다 (구글은 3일 안에 확인 못 하면 자동 환불).
- 1.0.3 이하 옛 버전은 서버 검증을 모르므로, 켠 뒤에는 강제 업데이트(`set_app_version`)로 옛 버전을 막는다.

확인된 결제 기록 보기:
```sql
select * from iap_receipts order by created_at desc limit 50;
```
