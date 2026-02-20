import { describe, expect, test } from "bun:test";
import type { KanaDictionary } from "../../../src/domain/repositories/KanaDictionary";
import { lookupKanaByRawWord } from "../../../src/domain/services/lookupKanaByRawWord";

class StubKanaDictionary implements KanaDictionary {
  readonly calls: string[] = [];

  lookupByNormalizedWord(normalizedWord: string): string | null {
    this.calls.push(normalizedWord);

    switch (normalizedWord) {
      case "hello":
        return "ハロー";
      case "abbot's":
        return "アバッツ";
      default:
        return null;
    }
  }
}

describe("lookupKanaByRawWord", () => {
  test("returns null and skips lookup when input is invalid", () => {
    const dictionary = new StubKanaDictionary();

    expect(lookupKanaByRawWord(dictionary, null)).toBeNull();
    expect(lookupKanaByRawWord(dictionary, "")).toBeNull();
    expect(lookupKanaByRawWord(dictionary, "   ")).toBeNull();
    expect(dictionary.calls).toHaveLength(0);
  });

  test("normalizes case before dictionary lookup", () => {
    const dictionary = new StubKanaDictionary();

    expect(lookupKanaByRawWord(dictionary, "HeLLo")).toBe("ハロー");
    expect(dictionary.calls).toEqual(["hello"]);
  });

  test("normalizes apostrophe variants before dictionary lookup", () => {
    const dictionary = new StubKanaDictionary();

    expect(lookupKanaByRawWord(dictionary, "abbot\u2019s")).toBe("アバッツ");
    expect(dictionary.calls).toEqual(["abbot's"]);
  });
});
