"use client";

import { useEffect, useState } from "react";
import { QuranChapterPayload, QuranChapterSummary } from "@/lib/types";

function isErrorPayload(value: unknown): value is { error?: string } {
  return Boolean(value && typeof value === "object" && "error" in value);
}

export function QuranBrowser() {
  const [chapters, setChapters] = useState<QuranChapterSummary[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState(1);
  const [chapter, setChapter] = useState<QuranChapterPayload | null>(null);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isLoadingChapter, setIsLoadingChapter] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoadingChapters(true);
    fetch("/api/quran/chapters", { cache: "no-store" })
      .then((response) => response.json().then((payload: unknown) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok || isErrorPayload(payload) || !payload || typeof payload !== "object" || !("chapters" in payload)) {
          throw new Error(isErrorPayload(payload) ? payload.error ?? "Could not load Quran chapters." : "Could not load Quran chapters.");
        }

        const nextChapters = (payload as { chapters: QuranChapterSummary[] }).chapters;
        setChapters(nextChapters);
        if (nextChapters[0]) {
          setSelectedChapterId((current) => (nextChapters.some((item) => item.id === current) ? current : nextChapters[0].id));
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load Quran chapters.");
      })
      .finally(() => {
        setIsLoadingChapters(false);
      });
  }, []);

  useEffect(() => {
    setIsLoadingChapter(true);
    fetch(`/api/quran/chapters/${selectedChapterId}`, { cache: "no-store" })
      .then((response) => response.json().then((payload: unknown) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok || isErrorPayload(payload)) {
          throw new Error(isErrorPayload(payload) ? payload.error ?? "Could not load Quran chapter." : "Could not load Quran chapter.");
        }

        setChapter(payload as QuranChapterPayload);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load Quran chapter.");
      })
      .finally(() => {
        setIsLoadingChapter(false);
      });
  }, [selectedChapterId]);

  return (
    <section className="rounded-[34px] border border-[#e5ddcf] bg-white p-6 shadow-[0_18px_35px_rgba(79,68,48,0.05)] md:p-8">
      <div className="max-w-[760px]">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b776f]">Quran reader</div>
        <h2 className="mt-3 font-serif text-[2rem] leading-tight text-[#16211b] md:text-[2.8rem]">
          Read the Quran section by section with stored translations
        </h2>
        <p className="mt-3 text-[1rem] leading-7 text-[#59645d]">
          Chapters are fetched from Quran Foundation through your backend and then stored in MariaDB. This lets the website read the Quran in a consistent format without exposing API credentials to the browser.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-semibold text-[#405046]" htmlFor="quran-chapter-select">
          Choose a surah
        </label>
        <select
          id="quran-chapter-select"
          value={selectedChapterId}
          onChange={(event) => setSelectedChapterId(Number(event.target.value))}
          className="min-w-[260px] rounded-2xl border border-[#d8d0c2] bg-[#fbf8f1] px-4 py-3 text-sm text-[#1f2a23] outline-none"
          disabled={isLoadingChapters || chapters.length === 0}
        >
          {chapters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id}. {item.nameSimple}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-[#e7c6c6] bg-[#fff5f5] px-4 py-3 text-sm text-[#8b3c3c]">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-[28px] border border-[#ece4d6] bg-[linear-gradient(180deg,#fffdf9_0%,#f7f1e6_100%)] p-6">
        {isLoadingChapter || !chapter ? (
          <div className="text-sm text-[#5b665e]">Loading chapter...</div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-serif text-[2rem] text-[#1b241e]">{chapter.chapter.nameSimple}</div>
                <div className="mt-2 text-[1.3rem] text-[#1f6a4d]">{chapter.chapter.nameArabic}</div>
                <div className="mt-2 text-sm text-[#5f6962]">
                  {chapter.chapter.versesCount} verses • {chapter.chapter.revelationPlace}
                </div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f6a4d]">
                {chapter.source === "database" ? "Loaded from MariaDB cache" : "Fetched from Quran Foundation"}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {chapter.verses.map((verse) => (
                <article key={verse.verseKey} className="rounded-[22px] border border-[#e7dece] bg-white px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="rounded-full bg-[#edf6ef] px-3 py-2 text-sm font-semibold text-[#1f6a4d]">
                      {verse.verseKey}
                    </div>
                    <div className="text-sm text-[#66726a]">
                      Juz {verse.juzNumber ?? "-"} • Page {verse.pageNumber ?? "-"}
                    </div>
                  </div>
                  <div className="mt-4 text-right font-serif text-[1.8rem] leading-[2.2] text-[#1c251f]">
                    {verse.arabic}
                  </div>
                  <p className="mt-4 text-[1rem] leading-8 text-[#2d352f]">{verse.english}</p>
                  {verse.urdu ? <p className="mt-3 text-[0.98rem] leading-8 text-[#4f5c53]">{verse.urdu}</p> : null}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
