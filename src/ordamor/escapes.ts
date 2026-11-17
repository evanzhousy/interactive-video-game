import type { CoreThread, PersonaProfile } from "./types.js";

/**
 * Synced from evanzhousy/ordamor/apps/boggart/web/escapes.ts.
 *
 * Every disposal the Ordamor engine recorded comes with what it needs in order to be available
 * (`disposalRequires`, and a signature's `firesWhen`). Removing that precondition is the Night 4
 * "Boggart Trap": a high-tier mimic rigidly repeats its invalidated excuse, while a living human
 * collapses onto their raw core (`refutedBy`).
 */
export interface BoggartBeat {
  closes: string[];
  line?: string;
}

export interface BoggartScene {
  beats: BoggartBeat[];
}

export interface EscapeRoute {
  id: string;
  kind: "signature" | "ordering" | "narrative";
  move: string;
  needs: string | null;
  signature: string | null;
  closedBy: BoggartBeat[];
}

export function coreById(p: PersonaProfile, id: string): CoreThread | undefined {
  const match = /^core-(\d+)$/.exec(id);
  return match ? p.coreThreads?.[Number(match[1]) - 1] : undefined;
}

export function escapeRoutes(p: PersonaProfile, scene?: BoggartScene): EscapeRoute[] {
  const closers = (id: string) => scene?.beats.filter((b) => b.closes.includes(id)) ?? [];
  const signatureOf = new Map<string, string>();
  for (const s of p.disposalSignatures ?? []) {
    for (const v of s.instances) signatureOf.set(v, s.id);
  }

  const routes: EscapeRoute[] = (p.disposalSignatures ?? []).map((s) => ({
    id: s.id,
    kind: "signature",
    move: s.pattern,
    needs: s.firesWhen,
    signature: null,
    closedBy: closers(s.id)
  }));
  for (const o of p.valueOrderings ?? []) {
    if (o.status !== "active") continue;
    routes.push({
      id: o.id,
      kind: "ordering",
      move: o.disposal,
      needs: o.disposalRequires || null,
      signature: signatureOf.get(o.id) ?? null,
      closedBy: closers(o.id)
    });
  }
  const narrative = p.justificationStyle?.narrativePattern;
  if (narrative) {
    routes.push({
      id: "narrative",
      kind: "narrative",
      move: narrative,
      needs: null,
      signature: null,
      closedBy: closers("narrative")
    });
  }
  return routes;
}
