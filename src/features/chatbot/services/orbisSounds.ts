let audioContext: AudioContext | null = null;

function tone(freqStart: number, freqEnd: number, duration: number) {
  if (typeof window === "undefined" || !window.AudioContext) return;

  audioContext ??= new window.AudioContext();
  if (audioContext.state === "suspended") {
    void audioContext.resume().catch(() => undefined);
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = audioContext.currentTime;
  const end = start + duration;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(freqStart, start);
  oscillator.frequency.exponentialRampToValueAtTime(freqEnd, end);
  gain.gain.setValueAtTime(0.15, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(end);
}

export const playSend = () => tone(520, 780, 0.12);
export const playReceive = () => tone(880, 660, 0.2);