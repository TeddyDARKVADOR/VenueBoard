import { expect, test } from "vitest";
import { mk_dates_every_minute } from "./exo5.js";

test("base 12h", () => {
  const start = new Date(2025, 1, 1, 12, 0, 0);
  const interval = 15;
  const count = 3;
  const result = mk_dates_every_minute({ start, interval, count });
  expect(result).toEqual([
    new Date(2025, 1, 1, 12, 0, 0),
    new Date(2025, 1, 1, 12, 15, 0),
    new Date(2025, 1, 1, 12, 30, 0),
  ]);
}); 

test("base 12h05", () => {
  const start = new Date(2025, 1, 1, 12, 5, 0);
  const interval = 12;
  const count = 4;
  const result = mk_dates_every_minute({ start, interval, count });
  expect(result).toEqual([
    new Date(2025, 1, 1, 12, 5, 0),
    new Date(2025, 1, 1, 12, 17, 0),
    new Date(2025, 1, 1, 12, 29, 0),
    new Date(2025, 1, 1, 12, 41, 0),
  ]);
});
