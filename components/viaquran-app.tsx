"use client";

import { useEffect, useState, useTransition } from "react";
import { Header } from "@/components/dashboard/header";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskCard } from "@/components/dashboard/task-card";
import { RoutineDashboardPayload } from "@/lib/types";

const DASHBOARD_USER_ID = "guest-demo";

function isErrorPayload(value: unknown): value is { error?: string } {
  return Boolean(value && typeof value === "object" && "error" in value);
}

function isRoutineDashboardPayload(value: unknown): value is RoutineDashboardPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "greetingName" in value &&
      "stats" in value &&
      "tasks" in value &&
      "insight" in value,
  );
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
  const [error, setError] = useState("");
  const [pendingRoutineId, setPendingRoutineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleRoutine = async (routineId: string, completed: boolean) => {
    setError("");
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

      const nextDashboard = await fetchDashboardPayload();
      startTransition(() => {
        setDashboard(nextDashboard);
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the routine.");
    } finally {
      setPendingRoutineId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setError("");
      setIsLoading(true);

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
          setError(
            loadError instanceof Error ? loadError.message : "Could not load the routine dashboard.",
          );
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
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-4 text-[#1d2b22] md:px-5 md:py-5">
      <div className="mx-auto max-w-[1540px]">
        <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_330px]">
          <Sidebar />

          <div className="grid gap-5">
            <Header
              greetingName={dashboard?.greetingName ?? "Ahmed"}
              subtitle={dashboard?.subtitle ?? "Turn your daily routine into acts of worship"}
              dateLabel={dashboard?.dateLabel ?? "Loading..."}
              hijriDateLabel={dashboard?.hijriDateLabel ?? "Loading..."}
            />

            {error ? (
              <section className="rounded-[28px] border border-[#e7c6c6] bg-[#fff5f5] px-5 py-4 text-sm text-[#8b3c3c] shadow-[0_14px_35px_rgba(51,45,35,0.05)] md:px-6">
                {error}
              </section>
            ) : null}

            <section className="rounded-[28px] border border-[#e8e1d4] bg-white p-5 shadow-[0_14px_35px_rgba(51,45,35,0.05)] md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[#1f2c23]">Today&apos;s Overview</div>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6f7d75]">
                  {dashboard ? `${dashboard.storageMode} storage` : "Syncing..."}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {dashboard?.stats.map((stat) => (
                  <StatCard
                    key={stat.label}
                    value={stat.value}
                    label={stat.label}
                    description={stat.description}
                    icon={stat.icon}
                  />
                )) ?? []}
              </div>

              {isLoading && !dashboard ? (
                <div className="mt-4 text-sm text-[#748179]">Loading today&apos;s overview...</div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-[#e8e1d4] bg-white p-5 shadow-[0_14px_35px_rgba(51,45,35,0.05)] md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#1f2c23]">Today&apos;s Routines</div>
                  <div className="mt-2 text-sm text-[#748179]">
                    Connect each routine with intention and Quran guidance.
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#e3dbcf] bg-[#faf7f2] px-4 py-2 text-sm font-medium text-[#4d5c54] transition hover:border-[#256145] hover:text-[#256145]"
                >
                  View All
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {dashboard?.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    time={task.time}
                    intention={task.intention}
                    quranConnections={task.quranConnections}
                    completed={task.completed}
                    onToggle={() => void handleToggleRoutine(task.id, task.completed)}
                    disabled={pendingRoutineId === task.id || isPending}
                  />
                )) ?? []}
              </div>

              {isLoading && !dashboard ? (
                <div className="mt-4 text-sm text-[#748179]">Loading today&apos;s routines...</div>
              ) : null}
            </section>
          </div>

          <div className="hidden xl:block">
            <InsightCard
              arabic={dashboard?.insight.arabic ?? ""}
              translation={dashboard?.insight.translation ?? "Loading daily insight..."}
              reference={dashboard?.insight.reference ?? ""}
              buttonLabel={dashboard?.insight.buttonLabel ?? "Read Full Verse"}
            />
          </div>
        </div>

        <div className="mt-5 xl:hidden">
          <InsightCard
            arabic={dashboard?.insight.arabic ?? ""}
            translation={dashboard?.insight.translation ?? "Loading daily insight..."}
            reference={dashboard?.insight.reference ?? ""}
            buttonLabel={dashboard?.insight.buttonLabel ?? "Read Full Verse"}
          />
        </div>
      </div>
    </main>
  );
}
