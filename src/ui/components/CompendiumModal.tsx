import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@ui-sdk/react/dialog";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport
} from "@ui-sdk/react/scroll-area";
import { tl } from "../../game/i18n.js";
import { ENDINGS } from "../../game/night5.js";
import { ACHIEVEMENTS, ALL_ENDING_IDS, ENDING_HINTS, type CompendiumState } from "../../game/storage.js";
import type { Locale } from "../../game/types.js";
import { ArchiveIcon, LockSealIcon } from "./Icons.js";
import { AchievementMedallionSvg, EndingConstellationSvg } from "./Schematics.js";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Locale;
  compendium: CompendiumState;
}

export function CompendiumModal({ open, onOpenChange, lang, compendium }: Props) {
  const unlockedEndings = new Set(compendium.unlockedEndings);
  const unlockedAch = new Set(compendium.unlockedAchievements);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogBackdrop />
      <DialogContent className="panel compendium-panel" id="compendium-modal">
        <div className="viewport-header" style={{ marginBottom: 0 }}>
          <div>
            <DialogTitle style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArchiveIcon /> ORD-OS ARCHIVE // {unlockedEndings.size}/7 ENDINGS · {unlockedAch.size}/
              {ACHIEVEMENTS.length} BADGES · RUNS: {compendium.completedRuns}
            </DialogTitle>
            <DialogDescription>
              ENDINGS [{unlockedEndings.size}/7] · COMMENDATIONS [{unlockedAch.size}/{ACHIEVEMENTS.length}] · ESC
            </DialogDescription>
          </div>
          <DialogClose id="btn-close-compendium" className="ctrl-btn">
            {tl({ zh: "关闭", en: "Close", ja: "閉じる" }, lang)}
          </DialogClose>
        </div>

        <EndingConstellationSvg unlockedEndings={unlockedEndings} lang={lang} />

        <ScrollArea className="compendium-scroll-area" type="auto">
          <ScrollAreaViewport
            role="region"
            aria-label={tl(
              { zh: "终局与勋章档案", en: "Archive records", ja: "アーカイブ記録" },
              lang
            )}
          >
            <ScrollAreaContent>
              <div className="booth-grid">
                <div>
                  <div className="section-kicker">
                    {tl(
                      {
                        zh: "7 种第 5 夜终局自审档案（已解锁显示全文 · 未解锁显示侦破线索）",
                        en: "7 NIGHT-5 SELF-AUDIT ENDINGS (UNLOCKED RECORDS & DEDUCTION HINTS)",
                        ja: "全7種の第5夜エンディング記録（未解禁は到達ヒントを表示）"
                      },
                      lang
                    )}
                  </div>
                  <div className="compendium-list">
                    {ALL_ENDING_IDS.map((id) => {
                      const isUnlocked = unlockedEndings.has(id);
                      const endSpec = ENDINGS[id];
                      return (
                        <div
                          key={id}
                          className={`dossier-section compendium-card ${isUnlocked ? "unlocked" : "locked"}`}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                color: isUnlocked ? "var(--amber-crt)" : "var(--text-muted)"
                              }}
                            >
                              {isUnlocked ? (
                                `[OK] ${tl(endSpec.title, lang)}`
                              ) : (
                                <>
                                  <LockSealIcon /> [{id}]{" "}
                                  {tl({ zh: "未解锁结局", en: "LOCKED ENDING", ja: "未解禁エンディング" }, lang)}
                                </>
                              )}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "0.79rem",
                              margin: "5px 0 0",
                              color: "var(--text-secondary)"
                            }}
                          >
                            {isUnlocked ? tl(endSpec.body, lang) : tl(ENDING_HINTS[id], lang)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="section-kicker">
                    {tl(
                      {
                        zh: "检疫官 #09 法医审讯勋章",
                        en: "FORENSIC INTERROGATOR COMMENDATIONS",
                        ja: "検疫官 #09 法医尋問勲章"
                      },
                      lang
                    )}
                  </div>
                  <div className="compendium-list">
                    {ACHIEVEMENTS.map((ach, idx) => {
                      const has = unlockedAch.has(ach.id);
                      return (
                        <div
                          key={ach.id}
                          className={`dossier-section compendium-card ${has ? "unlocked" : "locked"}`}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              color: has ? "var(--safe-admit)" : "var(--text-muted)"
                            }}
                          >
                            <AchievementMedallionSvg unlocked={has} index={idx} />
                            <span>{tl(ach.title, lang)}</span>
                          </div>
                          <p
                            style={{
                              fontSize: "0.79rem",
                              margin: "5px 0 0",
                              color: "var(--text-secondary)"
                            }}
                          >
                            {tl(ach.description, lang)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollAreaContent>
          </ScrollAreaViewport>
          <ScrollAreaScrollbar orientation="vertical">
            <ScrollAreaThumb />
          </ScrollAreaScrollbar>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
