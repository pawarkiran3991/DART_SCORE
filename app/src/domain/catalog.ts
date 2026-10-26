import { CricketEngine, type CricketMode } from "./cricket";
import type { Engine, GameOptions } from "./engine";
import type { Seat } from "./hit";
import { SequenceEngine, type SeqMode } from "./sequence";
import { TableEngine } from "./table";
import { X01Engine, type Finish } from "./x01";

export interface GameDef {
  id: string;
  title: string;
  group: string;
  blurb: string;
  min: number;
  max: number;
  legs: boolean;
  race: boolean;
}

export const COLOURS = [
  { name: "Blue", hex: "#3b6ea5" },
  { name: "Red", hex: "#c4473a" },
  { name: "Green", hex: "#3f8f5b" },
  { name: "Yellow", hex: "#c6a15a" },
  { name: "Black", hex: "#2c2c2c" },
  { name: "White", hex: "#f3efe4" },
  { name: "Orange", hex: "#e07a2f" },
  { name: "Purple", hex: "#7a4ea3" },
];

export const GAMES: GameDef[] = [
  { id: "x01-501", title: "501", group: "01", blurb: "Straight in, double out. The default game.", min: 1, max: 8, legs: true, race: false },
  { id: "x01-301", title: "301", group: "01", blurb: "Same as 501, starting at 301.", min: 1, max: 8, legs: true, race: false },
  { id: "x01-701", title: "701", group: "01", blurb: "Same as 501, starting at 701.", min: 1, max: 8, legs: true, race: false },
  { id: "x01-1001", title: "1001", group: "01", blurb: "Same as 501, starting at 1001.", min: 1, max: 8, legs: true, race: false },
  { id: "x01-dido", title: "Double in, double out", group: "01", blurb: "301. Scoring starts on a double or the inner bull.", min: 1, max: 8, legs: true, race: false },
  { id: "x01-master", title: "Master out", group: "01", blurb: "501. Finish on a double, a treble, or the inner bull.", min: 1, max: 8, legs: true, race: false },
  { id: "x01-open", title: "Open out", group: "01", blurb: "501. Any scoring dart can hit exactly 0.", min: 1, max: 8, legs: true, race: false },
  { id: "cricket", title: "Cricket", group: "Cricket", blurb: "Close 15–20 and the bull. Points on open numbers.", min: 1, max: 8, legs: false, race: false },
  { id: "cricket-cut", title: "Cut Throat", group: "Cricket", blurb: "Points land on opponents who are still open. Lowest wins.", min: 2, max: 8, legs: false, race: false },
  { id: "cricket-noscore", title: "No Score", group: "Cricket", blurb: "First to close 15–20 and the bull. No points.", min: 1, max: 8, legs: false, race: false },
  { id: "cricket-tactics", title: "Tactics", group: "Cricket", blurb: "Cricket on 10–20 and the bull.", min: 1, max: 8, legs: false, race: false },
  { id: "cricket-mickey", title: "Mickey Mouse", group: "Cricket", blurb: "Close 20 down through 12, and the bull. No points.", min: 1, max: 8, legs: false, race: false },
  { id: "atc", title: "Around the Clock", group: "Around the board", blurb: "1 through 20, then any bull. A miss stays put.", min: 1, max: 8, legs: false, race: false },
  { id: "atc-doubles", title: "Doubles Around", group: "Around the board", blurb: "Doubles only. Finish on the inner bull.", min: 1, max: 8, legs: false, race: false },
  { id: "nine-lives", title: "Nine Lives", group: "Around the board", blurb: "Around the clock. A blank visit costs a life.", min: 1, max: 8, legs: false, race: false },
  { id: "accumulator", title: "Accumulator", group: "Around the board", blurb: "A blank visit sends you back to 1.", min: 1, max: 8, legs: false, race: false },
  { id: "ladder", title: "Ladder", group: "Around the board", blurb: "A blank visit drops you one number.", min: 1, max: 8, legs: false, race: false },
  { id: "dragon", title: "Chase the Dragon", group: "Around the board", blurb: "Trebles from 10 to 20, then the inner bull.", min: 1, max: 8, legs: false, race: false },
  { id: "hare", title: "Hare and Hounds", group: "Around the board", blurb: "The hare starts on 20. The hounds start on 5.", min: 2, max: 8, legs: false, race: false },
  { id: "high", title: "High Score", group: "Adding up", blurb: "Eight visits. Highest total wins.", min: 1, max: 8, legs: false, race: false },
  { id: "average", title: "Average", group: "Adding up", blurb: "Ten visits. Highest average wins.", min: 1, max: 8, legs: false, race: false },
  { id: "race", title: "Race", group: "Adding up", blurb: "First to the target, then everyone finishes the round.", min: 1, max: 8, legs: false, race: true },
  { id: "g420", title: "420", group: "Adding up", blurb: "Exact 420 wins. Over 420 cancels the visit.", min: 1, max: 8, legs: false, race: false },
  { id: "halve", title: "Halve It", group: "Adding up", blurb: "Miss a round and the total is halved.", min: 1, max: 8, legs: false, race: false },
  { id: "bermuda", title: "Bermuda", group: "Adding up", blurb: "Thirteen Halve It rounds, ending on the bull.", min: 1, max: 8, legs: false, race: false },
  { id: "shanghai", title: "Shanghai", group: "Adding up", blurb: "Rounds 1–7. Single, double, and treble in one visit wins.", min: 1, max: 8, legs: false, race: false },
  { id: "fives", title: "All Fives", group: "Adding up", blurb: "Visit totals divisible by 5 score that many fifths. First to 51.", min: 1, max: 8, legs: false, race: false },
  { id: "killer", title: "Killer", group: "Group", blurb: "Claim a number, then hit your double. Solo ends when you become a killer.", min: 1, max: 8, legs: false, race: false },
  { id: "knockout", title: "Knockout", group: "Group", blurb: "Lowest visit loses a life. Ties throw again.", min: 2, max: 8, legs: false, race: false },
  { id: "beat", title: "Beat It", group: "Group", blurb: "Beat the previous visit. Three failures and you are out.", min: 1, max: 8, legs: false, race: false },
  { id: "last", title: "Last One Standing", group: "Group", blurb: "Hit the round target or lose a life.", min: 2, max: 8, legs: false, race: false },
  { id: "leader", title: "Follow the Leader", group: "Group", blurb: "Match the leader's bed. Three misses cost a life.", min: 2, max: 8, legs: false, race: false },
  { id: "twentyone", title: "21", group: "Group", blurb: "Closest to 21 without going over. First to 5 points.", min: 2, max: 8, legs: false, race: false },
  { id: "century", title: "Nine-Dart Century", group: "Group", blurb: "Nine darts. Over 100 scores nothing. Closest to 100 wins.", min: 1, max: 8, legs: false, race: false },
  { id: "gotcha", title: "Gotcha", group: "Group", blurb: "Count up to 301. Matching a score resets that player.", min: 2, max: 8, legs: false, race: false },
  { id: "elimination", title: "Elimination", group: "Group", blurb: "Start at 301. Land on someone and they go back to 301.", min: 2, max: 8, legs: false, race: false },
  { id: "scram", title: "Scram", group: "Group", blurb: "One side scores. The other closes 15–20 and the bull.", min: 2, max: 8, legs: false, race: false },
  { id: "golf", title: "Golf", group: "Group", blurb: "Nine holes. Double is 1, treble is 2, single is 3, miss is 5.", min: 1, max: 8, legs: false, race: false },
  { id: "baseball", title: "Baseball", group: "Group", blurb: "Nine innings. Single, double, and treble score runs.", min: 1, max: 8, legs: false, race: false },
  { id: "bowls", title: "Bowls", group: "Group", blurb: "Closest visit to 50 scores. Exact 50 scores two.", min: 1, max: 8, legs: false, race: false },
  { id: "blackout", title: "Blackout", group: "Group", blurb: "Turn off every number. A treble also takes its neighbours.", min: 1, max: 8, legs: false, race: false },
  { id: "prisoner", title: "Prisoner", group: "Group", blurb: "Clockwise from 1. Hit the number to advance. Bull does not count.", min: 1, max: 8, legs: false, race: false },
  { id: "bobs", title: "Bob's 27", group: "Practice", blurb: "Start at 27. Hit the doubles or the score falls.", min: 1, max: 8, legs: false, race: false },
  { id: "c121", title: "121", group: "Practice", blurb: "Check out 121, then the next number, up through 170.", min: 1, max: 8, legs: false, race: false },
  { id: "jdc", title: "JDC 57", group: "Practice", blurb: "Fifty-seven set darts. The phone names the next one.", min: 1, max: 8, legs: false, race: false },
  { id: "bed", title: "Three in a Bed", group: "Practice", blurb: "Single, double, and treble 20 in one visit.", min: 1, max: 8, legs: false, race: false },
];

