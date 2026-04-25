import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { buildDailyGuidance } from "@/lib/guidance";
import { ProgressSummary, ReflectionEntry, ThemeId } from "@/lib/types";

const BASE_XP_PER_REFLECTION = 25;
const BONUS_XP_FOR_DAILY_MATCH = 15;

let schemaReady: Promise<void> | null = null;

interface UserRow extends RowDataPacket {
  id: number;
  external_user_id: string;
  total_xp: number;
  longest_streak: number;
}

interface ReflectionRow extends RowDataPacket {
  id: number;
  input_text: string;
  theme_id: ThemeId;
  xp_gained: number;
  created_at: Date;
}

function getDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapReflection(row: ReflectionRow): ReflectionEntry {
  return {
    id: `entry-${row.id}`,
    input: row.input_text,
    themeId: row.theme_id,
    createdAt: toIsoString(row.created_at),
    xpGained: row.xp_gained,
  };
}

function computeCurrentStreak(entries: ReflectionEntry[]) {
  const uniqueDays = [...new Set(entries.map((entry) => getDateKey(entry.createdAt)))].sort().reverse();
  if (uniqueDays.length === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();

  for (const day of uniqueDays) {
    const cursorKey = getDateKey(cursor);
    if (day !== cursorKey) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildProgress(totalXp: number, longestStreak: number, entries: ReflectionEntry[]): ProgressSummary {
  const level = Math.floor(totalXp / 100) + 1;
  const xpToNextLevel = level * 100 - totalXp;

  return {
    totalXp,
    level,
    currentStreak: computeCurrentStreak(entries),
    longestStreak,
    reflectionsCount: entries.length,
    xpToNextLevel,
  };
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const pool = getDbPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_users (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          external_user_id VARCHAR(191) NOT NULL UNIQUE,
          total_xp INT NOT NULL DEFAULT 0,
          longest_streak INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS reflections (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          input_text TEXT NOT NULL,
          theme_id VARCHAR(32) NOT NULL,
          xp_gained INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_reflections_user
            FOREIGN KEY (user_id) REFERENCES app_users(id)
            ON DELETE CASCADE,
          INDEX idx_reflections_user_created (user_id, created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })();
  }

  await schemaReady;
}

async function getOrCreateUser(connection: PoolConnection, externalUserId: string) {
  const [existing] = await connection.query<UserRow[]>(
    `
      SELECT id, external_user_id, total_xp, longest_streak
      FROM app_users
      WHERE external_user_id = ?
      LIMIT 1
    `,
    [externalUserId],
  );

  if (existing[0]) {
    return existing[0];
  }

  const [inserted] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO app_users (external_user_id)
      VALUES (?)
    `,
    [externalUserId],
  );

  return {
    id: inserted.insertId,
    external_user_id: externalUserId,
    total_xp: 0,
    longest_streak: 0,
  } satisfies UserRow;
}

async function getRecentEntriesForUser(connection: PoolConnection, userId: number, limit = 4) {
  const [rows] = await connection.query<ReflectionRow[]>(
    `
      SELECT id, input_text, theme_id, xp_gained, created_at
      FROM reflections
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `,
    [userId, limit],
  );

  return rows.map(mapReflection);
}

async function getEntriesForStreak(connection: PoolConnection, userId: number) {
  const [rows] = await connection.query<ReflectionRow[]>(
    `
      SELECT id, input_text, theme_id, xp_gained, created_at
      FROM reflections
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 365
    `,
    [userId],
  );

  return rows.map(mapReflection);
}

export async function getDashboard(userId: string) {
  await ensureSchema();
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    const user = await getOrCreateUser(connection, userId);
    const recentEntries = await getRecentEntriesForUser(connection, user.id);
    const streakEntries = await getEntriesForStreak(connection, user.id);

    return {
      progress: buildProgress(user.total_xp, user.longest_streak, streakEntries),
      dailyGuidance: buildDailyGuidance(),
      recentEntries,
    };
  } finally {
    connection.release();
  }
}

export async function recordReflection(userId: string, input: string, themeId: ThemeId) {
  await ensureSchema();
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const user = await getOrCreateUser(connection, userId);
    const today = getDateKey(new Date());
    const dailyGuidance = buildDailyGuidance();

    const [todayMatches] = await connection.query<Array<RowDataPacket & { total: number }>>(
      `
        SELECT COUNT(*) AS total
        FROM reflections
        WHERE user_id = ?
          AND theme_id = ?
          AND DATE(created_at) = ?
      `,
      [user.id, dailyGuidance.themeId, today],
    );

    let gainedXp = BASE_XP_PER_REFLECTION;
    if (themeId === dailyGuidance.themeId && (todayMatches[0]?.total ?? 0) === 0) {
      gainedXp += BONUS_XP_FOR_DAILY_MATCH;
    }

    await connection.query<ResultSetHeader>(
      `
        INSERT INTO reflections (user_id, input_text, theme_id, xp_gained)
        VALUES (?, ?, ?, ?)
      `,
      [user.id, input, themeId, gainedXp],
    );

    const streakEntries = await getEntriesForStreak(connection, user.id);
    const currentStreak = computeCurrentStreak(streakEntries);
    const longestStreak = Math.max(user.longest_streak, currentStreak);
    const totalXp = user.total_xp + gainedXp;

    await connection.query(
      `
        UPDATE app_users
        SET total_xp = ?, longest_streak = ?
        WHERE id = ?
      `,
      [totalXp, longestStreak, user.id],
    );

    await connection.commit();

    return {
      progress: buildProgress(totalXp, longestStreak, streakEntries),
      gainedXp,
      recentEntries: streakEntries.slice(0, 4),
      dailyGuidance,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

