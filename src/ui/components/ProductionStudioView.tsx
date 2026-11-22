import { Button } from "@ui-sdk/react/button";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport
} from "@ui-sdk/react/scroll-area";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { useState } from "react";
import { tl } from "../../game/i18n.js";
import {
  CAST_VISUAL_ASSETS,
  LOOK_DEV_SWATCHES,
  STUDIO_STORYBOARD_SHOTS
} from "../../game/production-board.js";
import type { Locale } from "../../game/types.js";
import { ThreeBlockingStage } from "./ThreeBlockingStage.js";

export type StudioTab = "assets" | "storyboard" | "blocking";

interface Props {
  lang: Locale;
  motionPaused: boolean;
  initialTab?: StudioTab;
  onBack: () => void;
  onPlayStoryNode?: (nodeId: string) => void;
}

export function ProductionStudioView({
  lang,
  motionPaused,
  initialTab = "assets",
  onBack,
  onPlayStoryNode
}: Props) {
  const [tab, setTab] = useState<StudioTab>(initialTab);
  const [selectedShotId, setSelectedShotId] = useState<string>(
    STUDIO_STORYBOARD_SHOTS[3]?.id ?? STUDIO_STORYBOARD_SHOTS[0]!.id
  );

  const selectedShot =
    STUDIO_STORYBOARD_SHOTS.find((s) => s.id === selectedShotId) ?? STUDIO_STORYBOARD_SHOTS[0]!;

  return (
    <section className="panel modal-stage studio-shell" id="production-studio-view">
      <div className="studio-header">
        <div>
          <div className="section-kicker">
            {tl(
              {
                zh: "HOLLYWOOD 制片美术与分镜设计台 // QUARANTINE GATE 0",
                en: "PRODUCTION DESIGN BIBLE // LOOK-DEV · STORYBOARD · 3D BLOCKING",
                ja: "制作デザインボード // ビジュアル資産・絵コンテ・3Dカメラ配置"
              },
              lang
            )}
          </div>
          <h2 className="studio-title">
            {tl(
              {
                zh: "公共视觉资产板 · 分镜头脚本 · Three.js 三维机位调度",
                en: "Visual Asset Board · Storyboard · Three.js 3D Blocking Stage",
                ja: "公共ビジュアル資産・絵コンテ・Three.js 3D演出ステージ"
              },
              lang
            )}
          </h2>
        </div>

        <Button type="button" id="btn-studio-back" className="ctrl-btn amber" onClick={onBack}>
          {tl({ zh: "← 返回游戏", en: "← Back to Game", ja: "← ゲームへ戻る" }, lang)}
        </Button>
      </div>

      <Tabs
        className="studio-tabs-root"
        value={tab}
        onValueChange={(next) => {
          if (next) setTab(next as StudioTab);
        }}
      >
        <TabsList className="tab-strip studio-tab-strip" aria-label="Production Studio Sections">
          <TabsTab
            value="assets"
            id="tab-studio-assets"
            className={`tab-btn ${tab === "assets" ? "active" : ""}`}
          >
            {tl({ zh: "01 公共视觉资产板", en: "01 ASSET BOARD", ja: "01 視覚資産" }, lang)}
          </TabsTab>
          <TabsTab
            value="storyboard"
            id="tab-studio-storyboard"
            className={`tab-btn ${tab === "storyboard" ? "active" : ""}`}
          >
            {tl(
              {
                zh: `02 分镜头脚本 (${STUDIO_STORYBOARD_SHOTS.length})`,
                en: `02 STORYBOARD (${STUDIO_STORYBOARD_SHOTS.length})`,
                ja: `02 絵コンテ (${STUDIO_STORYBOARD_SHOTS.length})`
              },
              lang
            )}
          </TabsTab>
          <TabsTab
            value="blocking"
            id="tab-studio-blocking"
            className={`tab-btn ${tab === "blocking" ? "active" : ""}`}
          >
            {tl(
              {
                zh: "03 Three.js 3D 场景与镜头调度",
                en: "03 3D BLOCKING STAGE",
                ja: "03 3Dカメラ配置"
              },
              lang
            )}
          </TabsTab>
          <TabsIndicator className="tab-indicator" />
        </TabsList>

        <TabsPanel value="assets" className="studio-tab-panel">
          <ScrollArea className="studio-scroll-area" type="auto">
            <ScrollAreaViewport>
              <ScrollAreaContent className="studio-scroll-body">
                {/* Look-Dev Color Palette & 35mm Cinema Standard */}
                <div className="dossier-section studio-lookdev-bar">
                  <div className="section-kicker">
                    {tl(
                      {
                        zh: "统一电影质感规范 // 35MM ANAMORPHIC · -46°C 极夜色调与哑光肤质",
                        en: "LOOK-DEV BIBLE // 35MM ANAMORPHIC · POLAR CYAN & SODIUM AMBER",
                        ja: "ルックデブ基準 // 35mmアナモルフィック・マット質感"
                      },
                      lang
                    )}
                  </div>
                  <div className="studio-swatch-grid">
                    {LOOK_DEV_SWATCHES.map((sw) => (
                      <div key={sw.id} className="studio-swatch-card">
                        <span
                          className="studio-swatch-chip"
                          style={{ backgroundColor: sw.hex }}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="studio-swatch-title">
                            {tl(sw.label, lang)} <code>{sw.hex}</code>
                          </div>
                          <div className="studio-swatch-desc">{tl(sw.usage, lang)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Canonical Character & Voice Reference Board */}
                <div className="asset-board-grid">
                  {CAST_VISUAL_ASSETS.map((cast) => (
                    <article
                      key={cast.id}
                      data-cast-asset={cast.id}
                      className="dossier-section asset-cast-card"
                      style={{ borderLeftColor: cast.colorTag }}
                    >
                      <div className="asset-cast-top">
                        <div className="asset-cast-primary-img">
                          <img src={cast.portraitSrc} alt={tl(cast.name, lang)} decoding="sync" />
                          <span className="story-node-code">{cast.code}</span>
                        </div>
                        {cast.flinchSrc || cast.leanInSrc ? (
                          <div className="asset-cast-reactions">
                            {cast.flinchSrc ? (
                              <img src={cast.flinchSrc} alt="" decoding="sync" title="Flinch Reference" />
                            ) : null}
                            {cast.leanInSrc ? (
                              <img src={cast.leanInSrc} alt="" decoding="sync" title="Lean-In Reference" />
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="asset-cast-meta">
                        <div className="asset-cast-name">{tl(cast.name, lang)}</div>
                        <div className="asset-cast-role">
                          {tl(cast.role, lang)} · <span className="asset-lens-tag">{cast.recommendedLens}</span>
                        </div>
                        <div className="asset-spec-line">
                          <strong>{tl({ zh: "服化：", en: "Wardrobe: ", ja: "衣装：" }, lang)}</strong>
                          {tl(cast.wardrobe, lang)}
                        </div>
                        <div className="asset-spec-line">
                          <strong>{tl({ zh: "布光：", en: "Lighting: ", ja: "照明：" }, lang)}</strong>
                          {tl(cast.lightingKey, lang)}
                        </div>
                        <div className="asset-voice-row">
                          <span className="asset-voice-label">
                            {tl({ zh: "原声声纹母本：", en: "Voice Seed:", ja: "声紋サンプル：" }, lang)}
                          </span>
                          <audio
                            className="asset-audio-player"
                            controls
                            preload="none"
                            src={cast.voiceSeedSrc}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical" className="gta-dossier-scrollbar">
              <ScrollAreaThumb className="gta-dossier-thumb" />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </TabsPanel>

        <TabsPanel value="storyboard" className="studio-tab-panel">
          <ScrollArea className="studio-scroll-area" type="auto">
            <ScrollAreaViewport>
              <ScrollAreaContent className="studio-scroll-body">
                <div className="storyboard-grid">
                  {STUDIO_STORYBOARD_SHOTS.map((shot) => (
                    <article
                      key={shot.id}
                      data-storyboard-shot={shot.id}
                      className={`dossier-section storyboard-card ${
                        shot.hasNativeAudio ? "has-lipsync" : ""
                      }`}
                    >
                      <div className="storyboard-media">
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          poster={shot.posterSrc}
                          src={shot.videoSrc}
                          onError={(e) => {
                            const vid = e.currentTarget;
                            if (!vid.dataset.fb && shot.fallbackVideoSrc !== shot.videoSrc) {
                              vid.dataset.fb = "1";
                              vid.src = shot.fallbackVideoSrc;
                            }
                          }}
                        />
                        <span className="story-node-code">{shot.shotCode}</span>
                        <span
                          className={`storyboard-audio-badge ${shot.hasNativeAudio ? "live" : ""}`}
                        >
                          {shot.hasNativeAudio
                            ? tl({ zh: "口型对白原声", en: "LIP-SYNC AUDIO", ja: "口型音声" }, lang)
                            : tl({ zh: "纯氛围画面", en: "AMBIENT SHOT", ja: "環境ショット" }, lang)}
                        </span>
                      </div>

                      <div className="storyboard-info">
                        <div className="storyboard-kicker">
                          {tl(shot.chapter, lang)} · {shot.framing} · {shot.durationSec.toFixed(2)}s ({shot.frames}f)
                        </div>
                        <h3 className="storyboard-shot-title">{tl(shot.title, lang)}</h3>
                        <p className="storyboard-move">{tl(shot.cameraMove, lang)}</p>

                        {shot.lipSyncLine ? (
                          <div className="storyboard-lipsync-box">
                            <span className="lipsync-speaker">
                              {shot.speakerName ? tl(shot.speakerName, lang) : ""}：
                            </span>
                            <span>{tl(shot.lipSyncLine, lang)}</span>
                          </div>
                        ) : null}

                        <div className="storyboard-actions">
                          <Button
                            type="button"
                            className="ctrl-btn amber"
                            onClick={() => {
                              setSelectedShotId(shot.id);
                              setTab("blocking");
                            }}
                          >
                            {tl({ zh: "查看 3D 机位调度 →", en: "Inspect 3D Blocking →", ja: "3D配置を見る →" }, lang)}
                          </Button>
                          {onPlayStoryNode ? (
                            <Button
                              type="button"
                              className="ctrl-btn"
                              onClick={() => onPlayStoryNode(shot.storyNodeId)}
                            >
                              {tl({ zh: "在剧情中播放 ▶", en: "Play in Game ▶", ja: "本編で再生 ▶" }, lang)}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical" className="gta-dossier-scrollbar">
              <ScrollAreaThumb className="gta-dossier-thumb" />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </TabsPanel>

        <TabsPanel value="blocking" className="studio-tab-panel">
          <div className="blocking-workspace">
            <aside className="blocking-shot-list" aria-label="3D Blocking Shot Selector">
              <div className="section-kicker" style={{ marginBottom: "6px" }}>
                {tl({ zh: "选择分镜查看空间与镜头关系", en: "SELECT SHOT // 3D SET", ja: "ショット選択" }, lang)}
              </div>
              <ScrollArea className="blocking-list-scroll" type="auto">
                <ScrollAreaViewport>
                  <ScrollAreaContent>
                    <div className="blocking-btn-stack">
                      {STUDIO_STORYBOARD_SHOTS.map((s) => (
                        <Button
                          key={s.id}
                          type="button"
                          data-blocking-shot={s.id}
                          className={`option-card blocking-shot-btn ${
                            s.id === selectedShot.id ? "selected" : ""
                          }`}
                          onClick={() => setSelectedShotId(s.id)}
                        >
                          <span className="opt-index">{s.shotCode}</span>
                          <span className="blocking-btn-copy">
                            <span className="blocking-btn-title">{tl(s.title, lang)}</span>
                            <span className="blocking-btn-sub">
                              {s.blocking.camera.lensLabel} · {s.hasNativeAudio ? "LIP-SYNC" : `${s.frames}f`}
                            </span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </ScrollAreaContent>
                </ScrollAreaViewport>
              </ScrollArea>

              {/* Actor coordinates ledger for selected shot */}
              <div className="dossier-section blocking-actors-card">
                <div className="section-kicker">
                  {tl({ zh: "人物站位与朝向坐标", en: "ACTOR BLOCKING", ja: "人物配置座標" }, lang)}
                </div>
                {selectedShot.blocking.actors.map((a) => (
                  <div key={a.id} className="blocking-actor-row">
                    <span className="blocking-actor-dot" style={{ backgroundColor: a.color }} />
                    <span className="blocking-actor-name">{a.label}</span>
                    <span className="blocking-actor-coords">
                      ({a.pos[0].toFixed(1)}, {a.pos[2].toFixed(1)})
                    </span>
                  </div>
                ))}
              </div>
            </aside>

            <ThreeBlockingStage shot={selectedShot} lang={lang} motionPaused={motionPaused} />
          </div>
        </TabsPanel>
      </Tabs>
    </section>
  );
}
