import { randomUUID } from "crypto";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { getAyahForTheme } from "@/lib/quran";
import { DEFAULT_ROUTINES, RoutineSeed } from "@/lib/routine-seeds";
import { getDashboard, getStorageMode, readFileStore, withFileStoreMutation } from "@/lib/storage";
import { THEMES } from "@/lib/theme-data";
import {
  DashboardRoutine,
  DashboardStat,
  RoutineCollectionPayload,
  RoutineDashboardPayload,
  RoutineFrequency,
  ThemeId,
} from "@/lib/types";

interface UserRow extends RowDataPacket {
  id: number;
  external_user_id: string;
}

interface RoutineRow extends RowDataPacket {
  id: number;
  title: string;
  time_of_day: string;
  intention: string;
  quran_connection_count: number;
  is_completed: number;
  theme_id: ThemeId;
  frequency: RoutineFrequency;
  created_at: Date;
}

let routinesSchemaReady: Promise<void> | null = null;

function formatDisplayDate() {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function getFallbackHijriDateLabel() {
  return "19 Dhul Qa'dah 1446";
}

function parseQuranConnectionCount(value: string) {
  const count = Number(value.split(" ")[0] ?? "0");
  return Number.isFinite(count) ? count : 0;
}

function mapSeedToRoutine(seed: RoutineSeed, index: number): DashboardRoutine {
  return {
    id: `routine-${index + 1}`,
    title: seed.title,
    time: seed.time,
    intention: seed.intention,
    quranConnections: `${seed.quranConnectionCount} Ayat`,
    completed: seed.completed,
    themeId: seed.themeId,
    frequency: seed.frequency,
  };
}

function mapRoutineRow(row: RoutineRow): DashboardRoutine {
  return {
    id: String(row.id),
    title: row.title,
    time: row.time_of_day,
    intention: row.intention,
    quranConnections: `${row.quran_connection_count} Ayat`,
    completed: Boolean(row.is_completed),
    themeId: row.theme_id,
    frequency: row.frequency,
  };
}

function mapStoredRoutine(record: Awaited<ReturnType<typeof readFileStore>>["routines"][number]): DashboardRoutine {
  return {
    id: record.id,
    title: record.title,
    time: record.time,
    intention: record.intention,
    quranConnections: `${record.quranConnectionCount} Ayat`,
    completed: record.completed,
    themeId: record.themeId,
    frequency: record.frequency,
  };
}

function buildStats(progress: Awaited<ReturnType<typeof getDashboard>>["progress"], tasks: DashboardRoutine[]): DashboardStat[] {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const quranConnections = tasks.reduce(
    (total, task) => total + parseQuranConnectionCount(task.quranConnections),
    0,
  );

  return [
    {
      value: String(tasks.length),
      label: "Tasks Today",
      description: `${completedTasks} completed so far`,
      icon: "check",
    },
    {
      value: String(Math.max(1, Math.round(progress.totalXp / 10))),
      label: "Good Deeds",
      description: "Track sincere action daily",
      icon: "star",
    },
    {
      value: String(quranConnections),
      label: "Quran Connections",
      description: "Linked ayat across routines",
      icon: "book",
    },
    {
      value: String(progress.currentStreak),
      label: "Day Streak",
      description: "Stay consistent with reflection",
      icon: "flame",
    },
  ];
}

async function buildInsight(tasks: DashboardRoutine[]) {
  const spotlight = tasks.find((task) => !task.completed) ?? tasks[0] ?? mapSeedToRoutine(DEFAULT_ROUTINES[0], 0);
  const ayah = await getAyahForTheme(THEMES[spotlight.themeId]);

  return {
    arabic: ayah.arabic,
    translation: ayah.english,
    reference: ayah.reference,
    buttonLabel: "Read Full Verse",
  };
}

async function ensureRoutinesSchema() {
  if (!routinesSchemaReady) {
    routinesSchemaReady = (async () => {
      const pool = getDbPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS routines (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          title VARCHAR(191) NOT NULL,
          time_of_day VARCHAR(32) NOT NULL,
          intention TEXT NOT NULL,
          quran_connection_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
          is_completed TINYINT(1) NOT NULL DEFAULT 0,
          theme_id VARCHAR(32) NOT NULL,
          frequency VARCHAR(16) NOT NULL DEFAULT 'daily',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_routines_user
            FOREIGN KEY (user_id) REFERENCES app_users(id)
            ON DELETE CASCADE,
          INDEX idx_routines_user_created (user_id, created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })();
  }

  await routinesSchemaReady;
}

async function getOrCreateUser(connection: PoolConnection, externalUserId: string) {
  const [existing] = await connection.query<UserRow[]>(
    `
      SELECT id, external_user_id
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
  } as UserRow;
}

async function getRoutineRows(connection: PoolConnection, userId: number) {
  const [rows] = await connection.query<RoutineRow[]>(
    `
      SELECT id, title, time_of_day, intention, quran_connection_count, is_completed, theme_id, frequency, created_at
      FROM routines
      WHERE user_id = ?
      ORDER BY created_at ASC, id ASC
    `,
    [userId],
  );

  return rows;
}

async function seedDefaultRoutines(connection: PoolConnection, userId: number) {
  for (const seed of DEFAULT_ROUTINES) {
    await connection.query<ResultSetHeader>(
      `
        INSERT INTO routines (
          user_id,
          title,
          time_of_day,
          intention,
          quran_connection_count,
          is_completed,
          theme_id,
          frequency
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        seed.title,
        seed.time,
        seed.intention,
        seed.quranConnectionCount,
        seed.completed ? 1 : 0,
        seed.themeId,
        seed.frequency,
      ],
    );
  }
}

async function getOrSeedRoutines(connection: PoolConnection, userId: number) {
  let rows = await getRoutineRows(connection, userId);
  if (rows.length === 0) {
    await seedDefaultRoutines(connection, userId);
    rows = await getRoutineRows(connection, userId);
  }
  return rows.map(mapRoutineRow);
}

function seedFileRoutines(userId: string) {
  return DEFAULT_ROUTINES.map((seed, index) => ({
    id: `routine-${index + 1}`,
    userId,
    title: seed.title,
    time: seed.time,
    intention: seed.intention,
    quranConnectionCount: seed.quranConnectionCount,
    completed: seed.completed,
    themeId: seed.themeId,
    frequency: seed.frequency,
    createdAt: new Date(Date.now() + index).toISOString(),
  }));
}

async function ensureFileRoutines(userId: string) {
  const store = await readFileStore();
  const existing = store.routines.filter((routine) => routine.userId === userId);
  if (existing.length > 0) {
    return existing.map(mapStoredRoutine);
  }

  return withFileStoreMutation(async (mutableStore) => {
    const current = mutableStore.routines.filter((routine) => routine.userId === userId);
    if (current.length === 0) {
      mutableStore.routines.push(...seedFileRoutines(userId));
    }

    return mutableStore.routines
      .filter((routine) => routine.userId === userId)
      .map(mapStoredRoutine);
  });
}

export async function getRoutineDashboard(userId: string): Promise<RoutineDashboardPayload> {
  const storageMode = await getStorageMode();
  const dashboard = await getDashboard(userId);

  let tasks: DashboardRoutine[];
  if (storageMode === "mysql") {
    await ensureRoutinesSchema();
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const user = await getOrCreateUser(connection, userId);
      tasks = await getOrSeedRoutines(connection, user.id);
    } finally {
      connection.release();
    }
  } else {
    tasks = await ensureFileRoutines(userId);
  }

  return {
    greetingName: "Ahmed",
    subtitle: "Turn your daily routine into acts of worship",
    dateLabel: formatDisplayDate(),
    hijriDateLabel: getFallbackHijriDateLabel(),
    stats: buildStats(dashboard.progress, tasks),
    tasks,
    insight: await buildInsight(tasks),
    storageMode,
  };
}

export async function getRoutines(userId: string): Promise<RoutineCollectionPayload> {
  const storageMode = await getStorageMode();

  if (storageMode === "mysql") {
    await ensureRoutinesSchema();
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const user = await getOrCreateUser(connection, userId);
      return {
        tasks: await getOrSeedRoutines(connection, user.id),
        storageMode,
      };
    } finally {
      connection.release();
    }
  }

  return {
    tasks: await ensureFileRoutines(userId),
    storageMode,
  };
}

