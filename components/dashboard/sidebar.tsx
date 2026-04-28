const menuItems = [
  "Dashboard",
  "My Routines",
  "Add Routine",
  "Quran Connections",
  "Reflections",
  "Reminders",
  "Community",
  "Profile",
  "Settings",
];

export function Sidebar() {
  return (
    <aside className="rounded-[32px] border border-[#e8e0d3] bg-white p-5 shadow-[0_18px_40px_rgba(51,45,35,0.06)] xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)] xl:overflow-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ebe2d6] bg-[#fbf8f1]">
          <img src="/logo_viaquran.png" alt="Quran Life Companion logo" className="h-10 w-10 object-contain" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-tight text-[#1f2c23]">Quran Life</div>
          <div className="text-sm text-[#738078]">Companion</div>
        </div>
      </div>

      <nav className="mt-8 grid gap-2">
        {menuItems.map((item, index) => {
          const active = index === 0;
          return (
            <a
              key={item}
              href="#"
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-[#256145] text-white shadow-[0_12px_28px_rgba(37,97,69,0.2)]"
                  : "text-[#4b5a51] hover:bg-[#f7f3ec] hover:text-[#256145]"
              }`}
            >
              {item}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
