import type { KanaDictionary } from "../../domain/repositories/KanaDictionary";
import { lookupKana } from "../generated/matcher.js";

export class GeneratedMatcherKanaDictionary implements KanaDictionary {
  lookupByNormalizedWord(normalizedWord: string): string | null {
    return lookupKana(normalizedWord);
  }
}
