import adjectives from "./lib/adjectives.json" with { type: "json" };
import animals from "./lib/animals.json" with { type: "json" };
import architecture from "./lib/architecture.json" with { type: "json" };
import art from "./lib/art.json" with { type: "json" };
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

export interface JoyfulOptions {
  maxLength?: number;
  segments?: number;
  separator?: string;
}

const MIN_CATEGORY_WORD_LENGTH = 2;

const prefixes = [...adjectives, ...colors];

const categories = [
  animals,
  architecture,
  art,
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

const validateInput = (
  segments: number,
  separator: string,
  maxLength?: number
): void => {
  if (segments < 2) {
    throw new Error("Need at least 2 words");
  }

  if (!separator) {
    throw new Error("Need a separator");
  }

  if (
    maxLength !== undefined &&
    (!Number.isInteger(maxLength) || maxLength <= 0)
  ) {
    throw new Error("maxLength must be a positive integer");
  }
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

const generateUnbounded = (segments: number, separator: string): string => {
  const words: string[] = [getRandomElement(prefixes)];

  for (let index = 1; index < segments; index += 1) {
    words.push(getUniqueWord(words));
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

export const joyful = (options: JoyfulOptions = {}): string => {
  const { maxLength, segments = 2, separator = "-" } = options;

  validateInput(segments, separator, maxLength);

  if (maxLength === undefined) {
    return generateUnbounded(segments, separator);
  }

  return generateBounded(segments, separator, maxLength);
};
