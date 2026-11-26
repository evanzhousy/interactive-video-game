import { Button } from "@ui-sdk/react/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ensureAudioUnlocked,
  playStoryVoiceAudio,
  setAmbienceDucking,
  stopIntercomVoice
} from "../../game/audio.js";
import { tl } from "../../game/i18n.js";
import {
  STORY_CHAPTER_META,
  getPreloadVideoUrls,
  type StoryChoice,
  type StoryClipSegment,
  type StoryNode
} from "../../game/story-graph.js";
import type { Locale } from "../../game/types.js";
import { WebGLAtmosphere } from "./WebGLAtmosphere.js";

interface Props {
  node: StoryNode;
  lang: Locale;
  motionPaused: boolean;
  voiceEnabled?: boolean;
  clipsOverride?: readonly StoryClipSegment[];
  operatorBadge?: string;
  progressLabel?: string;
  progressPct?: number;
  className?: string;
  id?: string;
  onSelectChoice: (choice: StoryChoice, index: number) => void;
  onSkip?: () => void;
  onOpenStoryMap?: () => void;
  unlockedEndingsCount?: number;
  sideQuestClueCount?: number;
  consequenceNotice?: string | null;
  onReturnLobby?: () => void;
  onEnterChallengeMode?: () => void;
  footerExtra?: ReactNode;
}

