-- Global arcade leaderboard (shared across all clients)
create table if not exists tankz_scores (
  id serial primary key,
  name text not null,
  score integer not null check (score >= 0 and score <= 100000000),
  wave integer not null default 0 check (wave >= 0 and wave <= 10000),
  created_at timestamptz not null default now()
);

create index if not exists tankz_scores_rank_idx
  on tankz_scores (score desc, created_at asc);
