import { describe, expect, test } from "bun:test";
import { listKanaCandidates } from "../../src";

describe("prefix candidates API integration", () => {
  test("returns kana candidates for a prefix", () => {
    const candidates = listKanaCandidates("hel");
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates).toContain("ハロー");
  });

  test("normalizes case and apostrophe variants for prefix", () => {
    const candidates = listKanaCandidates("ABBOT\u2019");
    expect(candidates).toContain("アバッツ");
  });

  test("applies optional limit", () => {
    const candidates = listKanaCandidates("a", 3);
    expect(candidates.length).toBeLessThanOrEqual(3);
  });

  test("returns empty array for invalid input", () => {
    expect(listKanaCandidates("")).toEqual([]);
    expect(listKanaCandidates("   ")).toEqual([]);
  });
});
