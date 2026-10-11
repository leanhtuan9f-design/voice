// Vietnamese text normalization rules (VieNeu Normalizer Engine)

export interface NormalizationResult {
  originalText: string;
  normalizedText: string;
  steps: { rule: string; before: string; after: string }[];
  wordCount: number;
}

const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const scales = ['', 'nghìn', 'triệu', 'tỷ'];

function readThreeDigits(n: number, isHighest: boolean): string {
  const hundred = Math.floor(n / 100);
  const ten = Math.floor((n % 100) / 10);
  const unit = n % 10;
  const parts: string[] = [];

  if (hundred > 0 || !isHighest) {
    parts.push(`${units[hundred]} trăm`);
  }

  if (ten > 1) {
    parts.push(`${units[ten]} mươi`);
    if (unit === 1) parts.push('mốt');
    else if (unit === 5) parts.push('lăm');
    else if (unit > 0) parts.push(units[unit]);
  } else if (ten === 1) {
    parts.push('mười');
    if (unit === 5) parts.push('lăm');
    else if (unit > 0) parts.push(units[unit]);
  } else {
    if (unit > 0) {
      if (hundred > 0 || !isHighest) parts.push('lẻ');
      parts.push(units[unit]);
    }
  }
  return parts.join(' ');
}

export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'không';
  const chunks: number[] = [];
  let temp = num;
  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const resultWords: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkText = readThreeDigits(chunk, i === chunks.length - 1);
      resultWords.push(chunkText);
      if (scales[i]) resultWords.push(scales[i]);
    }
  }

  return resultWords.join(' ').trim();
}

export function normalizeVietnameseTextClient(input: string): NormalizationResult {
  let text = input;
  const steps: { rule: string; before: string; after: string }[] = [];

  // 1. Abbreviations
  const abbreviations: [RegExp, string, string][] = [
    [/\bTP\.HCM\b/gi, 'TP.HCM', 'Thành phố Hồ Chí Minh'],
    [/\bTP\.?\s*HCM\b/gi, 'TP HCM', 'Thành phố Hồ Chí Minh'],
    [/\bHN\b/g, 'HN', 'Hà Nội'],
    [/\bĐN\b/g, 'ĐN', 'Đà Nẵng'],
    [/\bSG\b/g, 'SG', 'Sài Gòn'],
    [/\bVND\b/gi, 'VND', 'Việt Nam đồng'],
    [/\bVNĐ\b/gi, 'VNĐ', 'Việt Nam đồng'],
    [/\bUSD\b/gi, 'USD', 'đô la Mỹ'],
    [/\bAI\b/g, 'AI', 'trí tuệ nhân tạo'],
    [/\bTTS\b/g, 'TTS', 'tổng hợp giọng nói'],
    [/\bCEO\b/g, 'CEO', 'giám đốc điều hành'],
    [/\bCTO\b/g, 'CTO', 'giám đốc công nghệ'],
    [/\bUBND\b/g, 'UBND', 'Ủy ban Nhân dân'],
    [/\bHĐND\b/g, 'HĐND', 'Hội đồng Nhân dân'],
    [/\bBHXH\b/g, 'BHXH', 'Bảo hiểm Xã hội'],
  ];

  for (const [regex, label, replacement] of abbreviations) {
    if (regex.test(text)) {
      text = text.replace(regex, replacement);
      steps.push({
        rule: `Từ viết tắt phổ biến: ${label}`,
        before: label,
        after: replacement,
      });
    }
  }

  // 2. Currency
  const currencyRegex = /(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|vnd|vnđ|đồng)/gi;
  text = text.replace(currencyRegex, (match, p1) => {
    const cleanNum = p1.replace(/\./g, '');
    const num = parseInt(cleanNum, 10);
    if (!isNaN(num) && num < 1000000000000) {
      const words = `${numberToVietnameseWords(num)} đồng`;
      steps.push({
        rule: 'Tiền tệ tiếng Việt',
        before: match,
        after: words,
      });
      return words;
    }
    return match;
  });

  // 3. Dates (DD/MM/YYYY)
  const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g;
  text = text.replace(dateRegex, (match, d, m, y) => {
    const dNum = parseInt(d, 10);
    const mNum = parseInt(m, 10);
    const yNum = parseInt(y, 10);
    const formatted = `ngày ${numberToVietnameseWords(dNum)} tháng ${numberToVietnameseWords(mNum)} năm ${numberToVietnameseWords(yNum)}`;
    steps.push({
      rule: 'Định dạng ngày tháng năm',
      before: match,
      after: formatted,
    });
    return formatted;
  });

  // 4. Time
  const timeRegex = /\b(\d{1,2})(?::|h)(\d{2})\b/gi;
  text = text.replace(timeRegex, (match, h, m) => {
    const hNum = parseInt(h, 10);
    const mNum = parseInt(m, 10);
    const mins = mNum === 0 ? 'đúng' : `${numberToVietnameseWords(mNum)} phút`;
    const formatted = `${numberToVietnameseWords(hNum)} giờ ${mins}`;
    steps.push({
      rule: 'Định dạng giờ phút',
      before: match,
      after: formatted,
    });
    return formatted;
  });

  // 5. Standalone integers
  const numberRegex = /\b(\d{1,9})\b/g;
  text = text.replace(numberRegex, (match) => {
    const n = parseInt(match, 10);
    if (!isNaN(n)) {
      const words = numberToVietnameseWords(n);
      steps.push({
        rule: 'Số tự nhiên',
        before: match,
        after: words,
      });
      return words;
    }
    return match;
  });

  // Strip emotion tags for pure text count
  const cleanWordText = text.replace(/\[[^\]]+\]/g, ' ').trim();
  const wordCount = cleanWordText ? cleanWordText.split(/\s+/).length : 0;

  return {
    originalText: input,
    normalizedText: text,
    steps,
    wordCount,
  };
}
