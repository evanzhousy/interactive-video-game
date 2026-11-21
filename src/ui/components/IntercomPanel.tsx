import { Button } from "@ui-sdk/react/button";
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input";
import { Label } from "@ui-sdk/react/label";
import { Meter, MeterIndicator, MeterTrack } from "@ui-sdk/react/meter";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  createScrollAreaController
} from "@ui-sdk/react/scroll-area";
import { useEffect, useState } from "react";
import { UI_STRINGS, tl } from "../../game/i18n.js";
import {
  classifyQuestionIntent,
  previewQuestionAxis,
  resolveVisitorProbeKey
} from "../../game/intent.js";
import type { Locale, LocalizedText, ProbeKey, VisitorSpec } from "../../game/types.js";
import { ClearIcon, MicSignalIcon } from "./Icons.js";
import { CommsWaveformSvg, IsometricLeverGlyph } from "./Schematics.js";

export interface TranscriptLine {
  speaker: "player" | "npc" | "system";
  text: LocalizedText;
  meta?: string;
}

interface Props {
  visitor: VisitorSpec;
  lang: Locale;
  turnsLeft: number;
  chatterLeft?: number;
  fuelLeft?: number;
  verdictDone: boolean;
  isRephrasing?: boolean;
  streamingText?: string | null;
  signalGlitch?: boolean;
  transcript: readonly TranscriptLine[];
  onAskProbe: (probeKey: ProbeKey | "off_axis", customText?: string) => void | Promise<void>;
  onExecuteVerdict: (decision: "ADMIT" | "PURGE") => void;
}

