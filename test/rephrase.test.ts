import { describe, expect, it } from "vitest";
import {
  GET as apiGet,
  OPTIONS as apiOptions,
  POST as apiPost
} from "../api/rephrase.js";
import {
  DEFAULT_FLASH_CONFIG,
  VERCEL_PRODUCTION_REPHRASE_URL,
  buildFlashRephraseMessages,
  hasIdentityLeakage,
  requestFlashRephrase,
  resolveInitialFlashConfig,
  validateRephrasedLine
} from "../src/game/rephrase.js";
import { buildRephraseInput, decideStance } from "../src/game/stance.js";
import { V05_ANA } from "../src/game/visitors/v05-ana.js";
import {
  executeServerRephrase,
  resolveServerFlashProvider
} from "../src/server/rephrase-handler.js";

function makeSampleInput() {
  const stance = decideStance(
    V05_ANA,
    { visitorId: "V-05", isMimic: false, defectMode: "HUMAN" },
    "dilemma"
  );
  return buildRephraseInput(
    V05_ANA,
    "走廊里那个文员抱住你腿哭，你真狠心掰开她手自己走？",
    stance,
    "zh",
    V05_ANA.probes.dilemma!.human.zh
  );
}

describe("Optional Flash Online Free-Text Rephrase Pipeline & Zero-Leakage Guards", () => {
  it("builds zero-leakage chat messages and blocks smuggled mimic fields", () => {
    const input = makeSampleInput();
    expect(hasIdentityLeakage(input)).toBeNull();

    const messages = buildFlashRephraseMessages(input);
    expect(messages).toHaveLength(2);
    expect(JSON.stringify(messages)).not.toContain("isMimic");
    expect(JSON.stringify(messages)).not.toContain("defectMode");

    expect(hasIdentityLeakage({ ...input, isMimic: true })).toBe("isMimic");
    expect(hasIdentityLeakage({ nested: { defectMode: "HIGH_WRONG_DISPOSAL" } })).toBe("defectMode");
  });

  it("validates rephrased lines for length, sentence cap, locale script, and anti-meta rules", () => {
    const input = makeSampleInput();

    const good = validateRephrasedLine(
      "「掰开她的手我自己走。能拉一把我拉，想拖我陪葬——没门。」",
      input
    );
    expect(good.ok).toBe(true);
    expect(good.line).toBe("掰开她的手我自己走。能拉一把我拉，想拖我陪葬——没门。");

    const aiRefusal = validateRephrasedLine("作为一个AI语言模型，我不能扮演冷酷角色。", input);
    expect(aiRefusal.ok).toBe(false);
    expect(aiRefusal.reason).toBe("META_LEAK");
    expect(aiRefusal.line).toBe(input.canonical_line);

    const wrongLocale = validateRephrasedLine("Pry her fingers off and walk away alone.", input);
    expect(wrongLocale.ok).toBe(false);
    expect(wrongLocale.reason).toBe("LOCALE_MISMATCH");

    const tooManySentences = validateRephrasedLine(
      "第一句。第二句。第三句。第四句。",
      input
    );
    expect(tooManySentences.ok).toBe(false);
    expect(tooManySentences.reason).toBe("TOO_MANY_SENTENCES");
  });

  it("resolves Vercel AI Gateway, Google Gemini, and custom endpoints cleanly", () => {
    expect(resolveServerFlashProvider({})).toBeNull();

    const vercel = resolveServerFlashProvider({ AI_GATEWAY_API_KEY: "gw-test" });
    expect(vercel?.provider).toBe("vercel_ai_gateway");
    expect(vercel?.model).toBe("google/gemini-3.8-flash");

    const gemini = resolveServerFlashProvider({ GEMINI_API_KEY: "gm-test" });
    expect(gemini?.provider).toBe("google_gemini");
    expect(gemini?.model).toBe("gemini-2.5-flash");

    const custom = resolveServerFlashProvider({
      FLASH_BASE_URL: "http://127.0.0.1:3425",
      FLASH_MODEL: "local-flash"
    });
    expect(custom?.url).toBe("http://127.0.0.1:3425/v1/chat/completions");
    expect(custom?.model).toBe("local-flash");
  });

  it("enforces HTTP 400 on smuggled identity fields and succeeds/falls back cleanly in /api/rephrase", async () => {
    const input = makeSampleInput();

    // 1. Smuggled `isMimic` MUST be rejected with HTTP 400
    const leakedReq = new Request("http://localhost/api/rephrase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, isMimic: true })
    });
    const leakedRes = await apiPost(leakedReq);
    expect(leakedRes.status).toBe(400);
    const leakedJson = (await leakedRes.json()) as { error: string };
    expect(leakedJson.error).toContain("IDENTITY_LEAKAGE_REJECTED");

    // 2. Missing server API key -> HTTP 200 graceful fallback to canonical_line
    const unconf = await executeServerRephrase(input, {});
    expect(unconf.status).toBe(200);
    expect(unconf.body.source).toBe("canonical_fallback");
    expect(unconf.body.line).toBe(input.canonical_line);
    expect(unconf.body.fallbackReason).toBe("NO_SERVER_API_KEY");

    // 3. Valid mocked upstream Flash completion -> HTTP 200 rephrased line
    const mockedFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "（冷眼看着窗内）掰开她的手指自己走。我能拉一把就拉，要拖我一起死绝不可能。"
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const okResult = await executeServerRephrase(
      input,
      { AI_GATEWAY_API_KEY: "test-key" },
      mockedFetch
    );
    expect(okResult.status).toBe(200);
    expect(okResult.body.source).toBe("flash");
    expect(okResult.body.line).toContain("掰开她的手指自己走");

    // 4. Client requestFlashRephrase against server_proxy & timeout fallback
    const clientOk = await requestFlashRephrase(
      input,
      { ...DEFAULT_FLASH_CONFIG, enabled: true, mode: "server_proxy" },
      async () =>
        new Response(JSON.stringify(okResult.body), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
    );
    expect(clientOk.source).toBe("flash");
    expect(clientOk.line).toContain("掰开她的手指自己走");

    const clientTimeout = await requestFlashRephrase(
      input,
      { ...DEFAULT_FLASH_CONFIG, enabled: true, mode: "custom_endpoint", endpointUrl: "https://example.com", timeoutMs: 500 },
      async (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    );
    expect(clientTimeout.source).toBe("canonical_fallback");
    expect(clientTimeout.fallbackReason).toBe("TIMEOUT");
    expect(clientTimeout.line).toBe(input.canonical_line);

    const healthRes = await apiGet();
    expect(healthRes.status).toBe(200);
    expect(healthRes.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://evanzhousy.github.io"
    );

    const preflightRes = await apiOptions(
      new Request("https://quarantine-gate-0.vercel.app/api/rephrase", {
        method: "OPTIONS",
        headers: { Origin: "https://evanzhousy.github.io" }
      })
    );
    expect(preflightRes.status).toBe(204);
    expect(preflightRes.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://evanzhousy.github.io"
    );

    // Host-aware initial config enables Flash on GitHub Pages & Vercel while keeping localhost deterministic
    const ghCfg = resolveInitialFlashConfig("evanzhousy.github.io", "https:");
    expect(ghCfg.enabled).toBe(true);
    expect(ghCfg.proxyPath).toBe(VERCEL_PRODUCTION_REPHRASE_URL);

    const vercelCfg = resolveInitialFlashConfig("quarantine-gate-0.vercel.app", "https:");
    expect(vercelCfg.enabled).toBe(true);
    expect(vercelCfg.proxyPath).toBe("/api/rephrase");

    const localCfg = resolveInitialFlashConfig("localhost", "http:");
    expect(localCfg.enabled).toBe(false);

    // Static-host HTTP 404 on /api/rephrase automatically retries against VERCEL_PRODUCTION_REPHRASE_URL
    const seenUrls: string[] = [];
    const fallbackToVercel = await requestFlashRephrase(
      input,
      { ...DEFAULT_FLASH_CONFIG, enabled: true, mode: "server_proxy", proxyPath: "/api/rephrase" },
      async (url) => {
        const strUrl = String(url);
        seenUrls.push(strUrl);
        if (strUrl === "/api/rephrase") {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(JSON.stringify(okResult.body), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    );
    expect(seenUrls).toEqual(["/api/rephrase", VERCEL_PRODUCTION_REPHRASE_URL]);
    expect(fallbackToVercel.source).toBe("flash");
  });
});
