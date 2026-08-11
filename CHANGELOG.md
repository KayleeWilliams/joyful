# joyful

## 1.3.1

### Patch Changes

- 38e16e1: Correct the declared license to MIT. `LICENSE.md` and the README already stated MIT, but `package.json` still declared ISC, so the published npm metadata advertised the wrong license.
- 02fac51: Generate type declarations with `tsc` instead of tsup's bundled `rollup-plugin-dts`, which is incompatible with TypeScript 7. The exported type surface is unchanged; the package no longer ships the unreferenced `dist/*.d.mts` duplicates, since `exports` resolves types to `dist/index.d.ts` for both the import and require conditions.

## 1.3.0

### Minor Changes

- 0f36746: Add custom word lists and exact-word omission support to the API and CLI. Permutation counts now reflect unique generatable names when custom lists overlap.

## 1.2.0

### Minor Changes

- f1c2c9e: Add pattern-based generation, city words, permutation counting, and CLI permutation output.

## 1.1.3

### Patch Changes

- 186d9d2: Update README

## 1.1.2

### Patch Changes

- 4ff468b: Create CLI
- 1e3ed67: Add SFW to readme, remove non-joyful words

## 1.1.1

### Patch Changes

- 424f225: Bump deps
- 2eeabab: Add workflow permissions

## 1.1.0

### Minor Changes

- 6ca009c: Switch props to object, add maxLength option

## 1.0.0

### Major Changes

- c8a1b8c: Rename from friendlier-words to joyful
