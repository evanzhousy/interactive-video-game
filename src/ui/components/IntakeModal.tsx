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

interface Props {
  lang: Locale;
  onComplete: (baseline: PlayerCompactProfile, answers: IntakeOption[]) => void;
}

export function IntakeModal({ lang, onComplete }: Props) {
  const [answers, setAnswers] = useState<IntakeOption[]>([]);

  const step = answers.length;
  const done = step >= INTAKE_QUESTIONS.length;
  const baseline = done ? computePlayerProfile(answers) : null;
  const pct = Math.round((step / INTAKE_QUESTIONS.length) * 100);

  return (
    <section className="panel modal-stage" id="intake-panel">
      <div className="section-kicker">
        ORD-OS // NIGHT 0 · OPERATOR #09 PSYCHOLOGICAL BASELINE INTAKE
      </div>
      <Progress
        className="hud-progress"
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
      {!done ? (
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--amber-crt)" }}>
            QUESTION {step + 1} / {INTAKE_QUESTIONS.length}
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
                {tl(opt.text, lang)}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        baseline && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
            <div className="dossier-section" style={{ marginBottom: 0 }}>
              <div className="section-kicker">OPERATOR #09 SELF-REPORTED BASELINE (SAY)</div>
              <div style={{ fontSize: "0.86rem" }}>
                <strong style={{ color: "var(--amber-crt)" }}>
                  {VALUE_I18N[baseline.kept][lang]}
                </strong>{" "}
                &gt; {VALUE_I18N[baseline.dropped][lang]} · {tl(SIG_LABELS[baseline.sig], lang)}
              </div>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
              {tl(
                {
                  zh: "这张卡记录的是你的「自述」(SAY)。接下来几夜你在值班日志里实际怎么替自己开脱，将作为外部证据进入 ORD-OS 档案。",
                  en: "This card records your self-description (SAY). How you actually justify your calls in the shift logs becomes ORD-OS external evidence.",
                  ja: "このカルテは君の「自己申告 (SAY)」だ。これからの夜、勤務日誌で実際にどう言い訳するかがORD-OSの証拠として記録される。"
                },
                lang
              )}
            </p>
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
