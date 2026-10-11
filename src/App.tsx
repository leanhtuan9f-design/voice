/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VIENEU_VOICES, EMOTIONS, SAMPLE_PROMPTS } from './data/voices';
import { VoicePreset, EmotionType, ClonedVoiceProfile, SynthesisHistoryItem } from './types/tts';
import { audioEngine } from './utils/audioEngine';
import { normalizeVietnameseTextClient } from './utils/normalizer';

import { Header } from './components/Header';
import { AudioVisualizer } from './components/AudioVisualizer';
import { VoiceSelector } from './components/VoiceSelector';
import { VoiceCloningStudio } from './components/VoiceCloningStudio';
import { DialogueStudio } from './components/DialogueStudio';
import { NormalizerLab } from './components/NormalizerLab';
import { ApiPlayground } from './components/ApiPlayground';
import { ModelArchitectureModal } from './components/ModelArchitectureModal';
import { HistoryDrawer } from './components/HistoryDrawer';

import {
  Mic,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Sliders,
  Radio,
  FileText,
  Volume2,
  Tag,
  Zap,
  Globe2,
  CheckCircle,
  AlertCircle,
  Bookmark,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');

  // Voices state
  const [selectedVoice, setSelectedVoice] = useState<VoicePreset>(VIENEU_VOICES[0]);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoiceProfile[]>(() => {
    try {
      const saved = localStorage.getItem('vieneu_cloned_voices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedClonedVoice, setSelectedClonedVoice] = useState<ClonedVoiceProfile | null>(null);

  // Studio text & synthesis params
  const [inputText, setInputText] = useState(
    'Chào mừng bạn đến với VieNeu-TTS v3 Turbo, mô hình tổng hợp giọng nói tiếng Việt on-device chất lượng cao 48kHz, hỗ trợ nhân bản giọng tức thì và phát âm tiếng Anh xen kẽ cực kỳ tự nhiên.'
  );
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>('natural');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [sampleRate, setSampleRate] = useState<48000 | 24000>(48000);

  // Synthesis output state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/mpeg');
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioEngineUsed, setAudioEngineUsed] = useState('vieneu-v3-turbo');

  // History & Modals
  const [history, setHistory] = useState<SynthesisHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vieneu_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [autoNormalize, setAutoNormalize] = useState(true);

  // Save history & cloned voices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vieneu_cloned_voices', JSON.stringify(clonedVoices));
    } catch (e) {
      console.warn('Failed to save cloned voices:', e);
    }
  }, [clonedVoices]);

  useEffect(() => {
    try {
      localStorage.setItem('vieneu_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [history]);

  // Insert emotion cue tag at cursor or end of input
  const insertTag = (tag: string) => {
    setInputText((prev) => `${prev} ${tag} `);
  };

  const handleStopSpeech = () => {
    audioEngine.stopPlayback();
    setIsSpeaking(false);
    setIsSynthesizing(false);
  };

  const handlePlaySpeech = () => {
    if (currentAudioBase64) {
      setIsSpeaking(true);
      audioEngine.playVoiceAudio({
        audioBase64: currentAudioBase64,
        mimeType: audioMimeType,
        voice: selectedVoice,
        speed,
        pitch,
        emotion: selectedEmotion,
        onStart: () => setIsSpeaking(true),
        onEnded: () => setIsSpeaking(false),
      });
    } else {
      handleSynthesize();
    }
  };

  // Main synthesis trigger: Synthesizes real native Vietnamese audio and plays it with character acoustic DSP
  const handleSynthesize = async () => {
    if (!inputText.trim()) return;

    // Toggle stop if already speaking
    if (isSpeaking) {
      handleStopSpeech();
      return;
    }

    const textToSynthesize = autoNormalize
      ? normalizeVietnameseTextClient(inputText).normalizedText
      : inputText;

    setIsSynthesizing(true);

    try {
      const result = await audioEngine.synthesizeViaServer({
        text: textToSynthesize,
        voice: selectedVoice,
        speed,
        pitch,
        emotion: selectedEmotion,
        sampleRate,
        cloneProfile: selectedClonedVoice,
      });

      if (result.audioBase64) {
        setCurrentAudioBase64(result.audioBase64);
        setAudioMimeType(result.mimeType || 'audio/mpeg');
        setAudioDuration(result.duration);
        setAudioEngineUsed(result.engine);

        // Add to history
        const newHistoryItem: SynthesisHistoryItem = {
          id: Date.now().toString(),
          text: inputText,
          voiceId: selectedClonedVoice ? selectedClonedVoice.id : selectedVoice.id,
          voiceName: selectedClonedVoice ? selectedClonedVoice.name : selectedVoice.vietnameseName,
          dialect: selectedVoice.dialect,
          gender: selectedVoice.gender,
          audioUrl: '',
          audioBase64: result.audioBase64,
          duration: result.duration,
          speed,
          pitch,
          emotion: selectedEmotion,
          sampleRate,
          engine: result.engine,
          timestamp: new Date().toLocaleTimeString(),
        };

        setHistory((prev) => [newHistoryItem, ...prev.slice(0, 24)]);

        // Play immediately with authentic persona DSP
        setIsSpeaking(true);
        await audioEngine.playVoiceAudio({
          audioBase64: result.audioBase64,
          mimeType: result.mimeType || 'audio/mpeg',
          voice: selectedVoice,
          speed,
          pitch,
          emotion: selectedEmotion,
          onStart: () => setIsSpeaking(true),
          onEnded: () => setIsSpeaking(false),
        });
      }
    } catch (err) {
      console.warn('Synthesis error:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleClonedVoiceCreated = (profile: ClonedVoiceProfile) => {
    setClonedVoices((prev) => [profile, ...prev]);
    setSelectedClonedVoice(profile);
  };

  const handleSelectClonedVoiceForStudio = (profile: ClonedVoiceProfile) => {
    setSelectedClonedVoice(profile);
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Top Audio Player Visualizer */}
            <AudioVisualizer
              audioBase64={currentAudioBase64}
              mimeType={audioMimeType}
              duration={audioDuration}
              engine={audioEngineUsed}
              sampleRate={sampleRate}
              voiceName={selectedClonedVoice ? selectedClonedVoice.name : selectedVoice.vietnameseName}
              isSpeaking={isSpeaking}
              onPlayClick={handlePlaySpeech}
              onStopClick={handleStopSpeech}
            />

            {/* Studio Workspace: Left Editor, Right Voice & Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Text Input & Expressive Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
                  {/* Textarea Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Nội dung cần chuyển thành giọng nói
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoNormalize}
                          onChange={(e) => setAutoNormalize(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                        />
                        <span>Tự động chuẩn hóa số & viết tắt</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {inputText.length} ký tự
                      </span>
                    </div>
                  </div>

                  {/* Emotion Cue Tags Quick-insert Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Tag className="h-3 w-3 text-emerald-400" />
                      <span className="font-medium">Chèn thẻ cảm xúc & ngắt nghỉ inline:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOTIONS.map((em) => (
                        <button
                          key={em.id}
                          onClick={() => insertTag(em.tag)}
                          className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-slate-900 transition"
                          title={em.description}
                        >
                          <span>{em.emoji}</span>
                          <span>{em.tag}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => insertTag('[pause: 0.5s]')}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-cyan-400 hover:border-cyan-500/40 hover:bg-slate-900 transition font-mono"
                      >
                        [pause: 0.5s]
                      </button>
                    </div>
                  </div>

                  {/* Main Textarea */}
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhập đoạn văn bản tiếng Việt hoặc song ngữ Anh - Việt cần đọc..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 leading-relaxed resize-y font-sans"
                  />

                  {/* Sample Prompts Tray */}
                  <div className="space-y-2 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Kịch bản mẫu phong phú:</span>
                      <span className="text-[10px] text-slate-500">Bấm để tải nhanh</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInputText(prompt.text)}
                          className="rounded-lg border border-slate-800/80 bg-slate-950/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 hover:bg-slate-900 transition whitespace-nowrap"
                        >
                          {prompt.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Big Synthesize Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleSynthesize}
                      disabled={!inputText.trim()}
                      className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-6 text-sm font-bold transition-all shadow-xl active:scale-[0.99] ${
                        !inputText.trim()
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : isSpeaking
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 animate-pulse'
                            : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:opacity-95 shadow-emerald-500/25'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="h-4 w-4 fill-current" />
                          <span>
                            Đang phát giọng {selectedClonedVoice ? selectedClonedVoice.name : selectedVoice.vietnameseName} (Bấm để dừng)
                          </span>
                        </>
                      ) : isSynthesizing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                          <span>Đang tải tệp âm thanh 48kHz...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 fill-current" />
                          <span>
                            Tạo giọng nói ngay ({selectedClonedVoice ? selectedClonedVoice.name : selectedVoice.vietnameseName})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Voice Selection & Acoustic Tuning (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Acoustic Tuning Sliders */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Hiệu chỉnh âm học (Acoustic Parameters)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSpeed(1.0);
                        setPitch(0);
                        setSampleRate(48000);
                        setSelectedEmotion('natural');
                      }}
                      className="text-[10px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Mặc định</span>
                    </button>
                  </div>

                  {/* Emotion Palette */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Cảm xúc chính (Emotion Style):
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {EMOTIONS.map((em) => (
                        <button
                          key={em.id}
                          onClick={() => setSelectedEmotion(em.id)}
                          className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition ${
                            selectedEmotion === em.id
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <span className="text-sm">{em.emoji}</span>
                          <span className="text-[10px] mt-0.5 truncate w-full">{em.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders: Speed & Pitch */}
                  <div className="space-y-3 pt-1">
                    {/* Speed slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Tốc độ đọc (Speed):</span>
                        <span className="font-mono text-emerald-400 font-bold">{speed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>0.5x (Chậm)</span>
                        <span>1.0x</span>
                        <span>2.0x (Nhanh)</span>
                      </div>
                    </div>

                    {/* Pitch slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Cao độ âm điệu (Pitch Shift):</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {pitch > 0 ? `+${pitch}` : pitch} semitones
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="1"
                        value={pitch}
                        onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Trầm (-10)</span>
                        <span>0 (Chuẩn)</span>
                        <span>Thanh (+10)</span>
                      </div>
                    </div>

                    {/* Sample rate toggle */}
                    <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                      <span>Độ phân giải mẫu âm:</span>
                      <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                        <button
                          onClick={() => setSampleRate(48000)}
                          className={`rounded px-2 py-0.5 text-[11px] font-mono transition ${
                            sampleRate === 48000
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          48 kHz (Hi-Fi)
                        </button>
                        <button
                          onClick={() => setSampleRate(24000)}
                          className={`rounded px-2 py-0.5 text-[11px] font-mono transition ${
                            sampleRate === 24000
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          24 kHz (Standard)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regional Voice Selector Card Grid */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Kho 23+ Giọng Đọc Vùng Miền
                    </span>
                    {selectedClonedVoice && (
                      <button
                        onClick={() => setSelectedClonedVoice(null)}
                        className="text-[10px] text-purple-400 hover:text-purple-300"
                      >
                        Hủy dùng giọng clone
                      </button>
                    )}
                  </div>

                  <VoiceSelector
                    voices={VIENEU_VOICES}
                    selectedVoice={selectedVoice}
                    onSelectVoice={(v) => {
                      setSelectedVoice(v);
                      setSelectedClonedVoice(null);
                    }}
                    clonedVoices={clonedVoices}
                    selectedClonedVoiceId={selectedClonedVoice?.id || null}
                    onSelectClonedVoice={(cv) => setSelectedClonedVoice(cv)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dialogue Studio */}
        {activeTab === 'dialogue' && <DialogueStudio voices={VIENEU_VOICES} />}

        {/* Tab 3: Voice Cloning Studio */}
        {activeTab === 'cloning' && (
          <VoiceCloningStudio
            onClonedVoiceCreated={handleClonedVoiceCreated}
            clonedVoices={clonedVoices}
            onSelectForStudio={handleSelectClonedVoiceForStudio}
          />
        )}

        {/* Tab 4: Normalizer Sandbox */}
        {activeTab === 'normalizer' && (
          <NormalizerLab
            onSendToStudio={(normalizedText) => {
              setInputText(normalizedText);
              setActiveTab('studio');
            }}
          />
        )}

        {/* Tab 5: API & Docker Playground */}
        {activeTab === 'api' && <ApiPlayground />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            VieNeu-TTS v3 Turbo • Xây dựng dựa trên nghiên cứu của tác giả{' '}
            <strong className="text-slate-400 font-semibold">Phạm Nguyễn Ngọc Bảo (pnnbao97)</strong>
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://github.com/pnnbao97/VieNeu-TTS"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition"
            >
              GitHub Repository
            </a>
            <span>•</span>
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-slate-400 hover:text-emerald-400 transition"
            >
              Thông số kỹ thuật 48kHz
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ModelArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
        onUseText={(text) => setInputText(text)}
      />
    </div>
  );
}
