import { createGateway, streamText } from "ai";
import type { CrisisHistoryEntry } from "../game/crises.js";
import { tl } from "../game/i18n.js";
import { classifyQuestionIntent, resolveVisitorProbeKey } from "../game/intent.js";
import {
  DEFAULT_INTERROGATE_MODEL,
  NIGHT5_ALLOWED_AXES,
  buildInterrogateSystemPrompt,
  buildNight5SystemPrompt,
  detectStreamingMetaViolation,
  parseLeadingAxisTag,
  validateInterrogateReply
} from "../game/interrogate-prompt.js";
import {
  buildNight5Probes,
  classifyNight5Question,
  getNight5OffAxisProbe,
  type IntakeOption,
  type Night5ProbeId,
  type PlayerCompactProfile,
  type PublicShiftLogEntry
} from "../game/night5.js";
import { hasIdentityLeakage } from "../game/rephrase.js";
import {
  SEEDED_SLOT_TEMPLATES,
  validateGeneratedVisitorSpec
} from "../game/seeded-visitors.js";
import { getCanonicalEntryForAxis } from "../game/stance-table.js";
import type {
  InterrogateAxisKey,
  InterrogateHistoryTurn,
  Locale,
  VisitorSpec
} from "../game/types.js";
import { resolveVisitorAndRoll, type CampaignMode } from "../game/visitors/index.js";

const VALID_LOCALES = new Set<Locale>(["zh", "en", "ja"]);
const VALID_MODES = new Set<CampaignMode>(["full", "daily", "demo", "slice", "seeded"]);
const MAX_QUESTION_LEN = 300;
const MAX_HISTORY_TURNS = 12;
const MAX_HISTORY_CONTENT_LEN = 500;
const DEFAULT_STREAM_TIMEOUT_MS = 22_000;

export interface InterrogateGatewayConfig {
  configured: boolean;
  apiKey: string;
  model: string;
  baseURL?: string;
}

export function resolveInterrogateGatewayConfig(
  env: Record<string, string | undefined>
): InterrogateGatewayConfig {
  const apiKey = env.AI_GATEWAY_API_KEY?.trim() || env.VERCEL_OIDC_TOKEN?.trim() || "";
  const isVercelRuntime = env.VERCEL === "1";
  const model = env.INTERROGATE_MODEL?.trim() || DEFAULT_INTERROGATE_MODEL;
  const baseURL = env.AI_GATEWAY_BASE_URL?.trim() || undefined;
  return {
    configured: Boolean(apiKey) || isVercelRuntime,
    apiKey,
    model,
    baseURL
  };
}

export interface ParsedBoothInterrogateRequest {
  stage: "booth";
  runSeed: string;
  campaignMode: CampaignMode;
  visitorId: string;
  customVisitor?: Omit<VisitorSpec, "defectPool" | "tellLevel">;
  locale: Locale;
  question: string;
  hintAxis?: InterrogateAxisKey;
  history: InterrogateHistoryTurn[];
}

export interface ParsedNight5InterrogateRequest {
  stage: "night5";
  locale: Locale;
  question: string;
  hintAxis?: Night5ProbeId;
  history: InterrogateHistoryTurn[];
  baseline: PlayerCompactProfile;
  intakeAnswers: IntakeOption[];
  shiftHistory: PublicShiftLogEntry[];
  crisisHistory: CrisisHistoryEntry[];
}

export type ParsedInterrogateRequest =
  | ParsedBoothInterrogateRequest
  | ParsedNight5InterrogateRequest;

function sanitizeHistory(raw: unknown): InterrogateHistoryTurn[] {
  if (!Array.isArray(raw)) return [];
  const clean: InterrogateHistoryTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const role = rec.role === "user" || rec.role === "assistant" ? rec.role : null;
    const content =
      typeof rec.content === "string"
        ? rec.content.trim().slice(0, MAX_HISTORY_CONTENT_LEN)
        : "";
    if (role && content) {
      clean.push({ role, content });
    }
  }
  return clean.slice(-MAX_HISTORY_TURNS);
}

