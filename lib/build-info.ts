import fs from "fs/promises";
import path from "path";
import nextPackageJson from "next/package.json";
import packageJson from "@/package.json";
import reactPackageJson from "react/package.json";

export interface BuildInfo {
  appVersion: string;
  buildTime: string | null;
  git: {
    commitFull: string | null;
    commitShort: string | null;
    branch: string | null;
  };
  runtime: {
    node: string | null;
    nextDeclared: string | null;
    nextInstalled: string | null;
    reactDeclared: string | null;
    reactInstalled: string | null;
  };
}

const BUILD_INFO_PATH = path.join(process.cwd(), "data", "build-info.json");

export async function getBuildInfo(): Promise<BuildInfo> {
  try {
    const raw = await fs.readFile(BUILD_INFO_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<BuildInfo>;

    return {
      appVersion: parsed.appVersion ?? packageJson.version,
      buildTime: parsed.buildTime ?? null,
      git: {
        commitFull: parsed.git?.commitFull ?? null,
        commitShort: parsed.git?.commitShort ?? null,
        branch: parsed.git?.branch ?? null,
      },
      runtime: {
        node: parsed.runtime?.node ?? null,
        nextDeclared: parsed.runtime?.nextDeclared ?? packageJson.dependencies.next ?? null,
        nextInstalled: parsed.runtime?.nextInstalled ?? nextPackageJson.version ?? null,
        reactDeclared: parsed.runtime?.reactDeclared ?? packageJson.dependencies.react ?? null,
        reactInstalled: parsed.runtime?.reactInstalled ?? reactPackageJson.version ?? null,
      },
    };
  } catch {
    return {
      appVersion: packageJson.version,
      buildTime: null,
      git: {
        commitFull: null,
        commitShort: null,
        branch: null,
      },
      runtime: {
        node: process.version,
        nextDeclared: packageJson.dependencies.next ?? null,
        nextInstalled: nextPackageJson.version ?? null,
        reactDeclared: packageJson.dependencies.react ?? null,
        reactInstalled: reactPackageJson.version ?? null,
      },
    };
  }
}
