import { EnglishKanaPrefixCandidateFinder } from "../../application/facades/EnglishKanaPrefixCandidateFinder";
import { ListKanaCandidatesByPrefixUseCase } from "../../application/use-cases/ListKanaCandidatesByPrefixUseCase";
import { SORTED_WORDS } from "../generated/word-list.js";
import { GeneratedMatcherKanaDictionary } from "../repositories/GeneratedMatcherKanaDictionary";
import { SortedWordPrefixCatalog } from "../repositories/SortedWordPrefixCatalog";

export function createEnglishKanaPrefixCandidateFinder(): EnglishKanaPrefixCandidateFinder {
  const dictionary = new GeneratedMatcherKanaDictionary();
  const prefixCatalog = new SortedWordPrefixCatalog(SORTED_WORDS);
  const listUseCase = new ListKanaCandidatesByPrefixUseCase(dictionary, prefixCatalog);
  return new EnglishKanaPrefixCandidateFinder(listUseCase);
}
