// 에뮬레이터 안 게임(웹뷰)에 크롬 디버그 연결로 명령 보내기: node notif-test.js '<자바스크립트>'
(async () => {
  const list = await (await fetch('http://127.0.0.1:9222/json')).json();
  const page = list.find(p => p.type === 'page' && /index|localhost/.test(p.url)) || list.find(p => p.type === 'page') || list[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: process.argv[2], awaitPromise: true, returnByValue: true } }));
  const msg = await new Promise(r => ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id === 1) r(m); });
  const res = msg.result || {};
  if (res.exceptionDetails) console.log('JS 오류:', JSON.stringify(res.exceptionDetails).slice(0, 400));
  else console.log(typeof (res.result || {}).value === 'string' ? res.result.value : JSON.stringify(res.result || msg).slice(0, 400));
  ws.close(); process.exit(0);
})().catch(e => { console.log('CDP 오류', e.message); process.exit(0); });
