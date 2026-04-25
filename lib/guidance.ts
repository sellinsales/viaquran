import { THEMES, THEME_ORDER } from "@/lib/theme-data";
import { DailyGuidance, ThemeDefinition, ThemeId } from "@/lib/types";

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayIndex(dateKey: string) {
  return Number(dateKey.replaceAll("-", "")) % THEME_ORDER.length;
}

export function getTodayTheme(date = new Date()): ThemeDefinition {
  const dateKey = getDateKey(date);
  const themeId: ThemeId = THEME_ORDER[getDayIndex(dateKey)];
  return THEMES[themeId];
}

export function buildDailyGuidance(date = new Date()): DailyGuidance {
  const theme = getTodayTheme(date);
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  return {
    themeId: theme.id,
    title: `${theme.label} Guidance`,
    prompt: theme.tagline,
    ayahReference: theme.ayah.reference,
    challengeTitle: theme.challengeTitle,
    challengePrompt: theme.challengePrompt,
    dateLabel,
  };
}
