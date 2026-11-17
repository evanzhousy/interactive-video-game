// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/ui/App.js";

describe("UI End-to-End Flow (Intake -> V-01 -> V-04 -> V-07 Boggart Trap -> Night 5)", () => {
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

  it("plays a complete 3-visitor shift and resolves a Night 5 ending across zh/en/ja", async () => {
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

    // V-01 Elena (Night 1: MindCrystal & Disposal locked)
    expect(document.getElementById("arc-locked")).not.toBeNull();
    expect(document.getElementById("disp-locked")).not.toBeNull();
    await act(async () => {
      (document.querySelector("#probe-buttons button") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("btn-purge") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.querySelector("#shift-log-box .option-card") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("btn-next-visitor") as HTMLButtonElement).click();
    });

    // V-04 Marcus (Night 2: MindCrystal unlocked, Disposal locked)
    expect(document.getElementById("arc-box")).not.toBeNull();
    expect(document.getElementById("disp-locked")).not.toBeNull();
    await act(async () => {
      (document.querySelector('#probe-buttons button[data-probe="dilemma2"]') as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("btn-admit") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.querySelector("#shift-log-box .option-card") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("btn-next-visitor") as HTMLButtonElement).click();
    });

    // V-07 Lin Mei (Night 4: Both MindCrystal & Disposal + disposalRequires + Boggart Trap unlocked!)
    expect(document.getElementById("arc-box")).not.toBeNull();
    expect(document.getElementById("disp-box")).not.toBeNull();
    expect(document.getElementById("disposal-requires-tag")?.textContent).toContain("disposalRequires:");

    await act(async () => {
      (document.querySelector('#probe-buttons button[data-probe="boggart_trap"]') as HTMLButtonElement).click();
    });

    // Verify language switching (en -> ja -> zh)
    for (const lang of ["en", "ja", "zh"]) {
      await act(async () => {
        const sel = document.getElementById("lang-select") as HTMLSelectElement;
        sel.value = lang;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
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

    // Night 5 Self-Audit Climax
    expect(document.getElementById("night5-panel")).not.toBeNull();
    await act(async () => {
      (document.querySelector("#night5-panel .lever-btn.purge") as HTMLButtonElement).click();
    });
    expect(document.getElementById("n5-ending")?.textContent?.trim().length).toBeGreaterThan(10);

    await act(async () => {
      root.unmount();
    });
  });
});
