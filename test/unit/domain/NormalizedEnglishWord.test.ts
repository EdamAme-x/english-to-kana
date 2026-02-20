import { describe, expect, test } from "bun:test";
import { NormalizedEnglishWord } from "../../../src/domain/value-objects/NormalizedEnglishWord";

describe("NormalizedEnglishWord", () => {
  test("returns null for non-string or empty input", () => {
    expect(NormalizedEnglishWord.fromRaw(null)).toBeNull();
    expect(NormalizedEnglishWord.fromRaw(undefined)).toBeNull();
    expect(NormalizedEnglishWord.fromRaw(123)).toBeNull();
    expect(NormalizedEnglishWord.fromRaw("")).toBeNull();
    expect(NormalizedEnglishWord.fromRaw("   ")).toBeNull();
  });

  test("trims and lowercases input", () => {
    expect(NormalizedEnglishWord.fromRaw("  HELLO  ")?.value).toBe("hello");
  });

  test("normalizes apostrophe variants into ASCII apostrophe", () => {
    expect(NormalizedEnglishWord.fromRaw("O'Reilly")?.value).toBe("o'reilly");
    expect(NormalizedEnglishWord.fromRaw("O’Reilly")?.value).toBe("o'reilly");
    expect(NormalizedEnglishWord.fromRaw("O‘Reilly")?.value).toBe("o'reilly");
    expect(NormalizedEnglishWord.fromRaw("OʼReilly")?.value).toBe("o'reilly");
    expect(NormalizedEnglishWord.fromRaw("O＇Reilly")?.value).toBe("o'reilly");
  });
});
