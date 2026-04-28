import {
  BookOpen,
  BriefcaseBusiness,
  Check,
  Dumbbell,
  LucideIcon,
  MoonStar,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { ThemeId } from "@/lib/types";

function getTaskVisual(title: string, themeId: ThemeId): {
  icon: LucideIcon;
  bubbleClass: string;
  iconClass: string;
} {
  const normalized = title.toLowerCase();

  if (normalized.includes("work")) {
    return {
      icon: BriefcaseBusiness,
      bubbleClass: "bg-[#e7f3ea]",
      iconClass: "text-[#2f7f4a]",
    };
  }

  if (normalized.includes("study") || normalized.includes("learn")) {
    return {
      icon: BookOpen,
      bubbleClass: "bg-[#fff1cf]",
      iconClass: "text-[#cb9216]",
    };
  }

  if (normalized.includes("exercise") || normalized.includes("workout")) {
    return {
      icon: Dumbbell,
      bubbleClass: "bg-[#eaf6ef]",
      iconClass: "text-[#2d8654]",
    };
  }

  if (normalized.includes("family")) {
    return {
      icon: UsersRound,
      bubbleClass: "bg-[#efe7ff]",
      iconClass: "text-[#7653d8]",
    };
  }

  if (normalized.includes("prayer") || normalized.includes("tahajjud")) {
    return {
      icon: MoonStar,
      bubbleClass: "bg-[#ecebff]",
      iconClass: "text-[#5f62df]",
    };
  }

  if (themeId === "gratitude") {
    return {
      icon: Sparkles,
      bubbleClass: "bg-[#fff3d6]",
      iconClass: "text-[#cd9a1e]",
    };
  }

  return {
    icon: Sparkles,
    bubbleClass: "bg-[#edf5ef]",
    iconClass: "text-[#256145]",
  };
}

export function TaskCard({
  title,
  summary,
  time,
  intention,
  quranConnections,
  completed,
  themeId,
  onToggle,
  disabled = false,
}: {
  title: string;
  summary: string;
  time: string;
  intention: string;
  quranConnections: string;
  completed: boolean;
  themeId: ThemeId;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const visual = getTaskVisual(title, themeId);
  const Icon = visual.icon;

  return (
    <article className="rounded-[22px] border border-[#ece3d5] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(62,48,24,0.06)] md:px-5">
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,220px)_minmax(0,1fr)_170px_110px_auto] md:items-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${visual.bubbleClass}`}>
          <Icon className={`h-7 w-7 ${visual.iconClass}`} strokeWidth={2.1} />
        </div>

        <div className="min-w-0">
          <div className="text-[1.1rem] font-semibold text-[#1d2b22]">{title}</div>
          <div className="mt-1 text-base text-[#6a7670]">{summary}</div>
        </div>

        <div className="text-sm leading-7 text-[#4d5d54] md:border-l md:border-[#eee7da] md:pl-6">
          <div className="font-medium text-[#1f2d24]">Intention</div>
          <div className="mt-1">{intention}</div>
        </div>

        <div className="text-sm text-[#4d5d54] md:border-l md:border-[#eee7da] md:pl-6">
          <div className="font-medium text-[#1f2d24]">Quran Connection</div>
          <div className="mt-2 inline-flex items-center gap-2 text-[#2a7b4a]">
            <BookOpen className="h-4 w-4" />
            <span>{quranConnections}</span>
          </div>
        </div>

        <div className="text-xl font-medium text-[#1f2d24] md:justify-self-end">{time}</div>

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] border transition md:justify-self-end ${
            completed
              ? "border-[#1f6a3f] bg-[#1f6a3f] text-white"
              : "border-[#ddd6ca] bg-white text-transparent"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={completed ? `Mark ${title} as incomplete` : `Mark ${title} as complete`}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </article>
  );
}
