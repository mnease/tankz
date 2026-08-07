import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GAME_FEEDBACK_EMAIL, GAME_NAME, GAME_VERSION } from "@/game/version";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: `Privacy Policy · ${GAME_NAME}` },
      {
        name: "description",
        content: `Privacy Policy for ${GAME_NAME} by NeaseMedia.`,
      },
    ],
  }),
});

function PrivacyPage() {
  const updated = "August 7, 2026";
  return (
    <main className="min-h-[calc(100dvh-var(--grok-banner-h,0px))] bg-bg px-4 py-10 text-fg">
      <article className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2 border-b border-border pb-6">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent uppercase">
            Legal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">
            {GAME_NAME} · NeaseMedia · Last updated {updated} · v{GAME_VERSION}
          </p>
        </header>

        <p className="text-sm leading-relaxed text-muted">
          This Privacy Policy describes how NeaseMedia (&quot;we&quot;,
          &quot;us&quot;) handles information in connection with the {GAME_NAME}{" "}
          game and related website (the &quot;Service&quot;). By using the
          Service, you agree to this policy.
        </p>

        <Section title="1. Who is responsible">
          <p>
            The Service is published and operated by{" "}
            <strong className="font-medium text-fg">NeaseMedia</strong>, not by
            xAI. Contact:{" "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href={`mailto:${GAME_FEEDBACK_EMAIL}`}
            >
              {GAME_FEEDBACK_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="2. Information we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="font-medium text-fg">Gameplay scores.</strong>{" "}
              When you submit a hall-of-fame entry, we store the initials or name
              you enter, your score, wave reached, and a timestamp on our
              database (hosted with Neon Postgres via Vercel).
            </li>
            <li>
              <strong className="font-medium text-fg">
                Local device settings.
              </strong>{" "}
              We store preferences such as play mode, aim mode, and a short
              leaderboard cache in your browser&apos;s local storage. These stay
              on your device unless you clear site data.
            </li>
            <li>
              <strong className="font-medium text-fg">
                Optional account sign-in.
              </strong>{" "}
              If you use the optional login page, authentication may be handled
              through the app&apos;s auth system and third-party providers (for
              example Google or X when enabled). Those providers process data
              under their own policies.
            </li>
            <li>
              <strong className="font-medium text-fg">
                Technical / hosting data.
              </strong>{" "}
              Our hosts (including Vercel) and infrastructure partners may
              automatically process standard server logs such as IP address,
              user agent, timestamps, and request metadata for security,
              reliability, and abuse prevention.
            </li>
            <li>
              <strong className="font-medium text-fg">
                Privacy-friendly web analytics.
              </strong>{" "}
              We use Vercel Web Analytics to understand aggregate traffic (for
              example page views and referrers). It is designed to work without
              cookies for visitor tracking and is not used to sell personal data
              or build advertising profiles.
            </li>
            <li>
              <strong className="font-medium text-fg">Tips.</strong> Optional
              tips are processed by third-party payment services (for example
              xMoney or Venmo). We do not collect your payment card details
              through the game UI.
            </li>
          </ul>
        </Section>

        <Section title="3. How we use information">
          <ul className="list-disc space-y-2 pl-5">
            <li>Operate the game, global leaderboard, and related features</li>
            <li>Remember your settings on this device</li>
            <li>Secure the Service and prevent abuse or fraud</li>
            <li>Respond to feedback you send us</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal information.
          </p>
        </Section>

        <Section title="4. Sharing">
          <p>
            We share information with service providers that help us run the
            Service (for example hosting and database providers), when required
            by law, or to protect rights and safety. Optional tips and social
            sign-in involve third parties that control their own processing.
          </p>
        </Section>

        <Section title="5. Retention">
          <p>
            Leaderboard entries may be kept for as long as the global board is
            offered, or until removed for moderation, capacity limits, or legal
            reasons. Local storage remains until you clear it. Server logs are
            retained according to our host&apos;s practices and operational
            needs.
          </p>
        </Section>

        <Section title="6. Children">
          <p>
            The Service is not directed to children under 13 (or the minimum age
            required in your jurisdiction). Do not use the Service if you are
            under that age.
          </p>
        </Section>

        <Section title="7. Your choices">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              You may choose not to submit a leaderboard name (by not entering
              the hall of fame flow).
            </li>
            <li>
              You may clear browser storage for this site to remove local
              preferences and cached scores.
            </li>
            <li>
              To request correction or deletion of a leaderboard entry that
              identifies you, email{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href={`mailto:${GAME_FEEDBACK_EMAIL}?subject=${encodeURIComponent("Tankz Privacy Request")}`}
              >
                {GAME_FEEDBACK_EMAIL}
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section title="8. International users">
          <p>
            The Service may be hosted in the United States or other regions. By
            using it, you understand your information may be processed in
            countries with different data-protection rules than your own.
          </p>
        </Section>

        <Section title="9. Changes">
          <p>
            We may update this policy from time to time. The &quot;Last
            updated&quot; date will change when we do. Continued use after
            changes means you accept the revised policy.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Privacy questions:{" "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href={`mailto:${GAME_FEEDBACK_EMAIL}`}
            >
              {GAME_FEEDBACK_EMAIL}
            </a>
          </p>
        </Section>

        <p className="text-xs leading-relaxed text-subtle">
          This page is provided for transparency about {GAME_NAME}. It is not
          legal advice. Publishing tools or subdomains from third parties (such
          as xAI) do not transfer responsibility for your content or
          compliance—NeaseMedia remains the publisher of this Service.
        </p>

        <footer className="flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link
            to="/"
            className="text-accent underline-offset-2 hover:underline"
          >
            ← Back to {GAME_NAME}
          </Link>
          <Link
            to="/terms"
            className="text-muted underline-offset-2 hover:underline"
          >
            Terms of Use
          </Link>
        </footer>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 text-sm leading-relaxed text-muted">
      <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
      {children}
    </section>
  );
}
