import { expect, test } from "vitest";
import { mk_login } from "./exo3.js";

test("", () => {
  expect(mk_login(" leroi mairlin ")).toEqual("leroi.mairlin");
  expect(mk_login("LérOi...m&Air.lin")).toEqual("leroi.mair.lin");
  expect(mk_login(" &&  ....l&ér0oi'''~ éMa-irl@i°n.....")).toEqual(
    "ler0oi.ema-irlin",
  );
  expect(mk_login("l😀😃&ér0oi'''~ éMa-irli°n.....")).toEqual(
    "ler0oi.ema-irlin",
  );
  expect(mk_login("Jose\u0301")).toEqual("jose");
  expect(mk_login("JosПриветр миe\u0301")).toEqual("jos.e");
});
