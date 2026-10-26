import { describe, expect, it } from "vitest";
import { createEngine } from "./catalog";
import type { Seat } from "./hit";
import { X01Engine } from "./x01";

const seats: Seat[] = [
  { id: "a", name: "Blue", color: "#3b6ea5" },
  { id: "b", name: "Red", color: "#c4473a" },
];
const options = { legsToWin: 1, raceTarget: 500, solo: false };

describe("501", () => {
  it("speaks a 100 visit and leaves 401", () => {
    const game = createEngine("x01-501", seats, options);
    game.dart({ number: 20, ring: "T" });
    game.dart({ number: 20, ring: "S" });
    const event = game.dart({ number: 20, ring: "S" });
    expect(event?.total).toBe(100);
    expect(event?.bust).toBe(false);
    expect(game.view().cards[0]?.primary).toBe("401");
    expect(game.view().cards[1]?.active).toBe(true);
    expect(game.view().say).toContain("Score 100");
  });

  it("busts the whole visit and stays on the same remaining", () => {
    const game = new X01Engine("x01-501", "501", [seats[0]!], { ...options, solo: true }, 32, "double", false);
    const event = game.dart({ number: 20, ring: "T" });
    expect(event?.bust).toBe(true);
    expect(event?.total).toBe(0);
    expect(game.view().cards[0]?.primary).toBe("32");
  });

  it("checks out on a double", () => {
    const game = new X01Engine("x01-501", "501", [seats[0]!], { ...options, solo: true }, 40, "double", false);
    const event = game.dart({ number: 20, ring: "D" });
    expect(event?.checkout).toBe(true);
    expect(game.view().over).toBe(true);
    expect(game.view().say).toContain("Blue wins");
  });

  it("ignores a single before double in", () => {
    const game = createEngine("x01-dido", [seats[0]!], { ...options, solo: true });
    game.dart({ number: 20, ring: "S" });
    expect(game.view().cards[0]?.primary).toBe("301");
    game.dart({ number: 20, ring: "D" });
    expect(game.view().cards[0]?.primary).toBe("261");
  });

  it("undoes a committed visit", () => {
    const game = createEngine("x01-501", seats, options);
    game.dart({ number: 20, ring: "T" });
    game.dart({ number: 20, ring: "S" });
    game.dart({ number: 20, ring: "S" });
    expect(game.undo()).toBe(true);
    expect(game.view().cards[0]?.primary).toBe("421");
    expect(game.view().cards[0]?.active).toBe(true);
  });
});

describe("other games", () => {
  it("closes 20 with one treble in cricket", () => {
    const game = createEngine("cricket", seats, options);
    game.dart({ number: 20, ring: "T" });
    expect(game.view().cards[0]?.primary).toBe("1/7");
  });

  it("keeps a 180 in high score", () => {
    const game = createEngine("high", [seats[0]!], { ...options, solo: true });
    game.dart({ number: 20, ring: "T" });
    game.dart({ number: 20, ring: "T" });
    const event = game.dart({ number: 20, ring: "T" });
    expect(event?.total).toBe(180);
    expect(game.view().cards[0]?.primary).toBe("180");
  });
});
