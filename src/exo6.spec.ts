import { expect, test } from "vitest";
import { mk_slots } from "./exo6.js";

test("mk_slots normal", () => {
  const date = new Date(2025, 1, 1, 12, 0, 0);
  const mins = 10;
  expect(mk_slots({ start: date, mins, qty: 3 })).toEqual([
    {
      start: new Date(2025, 1, 1, 12, 0, 0),
      end: new Date(2025, 1, 1, 12, 10, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 10, 0),
      end: new Date(2025, 1, 1, 12, 20, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 20, 0),
      end: new Date(2025, 1, 1, 12, 30, 0),
    },
  ]);
});

test("mk_slots empty 1", () => {
  const date = new Date(2025, 1, 1, 12, 0, 0);
  const mins = 10;
  expect(mk_slots({ start: date, mins, qty: 0 })).toEqual([]);
});

test("mk_slots empty 2", () => {
  const date = new Date(2025, 1, 1, 12, 0, 0);
  const mins = 10;
  expect(mk_slots({ start: date, mins, qty: -19 })).toEqual([]);
});
