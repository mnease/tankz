import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const LB_SIZE = 10;
export const NAME_MIN = 3;
export const NAME_MAX = 8;

export type LeaderboardEntry = {
  name: string;
  score: number;
  wave: number;
  /** Unix ms */
  at: number;
};

function cleanName(raw: string): string {
  const name = String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, NAME_MAX);
  if (name.length < NAME_MIN) return name.padEnd(NAME_MIN, "A") || "AAA";
  return name;
}

function mapRows(
  rows: { name: string; score: number; wave: number; at: number | string }[],
): LeaderboardEntry[] {
  return rows.map((r) => ({
    name: cleanName(r.name),
    score: Math.max(0, Math.floor(Number(r.score) || 0)),
    wave: Math.max(0, Math.floor(Number(r.wave) || 0)),
    at: Math.floor(Number(r.at) || Date.now()),
  }));
}

async function fetchTop(sql: Awaited<ReturnType<typeof getSql>>) {
  const rows = await sql<{
    name: string;
    score: number;
    wave: number;
    at: number | string;
  }>`
    select
      name,
      score,
      wave,
      (extract(epoch from created_at) * 1000)::bigint as at
    from tankz_scores
    order by score desc, created_at asc
    limit ${LB_SIZE}
  `;
  return mapRows(rows);
}

/** Public top scores — shared across every player / device. */
export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardEntry[]> => {
    const sql = await getSql();
    return fetchTop(sql);
  },
);

/**
 * Insert a qualifying score and return the updated top board.
 * No auth required (arcade-style). Server validates + ranks.
 */
export const submitScore = createServerFn({ method: "POST" })
  .validator((input: { name: string; score: number; wave: number }) => {
    const name = cleanName(input?.name ?? "");
    const score = Math.floor(Number(input?.score));
    const wave = Math.floor(Number(input?.wave));
    if (!Number.isFinite(score) || score <= 0 || score > 100_000_000) {
      throw new Error("Invalid score");
    }
    if (!Number.isFinite(wave) || wave < 0 || wave > 10_000) {
      throw new Error("Invalid wave");
    }
    return { name, score, wave };
  })
  .handler(
    async ({
      data,
    }): Promise<{
      leaderboard: LeaderboardEntry[];
      rank: number | null;
      qualified: boolean;
    }> => {
      const sql = await getSql();
      const { name, score, wave } = data;

      // Only store if it would land on the board (or board not full yet).
      const current = await fetchTop(sql);
      const qualifies =
        current.length < LB_SIZE || score > (current[current.length - 1]?.score ?? 0);

      if (!qualifies) {
        return { leaderboard: current, rank: null, qualified: false };
      }

      await sql`
        insert into tankz_scores (name, score, wave)
        values (${name}, ${score}, ${wave})
      `;

      // Keep table from growing unbounded — retain a buffer past top N.
      await sql`
        delete from tankz_scores
        where id not in (
          select id from tankz_scores
          order by score desc, created_at asc
          limit ${LB_SIZE * 5}
        )
      `;

      const leaderboard = await fetchTop(sql);
      const rankIdx = leaderboard.findIndex(
        (e) => e.name === name && e.score === score,
      );
      return {
        leaderboard,
        rank: rankIdx >= 0 ? rankIdx + 1 : null,
        qualified: true,
      };
    },
  );
