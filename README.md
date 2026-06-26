# joyful

Generate friendly, safe-for-work word combinations for project names, usernames, labels, demo data, and unique-looking identifiers.

<div>
  <img src="https://img.shields.io/npm/dy/joyful" alt="" />
  <img src="https://img.shields.io/npm/v/joyful" alt="" />
  <img src="https://img.shields.io/github/license/KayleeWilliams/joyful" alt="" />
</div>

## Quick Start

```bash
bun add joyful
```

```ts
import { joyful } from "joyful";

joyful(); // "amber-fox"
joyful({ segments: 3 }); // "golden-marble-cathedral"
joyful({ separator: "_" }); // "swift_otter"
joyful({ omit: ["fox"] }); // excludes "fox" from generated names
```

You can also use the CLI:

```bash
joyful
joyful --segments 3
joyful --pattern color,nature,animal
joyful --omit fox,wolf
```

## Generate Names

By default, `joyful()` returns two lowercase words joined with `-`. The first word is a friendly prefix, either an adjective or a color. Later words come from the broader word lists.

```ts
import { joyful } from "joyful";

joyful(); // "bright-dolphin"
joyful({ segments: 4 }); // "kind-river-cello-baker"
joyful({ separator: "_" }); // "golden_panda"
joyful({ maxLength: 8 }); // "tan-elk"
```

`maxLength` filters word choices so the final string fits within the requested limit. If the limit is too short to produce a valid name, `joyful()` throws.

## Pattern-Based Names

Use `pattern` when you want each word to come from a specific category.

```ts
joyful({ pattern: ["adjective", "animal"] }); // "happy-dolphin"
joyful({ pattern: ["color", "nature", "animal"] }); // "amber-river-otter"
joyful({ pattern: ["city", "nature", "space"] }); // "kyoto-river-orbit"
```

Pattern rules:

- Category names are singular, such as `animal`, `color`, `city`, and `nature`.
- The pattern length controls the number of words.
- `pattern` takes precedence over `segments`.
- `separator` and `maxLength` still apply to generated names.
- Unknown categories throw an error with the supported category names.

## Custom Word Lists

Use `wordLists` to add named word pools that can be selected by `pattern`.
Use `omit` to exclude exact words from both built-in and custom lists.

```ts
joyful({
  pattern: ["fruit", "texture"],
  wordLists: {
    fruit: ["apple", "pear"],
    texture: ["linen", "silk"],
  },
}); // "pear-linen"

joyful({
  omit: ["pear", "silk"],
  pattern: ["fruit", "texture"],
  wordLists: {
    fruit: ["apple", "pear"],
    texture: ["linen", "silk"],
  },
}); // "apple-linen"
```

Custom category names are additive. If a custom list uses a built-in category
name, such as `animal`, it replaces that built-in category for the current call.

## CLI

The CLI supports the same core generation options:

```bash
joyful
joyful --segments 3
joyful --separator _
joyful --max-length 12
joyful --pattern adjective,animal
joyful --pattern city,nature,space --separator _
joyful --word-list fruit=apple,pear --word-list texture=linen,silk --pattern fruit,texture
joyful --omit fox,wolf
```

Short flags are available for common generation options:

```bash
joyful -s 3
joyful -p _
joyful -m 12
joyful -t color,nature,animal
```

## Count Permutations

Use `permutations()` to count possible unbounded combinations without generating a name.

```ts
import { permutations } from "joyful";

permutations(); // 997425
permutations({ segments: 3 }); // 2916470700
permutations({ pattern: ["adjective", "animal"] }); // 46081
permutations({ pattern: ["color", "nature", "animal"] }); // 4674684
permutations({
  omit: ["pear"],
  pattern: ["fruit", "texture"],
  wordLists: {
    fruit: ["apple", "pear"],
    texture: ["linen", "silk"],
  },
}); // 2
```

The CLI can print the same counts:

```bash
joyful --permutations
joyful --permutations --segments 3
joyful --permutations --pattern color,nature,animal
joyful --permutations --word-list fruit=apple,pear --pattern fruit,animal
```

