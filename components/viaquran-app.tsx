"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CirclePlus,
  KeyRound,
  Heart,
  Lock,
  PenSquare,
  UserRound,
  X,
} from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskCard } from "@/components/dashboard/task-card";
import { RoutineDashboardPayload, ThemeId } from "@/lib/types";

const SESSION_STORAGE_KEY = "viaquran.session";

interface DashboardSession {
  userId: string;
  displayName: string;
}

function isErrorPayload(value: unknown): value is { error?: string } {
  return Boolean(value && typeof value === "object" && "error" in value);
}

function isRoutineDashboardPayload(value: unknown): value is RoutineDashboardPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "greetingName" in value &&
      "profileName" in value &&
      "stats" in value &&
      "tasks" in value &&
      "insight" in value &&
      "reminder" in value &&
      "quickReflection" in value,
  );
}

function inferThemeId(title: string, intention: string): ThemeId {
  const combined = `${title} ${intention}`.toLowerCase();

  if (combined.includes("work") || combined.includes("income") || combined.includes("truth")) {
    return "honesty";
  }

  if (combined.includes("study") || combined.includes("learn") || combined.includes("knowledge")) {
    return "patience";
  }

  if (combined.includes("exercise") || combined.includes("health") || combined.includes("body")) {
    return "trust";
  }

  if (combined.includes("family") || combined.includes("love") || combined.includes("bonds")) {
    return "anger";
  }

  if (combined.includes("prayer") || combined.includes("allah") || combined.includes("tahajjud")) {
    return "sadness";
  }

  return "gratitude";
}

function buildVerseUrl(reference: string) {
  const match = reference.match(/(\d+):(\d+)/);
  if (!match) {
    return null;
  }

  return `https://quran.com/${match[1]}/${match[2]}`;
}

async function fetchDashboardPayload() {
  return fetchDashboardPayloadForUser("guest-demo");
}

