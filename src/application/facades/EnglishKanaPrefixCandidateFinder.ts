import { ListKanaCandidatesByPrefixUseCase } from "../use-cases/ListKanaCandidatesByPrefixUseCase";

export class EnglishKanaPrefixCandidateFinder {
  constructor(private readonly listUseCase: ListKanaCandidatesByPrefixUseCase) {}

  list(prefix: string, limit?: number): string[] {
    return this.listUseCase.execute(prefix, limit);
  }
}
