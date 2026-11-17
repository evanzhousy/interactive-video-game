import { useEffect, useState } from "react";
import { playBoothSfx, speakIntercomLine, stopIntercomVoice } from "../../game/audio.js";
import { tl } from "../../game/i18n.js";
import { getNight5FrameSrc } from "../../game/media.js";
import {
  ENDINGS,
  SHIFT_EXCUSES,
  SIG_LABELS,
  evaluateNight5Audit,
  resolveNight5Ending,
  type IntakeOption,
  type PlayerCompactProfile
} from "../../game/night5.js";
import { ACHIEVEMENTS, type AchievementId } from "../../game/storage.js";
import type { EndingId, Locale, ShiftHistoryEntry } from "../../game/types.js";
import { MindCrystalCanvas } from "./MindCrystalCanvas.js";

interface Props {
  lang: Locale;
  sfx: boolean;
  voice: boolean;
  baseline: PlayerCompactProfile;
  intakeAnswers: readonly IntakeOption[];
  history: readonly ShiftHistoryEntry[];
  onResolveEnding: (ending: EndingId) => AchievementId[];
  onStartNewRun: () => void;
  onClose: () => void;
}

export function Night5Audit({
  lang,
  sfx,
  voice,
  baseline,
  intakeAnswers,
  history,
  onResolveEnding,
  onStartNewRun,
  onClose
}: Props) {
  const [confess, setConfess] = useState(false);
  const [endingKey, setEndingKey] = useState<EndingId | null>(null);
  const [finalAction, setFinalAction] = useState<"NONE" | "PURGE" | "ADMIT" | "STEP_OUT">("NONE");
  const [newBadges, setNewBadges] = useState<AchievementId[]>([]);

  const audit = evaluateNight5Audit(baseline, history);
  const matchingIntake = intakeAnswers.find((a) => a.sig === baseline.sig);
  const quote = matchingIntake
    ? tl(matchingIntake.text, lang)
    : tl(SHIFT_EXCUSES.find((e) => e.sig === baseline.sig)?.label ?? SHIFT_EXCUSES[0]!.label, lang);

  const knockSpeech = `${quote} ${tl(
    {
      zh: "这是我入职时亲口说的话。这几夜我每一次都是这么做的。你呢？",
      en: "That's what I said at intake. Every night since, that's what I did. Did you?",
      ja: "それが入所時に私が言った言葉だ。この数夜、私はその通りに動いた。お前はどうだ？"
    },
    lang
  )}`;

  useEffect(() => {
    if (typeof Image !== "undefined") {
      for (const action of ["NONE", "PURGE", "ADMIT", "STEP_OUT"] as const) {
        const img = new Image();
        img.src = getNight5FrameSrc(action);
      }
    }

    speakIntercomLine({
      visitorId: "V-01",
      locale: lang,
      text: knockSpeech,
      isDynamicFlash: true,
      enabled: voice
    });
    return () => {
      stopIntercomVoice();
    };
    // Speak once when entering Night 5
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerChoice = (action: "PURGE" | "ADMIT" | "STEP_OUT") => {
    stopIntercomVoice();
    playBoothSfx(action === "PURGE" ? "purge" : "admit", sfx);
    const resolved = resolveNight5Ending(audit, action, confess);
    setFinalAction(action);
    setEndingKey(resolved);
    const unlocked = onResolveEnding(resolved);
    setNewBadges(unlocked);
  };

  const verdictFrameSrc = getNight5FrameSrc(finalAction);

  return (
    <section className="panel" id="night5-panel">
      <div className="viewport-header">
        <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
          NIGHT 5 // SELF-AUDIT · OPERATOR #09 DOPPELGÄNGER AT GATE 0
        </span>
        <button type="button" className="ctrl-btn" onClick={onClose}>
          {tl({ zh: "返回岗亭", en: "Back to Booth", ja: "ブースへ戻る" }, lang)}
        </button>
      </div>

      <div className="booth-grid">
        <div className="left-stack">
          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              GATE CAM 01 // SUBJECT: OPERATOR #09 [FACIAL MATCH 99.98%]
            </div>
            <div className="viewport-frame n5-doppelganger-frame" id="night5-viewport">
              <div className="viewport-media-stage">
                <img
                  src="./portraits/operator09.jpg"
                  alt="Operator #09 Doppelgänger outside Gate 0"
                  className="viewport-photo base-photo-layer"
                  decoding="async"
                />
                <img
                  src={verdictFrameSrc}
                  alt={`Gate 0 Night 5 (${finalAction})`}
                  className={`viewport-photo reaction-photo-layer ${
                    finalAction !== "NONE" ? "is-visible" : ""
                  }`}
                  decoding="async"
                />
              </div>
              <div className="viewport-scanlines" aria-hidden="true" />
              {finalAction === "PURGE" ? (
                <div className="n5-verdict-overlay purge">
                  <span>CHAMBER PURGED · 1,100°C THERMAL STERILIZATION</span>
                </div>
              ) : null}
              {finalAction === "ADMIT" ? (
                <div className="n5-verdict-overlay admit">
                  <span>INNER AIRLOCK UNSEALED · DOUBLE ADMITTED</span>
                </div>
              ) : null}
              {finalAction === "STEP_OUT" ? (
                <div className="n5-verdict-overlay step-out">
                  <span>OUTER HATCH OPENED · -46°C WHITE-OUT</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              OPERATOR #09: NIGHT 0 SAY (AMBER) vs SHIFT LOG DO (DASHED)
            </div>
            <MindCrystalCanvas
              id="player-audit-canvas"
              orderings={[{ kept: audit.baseline.kept, dropped: audit.baseline.dropped, weight: 0.65 }]}
              neverWon={[]}
              overlays={[
                {
                  kept: audit.live.kept,
                  dropped: audit.live.dropped,
                  mismatch: audit.live.sig !== audit.baseline.sig,
                  tag: "DO"
                }
              ]}
              lang={lang}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">ORD-OS AXIOM</div>
            <div style={{ fontSize: "0.82rem", color: "var(--amber-crt)" }}>
              {tl(
                {
                  zh: "寄生体复制的是宿主的自我叙事 (SAY)。只有活人才会和自己入职时说过的话对不上。",
                  en: "A mimic copies the host's self-narrative (SAY). Only a living human fails to match their own intake words.",
                  ja: "擬態体は宿主の自己物語 (SAY) を複製する。生身の人間だけが自分の建前と食い違う。"
                },
                lang
              )}
            </div>
            <div style={{ fontSize: "0.8rem", marginTop: "6px", color: "var(--text-secondary)" }}>
              SAY: <strong>{tl(SIG_LABELS[audit.baseline.sig], lang)}</strong> · DO:{" "}
              <strong>{tl(SIG_LABELS[audit.live.sig], lang)}</strong> (Match:{" "}
              {Math.round(audit.consistency * 100)}%)
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.74rem",
                color: "var(--text-muted)",
                marginTop: "5px"
              }}
            >
              CORRECT VERDICTS: {audit.correctVerdicts}/{audit.totalVisitors} · HUMANS PURGED:{" "}
              {audit.wrongPurges} · SUB CREW QUOTA LEFT: {audit.crewQuotaRemaining}/
              {audit.baseCrewQuota}
            </div>
          </div>

          <div className="dossier-section" id="n5-knock-text" style={{ marginBottom: 0 }}>
            <div className="section-kicker">INTERCOM CH-01 // OUTSIDE THE GLASS</div>
            <div style={{ fontSize: "0.84rem" }}>
              [KNOCK, KNOCK—] {quote}{" "}
              {tl(
                {
                  zh: "——这是我入职时亲口说的话。这几夜我每一次都是这么做的。你呢？",
                  en: "— that's what I said at intake. Every night since, that's what I did. Did you?",
                  ja: "——それが入所時に私が言った言葉だ。この数夜、私はその通りに動いた。お前はどうだ？"
                },
                lang
              )}
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "0.8rem",
              cursor: "pointer"
            }}
          >
            <input
              id="n5-confess"
              type="checkbox"
              checked={confess}
              disabled={endingKey !== null}
              onChange={(e) => setConfess(e.target.checked)}
            />
            <span>
              {tl(
                {
                  zh: "在最终日志里公开你真实的言行差（可能被剥夺指挥权，但能向 ORD-OS 证明你是活人）",
                  en: "Confess your real say/do gap in the final log (risks losing command, proves humanity to ORD-OS)",
                  ja: "最終日誌に本当の言行不一致を記す（指揮権を失うリスクがあるが人間である証明になる）"
                },
                lang
              )}
            </span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <button
              type="button"
              disabled={endingKey !== null}
              className="lever-btn purge"
              onClick={() => triggerChoice("PURGE")}
            >
              {tl({ zh: "净化窗外替身", en: "Purge Double", ja: "外の影を焼却" }, lang)}
            </button>
            <button
              type="button"
              disabled={endingKey !== null}
              className="lever-btn admit"
              onClick={() => triggerChoice("ADMIT")}
            >
              {tl({ zh: "放他进岗亭", en: "Admit Double", ja: "中へ入れる" }, lang)}
            </button>
            <button
              type="button"
              disabled={endingKey !== null}
              className="ctrl-btn"
              onClick={() => triggerChoice("STEP_OUT")}
            >
              {tl({ zh: "走出气闸让位", en: "Step Into Storm", ja: "外へ歩み出る" }, lang)}
            </button>
          </div>

          {endingKey ? (
            <div
              id="n5-ending"
              className="dossier-section"
              style={{
                marginBottom: 0,
                borderColor: "var(--amber-crt)",
                background: "var(--amber-soft)"
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--amber-crt)" }}>
                {tl(ENDINGS[endingKey].title, lang)}
              </div>
              <p style={{ fontSize: "0.84rem", margin: "6px 0 0" }}>
                {tl(ENDINGS[endingKey].body, lang)}
              </p>

              {newBadges.length > 0 ? (
                <div className="new-badges-strip" id="n5-new-badges">
                  {newBadges.map((bid) => {
                    const spec = ACHIEVEMENTS.find((a) => a.id === bid);
                    return spec ? (
                      <span key={bid} className="value-pill silent">
                        ★ {tl(spec.title, lang)}
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null}

              <button
                id="btn-play-again"
                type="button"
                className="ctrl-btn amber"
                style={{ width: "100%", marginTop: "12px", padding: "9px", fontWeight: 700 }}
                onClick={onStartNewRun}
              >
                {tl(
                  {
                    zh: "归档本次记录并开启新周目 (重做入职测试) →",
                    en: "Archive Record & Start New Run (Night 0 Intake) →",
                    ja: "記録を保存して新しい周回を開始 (入所テストへ) →"
                  },
                  lang
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
