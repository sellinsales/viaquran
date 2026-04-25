import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneStaticDir = path.join(standaloneDir, ".next", "static");
const rootStaticDir = path.join(rootDir, ".next", "static");
const rootPublicDir = path.join(rootDir, "public");
const standalonePublicDir = path.join(standaloneDir, "public");

if (!fs.existsSync(standaloneDir)) {
  throw new Error("Standalone build directory not found. Confirm Next.js built successfully.");
}

fs.mkdirSync(path.dirname(standaloneStaticDir), { recursive: true });

if (fs.existsSync(rootStaticDir)) {
  fs.cpSync(rootStaticDir, standaloneStaticDir, { recursive: true });
}

if (fs.existsSync(rootPublicDir)) {
  fs.cpSync(rootPublicDir, standalonePublicDir, { recursive: true });
}

console.log("Standalone deployment assets prepared.");

