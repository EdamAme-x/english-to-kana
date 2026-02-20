import type { DictionaryEntry } from "./python-dict-parser";

export function generateWordListModule(
  entries: readonly DictionaryEntry[],
  sourceLabel = "unknown",
): string {
  const words = entries.map((entry) => entry.key).toSorted();
  const safeSourceLabel = sourceLabel.replaceAll("*/", "*\\/");
  return `/*auto-generated source:${safeSourceLabel} entries:${words.length}*/export const SORTED_WORDS=${JSON.stringify(words)};\n`;
}
