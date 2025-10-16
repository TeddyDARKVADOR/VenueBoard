import { expect, test } from "vitest";
import { repeat } from "./repeat.js";

test("repeats toto 3 times", () => {
  expect(repeat("toto", 3)).toBe("totototototo");
});
