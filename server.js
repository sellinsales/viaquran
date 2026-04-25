const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const standaloneDir = path.join(__dirname, ".next", "standalone");
const candidateServerPaths = [
  path.join(standaloneDir, "server.js"),
  path.join(standaloneDir, "viaquran", "server.js"),
];
const bundledServerPath = candidateServerPaths.find((candidate) => fs.existsSync(candidate));

if (!bundledServerPath) {
  throw new Error(
    "Next.js build output not found. Run `npm run build` before starting the app.",
  );
}

process.chdir(path.dirname(bundledServerPath));
require(bundledServerPath);
