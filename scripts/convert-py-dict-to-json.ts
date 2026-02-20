import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  STATIC_JSON_SOURCE_PATH,
  STATIC_PY_SOURCE_PATH,
} from "../src/infrastructure/build/data-files";
import {
  normalizeDictionaryEntries,
  parsePythonDictionarySource,
  toStableDictionaryObject,
  validateEntryCount,
} from "../src/infrastructure/build/python-dict-parser";

type CliOptions = {
  input?: string;
  output?: string;
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
  console.log("Usage: bun scripts/convert-py-dict-to-json.ts [options]");
  console.log("Options:");
  console.log(
    `  --input <path>         Python dictionary source path (default: ${STATIC_PY_SOURCE_PATH})`,
  );
  console.log(
    `  --output <path>        Static JSON output path (default: ${STATIC_JSON_SOURCE_PATH})`,
  );
  console.log("  -h, --help             Show this help");
}

async function main(): Promise<void> {
  const options = parseArgs(Bun.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const inputPath = resolve(options.input ?? STATIC_PY_SOURCE_PATH);
  const outputPath = resolve(options.output ?? STATIC_JSON_SOURCE_PATH);
  const content = await readFile(inputPath, "utf8");

  const parsed = parsePythonDictionarySource(content);
  const normalized = normalizeDictionaryEntries(parsed);
  validateEntryCount(normalized.entries);

  const dictionary = toStableDictionaryObject(normalized.entries);
  const json = `${JSON.stringify(dictionary, null, 2)}\n`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, json, "utf8");

  console.log(`[convert-py-dict-to-json] inputPath=${inputPath}`);
  console.log(`[convert-py-dict-to-json] outputPath=${outputPath}`);
  console.log(`[convert-py-dict-to-json] parsedEntries=${parsed.length}`);
  console.log(`[convert-py-dict-to-json] normalizedEntries=${normalized.entries.length}`);
  console.log(`[convert-py-dict-to-json] duplicateKeys=${normalized.duplicateKeys.length}`);
  console.log(`[convert-py-dict-to-json] conflictingKeys=${normalized.conflictingKeys.length}`);
}

await main();
