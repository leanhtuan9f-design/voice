export interface VoicePreset {
  id: string;
  name: string;
  vietnameseName: string;
  dialect: 'north' | 'central' | 'south'; // Bắc, Trung, Nam
  regionName: string;
  gender: 'male' | 'female';
  ageGroup?: 'adult' | 'child';
  style: string;
  description: string;
  sampleText: string;
  isDefault?: boolean;
  avatarSeed: string;
  geminiVoice?: string;
  pitchOffset: number;
  speedMultiplier: number;
  formants: { f1: number; f2: number; f3: number };
}

export type EmotionType =
  | 'natural'
  | 'happy'
  | 'sad'
  | 'excited'
  | 'whisper'
  | 'serious'
  | 'angry'
  | 'surprised';

export interface EmotionOption {
  id: EmotionType;
  label: string;
  tag: string;
  emoji: string;
  description: string;
}

export interface ClonedVoiceProfile {
  id: string;
  name: string;
  audioUrl?: string;
  detectedGender: 'male' | 'female';
  estimatedF0: number;
  warmthScore: number;
  clarityScore: number;
  referenceLength: string;
  formants: { f1: number; f2: number; f3: number };
  similarityScore: number;
  createdAt: string;
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  emotion: EmotionType;
  audioUrl?: string;
  audioBase64?: string;
  duration?: number;
  isSynthesizing?: boolean;
}

export interface SynthesisHistoryItem {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  dialect: string;
  gender: string;
  audioUrl: string;
  audioBase64?: string;
  duration: number;
  speed: number;
  pitch: number;
  emotion: EmotionType;
  sampleRate: number;
  engine: string;
  timestamp: string;
}
