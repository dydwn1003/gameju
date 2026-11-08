// ===== 사운드: WebAudio 합성 효과음 + 칩튠 BGM =====
// assets/sfx/<이름>.mp3, assets/bgm/<이름>.mp3 를 넣으면 그 파일을 우선 사용합니다.
const Sound = (() => {
  let ctx = null, sfxBus, bgmBus, noiseBuf;
  let unlocked = false;
  const opts = { bgm: true, sfx: true };
  const custom = {};      // 'sfx_hit' -> url
  const lastPlay = {};
  let curSong = null, seqTimer = null, step = 0, nextTime = 0, customBgm = null;

  const SFX_NAMES = ['hit', 'crit', 'skill', 'blast', 'heal', 'shield', 'coin', 'win', 'lose', 'click', 'levelup', 'evolve', 'gacha', 'rare', 'warning', 'reward', 'die'];
  const BGM_NAMES = ['stage', 'boss', 'raid', 'arena'];

  function probeAudio(key, url) {
    const a = new Audio();
    a.preload = 'auto';
    a.oncanplaythrough = () => { custom[key] = url; a.oncanplaythrough = null; if (key === 'bgm_' + curSong) playSong(curSong); };
    a.onerror = () => {};
    a.src = url;
  }

  function init() {
    if (!window.NO_ASSET_PROBE) {
      SFX_NAMES.forEach(n => probeAudio('sfx_' + n, `assets/sfx/${n}.mp3`));
      BGM_NAMES.forEach(n => probeAudio('bgm_' + n, `assets/bgm/${n}.mp3`));
    }
    const unlock = () => {
      if (unlocked) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
        sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
        bgmBus = ctx.createGain(); bgmBus.gain.value = 0.16; bgmBus.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        unlocked = true;
        if (curSong) playSong(curSong);
      } catch (e) { console.warn('audio', e); }
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));
  }

  // ---------- 합성 ----------
  function tone(freq, dur, type = 'square', vol = 0.2, when = 0, slideTo = null, bus = sfxBus) {
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, when = 0, freq = 2000, type = 'lowpass') {
    const t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t); s.stop(t + dur + 0.05);
  }

  const SFX = {
    hit() { noise(0.07, 0.3, 0, 1800); tone(160, 0.08, 'sine', 0.35, 0, 60); },
    crit() { noise(0.14, 0.45, 0, 3500); tone(320, 0.14, 'square', 0.12, 0, 90); tone(900, 0.08, 'triangle', 0.1, 0.02, 1400); },
    skill() { tone(300, 0.35, 'sawtooth', 0.1, 0, 1200); tone(600, 0.3, 'triangle', 0.12, 0.05, 1800); },
    blast() { noise(0.55, 0.5, 0, 700); tone(90, 0.5, 'sine', 0.45, 0, 30); },
    heal() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.14, i * 0.06)); },
    shield() { tone(380, 0.35, 'sine', 0.18, 0, 900); tone(760, 0.3, 'triangle', 0.06, 0.05); },
    coin() { tone(988, 0.06, 'square', 0.07); tone(1319, 0.14, 'square', 0.07, 0.06); },
    win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i === 5 ? 0.4 : 0.14, 'square', 0.09, i * 0.09)); },
    lose() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, i * 0.16)); },
    click() { tone(700, 0.04, 'square', 0.05); },
    levelup() { [523, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.07, i * 0.05)); },
    evolve() { tone(200, 1.2, 'sawtooth', 0.08, 0, 1600); [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.6, 'triangle', 0.12, 1.0 + i * 0.07)); },
    gacha() { tone(200, 0.7, 'triangle', 0.14, 0, 1300); noise(0.7, 0.06, 0, 5000, 'highpass'); },
    rare() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.5, 'triangle', 0.12, i * 0.08)); noise(0.8, 0.06, 0, 6000, 'highpass'); },
    warning() { for (let i = 0; i < 3; i++) tone(460, 0.28, 'sawtooth', 0.1, i * 0.38, 230); },
    reward() { [659, 880, 1175].forEach((f, i) => tone(f, 0.18, 'triangle', 0.12, i * 0.07)); },
    die() { tone(500, 0.25, 'square', 0.06, 0, 120); },
  };

  function play(name) {
    if (!opts.sfx || !unlocked) return;
    const now = performance.now();
    if (now - (lastPlay[name] || 0) < 55) return;
    lastPlay[name] = now;
    if (custom['sfx_' + name]) {
      const a = new Audio(custom['sfx_' + name]); a.volume = 0.7; a.play().catch(() => {});
      return;
    }
    try { SFX[name] && SFX[name](); } catch (e) {}
  }

  // ---------- BGM (칩튠 시퀀서) ----------
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  const SONGS = {
    stage: { bpm: 112, chords: [[48, 'M'], [45, 'm'], [41, 'M'], [43, 'M']],
      mel: [72, 0, 76, 0, 79, 77, 76, 74, 72, 0, 69, 0, 72, 74, 76, 0, 77, 0, 76, 0, 74, 72, 69, 0, 71, 0, 74, 0, 79, 0, 77, 76] },
    boss: { bpm: 140, chords: [[45, 'm'], [41, 'M'], [43, 'M'], [40, 'M']],
      mel: [69, 72, 76, 72, 69, 72, 76, 79, 77, 76, 72, 69, 77, 76, 72, 77, 79, 77, 74, 71, 74, 77, 79, 83, 80, 0, 76, 0, 71, 0, 68, 71] },
    raid: { bpm: 150, chords: [[40, 'm'], [36, 'M'], [38, 'M'], [35, 'M']],
      mel: [76, 0, 79, 76, 83, 0, 79, 76, 72, 0, 76, 72, 79, 0, 76, 72, 74, 0, 78, 74, 81, 0, 78, 74, 75, 0, 78, 0, 83, 0, 78, 75] },
    arena: { bpm: 128, chords: [[50, 'm'], [46, 'M'], [48, 'M'], [45, 'm']],
      mel: [74, 0, 77, 0, 81, 0, 77, 74, 70, 0, 74, 0, 77, 0, 82, 0, 72, 0, 76, 0, 79, 0, 84, 0, 81, 0, 76, 0, 73, 0, 69, 0] },
  };

  function schedule() {
    const S = SONGS[curSong];
    if (!S || !ctx) return;
    const stepDur = 60 / S.bpm / 2; // 8분음표
    while (nextTime < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 4, [root, q] = S.chords[bar];
      const tones = q === 'M' ? [0, 4, 7, 12] : [0, 3, 7, 12];
      const when = nextTime - ctx.currentTime;
      if (step % 2 === 0) tone(midi(root - 12), stepDur * 1.8, 'triangle', 0.5, when, null, bgmBus);
      tone(midi(root + 12 + tones[step % 4]), stepDur * 0.7, 'square', 0.1, when, null, bgmBus);
      const m = S.mel[step % 32];
      if (m) tone(midi(m), stepDur * 0.9, 'square', 0.22, when, null, bgmBus);
      if (curSong !== 'stage' && step % 2 === 1) noise(0.03, 0.05, when, 8000, 'highpass');
      nextTime += stepDur; step++;
    }
  }

  function stopSong() {
    clearInterval(seqTimer); seqTimer = null;
    if (customBgm) { customBgm.pause(); customBgm = null; }
  }

  function playSong(name) {
    stopSong();
    curSong = name;
    if (!opts.bgm || !unlocked || !name) return;
    if (custom['bgm_' + name]) {
      customBgm = new Audio(custom['bgm_' + name]); customBgm.loop = true; customBgm.volume = 0.45;
      customBgm.play().catch(() => {});
      return;
    }
    step = 0; nextTime = ctx.currentTime + 0.05;
    seqTimer = setInterval(schedule, 60);
    schedule();
  }

  function bgm(name) { if (name !== curSong || (!seqTimer && !customBgm)) playSong(name); }

  function set(k, v) {
    opts[k] = v;
    if (k === 'bgm') { if (v) playSong(curSong); else stopSong(); }
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { ctx.suspend(); if (customBgm) customBgm.pause(); }
    else { ctx.resume(); if (customBgm && opts.bgm) customBgm.play().catch(() => {}); }
  });

  return { init, play, bgm, set, opts };
})();