export function InteractiveMoviePlayer({
  node,
  lang,
  motionPaused,
  voiceEnabled = true,
  clipsOverride,
  operatorBadge,
  progressLabel,
  progressPct,
  className = "",
  id,
  onSelectChoice,
  onSkip,
  onOpenStoryMap,
  unlockedEndingsCount = 0,
  sideQuestClueCount = 0,
  consequenceNotice = null,
  onReturnLobby,
  onEnterChallengeMode,
  footerExtra
}: Props) {
  const segments: readonly StoryClipSegment[] =
    clipsOverride && clipsOverride.length > 0
      ? clipsOverride
      : node.clips && node.clips.length > 0
        ? node.clips
        : [
            {
              id: node.id,
              videoSrc: node.videoSrc,
              fallbackVideoSrc: node.fallbackVideoSrc,
              posterSrc: node.posterSrc,
              fallbackPosterSrc: node.fallbackPosterSrc,
              hasAudio: node.hasAudio,
              isLipSync: node.isLipSync,
              voiceCue: node.voiceCue,
              speaker: node.speaker,
              subtitle: node.subtitle
            }
          ];

  const [clipIndex, setClipIndex] = useState(0);
  const [useFallbackVideo, setUseFallbackVideo] = useState(false);
  const [useFallbackPoster, setUseFallbackPoster] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    node.timerSec ? node.timerSec * 1000 : 0
  );

  const safeClipIndex = Math.max(0, Math.min(segments.length - 1, clipIndex));
  const activeSegment = segments[safeClipIndex] ?? segments[0]!;
  const isLastClip = safeClipIndex >= segments.length - 1;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerFiredRef = useRef(false);
  const onSelectChoiceRef = useRef(onSelectChoice);
  onSelectChoiceRef.current = onSelectChoice;

  // Reset playlist index, buffer & timer when switching to a new story node
  useEffect(() => {
    setClipIndex(0);
    setUseFallbackVideo(false);
    setUseFallbackPoster(false);
    setVideoReady(false);
    setAutoplayBlocked(false);
    timerFiredRef.current = false;
    setRemainingMs(node.timerSec ? node.timerSec * 1000 : 0);
  }, [node.id, node.timerSec]);

  // Reset per-segment fallback flags when advancing within a multi-clip montage
  useEffect(() => {
    setUseFallbackVideo(false);
    setUseFallbackPoster(false);
    setVideoReady(false);
    setAutoplayBlocked(false);
  }, [safeClipIndex, activeSegment.id]);

  const activeVideoSrc = useFallbackVideo
    ? activeSegment.fallbackVideoSrc
    : activeSegment.videoSrc;
  const activePosterSrc = useFallbackPoster
    ? activeSegment.fallbackPosterSrc
    : activeSegment.posterSrc;
  const nextSegment = !isLastClip ? segments[safeClipIndex + 1] : undefined;
  const preloadUrls = Array.from(
    new Set([
      ...(nextSegment ? [nextSegment.videoSrc, nextSegment.fallbackVideoSrc] : []),
      ...getPreloadVideoUrls(node)
    ])
  ).filter((u) => u && u !== activeVideoSrc);
  const segmentHasAudio = Boolean(activeSegment.hasAudio);
  const segmentIsLipSync = segmentHasAudio && activeSegment.isLipSync !== false;
  const segmentVoiceCue = !segmentHasAudio ? activeSegment.voiceCue : undefined;
  const hasAnyClipAudio = segmentHasAudio || Boolean(segmentVoiceCue);
  const shouldPlayNativeSound = segmentHasAudio && voiceEnabled && !userMuted;
  const shouldPlayVoiceCue = Boolean(segmentVoiceCue) && voiceEnabled && !userMuted && !motionPaused;

  // Sync play/pause and unmuted lip-sync / native SFX playback with WCAG 2.2.2 motionPaused
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      vid.muted = !shouldPlayNativeSound;
      if (motionPaused) {
        vid.pause?.();
        return;
      }
      const playPromise = vid.play?.();
      if (playPromise && typeof playPromise.catch === "function") {
        void playPromise.catch(() => {
          // If browser blocks unmuted autoplay on cold entry, fall back gracefully to muted and offer 1-click unmute
          if (shouldPlayNativeSound && vid) {
            vid.muted = true;
            setAutoplayBlocked(true);
            void vid.play?.().catch?.(() => {});
          }
        });
      }
    } catch {
      // ignore headless DOM
    }
  }, [activeVideoSrc, motionPaused, shouldPlayNativeSound]);

  // Duck background synth score & blizzard while native video sound plays
  useEffect(() => {
    if (shouldPlayNativeSound && !autoplayBlocked && !motionPaused) {
      setAmbienceDucking(true);
      return () => setAmbienceDucking(false);
    }
    if (!segmentVoiceCue) {
      setAmbienceDucking(false);
    }
    return undefined;
  }, [shouldPlayNativeSound, autoplayBlocked, motionPaused, segmentVoiceCue]);

  // Play recorded character dialogue for Nights 2–5 scenes that lack baked-in MP4 audio
  useEffect(() => {
    if (!segmentVoiceCue || !shouldPlayVoiceCue) {
      return undefined;
    }
    const audioUrl = `./audio/${lang}/${segmentVoiceCue.slug}/${segmentVoiceCue.file}.mp3`;
    playStoryVoiceAudio(audioUrl, true);
    return () => {
      stopIntercomVoice();
    };
  }, [activeSegment.id, lang, segmentVoiceCue, shouldPlayVoiceCue]);

  const rawChoices = node.choices ?? [];
  const mainChoices = rawChoices.filter((c) => !c.isSideQuest);
  const sideQuestChoices = rawChoices.filter((c) => c.isSideQuest);

  // Timed QTE choice countdown — runs ONLY on the final clip in a montage and picks main story choice 01
  useEffect(() => {
    const totalSec = node.timerSec;
    const firstChoice = mainChoices[0];
    if (!totalSec || !firstChoice || motionPaused || !isLastClip) return;

    const totalMs = totalSec * 1000;
    const stepMs = 100;
    let currentMs = totalMs;
    setRemainingMs(totalMs);

    const timerId = window.setInterval(() => {
      if (timerFiredRef.current) return;
      currentMs = Math.max(0, currentMs - stepMs);
      setRemainingMs(currentMs);
      if (currentMs <= 0 && !timerFiredRef.current) {
        timerFiredRef.current = true;
        window.clearInterval(timerId);
        onSelectChoiceRef.current(firstChoice, Math.max(0, rawChoices.indexOf(firstChoice)));
      }
    }, stepMs);

    return () => window.clearInterval(timerId);
  }, [node.id, node.timerSec, motionPaused, isLastClip]);

  const timerPct =
    node.timerSec && node.timerSec > 0
      ? Math.max(0, Math.min(100, (remainingMs / (node.timerSec * 1000)) * 100))
      : 0;
  const timerSecText = (remainingMs / 1000).toFixed(1);

  const handleReplayClip = () => {
    ensureAudioUnlocked();
    setClipIndex(0);
    if (segmentVoiceCue && shouldPlayVoiceCue) {
      playStoryVoiceAudio(`./audio/${lang}/${segmentVoiceCue.slug}/${segmentVoiceCue.file}.mp3`, true);
    }
    const vid = videoRef.current;
    if (!vid) return;
    try {
      vid.currentTime = 0;
      vid.muted = !shouldPlayNativeSound;
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
      data-clip-id={activeSegment.id}
      data-clip-index={safeClipIndex}
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
            if (
              !useFallbackPoster &&
              activeSegment.fallbackPosterSrc !== activeSegment.posterSrc
            ) {
              setUseFallbackPoster(true);
            }
          }}
        />
        <video
          key={`${activeSegment.id}:${activeVideoSrc}`}
          ref={videoRef}
          className="fmv-video-el"
          style={{ opacity: videoReady ? 1 : 0 }}
          poster={activePosterSrc}
          autoPlay={!motionPaused}
          loop={isLastClip}
          muted={!shouldPlayNativeSound}
          playsInline
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onEnded={() => {
            if (!isLastClip) {
              setClipIndex((i) => Math.min(segments.length - 1, i + 1));
            }
          }}
          onError={() => {
            if (
              !useFallbackVideo &&
              activeSegment.fallbackVideoSrc !== activeSegment.videoSrc
            ) {
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
            {segments.length > 1 ? (
              <span className="fmv-reel-pill" id="fmv-reel-indicator">
                {tl(
                  {
                    zh: `镜头 ${safeClipIndex + 1}/${segments.length}${activeSegment.badge ? ` · ${activeSegment.badge.zh}` : ""}`,
                    en: `SHOT ${safeClipIndex + 1}/${segments.length}${activeSegment.badge ? ` · ${activeSegment.badge.en}` : ""}`,
                    ja: `カット ${safeClipIndex + 1}/${segments.length}${activeSegment.badge ? ` · ${activeSegment.badge.ja}` : ""}`
                  },
                  lang
                )}
              </span>
            ) : null}
            {segments.length > 1 ? (
              <div className="fmv-reel-dots" role="group" aria-label="Reel shots">
                {segments.map((seg, sIdx) => (
                  <button
                    key={seg.id}
                    type="button"
                    aria-label={`Shot ${sIdx + 1}`}
                    className={`fmv-reel-dot ${sIdx === safeClipIndex ? "is-active" : sIdx < safeClipIndex ? "is-seen" : ""}`}
                    onClick={() => {
                      ensureAudioUnlocked();
                      setClipIndex(sIdx);
                    }}
                  />
                ))}
              </div>
            ) : null}
            {segmentIsLipSync ? (
              <span className="fmv-audio-pill">
                {tl({ zh: "原声口型", en: "LIP-SYNC", ja: "口型音声" }, lang)}
              </span>
            ) : segmentHasAudio ? (
              <span className="fmv-audio-pill">
                {tl({ zh: "原声音效", en: "NATIVE SFX", ja: "環境音声" }, lang)}
              </span>
            ) : segmentVoiceCue ? (
              <span className="fmv-audio-pill">
                {tl({ zh: "角色配音", en: "VOICEOVER", ja: "ボイス" }, lang)}
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

          {segments.length > 1 && !isLastClip ? (
            <Button
              type="button"
              id="btn-fmv-next-clip"
              className="ctrl-btn amber"
              onClick={() => {
                ensureAudioUnlocked();
                setClipIndex((i) => Math.min(segments.length - 1, i + 1));
              }}
            >
              {tl({ zh: "下一镜头 ›", en: "NEXT SHOT ›", ja: "次へ ›" }, lang)}
            </Button>
          ) : null}

          {hasAnyClipAudio ? (
            <Button
              type="button"
              id="btn-fmv-audio-toggle"
              className={`ctrl-btn ${voiceEnabled && !userMuted && !autoplayBlocked ? "amber" : ""}`}
              onClick={() => {
                ensureAudioUnlocked();
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
                ? tl({ zh: "开启原声", en: "UNMUTE AUDIO", ja: "音声ON" }, lang)
                : voiceEnabled && !userMuted
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

      {/* Detroit-style subtle consequence diamond toast */}
      {consequenceNotice ? (
        <div className="fmv-detroit-toast" id="fmv-detroit-toast" role="status" aria-live="polite">
          <span className="fmv-detroit-diamond" aria-hidden="true" />
          <span>{consequenceNotice}</span>
        </div>
      ) : null}

      {/* Bottom GTA Cinema Subtitle + QTE Countdown + Branch Choice Deck */}
      <div className="fmv-hud-bottom">
        <div className="fmv-subtitle-box">
          <div className="fmv-speaker-row">
            <span className="fmv-rec-dot" aria-hidden="true" />
            <span className="fmv-speaker-tag">{tl(activeSegment.speaker, lang)}</span>
          </div>
          <p className="fmv-subtitle-text">{tl(activeSegment.subtitle, lang)}</p>
        </div>

        {isLastClip && node.timerSec && mainChoices.length > 0 ? (
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

        {segments.length > 1 && !isLastClip && mainChoices.length > 0 ? (
          <div className="fmv-watching-hint">
            {tl(
              {
                zh: `▶ 电影剧情放映中（镜头 ${safeClipIndex + 1}/${segments.length}）· 播完自动切换或随时作出选择`,
                en: `▶ PLAYING SEQUENCE (${safeClipIndex + 1}/${segments.length}) · AUTO-ADVANCES OR CHOOSE ANYTIME`,
                ja: `▶ 映画再生中（カット ${safeClipIndex + 1}/${segments.length}）· 自動切替またはいつでも選択可`
              },
              lang
            )}
          </div>
        ) : null}

        {mainChoices.length > 0 ? (
          <div className="fmv-choice-deck" role="group" aria-label={tl(node.title, lang)}>
            {mainChoices.map((choice, idx) => {
              const rawIdx = Math.max(0, rawChoices.indexOf(choice));
              return (
                <Button
                  key={choice.id}
                  type="button"
                  data-story-choice={choice.id}
                  className={`option-card fmv-choice-btn ${
                    choice.directVerdict === "ADMIT"
                      ? "is-verdict-admit"
                      : choice.directVerdict === "PURGE"
                        ? "is-verdict-purge"
                        : ""
                  }`.trim()}
                  onClick={() => {
                    timerFiredRef.current = true;
                    onSelectChoice(choice, rawIdx);
                  }}
                >
                  <span className="opt-index">{`0${idx + 1}`}</span>
                  <span className="fmv-choice-copy">
                    <span className="fmv-choice-main">{tl(choice.label, lang)}</span>
                    {choice.sublabel ? (
                      <span className="fmv-choice-sub">{tl(choice.sublabel, lang)}</span>
                    ) : null}
                  </span>
                </Button>
              );
            })}
          </div>
        ) : null}

        {sideQuestChoices.length > 0 ? (
          <div className="fmv-sidequest-strip" aria-label={tl({ zh: "可选支线", en: "Optional Side Quest", ja: "任意サブ" }, lang)}>
            <span className="fmv-sidequest-tag">
              {tl({ zh: "可选高玩支线", en: "OPTIONAL SIDE QUEST", ja: "任意サブ" }, lang)}
            </span>
            <div className="fmv-sidequest-actions">
              {sideQuestChoices.map((choice) => {
                const rawIdx = Math.max(0, rawChoices.indexOf(choice));
                return (
                  <Button
                    key={choice.id}
                    type="button"
                    data-story-choice={choice.id}
                    className="fmv-sidequest-pill"
                    onClick={() => {
                      timerFiredRef.current = true;
                      onSelectChoice(choice, rawIdx);
                    }}
                  >
                    {tl(choice.label, lang)}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}

        {node.kind === "ending" ? (
          <div className="fmv-ending-card" id="fmv-ending-card" role="region" aria-label={tl(node.title, lang)}>
            <div className="fmv-ending-meta">
              <span className="fmv-ending-badge">
                {node.endingTag
                  ? tl(node.endingTag, lang)
                  : tl({ zh: "电影结局已达成", en: "FILM ENDING COMPLETE", ja: "結末到達" }, lang)}
              </span>
              <span className="fmv-ending-stats">
                {tl(
                  {
                    zh: `全片结局收集：${unlockedEndingsCount}/7 · 支线审讯鉴真：${sideQuestClueCount} 次`,
                    en: `ENDINGS COLLECTED: ${unlockedEndingsCount}/7 · SIDE AUDITS: ${sideQuestClueCount}`,
                    ja: `収集済み結末：${unlockedEndingsCount}/7 · 支線尋問：${sideQuestClueCount}回`
                  },
                  lang
                )}
              </span>
            </div>
            <div className="fmv-ending-actions">
              {onOpenStoryMap ? (
                <Button
                  type="button"
                  id="btn-ending-storymap"
                  className="ctrl-btn amber"
                  onClick={onOpenStoryMap}
                >
                  {tl({ zh: "故事线分支图 · 刷其他结局", en: "STORY MAP · OTHER ENDINGS", ja: "分岐マップ · 他結末へ" }, lang)}
                </Button>
              ) : null}
              <Button
                type="button"
                id="btn-ending-replay"
                className="ctrl-btn"
                onClick={handleReplayClip}
              >
                {tl({ zh: "↻ 重播结局", en: "↻ REPLAY ENDING", ja: "↻ 結末再生" }, lang)}
              </Button>
              {onEnterChallengeMode ? (
                <Button
                  type="button"
                  id="btn-ending-challenge"
                  className="ctrl-btn"
                  onClick={onEnterChallengeMode}
                >
                  {tl({ zh: "🛡️ 体验高玩伪人鉴真模式", en: "🛡️ MIMIC AUDIT CHALLENGE", ja: "🛡️ 擬態体監査モードへ" }, lang)}
                </Button>
              ) : null}
              {onReturnLobby ? (
                <Button
                  type="button"
                  id="btn-ending-lobby"
                  className="ctrl-btn"
                  onClick={onReturnLobby}
                >
                  {tl({ zh: "返回首页", en: "RETURN HOME", ja: "ホームへ" }, lang)}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {footerExtra}
      </div>
    </div>
  );
}
