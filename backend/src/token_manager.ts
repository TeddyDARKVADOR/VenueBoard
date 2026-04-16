import type { FastifyRequest } from "fastify/types/request.js";
import { jwtVerify, SignJWT } from "jose";
import { CustomError } from "./custom_error.js";
import {
  type CreateJwtOptions,
  HttpStatus,
  type JwtClaims,
  type UserProfile,
} from "./models.js";

export class TokenManager {
  secret: Uint8Array;

  constructor(secret_str?: string | Uint8Array) {
    try { process.loadEnvFile(); } catch {}
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
    { sub, role }: CreateJwtOptions,
    testing: boolean,
  ): Promise<string> {
    const signer = new SignJWT({ role })
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setSubject(String(sub));
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
    return {
      sub: Number(payload.sub),
      role: payload.role as JwtClaims["role"],
      iat: Number(payload.iat),
      exp: Number(payload.exp),
    };
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

export function requireRoles(
  roles: UserProfile["user_profile_role"][],
): (req: FastifyRequest) => void {
  return async (req: FastifyRequest) => {
    if (!req.claims) {
      throw new CustomError("TOKEN", HttpStatus.UNAUTHORIZED, "unauthorized");
    }
    if (!roles.includes(req.claims?.role)) {
      throw new CustomError("REQUEST", HttpStatus.FORBIDDEN, "forbidden");
    }
  };
}

export function sameId(remove_from_url: string): (req: FastifyRequest) => void {
  return async (req: FastifyRequest) => {
    if (!req.claims) {
      throw new CustomError("TOKEN", HttpStatus.UNAUTHORIZED, "unauthorized");
    }
    if (
      req.claims.role !== "admin" &&
      req.claims.sub !== Number(req.originalUrl.slice(remove_from_url.length))
    ) {
      throw new CustomError(
        "REQUEST",
        HttpStatus.CONFLICT,
        "Id in the request and in the claims needs to be the same",
      );
    }
  };
}
