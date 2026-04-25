import fs from "fs/promises";
import path from "path";
import { execFileSync } from "child_process";

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const outputPath = path.join(rootDir, "data", "build-info.json");

function readGitValue(args) {
  try {
    return execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
const commitFull = readGitValue(["rev-parse", "HEAD"]);
const commitShort = readGitValue(["rev-parse", "--short", "HEAD"]);
const branch = readGitValue(["rev-parse", "--abbrev-ref", "HEAD"]);

const payload = {
  appVersion: packageJson.version,
  buildTime: new Date().toISOString(),
  git: {
    commitFull,
    commitShort,
    branch,
  },
  runtime: {
    node: process.version,
    nextDeclared: packageJson.dependencies?.next ?? null,
    reactDeclared: packageJson.dependencies?.react ?? null,
  },
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log("Build info written to data/build-info.json");
