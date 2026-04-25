import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { buildDailyGuidance } from "@/lib/guidance";
import {
  CommunityPost,
  ProgressSummary,
  ReflectionEntry,
  SavedReflection,
  ThemeId,
} from "@/lib/types";

const BASE_XP_PER_REFLECTION = 25;
const BONUS_XP_FOR_DAILY_MATCH = 15;
const STORE_FILE_PATH = path.join(process.cwd(), "data", "store.json");
const STORAGE_MODE = (process.env.VIAQURAN_STORAGE_MODE ?? "auto").toLowerCase();

let mysqlSchemaReady: Promise<void> | null = null;
let resolvedStorageMode: Promise<"mysql" | "file"> | null = null;
let fileStoreQueue: Promise<unknown> = Promise.resolve();

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

interface SavedReflectionRow extends RowDataPacket {
  id: number;
  title: string;
  input_text: string;
  theme_id: ThemeId;
  ayah_reference: string;
  created_at: Date;
}

interface CommunityPostRow extends RowDataPacket {
  id: number;
  title: string;
  excerpt: string;
  theme_id: ThemeId;
  author_name: string;
  role_label: string;
  created_at: Date;
}

interface FileUserRecord {
  id: string;
  externalUserId: string;
  createdAt: string;
  totalXp: number;
  longestStreak: number;
}

interface FileReflectionRecord {
  id: string;
  userId: string;
  input: string;
  themeId: ThemeId;
  xpGained: number;
  createdAt: string;
}

interface FileSavedReflectionRecord {
  id: string;
  userId: string;
  title: string;
  input: string;
  themeId: ThemeId;
  ayahReference: string;
  createdAt: string;
}

interface FileCommunityPostRecord {
  id: string;
  userId: string;
  title: string;
  excerpt: string;
  themeId: ThemeId;
  authorName: string;
  roleLabel: string;
  createdAt: string;
}

interface FileStore {
  users: Record<string, FileUserRecord>;
  reflections: FileReflectionRecord[];
  savedItems: FileSavedReflectionRecord[];
  communityPosts: FileCommunityPostRecord[];
}

