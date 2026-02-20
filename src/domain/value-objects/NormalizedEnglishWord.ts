import { normalizeEnglishWord } from "../services/normalizeEnglishWord";

export class NormalizedEnglishWord {
  private constructor(readonly value: string) {}

  static fromRaw(raw: unknown): NormalizedEnglishWord | null {
    const normalized = normalizeEnglishWord(raw);
    return normalized === null ? null : new NormalizedEnglishWord(normalized);
  }
}