const TABLE: Record<string, string> = {
  high: "high",
  average: "average",
  race: "race",
  g420: "g420",
  halve: "halve",
  bermuda: "bermuda",
  shanghai: "shanghai",
  fives: "fives",
  killer: "killer",
  knockout: "knockout",
  beat: "beat",
  last: "last",
  leader: "leader",
  twentyone: "twentyone",
  century: "century",
  gotcha: "gotcha",
  elimination: "elim",
  scram: "scram",
  golf: "golf",
  baseball: "baseball",
  bowls: "bowls",
  blackout: "blackout",
  prisoner: "prisoner",
  bobs: "bobs",
  c121: "c121",
  jdc: "jdc",
  bed: "bed",
};

export function gameById(id: string): GameDef {
  return GAMES.find((game) => game.id === id) ?? GAMES[0]!;
}

export function groups(): string[] {
  return [...new Set(GAMES.map((game) => game.group))];
}

export function createEngine(id: string, seats: Seat[], options: GameOptions): Engine {
  const game = gameById(id);
  if (id.startsWith("x01-")) {
    const start = id === "x01-301" || id === "x01-dido" ? 301 : id === "x01-701" ? 701 : id === "x01-1001" ? 1001 : 501;
    const finish: Finish = id === "x01-master" ? "master" : id === "x01-open" ? "open" : "double";
    return new X01Engine(id, game.title, seats, options, start, finish, id === "x01-dido");
  }
  if (id.startsWith("cricket")) {
    const mode: CricketMode =
      id === "cricket-cut" ? "cut" : id === "cricket-noscore" ? "none" : id === "cricket-tactics" ? "tactics" : id === "cricket-mickey" ? "mickey" : "standard";
    return new CricketEngine(id, game.title, seats, options, mode);
  }
  const seq: Record<string, SeqMode> = {
    atc: "atc",
    "atc-doubles": "doubles",
    "nine-lives": "lives",
    accumulator: "accumulator",
    ladder: "ladder",
    dragon: "dragon",
    hare: "hare",
  };
  if (seq[id]) return new SequenceEngine(id, game.title, seats, options, seq[id]);
  return new TableEngine(id, game.title, seats, options, TABLE[id] ?? "high");
}
