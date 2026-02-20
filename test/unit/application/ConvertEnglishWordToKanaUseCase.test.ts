import { describe, expect, test } from "bun:test";
import { ConvertEnglishWordToKanaUseCase } from "../../../src/application/use-cases/ConvertEnglishWordToKanaUseCase";
import type { KanaDictionary } from "../../../src/domain/repositories/KanaDictionary";

class StubKanaDictionary implements KanaDictionary {
  lookupByNormalizedWord(normalizedWord: string): string | null {
    const table = new Map<string, string>([
      ["hello", "ハロー"],
      ["world", "ワールド"],
    ]);

    return table.get(normalizedWord) ?? null;
  }
}

describe("ConvertEnglishWordToKanaUseCase", () => {
  const useCase = new ConvertEnglishWordToKanaUseCase(new StubKanaDictionary());

  test("returns kana when word exists", () => {
    expect(useCase.execute("hello")).toBe("ハロー");
    expect(useCase.execute("WORLD")).toBe("ワールド");
  });

  test("returns null when word does not exist", () => {
    expect(useCase.execute("unknown")).toBeNull();
  });

  test("returns null for invalid input", () => {
    expect(useCase.execute(null)).toBeNull();
    expect(useCase.execute(undefined)).toBeNull();
    expect(useCase.execute("   ")).toBeNull();
  });
});
