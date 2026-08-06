import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GAME_FEEDBACK_EMAIL, GAME_NAME, GAME_VERSION } from "@/game/version";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: `Terms of Use · ${GAME_NAME}` },
      {
        name: "description",
        content: `Terms of Use for ${GAME_NAME} by NeaseMedia.`,
      },
    ],
  }),
});

function TermsPage() {
  const updated = "August 6, 2026";
  return (
    <main className="min-h-[calc(100dvh-var(--grok-banner-h,0px))] bg-bg px-4 py-10 text-fg">
      <article className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2 border-b border-border pb-6">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent uppercase">
            Legal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Terms of Use
          </h1>
          <p className="text-sm text-muted">
            {GAME_NAME} · NeaseMedia · Last updated {updated} · v{GAME_VERSION}
          </p>
        </header>

        <p className="text-sm leading-relaxed text-muted">
          These Terms of Use (&quot;Terms&quot;) govern your access to and use
          of the {GAME_NAME} game and related website (the &quot;Service&quot;)
          published by NeaseMedia. By using the Service, you agree to these
          Terms and our{" "}
          <Link
            to="/privacy"
            className="text-accent underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <Section title="1. Publisher and platform tools">
          <p>
            <strong className="font-medium text-fg">NeaseMedia</strong> is
            solely responsible for the creation, functionality, content,
            publication, and legality of this Service, including user-related
            responsibilities such as consents, disclosures, intellectual
            property claims, data privacy, and compliance with applicable laws.
          </p>
          <p className="mt-3">
            Third parties that provide hosting, build tools, or subdomains
            (including xAI and its Grok products, if used) supply technology
            only. They do not endorse this Service, make warranties about it, or
            assume responsibility for your use of prompts, outputs, or the
            published app. Accounts or publications may be revoked by those
            platforms under their own terms.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 13 years old (or the minimum age required where
            you live) and able to form a binding agreement. If you use the
            Service on behalf of an organization, you represent that you have
            authority to bind that organization.
          </p>
        </Section>

        <Section title="3. License to play">
          <p>
            We grant you a limited, personal, non-exclusive, non-transferable,
            revocable license to access and play {GAME_NAME} for lawful
            entertainment. You may not copy, reverse engineer (except where
            prohibited by law), scrape, attack, or commercially exploit the
            Service without our prior written permission.
          </p>
        </Section>

        <Section title="4. Intellectual property">
          <p>
            {GAME_NAME}, including its name, code, art, audio, design, and
            related materials, is owned by NeaseMedia or its licensors and is
            protected by copyright and other laws. &quot;NeaseMedia&quot; and
            related marks are used under ownership of NeaseMedia. Third-party
            marks (payment providers, platforms, etc.) belong to their owners.
          </p>
          <p className="mt-3">
            If you believe content on the Service infringes your rights, contact{" "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href={`mailto:${GAME_FEEDBACK_EMAIL}?subject=${encodeURIComponent("Tankz IP Notice")}`}
            >
              {GAME_FEEDBACK_EMAIL}
            </a>{" "}
            with enough detail for us to investigate.
          </p>
        </Section>

        <Section title="5. User content and leaderboard">
          <p>
            If you submit initials, a display name, scores, feedback, or other
            content, you grant NeaseMedia a worldwide, royalty-free license to
            host, display, and use that content in connection with the Service
            (including the global hall of fame). You represent that you have the
            rights to submit it and that it does not violate law or third-party
            rights.
          </p>
          <p className="mt-3">
            We may remove, edit, or refuse leaderboard entries or other content
            for any reason, including abuse, offensive names, cheating, or
            technical limits.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Cheat, exploit bugs, or manipulate scores unfairly</li>
            <li>Harass others or submit unlawful, hateful, or infringing content</li>
            <li>Probe, scan, or disrupt the Service or related systems</li>
            <li>Use automated means to access the Service without permission</li>
            <li>Violate applicable laws or third-party terms (including payment and platform terms)</li>
          </ul>
        </Section>

        <Section title="7. Optional tips">
          <p>
            {GAME_NAME} is free to play. Optional tips are voluntary and
            processed by third-party payment providers. Tips are generally
            non-refundable except where required by law or the payment
            provider&apos;s rules. Tips do not purchase ownership of the game or
            any equity interest.
          </p>
        </Section>

        <Section title="8. Accounts (if used)">
          <p>
            Optional sign-in may be available. You are responsible for activity
            under your account credentials and for keeping them secure. We may
            suspend access that we reasonably believe is compromised or abusive.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
            IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
            WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
        </Section>

        <Section title="10. Limitation of liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEASEMEDIA AND ITS
            CONTRIBUTORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA,
            PROFITS, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR
            TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE WILL NOT EXCEED
            THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE
            TWELVE MONTHS BEFORE THE CLAIM (IF ANY) OR (B) USD $50.
          </p>
        </Section>

        <Section title="11. Indemnity">
          <p>
            You agree to defend and indemnify NeaseMedia against claims arising
            from your use of the Service, your content, or your violation of
            these Terms or applicable law, to the extent permitted by law.
          </p>
        </Section>

        <Section title="12. Changes and termination">
          <p>
            We may modify the Service or these Terms at any time. Material
            changes will be reflected by updating the date above. We may suspend
            or discontinue the Service (in whole or part) without liability.
            Provisions that by nature should survive will survive termination.
          </p>
        </Section>

        <Section title="13. Governing law">
          <p>
            These Terms are governed by the laws of the United States and the
            State of Texas, excluding conflict-of-law rules, unless mandatory
            local consumer law requires otherwise. Courts in Texas will have
            exclusive jurisdiction, subject to applicable consumer protections.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Questions about these Terms:{" "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href={`mailto:${GAME_FEEDBACK_EMAIL}?subject=${encodeURIComponent("Tankz Terms")}`}
            >
              {GAME_FEEDBACK_EMAIL}
            </a>
          </p>
        </Section>

        <p className="text-xs leading-relaxed text-subtle">
          These Terms are a practical baseline for operating {GAME_NAME}. They
          are not a substitute for legal advice tailored to your situation.
        </p>

        <footer className="flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link
            to="/"
            className="text-accent underline-offset-2 hover:underline"
          >
            ← Back to {GAME_NAME}
          </Link>
          <Link
            to="/privacy"
            className="text-muted underline-offset-2 hover:underline"
          >
            Privacy Policy
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
