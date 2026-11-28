import { neon } from "@neondatabase/serverless";
import {
  applyDirectorDecision,
  createDirectorDecision,
  DEFAULT_DIRECTOR_DECISIONS,
  DEFAULT_KANBAN_ISSUES,
  reopenDirectorDecision,
  type DirectorDecision,
  type KanbanChapter,
  type KanbanColumnId,
  type KanbanIssue,
  type KanbanOwner,
  type KanbanPriority
} from "../game/production-kanban.js";
import type { RenderPipelineRoute } from "../game/production-board.js";
import type { LocalizedText } from "../game/types.js";

export type StudioSqlRunner = (
  query: string,
  params?: unknown[]
) => Promise<Record<string, unknown>[]>;

const STATIC_ALLOWED_ORIGINS = new Set([
  "https://evanzhousy.github.io",
  "https://quarantine-gate-0.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
]);

function resolveAllowedOrigin(originHeader: string | null | undefined): string {
  if (!originHeader) return "https://quarantine-gate-0.vercel.app";
  const origin = originHeader.trim();
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^https:\/\/quarantine-gate-0(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)) {
    return origin;
  }
  return "https://quarantine-gate-0.vercel.app";
}

function buildHeaders(request?: Request): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": resolveAllowedOrigin(request?.headers.get("origin")),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin"
  };
}

function parseJsonValue<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

function toIsoDateOnly(val: unknown): string {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string" && val.length >= 10) return val.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function toIsoTimestamp(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return undefined;
}

function mapIssueRow(row: Record<string, unknown>): KanbanIssue {
  const tags = parseJsonValue<string[]>(row.linked_asset_tags, []);
  const issue: KanbanIssue = {
    id: String(row.id),
    title: parseJsonValue<LocalizedText>(row.title_json, { zh: "", en: "", ja: "" }),
    description: parseJsonValue<LocalizedText>(row.description_json, { zh: "", en: "", ja: "" }),
    status: String(row.status) as KanbanColumnId,
    priority: String(row.priority) as KanbanPriority,
    chapter: String(row.chapter) as KanbanChapter,
    owner: String(row.owner) as KanbanOwner,
    updatedAt: toIsoDateOnly(row.updated_at)
  };
  if (row.route) issue.route = String(row.route) as RenderPipelineRoute;
  if (typeof row.shot_count === "number") issue.shotCount = row.shot_count;
  if (typeof row.reel_count === "number") issue.reelCount = row.reel_count;
  if (typeof row.duration_sec === "number") issue.durationSec = row.duration_sec;
  if (row.linked_shot_id) issue.linkedShotId = String(row.linked_shot_id);
  if (tags.length > 0) issue.linkedAssetTags = tags;
  if (row.source_ref) issue.sourceRef = String(row.source_ref);
  if (row.custom === true) issue.custom = true;
  return issue;
}

function mapDecisionRow(row: Record<string, unknown>): DirectorDecision {
  const decision: DirectorDecision = {
    id: String(row.id),
    title: parseJsonValue<LocalizedText>(row.title_json, { zh: "", en: "", ja: "" }),
    context: parseJsonValue<LocalizedText>(row.context_json, { zh: "", en: "", ja: "" }),
    status: String(row.status) === "decided" ? "decided" : "pending",
    options: parseJsonValue<DirectorDecision["options"]>(row.options_json, []),
    createdAt: toIsoTimestamp(row.created_at) ?? new Date().toISOString()
  };
  if (row.issue_id) decision.issueId = String(row.issue_id);
  if (row.chosen_option_id) decision.chosenOptionId = String(row.chosen_option_id);
  if (row.chosen_label) decision.chosenLabel = String(row.chosen_label);
  if (row.director_note) decision.directorNote = String(row.director_note);
  if (row.decided_by) decision.decidedBy = String(row.decided_by);
  const decidedAt = toIsoTimestamp(row.decided_at);
  if (decidedAt) decision.decidedAt = decidedAt;
  return decision;
}

async function upsertIssueRow(
  runSql: StudioSqlRunner,
  issue: KanbanIssue,
  sortOrder: number
): Promise<void> {
  await runSql(
    `INSERT INTO studio_kanban_issues (
      id, title_json, description_json, status, priority, chapter, owner,
      route, shot_count, reel_count, duration_sec, linked_shot_id,
      linked_asset_tags, source_ref, custom, sort_order, updated_at
    ) VALUES (
      $1, $2::jsonb, $3::jsonb, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13::jsonb, $14, $15, $16, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title_json = EXCLUDED.title_json,
      description_json = EXCLUDED.description_json,
      status = EXCLUDED.status,
      priority = EXCLUDED.priority,
      chapter = EXCLUDED.chapter,
      owner = EXCLUDED.owner,
      route = EXCLUDED.route,
      shot_count = EXCLUDED.shot_count,
      reel_count = EXCLUDED.reel_count,
      duration_sec = EXCLUDED.duration_sec,
      linked_shot_id = EXCLUDED.linked_shot_id,
      linked_asset_tags = EXCLUDED.linked_asset_tags,
      source_ref = EXCLUDED.source_ref,
      custom = EXCLUDED.custom,
      updated_at = NOW()`,
    [
      issue.id,
      JSON.stringify(issue.title),
      JSON.stringify(issue.description),
      issue.status,
      issue.priority,
      issue.chapter,
      issue.owner,
      issue.route ?? null,
      issue.shotCount ?? null,
      issue.reelCount ?? null,
      issue.durationSec ?? null,
      issue.linkedShotId ?? null,
      JSON.stringify(issue.linkedAssetTags ?? []),
      issue.sourceRef ?? null,
      Boolean(issue.custom),
      sortOrder
    ]
  );
}

