import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dir, "../../../");
export const STATIC_PY_SOURCE_PATH = resolve(PROJECT_ROOT, "data/source-dictionary.py");
export const STATIC_JSON_SOURCE_PATH = resolve(PROJECT_ROOT, "data/word-kana.json");
export const GENERATED_MATCHER_PATH = resolve(
  PROJECT_ROOT,
  "src/infrastructure/generated/matcher.js",
);
export const GENERATED_WORD_LIST_PATH = resolve(
  PROJECT_ROOT,
  "src/infrastructure/generated/word-list.js",
);

export async function loadStaticJsonDictionary(
  path = STATIC_JSON_SOURCE_PATH,
): Promise<Record<string, string>> {
  const raw = await readFile(resolve(path), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Static dictionary JSON must be an object.");
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string") {
      throw new Error(`Invalid value for key "${key}". Expected string.`);
    }
    result[key] = value;
  }

  return result;
}