export function IntercomPanel({
  visitor,
  lang,
  turnsLeft,
  chatterLeft = 3,
  fuelLeft = 5,
  verdictDone,
  isRephrasing = false,
  streamingText = null,
  signalGlitch = false,
  transcript,
  onAskProbe,
  onExecuteVerdict
}: Props) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<{ intent: ProbeKey | "off_axis"; text: string } | null>(
    null
  );
  const [scrollController] = useState(() => createScrollAreaController());

  useEffect(() => {
    setDraft("");
    setPending(null);
  }, [visitor.id]);

  useEffect(() => {
    scrollController.scrollToEnd({ behavior: "instant" });
  }, [scrollController, transcript.length, isRephrasing, streamingText]);

  const askDisabled = turnsLeft <= 0 || verdictDone || isRephrasing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = draft.trim();
    if (!val || askDisabled) return;
    const rawIntent = classifyQuestionIntent(val, visitor);
    const resolved = resolveVisitorProbeKey(visitor, rawIntent);
    setPending({ intent: resolved, text: val });
  };

  return (
    <section className="panel" id="intercom-panel">
      <div className="viewport-header">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
          <MicSignalIcon /> {tl({ zh: "对讲 // CH-01", en: "COMMS // CH-01", ja: "通話 // CH-01" }, lang)}
          <CommsWaveformSvg active={isRephrasing} />
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="chatter-pill"
            id="chatter-budget-pill"
            title={tl(
              {
                zh: "闲聊/试探额度：非冲突轴提问优先消耗此额度，不扣有效追问回合",
                en: "Chatter budget: off-axis/trivia questions consume this before core turns",
                ja: "雑談枠：本題外の質問はこの枠を先に消費（有効尋問を消費しない）"
              },
              lang
            )}
          >
            {tl({ zh: `闲聊 ${chatterLeft}/3`, en: `CHAT ${chatterLeft}/3`, ja: `雑談 ${chatterLeft}/3` }, lang)}
          </span>
          <Meter
            className="hud-meter turns-meter"
            value={turnsLeft}
            min={0}
            max={4}
            aria-label={tl(
              {
                zh: "剩余有效追问回合",
                en: "Core interrogation turns remaining",
                ja: "残り有効尋問ターン"
              },
              lang
            )}
          >
            <MeterTrack>
              <MeterIndicator />
            </MeterTrack>
          </Meter>
          <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>{turnsLeft}/4</span>
        </div>
      </div>

      <ScrollArea controller={scrollController} stickToEnd type="auto">
        <ScrollAreaViewport
          className="intercom-log"
          id="chat-log"
          role="log"
          aria-label="Intercom CH-01 transcript"
        >
          <ScrollAreaContent style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
            {isRephrasing && streamingText ? (
              <div className="msg-npc streaming" id="intercom-streaming-bubble">
                <div className="msg-meta">
                  <span>[{visitor.id} INTERCOM // LIVE]</span>
                  <span>STREAMING · CH-01</span>
                </div>
                <div>
                  {streamingText}
                  <span className="stream-caret" aria-hidden="true">▌</span>
                </div>
              </div>
            ) : isRephrasing ? (
              <div className="msg-system" id="flash-rephrasing-indicator">
                {tl(UI_STRINGS.rephrasingNote, lang)}
              </div>
            ) : null}
            {signalGlitch ? (
              <div className="msg-system glitch" id="signal-glitch-banner">
                {tl(
                  {
                    zh: "⚡ [CH-01 信号干扰 // 极地静电截断] 已切换至抗干扰备份链路。",
                    en: "⚡ [CH-01 STATIC INTERFERENCE] Signal scrubbed — switched to hardened backup relay.",
                    ja: "⚡ [CH-01 信号干渉 // 極地静電遮断] 冗長バックアップ回線へ切替。"
                  },
                  lang
                )}
              </div>
            ) : null}
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="vertical">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
      </ScrollArea>

      <div className="probe-grid" id="probe-buttons">
        {(Object.entries(visitor.probes) as Array<[ProbeKey, NonNullable<VisitorSpec["probes"][ProbeKey]>]>).map(
          ([key, probe], idx) => (
            <Button
              key={key}
              data-probe={key}
              disabled={askDisabled}
              className="probe-chip"
              onClick={() => void onAskProbe(key)}
            >
              <span className="opt-index">0{idx + 1}</span>
              <span>{tl(probe.label, lang)}</span>
            </Button>
          )
        )}
      </div>

      <form className="ask-form" id="custom-ask-form" onSubmit={handleSubmit}>
        <Label htmlFor="custom-ask-input" className="visually-hidden">
          {tl(UI_STRINGS.placeholder, lang)}
        </Label>
        <InputGroup className="ask-input-group">
          <Input
            id="custom-ask-input"
            type="text"
            className="ask-input"
            disabled={askDisabled}
            value={draft}
            onValueChange={setDraft}
            placeholder={tl(UI_STRINGS.placeholder, lang)}
          />
          <InputClear
            aria-label={tl(
              { zh: "清空提问", en: "Clear question", ja: "入力をクリア" },
              lang
            )}
          >
            <ClearIcon />
          </InputClear>
        </InputGroup>
        <Button id="btn-ptt-send" type="submit" disabled={askDisabled} className="ctrl-btn amber">
          {tl(UI_STRINGS.pttSend, lang)}
        </Button>
      </form>

      {pending ? (
        <div className="preview-bar" id="ask-preview">
          <span>
            {tl(UI_STRINGS.previewLead, lang)}【
            {previewQuestionAxis(visitor, pending.intent, lang)}】
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <Button
              id="btn-ask-confirm"
              className="ctrl-btn amber"
              onClick={() => {
                void onAskProbe(pending.intent, pending.text);
                setPending(null);
                setDraft("");
              }}
            >
              {tl({ zh: "确认发送", en: "Confirm", ja: "送信確定" }, lang)}
            </Button>
            <Button id="btn-ask-cancel" className="ctrl-btn" onClick={() => setPending(null)}>
              {tl({ zh: "重改措辞", en: "Edit", ja: "修正" }, lang)}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="verdict-levers">
        <div className="lever-slot">
          <Button
            id="btn-admit"
            disabled={verdictDone}
            className="lever-btn admit"
            onClick={() => onExecuteVerdict("ADMIT")}
          >
            <IsometricLeverGlyph kind="admit" />
            <div className="lever-copy">
              <span className="lever-tag">
                {tl({ zh: "[SW-01 // 放行]", en: "[SW-01 // ADMIT]", ja: "[SW-01 // 通過]" }, lang)}
              </span>
              <span>{tl(UI_STRINGS.admitBtn, lang)}</span>
            </div>
          </Button>
        </div>
        <div className="lever-slot">
          <Button
            id="btn-purge"
            disabled={verdictDone}
            className="lever-btn purge"
            onClick={() => onExecuteVerdict("PURGE")}
          >
            <IsometricLeverGlyph kind="purge" />
            <div className="lever-copy">
              <span className="lever-tag">
                {tl({ zh: "[SW-02 // 高温净化]", en: "[SW-02 // INCINERATE]", ja: "[SW-02 // 焼却]" }, lang)}
              </span>
              <span>
                {tl(UI_STRINGS.purgeBtn, lang)} {fuelLeft > 0 ? "[-1 FUEL]" : "[! OVERDRAFT]"}
              </span>
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
}
