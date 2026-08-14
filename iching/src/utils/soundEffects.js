/**
 * Web Audio API Sound Effects Engine for I Ching Divination
 * Pure synthesized realistic bronze coin clinks, spins, and singing bowl chimes.
 * Zero external audio files, works offline & instantly on all modern browsers.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      const saved = localStorage.getItem('iching_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch (e) {}
  }

  initCtx() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  isSoundEnabled() {
    return this.enabled;
  }

  toggleSound() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('iching_sound_enabled', String(this.enabled));
    } catch (e) {}
    if (this.enabled) {
      this.playCoinClink(1.2, 0.4);
    }
    return this.enabled;
  }

  setSoundEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem('iching_sound_enabled', String(this.enabled));
    } catch (e) {}
  }

  /**
   * Sound when coins are tossed up into the air (Whoosh + metallic spin chime)
   */
  playCoinToss() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Air whoosh (filtered white noise)
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
    filter.Q.value = 3.0;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. High-pitch metallic spin glitter
    [3200, 4100, 5400].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 80 - 40), now + idx * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.18);

      gain.gain.setValueAtTime(0.04, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.03);
      osc.stop(now + 0.22);
    });
  }

  /**
   * Sound when a single bronze coin hits the tray and clatters
   */
  playSingleCoinLand(delay = 0, pitch = 1.0, volume = 0.3) {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;

    // Harmonic frequencies of antique bronze coin ringing
    const baseFreqs = [2450, 3620, 5100, 7200];
    const decayTimes = [0.22, 0.16, 0.12, 0.08];

    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * pitch, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * pitch * 0.96, startTime + decayTimes[idx]);

      const amp = (volume * (1 - idx * 0.2)) / baseFreqs.length;
      gain.gain.setValueAtTime(amp, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTimes[idx]);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + decayTimes[idx] + 0.02);
    });

    // Wood/Tray thud impact
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(140 * pitch, startTime);
    thud.frequency.exponentialRampToValueAtTime(45, startTime + 0.06);

    thudGain.gain.setValueAtTime(volume * 0.35, startTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(startTime);
    thud.stop(startTime + 0.07);
  }

  /**
   * Realistic 3 coins clattering and settling down in divination tray
   */
  playCoinClink(pitchMultiplier = 1.0, volume = 0.35) {
    if (!this.enabled) return;
    // 3 coins land with realistic slight micro-delays (0ms, 45ms, 95ms) and tiny bounces
    this.playSingleCoinLand(0.0, 1.05 * pitchMultiplier, volume);
    this.playSingleCoinLand(0.045, 0.94 * pitchMultiplier, volume * 0.9);
    this.playSingleCoinLand(0.095, 1.12 * pitchMultiplier, volume * 0.85);

    // Minor settling micro-bounce
    this.playSingleCoinLand(0.145, 1.25 * pitchMultiplier, volume * 0.4);
    this.playSingleCoinLand(0.185, 0.98 * pitchMultiplier, volume * 0.3);
  }

  /**
   * Gentle, soothing Singing Bowl / Zen Bell chime for the 10-second mindfulness focus
   */
  playMeditationBell() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const harmonics = [
      { f: 528, a: 0.22, d: 3.5 }, // 528Hz Solfeggio frequency (Love & clarity)
      { f: 1056, a: 0.12, d: 2.5 },
      { f: 1584, a: 0.06, d: 1.8 }
    ];

    harmonics.forEach(({ f, a, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(a, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + d + 0.1);
    });
  }

  /**
   * Resonant Tibetan Singing Bowl / Temple Gong chime when full hexagram is complete
   */
  playHexagramComplete() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [432, 864, 1296, 1728, 2592]; // Harmonic sacred frequencies

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = 0.25 / (idx + 1);
      const decay = 1.8 - idx * 0.25;

      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  }
}

export const soundEngine = new SoundEngine();

