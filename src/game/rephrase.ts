import type {
  FlashRephraseConfig,
  LlmRephraseInput,
  Locale,
  RephraseOutcome
} from "./types.js";

/**
 * Hidden engine fields that MUST NEVER enter `LlmRephraseInput` or cross the network boundary.
 */
export const FORBIDDEN_LEAK_KEYS = [
  "isMimic",
  "wasMimic",
  "defectMode",
  "lineKey",
  "defectPool",
  "roll",
  "tell_level",
  "tellLevel",
  "justification_style"
] as const;

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_LEAK_KEYS);

export function hasIdentityLeakage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const hit = hasIdentityLeakage(item);
      if (hit) return hit;
    }
    return null;
  }
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (FORBIDDEN_SET.has(key)) return key;
    const nested = hasIdentityLeakage(value);
    if (nested) return nested;
  }
  return null;
}

export const VERCEL_PRODUCTION_REPHRASE_URL =
  "https://quarantine-gate-0.vercel.app/api/rephrase";

export const DEFAULT_FLASH_CONFIG: FlashRephraseConfig = {
  enabled: false,
  mode: "server_proxy",
  proxyPath: "/api/rephrase",
  endpointUrl: "",
  apiKey: "",
  model: "google/gemini-3.8-flash",
  timeoutMs: 3600,
  freeTextOnly: true
};

/**
 * Resolves host-aware initial Flash configuration:
 * - On Vercel (`*.vercel.app`), enables `/api/rephrase` same-origin proxy by default.
 * - On GitHub Pages (`*.github.io`), enables Flash and routes directly to the CORS-enabled
 *   Vercel production endpoint (`https://quarantine-gate-0.vercel.app/api/rephrase`).
 * - On Tauri desktop (`tauri.localhost`), points `proxyPath` to Vercel production while keeping
 *   offline-first default until toggled on.
 * - On `localhost` / Vitest (`happy-dom`), preserves deterministic offline `DEFAULT_FLASH_CONFIG`.
 */
export function resolveInitialFlashConfig(hostname?: string, protocol?: string): FlashRephraseConfig {
  const host =
    hostname ??
    (typeof window !== "undefined" ? window.location?.hostname ?? "" : "");
  const proto =
    protocol ??
    (typeof window !== "undefined" ? window.location?.protocol ?? "" : "");

  if (host.endsWith(".vercel.app")) {
    return {
      ...DEFAULT_FLASH_CONFIG,
      enabled: true,
      proxyPath: "/api/rephrase"
    };
  }

  if (host.endsWith(".github.io")) {
    return {
      ...DEFAULT_FLASH_CONFIG,
      enabled: true,
      proxyPath: VERCEL_PRODUCTION_REPHRASE_URL
    };
  }

  if (proto === "tauri:" || host === "tauri.localhost") {
    return {
      ...DEFAULT_FLASH_CONFIG,
      enabled: false,
      proxyPath: VERCEL_PRODUCTION_REPHRASE_URL
    };
  }

  return { ...DEFAULT_FLASH_CONFIG };
}

const LOCALE_LABELS: Record<Locale, string> = {
  zh: "Simplified Chinese (简体中文)",
  en: "English",
  ja: "Japanese (日本語)"
};

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Constructs the zero-leakage prompt for a Flash-class model (`gemini-3.8-flash` / `gemini-2.5-flash`).
 * The model sees ONLY the pre-decided `canonical_line`, `stance`, `persona_voice`, and player `question`.
 */