function hasDbConfig() {
  return Boolean(
    process.env.DB_HOST &&
      process.env.DB_NAME &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD,
  );
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

function buildGuestName(userId: string) {
  const suffix = userId.replace(/^guest-/, "").slice(0, 6).toUpperCase();
  return suffix ? `Learner ${suffix}` : "Community Learner";
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

function mapSavedReflection(row: SavedReflectionRow): SavedReflection {
  return {
    id: `saved-${row.id}`,
    title: row.title,
    input: row.input_text,
    themeId: row.theme_id,
    ayahReference: row.ayah_reference,
    createdAt: toIsoString(row.created_at),
  };
}

function mapCommunityPost(row: CommunityPostRow): CommunityPost {
  return {
    id: `post-${row.id}`,
    title: row.title,
    excerpt: row.excerpt,
    themeId: row.theme_id,
    authorName: row.author_name,
    roleLabel: row.role_label,
    createdAt: toIsoString(row.created_at),
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
    if (day !== getDateKey(cursor)) {
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

function emptyStore(): FileStore {
  return {
    users: {},
    reflections: [],
    savedItems: [],
    communityPosts: [],
  };
}

function normalizeStore(data: unknown): FileStore {
  const record = typeof data === "object" && data ? (data as Partial<FileStore>) : {};
  return {
    users: record.users ?? {},
    reflections: Array.isArray(record.reflections) ? record.reflections : [],
    savedItems: Array.isArray(record.savedItems) ? record.savedItems : [],
    communityPosts: Array.isArray(record.communityPosts) ? record.communityPosts : [],
  };
}

async function ensureFileStore() {
  await fs.mkdir(path.dirname(STORE_FILE_PATH), { recursive: true });

  try {
    await fs.access(STORE_FILE_PATH);
  } catch {
    await fs.writeFile(STORE_FILE_PATH, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

async function readFileStore() {
  await ensureFileStore();
  const raw = await fs.readFile(STORE_FILE_PATH, "utf8");
  return normalizeStore(JSON.parse(raw));
}

async function writeFileStore(store: FileStore) {
  await fs.writeFile(STORE_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function withFileStoreMutation<T>(action: (store: FileStore) => Promise<T>) {
  const nextTask = fileStoreQueue.then(async () => {
    const store = await readFileStore();
    const result = await action(store);
    await writeFileStore(store);
    return result;
  });

  fileStoreQueue = nextTask.then(
    () => undefined,
    () => undefined,
  );

  return nextTask;
}

async function ensureMysqlSchema() {
  if (!mysqlSchemaReady) {
    mysqlSchemaReady = (async () => {
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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_reflections (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          title VARCHAR(191) NOT NULL,
          input_text TEXT NOT NULL,
          theme_id VARCHAR(32) NOT NULL,
          ayah_reference VARCHAR(32) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_saved_reflections_user
            FOREIGN KEY (user_id) REFERENCES app_users(id)
            ON DELETE CASCADE,
          INDEX idx_saved_reflections_user_created (user_id, created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS community_posts (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          author_name VARCHAR(120) NOT NULL,
          role_label VARCHAR(120) NOT NULL,
          title VARCHAR(191) NOT NULL,
          excerpt TEXT NOT NULL,
          theme_id VARCHAR(32) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_community_posts_user
            FOREIGN KEY (user_id) REFERENCES app_users(id)
            ON DELETE CASCADE,
          INDEX idx_community_posts_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })();
  }

  await mysqlSchemaReady;
}

async function resolveStorageMode(): Promise<"mysql" | "file"> {
  if (resolvedStorageMode) {
    return resolvedStorageMode;
  }

  resolvedStorageMode = (async () => {
    if (STORAGE_MODE === "file") {
      return "file";
    }

    if (STORAGE_MODE === "mysql") {
      await ensureMysqlSchema();
      return "mysql";
    }

    if (!hasDbConfig()) {
      return "file";
    }

    try {
      await ensureMysqlSchema();
      return "mysql";
    } catch (error) {
      console.warn("ViaQuran storage fallback activated. Using local file store.", error);
      return "file";
    }
  })();

  return resolvedStorageMode;
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
  } as UserRow;
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

async function getSavedItemsForUser(connection: PoolConnection, userId: number, limit = 6) {
  const [rows] = await connection.query<SavedReflectionRow[]>(
    `
      SELECT id, title, input_text, theme_id, ayah_reference, created_at
      FROM saved_reflections
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `,
    [userId, limit],
  );

  return rows.map(mapSavedReflection);
}

async function getCommunityPosts(connection: PoolConnection, limit = 6) {
  const [rows] = await connection.query<CommunityPostRow[]>(
    `
      SELECT id, title, excerpt, theme_id, author_name, role_label, created_at
      FROM community_posts
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `,
    [limit],
  );

  return rows.map(mapCommunityPost);
}

async function getFileUser(store: FileStore, userId: string) {
  if (!store.users[userId]) {
    store.users[userId] = {
      id: randomUUID(),
      externalUserId: userId,
      createdAt: new Date().toISOString(),
      totalXp: 0,
      longestStreak: 0,
    };
  }

  return store.users[userId];
}

function getFileEntriesForUser(store: FileStore, userId: string) {
  return store.reflections
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map<ReflectionEntry>((entry) => ({
      id: entry.id,
      input: entry.input,
      themeId: entry.themeId,
      createdAt: entry.createdAt,
      xpGained: entry.xpGained,
    }));
}

function getFileSavedItems(store: FileStore, userId: string, limit = 6) {
  return store.savedItems
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map<SavedReflection>((item) => ({
      id: item.id,
      title: item.title,
      input: item.input,
      themeId: item.themeId,
      ayahReference: item.ayahReference,
      createdAt: item.createdAt,
    }));
}

function getFileCommunityPosts(store: FileStore, limit = 6) {
  return store.communityPosts
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map<CommunityPost>((item) => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      themeId: item.themeId,
      authorName: item.authorName,
      roleLabel: item.roleLabel,
      createdAt: item.createdAt,
    }));
}

export async function getStorageMode() {
  return resolveStorageMode();
}

export async function getDashboard(userId: string) {
  const storageMode = await resolveStorageMode();

  if (storageMode === "mysql") {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const user = await getOrCreateUser(connection, userId);
      const recentEntries = await getRecentEntriesForUser(connection, user.id);
      const streakEntries = await getEntriesForStreak(connection, user.id);
      const savedItems = await getSavedItemsForUser(connection, user.id);
      const communityPosts = await getCommunityPosts(connection);

      return {
        progress: buildProgress(user.total_xp, user.longest_streak, streakEntries),
        dailyGuidance: buildDailyGuidance(),
        recentEntries,
        savedItems,
        communityPosts,
        storageMode,
      };
    } finally {
      connection.release();
    }
  }

  const store = await readFileStore();
  const user = await getFileUser(store, userId);
  const entries = getFileEntriesForUser(store, userId);

  return {
    progress: buildProgress(user.totalXp, user.longestStreak, entries),
    dailyGuidance: buildDailyGuidance(),
    recentEntries: entries.slice(0, 4),
    savedItems: getFileSavedItems(store, userId),
    communityPosts: getFileCommunityPosts(store),
    storageMode,
  };
}

export async function recordReflection(userId: string, input: string, themeId: ThemeId) {
  const storageMode = await resolveStorageMode();

  if (storageMode === "mysql") {
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
        storageMode,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  return withFileStoreMutation(async (store) => {
    const user = await getFileUser(store, userId);
    const dailyGuidance = buildDailyGuidance();
    const today = getDateKey(new Date());
    const alreadyMatchedToday = store.reflections.some(
      (entry) =>
        entry.userId === userId &&
        entry.themeId === dailyGuidance.themeId &&
        getDateKey(entry.createdAt) === today,
    );

    let gainedXp = BASE_XP_PER_REFLECTION;
    if (themeId === dailyGuidance.themeId && !alreadyMatchedToday) {
      gainedXp += BONUS_XP_FOR_DAILY_MATCH;
    }

    store.reflections.push({
      id: `entry-${randomUUID()}`,
      userId,
      input,
      themeId,
      xpGained: gainedXp,
      createdAt: new Date().toISOString(),
    });

    const streakEntries = getFileEntriesForUser(store, userId);
    const currentStreak = computeCurrentStreak(streakEntries);
    const totalXp = user.totalXp + gainedXp;
    const longestStreak = Math.max(user.longestStreak, currentStreak);

    user.totalXp = totalXp;
    user.longestStreak = longestStreak;

    return {
      progress: buildProgress(totalXp, longestStreak, streakEntries),
      gainedXp,
      recentEntries: streakEntries.slice(0, 4),
      dailyGuidance,
      storageMode,
    };
  });
}

export async function saveReflection(
  userId: string,
  payload: { title: string; input: string; themeId: ThemeId; ayahReference: string },
) {
  const storageMode = await resolveStorageMode();

  if (storageMode === "mysql") {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const user = await getOrCreateUser(connection, userId);

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO saved_reflections (user_id, title, input_text, theme_id, ayah_reference)
          VALUES (?, ?, ?, ?, ?)
        `,
        [user.id, payload.title, payload.input, payload.themeId, payload.ayahReference],
      );

      return {
        savedItems: await getSavedItemsForUser(connection, user.id),
        storageMode,
      };
    } finally {
      connection.release();
    }
  }

  return withFileStoreMutation(async (store) => {
    await getFileUser(store, userId);

    store.savedItems.push({
      id: `saved-${randomUUID()}`,
      userId,
      title: payload.title,
      input: payload.input,
      themeId: payload.themeId,
      ayahReference: payload.ayahReference,
      createdAt: new Date().toISOString(),
    });

    return {
      savedItems: getFileSavedItems(store, userId),
      storageMode,
    };
  });
}

export async function shareCommunityPost(
  userId: string,
  payload: { title: string; excerpt: string; themeId: ThemeId },
) {
  const storageMode = await resolveStorageMode();
  const authorName = buildGuestName(userId);
  const roleLabel = "Community learner";

  if (storageMode === "mysql") {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const user = await getOrCreateUser(connection, userId);

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO community_posts (user_id, author_name, role_label, title, excerpt, theme_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [user.id, authorName, roleLabel, payload.title, payload.excerpt, payload.themeId],
      );

      return {
        communityPosts: await getCommunityPosts(connection),
        storageMode,
      };
    } finally {
      connection.release();
    }
  }

  return withFileStoreMutation(async (store) => {
    await getFileUser(store, userId);

    store.communityPosts.push({
      id: `post-${randomUUID()}`,
      userId,
      title: payload.title,
      excerpt: payload.excerpt,
      themeId: payload.themeId,
      authorName,
      roleLabel,
      createdAt: new Date().toISOString(),
    });

    return {
      communityPosts: getFileCommunityPosts(store),
      storageMode,
    };
  });
}
