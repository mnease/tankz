import { createFileRoute } from "@tanstack/react-router";
import {
  fetchLeaderboard,
  persistScore,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/leaderboard")({
  server: {
    handlers: {
      /** GET /api/leaderboard — global top scores */
      GET: async () => {
        try {
          const leaderboard: LeaderboardEntry[] = await fetchLeaderboard();
          const highScore = leaderboard[0]?.score ?? 0;
          return json({ leaderboard, highScore, synced: true });
        } catch (err) {
          console.error("[leaderboard] GET failed", err);
          return json(
            {
              error: "Failed to load leaderboard",
              leaderboard: [] as LeaderboardEntry[],
              highScore: 0,
              synced: false,
            },
            500,
          );
        }
      },

      /** POST /api/leaderboard — save a score for every player */
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            name?: string;
            score?: number;
            wave?: number;
          };
          const result = await persistScore({
            name: body.name ?? "AAA",
            score: Number(body.score),
            wave: Number(body.wave ?? 0),
          });
          return json({ ...result, synced: true });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to save score";
          console.error("[leaderboard] POST failed", err);
          const status = message.startsWith("Invalid") ? 400 : 500;
          return json({ error: message, synced: false }, status);
        }
      },
    },
  },
});
