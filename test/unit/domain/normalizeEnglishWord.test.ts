import { describe, expect, test } from "bun:test";
import { normalizeEnglishWord } from "../../../src/domain/services/normalizeEnglishWord";

describe("normalizeEnglishWord", () => {
  test("returns null for non-string values", () => {
    expect(normalizeEnglishWord(null)).toBeNull();
    expect(normalizeEnglishWord(undefined)).toBeNull();
    expect(normalizeEnglishWord(123)).toBeNull();
    expect(normalizeEnglishWord({})).toBeNull();
  });

  test("returns null for empty or whitespace-only strings", () => {
    expect(normalizeEnglishWord("")).toBeNull();
    expect(normalizeEnglishWord("   ")).toBeNull();
    expect(normalizeEnglishWord("\n\t")).toBeNull();
  });

  test("trims and lowercases", () => {
    expect(normalizeEnglishWord("  HELLO  ")).toBe("hello");
    expect(normalizeEnglishWord("Google")).toBe("google");
  });

  test("normalizes apostrophe variants to ASCII apostrophe", () => {
    expect(normalizeEnglishWord("O’Reilly")).toBe("o'reilly");
    expect(normalizeEnglishWord("O‘Reilly")).toBe("o'reilly");
    expect(normalizeEnglishWord("OʼReilly")).toBe("o'reilly");
    expect(normalizeEnglishWord("O＇Reilly")).toBe("o'reilly");
  });
});
