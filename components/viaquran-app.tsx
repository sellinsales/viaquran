"use client";

import { FormEvent, ReactNode, SVGProps, useEffect, useMemo, useState } from "react";
import { EXAMPLE_INPUTS, THEMES } from "@/lib/theme-data";
import { detectTheme } from "@/lib/theme-engine";
import { DashboardPayload, ReflectionResult, ThemeId } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement>;
type RoutineFrequency = "Daily" | "Weekly" | "Monthly";

interface RoutineItem {
  id: string;
  title: string;
  time: string;
  themeId: ThemeId;
  intention: string;
  description: string;
  frequency: RoutineFrequency;
}

const ROUTINE_DECK: RoutineItem[] = [
  {
    id: "go-to-work",
    title: "Go to Work",
    time: "9:00 AM",
    themeId: "honesty",
    intention: "To earn halal income and support my family.",
    description: "Treat work as obedience, honesty, and service.",
    frequency: "Daily",
  },
  {
    id: "study-learning",
    title: "Study / Learning",
    time: "11:00 AM",
    themeId: "patience",
    intention: "To seek beneficial knowledge for the sake of Allah.",
    description: "Turn discipline and effort into worship.",
    frequency: "Daily",
  },
  {
    id: "exercise",
    title: "Exercise",
    time: "5:00 PM",
    themeId: "trust",
    intention: "To maintain health and strength for worship.",
    description: "A strong body supports worship, service, and steadiness.",
    frequency: "Daily",
  },
  {
    id: "time-with-family",
    title: "Time with Family",
    time: "8:00 PM",
    themeId: "anger",
    intention: "To strengthen family bonds and bring mercy into the home.",
    description: "Family time becomes worship when it carries patience and kindness.",
    frequency: "Daily",
  },
  {
    id: "sleep-rest",
    title: "Sleep / Rest",
    time: "10:30 PM",
    themeId: "gratitude",
    intention: "To rest as a blessing and recover for tomorrow's duties.",
    description: "Even rest becomes gratitude when taken with balance.",
    frequency: "Weekly",
  },
];

function createGuestId() {
  if (typeof window === "undefined") {
    return "guest-demo";
  }

  try {
    const stored = window.localStorage.getItem("viaquran-user-id");
    if (stored) {
      return stored;
    }

    const token =
      typeof window.crypto !== "undefined" && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID().slice(0, 8)
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const nextUserId = `guest-${token}`;
    window.localStorage.setItem("viaquran-user-id", nextUserId);
    return nextUserId;
  } catch {
    return `guest-${Date.now().toString(36)}`;
  }
}

function isErrorPayload(value: unknown): value is { error?: string } {
  return Boolean(value && typeof value === "object" && "error" in value);
}

function themeLabel(themeId: ThemeId) {
  return THEMES[themeId].label;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatFullDate() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function computeAlignment(progress?: DashboardPayload["progress"]) {
  if (!progress) {
    return 71;
  }

  return Math.min(
    98,
    34 + progress.level * 6 + progress.currentStreak * 4 + Math.min(progress.reflectionsCount, 10) * 3,
  );
}

async function copyText(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard not available.");
  }

  await navigator.clipboard.writeText(text);
}

function buildShareText(result: ReflectionResult) {
  return [
    "Match your life with Allah's message",
    `${result.theme.label} guidance`,
    result.ayah.reference,
    result.ayah.english,
    `Reflection: ${result.explanation}`,
    `Step 1: ${result.actionSteps[0] ?? "Take one Quran-linked step today."}`,
  ].join("\n");
}

