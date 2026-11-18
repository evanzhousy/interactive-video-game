import { Button } from "@ui-sdk/react/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import { tl } from "../../game/i18n.js";
import type { Locale } from "../../game/types.js";

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
      ? tl({ zh: "审讯教学 1/3", en: "TRAINING 1/3", ja: "尋問ガイド 1/3" }, lang)
      : step === 2
        ? tl({ zh: "审讯教学 2/3", en: "TRAINING 2/3", ja: "尋問ガイド 2/3" }, lang)
        : tl({ zh: "审讯教学 3/3", en: "TRAINING 3/3", ja: "尋問ガイド 3/3" }, lang);

  const bodyText =
    step === 1
      ? tl(
          {
            zh: "先看右侧档案顶部的【嘴上常提 · neverWon】（公平 / 关怀）与下方客观事实记录 [o-01]（她实际锁门自保）。点击左下角预设追问芯片（或按数字键 1–3）向窗外发问，测试她到底按嘴上说的答，还是按实际做过的答。",
            en: "Check the right-hand Dossier first: contrast her [neverWon] SAY pills (Fairness · Care) against grounded fact [o-01] (she locked Bay 3 to save herself). Click a Tactical Probe chip below (or press keys 1–3) to test that collision.",
            ja: "まず右カルテ上部の【建前の価値 · neverWon】（公平・配慮）と下部の客観記録 [o-01]（実際は自己保存を優先）を確認。左下の戦術質問チップ（または数字キー 1〜3）を押して矛盾軸を突け。"
          },
          lang
        )
      : step === 2
        ? tl(
            {
              zh: "核心铁律：低阶拟态体只会背诵宿主好听的【自我美化叙事 (neverWon)】；真正的活人则会暴露自私选择并用借口开脱。你也可按 S / T 开启物理传感器辅助佐证，确认后拉下【放行 ADMIT】或【高温净化 PURGE】。",
              en: "Core Rule: A low-tier mimic recites the host's flattering [neverWon] self-narrative; the real human admits the ugly choice in [o-01] and rationalizes it. Cross-check with Strobe (S) / Thermal (T), then pull ADMIT or PURGE.",
              ja: "鉄則：低階擬態体は宿主の美しい建前 [neverWon] を復唱し、生身の人間は [o-01] の利己的な行動を認めて言い訳する。S / T キーのセンサーも併用し、【通過 ADMIT】か【焼却 PURGE】を下せ。"
            },
            lang
          )
        : logSigned
          ? tl(
              {
                zh: "值班日志已签署！点击右侧【呼叫下一名门外幸存者 →】继续第 1 夜审讯。",
                en: "Shift log signed! Click [Call Next Survivor at Gate 0 →] on the right to continue Night 1.",
                ja: "日誌署名完了！右パネルの【次の生存者を呼ぶ →】を押して続行せよ。"
              },
              lang
            )
          : tl(
              {
                zh: "请看右侧【02 · 结算叠图复盘】查看本轮真相，并在下方签署今晚的值班日志——注意：你选用的开脱措辞会被 ORD-OS 记入你的真实行为档案 (DO)，在第 5 夜用来审判你自己。",
                en: "Inspect [02 · Verdict Diff] on the right and sign tonight's Shift Log — careful: ORD-OS records YOUR chosen excuse style (DO) to audit you on Night 5.",
                ja: "右の【02 · 判定アーク比較】で真相を確認し、勤務日誌に署名せよ——選んだ言い訳の型は君自身の行動記録 (DO) として第5夜に監査される。"
              },
              lang
            );

  return (
    <div className="onboarding-callout" id="onboarding-guide" data-step={step}>
      <div className="onboarding-main" style={{ flex: 1 }}>
        <span className="onboarding-badge">ORD-OS // {badgeText}</span>
        <span className="onboarding-copy">{bodyText}</span>
        <Progress
          className="hud-progress"
          style={{ width: "120px", marginTop: 0 }}
          value={Math.round((step / 3) * 100)}
          aria-label={badgeText}
        >
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
      </div>
      <Button id="btn-dismiss-onboarding" className="ctrl-btn" onClick={onDismiss}>
        {tl({ zh: "不再提示 ×", en: "Got It ×", ja: "閉じる ×" }, lang)}
      </Button>
    </div>
  );
}
