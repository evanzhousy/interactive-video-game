// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/ui/App.js";
import { uiAgent } from "../src/ui/agent-bridge.js";

describe("UI End-to-End Flow (Full 8-Survivor Campaign + Autosave + Hotkeys + Flash + Compendium)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
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

  it("plays a complete 8-visitor campaign, resumes mid-shift via autosave, and unlocks Night 5 compendium records", async () => {
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
    let root = createRoot(container);

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

    // Complete V-01, verifying photorealistic 35mm portrait + progressive 3-step Onboarding Guide
    const baseImg = document.querySelector("#quarantine-viewport .base-photo-layer") as HTMLImageElement;
    expect(baseImg).not.toBeNull();
    expect(baseImg.style.display).not.toBe("none");
    expect(baseImg.getAttribute("src")).toBe("./portraits/elena.jpg");
    expect(document.getElementById("onboarding-guide")?.getAttribute("data-step")).toBe("1");
    expect(document.getElementById("btn-ambience-toggle")?.textContent).toContain("AMB: ON");
    expect(document.querySelector('[data-slot="tabs-list"][role="tablist"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="scroll-area-viewport"][role="log"]')).not.toBeNull();

    const agentSnap = uiAgent.snapshot();
    const snapJson = JSON.stringify(agentSnap);
    expect(agentSnap.some((c) => c.component === "select")).toBe(true);
    expect(agentSnap.some((c) => c.component === "tabs")).toBe(true);
    expect(agentSnap.some((c) => c.component === "toggle")).toBe(true);
    expect(snapJson).not.toContain("isMimic");
    expect(snapJson).not.toContain("defectMode");

    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "t", bubbles: true }));
    });
    expect(document.querySelector(".viewport-media-stage.mode-thermal")).not.toBeNull();

    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true }));
    });
    expect(document.getElementById("onboarding-guide")?.getAttribute("data-step")).toBe("2");

    await act(async () => {
      (document.getElementById("btn-purge") as HTMLButtonElement).click();
    });
    expect(document.getElementById("onboarding-guide")?.getAttribute("data-step")).toBe("3");
    await act(async () => {
      (document.getElementById("btn-dismiss-onboarding") as HTMLButtonElement).click();
    });
    expect(document.getElementById("onboarding-guide")).toBeNull();
    const reactionImg = document.querySelector(
      "#quarantine-viewport .reaction-photo-layer"
    ) as HTMLImageElement;
    expect(reactionImg.classList.contains("is-visible")).toBe(true);
    expect(reactionImg.getAttribute("src")).toBe("./portraits/reactions/chamber_purge.jpg");
    await act(async () => {
      (document.querySelector("#shift-log-box .option-card") as HTMLButtonElement).click();
    });

    // Unmount and remount App right AFTER signing V-01 (before clicking Next!) -> must advance cleanly to V-02 with 4 FUEL & no duplicate V-01!
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById("root")!);
    await act(async () => {
      root.render(<App />);
    });
    expect(document.getElementById("main-booth")?.textContent).toContain("V-02");
    expect(document.getElementById("booth-fuel-pill")?.textContent).toContain("4 FUEL");

    // Enable Flash Online Rephrase via topbar drawer
    await act(async () => {
      (document.getElementById("btn-flash-toggle") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("flash-enable-checkbox") as HTMLInputElement).click();
    });

    // Walk through remaining 7 survivors: V-02..V-08 (idx 1..7), including N2_SERUM, N3_BRIBE, and N4_COMMANDER crises!
    for (let idx = 1; idx < 8; idx++) {
      if (idx === 4 || idx === 5) {
        expect(document.getElementById("night3-storm-banner")).not.toBeNull();
        // Night 3 geomagnetic storm strictly blinds strobe & thermal sensors
        expect(document.getElementById("btn-strobe")?.getAttribute("aria-disabled")).toBe("true");
        expect(document.getElementById("btn-thermal")?.getAttribute("aria-disabled")).toBe("true");
        await act(async () => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true }));
        });
        expect(document.querySelector(".sensor-toast")).toBeNull();
      } else {
        expect(document.getElementById("night3-storm-banner")).toBeNull();
      }

      if (idx >= 6) {
        expect(document.getElementById("disp-box")).not.toBeNull();
        expect(document.getElementById("disposal-requires-tag")?.textContent).toContain(
          "disposalRequires:"
        );
      }

      if (idx === 7) {
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

      // Mix ADMIT & PURGE so fuel stays balanced
      const actionBtnId = idx % 2 === 0 ? "btn-admit" : "btn-purge";
      await act(async () => {
        (document.getElementById(actionBtnId) as HTMLButtonElement).click();
      });
      await act(async () => {
        (document.querySelector("#shift-log-box .option-card") as HTMLButtonElement).click();
      });
      await act(async () => {
        (document.getElementById("btn-next-visitor") as HTMLButtonElement).click();
      });

      // Handle scheduled inter-night crises after V-04 (idx 3), V-06 (idx 5), and V-08 (idx 7)
      if (idx === 3) {
        expect(document.getElementById("crisis-modal")?.getAttribute("data-crisis-id")).toBe(
          "N2_SERUM"
        );
        await act(async () => {
          (
            document.querySelector('[data-crisis-option="serum_send_own"]') as HTMLButtonElement
          ).click();
        });
        await act(async () => {
          (document.getElementById("btn-crisis-continue") as HTMLButtonElement).click();
        });
      } else if (idx === 5) {
        expect(document.getElementById("crisis-modal")?.getAttribute("data-crisis-id")).toBe(
          "N3_BRIBE"
        );
        await act(async () => {
          (
            document.querySelector(
              '[data-crisis-option="bribe_accept_rational"]'
            ) as HTMLButtonElement
          ).click();
        });
        await act(async () => {
          (document.getElementById("btn-crisis-continue") as HTMLButtonElement).click();
        });
      } else if (idx === 7) {
        expect(document.getElementById("crisis-modal")?.getAttribute("data-crisis-id")).toBe(
          "N4_COMMANDER"
        );
        await act(async () => {
          (
            document.querySelector(
              '[data-crisis-option="cmd_protocol_rules"]'
            ) as HTMLButtonElement
          ).click();
        });
        await act(async () => {
          (document.getElementById("btn-crisis-continue") as HTMLButtonElement).click();
        });
      }
    }

    // Night 5 Self-Audit Climax: Interrogate Doppelgänger first to expose Night 2 SAY/DO contradiction!
    expect(document.getElementById("night5-panel")).not.toBeNull();
    expect(document.getElementById("night5-viewport")).not.toBeNull();
    expect(document.querySelector('[data-slot="checkbox"][role="checkbox"]')).not.toBeNull();
    expect(document.querySelector("#night5-viewport video source")?.getAttribute("src")).toBe(
      "./videos/operator09/idle.mp4"
    );
    expect(document.getElementById("night5-panel")?.textContent).toContain("/8");

    await act(async () => {
      (document.querySelector('[data-n5-probe="n5_serum"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("n5-rebuttal-badge")?.textContent).toContain(
      "CONTRADICTIONS EXPOSED: 1"
    );

    // Off-axis chatter ("hello") and duplicate serum free-text must NOT double-count exposures!
    const submitN5Text = async (txt: string) => {
      await act(async () => {
        const input = document.getElementById("n5-ask-input") as HTMLInputElement;
        const nativeSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeSetter?.call(input, txt);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await act(async () => {
        const form = document.getElementById("n5-ask-form") as HTMLFormElement;
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
    };
    await submitN5Text("hello");
    await submitN5Text("what happened to the serum?");
    expect(document.getElementById("n5-rebuttal-badge")?.textContent).toContain(
      "CONTRADICTIONS EXPOSED: 1"
    );

    await act(async () => {
      (document.getElementById("btn-n5-purge") as HTMLButtonElement).click();
    });
    expect(document.getElementById("n5-ending")?.textContent?.trim().length).toBeGreaterThan(10);
    expect(document.getElementById("btn-copy-report")).not.toBeNull();
    expect(document.getElementById("btn-compendium")?.textContent).toContain("(1/7)");

    // Open Compendium Archive modal and verify unlocked badge + ending
    await act(async () => {
      (document.getElementById("btn-compendium") as HTMLButtonElement).click();
    });
    expect(document.getElementById("compendium-modal")).not.toBeNull();
    expect(document.querySelector('[data-slot="dialog-content"]#compendium-modal')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("triggers cryo-brownout at 0 fuel and plays Demo Mode (N0–N2) into Night 5 cliffhanger & save upgrade", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    // Switch campaign mode to Steam Demo (4 visitors, 3🔥 fuel) via @ui-sdk/react/select
    await act(async () => {
      (document.getElementById("campaign-mode-select") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.querySelector('[data-mode="demo"]') as HTMLElement).click();
    });

    for (let i = 0; i < 3; i++) {
      await act(async () => {
        (document.querySelector(".option-card") as HTMLButtonElement).click();
      });
    }
    await act(async () => {
      (document.getElementById("btn-start-shift") as HTMLButtonElement).click();
    });

    // Purge V-01, V-02, V-03 -> consumes all 3🔥 fuel -> V-04 enters -46°C cryo-brownout (1⚡)!
    for (let idx = 0; idx < 4; idx++) {
      if (idx === 3) {
        expect(document.getElementById("cryo-brownout-banner")).not.toBeNull();
        expect(document.getElementById("main-booth")?.textContent).toContain("1/1 PWR");
      }
      await act(async () => {
        (document.getElementById(idx < 3 ? "btn-purge" : "btn-admit") as HTMLButtonElement).click();
      });
      await act(async () => {
        (document.querySelector("#shift-log-box .option-card") as HTMLButtonElement).click();
      });
      await act(async () => {
        (document.getElementById("btn-next-visitor") as HTMLButtonElement).click();
      });
    }

    // Demo Cliffhanger Teaser appears after V-04, then upgrades seamlessly into N2_SERUM -> V-05!
    expect(document.getElementById("demo-cliffhanger-modal")).not.toBeNull();
    await act(async () => {
      (document.getElementById("btn-demo-continue-full") as HTMLButtonElement).click();
    });
    expect(document.getElementById("crisis-modal")?.getAttribute("data-crisis-id")).toBe(
      "N2_SERUM"
    );
    await act(async () => {
      (document.querySelector(".crisis-option-btn") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("btn-crisis-continue") as HTMLButtonElement).click();
    });
    expect(document.getElementById("main-booth")?.textContent).toContain("V-05");

    await act(async () => {
      root.unmount();
    });
  });
});
