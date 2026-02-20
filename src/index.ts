import { createEnglishKanaTranslator } from "./infrastructure/factories/createEnglishKanaTranslator";

const translator = createEnglishKanaTranslator();

export function toKana(word: string): string | null {
  return translator.toKana(word);
}

export function hasKana(word: string): boolean {
  return translator.hasKana(word);
}
