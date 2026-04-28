"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  BookOpen,
  CirclePlus,
  Heart,
  PenSquare,
} from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskCard } from "@/components/dashboard/task-card";
import { RoutineDashboardPayload, ThemeId } from "@/lib/types";

const DASHBOARD_USER_ID = "guest-demo";

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
  const response = await fetch(`/api/dashboard?userId=${DASHBOARD_USER_ID}`, {
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

export function ViaQuranApp() {
  const [dashboard, setDashboard] = useState<RoutineDashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [pendingRoutineId, setPendingRoutineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const routinesRef = useRef<HTMLElement | null>(null);

  const refreshDashboard = async () => {
    const payload = await fetchDashboardPayload();
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
          userId: DASHBOARD_USER_ID,
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
          userId: DASHBOARD_USER_ID,
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
          userId: DASHBOARD_USER_ID,
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
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setNotice(null);

      try {
        const payload = await fetchDashboardPayload();
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
  }, [startTransition]);

  return (
    <main className="min-h-screen bg-[#f6f1e7] p-3 text-[#1d2b22] md:p-5">
      <div className="mx-auto max-w-[1540px] grid gap-4 xl:grid-cols-[256px_minmax(0,1fr)]">
        <Sidebar />

        <section className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#fffdf9] shadow-[0_20px_60px_rgba(62,48,24,0.08)]">
          <Header
            greetingName={dashboard?.greetingName ?? "Ahmed"}
            subtitle={dashboard?.subtitle ?? "Turn your daily routine into acts of worship"}
            dateLabel={dashboard?.dateLabel ?? "Loading..."}
            hijriDateLabel={dashboard?.hijriDateLabel ?? "Loading..."}
            profileName={dashboard?.profileName ?? "Ahmed"}
            profileInitials={dashboard?.profileInitials ?? "A"}
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
    </main>
  );
}
