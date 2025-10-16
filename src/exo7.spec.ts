import { expect, test } from "vitest";
import { mk_slots } from "./exo7.js";

test("mk_slots", () => {
  const date = new Date(2025, 1, 1, 12, 0, 0);
  expect(mk_slots({ start: date, mins: 10, qty: 3 })).toEqual([
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

test("mk_slots with mins between each", () => {
  const date = new Date(2025, 1, 1, 12, 0, 0);
  expect(
    mk_slots({ start: date, mins: 10, qty: 3, mins_between_each: 5 }),
  ).toEqual([
    {
      start: new Date(2025, 1, 1, 12, 0, 0),
      end: new Date(2025, 1, 1, 12, 10, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 15, 0),
      end: new Date(2025, 1, 1, 12, 25, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 30, 0),
      end: new Date(2025, 1, 1, 12, 40, 0),
    },
  ]);
});

test("mk_slots with break", () => {
  const date = new Date(2025, 1, 1, 12, 0, 0);
  expect(
    mk_slots({
      start: date,
      mins: 10,
      qty: 5,
      break: { qty_before_break: 2, duration: 20 },
    }),
  ).toEqual([
    {
      start: new Date(2025, 1, 1, 12, 0, 0),
      end: new Date(2025, 1, 1, 12, 10, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 10, 0),
      end: new Date(2025, 1, 1, 12, 20, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 40, 0),
      end: new Date(2025, 1, 1, 12, 50, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 50, 0),
      end: new Date(2025, 1, 1, 13, 0, 0),
    },
    {
      start: new Date(2025, 1, 1, 13, 20, 0),
      end: new Date(2025, 1, 1, 13, 30, 0),
    },
  ]);
});

test("mk_slots with mins between each and break", () => {
  const date = new Date(2025, 1, 1, 12, 0, 0);
  expect(
    mk_slots({
      start: date,
      mins: 10,
      qty: 5,
      mins_between_each: 5,
      break: { qty_before_break: 3, duration: 20 },
    }),
  ).toEqual([
    {
      start: new Date(2025, 1, 1, 12, 0, 0),
      end: new Date(2025, 1, 1, 12, 10, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 15, 0),
      end: new Date(2025, 1, 1, 12, 25, 0),
    },
    {
      start: new Date(2025, 1, 1, 12, 30, 0),
      end: new Date(2025, 1, 1, 12, 40, 0),
    },
    {
      start: new Date(2025, 1, 1, 13, 5, 0),
      end: new Date(2025, 1, 1, 13, 15, 0),
    },
    {
      start: new Date(2025, 1, 1, 13, 20, 0),
      end: new Date(2025, 1, 1, 13, 30, 0),
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
