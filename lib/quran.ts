import { ThemeDefinition } from "@/lib/types";

const API_BASE_URL = process.env.QURAN_API_BASE_URL ?? "https://api.alquran.cloud/v1";
const EDITIONS = ["quran-uthmani", "en.sahih", "ur.jalandhry"] as const;

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

export async function getAyahForTheme(theme: ThemeDefinition) {
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

