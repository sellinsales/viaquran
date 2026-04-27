import { ThemeDefinition } from "@/lib/types";
import {
  fetchQuranFoundationJson,
  hasQuranFoundationConfig,
} from "@/lib/quran-foundation";

const QF_ENGLISH_TRANSLATION_ID = process.env.QF_ENGLISH_TRANSLATION_ID ?? "131";
const QF_URDU_TRANSLATION_ID = process.env.QF_URDU_TRANSLATION_ID;

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

async function fetchQuranFoundationVerse(theme: ThemeDefinition) {
  const translationIds = [QF_ENGLISH_TRANSLATION_ID, QF_URDU_TRANSLATION_ID]
    .filter(Boolean)
    .join(",");
  const query = new URLSearchParams({
    fields: "text_uthmani,verse_key",
  });

  if (translationIds) {
    query.set("translations", translationIds);
  }

  const payload = await fetchQuranFoundationJson<QuranFoundationVerseResponse>(
    `/content/api/v4/verses/by_key/${theme.ayah.reference}?${query.toString()}`,
  );
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

export async function getAyahForTheme(theme: ThemeDefinition) {
  if (hasQuranFoundationConfig()) {
    try {
      return await fetchQuranFoundationVerse(theme);
    } catch (error) {
      console.warn(
        "Quran Foundation verse request failed. Falling back to bundled ayah content.",
        error,
      );
    }
  }

  return theme.ayah;
}
