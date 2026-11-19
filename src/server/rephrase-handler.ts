import {
  buildFlashRephraseMessages,
  extractChatCompletionText,
  hasIdentityLeakage,
  normalizeChatCompletionsUrl,
  validateRephrasedLine
} from "../game/rephrase.js";
import type { LlmRephraseInput, Locale } from "../game/types.js";
import { isValueToken } from "../ordamor/index.js";

export interface ServerFlashProvider {
  provider: "custom" | "vercel_ai_gateway" | "google_gemini";
  url: string;
  apiKey: string;
  model: string;
}

/**
 * Resolves the upstream OpenAI-compatible Flash endpoint from environment variables.
 * Compatible with:
 * 1. `FLASH_BASE_URL` (+ optional `FLASH_API_KEY`, `FLASH_MODEL`) — e.g. local proxy or OpenRouter
 * 2. `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` — Vercel AI Gateway (`google/gemini-3.8-flash`, matching `ordamor`)
 * 3. `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` — Google Gemini OpenAI-compatible endpoint (`gemini-2.5-flash`)
 */
export function resolveServerFlashProvider(
  env: Record<string, string | undefined>
): ServerFlashProvider | null {
  if (env.FLASH_BASE_URL?.trim()) {
    return {
      provider: "custom",
      url: normalizeChatCompletionsUrl(env.FLASH_BASE_URL),
      apiKey: env.FLASH_API_KEY?.trim() ?? "",
      model: env.FLASH_MODEL?.trim() || "google/gemini-3.8-flash"
    };
  }

  const gatewayKey = env.AI_GATEWAY_API_KEY?.trim() || env.VERCEL_OIDC_TOKEN?.trim();
  if (gatewayKey) {
    return {
      provider: "vercel_ai_gateway",
      url: "https://ai-gateway.vercel.sh/v1/chat/completions",
      apiKey: gatewayKey,
      model: env.FLASH_MODEL?.trim() || "google/gemini-3.8-flash"
    };
  }

  const geminiKey =
    env.GEMINI_API_KEY?.trim() || env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (geminiKey) {
    return {
      provider: "google_gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: geminiKey,
      model: env.FLASH_MODEL?.trim() || "gemini-2.5-flash"
    };
  }

  return null;
}

const VALID_LOCALES = new Set<Locale>(["zh", "en", "ja"]);

export function parseAndValidateRephraseRequest(
  rawBody: unknown
): { ok: true; input: LlmRephraseInput } | { ok: false; status: number; error: string } {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return { ok: false, status: 400, error: "INVALID_JSON_OBJECT" };
  }

  const leakedKey = hasIdentityLeakage(rawBody);
  if (leakedKey) {
    return {
      ok: false,
      status: 400,
      error: `IDENTITY_LEAKAGE_REJECTED: forbidden field "${leakedKey}" must never be sent to the rephrase layer`
    };
  }

  const obj = rawBody as Record<string, unknown>;
  const speaker = typeof obj.speaker === "string" ? obj.speaker.trim().slice(0, 80) : "";
  const role = typeof obj.role === "string" ? obj.role.trim().slice(0, 80) : "Survivor";
  const persona_voice =
    typeof obj.persona_voice === "string" ? obj.persona_voice.trim().slice(0, 200) : "";
  const question = typeof obj.question === "string" ? obj.question.trim() : "";
  const canonical_line =
    typeof obj.canonical_line === "string" ? obj.canonical_line.trim() : "";
  const locale = obj.locale as Locale;

  if (!speaker || !persona_voice || !question || !canonical_line) {
    return {
      ok: false,
      status: 400,
      error: "MISSING_REQUIRED_FIELDS: speaker, persona_voice, question, canonical_line"
    };
  }
  if (question.length > 300 || canonical_line.length > 600) {
    return { ok: false, status: 400, error: "INPUT_TOO_LONG" };
  }
  if (!VALID_LOCALES.has(locale)) {
    return { ok: false, status: 400, error: "INVALID_LOCALE" };
  }

  const rawStance = obj.stance;
  if (!rawStance || typeof rawStance !== "object" || Array.isArray(rawStance)) {
    return { ok: false, status: 400, error: "MISSING_STANCE" };
  }
  const st = rawStance as Record<string, unknown>;
  const choose = st.choose === null ? null : typeof st.choose === "string" && isValueToken(st.choose) ? st.choose : undefined;
  const over = st.over === null ? null : typeof st.over === "string" && isValueToken(st.over) ? st.over : undefined;

  if (choose === undefined || over === undefined) {
    return { ok: false, status: 400, error: "INVALID_STANCE_FIELDS" };
  }

  return {
    ok: true,
    input: {
      speaker,
      role,
      persona_voice,
      question,
      canonical_line,
      stance: {
        choose,
        over
      },
      locale,
      max_sentences: 2
    }
  };
}

