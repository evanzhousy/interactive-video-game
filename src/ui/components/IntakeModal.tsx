import { Button } from "@ui-sdk/react/button";
import { useEffect, useState } from "react";
import { VALUE_I18N, tl } from "../../game/i18n.js";
import {
  INTAKE_QUESTIONS,
  SIG_LABELS,
  computePlayerProfile,
  type IntakeOption,
  type PlayerCompactProfile
} from "../../game/night5.js";
import { PROLOGUE_NODE_IDS, getStoryNode } from "../../game/story-graph.js";
import type { Locale } from "../../game/types.js";
import { InteractiveMoviePlayer } from "./InteractiveMoviePlayer.js";
import { IsometricOutpostBanner } from "./Schematics.js";

interface Props {
  lang: Locale;
  operatorName?: string;
  motionPaused?: boolean;
  initialStep?: number;
  onUnlockNode?: (nodeIds: string[], edgeIds?: string[]) => void;
  onOpenStoryMap?: () => void;
  onComplete: (baseline: PlayerCompactProfile, answers: IntakeOption[]) => void;
}

export function IntakeModal({
  lang,
  operatorName = "",
  motionPaused = false,
  initialStep = 0,
  onUnlockNode,
  onOpenStoryMap,
  onComplete
}: Props) {
  const [answers, setAnswers] = useState<IntakeOption[]>(() => {
    const safeStart = Math.max(0, Math.min(INTAKE_QUESTIONS.length - 1, initialStep));
    if (safeStart === 0) return [];
    return INTAKE_QUESTIONS.slice(0, safeStart).map((q) => q.options[0]!);
  });

  const displayOp = operatorName.trim() ? `#09 · ${operatorName.trim()}` : "#09";
  const step = answers.length;
  const done = step >= INTAKE_QUESTIONS.length;
  const baseline = done ? computePlayerProfile(answers) : null;
  const pct = Math.round((step / INTAKE_QUESTIONS.length) * 100);

  const currentPrologueNodeId = PROLOGUE_NODE_IDS[Math.min(step, PROLOGUE_NODE_IDS.length - 1)]!;
  const currentNode = getStoryNode(currentPrologueNodeId)!;

  useEffect(() => {
    if (!done && onUnlockNode) {
      onUnlockNode([currentPrologueNodeId]);
    }
  }, [currentPrologueNodeId, done, onUnlockNode]);

  if (!done) {
    return (
      <section className="fmv-intake-shell" id="intake-panel" data-step={step + 1}>
        <InteractiveMoviePlayer
          node={currentNode}
          lang={lang}
          motionPaused={motionPaused}
          operatorBadge={tl(
            { zh: `值班卡 // ${displayOp}`, en: `BADGE // ${displayOp}`, ja: `当直証 // ${displayOp}` },
            lang
          )}
          progressLabel={tl(
            {
              zh: `序章回忆 0${step + 1} / 0${INTAKE_QUESTIONS.length}`,
              en: `PROLOGUE 0${step + 1} / 0${INTAKE_QUESTIONS.length}`,
              ja: `序章 0${step + 1} / 0${INTAKE_QUESTIONS.length}`
            },
            lang
          )}
          progressPct={pct}
          onOpenStoryMap={onOpenStoryMap}
          onSelectChoice={(choice, idx) => {
            const optIdx = choice.intakeOptionIndex ?? idx;
            const opt =
              INTAKE_QUESTIONS[step]?.options[optIdx] ?? INTAKE_QUESTIONS[step]!.options[0]!;
            const edgeIds: string[] = [];
            if (step === 0) edgeIds.push("e_p1_p2");
            if (step === 1) edgeIds.push("e_p2_p3");
            if (step === 2) edgeIds.push("e_p3_n1e");
            onUnlockNode?.([currentPrologueNodeId, choice.nextNodeId], edgeIds);
            setAnswers((prev) => [...prev, opt]);
          }}
        />
      </section>
    );
  }

  return (
    <section className="panel modal-stage fmv-handover-card" id="intake-panel">
      <div className="section-kicker intake-header-row">
        <span>
          {tl(
            {
              zh: "序章完成 // 第 0 夜值班记忆封存",
              en: "PROLOGUE COMPLETE // NIGHT 0 HANDOVER SEALED",
              ja: "序章完了 // 第0夜 引き継ぎ記録封印"
            },
            lang
          )}
        </span>
        <span className="tech-stamp">
          {tl({ zh: `值班卡 // ${displayOp}`, en: `BADGE // ${displayOp}`, ja: `当直証 // ${displayOp}` }, lang)}
        </span>
      </div>

      <IsometricOutpostBanner
        step={INTAKE_QUESTIONS.length}
        totalSteps={INTAKE_QUESTIONS.length}
        lang={lang}
      />

      {baseline ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              {tl(
                {
                  zh: "#09 值班员交接侧写",
                  en: "OPERATOR #09 HANDOVER PROFILE",
                  ja: "#09 検疫官・引き継ぎ記録"
                },
                lang
              )}
            </div>
            <div style={{ fontSize: "0.88rem" }}>
              <strong style={{ color: "var(--amber-crt)" }}>
                {VALUE_I18N[baseline.kept][lang]}
              </strong>{" "}
              &gt; {VALUE_I18N[baseline.dropped][lang]} · {tl(SIG_LABELS[baseline.sig], lang)}
            </div>
          </div>

          <div className="audit-pipeline-strip" aria-label="Shift Flow">
            <span className="pipe-node active">
              {tl({ zh: "第0夜 // 记忆抉择", en: "NIGHT 0 // WORDS", ja: "第0夜 // 選択" }, lang)}
            </span>
            <svg aria-hidden="true" className="svg-flow-arrow" width="18" height="10" viewBox="0 0 18 10" fill="none">
              <path d="M0 5h15M12 1l4 4-4 4" stroke="var(--amber-crt)" strokeWidth="1.3" />
            </svg>
            <span className="pipe-node">
              {tl({ zh: "第1–4夜 // 剧情与审讯", en: "N1–N4 // ACTIONS", ja: "第1〜4夜 // 行動" }, lang)}
            </span>
            <svg aria-hidden="true" className="svg-flow-arrow" style={{ animationDelay: "0.4s" }} width="18" height="10" viewBox="0 0 18 10" fill="none">
              <path d="M0 5h15M12 1l4 4-4 4" stroke="var(--amber-crt)" strokeWidth="1.3" />
            </svg>
            <span className="pipe-node danger">
              {tl({ zh: "第5夜 // 镜像终局", en: "NIGHT 5 // MIRROR", ja: "第5夜 // 鏡像終局" }, lang)}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              id="btn-start-shift"
              className="ctrl-btn amber"
              style={{ flex: "1 1 220px", padding: "10px", fontWeight: 700 }}
              onClick={() => onComplete(baseline, answers)}
            >
              {tl(
                {
                  zh: "进入 0 号隔离岗亭 →",
                  en: "Enter Quarantine Booth 0 →",
                  ja: "第0検疫ブースへ入る →"
                },
                lang
              )}
            </Button>
            <Button
              type="button"
              className="ctrl-btn"
              onClick={() => setAnswers([])}
            >
              {tl({ zh: "重播序章", en: "Replay Prologue", ja: "序章をやり直す" }, lang)}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
