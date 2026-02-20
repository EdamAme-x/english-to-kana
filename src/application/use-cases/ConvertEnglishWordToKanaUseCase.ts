import { lookupKanaByRawWord } from "../../domain/services/lookupKanaByRawWord";
import type { KanaDictionary } from "../../domain/repositories/KanaDictionary";

export class ConvertEnglishWordToKanaUseCase {
  constructor(private readonly kanaDictionary: KanaDictionary) {}

  execute(word: unknown): string | null {
    return lookupKanaByRawWord(this.kanaDictionary, word);
  }
}
