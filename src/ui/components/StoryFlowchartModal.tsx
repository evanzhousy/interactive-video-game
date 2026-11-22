import { Button } from "@ui-sdk/react/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@ui-sdk/react/dialog";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport
} from "@ui-sdk/react/scroll-area";
import { tl } from "../../game/i18n.js";
import type { CompendiumState } from "../../game/storage.js";
import {
  STORY_CHAPTER_META,
  STORY_EDGES,
  STORY_NODES,
  getStoryCompletionStats,
  type StoryChapterId,
  type StoryNode
} from "../../game/story-graph.js";
import type { Locale } from "../../game/types.js";
import { ArchiveIcon, LockSealIcon } from "./Icons.js";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Locale;
  compendium: CompendiumState;
  currentNodeId?: string | null;
  onJumpToNode: (nodeId: string) => void;
}

const NODE_W = 196;
const NODE_H = 136;
const COL_GAP = 48;
const ROW_GAP = 20;
const PAD_X = 24;
const PAD_Y = 38;

function nodeX(col: number): number {
  return PAD_X + col * (NODE_W + COL_GAP);
}

function nodeY(row: number): number {
  return PAD_Y + row * (NODE_H + ROW_GAP);
}

const CHAPTER_GROUPS: Array<{ id: StoryChapterId; startCol: number; spanCols: number }> = [
  { id: "prologue", startCol: 0, spanCols: 3 },
  { id: "night1_elena", startCol: 3, spanCols: 3 },
  { id: "night1_corridor", startCol: 6, spanCols: 1 },
  { id: "night1_leo", startCol: 7, spanCols: 3 },
  { id: "nights_2_5", startCol: 10, spanCols: 1 }
];

function kindBadgeText(node: StoryNode, lang: Locale): string {
  if (node.kind === "interrogation") {
    return tl({ zh: "AI 自由审讯", en: "LIVE INTERROGATION", ja: "AI 自由尋問" }, lang);
  }
  if (node.kind === "verdict_branch") {
    return node.id.endsWith("admit")
      ? tl({ zh: "分支 · 放行", en: "BRANCH · ADMIT", ja: "分岐 · 通過" }, lang)
      : tl({ zh: "分支 · 净化", en: "BRANCH · PURGE", ja: "分岐 · 焼却" }, lang);
  }
  if (node.kind === "chapter_hub") {
    return tl({ zh: "主线战役", en: "MAIN CAMPAIGN", ja: "本編ルート" }, lang);
  }
  return node.timerSec
    ? tl({ zh: `互动影片 · ${node.timerSec}s抉择`, en: `FMV · ${node.timerSec}s QTE`, ja: `映像 · ${node.timerSec}s選択` }, lang)
    : tl({ zh: "互动影片", en: "FMV SCENE", ja: "インタラクティブ映像" }, lang);
}

