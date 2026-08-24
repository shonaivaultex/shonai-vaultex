export type ContactProfileCode = "QUICK" | "BALANCED" | "FORCE" | "NOT_MEASURED";

export type ContactProfileSettings = {
  version: string;
  quick_upper_ms: number | string;
  balanced_upper_ms: number | string;
  junior_drop_height_cm: number | string;
  youth_drop_height_cm: number | string;
  elite_drop_height_cm: number | string;
  masters_drop_height_cm: number | string;
  status: string;
  notes?: string | null;
};

export type ContactProfileResult = {
  code: ContactProfileCode;
  nameJa: string;
  contactTimeMs: number | null;
  version: string | null;
  description: string;
};

const copy: Record<ContactProfileCode, { nameJa: string; description: string }> = {
  QUICK: { nameJa: "クイック接地", description: "今回のドロップジャンプでは、比較的短い接地時間が記録されました。優劣や競技適性を断定する分類ではありません。" },
  BALANCED: { nameJa: "バランス接地", description: "今回のドロップジャンプでは、中間的な接地時間が記録されました。優劣や競技適性を断定する分類ではありません。" },
  FORCE: { nameJa: "フォース接地", description: "今回のドロップジャンプでは、比較的長い接地時間が記録されました。優劣や競技適性を断定する分類ではありません。" },
  NOT_MEASURED: { nameJa: "未測定", description: "有効なドロップジャンプ代表試技を測定するとCONTACT PROFILEが表示されます。" },
};

export function classifyContactProfile(contactTimeMs: number | null | undefined, settings: ContactProfileSettings | null): ContactProfileResult {
  if (contactTimeMs == null || !Number.isFinite(contactTimeMs) || contactTimeMs <= 0 || !settings) {
    return { code: "NOT_MEASURED", nameJa: copy.NOT_MEASURED.nameJa, contactTimeMs: null, version: settings?.version ?? null, description: copy.NOT_MEASURED.description };
  }
  // Milliseconds are compared as integers so 0.188s / 0.222s are stable boundaries.
  const milliseconds = Math.round(contactTimeMs);
  const quickUpper = Number(settings.quick_upper_ms);
  const balancedUpper = Number(settings.balanced_upper_ms);
  const code: ContactProfileCode = milliseconds < quickUpper ? "QUICK" : milliseconds < balancedUpper ? "BALANCED" : "FORCE";
  return { code, nameJa: copy[code].nameJa, contactTimeMs: milliseconds, version: settings.version, description: copy[code].description };
}

export function compositeAthleteType(bodyType: string | null, contactType: ContactProfileCode) {
  if (!bodyType || contactType === "NOT_MEASURED") return null;
  return `${bodyType} × ${contactType}`;
}
