import fs from "fs/promises";
import path from "path";
import packageJson from "@/package.json";
import { getBuildInfo } from "@/lib/build-info";
import { getDbPool } from "@/lib/db";
import { getStorageMode } from "@/lib/storage";

const STORE_FILE_PATH = path.join(process.cwd(), "data", "store.json");
const API_BASE_URL = process.env.QURAN_API_BASE_URL ?? "https://api.alquran.cloud/v1";
const QF_AUTH_BASE_URL = process.env.QF_AUTH_BASE_URL ?? "https://oauth2.quran.foundation";

async function runCheck<T>(name: string, action: () => Promise<T>) {
  const startedAt = Date.now();

  try {
    const details = await action();
    return {
      name,
      ok: true,
      durationMs: Date.now() - startedAt,
      details,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkDatabase() {
  if (!(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD)) {
    return {
      configured: false,
      mode: "not-configured",
    };
  }

  const pool = getDbPool();
  const [rows] = await pool.query<Array<{ ok: number }>>("SELECT 1 AS ok");

  return {
    configured: true,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    result: rows[0]?.ok ?? null,
  };
}

async function checkFileStore() {
  const stats = await fs.stat(STORE_FILE_PATH);
  return {
    path: STORE_FILE_PATH,
    sizeBytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  };
}

async function checkAlQuranCloud() {
  const response = await fetch(`${API_BASE_URL}/ayah/1:1/editions/quran-uthmani,en.sahih,ur.jalandhry`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Al Quran Cloud returned ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: unknown[]; status?: string }
    | null;

  return {
    url: API_BASE_URL,
    status: response.status,
    payloadStatus: payload?.status ?? null,
    editionsReturned: Array.isArray(payload?.data) ? payload.data.length : 0,
  };
}

async function checkQuranFoundation() {
  const configured = Boolean(process.env.QF_CLIENT_ID && process.env.QF_CLIENT_SECRET);

  if (!configured) {
    return {
      configured: false,
      authBaseUrl: QF_AUTH_BASE_URL,
    };
  }

  const basicAuth = Buffer.from(
    `${process.env.QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${QF_AUTH_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Quran Foundation token endpoint returned ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number }
    | null;

  return {
    configured: true,
    authBaseUrl: QF_AUTH_BASE_URL,
    status: response.status,
    hasAccessToken: Boolean(payload?.access_token),
    expiresIn: payload?.expires_in ?? null,
  };
}

async function checkGitHubLatest(buildCommit: string | null) {
  const repo = process.env.DIAGNOSTICS_GITHUB_REPO?.trim();

  if (!repo) {
    return {
      configured: false,
    };
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/commits/main`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ViaQuranDiagnostics/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    sha?: string;
    commit?: {
      author?: {
        date?: string;
      };
    };
  };

  return {
    configured: true,
    repo,
    latestCommit: payload.sha ?? null,
    latestCommitDate: payload.commit?.author?.date ?? null,
    runningCommit: buildCommit,
    isLatestDeployed: Boolean(payload.sha && buildCommit && payload.sha === buildCommit),
  };
}

export async function getDiagnosticsReport() {
  const buildInfo = await getBuildInfo();
  const storageMode = await getStorageMode();

  const checks = await Promise.all([
    runCheck("database", checkDatabase),
    runCheck("fileStore", checkFileStore),
    runCheck("alQuranCloud", checkAlQuranCloud),
    runCheck("quranFoundation", checkQuranFoundation),
    runCheck("githubLatest", () => checkGitHubLatest(buildInfo.git.commitFull)),
  ]);

  return {
    status: checks.every((check) => check.ok) ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    build: buildInfo,
    runtime: {
      node: process.version,
      nodeEnv: process.env.NODE_ENV ?? null,
      storageMode,
      nextInstalled: packageJson.dependencies.next,
      reactInstalled: packageJson.dependencies.react,
    },
    env: {
      diagnosticsRepoConfigured: Boolean(process.env.DIAGNOSTICS_GITHUB_REPO),
      diagnosticsTokenConfigured: Boolean(process.env.DIAGNOSTICS_TOKEN),
      dbConfigured: Boolean(
        process.env.DB_HOST &&
          process.env.DB_NAME &&
          process.env.DB_USER &&
          process.env.DB_PASSWORD,
      ),
      quranFoundationConfigured: Boolean(process.env.QF_CLIENT_ID && process.env.QF_CLIENT_SECRET),
    },
    checks,
  };
}
