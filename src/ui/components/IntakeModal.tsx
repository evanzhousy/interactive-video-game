import { Button } from "@ui-sdk/react/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import { useState } from "react";
import { VALUE_I18N, tl } from "../../game/i18n.js";
import {
  INTAKE_QUESTIONS,
  SIG_LABELS,
  computePlayerProfile,
  type IntakeOption,
  type PlayerCompactProfile
} from "../../game/night5.js";
import type { Locale } from "../../game/types.js";
import { IsometricOutpostBanner } from "./Schematics.js";

interface Props {
  lang: Locale;
  operatorName?: string;
  onComplete: (baseline: PlayerCompactProfile, answers: IntakeOption[]) => void;
}

export function IntakeModal({ lang, operatorName = "", onComplete }: Props) {
  const [answers, setAnswers] = useState<IntakeOption[]>([]);
  const displayOp = operatorName.trim() ? `#09 · ${operatorName.trim()}` : "#09";

  const step = answers.length;
  const done = step >= INTAKE_QUESTIONS.length;
  const baseline = done ? computePlayerProfile(answers) : null;
  const pct = Math.round((step / INTAKE_QUESTIONS.length) * 100);

  return (
    <section className="panel modal-stage" id="intake-panel">
      <div className="section-kicker intake-header-row">
        <span>
          {tl(
            {
              zh: "ORD-OS // 第 0 夜 · #09 值班员入职心理基线测验",
              en: "ORD-OS // NIGHT 0 · OPERATOR #09 PSYCHOLOGICAL BASELINE INTAKE",
              ja: "ORD-OS // 第0夜 · #09 検疫官心理ベースライン測定"
            },
            lang
          )}
        </span>
        <span className="tech-stamp">
          {tl({ zh: `表单 ORD-09 // ${displayOp}`, en: `FORM ORD-09 // ${displayOp}`, ja: `様式 ORD-09 // ${displayOp}` }, lang)}
        </span>
      </div>
      <div className="intake-progress-row">
        <Progress
          className="hud-progress"
          style={{ marginTop: 0, flex: 1 }}
          value={pct}
          aria-label={tl(
            { zh: "入职心理基线测验进度", en: "Baseline intake progress", ja: "入所時ベースライン進捗" },
            lang
          )}
        >
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
        <span className="intake-pct-tag">{pct}%</span>
      </div>
      <IsometricOutpostBanner
        step={done ? INTAKE_QUESTIONS.length : step + 1}
        totalSteps={INTAKE_QUESTIONS.length}
        lang={lang}
      />
      {!done ? (
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--amber-crt)", letterSpacing: "0.06em" }}>
            {tl(
              {
                zh: `问题 // 0${step + 1} / 0${INTAKE_QUESTIONS.length}`,
                en: `QUERY // 0${step + 1} OF 0${INTAKE_QUESTIONS.length}`,
                ja: `質問 // 0${step + 1} / 0${INTAKE_QUESTIONS.length}`
              },
              lang
            )}
          </div>
          <p style={{ fontSize: "0.95rem", margin: "10px 0 12px" }}>
            {tl(INTAKE_QUESTIONS[step]!.prompt, lang)}
          </p>
          <div>
            {INTAKE_QUESTIONS[step]!.options.map((opt, idx) => (
              <Button
                key={idx}
                className="option-card"
                onClick={() => setAnswers((prev) => [...prev, opt])}
              >
                <span className="opt-index">0{idx + 1}</span>
                <span>{tl(opt.text, lang)}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        baseline && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
            <div className="dossier-section" style={{ marginBottom: 0 }}>
              <div className="section-kicker">
                {tl(
                  {
                    zh: "#09 值班员入职心理自述",
                    en: "OPERATOR #09 INTAKE STATEMENT",
                    ja: "#09 検疫官・入所時自己申告"
                  },
                  lang
                )}
              </div>
              <div style={{ fontSize: "0.86rem" }}>
                <strong style={{ color: "var(--amber-crt)" }}>
                  {VALUE_I18N[baseline.kept][lang]}
                </strong>{" "}
                &gt; {VALUE_I18N[baseline.dropped][lang]} · {tl(SIG_LABELS[baseline.sig], lang)}
              </div>
            </div>
            <div className="audit-pipeline-strip" aria-label="Shift Audit Flow">
              <span className="pipe-node active">
                {tl({ zh: "第0夜 // 入职口述", en: "NIGHT 0 // WORDS", ja: "第0夜 // 口述" }, lang)}
              </span>
              <svg aria-hidden="true" className="svg-flow-arrow" width="18" height="10" viewBox="0 0 18 10" fill="none">
                <path d="M0 5h15M12 1l4 4-4 4" stroke="var(--amber-crt)" strokeWidth="1.3" />
              </svg>
              <span className="pipe-node">
                {tl({ zh: "第1–4夜 // 值班行动", en: "N1–N4 // ACTIONS", ja: "第1〜4夜 // 実際の行動" }, lang)}
              </span>
              <svg aria-hidden="true" className="svg-flow-arrow" style={{ animationDelay: "0.4s" }} width="18" height="10" viewBox="0 0 18 10" fill="none">
                <path d="M0 5h15M12 1l4 4-4 4" stroke="var(--amber-crt)" strokeWidth="1.3" />
              </svg>
              <span className="pipe-node danger">
                {tl({ zh: "N5 // 镜像终局审计", en: "N5 // MIRROR AUDIT", ja: "N5 // 鏡像自己監査" }, lang)}
              </span>
            </div>
            <Button
              id="btn-start-shift"
              className="ctrl-btn amber"
              style={{ padding: "10px", fontWeight: 700 }}
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
          </div>
        )
      )}
    </section>
  );
}
