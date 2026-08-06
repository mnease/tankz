import { useEffect, useRef, useState, useCallback } from "react";
import {
  TankzEngine,
  type HudSnapshot,
  type GamePhase,
  type UpgradeId,
  type AimMode,
  type ScoreEntry,
} from "./engine";
import { unlockAudio } from "./audio";
import { GAME_VERSION, GAME_GITHUB_URL } from "./version";
import { getLeaderboard, submitScore } from "@/lib/leaderboard";

const TIP_XMONEY_URL = "https://x.com/i/money/pay/nease";
const TIP_VENMO_URL = "https://venmo.com/u/nease";
const XMONEY_LOGO_SRC = "/nease-xmoney-logo.png";

const INITIAL_HUD: HudSnapshot = {
  phase: "title",
  score: 0,
  highScore: 0,
  lives: 3,
  health: 3,
  maxHealth: 3,
  wave: 0,
  levelName: "",
  enemiesLeft: 0,
  powerLabel: null,
  message: null,
  upgradeChoices: null,
  upgrades: {},
  aimMode: "mouse",
  autoTarget: false,
  missilesUnlocked: false,
  missileReady: false,
  missileCd: 0,
  leaderboard: [],
  nameDraft: "AAA",
  nameCursor: 0,
  nameRank: null,
  pendingOutcome: null,
  scoreSubmitting: false,
  boardSynced: false,
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

type TouchState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  aimLeft: boolean;
  aimRight: boolean;
  fire: boolean;
  missile: boolean;
};

