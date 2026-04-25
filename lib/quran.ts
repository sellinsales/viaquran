import { ThemeDefinition } from "@/lib/types";

const API_BASE_URL = process.env.QURAN_API_BASE_URL ?? "https://api.alquran.cloud/v1";
const EDITIONS = ["quran-uthmani", "en.sahih", "ur.jalandhry"] as const;
const QF_AUTH_BASE_URL = process.env.QF_AUTH_BASE_URL ?? "https://oauth2.quran.foundation";
const QF_API_BASE_URL = process.env.QF_API_BASE_URL ?? "https://apis.quran.foundation";
const QF_ENGLISH_TRANSLATION_ID = process.env.QF_ENGLISH_TRANSLATION_ID ?? "131";
const QF_URDU_TRANSLATION_ID = process.env.QF_URDU_TRANSLATION_ID;

let tokenCache:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | null = null;
let tokenInflight: Promise<string> | null = null;

interface ApiAyahResponse {
  code: number;
  status: string;
  data: Array<{
    text: string;
    edition?: {
      identifier?: string;
      englishName?: string;
    };
  }>;
}

interface QuranFoundationVerseResponse {
  verse?: {
    verse_key?: string;
    text_uthmani?: string;
    translations?: Array<{
      resource_id?: number;
      text?: string;
      language_name?: string;
    }>;
  };
}

function hasQuranFoundationConfig() {
  return Boolean(process.env.QF_CLIENT_ID && process.env.QF_CLIENT_SECRET);
}

async function getQuranFoundationToken(forceRefresh = false) {
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

async function fetchQuranFoundationVerse(theme: ThemeDefinition, retry = true) {
  const token = await getQuranFoundationToken(!retry);
  const translationIds = [QF_ENGLISH_TRANSLATION_ID, QF_URDU_TRANSLATION_ID]
    .filter(Boolean)
    .join(",");
  const query = new URLSearchParams({
    fields: "text_uthmani,verse_key",
  });

  if (translationIds) {
    query.set("translations", translationIds);
  }

  const response = await fetch(
    `${QF_API_BASE_URL}/content/api/v4/verses/by_key/${theme.ayah.reference}?${query.toString()}`,
    {
      headers: {
        "x-auth-token": token,
        "x-client-id": process.env.QF_CLIENT_ID!,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401 && retry) {
    tokenCache = null;
    return fetchQuranFoundationVerse(theme, false);
  }

  if (!response.ok) {
    throw new Error(`Quran Foundation verse request failed (${response.status}).`);
  }

  const payload = (await response.json()) as QuranFoundationVerseResponse;
  const verse = payload.verse;

  if (!verse) {
    throw new Error("Quran Foundation verse response did not include verse data.");
  }

  const englishTranslation = verse.translations?.find(
    (translation) => String(translation.resource_id) === QF_ENGLISH_TRANSLATION_ID,
  );
  const urduTranslation = verse.translations?.find(
    (translation) =>
      Boolean(QF_URDU_TRANSLATION_ID) &&
      String(translation.resource_id) === String(QF_URDU_TRANSLATION_ID),
  );

  return {
    reference: verse.verse_key ?? theme.ayah.reference,
    source: "Quran Foundation Content API",
    arabic: verse.text_uthmani ?? theme.ayah.arabic,
    english: englishTranslation?.text ?? theme.ayah.english,
    urdu: urduTranslation?.text ?? theme.ayah.urdu,
  };
}

async function fetchAlQuranCloudVerse(theme: ThemeDefinition) {
  const response = await fetch(
    `${API_BASE_URL}/ayah/${theme.ayah.reference}/editions/${EDITIONS.join(",")}`,
    { cache: "no-store" },
  ).catch(() => null);

  if (!response || !response.ok) {
    return theme.ayah;
  }

  const payload = (await response.json().catch(() => null)) as ApiAyahResponse | null;

  if (!payload || !Array.isArray(payload.data)) {
    return theme.ayah;
  }

  const byEdition = new Map(
    payload.data.map((item) => [item.edition?.identifier ?? "", item.text]),
  );

  return {
    reference: theme.ayah.reference,
    source: "Al Quran Cloud API",
    arabic: byEdition.get("quran-uthmani") ?? theme.ayah.arabic,
    english: byEdition.get("en.sahih") ?? theme.ayah.english,
    urdu: byEdition.get("ur.jalandhry") ?? theme.ayah.urdu,
  };
}

export async function getAyahForTheme(theme: ThemeDefinition) {
  if (hasQuranFoundationConfig()) {
    try {
      return await fetchQuranFoundationVerse(theme);
    } catch {
      return fetchAlQuranCloudVerse(theme);
    }
  }

  return fetchAlQuranCloudVerse(theme);
}
