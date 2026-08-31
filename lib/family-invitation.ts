export type FamilyInvitationAvailability = "available" | "email_mismatch" | "unavailable";

export function normalizeInvitationEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function getFamilyInvitationAvailability(input: {
  acceptedAt: string | null | undefined;
  expiresAt: string | null | undefined;
  invitationEmail: string | null | undefined;
  currentEmail: string | null | undefined;
  now?: Date;
}): FamilyInvitationAvailability {
  const { acceptedAt, expiresAt, now = new Date() } = input;
  if (acceptedAt || !expiresAt || new Date(expiresAt) <= now) return "unavailable";
  const invitationEmail = normalizeInvitationEmail(input.invitationEmail);
  const currentEmail = normalizeInvitationEmail(input.currentEmail);
  if (!invitationEmail || !currentEmail || invitationEmail !== currentEmail) return "email_mismatch";
  return "available";
}
