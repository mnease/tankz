/** Lightweight WebAudio SFX — unlocked on first user gesture. */

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain = 0.08,
  slideTo?: number,
) {
  if (!unlocked) return;
  const c = getCtx();
  if (!c || c.state !== "running") return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  }
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  fire() {
    tone(220, 0.08, "square", 0.05, 90);
  },
  hit() {
    tone(140, 0.1, "sawtooth", 0.06, 50);
  },
  explode() {
    tone(80, 0.28, "sawtooth", 0.09, 30);
    tone(50, 0.35, "triangle", 0.05, 20);
  },
  wall() {
    tone(180, 0.06, "triangle", 0.04, 100);
  },
  pickup() {
    tone(520, 0.08, "sine", 0.05);
    tone(780, 0.12, "sine", 0.04);
  },
  hurt() {
    tone(90, 0.18, "square", 0.07, 40);
  },
  win() {
    tone(440, 0.1, "sine", 0.05);
    setTimeout(() => tone(660, 0.12, "sine", 0.05), 90);
    setTimeout(() => tone(880, 0.18, "sine", 0.05), 180);
  },
  start() {
    tone(300, 0.1, "square", 0.04);
    tone(450, 0.14, "square", 0.035);
  },
};
