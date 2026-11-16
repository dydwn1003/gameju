// 에뮬레이터 안 게임(웹뷰)에 크롬 디버그 연결로 명령 보내기: node notif-test.js '<자바스크립트>'
(async () => {
  const list = await (await fetch('http://127.0.0.1:9222/json')).json();
  const page = list.find(p => p.type === 'page') || list[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: process.argv[2], awaitPromise: true, returnByValue: true } }));
  const msg = await new Promise(r => ws.onmessage = e => r(JSON.parse(e.data)));
  console.log(JSON.stringify(msg.result && msg.result.result ? msg.result.result.value : msg));
  ws.close(); process.exit(0);
})().catch(e => { console.log('CDP 오류', e.message); process.exit(0); });
