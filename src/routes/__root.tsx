import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/lib/auth/provider";
import { CreatedWithGrokBanner } from "@/components/created-with-grok-banner";
import { GAME_VERSION } from "@/game/version";
import appCss from "../styles.css?url";

const APP_NAME = "Tankz";
const APP_DESCRIPTION =
  "Modern top-down tank combat. Drive, rotate, blast enemy armor.";
/** Canonical production origin for absolute OG URLs (crawlers need absolute). */
const SITE_ORIGIN =
  (import.meta.env.VITE_PUBLIC_HOSTNAME
    ? `https://${import.meta.env.VITE_PUBLIC_HOSTNAME}`
    : undefined) ??
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  "https://tankz-rho.vercel.app";
/** Static 1200×630 share card — version query busts CDN / social crawler cache */
const OG_IMAGE = `${SITE_ORIGIN}/og.png?v=${GAME_VERSION}`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { title: APP_NAME },
      { name: "description", content: APP_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: APP_DESCRIPTION },
      { property: "og:url", content: SITE_ORIGIN },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Tankz — modern top-down tank combat" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: APP_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/brand/tankz-logo.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <CreatedWithGrokBanner />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        {/* Vercel Web Analytics — dashboard must be enabled on the project */}
        <Analytics />
        <Scripts />
      </body>
    </html>
  ),
});
