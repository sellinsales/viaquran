"use client";

import { FormEvent, ReactNode, SVGProps, useEffect, useMemo, useState } from "react";
import {
  COMMUNITY_SPOTLIGHTS,
  LEARNING_PATHS,
  RESOURCE_KITS,
  TEACHING_CIRCLES,
} from "@/lib/platform-content";
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

async function copyText(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard not available.");
  }

  await navigator.clipboard.writeText(text);
}

function buildShareText(result: ReflectionResult) {
  return [
    `${result.theme.label} guidance`,
    result.ayah.reference,
    result.ayah.english,
    `Reflection: ${result.explanation}`,
    `Action step: ${result.actionSteps[0] ?? "Take one Quran-linked step today."}`,
  ].join("\n");
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-[720px]">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a7f71]">{eyebrow}</div>
      <h2 className="mt-3 font-serif text-[2.2rem] leading-tight text-[#15221b] md:text-[2.8rem]">
        {title}
      </h2>
      <p className="mt-3 text-[1.02rem] leading-7 text-[#59655d]">{text}</p>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="transition hover:text-[#1f6a4d]">
      {children}
    </a>
  );
}

function StatusBadge({
  storageMode,
}: {
  storageMode: "mysql" | "file";
}) {
  const label = storageMode === "mysql" ? "MariaDB connected" : "Local storage fallback";
  const tone =
    storageMode === "mysql"
      ? "border-[#b8d7c5] bg-[#edf8f1] text-[#1f6a4d]"
      : "border-[#e2d3aa] bg-[#fff8e8] text-[#7c6021]";

  return <div className={`rounded-full border px-3 py-2 text-sm font-semibold ${tone}`}>{label}</div>;
}

