export type Ring = "S" | "D" | "T";

export interface DartHit {
  /** 0 is a miss, 1–20 a segment, 25 the outer bull, 50 the inner bull. */
  number: number;
  ring: Ring;
}

export interface Seat {
  id: string;
  name: string;
  color: string;
}

export function pointsOf(hit: DartHit): number {
  if (hit.number === 0) return 0;
  if (hit.number === 25) return 25;
  if (hit.number === 50) return 50;
  if (hit.ring === "D") return hit.number * 2;
  if (hit.ring === "T") return hit.number * 3;
  return hit.number;
}

export function labelOf(hit: DartHit): string {
  if (hit.number === 0) return "Miss";
  if (hit.number === 25) return "25";
  if (hit.number === 50) return "Bull";
  const prefix = hit.ring === "D" ? "D" : hit.ring === "T" ? "T" : "S";
  return `${prefix}${hit.number}`;
}

export function isDouble(hit: DartHit): boolean {
  return hit.ring === "D" || hit.number === 50;
}

export function isTreble(hit: DartHit): boolean {
  return hit.ring === "T" && hit.number >= 1 && hit.number <= 20;
}

export const CLOCKWISE = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

export const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

export function neighbours(n: number): [number, number] {
  const i = CLOCKWISE.indexOf(n);
  const left = CLOCKWISE[(i + CLOCKWISE.length - 1) % CLOCKWISE.length] ?? n;
  const right = CLOCKWISE[(i + 1) % CLOCKWISE.length] ?? n;
  return [left, right];
}
