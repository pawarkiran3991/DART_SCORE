import type { DartHit, Seat } from "./hit";

export interface Card {
  id: string;
  name: string;
  color: string;
  primary: string;
  secondary: string;
  active: boolean;
  dim?: boolean;
}

export interface View {
  title: string;
  cards: Card[];
  visit: string[];
  message: string;
  say: string;
  over: boolean;
  winner?: string;
}

export interface VisitEvent {
  playerId: string;
  playerName: string;
  labels: string[];
  total: number;
  bust: boolean;
  checkout: boolean;
  wonLeg: boolean;
}

export interface ResultPlayer {
  name: string;
  primary: string;
  darts: number;
  scored: number;
  bestVisit: number;
  won: boolean;
  average: number;
}

export interface MatchResult {
  gameId: string;
  title: string;
  solo: boolean;
  completed: boolean;
  winnerName?: string;
  players: ResultPlayer[];
}

export interface GameOptions {
  legsToWin: number;
  raceTarget: number;
  solo: boolean;
}

export abstract class Engine {
  readonly seats: Seat[];
  readonly options: GameOptions;
  readonly gameId: string;
  readonly title: string;
  say = "";
  commits = 0;
  protected hist: string[] = [];

  constructor(gameId: string, title: string, seats: Seat[], options: GameOptions) {
    this.gameId = gameId;
    this.title = title;
    this.seats = seats;
    this.options = options;
  }

  protected backup(): void {
    this.hist.push(JSON.stringify({ state: this.saveState(), say: this.say, commits: this.commits }));
  }

  /** Returns true when the undone action had already stored a visit. */
  undo(): boolean {
    const prev = this.hist.pop();
    if (!prev) return false;
    const parsed = JSON.parse(prev) as { state: unknown; say: string; commits: number };
    const rolledVisit = parsed.commits < this.commits;
    this.say = parsed.say;
    this.commits = parsed.commits;
    this.loadState(parsed.state);
    return rolledVisit;
  }

  protected spoken(text: string): void {
    this.say = text;
  }

  abstract view(): View;
  abstract dart(hit: DartHit): VisitEvent | null;
  abstract finishVisit(): VisitEvent | null;
  abstract result(completed: boolean): MatchResult;
  protected abstract saveState(): unknown;
  protected abstract loadState(raw: unknown): void;
}