export function buildFlashRephraseMessages(input: LlmRephraseInput): ChatMessage[] {
  const leak = hasIdentityLeakage(input);
  if (leak) {
    throw new Error(`Identity leakage blocked in buildFlashRephraseMessages: "${leak}"`);
  }

  const stanceConstraint =
    input.stance.choose && input.stance.over
      ? `Value priority locked: uphold "${input.stance.choose}" over "${input.stance.over}". Never flip or soften this choice.`
      : "Preserve the exact rhetorical stance and factual framing of CANONICAL_LINE without softening or adding new claims.";

  const system = [
    "You rewrite spoken intercom lines for a claustrophobic Svalbard -46°C quarantine booth game (Quarantine Gate 0: 2036).",
    "You are given a pre-approved CANONICAL_LINE and the operator's exact QUESTION.",
    "Rewrite CANONICAL_LINE so it directly and naturally answers the operator's exact wording while preserving 100% of its decision, factual claims, emotional tell, and excuse structure.",
    stanceConstraint,
    `Output language MUST be ${LOCALE_LABELS[input.locale]}.`,
    `Hard limits: at most ${input.max_sentences} short spoken sentences. Output ONLY the spoken line itself (an optional brief physical cue in parentheses at the start is allowed). No quotes around the whole line, no JSON, no markdown, no commentary.`
  ].join("\n");

  const user = JSON.stringify(
    {
      speaker: input.speaker,
      role: input.role,
      persona_voice: input.persona_voice,
      locale: input.locale,
      operator_question: input.question,
      canonical_line: input.canonical_line,
      stance: input.stance
    },
    null,
    2
  );

  return [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
}

const META_LEAK_RE =
  /\b(as an ai|language model|large language model|openai|anthropic|claude|gemini|isMimic|defectMode|mimic_say|mimic_disp|canonical_line)\b|作为(一个|一名)?\s*AI|语言模型|大语言模型/i;

export function validateRephrasedLine(
  rawCandidate: string,
  input: LlmRephraseInput
): { ok: boolean; line: string; reason?: string } {
  let cleaned = rawCandidate
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Strip accidental speaker label prefix or wrapping quotes
  cleaned = cleaned.replace(/^\[[^\]]{1,24}\]\s*[:：]\s*/, "");
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("“") && cleaned.endsWith("”")) ||
    (cleaned.startsWith("「") && cleaned.endsWith("」"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  if (cleaned.length < 4) {
    return { ok: false, line: input.canonical_line, reason: "EMPTY_OUTPUT" };
  }

  const maxChars = input.locale === "en" ? 360 : 240;
  if (cleaned.length > maxChars) {
    return { ok: false, line: input.canonical_line, reason: "TOO_LONG" };
  }

  // Count sentence-final punctuation (excluding ellipses)
  const withoutEllipses = cleaned.replace(/\.{2,}|…+/g, "");
  const sentenceCount = (withoutEllipses.match(/[。！？!?]|(?<!\d)\.(?!\d)/g) ?? []).length;
  if (sentenceCount > 3) {
    return { ok: false, line: input.canonical_line, reason: "TOO_MANY_SENTENCES" };
  }

  if (META_LEAK_RE.test(cleaned)) {
    return { ok: false, line: input.canonical_line, reason: "META_LEAK" };
  }

  if (input.locale === "zh" && !/[\u4e00-\u9fff]/.test(cleaned)) {
    return { ok: false, line: input.canonical_line, reason: "LOCALE_MISMATCH" };
  }
  if (input.locale === "ja" && !/[\u3040-\u30ff]/.test(cleaned)) {
    return { ok: false, line: input.canonical_line, reason: "LOCALE_MISMATCH" };
  }
  if (input.locale === "en" && !/[a-zA-Z]{3,}/.test(cleaned)) {
    return { ok: false, line: input.canonical_line, reason: "LOCALE_MISMATCH" };
  }

  return { ok: true, line: cleaned };
}

export function extractChatCompletionText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const msg = (choices[0] as { message?: { content?: unknown } } | undefined)?.message;
  if (!msg) return null;
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.content)) {
    return msg.content
      .map((part) =>
        part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : ""
      )
      .join("");
  }
  return null;
}

export function normalizeChatCompletionsUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1") || trimmed.endsWith("/openai")) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
}

/**
 * Client-side Flash rephrase caller with strict timeout and deterministic fallback.
 * Never throws: any network, timeout, or validation failure cleanly returns `input.canonical_line`.
 */
