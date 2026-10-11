import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Copy,
  Check,
  Play,
  Download,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export const ApiPlayground: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'openai' | 'python' | 'curl' | 'js' | 'docker'>('openai');
  const [copied, setCopied] = useState(false);

  // Live tester state
  const [testInput, setTestInput] = useState('Chào mừng bạn đến với API OpenAI-compatible của VieNeu-TTS v3 Turbo.');
  const [testVoice, setTestVoice] = useState('minh-quan');
  const [testSpeed, setTestSpeed] = useState(1.0);
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runLiveApiCall = async () => {
    setIsCallingApi(true);
    setApiResponse(null);
    const startTime = performance.now();

    try {
      const response = await fetch('/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer vieneu-local-key',
        },
        body: JSON.stringify({
          model: 'vieneu-tts-v3-turbo',
          input: testInput,
          voice: testVoice,
          response_format: 'wav',
          speed: testSpeed,
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        model: response.headers.get('x-vieneu-model') || 'vieneu-tts-v3-turbo',
        voice: response.headers.get('x-vieneu-voice') || testVoice,
        latencyMs: elapsed,
        sizeBytes: blob.size,
      });

      const audio = new Audio(url);
      audio.play().catch(() => {});
    } catch (err: any) {
      setApiResponse({
        error: err.message,
      });
    } finally {
      setIsCallingApi(false);
    }
  };

  const snippets = {
    openai: `import os
from openai import OpenAI

# Initialize client pointing to VieNeu-TTS server
client = OpenAI(
    base_url="http://localhost:3000/v1",  # Hoặc domain của bạn
    api_key="vieneu-key"  # Chạy local không bắt buộc key
)

response = client.audio.speech.create(
    model="vieneu-tts-v3-turbo",
    voice="${testVoice}",  # 23+ preset voices: minh-quan, thuy-vy, hoai-nam, ...
    input="${testInput}",
    response_format="wav"
)

response.stream_to_file("output.wav")
print("Audio saved successfully!")`,

    python: `from vieneu_tts import VieNeuEngine

# Khởi tạo mô hình VieNeu-TTS v3 Turbo On-Device
engine = VieNeuEngine.from_pretrained(
    model_name="pnnbao97/vieneu-tts-v3-turbo",
    device="cpu",      # hoặc "cuda" nếu có GPU NVIDIA
    backend="onnx"     # Torch-free on CPU!
)

# Chạy tổng hợp giọng nói 48kHz
audio_bytes = engine.synthesize(
    text="${testInput}",
    voice="${testVoice}",
    speed=${testSpeed},
    sample_rate=48000
)

with open("output.wav", "wb") as f:
    f.write(audio_bytes)`,

    curl: `curl http://localhost:3000/v1/audio/speech \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "vieneu-tts-v3-turbo",
    "voice": "${testVoice}",
    "input": "${testInput}",
    "response_format": "wav",
    "speed": ${testSpeed}
  }' \\
  --output speech.wav`,

    js: `import fs from 'fs';

const response = await fetch('http://localhost:3000/v1/audio/speech', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'vieneu-tts-v3-turbo',
    voice: '${testVoice}',
    input: '${testInput}',
    response_format: 'wav',
    speed: ${testSpeed}
  })
});

const arrayBuffer = await response.arrayBuffer();
fs.writeFileSync('output.wav', Buffer.from(arrayBuffer));
console.log('Synthesized audio saved!');`,

    docker: `# Chạy VieNeu-TTS v3 Turbo API Server trên GPU với Docker & LMDeploy
docker run -d --gpus all -p 3000:3000 \\
  --name vieneu-tts-server \\
  -v ~/.cache/huggingface:/root/.cache/huggingface \\
  ghcr.io/pnnbao97/vieneu-tts:v3-turbo-cuda

# Hoặc chế độ Torch-free CPU với ONNX Runtime:
docker run -d -p 3000:3000 \\
  --name vieneu-tts-cpu \\
  ghcr.io/pnnbao97/vieneu-tts:v3-turbo-cpu`,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            OpenAI-Compatible Speech API & Tích hợp SDK
          </h3>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          VieNeu-TTS cung cấp endpoint tương thích 100% với chuẩn <code className="text-emerald-400 font-mono">/v1/audio/speech</code> của OpenAI.
          Bạn có thể drop-in thay thế trực tiếp vào các hệ thống hiện có như OpenAI SDK, Pipecat, LiveKit, hoặc các trợ lý ảo bằng Python/Node.js.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Code Snippets & Language Selector */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            {/* Lang Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-900/90 p-1 border border-slate-800 scrollbar-none text-xs">
              {(
                [
                  { id: 'openai', label: 'OpenAI SDK (Python)' },
                  { id: 'python', label: 'VieNeu SDK' },
                  { id: 'curl', label: 'cURL' },
                  { id: 'js', label: 'Node.js' },
                  { id: 'docker', label: 'Docker Run' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLang(tab.id)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    activeLang === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => copyCode(snippets[activeLang])}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Đã copy' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Code Viewer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed shadow-xl">
            <pre>{snippets[activeLang]}</pre>
          </div>
        </div>

        {/* Right Col: Live Interactive API Tester */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Trình gọi thử API Trực tiếp (Live API Call)</span>
              <Terminal className="h-4 w-4 text-emerald-400" />
            </h4>

            {/* Input text */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                input (Tham số văn bản):
              </label>
              <textarea
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Voice & Speed */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">voice:</label>
                <select
                  value={testVoice}
                  onChange={(e) => setTestVoice(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-white font-mono focus:outline-none"
                >
                  <option value="minh-quan">minh-quan (Bắc)</option>
                  <option value="mai-phuong">mai-phuong (Bắc)</option>
                  <option value="quynh-chi">quynh-chi (Huế)</option>
                  <option value="tuan-khoi">tuan-khoi (Sài Gòn)</option>
                  <option value="thuy-vy">thuy-vy (Sài Gòn)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">speed ({testSpeed}x):</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={testSpeed}
                  onChange={(e) => setTestSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 mt-2"
                />
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={runLiveApiCall}
              disabled={isCallingApi || !testInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-2.5 text-xs font-bold text-slate-950 hover:opacity-95 transition disabled:opacity-50"
            >
              {isCallingApi ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Đang gửi POST /v1/audio/speech...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                  <span>Gửi POST /v1/audio/speech</span>
                </>
              )}
            </button>

            {/* API Response View */}
            {apiResponse && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
                {apiResponse.error ? (
                  <p className="text-rose-400 font-mono">Lỗi: {apiResponse.error}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">Status: 200 OK</span>
                      <span className="text-slate-400">Độ trễ: {apiResponse.latencyMs}ms</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-2">
                      <div>Format: {apiResponse.contentType}</div>
                      <div>Dung lượng: {(apiResponse.sizeBytes / 1024).toFixed(1)} KB</div>
                      <div>Model: {apiResponse.model}</div>
                      <div>Voice: {apiResponse.voice}</div>
                    </div>

                    {audioUrl && (
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
                        <a
                          href={audioUrl}
                          download="api-response.wav"
                          className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-emerald-400 hover:text-white"
                        >
                          <Download className="h-3 w-3" />
                          <span>Tải</span>
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
