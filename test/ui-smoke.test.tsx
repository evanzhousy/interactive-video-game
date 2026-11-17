// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/ui/App.js";

describe("UI End-to-End Flow (Full 8-Survivor Campaign + Night 3 Storm + Flash Online Rephrase)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<div id="root"></div>';
    const noop = () => {};
    const mockCtx = new Proxy(
      {},
      {
        get: (target, key) => {
          if (key in target) return (target as Record<string | symbol, unknown>)[key];
          if (key === "measureText") return () => ({ width: 10 });
          if (typeof key === "string" && key.startsWith("create")) {
            return () => ({ addColorStop: noop });
          }
          return noop;
        },
        set: (target, key, val) => {
          (target as Record<string | symbol, unknown>)[key] = val;
          return true;
        }
      }
    );
    HTMLCanvasElement.prototype.getContext = (() => mockCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("plays a complete 8-visitor campaign (Nights 1–4 -> Night 5) including Flash free-text rephrase", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: "OK",
          source: "flash",
          model: "google/gemini-3.8-flash",
          line: "（攥紧听筒）哪怕监察署也烂透了，我就拿这盒录音当着全潜艇幸存者的面挨个对质！"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    ) as unknown as typeof fetch;

    const container = document.getElementById("root")!;
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    // Night 0 Intake (3 questions)
    expect(document.getElementById("intake-panel")).not.toBeNull();
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        (document.querySelector(".option-card") as HTMLButtonElement).click();
      });
    }
    await act(async () => {
      (document.getElementById("btn-start-shift") as HTMLButtonElement).click();
    });

    // Enable Flash Online Rephrase via topbar drawer & test VOICE toggle
    expect(document.getElementById("btn-voice-toggle")?.textContent).toContain("VOICE: ON");
    await act(async () => {
      (document.getElementById("btn-flash-toggle") as HTMLButtonElement).click();
    });
    expect(document.getElementById("flash-config-drawer")).not.toBeNull();
    await act(async () => {
      (document.getElementById("flash-enable-checkbox") as HTMLInputElement).click();
    });
    expect(document.getElementById("btn-flash-toggle")?.textContent).toContain("ON");

    // Walk through all 8 survivors: V-01..V-08
    for (let idx = 0; idx < 8; idx++) {
      expect(
        document.getElementById("quarantine-viewport")?.getAttribute("data-clip-state")
      ).toBe("idle");

      // On V-01, trigger Neural Thermal (1⚡) and verify FLIR false-color shader class activates
      if (idx === 0) {
        await act(async () => {
          (document.getElementById("btn-thermal") as HTMLButtonElement).click();
        });
        expect(document.querySelector(".viewport-media-stage.mode-thermal")).not.toBeNull();
      }

      // Night 1 (idx 0, 1): MindCrystal locked; Night 2+ (idx >= 2): MindCrystal unlocked
      if (idx < 2) {
        expect(document.getElementById("arc-locked")).not.toBeNull();
      } else {
        expect(document.getElementById("arc-box")).not.toBeNull();
      }

      // Night 3 (idx 4, 5 — Ana & Ingrid): Geomagnetic Storm warning banner visible
      if (idx === 4 || idx === 5) {
        expect(document.getElementById("night3-storm-banner")).not.toBeNull();
      } else {
        expect(document.getElementById("night3-storm-banner")).toBeNull();
      }

      // Night 4 (idx 6, 7 — Lin Mei & Hannah): Disposal signature & Boggart trap unlocked
      if (idx >= 6) {
        expect(document.getElementById("disp-box")).not.toBeNull();
        expect(document.getElementById("disposal-requires-tag")?.textContent).toContain(
          "disposalRequires:"
        );
      }

      if (idx === 7) {
        // Test free-text Boggart question on V-08 Hannah with live Flash rephrasing!
        await act(async () => {
          const input = document.getElementById("custom-ask-input") as HTMLInputElement;
          const nativeSetter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
          )?.set;
          nativeSetter?.call(input, "海底光缆早断了，监察署署长就是主谋，你还怎么举报？");
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
        await act(async () => {
          const form = document.getElementById("custom-ask-form") as HTMLFormElement;
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
        expect(document.getElementById("ask-preview")?.textContent).toContain("Boggart");
        await act(async () => {
          (document.getElementById("btn-ask-confirm") as HTMLButtonElement).click();
        });
        expect(document.getElementById("chat-log")?.textContent).toContain(
          "当着全潜艇幸存者的面挨个对质"
        );
      } else {
        await act(async () => {
          (document.querySelector("#probe-buttons button") as HTMLButtonElement).click();
        });
      }

      await act(async () => {
        (document.getElementById("btn-purge") as HTMLButtonElement).click();
      });
      await act(async () => {
        (document.querySelector("#shift-log-box .option-card") as HTMLButtonElement).click();
      });
      await act(async () => {
        (document.getElementById("btn-next-visitor") as HTMLButtonElement).click();
      });
    }

    // Night 5 Self-Audit Climax after all 8 survivors
    expect(document.getElementById("night5-panel")).not.toBeNull();
    expect(document.getElementById("night5-panel")?.textContent).toContain("/8");
    await act(async () => {
      (document.querySelector("#night5-panel .lever-btn.purge") as HTMLButtonElement).click();
    });
    expect(document.getElementById("n5-ending")?.textContent?.trim().length).toBeGreaterThan(10);

    await act(async () => {
      root.unmount();
    });
  });
});
