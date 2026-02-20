import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { LOOKUP_KANA_ENTRY_COUNT, lookupKana } from "../src/infrastructure/generated/matcher.js";

type LookupFunction = (word: string) => string | null;

type BenchResult = {
  readonly name: string;
  readonly lookups: number;
  readonly elapsedMs: number;
  readonly opsPerSec: number;
  readonly checksum: number;
};

type BenchReport = {
  readonly generatedAt: string;
  readonly entries: number;
  readonly sampleQueries: number;
  readonly warmupMs: number;
  readonly durationMs: number;
  readonly results: readonly BenchResult[];
  readonly speedupVsLinear: number;
  readonly machine: {
    readonly runtime: string;
    readonly version: string;
    readonly platform: string;
    readonly arch: string;
  };
};

const OUTPUT_PATH = resolve(import.meta.dir, "./latest.json");
const DATA_PATH = resolve(import.meta.dir, "../data/word-kana.json");
const WARMUP_MS = 200;
const DURATION_MS = 1200;
const SAMPLE_SIZE = 128;

function linearLookupFromEntries(entries: readonly [string, string][]): LookupFunction {
  return (raw: string): string | null => {
    if (typeof raw !== "string") {
      return null;
    }

    const key = raw.trim().toLowerCase();
    if (key.length === 0) {
      return null;
    }

    for (const [word, kana] of entries) {
      if (word === key) {
        return kana;
      }
    }

    return null;
  };
}

function runTimedBenchmark(
  name: string,
  lookup: LookupFunction,
  queries: readonly string[],
  warmupMs: number,
  durationMs: number,
): BenchResult {
  let checksum = 0;
  const runBatch = (): number => {
    let localChecksum = 0;
    for (const query of queries) {
      const result = lookup(query);
      if (result !== null) {
        localChecksum += result.length;
      }
    }
    checksum += localChecksum;
    return queries.length;
  };

  const warmupEnd = performance.now() + warmupMs;
  while (performance.now() < warmupEnd) {
    runBatch();
  }

  let lookups = 0;
  const start = performance.now();
  while (performance.now() - start < durationMs) {
    lookups += runBatch();
  }
  const elapsedMs = performance.now() - start;

  return {
    name,
    lookups,
    elapsedMs,
    opsPerSec: (lookups / elapsedMs) * 1000,
    checksum,
  };
}

function buildQueries(keys: readonly string[]): string[] {
  const hitKeys = keys.slice(0, SAMPLE_SIZE);
  const missingKeys = hitKeys.map((key) => `${key}__missing`);
  const apostropheVariants = hitKeys
    .filter((key) => key.includes("'"))
    .slice(0, 32)
    .map((key) => key.replace(/'/g, "’"));

  return [...hitKeys, ...missingKeys, ...apostropheVariants];
}

function formatOps(opsPerSec: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(opsPerSec));
}

async function main(): Promise<void> {
  const dictionary = (await Bun.file(DATA_PATH).json()) as Record<string, string>;
  const entries = Object.entries(dictionary).toSorted((left, right) => {
    if (left[0] < right[0]) {
      return -1;
    }
    if (left[0] > right[0]) {
      return 1;
    }
    return 0;
  });

  if (entries.length !== LOOKUP_KANA_ENTRY_COUNT) {
    throw new Error(
      `Entry count mismatch: json=${entries.length}, matcher=${LOOKUP_KANA_ENTRY_COUNT}`,
    );
  }

  const queries = buildQueries(entries.map(([word]) => word));
  const linearLookup = linearLookupFromEntries(entries);

  const linear = runTimedBenchmark(
    "Linear scan O(N)",
    linearLookup,
    queries,
    WARMUP_MS,
    DURATION_MS,
  );
  const generated = runTimedBenchmark(
    "Generated radix matcher",
    lookupKana,
    queries,
    WARMUP_MS,
    DURATION_MS,
  );

  const speedupVsLinear = generated.opsPerSec / linear.opsPerSec;
  const report: BenchReport = {
    generatedAt: new Date().toISOString(),
    entries: entries.length,
    sampleQueries: queries.length,
    warmupMs: WARMUP_MS,
    durationMs: DURATION_MS,
    results: [linear, generated],
    speedupVsLinear,
    machine: {
      runtime: "bun",
      version: Bun.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  await mkdir(resolve(import.meta.dir), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`[bench] entries=${report.entries}`);
  console.log(`[bench] queries=${report.sampleQueries}`);
  for (const result of report.results) {
    console.log(`[bench] ${result.name}: ${formatOps(result.opsPerSec)} lookups/s`);
  }
  console.log(`[bench] speedup=${speedupVsLinear.toFixed(2)}x`);
  console.log(`[bench] output=${OUTPUT_PATH}`);
}

await main();
