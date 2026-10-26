import { Engine, type GameOptions, type MatchResult, type View, type VisitEvent } from "./engine";
import { CLOCKWISE, isDouble, labelOf, type DartHit, type Seat } from "./hit";

export type SeqMode = "atc" | "doubles" | "lives" | "accumulator" | "ladder" | "dragon" | "hare";

interface State {
  pos: number[];
  lives: number[];
  steps: number[];
  out: boolean[];
  turn: number;
  visit: DartHit[];
  moved: boolean;
  over: boolean;
  winner: number | null;
  message: string;
  darts: number[];
}

function nextClock(n: number): number {
  const i = CLOCKWISE.indexOf(n);
  return CLOCKWISE[(i + 1) % CLOCKWISE.length] ?? 20;
}

export class SequenceEngine extends Engine {
  private mode: SeqMode;
  private state: State;

  constructor(id: string, title: string, seats: Seat[], options: GameOptions, mode: SeqMode) {
    super(id, title, seats, options);
    this.mode = mode;
    const hare = mode === "hare";
    this.state = {
      pos: seats.map((_, i) => (hare ? (i === 0 ? 20 : 5) : mode === "dragon" ? 10 : 1)),
      lives: seats.map(() => 3),
      steps: seats.map(() => 0),
      out: seats.map(() => false),
      turn: 0,
      visit: [],
      moved: false,
      over: false,
      winner: null,
      message: hare
        ? `${seats[0]?.name ?? "Hare"} is the hare, starting on 20`
        : `${seats[0]?.name ?? "Player"} to throw`,
      darts: seats.map(() => 0),
    };
  }

  view(): View {
    const s = this.state;
    return {
      title: this.title,
      cards: this.seats.map((seat, i) => ({
        id: seat.id,
        name: seat.name,
        color: seat.color,
        primary: this.primary(i),
        secondary: this.secondary(i),
        active: i === s.turn && !s.over,
        dim: s.out[i],
      })),
      visit: s.visit.map(labelOf),
      message: s.message,
      say: this.say,
      over: s.over,
      winner: s.winner === null ? undefined : this.seats[s.winner]?.name,
    };
  }

  dart(hit: DartHit): VisitEvent | null {
    if (this.state.over || this.state.out[this.state.turn]) return null;
    this.backup();
    this.state.visit.push(hit);
    if (this.hits(this.state.turn, hit)) {
      this.state.moved = true;
      this.advanceToken(this.state.turn);
      if (this.state.over) return this.close(true);
    }
    if (this.state.visit.length === 3) return this.close(false);
    this.say = "";
    return null;
  }

  finishVisit(): VisitEvent | null {
    if (this.state.over || this.state.visit.length === 0) return null;
    this.backup();
    return this.close(false);
  }

  result(completed: boolean): MatchResult {
    return this.pack(completed);
  }

  protected saveState(): unknown {
    return this.state;
  }

  protected loadState(raw: unknown): void {
    this.state = raw as State;
  }

  private primary(i: number): string {
    const s = this.state;
    if (s.out[i]) return "Out";
    if (this.mode === "lives") return `${s.lives[i]} lives`;
    if (this.mode === "hare") return i === 0 ? `Hare ${s.pos[i]}` : `Hound ${s.pos[i]}`;
    if (this.mode === "dragon") return s.pos[i]! > 20 ? "Bull" : `T${s.pos[i]}`;
    return s.pos[i]! > 20 ? "Bull" : String(s.pos[i]);
  }

  private secondary(i: number): string {
    if (this.mode === "lives") return `On ${this.primaryTarget(i)}`;
    if (this.mode === "hare" && i === 0) return `${this.state.steps[i]} steps`;
    return `Darts ${this.state.darts[i]}`;
  }

  private primaryTarget(i: number): string {
    const pos = this.state.pos[i]!;
    if (this.mode === "dragon") return pos > 20 ? "Bull" : `T${pos}`;
    if (this.mode === "hare") return String(nextClock(pos));
    return pos > 20 ? "Bull" : String(pos);
  }

