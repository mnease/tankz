import {
  TILE,
  WORLD_COLS,
  WORLD_ROWS,
  getLevel,
  levelCount,
  parseLevel,
  type TileChar,
} from "./levels";
import { sfx, unlockAudio } from "./audio";

export type GamePhase =
  | "title"
  | "playing"
  | "paused"
  | "waveClear"
  | "upgrade"
  | "gameover"
  | "victory";

export type UpgradeId =
  | "armor"
  | "engine"
  | "reload"
  | "caliber"
  | "tracks"
  | "velocity"
  | "life"
  | "missiles"
  | "homing"
  | "warhead"
  | "salvo";

export interface UpgradeChoice {
  id: UpgradeId;
  name: string;
  desc: string;
  level: number;
}

export type AimMode = "keys" | "mouse";

export interface HudSnapshot {
  phase: GamePhase;
  score: number;
  highScore: number;
  lives: number;
  health: number;
  maxHealth: number;
  wave: number;
  levelName: string;
  enemiesLeft: number;
  powerLabel: string | null;
  message: string | null;
  upgradeChoices: UpgradeChoice[] | null;
  upgrades: Partial<Record<UpgradeId, number>>;
  aimMode: AimMode;
  autoTarget: boolean;
  missilesUnlocked: boolean;
  missileReady: boolean;
  missileCd: number;
}

export type ControlsProbe = {
  getYaw: () => number;
  getHullYaw?: () => number;
  getTurretYaw?: () => number;
  getSpeed: () => number;
  setSteer: (v: number) => void;
  setTurret?: (v: number) => void;
  setThrottle: (v: number) => void;
  setKeys: (codes: string[]) => void;
  getPosition: () => { x: number; y: number };
  getForward: () => { x: number; y: number };
  getAimForward?: () => { x: number; y: number };
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
    __tankz?: {
      getHud: () => HudSnapshot;
      start: () => void;
      fire: () => void;
      getActiveBullets: () => { x: number; y: number; vx: number; vy: number }[];
      pickUpgrade: (id: UpgradeId) => void;
      forceUpgradeScreen?: () => void;
      getAimMode?: () => AimMode;
      setAimMode?: (mode: AimMode) => void;
      toggleAimMode?: () => void;
      toggleAutoTarget?: () => void;
    };
  }
}

type Team = "player" | "enemy";

interface Tank {
  id: number;
  team: Team;
  x: number;
  y: number;
  /** Hull facing (movement). 0 = north (−Y); + = left (CCW). */
  hullAngle: number;
  /** Gun facing (aim + fire). A/D rotates this only. */
  turretAngle: number;
  speed: number;
  radius: number;
  health: number;
  maxHealth: number;
  fireCd: number;
  fireRate: number;
  bulletSpeed: number;
  bulletDamage: number;
  alive: boolean;
  invuln: number;
  aiTimer: number;
  aiSteer: number;
  aiThrottle: number;
  aiWantFire: boolean;
  track: number;
  maxMove?: number;
}

interface Bullet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: Team;
  damage: number;
  life: number;
  radius: number;
  kind: "shell" | "missile";
  /** Homing turn rate (rad/s); 0 = dumbfire */
  home: number;
  splash: number;
  targetId: number | null;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Explosion {
  active: boolean;
  x: number;
  y: number;
  t: number;
  scale: number;
}

interface Pickup {
  active: boolean;
  x: number;
  y: number;
  kind: "repair" | "rapid" | "shield" | "star";
  life: number;
}

const FIXED_DT = 1 / 60;
const MAX_BULLETS = 96;
const MAX_PARTICLES = 220;
const MAX_EXPLOSIONS = 16;
const MAX_ENEMIES = 10;
const HS_KEY = "tankz-highscore-v1";
const AIM_KEY = "tankz-aim-mode-v1";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function wrapAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** Unit forward. angle 0 = north (−Y); +angle turns left (CCW). */
function forwardFromAngle(angle: number): { x: number; y: number } {
  return { x: -Math.sin(angle), y: -Math.cos(angle) };
}

