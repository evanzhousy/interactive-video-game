import { Button } from "@ui-sdk/react/button";
import { useEffect, useMemo, useState } from "react";
import { tl } from "../../game/i18n.js";
import { STUDIO_STORYBOARD_SHOTS, type RenderPipelineRoute } from "../../game/production-board.js";
import {
  computeKanbanStats,
  createKanbanIssue,
  DEFAULT_KANBAN_ISSUES,
  deleteKanbanIssue,
  filterKanbanIssues,
  KANBAN_COLUMNS,
  loadKanbanIssues,
  moveKanbanIssue,
  saveKanbanIssues,
  serializeKanbanExport,
  updateKanbanIssue,
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

  // Quick-create form state
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftChapter, setDraftChapter] = useState<KanbanChapter>("ONER");
  const [draftStatus, setDraftStatus] = useState<KanbanColumnId>("previz");
  const [draftPriority, setDraftPriority] = useState<KanbanPriority>("high");
  const [draftOwner, setDraftOwner] = useState<KanbanOwner>("Cinematographer");
  const [draftRoute, setDraftRoute] = useState<RenderPipelineRoute | "">("fl2va_keyframes");
  const [draftShotId, setDraftShotId] = useState<string>("");

  useEffect(() => {
    saveKanbanIssues(issues);
  }, [issues]);

  const filteredIssues = useMemo(
    () => filterKanbanIssues(issues, filters, lang),
    [issues, filters, lang]
  );

  const stats = useMemo(() => computeKanbanStats(issues), [issues]);

  const selectedIssue = useMemo(
    () => issues.find((item) => item.id === selectedIssueId) ?? null,
    [issues, selectedIssueId]
  );

  const handleMoveColumn = (id: string, nextStatus: KanbanColumnId) => {
    setIssues((prev) => moveKanbanIssue(prev, id, nextStatus));
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
    setIssues(next);
    setDraftTitle("");
    setDraftDesc("");
    setDraftShotId("");
    setShowCreateForm(false);
    setSelectedIssueId(next[0]?.id ?? null);
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
    setIssues(DEFAULT_KANBAN_ISSUES.map((i) => ({ ...i })));
    setSelectedIssueId(null);
  };

  return (
    <div className="kanban-wrap" id="linear-kanban-board">
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

                      <div
                        className="kanban-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                onChange={(e) =>
                  setIssues((prev) =>
                    updateKanbanIssue(prev, selectedIssue.id, {
                      priority: e.target.value as KanbanPriority
                    })
                  )
                }
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
                onChange={(e) =>
                  setIssues((prev) =>
                    updateKanbanIssue(prev, selectedIssue.id, {
                      owner: e.target.value as KanbanOwner
                    })
                  )
                }
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
