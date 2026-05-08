import { appendFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

interface StartupCase {
  args: string[];
  name: string;
}

interface StartupResult {
  avgMs: number;
  maxMs: number;
  minMs: number;
  name: string;
  p75Ms: number;
  p99Ms: number;
}

const iterations = Number.parseInt(
  process.env.JOYFUL_STARTUP_ITERATIONS ?? "25",
  10
);

const cases: StartupCase[] = [
  { args: ["--eval", ""], name: "bun baseline" },
  {
    args: [
      "--eval",
      'const { joyful } = await import("./dist/index.mjs"); joyful();',
    ],
    name: "esm import + call",
  },
  {
    args: [
      "--eval",
      'const { joyful } = require("./dist/index.js"); joyful();',
    ],
    name: "cjs require + call",
  },
  { args: ["dist/cli.mjs", "--help"], name: "cli --help" },
];

const percentile = (values: number[], percentileValue: number): number => {
  const index = Math.min(
    values.length - 1,
    Math.ceil(values.length * percentileValue) - 1
  );
  return values[index] ?? 0;
};

const measureCase = ({ args, name }: StartupCase): number => {
  const start = performance.now();
  const result = Bun.spawnSync(["bun", ...args], {
    stderr: "pipe",
    stdout: "pipe",
  });
  const end = performance.now();

  if (result.exitCode !== 0) {
    throw new Error(`${name} failed with exit code ${result.exitCode}`);
  }

  return end - start;
};

const summarizeCase = (name: string, timings: number[]): StartupResult => {
  const sorted = timings.toSorted((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  return {
    avgMs: total / sorted.length,
    maxMs: sorted.at(-1) ?? 0,
    minMs: sorted[0] ?? 0,
    name,
    p75Ms: percentile(sorted, 0.75),
    p99Ms: percentile(sorted, 0.99),
  };
};

const runCase = (startupCase: StartupCase): StartupResult => {
  const timings = Array.from({ length: iterations }, () =>
    measureCase(startupCase)
  );

  return summarizeCase(startupCase.name, timings);
};

const formatMs = (value: number): string => `${value.toFixed(2)} ms`;

const table = (results: StartupResult[]): string => {
  const rows = [
    "| Case | Avg | Min | P75 | P99 | Max |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...results.map(
      ({ avgMs, maxMs, minMs, name, p75Ms, p99Ms }) =>
        `| ${name} | ${formatMs(avgMs)} | ${formatMs(minMs)} | ${formatMs(
          p75Ms
        )} | ${formatMs(p99Ms)} | ${formatMs(maxMs)} |`
    ),
  ];

  return rows.join("\n");
};

const results = cases.map(runCase);
const report = table(results);

console.log(report);

const githubStepSummary = process.env.GITHUB_STEP_SUMMARY;

if (githubStepSummary) {
  appendFileSync(
    githubStepSummary,
    `## Startup Benchmarks\n\n${report}\n\nIterations: ${iterations}\n\n`
  );
}
