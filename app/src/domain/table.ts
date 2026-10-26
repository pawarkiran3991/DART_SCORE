import { Engine, type GameOptions, type MatchResult, type View, type VisitEvent } from "./engine";
import { isDouble, isTreble, labelOf, neighbours, pointsOf, type DartHit, type Seat } from "./hit";

interface State {
  totals: number[];
  visits: number[];
  lives: number[];
  misses: number[];
  out: boolean[];
  darts: number[];
  best: number[];
  turn: number;
  visit: DartHit[];
  anchor: number[];
  round: number;
  over: boolean;
  winner: number | null;
  message: string;
  claimed: number[];
  killer: boolean[];
  phase: string;
  due: number[] | null;
  thrown: boolean[];
  roundScore: number[];
  target: DartHit | null;
  leader: number;
  lights: boolean[];
  pos: number[];
  cursor: number[];
}

const HALVE = ["20", "19", "18", "17", "16", "15", "D", "T", "B"];
const BERMUDA = ["12", "13", "14", "D", "15", "16", "17", "T", "18", "19", "20", "25", "50"];
const LAST = ["20", "19", "18", "17", "16", "15", "D", "B"];
const PRISON = [1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20];

type Task = { kind: "sh"; n: number } | { kind: "d"; n: number } | { kind: "b" };

function jdcTasks(): Task[] {
  const tasks: Task[] = [];
  for (let n = 10; n <= 15; n += 1) for (let i = 0; i < 3; i += 1) tasks.push({ kind: "sh", n });
  for (let n = 1; n <= 20; n += 1) tasks.push({ kind: "d", n });
  tasks.push({ kind: "b" });
  for (let n = 15; n <= 20; n += 1) for (let i = 0; i < 3; i += 1) tasks.push({ kind: "sh", n });
  return tasks;
}

const JDC = jdcTasks();

function blank(seats: Seat[], totals = 0): State {
  const n = seats.length;
  return {
    totals: Array.from({ length: n }, () => totals),
    visits: Array.from({ length: n }, () => 0),
    lives: Array.from({ length: n }, () => 3),
    misses: Array.from({ length: n }, () => 0),
    out: Array.from({ length: n }, () => false),
    darts: Array.from({ length: n }, () => 0),
    best: Array.from({ length: n }, () => 0),
    turn: 0,
    visit: [],
    anchor: Array.from({ length: n }, () => totals),
    round: 0,
    over: false,
    winner: null,
    message: `${seats[0]?.name ?? "Player"} to throw`,
    claimed: Array.from({ length: n }, () => 0),
    killer: Array.from({ length: n }, () => false),
    phase: "play",
    due: null,
    thrown: Array.from({ length: n }, () => false),
    roundScore: Array.from({ length: n }, () => 0),
    target: null,
    leader: 0,
    lights: Array.from({ length: 21 }, (_, i) => i > 0),
    pos: Array.from({ length: n }, () => 0),
    cursor: Array.from({ length: n }, () => 0),
  };
}

function visitSum(visit: DartHit[]): number {
  return visit.reduce((sum, hit) => sum + pointsOf(hit), 0);
}

function sameBed(a: DartHit, b: DartHit): boolean {
  if (a.number !== b.number) return false;
  if (a.number === 0) return false;
  if (a.number >= 25) return true;
  return a.ring === b.ring;
}

export class TableEngine extends Engine {
  readonly kind: string;
  private state: State;

  constructor(id: string, title: string, seats: Seat[], options: GameOptions, kind: string) {
    super(id, title, seats, options);
    this.kind = kind;
    const start = kind === "elim" ? 301 : kind === "bobs" ? 27 : kind === "c121" ? 121 : 0;
    this.state = blank(seats, start);
    if (kind === "killer") this.state.phase = "claim";
    if (kind === "leader") this.state.phase = "set";
    if (kind === "elim") this.state.anchor = this.state.totals.slice();
    this.state.message = this.opening();
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
    if (this.state.over) return null;
    this.backup();
    if (this.state.visit.length === 0) this.state.anchor = this.state.totals.slice();
    this.state.visit.push(hit);
    return this.afterDart(hit);
  }

  finishVisit(): VisitEvent | null {
    if (this.state.over || this.state.visit.length === 0) return null;
    this.backup();
    if (this.kind === "c121") return this.failCheckout("Not checked out. Back to 121.");
    if (this.kind === "g420" || this.kind === "gotcha" || this.kind === "elim" || this.kind === "blackout") {
      return this.closePartial(true);
    }
    if (this.kind === "jdc") return this.closePartial(false);
    return this.endVisit();
  }

  private closePartial(countDarts: boolean): VisitEvent {
    const s = this.state;
    const i = s.turn;
    const labels = s.visit.map(labelOf);
    const total = visitSum(s.visit);
    const seat = this.seats[i]!;
    if (countDarts) s.darts[i] = (s.darts[i] ?? 0) + labels.length;
    s.visit = [];
    this.commits += 1;
    if (!s.over) this.hop();
    return {
      playerId: seat.id,
      playerName: seat.name,
      labels,
      total,
      bust: false,
      checkout: false,
      wonLeg: false,
    };
  }

