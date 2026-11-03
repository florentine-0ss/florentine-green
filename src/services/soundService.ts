// Web Audio API Synthesizer for instant, zero-latency Rwandan presence & message chimes
class SoundService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    try {
      const stored = localStorage.getItem('fofo_chat_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    try {
      localStorage.setItem('fofo_chat_sound_enabled', String(this.soundEnabled));
    } catch {}
    if (this.soundEnabled) {
      this.playTone(523.25, 100);
    }
    return this.soundEnabled;
  }

  // Friendly double-tone chime when a new member joins the system
  public playMemberJoined() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(523.25, 110, now); // C5
    this.playTone(659.25, 160, now + 0.11); // E5
  }

  // Crisp notification chime when a new message is received
  public playMessageReceived() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(659.25, 90, now); // E5
    this.playTone(880.00, 150, now + 0.09); // A5
  }

  private playTone(freq: number, durationMs: number, startTime?: number) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = startTime || this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + durationMs / 1000);
    } catch {}
  }
}

export const soundService = new SoundService();
