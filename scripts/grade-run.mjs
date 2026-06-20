import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..");
const resultsRoot = path.join(projectRoot, "results");

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value.startsWith("--")) {
      args[value.slice(2)] = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

function parseDiffStats(diffText) {
  const changedFiles = new Set();
  let addedLines = 0;
  let deletedLines = 0;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git ")) {
      changedFiles.add(line);
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      addedLines += 1;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      deletedLines += 1;
    }
  }

  return {
    changedFiles: changedFiles.size,
    addedLines,
    deletedLines,
  };
}

const args = parseArgs(process.argv.slice(2));
const runId = args["run-id"];

if (!runId) {
  console.error("Usage: node ai-code-structure-eval/scripts/grade-run.mjs --run-id <runId>");
  process.exit(1);
}

const resultDir = path.join(resultsRoot, runId);
const metadataPath = path.join(resultDir, "metadata.json");
const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
const workspacePath = metadata.workspacePath;
const hiddenTestSource = path.join(
  projectRoot,
  "cases",
  metadata.caseName,
  "hidden-tests",
  `${metadata.task}.test.ts`,
);
const hiddenTestDir = path.join(workspacePath, ".hidden-tests");
const hiddenTestTarget = path.join(hiddenTestDir, `${metadata.task}.test.ts`);

await rm(hiddenTestDir, { recursive: true, force: true });
await mkdir(hiddenTestDir, { recursive: true });
await cp(hiddenTestSource, hiddenTestTarget);

const testResult = await run(
  "node",
  [
    "--test",
    "--experimental-strip-types",
    "tests/*.test.ts",
    ".hidden-tests/*.test.ts",
  ],
  { cwd: workspacePath },
);

await rm(hiddenTestDir, { recursive: true, force: true });

const diffResult = await run(
  "git",
  [
    "diff",
    "--no-index",
    "--",
    path.join(resultDir, "baseline"),
    workspacePath,
  ],
  { cwd: repoRoot },
);

const diffText = `${diffResult.stdout}${diffResult.stderr}`;
const diffStats = parseDiffStats(diffText);
const summary = {
  ...metadata,
  passed: testResult.code === 0,
  gradedAt: new Date().toISOString(),
  testDurationMs: testResult.durationMs,
  testExitCode: testResult.code,
  diffExitCode: diffResult.code,
  ...diffStats,
};

await writeFile(path.join(resultDir, "test-output.txt"), `${testResult.stdout}${testResult.stderr}`);
await writeFile(path.join(resultDir, "diff.patch"), diffText);
await writeFile(path.join(resultDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));

if (testResult.code !== 0) {
  process.exit(1);
}
