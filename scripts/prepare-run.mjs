import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const resultsRoot = path.join(projectRoot, "results");
const tmpRoot = "/tmp/ai-code-structure-eval-runs";
const caseName = "company-fee";

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

function createRunId() {
  const timestamp = new Date()
    .toISOString()
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replace("T", "-")
    .replace("Z", "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `${timestamp}-${suffix}`;
}

const args = parseArgs(process.argv.slice(2));
const variant = args.variant;
const task = args.task ?? "modal-count";
const runId = args["run-id"] ?? createRunId();

if (!["mixed", "separated"].includes(variant)) {
  console.error("Usage: node ai-code-structure-eval/scripts/prepare-run.mjs --variant <mixed|separated> [--task modal-count]");
  process.exit(1);
}

const variantRoot = path.join(projectRoot, "cases", caseName, "variants", variant);
const taskPath = path.join(projectRoot, "cases", caseName, "tasks", `${task}.md`);
const sharedRoot = path.join(projectRoot, "shared");
const resultDir = path.join(resultsRoot, runId);
const runRoot = path.join(tmpRoot, runId);
const workspacePath = path.join(runRoot, "workspace");
const baselinePath = path.join(resultDir, "baseline");

await rm(runRoot, { recursive: true, force: true });
await rm(resultDir, { recursive: true, force: true });
await mkdir(workspacePath, { recursive: true });
await mkdir(resultDir, { recursive: true });

await cp(path.join(sharedRoot, "package.json"), path.join(workspacePath, "package.json"));
await cp(path.join(sharedRoot, "tests"), path.join(workspacePath, "tests"), { recursive: true });
await cp(path.join(variantRoot, "src"), path.join(workspacePath, "src"), { recursive: true });
await cp(taskPath, path.join(workspacePath, "task.md"));
await cp(workspacePath, baselinePath, { recursive: true });

const metadata = {
  runId,
  caseName,
  variant,
  task,
  workspacePath,
  resultDir,
  createdAt: new Date().toISOString(),
};

await writeFile(path.join(resultDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`runId: ${runId}`);
console.log(`workspace: ${workspacePath}`);
console.log("");
console.log("별도 에이전트에게는 아래 폴더만 열어주세요.");
console.log(workspacePath);
console.log("");
console.log("에이전트 작업 후 채점:");
console.log(`npm run grade -- --run-id ${runId}`);
