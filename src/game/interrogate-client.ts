import type { CrisisHistoryEntry } from "./crises.js";
import type { IntakeOption, Night5ProbeId, PlayerCompactProfile } from "./night5.js";
import { hasIdentityLeakage } from "./rephrase.js";
import type {
  InterrogateAxisKey,
  InterrogateHistoryTurn,
  Locale,
  ShiftHistoryEntry,
  VisitorSpec
} from "./types.js";
import type { CampaignMode } from "./visitors/index.js";

export type PublicWireVisitorSpec = Omit<VisitorSpec, "defectPool" | "tellLevel">;

export interface BoothInterrogateClientParams {
  stage: "booth";
  runSeed: string;
  campaignMode: CampaignMode;
  visitorId: string;
  customVisitor?: VisitorSpec;
  operatorName?: string;
  locale: Locale;
  question: string;
  hintAxis: InterrogateAxisKey;
  history: InterrogateHistoryTurn[];
  fallbackLine: string;
}

export interface Night5InterrogateClientParams {
  stage: "night5";
  operatorName?: string;
  locale: Locale;
  question: string;
  hintAxis: Night5ProbeId;
  history: InterrogateHistoryTurn[];
  baseline: PlayerCompactProfile;
  intakeAnswers: readonly IntakeOption[];
  shiftHistory: readonly ShiftHistoryEntry[];
  crisisHistory: readonly CrisisHistoryEntry[];
  fallbackLine: string;
}

export type InterrogateClientParams =
  | BoothInterrogateClientParams
  | Night5InterrogateClientParams;

export interface InterrogateStreamCallbacks<TAxis extends string> {
  onMeta?: (meta: { axis: TAxis; onAxis: boolean; model?: string }) => void;
  onDelta?: (delta: string, accumulated: string) => void;
  onFallback?: (info: { reason: string; axis: TAxis; line: string }) => void;
}

export interface InterrogateClientResult<TAxis extends string> {
  source: "llm" | "canonical_fallback";
  axis: TAxis;
  text: string;
  latencyMs: number;
  model?: string;
  fallbackReason?: string;
  signalGlitch: boolean;
}

function sanitizeCustomVisitorForWire(v?: VisitorSpec): PublicWireVisitorSpec | undefined {
  if (!v) return undefined;
  const { defectPool: _dp, tellLevel: _tl, ...publicSpec } = v;
  return publicSpec;
}

