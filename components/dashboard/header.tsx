import { Leaf } from "lucide-react";

export function Header({
  greetingName,
  subtitle,
  dateLabel,
  hijriDateLabel,
}: {
  greetingName: string;
  subtitle: string;
  dateLabel: string;
  hijriDateLabel: string;
}) {
  return (
    <header className="rounded-[28px] border border-[#e8e1d4] bg-white px-5 py-5 shadow-[0_14px_35px_rgba(51,45,35,0.05)] md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[1.9rem] font-semibold leading-tight text-[#1c2a21] md:text-[2.2rem]">
            <span>Assalamu Alaikum, {greetingName}</span>
            <Leaf className="h-5 w-5 text-[#256145]" />
          </div>
          <div className="mt-2 text-sm text-[#738078]">
            {subtitle}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm text-[#6f7d75]">
            <div>{dateLabel}</div>
            <div className="mt-1">{hijriDateLabel}</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#256145] text-sm font-semibold text-white">
            {greetingName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
