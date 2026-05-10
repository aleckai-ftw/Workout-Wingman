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

/** Short single beep — used for interval alerts during countdown. */
export function playIntervalAlert(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 880, ctx.currentTime, 0.35);
  // Close context after tone finishes to free resources
  setTimeout(() => ctx.close(), 600);
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
