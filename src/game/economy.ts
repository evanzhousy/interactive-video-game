import type { CampaignMode } from "./visitors/index.js";
import type { LocalizedText, ShiftHistoryEntry } from "./types.js";

export type SpecialistRole = "doctor" | "mechanic" | "diver" | "command";

export const VISITOR_SPECIALIST_ROLES: Record<string, SpecialistRole> = {
  "V-01": "doctor",
  "V-02": "mechanic",
  "V-03": "command",
  "V-04": "diver",
  "V-05": "diver",
  "V-06": "doctor",
  "V-07": "doctor",
  "V-08": "mechanic"
};

export const SPECIALIST_LABELS: Record<SpecialistRole, LocalizedText> = {
  doctor: { zh: "医疗官", en: "Medical", ja: "医療官" },
  mechanic: { zh: "轮机师", en: "Mechanic", ja: "機関士" },
  diver: { zh: "深潜员", en: "Diver", ja: "潜水士" },
  command: { zh: "审计官", en: "Auditor", ja: "監査官" }
};

export const REQUIRED_SUB_ROLES: readonly SpecialistRole[] = ["doctor", "mechanic", "diver"];

export function getInitialFuel(mode: CampaignMode): number {
  if (mode === "slice") return 2;
  if (mode === "demo") return 3;
  return 5;
}

/**
 * When station heating fuel hits 0, -46°C cryo-brownout degrades booth sensor capacitor
 * from 2⚡ down to 1⚡ per visitor (or 0⚡ if an emergency reserve purge was forced at 0 fuel).
 */
export function getSensorPowerBudget(fuelLeft: number, emergencyOverdraftUsed = false): number {
  if (emergencyOverdraftUsed) return 0;
  return fuelLeft > 0 ? 2 : 1;
}

export interface SubmarineReadiness {
  admittedHumans: number;
  requiredCrewCount: number;
  rolesPresent: SpecialistRole[];
  missingRoles: SpecialistRole[];
  launchReady: boolean;
}

/**
 * Evaluates rescue submarine Nautilus-0 launch readiness (GDD §3.3):
 * - Full / Daily 8-visitor shift requires >= 3 admitted live humans (or all surviving humans if fewer)
 *   and coverage of core specialist roles (`doctor`, `mechanic`, `diver`) unless not yet encountered.
 */
export function evaluateSubmarineReadiness(
  history: readonly ShiftHistoryEntry[],
  mode: CampaignMode = "full"
): SubmarineReadiness {
  const admittedHumanEntries = history.filter(
    (h) => h.decision === "ADMIT" && !h.wasMimic
  );
  const rolesSet = new Set<SpecialistRole>();
  for (const entry of admittedHumanEntries) {
    const role = VISITOR_SPECIALIST_ROLES[entry.visitorId];
    if (role) rolesSet.add(role);
  }

  const requiredCrewCount = mode === "slice" ? 1 : mode === "demo" ? 2 : 3;
  const rolesToCheck: readonly SpecialistRole[] =
    mode === "full" || mode === "daily" ? REQUIRED_SUB_ROLES : ["doctor"];
  const missingRoles = rolesToCheck.filter((r) => !rolesSet.has(r));

  return {
    admittedHumans: admittedHumanEntries.length,
    requiredCrewCount,
    rolesPresent: [...rolesSet],
    missingRoles,
    launchReady:
      admittedHumanEntries.length >= requiredCrewCount && missingRoles.length === 0
  };
}