export async function createRoutine(
  userId: string,
  payload: {
    title: string;
    time: string;
    intention: string;
    quranConnectionCount?: number;
    completed?: boolean;
    themeId: ThemeId;
    frequency: RoutineFrequency;
  },
) {
  const storageMode = await getStorageMode();

  if (storageMode === "mysql") {
    await ensureRoutinesSchema();
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const user = await getOrCreateUser(connection, userId);
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO routines (
            user_id,
            title,
            time_of_day,
            intention,
            quran_connection_count,
            is_completed,
            theme_id,
            frequency
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          user.id,
          payload.title,
          payload.time,
          payload.intention,
          payload.quranConnectionCount ?? 1,
          payload.completed ? 1 : 0,
          payload.themeId,
          payload.frequency,
        ],
      );

      return {
        tasks: await getOrSeedRoutines(connection, user.id),
        storageMode,
      };
    } finally {
      connection.release();
    }
  }

  return withFileStoreMutation(async (store) => {
    store.routines.push({
      id: `routine-${randomUUID()}`,
      userId,
      title: payload.title,
      time: payload.time,
      intention: payload.intention,
      quranConnectionCount: payload.quranConnectionCount ?? 1,
      completed: payload.completed ?? false,
      themeId: payload.themeId,
      frequency: payload.frequency,
      createdAt: new Date().toISOString(),
    });

    return {
      tasks: store.routines.filter((routine) => routine.userId === userId).map(mapStoredRoutine),
      storageMode,
    };
  });
}

export async function updateRoutine(
  userId: string,
  routineId: string,
  payload: {
    completed?: boolean;
  },
) {
  const storageMode = await getStorageMode();

  if (storageMode === "mysql") {
    await ensureRoutinesSchema();
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const user = await getOrCreateUser(connection, userId);
      if (typeof payload.completed === "boolean") {
        await connection.query(
          `
            UPDATE routines
            SET is_completed = ?
            WHERE id = ? AND user_id = ?
          `,
          [payload.completed ? 1 : 0, Number(routineId), user.id],
        );
      }

      return {
        tasks: await getOrSeedRoutines(connection, user.id),
        storageMode,
      };
    } finally {
      connection.release();
    }
  }

  return withFileStoreMutation(async (store) => {
    const target = store.routines.find((routine) => routine.userId === userId && routine.id === routineId);
    if (target && typeof payload.completed === "boolean") {
      target.completed = payload.completed;
    }

    return {
      tasks: store.routines.filter((routine) => routine.userId === userId).map(mapStoredRoutine),
      storageMode,
    };
  });
}
