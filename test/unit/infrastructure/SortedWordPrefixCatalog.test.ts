import { describe, expect, test } from "bun:test";
import { SortedWordPrefixCatalog } from "../../../src/infrastructure/repositories/SortedWordPrefixCatalog";

describe("SortedWordPrefixCatalog", () => {
  const catalog = new SortedWordPrefixCatalog(["apple", "apply", "banana", "zip"]);

  test("returns matching words by prefix", () => {
    expect(catalog.findWordsByPrefix("app", 10)).toEqual(["apple", "apply"]);
    expect(catalog.findWordsByPrefix("ban", 10)).toEqual(["banana"]);
  });

  test("applies limit", () => {
    expect(catalog.findWordsByPrefix("app", 1)).toEqual(["apple"]);
  });

  test("returns empty array when no prefix matches", () => {
    expect(catalog.findWordsByPrefix("cat", 10)).toEqual([]);
  });
});
