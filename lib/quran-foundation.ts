const QF_AUTH_BASE_URL = process.env.QF_AUTH_BASE_URL ?? "https://oauth2.quran.foundation";
const QF_API_BASE_URL = process.env.QF_API_BASE_URL ?? "https://apis.quran.foundation";

let tokenCache:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | null = null;
let tokenInflight: Promise<string> | null = null;

export function hasQuranFoundationConfig() {
  return Boolean(process.env.QF_CLIENT_ID && process.env.QF_CLIENT_SECRET);
}

export async function getQuranFoundationToken(forceRefresh = false) {
  if (!hasQuranFoundationConfig()) {
    throw new Error("Quran Foundation credentials are not configured.");
  }

  const now = Date.now();
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.accessToken;
  }

  if (!forceRefresh && tokenInflight) {
    return tokenInflight;
  }

  tokenInflight = (async () => {
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
      throw new Error(`Failed to fetch Quran Foundation token (${response.status}).`);
    }

    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!payload.access_token) {
      throw new Error("Quran Foundation token response did not include an access token.");
    }

    tokenCache = {
      accessToken: payload.access_token,
      expiresAt: now + (payload.expires_in ?? 3600) * 1000,
    };

    return payload.access_token;
  })();

  try {
    return await tokenInflight;
  } finally {
    tokenInflight = null;
  }
}

export async function fetchQuranFoundationJson<T>(path: string, retry = true): Promise<T> {
  const token = await getQuranFoundationToken(!retry);
  const response = await fetch(`${QF_API_BASE_URL}${path}`, {
    headers: {
      "x-auth-token": token,
      "x-client-id": process.env.QF_CLIENT_ID!,
    },
    cache: "no-store",
  });

  if (response.status === 401 && retry) {
    tokenCache = null;
    return fetchQuranFoundationJson<T>(path, false);
  }

  if (!response.ok) {
    throw new Error(`Quran Foundation request failed (${response.status}) for ${path}.`);
  }

  return response.json() as Promise<T>;
}
