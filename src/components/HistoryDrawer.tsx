import React from 'react';
import {
  X,
  Play,
  Download,
  Trash2,
  Copy,
  Clock,
  Mic2,
  FileText,
} from 'lucide-react';
import { SynthesisHistoryItem } from '../types/tts';
import { audioEngine } from '../utils/audioEngine';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SynthesisHistoryItem[];
  onClearHistory: () => void;
  onUseText: (text: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onUseText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Lịch sử tạo âm thanh ({history.length})</h3>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Xóa tất cả lịch sử"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 space-y-2">
              <FileText className="h-10 w-10 text-slate-700" />
              <p className="text-xs">Chưa có bản ghi nào trong lịch sử.</p>
              <p className="text-[11px] text-slate-600">
                Các đoạn âm thanh bạn tạo trong Studio sẽ được tự động lưu tại đây.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5 hover:border-slate-700 transition"
              >
                {/* Item Top: Voice Name & Time */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-400">{item.voiceName}</span>
                    <span className="text-[10px] text-slate-500">• {item.duration}s</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                </div>

                {/* Text snippet */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {item.text}
                </p>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1">
                    {item.audioBase64 && (
                      <button
                        onClick={() =>
                          audioEngine.playVoiceAudio({
                            audioBase64: item.audioBase64!,
                            voice: {
                              id: item.voiceId,
                              name: item.voiceName,
                              vietnameseName: item.voiceName,
                              gender: (item.gender || 'male') as any,
                              dialect: (item.dialect || 'north') as any,
                              speedMultiplier: item.speed || 1.0,
                              pitchOffset: item.pitch || 0,
                              regionName: '',
                              style: '',
                              description: '',
                              sampleText: '',
                              avatarSeed: '',
                              formants: { f1: 500, f2: 1500, f3: 2500 },
                            },
                          })
                        }
                        className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                      >
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                        <span>Nghe</span>
                      </button>
                    )}

                    {item.audioBase64 && (
                      <button
                        onClick={() =>
                          audioEngine.downloadAudio(
                            item.audioBase64!,
                            `vieneu-${item.voiceName}-${Date.now()}.mp3`
                          )
                        }
                        className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Tải tệp âm thanh"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onUseText(item.text);
                      onClose();
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 transition"
                  >
                    Dùng lại văn bản này
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
