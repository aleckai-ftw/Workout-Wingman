/**
 * Synthesized sounds via Web Audio API.
 * Each function creates its own AudioContext to comply with mobile autoplay policies.
 */

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gain = 0.4,
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * Incremental blips — plays `count` short beeps, 250 ms apart.
 * Called on each interval alert; count increments with each alert.
 */
export function playIntervalAlert(count = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gap = 0.25; // seconds between blips
  for (let i = 0; i < count; i++) {
    playTone(ctx, 880, now + i * gap, 0.2);
  }
  const totalDuration = (count * gap + 0.3) * 1000;
  setTimeout(() => ctx.close(), totalDuration);
}

/** Single soft blip — halfway-through rest reminder. */
export function playHalfwayBlip(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 660, ctx.currentTime, 0.18, 0.25);
  setTimeout(() => ctx.close(), 500);
}

/** Four regular-pitch blips then one higher — rest timer ending sequence. */
export function playRestEndingSequence(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gap = 0.22;
  for (let i = 0; i < 4; i++) playTone(ctx, 880, now + i * gap, 0.15);
  // higher final blip on the 5th beat, played when timer hits 0
  setTimeout(() => ctx.close(), 2000);
}

/** Single high blip — rest period over, back to work. */
export function playRestComplete(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 1320, ctx.currentTime, 0.35, 0.45);
  setTimeout(() => ctx.close(), 700);
}

/** Descending fanfare — signals that warm-up has ended and the main timer is starting. */
export function playWarmupComplete(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 523, now, 0.25);       // C5
  playTone(ctx, 659, now + 0.25, 0.25); // E5
  playTone(ctx, 784, now + 0.5, 0.5);  // G5
  setTimeout(() => ctx.close(), 1500);
}

/** Ascending 3-tone sequence — used when a countdown completes. */
export function playCompletionAlarm(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 660, now, 0.8);
  playTone(ctx, 880, now + 0.9, 0.8);
  playTone(ctx, 1100, now + 1.8, 0.8);
  setTimeout(() => ctx.close(), 3500);
}
