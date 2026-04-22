const VN_PATTERN =
  /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵĂÂĐÊÔƠƯÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ]/;

const CJ_PATTERN = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/;

const BASIC_LATIN = /[a-zA-Z]/;

export interface ScriptAnalysis {
  mixed: boolean;
}

export function detectScriptMix(text: string): ScriptAnalysis {
  const trimmed = text.trim();
  if (trimmed.length < 2) return { mixed: false };

  const words = trimmed.split(/[\s\p{P}]+/u).filter((w) => /[\p{L}]/u.test(w));
  if (words.length === 0) return { mixed: false };

  let hasVn = false;
  let hasLatin = false;
  let hasCj = false;

  for (const w of words) {
    if (VN_PATTERN.test(w)) {
      hasVn = true;
    } else if (CJ_PATTERN.test(w)) {
      hasCj = true;
    } else if (BASIC_LATIN.test(w) && w.length > 2) {
      hasLatin = true;
    }

    const distinctScripts = Number(hasVn) + Number(hasLatin) + Number(hasCj);
    if (distinctScripts >= 2) {
      return { mixed: true };
    }
  }

  return { mixed: false };
}
