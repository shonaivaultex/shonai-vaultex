import { createHash, randomBytes } from "node:crypto";

export function randomAccessToken(bytes = 24) { return randomBytes(bytes).toString("base64url"); }
export function hashParticipantSecret(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function hashParticipantPin(sessionId: string, pin: string) { return hashParticipantSecret(`${sessionId}:${pin}`); }
