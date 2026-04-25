export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-10 text-[#1f241f] md:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[#e6dfd1] bg-white p-6 shadow-[0_16px_30px_rgba(79,68,48,0.05)] md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b766e]">
          ViaQuran
        </p>
        <h1 className="mt-3 font-serif text-5xl text-[#1d241f]">Privacy Policy</h1>
        <p className="mt-4 text-lg leading-8 text-[#556058]">
          ViaQuran collects only the information needed to provide Quran-based guidance,
          improve user experience, and maintain account features such as saved reflections,
          streaks, and personalized recommendations.
        </p>

        <div className="mt-8 space-y-8 text-[#2e3731]">
          <section>
            <h2 className="font-serif text-3xl">Information We Collect</h2>
            <p className="mt-3 leading-8">
              We may collect account details such as your name, email address, profile
              preferences, saved reflections, bookmarked ayahs, and in-app usage data needed for
              daily guidance features.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">How We Use Information</h2>
            <p className="mt-3 leading-8">
              We use your information to provide relevant Quranic content, save your progress,
              personalize your routine, support authentication, and improve the reliability and
              safety of the platform.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Data Sharing</h2>
            <p className="mt-3 leading-8">
              We do not sell your personal information. We may use trusted service providers for
              hosting, analytics, authentication, or Quran content delivery where necessary to run
              the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Your Choices</h2>
            <p className="mt-3 leading-8">
              You can request updates or deletion of your account data by contacting ViaQuran
              support. We will make reasonable efforts to honor such requests in accordance with
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Contact</h2>
            <p className="mt-3 leading-8">
              For privacy-related questions, contact us at
              {" "}
              <a className="font-semibold text-[#1f6a4d]" href="mailto:akeelpmajk@gmail.com">
                akeelpmajk@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