async function upsertDecisionRow(runSql: StudioSqlRunner, dec: DirectorDecision): Promise<void> {
  await runSql(
    `INSERT INTO studio_decisions (
      id, issue_id, title_json, context_json, status, options_json,
      chosen_option_id, chosen_label, director_note, decided_by, decided_at,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3::jsonb, $4::jsonb, $5, $6::jsonb,
      $7, $8, $9, $10, $11,
      $12, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      issue_id = EXCLUDED.issue_id,
      title_json = EXCLUDED.title_json,
      context_json = EXCLUDED.context_json,
      status = EXCLUDED.status,
      options_json = EXCLUDED.options_json,
      chosen_option_id = EXCLUDED.chosen_option_id,
      chosen_label = EXCLUDED.chosen_label,
      director_note = EXCLUDED.director_note,
      decided_by = EXCLUDED.decided_by,
      decided_at = EXCLUDED.decided_at,
      updated_at = NOW()`,
    [
      dec.id,
      dec.issueId ?? null,
      JSON.stringify(dec.title),
      JSON.stringify(dec.context),
      dec.status,
      JSON.stringify(dec.options),
      dec.chosenOptionId ?? null,
      dec.chosenLabel ?? null,
      dec.directorNote ?? null,
      dec.decidedBy ?? null,
      dec.decidedAt ?? null,
      dec.createdAt
    ]
  );
}

