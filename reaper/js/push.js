// ===== 앱 알림 (휴대폰 안에서 예약하는 로컬 알림) =====
// 앱을 내리거나 끌 때 "언제 무엇이 다 차는지" 계산해서 예약하고, 다시 들어오면 모두 지운다.
// 서버가 필요 없고, 앱(안드로이드 · iOS)에서만 동작한다.
const Push = (() => {
  const H = 3600e3;
  const QUIET_FROM = 23, QUIET_TO = 8; // 밤 11시 ~ 아침 8시에는 울리지 않고 아침 8시로 미룸
  const S = () => Game.S;
  // 받침 있으면 '이', 없으면 '가'
  const josa = w => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? '이' : '가'; };
  const on = () => S() && S().kind && S().push !== false;

  // 밤이면 아침 8시로 미루기
  function wake(at) {
    const d = new Date(at), h = d.getHours();
    if (h >= QUIET_FROM || h < QUIET_TO) {
      if (h >= QUIET_FROM) d.setDate(d.getDate() + 1);
      d.setHours(QUIET_TO, Math.floor(Math.random() * 20), 0, 0);
    }
    return d.getTime();
  }

  // 지금 앱을 떠난다고 할 때 보낼 알림 목록: { id, at(ms), title, body }
  function plan(now) {
    now = now || Date.now();
    // pri: 겹칠 때 어떤 알림을 앞세울지 (작을수록 중요) · short: 묶을 때 쓰는 짧은 이름
    const s = S(), out = [], add = (id, sec, title, body, pri, short) => { if (sec > 60) out.push({ id, at: now + sec * 1000, title, body, pri, short }); };
    const name = s.name || '차사', who = I18N.on ? name : /차사$/.test(name) ? name + '님' : name + ' 차사님';
    const inc = Game.incomePerSec(true), cap = Game.offHours() * 3600;
    const amt = sec => fmt(inc * Math.min(sec, cap) * 0.6);

    // 1) 자리 비운 동안 쌓이는 혼: 절반 · 가득
    if (inc > 0) {
      add(1, cap * 0.5, '📜 저승 장부가 절반 찼어요', `${who}, 자리 비운 사이 혼 ${amt(cap * 0.5)}이 쌓였어요. 들러서 거둬 가세요!`, 6, '장부 절반');
      add(2, cap, '⚠️ 저승 장부가 가득 찼어요', `혼 ${amt(cap)}이 꽉 찼어요. 이제부터는 더 쌓이지 않아요!`, 1, '장부 가득');
    }
    // 2) 파견이 끝날 때 (칸마다)
    (s.expe || []).forEach((x, i) => {
      const E = EXPEDITIONS.find(e => e.id === x.id); if (!E) return;
      add(10 + i, Life.timerLeft('expe', i), `🏮 ${E.name} 완료`, '졸개들이 혼 · 씨앗 · 옥을 가지고 돌아왔어요. 보상을 받아 주세요!', 2, '파견 완료');
    });
    // 3) 꽃밭: 가장 먼저 피는 꽃
    let first = null;
    (s.garden || []).forEach((p, i) => { if (!p) return; const st = Life.plotState(i); if (!st.ready && (!first || st.left < first.left)) first = { left: st.left, f: st.f }; });
    if (first) add(20, first.left, '🌸 꽃밭에 꽃이 피었어요', `${first.f.name}${josa(first.f.name)} 활짝 피었어요. 수확해서 탕약을 달여 보세요!`, 3, '꽃 수확');
    // 4) 집무실 결재 서류 3건 가득
    if (s.docs) { const n = Life.docsCount(); if (n < 3) add(30, Life.docsNext() + (2 - n) * 2 * 3600, '📂 결재 서류가 가득 쌓였어요', '판관 나리가 결재를 기다려요. 서류 3건을 처리하고 보상을 받으세요.', 4, '결재 서류'); }
    // 5-1) 까치 편지 도착 (우편함이 비어 있을 때 다음 편지)
    if (s.mail && Life.mailCount() === 0) add(33, Life.mailNext(), '🐦 까치가 편지를 물고 왔어요', '저승 곳곳에서 모은 선물이 들어 있어요. 들어와서 열어 보세요!', 6, '까치 우편');
    // 5) 까치 우편함 가득
    if (s.mail) { const n = Life.mailCount(); if (n < MAIL_MAX) add(31, Life.mailNext() + (MAIL_MAX - 1 - n) * 4 * 3600, '🐦 까치 우편함이 가득 찼어요', '까치가 선물을 잔뜩 물어 왔어요. 우편함이 넘치기 전에 열어 보세요!', 5, '까치 우편'); }
    // 6) 백귀야행
    if (s.parade && s.parade.next > now) add(32, (s.parade.next - now) / 1000, '👹 백귀야행이 나타났어요', '요괴 행렬이 저승 길을 지나가요. 지금 들어오면 보상을 받을 수 있어요!', 7, '백귀야행');
    // 7) 출석 (출석 보상은 매일 아침 9시에 바뀜)
    const nextDay = new Date(now); nextDay.setUTCHours(24, 0, 0, 0); // 한국 시각 아침 9시
    add(40, (nextDay.getTime() - now) / 1000 + 30 * 60, '📅 오늘의 출석 보상', `출석부에 도장을 찍고 옥을 받아 가세요. 연속 출석하면 7일째 옥 ${ATTEND[6]}개!`, 8, '출석');
    // 8) 오래 안 들어올 때
    add(50, 24 * 3600, '🕯️ 저승이 조용하네요…', `${who}이 안 계신 사이 원귀들이 늘어나고 있어요.`, 9, '');
    add(51, 72 * 3600, '👻 원귀들이 날뛰고 있어요', '저승 장부도 가득 찼어요. 잠깐 들러서 혼을 거두고 가세요!', 9, '');

    // 밤 시간 미루기 → 10분 안에 겹치는 알림은 하나로 묶기 (가장 중요한 것이 제목) · 8일 넘게 먼 건 빼기
    out.forEach(n => (n.at = wake(n.at)));
    out.sort((a, b) => a.at - b.at);
    const groups = [];
    out.filter(n => n.at - now < 8 * 24 * H).forEach(n => { const g = groups.find(g => Math.abs(g[0].at - n.at) < 10 * 60e3); if (g) g.push(n); else groups.push([n]); });
    return groups.map(g => {
      g.sort((a, b) => a.pri - b.pri); const top = g[0];
      if (g.length === 1) return top;
      // 장부 절반 + 가득이 같이 있으면 가득만
      const rest = g.slice(1).filter(n => n.short && n.short !== top.short && !(top.short === '장부 가득' && n.short === '장부 절반'));
      const names = [...new Set(rest.map(n => n.short))];
      return { id: top.id, at: g[0].at, title: top.title, body: names.length ? `${top.body}\n+ ${names.map(x => I18N.t(x)).join(' · ')}도 기다리고 있어요` : top.body };
    });
  }

  // 앱을 떠날 때: 예약 / 돌아올 때: 모두 취소
  async function leave() { if (!Native.isApp()) return; if (!on()) { await Native.notifyClear(); return; } try { await Native.notifySchedule(plan()); } catch (e) {} }
  async function back() { if (Native.isApp()) try { await Native.notifyClear(); } catch (e) {} }
  return { plan, leave, back, on };
})();
