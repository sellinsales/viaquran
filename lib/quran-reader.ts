import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { fetchQuranFoundationJson, hasQuranFoundationConfig } from "@/lib/quran-foundation";
import {
  QuranChapterPayload,
  QuranChapterSummary,
  QuranVersePayload,
} from "@/lib/types";

const QF_ENGLISH_TRANSLATION_ID = process.env.QF_ENGLISH_TRANSLATION_ID ?? "131";
const QF_URDU_TRANSLATION_ID = process.env.QF_URDU_TRANSLATION_ID;

let quranSchemaReady: Promise<void> | null = null;

interface ChapterRow extends RowDataPacket {
  chapter_id: number;
  name_simple: string;
  name_arabic: string;
  name_complex: string;
  translated_name: string;
  revelation_place: string;
  verses_count: number;
  updated_at: Date;
}

interface VerseRow extends RowDataPacket {
  verse_db_id: number | null;
  verse_key: string;
  verse_number: number;
  chapter_id: number;
  juz_number: number | null;
  page_number: number | null;
  hizb_number: number | null;
  rub_el_hizb_number: number | null;
  text_uthmani: string;
  english_translation: string;
  urdu_translation: string;
  updated_at: Date;
}

interface QuranFoundationChapterResponse {
  chapters?: Array<{
    id?: number;
    name_simple?: string;
    name_arabic?: string;
    name_complex?: string;
    translated_name?: {
      name?: string;
    };
    revelation_place?: string;
    verses_count?: number;
  }>;
}

interface QuranFoundationVersesResponse {
  verses?: Array<{
    id?: number;
    verse_key?: string;
    verse_number?: number;
    chapter_id?: number;
    juz_number?: number;
    page_number?: number;
    hizb_number?: number;
    rub_el_hizb_number?: number;
    text_uthmani?: string;
    translations?: Array<{
      resource_id?: number;
      text?: string;
    }>;
  }>;
}

function mapChapterRow(row: ChapterRow): QuranChapterSummary {
  return {
    id: row.chapter_id,
    nameSimple: row.name_simple,
    nameArabic: row.name_arabic,
    nameComplex: row.name_complex,
    translatedName: row.translated_name,
    revelationPlace: row.revelation_place,
    versesCount: row.verses_count,
  };
}

function mapVerseRow(row: VerseRow): QuranVersePayload {
  return {
    id: row.verse_db_id,
    verseKey: row.verse_key,
    verseNumber: row.verse_number,
    chapterId: row.chapter_id,
    juzNumber: row.juz_number,
    pageNumber: row.page_number,
    hizbNumber: row.hizb_number,
    rubElHizbNumber: row.rub_el_hizb_number,
    arabic: row.text_uthmani,
    english: row.english_translation,
    urdu: row.urdu_translation,
  };
}

