import { describe, expect, it } from "bun:test";

import { joyful, permutations } from "./index";
import type { JoyfulCategory } from "./index";
import adjectives from "./lib/adjectives.json" with { type: "json" };
import animals from "./lib/animals.json" with { type: "json" };
import cities from "./lib/cities.json" with { type: "json" };
import colors from "./lib/colors.json" with { type: "json" };
import nature from "./lib/nature.json" with { type: "json" };
import space from "./lib/space.json" with { type: "json" };

const categoryWords = {
  adjective: adjectives,
  animal: animals,
  city: cities,
  color: colors,
  nature,
  space,
};

const expectPatternWords = (
  result: string,
  pattern: readonly (keyof typeof categoryWords)[],
  separator = "-"
): void => {
  const words = result.split(separator);
  expect(words).toHaveLength(pattern.length);

  for (const [index, category] of pattern.entries()) {
    expect(categoryWords[category]).toContain(words[index]);
  }
};

describe("joyful", () => {
  describe("default behavior", () => {
    it("returns a string with 2 words separated by hyphen by default", () => {
      const result = joyful();
      const words = result.split("-");
      expect(words).toHaveLength(2);
    });

    it("returns different results on multiple calls (randomness)", () => {
      const results = new Set<string>();
      for (let i = 0; i < 20; i += 1) {
        results.add(joyful());
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe("segments option", () => {
    it("generates 3 words when segments is 3", () => {
      const result = joyful({ segments: 3 });
      const words = result.split("-");
      expect(words).toHaveLength(3);
    });

    it("generates 5 words when segments is 5", () => {
      const result = joyful({ segments: 5 });
      const words = result.split("-");
      expect(words).toHaveLength(5);
    });

    it("throws error when segments is less than 2", () => {
      expect(() => joyful({ segments: 1 })).toThrow("Need at least 2 words");
    });

    it("throws error when segments is 0", () => {
      expect(() => joyful({ segments: 0 })).toThrow("Need at least 2 words");
    });

    it("throws error when segments is negative", () => {
      expect(() => joyful({ segments: -1 })).toThrow("Need at least 2 words");
    });
  });

  describe("separator option", () => {
    it("uses underscore as separator when specified", () => {
      const result = joyful({ separator: "_" });
      expect(result).toContain("_");
      expect(result).not.toContain("-");
    });

    it("uses space as separator when specified", () => {
      const result = joyful({ separator: " " });
      expect(result).toContain(" ");
    });

    it("uses custom string as separator", () => {
      const result = joyful({ separator: "---" });
      expect(result).toContain("---");
    });

    it("throws error when separator is empty string", () => {
      expect(() => joyful({ separator: "" })).toThrow("Need a separator");
    });
  });

  describe("word uniqueness", () => {
    it("does not contain duplicate words", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ segments: 5 });
        const words = result.split("-");
        const uniqueWords = new Set(words);
        expect(uniqueWords.size).toBe(words.length);
      }
    });
  });

  describe("word format", () => {
    it("all words are lowercase", () => {
      for (let i = 0; i < 20; i += 1) {
        const result = joyful({ segments: 3 });
        const words = result.split("-");
        for (const word of words) {
          expect(word).toBe(word.toLowerCase());
        }
      }
    });

    it("all words are non-empty strings", () => {
      for (let i = 0; i < 20; i += 1) {
        const result = joyful({ segments: 3 });
        const words = result.split("-");
        for (const word of words) {
          expect(word.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("options object form", () => {
    it("accepts an options object with all properties", () => {
      const result = joyful({ maxLength: 40, segments: 3, separator: "_" });
      const words = result.split("_");
      expect(words).toHaveLength(3);
      expect(result.length).toBeLessThanOrEqual(40);
    });

    it("uses defaults when given an empty options object", () => {
      const result = joyful({});
      const words = result.split("-");
      expect(words).toHaveLength(2);
    });

    it("accepts partial options", () => {
      const result = joyful({ segments: 3 });
      const words = result.split("-");
      expect(words).toHaveLength(3);
    });
  });

  describe("pattern option", () => {
    it("generates words from the requested categories", () => {
      const pattern = ["adjective", "animal"] as const;
      const result = joyful({ pattern });

      expectPatternWords(result, pattern);
    });

    it("generates 3 words in category order", () => {
      const pattern = ["color", "nature", "animal"] as const;
      const result = joyful({ pattern });

      expectPatternWords(result, pattern);
    });

    it("supports city, nature, and space patterns", () => {
      const pattern = ["city", "nature", "space"] as const;
      const result = joyful({ pattern });

      expectPatternWords(result, pattern);
    });

    it("uses pattern length instead of segments when both are provided", () => {
      const result = joyful({
        pattern: ["adjective", "animal"],
        segments: 5,
      });

      expect(result.split("-")).toHaveLength(2);
    });

    it("does not contain duplicate words", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ pattern: ["color", "nature", "animal"] });
        const words = result.split("-");
        const uniqueWords = new Set(words);
        expect(uniqueWords.size).toBe(words.length);
      }
    });

    it("respects maxLength with pattern output", () => {
      for (let i = 0; i < 50; i += 1) {
        const pattern = ["city", "nature", "space"] as const;
        const result = joyful({ maxLength: 30, pattern });

        expect(result.length).toBeLessThanOrEqual(30);
        expectPatternWords(result, pattern);
      }
    });

    it("throws for unknown pattern categories", () => {
      expect(() =>
        joyful({ pattern: ["adjective", "planet"] as JoyfulCategory[] })
      ).toThrow('Unknown pattern category "planet"');
    });
  });

  describe("permutations", () => {
    it("returns the default 2-word count", () => {
      expect(permutations()).toBe(997_425);
    });

    it("returns the default 3-word count", () => {
      expect(permutations({ segments: 3 })).toBe(2_917_468_125);
    });

    it("counts adjective and animal patterns", () => {
      expect(permutations({ pattern: ["adjective", "animal"] })).toBe(46_081);
    });

    it("counts ordered 3-category patterns", () => {
      expect(permutations({ pattern: ["color", "nature", "animal"] })).toBe(
        4_674_684
      );
    });

    it("throws for unknown pattern categories", () => {
      expect(() =>
        permutations({ pattern: ["adjective", "planet"] as JoyfulCategory[] })
      ).toThrow('Unknown pattern category "planet"');
    });

    it("throws when segments is less than 2", () => {
      expect(() => permutations({ segments: 1 })).toThrow(
        "Need at least 2 words"
      );
    });
  });

  describe("maxLength constraint", () => {
    it("returns result within specified maxLength", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ maxLength: 15 });
        expect(result.length).toBeLessThanOrEqual(15);
      }
    });

    it("respects maxLength with custom segments and separator", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ maxLength: 20, segments: 3, separator: "_" });
        expect(result.length).toBeLessThanOrEqual(20);
        const words = result.split("_");
        expect(words).toHaveLength(3);
      }
    });

    it("works when maxLength is very generous", () => {
      for (let i = 0; i < 20; i += 1) {
        const result = joyful({ maxLength: 100 });
        expect(result.length).toBeLessThanOrEqual(100);
        const words = result.split("-");
        expect(words).toHaveLength(2);
      }
    });

    it("produces short results when maxLength is tight but achievable", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ maxLength: 8 });
        expect(result.length).toBeLessThanOrEqual(8);
        const words = result.split("-");
        expect(words).toHaveLength(2);
      }
    });

    it("works at the exact minimum boundary of 6", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ maxLength: 6 });
        expect(result.length).toBeLessThanOrEqual(6);
        const words = result.split("-");
        expect(words).toHaveLength(2);
      }
    });

    it("does not contain duplicate words under tight maxLength", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ maxLength: 12, segments: 3 });
        const words = result.split("-");
        const uniqueWords = new Set(words);
        expect(uniqueWords.size).toBe(words.length);
      }
    });

    it("respects maxLength with a multi-character separator", () => {
      for (let i = 0; i < 50; i += 1) {
        const result = joyful({ maxLength: 15, segments: 2, separator: "---" });
        expect(result.length).toBeLessThanOrEqual(15);
        expect(result).toContain("---");
      }
    });
  });

  describe("maxLength validation", () => {
    it("throws when maxLength is impossibly small", () => {
      expect(() => joyful({ maxLength: 3 })).toThrow("too short");
    });

    it("throws when maxLength is one below the minimum boundary", () => {
      expect(() => joyful({ maxLength: 5 })).toThrow("too short");
    });

    it("throws for maxLength of 0", () => {
      expect(() => joyful({ maxLength: 0 })).toThrow(
        "maxLength must be a positive integer"
      );
    });

    it("throws for negative maxLength", () => {
      expect(() => joyful({ maxLength: -5 })).toThrow(
        "maxLength must be a positive integer"
      );
    });

    it("throws for non-integer maxLength", () => {
      expect(() => joyful({ maxLength: 10.5 })).toThrow(
        "maxLength must be a positive integer"
      );
    });
  });
});
