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

export function cleanName(raw: string): string {
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

/** Top scores from shared Postgres — same board for every client. */
export async function fetchLeaderboard(
  limit = LB_SIZE,
): Promise<LeaderboardEntry[]> {
  const sql = await getSql();
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
    limit ${limit}
  `;
  return mapRows(rows);
}

export type SubmitScoreInput = {
  name: string;
  score: number;
  wave: number;
};

export type SubmitScoreResult = {
  leaderboard: LeaderboardEntry[];
  rank: number | null;
  qualified: boolean;
  highScore: number;
};

/**
 * Persist a score to the shared database, then return the global top board.
 * Every positive score is stored so hall of fame is universal across players.
 */
export async function persistScore(
  input: SubmitScoreInput,
): Promise<SubmitScoreResult> {
  const name = cleanName(input.name);
  const score = Math.floor(Number(input.score));
  const wave = Math.floor(Number(input.wave));

  if (!Number.isFinite(score) || score <= 0 || score > 100_000_000) {
    throw new Error("Invalid score");
  }
  if (!Number.isFinite(wave) || wave < 0 || wave > 10_000) {
    throw new Error("Invalid wave");
  }

  const sql = await getSql();

  // Always write — universal persistence for every completed run that posts.
  await sql`
    insert into tankz_scores (name, score, wave)
    values (${name}, ${score}, ${wave})
  `;

  // Trim old non-top rows so the table cannot grow without bound.
  await sql`
    delete from tankz_scores
    where id in (
      select id from (
        select id,
          row_number() over (order by score desc, created_at asc) as rn
        from tankz_scores
      ) ranked
      where rn > ${LB_SIZE * 20}
    )
  `;

  const leaderboard = await fetchLeaderboard(LB_SIZE);
  const highScore = leaderboard[0]?.score ?? score;
  const rankIdx = leaderboard.findIndex(
    (e) => e.name === name && e.score === score,
  );
  const qualified = rankIdx >= 0;

  return {
    leaderboard,
    rank: qualified ? rankIdx + 1 : null,
    qualified,
    highScore,
  };
}
