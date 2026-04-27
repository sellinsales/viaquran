import { AyahPayload } from "@/lib/types";

export function QuranMatchCard({
  ayah,
  title = "Matched ayah",
  eyebrow = "Quran guidance",
  explanation,
  actionSteps,
}: {
  ayah: AyahPayload;
  title?: string;
  eyebrow?: string;
  explanation?: string;
  actionSteps?: string[];
}) {
  return (
    <div className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">{eyebrow}</div>
      <h3 className="mt-4 font-serif text-[2rem] leading-tight text-[#1b241e]">{title}</h3>

      <div className="mt-5 rounded-[28px] border border-[#ece4d6] bg-[linear-gradient(180deg,#fffdf9_0%,#f7f1e6_100%)] p-6">
        <div className="text-right font-serif text-[2rem] leading-[2.2] text-[#1c251f] md:text-[2.3rem]">
          {ayah.arabic}
        </div>
        <p className="mt-5 text-[1.05rem] leading-8 text-[#2d352f]">{ayah.english}</p>
        {ayah.urdu ? <p className="mt-3 text-[1rem] leading-8 text-[#4f5c53]">{ayah.urdu}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="rounded-full bg-[#edf6ef] px-3 py-2 text-sm font-semibold text-[#1f6a4d]">
            {ayah.reference}
          </div>
          <div className="rounded-full border border-[#ddd7cb] bg-white px-3 py-2 text-sm font-medium text-[#5b665e]">
            {ayah.source}
          </div>
        </div>
      </div>

      {explanation ? (
        <div className="mt-5 rounded-[22px] border border-[#e4dece] bg-[#faf7f1] px-5 py-5">
          <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#708176]">Why this match matters</div>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#56625a]">{explanation}</p>
        </div>
      ) : null}

      {actionSteps?.length ? (
        <div className="mt-5 rounded-[22px] border border-[#dfe8dd] bg-[#fbfcfa] px-5 py-5">
          <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#718077]">Step-by-step guidance</div>
          <div className="mt-4 grid gap-3">
            {actionSteps.map((step, index) => (
              <div key={step} className="rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-[#3d463f]">
                <span className="mr-2 font-semibold text-[#1f6a4d]">Step {index + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
