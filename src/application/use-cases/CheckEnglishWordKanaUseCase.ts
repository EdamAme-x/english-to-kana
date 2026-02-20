import { ConvertEnglishWordToKanaUseCase } from "./ConvertEnglishWordToKanaUseCase";

export class CheckEnglishWordKanaUseCase {
  constructor(private readonly convertUseCase: ConvertEnglishWordToKanaUseCase) {}

  execute(word: unknown): boolean {
    return this.convertUseCase.execute(word) !== null;
  }
}