export function parseInterrogateRequest(
  rawBody: unknown
): { ok: true; input: ParsedInterrogateRequest } | { ok: false; status: number; error: string } {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return { ok: false, status: 400, error: "INVALID_JSON_OBJECT" };
  }

  const leakedKey = hasIdentityLeakage(rawBody);
  if (leakedKey) {
    return {
      ok: false,
      status: 400,
      error: `IDENTITY_LEAKAGE_REJECTED: forbidden field "${leakedKey}" must never cross the interrogation boundary`
    };
  }

  const obj = rawBody as Record<string, unknown>;
  const stage = obj.stage === "night5" ? "night5" : "booth";
  const locale = obj.locale as Locale;
  const question = typeof obj.question === "string" ? obj.question.trim() : "";

  if (!VALID_LOCALES.has(locale)) {
    return { ok: false, status: 400, error: "INVALID_LOCALE" };
  }
  if (!question) {
    return { ok: false, status: 400, error: "MISSING_QUESTION" };
  }
  if (question.length > MAX_QUESTION_LEN) {
    return { ok: false, status: 400, error: "QUESTION_TOO_LONG" };
  }

  const history = sanitizeHistory(obj.history);

  if (stage === "night5") {
    const baseline = obj.baseline as PlayerCompactProfile | undefined;
    if (!baseline || typeof baseline !== "object" || !baseline.sig || !baseline.kept || !baseline.dropped) {
      return { ok: false, status: 400, error: "MISSING_NIGHT5_BASELINE" };
    }
    const hintAxis =
      typeof obj.hintAxis === "string" &&
      (NIGHT5_ALLOWED_AXES as readonly string[]).includes(obj.hintAxis)
        ? (obj.hintAxis as Night5ProbeId)
        : undefined;

    return {
      ok: true,
      input: {
        stage: "night5",
        locale,
        question,
        hintAxis,
        history,
        baseline,
        intakeAnswers: Array.isArray(obj.intakeAnswers) ? (obj.intakeAnswers as IntakeOption[]) : [],
        shiftHistory: Array.isArray(obj.shiftHistory)
          ? (obj.shiftHistory as PublicShiftLogEntry[])
          : [],
        crisisHistory: Array.isArray(obj.crisisHistory)
          ? (obj.crisisHistory as CrisisHistoryEntry[])
          : []
      }
    };
  }

  const runSeed = typeof obj.runSeed === "string" ? obj.runSeed.trim().slice(0, 96) : "";
  const campaignMode = obj.campaignMode as CampaignMode;
  const visitorId = typeof obj.visitorId === "string" ? obj.visitorId.trim().slice(0, 24) : "";

  if (!runSeed || !visitorId || !VALID_MODES.has(campaignMode)) {
    return {
      ok: false,
      status: 400,
      error: "MISSING_REQUIRED_FIELDS: runSeed, campaignMode, visitorId"
    };
  }

  const hintAxis =
    typeof obj.hintAxis === "string" ? (obj.hintAxis as InterrogateAxisKey) : undefined;

  const customVisitor =
    campaignMode === "seeded" &&
    obj.customVisitor &&
    typeof obj.customVisitor === "object" &&
    !Array.isArray(obj.customVisitor)
      ? (obj.customVisitor as Omit<VisitorSpec, "defectPool" | "tellLevel">)
      : undefined;

  return {
    ok: true,
    input: {
      stage: "booth",
      runSeed,
      campaignMode,
      visitorId,
      ...(customVisitor ? { customVisitor } : {}),
      locale,
      question,
      hintAxis,
      history
    }
  };
}

export type StreamTextChunkFn = (opts: {
  gateway: InterrogateGatewayConfig;
  systemPrompt: string;
  messages: InterrogateHistoryTurn[];
  abortSignal: AbortSignal;
}) => AsyncIterable<string>;

export function defaultGatewayTextStream({
  gateway,
  systemPrompt,
  messages,
  abortSignal
}: Parameters<StreamTextChunkFn>[0]): AsyncIterable<string> {
  const provider = createGateway({
    ...(gateway.apiKey ? { apiKey: gateway.apiKey } : {}),
    ...(gateway.baseURL ? { baseURL: gateway.baseURL } : {})
  });

  const result = streamText({
    model: provider(gateway.model),
    instructions: {
      role: "system",
      content: systemPrompt,
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" }
        }
      }
    },
    messages,
    maxOutputTokens: 240,
    temperature: 0.72,
    abortSignal
  });

  return result.textStream;
}

