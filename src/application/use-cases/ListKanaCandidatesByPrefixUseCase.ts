import type { KanaDictionary } from "../../domain/repositories/KanaDictionary";
import type { WordPrefixCatalog } from "../../domain/repositories/WordPrefixCatalog";
import { normalizeEnglishWord } from "../../domain/services/normalizeEnglishWord";

const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 200;

function normalizeLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.trunc(limit)));
}

export class ListKanaCandidatesByPrefixUseCase {
  constructor(
    private readonly kanaDictionary: KanaDictionary,
    private readonly wordPrefixCatalog: WordPrefixCatalog,
  ) {}

  execute(rawPrefix: unknown, limit?: number): string[] {
    const normalizedPrefix = normalizeEnglishWord(rawPrefix);
    if (normalizedPrefix === null) {
      return [];
    }

    const resolvedLimit = normalizeLimit(limit);
    const candidateWords = this.wordPrefixCatalog.findWordsByPrefix(
      normalizedPrefix,
      resolvedLimit * 4,
    );
    const result: string[] = [];
    const seenKana = new Set<string>();

    for (const word of candidateWords) {
      const kana = this.kanaDictionary.lookupByNormalizedWord(word);
      if (kana === null || seenKana.has(kana)) {
        continue;
      }

      seenKana.add(kana);
      result.push(kana);
      if (result.length >= resolvedLimit) {
        break;
      }
    }

    return result;
  }
}
