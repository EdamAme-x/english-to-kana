import { describe, expect, test } from "bun:test";
import { CheckEnglishWordKanaUseCase } from "../../../src/application/use-cases/CheckEnglishWordKanaUseCase";
import { ConvertEnglishWordToKanaUseCase } from "../../../src/application/use-cases/ConvertEnglishWordToKanaUseCase";
import type { KanaDictionary } from "../../../src/domain/repositories/KanaDictionary";

class StubKanaDictionary implements KanaDictionary {
  lookupByNormalizedWord(normalizedWord: string): string | null {
    return normalizedWord === "hello" ? "ハロー" : null;
  }
}

describe("CheckEnglishWordKanaUseCase", () => {
  const convertUseCase = new ConvertEnglishWordToKanaUseCase(new StubKanaDictionary());
  const checkUseCase = new CheckEnglishWordKanaUseCase(convertUseCase);

  test("returns true when kana exists", () => {
    expect(checkUseCase.execute("hello")).toBe(true);
  });

  test("returns false when kana does not exist", () => {
    expect(checkUseCase.execute("unknown")).toBe(false);
  });

  test("returns false for invalid input", () => {
    expect(checkUseCase.execute(null)).toBe(false);
    expect(checkUseCase.execute("   ")).toBe(false);
  });
});
