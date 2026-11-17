import { useEffect, useRef, useState } from "react";
import { UI_STRINGS, tl } from "../../game/i18n.js";
import {
  classifyQuestionIntent,
  previewQuestionAxis,
  resolveVisitorProbeKey
} from "../../game/intent.js";
import type { Locale, LocalizedText, ProbeKey, VisitorSpec } from "../../game/types.js";

export interface TranscriptLine {
  speaker: "player" | "npc" | "system";
  text: LocalizedText;
  meta?: string;
}

interface Props {
  visitor: VisitorSpec;
  lang: Locale;
  turnsLeft: number;
  verdictDone: boolean;
  isRephrasing?: boolean;
  transcript: readonly TranscriptLine[];
  onAskProbe: (probeKey: ProbeKey | "off_axis", customText?: string) => void | Promise<void>;
  onExecuteVerdict: (decision: "ADMIT" | "PURGE") => void;
}

export function IntercomPanel({
  visitor,
  lang,
  turnsLeft,
  verdictDone,
  isRephrasing = false,
  transcript,
  onAskProbe,
  onExecuteVerdict
}: Props) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<{ intent: ProbeKey | "off_axis"; text: string } | null>(
    null
  );
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft("");
    setPending(null);
  }, [visitor.id]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [transcript.length, isRephrasing]);

  const askDisabled = turnsLeft <= 0 || verdictDone || isRephrasing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = draft.trim();
    if (!val || askDisabled) return;
    const rawIntent = classifyQuestionIntent(val);
    const resolved = resolveVisitorProbeKey(visitor, rawIntent);
    setPending({ intent: resolved, text: val });
  };

  return (
    <section className="panel" id="intercom-panel">
      <div className="viewport-header">
        <span>{tl(UI_STRINGS.intercomHeader, lang)}</span>
        <span style={{ color: "var(--amber-crt)" }}>TURNS: {turnsLeft} / 4</span>
      </div>

      <div className="intercom-log" id="chat-log" ref={logRef}>
        {transcript.map((item, i) => {
          if (item.speaker === "system") {
            return (
              <div key={i} className="msg-system">
                ORD-OS · {tl(item.text, lang)}
              </div>
            );
          }
          if (item.speaker === "player") {
            return (
              <div key={i} className="msg-player">
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  [OP #09]:{" "}
                </span>
                {tl(item.text, lang)}
              </div>
            );
          }
          return (
            <div key={i} className="msg-npc">
              <div className="msg-meta">
                <span>[{visitor.id} INTERCOM]</span>
                <span>{item.meta ?? ""}</span>
              </div>
              <div>{tl(item.text, lang)}</div>
            </div>
          );
        })}
        {isRephrasing ? (
          <div className="msg-system" id="flash-rephrasing-indicator">
            {tl(UI_STRINGS.rephrasingNote, lang)}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: "9px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        {tl(UI_STRINGS.probeHint, lang)}
      </div>

      <div className="probe-grid" id="probe-buttons">
        {(Object.entries(visitor.probes) as Array<[ProbeKey, NonNullable<VisitorSpec["probes"][ProbeKey]>]>).map(
          ([key, probe]) => (
            <button
              key={key}
              type="button"
              data-probe={key}
              disabled={askDisabled}
              className="probe-chip"
              onClick={() => onAskProbe(key)}
            >
              {tl(probe.label, lang)}
            </button>
          )
        )}
      </div>

      <form className="ask-form" id="custom-ask-form" onSubmit={handleSubmit}>
        <input
          id="custom-ask-input"
          type="text"
          className="ask-input"
          disabled={askDisabled}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={tl(UI_STRINGS.placeholder, lang)}
        />
        <button id="btn-ptt-send" type="submit" disabled={askDisabled} className="ctrl-btn amber">
          {tl(UI_STRINGS.pttSend, lang)}
        </button>
      </form>

      {pending ? (
        <div className="preview-bar" id="ask-preview">
          <span>
            {tl(UI_STRINGS.previewLead, lang)}【
            {previewQuestionAxis(visitor, pending.intent, lang)}】
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              id="btn-ask-confirm"
              type="button"
              className="ctrl-btn amber"
              onClick={() => {
                onAskProbe(pending.intent, pending.text);
                setPending(null);
                setDraft("");
              }}
            >
              {tl({ zh: "确认发送", en: "Confirm", ja: "送信確定" }, lang)}
            </button>
            <button
              id="btn-ask-cancel"
              type="button"
              className="ctrl-btn"
              onClick={() => setPending(null)}
            >
              {tl({ zh: "重改措辞", en: "Edit", ja: "修正" }, lang)}
            </button>
          </div>
        </div>
      ) : null}

      <div className="verdict-levers">
        <button
          id="btn-admit"
          type="button"
          disabled={verdictDone}
          className="lever-btn admit"
          onClick={() => onExecuteVerdict("ADMIT")}
        >
          {tl(UI_STRINGS.admitBtn, lang)}
        </button>
        <button
          id="btn-purge"
          type="button"
          disabled={verdictDone}
          className="lever-btn purge"
          onClick={() => onExecuteVerdict("PURGE")}
        >
          {tl(UI_STRINGS.purgeBtn, lang)}
        </button>
      </div>
    </section>
  );
}
