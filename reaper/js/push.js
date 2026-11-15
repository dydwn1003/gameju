// ===== 앱 알림 (휴대폰 안에서 예약하는 로컬 알림) =====
// "언제 무엇이 다 차는지" 계산해서 예약한다. 켜 둔 동안에도 미리 예약해 두고(아이폰 대비), 떠날 때 한 번 더 맞춘다.
// 서버가 필요 없고, 앱(안드로이드 · iOS)에서만 동작한다.
const Push = (() => {
  const H = 3600e3;
  const QUIET_FROM = 23, QUIET_TO = 8; // 밤 11시 ~ 아침 8시에는 울리지 않고 아침 8시로 미룸
  const S = () => Game.S;
  // 받침 있으면 '이', 없으면 '가'
  const josa = w => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? '이' : '가'; };
  const on = () => S() && S().kind && S().push !== false;

  // 밤이면 아침 8시로 미루기
  function wake(at, id) {
    const d = new Date(at), h = d.getHours();
    if (h >= QUIET_FROM || h < QUIET_TO) {
      if (h >= QUIET_FROM) d.setDate(d.getDate() + 1);
      d.setHours(QUIET_TO, ((id || 0) * 7) % 20, 0, 0); // 알림마다 정해진 분 (매번 바뀌면 1분마다 다시 예약하게 됨)
    }
    return d.getTime();
  }

  // 지금 앱을 떠난다고 할 때 보낼 알림 목록: { id, at(ms), title, body }
  function plan(now) {
    now = now || Date.now();
    // pri: 겹칠 때 어떤 알림을 앞세울지 (작을수록 중요) · short: 묶을 때 쓰는 짧은 이름
    const s = S(), out = [], add = (id, sec, title, body, pri, short, exact) => { if (sec > 60) out.push({ id, at: now + sec * 1000, title, body, pri, short, exact }); };
    const name = s.name || '차사', who = I18N.on ? name : /차사$/.test(name) ? name + '님' : name + ' 차사님';
    const inc = Game.incomePerSec(true), cap = Game.offHours() * 3600;
    // 실제 받는 양과 같게 (예전엔 0.6 으로 5배 많게 적혀 있었음) · 숫자는 언어에 맞게 (한국어 1.2만 · 영어 12K · 일본어/중국어 1.2万)
    const num = v => { const L = I18N.lang || 'ko'; if (L === 'ko') return fmt(v); try { return new Intl.NumberFormat(L === 'zh' ? 'zh-CN' : L === 'ja' ? 'ja-JP' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(v)); } catch (e) { return String(Math.round(v)); } };
    const amt = sec => num(inc * Math.min(sec, cap) * Game.OFFLINE_RATE);

    // 1) 자리 비운 동안 쌓이는 혼: 절반 · 가득
    if (inc > 0) {
      add(1, cap * 0.5, '📜 저승 장부가 절반 찼어요', `${who}, 자리 비운 사이 혼 ${amt(cap * 0.5)}이 쌓였어요. 들러서 거둬 가세요!`, 6, '장부 절반');
      add(2, cap, '⚠️ 저승 장부가 가득 찼어요', `혼 ${amt(cap)}이 꽉 찼어요. 이제부터는 더 쌓이지 않아요!`, 1, '장부 가득');
    }
    // 2) 파견이 끝날 때 (칸마다)
    (s.expe || []).forEach((x, i) => {
      const E = EXPEDITIONS.find(e => e.id === x.id); if (!E) return;
      add(10 + i, Life.timerLeft('expe', i), '🏮 파견 나간 졸개들이 돌아왔어요', '혼 · 씨앗 · 옥을 가지고 돌아왔어요. 보상을 받고 다시 보내 주세요!', 2, '파견 완료');
    });
    // 3) 꽃밭: 칸마다 꽃이 필 때 (같은 때 피면 하나로 묶임)
    (s.garden || []).forEach((p, i) => { if (!p) return; const st = Life.plotState(i); if (!st.ready) add(20 + i, st.left, '🌸 꽃밭에 꽃이 피었어요', `${st.f.name}${josa(st.f.name)} 활짝 피었어요. 수확해서 탕약을 달여 보세요!`, 3, '꽃 수확'); });
    // 4) 집무실 결재 서류 3건 가득
    if (s.docs) { const n = Life.docsCount(); if (n < 3) add(30, Life.docsNext() + (2 - n) * 2 * 3600, '📂 결재 서류가 가득 쌓였어요', '판관 나리가 결재를 기다려요. 서류 3건을 처리하고 보상을 받으세요.', 4, '결재 서류'); }
    // 5-1) 까치 편지 도착 (우편함이 비어 있을 때 다음 편지)
    if (s.mail && Life.mailCount() === 0) add(33, Life.mailNext(), '🐦 까치가 편지를 물고 왔어요', '저승 곳곳에서 모은 선물이 들어 있어요. 들어와서 열어 보세요!', 6, '까치 우편');
    // 5) 까치 우편함 가득
    if (s.mail) { const n = Life.mailCount(); if (n < MAIL_MAX) add(31, Life.mailNext() + (MAIL_MAX - 1 - n) * 4 * 3600, '🐦 까치 우편함이 가득 찼어요', '까치가 선물을 잔뜩 물어 왔어요. 우편함이 넘치기 전에 열어 보세요!', 5, '까치 우편'); }
    // 6) 백귀야행
    if (s.parade && s.parade.next > now) add(32, (s.parade.next - now) / 1000, '👹 백귀야행이 나타났어요', '요괴 행렬이 저승 길을 지나가요. 지금 들어오면 보상을 받을 수 있어요!', 7, '백귀야행');
    // 7) 아침 9시: 출석 · 일일 의뢰 · 운세가 새로 열렸다고 (하루 기준은 한국 시간 자정) · 3일치 미리
    //    오늘 아직 출석 안 했고 9시 전이면 오늘 9시부터, 아니면 내일 9시부터
    { const d = new Date(now); d.setHours(9, 0, 0, 0); if (d.getTime() <= now || !Game.attendState().can) d.setDate(d.getDate() + 1);
      const M = [['📅 오늘의 출석 · 의뢰가 열렸어요', `출석 도장 · 일일 의뢰 · 무당 운세가 기다려요. 연속 출석 7일째엔 옥 ${ATTEND[6]}개!`],
                 ['📅 출석 도장 찍으러 오세요', '오늘의 출석 보상과 새 의뢰가 기다리고 있어요. 연속 출석이 끊기기 전에!'],
                 ['📅 저승 근무 시간이에요', '출석 보상 · 일일 의뢰 · 백귀야행이 새로 준비됐어요.']];
      for (let k = 0; k < 3; k++) { const t = new Date(d); t.setDate(d.getDate() + k); add(40 + k, (t.getTime() - now) / 1000, M[k][0], M[k][1], 8, '출석', true); } }
    // 7-1) 지도 소품: 오래 걸리는 것(망각의 석상 2시간 · 장승 4시간 · 돌탑 6시간)이 다시 열릴 때 (가장 먼저 열리는 하나)
    { const long = Object.keys(Life.PROP).filter(k => Life.PROP[k].cd >= 2 * 3600); let first = null;
      Object.entries(s.props || {}).forEach(([key, t]) => { const kd = long.find(k => key.startsWith(k)); if (kd && t > now && (!first || t < first.t)) first = { t, kd }; });
      if (first) add(34, (first.t - now) / 1000, '🪨 지도 소품을 다시 살펴볼 수 있어요', '장승 · 돌탑 · 망각의 석상에 다시 들러 보세요. 혼 · 옥 · 소환권이 나올지도 몰라요!', 7, '지도 소품'); }
    // 7-2) 염라의 인장 (7일 수확 2배): 하루 남았을 때 · 끝났을 때
    if (s.sealUntil && s.sealUntil > now) {
      add(36, (s.sealUntil - now) / 1000 - 86400, '📜 염라의 인장이 하루 남았어요', '모든 혼 수확 2배가 내일 끝나요. 상점에서 다시 사면 7일 연장돼요.', 5, '염라의 인장');
      add(37, (s.sealUntil - now) / 1000, '📜 염라의 인장 효과가 끝났어요', '모든 혼 수확 2배가 끝났어요. 상점에서 다시 7일 동안 켤 수 있어요.', 5, '염라의 인장');
    }
    // 8) 오래 안 들어올 때
    add(50, 24 * 3600, '🕯️ 저승이 조용하네요…', `${who}이 안 계신 사이 원귀들이 늘어나고 있어요.`, 9, '');
    add(51, 72 * 3600, '👻 원귀들이 날뛰고 있어요', '저승 장부도 가득 찼어요. 잠깐 들러서 혼을 거두고 가세요!', 9, '');

    // 9) 운영자가 보낸 예약 알림 (서버 push 목록, 밤 시간 규칙 없이 그 시각에 · 묶지 않음)
    const ops = ext.filter(x => x.at > now + 60e3 && x.at - now < 8 * 24 * H).slice(0, 5).map((x, i) => ({ id: 100 + i, at: x.at, title: x.title, body: x.body || '', op: 1 }));
    // 밤 시간 미루기 → 10분 안에 겹치는 알림은 하나로 묶기 (가장 중요한 것이 제목) · 8일 넘게 먼 건 빼기
    out.forEach(n => { if (!n.exact) n.at = wake(n.at, n.id); });
    out.sort((a, b) => a.at - b.at);
    const groups = [];
    out.filter(n => n.at - now < 8 * 24 * H).forEach(n => { const g = groups.find(g => Math.abs(g[0].at - n.at) < 10 * 60e3); if (g) g.push(n); else groups.push([n]); });
    return ops.concat(groups.map(g => {
      g.sort((a, b) => a.pri - b.pri); const top = g[0];
      if (g.length === 1) return top;
      // 장부 절반 + 가득이 같이 있으면 가득만
      const rest = g.slice(1).filter(n => n.short && n.short !== top.short && !(top.short === '장부 가득' && n.short === '장부 절반'));
      const names = [...new Set(rest.map(n => n.short))];
      return { id: top.id, at: g[0].at, title: top.title, body: names.length ? `${top.body}\n+ ${names.map(x => I18N.t(x)).join(' · ')}도 기다리고 있어요` : top.body };
    }));
  }

  // 예약: 앱을 켜 둔 동안에도 미리 예약해 둠 (1분마다 확인, 바뀐 게 있을 때만 다시 예약)
  // 아이폰은 앱이 뒤로 가는 순간 게임 코드가 거의 바로 멈춰서, 떠날 때만 예약하면 예약이 끝나기 전에 멈춰 알림이 하나도 안 갔음
  // 켜 둔 동안에는 15분 넘게 남은 알림만 예약 (게임 중에 알림이 울리지 않게) · 떠날 때는 1분 넘게 남은 것까지 모두
  // 운영자 예약 알림: 서버의 push 목록 (SQL send_push). 켜 둔 동안 10분마다 받아 둠
  // 게임을 켜 둔 사람에게는 그 시각에 게임 안 알림으로, 꺼 둔 사람에게는 휴대폰 알림으로
  let ext = [], extAt = 0;
  async function fetchExt(force) {
    if (typeof Cloud === 'undefined' || !Cloud.ready() || (!force && Date.now() - extAt < 10 * 60e3)) return;
    extAt = Date.now();
    try { const snap = await Cloud.db.collection('push').orderBy('at', 'desc').limit(10).get(); ext = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).filter(x => x && x.at && x.title); } catch (e) {}
  }
  // 켜 둔 동안 시각이 된 운영자 알림 → 게임 안에서 한 번 보여 줌
  function dueNow() {
    const s = S(); if (!s) return []; s.pushSeen = s.pushSeen || {};
    const now = Date.now(), due = ext.filter(x => x.at <= now && now - x.at < 6 * H && !s.pushSeen[x.id]);
    due.forEach(x => (s.pushSeen[x.id] = now)); return due;
  }
  let lastSig = '', chain = Promise.resolve();
  // 예약은 한 번에 하나씩 차례로 (떠날 때 예약과 1분 예약이 겹쳐 서로 지우지 않게)
  function sync(minAheadSec, force) { chain = chain.then(() => syncNow(minAheadSec, force)).catch(() => {}); return chain; }
  async function syncNow(minAheadSec, force) {
    if (!Native.isApp()) return;
    if (!on()) { if (lastSig !== 'off') { lastSig = 'off'; try { await Native.notifyClear(); } catch (e) {} } return; }
    const now = Date.now(), list = plan(now).filter(n => n.at - now >= minAheadSec * 1000);
    const sig = list.map(n => n.id + '@' + Math.round(n.at / 600e3)).join(','); // 10분 단위로 비교 (매분 다시 예약하지 않게)
    if (!force && sig === lastSig) return;
    lastSig = sig;
    try { await Native.notifySchedule(list); } catch (e) { lastSig = ''; }
  }
  // 아이폰: 게임을 켜 둔 동안 울리는 알림은 화면에 안 뜨게 해 둠(capacitor.config presentationOptions: []) → 1분 넘게 남은 것까지 미리 다 예약
  // (아이폰은 앱이 뒤로 가는 순간 코드가 멈춰서, 떠날 때 예약은 자주 실패함)
  // 안드로이드: 켜 둔 동안 울리면 알림이 떠서 15분 넘게 남은 것만 미리 · 나머지는 떠날 때 예약 (안드로이드는 떠날 때 예약이 잘 됨)
  const ahead = () => (Native.platform() === 'ios' ? 60 : 15 * 60);
  const keep = async () => { await fetchExt(); return sync(ahead()); };                        // 켜 둔 동안 (1분마다)
  const leave = () => sync(60, true); // 떠날 때 (안드로이드 · 시간이 되면 아이폰도)
  const back = async () => { await fetchExt(true); return sync(ahead(), true); };                  // 돌아왔을 때: 곧 울릴 알림은 지우고 다시 예약
  return { plan, leave, back, keep, on, dueNow, fetchExt };
})();
