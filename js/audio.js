// 16bit 풍 효과음 / 배경음 (WebAudio 합성 — 외부 음원 없음)
'use strict';
(function () {
  let ac = null, master = null, bgmGain = null;
  const A = (R.Audio = { sfxOn: true, bgmOn: true });
  try {
    const saved = JSON.parse(localStorage.getItem('relic_audio') || '{}');
    if (saved.sfxOn === false) A.sfxOn = false;
    if (saved.bgmOn === false) A.bgmOn = false;
  } catch (e) { /* 저장소 접근 불가 */ }

  A.unlock = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination);
    bgmGain = ac.createGain(); bgmGain.gain.value = 0.22; bgmGain.connect(master);
  };
  A.persist = function () {
    try { localStorage.setItem('relic_audio', JSON.stringify({ sfxOn: A.sfxOn, bgmOn: A.bgmOn })); } catch (e) { /* 무시 */ }
    if (!A.bgmOn) A.stopBgm(); else if (A.cur != null) A.playBgm(A.cur, true);
  };

  function tone(freq, dur, type = 'square', vol = 0.3, slide = 0, delay = 0, dest) {
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  let noiseBuf = null;
  function noise(dur, vol = 0.3, freq = 1200, delay = 0) {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur);
  }

  const last = {};
  R.sfx = function (name) {
    if (!ac || !A.sfxOn) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 45) return;
    last[name] = now;
    switch (name) {
      case 'swing': noise(0.08, 0.12, 3000); break;
      case 'hit': tone(180, 0.08, 'square', 0.18, -100); noise(0.06, 0.2, 2000); break;
      case 'crit': tone(320, 0.1, 'square', 0.2, -200); noise(0.1, 0.3, 4000); tone(880, 0.08, 'square', 0.1, 0, 0.03); break;
      case 'kill': tone(440, 0.06, 'square', 0.15, 200); tone(220, 0.1, 'triangle', 0.2, -100, 0.04); break;
      case 'hurt': tone(140, 0.15, 'sawtooth', 0.22, -80); break;
      case 'dodge': noise(0.12, 0.12, 1500); tone(600, 0.08, 'sine', 0.08, 300); break;
      case 'skill': tone(520, 0.12, 'square', 0.12, 400); break;
      case 'fire': noise(0.25, 0.25, 900); tone(200, 0.2, 'sawtooth', 0.1, 200); break;
      case 'ice': tone(1200, 0.15, 'triangle', 0.15, -600); tone(1600, 0.1, 'sine', 0.08, 0, 0.05); break;
      case 'thunder': noise(0.3, 0.3, 5000); tone(90, 0.25, 'square', 0.15, -40); break;
      case 'boom': noise(0.35, 0.4, 600); tone(80, 0.3, 'sine', 0.3, -40); break;
      case 'slam': noise(0.25, 0.35, 400); tone(60, 0.25, 'sine', 0.35, -20); break;
      case 'coin': tone(988, 0.05, 'square', 0.1); tone(1319, 0.12, 'square', 0.1, 0, 0.05); break;
      case 'pickup': tone(660, 0.06, 'square', 0.1); tone(880, 0.08, 'square', 0.1, 0, 0.05); break;
      case 'rare': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.12, 0, i * 0.06)); break;
      case 'levelup': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.14, 0, i * 0.08)); break;
      case 'potion': tone(400, 0.2, 'sine', 0.2, 500); break;
      case 'ui': tone(880, 0.04, 'square', 0.08); break;
      case 'tick': tone(1400 + Math.random() * 300, 0.015, 'square', 0.025); break;
      case 'talk': tone(700 + Math.random() * 200, 0.03, 'square', 0.04); break;
      case 'die': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.2, 0, i * 0.18)); break;
      case 'roar': noise(0.8, 0.4, 300); tone(70, 0.8, 'sawtooth', 0.25, -30); break;
      case 'bossdie': noise(1.2, 0.5, 500); [262, 330, 392, 523].forEach((f, i) => tone(f, 0.3, 'square', 0.15, 0, 0.3 + i * 0.12)); break;
      case 'gate': tone(120, 0.3, 'square', 0.2, 60); noise(0.3, 0.2, 800); break;
      case 'vine': noise(0.08, 0.15, 2500); break;
      case 'enhance_ok': [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.15, 'square', 0.15, 0, i * 0.07)); break;
      case 'enhance_fail': tone(300, 0.3, 'sawtooth', 0.15, -200); break;
    }
  };

  // ─── 배경음: 지역별 짧은 루프 ───
  const SONGS = [
    // [BPM, 음계(midi), 멜로디 패턴, 베이스 패턴]
    { bpm: 112, mel: [72, 74, 76, 79, 76, 74, 72, 69, 72, 74, 76, 74, 72, 67, 69, 72], bass: [48, 48, 55, 55, 53, 53, 50, 55] },  // 마을
    { bpm: 124, mel: [69, 72, 76, 74, 72, 69, 67, 69, 72, 74, 76, 79, 76, 74, 72, 71], bass: [45, 45, 43, 43, 41, 41, 43, 44] },  // 숲
    { bpm: 104, mel: [69, 68, 69, 72, 71, 69, 68, 64, 69, 68, 69, 76, 74, 72, 71, 68], bass: [45, 45, 44, 44, 41, 41, 40, 40] },  // 폐허
    { bpm: 132, mel: [64, 67, 64, 70, 69, 67, 64, 62, 64, 67, 71, 70, 67, 64, 62, 63], bass: [40, 40, 40, 43, 40, 40, 38, 39] },  // 광산
    { bpm: 96, mel: [76, 79, 83, 81, 79, 76, 74, 76, 79, 81, 83, 86, 83, 81, 79, 78], bass: [52, 52, 55, 55, 57, 57, 54, 54] },   // 빙결
    { bpm: 140, mel: [62, 65, 68, 67, 65, 62, 61, 62, 68, 67, 65, 71, 68, 67, 65, 64], bass: [38, 38, 37, 37, 38, 38, 44, 43] },  // 마계
    { bpm: 150, mel: [69, 69, 72, 69, 75, 74, 72, 69, 69, 69, 72, 69, 76, 75, 74, 72], bass: [45, 45, 45, 45, 44, 44, 43, 43] },  // 보스
  ];
  let timer = null;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  A.playBgm = function (i, force) {
    if (!ac) return;
    if (A.cur === i && timer && !force) return;
    A.cur = i;
    A.stopBgm();
    if (!A.bgmOn) return;
    const song = SONGS[i];
    const step = 60 / song.bpm / 2;
    let n = 0;
    let next = ac.currentTime + 0.1;
    timer = setInterval(() => {
      while (next < ac.currentTime + 0.3) {
        const d = next - ac.currentTime;
        const m = song.mel[n % song.mel.length];
        if (n % 16 !== 15) tone(mtof(m), step * 0.9, 'square', 0.12, 0, d, bgmGain);
        if (n % 2 === 0) tone(mtof(song.bass[(n / 2) % song.bass.length]), step * 1.8, 'triangle', 0.3, 0, d, bgmGain);
        if (n % 4 === 2) noise(0.05, 0.06, 6000, d);
        n++; next += step;
      }
    }, 100);
  };
  A.stopBgm = function () { if (timer) clearInterval(timer); timer = null; };
})();
