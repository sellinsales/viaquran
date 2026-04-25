import { THEMES, THEME_ORDER } from "@/lib/theme-data";
import { ThemeDefinition } from "@/lib/types";

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function detectTheme(input: string): ThemeDefinition {
  const rawInput = input.toLowerCase();
  const normalized = tokenize(input);

  if (normalized.length === 0) {
    return THEMES.patience;
  }

  let bestTheme = THEMES.patience;
  let bestScore = -1;

  for (const themeId of THEME_ORDER) {
    const theme = THEMES[themeId];
    let score = 0;

    for (const keyword of theme.keywords) {
      const normalizedKeyword = keyword.toLowerCase();

      if (normalizedKeyword.includes(" ")) {
        if (rawInput.includes(normalizedKeyword)) {
          score += 3;
        }
        continue;
      }

      if (normalized.some((token) => token.includes(normalizedKeyword))) {
        score += 2;
      }
    }

    if (rawInput.includes(theme.label.toLowerCase())) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  if (bestScore <= 0) {
    return THEMES.patience;
  }

  return bestTheme;
}
