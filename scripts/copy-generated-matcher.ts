import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const SOURCE_JS = resolve(import.meta.dir, "../src/infrastructure/generated/matcher.js");
const SOURCE_D_TS = resolve(import.meta.dir, "../src/infrastructure/generated/matcher.d.ts");
const SOURCE_WORD_LIST_JS = resolve(
  import.meta.dir,
  "../src/infrastructure/generated/word-list.js",
);
const SOURCE_WORD_LIST_D_TS = resolve(
  import.meta.dir,
  "../src/infrastructure/generated/word-list.d.ts",
);
const TARGET_DIR = resolve(import.meta.dir, "../dist/infrastructure/generated");
const TARGET_JS = resolve(TARGET_DIR, "matcher.js");
const TARGET_D_TS = resolve(TARGET_DIR, "matcher.d.ts");
const TARGET_WORD_LIST_JS = resolve(TARGET_DIR, "word-list.js");
const TARGET_WORD_LIST_D_TS = resolve(TARGET_DIR, "word-list.d.ts");

async function main(): Promise<void> {
  await mkdir(TARGET_DIR, { recursive: true });
  await copyFile(SOURCE_JS, TARGET_JS);
  await copyFile(SOURCE_D_TS, TARGET_D_TS);
  await copyFile(SOURCE_WORD_LIST_JS, TARGET_WORD_LIST_JS);
  await copyFile(SOURCE_WORD_LIST_D_TS, TARGET_WORD_LIST_D_TS);
  console.log(`[copy-generated-matcher] copied to ${TARGET_DIR}`);
}

await main();
