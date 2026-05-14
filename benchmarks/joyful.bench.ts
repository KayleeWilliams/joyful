import { createRequire } from "node:module";

import { bench, do_not_optimize, run, summary } from "mitata";

// oxlint-disable-next-line import/no-relative-parent-imports
const { joyful: joyfulEsm } = await import("../dist/index.mjs");

const require = createRequire(import.meta.url);
// oxlint-disable-next-line import/no-relative-parent-imports
const { joyful: joyfulCjs } = require("../dist/index.js") as { joyful: Joyful };

interface JoyfulOptions {
  maxLength?: number;
  segments?: number;
  separator?: string;
}

type Joyful = (options?: JoyfulOptions) => string;

const cases: { name: string; options?: Parameters<Joyful>[0] }[] = [
  { name: "default" },
  { name: "segments: 3", options: { segments: 3 } },
  { name: "segments: 5", options: { segments: 5 } },
  { name: "segments: 10", options: { segments: 10 } },
  { name: "segments: 25", options: { segments: 25 } },
  { name: "maxLength: 6", options: { maxLength: 6 } },
  { name: "maxLength: 8", options: { maxLength: 8 } },
  {
    name: "maxLength: 12, segments: 3",
    options: { maxLength: 12, segments: 3 },
  },
  {
    name: 'maxLength: 15, separator: "---"',
    options: { maxLength: 15, separator: "---" },
  },
  {
    name: 'maxLength: 20, segments: 3, separator: "_"',
    options: { maxLength: 20, segments: 3, separator: "_" },
  },
];

const benchJoyful = (label: string, joyful: Joyful): void => {
  for (const { name, options } of cases) {
    bench(`${label} ${name}`, () => {
      do_not_optimize(joyful(options));
    });
  }

  bench(`${label} maxLength: 5 error`, () => {
    try {
      joyful({ maxLength: 5 });
    } catch (error) {
      do_not_optimize(error instanceof Error ? error.message : String(error));
    }
  });
};

summary(() => {
  benchJoyful("esm", joyfulEsm);
  benchJoyful("cjs", joyfulCjs);
});

await run();