For automation, add `--json`:

```bash
joyful --permutations --pattern color,nature,animal --json
```

```json
{
  "pattern": ["color", "nature", "animal"],
  "permutations": 4674684
}
```

Permutation counts include only unique names that can be generated without repeated words. They do not account for `maxLength`, because bounded generation depends on word lengths and fitting constraints.

## API

### `joyful(options?)`

Returns a generated name as a `string`.

| Option      | Type                                    | Default | Description                           |
| ----------- | --------------------------------------- | ------- | ------------------------------------- |
| `segments`  | `number`                                | `2`     | Number of words to generate           |
| `pattern`   | `JoyfulCategory[]` or custom `string[]` | none    | Category pattern for each word        |
| `wordLists` | `Record<string, readonly string[]>`     | none    | Custom named word lists               |
| `omit`      | `readonly string[]`                     | none    | Exact words to exclude                |
| `separator` | `string`                                | `"-"`   | Character(s) between words            |
| `maxLength` | `number`                                | none    | Maximum length of the returned string |

### `permutations(options?)`

Returns the number of possible unbounded combinations as a `number`.

| Option      | Type                                    | Default | Description                    |
| ----------- | --------------------------------------- | ------- | ------------------------------ |
| `segments`  | `number`                                | `2`     | Number of words to count       |
| `pattern`   | `JoyfulCategory[]` or custom `string[]` | none    | Category pattern for each word |
| `wordLists` | `Record<string, readonly string[]>`     | none    | Custom named word lists        |
| `omit`      | `readonly string[]`                     | none    | Exact words to exclude         |

### `JoyfulCategory`

Supported pattern categories:

```ts
type JoyfulCategory =
  | "adjective"
  | "animal"
  | "architecture"
  | "art"
  | "city"
  | "color"
  | "emotion"
  | "fashion"
  | "food"
  | "history"
  | "literature"
  | "music"
  | "mythology"
  | "nature"
  | "profession"
  | "science"
  | "space"
  | "sport"
  | "transportation";
```

## Word Lists

All words are lowercase, single-token, safe-for-work terms.

| Category       | Words |
| -------------- | ----- |
| Adjectives     | 227   |
| Animals        | 203   |
| Architecture   | 184   |
| Art            | 186   |
| Cities         | 73    |
| Colors         | 114   |
| Emotions       | 89    |
| Fashion        | 169   |
| Food           | 186   |
| History        | 131   |
| Literature     | 197   |
| Music          | 162   |
| Mythology      | 164   |
| Nature         | 202   |
| Professions    | 288   |
| Science        | 223   |
| Space          | 131   |
| Sports         | 154   |
| Transportation | 183   |

## Default Permutations

Default generation starts with an adjective or color, then draws each later word from the non-prefix lists.

| Segments | Combinations           |
| -------- | ---------------------- |
| 2        | 997,425                |
| 3        | 2,916,470,700          |
| 4        | 8,524,843,856,100      |
| 5        | 24,909,593,747,524,200 |

## Errors And Constraints

- `segments` must be at least `2`.
- `separator` cannot be an empty string.
- `maxLength` must be a positive integer when provided.
- Unknown pattern categories throw an error.
- Custom word list names cannot be empty.
- CLI `--json` is only supported with `--permutations`.
- CLI `--permutations` does not support `--max-length`.

## SFW Guarantee

All word lists are manually curated to be safe for work and family-friendly. Every category has been audited to exclude profanity, slurs, and negative or distressing terms. You can use joyful-generated names in any context without worry.

## Benchmarks

Run `bun run perf` to generate the runtime, startup, package size, and consumer
bundle size report. See [BENCHMARKS.md](./BENCHMARKS.md) for what the report
measures and how to interpret it.

## Credits

Originally created by [Hayden Bleasel](https://github.com/haydenbleasel).

Based on [friendly-words](https://github.com/glitchdotcom/friendly-words) by Glitch, with curated word lists and additional categories.

## License

MIT
