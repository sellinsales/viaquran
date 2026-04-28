export const dashboardStats = [
  {
    value: "4",
    label: "Tasks Today",
    description: "3 completed so far",
    icon: "check",
  },
  {
    value: "12",
    label: "Good Deeds",
    description: "Keep it up",
    icon: "star",
  },
  {
    value: "3",
    label: "Quran Connections",
    description: "Matched today",
    icon: "book",
  },
  {
    value: "7",
    label: "Day Streak",
    description: "MashaAllah",
    icon: "flame",
  },
] as const;

export const dashboardTasks = [
  {
    id: "go-to-work",
    title: "Go to Work",
    time: "9:00 AM",
    intention: "To earn halal income and support myself and my family.",
    quranConnections: "2 Ayat",
    completed: true,
  },
  {
    id: "study-learning",
    title: "Study / Learning",
    time: "11:00 AM",
    intention: "To seek beneficial knowledge for the sake of Allah.",
    quranConnections: "3 Ayat",
    completed: true,
  },
  {
    id: "exercise",
    title: "Exercise",
    time: "5:00 PM",
    intention: "To maintain my health and strength for worship.",
    quranConnections: "3 Ayat",
    completed: false,
  },
  {
    id: "time-with-family",
    title: "Time with Family",
    time: "8:00 PM",
    intention: "To strengthen family bonds and bring happiness.",
    quranConnections: "2 Ayat",
    completed: false,
  },
] as const;

export const dailyInsight = {
  arabic:
    "وَكُلُوا مِمَّا رَزَقَكُمُ اللَّهُ حَلَالًا طَيِّبًا ۚ وَاتَّقُوا اللَّهَ الَّذِي أَنْتُم بِهِ مُؤْمِنُونَ",
  translation:
    "And eat from what Allah has provided for you, lawful and good. And fear Allah in whom you are believers.",
  reference: "Surah Al-Ma'idah 5:88",
  buttonLabel: "Read Full Verse",
};
