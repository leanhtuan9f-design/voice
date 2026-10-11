import React, { useState, useRef } from 'react';
import {
  Upload,
  Mic,
  Square,
  Play,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Dna,
  ShieldCheck,
  Activity,
  Layers,
  Wand2,
} from 'lucide-react';
import { ClonedVoiceProfile } from '../types/tts';

interface VoiceCloningStudioProps {
  onClonedVoiceCreated: (profile: ClonedVoiceProfile) => void;
  clonedVoices: ClonedVoiceProfile[];
  onSelectForStudio: (profile: ClonedVoiceProfile) => void;
}

export const VoiceCloningStudio: React.FC<VoiceCloningStudioProps> = ({
  onClonedVoiceCreated,
  clonedVoices,
  onSelectForStudio,
}) => {
  const [voiceName, setVoiceName] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedProfile, setAnalyzedProfile] = useState<ClonedVoiceProfile | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 6) {
            // VieNeu-TTS standard is 3-5 seconds
            stopRecording();
            return 6;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Cannot access microphone:', err);
      alert('Không thể truy cập microphone. Vui lòng cấp quyền hoặc tải tệp âm thanh lên.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioUrl(url);
      if (!voiceName) {
        setVoiceName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Analyze and clone voice
  const handleAnalyzeAndClone = async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/clone-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Data,
            fileName: voiceName || 'Giọng nhân bản mới',
          }),
        });

        const data = await res.json();
        if (data.success && data.profile) {
          const profile: ClonedVoiceProfile = {
            id: data.profile.id,
            name: voiceName || data.profile.name,
            audioUrl: audioUrl || undefined,
            detectedGender: data.profile.detectedGender,
            estimatedF0: data.profile.estimatedF0,
            warmthScore: data.profile.warmthScore,
            clarityScore: data.profile.clarityScore,
            referenceLength: data.profile.referenceLength,
            formants: data.profile.formants,
            similarityScore: data.profile.similarityScore,
            createdAt: new Date().toLocaleTimeString(),
          };

          setAnalyzedProfile(profile);
          onClonedVoiceCreated(profile);
        }
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error('Clone failed:', err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center gap-1 rounded-md bg-purple-500/20 px-2 text-xs font-bold text-purple-300 border border-purple-500/30">
                <Dna className="h-3.5 w-3.5" />
                Zero-Shot Instant Voice Cloning
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                Chỉ cần 3-5 giây âm thanh
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Phòng thu nhân bản giọng nói tức thì VieNeu-TTS
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Trích xuất vector đặc trưng âm sắc (speaker embeddings) từ đoạn ghi âm ngắn của bạn.
              Không cần văn bản tham chiếu (zero-text reference), hỗ trợ suy luận on-device với độ chính xác cao.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-200">AI Watermarking</p>
              <p className="text-[10px] text-slate-400">Tự động gắn mã nhận diện an toàn AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Upload / Record Audio */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Cung cấp mẫu giọng tham chiếu (3 - 5 giây)
            </h4>

            {/* Voice Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Tên giọng nhân bản:
              </label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Ví dụ: Giọng của Tuan, Giọng đọc tự sự của tôi..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
              />
            </div>

            {/* Action buttons: Record or Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mic recording button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition ${
                  isRecording
                    ? 'border-rose-500 bg-rose-950/30 text-rose-300 animate-pulse'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isRecording ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isRecording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {isRecording ? `Đang thu âm... (${recordingSeconds}s)` : 'Ghi âm trực tiếp'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isRecording ? 'Bấm để dừng hoặc tự động dừng ở 5s' : 'Sử dụng micro máy tính/điện thoại'}
                  </p>
                </div>
              </button>

              {/* Upload file button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center text-slate-300 hover:border-slate-700 hover:bg-slate-950 transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Tải tệp âm thanh</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">WAV, MP3, M4A hoặc OGG (3 - 5s)</p>
                </div>
              </button>
            </div>

            {/* Audio Preview if available */}
            {audioUrl && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {voiceName || 'Bản ghi âm mẫu'}
                    </p>
                    <p className="text-[10px] text-slate-400">Đã sẵn sàng để trích xuất đặc trưng giọng</p>
                  </div>
                </div>

                <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
              </div>
            )}

            {/* Start Cloning button */}
            <button
              onClick={handleAnalyzeAndClone}
              disabled={!audioBlob || isAnalyzing}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold text-slate-950 transition ${
                !audioBlob || isAnalyzing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 hover:opacity-95 shadow-lg shadow-purple-500/20 active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Đang trích xuất F0 & Timbre Embeddings...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Khởi tạo & Nhân bản giọng tức thì</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Acoustic Feature Analysis & Cloned Profiles */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>2. Phân tích âm sắc & Thông số</span>
              <Activity className="h-4 w-4 text-purple-400" />
            </h4>

            {analyzedProfile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Đã trích xuất thành công hồ sơ âm thanh!</span>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Tần số cơ bản (F0)</span>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      {analyzedProfile.estimatedF0} Hz
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Giới tính phát hiện</span>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {analyzedProfile.detectedGender === 'female' ? 'Nữ (Female)' : 'Nam (Male)'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Độ ấm âm sắc (Warmth)</span>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {analyzedProfile.warmthScore}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Độ tương đồng</span>
                    <p className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                      {analyzedProfile.similarityScore}%
                    </p>
                  </div>
                </div>

                {/* Formants */}
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Cấu trúc Formants:</span>
                    <span className="font-mono text-cyan-400">
                      F1: {analyzedProfile.formants.f1}Hz | F2: {analyzedProfile.formants.f2}Hz | F3: {analyzedProfile.formants.f3}Hz
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: '35%' }} />
                    <div className="bg-cyan-500 h-full" style={{ width: '45%' }} />
                    <div className="bg-purple-500 h-full" style={{ width: '20%' }} />
                  </div>
                </div>

                {/* Use in Studio button */}
                <button
                  onClick={() => onSelectForStudio(analyzedProfile)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Sử dụng giọng này ngay trong TTS Studio</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-slate-500 text-xs">
                Chưa có dữ liệu trích xuất. Hãy ghi âm hoặc tải tệp lên ở bước 1 để bắt đầu phân tích.
              </div>
            )}
          </div>

          {/* List of saved cloned voices */}
          {clonedVoices.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Danh sách giọng đã clone ({clonedVoices.length})</span>
                <Layers className="h-3.5 w-3.5 text-slate-400" />
              </h4>

              <div className="space-y-2">
                {clonedVoices.map((voice) => (
                  <div
                    key={voice.id}
                    className="flex items-center justify-between rounded-xl bg-slate-950/80 p-2.5 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold">
                        🧬
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{voice.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {voice.detectedGender === 'female' ? 'Nữ' : 'Nam'} • {voice.createdAt}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectForStudio(voice)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                    >
                      Dùng giọng này
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
