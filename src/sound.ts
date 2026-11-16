let ctx: AudioContext | null = null;

/** Browsers only allow audio after a user gesture, so call this from a click handler. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** A short three-note chime, synthesized so no audio asset is needed. */
export function chime() {
  if (!ctx) return;
  const audio = ctx;
  const now = audio.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const start = now + i * 0.16;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.65);
  });
}