function loadHighScore() {
  try {
    return Number(localStorage.getItem(HS_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(n: number) {
  try {
    localStorage.setItem(HS_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function loadAimMode(): AimMode {
  try {
    const v = localStorage.getItem(AIM_KEY);
    if (v === "keys" || v === "mouse") return v;
  } catch {
    /* ignore */
  }
  return "mouse";
}

function saveAimMode(mode: AimMode) {
  try {
    localStorage.setItem(AIM_KEY, mode);
  } catch {
    /* ignore */
  }
}

export class TankzEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  dpr = 1;

  phase: GamePhase = "title";
  score = 0;
  highScore = 0;
  lives = 3;
  wave = 0;
  levelIndex = 0;
  levelName = "";
  message: string | null = null;
  messageT = 0;

  tiles: TileChar[][] = [];
  brickHp: number[][] = [];

  player!: Tank;
  enemies: Tank[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  explosions: Explosion[] = [];
  pickups: Pickup[] = [];

  keys = new Set<string>();
  /** +1 left, −1 right — steers hull (body) */
  injectSteer: number | null = null;
  /** +1 left, −1 right — steers turret only */
  injectTurret: number | null = null;
  injectThrottle: number | null = null;

  camX = 0;
  camY = 0;
  shake = 0;
  hitStop = 0;
  powerTimer = 0;
  powerKind: Pickup["kind"] | null = null;

  /** Persistent run stats (base stats + upgrades) */
  run = {
    maxHealth: 3,
    maxSpeed: 165,
    accel: 320,
    fireRate: 0.32,
    bulletDamage: 1,
    bulletSpeed: 420,
    hullTurn: 2.6,
    turretTurn: 3.4,
    missiles: false,
    missileDamage: 2,
    missileSpeed: 280,
    missileCd: 1.35,
    missileHome: 0,
    missileSplash: 0,
    missileCount: 1,
  };
  upgrades: Partial<Record<UpgradeId, number>> = {};
  upgradeChoices: UpgradeChoice[] | null = null;
  /** Secondary weapon cooldown (missiles) */
  missileFireCd = 0;

  /** Screen-space mouse over canvas (CSS pixels); null if unknown */
  mouseX: number | null = null;
  mouseY: number | null = null;
  /** When true, pointer is over canvas */
  mouseAim = false;
  mouseDown = false;
  mouseRightDown = false;
  /** Explicit aim control scheme */
  aimMode: AimMode = "mouse";
  /** Tab toggles soft lock — turret tracks nearest hostile */
  autoTarget = false;
  autoTargetId: number | null = null;

  touch = {
    left: false,
    right: false,
    up: false,
    down: false,
    aimLeft: false,
    aimRight: false,
    fire: false,
    missile: false,
  };

  images: {
    player: HTMLImageElement | null;
    enemy: HTMLImageElement | null;
    boom: HTMLImageElement[];
  } = { player: null, enemy: null, boom: [] };

  private raf = 0;
  private last = 0;
  private acc = 0;
  private idSeq = 1;
  private running = false;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;
  private boundResize: () => void;
  private boundVis: () => void;
  private enemySpawns: { x: number; y: number }[] = [];
  private spawnQueue = 0;
  private spawnTimer = 0;
  private enemiesToSpawn = 0;
  private enemiesKilledWave = 0;
  private enemiesThisWave = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.highScore = loadHighScore();
    this.aimMode = loadAimMode();

    for (let i = 0; i < MAX_BULLETS; i++) {
      this.bullets.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        team: "player",
        damage: 1,
        life: 0,
        radius: 4,
        kind: "shell",
        home: 0,
        splash: 0,
        targetId: null,
      });
    }
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: "#fff",
      });
    }
    for (let i = 0; i < MAX_EXPLOSIONS; i++) {
      this.explosions.push({ active: false, x: 0, y: 0, t: 0, scale: 1 });
    }

    this.player = this.makeTank("player", 0, 0, 0);

    this.boundKeyDown = (e) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
          "Escape",
          "Tab",
        ].includes(e.code)
      ) {
        e.preventDefault();
      }
      this.keys.add(e.code);
      if (
        this.phase === "upgrade" &&
        (e.code === "Digit1" ||
          e.code === "Digit2" ||
          e.code === "Digit3" ||
          e.code === "Numpad1" ||
          e.code === "Numpad2" ||
          e.code === "Numpad3")
      ) {
        const map: Record<string, number> = {
          Digit1: 0,
          Digit2: 1,
          Digit3: 2,
          Numpad1: 0,
          Numpad2: 1,
          Numpad3: 2,
        };
        const idx = map[e.code] ?? -1;
        const choice = this.upgradeChoices?.[idx];
        if (choice) this.pickUpgrade(choice.id);
        return;
      }
      // Auto-target lock
      if (e.code === "Tab" && this.phase === "playing") {
        e.preventDefault();
        this.toggleAutoTarget();
        return;
      }
      // Toggle aim mode: M only
      if (
        e.code === "KeyM" &&
        (this.phase === "playing" ||
          this.phase === "paused" ||
          this.phase === "title")
      ) {
        e.preventDefault();
        this.toggleAimMode();
        return;
      }
      if (
        (e.code === "KeyP" || e.code === "Escape") &&
        this.phase === "playing"
      ) {
        this.phase = "paused";
      } else if (
        (e.code === "KeyP" || e.code === "Escape") &&
        this.phase === "paused"
      ) {
        this.phase = "playing";
      } else if (
        (e.code === "Enter" || e.code === "Space") &&
        (this.phase === "title" ||
          this.phase === "gameover" ||
          this.phase === "victory")
      ) {
        e.preventDefault();
        this.handlePrimaryAction();
      }
    };
    this.boundKeyUp = (e) => {
      this.keys.delete(e.code);
    };
    this.boundBlur = () => {
      this.keys.clear();
      if (this.phase === "playing") this.phase = "paused";
    };
    this.boundResize = () => this.resize();
    this.boundVis = () => {
      if (document.hidden) this.boundBlur();
      else this.keys.clear();
    };

    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
    window.addEventListener("blur", this.boundBlur);
    window.addEventListener("resize", this.boundResize);
    document.addEventListener("visibilitychange", this.boundVis);

    this.resize();
    void this.loadAssets();
    this.wireQa();
  }

  private wireQa() {
    if (typeof window === "undefined") return;
    window.__controlsTest = {
      // A/D steers hull — controls skill uses getYaw for body left/right
      getYaw: () => this.player.hullAngle,
      getHullYaw: () => this.player.hullAngle,
      getTurretYaw: () => this.player.turretAngle,
      getSpeed: () => this.player.speed,
      setSteer: (v) => {
        this.injectSteer = v;
      },
      setTurret: (v) => {
        this.injectTurret = v;
      },
      setThrottle: (v) => {
        this.injectThrottle = v;
      },
      setKeys: (codes) => {
        this.keys.clear();
        for (const c of codes) this.keys.add(c);
      },
      getPosition: () => ({ x: this.player.x, y: this.player.y }),
      getForward: () => forwardFromAngle(this.player.hullAngle),
      getAimForward: () => forwardFromAngle(this.player.turretAngle),
    };
    window.__tankz = {
      getHud: () => this.getHud(),
      start: () => this.startGame(),
      fire: () => {
        if (this.phase === "playing") this.tryFire(this.player);
      },
      getActiveBullets: () =>
        this.bullets
          .filter((b) => b.active && b.team === "player")
          .map((b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy })),
      pickUpgrade: (id) => this.pickUpgrade(id),
      forceUpgradeScreen: () => {
        this.rollUpgradeChoices();
        this.phase = "upgrade";
      },
      getAimMode: () => this.aimMode,
      setAimMode: (mode: AimMode) => this.setAimMode(mode),
      toggleAutoTarget: () => this.toggleAutoTarget(),
    };
  }

  private async loadAssets() {
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(src));
        img.src = src;
      });
    try {
      this.images.player = await load("/sprites/player-tank.png");
      this.images.enemy = await load("/sprites/enemy-tank.png");
      this.images.boom = await Promise.all([
        load("/sprites/boom-1.png"),
        load("/sprites/boom-2.png"),
        load("/sprites/boom-3.png"),
        load("/sprites/boom-4.png"),
      ]);
    } catch {
      /* procedural draw still works */
    }
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    window.removeEventListener("blur", this.boundBlur);
    window.removeEventListener("resize", this.boundResize);
    document.removeEventListener("visibilitychange", this.boundVis);
    if (window.__controlsTest) delete window.__controlsTest;
    if (window.__tankz) delete window.__tankz;
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = w;
    this.height = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      dt = Math.min(dt, 0.1);
      this.acc += dt;
      while (this.acc >= FIXED_DT) {
        if (this.hitStop > 0) {
          this.hitStop -= FIXED_DT;
        } else if (this.phase === "playing") {
          this.fixedUpdate(FIXED_DT);
        } else {
          this.idleUpdate(FIXED_DT);
        }
        this.acc -= FIXED_DT;
      }
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  handlePrimaryAction() {
    unlockAudio();
    if (this.phase === "title") {
      this.startGame();
    } else if (this.phase === "waveClear") {
      this.nextWave();
    } else if (this.phase === "gameover" || this.phase === "victory") {
      this.startGame();
    } else if (this.phase === "paused") {
      this.phase = "playing";
    }
  }

  startGame() {
    unlockAudio();
    sfx.start();
    this.score = 0;
    this.lives = 3;
    this.wave = 0;
    this.levelIndex = 0;
    this.powerTimer = 0;
    this.powerKind = null;
    this.upgrades = {};
    this.upgradeChoices = null;
    this.autoTarget = false;
    this.autoTargetId = null;
    this.missileFireCd = 0;
    this.run = {
      maxHealth: 3,
      maxSpeed: 165,
      accel: 320,
      fireRate: 0.32,
      bulletDamage: 1,
      bulletSpeed: 420,
      hullTurn: 2.6,
      turretTurn: 3.4,
      missiles: false,
      missileDamage: 2,
      missileSpeed: 280,
      missileCd: 1.35,
      missileHome: 0,
      missileSplash: 0,
      missileCount: 1,
    };
    this.phase = "playing";
    this.loadLevel(0);
    this.applyRunStatsToPlayer(true);
    this.beginWave();
  }

  private loadLevel(idx: number) {
    this.levelIndex = idx;
    const def = getLevel(idx);
    this.levelName = def.name;
    const parsed = parseLevel(def);
    this.tiles = parsed.tiles;
    this.enemySpawns = parsed.enemySpawns;
    this.brickHp = this.tiles.map((row) =>
      row.map((t) => (t === "#" ? 2 : t === "S" ? 999 : 0)),
    );
    this.enemies = [];
    this.pickups = [];
    for (const b of this.bullets) b.active = false;
    for (const p of this.particles) p.active = false;
    for (const e of this.explosions) e.active = false;

    this.player = this.makeTank(
      "player",
      parsed.playerSpawn.x,
      parsed.playerSpawn.y,
      0,
    );
    this.applyRunStatsToPlayer(true);
    this.player.invuln = 1.2;
    this.camX = this.player.x;
    this.camY = this.player.y;
  }

  private beginWave() {
    this.wave += 1;
    const base = 3 + this.wave + Math.floor(this.wave / 2);
    this.enemiesThisWave = Math.min(base, 12 + this.wave);
    this.enemiesToSpawn = this.enemiesThisWave;
    this.enemiesKilledWave = 0;
    this.spawnQueue = this.enemiesToSpawn;
    this.spawnTimer = 0.2;
    this.message = `Wave ${this.wave}`;
    this.messageT = 1.6;
    if (this.wave > 1 && (this.wave - 1) % 2 === 0) {
      const next = Math.min(this.levelIndex + 1, levelCount() - 1);
      if (next !== this.levelIndex) {
        const px = this.player.x;
        const py = this.player.y;
        const hp = this.player.health;
        const ha = this.player.hullAngle;
        const ta = this.player.turretAngle;
        this.loadLevel(next);
        this.player.x = px;
        this.player.y = py;
        this.player.health = hp;
        this.player.hullAngle = ha;
        this.player.turretAngle = ta;
        this.message = `${this.levelName} · Wave ${this.wave}`;
      }
    }
  }

  private nextWave() {
    this.phase = "playing";
    this.upgradeChoices = null;
    this.beginWave();
  }

  private applyRunStatsToPlayer(fullHeal: boolean) {
    const p = this.player;
    if (!p) return;
    p.maxHealth = this.run.maxHealth;
    if (fullHeal) p.health = this.run.maxHealth;
    else p.health = Math.min(p.health, p.maxHealth);
    // Don't stomp temporary powerups
    if (!this.powerKind || this.powerKind === "repair" || this.powerKind === "shield") {
      p.fireRate = this.run.fireRate;
      p.bulletDamage = this.run.bulletDamage;
      p.bulletSpeed = this.run.bulletSpeed;
    }
    if (this.powerKind === "rapid") {
      p.fireRate = Math.min(this.run.fireRate, 0.14);
    }
    if (this.powerKind === "star") {
      p.bulletDamage = Math.max(this.run.bulletDamage, 2);
      p.bulletSpeed = Math.max(this.run.bulletSpeed, 520);
      p.fireRate = Math.min(this.run.fireRate, 0.22);
    }
  }

  private upgradeCatalog(): {
    id: UpgradeId;
    name: string;
    desc: string;
    max: number;
  }[] {
    return [
      {
        id: "armor",
        name: "Reactive Armor",
        desc: "+1 max hull integrity",
        max: 4,
      },
      {
        id: "engine",
        name: "Tuned Engine",
        desc: "+18% top speed & accel",
        max: 4,
      },
      {
        id: "reload",
        name: "Autoloader",
        desc: "Faster cannon reload",
        max: 5,
      },
      {
        id: "caliber",
        name: "AP Rounds",
        desc: "+1 shell damage",
        max: 3,
      },
      {
        id: "tracks",
        name: "Servo Tracks",
        desc: "Faster hull & turret turn",
        max: 4,
      },
      {
        id: "velocity",
        name: "Hot Propellant",
        desc: "Faster shell velocity",
        max: 4,
      },
      {
        id: "life",
        name: "Reserve Crew",
        desc: "+1 life",
        max: 3,
      },
      {
        id: "missiles",
        name: "Rocket Pod",
        desc: this.run.missiles
          ? "+missile damage & reload"
          : "Unlock missiles (F / RMB)",
        max: 4,
      },
      {
        id: "homing",
        name: "Seeker Heads",
        desc: this.run.missileHome > 0
          ? "Stronger missile tracking"
          : "Missiles home on targets",
        max: 3,
      },
      {
        id: "warhead",
        name: "HE Warheads",
        desc: "Missile splash radius",
        max: 3,
      },
      {
        id: "salvo",
        name: "Salvo Link",
        desc: "Fire extra missiles per volley",
        max: 2,
      },
    ];
  }

  private rollUpgradeChoices() {
    const cat = this.upgradeCatalog().filter((u) => {
      const lv = this.upgrades[u.id] ?? 0;
      return lv < u.max;
    });
    // Prefer offering a missile-tree pick once combat is underway
    const missileIds: UpgradeId[] = ["missiles", "homing", "warhead", "salvo"];
    const missilePool = cat.filter((u) => missileIds.includes(u.id));
    const otherPool = cat.filter((u) => !missileIds.includes(u.id));
    for (let i = otherPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = otherPool[i]!;
      otherPool[i] = otherPool[j]!;
      otherPool[j] = tmp;
    }
    for (let i = missilePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = missilePool[i]!;
      missilePool[i] = missilePool[j]!;
      missilePool[j] = tmp;
    }
    const picks: typeof cat = [];
    if (this.wave >= 1 && missilePool.length > 0) {
      picks.push(missilePool[0]!);
    }
    for (const u of otherPool) {
      if (picks.length >= 3) break;
      picks.push(u);
    }
    for (const u of missilePool.slice(picks.some((p) => missileIds.includes(p.id)) ? 1 : 0)) {
      if (picks.length >= 3) break;
      if (!picks.includes(u)) picks.push(u);
    }
    this.upgradeChoices = picks.map((u) => ({
      id: u.id,
      name: u.name,
      desc: u.desc,
      level: (this.upgrades[u.id] ?? 0) + 1,
    }));
  }

  pickUpgrade(id: UpgradeId) {
    if (this.phase !== "upgrade") return;
    if (!this.upgradeChoices?.some((c) => c.id === id)) return;

    const lv = (this.upgrades[id] ?? 0) + 1;
    this.upgrades[id] = lv;

    switch (id) {
      case "armor":
        this.run.maxHealth += 1;
        this.player.health = Math.min(
          this.player.health + 1,
          this.run.maxHealth,
        );
        break;
      case "engine":
        this.run.maxSpeed *= 1.18;
        this.run.accel *= 1.15;
        break;
      case "reload":
        this.run.fireRate = Math.max(0.1, this.run.fireRate * 0.82);
        break;
      case "caliber":
        this.run.bulletDamage += 1;
        break;
      case "tracks":
        this.run.hullTurn *= 1.2;
        this.run.turretTurn *= 1.18;
        break;
      case "velocity":
        this.run.bulletSpeed *= 1.16;
        break;
      case "life":
        this.lives += 1;
        break;
      case "missiles":
        if (!this.run.missiles) {
          this.run.missiles = true;
          this.message = "Rocket Pod Online";
        } else {
          this.run.missileDamage += 1;
          this.run.missileCd = Math.max(0.55, this.run.missileCd * 0.88);
          this.run.missileSpeed *= 1.08;
        }
        break;
      case "homing":
        this.run.missiles = true;
        this.run.missileHome = Math.min(
          5.5,
          (this.run.missileHome || 1.8) + 1.1,
        );
        break;
      case "warhead":
        this.run.missiles = true;
        this.run.missileSplash = Math.min(
          72,
          (this.run.missileSplash || 28) + 16,
        );
        this.run.missileDamage += 0.5;
        break;
      case "salvo":
        this.run.missiles = true;
        this.run.missileCount = Math.min(4, this.run.missileCount + 1);
        break;
    }

    this.applyRunStatsToPlayer(false);
    sfx.pickup();
    this.message = this.upgradeChoices.find((c) => c.id === id)?.name ?? "Upgraded";
    this.messageT = 1.4;
    this.nextWave();
  }

  private makeTank(team: Team, x: number, y: number, angle: number): Tank {
    const isPlayer = team === "player";
    return {
      id: this.idSeq++,
      team,
      x,
      y,
      hullAngle: angle,
      turretAngle: angle,
      speed: 0,
      radius: isPlayer ? 16 : 15,
      health: isPlayer ? 3 : 2,
      maxHealth: isPlayer ? 3 : 2,
      fireCd: 0,
      fireRate: isPlayer ? 0.32 : 0.9,
      bulletSpeed: isPlayer ? 420 : 300,
      bulletDamage: 1,
      alive: true,
      invuln: 0,
      aiTimer: 0,
      aiSteer: 0,
      aiThrottle: 0,
      aiWantFire: false,
      track: 0,
    };
  }

  private idleUpdate(dt: number) {
    this.messageT = Math.max(0, this.messageT - dt);
    this.shake = Math.max(0, this.shake - dt * 8);
  }

  private fixedUpdate(dt: number) {
    this.messageT = Math.max(0, this.messageT - dt);
    this.shake = Math.max(0, this.shake - dt * 10);
    if (this.powerTimer > 0) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) {
        this.powerKind = null;
        this.player.fireRate = this.run.fireRate;
        this.player.bulletDamage = this.run.bulletDamage;
        this.player.bulletSpeed = this.run.bulletSpeed;
      }
    }

    this.updatePlayer(dt);
    this.spawnEnemies(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.updateExplosions(dt);

    const look = 40;
    const { x: fx, y: fy } = forwardFromAngle(this.player.turretAngle);
    const tx = this.player.x + fx * look;
    const ty = this.player.y + fy * look;
    this.camX += (tx - this.camX) * (1 - Math.exp(-8 * dt));
    this.camY += (ty - this.camY) * (1 - Math.exp(-8 * dt));

    this.checkWaveClear();
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    if (!p.alive) return;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.fireCd > 0) p.fireCd -= dt;

    // ── Hull steer (body) — A/D, touch L/R ──
    let hullSteer = 0;
    if (this.injectSteer != null) {
      hullSteer = this.injectSteer;
    } else {
      if (this.keys.has("KeyA") || this.touch.left) hullSteer += 1;
      if (this.keys.has("KeyD") || this.touch.right) hullSteer -= 1;
    }

    // ── Turret aim — mouse, ←/→, Q/E, touch aim L/R ──
    let turretSteer = 0;
    if (this.injectTurret != null) {
      turretSteer = this.injectTurret;
    } else {
      if (
        this.keys.has("ArrowLeft") ||
        this.keys.has("KeyQ") ||
        this.touch.aimLeft
      ) {
        turretSteer += 1;
      }
      if (
        this.keys.has("ArrowRight") ||
        this.keys.has("KeyE") ||
        this.touch.aimRight
      ) {
        turretSteer -= 1;
      }
    }

    let throttle = 0;
    if (this.injectThrottle != null) {
      throttle = this.injectThrottle;
    } else {
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp") || this.touch.up) {
        throttle += 1;
      }
      if (
        this.keys.has("KeyS") ||
        this.keys.has("ArrowDown") ||
        this.touch.down
      ) {
        throttle -= 1;
      }
    }

    // Hull turn (vehicle): A = left = +yaw
    const hullTurnRate = this.run.hullTurn;
    const speedFactor = 0.4 + 0.6 * Math.min(1, Math.abs(p.speed) / 130);
    const reverse = p.speed >= 0 ? 1 : -1;
    p.hullAngle = wrapAngle(
      p.hullAngle + hullSteer * hullTurnRate * speedFactor * reverse * dt,
    );

    // Turret aim — auto-target overrides; else exclusive keys/mouse modes
    if (this.autoTarget) {
      this.updateAutoTarget(dt);
    } else {
      const touchAiming = this.touch.aimLeft || this.touch.aimRight;
      if (
        this.injectTurret != null ||
        this.aimMode === "keys" ||
        touchAiming
      ) {
        if (turretSteer !== 0) {
          const turretTurnRate = this.run.turretTurn;
          p.turretAngle = wrapAngle(
            p.turretAngle + turretSteer * turretTurnRate * dt,
          );
        }
      } else if (
        this.aimMode === "mouse" &&
        this.mouseAim &&
        this.mouseX != null &&
        this.mouseY != null
      ) {
        const world = this.screenToWorld(this.mouseX, this.mouseY);
        const dx = world.x - p.x;
        const dy = world.y - p.y;
        const desired = Math.atan2(-dx, -dy);
        const da = wrapAngle(desired - p.turretAngle);
        const mouseTurn = this.run.turretTurn * 2.1;
        p.turretAngle = wrapAngle(
          p.turretAngle + clamp(da, -mouseTurn * dt, mouseTurn * dt),
        );
      }
    }

    const accel = this.run.accel;
    const maxSpeed = this.run.maxSpeed;
    const friction = 4.2;
    if (throttle !== 0) {
      p.speed += throttle * accel * dt;
    } else {
      p.speed *= Math.exp(-friction * dt);
      if (Math.abs(p.speed) < 4) p.speed = 0;
    }
    p.speed = clamp(p.speed, -maxSpeed * 0.55, maxSpeed);

    this.moveTank(p, dt);

    const wantFire =
      this.keys.has("Space") ||
      this.keys.has("KeyJ") ||
      this.touch.fire ||
      this.keys.has("Enter") ||
      this.mouseDown;
    if (wantFire) this.tryFire(p);

    if (this.missileFireCd > 0) this.missileFireCd -= dt;
    const wantMissile =
      this.run.missiles &&
      (this.keys.has("KeyF") ||
        this.keys.has("ShiftLeft") ||
        this.keys.has("ShiftRight") ||
        this.touch.missile ||
        this.mouseRightDown);
    if (wantMissile) this.tryFireMissile(p);

    p.track += Math.abs(p.speed) * dt * 0.04;
  }

  /** Convert canvas CSS-pixel coords → world */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: sx + this.camX - this.width / 2,
      y: sy + this.camY - this.height / 2,
    };
  }

  setMouse(sx: number | null, sy: number | null, aiming: boolean) {
    this.mouseX = sx;
    this.mouseY = sy;
    this.mouseAim = aiming && sx != null && sy != null;
  }

  setAimMode(mode: AimMode) {
    this.aimMode = mode;
    saveAimMode(mode);
    this.message =
      mode === "mouse" ? "Aim: Mouse" : "Aim: Keys (Q/E · ←/→)";
    this.messageT = 1.4;
  }

  toggleAimMode() {
    this.setAimMode(this.aimMode === "mouse" ? "keys" : "mouse");
  }

  toggleAutoTarget() {
    this.autoTarget = !this.autoTarget;
    if (!this.autoTarget) {
      this.autoTargetId = null;
      this.message = "Auto-Target OFF";
    } else {
      this.autoTargetId = null;
      this.acquireAutoTarget();
      this.message = this.autoTargetId != null ? "Auto-Target ON" : "Auto-Target — no hostiles";
    }
    this.messageT = 1.3;
  }

  private acquireAutoTarget() {
    const p = this.player;
    if (!p?.alive) {
      this.autoTargetId = null;
      return;
    }
    // Prefer nearest in forward turret cone, else nearest overall
    let bestCone: Tank | null = null;
    let bestConeD = Infinity;
    let bestAny: Tank | null = null;
    let bestAnyD = Infinity;
    const f = forwardFromAngle(p.turretAngle);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < bestAnyD) {
        bestAnyD = d;
        bestAny = e;
      }
      if (d < 28) continue;
      const nx = dx / d;
      const ny = dy / d;
      const dot = nx * f.x + ny * f.y;
      if (dot > 0.35 && d < bestConeD) {
        bestConeD = d;
        bestCone = e;
      }
    }
    const pick = bestCone ?? bestAny;
    this.autoTargetId = pick ? pick.id : null;
  }

  private updateAutoTarget(dt: number) {
    const p = this.player;
    let target = this.enemies.find(
      (e) => e.alive && e.id === this.autoTargetId,
    );
    if (!target) {
      this.acquireAutoTarget();
      target = this.enemies.find(
        (e) => e.alive && e.id === this.autoTargetId,
      );
    }
    if (!target) return;

    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const desired = Math.atan2(-dx, -dy);
    const da = wrapAngle(desired - p.turretAngle);
    const turn = this.run.turretTurn * 2.4;
    p.turretAngle = wrapAngle(
      p.turretAngle + clamp(da, -turn * dt, turn * dt),
    );
  }

  /** Aim point in world for crosshair / lead indicator */
  private getAimPoint(): { x: number; y: number; locked: boolean } {
    const p = this.player;
    if (this.autoTarget && this.autoTargetId != null) {
      const t = this.enemies.find(
        (e) => e.alive && e.id === this.autoTargetId,
      );
      if (t) return { x: t.x, y: t.y, locked: true };
    }
    if (
      !this.autoTarget &&
      this.aimMode === "mouse" &&
      this.mouseAim &&
      this.mouseX != null &&
      this.mouseY != null
    ) {
      const w = this.screenToWorld(this.mouseX, this.mouseY);
      return { x: w.x, y: w.y, locked: false };
    }
    const f = forwardFromAngle(p.turretAngle);
    const dist = 150;
    return { x: p.x + f.x * dist, y: p.y + f.y * dist, locked: false };
  }

  private spawnEnemies(dt: number) {
    if (this.spawnQueue <= 0) return;
    if (
      this.enemies.filter((e) => e.alive).length >=
      Math.min(MAX_ENEMIES, 4 + Math.floor(this.wave / 2))
    ) {
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = Math.max(0.45, 1.2 - this.wave * 0.05);
    this.spawnQueue -= 1;

    const spots = this.enemySpawns.length
      ? this.enemySpawns
      : [
          { x: TILE * 2, y: TILE * 2 },
          { x: (WORLD_COLS - 2) * TILE, y: TILE * 2 },
        ];
    let best = spots[0]!;
    let bestScore = -1;
    for (const s of spots) {
      const dx = s.x - this.player.x;
      const dy = s.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      const clear = !this.enemies.some(
        (e) => e.alive && Math.hypot(e.x - s.x, e.y - s.y) < 40,
      );
      const score = dist + (clear ? 200 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }

    const t = this.makeTank("enemy", best.x, best.y, Math.PI);
    const waveScale = 1 + (this.wave - 1) * 0.08;
    t.maxHealth = Math.min(5, 2 + Math.floor(this.wave / 3));
    t.health = t.maxHealth;
    t.fireRate = Math.max(0.45, 1.0 - this.wave * 0.04);
    t.bulletSpeed = 280 + this.wave * 8;
    t.maxMove = 90 + this.wave * 4 * waveScale;
    this.enemies.push(t);
    this.spawnBurst(t.x, t.y, "#e06c75");
  }

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.invuln > 0) e.invuln -= dt;
      if (e.fireCd > 0) e.fireCd -= dt;

      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        e.aiTimer = 0.35 + Math.random() * 0.55;
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const desired = Math.atan2(-dx, -dy);
        let daTurret = wrapAngle(desired - e.turretAngle);
        if (Math.random() < 0.18) daTurret += (Math.random() - 0.5) * 0.8;
        e.aiSteer = clamp(daTurret * 1.8, -1, 1);
        e.aiThrottle = dist > 220 ? 1 : dist < 90 ? -0.3 : 0.55;
        e.aiWantFire = Math.abs(daTurret) < 0.4 && dist < 480;
        for (const o of this.enemies) {
          if (o === e || !o.alive) continue;
          const sx = e.x - o.x;
          const sy = e.y - o.y;
          const sd = Math.hypot(sx, sy);
          if (sd < 50 && sd > 0.1) {
            const sepAng = Math.atan2(-sx, -sy);
            e.aiSteer +=
              clamp(wrapAngle(sepAng - e.turretAngle), -0.5, 0.5) * 0.3;
          }
        }
      }

      e.turretAngle = wrapAngle(e.turretAngle + e.aiSteer * 2.4 * dt);

      if (Math.abs(e.aiThrottle) > 0.1) {
        const da = wrapAngle(e.turretAngle - e.hullAngle);
        e.hullAngle = wrapAngle(
          e.hullAngle + clamp(da, -2.0 * dt, 2.0 * dt),
        );
      }

      const maxMove = e.maxMove ?? 100;
      const targetSpeed = e.aiThrottle * maxMove;
      e.speed += (targetSpeed - e.speed) * (1 - Math.exp(-4 * dt));
      this.moveTank(e, dt);
      e.track += Math.abs(e.speed) * dt * 0.04;

      if (e.aiWantFire) this.tryFire(e);

      if (this.player.alive && this.player.invuln <= 0) {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < e.radius + this.player.radius - 4) {
          this.damageTank(this.player, 1, e.x, e.y);
        }
      }
    }
  }

  private moveTank(t: Tank, dt: number) {
    const { x: fx, y: fy } = forwardFromAngle(t.hullAngle);
    let nx = t.x + fx * t.speed * dt;
    let ny = t.y + fy * t.speed * dt;

    if (!this.collidesSolid(nx, t.y, t.radius)) {
      t.x = nx;
    } else {
      t.speed *= 0.4;
      if (t.team === "enemy") {
        t.aiTimer = 0;
        t.aiSteer = Math.random() > 0.5 ? 1 : -1;
      }
    }
    if (!this.collidesSolid(t.x, ny, t.radius)) {
      t.y = ny;
    } else {
      t.speed *= 0.4;
      if (t.team === "enemy") {
        t.aiTimer = 0;
        t.aiSteer = Math.random() > 0.5 ? 1 : -1;
      }
    }

    t.x = clamp(t.x, t.radius, WORLD_COLS * TILE - t.radius);
    t.y = clamp(t.y, t.radius, WORLD_ROWS * TILE - t.radius);
  }

  private collidesSolid(x: number, y: number, r: number) {
    const minC = Math.floor((x - r) / TILE);
    const maxC = Math.floor((x + r) / TILE);
    const minR = Math.floor((y - r) / TILE);
    const maxR = Math.floor((y + r) / TILE);
    for (let row = minR; row <= maxR; row++) {
      for (let col = minC; col <= maxC; col++) {
        const tile = this.getTile(col, row);
        if (tile === "#" || tile === "S" || tile === "~") {
          const cx = clamp(x, col * TILE, col * TILE + TILE);
          const cy = clamp(y, row * TILE, row * TILE + TILE);
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy < r * r) return true;
        }
      }
    }
    return false;
  }

  private getTile(c: number, r: number): TileChar {
    if (r < 0 || c < 0 || r >= WORLD_ROWS || c >= WORLD_COLS) return "S";
    return this.tiles[r]?.[c] ?? "S";
  }

  private tryFire(t: Tank) {
    if (!t.alive || t.fireCd > 0) return;
    t.fireCd = t.fireRate;
    const { x: fx, y: fy } = forwardFromAngle(t.turretAngle);
    const muzzle = t.radius + 12;
    const bx = t.x + fx * muzzle;
    const by = t.y + fy * muzzle;
    const b = this.bullets.find((x) => !x.active);
    if (!b) return;
    b.active = true;
    b.x = bx;
    b.y = by;
    b.vx = fx * t.bulletSpeed;
    b.vy = fy * t.bulletSpeed;
    b.team = t.team;
    b.damage = t.bulletDamage;
    b.life = 1.6;
    b.radius = t.team === "player" ? 4.5 : 4;
    b.kind = "shell";
    b.home = 0;
    b.splash = 0;
    b.targetId = null;
    if (t.team === "player") {
      sfx.fire();
      this.shake = Math.max(this.shake, 2.5);
      for (let i = 0; i < 4; i++) {
        this.spawnParticle(
          bx,
          by,
          fx * 40 + (Math.random() - 0.5) * 60,
          fy * 40 + (Math.random() - 0.5) * 60,
          0.2,
          2,
          "#f5f7fa",
        );
      }
    }
  }

  private tryFireMissile(t: Tank) {
    if (!t.alive || !this.run.missiles) return;
    if (this.missileFireCd > 0) return;
    this.missileFireCd = this.run.missileCd;

    const count = this.run.missileCount;
    const base = t.turretAngle;
    // Spread salvo slightly
    const spread = count > 1 ? 0.14 : 0;
    let targetId: number | null = null;
    if (this.autoTarget && this.autoTargetId != null) {
      targetId = this.autoTargetId;
    } else {
      // Lock nearest in cone / overall
      let best: Tank | null = null;
      let bestD = Infinity;
      const f = forwardFromAngle(base);
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dx = e.x - t.x;
        const dy = e.y - t.y;
        const d = Math.hypot(dx, dy);
        const dot = d > 1 ? (dx / d) * f.x + (dy / d) * f.y : 1;
        const score = d * (dot > 0.2 ? 0.65 : 1.25);
        if (score < bestD) {
          bestD = score;
          best = e;
        }
      }
      targetId = best?.id ?? null;
    }

    for (let i = 0; i < count; i++) {
      const ang =
        base + (count === 1 ? 0 : (i - (count - 1) / 2) * spread);
      const { x: fx, y: fy } = forwardFromAngle(ang);
      const muzzle = t.radius + 14;
      const bx = t.x + fx * muzzle;
      const by = t.y + fy * muzzle;
      const b = this.bullets.find((x) => !x.active);
      if (!b) break;
      b.active = true;
      b.x = bx;
      b.y = by;
      b.vx = fx * this.run.missileSpeed;
      b.vy = fy * this.run.missileSpeed;
      b.team = "player";
      b.damage = this.run.missileDamage;
      b.life = 2.8;
      b.radius = 5.5;
      b.kind = "missile";
      b.home = this.run.missileHome;
      b.splash = this.run.missileSplash;
      b.targetId = targetId;
    }

    sfx.fire();
    this.shake = Math.max(this.shake, 4);
    const { x: fx, y: fy } = forwardFromAngle(base);
    for (let i = 0; i < 8; i++) {
      this.spawnParticle(
        t.x + fx * 16,
        t.y + fy * 16,
        -fx * 30 + (Math.random() - 0.5) * 80,
        -fy * 30 + (Math.random() - 0.5) * 80,
        0.35,
        3 + Math.random() * 2,
        i % 2 === 0 ? "#f0a060" : "#6a7280",
      );
    }
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.life -= dt;
      if (b.life <= 0) {
        b.active = false;
        continue;
      }

      // Missile homing + smoke trail
      if (b.kind === "missile" && b.home > 0 && b.team === "player") {
        let target = this.enemies.find(
          (e) => e.alive && e.id === b.targetId,
        );
        if (!target) {
          let best: Tank | null = null;
          let bestD = Infinity;
          for (const e of this.enemies) {
            if (!e.alive) continue;
            const d = Math.hypot(e.x - b.x, e.y - b.y);
            if (d < bestD) {
              bestD = d;
              best = e;
            }
          }
          target = best ?? undefined;
          b.targetId = best?.id ?? null;
        }
        if (target) {
          const dx = target.x - b.x;
          const dy = target.y - b.y;
          const desired = Math.atan2(dy, dx);
          const cur = Math.atan2(b.vy, b.vx);
          let da = desired - cur;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          const turn = clamp(da, -b.home * dt, b.home * dt);
          const spd = Math.hypot(b.vx, b.vy) || this.run.missileSpeed;
          const na = cur + turn;
          b.vx = Math.cos(na) * spd;
          b.vy = Math.sin(na) * spd;
        }
        if (Math.random() < 0.55) {
          this.spawnParticle(
            b.x - b.vx * 0.02,
            b.y - b.vy * 0.02,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            0.25,
            2 + Math.random() * 2,
            Math.random() > 0.5 ? "#8a9099" : "#c07040",
          );
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (
        b.x < 0 ||
        b.y < 0 ||
        b.x > WORLD_COLS * TILE ||
        b.y > WORLD_ROWS * TILE
      ) {
        b.active = false;
        continue;
      }

      const col = Math.floor(b.x / TILE);
      const row = Math.floor(b.y / TILE);
      const tile = this.getTile(col, row);
      if (tile === "#" || tile === "S") {
        if (tile === "#") {
          const hp = this.brickHp[row]?.[col] ?? 0;
          if (this.brickHp[row]) this.brickHp[row]![col] = hp - b.damage;
          if ((this.brickHp[row]?.[col] ?? 0) <= 0) {
            this.tiles[row]![col] = ".";
            this.spawnBurst(
              col * TILE + TILE / 2,
              row * TILE + TILE / 2,
              "#c4a574",
            );
            if (b.team === "player") this.score += 5;
          } else {
            this.spawnParticle(
              b.x,
              b.y,
              -b.vx * 0.1,
              -b.vy * 0.1,
              0.2,
              3,
              "#d2b48c",
            );
          }
          sfx.wall();
        } else {
          if (
            b.team === "player" &&
            ((this.powerKind === "star" && b.damage >= 2) ||
              (b.kind === "missile" && b.damage >= 2.5))
          ) {
            this.tiles[row]![col] = ".";
            this.brickHp[row]![col] = 0;
            this.spawnBurst(
              col * TILE + TILE / 2,
              row * TILE + TILE / 2,
              "#8b919e",
            );
            this.score += 15;
          } else {
            this.spawnParticle(b.x, b.y, 0, 0, 0.15, 2, "#a0a8b8");
            sfx.wall();
          }
        }
        if (b.kind === "missile") this.missileImpact(b.x, b.y, b);
        b.active = false;
        continue;
      }

      if (b.team === "player") {
        for (const e of this.enemies) {
          if (!e.alive || e.invuln > 0) continue;
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
            if (b.kind === "missile") {
              this.missileImpact(b.x, b.y, b);
            } else {
              this.damageTank(e, b.damage, b.x, b.y);
            }
            b.active = false;
            break;
          }
        }
      } else if (this.player.alive && this.player.invuln <= 0) {
        if (
          Math.hypot(this.player.x - b.x, this.player.y - b.y) <
          this.player.radius + b.radius
        ) {
          b.active = false;
          this.damageTank(this.player, b.damage, b.x, b.y);
        }
      }
    }
  }

  private missileImpact(x: number, y: number, b: Bullet) {
    const splash = b.splash;
    this.spawnBurst(x, y, "#f0a060");
    this.shake = Math.max(this.shake, 5 + splash * 0.04);
    this.hitStop = Math.max(this.hitStop, 0.04);
    if (splash <= 0) {
      // direct only — still hit nearest enemy at point
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - x, e.y - y) < e.radius + b.radius + 2) {
          this.damageTank(e, b.damage, x, y);
        }
      }
      return;
    }
    // Splash damages all enemies in radius (falloff)
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < splash + e.radius) {
        const falloff = 1 - (d / (splash + e.radius)) * 0.45;
        this.damageTank(e, b.damage * falloff, x, y);
      }
    }
    // Soft brick damage in splash
    const r0 = Math.floor((y - splash) / TILE);
    const r1 = Math.floor((y + splash) / TILE);
    const c0 = Math.floor((x - splash) / TILE);
    const c1 = Math.floor((x + splash) / TILE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (this.getTile(c, r) !== "#") continue;
        const tx = c * TILE + TILE / 2;
        const ty = r * TILE + TILE / 2;
        if (Math.hypot(tx - x, ty - y) > splash) continue;
        const hp = this.brickHp[r]?.[c] ?? 0;
        if (this.brickHp[r]) this.brickHp[r]![c] = hp - b.damage * 0.6;
        if ((this.brickHp[r]?.[c] ?? 0) <= 0) {
          this.tiles[r]![c] = ".";
          this.spawnBurst(tx, ty, "#c4a574");
          this.score += 5;
        }
      }
    }
  }

  private damageTank(t: Tank, dmg: number, hx: number, hy: number) {
    if (!t.alive) return;
    if (t.team === "player" && this.powerKind === "shield" && t.invuln > 0)
      return;
    if (t.team === "player" && this.powerKind === "shield") {
      this.powerKind = null;
      this.powerTimer = 0;
      t.invuln = 0.8;
      sfx.hit();
      this.spawnBurst(t.x, t.y, "#5eead4");
      return;
    }
    t.health -= dmg;
    t.invuln = t.team === "player" ? 1.0 : 0.15;
    this.hitStop = t.team === "enemy" ? 0.04 : 0.06;
    this.shake = Math.max(this.shake, t.team === "player" ? 6 : 4);
    sfx.hit();
    this.spawnBurst(hx, hy, t.team === "player" ? "#5eead4" : "#e06c75");

    if (t.health <= 0) {
      t.alive = false;
      this.boom(t.x, t.y, t.team === "player" ? 1.3 : 1);
      sfx.explode();
      if (t.team === "enemy") {
        this.score += 100 + this.wave * 10;
        this.enemiesKilledWave += 1;
        if (Math.random() < 0.22) this.spawnPickup(t.x, t.y);
        if (this.score > this.highScore) {
          this.highScore = this.score;
          saveHighScore(this.highScore);
        }
      } else {
        this.lives -= 1;
        sfx.hurt();
        if (this.lives <= 0) {
          this.phase = "gameover";
          this.message = "Mission Failed";
          this.messageT = 99;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            saveHighScore(this.highScore);
          }
        } else {
          const def = getLevel(this.levelIndex);
          const parsed = parseLevel(def);
          t.x = parsed.playerSpawn.x;
          t.y = parsed.playerSpawn.y;
          t.hullAngle = 0;
          t.turretAngle = 0;
          t.speed = 0;
          t.maxHealth = this.run.maxHealth;
          t.health = t.maxHealth;
          t.fireRate = this.run.fireRate;
          t.bulletDamage = this.run.bulletDamage;
          t.bulletSpeed = this.run.bulletSpeed;
          t.alive = true;
          t.invuln = 2.2;
          this.powerKind = null;
          this.powerTimer = 0;
          this.message = "Respawning";
          this.messageT = 1.2;
        }
      }
    }
  }

  private boom(x: number, y: number, scale = 1) {
    const ex = this.explosions.find((e) => !e.active);
    if (ex) {
      ex.active = true;
      ex.x = x;
      ex.y = y;
      ex.t = 0;
      ex.scale = scale;
    }
    this.spawnBurst(x, y, "#ffb454");
    this.spawnBurst(x, y, "#ff6b4a");
  }

  private spawnBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      this.spawnParticle(
        x,
        y,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        0.25 + Math.random() * 0.35,
        2 + Math.random() * 3,
        color,
      );
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    color: string,
  ) {
    const p = this.particles.find((q) => !q.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.color = color;
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-2 * dt);
      p.vy *= Math.exp(-2 * dt);
    }
  }

  private updateExplosions(dt: number) {
    for (const e of this.explosions) {
      if (!e.active) continue;
      e.t += dt;
      if (e.t >= 0.45) e.active = false;
    }
  }

  private spawnPickup(x: number, y: number) {
    const kinds: Pickup["kind"][] = ["repair", "rapid", "shield", "star"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)]!;
    this.pickups.push({ active: true, x, y, kind, life: 12 });
  }

  private updatePickups(dt: number) {
    for (const p of this.pickups) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      if (!this.player.alive) continue;
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 22) {
        p.active = false;
        sfx.pickup();
        this.applyPickup(p.kind);
      }
    }
  }

  private applyPickup(kind: Pickup["kind"]) {
    this.powerKind = kind;
    if (kind === "repair") {
      this.player.health = this.player.maxHealth;
      this.powerTimer = 0.1;
      this.powerKind = null;
      this.message = "Armor Restored";
      this.messageT = 1.2;
    } else if (kind === "rapid") {
      this.player.fireRate = Math.min(this.run.fireRate * 0.45, 0.12);
      this.powerTimer = 10;
      this.message = "Rapid Fire";
      this.messageT = 1.2;
    } else if (kind === "shield") {
      this.player.invuln = 8;
      this.powerTimer = 8;
      this.message = "Shield Online";
      this.messageT = 1.2;
    } else if (kind === "star") {
      this.player.bulletDamage = this.run.bulletDamage + 1;
      this.player.bulletSpeed = this.run.bulletSpeed * 1.25;
      this.player.fireRate = Math.min(this.run.fireRate, 0.2);
      this.powerTimer = 12;
      this.message = "Star Cannon";
      this.messageT = 1.2;
    }
  }

  private checkWaveClear() {
    if (this.spawnQueue > 0) return;
    if (this.enemies.some((e) => e.alive)) return;
    if (this.phase !== "playing") return;
    if (this.wave >= 8) {
      this.phase = "victory";
      this.message = "Sector Cleared";
      this.messageT = 99;
      sfx.win();
      if (this.score > this.highScore) {
        this.highScore = this.score;
        saveHighScore(this.highScore);
      }
      return;
    }
    this.score += 50 * this.wave;
    sfx.win();
    this.rollUpgradeChoices();
    if (this.upgradeChoices && this.upgradeChoices.length > 0) {
      this.phase = "upgrade";
      this.message = "Field Upgrade";
      this.messageT = 99;
    } else {
      this.phase = "waveClear";
      this.message = "Wave Clear";
      this.messageT = 99;
    }
  }

  getHud(): HudSnapshot {
    const enemiesLeft =
      this.spawnQueue + this.enemies.filter((e) => e.alive).length;
    let powerLabel: string | null = null;
    if (this.powerKind === "rapid") powerLabel = "Rapid";
    if (this.powerKind === "shield") powerLabel = "Shield";
    if (this.powerKind === "star") powerLabel = "Star";
    return {
      phase: this.phase,
      score: this.score,
      highScore: this.highScore,
      lives: this.lives,
      health: this.player?.health ?? 0,
      maxHealth: this.player?.maxHealth ?? this.run.maxHealth,
      wave: this.wave,
      levelName: this.levelName,
      enemiesLeft,
      powerLabel,
      message: this.messageT > 0 ? this.message : null,
      upgradeChoices: this.phase === "upgrade" ? this.upgradeChoices : null,
      upgrades: { ...this.upgrades },
      aimMode: this.aimMode,
      autoTarget: this.autoTarget,
      missilesUnlocked: this.run.missiles,
      missileReady: this.run.missiles && this.missileFireCd <= 0,
      missileCd: this.missileFireCd,
    };
  }

  // ─── DRAW ─────────────────────────────────────────────

  private draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0c0e12");
    g.addColorStop(1, "#08090c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (this.phase === "title" && !this.tiles.length) {
      this.drawTitleOnly();
      return;
    }

    let ox = Math.floor(this.camX - w / 2);
    let oy = Math.floor(this.camY - h / 2);
    if (this.shake > 0) {
      ox += (Math.random() - 0.5) * this.shake * 2;
      oy += (Math.random() - 0.5) * this.shake * 2;
    }

    ctx.save();
    ctx.translate(-ox, -oy);
    this.drawWorld();
    this.drawPickups();
    for (const e of this.enemies) {
      if (e.alive) this.drawTank(e);
    }
    if (this.player.alive) this.drawTank(this.player);
    this.drawBullets();
    this.drawParticles();
    this.drawExplosions();
    if (
      this.player.alive &&
      (this.phase === "playing" || this.phase === "paused")
    ) {
      this.drawCrosshair();
    }
    ctx.restore();

    const vg = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.35,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.72,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  private drawTitleOnly() {
    const ctx = this.ctx;
    ctx.fillStyle = "#10131a";
    ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(94,234,212,${0.02 + (i % 5) * 0.01})`;
      ctx.fillRect((i * 97) % this.width, (i * 53) % this.height, 2, 2);
    }
  }

  private drawWorld() {
    const ctx = this.ctx;
    const worldW = WORLD_COLS * TILE;
    const worldH = WORLD_ROWS * TILE;

    ctx.fillStyle = "#1a1f28";
    ctx.fillRect(0, 0, worldW, worldH);

    for (let r = 0; r < WORLD_ROWS; r++) {
      for (let c = 0; c < WORLD_COLS; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const n = ((c * 17 + r * 31) % 7) / 7;
        ctx.fillStyle =
          n > 0.55 ? "#1c222d" : n > 0.3 ? "#181e27" : "#1a2030";
        ctx.fillRect(x, y, TILE, TILE);
        if ((c + r) % 3 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.015)";
          ctx.fillRect(x + 4, y + 6, 6, 4);
        }
      }
    }

    for (let r = 0; r < WORLD_ROWS; r++) {
      for (let c = 0; c < WORLD_COLS; c++) {
        const t = this.tiles[r]![c]!;
        const x = c * TILE;
        const y = r * TILE;
        if (t === "#") this.drawBrick(x, y, this.brickHp[r]![c]!);
        else if (t === "S") this.drawSteel(x, y);
        else if (t === "~") this.drawWater(x, y, r, c);
        else if (t === "^") this.drawBush(x, y);
      }
    }

    ctx.strokeStyle = "rgba(94,234,212,0.12)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, worldW - 3, worldH - 3);
  }

  private drawBrick(x: number, y: number, hp: number) {
    const ctx = this.ctx;
    const dmg = hp <= 1;
    ctx.fillStyle = dmg ? "#8a6a48" : "#a67c52";
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + TILE / 2);
    ctx.lineTo(x + TILE - 1, y + TILE / 2);
    ctx.moveTo(x + TILE / 2, y + 1);
    ctx.lineTo(x + TILE / 2, y + TILE / 2);
    ctx.moveTo(x + TILE / 4, y + TILE / 2);
    ctx.lineTo(x + TILE / 4, y + TILE - 1);
    ctx.moveTo(x + (TILE * 3) / 4, y + TILE / 2);
    ctx.lineTo(x + (TILE * 3) / 4, y + TILE - 1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3);
    if (dmg) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x + 6, y + 10, 8, 3);
      ctx.fillRect(x + 20, y + 22, 10, 4);
    }
  }

  private drawSteel(x: number, y: number) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
    g.addColorStop(0, "#4a5160");
    g.addColorStop(0.5, "#6a7385");
    g.addColorStop(1, "#3a4050");
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
  }

  private drawWater(x: number, y: number, r: number, c: number) {
    const ctx = this.ctx;
    const t = performance.now() / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 + c * 0.4 + r * 0.3);
    ctx.fillStyle = `rgba(40, 90, 140, ${0.55 + pulse * 0.15})`;
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = `rgba(100, 180, 220, ${0.25 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 12 + pulse * 3);
    ctx.quadraticCurveTo(x + 20, y + 8, x + 36, y + 14 + pulse * 2);
    ctx.stroke();
  }

  private drawBush(x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(46, 120, 72, 0.55)";
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 18, 11, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 26, y + 16, 12, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 20, y + 24, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(80, 180, 100, 0.25)";
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 14, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw hull at hullAngle and turret/gun at turretAngle.
   * Canvas rotates clockwise for +angles; our angles are CCW → negate.
   */
  private drawTank(t: Tank) {
    const ctx = this.ctx;
    const isPlayer = t.team === "player";
    const body = isPlayer ? "#3d9b8f" : "#a84a52";
    const bodyDark = isPlayer ? "#2a6b62" : "#6e3036";
    const bodyLight = isPlayer ? "#5eead4" : "#e06c75";
    const metal = "#1a1d22";

    ctx.save();
    ctx.translate(t.x, t.y);

    if (t.invuln > 0 && Math.floor(t.invuln * 12) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // soft ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(2, 3, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Hull (tracks + body) ──
    ctx.save();
    ctx.rotate(-t.hullAngle);

    // treads
    ctx.fillStyle = metal;
    ctx.fillRect(-15, -17, 7, 34);
    ctx.fillRect(8, -17, 7, 34);
    // tread detail
    ctx.fillStyle = "#2a2e36";
    for (let i = -14; i <= 12; i += 5) {
      ctx.fillRect(-14, i, 5, 2);
      ctx.fillRect(9, i, 5, 2);
    }
    // hull body
    ctx.fillStyle = bodyDark;
    ctx.fillRect(-10, -15, 20, 30);
    ctx.fillStyle = body;
    ctx.fillRect(-8, -13, 16, 26);
    // front plate
    ctx.fillStyle = bodyLight;
    ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.35;
    ctx.fillRect(-6, -13, 12, 5);
    ctx.globalAlpha = t.invuln > 0 && Math.floor(t.invuln * 12) % 2 === 0 ? 0.45 : 1;
    // hatch plate
    ctx.fillStyle = bodyDark;
    ctx.fillRect(-5, 2, 10, 8);

    ctx.restore();

    // ── Turret + barrel (independent aim) ──
    ctx.save();
    ctx.rotate(-t.turretAngle);

    // barrel
    ctx.fillStyle = metal;
    ctx.fillRect(-2.5, -24, 5, 16);
    ctx.fillStyle = bodyDark;
    ctx.fillRect(-2, -26, 4, 6);
    // muzzle brake
    ctx.fillStyle = metal;
    ctx.fillRect(-3.5, -27, 7, 3);

    // turret ring
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = bodyDark;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
    // cupola
    ctx.beginPath();
    ctx.arc(2, 1, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = bodyDark;
    ctx.fill();

    ctx.restore();

    // shield ring
    if (isPlayer && this.powerKind === "shield") {
      ctx.strokeStyle = "rgba(94,234,212,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, t.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (t.team === "enemy" && t.health < t.maxHealth) {
      const bw = 22;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(t.x - bw / 2, t.y - t.radius - 10, bw, 4);
      ctx.fillStyle = "#e06c75";
      ctx.fillRect(
        t.x - bw / 2,
        t.y - t.radius - 10,
        bw * (t.health / t.maxHealth),
        4,
      );
    }
  }

  private drawBullets() {
    const ctx = this.ctx;
    for (const b of this.bullets) {
      if (!b.active) continue;
      if (b.kind === "missile") {
        const ang = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(ang);
        // body
        ctx.fillStyle = "#e8a050";
        ctx.fillRect(-8, -3, 14, 6);
        ctx.fillStyle = "#f5d090";
        ctx.fillRect(2, -2, 6, 4);
        // fins
        ctx.fillStyle = "#8a9099";
        ctx.beginPath();
        ctx.moveTo(-6, -3);
        ctx.lineTo(-10, -7);
        ctx.lineTo(-4, -3);
        ctx.moveTo(-6, 3);
        ctx.lineTo(-10, 7);
        ctx.lineTo(-4, 3);
        ctx.fill();
        // glow
        ctx.fillStyle = "rgba(255, 140, 60, 0.55)";
        ctx.beginPath();
        ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      const col = b.team === "player" ? "#f0f4ff" : "#ff8a80";
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle =
        b.team === "player" ? "rgba(94,234,212,0.45)" : "rgba(255,100,80,0.4)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle =
        b.team === "player"
          ? "rgba(240,244,255,0.35)"
          : "rgba(255,120,100,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
      ctx.stroke();
    }
  }

  private drawCrosshair() {
    const ctx = this.ctx;
    const p = this.player;
    const aim = this.getAimPoint();

    const f = forwardFromAngle(p.turretAngle);
    const bx = p.x + f.x * 22;
    const by = p.y + f.y * 22;

    ctx.save();
    ctx.strokeStyle = aim.locked
      ? "rgba(94, 234, 212, 0.55)"
      : "rgba(245, 215, 110, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(aim.x, aim.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const x = aim.x;
    const y = aim.y;
    const r = aim.locked ? 16 : 12;
    const col = aim.locked ? "#5eead4" : "#f5d76e";

    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.95;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    const gap = 4;
    const arm = r + 5;
    ctx.beginPath();
    ctx.moveTo(x - arm, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + arm, y);
    ctx.moveTo(x, y - arm);
    ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + arm);
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();

    if (aim.locked) {
      const b = r + 4;
      const s = 6;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#5eead4";
      ctx.beginPath();
      ctx.moveTo(x - b, y - b + s);
      ctx.lineTo(x - b, y - b);
      ctx.lineTo(x - b + s, y - b);
      ctx.moveTo(x + b - s, y - b);
      ctx.lineTo(x + b, y - b);
      ctx.lineTo(x + b, y - b + s);
      ctx.moveTo(x - b, y + b - s);
      ctx.lineTo(x - b, y + b);
      ctx.lineTo(x - b + s, y + b);
      ctx.moveTo(x + b - s, y + b);
      ctx.lineTo(x + b, y + b);
      ctx.lineTo(x + b, y + b - s);
      ctx.stroke();

      ctx.font = "600 9px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "rgba(94, 234, 212, 0.9)";
      ctx.textAlign = "center";
      ctx.fillText("LOCK", x, y + r + 14);
    }

    ctx.restore();
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      if (!p.active) continue;
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }

  private drawExplosions() {
    const ctx = this.ctx;
    for (const e of this.explosions) {
      if (!e.active) continue;
      const frame = Math.min(3, Math.floor(e.t / 0.11));
      const img = this.images.boom[frame];
      const size = 56 * e.scale;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, e.x - size / 2, e.y - size / 2, size, size);
      } else {
        const a = 1 - e.t / 0.45;
        ctx.fillStyle = `rgba(255,160,60,${a})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 10 + e.t * 40, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawPickups() {
    const ctx = this.ctx;
    const t = performance.now() / 1000;
    for (const p of this.pickups) {
      if (!p.active) continue;
      const bob = Math.sin(t * 4 + p.x) * 3;
      const colors: Record<Pickup["kind"], string> = {
        repair: "#7fd99a",
        rapid: "#e6c07b",
        shield: "#5eead4",
        star: "#f0f4ff",
      };
      const labels: Record<Pickup["kind"], string> = {
        repair: "+",
        rapid: "R",
        shield: "O",
        star: "*",
      };
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob + 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[p.kind];
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0a0b0d";
      ctx.font = "bold 12px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[p.kind], p.x, p.y + bob + 0.5);
      ctx.globalAlpha = 1;
    }
  }
}
