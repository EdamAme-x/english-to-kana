import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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

const README_PATH = resolve(import.meta.dir, "../README.md");
const BENCHMARK_JSON_PATH = resolve(import.meta.dir, "./latest.json");
const MARKER_START = "<!-- BENCHMARK:START -->";
const MARKER_END = "<!-- BENCHMARK:END -->";

function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function toBenchmarkSection(report: BenchReport): string {
  const lines: string[] = [];
  lines.push("### Latest Benchmark");
  lines.push("");
  lines.push(`- Generated at: \`${report.generatedAt}\``);
  lines.push(`- Entries: \`${formatInteger(report.entries)}\``);
  lines.push(`- Query set: \`${formatInteger(report.sampleQueries)}\``);
  lines.push(
    `- Runtime: \`${report.machine.runtime} ${report.machine.version} (${report.machine.platform}/${report.machine.arch})\``,
  );
  lines.push("");
  lines.push("| Implementation | Lookups/s | Total lookups | Time (ms) |");
  lines.push("| --- | ---: | ---: | ---: |");
  for (const result of report.results) {
    lines.push(
      `| ${result.name} | ${formatInteger(result.opsPerSec)} | ${formatInteger(result.lookups)} | ${formatNumber(result.elapsedMs, 1)} |`,
    );
  }
  lines.push("");
  lines.push(`Speedup vs linear scan: **${formatNumber(report.speedupVsLinear)}x**`);
  lines.push("");
  lines.push("_Benchmark measures dictionary lookup only._");
  return lines.join("\n");
}

function replaceBetweenMarkers(readme: string, content: string): string {
  const startIndex = readme.indexOf(MARKER_START);
  const endIndex = readme.indexOf(MARKER_END);
  const block = `${MARKER_START}\n${content}\n${MARKER_END}`;

  if (startIndex >= 0 && endIndex > startIndex) {
    const before = readme.slice(0, startIndex);
    const after = readme.slice(endIndex + MARKER_END.length);
    return `${before}${block}${after}`;
  }

  const normalized = readme.endsWith("\n") ? readme : `${readme}\n`;
  return `${normalized}\n## Benchmark\n${block}\n`;
}

async function main(): Promise<void> {
  const [readme, benchmarkJson] = await Promise.all([
    readFile(README_PATH, "utf8"),
    readFile(BENCHMARK_JSON_PATH, "utf8"),
  ]);
  const report = JSON.parse(benchmarkJson) as BenchReport;
  const section = toBenchmarkSection(report);
  const nextReadme = replaceBetweenMarkers(readme, section);

  await writeFile(README_PATH, nextReadme, "utf8");
  console.log(`[benchmark:update-readme] updated ${README_PATH}`);
}

await main();
