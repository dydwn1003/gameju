// 테스트 전용: claude.ai 공유 db를 흉내 낸다 (window.__store를 탭끼리 공유하지 않음)
window.__store = window.__store || {};
(() => {
  const st = window.__store, me = window.__uid || 'u_me';
  const snapDoc = (path) => ({ id: path.split('/').pop(), exists: path in st, data: () => st[path] && JSON.parse(JSON.stringify(st[path])) });
  const q = (col, filters = [], order = null, lim = 1000) => ({
    where: (f, op, v) => q(col, filters.concat([[f, op, v]]), order, lim), orderBy: (f, d) => q(col, filters, [f, d], lim), limit: n => q(col, filters, order, n),
    get: async () => { let ks = Object.keys(st).filter(k => k.startsWith(col + '/') && k.split('/').length === col.split('/').length + 1);
      ks = ks.filter(k => filters.every(([f, op, v]) => { const x = st[k][f]; return op === 'array-contains' ? Array.isArray(x) && x.includes(v) : op === '>' ? x > v : x === v; }));
      if (order) ks.sort((a, b) => ((st[a][order[0]] || 0) - (st[b][order[0]] || 0)) * (order[1] === 'desc' ? -1 : 1));
      ks = ks.slice(0, lim); return { docs: ks.map(snapDoc), size: ks.length, empty: !ks.length }; } });
  const db = { doc: p => ({ get: async () => snapDoc(p), set: async d => { st[p] = JSON.parse(JSON.stringify(d)); }, update: async d => { st[p] = Object.assign(st[p] || {}, d); }, delete: async () => { delete st[p]; } }), collection: c => q(c) };
  const names = { u_me: '나', u_a: '김차사', u_b: '박판관' };
  const user = { isOwner: async () => !!window.__owner, id: async () => me, profiles: async ids => Object.fromEntries((Array.isArray(ids) ? ids : [ids]).map(i => [i, { id: i, name: names[i] || '' }])) };
  st['offices/u_a'] = { rank: 5, kind: 'f', rb: 0, score: 120, likes: 3, at: Date.now() - 1000, placed: [{ id: 'irwol', gx: 8, gy: 1 }, { id: 'rc5', gx: 8.75, gy: 13.5 }, { id: 'gyoui', gx: 2, gy: 30 }, { id: 'moonjar', gx: 16, gy: 25 }, { id: 'bonsai', gx: 3, gy: 22 }, { id: 'lotus', gx: 12, gy: 33 }] };
  st['offices/u_b'] = { rank: 7, kind: 'm', rb: 0, score: 210, likes: 9, at: Date.now() - 5000, placed: [{ id: 'goldhaechi', gx: 15, gy: 20 }, { id: 'cc7', gx: 8.6, gy: 13.5 }] };
  st['visits/u_b'] = { likedIds: ['u_a'], likeDay: {}, noteIds: ['u_a'], notes: { u_a: { m: 0, at: Date.now() - 3600e3 } } };
  window.claude = { use: async n => (n === 'db' ? db : n === 'user' ? user : null) };
})();
