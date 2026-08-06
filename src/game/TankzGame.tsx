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
    engine.start();

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
    <div className="relative h-[calc(100dvh-var(--grok-banner-h,0px))] w-full overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
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
            className={`w-full border border-border bg-surface/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8 ${
              phase === "upgrade" || phase === "enterName"
                ? "max-w-2xl rounded-xl"
                : "max-w-md rounded-xl"
            }`}
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
        </div>
      )}

      {phase === "playing" && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 rounded-full border border-border/50 bg-surface/70 px-3 py-1 text-[11px] text-muted backdrop-blur-sm md:block">
          WASD body ·{" "}
          {hud.aimMode === "mouse" ? "Mouse aim" : "Q/E or ←→ aim"} · Tab
          lock · Space fire
          {hud.missilesUnlocked ? " · F/RMB missiles" : ""} · M aim mode · Esc
        </div>
      )}

      {(phase === "playing" || phase === "paused") && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-medium tracking-[0.14em] text-muted uppercase">
              Drive
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <div />
              <TouchBtn
                label="▲"
                ariaLabel="Forward"
                onDown={() => setTouch("up", true)}
                onUp={() => setTouch("up", false)}
              />
              <div />
              <TouchBtn
                label="◀"
                ariaLabel="Turn body left"
                onDown={() => setTouch("left", true)}
                onUp={() => setTouch("left", false)}
              />
              <TouchBtn
                label="▼"
                ariaLabel="Reverse"
                onDown={() => setTouch("down", true)}
                onUp={() => setTouch("down", false)}
              />
              <TouchBtn
                label="▶"
                ariaLabel="Turn body right"
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
        <h2 className="text-2xl font-semibold tracking-tight">
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
            onClick={() => {
              // focus this slot by moving cursor via cycles of move
              const delta = i - hud.nameCursor;
              if (delta !== 0) onCursor(delta);
            }}
            className={`flex h-14 w-12 flex-col items-center justify-center rounded-lg border font-mono text-2xl font-bold tracking-widest transition-colors ${
              i === hud.nameCursor
                ? "border-accent bg-accent/15 text-accent shadow-[0_0_20px_rgba(94,234,212,0.15)]"
                : "border-border bg-surface-2 text-fg"
            }`}
          >
            {ch}
            {i === hud.nameCursor && (
              <span className="mt-0.5 h-0.5 w-6 animate-pulse rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onCursor(-1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => onCycle(1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onCycle(-1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={() => onCursor(1)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted"
        >
          ▶
        </button>
      </div>

      {/* Letter pad for touch */}
      <div className="grid grid-cols-9 gap-1 sm:grid-cols-12">
        {LETTERS.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => onType(ch)}
            className="rounded-md border border-border/70 bg-surface-2 py-2 font-mono text-xs font-semibold text-fg hover:border-accent/40 hover:bg-bg active:scale-95"
          >
            {ch}
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted">
        Type letters · ←→ move · ↑↓ cycle · Enter confirm
      </p>

      <button
        type="button"
        onClick={onSubmit}
        className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]"
      >
        Register Score
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
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.22em] text-accent uppercase">
            Armor Division
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Tankz
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Drive the hull and aim the gun separately. Clear waves, kit out
            your tank, and claim a spot on the hall of fame.
          </p>
        </div>
        <AimModeToggle mode={hud.aimMode} onChange={onSetAimMode} />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted">
          <Hint k="W / S" v="Drive" />
          <Hint k="A / D" v="Turn body" />
          <Hint k="Q / E · ←/→" v="Aim (keys)" />
          <Hint k="Mouse" v="Aim (mouse)" />
          <Hint k="Tab" v="Auto-target" />
          <Hint k="M" v="Toggle aim mode" />
        </div>
        {hud.leaderboard.length > 0 && (
          <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3">
            <p className="mb-2 text-center text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
              Hall of Fame
            </p>
            <Leaderboard entries={hud.leaderboard.slice(0, 5)} compact />
          </div>
        )}
        <button
          type="button"
          onClick={onPrimary}
          className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]"
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
          <h2 className="text-2xl font-semibold tracking-tight">
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
          <h2 className="text-2xl font-semibold tracking-tight">Paused</h2>
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
        <h2 className="text-2xl font-semibold tracking-tight">Sector Quiet</h2>
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
          <h2 className="text-2xl font-semibold tracking-tight">
            Sector Cleared
          </h2>
          <p className="font-mono text-sm tabular-nums text-muted">
            Final score {hud.score.toLocaleString()}
          </p>
        </div>
        {hud.leaderboard.length > 0 && (
          <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3">
            <p className="mb-2 text-center text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
              Hall of Fame
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
          className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]"
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
        <h2 className="text-2xl font-semibold tracking-tight">
          Mission Failed
        </h2>
        <p className="font-mono text-sm tabular-nums text-muted">
          Score {hud.score.toLocaleString()}
        </p>
      </div>
      {hud.leaderboard.length > 0 && (
        <div className="rounded-lg border border-border/70 bg-surface-2/60 p-3">
          <p className="mb-2 text-center text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
            Hall of Fame
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
        className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]"
      >
        Retry
      </button>
    </div>
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
      className={`select-none rounded-lg border border-border/80 bg-surface/80 text-sm font-semibold text-fg shadow-sm backdrop-blur-sm active:bg-accent/20 ${
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
      {label}
    </button>
  );
}
