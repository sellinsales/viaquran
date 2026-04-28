export function TaskCard({
  title,
  time,
  intention,
  quranConnections,
  completed,
}: {
  title: string;
  time: string;
  intention: string;
  quranConnections: string;
  completed: boolean;
}) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-[#ebe4d8] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(51,45,35,0.04)] md:grid-cols-[auto_minmax(0,180px)_minmax(0,1fr)_auto] md:items-center">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
            completed
              ? "border-[#256145] bg-[#256145] text-white"
              : "border-[#d8d2c6] bg-white text-transparent"
          }`}
        >
          x
        </span>
        <div>
          <div className="text-base font-semibold text-[#1f2d24]">{title}</div>
          <div className="mt-1 text-sm text-[#75827b]">{time}</div>
        </div>
      </div>

      <div className="text-sm leading-6 text-[#5a685f]">
        <span className="font-semibold text-[#2b3930]">Intention:</span> {intention}
      </div>

      <div className="text-sm text-[#6a7770]">{quranConnections}</div>

      <button
        type="button"
        className="justify-self-start rounded-full border border-[#e2dbcf] bg-[#faf7f2] px-4 py-2 text-sm font-medium text-[#4d5c54] transition hover:border-[#256145] hover:text-[#256145] md:justify-self-end"
      >
        View
      </button>
    </div>
  );
}
