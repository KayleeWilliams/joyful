import adjectives from "./lib/adjectives.json" assert { type: "json" };
import animals from "./lib/animals.json" assert { type: "json" };
import architecture from "./lib/architecture.json" assert { type: "json" };
import art from "./lib/art.json" assert { type: "json" };
import cities from "./lib/cities.json" assert { type: "json" };
import colors from "./lib/colors.json" assert { type: "json" };
import emotions from "./lib/emotions.json" assert { type: "json" };
import fashion from "./lib/fashion.json" assert { type: "json" };
import food from "./lib/food.json" assert { type: "json" };
import history from "./lib/history.json" assert { type: "json" };
import literature from "./lib/literature.json" assert { type: "json" };
import music from "./lib/music.json" assert { type: "json" };
import mythology from "./lib/mythology.json" assert { type: "json" };
import nature from "./lib/nature.json" assert { type: "json" };
import professions from "./lib/professions.json" assert { type: "json" };
import science from "./lib/science.json" assert { type: "json" };
import space from "./lib/space.json" assert { type: "json" };
import sports from "./lib/sports.json" assert { type: "json" };
import transportation from "./lib/transportation.json" assert { type: "json" };

export interface JoyfulOptions {
  maxLength?: number;
  pattern?: readonly JoyfulCategory[];
  segments?: number;
  separator?: string;
}

export interface PermutationsOptions {
  pattern?: readonly JoyfulCategory[];
  segments?: number;
}

const MIN_CATEGORY_WORD_LENGTH = 2;

const prefixes = [...adjectives, ...colors];

const categoryWordLists = {
  adjective: adjectives,
  animal: animals,
  architecture,
  art,
  city: cities,
  color: colors,
  emotion: emotions,
  fashion,
  food,
  history,
  literature,
  music,
  mythology,
  nature,
  profession: professions,
  science,
  space,
  sport: sports,
  transportation,
};

export type JoyfulCategory = keyof typeof categoryWordLists;

const categoryNames = Object.keys(categoryWordLists) as JoyfulCategory[];

const isJoyfulCategory = (category: string): category is JoyfulCategory =>
  Object.hasOwn(categoryWordLists, category);

const categories = [
  animals,
  architecture,
  art,
  cities,
  emotions,
  fashion,
  food,
  history,
  literature,
  music,
  mythology,
  nature,
  professions,
  science,
  space,
  sports,
  transportation,
];

const getRandomElement = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];

const validatePattern = (pattern?: readonly JoyfulCategory[]): void => {
  if (!pattern) {
    return;
  }

  for (const category of pattern) {
    if (!isJoyfulCategory(category)) {
      throw new Error(
        `Unknown pattern category "${category}". Expected one of: ${categoryNames.join(
          ", "
        )}`
      );
    }
  }
};

const validateWordCount = (wordCount: number): void => {
  if (wordCount < 2) {
    throw new Error("Need at least 2 words");
  }
};

const validateInput = (
  segments: number,
  separator: string,
  maxLength?: number,
  pattern?: readonly JoyfulCategory[]
): void => {
  const wordCount = pattern?.length ?? segments;

  validateWordCount(wordCount);

  if (!separator) {
    throw new Error("Need a separator");
  }

  if (
    maxLength !== undefined &&
    (!Number.isInteger(maxLength) || maxLength <= 0)
  ) {
    throw new Error("maxLength must be a positive integer");
  }

  validatePattern(pattern);
};

const getDefaultCategoryWordCount = (): number => {
  let count = 0;

  for (const category of categories) {
    count += category.length;
  }

  return count;
};

const getDefaultPermutations = (segments: number): number => {
  validateWordCount(segments);

  let total = prefixes.length;
  const categoryWordCount = getDefaultCategoryWordCount();

  for (let index = 1; index < segments; index += 1) {
    total *= categoryWordCount;
  }

  return total;
};

const getPatternPermutations = (pattern: readonly JoyfulCategory[]): number => {
  validateWordCount(pattern.length);
  validatePattern(pattern);

  let total = 1;

  for (const category of pattern) {
    total *= categoryWordLists[category].length;
  }

  return total;
};

const getUniqueWord = (words: string[], maxWordLength?: number): string => {
  const category = getRandomElement(categories);
  const pool =
    maxWordLength === undefined
      ? category
      : category.filter((w) => w.length <= maxWordLength);

  if (pool.length === 0) {
    return getUniqueWord(words, maxWordLength);
  }

  const word = getRandomElement(pool);
  return words.includes(word) ? getUniqueWord(words, maxWordLength) : word;
};

const getUniquePatternWord = (
  words: string[],
  pool: string[],
  maxWordLength?: number
): string | undefined => {
  if (maxWordLength === undefined) {
    if (
      words.length >= pool.length &&
      pool.every((word) => words.includes(word))
    ) {
      return undefined;
    }

    let word = getRandomElement(pool);
    while (words.includes(word)) {
      word = getRandomElement(pool);
    }

    return word;
  }

  const candidates = pool.filter(
    (word) => !words.includes(word) && word.length <= maxWordLength
  );

  return candidates.length === 0 ? undefined : getRandomElement(candidates);
};

