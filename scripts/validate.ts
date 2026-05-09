import fs from "node:fs";
import path from "node:path";

const libDir = path.join(import.meta.dirname, "..", "src", "lib");

interface Duplicate {
  word: string;
  file1: string;
  file2: string;
}

interface WordContext {
  wordMap: Map<string, string>;
  relatedWords: Map<string, string>;
  duplicates: Duplicate[];
  file: string;
}

const checkSpaceOrHyphen = (word: string, ctx: WordContext): boolean => {
  if (word.includes(" ")) {
    ctx.duplicates.push({ file1: ctx.file, file2: "Contains space", word });
    return false;
  }
  if (word.includes("-")) {
    ctx.duplicates.push({ file1: ctx.file, file2: "Hyphenated", word });
    return false;
  }
  return true;
};

const checkExactDuplicate = (word: string, ctx: WordContext): boolean => {
  if (ctx.wordMap.has(word)) {
    ctx.duplicates.push({
      file1: ctx.wordMap.get(word) as string,
      file2: ctx.file,
      word,
    });
    return false;
  }
  return true;
};

const checkRelatedWord = (word: string, ctx: WordContext): boolean => {
  const baseWord = word.replace(/ing$/, "");
  if (ctx.relatedWords.has(baseWord)) {
    const relatedWord = ctx.relatedWords.get(baseWord) as string;
    ctx.duplicates.push({
      file1: ctx.wordMap.get(relatedWord) as string,
      file2: ctx.file,
      word,
    });
    return false;
  }
  return true;
};

const checkPluralOrYEnding = (word: string, ctx: WordContext): boolean => {
  const singularWord = word.replace(/e?s$/, "");
  if (ctx.wordMap.has(singularWord)) {
    ctx.duplicates.push({
      file1: ctx.wordMap.get(singularWord) as string,
      file2: ctx.file,
      word,
    });
    return false;
  }

  const baseWordY = word.replace(/y$/, "");
  if (ctx.wordMap.has(baseWordY)) {
    ctx.duplicates.push({
      file1: ctx.wordMap.get(baseWordY) as string,
      file2: ctx.file,
      word,
    });
    return false;
  }
  return true;
};

const registerWord = (word: string, ctx: WordContext): void => {
  ctx.wordMap.set(word, ctx.file);
  const baseWord = word.replace(/ing$/, "");
  if (word.endsWith("ing")) {
    ctx.relatedWords.set(baseWord, word);
  } else {
    ctx.relatedWords.set(word, word);
  }
};

const checkWordValidity = (word: string, ctx: WordContext): boolean => {
  if (!checkSpaceOrHyphen(word, ctx)) {
    return false;
  }
  if (!checkExactDuplicate(word, ctx)) {
    return false;
  }
  if (!checkRelatedWord(word, ctx)) {
    return false;
  }
  if (!checkPluralOrYEnding(word, ctx)) {
    return false;
  }
  registerWord(word, ctx);
  return true;
};

const reportDuplicate = ({ word, file1, file2 }: Duplicate): void => {
  if (file2 === "Hyphenated") {
    console.log(`- "${word}" removed from ${file1} (hyphenated word)`);
  } else if (file2 === "Contains space") {
    console.log(`- "${word}" removed from ${file1} (contains space)`);
  } else if (/e?s$/.test(word)) {
    console.log(
      `- "${word}" removed from ${file2} (plural of word in ${file1})`
    );
  } else if (word.endsWith("y")) {
    console.log(
      `- "${word}" removed from ${file2} (y-ending variant of word in ${file1})`
    );
  } else {
    console.log(`- "${word}" removed from ${file2} (kept in ${file1})`);
  }
};

const processFile = (file: string, ctx: Omit<WordContext, "file">): void => {
  const filePath = path.join(libDir, file);
  let content: string[] = [];

  try {
    content = JSON.parse(fs.readFileSync(filePath, "utf8")) as string[];
  } catch (error) {
    console.error(
      `Error parsing JSON in file ${file}: ${(error as Error).message}`
    );
    return;
  }

  const fileCtx: WordContext = { ...ctx, file };
  content = content.filter((word) => checkWordValidity(word, fileCtx));
  fs.writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`);
};

const reportResults = (duplicates: Duplicate[]): void => {
  if (duplicates.length === 0) {
    console.log(
      "No duplicate, related, hyphenated, space-containing, plural, or y-ending words found across all JSON files."
    );
    return;
  }
  console.log(
    "Duplicate, related, hyphenated, space-containing, plural, or y-ending words found and removed:"
  );
  for (const duplicate of duplicates) {
    reportDuplicate(duplicate);
  }
};

const validateAndRemoveDuplicates = (): void => {
  const ctx: Omit<WordContext, "file"> = {
    duplicates: [],
    relatedWords: new Map<string, string>(),
    wordMap: new Map<string, string>(),
  };

  for (const file of fs.readdirSync(libDir)) {
    if (path.extname(file) === ".json") {
      processFile(file, ctx);
    }
  }

  reportResults(ctx.duplicates);
};

validateAndRemoveDuplicates();
