export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-10 text-[#1f241f] md:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[#e6dfd1] bg-white p-6 shadow-[0_16px_30px_rgba(79,68,48,0.05)] md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b766e]">
          ViaQuran
        </p>
        <h1 className="mt-3 font-serif text-5xl text-[#1d241f]">Terms of Service</h1>
        <p className="mt-4 text-lg leading-8 text-[#556058]">
          By using ViaQuran, you agree to use the service responsibly and only for lawful,
          respectful, and personal or organizational purposes consistent with Islamic ethics and
          platform safety.
        </p>

        <div className="mt-8 space-y-8 text-[#2e3731]">
          <section>
            <h2 className="font-serif text-3xl">Use of Service</h2>
            <p className="mt-3 leading-8">
              ViaQuran provides Quranic content, reflections, routine tools, and educational
              features. The service is offered for spiritual learning and personal growth and does
              not replace qualified scholarly, medical, or legal advice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Accounts</h2>
            <p className="mt-3 leading-8">
              If account features are enabled, you are responsible for maintaining the security of
              your account credentials and for all activity carried out through your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Content and Availability</h2>
            <p className="mt-3 leading-8">
              We aim to provide accurate Quranic content and reliable service, but we do not
              guarantee uninterrupted availability or the absence of errors. Features may change,
              improve, or be removed over time.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Prohibited Use</h2>
            <p className="mt-3 leading-8">
              You may not misuse the platform, interfere with its operation, attempt unauthorized
              access, scrape protected data, or use the service to publish harmful, unlawful, or
              deceptive material.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl">Contact</h2>
            <p className="mt-3 leading-8">
              For questions regarding these terms, contact
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
