import { defineConfig } from "tsup";

// Declarations are emitted by `tsc -p tsconfig.build.json` in the build
// script rather than here: tsup generates them via rollup-plugin-dts, which
// needs the TypeScript compiler JS API that TypeScript 7 no longer exports.
export default defineConfig({
  dts: false,
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["cjs", "esm"],
  minify: true,
  sourcemap: false,
});
