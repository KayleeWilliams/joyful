---
"joyful": patch
---

Generate type declarations with `tsc` instead of tsup's bundled `rollup-plugin-dts`, which is incompatible with TypeScript 7. The exported type surface is unchanged; the package no longer ships the unreferenced `dist/*.d.mts` duplicates, since `exports` resolves types to `dist/index.d.ts` for both the import and require conditions.
