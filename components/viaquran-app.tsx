"use client";

import { FormEvent, ReactNode, SVGProps, useEffect, useMemo, useState, useTransition } from "react";
import { EXAMPLE_INPUTS, THEMES } from "@/lib/theme-data";
import { detectTheme } from "@/lib/theme-engine";
import { DashboardPayload, ReflectionResult } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement>;

const TOPICS = [
  "Patience",
  "Gratitude",
  "Family",
  "Work & Earning",
  "Marriage",
  "Parenting",
  "Kindness",
  "Forgiveness",
  "Anxiety & Peace",
  "Worship & Salah",
];

const ROUTINES = [
  {
    title: "Morning",
    time: "6:00 AM - 9:00 AM",
    verses: "8 Verses",
    background:
      "linear-gradient(135deg, rgba(243, 178, 86, 0.75), rgba(31, 93, 59, 0.2)), linear-gradient(180deg, #f6d59f 0%, #7ca16d 100%)",
  },
  {
    title: "Work",
    time: "9:00 AM - 5:00 PM",
    verses: "12 Verses",
    background:
      "linear-gradient(135deg, rgba(138, 112, 77, 0.45), rgba(31, 93, 59, 0.25)), linear-gradient(180deg, #cab293 0%, #6f5c4d 100%)",
  },
  {
    title: "Family Time",
    time: "5:00 PM - 8:00 PM",
    verses: "10 Verses",
    background:
      "linear-gradient(135deg, rgba(196, 133, 84, 0.45), rgba(53, 32, 20, 0.25)), linear-gradient(180deg, #d4b190 0%, #7b5844 100%)",
  },
  {
    title: "Night Reflection",
    time: "9:00 PM - 11:00 PM",
    verses: "7 Verses",
    background:
      "linear-gradient(135deg, rgba(15, 31, 52, 0.2), rgba(145, 110, 42, 0.4)), linear-gradient(180deg, #2b2a34 0%, #59411f 100%)",
  },
];

const BENEFITS = [
  {
    title: "Personalized Recommendations",
    text: "Get verses that match your life and goals.",
    icon: CompassIcon,
  },
  {
    title: "Save & Reflect",
    text: "Bookmark verses and write your reflections.",
    icon: NoteIcon,
  },
  {
    title: "Track Your Growth",
    text: "Build consistency and strengthen your imaan.",
    icon: ChartIcon,
  },
  {
    title: "Community Support",
    text: "Connect with others on the same journey.",
    icon: CommunityIcon,
  },
];

function createGuestId() {
  if (typeof window === "undefined") {
    return "guest-demo";
  }

  try {
    const stored = window.localStorage.getItem("viaquran-user-id");
    if (stored) {
      return stored;
    }

    const secureUuid =
      typeof window.crypto !== "undefined" && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID().slice(0, 8)
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const nextId = `guest-${secureUuid}`;
    window.localStorage.setItem("viaquran-user-id", nextId);
    return nextId;
  } catch {
    return `guest-${Date.now().toString(36)}`;
  }
}

function themeLabel(themeId: keyof typeof THEMES) {
  return THEMES[themeId].label;
}

function isErrorPayload(
  payload: ReflectionResult | { error?: string } | null,
): payload is { error?: string } {
  return Boolean(payload && typeof payload === "object" && "error" in payload);
}

function NavIconButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e2dac9] bg-white text-[#173c2f] transition hover:border-[#1f6a4d]/30"
    >
      {children}
    </button>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="font-serif text-[1.9rem] leading-tight text-[#18211b]">{title}</h2>
      <button type="button" className="text-sm font-semibold text-[#1f6a4d]">
        {action}
      </button>
    </div>
  );
}

