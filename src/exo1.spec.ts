import { expect, test } from "vitest";
import { toto_narrow } from "./exo1.js";

test("add ' bonjour!'", () => {
  const result = toto_narrow("Hello");
  expect(result).toBe("Hello bonjour!");
});

test("add 12", () => {
  const result = toto_narrow(8);
  expect(result).toBe(20);
});

test("add sum", () => {
  const arr = [1, 2, 3];
  const result = toto_narrow(arr);
  expect(arr).toEqual([1, 2, 3, 6]);
  expect(result).toBeNull();
});

test("add string", () => {
  const arr = ["a", "b"];
  const result = toto_narrow(arr);
  expect(arr).toEqual(["a", "b", "je suis une chaîne supplémentaire"]);
  expect(result).toBeNull();
});
