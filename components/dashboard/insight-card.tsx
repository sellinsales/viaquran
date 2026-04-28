import { ArrowRight } from "lucide-react";

export function InsightCard({
  arabic,
  translation,
  reference,
  buttonLabel,
}: {
  arabic: string;
  translation: string;
  reference: string;
  buttonLabel: string;
}) {
  return (
    <section className="rounded-[28px] border border-[#e7dfd2] bg-white p-5 shadow-[0_18px_40px_rgba(52,46,35,0.06)]">
      <div className="text-sm font-semibold text-[#256145]">Daily Insight</div>

      <div className="mt-5 rounded-[24px] bg-[#fbf8f1] px-4 py-5">
        <div className="text-right font-serif text-[1.65rem] leading-[2.1] text-[#1d2b22]">
          {arabic}
        </div>
        <p className="mt-4 text-sm leading-7 text-[#415046]">{translation}</p>
        <div className="mt-4 text-sm font-semibold text-[#6f7d75]">{reference}</div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-[#efe6d9] bg-[linear-gradient(180deg,#f9f5ec_0%,#f3ecdf_100%)] px-4 py-5 text-center">
        <img
          src="/logo_viaquran.png"
          alt="Quran illustration"
          className="mx-auto h-36 w-36 object-contain"
        />
      </div>

      <button
        type="button"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#256145] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5139]"
      >
        {buttonLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
