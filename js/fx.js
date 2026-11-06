/* Little celebrations: confetti and a short victory sound when you earn a badge or reach a savings goal.
   No files to download: the confetti is drawn on a canvas and the sound is made with Web Audio.
   Confetti is skipped when the device asks for reduced motion. Sound can be turned off on the Games page. */
window.PBH_FX = (function () {
  'use strict';

  const SOUND_KEY = 'pbh.sound';
  const COLORS = ['#b1e5f2', '#e8e9f3', '#fab219', '#0ca30c', '#ff6b68', '#a6a6a8'];
  let audio = null;

  function soundOn() {
    try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { return true; }
  }
  function setSound(on) {
    try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { /* storage off */ }
  }

  /** A quick rising arpeggio, about half a second, kept quiet. */
  function sound() {
    if (!soundOn()) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio = audio || new Ctx();
      if (audio.state === 'suspended') audio.resume();
      const t0 = audio.currentTime + 0.02;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = i === 3 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        const start = t0 + i * 0.09;
        const length = i === 3 ? 0.45 : 0.16;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + length + 0.05);
      });
    } catch (e) { /* no sound, no problem */ }
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, hgt = window.innerHeight;
    canvas.width = w * dpr; canvas.height = hgt * dpr;
    ctx.scale(dpr, dpr);
    const pieces = [];
    for (let i = 0; i < 140; i++) {
      const fromLeft = i % 2 === 0;
      pieces.push({
        x: fromLeft ? -10 : w + 10, y: hgt * (0.55 + Math.random() * 0.25),
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 7), vy: -(9 + Math.random() * 8),
        size: 5 + Math.random() * 5, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length], round: Math.random() < 0.3
      });
    }
    const started = performance.now();
    const LIFE = 2600;
    function frame(now) {
      const t = now - started;
      ctx.clearRect(0, 0, w, hgt);
      ctx.globalAlpha = t > LIFE - 600 ? Math.max(0, (LIFE - t) / 600) : 1;
      pieces.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (t < LIFE) requestAnimationFrame(frame); else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function celebrate() { confetti(); sound(); }

  return { celebrate: celebrate, confetti: confetti, sound: sound, soundOn: soundOn, setSound: setSound };
})();
