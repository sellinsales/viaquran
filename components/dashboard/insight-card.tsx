import { BookOpen, Sparkles } from "lucide-react";

export function InsightCard({
  arabic,
  translation,
  reference,
  buttonLabel,
  onOpen,
}: {
  arabic: string;
  translation: string;
  reference: string;
  buttonLabel: string;
  onOpen?: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_14px_35px_rgba(62,48,24,0.07)]">
      <div className="flex items-center gap-3 text-[#1f2d24]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fff2d3] text-[#d89a18]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="text-[1.1rem] font-medium">Daily Quranic Insight</div>
      </div>

      <div className="mt-6 px-3 text-center">
        <div className="font-serif text-[2.2rem] leading-[1.9] text-[#1d6b3f]">{arabic}</div>
        <div className="mx-auto mt-5 h-px w-28 bg-[linear-gradient(90deg,transparent,#d9cfbe,transparent)]" />
        <p className="mt-6 text-[1.02rem] leading-9 text-[#4e5e55]">{translation}</p>
        <div className="mt-5 text-[1.05rem] font-medium text-[#2b7a49]">{reference}</div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-[#efe5d7] bg-[radial-gradient(circle_at_top,#fffdf6_0%,#f5ecde_100%)]">
        <img
          src="/header.png"
          alt="Open Quran with lantern"
          className="h-48 w-full object-cover object-[78%_88%]"
        />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#17683f] px-4 py-3.5 text-[1rem] font-medium text-white shadow-[0_14px_24px_rgba(23,104,63,0.24)] transition hover:bg-[#145836]"
      >
        <BookOpen className="h-5 w-5" />
        <span>{buttonLabel}</span>
      </button>
    </section>
  );
}
