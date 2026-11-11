/** A short, soft chime made with the Web Audio API. No sound file is used, so nothing is downloaded. */

type AudioContextConstructor = typeof AudioContext;

/** Creates the audio context. Call it from a click or key press only, because browsers require a user gesture. */
export function createAudioContext(): AudioContext | undefined {
  try {
    const win = window as unknown as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor };
    const Ctor = win.AudioContext ?? win.webkitAudioContext;
    return Ctor ? new Ctor() : undefined;
  } catch {
    return undefined;
  }
}

/** One sine tone gliding from 440 Hz to 330 Hz over about 0.35 seconds at low volume. Never throws. */
export function playChime(context: AudioContext): void {
  try {
    void context.resume?.();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.linearRampToValueAtTime(330, now + 0.35);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  } catch {
    // Sound is a nice extra; if it fails, stay silent.
  }
}