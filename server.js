const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const standaloneDir = path.join(__dirname, ".next", "standalone");
const bundledServerPath = path.join(standaloneDir, "server.js");

if (!fs.existsSync(bundledServerPath)) {
  throw new Error(
    "Next.js build output not found. Run `npm run build` before starting the app.",
  );
}

process.chdir(standaloneDir);
require(bundledServerPath);

