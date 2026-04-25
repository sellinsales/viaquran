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
  createdAt: string;
  xpGained: number;
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
}

export interface DashboardPayload {
  progress: ProgressSummary;
  dailyGuidance: DailyGuidance;
  recentEntries: ReflectionEntry[];
}

