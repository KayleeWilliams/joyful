import { describe, expect, it } from "bun:test";

import adjectives from "./lib/adjectives.json" assert { type: "json" };
import animals from "./lib/animals.json" assert { type: "json" };
import colors from "./lib/colors.json" assert { type: "json" };
import nature from "./lib/nature.json" assert { type: "json" };

const run = async (
  args: string[] = []
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  const proc = Bun.spawn(["bun", "run", "./src/cli.ts", ...args], {
    stderr: "pipe",
    stdout: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  return { exitCode, stderr: stderr.trim(), stdout: stdout.trim() };
};

describe("cli", () => {
  describe("default behavior", () => {
    it("outputs a 2-word hyphenated name by default", async () => {
      const { stdout, exitCode } = await run();
      expect(exitCode).toBe(0);
      const words = stdout.split("-");
      expect(words).toHaveLength(2);
    });
  });

  describe("--help flag", () => {
    it("prints usage info with --help", async () => {
      const { stdout, exitCode } = await run(["--help"]);
      expect(exitCode).toBe(0);
      expect(stdout).toContain("Usage: joyful");
    });

    it("prints usage info with -h", async () => {
      const { stdout, exitCode } = await run(["-h"]);
      expect(exitCode).toBe(0);
      expect(stdout).toContain("Usage: joyful");
    });
  });

  describe("--segments flag", () => {
    it("generates 3 words with --segments 3", async () => {
      const { stdout, exitCode } = await run(["--segments", "3"]);
      expect(exitCode).toBe(0);
      const words = stdout.split("-");
      expect(words).toHaveLength(3);
    });

    it("generates 3 words with -s 3", async () => {
      const { stdout, exitCode } = await run(["-s", "3"]);
      expect(exitCode).toBe(0);
      const words = stdout.split("-");
      expect(words).toHaveLength(3);
    });
  });

  describe("--pattern flag", () => {
    it("generates words from comma-separated categories", async () => {
      const { stdout, exitCode } = await run(["--pattern", "adjective,animal"]);

      expect(exitCode).toBe(0);
      const words = stdout.split("-");
      expect(words).toHaveLength(2);
      expect(adjectives).toContain(words[0]);
      expect(animals).toContain(words[1]);
    });

    it("generates words with -t shorthand", async () => {
      const { stdout, exitCode } = await run(["-t", "color,nature,animal"]);

      expect(exitCode).toBe(0);
      const words = stdout.split("-");
      expect(words).toHaveLength(3);
      expect(colors).toContain(words[0]);
      expect(nature).toContain(words[1]);
      expect(animals).toContain(words[2]);
    });
  });

  describe("--separator flag", () => {
    it("uses underscore with --separator _", async () => {
      const { stdout, exitCode } = await run(["--separator", "_"]);
      expect(exitCode).toBe(0);
      expect(stdout).toContain("_");
      expect(stdout).not.toContain("-");
    });

    it("uses underscore with -p _", async () => {
      const { stdout, exitCode } = await run(["-p", "_"]);
      expect(exitCode).toBe(0);
      expect(stdout).toContain("_");
    });
  });

  describe("--max-length flag", () => {
    it("respects max-length constraint", async () => {
      const { stdout, exitCode } = await run(["--max-length", "15"]);
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeLessThanOrEqual(15);
    });

    it("respects -m shorthand", async () => {
      const { stdout, exitCode } = await run(["-m", "15"]);
      expect(exitCode).toBe(0);
      expect(stdout.length).toBeLessThanOrEqual(15);
    });
  });

  describe("--permutations flag", () => {
    it("prints a permutation summary", async () => {
      const { stdout, exitCode } = await run(["--permutations"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Possible permutations:");
      expect(stdout).toContain("2 words: 997,425");
      expect(stdout).toContain("Pattern permutations:");
      expect(stdout).toContain("color-nature-animal: 4,674,684");
    });

    it("prints summary JSON", async () => {
      const { stdout, exitCode } = await run(["--permutations", "--json"]);

      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout) as {
        patterns: { pattern: string[]; permutations: number }[];
        segments: { segments: number; permutations: number }[];
      };
      expect(parsed.segments).toContainEqual({
        permutations: 997_425,
        segments: 2,
      });
      expect(parsed.patterns).toContainEqual({
        pattern: ["adjective", "animal"],
        permutations: 46_081,
      });
    });

    it("prints a single segment count", async () => {
      const { stdout, exitCode } = await run([
        "--permutations",
        "--segments",
        "3",
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toBe("3 words: 2,917,468,125");
    });

    it("prints a single segment count as JSON", async () => {
      const { stdout, exitCode } = await run([
        "--permutations",
        "--segments",
        "3",
        "--json",
      ]);

      expect(exitCode).toBe(0);
      expect(JSON.parse(stdout)).toEqual({
        permutations: 2_917_468_125,
        segments: 3,
      });
    });

    it("prints a single pattern count", async () => {
      const { stdout, exitCode } = await run([
        "--permutations",
        "--pattern",
        "color,nature,animal",
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toBe("color-nature-animal: 4,674,684");
    });

    it("prints a single pattern count as JSON", async () => {
      const { stdout, exitCode } = await run([
        "--permutations",
        "--pattern",
        "color,nature,animal",
        "--json",
      ]);

      expect(exitCode).toBe(0);
      expect(JSON.parse(stdout)).toEqual({
        pattern: ["color", "nature", "animal"],
        permutations: 4_674_684,
      });
    });
  });

  describe("combined flags", () => {
    it("accepts all flags together", async () => {
      const { stdout, exitCode } = await run([
        "--segments",
        "3",
        "--separator",
        "_",
        "--max-length",
        "30",
      ]);
      expect(exitCode).toBe(0);
      const words = stdout.split("_");
      expect(words).toHaveLength(3);
      expect(stdout.length).toBeLessThanOrEqual(30);
    });

    it("accepts pattern with separator and max length", async () => {
      const { stdout, exitCode } = await run([
        "--pattern",
        "color,nature,animal",
        "--separator",
        "_",
        "--max-length",
        "30",
      ]);

      expect(exitCode).toBe(0);
      const words = stdout.split("_");
      expect(words).toHaveLength(3);
      expect(stdout.length).toBeLessThanOrEqual(30);
    });
  });

  describe("error handling", () => {
    it("exits with code 1 for invalid segments", async () => {
      const { stderr, exitCode } = await run(["--segments", "1"]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("Need at least 2 words");
    });

    it("exits with code 1 for impossibly small max-length", async () => {
      const { stderr, exitCode } = await run(["--max-length", "3"]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("too short");
    });

    it("exits with code 1 for invalid pattern categories", async () => {
      const { stderr, exitCode } = await run(["--pattern", "adjective,planet"]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown pattern category "planet"');
    });

    it("exits with code 1 for json without permutations", async () => {
      const { stderr, exitCode } = await run(["--json"]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain("--json is only supported with --permutations");
    });

    it("exits with code 1 for max-length with permutations", async () => {
      const { stderr, exitCode } = await run([
        "--permutations",
        "--max-length",
        "10",
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain(
        "--max-length is not supported with --permutations"
      );
    });
  });
});
