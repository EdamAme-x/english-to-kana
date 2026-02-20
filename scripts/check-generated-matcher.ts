import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import {
  GENERATED_MATCHER_PATH,
  STATIC_JSON_SOURCE_PATH,
  loadStaticJsonDictionary,
} from "../src/infrastructure/build/data-files";
import type { DictionaryEntry } from "../src/infrastructure/build/python-dict-parser";
import { validateEntryCount } from "../src/infrastructure/build/python-dict-parser";
import { generateLookupModule } from "../src/infrastructure/build/radix-codegen";

function toEntries(record: Record<string, string>): DictionaryEntry[] {
  return Object.entries(record)
    .map(([key, kana]) => ({
      key: key.trim().toLowerCase(),
      kana: kana.trim(),
    }))
    .filter((entry) => entry.key.length > 0 && entry.kana.length > 0)
    .toSorted((left, right) => {
      if (left.key < right.key) {
        return -1;
      }
      if (left.key > right.key) {
        return 1;
      }
      if (left.kana < right.kana) {
        return -1;
      }
      if (left.kana > right.kana) {
        return 1;
      }
      return 0;
    });
}

async function main(): Promise<void> {
  const inputPath = resolve(STATIC_JSON_SOURCE_PATH);
  const outputPath = resolve(GENERATED_MATCHER_PATH);
  const projectRoot = resolve(import.meta.dir, "..");
  const sourceLabel = relative(projectRoot, inputPath).replaceAll("\\", "/");
  const dictionary = await loadStaticJsonDictionary(inputPath);
  const entries = toEntries(dictionary);
  validateEntryCount(entries);

  const generated = generateLookupModule(entries, sourceLabel);
  const current = await readFile(outputPath, "utf8");
  if (current !== generated.code) {
    throw new Error(
      `Generated matcher is outdated. Run: bun run gen:matcher\nTarget: ${outputPath}`,
    );
  }

  console.log(`[check-generated-matcher] up to date (${entries.length} entries)`);
}

await main();