export function TankzGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TankzEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const touchRef = useRef<TouchState>({
    left: false,
    right: false,
    up: false,
    down: false,
    aimLeft: false,
    aimRight: false,
    fire: false,
    missile: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new TankzEngine(canvas);
    engineRef.current = engine;
    engine.onSubmitScore = async (entry) => {
      try {
        return await submitScore({
          data: {
            name: entry.name,
            score: entry.score,
            wave: entry.wave,
          },
        });
      } catch {
        return null;
      }
    };
    engine.start();

    // Load global leaderboard shared across all players
    let cancelled = false;
    void getLeaderboard()
      .then((board) => {
        if (cancelled || !engineRef.current) return;
        engineRef.current.applyLeaderboard(board, true);
        setHud(engineRef.current.getHud());
      })
      .catch(() => {
        // Keep offline cache if server unreachable
      });

    const id = window.setInterval(() => {
      setHud(engine.getHud());
    }, 100);

    const relPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onMove = (e: PointerEvent) => {
      const { x, y } = relPos(e);
      engine.setMouse(x, y, true);
    };
    const onLeave = () => {
      engine.setMouse(null, null, false);
      engine.mouseDown = false;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) {
        unlockAudio();
        engine.mouseDown = true;
        const { x, y } = relPos(e);
        engine.setMouse(x, y, true);
      } else if (e.button === 2) {
        unlockAudio();
        engine.mouseRightDown = true;
        e.preventDefault();
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.button === 0) engine.mouseDown = false;
      if (e.button === 2) engine.mouseRightDown = false;
    };
    const onContext = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("contextmenu", onContext);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("contextmenu", onContext);
      window.removeEventListener("pointerup", onUp);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const syncTouch = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    e.touch = { ...touchRef.current };
  }, []);

  const setTouch = useCallback(
    (key: keyof TouchState, v: boolean) => {
      touchRef.current[key] = v;
      syncTouch();
      if (v) unlockAudio();
    },
    [syncTouch],
  );

  const refreshHud = () => {
    if (engineRef.current) setHud(engineRef.current.getHud());
  };

  const primary = () => {
    unlockAudio();
    engineRef.current?.handlePrimaryAction();
  };

  const pickUpgrade = (id: UpgradeId) => {
    unlockAudio();
    engineRef.current?.pickUpgrade(id);
  };

  const setAimMode = (mode: AimMode) => {
    unlockAudio();
    engineRef.current?.setAimMode(mode);
    refreshHud();
  };

  const toggleAutoTarget = () => {
    unlockAudio();
    engineRef.current?.toggleAutoTarget();
    refreshHud();
  };

  const submitName = () => {
    unlockAudio();
    engineRef.current?.submitName();
    refreshHud();
  };

  const nameCycle = (d: number) => {
    unlockAudio();
    engineRef.current?.nameCycle(d);
    refreshHud();
  };

  const nameCursorMove = (d: number) => {
    unlockAudio();
    engineRef.current?.nameCursorMove(d);
    refreshHud();
  };

  const nameType = (ch: string) => {
    unlockAudio();
    engineRef.current?.nameType(ch);
    refreshHud();
  };

  const phase = hud.phase;
  const showMenu =
    phase === "title" ||
    phase === "gameover" ||
    phase === "victory" ||
    phase === "waveClear" ||
    phase === "upgrade" ||
    phase === "enterName" ||
    phase === "paused";

  return (
    <div
      className="relative h-[calc(100dvh-var(--grok-banner-h,0px))] w-full overflow-hidden bg-bg text-fg"
      role="application"
      aria-label="Tankz tank battle game"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
        role="img"
        aria-label="Tankz game playfield"
      />

      {phase !== "title" && phase !== "enterName" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 rounded-md border border-border/80 bg-surface/80 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
                Score
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums tracking-tight">
                {hud.score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-surface/70 px-3 py-1 text-[11px] text-muted backdrop-blur-sm">
              <span className="tracking-wide uppercase">Best</span>
              <span className="font-mono tabular-nums text-fg/90">
                {hud.highScore.toLocaleString()}
              </span>
            </div>
            {Object.keys(hud.upgrades).length > 0 && (
              <div className="flex max-w-[12rem] flex-wrap gap-1">
                {Object.entries(hud.upgrades).map(([id, lv]) => (
                  <span
                    key={id}
                    className="rounded-sm border border-border/60 bg-surface/70 px-1.5 py-0.5 font-mono text-[10px] text-muted tabular-nums"
                  >
                    {shortUpgrade(id as UpgradeId)}
                    {lv > 1 ? `×${lv}` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 rounded-md border border-border/80 bg-surface/80 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
                Wave {hud.wave}
              </span>
              <span className="hidden text-subtle sm:inline">·</span>
              <span className="hidden max-w-[10rem] truncate text-[11px] text-muted sm:inline">
                {hud.levelName}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-surface/70 px-3 py-1.5 backdrop-blur-sm">
              <HealthPips health={hud.health} max={hud.maxHealth} />
              <span className="font-mono text-xs tabular-nums text-muted">
                ×{hud.lives}
              </span>
              {hud.powerLabel && (
                <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                  {hud.powerLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-border/50 bg-surface/60 px-2.5 py-1 text-[11px] text-muted backdrop-blur-sm">
                Hostiles{" "}
                <span className="font-mono tabular-nums text-fg">
                  {hud.enemiesLeft}
                </span>
              </div>
              <div className="rounded-md border border-border/50 bg-surface/60 px-2.5 py-1 text-[11px] text-muted backdrop-blur-sm">
                Aim{" "}
                <span className="font-medium text-fg">
                  {hud.aimMode === "mouse" ? "Mouse" : "Keys"}
                </span>
              </div>
              {hud.autoTarget && (
                <div className="rounded-md border border-accent/40 bg-accent/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent uppercase">
                  Lock
                </div>
              )}
              {hud.missilesUnlocked && (
                <div
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${
                    hud.missileReady
                      ? "border-orange-400/50 bg-orange-400/15 text-orange-300"
                      : "border-border/50 bg-surface/60 text-muted"
                  }`}
                >
                  {hud.missileReady ? "MSL" : `MSL ${hud.missileCd.toFixed(1)}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "playing" && hud.message && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center">
          <div className="rounded-lg border border-border bg-surface/85 px-5 py-2 text-sm font-medium tracking-wide text-fg backdrop-blur-md">
            {hud.message}
          </div>
        </div>
      )}

      {showMenu && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/55 p-4 backdrop-blur-[2px]">
          <div
            className={`flex w-full flex-col gap-3 ${
              phase === "upgrade" || phase === "enterName"
                ? "max-w-2xl"
                : "max-w-md"
            }`}
          >
            <div
              className="rounded-xl border border-border bg-surface/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tankz-menu-title"
            >
              <MenuContent
                phase={phase}
                hud={hud}
                onPrimary={primary}
                onPickUpgrade={pickUpgrade}
                onSetAimMode={setAimMode}
                onSubmitName={submitName}
                onNameCycle={nameCycle}
                onNameCursor={nameCursorMove}
                onNameType={nameType}
              />
            </div>

            {(phase === "title" ||
              phase === "gameover" ||
              phase === "victory") && (
              <footer
                className="flex flex-col gap-2 px-1"
                aria-label="Credits and support"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <TipTheMaker />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="shrink-0 text-[11px] text-subtle">
                      <span className="sr-only">Copyright </span>©{" "}
                      {new Date().getFullYear()} NeaseMedia
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-subtle">
                      <span
                        className="font-mono tabular-nums tracking-wide text-muted"
                        aria-label={`Game version ${GAME_VERSION}`}
                      >
                        v{GAME_VERSION}
                      </span>
                      <a
                        href={GAME_GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-surface-2/80 text-muted transition-colors hover:border-border hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        aria-label="Tankz on GitHub, opens in a new tab"
                        title="View on GitHub"
                      >
                        <GitHubIcon />
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
            )}
          </div>
        </div>
      )}

      {phase === "playing" && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 rounded-full border border-border/50 bg-surface/70 px-3 py-1 text-[11px] text-muted backdrop-blur-sm md:block">
          WASD move on screen ·{" "}
          {hud.aimMode === "mouse" ? "Mouse aim" : "Q/E aim gun"} · Tab lock ·
          Space fire
          {hud.missilesUnlocked ? " · F missiles" : ""} · Esc
        </div>
      )}

      {(phase === "playing" || phase === "paused") && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-medium tracking-[0.14em] text-muted uppercase">
              Move
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <div />
              <TouchBtn
                label="▲"
                ariaLabel="Move up"
                onDown={() => setTouch("up", true)}
                onUp={() => setTouch("up", false)}
              />
              <div />
              <TouchBtn
                label="◀"
                ariaLabel="Move left"
                onDown={() => setTouch("left", true)}
                onUp={() => setTouch("left", false)}
              />
              <TouchBtn
                label="▼"
                ariaLabel="Move down"
                onDown={() => setTouch("down", true)}
                onUp={() => setTouch("down", false)}
              />
              <TouchBtn
                label="▶"
                ariaLabel="Move right"
                onDown={() => setTouch("right", true)}
                onUp={() => setTouch("right", false)}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[9px] font-medium tracking-[0.14em] text-muted uppercase">
              Gun
            </span>
            <div className="flex items-center gap-1.5">
              <TouchBtn
                label="◀"
                ariaLabel="Aim left"
                onDown={() => setTouch("aimLeft", true)}
                onUp={() => setTouch("aimLeft", false)}
              />
              <TouchBtn
                label="FIRE"
                ariaLabel="Fire"
                wide
                onDown={() => setTouch("fire", true)}
                onUp={() => setTouch("fire", false)}
              />
              <TouchBtn
                label="▶"
                ariaLabel="Aim right"
                onDown={() => setTouch("aimRight", true)}
                onUp={() => setTouch("aimRight", false)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <TouchBtn
                label={hud.autoTarget ? "LOCK ON" : "LOCK"}
                ariaLabel="Toggle auto target"
                wide
                onDown={toggleAutoTarget}
                onUp={() => {}}
              />
              {hud.missilesUnlocked && (
                <TouchBtn
                  label={hud.missileReady ? "MSL" : "…"}
                  ariaLabel="Fire missile"
                  wide
                  onDown={() => setTouch("missile", true)}
                  onUp={() => setTouch("missile", false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function shortUpgrade(id: UpgradeId): string {
  const map: Record<UpgradeId, string> = {
    armor: "ARM",
    engine: "ENG",
    reload: "RLD",
    caliber: "AP",
    tracks: "TRK",
    velocity: "VEL",
    life: "LIFE",
    missiles: "MSL",
    homing: "HOM",
    warhead: "HE",
    salvo: "SAL",
  };
  return map[id] ?? id;
}

function HealthPips({ health, max }: { health: number; max: number }) {
  const shown = Math.min(max, 8);
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Health ${health} of ${max}`}
    >
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-[2px] ${
            i < health ? "bg-accent" : "bg-border"
          }`}
        />
      ))}
      {max > 8 && (
        <span className="font-mono text-[10px] text-muted tabular-nums">
          {health}/{max}
        </span>
      )}
    </div>
  );
}

function Leaderboard({
  entries,
  highlight,
  compact,
}: {
  entries: ScoreEntry[];
  highlight?: { name: string; score: number } | null;
  compact?: boolean;
}) {
  if (!entries.length) {
    return (
      <p className="text-center text-xs text-muted">
        No high scores yet — be the first ACE.
      </p>
    );
  }
  return (
    <div className={`space-y-1 ${compact ? "" : ""}`}>
      <div className="mb-1.5 grid grid-cols-[2rem_1fr_auto_auto] gap-2 px-1 text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
        <span>#</span>
        <span>Name</span>
        <span className="text-right">Wave</span>
        <span className="text-right">Score</span>
      </div>
      {entries.map((e, i) => {
        const isHi =
          highlight &&
          e.name === highlight.name &&
          e.score === highlight.score;
        return (
          <div
            key={`${e.name}-${e.score}-${e.at}-${i}`}
            className={`grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2 rounded-md px-1.5 py-1.5 font-mono text-sm tabular-nums ${
              isHi
                ? "border border-accent/40 bg-accent/10 text-accent"
                : "text-fg/90"
            }`}
          >
            <span className="text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-semibold tracking-[0.18em]">{e.name}</span>
            <span className="text-right text-muted">{e.wave || "—"}</span>
            <span className="min-w-[4.5rem] text-right font-semibold">
              {e.score.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function NameEntry({
  hud,
  onSubmit,
  onCycle,
  onCursor,
  onType,
}: {
  hud: HudSnapshot;
  onSubmit: () => void;
  onCycle: (d: number) => void;
  onCursor: (d: number) => void;
  onType: (ch: string) => void;
}) {
  const chars = hud.nameDraft.padEnd(3, "A").split("").slice(0, 8);
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <p className="text-[11px] font-medium tracking-[0.22em] text-accent uppercase">
          New High Score
        </p>
        <h2
          id="tankz-menu-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Enter Initials
        </h2>
        <p className="font-mono text-sm tabular-nums text-muted">
          {hud.score.toLocaleString()} pts
          {hud.nameRank != null ? ` · Rank #${hud.nameRank}` : ""}
        </p>
      </div>

      {/* Letter slots */}
      <div className="flex items-center justify-center gap-2">
        {chars.map((ch, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Letter position ${i + 1}, ${ch}${i === hud.nameCursor ? ", selected" : ""}`}
            aria-pressed={i === hud.nameCursor}
            onClick={() => {
              const delta = i - hud.nameCursor;
              if (delta !== 0) onCursor(delta);
            }}
            className={`flex h-14 w-12 flex-col items-center justify-center rounded-lg border font-mono text-2xl font-bold tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              i === hud.nameCursor
                ? "border-accent bg-accent/15 text-accent shadow-[0_0_20px_rgba(94,234,212,0.15)]"
                : "border-border bg-surface-2 text-fg"
            }`}
          >
            <span aria-hidden="true">{ch}</span>
            {i === hud.nameCursor && (
              <span className="mt-0.5 h-0.5 w-6 animate-pulse rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Move cursor left"
          onClick={() => onCursor(-1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">◀</span>
        </button>
        <button
          type="button"
          aria-label="Previous letter"
          onClick={() => onCycle(1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">▲</span>
        </button>
        <button
          type="button"
          aria-label="Next letter"
          onClick={() => onCycle(-1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">▼</span>
        </button>
        <button
          type="button"
          aria-label="Move cursor right"
          onClick={() => onCursor(1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">▶</span>
        </button>
      </div>

      {/* Letter pad for touch */}
      <div className="grid grid-cols-9 gap-1 sm:grid-cols-12">
        {LETTERS.map((ch) => (
          <button
            key={ch}
            type="button"
            aria-label={`Type letter ${ch}`}
            onClick={() => onType(ch)}
            className="rounded-md border border-border/70 bg-surface-2 py-2 font-mono text-xs font-semibold text-fg hover:border-accent/40 hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
          >
            {ch}
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted">
        Type letters · ←→ move · ↑↓ cycle · Enter confirm
        <span className="mt-1 block text-subtle">
          Saves to the global hall of fame
        </span>
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={hud.scoreSubmitting}
        className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
      >
        {hud.scoreSubmitting ? "Saving…" : "Register Score"}
      </button>
    </div>
  );
}

function AimModeToggle({
  mode,
  onChange,
}: {
  mode: AimMode;
  onChange: (m: AimMode) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-center text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
        Aim control
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("keys")}
          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
            mode === "keys"
              ? "border-accent/50 bg-accent/15 text-fg"
              : "border-border bg-surface-2 text-muted hover:border-border hover:text-fg"
          }`}
        >
          Keys
          <span className="mt-0.5 block text-[10px] font-normal opacity-70">
            Q/E · ←/→
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("mouse")}
          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
            mode === "mouse"
              ? "border-accent/50 bg-accent/15 text-fg"
              : "border-border bg-surface-2 text-muted hover:border-border hover:text-fg"
          }`}
        >
          Mouse
          <span className="mt-0.5 block text-[10px] font-normal opacity-70">
            Point to aim
          </span>
        </button>
      </div>
      <p className="text-center text-[10px] text-subtle">
        Press <span className="font-mono text-muted">M</span> to switch aim ·{" "}
        <span className="font-mono text-muted">Tab</span> auto-target
      </p>
    </div>
  );
}

function MenuContent({
  phase,
  hud,
  onPrimary,
  onPickUpgrade,
  onSetAimMode,
  onSubmitName,
  onNameCycle,
  onNameCursor,
  onNameType,
}: {
  phase: GamePhase;
  hud: HudSnapshot;
  onPrimary: () => void;
  onPickUpgrade: (id: UpgradeId) => void;
  onSetAimMode: (mode: AimMode) => void;
  onSubmitName: () => void;
  onNameCycle: (d: number) => void;
  onNameCursor: (d: number) => void;
  onNameType: (ch: string) => void;
}) {
  if (phase === "title") {
    return (
      <div className="max-h-[min(88dvh,820px)] space-y-4 overflow-y-auto pr-0.5">
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.22em] text-accent uppercase">
            Armor Division
          </p>
          <h1
            id="tankz-menu-title"
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Tankz
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Move with WASD on the screen, aim the gun separately. Clear waves,
            kit out your tank, and claim a spot on the hall of fame.
          </p>
        </div>
        <AimModeToggle mode={hud.aimMode} onChange={onSetAimMode} />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted">
          <Hint k="WASD" v="Move (screen)" />
          <Hint k="Mouse / Q E" v="Aim gun" />
          <Hint k="Space" v="Fire cannon" />
          <Hint k="F" v="Missiles" />
          <Hint k="Tab" v="Auto-target" />
          <Hint k="M" v="Aim mode" />
        </div>
        {hud.leaderboard.length > 0 && (
          <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3">
            <p className="mb-2 text-center text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
              Hall of Fame{hud.boardSynced ? " · Global" : ""}
            </p>
            <Leaderboard entries={hud.leaderboard.slice(0, 5)} compact />
          </div>
        )}
        <button
          type="button"
          onClick={onPrimary}
          className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
        >
          Deploy
        </button>
      </div>
    );
  }

  if (phase === "enterName") {
    return (
      <NameEntry
        hud={hud}
        onSubmit={onSubmitName}
        onCycle={onNameCycle}
        onCursor={onNameCursor}
        onType={onNameType}
      />
    );
  }

  if (phase === "upgrade" && hud.upgradeChoices) {
    return (
      <div className="space-y-5">
        <div className="space-y-1 text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent uppercase">
            Wave {hud.wave} cleared
          </p>
          <h2
            id="tankz-menu-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Field Upgrade
          </h2>
          <p className="text-sm text-muted">
            Choose one permanent upgrade. Keys 1–3 also work.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {hud.upgradeChoices.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPickUpgrade(c.id)}
              className="group flex flex-col rounded-lg border border-border bg-surface-2 p-4 text-left transition-colors hover:border-accent/50 hover:bg-bg active:scale-[0.99]"
            >
              <span className="mb-2 font-mono text-[10px] tracking-wider text-muted uppercase">
                {i + 1} · Lv {c.level}
              </span>
              <span className="text-sm font-semibold text-fg">{c.name}</span>
              <span className="mt-1 text-xs leading-relaxed text-muted">
                {c.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "paused") {
    return (
      <div className="space-y-5">
        <div className="space-y-1 text-center">
          <h2
            id="tankz-menu-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Paused
          </h2>
          <p className="text-sm text-muted">Battlefield on hold.</p>
        </div>
        <AimModeToggle mode={hud.aimMode} onChange={onSetAimMode} />
        <button
          type="button"
          onClick={onPrimary}
          className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]"
        >
          Resume
        </button>
      </div>
    );
  }

  if (phase === "waveClear") {
    return (
      <div className="space-y-5 text-center">
        <p className="text-[11px] font-medium tracking-[0.18em] text-accent uppercase">
          Wave {hud.wave}
        </p>
        <h2
          id="tankz-menu-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Sector Quiet
        </h2>
        <p className="font-mono text-sm tabular-nums text-muted">
          Score {hud.score.toLocaleString()}
        </p>
        <button
          type="button"
          onClick={onPrimary}
          className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]"
        >
          Next Wave
        </button>
      </div>
    );
  }

  if (phase === "victory") {
    return (
      <div className="space-y-5">
        <div className="space-y-1 text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent uppercase">
            Victory
          </p>
          <h2
            id="tankz-menu-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Sector Cleared
          </h2>
          <p className="font-mono text-sm tabular-nums text-muted">
            Final score {hud.score.toLocaleString()}
          </p>
        </div>
        {hud.leaderboard.length > 0 && (
          <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3">
            <p className="mb-2 text-center text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
              Hall of Fame{hud.boardSynced ? " · Global" : ""}
            </p>
            <Leaderboard
              entries={hud.leaderboard}
              highlight={
                hud.nameRank
                  ? { name: hud.nameDraft, score: hud.score }
                  : null
              }
            />
          </div>
        )}
        <button
          type="button"
          onClick={onPrimary}
          className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
        >
          Play Again
        </button>
      </div>
    );
  }

  // gameover
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <p className="text-[11px] font-medium tracking-[0.18em] text-danger uppercase">
          Destroyed
        </p>
        <h2
          id="tankz-menu-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Mission Failed
        </h2>
        <p className="font-mono text-sm tabular-nums text-muted">
          Score {hud.score.toLocaleString()}
        </p>
      </div>
      {hud.leaderboard.length > 0 && (
        <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3">
          <p className="mb-2 text-center text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
            Hall of Fame{hud.boardSynced ? " · Global" : ""}
          </p>
          <Leaderboard
            entries={hud.leaderboard}
            highlight={
              hud.nameRank ? { name: hud.nameDraft, score: hud.score } : null
            }
          />
        </div>
      )}
      <button
        type="button"
        onClick={onPrimary}
        className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
      >
        Retry
      </button>
    </div>
  );
}

function TipTheMaker({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.code !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      (triggerRef.current ?? prev)?.focus?.();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-3 font-semibold text-accent transition-colors hover:bg-accent/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] ${
          compact ? "w-full py-2 text-sm" : "w-full py-2.5 text-sm sm:w-auto"
        }`}
      >
        <span aria-hidden="true" className="text-base">
          ✦
        </span>
        Tip the Game Maker
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tip-dialog-title"
            aria-describedby="tip-dialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
                  Support
                </p>
                <h3
                  id="tip-dialog-title"
                  className="mt-0.5 text-lg font-semibold tracking-tight text-fg"
                >
                  Tip the Game Maker
                </h3>
                <p
                  id="tip-dialog-desc"
                  className="mt-1 text-xs leading-relaxed text-muted"
                >
                  Thanks for playing Tankz — choose xMoney or Venmo to send a
                  tip. Links open in a new tab.
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label="Close tip dialog"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <ul className="space-y-3" aria-label="Tip payment options">
              <li>
                <a
                  href={TIP_XMONEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Tip via xMoney on X, opens in a new tab"
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3 transition-colors hover:border-accent/40 hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
                >
                  <XMoneyLogo />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-fg">xMoney</p>
                    <p className="truncate text-[11px] text-muted">
                      x.com/i/money/pay/nease
                    </p>
                  </div>
                  <span className="text-xs text-accent" aria-hidden="true">
                    Open →
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={TIP_VENMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Tip via Venmo user nease, opens in a new tab"
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3 transition-colors hover:border-[#008CFF]/50 hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
                >
                  <VenmoLogo />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-fg">Venmo</p>
                    <p className="truncate text-[11px] text-muted">@nease</p>
                  </div>
                  <span className="text-xs text-[#5eb3ff]" aria-hidden="true">
                    Open →
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function XMoneyLogo() {
  return (
    <img
      src={XMONEY_LOGO_SRC}
      alt="xMoney logo"
      width={48}
      height={48}
      className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
      draggable={false}
    />
  );
}

function VenmoLogo() {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#008CFF] text-white shadow-sm"
      role="img"
      aria-label="Venmo logo"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M20.2 2.4c.7 1.2 1 2.5 1 4.1 0 5.1-4.3 11.7-7.8 15.5h-8L2.3 3.6h7.4l1.7 13.2c1.9-3.1 4.2-8 4.2-11.3 0-1.1-.2-1.9-.5-2.6l5.1-.5z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2C6.477 2 2 6.486 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.486 17.523 2 12 2z" />
    </svg>
  );
}

function Hint({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/70 bg-surface-2/80 px-2.5 py-2">
      <span className="font-mono text-[11px] text-fg">{k}</span>
      <span>{v}</span>
    </div>
  );
}

function TouchBtn({
  label,
  ariaLabel,
  onDown,
  onUp,
  wide,
}: {
  label: string;
  ariaLabel: string;
  onDown: () => void;
  onUp: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`select-none rounded-lg border border-border/80 bg-surface/80 text-sm font-semibold text-fg shadow-sm backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-accent/20 ${
        wide ? "h-16 w-20" : "flex h-14 w-14 items-center justify-center"
      }`}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onUp();
      }}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span aria-hidden="true">{label}</span>
    </button>
  );
}
