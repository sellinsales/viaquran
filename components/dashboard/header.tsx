export function Header() {
  return (
    <header className="rounded-[28px] border border-[#e8e1d4] bg-white px-5 py-5 shadow-[0_14px_35px_rgba(51,45,35,0.05)] md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[1.9rem] font-semibold leading-tight text-[#1c2a21] md:text-[2.2rem]">
            Assalamu Alaikum, Ahmed
          </div>
          <div className="mt-2 text-sm text-[#738078]">
            Turn your daily routine into acts of worship
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm text-[#6f7d75]">
            <div>May 18, 2025</div>
            <div className="mt-1">19 Dhul Qa&apos;dah 1446</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#256145] text-sm font-semibold text-white">
            AH
          </div>
        </div>
      </div>
    </header>
  );
}
