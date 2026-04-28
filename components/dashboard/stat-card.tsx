import { ArrowUp, BookOpen, CheckCircle2, Flame, LucideIcon, Star } from "lucide-react";
import { DashboardStat } from "@/lib/types";

const ICON_MAP: Record<DashboardStat["icon"], LucideIcon> = {
  check: CheckCircle2,
  star: Star,
  book: BookOpen,
  flame: Flame,
};

const SURFACE_MAP: Record<
  DashboardStat["icon"],
  { iconBg: string; iconText: string; progressFill: string }
> = {
  check: {
    iconBg: "bg-[#eaf5ea]",
    iconText: "text-[#256145]",
    progressFill: "bg-[#5b9566]",
  },
  star: {
    iconBg: "bg-[#fff1cf]",
    iconText: "text-[#db9b14]",
    progressFill: "bg-[#db9b14]",
  },
  book: {
    iconBg: "bg-[#edf5ef]",
    iconText: "text-[#3f7d54]",
    progressFill: "bg-[#4d8d61]",
  },
  flame: {
    iconBg: "bg-[#eee6ff]",
    iconText: "text-[#7152d8]",
    progressFill: "bg-[#7152d8]",
  },
};

export function StatCard({
  value,
  label,
  description,
  icon,
  progressPercent,
  trendLabel,
  footerLabel,
}: DashboardStat) {
  const Icon = ICON_MAP[icon];
  const surface = SURFACE_MAP[icon];

  return (
    <article className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_14px_35px_rgba(62,48,24,0.07)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${surface.iconBg} ${surface.iconText}`}>
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </div>

        <div className="min-w-0">
          <div className="text-[2.2rem] font-semibold leading-none text-[#1b2a21]">{value}</div>
          <div className="mt-2 text-[1.05rem] font-medium leading-tight text-[#1f2d24]">{label}</div>
          <div className="mt-4 text-sm text-[#697870]">{description}</div>
        </div>
      </div>

      {typeof progressPercent === "number" ? (
        <div className="mt-5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ede7dc]">
            <div
              className={`h-full rounded-full ${surface.progressFill}`}
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
          <div className="text-sm font-medium text-[#697870]">{footerLabel}</div>
        </div>
      ) : null}

      {trendLabel ? (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#2a7b4a]">
          <ArrowUp className="h-4 w-4" />
          <span>{trendLabel}</span>
        </div>
      ) : null}

      {typeof progressPercent !== "number" && !trendLabel && footerLabel ? (
        <div className="mt-5 text-sm font-medium text-[#697870]">{footerLabel}</div>
      ) : null}
    </article>
  );
}
