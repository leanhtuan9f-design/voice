import React, { useState } from 'react';
import { VoicePreset, DialogueLine, EmotionType } from '../types/tts';
import { EMOTIONS } from '../data/voices';
import {
  Plus,
  Play,
  Square,
  Trash2,
  Sparkles,
  Users,
  Download,
  MessageSquare,
  Wand2,
  Volume2,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface DialogueStudioProps {
  voices: VoicePreset[];
}

export const DialogueStudio: React.FC<DialogueStudioProps> = ({ voices }) => {
  const [lines, setLines] = useState<DialogueLine[]>([
    {
      id: '1',
      speakerId: 'minh-quan',
      speakerName: 'Minh Quân',
      text: 'Chào Thúy Vy! Hôm nay mình nghe nói bạn vừa thử nghiệm phiên bản mới của VieNeu-TTS phải không?',
      emotion: 'natural',
    },
    {
      id: '2',
      speakerId: 'thuy-vy',
      speakerName: 'Thúy Vy',
      text: 'Đúng rồi anh Quân ơi! Em cực kỳ ấn tượng với khả năng phát âm tiếng Anh xen lẫn tiếng Việt tự nhiên lắm luôn á.',
      emotion: 'excited',
    },
    {
      id: '3',
      speakerId: 'minh-quan',
      speakerName: 'Minh Quân',
      text: 'Chuẩn luôn, model v3 Turbo còn hỗ trợ clone giọng chỉ trong 3 đến 5 giây mà chạy mượt mà ngay trên CPU nữa.',
      emotion: 'happy',
    },
    {
      id: '4',
      speakerId: 'thuy-vy',
      speakerName: 'Thúy Vy',
      text: 'Dạ, chất lượng âm thanh 48kHz nghe rất trong trẻo, không bị méo tiếng chút nào hết á!',
      emotion: 'happy',
    },
  ]);

  const [activePlayingIndex, setActivePlayingIndex] = useState<number | null>(null);
  const [isSynthesizingAll, setIsSynthesizingAll] = useState(false);

  // Add line
  const addLine = () => {
    const defaultVoice = voices[0];
    const newLine: DialogueLine = {
      id: Date.now().toString(),
      speakerId: defaultVoice.id,
      speakerName: defaultVoice.vietnameseName,
      text: '',
      emotion: 'natural',
    };
    setLines([...lines, newLine]);
  };

  // Remove line
  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  // Update line text or speaker
  const updateLine = (id: string, updates: Partial<DialogueLine>) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  // Synthesize single line
  const synthesizeLine = async (index: number) => {
    const line = lines[index];
    const voice = voices.find((v) => v.id === line.speakerId) || voices[0];

    updateLine(line.id, { isSynthesizing: true });

    try {
      const res = await audioEngine.synthesizeViaServer({
        text: line.text,
        voice,
        emotion: line.emotion,
      });

      updateLine(line.id, {
        audioBase64: res.audioBase64,
        duration: res.duration,
        isSynthesizing: false,
      });

      // Play actual spoken Vietnamese voice with character profile
      if (res.audioBase64) {
        setActivePlayingIndex(index);
        await audioEngine.playVoiceAudio({
          audioBase64: res.audioBase64,
          mimeType: res.mimeType || 'audio/mpeg',
          voice,
          emotion: line.emotion,
          onEnded: () => {
            setActivePlayingIndex(null);
            updateLine(line.id, { isSynthesizing: false });
          },
        });
      }
    } catch {
      setActivePlayingIndex(null);
      updateLine(line.id, { isSynthesizing: false });
    }
  };

  // Play entire conversation sequentially
  const playAllConversation = async () => {
    setIsSynthesizingAll(true);

    const playStep = async (stepIndex: number) => {
      if (stepIndex >= lines.length) {
        setIsSynthesizingAll(false);
        setActivePlayingIndex(null);
        return;
      }

      setActivePlayingIndex(stepIndex);
      const current = lines[stepIndex];
      const voice = voices.find((v) => v.id === current.speakerId) || voices[0];

      let audioData = current.audioBase64;
      if (!audioData) {
        try {
          const res = await audioEngine.synthesizeViaServer({
            text: current.text,
            voice,
            emotion: current.emotion,
          });
          if (res.audioBase64) {
            audioData = res.audioBase64;
            updateLine(current.id, { audioBase64: res.audioBase64 });
          }
        } catch {}
      }

      if (audioData) {
        await audioEngine.playVoiceAudio({
          audioBase64: audioData,
          voice,
          emotion: current.emotion,
          onEnded: () => {
            playStep(stepIndex + 1);
          },
        });
      } else {
        playStep(stepIndex + 1);
      }
    };

    playStep(0);
  };

  const stopAll = () => {
    audioEngine.stopPlayback();
    setIsSynthesizingAll(false);
    setActivePlayingIndex(null);
  };

  // Presets
  const loadPreset = (type: 'podcast' | 'support' | 'literature' | 'children') => {
    if (type === 'podcast') {
      setLines([
        {
          id: '1',
          speakerId: 'minh-quan',
          speakerName: 'Minh Quân',
          text: 'Xin chào quý thính giả đang theo dõi chuyên mục Công nghệ và Đời sống!',
          emotion: 'natural',
        },
        {
          id: '2',
          speakerId: 'ha-linh',
          speakerName: 'Hà Linh',
          text: 'Hôm nay chúng mình sẽ cùng thảo luận về sự phát triển vượt bậc của mô hình VieNeu-TTS v3 Turbo.',
          emotion: 'excited',
        },
        {
          id: '3',
          speakerId: 'minh-quan',
          speakerName: 'Minh Quân',
          text: 'Điểm đặc biệt nhất là mô hình có thể chạy torch-free hoàn toàn trên CPU thông qua ONNX Runtime.',
          emotion: 'natural',
        },
      ]);
    } else if (type === 'support') {
      setLines([
        {
          id: '1',
          speakerId: 'bich-tram',
          speakerName: 'Bích Trâm',
          text: 'Dạ, Ngân hàng xin kính chào quý khách, em là Bích Trâm. Em có thể hỗ trợ gì cho anh Tuấn ạ?',
          emotion: 'natural',
        },
        {
          id: '2',
          speakerId: 'tuan-khoi',
          speakerName: 'Tuấn Khôi',
          text: 'Alo chào em! Anh muốn hỏi về thủ tục mở tài khoản thanh toán quốc tế trực tuyến trên app.',
          emotion: 'natural',
        },
        {
          id: '3',
          speakerId: 'bich-tram',
          speakerName: 'Bích Trâm',
          text: 'Dạ vâng, anh chỉ cần chuẩn bị căn cước công dân gắn chip và xác thực eKYC trong 2 phút là xong ngay ạ!',
          emotion: 'happy',
        },
      ]);
    } else if (type === 'children') {
      setLines([
        {
          id: '1',
          speakerId: 'be-bap',
          speakerName: 'Bé Bắp (Bé Trai)',
          text: 'Bông ơi! Ra đây xem con cào cào màu xanh lá cây nhảy cao chưa kìa!',
          emotion: 'excited',
        },
        {
          id: '2',
          speakerId: 'be-bong',
          speakerName: 'Bé Bông (Bé Gái)',
          text: 'Oa, chú cào cào dễ thương quá! Bắp đừng bắt chú nha, để chú bay về với mẹ chú đi!',
          emotion: 'happy',
        },
        {
          id: '3',
          speakerId: 'be-bo',
          speakerName: 'Bé Bo (Bé Trai Sài Gòn)',
          text: 'Mấy bạn ơi, đợi Bo dí theo dí, Bo mang theo mấy cái bong bóng xà phòng đẹp lắm nè!',
          emotion: 'excited',
        },
        {
          id: '4',
          speakerId: 'be-miu',
          speakerName: 'Bé Miu (Bé Gái Miền Nam)',
          text: 'Dạ con chúc cô chú một ngày mới thiệt là vui vẻ và tràn ngập tiếng cười nha!',
          emotion: 'happy',
        },
      ]);
    } else {
      setLines([
        {
          id: '1',
          speakerId: 'mai-phuong',
          speakerName: 'Mai Phương',
          text: 'Sáng nay hồ Gươm mờ sương, tiếng chuông chùa Trấn Quốc vọng lại từ xa xa.',
          emotion: 'sad',
        },
        {
          id: '2',
          speakerId: 'quynh-chi',
          speakerName: 'Quỳnh Chi',
          text: 'Dạ, nghe tiếng chuông mà nhớ tiếng chuông chùa Thiên Mụ bên dòng Hương giang quá chừng.',
          emotion: 'sad',
        },
      ]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Phòng thu kịch bản hội thoại đa nhân vật (Multi-Speaker Dialogue)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Phối hợp nhiều nhân vật với các chất giọng và vùng miền khác nhau (Bắc, Trung, Nam, Giọng Thiếu nhi) trong một kịch bản hoàn chỉnh.
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isSynthesizingAll || activePlayingIndex !== null ? (
            <button
              onClick={stopAll}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400 transition"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Dừng phát</span>
            </button>
          ) : (
            <button
              onClick={playAllConversation}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-xs font-bold text-slate-950 hover:opacity-95 shadow-md shadow-emerald-500/20 transition"
            >
              <Play className="h-4 w-4 fill-current ml-0.5" />
              <span>Phát toàn bộ kịch bản</span>
            </button>
          )}

          <button
            onClick={addLine}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Thêm lời thoại</span>
          </button>
        </div>
      </div>

      {/* Preset script templates */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 shrink-0 font-medium text-[11px]">Kịch bản mẫu:</span>
        <button
          onClick={() => loadPreset('children')}
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300 hover:bg-amber-500/20 transition whitespace-nowrap font-medium"
        >
          🎈 Thiếu nhi líu lo (Bé Bắp & Bé Bông & Bé Bo)
        </button>
        <button
          onClick={() => loadPreset('podcast')}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300 hover:text-emerald-300 hover:border-slate-700 transition whitespace-nowrap"
        >
          🎙️ Phỏng vấn Podcast AI
        </button>
        <button
          onClick={() => loadPreset('support')}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300 hover:text-emerald-300 hover:border-slate-700 transition whitespace-nowrap"
        >
          🏦 Hội thoại CSKH Ngân hàng
        </button>
        <button
          onClick={() => loadPreset('literature')}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-300 hover:text-emerald-300 hover:border-slate-700 transition whitespace-nowrap"
        >
          🌸 Đối thoại thi ca Bắc - Trung
        </button>
      </div>

      {/* Script Lines List */}
      <div className="space-y-3">
        {lines.map((line, index) => {
          const isActive = activePlayingIndex === index;
          const currentVoice = voices.find((v) => v.id === line.speakerId) || voices[0];

          return (
            <div
              key={line.id}
              className={`rounded-2xl border p-4 transition-all ${
                isActive
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 scale-[1.005]'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {/* Line Header */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                    {index + 1}
                  </span>

                  {/* Speaker Selector */}
                  <select
                    value={line.speakerId}
                    onChange={(e) => {
                      const v = voices.find((voice) => voice.id === e.target.value);
                      updateLine(line.id, {
                        speakerId: e.target.value,
                        speakerName: v ? v.vietnameseName : 'Nhân vật',
                      });
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/90 py-1 px-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vietnameseName} ({v.regionName})
                      </option>
                    ))}
                  </select>

                  {/* Emotion Selector */}
                  <select
                    value={line.emotion}
                    onChange={(e) => updateLine(line.id, { emotion: e.target.value as EmotionType })}
                    className="rounded-lg border border-slate-800 bg-slate-950 py-1 px-2 text-[11px] text-slate-300 focus:outline-none"
                  >
                    {EMOTIONS.map((em) => (
                      <option key={em.id} value={em.id}>
                        {em.emoji} {em.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => synthesizeLine(index)}
                    disabled={line.isSynthesizing || !line.text.trim()}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    {line.isSynthesizing ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    ) : (
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    )}
                    <span>{isActive ? 'Đang phát' : 'Nghe câu này'}</span>
                  </button>

                  <button
                    onClick={() => removeLine(line.id)}
                    className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Xóa câu này"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Line Text Area */}
              <div className="mt-2.5">
                <textarea
                  rows={2}
                  value={line.text}
                  onChange={(e) => updateLine(line.id, { text: e.target.value })}
                  placeholder={`Nhập lời thoại cho ${currentVoice.vietnameseName}...`}
                  className="w-full rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none resize-y"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
