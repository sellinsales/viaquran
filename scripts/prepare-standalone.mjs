import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneStaticDir = path.join(standaloneDir, ".next", "static");
const rootStaticDir = path.join(rootDir, ".next", "static");
const rootPublicDir = path.join(rootDir, "public");
const standalonePublicDir = path.join(standaloneDir, "public");
const nestedStandaloneDir = path.join(standaloneDir, "viaquran");
const nestedStandaloneStaticDir = path.join(nestedStandaloneDir, ".next", "static");
const nestedStandalonePublicDir = path.join(nestedStandaloneDir, "public");

if (!fs.existsSync(standaloneDir)) {
  throw new Error("Standalone build directory not found. Confirm Next.js built successfully.");
}

fs.mkdirSync(path.dirname(standaloneStaticDir), { recursive: true });
fs.mkdirSync(path.dirname(nestedStandaloneStaticDir), { recursive: true });

if (fs.existsSync(rootStaticDir)) {
  fs.cpSync(rootStaticDir, standaloneStaticDir, { recursive: true });

  if (fs.existsSync(nestedStandaloneDir)) {
    fs.cpSync(rootStaticDir, nestedStandaloneStaticDir, { recursive: true });
  }
}

if (fs.existsSync(rootPublicDir)) {
  fs.cpSync(rootPublicDir, standalonePublicDir, { recursive: true });

  if (fs.existsSync(nestedStandaloneDir)) {
    fs.cpSync(rootPublicDir, nestedStandalonePublicDir, { recursive: true });
  }
}

console.log("Standalone deployment assets prepared.");

