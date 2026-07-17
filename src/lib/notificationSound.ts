/**
 * Short two-tone chime for new notifications, synthesized via the Web Audio
 * API (no audio asset to ship/license). Browsers block audio before any user
 * gesture on the page — that's expected and fine here, since by the time a
 * notification arrives the user has almost always already interacted with
 * the page; failures are swallowed silently either way.
 */
let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx!.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  } catch {
    // Audio unavailable/blocked — not worth surfacing to the user.
  }
}
