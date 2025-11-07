import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import type { CreateJwtOptions, JwtClaims } from "./models.js";

export class TokenManager {
  secret: Uint8Array;

  constructor(secret_str?: string | Uint8Array) {
    process.loadEnvFile();
    const src = secret_str ?? process.env?.JWT_SECRET;
    if (!src) {
      throw new Error(
        "JWT_SECRET is not set and no secret was provided on construction",
      );
    }
    if (src instanceof Uint8Array) {
      this.secret = src;
    } else {
      this.secret = fromBase64url(src);
    }
  }

  async encode(
    { sub, roles }: CreateJwtOptions,
    testing: boolean,
  ): Promise<string> {
    const signer = new SignJWT({ roles })
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setSubject(sub);
    if (testing) {
      const now = Math.floor(Date.now() / 1000);
      signer.setIssuedAt(now).setExpirationTime(now + 60);
    } else {
      signer.setIssuedAt().setExpirationTime("1h");
    }
    return await signer.sign(this.secret);
  }

  async verify(encoded_token: string): Promise<JwtClaims> {
    const { payload } = await jwtVerify(encoded_token, this.secret, {
      algorithms: ["HS256"],
    });
    if (!this.isJwtClaims(payload)) {
      throw new Error("Invalid token payload");
    }
    return payload;
  }

  private isJwtClaims(payload: JWTPayload): payload is JwtClaims {
    return (
      typeof payload.sub === "string" &&
      Array.isArray(payload.roles) &&
      payload.roles.every((role) => typeof role === "string") &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number"
    );
  }
}

function fromBase64url(source: string): Uint8Array {
  const base64 = source.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
