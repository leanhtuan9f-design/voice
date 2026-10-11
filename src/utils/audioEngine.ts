import { VoicePreset, EmotionType } from '../types/tts';
import { buildVocalAcousticChain, shiftPitchAndPreserveTempo } from './vocalResonator';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private cachedAudioBuffers: Map<string, AudioBuffer> = new Map();

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public getAnalyser(): AnalyserNode {
    const ctx = this.getAudioContext();
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.75;
    }
    return this.analyser;
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Synthesize via server endpoint (generates 100% native Vietnamese audio)
  public async synthesizeViaServer({
    text,
    voice,
    speed = 1.0,
    pitch = 0,
    emotion = 'natural',
    sampleRate = 48000,
    cloneProfile,
  }: {
    text: string;
    voice: VoicePreset;
    speed?: number;
    pitch?: number;
    emotion?: EmotionType;
    sampleRate?: number;
    cloneProfile?: any;
  }) {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId: voice.id,
        speed,
        pitch,
        emotion,
        sampleRate,
        cloneProfile,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Lỗi khi gọi API tổng hợp giọng nói');
    }

    return response.json();
  }

  // Play audio with authentic voice persona modulation (Gender, Pitch, Dialect, Formants)
  public async playVoiceAudio({
    audioBase64,
    mimeType = 'audio/mpeg',
    voice,
    speed = 1.0,
    pitch = 0,
    emotion = 'natural',
    onStart,
    onEnded,
  }: {
    audioBase64: string;
    mimeType?: string;
    voice: VoicePreset;
    speed?: number;
    pitch?: number;
    emotion?: EmotionType;
    onStart?: () => void;
    onEnded?: () => void;
  }) {
    this.stopPlayback();

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    const analyser = this.getAnalyser();

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Check cache or decode
      const rawCacheKey = audioBase64.slice(0, 64) + len;
      let rawBuffer = this.cachedAudioBuffers.get(rawCacheKey);
      if (!rawBuffer) {
        rawBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
        this.cachedAudioBuffers.set(rawCacheKey, rawBuffer);
      }

      // --------------------------------------------------------------------
      // Authentic Persona Pitch & Timbre Modeling
      // --------------------------------------------------------------------
      // Adult Vietnamese female is ~210Hz.
      // Child F0: ~280Hz - 330Hz.
      // With our SOLA engine, pitch is shifted to authentic child frequency
      // WITHOUT speeding up into an unintelligible chipmunk
      // and WITHOUT slowing down into a sluggish, dragging voice!
      let playBuffer = rawBuffer;

      if (voice.ageGroup === 'child') {
        const isSouth = voice.dialect === 'south';
        // Southern children: softer, lively, slightly bouncier cadence
        // Northern children: crisp, bright, ringing tone
        let childPitchRatio = 1.30;
        let childTargetTempo = 1.03;

        if (isSouth) {
          // Southern kid: Bo (~1.27x F0 ~270Hz, slightly faster energetic pace 1.05x)
          // Southern kid: Miu (~1.32x F0 ~285Hz, sweet gentle rhythm 1.01x)
          childPitchRatio = voice.gender === 'male' ? 1.27 : 1.32;
          childTargetTempo = voice.gender === 'male' ? 1.05 : 1.01;
        } else {
          // Northern kid: Bap (~1.29x F0 ~275Hz), Bong (~1.35x F0 ~290Hz)
          childPitchRatio = voice.gender === 'male' ? 1.29 : 1.35;
          childTargetTempo = voice.gender === 'male' ? 1.04 : 1.02;
        }

        const processedCacheKey = `child_${voice.id}_${rawCacheKey}`;
        let cachedChild = this.cachedAudioBuffers.get(processedCacheKey);
        if (!cachedChild) {
          cachedChild = shiftPitchAndPreserveTempo(ctx, rawBuffer, childPitchRatio, childTargetTempo);
          this.cachedAudioBuffers.set(processedCacheKey, cachedChild);
        }
        playBuffer = cachedChild;
      } else if (voice.gender === 'male') {
        // Authentic Vietnamese male baritone (~130Hz - 150Hz)
        const malePitchRatio = 0.82;
        const maleTargetTempo = 1.0;
        const processedCacheKey = `male_${voice.id}_${rawCacheKey}`;
        let cachedMale = this.cachedAudioBuffers.get(processedCacheKey);
        if (!cachedMale) {
          cachedMale = shiftPitchAndPreserveTempo(ctx, rawBuffer, malePitchRatio, maleTargetTempo);
          this.cachedAudioBuffers.set(processedCacheKey, cachedMale);
        }
        playBuffer = cachedMale;
      }

      const source = ctx.createBufferSource();
      source.buffer = playBuffer;

      // Add user pitch slider
      const userPitchSemitones = pitch + (voice.pitchOffset || 0);
      const userMultiplier = Math.pow(2, userPitchSemitones / 24);

      // Emotion modulation
      let emotionMod = 1.0;
      if (emotion === 'happy' || emotion === 'excited') emotionMod = 1.02;
      else if (emotion === 'sad') emotionMod = 0.96;
      else if (emotion === 'whisper') emotionMod = 0.95;

      const finalRate = Math.max(
        0.5,
        Math.min(
          2.0,
          speed * userMultiplier * (voice.ageGroup === 'child' ? 1.0 : (voice.speedMultiplier || 1.0)) * emotionMod
        )
      );

      source.playbackRate.value = finalRate;

      // Build dedicated vocal acoustic tract graph (formants, chest EQ cut, highshelf air)
      const vocalChain = buildVocalAcousticChain(ctx, voice, emotion);

      // Connect: source -> vocalChain.inputNode ... vocalChain.outputNode -> analyser -> ctx.destination
      source.connect(vocalChain.inputNode);
      vocalChain.outputNode.connect(analyser);
      analyser.connect(ctx.destination);

      source.onended = () => {
        this.isPlaying = false;
        this.currentSourceNode = null;
        if (onEnded) onEnded();
      };

      source.start(0);
      this.currentSourceNode = source;
      this.isPlaying = true;
      if (onStart) onStart();
    } catch (err) {
      console.warn('Web Audio playback error, using standard audio element:', err);
      // Fallback to standard HTML5 audio
      const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
      audio.playbackRate = speed;
      audio.onended = () => {
        this.isPlaying = false;
        this.currentHtmlAudio = null;
        if (onEnded) onEnded();
      };
      audio.play().then(() => {
        this.isPlaying = true;
        this.currentHtmlAudio = audio;
        if (onStart) onStart();
      }).catch(() => {
        this.isPlaying = false;
        if (onEnded) onEnded();
      });
    }
  }

  // Stop playback immediately
  public stopPlayback() {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {}
      this.currentSourceNode = null;
    }

    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
      this.currentHtmlAudio.currentTime = 0;
      this.currentHtmlAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.isPlaying = false;
  }

  // Download base64 audio as file
  public downloadAudio(base64Data: string, filename = 'vieneu-speech.mp3', mimeType = 'audio/mpeg') {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

export const audioEngine = new AudioEngine();
