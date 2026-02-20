import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import {
  GENERATED_MATCHER_PATH,
  GENERATED_WORD_LIST_PATH,
  STATIC_JSON_SOURCE_PATH,
  loadStaticJsonDictionary,
} from "../src/infrastructure/build/data-files";
import type { DictionaryEntry } from "../src/infrastructure/build/python-dict-parser";
import { validateEntryCount } from "../src/infrastructure/build/python-dict-parser";
import { generateLookupModule } from "../src/infrastructure/build/radix-codegen";
import { generateWordListModule } from "../src/infrastructure/build/word-list-codegen";

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
  const wordListOutputPath = resolve(GENERATED_WORD_LIST_PATH);
  const projectRoot = resolve(import.meta.dir, "..");
  const sourceLabel = relative(projectRoot, inputPath).replaceAll("\\", "/");
  const dictionary = await loadStaticJsonDictionary(inputPath);
  const entries = toEntries(dictionary);
  validateEntryCount(entries);

  const generated = generateLookupModule(entries, sourceLabel);
  const generatedWordList = generateWordListModule(entries, sourceLabel);
  const [current, currentWordList] = await Promise.all([
    readFile(outputPath, "utf8").catch((error: unknown) => {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === "ENOENT") {
        throw new Error(
          `Generated matcher is missing. Run: bun run gen:matcher\nTarget: ${outputPath}`,
        );
      }
      throw error;
    }),
    readFile(wordListOutputPath, "utf8").catch((error: unknown) => {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === "ENOENT") {
        throw new Error(
          `Generated word list is missing. Run: bun run gen:matcher\nTarget: ${wordListOutputPath}`,
        );
      }
      throw error;
    }),
  ]);
  if (current !== generated.code) {
    throw new Error(
      `Generated matcher is outdated. Run: bun run gen:matcher\nTarget: ${outputPath}`,
    );
  }
  if (currentWordList !== generatedWordList) {
    throw new Error(
      `Generated word list is outdated. Run: bun run gen:matcher\nTarget: ${wordListOutputPath}`,
    );
  }

  console.log(`[check-generated-matcher] up to date (${entries.length} entries)`);
}

await main();
