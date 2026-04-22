export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export function splitSentences(text: string): Sentence[] {
  if (!text) return [];

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, {
        granularity: "sentence",
      });
      const result: Sentence[] = [];
      for (const seg of segmenter.segment(text)) {
        const trimmed = seg.segment.trim();
        if (trimmed.length > 0) {
          result.push({
            text: seg.segment,
            start: seg.index,
            end: seg.index + seg.segment.length,
          });
        }
      }
      if (result.length > 0) return result;
    } catch (error) {
      console.error("Error splitting sentences: ", error);
    }
  }

  const result: Sentence[] = [];
  const regex = /[^.!?…]+[.!?…]+[\s]*|[^.!?…]+$/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (trimmed.length > 0) {
      result.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }
  return result;
}
