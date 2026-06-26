import adjectives from "./lib/adjectives.json" with { type: "json" };
import animals from "./lib/animals.json" with { type: "json" };
import architecture from "./lib/architecture.json" with { type: "json" };
import art from "./lib/art.json" with { type: "json" };
import cities from "./lib/cities.json" with { type: "json" };
import colors from "./lib/colors.json" with { type: "json" };
import emotions from "./lib/emotions.json" with { type: "json" };
import fashion from "./lib/fashion.json" with { type: "json" };
import food from "./lib/food.json" with { type: "json" };
import history from "./lib/history.json" with { type: "json" };
import literature from "./lib/literature.json" with { type: "json" };
import music from "./lib/music.json" with { type: "json" };
import mythology from "./lib/mythology.json" with { type: "json" };
import nature from "./lib/nature.json" with { type: "json" };
import professions from "./lib/professions.json" with { type: "json" };
import science from "./lib/science.json" with { type: "json" };
import space from "./lib/space.json" with { type: "json" };
import sports from "./lib/sports.json" with { type: "json" };
import transportation from "./lib/transportation.json" with { type: "json" };

export type JoyfulWordLists = Record<string, readonly string[]>;

interface BaseJoyfulOptions {
  maxLength?: number;
  omit?: readonly string[];
  segments?: number;
  separator?: string;
}

export type JoyfulOptions =
  | (BaseJoyfulOptions & {
      pattern?: readonly JoyfulCategory[];
      wordLists?: undefined;
    })
  | (BaseJoyfulOptions & {
      pattern?: readonly string[];
      wordLists: JoyfulWordLists;
    });

export type PermutationsOptions =
  | {
      omit?: readonly string[];
      pattern?: readonly JoyfulCategory[];
      segments?: number;
      wordLists?: undefined;
    }
  | {
      omit?: readonly string[];
      pattern?: readonly string[];
      segments?: number;
      wordLists: JoyfulWordLists;
    };

interface ActiveWordLists {
  categoryNames: string[];
  categoryWordLists: Record<string, string[]>;
  categoryWords: string[];
  prefixes: string[];
}

interface DefaultWordPools {
  categoryWords: string[];
  prefixes: string[];
}

interface GenerationOptions {
  categoryWordLists: Record<string, string[]>;
  categoryWords: string[];
  prefixes: string[];
}

interface ResolvedOptions extends GenerationOptions {
  categoryNames: string[];
}

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

const categoryWords = categories.flat();
const prefixes = [...adjectives, ...colors];
const defaultWordLists: ActiveWordLists = {
  categoryNames,
  categoryWordLists,
  categoryWords,
  prefixes,
};

const getRandomElement = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((word) => typeof word === "string");

const uniqueWords = (words: readonly string[]): string[] => [...new Set(words)];

const validateWordLists = (wordLists?: JoyfulWordLists): void => {
  if (!wordLists) {
    return;
  }

  for (const [name, words] of Object.entries(wordLists)) {
    if (!name) {
      throw new Error("Custom word list names cannot be empty");
    }

    if (!isStringArray(words)) {
      throw new Error(`Custom word list "${name}" must contain strings`);
    }
  }
};

const filterWords = (
  words: readonly string[],
  omittedWords: ReadonlySet<string>
): string[] => uniqueWords(words).filter((word) => !omittedWords.has(word));

const getActiveWordLists = (
  wordLists?: JoyfulWordLists,
  omit: readonly string[] = []
): ActiveWordLists => {
  validateWordLists(wordLists);

  if (!wordLists && omit.length === 0) {
    return defaultWordLists;
  }

  const omittedWords = new Set(omit);
  const mergedWordLists = { ...categoryWordLists, ...wordLists };
  const activeCategoryWordLists: Record<string, string[]> = {};

  for (const [name, words] of Object.entries(mergedWordLists)) {
    activeCategoryWordLists[name] = filterWords(words, omittedWords);
  }

  const activeCategoryNames = Object.keys(activeCategoryWordLists);
  const activeCategories = Object.entries(activeCategoryWordLists)
    .filter(([name]) => name !== "adjective" && name !== "color")
    .map(([, words]) => words);

  return {
    categoryNames: activeCategoryNames,
    categoryWordLists: activeCategoryWordLists,
    categoryWords: uniqueWords(activeCategories.flat()),
    prefixes: uniqueWords([
      ...(activeCategoryWordLists.adjective ?? []),
      ...(activeCategoryWordLists.color ?? []),
    ]),
  };
};

