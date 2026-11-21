import { createGateway, generateText } from "ai";
import {
  buildSeededSkeletons,
  formatClosedValueSummary,
  generateProceduralVisitors,
  hydrateVisitorFromSkeleton,
  validateGeneratedVisitorSpec,
  type LlmFleshedVisitorPayload,
  type VisitorSkeleton
} from "../game/seeded-visitors.js";
import type { Locale, VisitorSpec } from "../game/types.js";
import {
  resolveInterrogateGatewayConfig,
  type InterrogateGatewayConfig
} from "./interrogate-handler.js";

const VALID_LOCALES = new Set<Locale>(["zh", "en", "ja"]);

export type GenerateJsonTextFn = (opts: {
  gateway: InterrogateGatewayConfig;
  systemPrompt: string;
  userPrompt: string;
  abortSignal: AbortSignal;
}) => Promise<string>;

export async function defaultGatewayGenerateJson({
  gateway,
  systemPrompt,
  userPrompt,
  abortSignal
}: Parameters<GenerateJsonTextFn>[0]): Promise<string> {
  const provider = createGateway({
    ...(gateway.apiKey ? { apiKey: gateway.apiKey } : {}),
    ...(gateway.baseURL ? { baseURL: gateway.baseURL } : {})
  });

  const result = await generateText({
    model: provider(gateway.model),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 4500,
    temperature: 0.85,
    abortSignal
  });

  return result.text;
}

