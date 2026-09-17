/** Canonical editor text: Unicode, LF newlines, and no content guessing. */
export function normalizeLyricText(value: unknown): string {
  return String(value ?? "").replace(/\r\n?/g, "\n").normalize("NFC");
}