export function ViaQuranApp() {
  const [userId, setUserId] = useState("guest-demo");
  const [input, setInput] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [result, setResult] = useState<ReflectionResult | null>(null);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [postTitle, setPostTitle] = useState("A lesson I want to share");
  const [postText, setPostText] = useState("");
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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

    setPostTitle(`${result.theme.label} reminder for today`);
    setPostText(`${result.explanation} Action step: ${result.actionSteps[0]}`);
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
      setDashboard((current: DashboardPayload | null) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          savedItems: payload.savedItems ?? current.savedItems,
          storageMode: payload.storageMode ?? current.storageMode,
        };
      });
      setSaveMessage("Saved to your library.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this reflection.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publishCommunityPost(title: string, excerpt: string) {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title,
        excerpt,
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
    setDashboard((current: DashboardPayload | null) => {
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
      await publishCommunityPost(`${result.theme.label} reminder`, result.explanation);

      const shareText = buildShareText(result);
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: "ViaQuran reflection",
          text: shareText,
        });
      } else {
        await copyText(shareText);
      }

      setShareMessage("Shared to the community wall and copied for external sharing.");
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
      setError("Write a short title and note before publishing.");
      return;
    }

    setIsPublishing(true);

    try {
      await publishCommunityPost(title, excerpt);
      setShareMessage("Your note is now on the community wall.");
      setPostText("");
    } catch (publishError) {
      setError(
        publishError instanceof Error ? publishError.message : "Could not publish this note right now.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleCopyCurrent() {
    if (!result) {
      setError("Generate guidance first, then copy it.");
      return;
    }

    try {
      await copyText(buildShareText(result));
      setShareMessage("Reminder copied to clipboard.");
    } catch {
      setError("Clipboard access is not available in this browser.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f3ea_42%,#efe7d9_100%)] text-[#18211b]">
      <header className="sticky top-0 z-20 border-b border-[#e6ded0] bg-[rgba(252,249,243,0.92)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-6 px-4 py-4 md:px-8">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#e2d8c7] bg-white">
              <img src="/logo_viaquran.png" alt="ViaQuran logo" className="h-full w-full object-contain p-1" />
            </div>
            <div>
              <div className="text-[1.7rem] font-semibold leading-none text-[#1f6a4d]">ViaQuran</div>
              <div className="mt-1 text-sm text-[#5a645d]">Learn, teach, and share with the Quran.</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-[1rem] text-[#2c352f] lg:flex">
            <NavLink href="#reflect">Reflect</NavLink>
            <NavLink href="#learn">Learn</NavLink>
            <NavLink href="#teach">Teach</NavLink>
            <NavLink href="#community">Share</NavLink>
            <NavLink href="#library">Library</NavLink>
          </nav>

          <StatusBadge storageMode={storageMode} />
        </div>
      </header>

      <div id="top" className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-4 py-6 md:px-8 md:py-8">
        <section className="overflow-hidden rounded-[36px] border border-[#e4dbce] bg-[linear-gradient(135deg,#fdfaf4_0%,#f7efdf_45%,#ebf3ea_100%)] shadow-[0_28px_70px_rgba(63,55,41,0.08)]">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit rounded-full border border-[#d9dfd0] bg-white/80 px-4 py-2 text-sm font-semibold text-[#47634f]">
                Full platform for reflection, teaching circles, and community sharing
              </div>
              <h1 className="mt-6 max-w-[620px] font-serif text-[2.9rem] leading-[1.04] text-[#17211b] md:text-[4.7rem]">
                Build a Quran-centered learning habit that can also be taught to others.
              </h1>
              <p className="mt-5 max-w-[560px] text-[1.08rem] leading-8 text-[#56625a]">
                ViaQuran now combines personal guidance, lesson tracks, teaching resources, and a
                community wall so one reflection can grow into a study habit, a halaqah, or a shared reminder.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#reflect"
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#1f6a4d] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_30px_rgba(31,106,77,0.2)]"
                >
                  <CompassIcon className="h-5 w-5" />
                  Start Reflecting
                </a>
                <a
                  href="#teach"
                  className="inline-flex items-center gap-3 rounded-2xl border border-[#8eb29f] bg-white/85 px-7 py-4 text-base font-semibold text-[#1f6a4d]"
                >
                  <CommunityIcon className="h-5 w-5" />
                  Open Teaching Studio
                </a>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricCard label="Learning tracks" value={`${LEARNING_PATHS.length}`} />
                <MetricCard label="Teaching circles" value={`${TEACHING_CIRCLES.length}`} />
                <MetricCard label="Community posts" value={`${communityPosts.length}`} />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="overflow-hidden rounded-[30px] border border-[#d8ccb7] bg-[#f4ebdb] p-3 shadow-[0_22px_42px_rgba(76,63,40,0.12)]">
                <img
                  src="/header.png"
                  alt="ViaQuran hero artwork"
                  className="h-full min-h-[430px] w-full rounded-[24px] object-cover"
                />
              </div>
              <div className="flex flex-col gap-5">
                <div className="rounded-[28px] border border-[#e1d8c8] bg-white/92 p-6 shadow-[0_16px_28px_rgba(68,57,40,0.08)]">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#728075]">
                    Daily challenge
                  </div>
                  <div className="mt-3 font-serif text-[1.9rem] leading-tight text-[#1a251d]">
                    {dailyGuidance?.challengeTitle ?? "Build one Quran habit"}
                  </div>
                  <p className="mt-3 text-[1rem] leading-7 text-[#5a655d]">
                    {dailyGuidance?.challengePrompt ??
                      "Come back daily for one new Quran-linked action."}
                  </p>
                  <div className="mt-4 rounded-2xl bg-[#f7f4ed] px-4 py-3 text-sm font-semibold text-[#1f6a4d]">
                    {dailyGuidance?.dateLabel ?? "Today"} • {dailyGuidance?.ayahReference ?? guidanceTheme.ayah.reference}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#dae5da] bg-[linear-gradient(180deg,#f6fbf5_0%,#ecf4ec_100%)] p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#708176]">
                    Platform status
                  </div>
                  <div className="mt-3 text-[1.6rem] font-semibold text-[#163126]">
                    {storageMode === "mysql" ? "Production data layer is active." : "Safe local persistence is active."}
                  </div>
                  <p className="mt-3 text-[0.98rem] leading-7 text-[#516158]">
                    {storageMode === "mysql"
                      ? "Reflections, saved items, and community posts are using MariaDB."
                      : "The app will still function without DB credentials and can be promoted to MariaDB later without changing the UI."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="reflect" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[34px] border border-[#e5ddd0] bg-[linear-gradient(180deg,#faf7ef_0%,#f4ecdd_100%)] p-6 shadow-[0_20px_40px_rgba(79,68,48,0.06)] md:p-8">
            <SectionHeader
              eyebrow="Reflect"
              title="Search for guidance and turn it into a practical next step"
              text="Write what happened, what you are feeling, or what you want to teach. The app maps it to a Quranic theme, brings an ayah, and keeps the reflection in your growth record."
            />

            <form onSubmit={handleSubmit} className="mt-7">
              <div className="overflow-hidden rounded-[24px] border border-[#d7d4c9] bg-white shadow-[0_18px_35px_rgba(79,68,48,0.08)]">
                <div className="flex items-start gap-4 px-5 py-5">
                  <SearchIcon className="mt-1 h-6 w-6 shrink-0 text-[#25342b]" />
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Example: I want to teach a short lesson on patience, and I also feel stressed about work."
                    className="min-h-[132px] w-full resize-none border-0 bg-transparent text-base leading-7 text-[#202824] outline-none placeholder:text-[#8b8d86]"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ece6da] px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_INPUTS.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setInput(example)}
                        className="rounded-full border border-[#ddd9cc] bg-[#fbfaf6] px-4 py-2 text-sm text-[#4c564f]"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={isReflecting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1f6a4d] px-6 py-3 text-base font-semibold text-white disabled:opacity-65"
                  >
                    <SparkIcon className="h-5 w-5" />
                    {isReflecting ? "Generating..." : "Generate Guidance"}
                  </button>
                </div>
              </div>
            </form>

            {(error || saveMessage || shareMessage) && (
              <div className="mt-4 grid gap-3">
                {error ? (
                  <div className="rounded-[18px] border border-[#efc5c5] bg-[#fff1f1] px-4 py-3 text-sm text-[#9a3e3e]">
                    {error}
                  </div>
                ) : null}
                {saveMessage ? (
                  <div className="rounded-[18px] border border-[#cfe4d6] bg-[#f2fbf5] px-4 py-3 text-sm text-[#216245]">
                    {saveMessage}
                  </div>
                ) : null}
                {shareMessage ? (
                  <div className="rounded-[18px] border border-[#d6e5ef] bg-[#f2f9ff] px-4 py-3 text-sm text-[#245c87]">
                    {shareMessage}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-[34px] border border-[#e4ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <div className={`inline-flex rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white ${guidanceTheme.accentClass}`}>
              {guidanceTheme.label}
            </div>
            <h3 className="mt-5 font-serif text-[2.3rem] leading-tight text-[#18211b]">
              {guidanceTheme.label} guidance
            </h3>
            <p className="mt-4 text-[1.04rem] leading-8 text-[#303731]">
              {result?.explanation ?? guidanceTheme.explanation}
            </p>

            <div className="mt-6 rounded-[28px] border border-[#e7dfd2] bg-[linear-gradient(180deg,#fffcf8_0%,#faf4ea_100%)] p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#738076]">
                Ayah for this theme
              </div>
              <p className="ayah-arabic mt-4 font-semibold text-[#1f4b39]">{ayah.arabic}</p>
              <p className="mt-4 text-[1.05rem] leading-8 text-[#2d352f]">{ayah.english}</p>
              <div className="mt-4 text-base font-semibold text-[#1f6a4d]">{ayah.reference}</div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#dfe8dd] bg-[#fbfcfa] px-5 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#718077]">
                Action steps
              </div>
              <div className="mt-3 grid gap-3">
                {(result?.actionSteps ?? guidanceTheme.actionSteps).map((step) => (
                  <div key={step} className="rounded-[18px] bg-[#f5f7f2] px-4 py-3 text-sm leading-7 text-[#3d463f]">
                    {step}
                  </div>
                ))}
              </div>
            </div>

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
                {isPublishing ? "Sharing..." : "Share to Community"}
              </button>
              <button
                type="button"
                onClick={handleCopyCurrent}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd7cb] bg-[#faf8f3] px-5 py-3 text-base font-semibold text-[#4d5a52]"
              >
                <NoteIcon className="h-5 w-5" />
                Copy Reminder
              </button>
            </div>
          </div>
        </section>

        <section id="learn" className="rounded-[34px] border border-[#e7dfd2] bg-white px-6 py-7 shadow-[0_20px_40px_rgba(79,68,48,0.05)] md:px-8 md:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="Learn"
              title="Structured paths for learners who want more than one-off inspiration"
              text="These tracks turn reflection into a repeatable curriculum, with lesson ideas that work for individuals, small groups, and community classes."
            />
            <div className="rounded-[24px] border border-[#dde8df] bg-[#f7fbf7] px-5 py-4 text-sm leading-7 text-[#496255]">
              Start with the path that matches your present challenge, then reuse the same theme in journaling, teaching, or discussion circles.
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-4">
            {LEARNING_PATHS.map((path) => (
              <article
                key={path.id}
                className="rounded-[28px] border border-[#ece4d6] bg-[linear-gradient(180deg,#fffdf9_0%,#f7f1e6_100%)] p-6 shadow-[0_12px_28px_rgba(79,68,48,0.04)]"
              >
                <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white ${THEMES[path.themeId].accentClass}`}>
                  {themeLabel(path.themeId)}
                </div>
                <h3 className="mt-4 font-serif text-[1.7rem] leading-tight text-[#1c251f]">{path.title}</h3>
                <p className="mt-3 text-[0.98rem] leading-7 text-[#5b665e]">{path.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#617068]">
                  <Pill>{path.level}</Pill>
                  <Pill>{path.duration}</Pill>
                </div>
                <div className="mt-5 text-sm font-semibold text-[#1f6a4d]">Teacher: {path.teacher}</div>
                <div className="mt-4 grid gap-2">
                  {path.lessons.map((lesson) => (
                    <div key={lesson} className="rounded-[16px] bg-white/80 px-4 py-3 text-sm leading-6 text-[#334038]">
                      {lesson}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="teach" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[34px] border border-[#e4ddcf] bg-[linear-gradient(180deg,#f6faf5_0%,#eef3eb_100%)] p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <SectionHeader
              eyebrow="Teach"
              title="Run circles, lessons, and discussions without starting from zero"
              text="Teaching mode focuses on repeatable formats. Use the reflection engine to find the theme, then build a short halaqah, class opener, or family session around it."
            />

            <div className="mt-7 grid gap-4">
              {TEACHING_CIRCLES.map((circle) => (
                <article
                  key={circle.id}
                  className="rounded-[24px] border border-[#dce5dc] bg-white px-5 py-5 shadow-[0_10px_24px_rgba(79,68,48,0.04)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-[1.55rem] text-[#1b241e]">{circle.title}</h3>
                      <p className="mt-2 text-[0.98rem] leading-7 text-[#57645b]">{circle.focus}</p>
                    </div>
                    <div className="rounded-full bg-[#edf6ef] px-3 py-2 text-sm font-semibold text-[#1f6a4d]">
                      {circle.format}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#5e6b63]">
                    <Pill>{circle.schedule}</Pill>
                    <Pill>{circle.capacity}</Pill>
                    <Pill>Host: {circle.host}</Pill>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">
              Teacher toolkit
            </div>
            <h3 className="mt-4 font-serif text-[2rem] leading-tight text-[#1b241e]">
              Ready-made assets for teachers and community builders
            </h3>
            <div className="mt-6 grid gap-4">
              {RESOURCE_KITS.map((kit) => (
                <article key={kit.id} className="rounded-[22px] bg-[#faf7f1] px-5 py-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#738076]">
                    {kit.format}
                  </div>
                  <div className="mt-2 text-[1.3rem] font-semibold text-[#1f2a23]">{kit.title}</div>
                  <p className="mt-2 text-[0.98rem] leading-7 text-[#58645c]">{kit.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-[#dee8e0] bg-[#f6fbf7] px-5 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#728075]">
                Suggested workflow
              </div>
              <div className="mt-3 grid gap-3 text-sm leading-7 text-[#405046]">
                <div className="rounded-[16px] bg-white px-4 py-3">1. Use the reflection tool to identify the theme.</div>
                <div className="rounded-[16px] bg-white px-4 py-3">2. Pull one learning path and one resource kit around that theme.</div>
                <div className="rounded-[16px] bg-white px-4 py-3">3. Publish your summary to the community wall so learners can revisit it.</div>
              </div>
            </div>
          </div>
        </section>

        <section id="community" className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <SectionHeader
              eyebrow="Share"
              title="Publish a lesson, reminder, or takeaway to the community wall"
              text="Use this space for short teaching notes, study-circle reminders, or reflections worth revisiting later."
            />

            <form onSubmit={handlePublishNote} className="mt-7 grid gap-4">
              <input
                value={postTitle}
                onChange={(event) => setPostTitle(event.target.value)}
                placeholder="Title"
                className="rounded-[20px] border border-[#ddd8cc] bg-[#fcfbf7] px-4 py-4 text-base text-[#1f2a23] outline-none"
              />
              <textarea
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                placeholder="Write a short note for learners, teachers, or your community."
                className="min-h-[180px] rounded-[24px] border border-[#ddd8cc] bg-[#fcfbf7] px-4 py-4 text-base leading-7 text-[#1f2a23] outline-none"
              />
              <button
                type="submit"
                disabled={isPublishing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f6a4d] px-6 py-3 text-base font-semibold text-white disabled:opacity-65"
              >
                <ShareIcon className="h-5 w-5" />
                {isPublishing ? "Publishing..." : "Publish Note"}
              </button>
            </form>

            <div className="mt-8 grid gap-4">
              {COMMUNITY_SPOTLIGHTS.map((spotlight) => (
                <article key={spotlight.id} className="rounded-[22px] border border-[#ece4d6] bg-[#faf8f3] px-5 py-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#738076]">
                    {spotlight.audience}
                  </div>
                  <div className="mt-2 text-[1.2rem] font-semibold text-[#1e2922]">{spotlight.title}</div>
                  <p className="mt-2 text-[0.98rem] leading-7 text-[#5a655d]">{spotlight.excerpt}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-[#e5ddcf] bg-[linear-gradient(180deg,#fdfcf9_0%,#f8f4ed_100%)] p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">
                  Community wall
                </div>
                <div className="mt-2 font-serif text-[2rem] text-[#1c251f]">Recent shared reminders</div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f6a4d]">
                {communityPosts.length} posts
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {communityPosts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#d9d4c7] bg-white px-5 py-8 text-[#617068]">
                  The wall is empty for now. Publish the first reminder from this workspace.
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

        <section id="library" className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">Your growth</div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MetricCard label="XP points" value={`${progress?.totalXp ?? 0}`} subtle />
              <MetricCard label="Level" value={`${progress?.level ?? 1}`} subtle />
              <MetricCard label="Streak" value={`${progress?.currentStreak ?? 0}`} subtle />
            </div>

            <div className="mt-6 rounded-[24px] border border-[#e6e0d4] bg-[linear-gradient(180deg,#fbfaf7_0%,#f8f5ee_100%)] px-5 py-5">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-[#6e7a72]">Recent reflections</div>
              <div className="mt-4 grid gap-3">
                {recentEntries.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-[#ddd6c8] px-4 py-4 text-sm text-[#647067]">
                    Your reflections will appear here after the first guidance request.
                  </div>
                ) : (
                  recentEntries.map((entry) => (
                    <article key={entry.id} className="rounded-[18px] bg-white px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-[#1f6a4d]">{themeLabel(entry.themeId)}</div>
                          <p className="mt-2 text-sm leading-7 text-[#2b342f]">{entry.input}</p>
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
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6e7a72]">
                  Saved library
                </div>
                <div className="mt-2 font-serif text-[2rem] text-[#1d241f]">Reflections worth teaching again</div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f6a4d]">
                {savedItems.length} saved
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {savedItems.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#d9d4c7] bg-white px-5 py-8 text-[#617068] md:col-span-2">
                  Save a reflection to build your reusable lesson and reminder library.
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
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] px-5 py-5 ${
        subtle ? "bg-[#faf7f1]" : "border border-[#e5ddcf] bg-white/88"
      }`}
    >
      <div className="text-sm text-[#6e7a72]">{label}</div>
      <div className="mt-2 text-4xl font-semibold text-[#1f6a4d]">{value}</div>
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
