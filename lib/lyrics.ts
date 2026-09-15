/**
 * Normalize lyric text at the boundary between the portal, WordPress and the
 * reader. A few older uploads contain the two-character sequence "\\n", or a
 * legacy literal `n` where a newline was intended. The latter is only repaired
 * at strong line/section boundaries so ordinary words containing the letter n
 * are never changed.
 */
export function normalizeLyricText(value: unknown): string {
  let text = String(value ?? "")
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/\r\n?/g, "\n")
    .replace(/\uFFFD/g, "")
    .normalize("NFC");

  text = text
    .replace(/n(?=\s*\[[^\]\r\n]+\])/gu, "\n")
    .replace(/n(?=\s*(?:pre-chorus|verse|chorus|bridge|intro|outro|refrain)\b)/giu, "\n")
    .replace(/n(?=[\u0900-\u097F])/gu, "\n")
    .replace(/(?<=[\p{Ll}\p{M}\d)])n(?=[A-Z])/gu, "\n")
    .replace(/(?<=[\u0900-\u097F])n(?=\s*(?:\n|$))/gu, "")
    .replace(/(?<=\))n(?=\s*(?:\n|$))/gu, "");

  return text;
}
