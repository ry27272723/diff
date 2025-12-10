
let audioCtx: AudioContext | null = null;
let lastImpactTime = 0;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playImpact = (velocity: number) => {
  if (!audioCtx) return;

  // Debounce multiple simultaneous impacts slightly
  const now = Date.now();
  if (now - lastImpactTime < 40) return;
  lastImpactTime = now;

  // Normalize intensity based on velocity (cap at some reasonable px/frame value like 30)
  const intensity = Math.min(Math.abs(velocity) / 25, 1);
  if (intensity < 0.1) return; // Too quiet to play

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  // Deep, thud-like sine wave
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80 + (intensity * 50), t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

  // Percussive envelope
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(intensity * 0.4, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  osc.start(t);
  osc.stop(t + 0.2);
};

export const playPlacement = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  // Crisp, high-pitched "tick" or "pop"
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);

  // Filter to remove some harshness
  filter.type = 'lowpass';
  filter.frequency.value = 2000;

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  osc.start(t);
  osc.stop(t + 0.1);
};
