/**
 * Screen Wake Lock API wrapper.
 * Keeps the device screen on while a timer is active.
 * Silently no-ops in environments that don't support the API.
 */

let sentinel: WakeLockSentinel | null = null;

export async function acquireWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    // Re-acquire if the page becomes visible again (e.g. user switches tabs)
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    // Permission denied or not supported — safe to ignore
  }
}

export function releaseWakeLock(): void {
  sentinel?.release();
  sentinel = null;
}