export interface ServerRephraseResponse {
  status: number;
  body: {
    status: "OK" | "FALLBACK" | "ERROR";
    line?: string;
    source?: "flash" | "canonical_fallback";
    provider?: string;
    model?: string;
    latencyMs?: number;
    fallbackReason?: string;
    error?: string;
  };
}

export async function executeServerRephrase(
  rawBody: unknown,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch
): Promise<ServerRephraseResponse> {
  const parsed = parseAndValidateRephraseRequest(rawBody);
  if (!parsed.ok) {
    return {
      status: parsed.status,
      body: { status: "ERROR", error: parsed.error }
    };
  }

  const { input } = parsed;
  const provider = resolveServerFlashProvider(env);
  if (!provider) {
    return {
      status: 200,
      body: {
        status: "FALLBACK",
        line: input.canonical_line,
        source: "canonical_fallback",
        latencyMs: 0,
        fallbackReason: "NO_SERVER_API_KEY"
      }
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeoutMs = Math.min(8000, Math.max(800, Number(env.FLASH_TIMEOUT_MS) || 3200));
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (provider.apiKey) {
      headers.Authorization = `Bearer ${provider.apiKey}`;
    }

    const upstream = await fetchImpl(provider.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.35,
        max_tokens: 180,
        messages: buildFlashRephraseMessages(input)
      }),
      signal: controller.signal
    });
    const latencyMs = Date.now() - started;

    if (!upstream.ok) {
      return {
        status: 200,
        body: {
          status: "FALLBACK",
          line: input.canonical_line,
          source: "canonical_fallback",
          provider: provider.provider,
          model: provider.model,
          latencyMs,
          fallbackReason: `UPSTREAM_HTTP_${upstream.status}`
        }
      };
    }

    const data = (await upstream.json()) as unknown;
    const rawText = extractChatCompletionText(data);
    if (!rawText) {
      return {
        status: 200,
        body: {
          status: "FALLBACK",
          line: input.canonical_line,
          source: "canonical_fallback",
          provider: provider.provider,
          model: provider.model,
          latencyMs,
          fallbackReason: "EMPTY_UPSTREAM_COMPLETION"
        }
      };
    }

    const checked = validateRephrasedLine(rawText, input);
    if (!checked.ok) {
      return {
        status: 200,
        body: {
          status: "FALLBACK",
          line: input.canonical_line,
          source: "canonical_fallback",
          provider: provider.provider,
          model: provider.model,
          latencyMs,
          fallbackReason: checked.reason
        }
      };
    }

    return {
      status: 200,
      body: {
        status: "OK",
        line: checked.line,
        source: "flash",
        provider: provider.provider,
        model: provider.model,
        latencyMs
      }
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      status: 200,
      body: {
        status: "FALLBACK",
        line: input.canonical_line,
        source: "canonical_fallback",
        provider: provider.provider,
        model: provider.model,
        latencyMs,
        fallbackReason: isAbort ? "UPSTREAM_TIMEOUT" : "UPSTREAM_NETWORK_ERROR"
      }
    };
  } finally {
    clearTimeout(timer);
  }
}
