import { CommunitySpotlight, LearningPath, ResourceKit, TeachingCircle } from "@/lib/types";

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "path-foundations",
    title: "Foundations of Daily Guidance",
    summary: "A practical starter path for linking everyday decisions to Quranic principles.",
    level: "Beginner",
    duration: "4 weeks",
    teacher: "Ustadh Kareem",
    themeId: "patience",
    lessons: [
      "How to reflect on one ayah without overcomplicating it",
      "Turning sabr into a daily routine",
      "Journaling after prayer",
    ],
  },
  {
    id: "path-hearts",
    title: "Healing the Heart",
    summary: "A guided path around anxiety, sadness, gratitude, and trust in Allah.",
    level: "All levels",
    duration: "6 weeks",
    teacher: "Sr. Maryam",
    themeId: "trust",
    lessons: [
      "Recognizing the emotional pattern behind your du'a",
      "Dhikr practices for heavy days",
      "Replacing panic with tawakkul",
    ],
  },
  {
    id: "path-family",
    title: "Family, Character, and Conflict",
    summary: "Study themes that help parents, spouses, and young adults respond with ihsan.",
    level: "Intermediate",
    duration: "5 weeks",
    teacher: "Shaykh Salman",
    themeId: "anger",
    lessons: [
      "Restraint in conflict",
      "Honesty when relationships feel strained",
      "Mercy before reaction",
    ],
  },
  {
    id: "path-teachers",
    title: "Teach What You Learn",
    summary: "A track for mentors who want to turn reflections into circles, lessons, and guided discussion.",
    level: "Teacher track",
    duration: "3 weeks",
    teacher: "Team ViaQuran",
    themeId: "honesty",
    lessons: [
      "Building a 20-minute halaqah around one theme",
      "Writing prompts that invite reflection",
      "Sharing responsibly without losing accuracy",
    ],
  },
];

export const TEACHING_CIRCLES: TeachingCircle[] = [
  {
    id: "circle-sisters",
    title: "Sisters Reflection Circle",
    focus: "Quiet journaling, ayah discussion, and weekly action steps.",
    format: "Online",
    schedule: "Saturdays, 7:30 PM",
    capacity: "40 learners",
    host: "Sr. Huda",
  },
  {
    id: "circle-youth",
    title: "Youth Character Lab",
    focus: "Honesty, anger control, and social media comparison.",
    format: "Hybrid",
    schedule: "Fridays, 6:00 PM",
    capacity: "25 learners",
    host: "Ustadh Yusuf",
  },
  {
    id: "circle-families",
    title: "Family Qur'an Hour",
    focus: "Parent-child learning prompts and home discussion guides.",
    format: "In person",
    schedule: "Sundays, 11:00 AM",
    capacity: "18 families",
    host: "Community Team",
  },
];

export const RESOURCE_KITS: ResourceKit[] = [
  {
    id: "kit-weekly",
    title: "Weekly halaqah outline",
    description: "A ready-made teaching flow: ayah, reflection prompt, discussion, and action step.",
    format: "Lesson template",
  },
  {
    id: "kit-sharing",
    title: "Shareable reminder cards",
    description: "Short posts you can adapt for WhatsApp groups, classrooms, and study circles.",
    format: "Social pack",
  },
  {
    id: "kit-journal",
    title: "Reflection journal prompts",
    description: "Prompts for teachers and learners who want guided writing after each session.",
    format: "Worksheet",
  },
  {
    id: "kit-onboarding",
    title: "New learner starter kit",
    description: "A simple sequence for welcoming people into a Quran-centered learning habit.",
    format: "Checklist",
  },
];

export const COMMUNITY_SPOTLIGHTS: CommunitySpotlight[] = [
  {
    id: "spotlight-1",
    title: "Turning one ayah into a family conversation",
    excerpt: "A simple way to teach children with one verse, one question, and one small action.",
    audience: "Parents",
    themeId: "gratitude",
  },
  {
    id: "spotlight-2",
    title: "A youth circle on anger without lecturing",
    excerpt: "Use stories, pauses, and role-play instead of abstract warnings.",
    audience: "Teachers",
    themeId: "anger",
  },
  {
    id: "spotlight-3",
    title: "How learners are using reflection journaling",
    excerpt: "Short, repeated journaling beats occasional long writing for building consistency.",
    audience: "Learners",
    themeId: "patience",
  },
];
