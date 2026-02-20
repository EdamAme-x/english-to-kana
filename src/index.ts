import { createEnglishKanaTranslator } from "./infrastructure/factories/createEnglishKanaTranslator";
import { createEnglishKanaPrefixCandidateFinder } from "./infrastructure/factories/createEnglishKanaPrefixCandidateFinder";

const translator = createEnglishKanaTranslator();
const prefixCandidateFinder = createEnglishKanaPrefixCandidateFinder();

export function toKana(word: string): string | null {
  return translator.toKana(word);
}

export function hasKana(word: string): boolean {
  return translator.hasKana(word);
}

export function listKanaCandidates(prefix: string, limit?: number): string[] {
  return prefixCandidateFinder.list(prefix, limit);
}
