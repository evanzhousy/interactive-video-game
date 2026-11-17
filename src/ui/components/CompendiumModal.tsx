import { tl } from "../../game/i18n.js";
import { ENDINGS } from "../../game/night5.js";
import {
  ACHIEVEMENTS,
  ALL_ENDING_IDS,
  ENDING_HINTS,
  type CompendiumState
} from "../../game/storage.js";
import type { Locale } from "../../game/types.js";

interface Props {
  lang: Locale;
  compendium: CompendiumState;
  onClose: () => void;
}

export function CompendiumModal({ lang, compendium, onClose }: Props) {
  const unlockedEndings = new Set(compendium.unlockedEndings);
  const unlockedAch = new Set(compendium.unlockedAchievements);

  return (
    <section className="panel compendium-panel" id="compendium-modal">
      <div className="viewport-header" style={{ marginBottom: "12px" }}>
        <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
          🏆 ORD-OS ARCHIVE // {unlockedEndings.size}/7 ENDINGS · {unlockedAch.size}/
          {ACHIEVEMENTS.length} BADGES · RUNS: {compendium.completedRuns}
        </span>
        <button id="btn-close-compendium" type="button" className="ctrl-btn" onClick={onClose}>
          {tl({ zh: "关闭图鉴", en: "Close Archive", ja: "閉じる" }, lang)}
        </button>
      </div>

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
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: isUnlocked ? "var(--amber-crt)" : "var(--text-muted)"
                      }}
                    >
                      {isUnlocked
                        ? `✓ ${tl(endSpec.title, lang)}`
                        : `🔒 [${id}] ${tl({ zh: "未解锁结局", en: "LOCKED ENDING", ja: "未解禁エンディング" }, lang)}`}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.79rem", margin: "5px 0 0", color: "var(--text-secondary)" }}>
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
            {ACHIEVEMENTS.map((ach) => {
              const has = unlockedAch.has(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`dossier-section compendium-card ${has ? "unlocked" : "locked"}`}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: has ? "var(--safe-admit)" : "var(--text-muted)"
                    }}
                  >
                    {has ? "★ " : "☆ "}
                    {tl(ach.title, lang)}
                  </div>
                  <p style={{ fontSize: "0.79rem", margin: "4px 0 0", color: "var(--text-secondary)" }}>
                    {tl(ach.description, lang)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
