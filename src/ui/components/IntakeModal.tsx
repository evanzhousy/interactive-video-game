import { Button } from "@ui-sdk/react/button";
import { useEffect, useState } from "react";
import { tl } from "../../game/i18n.js";
import {
  INTAKE_QUESTIONS,
  computePlayerProfile,
  type IntakeOption,
  type PlayerCompactProfile
} from "../../game/night5.js";
import { PROLOGUE_NODE_IDS, getStoryNode } from "../../game/story-graph.js";
import type { Locale, LocalizedText } from "../../game/types.js";
import { InteractiveMoviePlayer } from "./InteractiveMoviePlayer.js";

const TRAIT_POETIC_LINE: Record<string, LocalizedText> = {
  care: {
    zh: "你选择先把人的温度记在心里，即使极夜要求你攥紧门闸。",
    en: "You carry the human cost inside, even as the Polar Night demands an iron gate.",
    ja: "極夜が鉄の扉を求めても、あなたは仲間の温度を心に留めようとした。"
  },
  order: {
    zh: "你习惯以秩序与规则抵御未知，相信程序是黑夜里最后的栏杆。",
    en: "You anchor yourself to protocol—trusting the last railing against the unknown.",
    ja: "未知の暗闇に対し、あなたは規律と手順を最後の拠り所として選んだ。"
  },
  truth: {
    zh: "你不愿靠谎言换取安宁，哪怕直面真相会让整座站陷入寒意。",
    en: "You refuse easy lies for comfort, even when truth chills every corridor.",
    ja: "安らぎのための嘘を拒み、凍てつく真実と向き合う道を選んだ。"
  },
  bond: {
    zh: "纵使风雪切断了一切无线电，你仍把同伴的脸与名字当作底线。",
    en: "With radios dead in the whiteout, faces and names remain the line you refuse to cross.",
    ja: "通信が途絶えても、仲間の顔と名前だけは手放さないと決めた。"
  }
};

interface Props {
  lang: Locale;
  operatorName?: string;
  motionPaused?: boolean;
  voiceEnabled?: boolean;
  initialStep?: number;
  onUnlockNode?: (nodeIds: string[], edgeIds?: string[]) => void;
  onOpenStoryMap?: () => void;
  onComplete: (baseline: PlayerCompactProfile, answers: IntakeOption[]) => void;
}

export function IntakeModal({
  lang,
  operatorName = "",
  motionPaused = false,
  voiceEnabled = true,
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
          key={currentNode.id}
          node={currentNode}
          lang={lang}
          motionPaused={motionPaused}
          voiceEnabled={voiceEnabled}
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

  const baselineNarrative =
    baseline && (TRAIT_POETIC_LINE[baseline.kept] ?? TRAIT_POETIC_LINE.truth)!;

  return (
    <section className="panel modal-stage fmv-handover-card cinema-title-curtain" id="intake-panel">
      <img
        src="./portraits/story/ep0_lonely_watch.jpg"
        alt=""
        className="cinema-curtain-bg"
        aria-hidden="true"
      />
      <div className="cinema-curtain-scrim" aria-hidden="true" />

      <div className="cinema-curtain-content">
        <div className="section-kicker intake-header-row">
          <span>
            {tl(
              {
                zh: "序幕完 · 2036.10.30 // 北纬 78°13′ 斯瓦尔巴零号站",
                en: "EPISODE 0 COMPLETE // OCT 30, 2036 · SVALBARD OUTPOST 0 (78°13'N)",
                ja: "序章終 // 2036.10.30 スヴァールバル第0前哨基地 · 北緯78°13'"
              },
              lang
            )}
          </span>
          <span className="tech-stamp">
            {tl({ zh: `值班卡 // ${displayOp}`, en: `BADGE // ${displayOp}`, ja: `当直証 // ${displayOp}` }, lang)}
          </span>
        </div>

        <div className="cinema-curtain-hero">
          <div className="cinema-curtain-eyebrow">
            {tl(
              {
                zh: "全片片头 // GATE ZERO",
                en: "MAIN TITLE // GATE ZERO",
                ja: "メインタイトル // GATE ZERO"
              },
              lang
            )}
          </div>
          <h2 className="cinema-curtain-title">
            {tl(
              {
                zh: "《零号隔离窗 // GATE ZERO》",
                en: "QUARANTINE GATE 0 // 2036",
                ja: "『第0隔離窓 // GATE ZERO』"
              },
              lang
            )}
          </h2>
          {baselineNarrative ? (
            <p className="cinema-curtain-quote">{tl(baselineNarrative, lang)}</p>
          ) : null}
          <p className="cinema-curtain-hook">
            {tl(
              {
                zh: "极夜彻底吞没站外风雪，对讲机里传来第一声急促敲窗——你的每一个抉择都会决定谁能活过这五个夜晚。",
                en: "The polar whiteout swallows the perimeter. Moments later, the first desperate knock hits Gate 0—every choice from here shapes who survives the five nights.",
                ja: "極夜が基地を飲み込んだ直後、防爆ガラスに最初のノックが響く——ここからの選択が五つの夜の生死を分ける。"
              },
              lang
            )}
          </p>
        </div>

        {baseline ? (
          <div className="cinema-curtain-actions">
            <Button
              id="btn-start-shift"
              className="ctrl-btn amber cinema-curtain-cta"
              onClick={() => onComplete(baseline, answers)}
            >
              {tl(
                {
                  zh: "进入第 1 夜 · 第一道裂缝 ▶",
                  en: "Enter Night 1 · The First Crack ▶",
                  ja: "第1夜へ · 最初の亀裂 ▶"
                },
                lang
              )}
            </Button>
            <Button
              type="button"
              className="ctrl-btn"
              onClick={() => setAnswers([])}
            >
              {tl({ zh: "↺ 重播序章背景", en: "↺ Replay Episode 0", ja: "↺ 序章を最初から" }, lang)}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
