import { EnglishKanaTranslator } from "../../application/facades/EnglishKanaTranslator";
import { CheckEnglishWordKanaUseCase } from "../../application/use-cases/CheckEnglishWordKanaUseCase";
import { ConvertEnglishWordToKanaUseCase } from "../../application/use-cases/ConvertEnglishWordToKanaUseCase";
import { GeneratedMatcherKanaDictionary } from "../repositories/GeneratedMatcherKanaDictionary";

export function createEnglishKanaTranslator(): EnglishKanaTranslator {
  const dictionary = new GeneratedMatcherKanaDictionary();
  const convertUseCase = new ConvertEnglishWordToKanaUseCase(dictionary);
  const checkUseCase = new CheckEnglishWordKanaUseCase(convertUseCase);
  return new EnglishKanaTranslator(convertUseCase, checkUseCase);
}
