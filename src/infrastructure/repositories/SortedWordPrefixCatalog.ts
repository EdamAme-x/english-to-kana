import type { WordPrefixCatalog } from "../../domain/repositories/WordPrefixCatalog";

export class SortedWordPrefixCatalog implements WordPrefixCatalog {
  constructor(private readonly sortedWords: readonly string[]) {}

  findWordsByPrefix(prefix: string, limit: number): readonly string[] {
    if (prefix.length === 0 || limit <= 0) {
      return [];
    }

    const startIndex = this.lowerBound(prefix);
    const result: string[] = [];

    for (let index = startIndex; index < this.sortedWords.length; index += 1) {
      const word = this.sortedWords[index]!;
      if (!word.startsWith(prefix)) {
        break;
      }
      result.push(word);
      if (result.length >= limit) {
        break;
      }
    }

    return result;
  }

  private lowerBound(target: string): number {
    let low = 0;
    let high = this.sortedWords.length;

    while (low < high) {
      const mid = low + ((high - low) >> 1);
      const value = this.sortedWords[mid]!;
      if (value < target) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  }
}
