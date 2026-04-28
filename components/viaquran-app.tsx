import { Header } from "@/components/dashboard/header";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskCard } from "@/components/dashboard/task-card";
import { dailyInsight, dashboardStats, dashboardTasks } from "@/lib/mock-dashboard-data";

export function ViaQuranApp() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-4 text-[#1d2b22] md:px-5 md:py-5">
      <div className="mx-auto max-w-[1540px]">
        <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_330px]">
          <Sidebar />

          <div className="grid gap-5">
            <Header />

            <section className="rounded-[28px] border border-[#e8e1d4] bg-white p-5 shadow-[0_14px_35px_rgba(51,45,35,0.05)] md:p-6">
              <div className="text-sm font-semibold text-[#1f2c23]">Today&apos;s Overview</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {dashboardStats.map((stat) => (
                  <StatCard
                    key={stat.label}
                    value={stat.value}
                    label={stat.label}
                    description={stat.description}
                    icon={stat.icon}
                  />
                ))}
              </div>
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
                {dashboardTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    time={task.time}
                    intention={task.intention}
                    quranConnections={task.quranConnections}
                    completed={task.completed}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="hidden xl:block">
            <InsightCard
              arabic={dailyInsight.arabic}
              translation={dailyInsight.translation}
              reference={dailyInsight.reference}
              buttonLabel={dailyInsight.buttonLabel}
            />
          </div>
        </div>

        <div className="mt-5 xl:hidden">
          <InsightCard
            arabic={dailyInsight.arabic}
            translation={dailyInsight.translation}
            reference={dailyInsight.reference}
            buttonLabel={dailyInsight.buttonLabel}
          />
        </div>
      </div>
    </main>
  );
}
