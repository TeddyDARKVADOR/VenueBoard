import { expect, test } from "vitest";
import { TokenManager } from "./token_manager.js";

test("generate and verify", async () => {
  const jwt = new TokenManager();
  const token = await jwt.encode({ sub: "cedrc.pr", role: "admin" }, true);
  const now = Math.floor(Date.now() / 1000);
  expect(await jwt.verify(token)).toEqual({
    sub: "cedrc.pr",
    role: "admin",
    iat: now,
    exp: now + 60,
  });
});

test("verify with another token manager", async () => {
  const jwt1 = new TokenManager();
  const jwt2 = new TokenManager("abc");
  const token = await jwt1.encode({ sub: "cedrc.pr", role: "admin" }, true);
  const now = Math.floor(Date.now() / 1000);
  expect(await jwt1.verify(token)).toEqual({
    sub: "cedrc.pr",
    role: "admin",
    iat: now,
    exp: now + 60,
  });
  await expect(jwt2.verify(token)).rejects.toMatchObject({
    name: expect.stringMatching(/JWSSignatureVerificationFailed|signature/i),
  });
});
