// ===== 몬스터 SVG 생성기 (모든 그림은 코드로 그림) =====
const Art = (() => {
  let uid = 0;
  const PAL = { fire: '#ff7a45', water: '#3fa7ff', grass: '#5cc95a', light: '#ffd54a', dark: '#8a5cf0' };
  // 계열별 고유 색 보정 (같은 속성이라도 다르게 보이도록)
  const HUE = {
    coal: '#7a4a3a', firefly: '#ffb347', salam: '#ff5a3c', icecat: '#a8e4ff', clam: '#ff9fb2',
    golem: '#8c9a7a', shroom: '#c75bd6', acorn: '#c98a4b', deer: '#ffe9a8', cloud: '#e8f1ff',
    star: '#ffe066', wolf: '#4b4f73', ghost: '#cfd6ff', octo: '#6b4bb5', koi: '#ff6b6b',
    abyss: '#3b2a6b', dragon: '#fff2c4',
  };

  function shade(hex, amt) {
    const c = parseInt(hex.slice(1), 16);
    let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // 체형별 기준점: 눈 높이, 머리 꼭대기
  const SHAPE = {
    round: { eyeY: 56, head: 34, w: 30 },
    wide:  { eyeY: 60, head: 42, w: 36 },
    tall:  { eyeY: 48, head: 24, w: 26 },
    drop:  { eyeY: 60, head: 28, w: 28 },
    ghost: { eyeY: 50, head: 27, w: 26 },
    star:  { eyeY: 60, head: 28, w: 30 },
  };

  function starPath(cx, cy, R, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 === 0 ? R : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rad).toFixed(1) + ' ' + (cy + Math.sin(a) * rad).toFixed(1);
    }
    return d + 'Z';
  }

  function body(shape, fill, stroke) {
    const s = `fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (shape) {
      case 'round': return `<ellipse cx="50" cy="60" rx="30" ry="27" ${s}/>`;
      case 'wide':  return `<ellipse cx="50" cy="64" rx="36" ry="23" ${s}/>`;
      case 'tall':  return `<path d="M50 22 C72 22 76 45 76 62 C76 80 66 88 50 88 C34 88 24 80 24 62 C24 45 28 22 50 22Z" ${s}/>`;
      case 'drop':  return `<path d="M50 22 C60 38 78 50 78 66 C78 80 66 88 50 88 C34 88 22 80 22 66 C22 50 40 38 50 22Z" ${s}/>`;
      case 'ghost': return `<path d="M24 58 C24 36 36 26 50 26 C64 26 76 36 76 58 L76 86 L68 80 L59 87 L50 80 L41 87 L32 80 L24 86Z" ${s}/>`;
      case 'star':  return `<path d="${starPath(50, 60, 36, 20)}" ${s} stroke-width="5"/>`;
    }
    return '';
  }

  function belly(shape, col) {
    const p = { round: [50, 68, 18, 14], wide: [50, 70, 22, 12], tall: [50, 68, 15, 16], drop: [50, 72, 17, 12], ghost: [50, 66, 14, 13], star: [50, 64, 10, 9] }[shape];
    return `<ellipse cx="${p[0]}" cy="${p[1]}" rx="${p[2]}" ry="${p[3]}" fill="${col}" opacity="0.75"/>`;
  }

  function ears(type, S, c, dk) {
    const h = S.head, st = `stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (type) {
      case 'pointy': return `<path d="M30 ${h + 12} L28 ${h - 12} L44 ${h + 4}Z" fill="${c}" ${st}/><path d="M70 ${h + 12} L72 ${h - 12} L56 ${h + 4}Z" fill="${c}" ${st}/>
        <path d="M32 ${h + 6} L31 ${h - 5} L39 ${h + 3}Z" fill="#ffb3c7"/><path d="M68 ${h + 6} L69 ${h - 5} L61 ${h + 3}Z" fill="#ffb3c7"/>`;
      case 'round': return `<circle cx="30" cy="${h + 4}" r="9" fill="${c}" ${st}/><circle cx="70" cy="${h + 4}" r="9" fill="${c}" ${st}/>
        <circle cx="30" cy="${h + 4}" r="4.5" fill="#ffb3c7"/><circle cx="70" cy="${h + 4}" r="4.5" fill="#ffb3c7"/>`;
      case 'long': return `<ellipse cx="38" cy="${h - 8}" rx="6" ry="16" transform="rotate(-15 38 ${h - 8})" fill="${c}" ${st}/>
        <ellipse cx="62" cy="${h - 8}" rx="6" ry="16" transform="rotate(15 62 ${h - 8})" fill="${c}" ${st}/>`;
      case 'bat': return `<path d="M32 ${h + 10} L18 ${h - 14} L30 ${h - 6} L34 ${h - 16} L44 ${h + 2}Z" fill="${c}" ${st}/>
        <path d="M68 ${h + 10} L82 ${h - 14} L70 ${h - 6} L66 ${h - 16} L56 ${h + 2}Z" fill="${c}" ${st}/>`;
      case 'antenna': return `<path d="M43 ${h + 4} Q38 ${h - 10} 32 ${h - 14}" stroke="${dk}" stroke-width="2.5" fill="none"/>
        <path d="M57 ${h + 4} Q62 ${h - 10} 68 ${h - 14}" stroke="${dk}" stroke-width="2.5" fill="none"/>
        <circle cx="32" cy="${h - 14}" r="4" fill="#fff27a" stroke="${dk}" stroke-width="2"/><circle cx="68" cy="${h - 14}" r="4" fill="#fff27a" stroke="${dk}" stroke-width="2"/>`;
    }
    return '';
  }

  function wings(c, dk, form) {
    const s = 1 + form * 0.25;
    const L = `M34 58 C${34 - 22 * s} ${50 - 18 * s} ${34 - 30 * s} ${56} ${34 - 26 * s} ${70} C${34 - 16 * s} ${64} ${34 - 10 * s} ${70} 36 70Z`;
    const R = `M66 58 C${66 + 22 * s} ${50 - 18 * s} ${66 + 30 * s} ${56} ${66 + 26 * s} ${70} C${66 + 16 * s} ${64} ${66 + 10 * s} ${70} 64 70Z`;
    return `<path d="${L}" fill="${c}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/><path d="${R}" fill="${c}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }

  function tail(c, dk, form) {
    const l = 14 + form * 6;
    return `<path d="M72 74 C${80 + l * 0.4} 76 ${82 + l * 0.6} ${66 - l * 0.4} ${78 + l * 0.6} ${58 - l * 0.6} C${84 + l * 0.4} ${66 - l * 0.2} ${82} 82 70 82Z" fill="${c}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }

  // 머리 위/몸 장식
  function feature(feat, S, c, dk, lt, form) {
    const h = S.head, k = 0.8 + form * 0.25;
    const st = `stroke="${dk}" stroke-width="2" stroke-linejoin="round"`;
    switch (feat) {
      case 'flame': return `<g transform="translate(50 ${h + 2}) scale(${k})"><path d="M0 0 C-12 -8 -8 -20 -3 -28 C-2 -20 4 -20 2 -32 C12 -22 14 -8 0 0Z" fill="#ffb02e" stroke="#e0461b" stroke-width="2"/><path d="M0 -3 C-5 -8 -3 -14 0 -18 C2 -12 6 -10 0 -3Z" fill="#fff27a"/></g>`;
      case 'wisp': return `<g transform="translate(50 ${h + 2}) scale(${k})"><path d="M0 0 C-12 -8 -8 -20 -3 -28 C-2 -20 4 -20 2 -32 C12 -22 14 -8 0 0Z" fill="#7fd8ff" stroke="#3a57c9" stroke-width="2"/></g>`;
      case 'horns': {
        const hh = 8 + form * 7;
        return `<path d="M38 ${h + 6} C34 ${h - hh * 0.4} 30 ${h - hh} 26 ${h - hh - 2} C34 ${h - hh * 0.6} 40 ${h - 2} 44 ${h + 4}Z" fill="${lt}" ${st}/>
                <path d="M62 ${h + 6} C66 ${h - hh * 0.4} 70 ${h - hh} 74 ${h - hh - 2} C66 ${h - hh * 0.6} 60 ${h - 2} 56 ${h + 4}Z" fill="${lt}" ${st}/>`;
      }
      case 'fins': return `<path d="M50 ${h + 2} L44 ${h - 10 - form * 4} L58 ${h + 4}Z" fill="${lt}" ${st}/>
        <path d="M22 66 L${10 - form * 3} 60 L22 76Z" fill="${lt}" ${st}/><path d="M78 66 L${90 + form * 3} 60 L78 76Z" fill="${lt}" ${st}/>`;
      case 'shell': return `<path d="M20 60 C20 ${40 - form * 4} 80 ${40 - form * 4} 80 60Z" fill="${lt}" ${st}/>
        <path d="M35 ${50 - form * 2} L38 58 M50 ${45 - form * 3} L50 58 M65 ${50 - form * 2} L62 58" stroke="${dk}" stroke-width="2"/>`;
      case 'crystal': {
        let g = '';
        const n = 1 + form;
        for (let i = 0; i < n; i++) {
          const x = 50 + (i - (n - 1) / 2) * 11, hy = h - 4 - (i === Math.floor(n / 2) ? 6 : 0);
          g += `<path d="M${x} ${hy - 12} L${x + 5} ${hy} L${x} ${hy + 8} L${x - 5} ${hy}Z" fill="#e6fbff" stroke="#3a8fd1" stroke-width="2"/>`;
        }
        return g;
      }
      case 'leaf': {
        const big = 1 + form * 0.4;
        return `<path d="M50 ${h + 2} C${50 - 18 * big} ${h - 6 * big} ${50 - 16 * big} ${h - 20 * big} ${50 - 2} ${h - 18 * big} C${50 - 4} ${h - 10} 50 ${h - 4} 50 ${h + 2}Z" fill="#7ee06f" stroke="#2f8a35" stroke-width="2"/>
                <path d="M50 ${h + 2} C${50 + 18 * big} ${h - 6 * big} ${50 + 16 * big} ${h - 20 * big} ${50 + 2} ${h - 18 * big} C${50 + 4} ${h - 10} 50 ${h - 4} 50 ${h + 2}Z" fill="#9ff08f" stroke="#2f8a35" stroke-width="2"/>`;
      }
      case 'cap': return `<path d="M${26 - form * 2} ${h + 10} C${26 - form * 2} ${h - 10 - form * 3} ${74 + form * 2} ${h - 10 - form * 3} ${74 + form * 2} ${h + 10}Z" fill="#8a5a2b" stroke="#5a3515" stroke-width="2.5"/>
        <path d="M34 ${h + 2} L66 ${h + 2} M38 ${h - 4} L62 ${h - 4}" stroke="#5a3515" stroke-width="1.5"/><path d="M50 ${h - 8 - form * 3} L52 ${h - 16 - form * 3}" stroke="#5a3515" stroke-width="3" stroke-linecap="round"/>`;
      case 'mushroom': return `<path d="M${18 - form * 3} ${h + 12} C${18 - form * 3} ${h - 16 - form * 4} ${82 + form * 3} ${h - 16 - form * 4} ${82 + form * 3} ${h + 12}Z" fill="#e8384f" stroke="#8a1424" stroke-width="2.5"/>
        <circle cx="36" cy="${h + 2}" r="4" fill="#fff"/><circle cx="54" cy="${h - 6}" r="5" fill="#fff"/><circle cx="68" cy="${h + 4}" r="3.5" fill="#fff"/>`;
      case 'halo': return `<ellipse cx="50" cy="${h - 10 - form * 3}" rx="${14 + form * 3}" ry="4.5" fill="none" stroke="#ffe36b" stroke-width="3.5"/>`;
      case 'cloud': return `<g fill="#ffffff" stroke="#9fb3d9" stroke-width="2"><circle cx="22" cy="58" r="${8 + form * 2}"/><circle cx="78" cy="58" r="${8 + form * 2}"/><circle cx="40" cy="${h + 2}" r="${7 + form}"/><circle cx="58" cy="${h}" r="${8 + form}"/></g>
        ${form >= 1 ? `<path d="M76 ${h + 2} L70 ${h + 14} L76 ${h + 14} L70 ${h + 26}" stroke="#ffd400" stroke-width="3" fill="none"/>` : ''}`;
      case 'sparkle': {
        let g = '';
        const pts = [[20, 34], [82, 40], [16, 74], [84, 78], [50, 14]].slice(0, 2 + form);
        for (const [x, y] of pts) g += `<path d="${starPath(x, y, 5, 2)}" fill="#fff6a6" stroke="#e0a800" stroke-width="1"/>`;
        return g;
      }
      case 'tentacles': {
        let g = '';
        const n = 4 + form;
        for (let i = 0; i < n; i++) {
          const x = 30 + i * (40 / (n - 1));
          g += `<path d="M${x} 78 C${x - 6} 88 ${x + 6} 92 ${x} 98" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
        }
        return g;
      }
      case 'mane': {
        let g = '';
        for (let i = 0; i < 7; i++) {
          const a = Math.PI + (i / 6) * Math.PI, R = 30 + form * 3;
          const x = 50 + Math.cos(a) * R, y = 54 + Math.sin(a) * R * 0.9;
          g += `<path d="M${50 + Math.cos(a - 0.25) * 22} ${54 + Math.sin(a - 0.25) * 20} L${x.toFixed(1)} ${y.toFixed(1)} L${50 + Math.cos(a + 0.25) * 22} ${54 + Math.sin(a + 0.25) * 20}Z" fill="${dk}"/>`;
        }
        return g;
      }
      case 'moss': return `<g fill="#6fcf5a" stroke="#2f7a2a" stroke-width="2"><circle cx="34" cy="${h + 4}" r="${6 + form * 2}"/><circle cx="50" cy="${h}" r="${7 + form * 2}"/><circle cx="66" cy="${h + 4}" r="${6 + form * 2}"/></g>
        ${form >= 1 ? '<path d="M50 41 l3 -8 l3 8" fill="#ff7ab0"/>' : ''}`;
      case 'whiskers': return `<path d="M34 ${S.eyeY + 10} C24 ${S.eyeY + 8} 14 ${S.eyeY + 16} ${10 - form * 4} ${S.eyeY + 4}" stroke="${dk}" stroke-width="2" fill="none"/>
        <path d="M66 ${S.eyeY + 10} C76 ${S.eyeY + 8} 86 ${S.eyeY + 16} ${90 + form * 4} ${S.eyeY + 4}" stroke="${dk}" stroke-width="2" fill="none"/>
        ${form >= 1 ? `<path d="M50 ${h + 2} L46 ${h - 10} L50 ${h - 4} L54 ${h - 12} L56 ${h + 2}Z" fill="#ffd54a" ${st}/>` : ''}`;
      case 'antlers': {
        const t = 1 + form * 0.35;
        return `<g stroke="#c9a15b" stroke-width="3" stroke-linecap="round" fill="none">
          <path d="M40 ${h + 4} L${40 - 8 * t} ${h - 16 * t} M${40 - 4 * t} ${h - 6 * t} L${40 - 14 * t} ${h - 8 * t} M${40 - 6 * t} ${h - 12 * t} L${40 - 2 * t} ${h - 20 * t}"/>
          <path d="M60 ${h + 4} L${60 + 8 * t} ${h - 16 * t} M${60 + 4 * t} ${h - 6 * t} L${60 + 14 * t} ${h - 8 * t} M${60 + 6 * t} ${h - 12 * t} L${60 + 2 * t} ${h - 20 * t}"/></g>`;
      }
      case 'fangs': return '';
    }
    return '';
  }

  function face(S, form, feat, dk) {
    const y = S.eyeY, gap = 11 - form * 0.5, r = 7 - form * 0.6;
    let g = '';
    if (form < 2) {
      g += `<ellipse cx="${50 - gap}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="#1f1a2e"/><ellipse cx="${50 + gap}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="#1f1a2e"/>
            <circle cx="${50 - gap + 2}" cy="${y - 2.5}" r="${r * 0.38}" fill="#fff"/><circle cx="${50 + gap + 2}" cy="${y - 2.5}" r="${r * 0.38}" fill="#fff"/>
            <circle cx="${50 - gap - 2}" cy="${y + 2}" r="1.2" fill="#fff"/><circle cx="${50 + gap - 2}" cy="${y + 2}" r="1.2" fill="#fff"/>`;
      g += `<ellipse cx="${50 - gap - 7}" cy="${y + 9}" rx="4.5" ry="2.8" fill="#ff8fab" opacity="0.7"/><ellipse cx="${50 + gap + 7}" cy="${y + 9}" rx="4.5" ry="2.8" fill="#ff8fab" opacity="0.7"/>`;
      g += `<path d="M45 ${y + 9} Q47.5 ${y + 12} 50 ${y + 9} Q52.5 ${y + 12} 55 ${y + 9}" stroke="#1f1a2e" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    } else {
      // 최종 진화: 날카로운 눈
      g += `<path d="M${50 - gap - 7} ${y - 3} L${50 - gap + 6} ${y + 1} L${50 - gap + 4} ${y + 5} L${50 - gap - 5} ${y + 4}Z" fill="#fff"/>
            <path d="M${50 + gap + 7} ${y - 3} L${50 + gap - 6} ${y + 1} L${50 + gap - 4} ${y + 5} L${50 + gap + 5} ${y + 4}Z" fill="#fff"/>
            <circle cx="${50 - gap + 1}" cy="${y + 2.5}" r="2.4" fill="#1f1a2e"/><circle cx="${50 + gap - 1}" cy="${y + 2.5}" r="2.4" fill="#1f1a2e"/>
            <path d="M${50 - gap - 8} ${y - 6} L${50 - gap + 6} ${y - 2}" stroke="#1f1a2e" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M${50 + gap + 8} ${y - 6} L${50 + gap - 6} ${y - 2}" stroke="#1f1a2e" stroke-width="2.5" stroke-linecap="round"/>`;
      g += `<path d="M43 ${y + 11} Q50 ${y + 15} 57 ${y + 11}" stroke="#1f1a2e" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M45 ${y + 11.5} L46.5 ${y + 15} L48 ${y + 12.4}Z M55 ${y + 11.5} L53.5 ${y + 15} L52 ${y + 12.4}Z" fill="#fff"/>`;
    }
    if (feat === 'fangs' && form < 2) g += `<path d="M46 ${y + 10} L47.5 ${y + 14} L49 ${y + 10.5}Z M54 ${y + 10} L52.5 ${y + 14} L51 ${y + 10.5}Z" fill="#fff" stroke="${dk}" stroke-width="0.8"/>`;
    return g;
  }

  function creature(lineId, form = 0, opts = {}) {
    const L = LINE_MAP[lineId];
    const id = 'g' + (++uid);
    const S = SHAPE[L.shape];
    const base = HUE[L.id] || PAL[L.el];
    const c = base, lt = shade(base, 0.45), dk = shade(base, -0.45);
    const scale = [0.8, 0.92, 1.0][form];
    const aura = form === 2 || L.r === 'UR'
      ? `<circle cx="50" cy="58" r="44" fill="url(#${id}a)"/>` : '';
    const behind = (L.wings ? wings(lt, dk, form) : '') + (L.tail ? tail(c, dk, form) : '');
    const featBehind = ['mane', 'shell'].includes(L.feat) ? feature(L.feat, S, c, dk, lt, form) : '';
    const featFront = !['mane', 'shell', 'tentacles'].includes(L.feat) ? feature(L.feat, S, c, dk, lt, form) : '';
    const tent = L.feat === 'tentacles' ? feature(L.feat, S, c, dk, lt, form) : '';
    const crown = form === 2 && (L.r === 'UR' || L.r === 'SSR')
      ? `<path d="M40 ${S.head - 16} L42 ${S.head - 26} L46 ${S.head - 20} L50 ${S.head - 30} L54 ${S.head - 20} L58 ${S.head - 26} L60 ${S.head - 16}Z" fill="#ffd54a" stroke="#b07a00" stroke-width="1.5"/>` : '';
    const silhouette = opts.silhouette ? ' class="silhouette"' : '';
    return `<svg viewBox="-6 -10 112 112" xmlns="http://www.w3.org/2000/svg"${silhouette}>
      <defs>
        <radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="${lt}"/><stop offset="70%" stop-color="${c}"/><stop offset="100%" stop-color="${shade(base, -0.2)}"/></radialGradient>
        <radialGradient id="${id}a"><stop offset="0%" stop-color="${PAL[L.el]}" stop-opacity="0.55"/><stop offset="100%" stop-color="${PAL[L.el]}" stop-opacity="0"/></radialGradient>
      </defs>
      ${aura}
      <ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity="0.18"/>
      <g transform="translate(50 92) scale(${scale}) translate(-50 -92)">
        ${behind}${featBehind}${tent}
        ${ears(L.ear, S, c, dk)}
        ${body(L.shape, `url(#${id})`, dk)}
        ${belly(L.shape, lt)}
        ${featFront}
        ${face(S, form, L.feat, dk)}
        ${crown}
      </g>
    </svg>`;
  }

  return { creature, shade };
})();
