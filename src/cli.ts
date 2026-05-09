#!/usr/bin/env node

import { joyful, permutations } from "./index";
import type { JoyfulCategory, JoyfulOptions } from "./index";

const args = process.argv.slice(2);

const parseFlag = (name: string, short: string): string | undefined => {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === `--${name}` || args[i] === `-${short}`) {
      return args[i + 1];
    }
  }
  return undefined;
};

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: joyful [options]

Options:
  -s, --segments <number>    Number of words to generate (default: 2)
  -t, --pattern <categories> Category pattern, comma-separated
  -p, --separator <string>   Separator between words (default: "-")
  -m, --max-length <number>  Maximum length of the result
      --permutations         Calculate possible permutations
      --json                 Output permutation results as JSON
  -h, --help                 Show this help message`);
  process.exit(0);
}

const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const segmentsRaw = parseFlag("segments", "s");
const patternRaw = parseFlag("pattern", "t");
const separator = parseFlag("separator", "p");
const maxLengthRaw = parseFlag("max-length", "m");
const shouldCalculatePermutations = hasFlag("permutations");
const shouldOutputJson = hasFlag("json");

const parsePattern = (value: string): JoyfulCategory[] =>
  value
    .split(",")
    .map((category) => category.trim())
    .filter(Boolean) as JoyfulCategory[];

const options: JoyfulOptions = {};

if (segmentsRaw !== undefined) {
  options.segments = Number.parseInt(segmentsRaw, 10);
}

if (patternRaw !== undefined) {
  options.pattern = parsePattern(patternRaw);
}

if (separator !== undefined) {
  options.separator = separator;
}

if (maxLengthRaw !== undefined) {
  options.maxLength = Number.parseInt(maxLengthRaw, 10);
}

const commonPatterns = [
  ["adjective", "animal"],
  ["color", "nature", "animal"],
  ["city", "nature", "space"],
] as const satisfies readonly (readonly JoyfulCategory[])[];

interface PatternPermutation {
  pattern: readonly JoyfulCategory[];
  permutations: number;
}

interface SegmentPermutation {
  permutations: number;
  segments: number;
}

const printJson = (value: unknown): void => {
  console.log(JSON.stringify(value, null, 2));
};

const getSegmentResults = (): SegmentPermutation[] =>
  [2, 3, 4, 5].map((segmentCount) => ({
    permutations: permutations({ segments: segmentCount }),
    segments: segmentCount,
  }));

const getPatternResults = (): PatternPermutation[] =>
  commonPatterns.map((pattern) => ({
    pattern,
    permutations: permutations({ pattern }),
  }));

const printSegmentResults = (segments: SegmentPermutation[]): void => {
  console.log("Possible permutations:");
  for (const result of segments) {
    console.log(
      `${result.segments} words: ${result.permutations.toLocaleString()}`
    );
  }
};

const printPatternResults = (patterns: PatternPermutation[]): void => {
  console.log("\nPattern permutations:");
  for (const result of patterns) {
    console.log(
      `${result.pattern.join("-")}: ${result.permutations.toLocaleString()}`
    );
  }
};

const printPermutationSummary = (): void => {
  const segments = getSegmentResults();
  const patterns = getPatternResults();

  if (shouldOutputJson) {
    printJson({ patterns, segments });
    return;
  }

  printSegmentResults(segments);
  printPatternResults(patterns);
};

const printPatternPermutation = (pattern: readonly JoyfulCategory[]): void => {
  const result = { pattern, permutations: permutations({ pattern }) };

  if (shouldOutputJson) {
    printJson(result);
    return;
  }

  console.log(
    `${result.pattern.join("-")}: ${result.permutations.toLocaleString()}`
  );
};

const printSegmentPermutation = (segments: number): void => {
  const result = { permutations: permutations({ segments }), segments };

  if (shouldOutputJson) {
    printJson(result);
    return;
  }

  console.log(
    `${result.segments} words: ${result.permutations.toLocaleString()}`
  );
};

const printPermutationResult = (): void => {
  if (maxLengthRaw !== undefined) {
    throw new Error("--max-length is not supported with --permutations");
  }

  if (patternRaw !== undefined && options.pattern) {
    printPatternPermutation(options.pattern);
    return;
  }

  if (segmentsRaw !== undefined && options.segments !== undefined) {
    printSegmentPermutation(options.segments);
    return;
  }

  printPermutationSummary();
};

try {
  if (shouldOutputJson && !shouldCalculatePermutations) {
    throw new Error("--json is only supported with --permutations");
  }

  if (shouldCalculatePermutations) {
    printPermutationResult();
    process.exit(0);
  }

  console.log(joyful(options));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
