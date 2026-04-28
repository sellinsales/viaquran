import {
  Bell,
  BookOpenText,
  CirclePlus,
  House,
  PenSquare,
  Settings,
  User,
  Users,
  CalendarRange,
  MoonStar,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: House, active: true },
  { label: "My Routines", icon: CalendarRange, active: false },
  { label: "Add Routine", icon: CirclePlus, active: false },
  { label: "Quran Connections", icon: BookOpenText, active: false },
  { label: "Reflections", icon: PenSquare, active: false },
  { label: "Reminders", icon: Bell, active: false },
  { label: "Community", icon: Users, active: false },
  { label: "Profile", icon: User, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function Sidebar() {
  return (
    <aside className="flex min-h-full flex-col rounded-[30px] border border-[#e9dfd1] bg-[#fffdf9] p-5 shadow-[0_16px_40px_rgba(62,48,24,0.08)] md:p-6 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#ebe1d4] bg-[#f9f4ea]">
          <img
            src="/logo_viaquran.png"
            alt="Quran Life Companion logo"
            className="h-12 w-12 object-contain"
          />
        </div>
        <div>
          <div className="font-serif text-[1.05rem] leading-tight text-[#1f2b23] md:text-[1.15rem]">
            Quran Life
          </div>
          <div className="mt-1 font-serif text-[1.05rem] leading-tight text-[#2c7a4d] md:text-[1.15rem]">
            Companion
          </div>
        </div>
      </div>

      <nav className="mt-8 grid gap-3">
        {menuItems.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href="#"
            className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-[1rem] font-medium transition ${
              active
                ? "bg-[#17683f] text-white shadow-[0_12px_28px_rgba(23,104,63,0.24)]"
                : "text-[#38473f] hover:bg-[#f5efe6] hover:text-[#17683f]"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto rounded-[24px] border border-[#ebe1d4] bg-[radial-gradient(circle_at_top_left,#f8fcf5_0%,#f5f0e6_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/70 p-3 text-[#78a165]">
            <img src="/logo_viaquran.png" alt="" className="h-10 w-10 object-contain opacity-70" />
          </div>
          <p className="text-sm leading-7 text-[#537058]">
            Every action with the right intention becomes worship.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[#6f8e63]">
            <MoonStar className="h-5 w-5" />
          </span>
        </div>
      </div>
    </aside>
  );
}
