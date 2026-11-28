import { Button } from "@ui-sdk/react/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tl } from "../../game/i18n.js";
import { STUDIO_STORYBOARD_SHOTS, type RenderPipelineRoute } from "../../game/production-board.js";
import {
  applyDirectorDecision,
  computeKanbanStats,
  createDirectorDecision,
  createKanbanIssue,
  DEFAULT_DIRECTOR_DECISIONS,
  DEFAULT_KANBAN_ISSUES,
  deleteKanbanIssue,
  filterKanbanIssues,
  KANBAN_COLUMNS,
  loadDirectorDecisions,
  loadKanbanIssues,
  moveKanbanIssue,
  reopenDirectorDecision,
  saveDirectorDecisions,
  saveKanbanIssues,
  serializeKanbanExport,
  updateKanbanIssue,
  type DirectorDecision,
  type KanbanChapter,
  type KanbanColumnId,
  type KanbanFilterState,
  type KanbanIssue,
  type KanbanOwner,
  type KanbanPriority
} from "../../game/production-kanban.js";
import type { Locale } from "../../game/types.js";

interface Props {
  lang: Locale;
  onOpenShotInBlocking?: (shotId: string) => void;
  onOpenShotInStoryboard?: (shotId: string) => void;
  onJumpToAsset?: (tag: string) => void;
}

type SyncState = "connecting" | "neon" | "local";

const CHAPTER_OPTIONS: readonly (KanbanChapter | "ALL")[] = [
  "ALL",
  "ONER",
  "EP0",
  "N1",
  "N2-4",
  "N5",
  "TRAILER",
  "INFRA"
];

const OWNER_OPTIONS: readonly KanbanOwner[] = [
  "Cinematographer",
  "LookDev",
  "H3-Renderer",
  "QA-Gate",
  "Director"
];

const PRIORITY_BADGES: Record<KanbanPriority, { label: string; cls: string }> = {
  urgent: { label: "URG", cls: "is-urgent" },
  high: { label: "HIGH", cls: "is-high" },
  medium: { label: "MED", cls: "is-medium" },
  low: { label: "LOW", cls: "is-low" }
};

