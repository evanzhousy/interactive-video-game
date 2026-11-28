import { Button } from "@ui-sdk/react/button";
import { useEffect, useState } from "react";
import { tl } from "../../game/i18n.js";
import {
  CAST_VISUAL_ASSETS,
  PROP_VISUAL_ASSETS,
  SET_VISUAL_ASSETS,
  STUDIO_STORYBOARD_SHOTS
} from "../../game/production-board.js";
import type { Locale } from "../../game/types.js";
import { ProductionStudioView, type StudioTab } from "./ProductionStudioView.js";

type HubPage = "kanban" | "storyboard" | "assets";

function readHashPage(): HubPage {
  if (typeof window === "undefined") return "kanban";
  const h = window.location.hash.replace(/^#/, "").toLowerCase();
  if (h === "storyboard" || h === "blocking") return "storyboard";
  if (h === "assets") return "assets";
  return "kanban";
}

export function InternalHubApp() {
  const [lang, setLang] = useState<Locale>("zh");
  const [motionPaused, setMotionPaused] = useState(false);
  const [page, setPage] = useState<HubPage>(() => readHashPage());
  const [storyboardSubTab, setStoryboardSubTab] = useState<"storyboard" | "blocking">("storyboard");

  useEffect(() => {
    const onHashChange = () => {
      const next = readHashPage();
      setPage(next);
      if (window.location.hash === "#blocking") {
        setStoryboardSubTab("blocking");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigatePage = (nextPage: HubPage) => {
    setPage(nextPage);
    try {
      window.history.replaceState(null, "", `#${nextPage}`);
    } catch {
      // ignore in restricted environments
    }
  };

  const activeStudioTab: StudioTab =
    page === "kanban" ? "kanban" : page === "assets" ? "assets" : storyboardSubTab;

  const handleStudioTabChange = (nextTab: StudioTab) => {
    if (nextTab === "kanban") {
      navigatePage("kanban");
      return;
    }
    if (nextTab === "assets") {
      navigatePage("assets");
      return;
    }
    setStoryboardSubTab(nextTab);
    navigatePage("storyboard");
  };

  const totalAssets =
    CAST_VISUAL_ASSETS.length + PROP_VISUAL_ASSETS.length + SET_VISUAL_ASSETS.length;

  return (
    <div className="internal-hub-shell" id="internal-hub-app">
      <aside className="internal-hub-sidebar" aria-label="Internal Production Hub Navigation">
        <div className="internal-hub-brand">
          <div className="internal-hub-kicker">GATE 0 // INTERNAL HUB</div>
          <h1 className="internal-hub-title">
            {tl(
              { zh: "零号隔离窗 · 内部制片台", en: "Quarantine Gate 0 Studio", ja: "零号隔離窓 制作ハブ" },
              lang
            )}
          </h1>
          <div className="internal-hub-sub">
            {tl(
              { zh: "仓库直连单一数据源", en: "Repo Single Source of Truth", ja: "リポジトリ直結データ" },
              lang
            )}
          </div>
        </div>

        <nav className="internal-hub-nav">
          <button
            type="button"
            id="nav-hub-kanban"
            className={`internal-hub-nav-btn ${page === "kanban" ? "active" : ""}`}
            onClick={() => navigatePage("kanban")}
          >
            <span className="hub-nav-icon">◫</span>
            <span>
              {tl({ zh: "制片看板 Kanban", en: "Kanban Board", ja: "制作カンバン" }, lang)}
            </span>
          </button>
          <button
            type="button"
            id="nav-hub-storyboard"
            className={`internal-hub-nav-btn ${page === "storyboard" ? "active" : ""}`}
            onClick={() => navigatePage("storyboard")}
          >
            <span className="hub-nav-icon">🎬</span>
            <span>
              {tl(
                {
                  zh: `分镜与 3D 预演 (${STUDIO_STORYBOARD_SHOTS.length})`,
                  en: `Storyboard & 3D (${STUDIO_STORYBOARD_SHOTS.length})`,
                  ja: `絵コンテ & 3D (${STUDIO_STORYBOARD_SHOTS.length})`
                },
                lang
              )}
            </span>
          </button>
          <button
            type="button"
            id="nav-hub-assets"
            className={`internal-hub-nav-btn ${page === "assets" ? "active" : ""}`}
            onClick={() => navigatePage("assets")}
          >
            <span className="hub-nav-icon">◈</span>
            <span>
              {tl(
                {
                  zh: `公共造型资产 (${totalAssets})`,
                  en: `Shared Assets (${totalAssets})`,
                  ja: `共通アセット (${totalAssets})`
                },
                lang
              )}
            </span>
          </button>
        </nav>

        <div className="internal-hub-metrics">
          <div>27 Pre-viz Shots</div>
          <div>19 Cast / Prop / Set Assets</div>
          <div>226 MiniMax-H3 Scripted Shots</div>
        </div>

        <div className="internal-hub-footer">
          <div className="internal-hub-lang-row">
            {(["zh", "en", "ja"] as const).map((code) => (
              <Button
                key={code}
                type="button"
                className={`ctrl-btn ${lang === code ? "amber" : ""}`}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            className={`ctrl-btn ${motionPaused ? "amber" : ""}`}
            onClick={() => setMotionPaused((v) => !v)}
          >
            {motionPaused
              ? tl({ zh: "动效：已暂停", en: "Motion: Paused", ja: "演出：停止" }, lang)
              : tl({ zh: "动效：运行中", en: "Motion: Live", ja: "演出：稼働" }, lang)}
          </Button>
          <a className="ctrl-btn internal-hub-game-link" href="./index.html">
            {tl({ zh: "↗ 打开游戏主端", en: "↗ Open Game App", ja: "↗ ゲーム本編へ" }, lang)}
          </a>
        </div>
      </aside>

      <main className="internal-hub-main">
        <header className="internal-hub-topbar">
          <div className="internal-hub-breadcrumb">
            <span className="telem-k">INTERNAL //</span>
            <strong>
              {page === "kanban"
                ? tl({ zh: "Linear 制片看板", en: "Linear Production Kanban", ja: "制作カンバン" }, lang)
                : page === "assets"
                  ? tl({ zh: "公共造型与材质圣经", en: "Shared Assets & Look-Dev Bible", ja: "共通アセット庫" }, lang)
                  : tl({ zh: "分镜头工作台 & Three.js 3D 预演", en: "Storyboard & Three.js 3D Pre-viz", ja: "絵コンテ & 3D舞台" }, lang)}
            </strong>
          </div>

          {page === "storyboard" ? (
            <div className="internal-hub-subswitch" role="group" aria-label="Storyboard Sub-View">
              <Button
                type="button"
                id="btn-hub-sub-storyboard"
                className={`ctrl-btn ${storyboardSubTab === "storyboard" ? "amber" : ""}`}
                onClick={() => setStoryboardSubTab("storyboard")}
              >
                {tl(
                  {
                    zh: `分镜网格 (${STUDIO_STORYBOARD_SHOTS.length})`,
                    en: `Storyboard Grid (${STUDIO_STORYBOARD_SHOTS.length})`,
                    ja: `絵コンテ (${STUDIO_STORYBOARD_SHOTS.length})`
                  },
                  lang
                )}
              </Button>
              <Button
                type="button"
                id="btn-hub-sub-blocking"
                className={`ctrl-btn ${storyboardSubTab === "blocking" ? "amber" : ""}`}
                onClick={() => setStoryboardSubTab("blocking")}
              >
                {tl({ zh: "3D 白模片场", en: "3D White-Box Stage", ja: "3D白模ステージ" }, lang)}
              </Button>
            </div>
          ) : null}
        </header>

        <div className="internal-hub-content">
          <ProductionStudioView
            lang={lang}
            motionPaused={motionPaused}
            initialTab={activeStudioTab}
            externalTab={activeStudioTab}
            onTabChange={handleStudioTabChange}
            standaloneMode
            onBack={() => navigatePage("kanban")}
          />
        </div>
      </main>
    </div>
  );
}
