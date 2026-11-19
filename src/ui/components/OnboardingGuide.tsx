import { Button } from "@ui-sdk/react/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import { tl } from "../../game/i18n.js";
import type { Locale } from "../../game/types.js";
import { ClipboardDataIcon, StrobeTargetIcon, SubHullIcon } from "./Icons.js";

interface Props {
  lang: Locale;
  turnsUsed: number;
  verdictState: "NONE" | "ADMIT" | "PURGE";
  logSigned: boolean;
  onDismiss: () => void;
}

export function OnboardingGuide({
  lang,
  turnsUsed,
  verdictState,
  logSigned,
  onDismiss
}: Props) {
  const step: 1 | 2 | 3 =
    verdictState !== "NONE" ? 3 : turnsUsed === 0 ? 1 : 2;

  const badgeText =
    step === 1
      ? tl({ zh: "教学 1/3", en: "GUIDE 1/3", ja: "ガイド 1/3" }, lang)
      : step === 2
        ? tl({ zh: "教学 2/3", en: "GUIDE 2/3", ja: "ガイド 2/3" }, lang)
        : tl({ zh: "教学 3/3", en: "GUIDE 3/3", ja: "ガイド 3/3" }, lang);

  return (
    <div className="onboarding-callout" id="onboarding-guide" data-step={step}>
      <div className="onboarding-head-col">
        <span className="onboarding-badge">ORD-OS // {badgeText}</span>
        <Progress
          className="hud-progress"
          style={{ width: "86px", marginTop: 0 }}
          value={Math.round((step / 3) * 100)}
          aria-label={badgeText}
        >
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
      </div>

      <div className="onboarding-flow" role="list">
        <div
          role="listitem"
          className={`onboarding-node ${step === 1 ? "active" : step > 1 ? "done" : ""}`}
        >
          <SubHullIcon />
          <div>
            <div className="node-code">01 // SAY ≠ DO</div>
            <div className="node-sub">
              {tl({ zh: "比对 [neverWon] 与 [o-01]", en: "Contrast SAY vs [o-01]", ja: "建前と [o-01] を比較" }, lang)}
            </div>
          </div>
        </div>

        <svg aria-hidden="true" className="flow-arrow svg-flow-arrow" width="18" height="12" viewBox="0 0 18 12" fill="none">
          <path d="M0 6h15M11 2l4.5 4-4.5 4" stroke="currentColor" strokeWidth="1.4" />
        </svg>

        <div
          role="listitem"
          className={`onboarding-node ${step === 2 ? "active" : step > 2 ? "done" : ""}`}
        >
          <StrobeTargetIcon />
          <div>
            <div className="node-code">02 // PTT [1-3] · [S/T]</div>
            <div className="node-sub">
              {tl({ zh: "追问冲突轴 · 扫描体征", en: "Probe axis · Scan", ja: "対立軸尋問・計測" }, lang)}
            </div>
          </div>
        </div>

        <svg aria-hidden="true" className="flow-arrow svg-flow-arrow" width="18" height="12" viewBox="0 0 18 12" fill="none">
          <path d="M0 6h15M11 2l4.5 4-4.5 4" stroke="currentColor" strokeWidth="1.4" />
        </svg>

        <div
          role="listitem"
          className={`onboarding-node ${step === 3 ? "active" : ""}`}
        >
          <ClipboardDataIcon />
          <div>
            <div className="node-code">03 // VERDICT + LOG</div>
            <div className="node-sub">
              {step === 3 && logSigned
                ? tl({ zh: "已签 · 呼叫下位 →", en: "Signed · Next →", ja: "署名済 · 次へ →" }, lang)
                : tl({ zh: "拉闸裁决 · 签字留证", en: "Pull lever · Sign log", ja: "判定・日誌署名" }, lang)}
            </div>
          </div>
        </div>
      </div>

      <Button id="btn-dismiss-onboarding" className="ctrl-btn" onClick={onDismiss}>
        {tl({ zh: "关闭 ×", en: "Hide ×", ja: "閉じる ×" }, lang)}
      </Button>
    </div>
  );
}
