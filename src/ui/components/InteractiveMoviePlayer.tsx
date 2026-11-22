import { Button } from "@ui-sdk/react/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { tl } from "../../game/i18n.js";
import {
  STORY_CHAPTER_META,
  getPreloadVideoUrls,
  type StoryChoice,
  type StoryNode
} from "../../game/story-graph.js";
import type { Locale } from "../../game/types.js";
import { WebGLAtmosphere } from "./WebGLAtmosphere.js";

interface Props {
  node: StoryNode;
  lang: Locale;
  motionPaused: boolean;
  voiceEnabled?: boolean;
  operatorBadge?: string;
  progressLabel?: string;
  progressPct?: number;
  className?: string;
  id?: string;
  onSelectChoice: (choice: StoryChoice, index: number) => void;
  onSkip?: () => void;
  onOpenStoryMap?: () => void;
  footerExtra?: ReactNode;
}

export function InteractiveMoviePlayer({
  node,
  lang,
  motionPaused,
  voiceEnabled = true,
  operatorBadge,
  progressLabel,
  progressPct,
  className = "",
  id,
  onSelectChoice,
  onSkip,
  onOpenStoryMap,
  footerExtra
}: Props) {
  const [useFallbackVideo, setUseFallbackVideo] = useState(false);
  const [useFallbackPoster, setUseFallbackPoster] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    node.timerSec ? node.timerSec * 1000 : 0
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerFiredRef = useRef(false);
  const onSelectChoiceRef = useRef(onSelectChoice);
  onSelectChoiceRef.current = onSelectChoice;

  // Reset buffer & timer when switching to a new story node
  useEffect(() => {
    setUseFallbackVideo(false);
    setUseFallbackPoster(false);
    setVideoReady(false);
    setAutoplayBlocked(false);
    timerFiredRef.current = false;
    setRemainingMs(node.timerSec ? node.timerSec * 1000 : 0);
  }, [node.id, node.timerSec]);

  const activeVideoSrc = useFallbackVideo ? node.fallbackVideoSrc : node.videoSrc;
  const activePosterSrc = useFallbackPoster ? node.fallbackPosterSrc : node.posterSrc;
  const preloadUrls = getPreloadVideoUrls(node);
  const shouldPlaySound = Boolean(node.hasAudio) && voiceEnabled && !userMuted;

  // Sync play/pause and unmuted lip-sync playback with WCAG 2.2.2 motionPaused
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      vid.muted = !shouldPlaySound;
      if (motionPaused) {
        vid.pause?.();
        return;
      }
      const playPromise = vid.play?.();
      if (playPromise && typeof playPromise.catch === "function") {
        void playPromise.catch(() => {
          // If browser blocks unmuted autoplay on cold entry, fall back gracefully to muted and offer 1-click unmute
          if (shouldPlaySound && vid) {
            vid.muted = true;
            setAutoplayBlocked(true);
            void vid.play?.().catch?.(() => {});
          }
        });
      }
    } catch {
      // ignore headless DOM
    }
  }, [activeVideoSrc, motionPaused, shouldPlaySound]);

  // Timed QTE choice countdown (pauses cleanly when motionPaused is enabled)
  useEffect(() => {
    const totalSec = node.timerSec;
    const firstChoice = node.choices?.[0];
    if (!totalSec || !firstChoice || motionPaused) return;

    const totalMs = totalSec * 1000;
    const stepMs = 100;
    let currentMs = remainingMs > 0 ? remainingMs : totalMs;

    const timerId = window.setInterval(() => {
      if (timerFiredRef.current) return;
      currentMs = Math.max(0, currentMs - stepMs);
      setRemainingMs(currentMs);
      if (currentMs <= 0 && !timerFiredRef.current) {
        timerFiredRef.current = true;
        window.clearInterval(timerId);
        onSelectChoiceRef.current(firstChoice, 0);
      }
    }, stepMs);

    return () => window.clearInterval(timerId);
    // Intentionally reset interval per node / motion state toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.timerSec, motionPaused]);

  const timerPct =
    node.timerSec && node.timerSec > 0
      ? Math.max(0, Math.min(100, (remainingMs / (node.timerSec * 1000)) * 100))
      : 0;
  const timerSecText = (remainingMs / 1000).toFixed(1);

  const handleReplayClip = () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      vid.currentTime = 0;
      vid.muted = !shouldPlaySound;
      setAutoplayBlocked(false);
      void vid.play?.().catch?.(() => {});
    } catch {
      // ignore headless DOM
    }
  };

  return (
    <div
      className={`fmv-player-stage ${className}`.trim()}
      id={id}
      data-story-node={node.id}
      role="region"
      aria-label={tl(node.title, lang)}
    >
      {/* Full-bleed poster underneath double-buffered video for 0ms cut smoothness */}
      <div className="fmv-media-layer" aria-hidden="true">
        <img
          src={activePosterSrc}
          alt=""
          className="fmv-poster-img"
          decoding="async"
          onError={() => {
            if (!useFallbackPoster && node.fallbackPosterSrc !== node.posterSrc) {
              setUseFallbackPoster(true);
            }
          }}
        />
        <video
          key={activeVideoSrc}
          ref={videoRef}
          className="fmv-video-el"
          style={{ opacity: videoReady ? 1 : 0 }}
          poster={activePosterSrc}
          autoPlay={!motionPaused}
          loop
          muted={!shouldPlaySound}
          playsInline
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => {
            if (!useFallbackVideo && node.fallbackVideoSrc !== node.videoSrc) {
              setUseFallbackVideo(true);
            } else {
              setVideoReady(false);
            }
          }}
        >
          <source src={activeVideoSrc} type="video/mp4" />
        </video>
        <div className="fmv-cinema-vignette" />
      </div>

      {/* Hidden branch video preloader */}
      {preloadUrls.length > 0 ? (
        <div aria-hidden="true" style={{ display: "none" }}>
          {preloadUrls.map((url) => (
            <video key={url} src={url} preload="auto" muted playsInline />
          ))}
        </div>
      ) : null}

      <WebGLAtmosphere mode="lobby" motionPaused={motionPaused} />

      {/* Top Cinema HUD Header */}
      <div className="fmv-hud-top">
        <div className="fmv-chapter-stack">
          <div className="fmv-kicker-row">
            <span className="fmv-code-badge">{node.code}</span>
            <span className="fmv-chapter-tag">{tl(STORY_CHAPTER_META[node.chapter], lang)}</span>
            {node.hasAudio ? (
              <span className="fmv-audio-pill">
                {tl({ zh: "原声口型", en: "LIP-SYNC", ja: "口型音声" }, lang)}
              </span>
            ) : null}
            {operatorBadge ? <span className="tech-stamp">{operatorBadge}</span> : null}
          </div>
          <h2 className="fmv-scene-title">{tl(node.title, lang)}</h2>
        </div>

        <div className="fmv-top-actions">
          {typeof progressPct === "number" ? (
            <div className="fmv-beat-progress">
              <span className="fmv-progress-label">{progressLabel ?? `${progressPct}%`}</span>
              <Progress
                className="hud-progress fmv-mini-progress"
                value={progressPct}
                aria-label={progressLabel ?? tl(node.title, lang)}
              >
                <ProgressTrack>
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
            </div>
          ) : null}

          {node.hasAudio ? (
            <Button
              type="button"
              className={`ctrl-btn ${shouldPlaySound && !autoplayBlocked ? "amber" : ""}`}
              onClick={() => {
                if (autoplayBlocked && videoRef.current) {
                  setAutoplayBlocked(false);
                  setUserMuted(false);
                  videoRef.current.muted = false;
                  void videoRef.current.play?.().catch?.(() => {});
                  return;
                }
                setUserMuted((m) => !m);
              }}
            >
              {autoplayBlocked
                ? tl({ zh: "开启原声口型", en: "UNMUTE AUDIO", ja: "音声ON" }, lang)
                : shouldPlaySound
                  ? tl({ zh: "原声: 开", en: "AUDIO: ON", ja: "音声: ON" }, lang)
                  : tl({ zh: "原声: 关", en: "AUDIO: OFF", ja: "音声: OFF" }, lang)}
            </Button>
          ) : null}

          <Button type="button" className="ctrl-btn" onClick={handleReplayClip}>
            {tl({ zh: "↻ 重播", en: "↻ REPLAY", ja: "↻ 再生" }, lang)}
          </Button>

          {onOpenStoryMap ? (
            <Button type="button" className="ctrl-btn" onClick={onOpenStoryMap}>
              {tl({ zh: "故事线分支图", en: "STORY MAP", ja: "分岐マップ" }, lang)}
            </Button>
          ) : null}

          {onSkip ? (
            <Button type="button" id="btn-fmv-skip" className="ctrl-btn amber" onClick={onSkip}>
              {tl(
                { zh: "切入防爆窗审讯 →", en: "ENTER BOOTH →", ja: "尋問へ進む →" },
                lang
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Bottom GTA Cinema Subtitle + QTE Countdown + Branch Choice Deck */}
      <div className="fmv-hud-bottom">
        <div className="fmv-subtitle-box">
          <div className="fmv-speaker-row">
            <span className="fmv-rec-dot" aria-hidden="true" />
            <span className="fmv-speaker-tag">{tl(node.speaker, lang)}</span>
          </div>
          <p className="fmv-subtitle-text">{tl(node.subtitle, lang)}</p>
        </div>

        {node.timerSec && node.choices && node.choices.length > 0 ? (
          <div className="fmv-qte-timer" role="timer" aria-live="off">
            <div className="fmv-qte-header">
              <span>
                {motionPaused
                  ? tl(
                      { zh: "限时抉择已暂停", en: "TIMED CHOICE PAUSED", ja: "時間制限一時停止" },
                      lang
                    )
                  : tl(
                      {
                        zh: "限时剧情抉择 // 超时将默认首选",
                        en: "TIMED DECISION // AUTO-SELECTS 01 ON TIMEOUT",
                        ja: "時間制限分岐 // 時間切れで01を選択"
                      },
                      lang
                    )}
              </span>
              <span className="fmv-qte-clock">{timerSecText}s</span>
            </div>
            <Progress
              className="hud-progress fmv-qte-bar"
              value={timerPct}
              aria-label={tl({ zh: "剧情抉择倒计时", en: "Story choice timer", ja: "選択制限時間" }, lang)}
            >
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>
        ) : null}

        {node.choices && node.choices.length > 0 ? (
          <div className="fmv-choice-deck" role="group" aria-label={tl(node.title, lang)}>
            {node.choices.map((choice, idx) => (
              <Button
                key={choice.id}
                type="button"
                data-story-choice={choice.id}
                className="option-card fmv-choice-btn"
                onClick={() => {
                  timerFiredRef.current = true;
                  onSelectChoice(choice, idx);
                }}
              >
                <span className="opt-index">0{idx + 1}</span>
                <span className="fmv-choice-copy">
                  <span className="fmv-choice-main">{tl(choice.label, lang)}</span>
                  {choice.sublabel ? (
                    <span className="fmv-choice-sub">{tl(choice.sublabel, lang)}</span>
                  ) : null}
                </span>
              </Button>
            ))}
          </div>
        ) : null}

        {footerExtra}
      </div>
    </div>
  );
}
