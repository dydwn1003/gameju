// ===== 효과음 · 배경음 (WebAudio 합성, 가야금 느낌의 5음계) =====
const Sound = (() => {
  let ac = null, master = null, on = true, bgmOn = true, bgmT = null;
  const PENTA = [261.6, 293.7, 329.6, 392, 440];
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function pluck(f, t0, dur, vol, type) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + (t0 || 0), o = a.createOscillator(), gn = a.createGain();
    o.type = type || 'triangle'; o.frequency.setValueAtTime(f * 1.02, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, hp) {
    const a = ctx(); if (!a) return;
    const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), gn = a.createGain();
    f.type = 'highpass'; f.frequency.value = hp || 800; gn.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(gn); gn.connect(master); s.start();
  }
  const note = (i, oct) => PENTA[i % 5] * Math.pow(2, Math.floor(i / 5) + (oct || 0));
  const SFX = {
    collect: tier => { pluck(note(Math.floor(Math.random() * 5) + 5, 0), 0, 0.35, 0.12); if (tier) [0, 2, 4].forEach((n, i) => pluck(note(n + 10, 0), 0.06 * (i + 1), 0.4, 0.1)); },
    tap: () => pluck(note(7 + Math.floor(Math.random() * 3)), 0, 0.2, 0.1, 'square'),
    reap: () => noise(0.18, 0.04, 2500),
    buy: () => { pluck(note(5), 0, 0.15, 0.12, 'square'); pluck(note(9), 0.07, 0.25, 0.12, 'square'); },
    no: () => { pluck(196, 0, 0.15, 0.1, 'square'); pluck(174, 0.08, 0.2, 0.1, 'square'); },
    wraith: () => { const a = ctx(); if (!a) return; const o = a.createOscillator(), gn = a.createGain(), l = a.createOscillator(), lg = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(520, a.currentTime); o.frequency.exponentialRampToValueAtTime(180, a.currentTime + 1.2); l.frequency.value = 7; lg.gain.value = 18; l.connect(lg); lg.connect(o.frequency); gn.gain.setValueAtTime(0.0001, a.currentTime); gn.gain.exponentialRampToValueAtTime(0.12, a.currentTime + 0.1); gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.3); o.connect(gn); gn.connect(master); o.start(); l.start(); o.stop(a.currentTime + 1.4); l.stop(a.currentTime + 1.4); },
    hit: () => { noise(0.08, 0.08, 600); pluck(110, 0, 0.1, 0.1, 'square'); },
    kill: () => { noise(0.3, 0.08, 300); [0, 2, 4, 7].forEach((n, i) => pluck(note(n + 5), 0.08 * i, 0.4, 0.11)); },
    promote: () => [0, 1, 2, 3, 4, 5, 7, 9].forEach((n, i) => pluck(note(n + 3), 0.09 * i, 0.6, 0.12)),
    open: () => pluck(note(6), 0, 0.12, 0.06),
  };
  function bgmStep() {
    if (!on || !bgmOn) return;
    const a = ctx(); if (!a || a.state !== 'running') { bgmT = setTimeout(bgmStep, 1000); return; }
    const r = Math.random();
    if (r < 0.75) pluck(note(Math.floor(Math.random() * 8), -1), 0, 1.6, 0.045);
    if (r < 0.2) pluck(note(Math.floor(Math.random() * 5), -2), 0.2, 2.2, 0.05);
    bgmT = setTimeout(bgmStep, 500 + Math.random() * 900);
  }
  return {
    init() {
      const unlock = () => { ctx(); if (!bgmT) bgmStep(); };
      window.addEventListener('pointerdown', unlock, { once: true });
    },
    play(name, arg) { if (on && SFX[name]) SFX[name](arg); },
    set(sfx, bgm) { on = sfx; bgmOn = bgm; clearTimeout(bgmT); bgmT = null; if (on && bgmOn && ac) bgmStep(); },
  };
})();
