import { randomBytes } from "node:crypto";
export const randomInviteCode = () => randomBytes(18).toString("base64url");
