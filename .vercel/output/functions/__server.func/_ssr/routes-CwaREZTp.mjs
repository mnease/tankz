import { o as __toESM } from "../_runtime.mjs";
import { N as require_react, g as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CwaREZTp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LEVELS = [
	{
		name: "Open Range",
		rows: [
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
			"S..........................S",
			"S..####..........####......S",
			"S..#..#..........#..#......S",
			"S..........................S",
			"S.....SSSS....SSSS.........S",
			"S..........................S",
			"S..E...............E.......S",
			"S......^^^^................S",
			"S......^^^^....####........S",
			"S..............#..#........S",
			"S..####....................S",
			"S..#..#........~~~~........S",
			"S..............~~~~........S",
			"S.........SS...............S",
			"S..E.................E.....S",
			"S..........................S",
			"S....####..........####....S",
			"S..........................S",
			"S.............P............S",
			"S..........................S",
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS"
		]
	},
	{
		name: "Brick Maze",
		rows: [
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
			"S..........................S",
			"S..###..###..###..###..E...S",
			"S..#.........#............S",
			"S..#..SSSS...#..SSSS......S",
			"S.....#......#.....#......S",
			"S..E..#..###.#.###.#......S",
			"S.....#......#.....#......S",
			"S..###...###...###...###..S",
			"S..........................S",
			"S..~~~~........^^^^.......S",
			"S..~~~~........^^^^.......S",
			"S.....SSSS..........SSSS..S",
			"S..........................S",
			"S..###...###...###...###..S",
			"S.....#......#.....#......S",
			"S..E..#..###.#.###.#..E...S",
			"S.....#......#.....#......S",
			"S..###..###..###..###.....S",
			"S.............P............S",
			"S..........................S",
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS"
		]
	},
	{
		name: "Steel Corridor",
		rows: [
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
			"S..........................S",
			"S.E..SSSS........SSSS...E.S",
			"S....S..............S.....S",
			"S....S..####..####..S.....S",
			"S....S..............S.....S",
			"S....SSSS........SSSS.....S",
			"S..........................S",
			"S..####..^^^^^^^^..####...S",
			"S........^^^^^^^^.........S",
			"S..~~~~............~~~~...S",
			"S..~~~~............~~~~...S",
			"S........SSSSSSSS.........S",
			"S..........................S",
			"S.E......................E.S",
			"S....####........####.....S",
			"S....#..#........#..#.....S",
			"S..........................S",
			"S..SS..............SS.....S",
			"S.............P............S",
			"S..........................S",
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS"
		]
	},
	{
		name: "Last Stand",
		rows: [
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
			"S.E......................E.S",
			"S....###....SS....###.....S",
			"S....#.#..........#.#.....S",
			"S..........................S",
			"S.E..^^^^..####..^^^^...E.S",
			"S....^^^^..#..#..^^^^.....S",
			"S..........#..#...........S",
			"S..SSSS..........SSSS.....S",
			"S..........................S",
			"S....~~~~..SSSS..~~~~.....S",
			"S....~~~~........~~~~.....S",
			"S..........................S",
			"S.E..###..........###...E.S",
			"S....#.#..^^^^^^..#.#.....S",
			"S........ ^^^^^^ .........S",
			"S..####..........####.....S",
			"S..........................S",
			"S....SS....####....SS.....S",
			"S.............P............S",
			"S.E......................E.S",
			"SSSSSSSSSSSSSSSSSSSSSSSSSSSS"
		]
	}
];
function getLevel(index) {
	return LEVELS[Math.min(index, LEVELS.length - 1)];
}
function levelCount() {
	return LEVELS.length;
}
function parseLevel(level) {
	const tiles = [];
	const enemySpawns = [];
	let playerSpawn = {
		x: 1120 / 2,
		y: 704
	};
	for (let r = 0; r < 22; r++) {
		const rowStr = (level.rows[r] ?? "").padEnd(28, ".").slice(0, 28);
		const row = [];
		for (let c = 0; c < 28; c++) {
			const ch = rowStr[c] ?? ".";
			if (ch === "P") {
				playerSpawn = {
					x: c * 40 + 40 / 2,
					y: r * 40 + 40 / 2
				};
				row.push(".");
			} else if (ch === "E") {
				enemySpawns.push({
					x: c * 40 + 40 / 2,
					y: r * 40 + 40 / 2
				});
				row.push(".");
			} else if (ch === " " || !"#S~^.".includes(ch)) row.push(".");
			else row.push(ch);
		}
		tiles.push(row);
	}
	return {
		tiles,
		enemySpawns,
		playerSpawn
	};
}
/** Lightweight WebAudio SFX — unlocked on first user gesture. */
var ctx = null;
var unlocked = false;
function getCtx() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
	}
	return ctx;
}
function unlockAudio() {
	const c = getCtx();
	if (!c) return;
	if (c.state === "suspended") c.resume();
	unlocked = true;
}
function tone(freq, dur, type, gain = .08, slideTo) {
	if (!unlocked) return;
	const c = getCtx();
	if (!c || c.state !== "running") return;
	const t0 = c.currentTime;
	const osc = c.createOscillator();
	const g = c.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t0);
	if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
	g.gain.setValueAtTime(gain, t0);
	g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
	osc.connect(g);
	g.connect(c.destination);
	osc.start(t0);
	osc.stop(t0 + dur + .02);
}
var sfx = {
	fire() {
		tone(220, .08, "square", .05, 90);
	},
	hit() {
		tone(140, .1, "sawtooth", .06, 50);
	},
	explode() {
		tone(80, .28, "sawtooth", .09, 30);
		tone(50, .35, "triangle", .05, 20);
	},
	wall() {
		tone(180, .06, "triangle", .04, 100);
	},
	pickup() {
		tone(520, .08, "sine", .05);
		tone(780, .12, "sine", .04);
	},
	hurt() {
		tone(90, .18, "square", .07, 40);
	},
	win() {
		tone(440, .1, "sine", .05);
		setTimeout(() => tone(660, .12, "sine", .05), 90);
		setTimeout(() => tone(880, .18, "sine", .05), 180);
	},
	start() {
		tone(300, .1, "square", .04);
		tone(450, .14, "square", .035);
	}
};
var FIXED_DT = 1 / 60;
var MAX_BULLETS = 64;
var MAX_PARTICLES = 220;
var MAX_EXPLOSIONS = 16;
var MAX_ENEMIES = 10;
var HS_KEY = "tankz-highscore-v1";
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function wrapAngle(a) {
	return Math.atan2(Math.sin(a), Math.cos(a));
}
function loadHighScore() {
	try {
		return Number(localStorage.getItem(HS_KEY) || "0") || 0;
	} catch {
		return 0;
	}
}
function saveHighScore(n) {
	try {
		localStorage.setItem(HS_KEY, String(n));
	} catch {}
}
var TankzEngine = class {
	canvas;
	ctx;
	width = 0;
	height = 0;
	dpr = 1;
	phase = "title";
	score = 0;
	highScore = 0;
	lives = 3;
	wave = 0;
	levelIndex = 0;
	levelName = "";
	message = null;
	messageT = 0;
	tiles = [];
	brickHp = [];
	player;
	enemies = [];
	bullets = [];
	particles = [];
	explosions = [];
	pickups = [];
	keys = /* @__PURE__ */ new Set();
	/** injected steer: +1 left, −1 right (matches controls skill) */
	injectSteer = null;
	injectThrottle = null;
	camX = 0;
	camY = 0;
	shake = 0;
	hitStop = 0;
	powerTimer = 0;
	powerKind = null;
	touch = {
		left: false,
		right: false,
		up: false,
		down: false,
		fire: false
	};
	images = {
		player: null,
		enemy: null,
		boom: []
	};
	raf = 0;
	last = 0;
	acc = 0;
	idSeq = 1;
	running = false;
	boundKeyDown;
	boundKeyUp;
	boundBlur;
	boundResize;
	enemySpawns = [];
	spawnQueue = 0;
	spawnTimer = 0;
	enemiesToSpawn = 0;
	enemiesKilledWave = 0;
	enemiesThisWave = 0;
	constructor(canvas) {
		this.canvas = canvas;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("2d context unavailable");
		this.ctx = ctx;
		this.highScore = loadHighScore();
		for (let i = 0; i < MAX_BULLETS; i++) this.bullets.push({
			active: false,
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			team: "player",
			damage: 1,
			life: 0,
			radius: 4
		});
		for (let i = 0; i < MAX_PARTICLES; i++) this.particles.push({
			active: false,
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			life: 0,
			maxLife: 1,
			size: 2,
			color: "#fff"
		});
		for (let i = 0; i < MAX_EXPLOSIONS; i++) this.explosions.push({
			active: false,
			x: 0,
			y: 0,
			t: 0,
			scale: 1
		});
		this.player = this.makeTank("player", 0, 0, 0);
		this.boundKeyDown = (e) => {
			if ([
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"Space"
			].includes(e.code)) e.preventDefault();
			this.keys.add(e.code);
			if (e.code === "KeyP" && this.phase === "playing") this.phase = "paused";
			else if (e.code === "KeyP" && this.phase === "paused") this.phase = "playing";
			else if ((e.code === "Enter" || e.code === "Space") && (this.phase === "title" || this.phase === "gameover" || this.phase === "victory" || this.phase === "waveClear")) {
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
		window.addEventListener("keydown", this.boundKeyDown);
		window.addEventListener("keyup", this.boundKeyUp);
		window.addEventListener("blur", this.boundBlur);
		window.addEventListener("resize", this.boundResize);
		document.addEventListener("visibilitychange", this.boundBlur);
		this.resize();
		this.loadAssets();
		this.wireQa();
	}
	wireQa() {
		if (typeof window === "undefined") return;
		window.__controlsTest = {
			getYaw: () => this.player.angle,
			getSpeed: () => this.player.speed,
			setSteer: (v) => {
				this.injectSteer = v;
			},
			setThrottle: (v) => {
				this.injectThrottle = v;
			},
			setKeys: (codes) => {
				this.keys.clear();
				for (const c of codes) this.keys.add(c);
			},
			getPosition: () => ({
				x: this.player.x,
				y: this.player.y
			})
		};
		window.__tankz = {
			getHud: () => this.getHud(),
			start: () => this.startGame(),
			fire: () => {
				if (this.phase === "playing") this.tryFire(this.player);
			}
		};
	}
	async loadAssets() {
		const load = (src) => new Promise((resolve, reject) => {
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
				load("/sprites/boom-4.png")
			]);
		} catch {}
	}
	dispose() {
		this.running = false;
		cancelAnimationFrame(this.raf);
		window.removeEventListener("keydown", this.boundKeyDown);
		window.removeEventListener("keyup", this.boundKeyUp);
		window.removeEventListener("blur", this.boundBlur);
		window.removeEventListener("resize", this.boundResize);
		document.removeEventListener("visibilitychange", this.boundBlur);
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
		const loop = (now) => {
			if (!this.running) return;
			let dt = (now - this.last) / 1e3;
			this.last = now;
			dt = Math.min(dt, .1);
			this.acc += dt;
			while (this.acc >= FIXED_DT) {
				if (this.hitStop > 0) this.hitStop -= FIXED_DT;
				else if (this.phase === "playing") this.fixedUpdate(FIXED_DT);
				else this.idleUpdate(FIXED_DT);
				this.acc -= FIXED_DT;
			}
			this.draw();
			this.raf = requestAnimationFrame(loop);
		};
		this.raf = requestAnimationFrame(loop);
	}
	handlePrimaryAction() {
		unlockAudio();
		if (this.phase === "title") this.startGame();
		else if (this.phase === "waveClear") this.nextWave();
		else if (this.phase === "gameover" || this.phase === "victory") this.startGame();
		else if (this.phase === "paused") this.phase = "playing";
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
		this.phase = "playing";
		this.loadLevel(0);
		this.beginWave();
	}
	loadLevel(idx) {
		this.levelIndex = idx;
		const def = getLevel(idx);
		this.levelName = def.name;
		const parsed = parseLevel(def);
		this.tiles = parsed.tiles;
		this.enemySpawns = parsed.enemySpawns;
		this.brickHp = this.tiles.map((row) => row.map((t) => t === "#" ? 2 : t === "S" ? 999 : 0));
		this.enemies = [];
		this.pickups = [];
		for (const b of this.bullets) b.active = false;
		for (const p of this.particles) p.active = false;
		for (const e of this.explosions) e.active = false;
		this.player = this.makeTank("player", parsed.playerSpawn.x, parsed.playerSpawn.y, 0);
		this.player.health = 3;
		this.player.maxHealth = 3;
		this.player.invuln = 1.2;
		this.camX = this.player.x;
		this.camY = this.player.y;
	}
	beginWave() {
		this.wave += 1;
		const base = 3 + this.wave + Math.floor(this.wave / 2);
		this.enemiesThisWave = Math.min(base, 12 + this.wave);
		this.enemiesToSpawn = this.enemiesThisWave;
		this.enemiesKilledWave = 0;
		this.spawnQueue = this.enemiesToSpawn;
		this.spawnTimer = .2;
		this.message = `Wave ${this.wave}`;
		this.messageT = 1.6;
		if (this.wave > 1 && (this.wave - 1) % 2 === 0) {
			const next = Math.min(this.levelIndex + 1, levelCount() - 1);
			if (next !== this.levelIndex) {
				const px = this.player.x;
				const py = this.player.y;
				const hp = this.player.health;
				this.loadLevel(next);
				this.player.x = px;
				this.player.y = py;
				this.player.health = hp;
				this.message = `${this.levelName} · Wave ${this.wave}`;
			}
		}
	}
	nextWave() {
		this.phase = "playing";
		this.beginWave();
	}
	makeTank(team, x, y, angle) {
		const isPlayer = team === "player";
		return {
			id: this.idSeq++,
			team,
			x,
			y,
			angle,
			speed: 0,
			radius: isPlayer ? 16 : 15,
			health: isPlayer ? 3 : 2,
			maxHealth: isPlayer ? 3 : 2,
			fireCd: 0,
			fireRate: isPlayer ? .32 : .9,
			bulletSpeed: isPlayer ? 420 : 300,
			bulletDamage: 1,
			alive: true,
			invuln: 0,
			aiTimer: 0,
			aiSteer: 0,
			aiThrottle: 0,
			aiWantFire: false,
			track: 0
		};
	}
	idleUpdate(dt) {
		this.messageT = Math.max(0, this.messageT - dt);
		this.shake = Math.max(0, this.shake - dt * 8);
	}
	fixedUpdate(dt) {
		this.messageT = Math.max(0, this.messageT - dt);
		this.shake = Math.max(0, this.shake - dt * 10);
		if (this.powerTimer > 0) {
			this.powerTimer -= dt;
			if (this.powerTimer <= 0) {
				this.powerKind = null;
				this.player.fireRate = .32;
				this.player.bulletDamage = 1;
				this.player.bulletSpeed = 420;
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
		const fx = -Math.sin(this.player.angle);
		const fy = -Math.cos(this.player.angle);
		const tx = this.player.x + fx * look;
		const ty = this.player.y + fy * look;
		this.camX += (tx - this.camX) * (1 - Math.exp(-8 * dt));
		this.camY += (ty - this.camY) * (1 - Math.exp(-8 * dt));
		this.checkWaveClear();
	}
	updatePlayer(dt) {
		const p = this.player;
		if (!p.alive) return;
		if (p.invuln > 0) p.invuln -= dt;
		if (p.fireCd > 0) p.fireCd -= dt;
		let steer = 0;
		let throttle = 0;
		if (this.injectSteer != null) steer = this.injectSteer;
		else {
			if (this.keys.has("KeyA") || this.keys.has("ArrowLeft") || this.touch.left) steer += 1;
			if (this.keys.has("KeyD") || this.keys.has("ArrowRight") || this.touch.right) steer -= 1;
		}
		if (this.injectThrottle != null) throttle = this.injectThrottle;
		else {
			if (this.keys.has("KeyW") || this.keys.has("ArrowUp") || this.touch.up) throttle += 1;
			if (this.keys.has("KeyS") || this.keys.has("ArrowDown") || this.touch.down) throttle -= 1;
		}
		const turnRate = 2.8;
		const speedFactor = .35 + .65 * Math.min(1, Math.abs(p.speed) / 140);
		const reverse = p.speed >= 0 ? 1 : -1;
		p.angle = wrapAngle(p.angle + steer * turnRate * speedFactor * reverse * dt);
		const accel = 320;
		const maxSpeed = 165;
		if (throttle !== 0) p.speed += throttle * accel * dt;
		else {
			p.speed *= Math.exp(-4.2 * dt);
			if (Math.abs(p.speed) < 4) p.speed = 0;
		}
		p.speed = clamp(p.speed, -165 * .55, maxSpeed);
		this.moveTank(p, dt);
		if (this.keys.has("Space") || this.keys.has("KeyJ") || this.touch.fire || this.keys.has("Enter")) this.tryFire(p);
		p.track += Math.abs(p.speed) * dt * .04;
	}
	spawnEnemies(dt) {
		if (this.spawnQueue <= 0) return;
		if (this.enemies.filter((e) => e.alive).length >= Math.min(MAX_ENEMIES, 4 + Math.floor(this.wave / 2))) return;
		this.spawnTimer -= dt;
		if (this.spawnTimer > 0) return;
		this.spawnTimer = Math.max(.45, 1.2 - this.wave * .05);
		this.spawnQueue -= 1;
		const spots = this.enemySpawns.length ? this.enemySpawns : [{
			x: 80,
			y: 80
		}, {
			x: 1040,
			y: 80
		}];
		let best = spots[0];
		let bestScore = -1;
		for (const s of spots) {
			const dx = s.x - this.player.x;
			const dy = s.y - this.player.y;
			const score = Math.hypot(dx, dy) + (!this.enemies.some((e) => e.alive && Math.hypot(e.x - s.x, e.y - s.y) < 40) ? 200 : 0);
			if (score > bestScore) {
				bestScore = score;
				best = s;
			}
		}
		const t = this.makeTank("enemy", best.x, best.y, Math.PI);
		const waveScale = 1 + (this.wave - 1) * .08;
		t.maxHealth = Math.min(5, 2 + Math.floor(this.wave / 3));
		t.health = t.maxHealth;
		t.fireRate = Math.max(.45, 1 - this.wave * .04);
		t.bulletSpeed = 280 + this.wave * 8;
		t.speed = 0;
		t.aiTimer = 0;
		t.maxMove = 90 + this.wave * 4 * waveScale;
		this.enemies.push(t);
		this.spawnBurst(t.x, t.y, "#e06c75");
	}
	updateEnemies(dt) {
		for (const e of this.enemies) {
			if (!e.alive) continue;
			if (e.invuln > 0) e.invuln -= dt;
			if (e.fireCd > 0) e.fireCd -= dt;
			e.aiTimer -= dt;
			if (e.aiTimer <= 0) {
				e.aiTimer = .35 + Math.random() * .55;
				const dx = this.player.x - e.x;
				const dy = this.player.y - e.y;
				const dist = Math.hypot(dx, dy) || 1;
				let da = wrapAngle(Math.atan2(-dx, -dy) - e.angle);
				if (Math.random() < .18) da += (Math.random() - .5) * 1.2;
				e.aiSteer = clamp(da * 1.8, -1, 1);
				e.aiThrottle = dist > 220 ? 1 : dist < 90 ? -.3 : .55;
				e.aiWantFire = Math.abs(da) < .35 && dist < 480;
				for (const o of this.enemies) {
					if (o === e || !o.alive) continue;
					const sx = e.x - o.x;
					const sy = e.y - o.y;
					const sd = Math.hypot(sx, sy);
					if (sd < 50 && sd > .1) {
						const sepAng = Math.atan2(-sx, -sy);
						e.aiSteer += clamp(wrapAngle(sepAng - e.angle), -.5, .5);
					}
				}
			}
			e.angle = wrapAngle(e.angle + e.aiSteer * 2.2 * dt);
			const maxMove = e.maxMove ?? 100;
			const targetSpeed = e.aiThrottle * maxMove;
			e.speed += (targetSpeed - e.speed) * (1 - Math.exp(-4 * dt));
			this.moveTank(e, dt);
			e.track += Math.abs(e.speed) * dt * .04;
			if (e.aiWantFire) this.tryFire(e);
			if (this.player.alive && this.player.invuln <= 0) {
				if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.radius + this.player.radius - 4) this.damageTank(this.player, 1, e.x, e.y);
			}
		}
	}
	moveTank(t, dt) {
		const fx = -Math.sin(t.angle);
		const fy = -Math.cos(t.angle);
		let nx = t.x + fx * t.speed * dt;
		let ny = t.y + fy * t.speed * dt;
		if (!this.collidesSolid(nx, t.y, t.radius)) t.x = nx;
		else {
			t.speed *= .4;
			if (t.team === "enemy") {
				t.aiTimer = 0;
				t.aiSteer = Math.random() > .5 ? 1 : -1;
			}
		}
		if (!this.collidesSolid(t.x, ny, t.radius)) t.y = ny;
		else {
			t.speed *= .4;
			if (t.team === "enemy") {
				t.aiTimer = 0;
				t.aiSteer = Math.random() > .5 ? 1 : -1;
			}
		}
		t.x = clamp(t.x, t.radius, 1120 - t.radius);
		t.y = clamp(t.y, t.radius, 880 - t.radius);
	}
	collidesSolid(x, y, r) {
		const minC = Math.floor((x - r) / 40);
		const maxC = Math.floor((x + r) / 40);
		const minR = Math.floor((y - r) / 40);
		const maxR = Math.floor((y + r) / 40);
		for (let row = minR; row <= maxR; row++) for (let col = minC; col <= maxC; col++) {
			const tile = this.getTile(col, row);
			if (tile === "#" || tile === "S" || tile === "~") {
				const cx = clamp(x, col * 40, col * 40 + 40);
				const cy = clamp(y, row * 40, row * 40 + 40);
				const dx = x - cx;
				const dy = y - cy;
				if (dx * dx + dy * dy < r * r) return true;
			}
		}
		return false;
	}
	getTile(c, r) {
		if (r < 0 || c < 0 || r >= 22 || c >= 28) return "S";
		return this.tiles[r]?.[c] ?? "S";
	}
	tryFire(t) {
		if (!t.alive || t.fireCd > 0) return;
		t.fireCd = t.fireRate;
		const fx = -Math.sin(t.angle);
		const fy = -Math.cos(t.angle);
		const muzzle = t.radius + 10;
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
		if (t.team === "player") {
			sfx.fire();
			this.shake = Math.max(this.shake, 2.5);
			for (let i = 0; i < 4; i++) this.spawnParticle(bx, by, fx * 40 + (Math.random() - .5) * 60, fy * 40 + (Math.random() - .5) * 60, .2, 2, "#f5f7fa");
		}
	}
	updateBullets(dt) {
		for (const b of this.bullets) {
			if (!b.active) continue;
			b.life -= dt;
			if (b.life <= 0) {
				b.active = false;
				continue;
			}
			b.x += b.vx * dt;
			b.y += b.vy * dt;
			if (b.x < 0 || b.y < 0 || b.x > 1120 || b.y > 880) {
				b.active = false;
				continue;
			}
			const col = Math.floor(b.x / 40);
			const row = Math.floor(b.y / 40);
			const tile = this.getTile(col, row);
			if (tile === "#" || tile === "S") {
				if (tile === "#") {
					const hp = this.brickHp[row]?.[col] ?? 0;
					const dmg = b.damage;
					if (this.brickHp[row]) this.brickHp[row][col] = hp - dmg;
					if ((this.brickHp[row]?.[col] ?? 0) <= 0) {
						this.tiles[row][col] = ".";
						this.spawnBurst(col * 40 + 40 / 2, row * 40 + 40 / 2, "#c4a574");
						if (b.team === "player") this.score += 5;
					} else this.spawnParticle(b.x, b.y, -b.vx * .1, -b.vy * .1, .2, 3, "#d2b48c");
					sfx.wall();
				} else if (b.team === "player" && this.powerKind === "star" && b.damage >= 2) {
					this.tiles[row][col] = ".";
					this.brickHp[row][col] = 0;
					this.spawnBurst(col * 40 + 40 / 2, row * 40 + 40 / 2, "#8b919e");
					this.score += 15;
				} else {
					this.spawnParticle(b.x, b.y, 0, 0, .15, 2, "#a0a8b8");
					sfx.wall();
				}
				b.active = false;
				continue;
			}
			if (b.team === "player") for (const e of this.enemies) {
				if (!e.alive || e.invuln > 0) continue;
				if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
					b.active = false;
					this.damageTank(e, b.damage, b.x, b.y);
					break;
				}
			}
			else if (this.player.alive && this.player.invuln <= 0) {
				if (Math.hypot(this.player.x - b.x, this.player.y - b.y) < this.player.radius + b.radius) {
					b.active = false;
					this.damageTank(this.player, b.damage, b.x, b.y);
				}
			}
		}
	}
	damageTank(t, dmg, hx, hy) {
		if (!t.alive) return;
		if (t.team === "player" && this.powerKind === "shield" && t.invuln > 0) return;
		if (t.team === "player" && this.powerKind === "shield") {
			this.powerKind = null;
			this.powerTimer = 0;
			t.invuln = .8;
			sfx.hit();
			this.spawnBurst(t.x, t.y, "#5eead4");
			return;
		}
		t.health -= dmg;
		t.invuln = t.team === "player" ? 1 : .15;
		this.hitStop = t.team === "enemy" ? .04 : .06;
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
				if (Math.random() < .22) this.spawnPickup(t.x, t.y);
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
					const parsed = parseLevel(getLevel(this.levelIndex));
					t.x = parsed.playerSpawn.x;
					t.y = parsed.playerSpawn.y;
					t.angle = 0;
					t.speed = 0;
					t.health = t.maxHealth;
					t.alive = true;
					t.invuln = 2.2;
					this.message = "Respawning";
					this.messageT = 1.2;
				}
			}
		}
	}
	boom(x, y, scale = 1) {
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
	spawnBurst(x, y, color) {
		for (let i = 0; i < 12; i++) {
			const a = Math.random() * Math.PI * 2;
			const sp = 40 + Math.random() * 120;
			this.spawnParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, .25 + Math.random() * .35, 2 + Math.random() * 3, color);
		}
	}
	spawnParticle(x, y, vx, vy, life, size, color) {
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
	updateParticles(dt) {
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
	updateExplosions(dt) {
		for (const e of this.explosions) {
			if (!e.active) continue;
			e.t += dt;
			if (e.t >= .45) e.active = false;
		}
	}
	spawnPickup(x, y) {
		const kinds = [
			"repair",
			"rapid",
			"shield",
			"star"
		];
		const kind = kinds[Math.floor(Math.random() * kinds.length)];
		this.pickups.push({
			active: true,
			x,
			y,
			kind,
			life: 12
		});
	}
	updatePickups(dt) {
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
	applyPickup(kind) {
		this.powerKind = kind;
		if (kind === "repair") {
			this.player.health = this.player.maxHealth;
			this.powerTimer = .1;
			this.powerKind = null;
			this.message = "Armor Restored";
			this.messageT = 1.2;
		} else if (kind === "rapid") {
			this.player.fireRate = .14;
			this.powerTimer = 10;
			this.message = "Rapid Fire";
			this.messageT = 1.2;
		} else if (kind === "shield") {
			this.player.invuln = 8;
			this.powerTimer = 8;
			this.message = "Shield Online";
			this.messageT = 1.2;
		} else if (kind === "star") {
			this.player.bulletDamage = 2;
			this.player.bulletSpeed = 520;
			this.player.fireRate = .22;
			this.powerTimer = 12;
			this.message = "Star Cannon";
			this.messageT = 1.2;
		}
	}
	checkWaveClear() {
		if (this.spawnQueue > 0) return;
		if (this.enemies.some((e) => e.alive)) return;
		if (this.enemiesKilledWave < this.enemiesThisWave && this.enemiesToSpawn > 0) {}
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
		this.phase = "waveClear";
		this.message = "Wave Clear";
		this.messageT = 99;
		this.score += 50 * this.wave;
		sfx.win();
	}
	getHud() {
		const enemiesLeft = this.spawnQueue + this.enemies.filter((e) => e.alive).length;
		let powerLabel = null;
		if (this.powerKind === "rapid") powerLabel = "Rapid";
		if (this.powerKind === "shield") powerLabel = "Shield";
		if (this.powerKind === "star") powerLabel = "Star";
		return {
			phase: this.phase,
			score: this.score,
			highScore: this.highScore,
			lives: this.lives,
			health: this.player?.health ?? 0,
			maxHealth: this.player?.maxHealth ?? 3,
			wave: this.wave,
			levelName: this.levelName,
			enemiesLeft,
			powerLabel,
			message: this.messageT > 0 ? this.message : null
		};
	}
	draw() {
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
			ox += (Math.random() - .5) * this.shake * 2;
			oy += (Math.random() - .5) * this.shake * 2;
		}
		ctx.save();
		ctx.translate(-ox, -oy);
		this.drawWorld();
		this.drawPickups();
		for (const e of this.enemies) if (e.alive) this.drawTank(e);
		if (this.player.alive) this.drawTank(this.player);
		this.drawBullets();
		this.drawParticles();
		this.drawExplosions();
		ctx.restore();
		const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .72);
		vg.addColorStop(0, "rgba(0,0,0,0)");
		vg.addColorStop(1, "rgba(0,0,0,0.45)");
		ctx.fillStyle = vg;
		ctx.fillRect(0, 0, w, h);
		if (this.phase === "title") this.drawTitleOverlay();
	}
	drawTitleOnly() {
		const ctx = this.ctx;
		ctx.fillStyle = "#10131a";
		ctx.fillRect(0, 0, this.width, this.height);
		for (let i = 0; i < 40; i++) {
			ctx.fillStyle = `rgba(94,234,212,${.02 + i % 5 * .01})`;
			ctx.fillRect(i * 97 % this.width, i * 53 % this.height, 2, 2);
		}
		this.drawTitleOverlay();
	}
	drawTitleOverlay() {}
	drawWorld() {
		const ctx = this.ctx;
		const worldW = 1120;
		const worldH = 880;
		ctx.fillStyle = "#1a1f28";
		ctx.fillRect(0, 0, worldW, worldH);
		for (let r = 0; r < 22; r++) for (let c = 0; c < 28; c++) {
			const x = c * 40;
			const y = r * 40;
			const n = (c * 17 + r * 31) % 7 / 7;
			ctx.fillStyle = n > .55 ? "#1c222d" : n > .3 ? "#181e27" : "#1a2030";
			ctx.fillRect(x, y, 40, 40);
			if ((c + r) % 3 === 0) {
				ctx.fillStyle = "rgba(255,255,255,0.015)";
				ctx.fillRect(x + 4, y + 6, 6, 4);
			}
		}
		for (let r = 0; r < 22; r++) for (let c = 0; c < 28; c++) {
			const t = this.tiles[r][c];
			const x = c * 40;
			const y = r * 40;
			if (t === "#") this.drawBrick(x, y, this.brickHp[r][c]);
			else if (t === "S") this.drawSteel(x, y);
			else if (t === "~") this.drawWater(x, y, r, c);
			else if (t === "^") this.drawBush(x, y);
		}
		ctx.strokeStyle = "rgba(94,234,212,0.12)";
		ctx.lineWidth = 3;
		ctx.strokeRect(1.5, 1.5, 1117, 877);
	}
	drawBrick(x, y, hp) {
		const ctx = this.ctx;
		const dmg = hp <= 1;
		ctx.fillStyle = dmg ? "#8a6a48" : "#a67c52";
		ctx.fillRect(x + 1, y + 1, 38, 38);
		ctx.strokeStyle = "rgba(0,0,0,0.35)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x + 1, y + 40 / 2);
		ctx.lineTo(x + 40 - 1, y + 40 / 2);
		ctx.moveTo(x + 40 / 2, y + 1);
		ctx.lineTo(x + 40 / 2, y + 40 / 2);
		ctx.moveTo(x + 40 / 4, y + 40 / 2);
		ctx.lineTo(x + 40 / 4, y + 40 - 1);
		ctx.moveTo(x + 120 / 4, y + 40 / 2);
		ctx.lineTo(x + 120 / 4, y + 40 - 1);
		ctx.stroke();
		ctx.strokeStyle = "rgba(255,255,255,0.08)";
		ctx.strokeRect(x + 1.5, y + 1.5, 37, 37);
		if (dmg) {
			ctx.fillStyle = "rgba(0,0,0,0.25)";
			ctx.fillRect(x + 6, y + 10, 8, 3);
			ctx.fillRect(x + 20, y + 22, 10, 4);
		}
	}
	drawSteel(x, y) {
		const ctx = this.ctx;
		const g = ctx.createLinearGradient(x, y, x + 40, y + 40);
		g.addColorStop(0, "#4a5160");
		g.addColorStop(.5, "#6a7385");
		g.addColorStop(1, "#3a4050");
		ctx.fillStyle = g;
		ctx.fillRect(x + 1, y + 1, 38, 38);
		ctx.strokeStyle = "rgba(255,255,255,0.15)";
		ctx.lineWidth = 1;
		ctx.strokeRect(x + 4, y + 4, 32, 32);
		ctx.strokeStyle = "rgba(0,0,0,0.35)";
		ctx.strokeRect(x + 1, y + 1, 38, 38);
	}
	drawWater(x, y, r, c) {
		const ctx = this.ctx;
		const t = performance.now() / 1e3;
		const pulse = .5 + .5 * Math.sin(t * 2 + c * .4 + r * .3);
		ctx.fillStyle = `rgba(40, 90, 140, ${.55 + pulse * .15})`;
		ctx.fillRect(x + 1, y + 1, 38, 38);
		ctx.strokeStyle = `rgba(100, 180, 220, ${.25 + pulse * .2})`;
		ctx.beginPath();
		ctx.moveTo(x + 4, y + 12 + pulse * 3);
		ctx.quadraticCurveTo(x + 20, y + 8, x + 36, y + 14 + pulse * 2);
		ctx.stroke();
	}
	drawBush(x, y) {
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
	drawTank(t) {
		const ctx = this.ctx;
		ctx.save();
		ctx.translate(t.x, t.y);
		ctx.rotate(t.angle);
		if (t.invuln > 0 && Math.floor(t.invuln * 12) % 2 === 0) ctx.globalAlpha = .45;
		const img = t.team === "player" ? this.images.player : this.images.enemy;
		const size = t.team === "player" ? 44 : 40;
		if (img && img.complete && img.naturalWidth > 0) {
			ctx.fillStyle = "rgba(0,0,0,0.35)";
			ctx.beginPath();
			ctx.ellipse(2, 3, size * .32, size * .28, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.drawImage(img, -size / 2, -size / 2, size, size);
		} else this.drawTankFallback(t);
		if (t.team === "player" && this.powerKind === "shield") {
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
			ctx.fillRect(t.x - bw / 2, t.y - t.radius - 10, bw * (t.health / t.maxHealth), 4);
		}
	}
	drawTankFallback(t) {
		const ctx = this.ctx;
		const body = t.team === "player" ? "#3d9b8f" : "#a84a52";
		const dark = t.team === "player" ? "#2a6b62" : "#6e3036";
		ctx.fillStyle = "#1a1d22";
		ctx.fillRect(-14, -18, 6, 36);
		ctx.fillRect(8, -18, 6, 36);
		ctx.fillStyle = body;
		ctx.fillRect(-10, -16, 20, 32);
		ctx.fillStyle = dark;
		ctx.fillRect(-7, -6, 14, 14);
		ctx.beginPath();
		ctx.arc(0, 0, 7, 0, Math.PI * 2);
		ctx.fillStyle = body;
		ctx.fill();
		ctx.fillStyle = dark;
		ctx.fillRect(-2, -22, 4, 16);
	}
	drawBullets() {
		const ctx = this.ctx;
		for (const b of this.bullets) {
			if (!b.active) continue;
			ctx.fillStyle = b.team === "player" ? "#f0f4ff" : "#ff8a80";
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = b.team === "player" ? "rgba(94,234,212,0.45)" : "rgba(255,100,80,0.4)";
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = b.team === "player" ? "rgba(240,244,255,0.35)" : "rgba(255,120,100,0.3)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(b.x, b.y);
			ctx.lineTo(b.x - b.vx * .03, b.y - b.vy * .03);
			ctx.stroke();
		}
	}
	drawParticles() {
		const ctx = this.ctx;
		for (const p of this.particles) {
			if (!p.active) continue;
			ctx.globalAlpha = p.life / p.maxLife;
			ctx.fillStyle = p.color;
			ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
			ctx.globalAlpha = 1;
		}
	}
	drawExplosions() {
		const ctx = this.ctx;
		for (const e of this.explosions) {
			if (!e.active) continue;
			const frame = Math.min(3, Math.floor(e.t / .11));
			const img = this.images.boom[frame];
			const size = 56 * e.scale;
			if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, e.x - size / 2, e.y - size / 2, size, size);
			else {
				ctx.fillStyle = `rgba(255,160,60,${1 - e.t / .45})`;
				ctx.beginPath();
				ctx.arc(e.x, e.y, 10 + e.t * 40, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}
	drawPickups() {
		const ctx = this.ctx;
		const t = performance.now() / 1e3;
		for (const p of this.pickups) {
			if (!p.active) continue;
			const bob = Math.sin(t * 4 + p.x) * 3;
			const colors = {
				repair: "#7fd99a",
				rapid: "#e6c07b",
				shield: "#5eead4",
				star: "#f0f4ff"
			};
			const labels = {
				repair: "+",
				rapid: "R",
				shield: "O",
				star: "*"
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
			ctx.fillText(labels[p.kind], p.x, p.y + bob + .5);
			if (p.life < 3 && Math.floor(p.life * 6) % 2 === 0) ctx.globalAlpha = .4;
			ctx.globalAlpha = 1;
		}
	}
};
var INITIAL_HUD = {
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
	message: null
};
function TankzGame() {
	const canvasRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(INITIAL_HUD);
	const touchRef = (0, import_react.useRef)({
		left: false,
		right: false,
		up: false,
		down: false,
		fire: false
	});
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const engine = new TankzEngine(canvas);
		engineRef.current = engine;
		engine.start();
		const id = window.setInterval(() => {
			setHud(engine.getHud());
		}, 100);
		return () => {
			window.clearInterval(id);
			engine.dispose();
			engineRef.current = null;
		};
	}, []);
	const syncTouch = (0, import_react.useCallback)(() => {
		const e = engineRef.current;
		if (!e) return;
		e.touch = { ...touchRef.current };
	}, []);
	const setTouch = (0, import_react.useCallback)((key, v) => {
		touchRef.current[key] = v;
		syncTouch();
		if (v) unlockAudio();
	}, [syncTouch]);
	const primary = () => {
		unlockAudio();
		engineRef.current?.handlePrimaryAction();
	};
	const phase = hud.phase;
	const showMenu = phase === "title" || phase === "gameover" || phase === "victory" || phase === "waveClear" || phase === "paused";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-[calc(100dvh-var(--grok-banner-h,0px))] w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full touch-none",
				style: { touchAction: "none" }
			}),
			phase !== "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-md border border-border/80 bg-surface/80 px-3 py-1.5 backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-medium tracking-[0.16em] text-muted uppercase",
							children: "Score"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-sm font-semibold tabular-nums tracking-tight",
							children: hud.score.toLocaleString()
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-md border border-border/60 bg-surface/70 px-3 py-1 text-[11px] text-muted backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tracking-wide uppercase",
							children: "Best"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono tabular-nums text-fg/90",
							children: hud.highScore.toLocaleString()
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-md border border-border/80 bg-surface/80 px-3 py-1.5 backdrop-blur-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[10px] font-medium tracking-[0.16em] text-muted uppercase",
									children: ["Wave ", hud.wave]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden text-subtle sm:inline",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden max-w-[10rem] truncate text-[11px] text-muted sm:inline",
									children: hud.levelName
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-md border border-border/60 bg-surface/70 px-3 py-1.5 backdrop-blur-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HealthPips, {
									health: hud.health,
									max: hud.maxHealth
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-xs tabular-nums text-muted",
									children: ["×", hud.lives]
								}),
								hud.powerLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-sm bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase",
									children: hud.powerLabel
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-md border border-border/50 bg-surface/60 px-2.5 py-1 text-[11px] text-muted backdrop-blur-sm",
							children: [
								"Hostiles",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono tabular-nums text-fg",
									children: hud.enemiesLeft
								})
							]
						})
					]
				})]
			}),
			phase === "playing" && hud.message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-lg border border-border bg-surface/85 px-5 py-2 text-sm font-medium tracking-wide text-fg backdrop-blur-md",
					children: hud.message
				})
			}),
			showMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/55 p-4 backdrop-blur-[2px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full max-w-md rounded-xl border border-border bg-surface/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuContent, {
						phase,
						hud,
						onPrimary: primary
					})
				})
			}),
			phase === "playing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 rounded-full border border-border/50 bg-surface/70 px-3 py-1 text-[11px] text-muted backdrop-blur-sm md:block",
				children: "WASD drive · Space fire · P pause"
			}),
			(phase === "playing" || phase === "paused") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "▲",
							ariaLabel: "Forward",
							onDown: () => setTouch("up", true),
							onUp: () => setTouch("up", false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "◀",
							ariaLabel: "Turn left",
							onDown: () => setTouch("left", true),
							onUp: () => setTouch("left", false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "▼",
							ariaLabel: "Reverse",
							onDown: () => setTouch("down", true),
							onUp: () => setTouch("down", false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "▶",
							ariaLabel: "Turn right",
							onDown: () => setTouch("right", true),
							onUp: () => setTouch("right", false)
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
					label: "FIRE",
					ariaLabel: "Fire",
					wide: true,
					onDown: () => setTouch("fire", true),
					onUp: () => setTouch("fire", false)
				})]
			})
		]
	});
}
function HealthPips({ health, max }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center gap-1",
		"aria-label": `Health ${health} of ${max}`,
		children: Array.from({ length: max }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-[2px] ${i < health ? "bg-accent" : "bg-border"}` }, i))
	});
}
function MenuContent({ phase, hud, onPrimary }) {
	if (phase === "title") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium tracking-[0.22em] text-accent uppercase",
						children: "Armor Division"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-4xl font-semibold tracking-tight sm:text-5xl",
						children: "Tankz"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-sm text-sm leading-relaxed text-muted",
						children: "Modern top-down tank combat. Rotate, drive, and blast through waves of enemy armor. Destructible cover, power-ups, and classic feel."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
						k: "W / S",
						v: "Drive"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
						k: "A / D",
						v: "Rotate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
						k: "Space",
						v: "Fire"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hint, {
						k: "P",
						v: "Pause"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onPrimary,
				className: "w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]",
				children: "Deploy"
			}),
			hud.highScore > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-center text-xs text-muted",
				children: [
					"High score",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono tabular-nums text-fg",
						children: hud.highScore.toLocaleString()
					})
				]
			})
		]
	});
	if (phase === "paused") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Paused"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Battlefield on hold."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onPrimary,
				className: "w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]",
				children: "Resume"
			})
		]
	});
	if (phase === "waveClear") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] font-medium tracking-[0.18em] text-accent uppercase",
				children: ["Wave ", hud.wave]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Sector Quiet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-sm tabular-nums text-muted",
				children: ["Score ", hud.score.toLocaleString()]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onPrimary,
				className: "w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]",
				children: "Next Wave"
			})
		]
	});
	if (phase === "victory") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium tracking-[0.18em] text-accent uppercase",
				children: "Victory"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Sector Cleared"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-sm tabular-nums text-muted",
				children: ["Final score ", hud.score.toLocaleString()]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onPrimary,
				className: "w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]",
				children: "Play Again"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium tracking-[0.18em] text-danger uppercase",
				children: "Destroyed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Mission Failed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-mono text-sm tabular-nums text-muted",
				children: ["Score ", hud.score.toLocaleString()]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onPrimary,
				className: "w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]",
				children: "Retry"
			})
		]
	});
}
function Hint({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between rounded-md border border-border/70 bg-surface-2/80 px-2.5 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-[11px] text-fg",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: v })]
	});
}
function TouchBtn({ label, ariaLabel, onDown, onUp, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": ariaLabel,
		className: `select-none rounded-lg border border-border/80 bg-surface/80 text-sm font-semibold text-fg shadow-sm backdrop-blur-sm active:bg-accent/20 ${wide ? "h-16 w-24" : "flex h-14 w-14 items-center justify-center"}`,
		style: { touchAction: "none" },
		onPointerDown: (e) => {
			e.preventDefault();
			e.target.setPointerCapture(e.pointerId);
			onDown();
		},
		onPointerUp: (e) => {
			e.preventDefault();
			onUp();
		},
		onPointerCancel: onUp,
		onPointerLeave: onUp,
		onContextMenu: (e) => e.preventDefault(),
		children: label
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TankzGame, {});
}
//#endregion
export { Home as component };