function encodeSseEvent(event: string, data: Record<string, unknown>): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export interface InterrogateHandlerDeps {
  streamChunks?: StreamTextChunkFn;
  timeoutMs?: number;
}

/**
 * Executes a streaming interrogation request (booth or Night 5) and returns an SSE ReadableStream.
 */
export function createInterrogateSseResponse(
  parsed: ParsedInterrogateRequest,
  env: Record<string, string | undefined>,
  deps: InterrogateHandlerDeps = {}
): Response {
  const gateway = resolveInterrogateGatewayConfig(env);
  const streamChunks = deps.streamChunks ?? defaultGatewayTextStream;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_STREAM_TIMEOUT_MS;
  const startedAt = Date.now();

  if (parsed.stage === "booth") {
    const resolved = resolveVisitorAndRoll(parsed.campaignMode, parsed.runSeed, parsed.visitorId);
    if (!resolved) {
      return new Response(JSON.stringify({ status: "ERROR", error: "UNKNOWN_VISITOR" }), {
        status: 404,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
      });
    }

    let visitor = resolved.visitor;
    const roll = resolved.roll;
    if (parsed.campaignMode === "seeded" && parsed.customVisitor) {
      const slot = SEEDED_SLOT_TEMPLATES.find((s) => s.id === parsed.visitorId);
      if (slot && parsed.customVisitor.id === parsed.visitorId) {
        const mergedCandidate: VisitorSpec = {
          ...parsed.customVisitor,
          defectPool: [...slot.defectPool],
          tellLevel: slot.tellLevel
        };
        if (validateGeneratedVisitorSpec(mergedCandidate).ok) {
          visitor = mergedCandidate;
        }
      }
    }
    const built = buildInterrogateSystemPrompt(visitor, roll, parsed.locale);
    const fallbackAxis: InterrogateAxisKey =
      parsed.hintAxis && built.allowedAxes.includes(parsed.hintAxis)
        ? parsed.hintAxis
        : resolveVisitorProbeKey(visitor, classifyQuestionIntent(parsed.question, visitor));

    const resolveAxisInfo = (axis: InterrogateAxisKey) => {
      const entry = getCanonicalEntryForAxis(built.table, axis);
      return {
        axis: entry.axisKey,
        onAxis: entry.onAxis,
        canonicalLine: tl(entry.canonicalReply, parsed.locale)
      };
    };

    const messages: InterrogateHistoryTurn[] = [
      ...parsed.history,
      { role: "user", content: parsed.question }
    ];

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (ev: string, payload: Record<string, unknown>) =>
          controller.enqueue(encodeSseEvent(ev, payload));

        if (!gateway.configured) {
          const info = resolveAxisInfo(fallbackAxis);
          send("meta", {
            stage: "booth",
            axis: info.axis,
            onAxis: info.onAxis,
            model: gateway.model
          });
          send("fallback", {
            reason: "NO_GATEWAY_KEY",
            axis: info.axis,
            line: info.canonicalLine
          });
          send("done", {
            source: "canonical_fallback",
            axis: info.axis,
            onAxis: info.onAxis,
            text: info.canonicalLine,
            model: gateway.model,
            latencyMs: Date.now() - startedAt,
            fallbackReason: "NO_GATEWAY_KEY"
          });
          controller.close();
          return;
        }

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeoutMs);

        let prefixBuf = "";
        let axisResolved = false;
        let activeAxis: InterrogateAxisKey = fallbackAxis;
        let accumulatedReply = "";
        let fellBack = false;

        const emitFallback = (reason: string) => {
          if (fellBack) return;
          fellBack = true;
          const info = resolveAxisInfo(activeAxis);
          if (!axisResolved) {
            axisResolved = true;
            send("meta", {
              stage: "booth",
              axis: info.axis,
              onAxis: info.onAxis,
              model: gateway.model
            });
          }
          send("fallback", {
            reason,
            axis: info.axis,
            line: info.canonicalLine
          });
          send("done", {
            source: "canonical_fallback",
            axis: info.axis,
            onAxis: info.onAxis,
            text: info.canonicalLine,
            model: gateway.model,
            latencyMs: Date.now() - startedAt,
            fallbackReason: reason
          });
        };

        try {
          const chunkStream = streamChunks({
            gateway,
            systemPrompt: built.systemPrompt,
            messages,
            abortSignal: ac.signal
          });

          for await (const chunk of chunkStream) {
            if (!chunk) continue;
            if (!axisResolved) {
              prefixBuf += chunk;
              const parsedPrefix = parseLeadingAxisTag(prefixBuf, built.allowedAxes, false);
              if (!parsedPrefix.resolved) continue;

              axisResolved = true;
              activeAxis = parsedPrefix.axis ?? fallbackAxis;
              const info = resolveAxisInfo(activeAxis);
              send("meta", {
                stage: "booth",
                axis: info.axis,
                onAxis: info.onAxis,
                model: gateway.model
              });

              if (parsedPrefix.remainder) {
                accumulatedReply += parsedPrefix.remainder;
                const violation = detectStreamingMetaViolation(accumulatedReply);
                if (violation) {
                  ac.abort();
                  emitFallback(violation);
                  break;
                }
                send("delta", { text: parsedPrefix.remainder });
              }
            } else {
              accumulatedReply += chunk;
              const violation = detectStreamingMetaViolation(accumulatedReply);
              if (violation) {
                ac.abort();
                emitFallback(violation);
                break;
              }
              send("delta", { text: chunk });
            }
          }

          if (!fellBack) {
            if (!axisResolved) {
              const parsedPrefix = parseLeadingAxisTag(prefixBuf, built.allowedAxes, true);
              axisResolved = true;
              activeAxis = parsedPrefix.axis ?? fallbackAxis;
              const info = resolveAxisInfo(activeAxis);
              send("meta", {
                stage: "booth",
                axis: info.axis,
                onAxis: info.onAxis,
                model: gateway.model
              });
              if (parsedPrefix.remainder) {
                accumulatedReply += parsedPrefix.remainder;
                send("delta", { text: parsedPrefix.remainder });
              }
            }

            const info = resolveAxisInfo(activeAxis);
            const validated = validateInterrogateReply(
              accumulatedReply,
              parsed.locale,
              info.canonicalLine
            );
            if (!validated.ok) {
              emitFallback(validated.reason ?? "VALIDATION_FAILED");
            } else {
              send("done", {
                source: "llm",
                axis: info.axis,
                onAxis: info.onAxis,
                text: validated.line,
                model: gateway.model,
                latencyMs: Date.now() - startedAt
              });
            }
          }
        } catch (err) {
          const isAbort = err instanceof Error && err.name === "AbortError";
          emitFallback(isAbort ? "TIMEOUT" : "GATEWAY_ERROR");
        } finally {
          clearTimeout(timer);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive"
      }
    });
  }

  // Night 5 Doppelgänger interrogation stream
  const probes = buildNight5Probes(parsed.baseline, parsed.shiftHistory, parsed.crisisHistory);
  const builtN5 = buildNight5SystemPrompt({
    baseline: parsed.baseline,
    intakeAnswers: parsed.intakeAnswers,
    history: parsed.shiftHistory,
    crisisHistory: parsed.crisisHistory,
    locale: parsed.locale
  });
  const fallbackAxis: Night5ProbeId =
    parsed.hintAxis ?? classifyNight5Question(parsed.question);

  const resolveN5Info = (axis: Night5ProbeId) => {
    const spec =
      axis === "n5_off_axis"
        ? getNight5OffAxisProbe()
        : (probes.find((p) => p.id === axis) ?? getNight5OffAxisProbe());
    return {
      axis: spec.id,
      onAxis: spec.onAxis,
      exposedContradiction: spec.exposedContradiction,
      canonicalLine: tl(spec.doppelgangerReply, parsed.locale)
    };
  };

  const messages: InterrogateHistoryTurn[] = [
    ...parsed.history,
    { role: "user", content: parsed.question }
  ];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: string, payload: Record<string, unknown>) =>
        controller.enqueue(encodeSseEvent(ev, payload));

      if (!gateway.configured) {
        const info = resolveN5Info(fallbackAxis);
        send("meta", {
          stage: "night5",
          axis: info.axis,
          onAxis: info.onAxis,
          model: gateway.model
        });
        send("fallback", {
          reason: "NO_GATEWAY_KEY",
          axis: info.axis,
          line: info.canonicalLine
        });
        send("done", {
          source: "canonical_fallback",
          axis: info.axis,
          onAxis: info.onAxis,
          text: info.canonicalLine,
          model: gateway.model,
          latencyMs: Date.now() - startedAt,
          fallbackReason: "NO_GATEWAY_KEY"
        });
        controller.close();
        return;
      }

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);

      let prefixBuf = "";
      let axisResolved = false;
      let activeAxis: Night5ProbeId = fallbackAxis;
      let accumulatedReply = "";
      let fellBack = false;

      const emitFallback = (reason: string) => {
        if (fellBack) return;
        fellBack = true;
        const info = resolveN5Info(activeAxis);
        if (!axisResolved) {
          axisResolved = true;
          send("meta", {
            stage: "night5",
            axis: info.axis,
            onAxis: info.onAxis,
            model: gateway.model
          });
        }
        send("fallback", {
          reason,
          axis: info.axis,
          line: info.canonicalLine
        });
        send("done", {
          source: "canonical_fallback",
          axis: info.axis,
          onAxis: info.onAxis,
          text: info.canonicalLine,
          model: gateway.model,
          latencyMs: Date.now() - startedAt,
          fallbackReason: reason
        });
      };

      try {
        const chunkStream = streamChunks({
          gateway,
          systemPrompt: builtN5.systemPrompt,
          messages,
          abortSignal: ac.signal
        });

        for await (const chunk of chunkStream) {
          if (!chunk) continue;
          if (!axisResolved) {
            prefixBuf += chunk;
            const parsedPrefix = parseLeadingAxisTag(prefixBuf, builtN5.allowedAxes, false);
            if (!parsedPrefix.resolved) continue;

            axisResolved = true;
            activeAxis = parsedPrefix.axis ?? fallbackAxis;
            const info = resolveN5Info(activeAxis);
            send("meta", {
              stage: "night5",
              axis: info.axis,
              onAxis: info.onAxis,
              model: gateway.model
            });

            if (parsedPrefix.remainder) {
              accumulatedReply += parsedPrefix.remainder;
              const violation = detectStreamingMetaViolation(accumulatedReply);
              if (violation) {
                ac.abort();
                emitFallback(violation);
                break;
              }
              send("delta", { text: parsedPrefix.remainder });
            }
          } else {
            accumulatedReply += chunk;
            const violation = detectStreamingMetaViolation(accumulatedReply);
            if (violation) {
              ac.abort();
              emitFallback(violation);
              break;
            }
            send("delta", { text: chunk });
          }
        }

        if (!fellBack) {
          if (!axisResolved) {
            const parsedPrefix = parseLeadingAxisTag(prefixBuf, builtN5.allowedAxes, true);
            axisResolved = true;
            activeAxis = parsedPrefix.axis ?? fallbackAxis;
            const info = resolveN5Info(activeAxis);
            send("meta", {
              stage: "night5",
              axis: info.axis,
              onAxis: info.onAxis,
              model: gateway.model
            });
            if (parsedPrefix.remainder) {
              accumulatedReply += parsedPrefix.remainder;
              send("delta", { text: parsedPrefix.remainder });
            }
          }

          const info = resolveN5Info(activeAxis);
          const validated = validateInterrogateReply(
            accumulatedReply,
            parsed.locale,
            info.canonicalLine
          );
          if (!validated.ok) {
            emitFallback(validated.reason ?? "VALIDATION_FAILED");
          } else {
            send("done", {
              source: "llm",
              axis: info.axis,
              onAxis: info.onAxis,
              text: validated.line,
              model: gateway.model,
              latencyMs: Date.now() - startedAt
            });
          }
        }
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        emitFallback(isAbort ? "TIMEOUT" : "GATEWAY_ERROR");
      } finally {
        clearTimeout(timer);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive"
    }
  });
}

export async function handleInterrogateWebRequest(
  request: Request,
  env: Record<string, string | undefined>,
  deps?: InterrogateHandlerDeps
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
    return new Response(JSON.stringify({ status: "ERROR", error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ status: "ERROR", error: "MALFORMED_JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  const parsed = parseInterrogateRequest(rawBody);
  if (!parsed.ok) {
    return new Response(JSON.stringify({ status: "ERROR", error: parsed.error }), {
      status: parsed.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  return createInterrogateSseResponse(parsed.input, env, deps);
}
