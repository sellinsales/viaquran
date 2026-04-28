import { BookOpen, CheckCircle2, Flame, LucideIcon, Star } from "lucide-react";

type IconName = "check" | "star" | "book" | "flame";

const ICON_MAP: Record<IconName, LucideIcon> = {
  check: CheckCircle2,
  star: Star,
  book: BookOpen,
  flame: Flame,
};

export function StatCard({
  value,
  label,
  description,
  icon,
}: {
  value: string;
  label: string;
  description: string;
  icon: IconName;
}) {
  const Icon = ICON_MAP[icon];

  return (
    <div className="rounded-[24px] border border-[#ece6da] bg-white p-5 shadow-[0_14px_35px_rgba(51,45,35,0.05)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#256145]">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="mt-5 text-[2rem] font-semibold leading-none text-[#1d2b22]">{value}</div>
      <div className="mt-2 text-sm font-semibold text-[#2a372f]">{label}</div>
      <div className="mt-1 text-xs text-[#7a877f]">{description}</div>
    </div>
  );
}
