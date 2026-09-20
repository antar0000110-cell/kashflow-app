/**
 * Web Audio API Synthesizer for Real-Time Financial & 90-Second Alerts
 */

import { StorageUtil, STORAGE_KEYS } from './storage';

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Plays a pleasant 3-tone notification chime
  public playTransactionChime() {
    if (!this.soundEnabled) return;
    try {
      const role = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
      if (!role || role === 'guest') return;


      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (err) {
      console.warn('Audio alert skipped:', err);
    }
  }

  // Plays a distinctive 90-second operational cycle alert
  public playIntervalPulseChime() {
    if (!this.soundEnabled) return;
    try {
      const role = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
      if (!role || role === 'guest') return;

      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const freqs = [440, 880];

      freqs.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.01, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    } catch (err) {
      console.warn('Audio alert skipped:', err);
    }
  }

  // Test sound triggered by user click
  public playTestSound() {
    this.initContext();
    this.playTransactionChime();
  }
}

export const soundManager = new SoundAlertManager();
