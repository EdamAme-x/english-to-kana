import { CheckEnglishWordKanaUseCase } from "../use-cases/CheckEnglishWordKanaUseCase";
import { ConvertEnglishWordToKanaUseCase } from "../use-cases/ConvertEnglishWordToKanaUseCase";

export class EnglishKanaTranslator {
  constructor(
    private readonly convertUseCase: ConvertEnglishWordToKanaUseCase,
    private readonly checkUseCase: CheckEnglishWordKanaUseCase,
  ) {}

  toKana(word: string): string | null {
    return this.convertUseCase.execute(word);
  }

  hasKana(word: string): boolean {
    return this.checkUseCase.execute(word);
  }
}