export function StoryFlowchartModal({
  open,
  onOpenChange,
  lang,
  compendium,
  currentNodeId,
  onJumpToNode
}: Props) {
  const unlockedSet = new Set<string>([
    "prologue_01",
    ...(compendium.unlockedStoryNodes ?? [])
  ]);
  const visitedEdges = new Set<string>(compendium.visitedStoryEdges ?? []);
  const stats = getStoryCompletionStats([...unlockedSet]);

  const maxCol = Math.max(...STORY_NODES.map((n) => n.col));
  const canvasW = PAD_X * 2 + (maxCol + 1) * NODE_W + maxCol * COL_GAP;
  const canvasH = PAD_Y + 3 * NODE_H + 2 * ROW_GAP + 24;

  const nodeMap = new Map<string, StoryNode>(STORY_NODES.map((n) => [n.id, n]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogBackdrop />
      <DialogContent
        className="panel compendium-panel gta-dialog-shell story-map-dialog"
        id="story-flowchart-modal"
      >
        <div className="viewport-header" style={{ marginBottom: 0 }}>
          <div>
            <DialogTitle style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <ArchiveIcon />{" "}
              {tl(
                {
                  zh: `剧情故事线总览 // 已探索 ${stats.unlockedCount}/${stats.totalCount} 节点 (${stats.percent}%)`,
                  en: `STORY FLOWCHART // ${stats.unlockedCount}/${stats.totalCount} NODES UNLOCKED (${stats.percent}%)`,
                  ja: `ストーリー分岐図 // ${stats.unlockedCount}/${stats.totalCount} ノード開放 (${stats.percent}%)`
                },
                lang
              )}
            </DialogTitle>
            <DialogDescription>
              {tl(
                {
                  zh: `已解锁 ${compendium.unlockedEndings.length}/7 个终局 · 点击任意已解锁节点即可直接跳转或重播`,
                  en: `${compendium.unlockedEndings.length}/7 Endings Discovered · Click any unlocked node to jump & replay`,
                  ja: `${compendium.unlockedEndings.length}/7 結末発見済 · 開放済みノードをクリックして即座にジャンプ再生`
                },
                lang
              )}
            </DialogDescription>
          </div>

          <DialogClose id="btn-close-storymap" className="ctrl-btn">
            {tl({ zh: "关闭", en: "Close", ja: "閉じる" }, lang)}
          </DialogClose>
        </div>

        <div className="story-map-progress-strip">
          <Progress
            className="hud-progress"
            style={{ flex: 1, marginTop: 0 }}
            value={stats.percent}
            aria-label={tl({ zh: "故事探索度", en: "Story exploration progress", ja: "探索率" }, lang)}
          >
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
          <span className="story-map-pct">{stats.percent}%</span>
        </div>

        <ScrollArea className="story-map-scroll" type="auto">
          <ScrollAreaViewport
            role="region"
            aria-label={tl({ zh: "互动电影剧情分支树", en: "Interactive movie branch tree", ja: "分岐ツリー" }, lang)}
          >
            <ScrollAreaContent>
              <div
                className="story-map-canvas"
                style={{ width: `${canvasW}px`, height: `${canvasH}px` }}
              >
                {/* Chapter Column Headers */}
                {CHAPTER_GROUPS.map((grp) => {
                  const left = nodeX(grp.startCol);
                  const width = grp.spanCols * NODE_W + (grp.spanCols - 1) * COL_GAP;
                  return (
                    <div
                      key={grp.id}
                      className="story-map-chapter-hdr"
                      style={{ left: `${left}px`, width: `${width}px` }}
                    >
                      {tl(STORY_CHAPTER_META[grp.id], lang)}
                    </div>
                  );
                })}

                {/* SVG Connector Edges */}
                <svg
                  className="story-map-edges"
                  width={canvasW}
                  height={canvasH}
                  aria-hidden="true"
                >
                  {STORY_EDGES.map((edge) => {
                    const fromNode = nodeMap.get(edge.from);
                    const toNode = nodeMap.get(edge.to);
                    if (!fromNode || !toNode) return null;

                    const x1 = nodeX(fromNode.col) + NODE_W;
                    const y1 = nodeY(fromNode.row) + NODE_H / 2;
                    const x2 = nodeX(toNode.col);
                    const y2 = nodeY(toNode.row) + NODE_H / 2;
                    const midX = (x1 + x2) / 2;

                    const isUnlocked =
                      visitedEdges.has(edge.id) ||
                      (unlockedSet.has(edge.from) && unlockedSet.has(edge.to));
                    const strokeColor = !isUnlocked
                      ? "rgba(228, 236, 242, 0.14)"
                      : edge.branch === "purge"
                        ? "rgba(224, 70, 52, 0.85)"
                        : edge.branch === "admit"
                          ? "rgba(73, 184, 130, 0.85)"
                          : "rgba(235, 168, 52, 0.85)";

                    return (
                      <g key={edge.id}>
                        <path
                          d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isUnlocked ? 2.5 : 1.5}
                          strokeDasharray={isUnlocked ? undefined : "4 4"}
                        />
                        <circle
                          cx={x2}
                          cy={y2}
                          r={isUnlocked ? 3.5 : 2}
                          fill={strokeColor}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Story Node Cards */}
                {STORY_NODES.map((node) => {
                  const unlocked = unlockedSet.has(node.id);
                  const isCurrent = currentNodeId === node.id;
                  const canJump = unlocked && node.id !== "n1_elena_admit" && node.id !== "n1_elena_purge" && node.id !== "n1_leo_admit" && node.id !== "n1_leo_purge";
                  const branchClass =
                    node.id.includes("admit")
                      ? "branch-admit"
                      : node.id.includes("purge")
                        ? "branch-purge"
                        : "";

                  return (
                    <div
                      key={node.id}
                      data-flowchart-node={node.id}
                      data-unlocked={unlocked ? "true" : "false"}
                      className={`story-node-card ${unlocked ? "unlocked" : "locked"} ${
                        isCurrent ? "is-current" : ""
                      } ${branchClass}`.trim()}
                      style={{
                        left: `${nodeX(node.col)}px`,
                        top: `${nodeY(node.row)}px`,
                        width: `${NODE_W}px`,
                        height: `${NODE_H}px`
                      }}
                    >
                      <div className="story-node-thumb">
                        {unlocked ? (
                          <img
                            src={node.posterSrc}
                            alt=""
                            decoding="async"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.fb && node.fallbackPosterSrc !== node.posterSrc) {
                                e.currentTarget.dataset.fb = "1";
                                e.currentTarget.src = node.fallbackPosterSrc;
                              }
                            }}
                          />
                        ) : (
                          <div className="story-node-fog" aria-hidden="true">
                            <LockSealIcon />
                          </div>
                        )}
                        <span className="story-node-code">{node.code}</span>
                      </div>

                      <div className="story-node-body">
                        <div className="story-node-kind">
                          {unlocked
                            ? kindBadgeText(node, lang)
                            : tl({ zh: "未解锁分支", en: "LOCKED BRANCH", ja: "未開放" }, lang)}
                        </div>
                        <div className="story-node-title">
                          {unlocked
                            ? tl(node.title, lang)
                            : tl({ zh: "??? // 尚未抵达", en: "??? // UNEXPLORED", ja: "??? // 未到達" }, lang)}
                        </div>

                        {canJump ? (
                          <Button
                            type="button"
                            className="story-node-jump-btn"
                            data-jump-node={node.id}
                            onClick={() => {
                              onJumpToNode(node.id);
                              onOpenChange(false);
                            }}
                          >
                            {isCurrent
                              ? tl({ zh: "当前节点 · 重播 ▶", en: "CURRENT · REPLAY ▶", ja: "現在地 · 再開 ▶" }, lang)
                              : tl({ zh: "跳转至此 ▶", en: "JUMP HERE ▶", ja: "ここへ移動 ▶" }, lang)}
                          </Button>
                        ) : unlocked ? (
                          <span className="story-node-settled">
                            {tl({ zh: "已记录分支", en: "BRANCH LOGGED", ja: "記録済" }, lang)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollAreaContent>
          </ScrollAreaViewport>
          <ScrollAreaScrollbar orientation="horizontal" className="gta-dossier-scrollbar">
            <ScrollAreaThumb className="gta-dossier-thumb" />
          </ScrollAreaScrollbar>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