export async function streamInterrogateTurn<TAxis extends string>(
  params: InterrogateClientParams & { hintAxis: TAxis },
  callbacks: InterrogateStreamCallbacks<TAxis> = {},
  opts?: {
    endpoint?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    signal?: AbortSignal;
  }
): Promise<InterrogateClientResult<TAxis>> {
  const endpoint = opts?.endpoint ?? "/api/interrogate";
  const timeoutMs = opts?.timeoutMs ?? 22_000;
  const fetchFn = opts?.fetchImpl ?? globalThis.fetch;
  const startedAt = Date.now();

  const wireVisitor =
    params.stage === "booth" && params.campaignMode === "seeded"
      ? sanitizeCustomVisitorForWire(params.customVisitor)
      : undefined;

  const bodyPayload =
    params.stage === "booth"
      ? {
          stage: "booth" as const,
          runSeed: params.runSeed,
          campaignMode: params.campaignMode,
          visitorId: params.visitorId,
          ...(wireVisitor ? { customVisitor: wireVisitor } : {}),
          ...(params.operatorName ? { operatorName: params.operatorName } : {}),
          locale: params.locale,
          question: params.question,
          hintAxis: params.hintAxis,
          history: params.history
        }
      : {
          stage: "night5" as const,
          ...(params.operatorName ? { operatorName: params.operatorName } : {}),
          locale: params.locale,
          question: params.question,
          hintAxis: params.hintAxis,
          history: params.history,
          baseline: params.baseline,
          intakeAnswers: params.intakeAnswers,
          shiftHistory: params.shiftHistory.map(({ visitorId, decision, excuse }) => ({
            visitorId,
            decision,
            excuse
          })),
          crisisHistory: params.crisisHistory
        };

  const leak = hasIdentityLeakage(bodyPayload);
  if (leak) {
    throw new Error(`Identity leakage blocked on client interrogate request: "${leak}"`);
  }

  const ac = new AbortController();
  const onParentAbort = () => ac.abort();
  opts?.signal?.addEventListener("abort", onParentAbort, { once: true });
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  const makeFallback = (
    reason: string,
    axis: TAxis = params.hintAxis,
    line: string = params.fallbackLine,
    model?: string
  ): InterrogateClientResult<TAxis> => {
    callbacks.onFallback?.({ reason, axis, line });
    return {
      source: "canonical_fallback",
      axis,
      text: line,
      latencyMs: Date.now() - startedAt,
      model,
      fallbackReason: reason,
      signalGlitch: reason !== "NO_GATEWAY_KEY"
    };
  };

  try {
    const res = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json"
      },
      body: JSON.stringify(bodyPayload),
      signal: ac.signal
    });

    if (!res.ok) {
      return makeFallback(`HTTP_${res.status}`);
    }

    const contentType = res.headers.get("content-type") ?? "";

    // Plain JSON response fallback/compatibility (e.g. legacy mock responses in tests)
    if (contentType.includes("application/json")) {
      const json = (await res.json()) as {
        line?: string;
        text?: string;
        source?: string;
        axis?: TAxis;
        model?: string;
        fallbackReason?: string;
      };
      const text = (json.text ?? json.line ?? "").trim();
      const axis = json.axis ?? params.hintAxis;
      if (text && json.source !== "canonical_fallback") {
        callbacks.onMeta?.({ axis, onAxis: true, model: json.model });
        callbacks.onDelta?.(text, text);
        return {
          source: "llm",
          axis,
          text,
          latencyMs: Date.now() - startedAt,
          model: json.model,
          signalGlitch: false
        };
      }
      return makeFallback(json.fallbackReason ?? "JSON_FALLBACK", axis, text || params.fallbackLine, json.model);
    }

    if (!res.body) {
      return makeFallback("EMPTY_STREAM");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let resolvedAxis: TAxis = params.hintAxis;
    let resolvedModel: string | undefined;
    let accumulated = "";
    let finalResult: InterrogateClientResult<TAxis> | null = null;
    let sawFallback = false;

    const processEventBlock = (block: string) => {
      let eventName = "message";
      const dataLines: string[] = [];
      for (const rawLine of block.split(/\r?\n/)) {
        if (rawLine.startsWith("event:")) {
          eventName = rawLine.slice(6).trim();
        } else if (rawLine.startsWith("data:")) {
          dataLines.push(rawLine.slice(5).trim());
        }
      }
      if (dataLines.length === 0) return;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
      } catch {
        return;
      }

      if (eventName === "meta") {
        if (typeof data.axis === "string") resolvedAxis = data.axis as TAxis;
        if (typeof data.model === "string") resolvedModel = data.model;
        callbacks.onMeta?.({
          axis: resolvedAxis,
          onAxis: Boolean(data.onAxis),
          model: resolvedModel
        });
      } else if (eventName === "delta") {
        const piece = typeof data.text === "string" ? data.text : "";
        if (piece) {
          accumulated += piece;
          callbacks.onDelta?.(piece, accumulated);
        }
      } else if (eventName === "fallback") {
        sawFallback = true;
        const reason = typeof data.reason === "string" ? data.reason : "FALLBACK";
        const line = typeof data.line === "string" ? data.line : params.fallbackLine;
        const axis = typeof data.axis === "string" ? (data.axis as TAxis) : resolvedAxis;
        resolvedAxis = axis;
        callbacks.onFallback?.({ reason, axis, line });
      } else if (eventName === "done") {
        const axis = typeof data.axis === "string" ? (data.axis as TAxis) : resolvedAxis;
        const text = typeof data.text === "string" ? data.text : accumulated || params.fallbackLine;
        const source = data.source === "llm" ? "llm" : "canonical_fallback";
        const model = typeof data.model === "string" ? data.model : resolvedModel;
        const fallbackReason =
          typeof data.fallbackReason === "string" ? data.fallbackReason : undefined;
        finalResult = {
          source,
          axis,
          text,
          latencyMs: Date.now() - startedAt,
          model,
          fallbackReason,
          signalGlitch: sawFallback && fallbackReason !== "NO_GATEWAY_KEY"
        };
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sepIdx = buffer.indexOf("\n\n");
      while (sepIdx !== -1) {
        const block = buffer.slice(0, sepIdx).trim();
        buffer = buffer.slice(sepIdx + 2);
        if (block) processEventBlock(block);
        sepIdx = buffer.indexOf("\n\n");
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      processEventBlock(buffer.trim());
    }

    if (finalResult) return finalResult;
    if (accumulated.trim()) {
      return {
        source: "llm",
        axis: resolvedAxis,
        text: accumulated.trim(),
        latencyMs: Date.now() - startedAt,
        model: resolvedModel,
        signalGlitch: false
      };
    }
    return makeFallback("INCOMPLETE_STREAM");
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return makeFallback(isAbort ? "TIMEOUT" : "NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
    opts?.signal?.removeEventListener("abort", onParentAbort);
  }
}