async function fetchDashboardPayloadForUser(userId: string) {
  const response = await fetch(`/api/dashboard?userId=${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok || isErrorPayload(payload) || !isRoutineDashboardPayload(payload)) {
    throw new Error(
      isErrorPayload(payload)
        ? payload.error ?? "Could not load the routine dashboard."
        : "Could not load the routine dashboard.",
    );
  }

  return payload;
}

function normalizeSession(value: Partial<DashboardSession> | null | undefined): DashboardSession {
  const userId = value?.userId?.trim() || "guest-demo";
  const displayName = value?.displayName?.trim() || "Ahmed";

  return {
    userId,
    displayName,
  };
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "A";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

export function ViaQuranApp() {
  const [session, setSession] = useState<DashboardSession>(() => normalizeSession(null));
  const [sessionReady, setSessionReady] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<DashboardSession>(() => normalizeSession(null));
  const [liveTimeLabel, setLiveTimeLabel] = useState("");
  const [dashboard, setDashboard] = useState<RoutineDashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [pendingRoutineId, setPendingRoutineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const routinesRef = useRef<HTMLElement | null>(null);

  const refreshDashboard = async () => {
    const payload = await fetchDashboardPayloadForUser(session.userId);
    startTransition(() => {
      setDashboard(payload);
    });
  };

  const handleToggleRoutine = async (routineId: string, completed: boolean) => {
    setNotice(null);
    setPendingRoutineId(routineId);

    try {
      const response = await fetch(`/api/routines/${routineId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.userId,
          completed: !completed,
        }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || isErrorPayload(payload)) {
        throw new Error(
          isErrorPayload(payload)
            ? payload.error ?? "Could not update the routine."
            : "Could not update the routine.",
        );
      }

      await refreshDashboard();
    } catch (updateError) {
      setNotice({
        tone: "error",
        message:
          updateError instanceof Error ? updateError.message : "Could not update the routine.",
      });
    } finally {
      setPendingRoutineId(null);
    }
  };

  const handleAddRoutine = async () => {
    const title = window.prompt("Routine title");
    if (!title?.trim()) {
      return;
    }

    const time = window.prompt("Time", "7:00 AM");
    if (!time?.trim()) {
      return;
    }

    const intention = window.prompt("Intention", "To make this action sincerely for Allah.");
    if (!intention?.trim()) {
      return;
    }

    setNotice(null);

    try {
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.userId,
          title: title.trim(),
          time: time.trim(),
          intention: intention.trim(),
          quranConnectionCount: 2,
          completed: false,
          themeId: inferThemeId(title, intention),
          frequency: "daily",
        }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || isErrorPayload(payload)) {
        throw new Error(
          isErrorPayload(payload)
            ? payload.error ?? "Could not create the routine."
            : "Could not create the routine.",
        );
      }

      await refreshDashboard();
      setNotice({
        tone: "success",
        message: "Routine added to today's schedule.",
      });
    } catch (createError) {
      setNotice({
        tone: "error",
        message:
          createError instanceof Error ? createError.message : "Could not create the routine.",
      });
    }
  };

  const handleWriteReflection = async () => {
    const input = window.prompt("How was your day?");
    if (!input?.trim()) {
      return;
    }

    setNotice(null);

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.userId,
          input: input.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || isErrorPayload(payload)) {
        throw new Error(
          isErrorPayload(payload)
            ? payload.error ?? "Could not save the reflection."
            : "Could not save the reflection.",
        );
      }

      await refreshDashboard();
      setNotice({
        tone: "success",
        message: "Reflection saved and dashboard updated.",
      });
    } catch (reflectionError) {
      setNotice({
        tone: "error",
        message:
          reflectionError instanceof Error
            ? reflectionError.message
            : "Could not save the reflection.",
      });
    }
  };

  const handleOpenInsight = () => {
    if (!dashboard) {
      return;
    }

    const verseUrl = buildVerseUrl(dashboard.insight.reference);
    if (verseUrl) {
      window.open(verseUrl, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DashboardSession>;
        const normalized = normalizeSession(parsed);
        setSession(normalized);
        setProfileDraft(normalized);
      }
    } catch {
      // Ignore invalid local session payloads and fall back to guest demo mode.
    } finally {
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      setLiveTimeLabel(
        new Intl.DateTimeFormat("en", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setNotice(null);

      try {
        const payload = await fetchDashboardPayloadForUser(session.userId);
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setDashboard(payload);
        });
      } catch (loadError) {
        if (!cancelled) {
          setNotice({
            tone: "error",
            message:
              loadError instanceof Error
                ? loadError.message
                : "Could not load the routine dashboard.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [session.userId, sessionReady, startTransition]);

  const handleProfileSave = () => {
    const nextSession = normalizeSession(profileDraft);
    setSession(nextSession);
    setProfileDraft(nextSession);
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setIsProfileOpen(false);
    setNotice({
      tone: "success",
      message:
        nextSession.userId === "guest-demo"
          ? "Guest demo mode enabled."
          : `Live user session set to ${nextSession.displayName}.`,
    });
  };

  const handleUseGuestDemo = () => {
    const nextSession = normalizeSession({ userId: "guest-demo", displayName: "Ahmed" });
    setSession(nextSession);
    setProfileDraft(nextSession);
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setIsProfileOpen(false);
    setNotice({
      tone: "success",
      message: "Switched back to guest demo mode.",
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f1e7] p-3 text-[#1d2b22] md:p-5">
      <div className="mx-auto max-w-[1540px] grid gap-4 lg:grid-cols-[256px_minmax(0,1fr)]">
        <Sidebar />

        <section className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#fffdf9] shadow-[0_20px_60px_rgba(62,48,24,0.08)]">
          <Header
            greetingName={session.displayName}
            subtitle={dashboard?.subtitle ?? "Turn your daily routine into acts of worship"}
            dateLabel={dashboard?.dateLabel ?? "Loading..."}
            hijriDateLabel={dashboard?.hijriDateLabel ?? "Loading..."}
            timeLabel={liveTimeLabel || "Loading time..."}
            profileName={session.displayName}
            profileInitials={getInitials(session.displayName)}
            storageMode={dashboard?.storageMode ?? "file"}
            onOpenProfile={() => setIsProfileOpen(true)}
          />

          {notice ? (
            <div className="px-5 pt-5 md:px-8">
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  notice.tone === "error"
                    ? "border-[#ebc8c8] bg-[#fff5f5] text-[#8b3c3c]"
                    : "border-[#cde5d4] bg-[#f4fbf6] text-[#256145]"
                }`}
              >
                {notice.message}
              </div>
            </div>
          ) : null}

          {dashboard?.storageMode === "file" ? (
            <div className="px-5 pt-5 md:px-8">
              <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-[#eddcbe] bg-[#fff8ec] px-4 py-3 text-sm text-[#77581b]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">Live MySQL is not active.</div>
                  <div className="mt-1">
                    Set `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `VIAQURAN_STORAGE_MODE=mysql`
                    in your environment to switch from local file demo mode to the real database.
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:p-7">
            <div className="grid gap-5">
              <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {dashboard?.stats.map((stat) => <StatCard key={stat.label} {...stat} />) ?? []}
              </section>

              {isLoading && !dashboard ? (
                <div className="rounded-[24px] border border-[#eadfce] bg-white px-5 py-4 text-sm text-[#6a7670] shadow-[0_10px_28px_rgba(62,48,24,0.06)]">
                  Loading dashboard...
                </div>
              ) : null}

              <section
                ref={routinesRef}
                className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_14px_35px_rgba(62,48,24,0.07)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#edf6ef] text-[#256145]">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div className="text-[1.35rem] font-medium text-[#1f2d24]">Today&apos;s Routines</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => routinesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="rounded-xl border border-[#8cb499] px-4 py-2 text-[1rem] font-medium text-[#256145] transition hover:bg-[#f4fbf6]"
                  >
                    View All Routines
                  </button>
                </div>

                <div className="mt-5 grid gap-4">
                  {dashboard?.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      summary={task.summary}
                      time={task.time}
                      intention={task.intention}
                      quranConnections={task.quranConnections}
                      completed={task.completed}
                      themeId={task.themeId}
                      onToggle={() => void handleToggleRoutine(task.id, task.completed)}
                      disabled={pendingRoutineId === task.id || isPending}
                    />
                  )) ?? []}
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void handleAddRoutine()}
                    className="inline-flex items-center gap-3 text-[1.1rem] font-medium text-[#2d7a4b] transition hover:text-[#145836]"
                  >
                    <CirclePlus className="h-5 w-5" />
                    <span>Add New Routine</span>
                  </button>
                </div>
              </section>
            </div>

            <aside className="grid gap-5">
              <InsightCard
                arabic={dashboard?.insight.arabic ?? ""}
                translation={dashboard?.insight.translation ?? "Loading daily insight..."}
                reference={dashboard?.insight.reference ?? ""}
                buttonLabel={dashboard?.insight.buttonLabel ?? "Read Full Verse"}
                onOpen={handleOpenInsight}
              />

              <section className="rounded-[22px] border border-[#eadfce] bg-white p-5 shadow-[0_14px_35px_rgba(62,48,24,0.07)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 text-[1.05rem] font-medium text-[#1f2d24]">
                      <Bell className="h-4 w-4 text-[#2b7a49]" />
                      <span>{dashboard?.reminder.title ?? "Today's Reminder"}</span>
                    </div>
                    <p className="mt-3 text-[0.98rem] leading-8 text-[#55645c]">
                      {dashboard?.reminder.body ?? "Loading reminder..."}
                    </p>
                  </div>
                  <Heart className="mt-1 h-5 w-5 text-[#79a86d]" />
                </div>
              </section>

              <section className="rounded-[22px] border border-[#eadfce] bg-white p-5 shadow-[0_14px_35px_rgba(62,48,24,0.07)]">
                <div className="flex items-center gap-3 text-[1.05rem] font-medium text-[#1f2d24]">
                  <PenSquare className="h-4 w-4 text-[#1f2d24]" />
                  <span>{dashboard?.quickReflection.title ?? "Quick Reflection"}</span>
                </div>

                <p className="mt-3 text-[0.98rem] leading-8 text-[#55645c]">
                  {dashboard?.quickReflection.prompt ?? "How was your day?"}
                </p>

                {dashboard?.quickReflection.latestEntry ? (
                  <div className="mt-3 rounded-2xl bg-[#f8f4ec] px-4 py-3 text-sm leading-7 text-[#5c695f]">
                    Latest: {dashboard.quickReflection.latestEntry}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleWriteReflection()}
                  className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-[#9dc0a8] px-4 py-3 text-[1rem] font-medium text-[#256145] transition hover:bg-[#f4fbf6]"
                >
                  <PenSquare className="h-4 w-4" />
                  <span>{dashboard?.quickReflection.buttonLabel ?? "Write Reflection"}</span>
                </button>
              </section>
            </aside>
          </div>
        </section>
      </div>

      {isProfileOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(24,18,12,0.45)] p-4">
          <div className="w-full max-w-[460px] rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_24px_80px_rgba(24,18,12,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[1.4rem] font-semibold text-[#18251d]">Live User Session</div>
                <p className="mt-2 text-sm leading-7 text-[#5a685f]">
                  Set a real user identity for the dashboard. When MySQL is configured, this user will
                  get separate persisted routines, reflections, and progress.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eee6da] text-[#506157] transition hover:border-[#d8cbb7]"
                aria-label="Close profile dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#1f2d24]">
                  <UserRound className="h-4 w-4" />
                  <span>Display name</span>
                </span>
                <input
                  value={profileDraft.displayName}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[#e5dbcd] bg-[#fffdf9] px-4 py-3 text-base outline-none transition focus:border-[#2d7a4b]"
                  placeholder="Ahmed"
                />
              </label>

              <label className="grid gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#1f2d24]">
                  <KeyRound className="h-4 w-4" />
                  <span>User key</span>
                </span>
                <input
                  value={profileDraft.userId}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      userId: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-[#e5dbcd] bg-[#fffdf9] px-4 py-3 text-base outline-none transition focus:border-[#2d7a4b]"
                  placeholder="ahmed"
                />
              </label>

              <div className="rounded-2xl bg-[#f8f4ec] px-4 py-3 text-sm leading-7 text-[#5c695f]">
                `guest-demo` keeps using the demo identity. Any other `user key` becomes its own live
                user bucket.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleUseGuestDemo}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e2d8cb] px-4 py-3 text-sm font-medium text-[#53635a] transition hover:bg-[#f8f4ec]"
              >
                <Lock className="h-4 w-4" />
                <span>Use Guest Demo</span>
              </button>

              <button
                type="button"
                onClick={handleProfileSave}
                className="rounded-xl bg-[#17683f] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_24px_rgba(23,104,63,0.24)] transition hover:bg-[#145836]"
              >
                Save Live User
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
