#!/usr/bin/env node

import { joyful, permutations } from "./index";
import type {
  JoyfulCategory,
  JoyfulOptions,
  JoyfulWordLists,
  PermutationsOptions,
} from "./index";

const args = process.argv.slice(2);
const knownFlags = new Set([
  "--help",
  "-h",
  "--json",
  "--max-length",
  "-m",
  "--omit",
  "-o",
  "--pattern",
  "-t",
  "--permutations",
  "--segments",
  "-s",
  "--separator",
  "-p",
  "--word-list",
  "-w",
]);

const getFlagValue = (index: number, name: string): string => {
  const value = args[index + 1];

  if (value === undefined || knownFlags.has(value)) {
    throw new Error(`--${name} requires a value`);
  }

  return value;
};

const parseFlag = (name: string, short: string): string | undefined => {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === `--${name}` || args[i] === `-${short}`) {
      return getFlagValue(i, name);
    }
  }
  return undefined;
};

const parseFlags = (name: string, short: string): string[] => {
  const values: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === `--${name}` || args[i] === `-${short}`) {
      values.push(getFlagValue(i, name));
    }
  }

  return values;
};

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: joyful [options]

Options:
  -s, --segments <number>       Number of words to generate (default: 2)
  -t, --pattern <categories>    Category pattern, comma-separated
  -w, --word-list <name=words>  Custom list, comma-separated; repeatable
  -o, --omit <words>            Words to omit, comma-separated; repeatable
  -p, --separator <string>      Separator between words (default: "-")
  -m, --max-length <number>     Maximum length of the result
      --permutations            Calculate possible permutations
      --json                    Output permutation results as JSON
  -h, --help                    Show this help message`);
  process.exit(0);
}

const hasFlag = (name: string): boolean => args.includes(`--${name}`);

let segmentsRaw: string | undefined;
let patternRaw: string | undefined;
let wordListRaw: string[] = [];
let omitRaw: string[] = [];
let maxLengthRaw: string | undefined;
const shouldCalculatePermutations = hasFlag("permutations");
const shouldOutputJson = hasFlag("json");

const parseCommaSeparated = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parsePattern = (value: string): string[] => parseCommaSeparated(value);

const parseWordLists = (values: string[]): JoyfulWordLists | undefined => {
  if (values.length === 0) {
    return undefined;
  }

  const wordLists: JoyfulWordLists = {};

  for (const value of values) {
    const separatorIndex = value.indexOf("=");

    if (separatorIndex <= 0) {
      throw new Error('--word-list must use the format "name=word,word"');
    }

    const name = value.slice(0, separatorIndex).trim();
    const words = parseCommaSeparated(value.slice(separatorIndex + 1));

    if (words.length === 0) {
      throw new Error(`Custom word list "${name}" must include words`);
    }

    wordLists[name] = [...(wordLists[name] ?? []), ...words];
  }

  return wordLists;
};

interface CliOptions {
  maxLength?: number;
  omit?: string[];
  pattern?: string[];
  segments?: number;
  separator?: string;
  wordLists?: JoyfulWordLists;
}

const options: CliOptions = {};

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

const getPermutationOptions = (
  overrides: { pattern?: readonly string[]; segments?: number } = {}
): PermutationsOptions =>
  ({
    omit: options.omit,
    pattern: overrides.pattern,
    segments: overrides.segments,
    wordLists: options.wordLists,
  }) as PermutationsOptions;

const getSegmentResults = (): SegmentPermutation[] =>
  [2, 3, 4, 5].map((segmentCount) => ({
    permutations: permutations(
      getPermutationOptions({ segments: segmentCount })
    ),
    segments: segmentCount,
  }));

const getPatternResults = (): PatternPermutation[] =>
  commonPatterns.map((pattern) => ({
    pattern,
    permutations: permutations(getPermutationOptions({ pattern })),
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

const printPatternPermutation = (pattern: readonly string[]): void => {
  const result = {
    pattern,
    permutations: permutations(getPermutationOptions({ pattern })),
  };

  if (shouldOutputJson) {
    printJson(result);
    return;
  }

  console.log(
    `${result.pattern.join("-")}: ${result.permutations.toLocaleString()}`
  );
};

const printSegmentPermutation = (segments: number): void => {
  const result = {
    permutations: permutations(getPermutationOptions({ segments })),
    segments,
  };

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
  segmentsRaw = parseFlag("segments", "s");
  patternRaw = parseFlag("pattern", "t");
  wordListRaw = parseFlags("word-list", "w");
  omitRaw = parseFlags("omit", "o");
  maxLengthRaw = parseFlag("max-length", "m");

  const separator = parseFlag("separator", "p");

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

  const parsedWordLists = parseWordLists(wordListRaw);

  if (parsedWordLists) {
    options.wordLists = parsedWordLists;
  }

  if (omitRaw.length > 0) {
    options.omit = omitRaw.flatMap(parseCommaSeparated);
  }

  if (shouldOutputJson && !shouldCalculatePermutations) {
    throw new Error("--json is only supported with --permutations");
  }

  if (shouldCalculatePermutations) {
    printPermutationResult();
    process.exit(0);
  }

  console.log(joyful(options as JoyfulOptions));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
