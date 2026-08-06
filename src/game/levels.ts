/** Tile map: . empty, # brick, S steel, ~ water, ^ bush, P player spawn, E enemy spawn */

export type TileChar = "." | "#" | "S" | "~" | "^" | "P" | "E";

export interface LevelDef {
  name: string;
  rows: string[];
}

export const TILE = 40;
export const WORLD_COLS = 28;
export const WORLD_ROWS = 22;

const LEVELS: LevelDef[] = [
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
      "SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    ],
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
      "SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    ],
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
      "SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    ],
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
      "SSSSSSSSSSSSSSSSSSSSSSSSSSSS",
    ],
  },
];

export function getLevel(index: number): LevelDef {
  return LEVELS[Math.min(index, LEVELS.length - 1)]!;
}

export function levelCount() {
  return LEVELS.length;
}

export function parseLevel(level: LevelDef) {
  const tiles: TileChar[][] = [];
  const enemySpawns: { x: number; y: number }[] = [];
  let playerSpawn = {
    x: (WORLD_COLS * TILE) / 2,
    y: (WORLD_ROWS * TILE) * 0.8,
  };

  for (let r = 0; r < WORLD_ROWS; r++) {
    const rowStr = (level.rows[r] ?? "").padEnd(WORLD_COLS, ".").slice(0, WORLD_COLS);
    const row: TileChar[] = [];
    for (let c = 0; c < WORLD_COLS; c++) {
      const ch = (rowStr[c] ?? ".") as TileChar | " ";
      if (ch === "P") {
        playerSpawn = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
        row.push(".");
      } else if (ch === "E") {
        enemySpawns.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
        row.push(".");
      } else if (ch === " " || !"#S~^.".includes(ch)) {
        row.push(".");
      } else {
        row.push(ch as TileChar);
      }
    }
    tiles.push(row);
  }

  return { tiles, enemySpawns, playerSpawn };
}