  private hits(i: number, hit: DartHit): boolean {
    if (hit.number === 0) return false;
    const pos = this.state.pos[i]!;
    if (this.mode === "dragon") {
      if (pos > 20) return hit.number === 50;
      return hit.ring === "T" && hit.number === pos;
    }
    if (this.mode === "hare") return hit.number === nextClock(this.state.pos[i]!);
    if (pos > 20) {
      if (this.mode === "doubles") return hit.number === 50;
      return hit.number === 25 || hit.number === 50;
    }
    if (hit.number !== pos) return false;
    if (this.mode === "doubles") return isDouble(hit);
    return true;
  }

  private advanceToken(i: number): void {
    const s = this.state;
    if (this.mode === "hare") {
      s.pos[i] = nextClock(s.pos[i]!);
      s.steps[i] = (s.steps[i] ?? 0) + 1;
      if (i === 0 && s.steps[i] === 20) {
        s.over = true;
        s.winner = 0;
        s.message = `${this.seats[0]!.name} completes the loop.`;
        this.spoken(s.message);
        return;
      }
      if (i !== 0 && s.pos[i] === s.pos[0]) {
        s.over = true;
        s.winner = i;
        s.message = `${this.seats[i]!.name} catches the hare.`;
        this.spoken(s.message);
      }
      return;
    }
    if (this.mode === "dragon") {
      s.pos[i] = s.pos[i]! + 1;
      if (s.pos[i]! > 21) {
        s.over = true;
        s.winner = i;
        s.message = `${this.seats[i]!.name} catches the dragon.`;
        this.spoken(s.message);
      }
      return;
    }
    s.pos[i] = s.pos[i]! + 1;
    if (s.pos[i]! > 21) {
      s.over = true;
      s.winner = i;
      s.message = `${this.seats[i]!.name} finishes.`;
      this.spoken(s.message);
    }
  }

  private close(alreadyOver: boolean): VisitEvent {
    const s = this.state;
    const i = s.turn;
    const seat = this.seats[i]!;
    const labels = s.visit.map(labelOf);
    s.darts[i] = (s.darts[i] ?? 0) + s.visit.length;
    if (!alreadyOver && !s.over && !s.moved) {
      if (this.mode === "lives") {
        s.lives[i] = (s.lives[i] ?? 1) - 1;
        s.message = `${seat.name} loses a life. ${s.lives[i]} left.`;
        this.spoken(s.message);
        if (s.lives[i]! <= 0) s.out[i] = true;
      } else if (this.mode === "accumulator") {
        s.pos[i] = 1;
        s.message = `${seat.name} goes back to 1.`;
        this.spoken(s.message);
      } else if (this.mode === "ladder") {
        s.pos[i] = Math.max(1, (s.pos[i] ?? 1) - 1);
        s.message = `${seat.name} drops to ${s.pos[i]}.`;
        this.spoken(s.message);
      }
    }
    const event: VisitEvent = {
      playerId: seat.id,
      playerName: seat.name,
      labels,
      total: labels.length,
      bust: false,
      checkout: false,
      wonLeg: s.winner === i,
    };
    s.visit = [];
    s.moved = false;
    this.commits += 1;
    if (!s.over) {
      const alive = s.out.map((dead, index) => (!dead ? index : -1)).filter((index) => index >= 0);
      if (this.mode === "lives" && alive.length === 1) {
        s.over = true;
        s.winner = alive[0]!;
        s.message = `${this.seats[s.winner]!.name} is last standing.`;
        this.spoken(s.message);
      } else {
        this.stepTurn();
      }
    }
    return event;
  }

  private stepTurn(): void {
    const n = this.seats.length;
    for (let k = 0; k < n; k += 1) {
      this.state.turn = (this.state.turn + 1) % n;
      if (!this.state.out[this.state.turn]) return;
    }
  }

  private pack(completed: boolean): MatchResult {
    const s = this.state;
    return {
      gameId: this.gameId,
      title: this.title,
      solo: this.options.solo,
      completed,
      winnerName: s.winner === null ? undefined : this.seats[s.winner]?.name,
      players: this.seats.map((seat, i) => ({
        name: seat.name,
        primary: this.primary(i),
        darts: s.darts[i] ?? 0,
        scored: s.steps[i] ?? s.pos[i] ?? 0,
        bestVisit: 0,
        won: i === s.winner,
        average: 0,
      })),
    };
  }
}