  result(completed: boolean): MatchResult {
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
        scored: s.totals[i] ?? 0,
        bestVisit: s.best[i] ?? 0,
        won: this.kind === "scram" ? s.winner !== null && i % 2 === s.winner : i === s.winner,
        average: (s.visits[i] ?? 0) > 0 ? (s.totals[i] ?? 0) / (s.visits[i] ?? 1) : 0,
      })),
    };
  }

  protected saveState(): unknown {
    return this.state;
  }

  protected loadState(raw: unknown): void {
    this.state = raw as State;
  }

  private opening(): string {
    if (this.kind === "killer") return "Throw one dart to claim your number";
    if (this.kind === "leader") return "Leader, set a bed with one dart";
    if (this.kind === "jdc") return this.jdcText(0);
    return `${this.seats[0]?.name ?? "Player"} to throw`;
  }

  private primary(i: number): string {
    const s = this.state;
    if (s.out[i] && this.kind !== "bobs") return "Out";
    if (this.kind === "scram") return String(s.totals[i % 2] ?? 0);
    if (this.kind === "average") {
      const visits = s.visits[i] ?? 0;
      const avg = visits ? (s.totals[i] ?? 0) / visits : 0;
      return avg.toFixed(1);
    }
    if (this.kind === "killer" && s.phase === "claim") return s.claimed[i] ? String(s.claimed[i]) : "—";
    if (this.kind === "killer") return `${s.lives[i]} lives`;
    if (this.kind === "knockout" || this.kind === "last" || this.kind === "leader") return `${s.lives[i]}`;
    if (this.kind === "beat") return `${3 - (s.misses[i] ?? 0)} left`;
    if (this.kind === "twentyone" || this.kind === "bowls") return `${s.totals[i]} pts`;
    if (this.kind === "jdc") return `${s.cursor[i]}/57`;
    if (this.kind === "bed") return `${s.visits[i]} visits`;
    if (this.kind === "c121") return String(s.totals[i]);
    if (this.kind === "prisoner") return `${s.pos[i]}/20`;
    if (this.kind === "golf") return `${s.totals[i]}`;
    return String(s.totals[i] ?? 0);
  }

  private secondary(i: number): string {
    const s = this.state;
    if (this.kind === "average") return `Total ${s.totals[i]}`;
    if (this.kind === "high" || this.kind === "race") return `Best ${s.best[i]}`;
    if (this.kind === "killer" && s.killer[i]) return `Killer ${s.claimed[i]}`;
    if (this.kind === "killer") return s.claimed[i] ? `No. ${s.claimed[i]}` : "Claim";
    if (this.kind === "golf") return `Hole ${Math.min(9, s.round + 1)}`;
    if (this.kind === "baseball") return `Inning ${Math.min(9, s.round + 1)}`;
    if (this.kind === "jdc") return `Score ${s.totals[i]}`;
    return `Darts ${s.darts[i]}`;
  }

  private afterDart(hit: DartHit): VisitEvent | null {
    const kind = this.kind;
    if (kind === "g420" || kind === "gotcha" || kind === "elim" || kind === "c121") return this.liveDart(hit);
    if (kind === "killer" && this.state.phase === "claim") return this.claim(hit);
    if (kind === "killer") return this.killerDart(hit);
    if (kind === "leader" && this.state.phase === "set") return this.setLeader(hit);
    if (kind === "blackout") return this.blackoutDart(hit);
    if (kind === "jdc") return this.jdcDart(hit);
    if (this.state.visit.length === 3) return this.endVisit();
    this.say = "";
    this.state.message = `${this.seats[this.state.turn]!.name} is throwing`;
    return null;
  }

  private endVisit(): VisitEvent | null {
    const kind = this.kind;
    if (["high", "average", "race", "halve", "bermuda", "shanghai", "fives", "knockout", "beat", "last", "leader", "twentyone", "century", "golf", "baseball", "bowls", "bobs", "bed", "prisoner", "scram"].includes(kind)) {
      return this.commitRound();
    }
    return this.commitRound();
  }

  private commitRound(): VisitEvent {
    const s = this.state;
    const i = s.turn;
    const sum = visitSum(s.visit);
    const labels = s.visit.map(labelOf);
    s.darts[i] = (s.darts[i] ?? 0) + s.visit.length;
    s.best[i] = Math.max(s.best[i] ?? 0, sum);
    let bust = false;
    if (this.kind === "fives") bust = this.applyFives(i, sum);
    else if (this.kind === "halve" || this.kind === "bermuda") this.applyHalve(i, sum);
    else if (this.kind === "shanghai") this.applyShanghai(i, sum);
    else if (this.kind === "high" || this.kind === "average" || this.kind === "race") this.applyCount(i, sum);
    else if (this.kind === "knockout") this.applyKnock(i, sum);
    else if (this.kind === "beat") this.applyBeat(i, sum);
    else if (this.kind === "last") this.applyLast(i);
    else if (this.kind === "leader") this.applyChase(i);
    else if (this.kind === "twentyone") this.apply21(i, sum);
    else if (this.kind === "century") this.applyCentury(i, sum);
    else if (this.kind === "golf") this.applyGolf(i);
    else if (this.kind === "baseball") this.applyBaseball(i);
    else if (this.kind === "bowls") this.applyBowls(i, sum);
    else if (this.kind === "bobs") this.applyBobs(i);
    else if (this.kind === "bed") this.applyBed(i);
    else if (this.kind === "prisoner") this.applyPrison(i);
    else if (this.kind === "scram") this.applyScram(i);
    const seat = this.seats[i]!;
    const event: VisitEvent = {
      playerId: seat.id,
      playerName: seat.name,
      labels,
      total: bust ? 0 : sum,
      bust,
      checkout: false,
      wonLeg: s.winner === i,
    };
    s.visit = [];
    this.commits += 1;
    if (!s.over && this.kind !== "leader") this.hop();
    return event;
  }

  private applyCount(i: number, sum: number): void {
    const s = this.state;
    s.totals[i] = (s.totals[i] ?? 0) + sum;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    const need = this.kind === "high" ? 8 : this.kind === "average" ? 10 : 0;
    const name = this.seats[i]!.name;
    if (this.kind === "average") {
      const avg = (s.totals[i] ?? 0) / (s.visits[i] || 1);
      s.message = `Score ${sum}. Average ${avg.toFixed(1)}.`;
    } else {
      s.message = `Score ${sum}. Total ${s.totals[i]}.`;
    }
    this.spoken(s.message);
    if (need > 0 && s.visits.every((v) => v >= need)) this.finishHighest(name);
    if (this.kind === "race") {
      const target = this.options.raceTarget;
      if (s.totals.some((t) => t >= target)) {
        const maxVisits = Math.max(...s.visits);
        if (s.visits.every((v) => v === maxVisits)) this.finishHighest(name);
        else s.message = `Target reached. Finish the round.`;
      }
    }
  }

  private finishHighest(_name: string): void {
    const s = this.state;
    let best = -1;
    let winner = 0;
    let tie = false;
    s.totals.forEach((total, index) => {
      if (total > best) {
        best = total;
        winner = index;
        tie = false;
      } else if (total === best) tie = true;
    });
    s.over = true;
    s.winner = tie ? null : winner;
    s.message = tie ? "Tied on total." : `${this.seats[winner]!.name} wins with ${best}.`;
    this.spoken(s.message);
  }

  private liveDart(hit: DartHit): VisitEvent | null {
    const s = this.state;
    const i = s.turn;
    const add = pointsOf(hit);
    if (this.kind === "c121") return this.checkoutDart(hit);
    const next = (s.totals[i] ?? 0) + (this.kind === "elim" ? -add : add);
    if (this.kind === "g420" && next > 420) return this.bustVisit("Over 420. Visit cancelled.");
    if (this.kind === "gotcha" && next > 301) return this.bustVisit("Over 301. No score.");
    if (this.kind === "elim" && next < 0) return this.bustVisit("Bust. No score.");
    s.totals[i] = next;
    if (this.kind === "g420" && [100, 200, 300, 400].includes(next)) {
      s.totals[i] = next - 100;
      s.message = `${next} drops back to ${s.totals[i]}.`;
      this.spoken(s.message);
    }
    if (this.kind === "gotcha") {
      s.totals.forEach((total, index) => {
        if (index !== i && total === s.totals[i]) s.totals[index] = 0;
      });
      if (s.totals[i] === 301) return this.winNow("Gotcha. ");
    }
    if (this.kind === "elim") {
      s.totals.forEach((total, index) => {
        if (index !== i && total === s.totals[i] && !s.out[index]) s.totals[index] = 301;
      });
      if (s.totals[i] === 0) return this.winNow("");
    }
    if (this.kind === "g420" && s.totals[i] === 420) return this.winNow("");
    if (s.visit.length === 3) {
      const labels = s.visit.map(labelOf);
      const total = visitSum(s.visit);
      const seat = this.seats[i]!;
      s.darts[i] = (s.darts[i] ?? 0) + s.visit.length;
      s.visits[i] = (s.visits[i] ?? 0) + 1;
      s.visit = [];
      this.commits += 1;
      this.hop();
      return {
        playerId: seat.id,
        playerName: seat.name,
        labels,
        total,
        bust: false,
        checkout: false,
        wonLeg: false,
      };
    }
    this.say = "";
    return null;
  }

  private bustVisit(text: string): VisitEvent {
    const s = this.state;
    const i = s.turn;
    const labels = s.visit.map(labelOf);
    const seat = this.seats[i]!;
    s.totals[i] = s.anchor[i] ?? s.totals[i] ?? 0;
    s.darts[i] = (s.darts[i] ?? 0) + labels.length;
    s.visit = [];
    s.message = text;
    this.spoken(text);
    this.commits += 1;
    this.hop();
    return { playerId: seat.id, playerName: seat.name, labels, total: 0, bust: true, checkout: false, wonLeg: false };
  }

  private winNow(prefix: string): VisitEvent {
    const s = this.state;
    const i = s.turn;
    const seat = this.seats[i]!;
    const labels = s.visit.map(labelOf);
    const total = visitSum(s.visit);
    s.over = true;
    s.winner = i;
    s.darts[i] = (s.darts[i] ?? 0) + s.visit.length;
    s.message = `${prefix}${seat.name} wins.`;
    this.spoken(s.message);
    s.visit = [];
    this.commits += 1;
    return { playerId: seat.id, playerName: seat.name, labels, total, bust: false, checkout: true, wonLeg: true };
  }

  private checkoutDart(hit: DartHit): VisitEvent | null {
    const s = this.state;
    const i = s.turn;
    const target = s.totals[i] ?? 121;
    const spent = s.visit.slice(0, -1).reduce((sum, dart) => sum + pointsOf(dart), 0);
    const left = target - spent - pointsOf(hit);
    const good = left === 0 && isDouble(hit);
    if (left < 0 || left === 1 || (left === 0 && !good)) {
      s.totals[i] = 121;
      return this.failCheckout("Missed the checkout. Back to 121.");
    }
    if (good) {
      const next = target + 1;
      s.totals[i] = next;
      const labels = s.visit.map(labelOf);
      const seat = this.seats[i]!;
      s.darts[i] = (s.darts[i] ?? 0) + s.visit.length;
      s.visit = [];
      this.commits += 1;
      if (next > 170) {
        s.over = true;
        s.winner = i;
        s.message = `${seat.name} clears 170.`;
        this.spoken(s.message);
      } else {
        s.message = `Checkout. Next target ${next}.`;
        this.spoken(s.message);
        this.hop();
      }
      return { playerId: seat.id, playerName: seat.name, labels, total: target, bust: false, checkout: true, wonLeg: next > 170 };
    }
    if (s.visit.length === 3) {
      s.totals[i] = 121;
      return this.failCheckout("Not checked out. Back to 121.");
    }
    s.message = `${left} left on ${target}.`;
    this.say = "";
    return null;
  }

  private failCheckout(text: string): VisitEvent {
    const s = this.state;
    const i = s.turn;
    const seat = this.seats[i]!;
    const labels = s.visit.map(labelOf);
    s.darts[i] = (s.darts[i] ?? 0) + labels.length;
    s.visit = [];
    s.message = text;
    this.spoken(text);
    this.commits += 1;
    this.hop();
    return { playerId: seat.id, playerName: seat.name, labels, total: 0, bust: true, checkout: false, wonLeg: false };
  }

  private claim(hit: DartHit): VisitEvent {
    const s = this.state;
    const i = s.turn;
    const taken = s.claimed.includes(hit.number);
    if (hit.number >= 1 && hit.number <= 20 && !taken) s.claimed[i] = hit.number;
    const seat = this.seats[i]!;
    const labels = [labelOf(hit)];
    s.darts[i] = (s.darts[i] ?? 0) + 1;
    s.visit = [];
    this.commits += 1;
    if (s.claimed.every((n) => n > 0)) {
      s.phase = "play";
      s.message = "Hit your double to become a killer";
    }
    this.hop();
    this.spoken(s.claimed[i] ? `${seat.name} has ${s.claimed[i]}.` : "Throw again for a free number.");
    return { playerId: seat.id, playerName: seat.name, labels, total: 0, bust: false, checkout: false, wonLeg: false };
  }

  private killerDart(hit: DartHit): VisitEvent | null {
    const s = this.state;
    const i = s.turn;
    if (isDouble(hit) && hit.number === s.claimed[i]) {
      if (!s.killer[i]) s.killer[i] = true;
      else {
        s.lives[i] = (s.lives[i] ?? 1) - 1;
        if ((s.lives[i] ?? 0) <= 0) s.out[i] = true;
      }
    } else if (s.killer[i] && isDouble(hit)) {
      const foe = s.claimed.findIndex((n, index) => n === hit.number && index !== i);
      if (foe >= 0 && !s.out[foe]) {
        s.lives[foe] = (s.lives[foe] ?? 1) - 1;
        if ((s.lives[foe] ?? 0) <= 0) s.out[foe] = true;
      }
    }
    if (this.seats.length === 1 && s.killer[i]) return this.winNow("Killer. ");
    const alive = s.out.filter((dead) => !dead).length;
    if (alive <= 1) {
      const winner = s.out.findIndex((dead) => !dead);
      s.winner = winner;
      s.over = true;
      s.message = `${this.seats[winner]!.name} is last standing.`;
      this.spoken(s.message);
    }
    if (s.visit.length === 3 || s.over) {
      const labels = s.visit.map(labelOf);
      const seat = this.seats[i]!;
      s.darts[i] = (s.darts[i] ?? 0) + s.visit.length;
      s.visit = [];
      this.commits += 1;
      if (!s.over) this.hop();
      return { playerId: seat.id, playerName: seat.name, labels, total: 0, bust: false, checkout: false, wonLeg: s.winner === i };
    }
    this.say = "";
    return null;
  }

  private setLeader(hit: DartHit): VisitEvent | null {
    if (hit.number === 0) {
      this.state.message = "Miss. Set a bed.";
      this.say = "";
      return null;
    }
    const s = this.state;
    const i = s.turn;
    s.target = hit;
    s.leader = i;
    s.phase = "chase";
    s.visit = [];
    s.message = `Match ${labelOf(hit)}`;
    this.spoken(s.message);
    this.hop();
    if (s.turn === i) this.hop();
    return null;
  }

  private applyChase(i: number): void {
    const s = this.state;
    const target = s.target;
    const hitIt = target ? s.visit.some((hit) => sameBed(hit, target)) : false;
    if (!hitIt) {
      s.lives[i] = (s.lives[i] ?? 1) - 1;
      s.message = `${this.seats[i]!.name} misses. ${s.lives[i]} lives.`;
      if ((s.lives[i] ?? 0) <= 0) s.out[i] = true;
      this.spoken(s.message);
    } else {
      s.message = `${this.seats[i]!.name} matches.`;
      this.spoken(s.message);
    }
    const alive = s.out.map((dead, index) => (dead ? -1 : index)).filter((index) => index >= 0);
    if (alive.length <= 1) {
      s.over = true;
      s.winner = alive[0] ?? i;
      s.message = `${this.seats[s.winner]!.name} wins.`;
      this.spoken(s.message);
      return;
    }
    this.hop();
    if (s.turn === s.leader || s.out[s.leader]) {
      s.phase = "set";
      s.turn = this.nextAlive(s.leader);
      s.leader = s.turn;
      s.target = null;
      s.message = `${this.seats[s.turn]!.name} sets the next bed.`;
    }
  }

  private applyFives(i: number, sum: number): boolean {
    const s = this.state;
    if (sum % 5 !== 0) {
      s.message = `${sum} does not divide by 5.`;
      this.spoken(s.message);
      return false;
    }
    const gain = sum / 5;
    if ((s.totals[i] ?? 0) + gain > 51) {
      s.message = "That would pass 51. No score.";
      this.spoken(s.message);
      return true;
    }
    s.totals[i] = (s.totals[i] ?? 0) + gain;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    if (s.totals[i] === 51) {
      s.over = true;
      s.winner = i;
      s.message = `${this.seats[i]!.name} reaches 51.`;
      this.spoken(s.message);
    } else {
      s.message = `Score ${gain}. Total ${s.totals[i]}.`;
      this.spoken(s.message);
    }
    return false;
  }

  private matches(list: string[], hit: DartHit): boolean {
    const token = list[this.state.round % list.length] ?? "20";
    if (token === "D") return isDouble(hit);
    if (token === "T") return isTreble(hit);
    if (token === "B") return hit.number === 25 || hit.number === 50;
    if (token === "25") return hit.number === 25;
    if (token === "50") return hit.number === 50;
    return hit.number === Number(token);
  }

  private applyHalve(i: number, _sum: number): void {
    const list = this.kind === "bermuda" ? BERMUDA : HALVE;
    const gained = this.state.visit.reduce((sum, hit) => sum + (this.matches(list, hit) ? pointsOf(hit) : 0), 0);
    const s = this.state;
    if (gained === 0) s.totals[i] = Math.floor((s.totals[i] ?? 0) / 2);
    else s.totals[i] = (s.totals[i] ?? 0) + gained;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    s.message = gained === 0 ? `Miss. Half is ${s.totals[i]}.` : `Score ${gained}. Total ${s.totals[i]}.`;
    this.spoken(s.message);
    if (this.everyoneThrew()) {
      s.round += 1;
      s.thrown = s.thrown.map(() => false);
      if (s.round >= list.length) this.finishHighest("");
    }
  }

  private applyShanghai(i: number, _sum: number): void {
    const n = (this.state.round % 7) + 1;
    const gained = this.state.visit.reduce((sum, hit) => sum + (hit.number === n ? pointsOf(hit) : 0), 0);
    const rings = new Set(this.state.visit.filter((hit) => hit.number === n).map((hit) => hit.ring));
    const s = this.state;
    s.totals[i] = (s.totals[i] ?? 0) + gained;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    if (rings.has("S") && rings.has("D") && rings.has("T")) {
      s.over = true;
      s.winner = i;
      s.message = `Shanghai. ${this.seats[i]!.name} wins.`;
      this.spoken(s.message);
      return;
    }
    s.message = `Score ${gained} on ${n}. Total ${s.totals[i]}.`;
    this.spoken(s.message);
    if (this.everyoneThrew()) {
      s.round += 1;
      s.thrown = s.thrown.map(() => false);
      if (s.round >= 7) this.finishHighest("");
    }
  }

  private applyKnock(i: number, sum: number): void {
    const s = this.state;
    s.thrown[i] = true;
    s.roundScore[i] = sum;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    const due = this.duePlayers();
    if (!due.every((index) => s.thrown[index])) {
      s.message = `${sum}. Waiting on the rest of the round.`;
      this.say = "";
      return;
    }
    const low = Math.min(...due.map((index) => s.roundScore[index] ?? 0));
    const tied = due.filter((index) => s.roundScore[index] === low);
    s.thrown = s.thrown.map(() => false);
    if (tied.length > 1) {
      s.due = tied;
      s.message = "Throw-off for the lowest score.";
      this.spoken(s.message);
      return;
    }
    const loser = tied[0] ?? i;
    s.lives[loser] = (s.lives[loser] ?? 1) - 1;
    s.due = null;
    if ((s.lives[loser] ?? 0) <= 0) s.out[loser] = true;
    s.message = `${this.seats[loser]!.name} loses a life.`;
    this.spoken(s.message);
    this.crownLast();
  }

  private applyBeat(i: number, sum: number): void {
    const s = this.state;
    const opening = s.round === 0 && s.visits.every((v) => v === 0);
    if (opening) {
      s.roundScore[0] = sum;
      s.visits[i] = 1;
      s.message = `${sum} to beat.`;
      this.spoken(s.message);
      return;
    }
    const bar = s.roundScore[0] ?? 0;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    if (sum > bar) {
      s.roundScore[0] = sum;
      s.message = `${sum} is the new score to beat.`;
    } else {
      s.misses[i] = (s.misses[i] ?? 0) + 1;
      s.message = `${sum} does not beat ${bar}.`;
      if ((s.misses[i] ?? 0) >= 3) s.out[i] = true;
    }
    this.spoken(s.message);
    this.crownLast();
  }

  private applyLast(i: number): void {
    const token = LAST[this.state.round % LAST.length] ?? "20";
    const hit = this.state.visit.some((dart) => {
      if (token === "D") return isDouble(dart);
      if (token === "B") return dart.number === 25 || dart.number === 50;
      return dart.number === Number(token);
    });
    const s = this.state;
    s.thrown[i] = true;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    if (!hit) {
      s.lives[i] = (s.lives[i] ?? 1) - 1;
      if ((s.lives[i] ?? 0) <= 0) s.out[i] = true;
      s.message = `${this.seats[i]!.name} misses ${token}.`;
      this.spoken(s.message);
    }
    if (this.duePlayers().every((index) => s.thrown[index])) {
      s.round += 1;
      s.thrown = s.thrown.map(() => false);
    }
    this.crownLast();
  }

  private apply21(i: number, sum: number): void {
    const s = this.state;
    s.thrown[i] = true;
    s.roundScore[i] = sum > 21 ? 0 : sum;
    if (!this.duePlayers().every((index) => s.thrown[index])) return;
    const scores = s.roundScore.map((score, index) => (s.thrown[index] || this.duePlayers().includes(index) ? score : -1));
    const best = Math.max(...this.duePlayers().map((index) => (scores[index] ?? 0) > 21 ? -1 : scores[index] ?? 0));
    if (best >= 0) {
      this.duePlayers().forEach((index) => {
        if ((s.roundScore[index] ?? -1) !== best) return;
        s.totals[index] = (s.totals[index] ?? 0) + (best === 21 ? 2 : 1);
      });
    }
    s.thrown = s.thrown.map(() => false);
    s.message = "Round scored.";
    this.spoken(s.message);
    const winner = s.totals.findIndex((points) => points >= 5);
    if (winner >= 0) {
      s.over = true;
      s.winner = winner;
      s.message = `${this.seats[winner]!.name} reaches 5.`;
      this.spoken(s.message);
    }
  }

  private applyCentury(i: number, sum: number): void {
    const s = this.state;
    if ((s.pos[i] ?? 0) >= 9) return;
    s.totals[i] = (s.totals[i] ?? 0) + sum;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    s.pos[i] = (s.pos[i] ?? 0) + s.visit.length;
    if ((s.totals[i] ?? 0) > 100) {
      s.totals[i] = 0;
      s.pos[i] = 9;
    }
    if ((s.pos[i] ?? 0) >= 9) s.thrown[i] = true;
    s.message = `${this.seats[i]!.name} has ${s.totals[i]} after ${s.pos[i]} darts.`;
    this.spoken(s.message);
    if (s.thrown.every(Boolean)) {
      let bestDist = 101;
      let winner = 0;
      s.totals.forEach((total, index) => {
        const dist = total <= 0 ? 101 : 100 - total;
        if (dist < bestDist) {
          bestDist = dist;
          winner = index;
        }
      });
      s.over = true;
      s.winner = bestDist > 100 ? null : winner;
      s.message = s.winner === null ? "Nobody stayed under 100." : `${this.seats[winner]!.name} is closest.`;
      this.spoken(s.message);
    }
  }

  private applyGolf(i: number): void {
    const hole = (this.state.round % 9) + 1;
    let best = 5;
    for (const hit of this.state.visit) {
      if (hit.number !== hole) continue;
      const strokes = hit.ring === "D" ? 1 : hit.ring === "T" ? 2 : 3;
      best = Math.min(best, strokes);
    }
    const s = this.state;
    s.totals[i] = (s.totals[i] ?? 0) + best;
    s.thrown[i] = true;
    s.message = `Hole ${hole}: ${best} stroke${best === 1 ? "" : "s"}.`;
    this.spoken(s.message);
    if (this.duePlayers().every((index) => s.thrown[index])) {
      s.round += 1;
      s.thrown = s.thrown.map(() => false);
      if (s.round >= 9) this.finishLowest();
    }
  }

  private applyBaseball(i: number): void {
    const inning = (this.state.round % 9) + 1;
    const runs = this.state.visit.reduce((sum, hit) => {
      if (hit.number !== inning) return sum;
      if (hit.ring === "T") return sum + 3;
      if (hit.ring === "D") return sum + 2;
      return sum + 1;
    }, 0);
    const s = this.state;
    s.totals[i] = (s.totals[i] ?? 0) + runs;
    s.thrown[i] = true;
    s.message = `Inning ${inning}: ${runs} run${runs === 1 ? "" : "s"}.`;
    this.spoken(s.message);
    if (this.duePlayers().every((index) => s.thrown[index])) {
      s.round += 1;
      s.thrown = s.thrown.map(() => false);
      if (s.round >= 9) this.finishHighest("");
    }
  }

  private applyBowls(i: number, sum: number): void {
    const s = this.state;
    s.roundScore[i] = Math.abs(sum - 50);
    s.thrown[i] = true;
    s.best[i] = s.best[i] === 0 ? s.roundScore[i]! : Math.min(s.best[i]!, s.roundScore[i]!);
    if (!this.duePlayers().every((index) => s.thrown[index])) return;
    if (this.seats.length === 1) {
      s.round += 1;
      s.thrown = s.thrown.map(() => false);
      s.message = `${sum} is ${s.roundScore[i]} from 50.`;
      this.spoken(s.message);
      if (s.round >= 5) {
        s.over = true;
        s.message = "Five ends played.";
        this.spoken(s.message);
      }
      return;
    }
    const best = Math.min(...this.duePlayers().map((index) => s.roundScore[index] ?? 99));
    this.duePlayers().forEach((index) => {
      if (s.roundScore[index] !== best) return;
      s.totals[index] = (s.totals[index] ?? 0) + (best === 0 ? 2 : 1);
    });
    s.thrown = s.thrown.map(() => false);
    s.message = "End scored.";
    this.spoken(s.message);
    const winner = s.totals.findIndex((points) => points >= 5);
    if (winner >= 0) {
      s.over = true;
      s.winner = winner;
      s.message = `${this.seats[winner]!.name} reaches 5.`;
      this.spoken(s.message);
    }
  }

  private applyBobs(i: number): void {
    const s = this.state;
    const round = s.round;
    const value = round >= 20 ? 50 : (round + 1) * 2;
    const hits = s.visit.filter((hit) => (round >= 20 ? hit.number === 50 : isDouble(hit) && hit.number === round + 1));
    if (hits.length === 0) s.totals[i] = (s.totals[i] ?? 0) - value;
    else s.totals[i] = (s.totals[i] ?? 0) + hits.length * value;
    s.thrown[i] = true;
    if ((s.totals[i] ?? 0) <= 0) s.out[i] = true;
    s.message = `${this.seats[i]!.name} is on ${s.totals[i]}.`;
    this.spoken(s.message);
    if (this.duePlayers().every((index) => s.out[index] || s.thrown[index])) {
      s.round += 1;
      s.thrown = s.thrown.map(() => false);
      if (s.round > 20 || s.out.filter((dead) => !dead).length <= 1) this.crownScore();
    }
  }

  private applyBed(i: number): void {
    const rings = new Set(this.state.visit.filter((hit) => hit.number === 20).map((hit) => hit.ring));
    const s = this.state;
    s.visits[i] = (s.visits[i] ?? 0) + 1;
    if (rings.has("S") && rings.has("D") && rings.has("T")) {
      s.over = true;
      s.winner = i;
      s.message = `Three in a bed. ${this.seats[i]!.name} wins.`;
      this.spoken(s.message);
    } else {
      s.message = `Visit ${s.visits[i]}. Need single, double, and treble 20.`;
      this.say = "";
    }
  }

  private applyPrison(i: number): void {
    const s = this.state;
    for (const hit of s.visit) {
      const need = PRISON[s.pos[i] ?? 0];
      if (hit.number === need && hit.number >= 1 && hit.number <= 20) s.pos[i] = (s.pos[i] ?? 0) + 1;
    }
    if ((s.pos[i] ?? 0) >= 20) {
      s.over = true;
      s.winner = i;
      s.message = `${this.seats[i]!.name} gets around.`;
      this.spoken(s.message);
    } else {
      s.message = `Next number ${PRISON[s.pos[i] ?? 0]}.`;
      this.say = "";
    }
  }

  private applyScram(i: number): void {
    const targets = ["20", "19", "18", "17", "16", "15", "B"];
    const s = this.state;
    const scoring = s.round % 2;
    const side = i % 2;
    if (side === scoring) {
      for (const hit of s.visit) {
        const key = hit.number >= 25 ? "B" : String(hit.number);
        if (!targets.includes(key)) continue;
        const slot = key === "B" ? 0 : hit.number;
        if ((s.roundScore[slot] ?? 0) >= 3) continue;
        s.totals[side] = (s.totals[side] ?? 0) + pointsOf(hit);
      }
      s.visits[scoring] = (s.visits[scoring] ?? 0) + 1;
    } else {
      for (const hit of s.visit) {
        const key = hit.number >= 25 ? "B" : String(hit.number);
        if (!targets.includes(key)) continue;
        const marks = hit.number === 50 ? 2 : hit.number === 25 ? 1 : hit.ring === "T" ? 3 : hit.ring === "D" ? 2 : 1;
        const slot = key === "B" ? 0 : hit.number;
        s.roundScore[slot] = Math.min(3, (s.roundScore[slot] ?? 0) + marks);
      }
    }
    s.message = `Scoring side has ${s.totals[scoring] ?? 0}.`;
    this.spoken(s.message);
    const closed = targets.every((key) => (s.roundScore[key === "B" ? 0 : Number(key)] ?? 0) >= 3);
    if (closed || (s.visits[scoring] ?? 0) >= 8) {
      s.round += 1;
      s.roundScore = s.roundScore.map(() => 0);
      if (s.round >= 2) {
        const a = s.totals[0] ?? 0;
        const b = s.totals[1] ?? 0;
        s.over = true;
        s.winner = a === b ? null : a > b ? 0 : 1;
        s.message = s.winner === null ? "Scram is tied." : `${this.seats[s.winner]!.name}'s side wins.`;
        this.spoken(s.message);
      }
    }
  }

  private blackoutDart(hit: DartHit): VisitEvent | null {
    const s = this.state;
    if (hit.number >= 1 && hit.number <= 20 && s.lights[hit.number]) {
      s.lights[hit.number] = false;
      if (hit.ring === "T") {
        const [a, b] = neighbours(hit.number);
        s.lights[a] = false;
        s.lights[b] = false;
      }
    }
    const left = s.lights.filter(Boolean).length;
    if (left === 0) return this.winNow("Blackout. ");
    if (s.visit.length === 3) {
      const labels = s.visit.map(labelOf);
      const seat = this.seats[s.turn]!;
      s.darts[s.turn] = (s.darts[s.turn] ?? 0) + s.visit.length;
      s.message = `${left} numbers still lit.`;
      s.visit = [];
      this.commits += 1;
      this.hop();
      return { playerId: seat.id, playerName: seat.name, labels, total: 0, bust: false, checkout: false, wonLeg: false };
    }
    s.message = `${left} numbers still lit.`;
    this.say = "";
    return null;
  }

  private jdcDart(hit: DartHit): VisitEvent | null {
    const s = this.state;
    const i = s.turn;
    const task = JDC[s.cursor[i] ?? 0];
    let gained = 0;
    if (task?.kind === "sh" && hit.number === task.n) gained = pointsOf(hit);
    if (task?.kind === "d" && isDouble(hit) && hit.number === task.n) gained = pointsOf(hit);
    if (task?.kind === "b" && hit.number === 50) gained = 50;
    s.totals[i] = (s.totals[i] ?? 0) + gained;
    s.cursor[i] = (s.cursor[i] ?? 0) + 1;
    s.darts[i] = (s.darts[i] ?? 0) + 1;
    s.message = (s.cursor[i] ?? 0) >= 57 ? "Test complete." : this.jdcText(s.cursor[i] ?? 0);
    if ((s.cursor[i] ?? 0) >= 57) {
      s.thrown[i] = true;
      if (s.thrown.every(Boolean)) this.finishHighest("");
      else this.hop();
    }
    if (s.visit.length >= 3 && !s.over) {
      const labels = s.visit.map(labelOf);
      const seat = this.seats[i]!;
      s.visit = [];
      this.commits += 1;
      if ((s.cursor[i] ?? 0) < 57) this.hop();
      return { playerId: seat.id, playerName: seat.name, labels, total: gained, bust: false, checkout: false, wonLeg: false };
    }
    this.say = "";
    return null;
  }

  private jdcText(index: number): string {
    const task = JDC[index];
    if (!task) return "Done";
    if (task.kind === "sh") return `Dart ${index + 1} of 57. Number ${task.n}.`;
    if (task.kind === "d") return `Dart ${index + 1} of 57. Double ${task.n}.`;
    return `Dart ${index + 1} of 57. Bull.`;
  }

  private finishLowest(): void {
    const s = this.state;
    let best = Number.POSITIVE_INFINITY;
    let winner = 0;
    s.totals.forEach((total, index) => {
      if (total < best) {
        best = total;
        winner = index;
      }
    });
    s.over = true;
    s.winner = winner;
    s.message = `${this.seats[winner]!.name} wins with ${best}.`;
    this.spoken(s.message);
  }

  private crownLast(): void {
    const alive = this.state.out.map((dead, index) => (dead ? -1 : index)).filter((index) => index >= 0);
    if (alive.length === 1) {
      this.state.over = true;
      this.state.winner = alive[0]!;
      this.state.message = `${this.seats[alive[0]!]!.name} is last standing.`;
      this.spoken(this.state.message);
    }
  }

  private crownScore(): void {
    const s = this.state;
    const alive = s.out.map((dead, index) => (dead ? -1 : index)).filter((index) => index >= 0);
    if (alive.length === 1) {
      s.over = true;
      s.winner = alive[0]!;
    } else if (s.round > 20) {
      this.finishHighest("");
    }
    if (s.over && s.winner !== null) {
      s.message = `${this.seats[s.winner]!.name} wins.`;
      this.spoken(s.message);
    }
  }

  private duePlayers(): number[] {
    if (this.state.due && this.state.due.length > 0) return this.state.due;
    return this.state.out.map((dead, index) => (dead ? -1 : index)).filter((index) => index >= 0);
  }

  private everyoneThrew(): boolean {
    this.state.thrown[this.state.turn] = true;
    return this.duePlayers().every((index) => this.state.thrown[index]);
  }

  private hop(): void {
    const n = this.seats.length;
    for (let k = 0; k < n; k += 1) {
      this.state.turn = (this.state.turn + 1) % n;
      if (!this.state.out[this.state.turn]) return;
    }
  }

  private nextAlive(from: number): number {
    const n = this.seats.length;
    for (let k = 1; k <= n; k += 1) {
      const index = (from + k) % n;
      if (!this.state.out[index]) return index;
    }
    return from;
  }
}
