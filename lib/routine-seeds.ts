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
    quranConnectionCount: 2,
    completed: true,
    themeId: "honesty",
    frequency: "daily",
  },
  {
    title: "Study / Learning",
    time: "11:00 AM",
    intention: "To seek beneficial knowledge for the sake of Allah.",
    quranConnectionCount: 3,
    completed: true,
    themeId: "patience",
    frequency: "daily",
  },
  {
    title: "Exercise",
    time: "5:00 PM",
    intention: "To maintain my health and strength for worship.",
    quranConnectionCount: 3,
    completed: false,
    themeId: "trust",
    frequency: "daily",
  },
  {
    title: "Time with Family",
    time: "8:00 PM",
    intention: "To strengthen family bonds and bring happiness.",
    quranConnectionCount: 2,
    completed: false,
    themeId: "anger",
    frequency: "daily",
  },
];
