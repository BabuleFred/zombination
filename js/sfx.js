// ===== Зомбинация: синтезированный звук (WebAudio) =====
const SFX = (() => {
  let ctx = null, master = null, musicGain = null;
  let soundOn = true, musicOn = true, musicTimer = null, musicStep = 0;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.10; musicGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function env(gainNode, t0, a, d, peak) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(peak, t0 + a);
    g.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  function tone(freq, dur, type = 'square', vol = 0.5, slide = 0) {
    if (!soundOn) return; ensure();
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    env(g, t0, 0.005, dur, vol);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol = 0.4, filterFreq = 1200, type = 'lowpass') {
    if (!soundOn) return; ensure();
    const t0 = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq;
    const g = ctx.createGain(); env(g, t0, 0.004, dur, vol);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  const api = {
    setSound(on) { soundOn = on; },
    setMusic(on) {
      musicOn = on; if (!on && musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      if (on) api.startMusic();
    },
    unlock() { ensure(); },
    click()   { tone(700, 0.05, 'square', 0.25); },
    shot()    { noise(0.07, 0.30, 2500, 'highpass'); },
    mgshot()  { noise(0.04, 0.18, 3000, 'highpass'); },
    hit()     { noise(0.06, 0.35, 700); tone(160, 0.06, 'triangle', 0.25, -60); },
    die()     { tone(300, 0.25, 'sawtooth', 0.28, -220); noise(0.12, 0.2, 500); },
    growl()   { tone(90, 0.35, 'sawtooth', 0.3, -35); },
    boom()    { noise(0.4, 0.55, 300); tone(70, 0.35, 'sine', 0.5, -40); },
    spit()    { tone(350, 0.12, 'sine', 0.3, 250); },
    coin()    { tone(900, 0.07, 'square', 0.25); tone(1350, 0.12, 'square', 0.22); },
    rage()    { tone(200, 0.5, 'sawtooth', 0.4, 500); noise(0.3, 0.25, 800); },
    levelup() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'square', 0.3), i * 90)); },
    baseHit() { noise(0.25, 0.5, 250); tone(60, 0.3, 'sine', 0.5, -20); },
    win()     { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'square', 0.3), i * 130)); },
    lose()    { [400, 350, 300, 200].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.3, -60), i * 200)); },
    startMusic() {
      if (!musicOn || musicTimer) return; ensure();
      // Простенький деревенский мотив, бас + мелодия
      const bass = [110, 110, 131, 110, 98, 98, 147, 110];
      const mel  = [330, 392, 440, 392, 349, 330, 294, 330, 392, 440, 523, 440, 392, 330, 294, 0];
      let i = 0;
      musicTimer = setInterval(() => {
        if (!musicOn || !ctx) return;
        const t0 = ctx.currentTime;
        const b = ctx.createOscillator(), bg = ctx.createGain();
        b.type = 'triangle'; b.frequency.value = bass[i % bass.length] / 2;
        env(bg, t0, 0.01, 0.24, 0.5); b.connect(bg); bg.connect(musicGain); b.start(t0); b.stop(t0 + 0.3);
        const m = mel[i % mel.length];
        if (m) {
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.type = 'square'; o.frequency.value = m;
          env(og, t0, 0.01, 0.14, 0.30); o.connect(og); og.connect(musicGain); o.start(t0); o.stop(t0 + 0.2);
        }
        i++;
      }, 260);
    },
  };
  return api;
})();