export async function requestFlashRephrase(
  input: LlmRephraseInput,
  config: FlashRephraseConfig,
  fetchImpl: typeof fetch = fetch
): Promise<RephraseOutcome> {
  const leak = hasIdentityLeakage(input);
  if (leak) {
    return {
      line: input.canonical_line,
      source: "canonical_fallback",
      latencyMs: 0,
      fallbackReason: `CLIENT_LEAK_BLOCKED:${leak}`
    };
  }

  if (!config.enabled || !input.canonical_line.trim()) {
    return {
      line: input.canonical_line,
      source: "offline",
      latencyMs: 0
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(500, config.timeoutMs));

  try {
    if (config.mode === "server_proxy") {
      const primaryUrl = config.proxyPath || "/api/rephrase";
      let res = await fetchImpl(primaryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal
      });
      if (
        (res.status === 404 || res.status === 405) &&
        primaryUrl !== VERCEL_PRODUCTION_REPHRASE_URL
      ) {
        res = await fetchImpl(VERCEL_PRODUCTION_REPHRASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal
        });
      }
      const latencyMs = Date.now() - started;
      if (!res.ok) {
        return {
          line: input.canonical_line,
          source: "canonical_fallback",
          latencyMs,
          fallbackReason: `HTTP_${res.status}`
        };
      }
      const data = (await res.json()) as {
        line?: string;
        source?: "flash" | "canonical_fallback";
        model?: string;
        fallbackReason?: string;
      };
      if (data.source === "flash" && typeof data.line === "string") {
        const checked = validateRephrasedLine(data.line, input);
        if (!checked.ok) {
          return {
            line: input.canonical_line,
            source: "canonical_fallback",
            latencyMs,
            model: data.model,
            fallbackReason: checked.reason
          };
        }
        return {
          line: checked.line,
          source: "flash",
          latencyMs,
          model: data.model
        };
      }
      return {
        line: input.canonical_line,
        source: "canonical_fallback",
        latencyMs,
        model: data.model,
        fallbackReason: data.fallbackReason ?? "PROXY_FALLBACK"
      };
    }

    // Direct OpenAI-compatible endpoint mode (e.g. local gateway or BYOK)
    const targetUrl = normalizeChatCompletionsUrl(config.endpointUrl);
    if (!targetUrl) {
      return {
        line: input.canonical_line,
        source: "canonical_fallback",
        latencyMs: 0,
        fallbackReason: "MISSING_ENDPOINT_URL"
      };
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (config.apiKey.trim()) {
      headers.Authorization = `Bearer ${config.apiKey.trim()}`;
    }

    const res = await fetchImpl(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model.trim() || "google/gemini-3.8-flash",
        temperature: 0.35,
        max_tokens: 180,
        messages: buildFlashRephraseMessages(input)
      }),
      signal: controller.signal
    });
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      return {
        line: input.canonical_line,
        source: "canonical_fallback",
        latencyMs,
        model: config.model,
        fallbackReason: `UPSTREAM_HTTP_${res.status}`
      };
    }

    const payload = (await res.json()) as unknown;
    const rawText = extractChatCompletionText(payload);
    if (!rawText) {
      return {
        line: input.canonical_line,
        source: "canonical_fallback",
        latencyMs,
        model: config.model,
        fallbackReason: "INVALID_COMPLETION_BODY"
      };
    }

    const checked = validateRephrasedLine(rawText, input);
    if (!checked.ok) {
      return {
        line: input.canonical_line,
        source: "canonical_fallback",
        latencyMs,
        model: config.model,
        fallbackReason: checked.reason
      };
    }

    return {
      line: checked.line,
      source: "flash",
      latencyMs,
      model: config.model
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      line: input.canonical_line,
      source: "canonical_fallback",
      latencyMs,
      fallbackReason: isAbort ? "TIMEOUT" : "NETWORK_ERROR"
    };
  } finally {
    clearTimeout(timer);
  }
}
