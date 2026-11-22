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
              {tl({ zh: "01 // 先看右侧档案", en: "01 // READ DOSSIER", ja: "01 // 調書を確認" }, lang)}
            </div>
            <div className="node-sub">
              {tl({ zh: "对比「真实记录」与「嘴上口述」", en: "Compare past actions vs quotes", ja: "「過去記録」と「発言」を比較" }, lang)}
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
              {tl({ zh: "02 // 提问 [1-4] · 扫描 [S/T]", en: "02 // ASK [1-4] · SCAN [S/T]", ja: "02 // 質問 [1-4] · 計測 [S/T]" }, lang)}
            </div>
            <div className="node-sub">
              {tl({ zh: "戳旧账试探反应，扫瞳孔/热像", en: "Press hard choices · Check vitals", ja: "過去を突き反応と体征を確認" }, lang)}
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
              {tl({ zh: "03 // 放行或净化 + 签字", en: "03 // DECIDE + SIGN LOG", ja: "03 // 判定・署名" }, lang)}
            </div>
            <div className="node-sub">
              {step === 3 && logSigned
                ? tl({ zh: "已签 · 呼叫下位 →", en: "Signed · Next →", ja: "署名済 · 次へ →" }, lang)
                : tl({ zh: "真人认账 · 伪人装圣人", en: "Humans own flaws · Mimics act saintly", ja: "人間は本音 · 擬態体は建前" }, lang)}
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
