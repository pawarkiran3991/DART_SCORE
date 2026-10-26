import { checkoutLine } from "./checkout";
import { Engine, type GameOptions, type MatchResult, type View, type VisitEvent } from "./engine";
import { isDouble, isTreble, labelOf, pointsOf, type DartHit, type Seat } from "./hit";

export type Finish = "double" | "master" | "open";

interface PState {
  remaining: number;
  opened: boolean;
  darts: number;
  scored: number;
  best: number;
  legs: number;
}

interface State {
  players: PState[];
  turn: number;
  starter: number;
  visit: DartHit[];
  anchorRemaining: number;
  anchorOpened: boolean;
  over: boolean;
  winner: number | null;
  message: string;
}

function finishes(hit: DartHit, finish: Finish): boolean {
  if (hit.number === 0) return false;
  if (finish === "open") return pointsOf(hit) > 0;
  if (finish === "master") return isDouble(hit) || isTreble(hit);
  return isDouble(hit);
}

export class X01Engine extends Engine {
  private start: number;
  private finish: Finish;
  private doubleIn: boolean;
  private state: State;

  constructor(
    id: string,
    title: string,
    seats: Seat[],
    options: GameOptions,
    start: number,
    finish: Finish,
    doubleIn: boolean,
  ) {
    super(id, title, seats, options);
    this.start = start;
    this.finish = finish;
    this.doubleIn = doubleIn;
    this.state = {
      players: seats.map(() => ({
        remaining: start,
        opened: !doubleIn,
        darts: 0,
        scored: 0,
        best: 0,
        legs: 0,
      })),
      turn: 0,
      starter: 0,
      visit: [],
      anchorRemaining: start,
      anchorOpened: !doubleIn,
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
        const avg = p.darts ? ((p.scored / p.darts) * 3).toFixed(1) : "0.0";
        return {
          id: seat.id,
          name: seat.name,
          color: seat.color,
          primary: String(p.remaining),
          secondary: `Avg ${avg} · Legs ${p.legs}`,
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
    if (this.state.visit.length === 0) {
      const p = this.state.players[this.state.turn]!;
      this.state.anchorRemaining = p.remaining;
      this.state.anchorOpened = p.opened;
    }
    this.state.visit.push(hit);
    return this.apply(false);
  }

  finishVisit(): VisitEvent | null {
    if (this.state.over || this.state.visit.length === 0) return null;
    this.backup();
    return this.commit(false, false);
  }

  result(completed: boolean): MatchResult {
    const s = this.state;
    return {
      gameId: this.gameId,
      title: this.title,
      solo: this.options.solo,
      completed,
      winnerName: s.winner === null ? undefined : this.seats[s.winner]?.name,
      players: this.seats.map((seat, i) => {
        const p = s.players[i]!;
        return {
          name: seat.name,
          primary: String(p.remaining),
          darts: p.darts,
          scored: p.scored,
          bestVisit: p.best,
          won: i === s.winner,
          average: p.darts ? (p.scored / p.darts) * 3 : 0,
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

  private apply(forceEnd: boolean): VisitEvent | null {
    const s = this.state;
    const p = s.players[s.turn]!;
    const hit = s.visit[s.visit.length - 1]!;
    let scored = 0;
    if (this.doubleIn && !p.opened) {
      if (isDouble(hit)) {
        p.opened = true;
        scored = pointsOf(hit);
      }
    } else {
      scored = pointsOf(hit);
    }
    const next = p.remaining - scored;
    const won = next === 0 && finishes(hit, this.finish);
    const bust = next < 0 || (next === 0 && !won) || (next === 1 && this.finish !== "open");
    if (bust) {
      p.remaining = s.anchorRemaining;
      p.opened = s.anchorOpened;
      const labels = s.visit.map(labelOf);
      s.visit = [];
      s.message = `Bust. No score. Still ${p.remaining}.`;
      this.spoken(s.message);
      p.darts += labels.length;
      this.commits += 1;
      const event: VisitEvent = {
        playerId: this.seats[s.turn]!.id,
        playerName: this.seats[s.turn]!.name,
        labels,
        total: 0,
        bust: true,
        checkout: false,
        wonLeg: false,
      };
      this.advance();
      return event;
    }
    p.remaining = next;
    if (won) {
      return this.commit(true, true);
    }
    if (p.remaining <= 170 && p.remaining > 0) {
      const line = checkoutLine(p.remaining);
      s.message = line || `${p.remaining} remaining`;
      this.spoken(s.message);
    } else {
      s.message = `${pointsOf(hit)} . ${p.remaining} remaining`;
      this.say = "";
    }
    if (forceEnd || s.visit.length === 3) return this.commit(false, false);
    return null;
  }

  private commit(checkout: boolean, wonLeg: boolean): VisitEvent {
    const s = this.state;
    const p = s.players[s.turn]!;
    const labels = s.visit.map(labelOf);
    const visitScore = s.anchorRemaining - p.remaining;
    p.darts += s.visit.length;
    p.scored += visitScore;
    if (!checkout) p.best = Math.max(p.best, visitScore);
    else p.best = Math.max(p.best, visitScore);
    const seat = this.seats[s.turn]!;
    const event: VisitEvent = {
      playerId: seat.id,
      playerName: seat.name,
      labels,
      total: visitScore,
      bust: false,
      checkout,
      wonLeg,
    };
    this.commits += 1;
    s.visit = [];
    if (wonLeg) {
      p.legs += 1;
      if (p.legs >= this.options.legsToWin) {
        s.over = true;
        s.winner = s.turn;
        s.message = `Game shot. ${seat.name} wins.`;
        this.spoken(s.message);
        return event;
      }
      s.message = `${seat.name} takes the leg.`;
      this.spoken(s.message);
      this.nextLeg();
      return event;
    }
    const line = p.remaining <= 170 ? checkoutLine(p.remaining) : "";
    const spoken = `Score ${visitScore}. Remaining ${p.remaining}.`;
    s.message = line ? `${spoken} ${line}` : spoken;
    this.spoken(s.message);
    this.advance();
    return event;
  }

  private advance(): void {
    const n = this.seats.length;
    this.state.turn = (this.state.turn + 1) % n;
  }

  private nextLeg(): void {
    const n = this.seats.length;
    this.state.starter = (this.state.starter + 1) % n;
    this.state.turn = this.state.starter;
    for (const p of this.state.players) {
      p.remaining = this.start;
      p.opened = !this.doubleIn;
    }
  }
}
