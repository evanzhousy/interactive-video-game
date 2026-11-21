import { describe, expect, it } from "vitest";
import { streamInterrogateTurn } from "../src/game/interrogate-client.js";
import { loadOrGenerateSeededVisitors } from "../src/game/seeded-client.js";
import {
  buildSeededSkeletons,
  generateProceduralVisitors,
  validateGeneratedVisitorSpec
} from "../src/game/seeded-visitors.js";
import { VALUE_TOKENS, isValueToken } from "../src/ordamor/index.js";
import { handleGenerateVisitorsWebRequest } from "../src/server/generate-visitors-handler.js";
import {
  handleInterrogateWebRequest,
  type StreamTextChunkFn
} from "../src/server/interrogate-handler.js";

describe("Phase 2: Seeded Dynamic Ordamor Visitor Generator & Zero-Leakage Interrogation", () => {
  it("generates deterministic, invariant-valid Ordamor v6 rosters across diverse seeds using only closed VALUE_TOKENS", () => {
    const seeds = ["SVALBARD-2036", "ARCTIC-007", "POLAR-STORM-99", "NAUTILUS-ALPHA", "GATE-0-DEMO"];

    for (const seed of seeds) {
      const rosterA = generateProceduralVisitors(seed);
      const rosterB = generateProceduralVisitors(seed);
      expect(rosterA).toEqual(rosterB);
      expect(rosterA).toHaveLength(8);
      expect(rosterA.map((v) => v.night)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);

      for (const v of rosterA) {
        const check = validateGeneratedVisitorSpec(v);
        expect(check.errors).toEqual([]);
        expect(check.ok).toBe(true);

        // Strictly closed 13 VALUE_TOKENS (Red Line 2)
        for (const ord of v.profile.valueOrderings) {
          expect(isValueToken(ord.pair[0])).toBe(true);
          expect(isValueToken(ord.pair[1])).toBe(true);
          expect(isValueToken(ord.winner)).toBe(true);
          expect(VALUE_TOKENS).toContain(ord.winner);
        }
      }
    }

    // Distinct seeds yield distinct survivor identities / conflict orderings
    const s1 = generateProceduralVisitors("SEED-ONE-111");
    const s2 = generateProceduralVisitors("SEED-TWO-222");
    expect(s1[0]!.name.en !== s2[0]!.name.en || s1[0]!.profile.valueOrderings[0]!.winner !== s2[0]!.profile.valueOrderings[0]!.winner).toBe(true);
  });

  it("hydrates LLM-written visitor JSON via /api/generate-visitors with retry and graceful offline fallback", async () => {
    // 1. Offline / missing gateway key -> immediate procedural_fallback with 8 valid visitors
    const offlineRes = await handleGenerateVisitorsWebRequest(
      new Request("https://quarantine-gate-0.vercel.app/api/generate-visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: "OFFLINE-SEED-1", locale: "zh" })
      }),
      {}
    );
    expect(offlineRes.status).toBe(200);
    const offlineJson = (await offlineRes.json()) as {
      ok: boolean;
      source: string;
      visitors: ReturnType<typeof generateProceduralVisitors>;
    };
    expect(offlineJson.ok).toBe(true);
    expect(offlineJson.source).toBe("procedural_fallback");
    expect(offlineJson.visitors).toHaveLength(8);
    expect(offlineJson.visitors.every((v) => validateGeneratedVisitorSpec(v).ok)).toBe(true);

    // 2. Mocked Claude response: attempt 1 malformed -> retries on attempt 2 -> succeeds!
    const skeletons = buildSeededSkeletons("CLAUDE-SEED-42");
    let calls = 0;
    const llmPatches = skeletons.map((sk, i) => ({
      id: sk.slot.id,
      name: { zh: `冰站测试员#${i + 1}` },
      role: { zh: `极地特种岗 #${i + 1}` },
      voice: "tense, icy, precise; measures every syllable",
      openingLine: { zh: `「${sk.slot.id} 报到，门外零下四十六度，快开门。」` },
      observations: [
        { id: "o-01", source: "极地卷宗", kw: { zh: "强封气密门" }, text: { zh: `在冰芯走廊优先保住了核心利益。` } },
        { id: "o-02", source: "事后审计", kw: { zh: "改写日志" }, text: { zh: `事后调整了值班交接单。` } },
        { id: "o-03", source: "入站访谈", kw: { zh: "公开标榜" }, text: { zh: `宣称自己永远坚守高尚原则。` } }
      ]
    }));

    const onlineRes = await handleGenerateVisitorsWebRequest(
      new Request("https://quarantine-gate-0.vercel.app/api/generate-visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: "CLAUDE-SEED-42", locale: "zh" })
      }),
      { AI_GATEWAY_API_KEY: "gw-test-key" },
      {
        generateJsonText: async () => {
          calls += 1;
          if (calls === 1) return "NOT VALID JSON";
          return JSON.stringify(llmPatches);
        }
      }
    );

    expect(calls).toBe(2);
    expect(onlineRes.status).toBe(200);
    const onlineJson = (await onlineRes.json()) as {
      ok: boolean;
      source: string;
      attempts: number;
      llmHydratedCount: number;
      visitors: ReturnType<typeof generateProceduralVisitors>;
    };
    expect(onlineJson.source).toBe("llm");
    expect(onlineJson.attempts).toBe(2);
    expect(onlineJson.llmHydratedCount).toBe(8);
    expect(onlineJson.visitors[0]!.name.zh).toBe("冰站测试员#1");
    expect(onlineJson.visitors.every((v) => validateGeneratedVisitorSpec(v).ok)).toBe(true);

    // 3. Client helper loads cleanly from API and streams interrogation against /api/interrogate with ZERO identity leakage
    const loaded = await loadOrGenerateSeededVisitors({
      seed: "CLAUDE-SEED-42",
      locale: "zh",
      allowOnline: true,
      fetchImpl: async () =>
        new Response(JSON.stringify(onlineJson), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
    });
    expect(loaded.source).toBe("llm");
    expect(loaded.visitors[0]!.name.zh).toBe("冰站测试员#1");

    const okStream: StreamTextChunkFn = async function* ({ systemPrompt }) {
      // Confirm custom LLM-generated visitor name entered prompt with zero leakage
      expect(systemPrompt).toContain("冰站测试员#1");
      expect(systemPrompt).not.toContain("isMimic");
      expect(systemPrompt).not.toContain("defectPool");
      yield "⟦dilemma⟧\n";
      yield "零下四十六度里，先保命有什么错？";
    };

    const turnRes = await streamInterrogateTurn(
      {
        stage: "booth",
        runSeed: "CLAUDE-SEED-42",
        campaignMode: "seeded",
        visitorId: "V-01",
        customVisitor: loaded.visitors[0]!,
        locale: "zh",
        question: "冰芯走廊你为什么先封门？",
        hintAxis: "dilemma",
        history: [],
        fallbackLine: "离线保底"
      },
      {},
      {
        fetchImpl: async (url, init) =>
          handleInterrogateWebRequest(
            new Request(`https://quarantine-gate-0.vercel.app${String(url)}`, init),
            { AI_GATEWAY_API_KEY: "gw-test-key" },
            { streamChunks: okStream }
          )
      }
    );

    expect(turnRes.source).toBe("llm");
    expect(turnRes.axis).toBe("dilemma");
    expect(turnRes.text).toContain("先保命有什么错");
  });
});
