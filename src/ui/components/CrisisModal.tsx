import { useEffect, useState } from "react";
import { speakIntercomLine, stopIntercomVoice } from "../../game/audio.js";
import type { CrisisOption, InterNightCrisis } from "../../game/crises.js";
import { tl } from "../../game/i18n.js";
import { getNight5VideoCandidates } from "../../game/media.js";
import {
  SIG_LABELS,
  evaluateNight5Audit,
  resolveNight5KnockLine,
  type IntakeOption,
  type PlayerCompactProfile
} from "../../game/night5.js";
import type { Locale, ShiftHistoryEntry } from "../../game/types.js";

interface CrisisModalProps {
  crisis: InterNightCrisis;
  lang: Locale;
  fuelLeft: number;
  onResolveOption: (option: CrisisOption) => void;
}

export function CrisisModal({ crisis, lang, fuelLeft, onResolveOption }: CrisisModalProps) {
  const [picked, setPicked] = useState<CrisisOption | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [crisis.id]);

  return (
    <section
      className="panel modal-stage crisis-panel"
      id="crisis-modal"
      data-crisis-id={crisis.id}
    >
      <div className="viewport-header">
        <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
          ⚠️ {tl(crisis.nightLabel, lang)}
        </span>
        <span className={`fuel-pill ${fuelLeft <= 1 ? "low" : ""}`}>
          🔥 {fuelLeft} FUEL
        </span>
      </div>

      <h2 style={{ margin: "6px 0 8px", fontSize: "1.1rem" }}>{tl(crisis.title, lang)}</h2>
      <p style={{ margin: "0 0 12px", fontSize: "0.86rem", color: "var(--text-primary)" }}>
        {tl(crisis.situation, lang)}
      </p>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.73rem",
          color: "var(--text-muted)",
          marginBottom: "8px"
        }}
      >
        {tl(
          {
            zh: "ORD-OS 物理传感器正在后台静默记录你的真实行动 (DO)：",
            en: "ORD-OS telemetry is silently recording your actual booth action (DO):",
            ja: "ORD-OSテレメトリが君の実際の行動 (DO) を静かに記録している："
          },
          lang
        )}
      </div>

      <div>
        {crisis.options.map((opt) => {
          const isSelected = picked?.id === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-crisis-option={opt.id}
              disabled={picked !== null}
              className={`option-card crisis-option-btn ${isSelected ? "selected" : ""}`}
              onClick={() => setPicked(opt)}
            >
              {tl(opt.label, lang)}
            </button>
          );
        })}
      </div>

      {picked ? (
        <div className="crisis-consequence-box" id="crisis-consequence-note">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--amber-crt)" }}>
            {tl(picked.consequenceNote, lang)}
          </div>
          <button
            id="btn-crisis-continue"
            type="button"
            className="ctrl-btn amber"
            style={{ marginTop: "10px", width: "100%", padding: "9px", fontWeight: 700 }}
            onClick={() => onResolveOption(picked)}
          >
            {tl(
              {
                zh:
                  crisis.id === "N4_COMMANDER"
                    ? "封存记录 · 进入第 5 夜交接断电 →"
                    : "封存记录 · 进入下一夜值班 →",
                en:
                  crisis.id === "N4_COMMANDER"
                    ? "Seal Telemetry · Enter Night 5 Blackout →"
                    : "Seal Telemetry · Proceed to Next Night →",
                ja:
                  crisis.id === "N4_COMMANDER"
                    ? "記録を封印 · 第5夜停電へ進む →"
                    : "記録を封印 · 次の夜へ進む →"
              },
              lang
            )}
          </button>
        </div>
      ) : null}
    </section>
  );
}

interface DemoCliffhangerProps {
  lang: Locale;
  voice: boolean;
  baseline: PlayerCompactProfile;
  intakeAnswers: readonly IntakeOption[];
  history: readonly ShiftHistoryEntry[];
  onUpgradeToFullShift: () => void;
  onRestartDemo: () => void;
}