function buildGeneratorPrompts(
  seed: string,
  locale: Locale,
  skeletons: readonly VisitorSkeleton[]
): { systemPrompt: string; userPrompt: string } {
  const glossary = formatClosedValueSummary(locale);
  const slotSpec = skeletons.map((sk) => ({
    id: sk.slot.id,
    night: sk.slot.night,
    specialist: sk.slot.specialist,
    defaultName: sk.name[locale],
    defaultRole: sk.role[locale],
    kept1: sk.kept1,
    dropped1: sk.dropped1,
    kept2: sk.kept2,
    dropped2: sk.dropped2,
    disposalStyle: sk.disposalStyle,
    needsBoggartTrap: sk.slot.night === 4
  }));

  const langHint =
    locale === "zh"
      ? "Simplified Chinese (简体中文)"
      : locale === "ja"
        ? "Japanese (日本語)"
        : "English";

  const systemPrompt = [
    `You are the scenario writer for "Quarantine Gate 0: 2036", a claustrophobic -46°C Svalbard Arctic quarantine interrogation game powered by Ordamor Persona Profiles.`,
    `Given 8 deterministic survivor skeletons (fixed value tokens and disposal archetypes), invent 8 vivid, distinct, morally grey Arctic station survivors with fresh incidents, sharp intercom voices, and razor-sharp moral contradictions.`,
    `CRITICAL RULES:`,
    `1. NEVER invent, rename, or swap the value tokens (closed set: ${glossary}). Follow each slot's exact kept1>dropped1, kept2>dropped2, and disposalStyle.`,
    `2. NEVER mention "mimic", "monster", "impostor", "拟态体", or "伪人" inside dossier facts or probes.`,
    `3. Write ALL primary narrative strings in ${langHint} inside localized objects { "${locale}": "..." } (you may omit other locales; the engine fills fallbacks).`,
    `4. Return ONLY valid JSON (no markdown fences, no commentary): an array of 8 objects matching each slot id ("V-01".."V-08").`
  ].join("\n");

  const userPrompt = [
    `Seed: "${seed}" | Target locale: "${locale}"`,
    `Skeletons (preserve exact id, value orderings, and disposalStyle):`,
    JSON.stringify(slotSpec, null, 2),
    ``,
    `For each of the 8 slots return an object with:`,
    `{`,
    `  "id": "V-01",`,
    `  "name": { "${locale}": "Distinct realistic name" },`,
    `  "role": { "${locale}": "Specific Svalbard outpost role" },`,
    `  "voice": "brief English vocal delivery notes (6-12 words)",`,
    `  "summary": "1 concise sentence in zh summarizing invoked vs unspoken tension",`,
    `  "disposalRequires": { "${locale}": "concrete external precondition that sustains their excuse" },`,
    `  "observations": [`,
    `    { "id": "o-01", "source": "short source label", "kw": { "${locale}": "3-6 word hook" }, "text": { "${locale}": "concrete dark incident where kept1 beat dropped1" } },`,
    `    { "id": "o-02", "source": "short source label", "kw": { "${locale}": "3-6 word hook" }, "text": { "${locale}": "concrete incident where kept2 beat dropped2" } },`,
    `    { "id": "o-03", "source": "Intake Interview", "kw": { "${locale}": "3-6 word hook" }, "text": { "${locale}": "flattering public quote championing dropped1/dropped2" } }`,
    `  ],`,
    `  "openingLine": { "${locale}": "1-2 tense radio intercom sentences from outside the blast glass" },`,
    `  "offAxisReply": { "${locale}": "1 sharp irritable deflection" },`,
    `  "probes": {`,
    `    "dilemma": { "label": { "${locale}": "..." }, "human": { "${locale}": "defends kept1 over dropped1" }, "mimic_say": { "${locale}": "recites flattering dropped1" } },`,
    `    "dilemma2": { "label": { "${locale}": "..." }, "human": { "${locale}": "defends kept2 over dropped2" }, "mimic_say": { "${locale}": "recites flattering dropped2" } },`,
    `    "evidence": { "label": { "${locale}": "..." }, "human": { "${locale}": "owns/rationalizes o-01" }, "mimic_say": { "${locale}": "denies o-01 using dropped1" } },`,
    `    "disposal_probe": { "label": { "${locale}": "..." }, "human": { "${locale}": "matches disposalStyle" }, "mimic_say": { "${locale}": "flattering denial" }, "mimic_disp": { "${locale}": "uses wrong disposal style" } },`,
    `    "boggart_trap": { "label": { "${locale}": "strips disposalRequires precondition (required on Night 4)" }, "human": { "${locale}": "raw unvarnished core after excuse collapses" }, "mimic_disp": { "${locale}": "rigidly repeats invalidated excuse" } }`,
    `  }`,
    `}`
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function extractJsonArray(raw: string): LlmFleshedVisitorPayload[] | null {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    return Array.isArray(parsed) ? (parsed as LlmFleshedVisitorPayload[]) : null;
  } catch {
    return null;
  }
}

export interface GenerateVisitorsResponseBody {
  ok: true;
  seed: string;
  locale: Locale;
  source: "llm" | "procedural_fallback";
  model: string;
  attempts: number;
  llmHydratedCount: number;
  visitors: VisitorSpec[];
  fallbackReason?: string;
}

export interface GenerateVisitorsDeps {
  generateJsonText?: GenerateJsonTextFn;
  timeoutMs?: number;
  maxRetries?: number;
}

export async function executeGenerateVisitors(
  rawBody: unknown,
  env: Record<string, string | undefined>,
  deps: GenerateVisitorsDeps = {}
): Promise<{ status: number; body: GenerateVisitorsResponseBody | { ok: false; error: string } }> {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return { status: 400, body: { ok: false, error: "INVALID_JSON_OBJECT" } };
  }

  const obj = rawBody as Record<string, unknown>;
  const seed = typeof obj.seed === "string" ? obj.seed.trim().slice(0, 64) : "";
  const locale = (VALID_LOCALES.has(obj.locale as Locale) ? obj.locale : "zh") as Locale;

  if (!seed) {
    return { status: 400, body: { ok: false, error: "MISSING_SEED" } };
  }

  const gateway = resolveInterrogateGatewayConfig(env);
  const skeletons = buildSeededSkeletons(seed);

  if (!gateway.configured) {
    return {
      status: 200,
      body: {
        ok: true,
        seed,
        locale,
        source: "procedural_fallback",
        model: gateway.model,
        attempts: 0,
        llmHydratedCount: 0,
        visitors: generateProceduralVisitors(seed),
        fallbackReason: "NO_GATEWAY_KEY"
      }
    };
  }

  const generateFn = deps.generateJsonText ?? defaultGatewayGenerateJson;
  const timeoutMs = deps.timeoutMs ?? 38_000;
  const maxRetries = deps.maxRetries ?? 1;
  const { systemPrompt, userPrompt } = buildGeneratorPrompts(seed, locale, skeletons);

  let lastReason = "PARSE_ERROR";
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const rawText = await generateFn({
        gateway,
        systemPrompt,
        userPrompt,
        abortSignal: ac.signal
      });
      const patches = extractJsonArray(rawText);
      if (!patches || patches.length === 0) {
        lastReason = "MALFORMED_MODEL_JSON";
        continue;
      }

      const patchMap = new Map<string, LlmFleshedVisitorPayload>();
      for (const item of patches) {
        if (item && typeof item === "object" && typeof item.id === "string") {
          patchMap.set(item.id.trim(), item);
        }
      }

      let llmHydratedCount = 0;
      const visitors: VisitorSpec[] = [];
      let allValid = true;

      for (const sk of skeletons) {
        const patch = patchMap.get(sk.slot.id);
        if (patch) {
          const candidate = hydrateVisitorFromSkeleton(sk, patch);
          const check = validateGeneratedVisitorSpec(candidate);
          if (check.ok) {
            visitors.push(candidate);
            llmHydratedCount += 1;
            continue;
          }
          allValid = false;
          lastReason = `INVARIANT_FAILED:${check.errors[0] ?? "unknown"}`;
        }
        // Seamless procedural fallback for any missing/invalid slot
        visitors.push(hydrateVisitorFromSkeleton(sk));
      }

      if (llmHydratedCount >= 4 || (allValid && llmHydratedCount > 0)) {
        return {
          status: 200,
          body: {
            ok: true,
            seed,
            locale,
            source: "llm",
            model: gateway.model,
            attempts,
            llmHydratedCount,
            visitors
          }
        };
      }
      lastReason = "INSUFFICIENT_VALID_SLOTS";
    } catch (err) {
      lastReason = err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "GATEWAY_ERROR";
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      seed,
      locale,
      source: "procedural_fallback",
      model: gateway.model,
      attempts,
      llmHydratedCount: 0,
      visitors: generateProceduralVisitors(seed),
      fallbackReason: lastReason
    }
  };
}

export async function handleGenerateVisitorsWebRequest(
  request: Request,
  env: Record<string, string | undefined>,
  deps?: GenerateVisitorsDeps
): Promise<Response> {
  if (request.method === "GET") {
    const gw = resolveInterrogateGatewayConfig(env);
    return new Response(
      JSON.stringify({
        ok: true,
        configured: gw.configured,
        provider: "vercel_ai_gateway",
        model: gw.model
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
      }
    );
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "MALFORMED_JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  const res = await executeGenerateVisitors(rawBody, env, deps);
  return new Response(JSON.stringify(res.body), {
    status: res.status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
