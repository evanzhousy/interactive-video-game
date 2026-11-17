import {
  executeServerRephrase,
  resolveServerFlashProvider
} from "../src/server/rephrase-handler.js";

const DEFAULT_ALLOWED_ORIGIN = "https://evanzhousy.github.io";

const STATIC_ALLOWED_ORIGINS = new Set([
  "https://evanzhousy.github.io",
  "https://quarantine-gate-0.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "tauri://localhost",
  "http://tauri.localhost",
  "https://tauri.localhost"
]);

export function resolveAllowedCorsOrigin(originHeader: string | null | undefined): string {
  if (!originHeader) return DEFAULT_ALLOWED_ORIGIN;
  const origin = originHeader.trim();
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^https:\/\/quarantine-gate-0(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)) {
    return origin;
  }
  return DEFAULT_ALLOWED_ORIGIN;
}

function buildResponseHeaders(request?: Request): Record<string, string> {
  const allowOrigin = resolveAllowedCorsOrigin(request?.headers.get("origin"));
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function resolveRuntimeEnv(request?: Request): Record<string, string | undefined> {
  const headerOidc = request?.headers.get("x-vercel-oidc-token")?.trim();
  if (headerOidc && !process.env.VERCEL_OIDC_TOKEN) {
    return {
      ...process.env,
      VERCEL_OIDC_TOKEN: headerOidc
    };
  }
  return process.env;
}

export async function OPTIONS(request?: Request): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: buildResponseHeaders(request)
  });
}

export async function GET(request?: Request): Promise<Response> {
  const provider = resolveServerFlashProvider(resolveRuntimeEnv(request));
  return new Response(
    JSON.stringify({
      ok: true,
      configured: Boolean(provider),
      provider: provider?.provider ?? null,
      model: provider?.model ?? null
    }),
    { status: 200, headers: buildResponseHeaders(request) }
  );
}

export async function POST(request: Request): Promise<Response> {
  const headers = buildResponseHeaders(request);
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ status: "ERROR", error: "MALFORMED_JSON" }),
      { status: 400, headers }
    );
  }

  const result = await executeServerRephrase(rawBody, resolveRuntimeEnv(request));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers
  });
}

export async function handleRephraseFetch(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return OPTIONS(request);
  }
  if (request.method === "GET") {
    return GET(request);
  }
  if (request.method === "POST") {
    return POST(request);
  }
  return new Response(
    JSON.stringify({ status: "ERROR", error: "METHOD_NOT_ALLOWED" }),
    { status: 405, headers: buildResponseHeaders(request) }
  );
}

export default { fetch: handleRephraseFetch };
