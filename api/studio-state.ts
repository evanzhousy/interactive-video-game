import { handleStudioStateWebRequest } from "../src/server/studio-state-handler.js";

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
  return handleStudioStateWebRequest(
    request ?? new Request("https://quarantine-gate-0.vercel.app/api/studio-state", { method: "OPTIONS" }),
    resolveRuntimeEnv(request)
  );
}

export async function GET(request?: Request): Promise<Response> {
  const req =
    request ?? new Request("https://quarantine-gate-0.vercel.app/api/studio-state", { method: "GET" });
  return handleStudioStateWebRequest(req, resolveRuntimeEnv(request));
}

export async function POST(request: Request): Promise<Response> {
  return handleStudioStateWebRequest(request, resolveRuntimeEnv(request));
}