export async function ensureStudioSchemaAndSeed(runSql: StudioSqlRunner): Promise<void> {
  await runSql(`CREATE TABLE IF NOT EXISTS studio_kanban_issues (
    id TEXT PRIMARY KEY,
    title_json JSONB NOT NULL,
    description_json JSONB NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    chapter TEXT NOT NULL,
    owner TEXT NOT NULL,
    route TEXT,
    shot_count INTEGER,
    reel_count INTEGER,
    duration_sec DOUBLE PRECISION,
    linked_shot_id TEXT,
    linked_asset_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_ref TEXT,
    custom BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await runSql(`CREATE TABLE IF NOT EXISTS studio_decisions (
    id TEXT PRIMARY KEY,
    issue_id TEXT,
    title_json JSONB NOT NULL,
    context_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    options_json JSONB NOT NULL,
    chosen_option_id TEXT,
    chosen_label TEXT,
    director_note TEXT,
    decided_by TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  const issueCountRows = await runSql("SELECT COUNT(*)::int AS cnt FROM studio_kanban_issues");
  const issueCount = Number(issueCountRows[0]?.cnt ?? 0);
  if (issueCount === 0) {
    for (let i = 0; i < DEFAULT_KANBAN_ISSUES.length; i++) {
      await upsertIssueRow(runSql, DEFAULT_KANBAN_ISSUES[i]!, i + 1);
    }
  }

  const decCountRows = await runSql("SELECT COUNT(*)::int AS cnt FROM studio_decisions");
  const decCount = Number(decCountRows[0]?.cnt ?? 0);
  if (decCount === 0) {
    for (const dec of DEFAULT_DIRECTOR_DECISIONS) {
      await upsertDecisionRow(runSql, dec);
    }
  }
}

async function readFullState(runSql: StudioSqlRunner): Promise<{
  issues: KanbanIssue[];
  decisions: DirectorDecision[];
}> {
  const issueRows = await runSql(
    "SELECT * FROM studio_kanban_issues ORDER BY sort_order ASC, id ASC"
  );
  const decRows = await runSql("SELECT * FROM studio_decisions ORDER BY id ASC");
  return {
    issues: issueRows.map(mapIssueRow),
    decisions: decRows.map(mapDecisionRow)
  };
}

function createNeonRunner(databaseUrl: string): StudioSqlRunner {
  const sql = neon(databaseUrl);
  return async (query: string, params: unknown[] = []) => {
    const rows = await sql.query(query, params);
    return rows as Record<string, unknown>[];
  };
}

export async function handleStudioStateWebRequest(
  request: Request,
  env: Record<string, string | undefined>,
  customSqlRunner?: StudioSqlRunner
): Promise<Response> {
  const headers = buildHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const dbUrl = env.DATABASE_URL?.trim();
  const runSql = customSqlRunner ?? (dbUrl ? createNeonRunner(dbUrl) : null);

  if (!runSql) {
    return new Response(
      JSON.stringify({
        ok: false,
        storage: "unconfigured",
        error: "DATABASE_URL_NOT_CONFIGURED"
      }),
      { status: 503, headers }
    );
  }

  try {
    await ensureStudioSchemaAndSeed(runSql);

    if (request.method === "GET") {
      const state = await readFullState(runSql);
      return new Response(
        JSON.stringify({
          ok: true,
          storage: "neon",
          ...state,
          syncedAt: new Date().toISOString()
        }),
        { status: 200, headers }
      );
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }),
        { status: 405, headers }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const current = await readFullState(runSql);

    if (action === "record_decision") {
      const decisionId = String(body.decisionId ?? "");
      const optionId = String(body.optionId ?? "");
      const note = typeof body.note === "string" ? body.note : undefined;
      const lang = body.lang === "en" || body.lang === "ja" || body.lang === "zh" ? body.lang : "zh";
      const applied = applyDirectorDecision(current.issues, current.decisions, {
        decisionId,
        optionId,
        note,
        decidedBy: "Director",
        lang
      });
      if (!applied.updatedDecision) {
        return new Response(
          JSON.stringify({ ok: false, error: "DECISION_OR_OPTION_NOT_FOUND" }),
          { status: 400, headers }
        );
      }
      await upsertDecisionRow(runSql, applied.updatedDecision);
      if (applied.updatedDecision.issueId) {
        const linkedIdx = applied.issues.findIndex(
          (item) => item.id === applied.updatedDecision?.issueId
        );
        const linkedIssue = linkedIdx >= 0 ? applied.issues[linkedIdx] : undefined;
        if (linkedIssue) {
          await upsertIssueRow(runSql, linkedIssue, linkedIdx + 1);
        }
      }
    } else if (action === "reopen_decision") {
      const decisionId = String(body.decisionId ?? "");
      const nextDecs = reopenDirectorDecision(current.decisions, decisionId);
      const target = nextDecs.find((d) => d.id === decisionId);
      if (!target) {
        return new Response(JSON.stringify({ ok: false, error: "DECISION_NOT_FOUND" }), {
          status: 400,
          headers
        });
      }
      await upsertDecisionRow(runSql, target);
    } else if (action === "create_decision") {
      const rawDec = body.decision as DirectorDecision | undefined;
      if (rawDec && typeof rawDec.id === "string" && rawDec.title) {
        await upsertDecisionRow(runSql, rawDec);
      } else {
        const title = String(body.title ?? "").trim();
        if (!title) {
          return new Response(JSON.stringify({ ok: false, error: "MISSING_TITLE" }), {
            status: 400,
            headers
          });
        }
        const createdList = createDirectorDecision(current.decisions, {
          title,
          context: typeof body.context === "string" ? body.context : undefined,
          issueId: typeof body.issueId === "string" ? body.issueId : undefined
        });
        if (createdList[0]) {
          await upsertDecisionRow(runSql, createdList[0]);
        }
      }
    } else if (action === "upsert_issue") {
      const issue = body.issue as KanbanIssue | undefined;
      if (!issue || typeof issue.id !== "string" || !issue.title) {
        return new Response(JSON.stringify({ ok: false, error: "INVALID_ISSUE" }), {
          status: 400,
          headers
        });
      }
      const existingIdx = current.issues.findIndex((i) => i.id === issue.id);
      const sortOrder = existingIdx >= 0 ? existingIdx + 1 : 0;
      await upsertIssueRow(runSql, issue, sortOrder);
    } else if (action === "delete_issue") {
      const issueId = String(body.issueId ?? "");
      await runSql("DELETE FROM studio_kanban_issues WHERE id = $1 AND custom = TRUE", [issueId]);
    } else if (action === "reset_defaults") {
      await runSql("DELETE FROM studio_kanban_issues");
      await runSql("DELETE FROM studio_decisions");
      for (let i = 0; i < DEFAULT_KANBAN_ISSUES.length; i++) {
        await upsertIssueRow(runSql, DEFAULT_KANBAN_ISSUES[i]!, i + 1);
      }
      for (const dec of DEFAULT_DIRECTOR_DECISIONS) {
        await upsertDecisionRow(runSql, dec);
      }
    } else {
      return new Response(JSON.stringify({ ok: false, error: "UNKNOWN_ACTION" }), {
        status: 400,
        headers
      });
    }

    const nextState = await readFullState(runSql);
    return new Response(
      JSON.stringify({
        ok: true,
        storage: "neon",
        ...nextState,
        syncedAt: new Date().toISOString()
      }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "STUDIO_STATE_ERROR"
      }),
      { status: 500, headers }
    );
  }
}
