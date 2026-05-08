import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";

interface DistFileSize {
  file: string;
  gzipBytes: number;
  rawBytes: number;
}

interface PackFile {
  path: string;
  size: number;
}

interface PackSummary {
  filename: string;
  files: PackFile[];
  size: number;
  unpackedSize: number;
}

interface ConsumerBundlePaths {
  entryPath: string;
  outDir: string;
  tempDir: string;
}

const rootDir = path.join(import.meta.dirname, "..");
const distDir = path.join(rootDir, "dist");

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;
  if (kib < 1024) {
    return `${kib.toFixed(2)} KiB`;
  }

  return `${(kib / 1024).toFixed(2)} MiB`;
};

const getDistFileSizes = (): DistFileSize[] => {
  if (!existsSync(distDir)) {
    throw new Error("dist directory is missing. Run `bun run build` first.");
  }

  return readdirSync(distDir)
    .filter((file) => statSync(path.join(distDir, file)).isFile())
    .toSorted()
    .map((file) => {
      const filePath = path.join(distDir, file);
      const raw = readFileSync(filePath);

      return {
        file: path.join("dist", file),
        gzipBytes: gzipSync(raw).byteLength,
        rawBytes: raw.byteLength,
      };
    });
};

const getPackSummary = (): PackSummary => {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: rootDir,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: path.join(tmpdir(), "joyful-npm-cache"),
    },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const [summary] = JSON.parse(output) as PackSummary[];

  if (!summary) {
    throw new Error("npm pack did not return package metadata.");
  }

  return summary;
};

const normalizeImportPath = (filePath: string): string =>
  filePath.split(path.sep).join("/");

const getConsumerBundlePaths = (): ConsumerBundlePaths => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "joyful-consumer-"));

  return {
    entryPath: path.join(tempDir, "consumer.ts"),
    outDir: path.join(tempDir, "out"),
    tempDir,
  };
};

const writeConsumerEntry = (entryPath: string): void => {
  const distIndexPath = path.join(distDir, "index.mjs");
  const importPath = normalizeImportPath(distIndexPath);

  writeFileSync(
    entryPath,
    `import { joyful } from ${JSON.stringify(importPath)};\n\nconsole.log(joyful());\n`
  );
};

const buildConsumerBundle = ({
  entryPath,
  outDir,
}: ConsumerBundlePaths): void => {
  execFileSync(
    "bun",
    [
      "x",
      "tsup",
      entryPath,
      "--format",
      "esm",
      "--platform",
      "browser",
      "--minify",
      "--no-splitting",
      "--no-sourcemap",
      "--no-dts",
      "--out-dir",
      outDir,
      "--clean",
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "ignore", "inherit"],
    }
  );
};

const readConsumerBundle = (outDir: string): Buffer => {
  const bundleFile = readdirSync(outDir).find((file) =>
    /\.(?:mjs|js)$/.test(file)
  );

  if (!bundleFile) {
    throw new Error("Consumer bundle output was not created.");
  }

  return readFileSync(path.join(outDir, bundleFile));
};

const getConsumerBundleSize = (): DistFileSize => {
  const paths = getConsumerBundlePaths();

  try {
    writeConsumerEntry(paths.entryPath);
    buildConsumerBundle(paths);
    const raw = readConsumerBundle(paths.outDir);
    return {
      file: "consumer bundle",
      gzipBytes: gzipSync(raw).byteLength,
      rawBytes: raw.byteLength,
    };
  } finally {
    rmSync(paths.tempDir, { force: true, recursive: true });
  }
};

const table = (
  sizes: DistFileSize[],
  consumerBundle: DistFileSize,
  pack: PackSummary
): string => {
  const rows = [
    "| File | Raw | Gzip |",
    "| --- | ---: | ---: |",
    ...sizes.map(
      ({ file, rawBytes, gzipBytes }) =>
        `| ${file} | ${formatBytes(rawBytes)} | ${formatBytes(gzipBytes)} |`
    ),
    `| ${consumerBundle.file} | ${formatBytes(
      consumerBundle.rawBytes
    )} | ${formatBytes(consumerBundle.gzipBytes)} |`,
    "",
    "| Package | Size |",
    "| --- | ---: |",
    `| ${pack.filename} | ${formatBytes(pack.size)} |`,
    `| unpacked | ${formatBytes(pack.unpackedSize)} |`,
  ];

  return rows.join("\n");
};

const distSizes = getDistFileSizes();
const consumerBundle = getConsumerBundleSize();
const packSummary = getPackSummary();
const report = table(distSizes, consumerBundle, packSummary);

console.log(report);

const githubStepSummary = process.env.GITHUB_STEP_SUMMARY;

if (githubStepSummary) {
  appendFileSync(
    githubStepSummary,
    `## Package Size\n\n${report}\n\nPacked files: ${packSummary.files.length}\n`
  );
}
