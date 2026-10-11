import React from 'react';
import {
  Mic2,
  Users,
  Dna,
  Code2,
  FileText,
  Info,
  History,
  Github,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  onOpenHistory,
  onOpenArchitecture,
}) => {
  const tabs = [
    { id: 'studio', label: 'Studio TTS', icon: Mic2 },
    { id: 'dialogue', label: 'Hội thoại kép', icon: Users },
    { id: 'cloning', label: 'Nhân bản giọng', icon: Dna },
    { id: 'normalizer', label: 'Chuẩn hóa Text', icon: FileText },
    { id: 'api', label: 'API & Docker', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Mic2 className="h-5 w-5 text-slate-950 font-bold" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 ring-2 ring-slate-950">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan-100" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                VieNeu<span className="text-emerald-400">-TTS</span>
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                v3 Turbo
              </span>
              <span className="hidden sm:inline-flex rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20">
                48 kHz Hi-Fi
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Mô hình Text-to-Speech tiếng Việt on-device chất lượng phòng thu
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition"
            title="Kiến trúc mô hình & Thông số kỹ thuật"
          >
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Kiến trúc v3</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition"
            title="Lịch sử tổng hợp giọng nói"
          >
            <History className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Lịch sử</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-slate-950">
                {historyCount}
              </span>
            )}
          </button>

          <a
            href="https://github.com/pnnbao97/VieNeu-TTS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 bg-slate-900/60 px-2 py-1.5 gap-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
