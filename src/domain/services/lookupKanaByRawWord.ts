import type { KanaDictionary } from "../repositories/KanaDictionary";
import { NormalizedEnglishWord } from "../value-objects/NormalizedEnglishWord";

export function lookupKanaByRawWord(
  kanaDictionary: KanaDictionary,
  rawWord: unknown,
): string | null {
  const normalizedWord = NormalizedEnglishWord.fromRaw(rawWord);
  if (normalizedWord === null) {
    return null;
  }

  return kanaDictionary.lookupByNormalizedWord(normalizedWord.value);
}