async function ensureQuranSchema() {
  if (!quranSchemaReady) {
    quranSchemaReady = (async () => {
      const pool = getDbPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS quran_chapters (
          chapter_id SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
          name_simple VARCHAR(191) NOT NULL,
          name_arabic VARCHAR(191) NOT NULL,
          name_complex VARCHAR(191) NOT NULL,
          translated_name VARCHAR(191) NOT NULL,
          revelation_place VARCHAR(32) NOT NULL,
          verses_count SMALLINT UNSIGNED NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS quran_verses (
          verse_key VARCHAR(16) NOT NULL PRIMARY KEY,
          verse_db_id INT UNSIGNED NULL,
          chapter_id SMALLINT UNSIGNED NOT NULL,
          verse_number SMALLINT UNSIGNED NOT NULL,
          juz_number SMALLINT UNSIGNED NULL,
          page_number SMALLINT UNSIGNED NULL,
          hizb_number SMALLINT UNSIGNED NULL,
          rub_el_hizb_number SMALLINT UNSIGNED NULL,
          text_uthmani TEXT NOT NULL,
          english_translation MEDIUMTEXT NOT NULL,
          urdu_translation MEDIUMTEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_quran_verses_chapter (chapter_id, verse_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })();
  }

  await quranSchemaReady;
}

async function fetchChaptersFromApi() {
  const payload = await fetchQuranFoundationJson<QuranFoundationChapterResponse>(
    "/content/api/v4/chapters",
  );

  return (payload.chapters ?? []).map((chapter) => ({
    id: chapter.id ?? 0,
    nameSimple: chapter.name_simple ?? "",
    nameArabic: chapter.name_arabic ?? "",
    nameComplex: chapter.name_complex ?? chapter.name_simple ?? "",
    translatedName: chapter.translated_name?.name ?? chapter.name_simple ?? "",
    revelationPlace: chapter.revelation_place ?? "",
    versesCount: chapter.verses_count ?? 0,
  }));
}

async function storeChapters(connection: PoolConnection, chapters: QuranChapterSummary[]) {
  for (const chapter of chapters) {
    await connection.query<ResultSetHeader>(
      `
        INSERT INTO quran_chapters (
          chapter_id,
          name_simple,
          name_arabic,
          name_complex,
          translated_name,
          revelation_place,
          verses_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name_simple = VALUES(name_simple),
          name_arabic = VALUES(name_arabic),
          name_complex = VALUES(name_complex),
          translated_name = VALUES(translated_name),
          revelation_place = VALUES(revelation_place),
          verses_count = VALUES(verses_count)
      `,
      [
        chapter.id,
        chapter.nameSimple,
        chapter.nameArabic,
        chapter.nameComplex,
        chapter.translatedName,
        chapter.revelationPlace,
        chapter.versesCount,
      ],
    );
  }
}

async function fetchChapterVersesFromApi(chapterId: number) {
  const translationIds = [QF_ENGLISH_TRANSLATION_ID, QF_URDU_TRANSLATION_ID].filter(Boolean).join(",");
  const query = new URLSearchParams({
    fields: "text_uthmani,verse_key,verse_number,chapter_id,juz_number,page_number,hizb_number,rub_el_hizb_number",
    per_page: "300",
  });

  if (translationIds) {
    query.set("translations", translationIds);
  }

  const payload = await fetchQuranFoundationJson<QuranFoundationVersesResponse>(
    `/content/api/v4/verses/by_chapter/${chapterId}?${query.toString()}`,
  );

  return (payload.verses ?? []).map((verse) => {
    const english =
      verse.translations?.find((item) => String(item.resource_id) === QF_ENGLISH_TRANSLATION_ID)?.text ?? "";
    const urdu =
      verse.translations?.find((item) => String(item.resource_id) === String(QF_URDU_TRANSLATION_ID))?.text ?? "";

    return {
      id: verse.id ?? null,
      verseKey: verse.verse_key ?? `${chapterId}:${verse.verse_number ?? 0}`,
      verseNumber: verse.verse_number ?? 0,
      chapterId: verse.chapter_id ?? chapterId,
      juzNumber: verse.juz_number ?? null,
      pageNumber: verse.page_number ?? null,
      hizbNumber: verse.hizb_number ?? null,
      rubElHizbNumber: verse.rub_el_hizb_number ?? null,
      arabic: verse.text_uthmani ?? "",
      english,
      urdu,
    } satisfies QuranVersePayload;
  });
}

async function storeChapterVerses(connection: PoolConnection, verses: QuranVersePayload[]) {
  for (const verse of verses) {
    await connection.query<ResultSetHeader>(
      `
        INSERT INTO quran_verses (
          verse_key,
          verse_db_id,
          chapter_id,
          verse_number,
          juz_number,
          page_number,
          hizb_number,
          rub_el_hizb_number,
          text_uthmani,
          english_translation,
          urdu_translation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          verse_db_id = VALUES(verse_db_id),
          chapter_id = VALUES(chapter_id),
          verse_number = VALUES(verse_number),
          juz_number = VALUES(juz_number),
          page_number = VALUES(page_number),
          hizb_number = VALUES(hizb_number),
          rub_el_hizb_number = VALUES(rub_el_hizb_number),
          text_uthmani = VALUES(text_uthmani),
          english_translation = VALUES(english_translation),
          urdu_translation = VALUES(urdu_translation)
      `,
      [
        verse.verseKey,
        verse.id,
        verse.chapterId,
        verse.verseNumber,
        verse.juzNumber,
        verse.pageNumber,
        verse.hizbNumber,
        verse.rubElHizbNumber,
        verse.arabic,
        verse.english,
        verse.urdu,
      ],
    );
  }
}

export async function getQuranChapters(forceRefresh = false) {
  if (!hasQuranFoundationConfig()) {
    throw new Error("Quran Foundation credentials are not configured.");
  }

  await ensureQuranSchema();
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query<ChapterRow[]>(
      `
        SELECT chapter_id, name_simple, name_arabic, name_complex, translated_name, revelation_place, verses_count, updated_at
        FROM quran_chapters
        ORDER BY chapter_id ASC
      `,
    );

    if (rows.length > 0 && !forceRefresh) {
      return {
        chapters: rows.map(mapChapterRow),
        source: "database" as const,
        cachedAt: rows[0]?.updated_at ? rows[0].updated_at.toISOString() : null,
      };
    }

    const chapters = await fetchChaptersFromApi();
    await connection.beginTransaction();
    await storeChapters(connection, chapters);
    await connection.commit();

    return {
      chapters,
      source: "quran_foundation" as const,
      cachedAt: new Date().toISOString(),
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    throw error;
  } finally {
    connection.release();
  }
}

export async function getQuranChapter(chapterId: number, forceRefresh = false): Promise<QuranChapterPayload> {
  if (!hasQuranFoundationConfig()) {
    throw new Error("Quran Foundation credentials are not configured.");
  }

  await ensureQuranSchema();
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    const [chapterRows] = await connection.query<ChapterRow[]>(
      `
        SELECT chapter_id, name_simple, name_arabic, name_complex, translated_name, revelation_place, verses_count, updated_at
        FROM quran_chapters
        WHERE chapter_id = ?
        LIMIT 1
      `,
      [chapterId],
    );

    const [verseRows] = await connection.query<VerseRow[]>(
      `
        SELECT
          verse_db_id,
          verse_key,
          verse_number,
          chapter_id,
          juz_number,
          page_number,
          hizb_number,
          rub_el_hizb_number,
          text_uthmani,
          english_translation,
          urdu_translation,
          updated_at
        FROM quran_verses
        WHERE chapter_id = ?
        ORDER BY verse_number ASC
      `,
      [chapterId],
    );

    if (chapterRows[0] && verseRows.length > 0 && !forceRefresh) {
      return {
        chapter: mapChapterRow(chapterRows[0]),
        verses: verseRows.map(mapVerseRow),
        source: "database",
        cachedAt: verseRows[0]?.updated_at ? verseRows[0].updated_at.toISOString() : null,
      };
    }

    const chaptersResponse = await getQuranChapters(forceRefresh);
    const chapter = chaptersResponse.chapters.find((item) => item.id === chapterId);
    if (!chapter) {
      throw new Error(`Chapter ${chapterId} was not found.`);
    }

    const verses = await fetchChapterVersesFromApi(chapterId);
    await connection.beginTransaction();
    await storeChapterVerses(connection, verses);
    await connection.commit();

    return {
      chapter,
      verses,
      source: "quran_foundation",
      cachedAt: new Date().toISOString(),
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    throw error;
  } finally {
    connection.release();
  }
}
