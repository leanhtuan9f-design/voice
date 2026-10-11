import React, { useState } from 'react';
import { VoicePreset } from '../types/tts';
import {
  Search,
  Volume2,
  Check,
  Sparkles,
  MapPin,
  Sliders,
  Filter,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface VoiceSelectorProps {
  voices: VoicePreset[];
  selectedVoice: VoicePreset;
  onSelectVoice: (voice: VoicePreset) => void;
  clonedVoices?: any[];
  selectedClonedVoiceId?: string | null;
  onSelectClonedVoice?: (clonedVoice: any) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  clonedVoices = [],
  selectedClonedVoiceId = null,
  onSelectClonedVoice,
}) => {
  const [activeDialect, setActiveDialect] = useState<'all' | 'child' | 'north' | 'central' | 'south' | 'cloned'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const filteredVoices = voices.filter((v) => {
    if (activeDialect === 'child') {
      if (v.ageGroup !== 'child') return false;
    } else if (activeDialect !== 'all' && activeDialect !== 'cloned') {
      if (v.dialect !== activeDialect) return false;
    }
    if (genderFilter !== 'all' && v.gender !== genderFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.vietnameseName.toLowerCase().includes(q) ||
        v.regionName.toLowerCase().includes(q) ||
        v.style.toLowerCase().includes(q) ||
        (v.ageGroup === 'child' && (q.includes('bé') || q.includes('trẻ') || q.includes('thiếu nhi')))
      );
    }
    return true;
  });

  const handlePreviewVoice = async (e: React.MouseEvent, voice: VoicePreset) => {
    e.stopPropagation();
    if (previewingVoiceId === voice.id) {
      audioEngine.stopPlayback();
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voice.id);
    try {
      const res = await audioEngine.synthesizeViaServer({
        text: voice.sampleText,
        voice,
        speed: voice.speedMultiplier,
      });
      if (res.audioBase64) {
        audioEngine.playVoiceAudio({
          audioBase64: res.audioBase64,
          mimeType: res.mimeType || 'audio/mpeg',
          voice,
          speed: voice.speedMultiplier,
          onEnded: () => setPreviewingVoiceId(null),
        });
      } else {
        setPreviewingVoiceId(null);
      }
    } catch {
      setPreviewingVoiceId(null);
    }
  };

  const dialectLabels = [
    { id: 'all', label: 'Tất cả giọng', count: voices.length },
    { id: 'child', label: '🎈 Thiếu nhi (Trẻ em)', count: voices.filter((v) => v.ageGroup === 'child').length },
    { id: 'north', label: 'Miền Bắc', count: voices.filter((v) => v.dialect === 'north').length },
    { id: 'central', label: 'Miền Trung', count: voices.filter((v) => v.dialect === 'central').length },
    { id: 'south', label: 'Miền Nam', count: voices.filter((v) => v.dialect === 'south').length },
    ...(clonedVoices.length > 0 ? [{ id: 'cloned', label: 'Giọng đã nhân bản', count: clonedVoices.length }] : []),
  ];

  return (
    <div className="space-y-3">
      {/* Header & Dialect Tabs */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {dialectLabels.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDialect(d.id as any)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeDialect === d.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{d.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeDialect === d.id ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {d.count}
              </span>
            </button>
          ))}
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-0.5 border border-slate-800 self-start sm:self-auto">
          {(['all', 'male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                genderFilter === g
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {g === 'all' ? 'Cả hai' : g === 'male' ? 'Nam' : 'Nữ'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên (Minh Quân, Mai Phương...), phong cách (thời sự, tự sự, review...)"
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
      </div>

      {/* Cloned Voices section if any */}
      {activeDialect === 'cloned' && clonedVoices.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {clonedVoices.map((cv) => {
            const isSelected = selectedClonedVoiceId === cv.id;
            return (
              <div
                key={cv.id}
                onClick={() => onSelectClonedVoice && onSelectClonedVoice(cv)}
                className={`group relative cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold text-sm">
                      🧬
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {cv.name}
                        <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[9px] text-purple-300">
                          Đã clone
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {cv.detectedGender === 'female' ? 'Nữ' : 'Nam'} • F0: {cv.estimatedF0}Hz
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>Độ tương đồng: {cv.similarityScore}%</span>
                  <span className="text-emerald-400 font-medium">3-5s Zero-Shot</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preset Voices Grid */}
      {activeDialect !== 'cloned' && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoice.id === voice.id && !selectedClonedVoiceId;
            const isPreviewing = previewingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => onSelectVoice(voice)}
                className={`group relative cursor-pointer rounded-xl border p-3 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Voice Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar Badge */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        voice.ageGroup === 'child'
                          ? voice.gender === 'female'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : voice.gender === 'female'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {voice.ageGroup === 'child' ? (voice.gender === 'female' ? '👧 Bé' : '👦 Bé') : voice.gender === 'female' ? 'Nữ' : 'Nam'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                          {voice.vietnameseName}
                        </h4>
                        {voice.isDefault && (
                          <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-semibold text-emerald-400">
                            Mặc định v3
                          </span>
                        )}
                        {voice.ageGroup === 'child' && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-amber-300 border border-amber-500/30">
                            🎈 Thiếu nhi
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="h-2.5 w-2.5 text-slate-500" />
                        <span>{voice.regionName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Sample Audio Preview Button */}
                    <button
                      onClick={(e) => handlePreviewVoice(e, voice)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                        isPreviewing
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 animate-pulse'
                          : 'border-slate-800 bg-slate-800/80 text-slate-400 hover:text-emerald-300 hover:border-slate-700'
                      }`}
                      title="Nghe mẫu giọng thử"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Voice Style and Description */}
                <p className="mt-2 text-[11px] text-slate-300 line-clamp-1">
                  {voice.style}
                </p>

                {/* Footer tags */}
                <div className="mt-2 flex items-center justify-between border-t border-slate-800/60 pt-1.5 text-[9px] text-slate-400">
                  <span className="truncate max-w-[170px] italic text-slate-400">
                    "{voice.sampleText.slice(0, 32)}..."
                  </span>
                  <span className="font-mono text-emerald-400/80 shrink-0">
                    {voice.dialect === 'north' ? 'Giọng Bắc' : voice.dialect === 'central' ? 'Giọng Trung' : 'Giọng Nam'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
