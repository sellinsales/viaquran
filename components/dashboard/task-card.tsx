import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

export function TaskCard({
  title,
  time,
  intention,
  quranConnections,
  completed,
  onToggle,
  disabled = false,
}: {
  title: string;
  time: string;
  intention: string;
  quranConnections: string;
  completed: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-[#ebe4d8] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(51,45,35,0.04)] md:grid-cols-[auto_minmax(0,180px)_minmax(0,1fr)_auto] md:items-center">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="text-[#256145] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          aria-label={completed ? `Mark ${title} as incomplete` : `Mark ${title} as complete`}
        >
          {completed ? <CheckCircle2 className="h-9 w-9 fill-[#256145] text-white" /> : <Circle className="h-9 w-9 text-[#d1c9bb]" />}
        </button>
        <div>
          <div className="text-base font-semibold text-[#1f2d24]">{title}</div>
          <div className="mt-1 text-sm text-[#75827b]">{time}</div>
        </div>
      </div>

      <div className="text-sm leading-6 text-[#5a685f]">
        <span className="font-semibold text-[#2b3930]">Intention:</span> {intention}
      </div>

      <div className="text-sm text-[#6a7770]">{quranConnections}</div>

      <span className="flex items-center gap-1 justify-self-start rounded-full border border-[#e2dbcf] bg-[#faf7f2] px-4 py-2 text-sm font-medium text-[#4d5c54] md:justify-self-end">
        View <ChevronRight className="h-4 w-4" />
      </span>
    </div>
  );
}
