// oxlint-disable-next-line import/no-relative-parent-imports
import { joyful, permutations } from "../src";

// Calculate permutations for different numbers of segments
console.log("Possible permutations:");
for (let i = 2; i <= 5; i += 1) {
  console.log(`${i} words: ${permutations({ segments: i }).toLocaleString()}`);
}

console.log("\nPattern permutations:");
for (const pattern of [
  ["adjective", "animal"],
  ["color", "nature", "animal"],
  ["city", "nature", "space"],
] as const) {
  console.log(
    `${pattern.join("-")}: ${permutations({ pattern }).toLocaleString()}`
  );
}

// Generate a sample of unique words
const uniqueWords = new Set<string>();
const sampleSize = 1000;
const maxAttempts = sampleSize * 10;

for (let i = 0; i < maxAttempts && uniqueWords.size < sampleSize; i += 1) {
  // Generate 5-word combinations
  uniqueWords.add(joyful({ segments: 5 }));
}

console.log(`\nUnique ${5}-word combinations generated: ${uniqueWords.size}`);
console.log("Sample of generated words:");
console.log([...uniqueWords].slice(0, 10).join("\n"));
