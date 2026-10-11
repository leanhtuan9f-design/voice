import React from 'react';
import {
  X,
  Cpu,
  Zap,
  Radio,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  ExternalLink,
  Github,
  CheckCircle2,
} from 'lucide-react';

interface ModelArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelArchitectureModal: React.FC<ModelArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 border-b border-slate-800 pb-5 pr-8">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1.5 rounded-md bg-emerald-500/20 px-2 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <Cpu className="h-3.5 w-3.5" />
              VieNeu-TTS v3 Turbo
            </span>
            <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400 border border-cyan-500/20 font-mono">
              48 kHz Neural Codec
            </span>
          </div>

          <h2 className="text-xl font-black text-white">
            Kiến trúc mô hình & Thông số kỹ thuật VieNeu-TTS
          </h2>
          <p className="text-xs text-slate-400">
            Tác giả: <strong className="text-slate-200">Phạm Nguyễn Ngọc Bảo (pnnbao97)</strong> — Chuyên gia Speech AI & Nghiên cứu sinh Medical NLP.
          </p>
        </div>

        {/* Architecture Grid */}
        <div className="mt-5 space-y-5">
          {/* Main Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Layers className="h-4 w-4" />
                <span>Mạng nơ-ron Backbone 12-layer</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Thiết kế theo kiến trúc Qwen3 Transformer tối ưu hóa kết hợp bộ giải mã âm học siêu gọn (small acoustic decoder) giúp suy luận thời gian thực.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Zap className="h-4 w-4" />
                <span>Torch-free On-Device CPU & GPU</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Trên CPU, toàn bộ quy trình chạy qua ONNX Runtime mà không cần cài đặt PyTorch nặng nề. Trên GPU NVIDIA, tự động kích hoạt continuous batching.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Radio className="h-4 w-4" />
                <span>Instant Voice Cloning (3-5s)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Nhân bản giọng tức thì với mẫu âm thanh chỉ từ 3 đến 5 giây, hoàn toàn không yêu cầu văn bản tham chiếu (zero-text reference).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Imperceptible AI Watermarking</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Tích hợp mã nhận diện bản quyền AI vô hình không thể nghe thấy trong từng tệp âm thanh xuất ra để đảm bảo truy vết nội dung có trách nhiệm.
              </p>
            </div>
          </div>

          {/* Technical Specs Comparison */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Bảng so sánh thông số các phiên bản VieNeu-TTS
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-2.5 font-semibold">Đặc tính</th>
                    <th className="py-2 px-2.5 font-semibold text-emerald-400">VieNeu-TTS v3 Turbo</th>
                    <th className="py-2 px-2.5 font-semibold text-slate-300">VieNeu-TTS v2 Turbo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  <tr>
                    <td className="py-2 px-2.5 text-slate-400 font-medium">Chất lượng âm thanh</td>
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">48 kHz Hi-Fi</td>
                    <td className="py-2 px-2.5 text-slate-300">24 kHz Studio Codec</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 text-slate-400 font-medium">Giọng dựng sẵn (Preset)</td>
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">23+ giọng (Bắc, Trung, Nam)</td>
                    <td className="py-2 px-2.5 text-slate-300">12 giọng</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 text-slate-400 font-medium">Clone giọng nói</td>
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">3-5s (Không cần text)</td>
                    <td className="py-2 px-2.5 text-slate-300">5-10s (Cần text)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 text-slate-400 font-medium">Bilingual Code-switching</td>
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">Tiếng Việt + Tiếng Anh mượt mà</td>
                    <td className="py-2 px-2.5 text-slate-300">Hỗ trợ cơ bản</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 text-slate-400 font-medium">Môi trường CPU</td>
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">Torch-Free ONNX Runtime</td>
                    <td className="py-2 px-2.5 text-slate-300">PyTorch CPU</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 text-slate-400 font-medium">OpenAI Compatible API</td>
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">Có (/v1/audio/speech)</td>
                    <td className="py-2 px-2.5 text-slate-300">Custom REST API</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Mã nguồn mở được phát hành trên GitHub và HuggingFace Hub.
            </span>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/pnnbao97/VieNeu-TTS"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
              >
                <Github className="h-3.5 w-3.5" />
                <span>Xem GitHub Repo</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