const validatePattern = (
  availableCategoryNames: readonly string[],
  availableWordLists: Record<string, string[]>,
  pattern?: readonly string[]
): void => {
  if (!pattern) {
    return;
  }

  for (const category of pattern) {
    if (!Object.hasOwn(availableWordLists, category)) {
      throw new Error(
        `Unknown pattern category "${category}". Expected one of: ${availableCategoryNames.join(
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
  pattern?: readonly string[],
  resolvedOptions: ResolvedOptions = defaultWordLists
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

  validatePattern(
    resolvedOptions.categoryNames,
    resolvedOptions.categoryWordLists,
    pattern
  );
};

const getFallingFactorial = (value: number, count: number): number => {
  if (value < count) {
    return 0;
  }

  let total = 1;

  for (let offset = 0; offset < count; offset += 1) {
    total *= value - offset;
  }

  return total;
};

const getDefaultPermutations = (
  segments: number,
  wordPools: DefaultWordPools = defaultWordLists
): number => {
  validateWordCount(segments);

  let total = 0;
  const categoryWordsSet = new Set(wordPools.categoryWords);

  for (const prefix of wordPools.prefixes) {
    const availableCategoryWords =
      wordPools.categoryWords.length - (categoryWordsSet.has(prefix) ? 1 : 0);
    total += getFallingFactorial(availableCategoryWords, segments - 1);
  }

  return total;
};

const haveSameWords = (a: readonly string[], b: readonly string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const words = new Set(a);
  return b.every((word) => words.has(word));
};

const arePairwiseDisjoint = (pools: readonly string[][]): boolean => {
  const seen = new Set<string>();

  for (const pool of pools) {
    for (const word of pool) {
      if (seen.has(word)) {
        return false;
      }

      seen.add(word);
    }
  }

  return true;
};

const countUniquePatternPermutations = (pools: string[][]): number => {
  if (pools.some((pool) => pool.length === 0)) {
    return 0;
  }

  if (arePairwiseDisjoint(pools)) {
    return pools.reduce((total, pool) => total * pool.length, 1);
  }

  if (pools.every((pool) => haveSameWords(pool, pools[0]))) {
    return getFallingFactorial(pools[0].length, pools.length);
  }

  const orderedPools = pools.toSorted((a, b) => a.length - b.length);

  const countFrom = (index: number, words: readonly string[]): number => {
    if (index >= orderedPools.length) {
      return 1;
    }

    let total = 0;

    for (const word of orderedPools[index]) {
      if (!words.includes(word)) {
        total += countFrom(index + 1, [...words, word]);
      }
    }

    return total;
  };

  return countFrom(0, []);
};

const getPatternPermutations = (
  pattern: readonly string[],
  resolvedOptions: ResolvedOptions = defaultWordLists
): number => {
  validateWordCount(pattern.length);
  validatePattern(
    resolvedOptions.categoryNames,
    resolvedOptions.categoryWordLists,
    pattern
  );

  const pools = pattern.map((category) =>
    uniqueWords(resolvedOptions.categoryWordLists[category] ?? [])
  );

  return countUniquePatternPermutations(pools);
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

const getUniqueWord = (
  words: string[],
  pool: string[],
  maxWordLength?: number
): string | undefined => getUniquePatternWord(words, pool, maxWordLength);

const canFillPattern = (
  pools: string[][],
  startIndex: number,
  words: readonly string[],
  budget?: number
): boolean => {
  if (startIndex >= pools.length) {
    return true;
  }

  for (const word of pools[startIndex]) {
    if (budget !== undefined && word.length > budget) {
      continue;
    }

    if (
      !words.includes(word) &&
      canFillPattern(
        pools,
        startIndex + 1,
        [...words, word],
        budget === undefined ? undefined : budget - word.length
      )
    ) {
      return true;
    }
  }

  return false;
};

const getViablePatternWord = (
  pools: string[][],
  index: number,
  words: string[],
  budget?: number
): string | undefined => {
  const candidates = pools[index].filter(
    (word) =>
      !words.includes(word) &&
      (budget === undefined || word.length <= budget) &&
      canFillPattern(
        pools,
        index + 1,
        [...words, word],
        budget === undefined ? undefined : budget - word.length
      )
  );

  return candidates.length === 0 ? undefined : getRandomElement(candidates);
};

const notEnoughWordsError = (): Error =>
  new Error("Not enough unique words to generate a result");

const generateUnbounded = (
  segments: number,
  separator: string,
  wordPools: DefaultWordPools
): string => {
  if (wordPools.prefixes.length === 0) {
    throw notEnoughWordsError();
  }

  const words: string[] = [getRandomElement(wordPools.prefixes)];

  for (let index = 1; index < segments; index += 1) {
    const word = getUniqueWord(words, wordPools.categoryWords);

    if (!word) {
      throw notEnoughWordsError();
    }

    words.push(word);
  }

  return words.join(separator);
};

const generatePatternUnbounded = (
  pattern: readonly string[],
  separator: string,
  activeCategoryWordLists: Record<string, string[]>
): string => {
  const pools = pattern.map(
    (category) => activeCategoryWordLists[category] ?? []
  );
  const words: string[] = [];

  for (const [index, category] of pattern.entries()) {
    const word = getViablePatternWord(pools, index, words);

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

const getMinimumWordLength = (pool: string[]): number => {
  let minimum = Number.POSITIVE_INFINITY;

  for (const word of pool) {
    minimum = Math.min(minimum, word.length);
  }

  return minimum;
};

const pickBoundedPrefix = (
  budget: number,
  segments: number,
  wordPools: DefaultWordPools
): string | undefined => {
  const minimumCategoryWordLength = getMinimumWordLength(
    wordPools.categoryWords
  );
  const maxPrefixLength = budget - (segments - 1) * minimumCategoryWordLength;
  const filtered = wordPools.prefixes.filter(
    (w) => w.length <= maxPrefixLength
  );
  return filtered.length === 0 ? undefined : getRandomElement(filtered);
};

const pickBoundedWord = (
  words: string[],
  budget: number,
  remainingAfter: number,
  wordPools: DefaultWordPools
): string | undefined => {
  const minimumCategoryWordLength = getMinimumWordLength(
    wordPools.categoryWords
  );
  const maxWordLength = budget - remainingAfter * minimumCategoryWordLength;
  return getUniqueWord(words, wordPools.categoryWords, maxWordLength);
};

const fillBoundedWords = (
  words: string[],
  segments: number,
  budget: number,
  maxLength: number,
  separator: string,
  wordPools: DefaultWordPools
): number => {
  let remaining = budget;

  for (let index = 1; index < segments; index += 1) {
    const word = pickBoundedWord(
      words,
      remaining,
      segments - index - 1,
      wordPools
    );

    if (!word) {
      throw tooShortError(maxLength, segments, separator);
    }

    words.push(word);
    remaining -= word.length;
  }

  return remaining;
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
  maxLength: number,
  wordPools: DefaultWordPools
): string => {
  const budget = maxLength - (segments - 1) * separator.length;
  const prefix = pickBoundedPrefix(budget, segments, wordPools);

  if (!prefix) {
    throw tooShortError(maxLength, segments, separator);
  }

  const words: string[] = [prefix];
  fillBoundedWords(
    words,
    segments,
    budget - prefix.length,
    maxLength,
    separator,
    wordPools
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
    const word = getViablePatternWord(pools, index, words, remaining);

    if (!word) {
      throw tooShortError(maxLength, pools.length, separator);
    }

    words.push(word);
    remaining -= word.length;
  }
};

const generatePatternBounded = (
  pattern: readonly string[],
  separator: string,
  maxLength: number,
  activeCategoryWordLists: Record<string, string[]>
): string => {
  const pools = pattern.map(
    (category) => activeCategoryWordLists[category] ?? []
  );
  const budget = maxLength - (pattern.length - 1) * separator.length;

  if (budget < getMinimumRemainingLength(pools, 0)) {
    throw tooShortError(maxLength, pattern.length, separator);
  }

  const words: string[] = [];
  fillPatternBoundedWords(words, pools, budget, maxLength, separator);
  return words.join(separator);
};

export const joyful = (options: JoyfulOptions = {}): string => {
  const {
    maxLength,
    omit = [],
    pattern,
    segments = 2,
    separator = "-",
    wordLists,
  } = options;
  const resolvedOptions = getActiveWordLists(wordLists, omit);

  validateInput(segments, separator, maxLength, pattern, resolvedOptions);

  if (pattern) {
    if (maxLength === undefined) {
      return generatePatternUnbounded(
        pattern,
        separator,
        resolvedOptions.categoryWordLists
      );
    }

    return generatePatternBounded(
      pattern,
      separator,
      maxLength,
      resolvedOptions.categoryWordLists
    );
  }

  if (maxLength === undefined) {
    return generateUnbounded(segments, separator, resolvedOptions);
  }

  return generateBounded(segments, separator, maxLength, resolvedOptions);
};

export const permutations = (options: PermutationsOptions = {}): number => {
  const { omit = [], pattern, segments = 2, wordLists } = options;
  const resolvedOptions = getActiveWordLists(wordLists, omit);

  if (pattern) {
    return getPatternPermutations(pattern, resolvedOptions);
  }

  return getDefaultPermutations(segments, resolvedOptions);
};
