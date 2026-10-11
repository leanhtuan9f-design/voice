import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Radio,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface AudioVisualizerProps {
  audioBase64: string | null;
  mimeType?: string;
  duration?: number;
  engine?: string;
  sampleRate?: number;
  voiceName?: string;
  isSpeaking?: boolean;
  onPlayClick?: () => void;
  onStopClick?: () => void;
  onEnded?: () => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioBase64,
  mimeType = 'audio/mpeg',
  duration = 0,
  engine = 'vieneu-v3-turbo',
  sampleRate = 48000,
  voiceName = 'Minh Quân',
  isSpeaking = false,
  onPlayClick,
  onStopClick,
  onEnded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [visualMode, setVisualMode] = useState<'bars' | 'wave'>('bars');

  // Timer simulation during speech
  useEffect(() => {
    let timer: any = null;
    if (isSpeaking) {
      setCurrentTime(0);
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= (duration || 5)) {
            return duration || 5;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isSpeaking, duration]);

  // Canvas visualizer loop connecting to Web Audio Analyser
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let y = 15; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (isSpeaking) {
        if (visualMode === 'bars') {
          analyser.getByteFrequencyData(dataArray);
          const numBars = 40;
          const barWidth = width / numBars - 2;
          let x = 0;

          for (let i = 0; i < numBars; i++) {
            const index = Math.floor((i / numBars) * bufferLength * 0.7);
            const rawVal = dataArray[index] || 0;
            // Add minimum active flutter when speaking
            const val = Math.max(rawVal, 25 + Math.sin(Date.now() * 0.01 + i) * 15);
            const barHeight = Math.max(5, (val / 255) * (height - 14));

            const grad = ctx.createLinearGradient(0, height, 0, 0);
            grad.addColorStop(0, '#059669'); // emerald-600
            grad.addColorStop(0.5, '#10b981'); // emerald-500
            grad.addColorStop(1, '#06b6d4'); // cyan-500

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
            ctx.fill();

            x += barWidth + 2;
          }
        } else {
          // Waveform Mode
          analyser.getByteTimeDomainData(dataArray);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#34d399'; // emerald-400
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        }
      } else {
        // Idle decorative wave
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
        ctx.beginPath();
        const midY = height / 2;
        ctx.moveTo(0, midY);
        for (let x = 0; x < width; x += 4) {
          const idleWave = Math.sin(x * 0.05 + Date.now() * 0.002) * 4;
          ctx.lineTo(x, midY + idleWave);
        }
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking, visualMode]);

  const togglePlay = () => {
    if (isSpeaking) {
      if (onStopClick) onStopClick();
      else audioEngine.stopPlayback();
    } else {
      if (onPlayClick) onPlayClick();
    }
  };

  const restartAudio = () => {
    if (onPlayClick) onPlayClick();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = duration || 5;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
      {/* Visualizer Canvas Bar */}
      <div className="relative border-b border-slate-800/80">
        <canvas
          ref={canvasRef}
          width={640}
          height={110}
          className="h-28 w-full bg-slate-950"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-3 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3 w-3" />
            {voiceName}
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/30 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
              Đang đọc tiếng Việt...
            </span>
          )}
          <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-500/20">
            {sampleRate === 48000 ? '48 kHz Hi-Fi' : '24 kHz Studio'}
          </span>
          <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-400">
            VieNeu-TTS Neural Engine
          </span>
        </div>

        {/* Visualizer Mode Switch */}
        <div className="absolute top-2.5 right-3 flex items-center gap-1 rounded-lg bg-slate-900/80 p-0.5 border border-slate-800 text-[10px]">
          <button
            onClick={() => setVisualMode('bars')}
            className={`rounded px-1.5 py-0.5 font-medium ${
              visualMode === 'bars'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Phổ tần số
          </button>
          <button
            onClick={() => setVisualMode('wave')}
            className={`rounded px-1.5 py-0.5 font-medium ${
              visualMode === 'wave'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dạng sóng
          </button>
        </div>
      </div>

      {/* Player Controls & Scrubber */}
      <div className="p-4 space-y-3">
        {/* Scrubber & Time */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.01}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Buttons and toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Main Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-lg transition active:scale-95 ${
                isSpeaking
                  ? 'bg-rose-500 text-white shadow-rose-500/25'
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/25 hover:opacity-95'
              }`}
              title={isSpeaking ? 'Dừng phát' : 'Phát giọng đọc'}
            >
              {isSpeaking ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={restartAudio}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Phát lại từ đầu"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950/80 p-1 border border-slate-800">
            <Gauge className="h-3.5 w-3.5 text-slate-400 ml-1" />
            {[0.75, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackRate(speed)}
                className={`rounded px-2 py-0.5 text-[11px] font-mono transition ${
                  playbackRate === speed
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Download Button */}
          {audioBase64 && (
            <button
              onClick={() =>
                audioEngine.downloadAudio(
                  audioBase64,
                  `vieneu-${voiceName.toLowerCase()}-${Date.now()}.mp3`,
                  mimeType
                )
              }
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải file âm thanh ({mimeType.includes('mpeg') ? 'MP3' : 'WAV'})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
