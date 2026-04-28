import { RoutineFrequency, ThemeId } from "@/lib/types";

export interface RoutineSeed {
  title: string;
  time: string;
  intention: string;
  quranConnectionCount: number;
  completed: boolean;
  themeId: ThemeId;
  frequency: RoutineFrequency;
}

export const DEFAULT_ROUTINES: RoutineSeed[] = [
  {
    title: "Go to Work",
    time: "9:00 AM",
    intention: "To earn halal income and support myself and my family.",
    quranConnectionCount: 3,
    completed: true,
    themeId: "honesty",
    frequency: "daily",
  },
  {
    title: "Study / Learning",
    time: "1:00 PM",
    intention: "To seek beneficial knowledge for the sake of Allah.",
    quranConnectionCount: 2,
    completed: false,
    themeId: "patience",
    frequency: "daily",
  },
  {
    title: "Exercise",
    time: "6:00 PM",
    intention: "To maintain my health and strength for worship.",
    quranConnectionCount: 2,
    completed: false,
    themeId: "trust",
    frequency: "daily",
  },
  {
    title: "Family Time",
    time: "8:30 PM",
    intention: "To strengthen family bonds and show love.",
    quranConnectionCount: 3,
    completed: false,
    themeId: "anger",
    frequency: "daily",
  },
  {
    title: "Night Prayer",
    time: "11:00 PM",
    intention: "To draw closer to Allah.",
    quranConnectionCount: 2,
    completed: false,
    themeId: "sadness",
    frequency: "daily",
  },
];
