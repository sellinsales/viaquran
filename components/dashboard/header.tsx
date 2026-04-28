import { Bell, CalendarDays, ChevronDown, Database, Hand } from "lucide-react";

export function Header({
  greetingName,
  subtitle,
  dateLabel,
  hijriDateLabel,
  timeLabel,
  profileName,
  profileInitials,
  storageMode,
  onOpenProfile,
}: {
  greetingName: string;
  subtitle: string;
  dateLabel: string;
  hijriDateLabel: string;
  timeLabel: string;
  profileName: string;
  profileInitials: string;
  storageMode: "mysql" | "file";
  onOpenProfile: () => void;
}) {
  return (
    <header className="border-b border-[#ece3d5] px-5 py-5 md:px-8 md:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-[2rem] font-semibold leading-tight text-[#18251d] md:text-[2.15rem]">
            <span>Assalamu Alaikum, {greetingName}</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3db] text-[#d6972b]">
              <Hand className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-lg text-[#55635b]">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-start gap-3 rounded-full border border-[#eee6da] bg-white px-4 py-3">
            <CalendarDays className="mt-0.5 h-5 w-5 text-[#4d5f54]" />
            <div className="text-sm text-[#5b685f]">
              <div className="font-medium text-[#1f2d24]">{dateLabel}</div>
              <div className="mt-1">{hijriDateLabel}</div>
              <div className="mt-1 text-[#7a867f]">{timeLabel}</div>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium ${
              storageMode === "mysql"
                ? "border-[#cbe3d1] bg-[#f4fbf6] text-[#1e6a40]"
                : "border-[#ead9bf] bg-[#fff7eb] text-[#8c6a22]"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>{storageMode === "mysql" ? "MySQL Live" : "File Demo Mode"}</span>
          </div>

          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#eee6da] bg-white text-[#1f2d24] transition hover:border-[#d8cbb7]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-3 rounded-full border border-[#eee6da] bg-white px-3 py-2 text-left transition hover:border-[#d8cbb7]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1f6a3f] text-base font-semibold text-white">
              {profileInitials}
            </span>
            <span className="text-base font-medium text-[#1d2b22]">{profileName}</span>
            <ChevronDown className="h-4 w-4 text-[#66756c]" />
          </button>
        </div>
      </div>
    </header>
  );
}
