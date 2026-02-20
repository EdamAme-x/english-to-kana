import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
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

type CliOptions = {
  input?: string;
  output?: string;
  wordListOutput?: string;
  help: boolean;
};

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--input": {
        index += 1;
        if (index >= argv.length) {
          throw new Error("Missing value for --input.");
        }
        const value = argv[index];
        if (value === undefined) {
          throw new Error("Missing value for --input.");
        }
        options.input = value;
        break;
      }
      case "--output": {
        index += 1;
        if (index >= argv.length) {
          throw new Error("Missing value for --output.");
        }
        const value = argv[index];
        if (value === undefined) {
          throw new Error("Missing value for --output.");
        }
        options.output = value;
        break;
      }
      case "--word-list-output": {
        index += 1;
        if (index >= argv.length) {
          throw new Error("Missing value for --word-list-output.");
        }
        const value = argv[index];
        if (value === undefined) {
          throw new Error("Missing value for --word-list-output.");
        }
        options.wordListOutput = value;
        break;
      }
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp(): void {
  console.log("Usage: bun scripts/generate-radix-matcher.ts [options]");
  console.log("Options:");
  console.log(
    `  --input <path>         Static JSON dictionary path (default: ${STATIC_JSON_SOURCE_PATH})`,
  );
  console.log(
    `  --output <path>        Generated module path (default: ${GENERATED_MATCHER_PATH})`,
  );
  console.log(
    `  --word-list-output <path>  Generated word-list module path (default: ${GENERATED_WORD_LIST_PATH})`,
  );
  console.log("  -h, --help             Show this help");
}

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
  const options = parseArgs(Bun.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const inputPath = resolve(options.input ?? STATIC_JSON_SOURCE_PATH);
  const outputPath = resolve(options.output ?? GENERATED_MATCHER_PATH);
  const wordListOutputPath = resolve(options.wordListOutput ?? GENERATED_WORD_LIST_PATH);
  const projectRoot = resolve(import.meta.dir, "..");
  const sourceLabel = relative(projectRoot, inputPath).replaceAll("\\", "/");
  const dictionary = await loadStaticJsonDictionary(inputPath);
  const entries = toEntries(dictionary);
  validateEntryCount(entries);

  const generated = generateLookupModule(entries, sourceLabel);
  const generatedTwice = generateLookupModule(entries, sourceLabel);
  if (generated.code !== generatedTwice.code) {
    throw new Error("Non-deterministic output detected during code generation.");
  }
  const generatedWordList = generateWordListModule(entries, sourceLabel);

  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(dirname(wordListOutputPath), { recursive: true });
  await writeFile(outputPath, generated.code, "utf8");
  await writeFile(wordListOutputPath, generatedWordList, "utf8");

  console.log(`[generate-radix-matcher] inputPath=${inputPath}`);
  console.log(`[generate-radix-matcher] outputPath=${outputPath}`);
  console.log(`[generate-radix-matcher] wordListOutputPath=${wordListOutputPath}`);
  console.log(`[generate-radix-matcher] entryCount=${entries.length}`);
  console.log(`[generate-radix-matcher] trieNodes=${generated.trieNodeCount}`);
  console.log(`[generate-radix-matcher] radixNodes=${generated.radixNodeCount}`);
  console.log(`[generate-radix-matcher] radixEdges=${generated.radixEdgeCount}`);
}

await main();
