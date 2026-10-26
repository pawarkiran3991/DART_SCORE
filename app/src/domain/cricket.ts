import { Engine, type GameOptions, type MatchResult, type View, type VisitEvent } from "./engine";
import { labelOf, pointsOf, type DartHit, type Seat } from "./hit";

export type CricketMode = "standard" | "cut" | "none" | "tactics" | "mickey";

interface PState {
  marks: Record<string, number>;
  points: number;
  darts: number;
}

interface State {
  players: PState[];
  turn: number;
  visit: DartHit[];
  over: boolean;
  winner: number | null;
  message: string;
}

function targetsFor(mode: CricketMode): string[] {
  if (mode === "tactics") {
    return [...Array.from({ length: 11 }, (_, i) => String(20 - i)), "B"];
  }
  if (mode === "mickey") {
    return [...Array.from({ length: 9 }, (_, i) => String(20 - i)), "B"];
  }
  return ["20", "19", "18", "17", "16", "15", "B"];
}

function targetOf(hit: DartHit, targets: string[]): string | null {
  if (hit.number === 25 || hit.number === 50) return targets.includes("B") ? "B" : null;
  const key = String(hit.number);
  return targets.includes(key) ? key : null;
}

function markValue(hit: DartHit): number {
  if (hit.number === 0) return 0;
  if (hit.number === 25) return 1;
  if (hit.number === 50) return 2;
  if (hit.ring === "D") return 2;
  if (hit.ring === "T") return 3;
  return 1;
}

function pointPerMark(key: string): number {
  return key === "B" ? 25 : Number(key);
}

export class CricketEngine extends Engine {
  private mode: CricketMode;
  private targets: string[];
  private state: State;

  constructor(id: string, title: string, seats: Seat[], options: GameOptions, mode: CricketMode) {
    super(id, title, seats, options);
    this.mode = mode;
    this.targets = targetsFor(mode);
    this.state = {
      players: seats.map(() => ({ marks: {}, points: 0, darts: 0 })),
      turn: 0,
      visit: [],
      over: false,
      winner: null,
      message: `${seats[0]?.name ?? "Player"} to throw`,
    };
  }

  view(): View {
    const s = this.state;
    return {
      title: this.title,
      cards: this.seats.map((seat, i) => {
        const p = s.players[i]!;
        const closed = this.targets.filter((t) => (p.marks[t] ?? 0) >= 3).length;
        const points = this.mode === "none" || this.mode === "mickey" ? "" : ` · ${p.points} pts`;
        return {
          id: seat.id,
          name: seat.name,
          color: seat.color,
          primary: `${closed}/${this.targets.length}`,
          secondary: `Closed${points}`,
          active: i === s.turn && !s.over,
        };
      }),
      visit: s.visit.map(labelOf),
      message: s.message,
      say: this.say,
      over: s.over,
      winner: s.winner === null ? undefined : this.seats[s.winner]?.name,
    };
  }

  dart(hit: DartHit): VisitEvent | null {
    if (this.state.over) return null;
    this.backup();
    this.state.visit.push(hit);
    const key = targetOf(hit, this.targets);
    if (key) this.score(this.state.turn, key, markValue(hit));
    if (this.checkWin(this.state.turn)) return this.closeVisit(false);
    if (this.state.visit.length === 3) return this.closeVisit(false);
    this.state.message = `${this.seats[this.state.turn]!.name} is throwing`;
    this.say = "";
    return null;
  }

  finishVisit(): VisitEvent | null {
    if (this.state.over || this.state.visit.length === 0) return null;
    this.backup();
    return this.closeVisit(false);
  }

  result(completed: boolean): MatchResult {
    return {
      gameId: this.gameId,
      title: this.title,
      solo: this.options.solo,
      completed,
      winnerName: this.state.winner === null ? undefined : this.seats[this.state.winner]?.name,
      players: this.seats.map((seat, i) => {
        const p = this.state.players[i]!;
        return {
          name: seat.name,
          primary: String(p.points),
          darts: p.darts,
          scored: p.points,
          bestVisit: 0,
          won: i === this.state.winner,
          average: 0,
        };
      }),
    };
  }

  protected saveState(): unknown {
    return this.state;
  }

  protected loadState(raw: unknown): void {
    this.state = raw as State;
  }

  private score(index: number, key: string, marks: number): void {
    if (marks <= 0) return;
    const player = this.state.players[index]!;
    const have = player.marks[key] ?? 0;
    const closing = Math.min(marks, Math.max(0, 3 - have));
    const extra = marks - closing;
    player.marks[key] = have + closing;
    if (extra <= 0 || this.mode === "none" || this.mode === "mickey") return;
    const points = extra * pointPerMark(key);
    const open = this.state.players.filter((p, i) => i !== index && (p.marks[key] ?? 0) < 3);
    if (this.mode === "cut") {
      for (const opponent of open) opponent.points += points;
    } else if (open.length > 0) {
      player.points += points;
    }
  }

  private closed(index: number): boolean {
    const p = this.state.players[index]!;
    return this.targets.every((t) => (p.marks[t] ?? 0) >= 3);
  }

  private checkWin(index: number): boolean {
    if (!this.closed(index)) return false;
    const mine = this.state.players[index]!.points;
    if (this.mode === "none" || this.mode === "mickey") return true;
    if (this.mode === "cut") {
      return this.state.players.every((p, i) => i === index || mine <= p.points);
    }
    return this.state.players.every((p, i) => i === index || mine >= p.points);
  }

  private closeVisit(won: boolean): VisitEvent {
    const s = this.state;
    const seat = this.seats[s.turn]!;
    const labels = s.visit.map(labelOf);
    const total = s.visit.reduce((sum, hit) => sum + pointsOf(hit), 0);
    s.players[s.turn]!.darts += s.visit.length;
    const winner = won || this.checkWin(s.turn);
    if (winner) {
      s.over = true;
      s.winner = s.turn;
      s.message = `${seat.name} wins.`;
      this.spoken(s.message);
    } else {
      s.message = `${seat.name} scored.`;
      this.spoken(`${seat.name}. ${labels.join(", ") || "No score"}.`);
      s.turn = (s.turn + 1) % this.seats.length;
    }
    s.visit = [];
    this.commits += 1;
    return {
      playerId: seat.id,
      playerName: seat.name,
      labels,
      total,
      bust: false,
      checkout: false,
      wonLeg: winner,
    };
  }
}
