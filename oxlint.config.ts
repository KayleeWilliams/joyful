import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core],
  rules: {
    // `Math.trunc(Number(x))` is not equivalent to `Number.parseInt(x, 10)`
    // for the CLI's argument parsing: `Number("")` is 0 where `parseInt("")`
    // is NaN, and `parseInt` accepts a trailing suffix ("12abc" -> 12). The
    // parseInt semantics are deliberate, so keep the rule off rather than
    // changing user-facing behaviour.
    "unicorn/prefer-number-coercion": "off",
  },
});