export function ViaQuranApp() {
  const [userId, setUserId] = useState("guest-demo");
  const [input, setInput] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [result, setResult] = useState<ReflectionResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const nextUserId = createGuestId();
    setUserId(nextUserId);

    fetch(`/api/today?userId=${encodeURIComponent(nextUserId)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: DashboardPayload) => setDashboard(payload))
      .catch(() => {
        setError("Could not load today's guidance.");
      });
  }, []);

  const liveTheme = useMemo(() => detectTheme(input || "patience"), [input]);
  const quickStats = result?.progress ?? dashboard?.progress;
  const recentEntries = result?.recentEntries ?? dashboard?.recentEntries ?? [];
  const activeGuidance = result?.dailyGuidance ?? dashboard?.dailyGuidance;
  const heroTheme = result?.theme ?? liveTheme;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, userId }),
      }).catch(() => null);

      if (!response) {
        setError("Network error while generating guidance.");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | ReflectionResult
        | { error?: string }
        | null;

      if (!response.ok || !payload) {
        setError("Could not generate guidance.");
        return;
      }

      if (isErrorPayload(payload)) {
        setError(payload.error ?? "Could not generate guidance.");
        return;
      }

      setResult(payload);
      setDashboard({
        progress: payload.progress,
        dailyGuidance: payload.dailyGuidance,
        recentEntries: payload.recentEntries,
      });
    });
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#18211b]">
      <div className="border-b border-[#e6e0d4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-6 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#e7decd] bg-white">
              <img
                src="/logo_viaquran.png"
                alt="ViaQuran logo"
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div>
              <div className="text-[2rem] font-semibold leading-none text-[#1f6a4d]">ViaQuran</div>
              <div className="mt-1 text-sm text-[#5a645d]">Live your life. The Quranic way.</div>
            </div>
          </div>

          <nav className="hidden items-center gap-10 text-[1.05rem] text-[#262c28] lg:flex">
            <a className="relative pb-6 font-semibold text-[#1f6a4d] after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:rounded-full after:bg-[#1f6a4d]" href="#">
              Home
            </a>
            <a href="#">Quranic Explorer</a>
            <a href="#">Daily Routine</a>
            <a href="#">Learn</a>
            <a href="#">Community</a>
            <a href="#">Premium</a>
          </nav>

          <div className="flex items-center gap-3">
            <NavIconButton label="Search">
              <SearchIcon className="h-5 w-5" />
            </NavIconButton>
            <NavIconButton label="Notifications">
              <BellIcon className="h-5 w-5" />
            </NavIconButton>
            <div className="hidden items-center gap-3 rounded-full border border-[#e2dac9] bg-white px-3 py-2 md:flex">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#dec7a2_0%,#8a613d_100%)] text-sm font-semibold text-white">
                A
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-[#202824]">Ahmed</div>
                <div className="text-sm text-[#5d655e]">Level {quickStats?.level ?? 12}</div>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-[#1f6a4d]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-10 px-4 py-6 md:px-8 md:py-8">
        <section className="overflow-hidden rounded-[36px] border border-[#e7e0d2] bg-[linear-gradient(90deg,#fbf7ef_0%,#f7f1e5_52%,#efe7dc_100%)] shadow-[0_28px_60px_rgba(74,66,48,0.07)]">
          <div className="grid gap-10 px-5 py-7 md:px-10 md:py-10 xl:grid-cols-[1.05fr_1.15fr_0.68fr]">
            <div className="flex flex-col justify-center">
              <h1 className="max-w-[520px] font-serif text-[3rem] leading-[1.08] text-[#1d241f] md:text-[4.3rem]">
                Align your daily life with the teachings of the{" "}
                <span className="text-[#1f6a4d]">Quran</span>
              </h1>
              <p className="mt-5 max-w-[470px] text-[1.15rem] leading-8 text-[#4f5650]">
                Discover Quranic guidance for every moment of your life. Search, learn and grow
                spiritually.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#1f6a4d] px-7 py-4 text-base font-semibold text-white shadow-[0_16px_28px_rgba(31,106,77,0.18)]"
                >
                  <HomeIcon className="h-5 w-5" />
                  Explore Quranic Teachings
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-2xl border border-[#8db5a0] bg-white/80 px-7 py-4 text-base font-semibold text-[#1f6a4d]"
                >
                  <CompassIcon className="h-5 w-5" />
                  My Routine
                </button>
              </div>
            </div>

            <div className="relative flex min-h-[520px] items-center justify-center">
              <div className="absolute inset-0 rounded-[38px] bg-[radial-gradient(circle_at_top,#ffffff_0%,rgba(255,255,255,0.5)_28%,transparent_60%)]" />
              <div className="relative w-full max-w-[600px] overflow-hidden rounded-[34px] border border-[#dccfb8] bg-[#f4ebdb] p-3 shadow-[0_35px_50px_rgba(82,68,43,0.13)]">
                <img
                  src="/header.png"
                  alt="ViaQuran hero artwork"
                  className="h-[520px] w-full rounded-[28px] object-cover object-center"
                />
              </div>
            </div>

            <div className="flex items-center">
              <div className="relative w-full rounded-[28px] border border-[#e8ddcf] bg-white px-6 py-7 shadow-[0_18px_35px_rgba(68,57,40,0.08)]">
                <div className="absolute left-5 top-4 text-[2rem] leading-none text-[#679176]">“</div>
                <p className="pr-2 text-[1.05rem] leading-8 text-[#232a25]">
                  This is a Book We have revealed to you, [O Muhammad], blessed that they might
                  reflect upon its verses and that those of understanding would be reminded.
                </p>
                <div className="mt-6 text-[1.05rem] font-semibold text-[#1f6a4d]">
                  - Surah Sad (38:29)
                </div>
                <div className="absolute bottom-3 right-5 text-[2rem] leading-none text-[#679176]">”</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Explore by Topic" action="View all" />
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e6dfd1] bg-white text-[#203128] shadow-[0_10px_20px_rgba(75,68,50,0.06)]"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            {TOPICS.map((topic, index) => (
              <button
                key={topic}
                type="button"
                className="min-h-[110px] min-w-[110px] shrink-0 rounded-[24px] border border-[#e7e0d2] bg-white px-4 py-4 text-center shadow-[0_8px_20px_rgba(75,68,50,0.04)]"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dce4d9] text-[#1f6a4d]">
                  <TopicIcon index={index} />
                </div>
                <div className="mt-4 text-base leading-6 text-[#1f241f]">{topic}</div>
              </button>
            ))}
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e6dfd1] bg-white text-[#203128] shadow-[0_10px_20px_rgba(75,68,50,0.06)]"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[34px] border border-[#e4ded0] bg-[linear-gradient(90deg,#edf2e4_0%,#f8f4e7_42%,#f1f0e6_100%)] px-6 py-7 shadow-[0_22px_40px_rgba(79,68,48,0.06)] md:px-10">
          <div className="pointer-events-none absolute -bottom-8 left-0 h-44 w-40 rounded-tr-[100px] bg-[radial-gradient(circle_at_bottom_left,rgba(119,170,119,0.5)_0%,rgba(119,170,119,0.2)_34%,transparent_68%)]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-44 rounded-tl-[110px] bg-[radial-gradient(circle_at_bottom_right,rgba(95,156,107,0.45)_0%,rgba(95,156,107,0.18)_35%,transparent_70%)]" />
          <div className="pointer-events-none absolute right-10 top-0 h-28 w-14 rounded-b-[28px] border border-[#d6c39d] bg-[linear-gradient(180deg,#f3e2b8_0%,#ae8340_100%)] shadow-[0_15px_24px_rgba(89,69,38,0.12)]" />

          <div className="relative z-10 mx-auto max-w-[980px] text-center">
            <h2 className="font-serif text-[2.5rem] leading-tight text-[#1e4b38]">
              Search or ask anything
            </h2>
            <p className="mt-2 text-[1.1rem] text-[#5a655d]">
              Find Quranic verses and guidance that relates to your life.
            </p>

            <form onSubmit={handleSubmit} className="mx-auto mt-7 max-w-[860px]">
              <div className="overflow-hidden rounded-[24px] border border-[#d9d7cb] bg-white shadow-[0_18px_35px_rgba(79,68,48,0.08)] md:flex">
                <div className="flex flex-1 items-center gap-3 px-5 py-4">
                  <SearchIcon className="h-6 w-6 shrink-0 text-[#25342b]" />
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="E.g. I feel stressed about my work"
                    className="w-full border-0 bg-transparent text-base text-[#202824] outline-none placeholder:text-[#8b8d86]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 bg-[#1f6a4d] px-7 py-4 text-base font-semibold text-white disabled:opacity-65 md:min-w-[140px]"
                >
                  <SearchIcon className="h-5 w-5" />
                  {isPending ? "Searching..." : "Search"}
                </button>
                <button
                  type="button"
                  className="m-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#8fb4a2] bg-white px-6 py-3 text-base font-semibold text-[#1f6a4d]"
                >
                  <SparkIcon className="h-5 w-5" />
                  Ask AI
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-[#667169]">Popular searches:</span>
              {EXAMPLE_INPUTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInput(example)}
                  className="rounded-full border border-[#ddd9cc] bg-white/90 px-4 py-2 text-[#4c564f]"
                >
                  {example}
                </button>
              ))}
            </div>

            {error ? (
              <div className="mx-auto mt-4 max-w-[860px] rounded-[18px] border border-[#efc5c5] bg-[#fff1f1] px-4 py-3 text-left text-sm text-[#9a3e3e]">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <SectionHeader title="Quranic Guidance for You" action="View all" />
          <div className="relative rounded-[34px] border border-[#e4ddcf] bg-[linear-gradient(135deg,#fcfaf5_0%,#f7f1e6_100%)] p-5 shadow-[0_20px_40px_rgba(79,68,48,0.06)] md:p-8">
            <button
              type="button"
              className="absolute -left-5 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6dfd1] bg-white text-[#203128] shadow-[0_12px_22px_rgba(75,68,50,0.08)]"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="absolute -right-5 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6dfd1] bg-white text-[#203128] shadow-[0_12px_22px_rgba(75,68,50,0.08)]"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="rounded-[28px] border border-[#e5dccd] bg-[linear-gradient(180deg,#fffcf8_0%,#faf4ea_100%)] px-6 py-7">
                <div className="rounded-[24px] border border-[#dcccb3] px-6 py-7 text-center">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#d2bea0] bg-[#fcfaf5] text-[#315a46]">
                    3
                  </div>
                  <p className="ayah-arabic font-semibold text-[#1f4b39]">
                    {result?.ayah.arabic ?? "وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ"}
                  </p>
                  <p className="mt-5 text-[1.15rem] text-[#303731]">
                    {result?.ayah.english ??
                      "And whoever relies upon Allah - then He is sufficient for him."}
                  </p>
                  <div className="mt-5 text-xl text-[#1f6a4d]">
                    {result?.ayah.reference ?? "Surah At-Talaq (65:3)"}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div
                  className={`inline-flex w-fit rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white ${heroTheme.accentClass}`}
                >
                  {result?.theme.label ?? "Trust in Allah"}
                </div>
                <h3 className="mt-5 font-serif text-[2.2rem] leading-tight text-[#18211b]">
                  {result?.theme.label ? `${result.theme.label} Guidance` : "Trust in Allah"}
                </h3>
                <p className="mt-4 text-[1.12rem] leading-8 text-[#303731]">
                  {result?.explanation ??
                    "When you trust Allah completely, He takes care of your affairs in ways you cannot even imagine."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#9ab6a6] bg-white px-5 py-3 text-base font-semibold text-[#1f6a4d]"
                  >
                    <BookIcon className="h-5 w-5" />
                    Read Explanation
                  </button>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dfd8cb] bg-white text-[#5a645d]"
                  >
                    <BookmarkIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dfd8cb] bg-white text-[#5a645d]"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                </div>
                {result ? (
                  <div className="mt-6 rounded-[24px] border border-[#dfe8dd] bg-white/80 px-5 py-4">
                    <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#718077]">
                      Action steps
                    </div>
                    <div className="mt-3 grid gap-3">
                      {result.actionSteps.map((step) => (
                        <div key={step} className="rounded-[18px] bg-[#f8f7f2] px-4 py-3 text-sm text-[#3d463f]">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="h-3 w-3 rounded-full bg-[#1f6a4d]" />
              <span className="h-3 w-3 rounded-full bg-[#d7d5cd]" />
              <span className="h-3 w-3 rounded-full bg-[#d7d5cd]" />
              <span className="h-3 w-3 rounded-full bg-[#d7d5cd]" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Match your routine with Quranic teachings" action="View full routine" />
          <div className="grid gap-5 xl:grid-cols-4">
            {ROUTINES.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-[28px] border border-[#e6dfd1] bg-white shadow-[0_16px_30px_rgba(79,68,48,0.05)]"
              >
                <div className="h-[170px] w-full" style={{ background: item.background }} />
                <div className="px-5 py-5">
                  <div className="text-[1.55rem] font-medium text-[#1f241f]">{item.title}</div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm text-[#69736c]">
                    <span>{item.time}</span>
                    <span>{item.verses}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[34px] border border-[#e8e1d4] bg-[linear-gradient(180deg,#f7f4ec_0%,#f4f0e8_100%)] px-5 py-7 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:px-8">
          <div className="grid gap-5 xl:grid-cols-4">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[28px] border border-[#ece4d7] bg-white px-6 py-6 shadow-[0_12px_28px_rgba(79,68,48,0.04)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#dfe9df] bg-[#f8fbf8] text-[#1f6a4d]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 font-serif text-[1.75rem] leading-tight text-[#1d241f]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[1.02rem] leading-7 text-[#5d655e]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)]">
            <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">
              Your growth
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-[#f8f6f0] px-5 py-5">
                <div className="text-sm text-[#6e7a72]">XP points</div>
                <div className="mt-2 text-4xl font-semibold text-[#1f6a4d]">{quickStats?.totalXp ?? 0}</div>
              </div>
              <div className="rounded-[24px] bg-[#f8f6f0] px-5 py-5">
                <div className="text-sm text-[#6e7a72]">Level</div>
                <div className="mt-2 text-4xl font-semibold text-[#1f6a4d]">{quickStats?.level ?? 1}</div>
              </div>
              <div className="rounded-[24px] bg-[#f8f6f0] px-5 py-5">
                <div className="text-sm text-[#6e7a72]">Streak</div>
                <div className="mt-2 text-4xl font-semibold text-[#1f6a4d]">
                  {quickStats?.currentStreak ?? 0}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#e6e0d4] bg-[linear-gradient(180deg,#fbfaf7_0%,#f8f5ee_100%)] px-5 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">
                Today&apos;s challenge
              </div>
              <div className="mt-3 font-serif text-[1.8rem] text-[#1d241f]">
                {activeGuidance?.challengeTitle ?? "Build one Quran habit"}
              </div>
              <p className="mt-3 text-[1.02rem] leading-7 text-[#59635c]">
                {activeGuidance?.challengePrompt ?? "Come back daily for one new Quran-linked action."}
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">
                Recent reflections
              </div>
              <div className="rounded-full bg-[#f7f5ef] px-3 py-2 text-sm text-[#617068]">
                {recentEntries.length} saved
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {recentEntries.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#d9d4c7] px-5 py-6 text-[#617068]">
                  Your reflections will appear here after the first search.
                </div>
              ) : (
                recentEntries.map((entry) => (
                  <article key={entry.id} className="rounded-[24px] bg-[#faf8f2] px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#1f6a4d]">{themeLabel(entry.themeId)}</div>
                        <p className="mt-2 text-[1rem] leading-7 text-[#2b342f]">{entry.input}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#1f6a4d]">
                        +{entry.xpGained} XP
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LogoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" {...props}>
      <path d="M32 10c6 8 12 14 18 18v20H14V28c6-4 12-10 18-18Z" />
      <path d="M20 46h24" />
      <path d="M24 42c2-8 5-13 8-18 3 5 6 10 8 18" />
      <path d="M12 32h40" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function SparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
    </svg>
  );
}

function ArrowLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z" />
      <path d="M7.5 3A2.5 2.5 0 0 0 5 5.5V21" />
    </svg>
  );
}

function BookmarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M7 4h10v16l-5-3-5 3V4Z" />
    </svg>
  );
}

function ShareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 8a3 3 0 1 0-2.9-4H12a3 3 0 0 0 0 6Z" />
      <path d="M6 14a3 3 0 1 0-2.9-4H3a3 3 0 0 0 0 6Z" />
      <path d="M18 22a3 3 0 1 0-2.9-4H15a3 3 0 0 0 0 6Z" />
      <path d="m8.6 11.5 4.8-2.7" />
      <path d="m8.6 12.5 6.8 4" />
    </svg>
  );
}

function CompassIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

function NoteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function ChartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20v-12" />
      <path d="M2 20h20" />
    </svg>
  );
}

function CommunityIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M14 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TopicIcon({ index }: { index: number }) {
  const icons = [PatienceIcon, HeartIcon, FamilyIcon, WorkIcon, HeartRingIcon, ParentingIcon];
  const Icon = icons[index % icons.length];
  return <Icon className="h-6 w-6" />;
}

function PatienceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3v18" />
      <path d="M7 8h10" />
      <path d="M8 21h8" />
      <path d="m8 8 4 4-4 4" />
      <path d="m16 8-4 4 4 4" />
    </svg>
  );
}

function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m12 21-1.45-1.32C5.4 15.02 2 11.94 2 8.15 2 5.07 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.04 6.04 0 0 1 16.5 3C19.58 3 22 5.07 22 8.15c0 3.79-3.4 6.87-8.55 11.54Z" />
    </svg>
  );
}

function FamilyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="7" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <path d="M2 20a5 5 0 0 1 10 0" />
      <path d="M12 20a5 5 0 0 1 10 0" />
    </svg>
  );
}

function WorkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function HeartRingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="7" cy="7" r="3" />
      <path d="m12 21-1.45-1.32C5.4 15.02 2 11.94 2 8.15 2 5.07 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.04 6.04 0 0 1 16.5 3C19.58 3 22 5.07 22 8.15c0 3.79-3.4 6.87-8.55 11.54Z" />
    </svg>
  );
}

function ParentingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="8" cy="7" r="3" />
      <circle cx="16" cy="9" r="2" />
      <path d="M3 20a5 5 0 0 1 10 0" />
      <path d="M14 20a4 4 0 0 1 8 0" />
    </svg>
  );
}
