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
 * from 2 PWR down to 1 PWR per visitor (or 0 PWR if an emergency reserve purge was forced at 0 fuel).
 */
export function getSensorPowerBudget(fuelLeft: number, emergencyOverdraftUsed = false): number {
  if (emergencyOverdraftUsed) return 0;
  return fuelLeft > 0 ? 2 : 1;
}

export interface SubmarineReadiness {
  admittedHumans: number;
  requiredCrewCount: number;
  checkedRoles: SpecialistRole[];
  rolesPresent: SpecialistRole[];
  missingRoles: SpecialistRole[];
  launchReady: boolean;
}

/**
 * Evaluates rescue submarine Nautilus-0 launch readiness (GDD §3.3):
 * - Full / Daily 8-visitor shift requires >= 3 admitted live humans and coverage of all 3 core
 *   specialist roles (`doctor`, `mechanic`, `diver`), which `rollShift` guarantees exist as humans.
 * - Demo / Quick Slice checks only the core specialist roles that actually spawned as live humans
 *   in the shortened roster, avoiding impossible missing-role warnings.
 */
export function evaluateSubmarineReadiness(
  history: readonly ShiftHistoryEntry[],
  mode: CampaignMode = "full"
): SubmarineReadiness {
  const realHumanEntries = history.filter((h) => !h.wasMimic);
  const admittedHumanEntries = realHumanEntries.filter((h) => h.decision === "ADMIT");

  const rolesSet = new Set<SpecialistRole>();
  for (const entry of admittedHumanEntries) {
    const role = VISITOR_SPECIALIST_ROLES[entry.visitorId];
    if (role) rolesSet.add(role);
  }

  let rolesToCheck: SpecialistRole[];
  let requiredCrewCount: number;

  if (mode === "full" || mode === "daily" || mode === "seeded") {
    rolesToCheck = [...REQUIRED_SUB_ROLES];
    requiredCrewCount = 3;
  } else {
    const spawnedCoreRoles = REQUIRED_SUB_ROLES.filter((role) =>
      realHumanEntries.some((h) => VISITOR_SPECIALIST_ROLES[h.visitorId] === role)
    );
    rolesToCheck = spawnedCoreRoles.length > 0 ? spawnedCoreRoles : ["doctor"];
    const baseTarget = mode === "slice" ? 1 : 2;
    requiredCrewCount =
      realHumanEntries.length > 0 ? Math.min(baseTarget, realHumanEntries.length) : baseTarget;
  }

  const missingRoles = rolesToCheck.filter((r) => !rolesSet.has(r));

  return {
    admittedHumans: admittedHumanEntries.length,
    requiredCrewCount,
    checkedRoles: rolesToCheck,
    rolesPresent: [...rolesSet],
    missingRoles,
    launchReady:
      admittedHumanEntries.length >= requiredCrewCount && missingRoles.length === 0
  };
}
