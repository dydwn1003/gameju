# 저승사자 키우기 — 접속 통계 보기 (DAU · 신규 · 재접속률 · 플레이 시간)

> Supabase → **SQL Editor** → 아래를 붙여 넣고 **Run**.
> 처음 한 번은 최신 `server/schema.sql` 전체를 실행해 두어야 `stats` 표와 보기(view)가 생겨요.
> 게임(앱 1.0.0 빌드 124 이후)이 하루마다 기기별 한 줄씩 보내요. **게스트 포함**, 이름 · 이메일 · 광고 ID 없이 앱이 만든 무작위 번호로만 구분해요.
> 날짜는 모두 **한국 시간** 기준이에요.

## 매일 보는 것

**날짜별 한눈에** (DAU · 신규 · 평균 플레이 시간 · iOS/안드로이드 · 로그인 비율)
```sql
select * from stats_daily limit 30;
```

**재접속률 (리텐션)** — 처음 시작한 날 기준 1 · 3 · 7 · 14 · 30일 뒤에 다시 온 비율(%) · 아직 안 온 날은 빈칸
```sql
select * from stats_retention limit 30;
```

## 더 보기

**오늘 지금까지 접속자 (DAU)**
```sql
select count(*) as 오늘_접속 from stats where day = (now() at time zone 'Asia/Seoul')::date;
```

**WAU · MAU** (최근 7일 · 30일 동안 한 번이라도 들어온 사람)
```sql
select
  count(distinct dev) filter (where day > (now() at time zone 'Asia/Seoul')::date - 7)  as wau,
  count(distinct dev) filter (where day > (now() at time zone 'Asia/Seoul')::date - 30) as mau
from stats;
```

**전체 누적 유저 수 · 오늘 신규**
```sql
select count(distinct dev) as 누적_유저,
       count(distinct dev) filter (where first_day = (now() at time zone 'Asia/Seoul')::date) as 오늘_신규
from stats;
```

**1인당 하루 평균 플레이 시간 (분, 최근 7일)**
```sql
select round(avg(sec) / 60.0, 1) as 평균_분, round(percentile_cont(0.5) within group (order by sec)::numeric / 60, 1) as 중간값_분
from stats where day > (now() at time zone 'Asia/Seoul')::date - 7;
```

**언어별 · 기기별 (최근 7일 접속자)**
```sql
select lang as 언어, os as 기기, count(distinct dev) as 사람
from stats where day > (now() at time zone 'Asia/Seoul')::date - 7
group by lang, os order by 사람 desc;
```

**계급 분포 (오늘 들어온 사람의 현재 계급)** — 0 수습 차사 … 8 염라대왕
```sql
select rank as 계급, count(*) as 사람 from stats
where day = (now() at time zone 'Asia/Seoul')::date group by rank order by rank;
```

**앱 버전별 (업데이트가 얼마나 퍼졌나, 오늘)**
```sql
select ver as 버전, os as 기기, count(*) as 사람 from stats
where day = (now() at time zone 'Asia/Seoul')::date group by ver, os order by 사람 desc;
```

**시간대가 아니라 "하루 몇 번 들어오나"** (최근 7일 평균 접속 횟수 분포)
```sql
select sessions as 하루_접속_횟수, count(*) as 건수 from stats
where day > (now() at time zone 'Asia/Seoul')::date - 7 group by sessions order by sessions;
```

---

## 알아 두기
- **DAU**: 그날 게임을 켠 기기 수 · **신규**: 그날 처음 시작한 기기 수
- **d1**: 처음 시작한 다음 날 다시 들어온 비율 (방치형 게임은 보통 30~40% 이상이면 좋아요) · **d7**: 일주일 뒤
- 같은 사람이 기기를 바꿔도 **로그인해서 같은 저장을 쓰면 한 사람**으로 세요. 게스트가 앱을 지웠다 다시 깔면 새 사람으로 세요.
- 플레이 시간은 화면을 켜 둔 시간만 (분 단위), 2분 넘게 나갔다 오면 접속 1회 더.
- 오래된 기록 지우기 (예: 1년 지난 것): `delete from stats where day < (now() at time zone 'Asia/Seoul')::date - 365;`
