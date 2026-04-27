"use client";

import { FormEvent, ReactNode, SVGProps, useEffect, useMemo, useState } from "react";
import { QuranBrowser } from "@/components/quran-browser";
import { QuranMatchCard } from "@/components/quran-match-card";
import { EXAMPLE_INPUTS, THEMES } from "@/lib/theme-data";
import { detectTheme } from "@/lib/theme-engine";
import { DashboardPayload, ReflectionResult, ThemeId } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement>;

function createGuestId() {
  if (typeof window === "undefined") {
    return "guest-demo";
  }

  try {
    const stored = window.localStorage.getItem("viaquran-user-id");
    if (stored) {
      return stored;
    }

    const token =
      typeof window.crypto !== "undefined" && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID().slice(0, 8)
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const nextUserId = `guest-${token}`;
    window.localStorage.setItem("viaquran-user-id", nextUserId);
    return nextUserId;
  } catch {
    return `guest-${Date.now().toString(36)}`;
  }
}

function themeLabel(themeId: ThemeId) {
  return THEMES[themeId].label;
}

function isErrorPayload(value: unknown): value is { error?: string } {
  return Boolean(value && typeof value === "object" && "error" in value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function computeAlignmentPulse(progress?: DashboardPayload["progress"]) {
  if (!progress) {
    return 42;
  }

  return Math.min(
    96,
    28 + progress.level * 6 + progress.currentStreak * 5 + Math.min(progress.reflectionsCount, 12) * 3,
  );
}

async function copyText(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard not available.");
  }

  await navigator.clipboard.writeText(text);
}

function buildShareText(result: ReflectionResult) {
  return [
    "Match your life with Allah's message",
    `${result.theme.label} guidance`,
    result.ayah.reference,
    result.ayah.english,
    `Reflection: ${result.explanation}`,
    `Step 1: ${result.actionSteps[0] ?? "Take one Quran-linked step today."}`,
  ].join("\n");
}

function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-[760px]">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b776f]">{eyebrow}</div>
      <h2 className="mt-3 font-serif text-[2rem] leading-tight text-[#16211b] md:text-[2.8rem]">{title}</h2>
      <p className="mt-3 text-[1rem] leading-7 text-[#59645d]">{text}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#e6dece] bg-white/90 p-5 shadow-[0_16px_30px_rgba(72,60,42,0.05)]">
      <div className="text-sm uppercase tracking-[0.12em] text-[#718077]">{label}</div>
      <div className="mt-2 text-4xl font-semibold text-[#1f6a4d]">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[#5c655f]">{help}</div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-full border border-[#ddd7cb] bg-white px-3 py-2 text-sm font-medium text-[#5b665e]">
      {children}
    </div>
  );
}

function StoryCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#e8e0d2] bg-white px-5 py-5 shadow-[0_12px_24px_rgba(73,60,41,0.04)]">
      <div className="font-serif text-[1.4rem] leading-tight text-[#1c251f]">{title}</div>
      <p className="mt-3 text-[0.98rem] leading-7 text-[#56625a]">{text}</p>
    </div>
  );
}