function initialsFromUser(userId: string) {
  return userId.replace("guest-", "").slice(0, 2).toUpperCase() || "AQ";
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function DashboardSection({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={joinClasses(
        "rounded-[28px] border border-[#e6ddcf] bg-white/92 p-5 shadow-[0_18px_45px_rgba(53,49,36,0.06)] md:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-[1.5rem] text-[#1d2a21] md:text-[1.8rem]">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-[54ch] text-sm leading-7 text-[#617168]">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SidebarItem({
  active,
  icon,
  children,
}: {
  active?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={joinClasses(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
        active ? "bg-[#256145] text-white shadow-[0_12px_30px_rgba(37,97,69,0.2)]" : "text-[#425148]",
      )}
    >
      <span className={joinClasses("flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-white/12" : "bg-[#f3eee4] text-[#256145]")}>
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  help,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  help: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#ece4d7] bg-[#fffdf9] p-4 shadow-[0_10px_25px_rgba(70,63,46,0.04)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf6f0] text-[#256145]">{icon}</div>
      <div className="mt-5 text-[2rem] font-semibold leading-none text-[#17231c]">{value}</div>
      <div className="mt-2 text-sm font-semibold text-[#2d3b33]">{label}</div>
      <div className="mt-1 text-xs leading-6 text-[#728179]">{help}</div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#ddd6c8] bg-white px-3 py-1.5 text-xs font-semibold text-[#5c6b62]">
      {children}
    </span>
  );
}

function ExampleChip({
  value,
  onClick,
}: {
  value: string;
  onClick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className="rounded-full border border-[#ded6c7] bg-white px-3 py-2 text-sm text-[#4a5a50] transition hover:border-[#256145] hover:text-[#256145]"
    >
      {value}
    </button>
  );
}

function RoutineRow({
  routine,
  reference,
  active,
  done,
  onSelect,
}: {
  routine: RoutineItem;
  reference: string;
  active: boolean;
  done: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={joinClasses(
        "grid w-full gap-4 rounded-[24px] border px-4 py-4 text-left transition md:grid-cols-[auto_1.2fr_1.25fr_auto]",
        active ? "border-[#bfd6c4] bg-[#f5fbf7]" : "border-[#ece4d7] bg-white hover:border-[#d3c7b5]",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={joinClasses(
            "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
            done ? "border-[#256145] bg-[#256145] text-white" : "border-[#d6d1c4] text-[#77857d]",
          )}
        >
          {done ? "x" : ""}
        </span>
        <div>
          <div className="text-base font-semibold text-[#1f2c23]">{routine.title}</div>
          <div className="text-sm text-[#6b7a72]">{routine.time}</div>
        </div>
      </div>
      <div className="text-sm leading-6 text-[#506056]">
        <span className="font-semibold text-[#2b3931]">Intention:</span> {routine.intention}
      </div>
      <div className="text-sm leading-6 text-[#506056]">{routine.description}</div>
      <div className="justify-self-start md:justify-self-end">
        <div className="rounded-full bg-[#edf6f0] px-3 py-2 text-sm font-semibold text-[#256145]">
          {reference}
        </div>
      </div>
    </button>
  );
}

function ActionStep({
  label,
  completed,
  onToggle,
}: {
  label: string;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={joinClasses(
        "flex w-full items-start gap-3 rounded-[18px] border px-4 py-4 text-left text-sm leading-7 transition",
        completed ? "border-[#cfe2d4] bg-[#eef8f0] text-[#244333]" : "border-[#e7e0d4] bg-white text-[#46554c]",
      )}
    >
      <span
        className={joinClasses(
          "mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold",
          completed ? "border-[#256145] bg-[#256145] text-white" : "border-[#c8d1c8] text-[#708177]",
        )}
      >
        {completed ? "x" : ""}
      </span>
      <span>{label}</span>
    </button>
  );
}

function PhoneFrame({
  title,
  children,
  activeTab,
}: {
  title: string;
  children: ReactNode;
  activeTab: "dashboard" | "routines" | "add" | "reflection" | "profile";
}) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "routines", label: "My Routines" },
    { id: "add", label: "Add" },
    { id: "reflection", label: "Reflections" },
    { id: "profile", label: "Profile" },
  ] as const;

  return (
    <article className="rounded-[34px] border border-[#ded6c8] bg-[#fffdfa] p-3 shadow-[0_24px_55px_rgba(57,49,39,0.08)]">
      <div className="rounded-[28px] border border-[#ece3d6] bg-white p-4">
        <div className="flex items-center justify-between text-[13px] font-semibold text-[#2c3831]">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1d2a21]" />
            <span className="h-2 w-2 rounded-full bg-[#1d2a21]" />
            <span className="h-2 w-4 rounded-full border border-[#1d2a21]" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-[#17231c]">{title}</div>
          <button type="button" className="rounded-full p-2 text-[#516159]">
            <DotsIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 min-h-[430px]">{children}</div>
        <div className="mt-5 grid grid-cols-5 gap-2 border-t border-[#efeadf] pt-3">
          {tabs.map((tab) => (
            <div key={tab.id} className="text-center">
              <div
                className={joinClasses(
                  "mx-auto h-1.5 w-8 rounded-full",
                  activeTab === tab.id ? "bg-[#256145]" : "bg-transparent",
                )}
              />
              <div className={joinClasses("mt-2 text-[11px]", activeTab === tab.id ? "font-semibold text-[#256145]" : "text-[#7c8a82]")}>
                {tab.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function StarRating({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((value) => (
        <button key={value} type="button" onClick={() => onChange(value)} className="text-[#d0b06f] transition hover:scale-105">
          <StarIcon className={joinClasses("h-7 w-7", value <= rating ? "fill-current" : "fill-none")} />
        </button>
      ))}
    </div>
  );
}

export function ViaQuranApp() {
  const [userId, setUserId] = useState("guest-demo");
  const [input, setInput] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [result, setResult] = useState<ReflectionResult | null>(null);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [postTitle, setPostTitle] = useState("Need help connecting this routine to Quran guidance");
  const [postText, setPostText] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState(ROUTINE_DECK[0].id);
  const [routineFrequency, setRoutineFrequency] = useState<RoutineFrequency>("Daily");
  const [routineTitle, setRoutineTitle] = useState("");
  const [routineTime, setRoutineTime] = useState("09:00");
  const [routineConcept, setRoutineConcept] = useState("");
  const [reflectionRating, setReflectionRating] = useState(4);
  const [reflectionNote, setReflectionNote] = useState("Alhamdulillah, I want this routine to become obedience instead of habit.");
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const nextUserId = createGuestId();
    setUserId(nextUserId);

    fetch(`/api/today?userId=${encodeURIComponent(nextUserId)}`, { cache: "no-store" })
      .then((response) => response.json().then((payload: unknown) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok || isErrorPayload(payload)) {
          throw new Error(
            isErrorPayload(payload) ? payload.error ?? "Dashboard failed to load." : "Dashboard failed to load.",
          );
        }

        setDashboard(payload as DashboardPayload);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load today's guidance.");
      });
  }, []);

  const liveTheme = useMemo(() => detectTheme(input || routineConcept || postText || "patience"), [input, postText, routineConcept]);
  const guidanceTheme = result?.theme ?? liveTheme;
  const progress = result?.progress ?? dashboard?.progress;
  const dailyGuidance = result?.dailyGuidance ?? dashboard?.dailyGuidance;
  const recentEntries = result?.recentEntries ?? dashboard?.recentEntries ?? [];
  const savedItems = dashboard?.savedItems ?? [];
  const communityPosts = dashboard?.communityPosts ?? [];
  const alignment = computeAlignment(progress);
  const quranReference = result?.ayah.reference ?? dailyGuidance?.ayahReference ?? guidanceTheme.ayah.reference;
  const currentAyah = result?.ayah ?? guidanceTheme.ayah;
  const activeSteps = result?.actionSteps ?? guidanceTheme.actionSteps;
  const activeExplanation = result?.explanation ?? guidanceTheme.explanation;
  const initials = initialsFromUser(userId);
  const overviewCards = [
    { label: "Tasks Today", value: `${ROUTINE_DECK.filter((item) => item.frequency === "Daily").length}`, help: "Three completed routines are enough to build momentum.", icon: <CheckIcon className="h-5 w-5" /> },
    { label: "Good Deeds", value: `${Math.max(12, Math.round((progress?.totalXp ?? 96) / 8))}`, help: "Count the acts you intend for Allah, not only productivity.", icon: <StarIcon className="h-5 w-5" /> },
    { label: "Quran Connections", value: `${Math.max(3, recentEntries.length || 3)}`, help: "Each matched routine becomes a Quran connection you can revisit.", icon: <BookIcon className="h-5 w-5" /> },
    { label: "Day Streak", value: `${progress?.currentStreak ?? 7}`, help: "Consistency matters more than intensity.", icon: <FlameIcon className="h-5 w-5" /> },
  ];

  const activeRoutine = ROUTINE_DECK.find((item) => item.id === selectedRoutineId) ?? ROUTINE_DECK[0];
  const filteredRoutines = ROUTINE_DECK.filter((item) => item.frequency === routineFrequency);
  const suggestedCommunityCards =
    communityPosts.length > 0
      ? communityPosts.slice(0, 2).map((post) => ({
          title: post.title,
          themeId: post.themeId,
          excerpt: post.excerpt,
          badge: post.authorName,
        }))
      : [
          {
            title: "Help Others",
            themeId: "honesty" as ThemeId,
            excerpt: "Support a need and connect service with the Quran.",
            badge: "2 Ayat",
          },
          {
            title: "Travel",
            themeId: "trust" as ThemeId,
            excerpt: "Reflect on movement, risk, and tawakkul during journeys.",
            badge: "3 Ayat",
          },
        ];

  useEffect(() => {
    if (!result) {
      return;
    }

    setPostTitle(`Match review: ${result.theme.label}`);
    setPostText(
      `${result.explanation} My next step is: ${result.actionSteps[0] ?? "Take one practical Quran-linked action today."}`,
    );
    const linkedRoutine = ROUTINE_DECK.find((item) => item.themeId === result.theme.id);
    if (linkedRoutine) {
      setSelectedRoutineId(linkedRoutine.id);
    }
    setCompletedSteps([]);
  }, [result]);

  async function requestReflection(nextInput: string) {
    setError("");
    setSaveMessage("");
    setShareMessage("");
    setIsReflecting(true);

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: nextInput, userId }),
      });
      const rawPayload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !rawPayload || isErrorPayload(rawPayload)) {
        throw new Error(
          isErrorPayload(rawPayload)
            ? rawPayload.error ?? "Could not generate guidance."
            : "Could not generate guidance.",
        );
      }

      const payload = rawPayload as ReflectionResult;
      setResult(payload);
      setDashboard((current) => ({
        progress: payload.progress,
        dailyGuidance: payload.dailyGuidance,
        recentEntries: payload.recentEntries,
        savedItems: current?.savedItems ?? [],
        communityPosts: current?.communityPosts ?? [],
        storageMode: payload.storageMode,
      }));
      return payload;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Network error while generating guidance.",
      );
      return null;
    } finally {
      setIsReflecting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) {
      setError("Describe the routine, struggle, or question you want to match.");
      return;
    }
    await requestReflection(input.trim());
  }

  async function handleSaveCurrent() {
    if (!result) {
      setError("Generate Quran guidance first, then save the reflection.");
      return;
    }

    setError("");
    setSaveMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title: `${result.theme.label} reflection`,
          input: result.input,
          themeId: result.theme.id,
          ayahReference: result.ayah.reference,
        }),
      });
      const rawPayload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !rawPayload || isErrorPayload(rawPayload)) {
        throw new Error(
          isErrorPayload(rawPayload)
            ? rawPayload.error ?? "Could not save this reflection."
            : "Could not save this reflection.",
        );
      }

      const payload = rawPayload as {
        savedItems?: DashboardPayload["savedItems"];
        storageMode?: "mysql" | "file";
      };

      setDashboard((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          savedItems: payload.savedItems ?? current.savedItems,
          storageMode: payload.storageMode ?? current.storageMode,
        };
      });
      setSaveMessage("Saved to your reminder vault.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this reflection.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publishCommunityPost(title: string, excerpt: string, anonymous: boolean) {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title,
        excerpt,
        anonymous,
      }),
    });
    const rawPayload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok || !rawPayload || isErrorPayload(rawPayload)) {
      throw new Error(
        isErrorPayload(rawPayload)
          ? rawPayload.error ?? "Could not publish to the community wall."
          : "Could not publish to the community wall.",
      );
    }

    const payload = rawPayload as {
      communityPosts?: DashboardPayload["communityPosts"];
      storageMode?: "mysql" | "file";
    };
    setDashboard((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        communityPosts: payload.communityPosts ?? current.communityPosts,
        storageMode: payload.storageMode ?? current.storageMode,
      };
    });
  }

  async function handleShareCurrent() {
    if (!result) {
      setError("Generate Quran guidance first, then share it.");
      return;
    }

    setError("");
    setShareMessage("");
    setIsPublishing(true);

    try {
      await publishCommunityPost(`${result.theme.label} reminder`, result.explanation, postAnonymously);
      const shareText = buildShareText(result);

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: "ViaQuran reflection",
          text: shareText,
        });
      } else {
        await copyText(shareText);
      }

      setShareMessage("Shared to the community and prepared for external sharing.");
    } catch (shareError) {
      setError(
        shareError instanceof Error ? shareError.message : "Could not share this reflection right now.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handlePublishNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setShareMessage("");

    const title = postTitle.trim();
    const excerpt = postText.trim();
    if (!title || !excerpt) {
      setError("Write a short title and prompt before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      await publishCommunityPost(title, excerpt, postAnonymously);
      setShareMessage(postAnonymously ? "Your anonymous note is now in the community." : "Your note is now in the community.");
      setPostText("");
    } catch (publishError) {
      setError(
        publishError instanceof Error ? publishError.message : "Could not publish this note right now.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleAddRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = routineTitle.trim();
    const concept = routineConcept.trim();
    if (!title || !concept) {
      setError("Add a routine title and the concept you want to relate to the Quran.");
      return;
    }

    const nextInput = `${title}. Frequency: ${routineFrequency}. Time: ${routineTime}. Intention or concept: ${concept}`;
    setInput(nextInput);
    await requestReflection(nextInput);
  }

  function toggleStep(step: string) {
    setCompletedSteps((current) =>
      current.includes(step) ? current.filter((item) => item !== step) : [...current, step],
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#faf6ef_42%,#f1ebdf_100%)] px-3 py-4 text-[#17231c] md:px-5 md:py-6">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-5 xl:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="hidden rounded-[32px] border border-[#e6dece] bg-[linear-gradient(180deg,#fffdf9_0%,#f6f0e5_100%)] p-5 shadow-[0_24px_60px_rgba(54,48,37,0.08)] xl:flex xl:min-h-[900px] xl:flex-col">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#e6ddcd] bg-white">
                <img src="/logo_viaquran.png" alt="ViaQuran logo" className="h-12 w-12 object-contain" />
              </div>
              <div>
                <div className="font-serif text-[1.5rem] leading-none text-[#1f3027]">Quran Life</div>
                <div className="mt-1 text-sm text-[#6d7c73]">Companion</div>
              </div>
            </div>

            <div className="mt-8 grid gap-2">
              <SidebarItem active icon={<HomeIcon className="h-5 w-5" />}>Dashboard</SidebarItem>
              <SidebarItem icon={<RoutineIcon className="h-5 w-5" />}>My Routines</SidebarItem>
              <SidebarItem icon={<PlusIcon className="h-5 w-5" />}>Add Routine</SidebarItem>
              <SidebarItem icon={<BookIcon className="h-5 w-5" />}>Quran Connections</SidebarItem>
              <SidebarItem icon={<StarIcon className="h-5 w-5" />}>Reflections</SidebarItem>
              <SidebarItem icon={<BellIcon className="h-5 w-5" />}>Reminders</SidebarItem>
              <SidebarItem icon={<CommunityIcon className="h-5 w-5" />}>Community</SidebarItem>
              <SidebarItem icon={<ProfileIcon className="h-5 w-5" />}>Profile</SidebarItem>
              <SidebarItem icon={<SettingsIcon className="h-5 w-5" />}>Settings</SidebarItem>
            </div>

            <div className="mt-auto overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(37,97,69,0.08)_0%,rgba(37,97,69,0.02)_100%)] p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6c7a72]">Purpose</div>
              <p className="mt-3 text-sm leading-7 text-[#53635a]">
                People already live routines. ViaQuran helps them ask where Allah speaks about those routines so action turns into obedience.
              </p>
              <div className="mt-5 rounded-2xl bg-white px-4 py-4 text-sm leading-7 text-[#48564d]">
                “And say, do good, for Allah will see your deeds.”
              </div>
            </div>
          </aside>

          <div className="grid gap-5">
            <header className="rounded-[30px] border border-[#e6ddcf] bg-[linear-gradient(180deg,#fffefb_0%,#f7f2e8_100%)] px-5 py-5 shadow-[0_20px_55px_rgba(58,50,39,0.06)] md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6d7c73]">Assalamu Alaikum</div>
                  <h1 className="mt-2 font-serif text-[2rem] leading-tight text-[#17231c] md:text-[2.5rem]">
                    Match your daily life with Allah&apos;s message.
                  </h1>
                  <p className="mt-2 max-w-[64ch] text-sm leading-7 text-[#617168] md:text-[0.98rem]">
                    If you pray as routine, work as routine, parent as routine, or struggle as routine, this app helps you ask:
                    what does the Quran say about this, and how do I obey Allah through it step by step?
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-sm text-[#617168]">
                    <div>{formatFullDate()}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8a968f]">Non-profit by SoftThinkers</div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#256145] text-base font-semibold text-white">
                    {initials}
                  </div>
                </div>
              </div>
            </header>

            {(error || saveMessage || shareMessage) && (
              <div className="grid gap-3">
                {error ? (
                  <div className="rounded-[20px] border border-[#efc8c8] bg-[#fff5f5] px-4 py-3 text-sm text-[#8b3c3c]">
                    {error}
                  </div>
                ) : null}
                {saveMessage ? (
                  <div className="rounded-[20px] border border-[#cae0cf] bg-[#f3fbf5] px-4 py-3 text-sm text-[#256145]">
                    {saveMessage}
                  </div>
                ) : null}
                {shareMessage ? (
                  <div className="rounded-[20px] border border-[#cae0cf] bg-[#f3fbf5] px-4 py-3 text-sm text-[#256145]">
                    {shareMessage}
                  </div>
                ) : null}
              </div>
            )}

            <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_340px]">
              <div className="grid gap-5">
                <DashboardSection
                  title="Today's Overview"
                  subtitle="See your routines, your current alignment, and the Quran-linked moments that deserve attention today."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {overviewCards.map((card) => (
                      <StatCard
                        key={card.label}
                        icon={card.icon}
                        value={card.value}
                        label={card.label}
                        help={card.help}
                      />
                    ))}
                  </div>
                </DashboardSection>

                <DashboardSection
                  title="What is happening in your life right now?"
                  subtitle="Describe the routine, struggle, or question in ordinary language. ViaQuran will match it with ayah guidance, translation, and practical steps."
                  actions={
                    <div className="rounded-full bg-[#edf6f0] px-4 py-2 text-sm font-semibold text-[#256145]">
                      Alignment {alignment}%
                    </div>
                  }
                >
                  <form onSubmit={handleSubmit} className="grid gap-4">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="Example: I say my prayers, but often without understanding where Allah speaks about consistency, humility, or obedience in salah."
                      className="min-h-[160px] rounded-[24px] border border-[#ded6c8] bg-[#fffdf9] px-5 py-4 text-base leading-8 text-[#1e2b23] outline-none transition focus:border-[#256145]"
                    />

                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_INPUTS.map((item) => (
                        <ExampleChip key={item} value={item} onClick={setInput} />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={isReflecting}
                        className="inline-flex items-center gap-3 rounded-2xl bg-[#256145] px-5 py-3 text-base font-semibold text-white shadow-[0_18px_34px_rgba(37,97,69,0.18)] disabled:opacity-65"
                      >
                        <SparkIcon className="h-5 w-5" />
                        {isReflecting ? "Matching..." : "Match With Quran Guidance"}
                      </button>
                      <label className="inline-flex items-center gap-3 rounded-2xl border border-[#ddd7cb] bg-[#faf7f1] px-4 py-3 text-sm text-[#526158]">
                        <input
                          type="checkbox"
                          checked={postAnonymously}
                          onChange={(event) => setPostAnonymously(event.target.checked)}
                          className="h-4 w-4 rounded border-[#c7d0c5] text-[#256145]"
                        />
                        Allow anonymous community sharing
                      </label>
                    </div>
                  </form>
                </DashboardSection>

                <DashboardSection
                  title="Today's Routines"
                  subtitle="Every routine can carry an intention, a Quran connection, and one clear next step."
                  actions={<a href="#mobile-journey" className="text-sm font-semibold text-[#256145]">View mobile flow</a>}
                >
                  <div className="grid gap-3">
                    {ROUTINE_DECK.filter((item) => item.frequency === "Daily").map((routine) => (
                      <RoutineRow
                        key={routine.id}
                        routine={routine}
                        reference={routine.themeId === guidanceTheme.id ? quranReference : THEMES[routine.themeId].ayah.reference}
                        active={routine.id === activeRoutine.id}
                        done={completedSteps.length > 0 && routine.id === activeRoutine.id}
                        onSelect={() => setSelectedRoutineId(routine.id)}
                      />
                    ))}
                  </div>
                </DashboardSection>
              </div>

              <div className="grid gap-5">
                <DashboardSection
                  title="Daily Insight"
                  subtitle="The aim is not only to complete a task. The aim is to see where Allah speaks about it so the action becomes worship."
                  className="bg-[linear-gradient(180deg,#fffefb_0%,#f5efe3_100%)]"
                >
                  <div className="rounded-[24px] border border-[#e7dece] bg-white px-5 py-5">
                    {result?.ayah.arabic ? (
                      <div className="text-right font-serif text-[1.7rem] leading-[2] text-[#1c281f]">{result.ayah.arabic}</div>
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[#d7d0c3] bg-[#faf7f1] px-4 py-5 text-sm leading-7 text-[#647169]">
                        Submit a real routine or concern above to load the matched ayah, translation, and steps from the Quran API.
                      </div>
                    )}

                    <p className="mt-4 text-sm leading-7 text-[#415047]">{currentAyah.english}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Pill>{quranReference}</Pill>
                      <Pill>{themeLabel(guidanceTheme.id)}</Pill>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[24px] border border-[#e8dece] bg-[linear-gradient(180deg,#fbf7ef_0%,#f3ecdf_100%)] p-5">
                    <img src="/header.png" alt="Quran reflection illustration" className="h-44 w-full rounded-[18px] object-cover" />
                    <div className="mt-4 text-sm leading-7 text-[#526058]">
                      Prayer, work, study, family, and hardship should not remain empty habits. They should become acts shaped by Allah&apos;s words.
                    </div>
                  </div>
                </DashboardSection>

                <DashboardSection
                  title="Task Detail"
                  subtitle={`${activeRoutine.title} at ${activeRoutine.time}`}
                  className="bg-[linear-gradient(180deg,#f7fbf8_0%,#eef4ef_100%)]"
                >
                  <div className="rounded-[24px] bg-[#256145] px-5 py-5 text-white shadow-[0_18px_34px_rgba(37,97,69,0.18)]">
                    <div className="text-sm uppercase tracking-[0.12em] text-white/70">Intention (Niyyah)</div>
                    <div className="mt-3 text-lg font-semibold">{activeRoutine.intention}</div>
                    <p className="mt-3 text-sm leading-7 text-white/86">{activeRoutine.description}</p>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-[#dbe7dd] bg-white px-5 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6f7c73]">Quran Connection</div>
                      <div className="text-sm font-semibold text-[#256145]">{quranReference}</div>
                    </div>
                    {currentAyah.arabic ? (
                      <div className="mt-4 text-right font-serif text-[1.65rem] leading-[2] text-[#1d291f]">{currentAyah.arabic}</div>
                    ) : null}
                    <p className="mt-4 text-sm leading-7 text-[#334139]">{currentAyah.english}</p>
                    {currentAyah.urdu ? <p className="mt-3 text-sm leading-7 text-[#53625a]">{currentAyah.urdu}</p> : null}
                  </div>

                  <div className="mt-5 grid gap-3">
                    {activeSteps.map((step) => (
                      <ActionStep
                        key={step}
                        label={step}
                        completed={completedSteps.includes(step)}
                        onToggle={() => toggleStep(step)}
                      />
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSaveCurrent}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#96b4a3] bg-white px-4 py-3 text-sm font-semibold text-[#256145] disabled:opacity-65"
                    >
                      <BookmarkIcon className="h-5 w-5" />
                      {isSaving ? "Saving..." : "Save Reflection"}
                    </button>
                    <button
                      type="button"
                      onClick={handleShareCurrent}
                      disabled={isPublishing}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#256145] px-4 py-3 text-sm font-semibold text-white disabled:opacity-65"
                    >
                      <ShareIcon className="h-5 w-5" />
                      {isPublishing ? "Sharing..." : "Share It"}
                    </button>
                  </div>
                </DashboardSection>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
              <DashboardSection
                title="Community"
                subtitle="Users can ask publicly or anonymously. The goal is to build a reminder circle where routines become discussion, ayah verification, and practical improvement."
              >
                <form onSubmit={handlePublishNote} className="grid gap-4">
                  <input
                    value={postTitle}
                    onChange={(event) => setPostTitle(event.target.value)}
                    placeholder="Title for your routine, concern, or anonymous question"
                    className="rounded-[20px] border border-[#ddd7cb] bg-[#fffdf9] px-4 py-4 text-sm text-[#1e2b23] outline-none"
                  />
                  <textarea
                    value={postText}
                    onChange={(event) => setPostText(event.target.value)}
                    placeholder="Example: I pray regularly, but my heart is not present. Which ayah should shape my week so salah becomes obedience and not empty repetition?"
                    className="min-h-[180px] rounded-[24px] border border-[#ddd7cb] bg-[#fffdf9] px-4 py-4 text-sm leading-7 text-[#1e2b23] outline-none"
                  />
                  <label className="inline-flex items-center gap-3 rounded-[18px] border border-[#e2dbc9] bg-[#faf6ee] px-4 py-3 text-sm text-[#4f5d55]">
                    <input
                      type="checkbox"
                      checked={postAnonymously}
                      onChange={(event) => setPostAnonymously(event.target.checked)}
                      className="h-4 w-4 rounded border-[#c7d0c5] text-[#256145]"
                    />
                    Publish this anonymously
                  </label>
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#256145] px-5 py-3 text-sm font-semibold text-white disabled:opacity-65"
                  >
                    <CommunityIcon className="h-5 w-5" />
                    {isPublishing ? "Publishing..." : "Publish to Community"}
                  </button>
                </form>

                <div className="mt-6 grid gap-4">
                  {(communityPosts.length ? communityPosts : []).slice(0, 3).map((post) => (
                    <article key={post.id} className="rounded-[24px] border border-[#ece3d5] bg-[#fffdfa] px-5 py-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6e7a72]">
                          {themeLabel(post.themeId)}
                        </div>
                        <div className="text-xs text-[#7b8881]">{formatDate(post.createdAt)}</div>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#1c281f]">{post.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[#55645b]">{post.excerpt}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Pill>{post.authorName}</Pill>
                        <Pill>{post.roleLabel}</Pill>
                      </div>
                    </article>
                  ))}
                </div>
              </DashboardSection>

              <div className="grid gap-5">
                <DashboardSection
                  title="Add Routine"
                  subtitle="This form is for a real life input: the routine, time, and concept you want to understand through the Quran."
                >
                  <form onSubmit={handleAddRoutine} className="grid gap-4">
                    <input
                      value={routineTitle}
                      onChange={(event) => setRoutineTitle(event.target.value)}
                      placeholder="Task name, for example: Go to Work"
                      className="rounded-[18px] border border-[#ded7ca] bg-[#fffdf9] px-4 py-3 text-sm text-[#1e2b23] outline-none"
                    />
                    <div className="grid gap-4 md:grid-cols-3">
                      <select
                        value={routineFrequency}
                        onChange={(event) => setRoutineFrequency(event.target.value as RoutineFrequency)}
                        className="rounded-[18px] border border-[#ded7ca] bg-[#fffdf9] px-4 py-3 text-sm text-[#1e2b23] outline-none"
                      >
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                      <input
                        value={routineTime}
                        onChange={(event) => setRoutineTime(event.target.value)}
                        type="time"
                        className="rounded-[18px] border border-[#ded7ca] bg-[#fffdf9] px-4 py-3 text-sm text-[#1e2b23] outline-none"
                      />
                      <input
                        value={routineConcept}
                        onChange={(event) => setRoutineConcept(event.target.value)}
                        placeholder="Concept, for example: honesty, prayer, family"
                        className="rounded-[18px] border border-[#ded7ca] bg-[#fffdf9] px-4 py-3 text-sm text-[#1e2b23] outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isReflecting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#256145] px-5 py-3 text-sm font-semibold text-white disabled:opacity-65"
                    >
                      <PlusIcon className="h-5 w-5" />
                      {isReflecting ? "Building Quran match..." : "Create Quran Match"}
                    </button>
                  </form>
                </DashboardSection>

                <DashboardSection
                  title="Reflection"
                  subtitle="After reading the ayah, rate your effort honestly and keep a short note about what needs to improve."
                >
                  <div className="rounded-[24px] border border-[#e8dfd2] bg-[#fffdfa] px-5 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-[#1e2b23]">{activeRoutine.title}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7e8b84]">{activeRoutine.time}</div>
                      </div>
                      <Pill>{quranReference}</Pill>
                    </div>
                    <div className="mt-5 text-sm font-semibold text-[#29372f]">Did you act with the intention today?</div>
                    <div className="mt-3">
                      <StarRating rating={reflectionRating} onChange={setReflectionRating} />
                    </div>
                    <textarea
                      value={reflectionNote}
                      onChange={(event) => setReflectionNote(event.target.value)}
                      className="mt-4 min-h-[120px] w-full rounded-[20px] border border-[#ddd7ca] bg-white px-4 py-4 text-sm leading-7 text-[#2d3a32] outline-none"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveCurrent}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#256145] px-4 py-3 text-sm font-semibold text-white disabled:opacity-65"
                      >
                        <BookmarkIcon className="h-5 w-5" />
                        {isSaving ? "Saving..." : "Save Reflection"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(reflectionNote)
                            .then(() => setShareMessage("Reflection note copied to clipboard."))
                            .catch(() => setError("Clipboard access is not available in this browser."))
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#dad3c6] bg-[#faf6ef] px-4 py-3 text-sm font-semibold text-[#4f5e55]"
                      >
                        <NoteIcon className="h-5 w-5" />
                        Copy Note
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {savedItems.slice(0, 2).map((item) => (
                      <div key={item.id} className="rounded-[20px] border border-[#ece2d5] bg-white px-4 py-4">
                        <div className="text-sm font-semibold text-[#1f2c23]">{item.title}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.12em] text-[#7b8881]">{item.ayahReference}</div>
                        <p className="mt-3 text-sm leading-7 text-[#58665d]">{item.input}</p>
                      </div>
                    ))}
                    {savedItems.length === 0 ? (
                      <div className="rounded-[20px] border border-dashed border-[#ddd5c7] bg-[#fffdf9] px-4 py-6 text-sm leading-7 text-[#68756d] md:col-span-2">
                        Saved guidance will appear here after you store a matched reflection.
                      </div>
                    ) : null}
                  </div>
                </DashboardSection>
              </div>
            </section>

            <DashboardSection
              title="Why this website exists"
              subtitle="People often say their prayers as routine, work as routine, or handle family life as routine. The platform exists to help them understand where Allah speaks about those actions so obedience becomes informed, conscious, and beautiful."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[24px] border border-[#e8dfd2] bg-[#fffdfa] px-5 py-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">Prayer Example</div>
                  <p className="mt-3 text-sm leading-7 text-[#55645a]">
                    Someone may pray every day, but when they learn the Quranic command, warning, mercy, and reward around salah,
                    prayer stops feeling like empty repetition and starts feeling like obedience to Allah.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#e8dfd2] bg-[#fffdfa] px-5 py-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">Community Purpose</div>
                  <p className="mt-3 text-sm leading-7 text-[#55645a]">
                    Members can ask publicly or anonymously, share routines, compare improvement, and help verify which ayat and lessons truly match real life questions.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#e8dfd2] bg-[#fffdfa] px-5 py-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">Step-by-Step Growth</div>
                  <p className="mt-3 text-sm leading-7 text-[#55645a]">
                    Every user should eventually see their own chart, their weak areas, their next improvement action, and the ayah references that shape that path.
                  </p>
                </div>
              </div>
            </DashboardSection>

            <section id="mobile-journey" className="rounded-[30px] border border-[#e6ddcf] bg-[linear-gradient(180deg,#fffefb_0%,#f7f1e7_100%)] p-5 shadow-[0_20px_55px_rgba(58,50,39,0.06)] md:p-6">
              <div className="max-w-[760px]">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6e7a72]">Mobile Journey</div>
                <h2 className="mt-3 font-serif text-[2rem] text-[#17231c] md:text-[2.5rem]">
                  The same workflow is designed to read clearly on mobile.
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#607066] md:text-[0.98rem]">
                  These sections mirror the requested mobile flow: My Routines, Task Detail, Reminders, Community,
                  Add Routine, and Reflection. On smaller screens they stack naturally, and each card keeps the user focused on the Quran match.
                </p>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                <PhoneFrame title="My Routines" activeTab="routines">
                  <div className="inline-flex rounded-full bg-[#f2eee4] p-1 text-[12px]">
                    {(["Daily", "Weekly", "Monthly"] as RoutineFrequency[]).map((item) => (
                      <div
                        key={item}
                        className={joinClasses(
                          "rounded-full px-4 py-2",
                          item === routineFrequency ? "bg-[#256145] font-semibold text-white" : "text-[#69776f]",
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {filteredRoutines.map((routine) => (
                      <div key={routine.id} className="rounded-[22px] border border-[#ede4d7] bg-[#fffdfa] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-[#1f2c23]">{routine.title}</div>
                            <div className="mt-1 text-xs text-[#78867e]">{routine.time}</div>
                          </div>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#bfd5c3] text-[#256145]">
                            <CheckIcon className="h-4 w-4" />
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#5d6b63]">{routine.description}</p>
                      </div>
                    ))}
                  </div>
                </PhoneFrame>

                <PhoneFrame title="Task Detail" activeTab="routines">
                  <div className="rounded-[22px] bg-[#256145] px-4 py-4 text-white">
                    <div className="text-lg font-semibold">{activeRoutine.title}</div>
                    <div className="mt-1 text-sm text-white/80">{activeRoutine.time} - {activeRoutine.frequency}</div>
                  </div>
                  <div className="mt-4 text-sm font-semibold text-[#1f2c23]">Intention (Niyyah)</div>
                  <p className="mt-2 text-sm leading-7 text-[#5d6b63]">{activeRoutine.intention}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#1f2c23]">Quran Connections</div>
                    <div className="text-sm font-semibold text-[#256145]">{quranReference}</div>
                  </div>
                  {currentAyah.arabic ? (
                    <div className="mt-4 text-right font-serif text-[1.45rem] leading-[2] text-[#1d291f]">{currentAyah.arabic}</div>
                  ) : null}
                  <p className="mt-3 text-sm leading-7 text-[#334139]">{currentAyah.english}</p>
                  <div className="mt-4 rounded-[18px] bg-[#f6f3eb] px-4 py-4 text-sm leading-7 text-[#53625a]">
                    {activeExplanation}
                  </div>
                  <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#256145] px-4 py-3 text-sm font-semibold text-white">
                    <CheckIcon className="h-5 w-5" />
                    Mark as Done
                  </button>
                </PhoneFrame>

                <PhoneFrame title="Reminders" activeTab="dashboard">
                  <label className="flex items-center justify-between rounded-[18px] bg-[#f7f4ed] px-4 py-3">
                    <span className="text-sm font-semibold text-[#1f2c23]">Enable Reminders</span>
                    <span className="relative inline-flex h-6 w-11 rounded-full bg-[#256145]">
                      <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                    </span>
                  </label>
                  <div className="mt-4 text-sm font-semibold text-[#1f2c23]">Upcoming Reminders</div>
                  <div className="mt-3 grid gap-3">
                    {ROUTINE_DECK.slice(0, 4).map((routine) => (
                      <div key={routine.id} className="rounded-[20px] border border-[#ebe1d3] bg-white px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-[#1f2c23]">{routine.title}</div>
                            <div className="mt-1 text-xs text-[#7b8881]">{routine.time}</div>
                          </div>
                          <BellIcon className="h-5 w-5 text-[#256145]" />
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#5d6b63]">{routine.description}</p>
                      </div>
                    ))}
                  </div>
                </PhoneFrame>

                <PhoneFrame title="Community" activeTab="reflection">
                  <div className="inline-flex rounded-full bg-[#f2eee4] p-1 text-[12px]">
                    <div className="rounded-full bg-[#256145] px-4 py-2 font-semibold text-white">Discover</div>
                    <div className="rounded-full px-4 py-2 text-[#6f7c74]">My Submissions</div>
                  </div>
                  <div className="mt-4 text-sm font-semibold text-[#1f2c23]">Suggested Connections</div>
                  <div className="mt-3 grid gap-3">
                    {suggestedCommunityCards.map((item) => (
                      <div key={item.title} className="rounded-[20px] border border-[#ebe1d3] bg-white px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-[#1f2c23]">{item.title}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7b8881]">{themeLabel(item.themeId)}</div>
                          </div>
                          <Pill>{item.badge}</Pill>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[#5d6b63]">{item.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </PhoneFrame>

                <PhoneFrame title="Add Routine" activeTab="add">
                  <div className="grid gap-3">
                    <input
                      value={routineTitle}
                      onChange={(event) => setRoutineTitle(event.target.value)}
                      placeholder="Task name"
                      className="rounded-[16px] border border-[#ddd7ca] bg-[#fffdfa] px-4 py-3 text-sm text-[#1f2c23] outline-none"
                    />
                    <div className="inline-flex rounded-full bg-[#f2eee4] p-1 text-[12px]">
                      {(["Daily", "Weekly", "Monthly"] as RoutineFrequency[]).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setRoutineFrequency(item)}
                          className={joinClasses(
                            "rounded-full px-4 py-2",
                            item === routineFrequency ? "bg-[#256145] font-semibold text-white" : "text-[#6f7c74]",
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <input
                      type="time"
                      value={routineTime}
                      onChange={(event) => setRoutineTime(event.target.value)}
                      className="rounded-[16px] border border-[#ddd7ca] bg-[#fffdfa] px-4 py-3 text-sm text-[#1f2c23] outline-none"
                    />
                    <input
                      value={routineConcept}
                      onChange={(event) => setRoutineConcept(event.target.value)}
                      placeholder="Category / concept"
                      className="rounded-[16px] border border-[#ddd7ca] bg-[#fffdfa] px-4 py-3 text-sm text-[#1f2c23] outline-none"
                    />
                  </div>
                </PhoneFrame>

                <PhoneFrame title="Reflection" activeTab="reflection">
                  <div className="rounded-[20px] border border-[#ece3d5] bg-[#fffdfa] px-4 py-4">
                    <div className="font-semibold text-[#1f2c23]">{activeRoutine.title}</div>
                    <div className="mt-1 text-xs text-[#7b8881]">Today, {activeRoutine.time}</div>
                  </div>
                  <div className="mt-4 text-sm font-semibold text-[#1f2c23]">Did you act with the intention today?</div>
                  <div className="mt-3">
                    <StarRating rating={reflectionRating} onChange={setReflectionRating} />
                  </div>
                  <textarea
                    value={reflectionNote}
                    onChange={(event) => setReflectionNote(event.target.value)}
                    className="mt-4 min-h-[150px] w-full rounded-[20px] border border-[#ddd7ca] bg-white px-4 py-4 text-sm leading-7 text-[#2d3a32] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrent}
                    disabled={isSaving}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#256145] px-4 py-3 text-sm font-semibold text-white disabled:opacity-65"
                  >
                    <BookmarkIcon className="h-5 w-5" />
                    {isSaving ? "Saving..." : "Save Reflection"}
                  </button>
                </PhoneFrame>
              </div>
            </section>

            <footer className="rounded-[28px] border border-[#e4dbcc] bg-[linear-gradient(180deg,#fffefb_0%,#f4eee2_100%)] px-5 py-5 text-center shadow-[0_18px_45px_rgba(53,49,36,0.05)]">
              <div className="font-serif text-[1.6rem] text-[#1b281f]">ViaQuran</div>
              <p className="mt-3 text-sm leading-7 text-[#58665d]">
                A non-profit effort to help people relate their daily routines, decisions, worship, and struggles to the Quran with clarity and community.
              </p>
              <p className="mt-4 text-sm text-[#64736a]">
                Powered by SoftThinkers • <a href="https://www.softthinkers.com" className="font-semibold text-[#256145] hover:underline">www.softthinkers.com</a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </svg>
  );
}

function RoutineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function BookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v16H7a2.5 2.5 0 0 0-2.5 2.5V5.5Z" />
      <path d="M7 3v16" />
    </svg>
  );
}

function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function CommunityIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a3.5 3.5 0 0 1 0 6.74" />
    </svg>
  );
}

function ProfileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 2 1.5 3.3 3.6.3-2.7 2.5.8 3.6-3.2-1.8-3.2 1.8.8-3.6-2.7-2.5 3.6-.3L12 2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 3 2.7 5.46L20.8 9.3l-4.4 4.28 1.04 6.12L12 16.8 6.56 19.7l1.04-6.12L3.2 9.3l6.1-.84L12 3Z" />
    </svg>
  );
}

function FlameIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3c2.6 3 4 5.2 4 7.5A4 4 0 0 1 12 14a4 4 0 0 1-4-3.5C8 8 9.4 6 12 3Z" />
      <path d="M7.5 14.5A5.5 5.5 0 0 0 18 16.5c0-3-2-4.7-3.3-6.1" />
    </svg>
  );
}

function SparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
    </svg>
  );
}

function BookmarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 4h10v16l-5-3-5 3V4Z" />
    </svg>
  );
}

function ShareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M15 8a3 3 0 1 0-2.9-4H12a3 3 0 0 0 0 6Z" />
      <path d="M6 14a3 3 0 1 0-2.9-4H3a3 3 0 0 0 0 6Z" />
      <path d="M18 22a3 3 0 1 0-2.9-4H15a3 3 0 0 0 0 6Z" />
      <path d="m8.6 11.5 4.8-2.7" />
      <path d="m8.6 12.5 6.8 4" />
    </svg>
  );
}

function NoteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function DotsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}