const generateUnbounded = (segments: number, separator: string): string => {
  const words: string[] = [getRandomElement(prefixes)];

  for (let index = 1; index < segments; index += 1) {
    words.push(getUniqueWord(words));
  }

  return words.join(separator);
};

const generatePatternUnbounded = (
  pattern: readonly JoyfulCategory[],
  separator: string
): string => {
  const words: string[] = [];

  for (const category of pattern) {
    const word = getUniquePatternWord(words, categoryWordLists[category]);

    if (!word) {
      throw new Error(
        `Not enough unique words in pattern category "${category}"`
      );
    }

    words.push(word);
  }

  return words.join(separator);
};

const tooShortError = (
  maxLength: number,
  segments: number,
  separator: string
): Error =>
  new Error(
    `maxLength ${maxLength} is too short to generate ${segments} segments with separator "${separator}"`
  );

const pickBoundedPrefix = (
  budget: number,
  segments: number
): string | undefined => {
  const maxPrefixLength = budget - (segments - 1) * MIN_CATEGORY_WORD_LENGTH;
  const filtered = prefixes.filter((w) => w.length <= maxPrefixLength);
  return filtered.length === 0 ? undefined : getRandomElement(filtered);
};

const pickBoundedWord = (
  words: string[],
  budget: number,
  remainingAfter: number
): string | undefined => {
  const maxWordLength = budget - remainingAfter * MIN_CATEGORY_WORD_LENGTH;
  const hasValid = categories.flat().some((w) => w.length <= maxWordLength);
  return hasValid ? getUniqueWord(words, maxWordLength) : undefined;
};

const fillBoundedWords = (
  words: string[],
  segments: number,
  budget: number,
  maxLength: number,
  separator: string
): number => {
  let remaining = budget;

  for (let index = 1; index < segments; index += 1) {
    const word = pickBoundedWord(words, remaining, segments - index - 1);

    if (!word) {
      throw tooShortError(maxLength, segments, separator);
    }

    words.push(word);
    remaining -= word.length;
  }

  return remaining;
};

const getMinimumWordLength = (pool: string[]): number => {
  let minimum = Number.POSITIVE_INFINITY;

  for (const word of pool) {
    minimum = Math.min(minimum, word.length);
  }

  return minimum;
};

const getMinimumRemainingLength = (
  pools: string[][],
  startIndex: number
): number => {
  let total = 0;

  for (let index = startIndex; index < pools.length; index += 1) {
    total += getMinimumWordLength(pools[index]);
  }

  return total;
};

const generateBounded = (
  segments: number,
  separator: string,
  maxLength: number
): string => {
  const budget = maxLength - (segments - 1) * separator.length;
  const prefix = pickBoundedPrefix(budget, segments);

  if (!prefix) {
    throw tooShortError(maxLength, segments, separator);
  }

  const words: string[] = [prefix];
  fillBoundedWords(
    words,
    segments,
    budget - prefix.length,
    maxLength,
    separator
  );
  return words.join(separator);
};

const fillPatternBoundedWords = (
  words: string[],
  pools: string[][],
  budget: number,
  maxLength: number,
  separator: string
): void => {
  let remaining = budget;
  for (let index = 0; index < pools.length; index += 1) {
    const maxWordLength =
      remaining - getMinimumRemainingLength(pools, index + 1);
    const word = getUniquePatternWord(words, pools[index], maxWordLength);

    if (!word) {
      throw tooShortError(maxLength, pools.length, separator);
    }

    words.push(word);
    remaining -= word.length;
  }
};

const generatePatternBounded = (
  pattern: readonly JoyfulCategory[],
  separator: string,
  maxLength: number
): string => {
  const pools = pattern.map((category) => categoryWordLists[category]);
  const budget = maxLength - (pattern.length - 1) * separator.length;

  if (budget < getMinimumRemainingLength(pools, 0)) {
    throw tooShortError(maxLength, pattern.length, separator);
  }

  const words: string[] = [];
  fillPatternBoundedWords(words, pools, budget, maxLength, separator);
  return words.join(separator);
};

export const joyful = (options: JoyfulOptions = {}): string => {
  const { maxLength, pattern, segments = 2, separator = "-" } = options;

  validateInput(segments, separator, maxLength, pattern);

  if (pattern) {
    if (maxLength === undefined) {
      return generatePatternUnbounded(pattern, separator);
    }

    return generatePatternBounded(pattern, separator, maxLength);
  }

  if (maxLength === undefined) {
    return generateUnbounded(segments, separator);
  }

  return generateBounded(segments, separator, maxLength);
};

export const permutations = (options: PermutationsOptions = {}): number => {
  const { pattern, segments = 2 } = options;

  if (pattern) {
    return getPatternPermutations(pattern);
  }

  return getDefaultPermutations(segments);
};