export function LinearKanbanBoard({
  lang,
  onOpenShotInBlocking,
  onOpenShotInStoryboard,
  onJumpToAsset
}: Props) {
  const [issues, setIssues] = useState<KanbanIssue[]>(() => loadKanbanIssues());
  const [decisions, setDecisions] = useState<DirectorDecision[]>(() => loadDirectorDecisions());
  const [syncState, setSyncState] = useState<SyncState>("connecting");
  const [syncBusy, setSyncBusy] = useState(false);

  const [decisionTab, setDecisionTab] = useState<"pending" | "log">("pending");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [showAddDecision, setShowAddDecision] = useState(false);
  const [draftDecTitle, setDraftDecTitle] = useState("");
  const [draftDecContext, setDraftDecContext] = useState("");
  const [draftDecIssueId, setDraftDecIssueId] = useState("");
  const [decisionCopied, setDecisionCopied] = useState(false);

  const [filters, setFilters] = useState<KanbanFilterState>({
    query: "",
    chapter: "ALL",
    owner: "ALL",
    route: "ALL"
  });
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetCol, setDropTargetCol] = useState<KanbanColumnId | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  // Quick-create issue form state
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftChapter, setDraftChapter] = useState<KanbanChapter>("ONER");
  const [draftStatus, setDraftStatus] = useState<KanbanColumnId>("previz");
  const [draftPriority, setDraftPriority] = useState<KanbanPriority>("high");
  const [draftOwner, setDraftOwner] = useState<KanbanOwner>("Cinematographer");
  const [draftRoute, setDraftRoute] = useState<RenderPipelineRoute | "">("fl2va_keyframes");
  const [draftShotId, setDraftShotId] = useState<string>("");

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    saveKanbanIssues(issues);
  }, [issues]);

  useEffect(() => {
    saveDirectorDecisions(decisions);
  }, [decisions]);

  const pullRemoteState = useCallback(async () => {
    if (typeof fetch !== "function") {
      if (mountedRef.current) setSyncState("local");
      return;
    }
    setSyncBusy(true);
    try {
      const res = await fetch("/api/studio-state", { method: "GET", cache: "no-store" });
      if (!res.ok) {
        if (mountedRef.current) setSyncState("local");
        return;
      }
      const data = (await res.json()) as {
        ok?: boolean;
        storage?: string;
        issues?: KanbanIssue[];
        decisions?: DirectorDecision[];
      };
      if (mountedRef.current && data.ok && Array.isArray(data.issues) && Array.isArray(data.decisions)) {
        setIssues(data.issues);
        setDecisions(data.decisions);
        setSyncState(data.storage === "neon" ? "neon" : "local");
      } else if (mountedRef.current) {
        setSyncState("local");
      }
    } catch {
      if (mountedRef.current) setSyncState("local");
    } finally {
      if (mountedRef.current) setSyncBusy(false);
    }
  }, []);

  useEffect(() => {
    void pullRemoteState();
  }, [pullRemoteState]);

  const postStudioAction = useCallback(async (payload: Record<string, unknown>) => {
    if (typeof fetch !== "function") return;
    setSyncBusy(true);
    try {
      const res = await fetch("/api/studio-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        if (mountedRef.current) setSyncState("local");
        return;
      }
      const data = (await res.json()) as {
        ok?: boolean;
        storage?: string;
        issues?: KanbanIssue[];
        decisions?: DirectorDecision[];
      };
      if (mountedRef.current && data.ok && Array.isArray(data.issues) && Array.isArray(data.decisions)) {
        setIssues(data.issues);
        setDecisions(data.decisions);
        setSyncState(data.storage === "neon" ? "neon" : "local");
      }
    } catch {
      if (mountedRef.current) setSyncState("local");
    } finally {
      if (mountedRef.current) setSyncBusy(false);
    }
  }, []);

  const pendingDecisions = useMemo(
    () => decisions.filter((d) => d.status === "pending"),
    [decisions]
  );
  const decidedDecisions = useMemo(
    () => decisions.filter((d) => d.status === "decided"),
    [decisions]
  );

  const filteredIssues = useMemo(
    () => filterKanbanIssues(issues, filters, lang),
    [issues, filters, lang]
  );

  const stats = useMemo(() => computeKanbanStats(issues), [issues]);

  const selectedIssue = useMemo(
    () => issues.find((item) => item.id === selectedIssueId) ?? null,
    [issues, selectedIssueId]
  );

  const handleRecordDecision = (decision: DirectorDecision, optionId: string) => {
    const note = decisionNotes[decision.id] ?? "";
    const applied = applyDirectorDecision(issues, decisions, {
      decisionId: decision.id,
      optionId,
      note,
      decidedBy: "Director",
      lang
    });
    setIssues(applied.issues);
    setDecisions(applied.decisions);
    void postStudioAction({
      action: "record_decision",
      decisionId: decision.id,
      optionId,
      note,
      lang
    });
  };

  const handleReopenDecision = (decisionId: string) => {
    setDecisions((prev) => reopenDirectorDecision(prev, decisionId));
    void postStudioAction({ action: "reopen_decision", decisionId });
  };

  const handleCreateDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftDecTitle.trim()) return;
    const next = createDirectorDecision(decisions, {
      title: draftDecTitle,
      context: draftDecContext,
      ...(draftDecIssueId ? { issueId: draftDecIssueId } : {})
    });
    const created = next[0];
    setDecisions(next);
    setDraftDecTitle("");
    setDraftDecContext("");
    setDraftDecIssueId("");
    setShowAddDecision(false);
    setDecisionTab("pending");
    if (created) {
      void postStudioAction({
        action: "create_decision",
        decision: created
      });
    }
  };

  const handleCopyDecisionLog = () => {
    const summary = decisions
      .map((d) => {
        const statusTag = d.status === "decided" ? `DECIDED: ${d.chosenLabel}` : "PENDING";
        const notePart = d.directorNote ? ` | Note: ${d.directorNote}` : "";
        return `[${d.id}${d.issueId ? ` -> ${d.issueId}` : ""}] ${tl(d.title, lang)} => ${statusTag}${notePart}`;
      })
      .join("\n");
    try {
      void navigator.clipboard?.writeText?.(summary)?.catch(() => {});
    } catch {
      // ignore
    }
    setDecisionCopied(true);
    window.setTimeout(() => setDecisionCopied(false), 1800);
  };

  const handleMoveColumn = (id: string, nextStatus: KanbanColumnId) => {
    const next = moveKanbanIssue(issues, id, nextStatus);
    setIssues(next);
    const updated = next.find((i) => i.id === id);
    if (updated) {
      void postStudioAction({ action: "upsert_issue", issue: updated });
    }
  };

  const handleStepColumn = (issue: KanbanIssue, delta: -1 | 1) => {
    const idx = KANBAN_COLUMNS.findIndex((c) => c.id === issue.status);
    const next = KANBAN_COLUMNS[idx + delta];
    if (next) handleMoveColumn(issue.id, next.id);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    const next = createKanbanIssue(issues, {
      title: draftTitle,
      description: draftDesc,
      status: draftStatus,
      priority: draftPriority,
      chapter: draftChapter,
      owner: draftOwner,
      ...(draftRoute ? { route: draftRoute } : {}),
      ...(draftShotId ? { linkedShotId: draftShotId } : {})
    });
    const created = next[0];
    setIssues(next);
    setDraftTitle("");
    setDraftDesc("");
    setDraftShotId("");
    setShowCreateForm(false);
    setSelectedIssueId(created?.id ?? null);
    if (created) {
      void postStudioAction({ action: "upsert_issue", issue: created });
    }
  };

  const handleExportJson = () => {
    const json = serializeKanbanExport(issues);
    try {
      void navigator.clipboard?.writeText?.(json)?.catch(() => {});
    } catch {
      // ignore clipboard errors
    }
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "gate0-production-kanban.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // ignore download errors in headless test environments
    }
    setExportCopied(true);
    window.setTimeout(() => setExportCopied(false), 1800);
  };

  const handleResetDefault = () => {
    const defIssues = DEFAULT_KANBAN_ISSUES.map((i) => ({ ...i }));
    const defDecisions = DEFAULT_DIRECTOR_DECISIONS.map((d) => ({ ...d }));
    setIssues(defIssues);
    setDecisions(defDecisions);
    setSelectedIssueId(null);
    void postStudioAction({ action: "reset_defaults" });
  };

  return (
    <div className="kanban-wrap" id="linear-kanban-board">
      {/* Pending Decisions · Waiting on Director */}
      <section className="kanban-decisions-panel" id="kanban-decisions-section">
        <div className="kanban-decisions-header">
          <div className="kanban-decisions-title-group">
            <span className="kanban-pending-pill">
              {pendingDecisions.length}{" "}
              {tl({ zh: "项待你拍板", en: "PENDING ON YOU", ja: "件 承認待ち" }, lang)}
            </span>
            <strong className="kanban-decisions-heading">
              {tl(
                {
                  zh: "导演待决队列 · 点击按钮即记录决策并自动推进看板",
                  en: "Director Decision Queue · Actions Record & Advance Kanban",
                  ja: "監督承認キュー · 決定記録＆カンバン自動更新"
                },
                lang
              )}
            </strong>
          </div>

          <div className="kanban-decisions-toolbar">
            <div className="kanban-decisions-tabs" role="group" aria-label="Decision View">
              <button
                type="button"
                id="btn-decisions-tab-pending"
                className={`kanban-filter-pill ${decisionTab === "pending" ? "active" : ""}`}
                onClick={() => setDecisionTab("pending")}
              >
                {tl({ zh: "待拍板", en: "Pending", ja: "承認待ち" }, lang)} ({pendingDecisions.length})
              </button>
              <button
                type="button"
                id="btn-decisions-tab-log"
                className={`kanban-filter-pill ${decisionTab === "log" ? "active" : ""}`}
                onClick={() => setDecisionTab("log")}
              >
                {tl({ zh: "已决策日志", en: "Decision Log", ja: "決定履歴" }, lang)} ({decidedDecisions.length})
              </button>
            </div>

            <Button
              type="button"
              id="btn-decision-new-toggle"
              className={`ctrl-btn ${showAddDecision ? "amber" : ""}`}
              onClick={() => setShowAddDecision((v) => !v)}
            >
              {tl({ zh: "+ 新增待决", en: "+ Add Decision", ja: "+ 決定項目追加" }, lang)}
            </Button>
            <Button type="button" className="ctrl-btn" onClick={handleCopyDecisionLog}>
              {decisionCopied
                ? tl({ zh: "已复制日志 ✓", en: "Copied Log ✓", ja: "コピー済 ✓" }, lang)
                : tl({ zh: "复制决策日志", en: "Copy Log", ja: "履歴コピー" }, lang)}
            </Button>
            <span
              className={`kanban-sync-pill is-${syncState}`}
              title={
                syncState === "neon"
                  ? "Synced with Neon Postgres (/api/studio-state)"
                  : "Local browser fallback"
              }
            >
              {syncState === "neon"
                ? "● NEON DB"
                : syncState === "connecting"
                  ? "◌ SYNCING..."
                  : "◐ LOCAL CACHE"}
            </span>
            <Button
              type="button"
              className="ctrl-btn"
              disabled={syncBusy}
              onClick={() => void pullRemoteState()}
            >
              ↻
            </Button>
          </div>
        </div>

        {showAddDecision ? (
          <form className="kanban-create-panel" onSubmit={handleCreateDecisionSubmit}>
            <div className="kanban-create-grid">
              <input
                type="text"
                id="decision-new-title"
                className="kanban-input"
                required
                placeholder={tl(
                  { zh: "待拍板问题（如：EP0 停机坪是否重绘雪雾？）", en: "Decision prompt...", ja: "承認事項..." },
                  lang
                )}
                value={draftDecTitle}
                onChange={(e) => setDraftDecTitle(e.target.value)}
              />
              <input
                type="text"
                className="kanban-input"
                placeholder={tl(
                  { zh: "背景说明（可选）", en: "Context / tradeoffs (optional)", ja: "背景（任意）" },
                  lang
                )}
                value={draftDecContext}
                onChange={(e) => setDraftDecContext(e.target.value)}
              />
              <select
                className="kanban-select"
                value={draftDecIssueId}
                onChange={(e) => setDraftDecIssueId(e.target.value)}
              >
                <option value="">
                  {tl({ zh: "关联看板卡片（可选）", en: "Link Issue (opt)", ja: "タスク連携（任意）" }, lang)}
                </option>
                {issues.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.id} · {tl(i.title, lang)}
                  </option>
                ))}
              </select>
              <Button type="submit" id="btn-decision-create-submit" className="ctrl-btn amber">
                {tl({ zh: "添加待决事项", en: "Add Decision", ja: "追加" }, lang)}
              </Button>
            </div>
          </form>
        ) : null}

        {decisionTab === "pending" ? (
          pendingDecisions.length === 0 ? (
            <div className="kanban-decisions-empty">
              {tl(
                {
                  zh: "✓ 当前所有待决事项均已拍板！可切换至「已决策日志」查看或重开。",
                  en: "✓ All pending decisions resolved! Switch to Decision Log to review or reopen.",
                  ja: "✓ 保留中の決定事項はありません。"
                },
                lang
              )}
            </div>
          ) : (
            <div className="kanban-decision-grid">
              {pendingDecisions.map((dec) => {
                const linkedIssue = dec.issueId
                  ? issues.find((item) => item.id === dec.issueId)
                  : undefined;
                return (
                  <article key={dec.id} data-decision-id={dec.id} className="kanban-decision-card">
                    <div className="kanban-decision-top">
                      <span className="kanban-issue-id">{dec.id}</span>
                      {dec.issueId ? (
                        <span className="kanban-chapter-badge">→ {dec.issueId}</span>
                      ) : null}
                      <div className="kanban-decision-links">
                        {linkedIssue?.linkedShotId && onOpenShotInBlocking ? (
                          <button
                            type="button"
                            className="kanban-mini-btn accent"
                            onClick={() => onOpenShotInBlocking(linkedIssue.linkedShotId!)}
                          >
                            🎯 3D
                          </button>
                        ) : null}
                        {linkedIssue?.linkedShotId && onOpenShotInStoryboard ? (
                          <button
                            type="button"
                            className="kanban-mini-btn"
                            onClick={() => onOpenShotInStoryboard(linkedIssue.linkedShotId!)}
                          >
                            🎬 Board
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <h4 className="kanban-decision-title">{tl(dec.title, lang)}</h4>
                    <p className="kanban-decision-context">{tl(dec.context, lang)}</p>

                    <input
                      type="text"
                      className="kanban-decision-note-input"
                      data-decision-note={dec.id}
                      placeholder={tl(
                        {
                          zh: "导演批注（可选，点下方按钮一并写入 Neon）...",
                          en: "Optional director note (saved with decision)...",
                          ja: "監督メモ（任意）..."
                        },
                        lang
                      )}
                      value={decisionNotes[dec.id] ?? ""}
                      onChange={(e) =>
                        setDecisionNotes((prev) => ({ ...prev, [dec.id]: e.target.value }))
                      }
                    />

                    <div className="kanban-decision-actions">
                      {dec.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          data-decision-action={`${dec.id}:${opt.id}`}
                          className={`kanban-decision-btn tone-${opt.tone ?? "route"}`}
                          onClick={() => handleRecordDecision(dec, opt.id)}
                        >
                          {tl(opt.label, lang)}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : decidedDecisions.length === 0 ? (
          <div className="kanban-decisions-empty">
            {tl(
              {
                zh: "暂无已记录的决策。点击「待拍板」中的按钮即可记录。",
                en: "No recorded decisions yet.",
                ja: "決定履歴はまだありません。"
              },
              lang
            )}
          </div>
        ) : (
          <div className="kanban-decision-log">
            {decidedDecisions.map((dec) => (
              <div key={dec.id} data-decision-log-id={dec.id} className="kanban-decision-log-row">
                <div className="kanban-decision-log-main">
                  <span className="kanban-issue-id">{dec.id}</span>
                  {dec.issueId ? <span className="kanban-chapter-badge">{dec.issueId}</span> : null}
                  <strong>{tl(dec.title, lang)}</strong>
                  <span className="kanban-chosen-badge">{dec.chosenLabel}</span>
                  {dec.directorNote ? (
                    <span className="kanban-log-note">“{dec.directorNote}”</span>
                  ) : null}
                </div>
                <div className="kanban-decision-log-meta">
                  <span>{dec.decidedAt ? dec.decidedAt.slice(0, 16).replace("T", " ") : ""}</span>
                  <button
                    type="button"
                    className="kanban-mini-btn"
                    data-decision-reopen={dec.id}
                    onClick={() => handleReopenDecision(dec.id)}
                  >
                    ↺ {tl({ zh: "重开", en: "Reopen", ja: "再開" }, lang)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Linear-style Command & Filter Bar */}
      <div className="kanban-toolbar">
        <div className="kanban-toolbar-row">
          <input
            type="search"
            id="kanban-search-input"
            className="kanban-search-input"
            value={filters.query}
            placeholder={tl(
              {
                zh: "搜索任务 ID、镜头、脚本或 @标签...",
                en: "Filter issues, shot codes, scripts, @tags...",
                ja: "タスク・カット・@タグ検索..."
              },
              lang
            )}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
          />

          <select
            className="kanban-select"
            aria-label="Filter by Owner"
            value={filters.owner}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, owner: e.target.value as KanbanOwner | "ALL" }))
            }
          >
            <option value="ALL">
              {tl({ zh: "全部角色 Owner", en: "All Owners", ja: "全担当" }, lang)}
            </option>
            {OWNER_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select
            className="kanban-select"
            aria-label="Filter by Pipeline Route"
            value={filters.route}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                route: e.target.value as RenderPipelineRoute | "ALL"
              }))
            }
          >
            <option value="ALL">
              {tl({ zh: "全部生片路线", en: "All Routes", ja: "全ルート" }, lang)}
            </option>
            <option value="fl2va_keyframes">FL2VA Keyframes (90%)</option>
            <option value="v2v_whitebox">V2V Whitebox (10%)</option>
          </select>

          <Button
            type="button"
            id="btn-kanban-new-toggle"
            className={`ctrl-btn ${showCreateForm ? "amber" : ""}`}
            onClick={() => setShowCreateForm((v) => !v)}
          >
            {tl({ zh: "+ 新建任务", en: "+ New Issue", ja: "+ 新規タスク" }, lang)}
          </Button>
          <Button type="button" id="btn-kanban-export" className="ctrl-btn" onClick={handleExportJson}>
            {exportCopied
              ? tl({ zh: "已导出 ✓", en: "Exported ✓", ja: "出力済 ✓" }, lang)
              : tl({ zh: "导出 JSON", en: "Export JSON", ja: "JSON出力" }, lang)}
          </Button>
          <Button type="button" id="btn-kanban-reset" className="ctrl-btn" onClick={handleResetDefault}>
            {tl({ zh: "重置基准", en: "Reset", ja: "初期化" }, lang)}
          </Button>
        </div>

        <div className="kanban-toolbar-row secondary">
          <div className="kanban-chapter-pills" role="group" aria-label="Chapter Filter">
            {CHAPTER_OPTIONS.map((ch) => (
              <button
                key={ch}
                type="button"
                className={`kanban-filter-pill ${filters.chapter === ch ? "active" : ""}`}
                onClick={() => setFilters((prev) => ({ ...prev, chapter: ch }))}
              >
                {ch}
              </button>
            ))}
          </div>

          <div className="kanban-stats-strip">
            <span>
              SHIPPED {stats.shipped}/{stats.total} ({stats.shippedPct}%)
            </span>
            <span>TRACKED H3 SHOTS: {stats.totalShots}</span>
          </div>
        </div>
      </div>

      {/* Inline Quick Create Form */}
      {showCreateForm ? (
        <form className="kanban-create-panel" onSubmit={handleCreateSubmit}>
          <input
            type="text"
            id="kanban-new-title"
            className="kanban-input"
            required
            placeholder={tl(
              { zh: "输入任务标题（如：N1 艾琳娜首尾帧精修）", en: "Issue title...", ja: "タスク名..." },
              lang
            )}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
          />
          <input
            type="text"
            className="kanban-input"
            placeholder={tl(
              { zh: "简述 / 脚本路径 / 备注（可选）", en: "Description / ref (optional)", ja: "詳細（任意）" },
              lang
            )}
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
          />
          <div className="kanban-create-grid">
            <select
              className="kanban-select"
              value={draftChapter}
              onChange={(e) => setDraftChapter(e.target.value as KanbanChapter)}
            >
              {CHAPTER_OPTIONS.filter((c) => c !== "ALL").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="kanban-select"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value as KanbanColumnId)}
            >
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {tl(c.label, lang)}
                </option>
              ))}
            </select>
            <select
              className="kanban-select"
              value={draftPriority}
              onChange={(e) => setDraftPriority(e.target.value as KanbanPriority)}
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="kanban-select"
              value={draftOwner}
              onChange={(e) => setDraftOwner(e.target.value as KanbanOwner)}
            >
              {OWNER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              className="kanban-select"
              value={draftRoute}
              onChange={(e) => setDraftRoute(e.target.value as RenderPipelineRoute | "")}
            >
              <option value="fl2va_keyframes">FL2VA Keyframes</option>
              <option value="v2v_whitebox">V2V Whitebox</option>
              <option value="">No Route</option>
            </select>
            <select
              className="kanban-select"
              value={draftShotId}
              onChange={(e) => setDraftShotId(e.target.value)}
            >
              <option value="">
                {tl({ zh: "关联 3D 镜头（可选）", en: "Link 3D Shot (opt)", ja: "3Dカット連携（任意）" }, lang)}
              </option>
              {STUDIO_STORYBOARD_SHOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shotCode} · {tl(s.title, lang)}
                </option>
              ))}
            </select>
            <Button type="submit" id="btn-kanban-create-submit" className="ctrl-btn amber">
              {tl({ zh: "创建卡片", en: "Create", ja: "作成" }, lang)}
            </Button>
          </div>
        </form>
      ) : null}

      {/* 6-Column Linear Board */}
      <div className="kanban-columns">
        {KANBAN_COLUMNS.map((col, colIdx) => {
          const colIssues = filteredIssues.filter((item) => item.status === col.id);
          return (
            <section
              key={col.id}
              data-kanban-column={col.id}
              className={`kanban-column ${dropTargetCol === col.id ? "is-drop-target" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dropTargetCol !== col.id) setDropTargetCol(col.id);
              }}
              onDragLeave={() => {
                if (dropTargetCol === col.id) setDropTargetCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const droppedId = e.dataTransfer.getData("text/plain") || draggingId;
                setDropTargetCol(null);
                setDraggingId(null);
                if (droppedId) handleMoveColumn(droppedId, col.id);
              }}
            >
              <header className="kanban-column-header">
                <span className="kanban-col-title">
                  <span style={{ color: col.accentHex }}>{col.glyph}</span>
                  <span>{tl(col.label, lang)}</span>
                </span>
                <span className="kanban-col-count">{colIssues.length}</span>
              </header>

              <div className="kanban-column-body">
                {colIssues.map((issue) => {
                  const prio = PRIORITY_BADGES[issue.priority];
                  const isSelected = selectedIssueId === issue.id;
                  return (
                    <article
                      key={issue.id}
                      data-kanban-issue={issue.id}
                      draggable
                      className={`kanban-card ${isSelected ? "is-selected" : ""}`}
                      onDragStart={(e) => {
                        setDraggingId(issue.id);
                        e.dataTransfer.setData("text/plain", issue.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTargetCol(null);
                      }}
                      onClick={() => setSelectedIssueId(issue.id)}
                    >
                      <div className="kanban-card-top">
                        <span className="kanban-issue-id">{issue.id}</span>
                        <div className="kanban-card-badges">
                          <span className={`kanban-priority-badge ${prio.cls}`}>{prio.label}</span>
                          <span className="kanban-chapter-badge">{issue.chapter}</span>
                        </div>
                      </div>

                      <h4 className="kanban-card-title">{tl(issue.title, lang)}</h4>

                      <div className="kanban-card-meta">
                        <span className="kanban-owner-chip">{issue.owner}</span>
                        {issue.route ? (
                          <span
                            className={`kanban-route-chip ${
                              issue.route === "v2v_whitebox" ? "is-v2v" : "is-fl2va"
                            }`}
                          >
                            {issue.route === "v2v_whitebox" ? "V2V" : "FL2VA"}
                          </span>
                        ) : null}
                        {issue.shotCount ? <span>{issue.shotCount} shots</span> : null}
                      </div>

                      {issue.sourceRef ? (
                        <div className="kanban-source-ref" title={issue.sourceRef}>
                          {issue.sourceRef}
                        </div>
                      ) : null}

                      <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="kanban-mini-btn"
                          disabled={colIdx === 0}
                          aria-label={`Move ${issue.id} left`}
                          onClick={() => handleStepColumn(issue, -1)}
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          className="kanban-mini-btn"
                          disabled={colIdx === KANBAN_COLUMNS.length - 1}
                          aria-label={`Move ${issue.id} right`}
                          onClick={() => handleStepColumn(issue, 1)}
                        >
                          ▶
                        </button>
                        {issue.linkedShotId && onOpenShotInBlocking ? (
                          <button
                            type="button"
                            className="kanban-mini-btn accent"
                            data-kanban-open-3d={issue.id}
                            onClick={() => onOpenShotInBlocking(issue.linkedShotId!)}
                          >
                            🎯 3D
                          </button>
                        ) : null}
                        {issue.linkedShotId && onOpenShotInStoryboard ? (
                          <button
                            type="button"
                            className="kanban-mini-btn"
                            data-kanban-open-board={issue.id}
                            onClick={() => onOpenShotInStoryboard(issue.linkedShotId!)}
                          >
                            🎬 Board
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Selected Issue Inspector Drawer */}
      {selectedIssue ? (
        <div className="kanban-detail-bar" id="kanban-detail-bar">
          <div className="kanban-detail-main">
            <div className="kanban-detail-head">
              <span className="kanban-issue-id">{selectedIssue.id}</span>
              <strong>{tl(selectedIssue.title, lang)}</strong>
              <span className="kanban-chapter-badge">{selectedIssue.chapter}</span>
            </div>
            <p className="kanban-detail-desc">{tl(selectedIssue.description, lang)}</p>
            {selectedIssue.linkedAssetTags && selectedIssue.linkedAssetTags.length > 0 ? (
              <div className="kanban-detail-tags">
                {selectedIssue.linkedAssetTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="bound-asset-chip"
                    onClick={() => onJumpToAsset?.(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="kanban-detail-controls">
            <label className="kanban-detail-field">
              <span>Status</span>
              <select
                className="kanban-select"
                value={selectedIssue.status}
                onChange={(e) =>
                  handleMoveColumn(selectedIssue.id, e.target.value as KanbanColumnId)
                }
              >
                {KANBAN_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tl(c.label, lang)}
                  </option>
                ))}
              </select>
            </label>
            <label className="kanban-detail-field">
              <span>Priority</span>
              <select
                className="kanban-select"
                value={selectedIssue.priority}
                onChange={(e) => {
                  const next = updateKanbanIssue(issues, selectedIssue.id, {
                    priority: e.target.value as KanbanPriority
                  });
                  setIssues(next);
                  const updated = next.find((i) => i.id === selectedIssue.id);
                  if (updated) void postStudioAction({ action: "upsert_issue", issue: updated });
                }}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="kanban-detail-field">
              <span>Owner</span>
              <select
                className="kanban-select"
                value={selectedIssue.owner}
                onChange={(e) => {
                  const next = updateKanbanIssue(issues, selectedIssue.id, {
                    owner: e.target.value as KanbanOwner
                  });
                  setIssues(next);
                  const updated = next.find((i) => i.id === selectedIssue.id);
                  if (updated) void postStudioAction({ action: "upsert_issue", issue: updated });
                }}
              >
                {OWNER_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            {selectedIssue.custom ? (
              <Button
                type="button"
                className="ctrl-btn"
                onClick={() => {
                  setIssues((prev) => deleteKanbanIssue(prev, selectedIssue.id));
                  void postStudioAction({ action: "delete_issue", issueId: selectedIssue.id });
                  setSelectedIssueId(null);
                }}
              >
                {tl({ zh: "删除", en: "Delete", ja: "削除" }, lang)}
              </Button>
            ) : null}
            <Button type="button" className="ctrl-btn" onClick={() => setSelectedIssueId(null)}>
              ✕
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
