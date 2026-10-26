import type { MatchResult, VisitEvent } from "../domain/engine";

const VISITS = "darting.visits";
const MATCHES = "darting.matches";
const BADGES = "darting.achievements";
const VISIT_CAP = 2000;

export interface StoredVisit extends VisitEvent {
  id: string;
  at: number;
  gameId: string;
  gameTitle: string;
}

export interface StoredMatch {
  id: string;
  at: number;
  gameId: string;
  title: string;
  solo: boolean;
  completed: boolean;
  winnerName?: string;
  players: MatchResult["players"];
}

export interface Achievement {
  id: string;
  title: string;
  detail: string;
  playerName: string;
  at: number;
}

export interface Board {
  title: string;
  rows: { name: string; value: string; detail: string }[];
}

export interface PracticeStats {
  name: string;
  darts: number;
  visits: number;
  scored: number;
  average: number;
  best: number;
  tons: number;
  maximums: number;
  checkouts: number;
  recent: StoredVisit[];
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage can be full or blocked. Scoring still works. */
  }
}

export function visits(): StoredVisit[] {
  return read<StoredVisit>(VISITS);
}

export function matches(): StoredMatch[] {
  return read<StoredMatch>(MATCHES);
}

export function achievements(): Achievement[] {
  return read<Achievement>(BADGES);
}

export function rememberVisit(gameId: string, gameTitle: string, event: VisitEvent): Achievement[] {
  const row: StoredVisit = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    gameId,
    gameTitle,
  };
  const next = [...visits(), row].slice(-VISIT_CAP);
  write(VISITS, next);
  return grant(event.playerName, badgesForVisit(event.playerName, next));
}

export function forgetLastVisit(): void {
  const next = visits();
  next.pop();
  write(VISITS, next);
}

export function rememberMatch(result: MatchResult): Achievement[] {
  const row: StoredMatch = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    gameId: result.gameId,
    title: result.title,
    solo: result.solo,
    completed: result.completed,
    winnerName: result.winnerName,
    players: result.players,
  };
  write(MATCHES, [...matches(), row].slice(-400));
  const earned: Achievement[] = [];
  for (const player of result.players) {
    earned.push(...grant(player.name, badgesForMatch(player.name, player, result)));
  }
  return earned;
}

export function practiceNames(): string[] {
  const names = new Set<string>();
  visits().forEach((visit) => names.add(visit.playerName));
  matches().forEach((match) => match.players.forEach((player) => names.add(player.name)));
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function practiceFor(name: string): PracticeStats {
  const mine = visits().filter((visit) => visit.playerName === name);
  const darts = mine.reduce((sum, visit) => sum + visit.labels.length, 0);
  const scored = mine.reduce((sum, visit) => sum + visit.total, 0);
  const best = mine.reduce((max, visit) => Math.max(max, visit.bust ? 0 : visit.total), 0);
  return {
    name,
    darts,
    visits: mine.length,
    scored,
    average: darts ? (scored / darts) * 3 : 0,
    best,
    tons: mine.filter((visit) => !visit.bust && visit.total >= 100).length,
    maximums: mine.filter((visit) => visit.total === 180).length,
    checkouts: mine.filter((visit) => visit.checkout).length,
    recent: mine.slice(-12).reverse(),
  };
}

export function leaderboards(): Board[] {
  const all = visits();
  const played = matches();
  const highest = [...all].filter((visit) => !visit.bust).sort((a, b) => b.total - a.total).slice(0, 8);
  const tons = countBy(all.filter((visit) => visit.total === 180), (visit) => visit.playerName);
  const wins = new Map<string, number>();
  const averages: { name: string; average: number; darts: number; title: string }[] = [];
  const short501: { name: string; darts: number }[] = [];
  const highTotals = new Map<string, number>();
  for (const match of played) {
    for (const player of match.players) {
      if (player.won && match.completed) wins.set(player.name, (wins.get(player.name) ?? 0) + 1);
      if (match.gameId.startsWith("x01-") && player.darts >= 9) {
        averages.push({ name: player.name, average: player.average, darts: player.darts, title: match.title });
      }
      if (match.gameId === "x01-501" && player.won && match.completed && player.darts > 0) {
        short501.push({ name: player.name, darts: player.darts });
      }
      if (match.gameId === "high") highTotals.set(player.name, Math.max(highTotals.get(player.name) ?? 0, player.scored));
    }
  }
  averages.sort((a, b) => b.average - a.average);
  short501.sort((a, b) => a.darts - b.darts);
  return [
    {
      title: "Highest visit",
      rows: highest.map((visit) => ({ name: visit.playerName, value: String(visit.total), detail: visit.labels.join(" ") })),
    },
    {
      title: "Best 01 average",
      rows: averages.slice(0, 8).map((row) => ({
        name: row.name,
        value: row.average.toFixed(1),
        detail: `${row.title} · ${row.darts} darts`,
      })),
    },
    {
      title: "Fewest darts in 501",
      rows: short501.slice(0, 8).map((row) => ({ name: row.name, value: String(row.darts), detail: "Winning leg" })),
    },
    {
      title: "Most 180s",
      rows: [...tons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({
        name,
        value: String(count),
        detail: "Maximum visits",
      })),
    },
    {
      title: "Highest High Score",
      rows: [...highTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, total]) => ({
        name,
        value: String(total),
        detail: "Eight visits",
      })),
    },
    {
      title: "Most wins",
      rows: [...wins.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({
        name,
        value: String(count),
        detail: "Finished games",
      })),
    },
  ];
}

