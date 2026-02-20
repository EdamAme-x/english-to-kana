import { normalizeApostropheVariants } from "./normalizeApostropheVariants";

export function normalizeEnglishWord(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return normalizeApostropheVariants(trimmed).toLowerCase();
}