export function DemoCliffhangerModal({
  lang,
  voice,
  baseline,
  intakeAnswers,
  history,
  onUpgradeToFullShift,
  onRestartDemo
}: DemoCliffhangerProps) {
  const [videoReady, setVideoReady] = useState(false);
  const audit = evaluateNight5Audit(baseline, history, 4, [], "demo");
  const { quote, knockSpeech, voiceLineId } = resolveNight5KnockLine(
    baseline,
    intakeAnswers,
    lang
  );
  const idleCandidates = getNight5VideoCandidates("NONE");

  useEffect(() => {
    speakIntercomLine({
      visitorId: "OP-09",
      locale: lang,
      text: knockSpeech,
      lineId: voiceLineId,
      enabled: voice
    });
    return () => {
      stopIntercomVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel modal-stage crisis-panel" id="demo-cliffhanger-modal">
      <div className="viewport-header">
        <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
          DEMO COMPLETE (NIGHTS 0–2) // NIGHT 5 CLIFFHANGER PREVIEW
        </span>
        <span style={{ color: "var(--frost-cyan)" }}>FACIAL MATCH: 99.98%</span>
      </div>

      <div className="viewport-frame n5-doppelganger-frame" style={{ marginBottom: "12px" }}>
        <div className="viewport-media-stage">
          <img
            src="./portraits/operator09.jpg"
            alt="Operator #09 Doppelgänger knocking at Gate 0"
            className="viewport-photo base-photo-layer"
            decoding="async"
          />
          <video
            key="demo-op09-teaser"
            className="viewport-video"
            style={{ opacity: videoReady ? 1 : 0 }}
            muted
            loop
            playsInline
            autoPlay
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoReady(false)}
          >
            {idleCandidates.map((src) => (
              <source
                key={src}
                src={src}
                type={src.endsWith(".webm") ? "video/webm" : "video/mp4"}
              />
            ))}
          </video>
        </div>
        <div className="viewport-scanlines" aria-hidden="true" />
      </div>

      <div className="dossier-section" style={{ borderColor: "hsla(38, 92%, 52%, 0.45)" }}>
        <div className="section-kicker">INTERCOM CH-01 // THREE NIGHTS LATER...</div>
        <div style={{ fontSize: "0.88rem", color: "var(--amber-crt)", fontWeight: 600 }}>
          [KNOCK, KNOCK—] {quote}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          {tl(
            {
              zh: "第 5 夜暴风雪里，一张与你 99.98% 重合的脸贴在防爆窗外，一字不差背出了你入职第 0 夜的承诺。前两夜你已留下真实的言行轨迹——敢继续值完第 3–5 夜，用你的『言行差』活下来吗？",
              en: "On Night 5, an identical face presses against the blast glass, reciting your Night 0 intake promise word-for-word. Your first two nights are already on record—will you survive Nights 3–5 using your own say/do gap?",
              ja: "第5夜の吹雪の中、99.98%一致する顔が防爆窓に張り付き、入所時の君の言葉を一字一句復唱している。このまま第3〜5夜へ進み、自らの『言行不一致』で生き残れるか？"
            },
            lang
          )}
        </p>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          marginBottom: "12px"
        }}
      >
        NIGHTS 1–2 VERDICTS: {audit.correctVerdicts}/{audit.totalVisitors} · SAY:{" "}
        {tl(SIG_LABELS[audit.baseline.sig], lang)} · DO: {tl(SIG_LABELS[audit.live.sig], lang)} (
        {Math.round(audit.consistency * 100)}% MATCH)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px" }}>
        <button
          id="btn-demo-continue-full"
          type="button"
          className="ctrl-btn amber"
          style={{ padding: "10px", fontWeight: 700 }}
          onClick={onUpgradeToFullShift}
        >
          {tl(
            {
              zh: "继承当前存档 · 继续进入第 3–5 夜完整战役 →",
              en: "Carry Save Forward · Continue Nights 3–5 Full Shift →",
              ja: "記録を引き継いで第3〜5夜の本編へ進む →"
            },
            lang
          )}
        </button>
        <button
          id="btn-demo-restart"
          type="button"
          className="ctrl-btn"
          style={{ padding: "10px" }}
          onClick={onRestartDemo}
        >
          {tl(
            {
              zh: "重开试玩版 (N0–N2)",
              en: "Restart Demo (N0–N2)",
              ja: "体験版を最初から (N0–N2)"
            },
            lang
          )}
        </button>
      </div>
    </section>
  );
}
