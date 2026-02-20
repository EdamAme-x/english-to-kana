export interface KanaDictionary {
  lookupByNormalizedWord(normalizedWord: string): string | null;
}
