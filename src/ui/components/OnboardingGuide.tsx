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
            <div className="node-code">
              {tl({ zh: "01 // 看右边记录", en: "01 // CHECK LOGS", ja: "01 // 記録を見る" }, lang)}
            </div>
            <div className="node-sub">
              {tl({ zh: "谁敢承认犯错谁是真人", en: "Real humans admit mistakes", ja: "失敗を認めれば人間" }, lang)}
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
            <div className="node-code">
              {tl({ zh: "02 // 点一句问问 [1-4]", en: "02 // ASK [1-4] · SCAN", ja: "02 // 質問 [1-4]" }, lang)}
            </div>
            <div className="node-sub">
              {tl({ zh: "戳他痛处，照强光看慌不慌", en: "Ask hard lines · Flash strobe", ja: "過去を突き反応を見る" }, lang)}
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
            <div className="node-code">
              {tl({ zh: "03 // 开门或净化", en: "03 // ADMIT OR PURGE", ja: "03 // 許可・焼却" }, lang)}
            </div>
            <div className="node-sub">
              {step === 3 && logSigned
                ? tl({ zh: "已签 · 点下一位 →", en: "Signed · Next →", ja: "署名済 · 次へ →" }, lang)
                : tl({ zh: "装完美好人多半是伪人", en: "Too-perfect excuses = mimic", ja: "完璧すぎる言い訳は偽物" }, lang)}
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
