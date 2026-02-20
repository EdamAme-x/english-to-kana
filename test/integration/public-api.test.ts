import { describe, expect, test } from "bun:test";
import { hasKana, toKana } from "../../src";

describe("public API integration", () => {
  test("converts known words with generated matcher", () => {
    expect(toKana("hello")).toBe("ハロー");
    expect(toKana("world")).toBe("ワールド");
    expect(toKana("google")).toBe("グーグル");
    expect(toKana("zip")).toBe("ジップ");
  });

  test("normalizes case and apostrophe variants", () => {
    expect(toKana("HELLO")).toBe("ハロー");
    expect(toKana("abbot\u2019s")).toBe("アバッツ");
  });

  test("returns null for unknown/invalid words", () => {
    expect(toKana("this-word-does-not-exist")).toBeNull();
    expect(toKana("")).toBeNull();
    expect(toKana("   ")).toBeNull();
  });

  test("hasKana reflects conversion availability", () => {
    expect(hasKana("hello")).toBe(true);
    expect(hasKana("this-word-does-not-exist")).toBe(false);
    expect(hasKana("   ")).toBe(false);
  });
});