function countBy<T>(rows: T[], key: (row: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = key(row);
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return map;
}

function grant(playerName: string, wanted: { id: string; title: string; detail: string }[]): Achievement[] {
  const owned = new Set(achievements().filter((badge) => badge.playerName === playerName).map((badge) => badge.id));
  const fresh: Achievement[] = [];
  for (const badge of wanted) {
    if (owned.has(badge.id)) continue;
    fresh.push({ ...badge, playerName, at: Date.now() });
    owned.add(badge.id);
  }
  if (fresh.length) write(BADGES, [...achievements(), ...fresh]);
  return fresh;
}

function badgesForVisit(name: string, all: StoredVisit[]): { id: string; title: string; detail: string }[] {
  const mine = all.filter((visit) => visit.playerName === name);
  const darts = mine.reduce((sum, visit) => sum + visit.labels.length, 0);
  const scored = mine.reduce((sum, visit) => sum + visit.total, 0);
  const found: { id: string; title: string; detail: string }[] = [];
  if (mine.length >= 1) found.push({ id: "first-dart", title: "First dart", detail: "A visit is on the record." });
  if (mine.some((visit) => !visit.bust && visit.total >= 100)) found.push({ id: "first-ton", title: "Ton", detail: "A visit of 100 or more." });
  if (mine.some((visit) => !visit.bust && visit.total >= 140)) found.push({ id: "ton-forty", title: "Ton forty", detail: "A visit of 140 or more." });
  if (mine.some((visit) => visit.total === 180)) found.push({ id: "maximum", title: "Maximum", detail: "180 in one visit." });
  if (mine.some((visit) => visit.checkout)) found.push({ id: "checkout", title: "Checkout", detail: "Finished a leg on a double." });
  if (mine.some((visit) => visit.checkout && visit.total === 170)) found.push({ id: "big-fish", title: "Big fish", detail: "Checked out 170." });
  if (mine.some((visit) => visit.checkout && visit.labels.includes("Bull"))) found.push({ id: "bull-finish", title: "Bull finish", detail: "The last dart was the inner bull." });
  if (mine.length >= 10) found.push({ id: "ten-visits", title: "Ten visits", detail: "Ten visits stored." });
  if (darts >= 100) found.push({ id: "hundred-darts", title: "Hundred darts", detail: "One hundred darts stored." });
  if (darts >= 9 && (scored / darts) * 3 >= 40) found.push({ id: "avg-40", title: "Average 40", detail: "A stored 3-dart average of 40." });
  if (darts >= 9 && (scored / darts) * 3 >= 60) found.push({ id: "avg-60", title: "Average 60", detail: "A stored 3-dart average of 60." });
  const highScored = mine.filter((visit) => visit.gameId === "high").reduce((sum, visit) => sum + visit.total, 0);
  if (highScored >= 500) found.push({ id: "high-500", title: "High 500", detail: "500 or more stored in High Score." });
  return found;
}

function badgesForMatch(
  name: string,
  player: MatchResult["players"][number],
  result: MatchResult,
): { id: string; title: string; detail: string }[] {
  const found: { id: string; title: string; detail: string }[] = [];
  const wins = matches().filter((match) => match.completed && match.players.some((row) => row.name === name && row.won)).length;
  if (wins >= 5) found.push({ id: "five-wins", title: "Five wins", detail: "Five finished games won." });
  if (result.solo && result.completed) found.push({ id: "solo-night", title: "Solo night", detail: "Finished a game alone." });
  if (result.gameId === "shanghai" && player.won) found.push({ id: "shanghai", title: "Shanghai", detail: "Won a Shanghai game." });
  if (player.darts >= 9 && player.average >= 60) found.push({ id: "avg-60", title: "Average 60", detail: "A match average of 60." });
  if (player.darts >= 9 && player.average >= 40) found.push({ id: "avg-40", title: "Average 40", detail: "A match average of 40." });
  return found;
}
