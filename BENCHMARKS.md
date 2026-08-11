# Benchmarks

Run the full performance report with:

```bash
bun run perf
```

The command builds the published package output once, then reports runtime benchmarks, cold startup timings, package artifact sizes, and a consumer bundle size estimate. CI runs this in report-only mode so performance changes are visible on pull requests without blocking merges yet.

Each run also writes `BENCHMARK_REPORT.md` with the latest local results and interpretation notes. The report is overwritten on every run and is machine-dependent.

## What We Measure

### Runtime

`benchmarks/joyful.bench.ts` benchmarks the published ESM and CJS outputs from `dist`, not the TypeScript source. This catches regressions in the code users actually install.

The covered cases are:

- default generation
- `segments: 3`, `segments: 5`, `segments: 10`, and `segments: 25`
- tight and exact bounded generation with `maxLength`
- bounded generation with multi-word and multi-separator options
- the impossible bounded error path

### Startup

`benchmarks/startup.bench.ts` measures cold process startup around:

- empty Bun startup baseline
- ESM import plus one `joyful()` call
- CJS require plus one `joyful()` call
- CLI `--help`

This matters because the package eagerly loads the word lists when imported.

### Size

`scripts/size.ts` reports:

- raw and gzip sizes for each `dist` file
- raw and gzip size for a temporary browser consumer bundle that imports `joyful` and calls it once
- `npm pack --dry-run --json` packed and unpacked package size

The consumer bundle is created in the OS temp directory and removed after the report.

## How To Read Results

Compare pull request output against recent `main` output from the same CI environment. Local numbers are useful for investigation, but they are expected to vary by CPU, thermal state, Bun version, and background load.

Important signals:

- Default unbounded generation should stay in the nanosecond range.
- High `segments` cases show scaling cost from repeated uniqueness checks.
- Bounded `maxLength` cases are the current hot path and are much slower than unbounded generation.
- Startup/import timing reflects eager loading of all word-list data.
- Consumer bundle gzip size should track the real cost paid by browser users.

## Current Baseline Shape

On the initial local baseline, default generation was fast, high segment counts scaled predictably, and bounded generation was the clear optimization target. The consumer bundle was roughly the same size as the bundled word-list chunk because a normal consumer import needs the full word data.

Good next optimization targets:

- precompute bounded word pools by length instead of filtering repeatedly
- avoid `categories.flat()` inside bounded generation
- replace repeated `words.includes` checks with a set for large segment counts
- consider whether word-list data can be packaged in a more tree-shakeable form

## When To Add Gates

Keep the report-only workflow until there are several stable CI runs on `main`. After that, add conservative thresholds first for package size and consumer bundle gzip size. Runtime thresholds should come later because microbenchmark timings are noisier.
