export type ThemeId =
  | "anger"
  | "patience"
  | "jealousy"
  | "honesty"
  | "sadness"
  | "gratitude"
  | "trust";

export interface AyahPayload {
  reference: string;
  source: string;
  arabic: string;
  english: string;
  urdu: string;
}

export interface QuranChapterSummary {
  id: number;
  nameSimple: string;
  nameArabic: string;
  nameComplex: string;
  translatedName: string;
  revelationPlace: string;
  versesCount: number;
}

export interface QuranVersePayload {
  id: number | null;
  verseKey: string;
  verseNumber: number;
  chapterId: number;
  juzNumber: number | null;
  pageNumber: number | null;
  hizbNumber: number | null;
  rubElHizbNumber: number | null;
  arabic: string;
  english: string;
  urdu: string;
}

export interface QuranChapterPayload {
  chapter: QuranChapterSummary;
  verses: QuranVersePayload[];
  source: "database" | "quran_foundation";
  cachedAt: string | null;
}

export type RoutineFrequency = "daily" | "weekly" | "monthly";

export interface DashboardStat {
  value: string;
  label: string;
  description: string;
  icon: "check" | "star" | "book" | "flame";
  progressPercent?: number;
  trendLabel?: string;
  footerLabel?: string;
}

export interface DashboardRoutine {
  id: string;
  title: string;
  summary: string;
  time: string;
  intention: string;
  quranConnections: string;
  completed: boolean;
  themeId: ThemeId;
  frequency: RoutineFrequency;
}

export interface DashboardInsight {
  arabic: string;
  translation: string;
  reference: string;
  buttonLabel: string;
}

export interface DashboardReminder {
  title: string;
  body: string;
}

export interface DashboardQuickReflection {
  title: string;
  prompt: string;
  buttonLabel: string;
  latestEntry: string | null;
}

export interface RoutineDashboardPayload {
  greetingName: string;
  profileName: string;
  profileInitials: string;
  subtitle: string;
  dateLabel: string;
  hijriDateLabel: string;
  stats: DashboardStat[];
  tasks: DashboardRoutine[];
  insight: DashboardInsight;
  reminder: DashboardReminder;
  quickReflection: DashboardQuickReflection;
  storageMode: "mysql" | "file";
}

export interface RoutineCollectionPayload {
  tasks: DashboardRoutine[];
  storageMode: "mysql" | "file";
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  tagline: string;
  accentClass: string;
  surfaceClass: string;
  borderClass: string;
  icon: string;
  keywords: string[];
  ayah: AyahPayload;
  explanation: string;
  actionSteps: string[];
  challengeTitle: string;
  challengePrompt: string;
}

export interface ReflectionEntry {
  id: string;
  input: string;
  themeId: ThemeId;
  ayahReference: string | null;
  createdAt: string;
  xpGained: number;
}

export interface SavedReflection {
  id: string;
  title: string;
  input: string;
  themeId: ThemeId;
  ayahReference: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  excerpt: string;
  themeId: ThemeId;
  authorName: string;
  roleLabel: string;
  createdAt: string;
}

export interface LearningPath {
  id: string;
  title: string;
  summary: string;
  level: string;
  duration: string;
  teacher: string;
  themeId: ThemeId;
  lessons: string[];
}

export interface TeachingCircle {
  id: string;
  title: string;
  focus: string;
  format: string;
  schedule: string;
  capacity: string;
  host: string;
}

export interface ResourceKit {
  id: string;
  title: string;
  description: string;
  format: string;
}

export interface CommunitySpotlight {
  id: string;
  title: string;
  excerpt: string;
  audience: string;
  themeId: ThemeId;
}

export interface UserRecord {
  id: string;
  createdAt: string;
  totalXp: number;
  longestStreak: number;
  entries: ReflectionEntry[];
}

export interface ProgressSummary {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  reflectionsCount: number;
  xpToNextLevel: number;
}

export interface DailyGuidance {
  themeId: ThemeId;
  title: string;
  prompt: string;
  ayahReference: string;
  challengeTitle: string;
  challengePrompt: string;
  dateLabel: string;
}

export interface ReflectionResult {
  input: string;
  theme: ThemeDefinition;
  ayah: AyahPayload;
  explanation: string;
  actionSteps: string[];
  dailyGuidance: DailyGuidance;
  progress: ProgressSummary;
  gainedXp: number;
  recentEntries: ReflectionEntry[];
  storageMode: "mysql" | "file";
}

export interface DashboardPayload {
  progress: ProgressSummary;
  dailyGuidance: DailyGuidance;
  recentEntries: ReflectionEntry[];
  savedItems: SavedReflection[];
  communityPosts: CommunityPost[];
  storageMode: "mysql" | "file";
}
