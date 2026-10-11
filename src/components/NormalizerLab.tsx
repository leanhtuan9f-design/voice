import React, { useState } from 'react';
import { normalizeVietnameseTextClient, NormalizationResult } from '../utils/normalizer';
import {
  FileText,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Zap,
  Play,
} from 'lucide-react';

interface NormalizerLabProps {
  onSendToStudio: (text: string) => void;
}

export const NormalizerLab: React.FC<NormalizerLabProps> = ({ onSendToStudio }) => {
  const [inputText, setInputText] = useState(
    'Hôm nay ngày 11/10/2026 lúc 14:30, tại TP.HCM, CEO công ty công nghệ đã ký hợp đồng trị giá 550.000.000 VNĐ để triển khai hệ thống AI và TTS tiếng Việt.'
  );
  const [copied, setCopied] = useState(false);

  const result: NormalizationResult = normalizeVietnameseTextClient(inputText);

  const sampleInputs = [
    {
      title: 'Tiền tệ & Viết tắt',
      text: 'Giá bán combo tại HN và TP.HCM chỉ 350.000đ, hỗ trợ ship COD toàn quốc.',
    },
    {
      title: 'Ngày tháng & Giờ giấc',
      text: 'Cuộc họp diễn ra vào ngày 25/12/2026 lúc 09:15 tại trụ sở UBND.',
    },
    {
      title: 'Khoa học & Kỹ thuật số',
      text: 'Mô hình VieNeu-TTS v3 Turbo xử lý 1000 từ trong vòng 0.45s với độ trễ siêu thấp.',
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(result.normalizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Bộ tiền xử lý & Chuẩn hóa văn bản tiếng Việt (VieNeu Normalizer Engine)
          </h3>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Tự động chuẩn hóa các ký hiệu đặc biệt, chữ số, tiền tệ (VNĐ), ngày tháng, giờ giấc và các từ viết tắt
          thông dụng thành từ ngữ ngữ âm chính xác trước khi đưa vào mô hình âm học.
        </p>

        {/* Quick Sample Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] text-slate-400 font-medium">Mẫu thử:</span>
          {sampleInputs.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(sample.text)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Two columns: Input vs Normalized Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-semibold text-slate-300">Văn bản gốc đầu vào (Raw Text):</label>
            <span className="font-mono">{inputText.length} ký tự</span>
          </div>
          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập văn bản có chứa số, ngày tháng, từ viết tắt..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Output Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Văn bản sau chuẩn hóa (Phonetic Speech Text):</span>
            </label>
            <span className="font-mono text-emerald-400/80">{result.wordCount} từ</span>
          </div>
          <div className="relative min-h-[178px] rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4 text-xs text-slate-100 leading-relaxed font-sans">
            <p className="whitespace-pre-wrap">{result.normalizedText}</p>

            {/* Quick Actions */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>

              <button
                onClick={() => onSendToStudio(result.normalizedText)}
                className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <ArrowRight className="h-3 w-3" />
                <span>Đưa vào Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step by step transformations table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Chi tiết các quy tắc chuẩn hóa đã áp dụng ({result.steps.length})</span>
          <Zap className="h-4 w-4 text-emerald-400" />
        </h4>

        {result.steps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3 font-semibold">Quy tắc</th>
                  <th className="py-2 px-3 font-semibold">Ký hiệu gốc</th>
                  <th className="py-2 px-3 font-semibold">Chuẩn hóa ngữ âm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {result.steps.map((step, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">{step.rule}</td>
                    <td className="py-2.5 px-3 text-rose-300">{step.before}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">{step.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            Văn bản hiện tại đã ở dạng từ ngữ tự nhiên, không cần chuẩn hóa thêm.
          </p>
        )}
      </div>
    </div>
  );
};
