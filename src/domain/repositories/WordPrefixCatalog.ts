export interface WordPrefixCatalog {
  findWordsByPrefix(prefix: string, limit: number): readonly string[];
}