function HighlightGallery() {
  const items = [
    {
      src: "/header.png",
      alt: "Community learning and reflection",
      title: "Daily life reflection",
      text: "Turn routines, struggles, and choices into ayah-backed understanding.",
    },
    {
      src: "/logo-.png",
      alt: "Reminder circle and anonymous questions",
      title: "Reminder circles",
      text: "Share gentle reminders, ask anonymously, and build trust through reflection.",
    },
    {
      src: "/logo_viaquran.png",
      alt: "Quran guidance and personal growth",
      title: "Step-by-step obedience",
      text: "Move from habit to conscious obedience by seeing what Allah says and then acting on it.",
    },
  ];

  return (
    <section className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
      <SectionTitle
        eyebrow="Highlights"
        title="A short gallery of what this platform is built to encourage"
        text="ViaQuran is designed to make Quranic guidance visible inside ordinary life, family routines, learning circles, and personal improvement."
      />

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="overflow-hidden rounded-[26px] border border-[#ebe2d5] bg-[#fbf8f2]">
            <img src={item.src} alt={item.alt} className="h-48 w-full object-cover" />
            <div className="px-5 py-5">
              <div className="font-serif text-[1.35rem] leading-tight text-[#1c251f]">{item.title}</div>
              <p className="mt-3 text-sm leading-7 text-[#5b665e]">{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  help: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-[18px] border border-[#dfd9cd] bg-[#faf7f1] px-4 py-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[#c5ccbf] text-[#1f6a4d] focus:ring-[#1f6a4d]"
      />
      <div>
        <div className="font-semibold text-[#1b241e]">{label}</div>
        <div className="mt-1 text-sm leading-6 text-[#5f6962]">{help}</div>
      </div>
    </label>
  );
}

export function ViaQuranApp() {
  const [userId, setUserId] = useState("guest-demo");
  const [input, setInput] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [result, setResult] = useState<ReflectionResult | null>(null);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [postTitle, setPostTitle] = useState("A routine I want the community to review");
  const [postText, setPostText] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    const nextUserId = createGuestId();
    setUserId(nextUserId);

    fetch(`/api/today?userId=${encodeURIComponent(nextUserId)}`, { cache: "no-store" })
      .then((response) => response.json().then((payload: unknown) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok || isErrorPayload(payload)) {
          throw new Error(
            isErrorPayload(payload) ? payload.error ?? "Dashboard failed to load." : "Dashboard failed to load.",
          );
        }

        setDashboard(payload as DashboardPayload);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load today's guidance.");
      });
  }, []);

  useEffect(() => {
    if (!result) {
      return;
    }

    setPostTitle(`Match review: ${result.theme.label}`);
    setPostText(
      `${result.explanation} My next step is: ${result.actionSteps[0] ?? "Take one practical Quran-linked action today."}`,
    );
    setCompletedSteps([]);
  }, [result]);

  const liveTheme = useMemo(() => detectTheme(input || postText || "patience"), [input, postText]);
  const guidanceTheme = result?.theme ?? liveTheme;
  const ayah = result?.ayah ?? guidanceTheme.ayah;
  const progress = result?.progress ?? dashboard?.progress;
  const dailyGuidance = result?.dailyGuidance ?? dashboard?.dailyGuidance;
  const recentEntries = result?.recentEntries ?? dashboard?.recentEntries ?? [];
  const savedItems = dashboard?.savedItems ?? [];
  const communityPosts = dashboard?.communityPosts ?? [];
  const storageMode = result?.storageMode ?? dashboard?.storageMode ?? "file";
  const alignmentPulse = computeAlignmentPulse(progress);
  const activeSteps = result?.actionSteps ?? guidanceTheme.actionSteps;
  const activeExplanation = result?.explanation ?? guidanceTheme.explanation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaveMessage("");
    setShareMessage("");
    setIsReflecting(true);

    try {
      const response = await fetch("/api/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, userId }),
      });
      const rawPayload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !rawPayload || isErrorPayload(rawPayload)) {
        throw new Error(
          isErrorPayload(rawPayload)
            ? rawPayload.error ?? "Could not generate guidance."
            : "Could not generate guidance.",
        );
      }

      const payload = rawPayload as ReflectionResult;
      setResult(payload);
      setDashboard((current) => ({
        progress: payload.progress,
        dailyGuidance: payload.dailyGuidance,
        recentEntries: payload.recentEntries,
        savedItems: current?.savedItems ?? [],
        communityPosts: current?.communityPosts ?? [],
        storageMode: payload.storageMode,
      }));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Network error while generating guidance.",
      );
    } finally {
      setIsReflecting(false);
    }
  }

  async function handleSaveCurrent() {
    if (!result) {
      setError("Generate guidance first, then save it.");
      return;
    }

    setError("");
    setSaveMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title: `${result.theme.label} reflection`,
          input: result.input,
          themeId: result.theme.id,
          ayahReference: result.ayah.reference,
        }),
      });
      const rawPayload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !rawPayload || isErrorPayload(rawPayload)) {
        throw new Error(
          isErrorPayload(rawPayload)
            ? rawPayload.error ?? "Could not save this reflection."
            : "Could not save this reflection.",
        );
      }

      const payload = rawPayload as {
        savedItems?: DashboardPayload["savedItems"];
        storageMode?: "mysql" | "file";
      };
      setDashboard((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          savedItems: payload.savedItems ?? current.savedItems,
          storageMode: payload.storageMode ?? current.storageMode,
        };
      });
      setSaveMessage("Saved to your private reminder library.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this reflection.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publishCommunityPost(title: string, excerpt: string, anonymous: boolean) {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title,
        excerpt,
        anonymous,
      }),
    });
    const rawPayload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok || !rawPayload || isErrorPayload(rawPayload)) {
      throw new Error(
        isErrorPayload(rawPayload)
          ? rawPayload.error ?? "Could not publish to the community wall."
          : "Could not publish to the community wall.",
      );
    }

    const payload = rawPayload as {
      communityPosts?: DashboardPayload["communityPosts"];
      storageMode?: "mysql" | "file";
    };
    setDashboard((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        communityPosts: payload.communityPosts ?? current.communityPosts,
        storageMode: payload.storageMode ?? current.storageMode,
      };
    });
  }

  async function handleShareCurrent() {
    if (!result) {
      setError("Generate guidance first, then share it.");
      return;
    }

    setError("");
    setShareMessage("");
    setIsPublishing(true);

    try {
      await publishCommunityPost(`${result.theme.label} reminder`, result.explanation, postAnonymously);

      const shareText = buildShareText(result);
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: "ViaQuran reflection",
          text: shareText,
        });
      } else {
        await copyText(shareText);
      }

      setShareMessage("Shared to the reminder circle and prepared for external sharing.");
    } catch (shareError) {
      setError(
        shareError instanceof Error ? shareError.message : "Could not share this reflection right now.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handlePublishNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setShareMessage("");

    const title = postTitle.trim();
    const excerpt = postText.trim();
    if (!title || !excerpt) {
      setError("Write a short title and prompt before publishing.");
      return;
    }

    setIsPublishing(true);

    try {
      await publishCommunityPost(title, excerpt, postAnonymously);
      setShareMessage(
        postAnonymously
          ? "Your anonymous reflection is now in the reminder circle."
          : "Your reflection is now in the reminder circle.",
      );
      setPostText("");
    } catch (publishError) {
      setError(
        publishError instanceof Error ? publishError.message : "Could not publish this note right now.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  function toggleStep(step: string) {
    setCompletedSteps((current) =>
      current.includes(step) ? current.filter((item) => item !== step) : [...current, step],
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbf8f1_0%,#f1eadb_100%)] text-[#18211b]">
      <header className="sticky top-0 z-20 border-b border-[#e6decf] bg-[rgba(251,248,241,0.92)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-4 py-4 md:px-8">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#e2d8c7] bg-white">
              <img src="/logo_viaquran.png" alt="ViaQuran logo" className="h-full w-full object-contain p-1" />
            </div>
            <div>
              <div className="text-[1.7rem] font-semibold leading-none text-[#1f6a4d]">ViaQuran</div>
              <div className="mt-1 text-sm text-[#5a645d]">Life matching, reminder circles, and Quran-guided action.</div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-[0.98rem] text-[#2d352f] lg:flex">
            <a href="#matcher" className="transition hover:text-[#1f6a4d]">Matcher</a>
            <a href="#purpose" className="transition hover:text-[#1f6a4d]">Purpose</a>
            <a href="#circle" className="transition hover:text-[#1f6a4d]">Reminder Circle</a>
            <a href="#community" className="transition hover:text-[#1f6a4d]">Community</a>
            <a href="#growth" className="transition hover:text-[#1f6a4d]">Growth</a>
          </nav>

          <div className="hidden rounded-full border border-[#d9dfd0] bg-white/85 px-4 py-2 text-sm font-semibold text-[#47634f] md:block">
            Non-profit initiative
          </div>
        </div>
      </header>

      <div id="top" className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
        <section className="overflow-hidden rounded-[36px] border border-[#ddd2c0] bg-[#1d2a21] shadow-[0_30px_70px_rgba(73,60,41,0.14)]">
          <div
            className="relative"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(18,28,23,0.88) 0%, rgba(18,28,23,0.76) 42%, rgba(18,28,23,0.42) 100%), url('/header.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="grid gap-8 px-6 py-8 md:px-10 md:py-12 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.12)] px-4 py-2 text-sm font-semibold text-[#eef6f0]">
                Match your life and living with Allah&apos;s message
              </div>
              <h1 className="mt-6 max-w-[720px] font-serif text-[3rem] leading-[1.02] text-white md:text-[4.9rem]">
                Learn to connect everyday living with what Allah actually says in the Quran.
              </h1>
              <p className="mt-5 max-w-[640px] text-[1.08rem] leading-8 text-[#edf1eb]">
                Many people pray, work, speak, struggle, parent, and make decisions as routine. ViaQuran helps them pause,
                ask where Allah speaks about these matters, and move from habit into conscious obedience, understanding, and growth.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#matcher"
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#1f6a4d] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_30px_rgba(31,106,77,0.18)]"
                >
                  <CompassIcon className="h-5 w-5" />
                  Match My Routine
                </a>
                <a
                  href="#community"
                  className="inline-flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.28)] bg-[rgba(255,255,255,0.12)] px-7 py-4 text-base font-semibold text-white"
                >
                  <CircleIcon className="h-5 w-5" />
                  Enter Reminder Circle
                </a>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricCard label="Alignment pulse" value={`${alignmentPulse}%`} help="A simple indicator showing whether reflection is becoming part of your real routine." />
                <MetricCard label="Private library" value={`${savedItems.length}`} help="Keep ayah-backed reminders for revision and personal discipline." />
                <MetricCard label="Circle activity" value={`${communityPosts.length}`} help="Questions and anonymous reflections shared with the community." />
              </div>
            </div>

            <div className="rounded-[30px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.12)] p-6 shadow-[0_16px_28px_rgba(18,28,23,0.18)] backdrop-blur">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#dcebdd]">Why this matters</div>
              <div className="mt-3 font-serif text-[1.9rem] leading-tight text-white">
                Worship becomes stronger when people know Allah&apos;s instruction, not just the routine.
              </div>
              <p className="mt-3 text-[1rem] leading-7 text-[#edf1eb]">
                  Example: many people pray every day because it is familiar. But when they discover where the Quran speaks
                  about prayer, remembrance, humility, and obedience, salah is no longer only routine. It becomes a conscious
                  response to Allah&apos;s command.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>{dailyGuidance?.ayahReference ?? guidanceTheme.ayah.reference}</Pill>
                <Pill>{themeLabel(guidanceTheme.id)}</Pill>
                <Pill>{dailyGuidance?.dateLabel ?? "Today"}</Pill>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section id="purpose" className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
          <SectionTitle
            eyebrow="Purpose"
            title="Bring one part of life, find one ayah, and act on one next step"
            text="This platform exists to help people stop treating faith as a disconnected subject. Daily routines, prayer, honesty, anger, gratitude, family life, and responsibilities should all be understood in the light of Quran."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <StoryCard
              title="From routine to obedience"
              text="A person may pray every day, but still never ask where Allah teaches about prayer, remembrance, and humility. Once the Quranic basis becomes visible, prayer becomes more conscious and sincere."
            />
            <StoryCard
              title="From confusion to guidance"
              text="When a user posts a real-life struggle, the platform should connect that struggle with an ayah, a translation, and a practical path forward."
            />
            <StoryCard
              title="From isolation to community"
              text="Reminder circles and anonymous posts give people a safe way to ask, reflect, and learn together without shame."
            />
          </div>
        </section>

        <section id="matcher" className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="rounded-[34px] border border-[#e5ddd0] bg-[linear-gradient(180deg,#faf7ef_0%,#f4ecdd_100%)] p-6 shadow-[0_20px_40px_rgba(79,68,48,0.06)] md:p-8">
            <SectionTitle
              eyebrow="Life Matcher"
              title="Type what is happening in your life and ask: what does the Quran say about this?"
              text="This is the main action of the website. Write a routine, weakness, question, family concern, worship issue, or daily struggle. The app matches it to Quranic guidance, then shows the ayah, translation, and practical next steps."
            />

            <form onSubmit={handleSubmit} className="mt-7">
              <div className="overflow-hidden rounded-[24px] border border-[#d7d4c9] bg-white shadow-[0_18px_35px_rgba(79,68,48,0.08)]">
                <div className="flex items-start gap-4 px-5 py-5">
                  <SearchIcon className="mt-1 h-6 w-6 shrink-0 text-[#25342b]" />
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Example: I waste too much time, I delay salah, and I want my daily routine to reflect Allah's guidance more honestly."
                    className="min-h-[170px] w-full resize-none border-0 bg-transparent text-base leading-7 text-[#202824] outline-none placeholder:text-[#8b8d86]"
                  />
                </div>
                <div className="border-t border-[#ece6da] px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_INPUTS.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setInput(example)}
                        className="rounded-full border border-[#ddd7cb] bg-[#faf8f3] px-3 py-2 text-sm text-[#4f5b53] transition hover:border-[#1f6a4d] hover:text-[#1f6a4d]"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isReflecting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1f6a4d] px-6 py-3 text-base font-semibold text-white disabled:opacity-65"
                >
                  <SparkIcon className="h-5 w-5" />
                  {isReflecting ? "Matching..." : "Match With Quran Guidance"}
                </button>
                <div className="text-sm leading-6 text-[#617068]">
                  Best used for routines, habits, prayer discipline, family tensions, work stress, or questions you want the community to refine.
                </div>
              </div>
            </form>

            {(error || saveMessage || shareMessage) && (
              <div className="mt-5 grid gap-3">
                {error ? <div className="rounded-2xl border border-[#e7c6c6] bg-[#fff5f5] px-4 py-3 text-sm text-[#8b3c3c]">{error}</div> : null}
                {saveMessage ? <div className="rounded-2xl border border-[#cae0cf] bg-[#f3fbf5] px-4 py-3 text-sm text-[#1f6a4d]">{saveMessage}</div> : null}
                {shareMessage ? <div className="rounded-2xl border border-[#cae0cf] bg-[#f3fbf5] px-4 py-3 text-sm text-[#1f6a4d]">{shareMessage}</div> : null}
              </div>
            )}
          </div>

          <div id="circle" className="rounded-[34px] border border-[#e2dacb] bg-white p-6 shadow-[0_20px_40px_rgba(79,68,48,0.06)] md:p-8">
            <SectionTitle
              eyebrow="How to use the result"
              title="Read the ayah, understand the meaning, then act on it step by step"
              text="The purpose is not only to receive a result. The purpose is to understand the ayah, relate it to your life, and begin changing the next action you take."
            />

            <div className="mt-7 rounded-[24px] border border-[#e6e0d4] bg-[linear-gradient(180deg,#fbfaf7_0%,#f3efe6_100%)] p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6f7b73]">Detected focus</div>
              <div className="mt-3 font-serif text-[2rem] text-[#1d241f]">{themeLabel(guidanceTheme.id)}</div>
              <p className="mt-3 text-[0.98rem] leading-7 text-[#59645d]">{activeExplanation}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>{ayah.reference}</Pill>
                <Pill>Private, saveable, and shareable</Pill>
              </div>
            </div>

            <ToggleRow
              checked={postAnonymously}
              onChange={setPostAnonymously}
              label="Post anonymously"
              help="Use this for honest routines, sensitive questions, or confessions you want the reminder circle to answer without exposing your name."
            />

            <div className="mt-5 rounded-[24px] border border-[#dfe8dd] bg-[#fbfcfa] p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#718077]">Interactive exercise</div>
              <div className="mt-4 grid gap-3">
                {activeSteps.map((step) => {
                  const done = completedSteps.includes(step);
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => toggleStep(step)}
                      className={`flex items-start gap-3 rounded-[18px] px-4 py-4 text-left text-sm leading-7 transition ${
                        done
                          ? "border border-[#cde2d1] bg-[#eef8f0] text-[#234430]"
                          : "border border-[#ebe6db] bg-white text-[#3d463f]"
                      }`}
                    >
                      <span
                        className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold ${
                          done ? "border-[#1f6a4d] bg-[#1f6a4d] text-white" : "border-[#c7d0c5] text-[#6d786f]"
                        }`}
                      >
                        {done ? "x" : ""}
                      </span>
                      <span>{step}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <HighlightGallery />

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <QuranMatchCard
            ayah={ayah}
            title="Matched ayah and translation"
            eyebrow="Quran section"
            explanation={activeExplanation}
            actionSteps={activeSteps}
          />

          <div className="rounded-[34px] border border-[#e5ddcf] bg-[linear-gradient(180deg,#f6faf5_0%,#eef3eb_100%)] p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">Use this result</div>
            <h3 className="mt-4 font-serif text-[2rem] leading-tight text-[#1b241e]">Save it, share it, or turn it into a community question</h3>
            <p className="mt-3 text-[0.98rem] leading-7 text-[#57645b]">
              Every matched result can stay in your private library, be shared to the reminder circle, or be copied into mentoring and teaching spaces.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveCurrent}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#9ab6a6] bg-white px-5 py-3 text-base font-semibold text-[#1f6a4d] disabled:opacity-65"
              >
                <BookmarkIcon className="h-5 w-5" />
                {isSaving ? "Saving..." : "Save Reflection"}
              </button>
              <button
                type="button"
                onClick={handleShareCurrent}
                disabled={isPublishing}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#1f6a4d] px-5 py-3 text-base font-semibold text-white disabled:opacity-65"
              >
                <ShareIcon className="h-5 w-5" />
                {isPublishing ? "Sharing..." : "Share to Reminder Circle"}
              </button>
              <button
                type="button"
                onClick={() => copyText(buildShareText(result ?? {
                  input,
                  theme: guidanceTheme,
                  ayah,
                  explanation: activeExplanation,
                  actionSteps: activeSteps,
                  dailyGuidance: dailyGuidance ?? {
                    themeId: guidanceTheme.id,
                    title: guidanceTheme.challengeTitle,
                    prompt: guidanceTheme.challengePrompt,
                    ayahReference: ayah.reference,
                    challengeTitle: guidanceTheme.challengeTitle,
                    challengePrompt: guidanceTheme.challengePrompt,
                    dateLabel: "Today",
                  },
                  progress: progress ?? {
                    totalXp: 0,
                    level: 1,
                    currentStreak: 0,
                    longestStreak: 0,
                    reflectionsCount: 0,
                    xpToNextLevel: 100,
                  },
                  gainedXp: 0,
                  recentEntries: recentEntries,
                  storageMode,
                })).then(() => setShareMessage("Reminder copied to clipboard.")).catch(() => setError("Clipboard access is not available in this browser."))}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd7cb] bg-[#faf8f3] px-5 py-3 text-base font-semibold text-[#4d5a52]"
              >
                <NoteIcon className="h-5 w-5" />
                Copy Reminder
              </button>
            </div>
          </div>
        </section>

        <QuranBrowser />

        <section id="community" className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <SectionTitle
              eyebrow="Community Builder"
              title="Build the reminder circle with questions, routines, and anonymous honesty"
              text="This wall is designed for community building. Members can post a struggle, ask for ayah-backed direction, and return later to refine it into stronger guidance."
            />

            <form onSubmit={handlePublishNote} className="mt-7 grid gap-4">
              <input
                value={postTitle}
                onChange={(event) => setPostTitle(event.target.value)}
                placeholder="Title for your reflection or question"
                className="rounded-[20px] border border-[#ddd8cc] bg-[#fcfbf7] px-4 py-4 text-base text-[#1f2a23] outline-none"
              />
              <textarea
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                placeholder="Example: My routine looks disciplined outside, but inside I am losing honesty and focus. What ayah should I build my week around?"
                className="min-h-[220px] rounded-[24px] border border-[#ddd8cc] bg-[#fcfbf7] px-4 py-4 text-base leading-7 text-[#1f2a23] outline-none"
              />
              <ToggleRow
                checked={postAnonymously}
                onChange={setPostAnonymously}
                label="Publish this anonymously"
                help="Useful for community questions, confessions, routines, and sensitive improvement areas."
              />
              <button
                type="submit"
                disabled={isPublishing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f6a4d] px-6 py-3 text-base font-semibold text-white disabled:opacity-65"
              >
                <ShareIcon className="h-5 w-5" />
                {isPublishing ? "Publishing..." : "Publish to Reminder Circle"}
              </button>
            </form>
          </div>

          <div className="rounded-[34px] border border-[#e5ddcf] bg-[linear-gradient(180deg,#fdfcf9_0%,#f8f4ed_100%)] p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">Reminder circle</div>
                <div className="mt-2 font-serif text-[2rem] text-[#1c251f]">Recent life matches and community prompts</div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f6a4d]">
                {communityPosts.length} posts
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {communityPosts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#d9d4c7] bg-white px-5 py-8 text-[#617068]">
                  The reminder circle is empty for now. Publish the first reflection, question, or anonymous routine match.
                </div>
              ) : (
                communityPosts.map((post) => (
                  <article key={post.id} className="rounded-[24px] border border-[#ebdfcb] bg-white px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f7b73]">
                          {themeLabel(post.themeId)}
                        </div>
                        <h3 className="mt-2 text-[1.35rem] font-semibold text-[#1e2922]">{post.title}</h3>
                      </div>
                      <div className="text-sm text-[#6a746d]">{formatDate(post.createdAt)}</div>
                    </div>
                    <p className="mt-3 text-[0.99rem] leading-7 text-[#55625a]">{post.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#637067]">
                      <Pill>{post.authorName}</Pill>
                      <Pill>{post.roleLabel}</Pill>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="growth" className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <SectionTitle
              eyebrow="Growth"
              title="Track your direction, not just your activity"
              text="This panel shows whether your practice is staying consistent, whether your reflection habit is growing, and what should be improved next."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard label="Alignment pulse" value={`${alignmentPulse}%`} help="A practical score based on streak, level, and reflection activity." />
              <MetricCard label="Level" value={`${progress?.level ?? 1}`} help="Growth level from continued reflection and applied action." />
              <MetricCard label="Streak" value={`${progress?.currentStreak ?? 0}`} help="Consecutive days of Quran-linked reflection." />
            </div>

            <div className="mt-6 rounded-[24px] border border-[#e6e0d4] bg-[linear-gradient(180deg,#fbfaf7_0%,#f8f5ee_100%)] px-5 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">Recent reflections</div>
              <div className="mt-4 grid gap-3">
                {recentEntries.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-[#ddd6c8] px-4 py-4 text-sm text-[#647067]">
                    Your routine matches will appear here after the first guidance request.
                  </div>
                ) : (
                  recentEntries.map((entry) => (
                    <article key={entry.id} className="rounded-[18px] bg-white px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-[#1f6a4d]">{themeLabel(entry.themeId)}</div>
                          <p className="mt-2 text-sm leading-7 text-[#2b342f]">{entry.input}</p>
                          {entry.ayahReference ? (
                            <div className="mt-3 inline-flex rounded-full bg-[#edf6ef] px-3 py-2 text-xs font-semibold text-[#1f6a4d]">
                              {entry.ayahReference}
                            </div>
                          ) : null}
                        </div>
                        <div className="rounded-full bg-[#f3f8f5] px-3 py-2 text-sm font-semibold text-[#1f6a4d]">
                          +{entry.xpGained} XP
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-[#e5ddcf] bg-[linear-gradient(180deg,#f7f4ec_0%,#f2eee6_100%)] p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">Reminder library</div>
                <div className="mt-2 font-serif text-[2rem] text-[#1d241f]">Saved guidance for mentoring, revisiting, and teaching</div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f6a4d]">
                {savedItems.length} saved
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {savedItems.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#d9d4c7] bg-white px-5 py-8 text-[#617068] md:col-span-2">
                  Save a matched reflection to build your private improvement archive.
                </div>
              ) : (
                savedItems.map((item) => (
                  <article key={item.id} className="rounded-[24px] border border-[#e8decd] bg-white px-5 py-5">
                    <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f7b73]">
                      {themeLabel(item.themeId)}
                    </div>
                    <h3 className="mt-2 text-[1.2rem] font-semibold text-[#1e2922]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#56635b]">{item.input}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#647067]">
                      <Pill>{item.ayahReference}</Pill>
                      <Pill>{formatDate(item.createdAt)}</Pill>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <footer className="rounded-[30px] border border-[#e3dbc9] bg-[linear-gradient(180deg,#fdfbf6_0%,#f4eee2_100%)] px-6 py-6 text-center shadow-[0_14px_30px_rgba(79,68,48,0.04)] md:px-8">
          <div className="font-serif text-[1.5rem] text-[#1b241e]">ViaQuran</div>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#58645c]">
            A non-profit effort to help people relate their daily lives, routines, worship, and decisions to the Quran with clarity, reflection, and community support.
          </p>
          <p className="mt-4 text-sm text-[#67736b]">
            Powered by SoftThinkers • <a href="https://www.softthinkers.com" className="font-semibold text-[#1f6a4d] hover:underline">www.softthinkers.com</a>
          </p>
        </footer>
      </div>
    </main>
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

function SparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
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

function CompassIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

function CircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
