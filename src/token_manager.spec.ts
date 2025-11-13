import { expect, test } from "vitest";
import { TokenManager } from "./token_manager.js";

test("generate and verify", async () => {
  const jwt = new TokenManager();
  const token = await jwt.encode({ sub: "cedrc.pr", roles: ["admin"] }, true);
  const now = Math.floor(Date.now() / 1000);
  expect(await jwt.verifyAll(token, ["admin"])).toEqual({
    sub: "cedrc.pr",
    roles: ["admin"],
    iat: now,
    exp: now + 60,
  });
});

test("verify with another token manager", async () => {
  const jwt1 = new TokenManager();
  const jwt2 = new TokenManager("abc");
  const token = await jwt1.encode({ sub: "cedrc.pr", roles: ["admin"] }, true);
  const now = Math.floor(Date.now() / 1000);
  expect(await jwt1.verifyAll(token, ["admin"])).toEqual({
    sub: "cedrc.pr",
    roles: ["admin"],
    iat: now,
    exp: now + 60,
  });
  await expect(jwt2.verifyAll(token)).rejects.toMatchObject({
    name: expect.stringMatching(/JWSSignatureVerificationFailed|signature/i),
  });
});
