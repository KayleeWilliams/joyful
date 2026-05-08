import { describe, expect, it } from "bun:test";

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
  });
});
