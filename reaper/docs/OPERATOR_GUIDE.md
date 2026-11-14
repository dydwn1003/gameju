# 저승사자 키우기 — 운영자 안내

운영자는 **따로 만드는 계정이 아니에요.** 게임에서 평소처럼 로그인한 내 계정을 운영자로 **등록**하면, 그 계정으로 게임 안에서 운영자 버튼이 보여요.

## 1. 운영자 등록 (한 번만)
1. 폰에서 게임을 켜고 **설정 → 로그인** (구글 · 카카오 · 애플 중 하나)
2. Supabase → **SQL Editor** → 아래 한 줄 **Run** (최신 `server/schema.sql` 을 한 번 실행해 둔 뒤)
   ```sql
   select add_admin('내이메일@gmail.com');
   ```
   - 이메일 대신 게임 **닉네임**도 돼요: `select add_admin('갓주');`
   - 애플 로그인은 이메일이 `@privaterelay.appleid.com` 으로 바뀔 수 있어요 → 닉네임으로 넣는 게 편해요
3. 게임을 껐다 켜면 **설정** 위에 `🛡️ 운영자 모드` 가 떠요

| 확인 · 변경 | SQL |
|---|---|
| 운영자 목록 | `select * from admin_list;` |
| 운영자 빼기 | `delete from public.admins where user_id = '<admin_list 의 user_id>';` |

> 여러 계정(구글 · 카카오)으로 로그인한다면 각각 등록해 주세요.

## 2. 게임 안에서 할 수 있는 것 (운영자 계정)
| 할 일 | 어디서 |
|---|---|
| 📢 공지 쓰기 · 삭제 | 상단 📢 → **✍️ 공지 쓰기** / 공지 옆 **삭제** |
| 📮 우편 보내기 · 삭제 | 상단 📮 → **📤 우편 보내기** (받는 사람 5종) / 우편 옆 **삭제** |
| 📨 1:1 문의 · 신고 답변 | **설정 → 📨 문의 답변** → 답변 대기 / 전체 |
| 🚫 방명록 글 숨기기 · 작성 금지 | 방명록 글의 운영자 버튼 |

방명록 **신고**는 1:1 문의함에 `신고` 분류로 들어와요.

## 3. SQL 로 하기 (컴퓨터에서 한꺼번에 볼 때 편해요)

### 1:1 문의 · 신고
```sql
-- 답변 대기만 (최신 순)
select id, category, nick, body, asked_kst from inquiry_list where replied = false;

-- 전부 (기기 정보 info 포함)
select * from inquiry_list;

-- 답변하기
select reply_inquiry(12, '확인했어요. 불편을 드려 죄송해요!');

-- 답변 + 그 사람에게 보상 우편 (옥 · 소환권 · 혼(시간치), 30일 동안 받을 수 있음)
select reply_inquiry(12, '결제 상품을 우편으로 보내 드렸어요.', p_jade => 550);
select reply_inquiry(12, '오류 보상이에요.', p_jade => 100, p_tickets => 2);
```
- 답변은 그 사람의 **설정 → 1:1 문의** 에 바로 보여요.
- 보상 우편은 그 사람 우편함에 **N** 표시와 함께 떠요.

### 우편
- 상황별 SQL 모음: `docs/MAIL_SQL.md`
- 예: `select send_mail('점검 보상', 'old', p_jade => 100, p_hours => 2);`
- 보낸 우편 보기: `select * from mail_list;`

### 누가 문의했는지 찾기 (회원 코드)
- 로그인한 유저는 게임 **설정 → 계정** 줄에 **회원 코드**(8자리, 예 `3F9A21C7`)가 보여요. 1:1 문의에는 자동으로 들어가요.
- 게스트는 1:1 문의 대신 **이메일**로 문의하는데, 메일 맨 아래에 **기기 코드**(`G`로 시작)가 자동으로 붙어요. 게스트 기록은 서버에 없어서, 보상은 로그인을 부탁한 뒤 우편으로 보내요.
```sql
-- 문의 목록: 회원 코드 · 이메일 · 로그인 방식(apple/google/kakao)까지
select id, category, nick, code, email, login, body, asked_kst from inquiry_list where replied = false;

-- 회원 코드 · 닉네임 · 이메일 아무거나로 계정 찾기
-- → 가입일 · 마지막 로그인 · 계급 · 옥 · 결제 거래 번호(purchases) · 산 상품 횟수(bought)
select * from user_find('3F9A21C7');
select * from user_find('닉네임');
select * from user_find('someone@gmail.com');
```

### 결제 문의가 왔을 때
0. `user_find('회원 코드')` 의 **purchases** 에 그 거래 번호가 있으면 이미 지급된 결제예요 (애플 거래 번호 · 구글 주문 번호 GPA.…)
1. **구글**: Play Console → **주문 관리** 에서 주문 번호 · 결제 확인 → 못 받았으면 `reply_inquiry(..., p_jade => 상품만큼)` · 환불도 여기서 직접 할 수 있어요
2. **애플**: 애플은 개발자가 직접 환불할 수 없어요 → 답변으로 "reportaproblem.apple.com 에서 환불 요청" 안내, 또는 우편으로 보상
3. 같은 결제가 두 번 들어왔다면 그대로 두기 (사용자에게 손해 없음)

### 새 버전 안내 (게임을 켤 때 '새 버전이 나왔어요' 창)
스토어에 새 버전을 올리고 **심사가 끝나 배포된 뒤** 아래를 실행하세요. (최신 `server/schema.sql` 을 한 번 실행해 두어야 함)
```sql
-- 안드로이드: 빌드 140 보다 낮으면 안내 창 (스토어 가기 / 닫기)
select set_app_version('android', 140);
-- 꼭 업데이트해야 할 때: 135 보다 낮은 빌드는 닫기 없이 '스토어 가기'만
select set_app_version('android', 140, 135);
-- 아이폰 (빌드 번호는 앱스토어 커넥트 / TestFlight 의 빌드 번호)
select set_app_version('ios', 12);
-- 안내 문구 바꾸기 (두 기기 공통)
select set_app_version('android', 140, 0, '새 영물과 이벤트가 추가됐어요!');
-- 지금 설정 보기
select data from public.docs where path = 'config/version';
```
- 빌드 번호 = 깃허브 릴리스 이름 끝 숫자 (예: `reaper-apk-reaper-1.0.0-140` → 140)
- 이 안내 창은 이 기능이 들어간 빌드부터 보여요.
- 아이폰 '스토어 가기'가 앱 페이지로 바로 가려면 `js/config.js` 의 `store.iosId` 에 앱스토어 커넥트 → 앱 정보 → **Apple ID**(숫자)를 넣어 주세요. 비워 두면 앱스토어 검색 화면으로 열려요.

### 운영자는 순위에서 빠져요
- 운영자로 등록된 계정은 **순위표에 오르지 않아요** (게임이 올리지 않고, `add_admin` 할 때 올라가 있던 기록도 지움).
- 운영자도 순위표는 볼 수 있어요. 운영자에서 빼면 다음에 게임을 켤 때 다시 순위에 올라가요.

## 4. 지켜 주세요
- **service_role / secret 키는 어디에도 붙여 넣지 않기** (SQL Editor 는 키 없이 돼요)
- 문의에 담긴 이메일 · 기기 정보는 답변 목적으로만 보기
- 운영자 계정으로는 순위 경쟁 · 이벤트 당첨을 하지 않기
