import { handleInterrogateWebRequest } from "../src/server/interrogate-handler.js";

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

export async function GET(request?: Request): Promise<Response> {
  const req = request ?? new Request("https://quarantine-gate-0.vercel.app/api/interrogate", { method: "GET" });
  return handleInterrogateWebRequest(req, resolveRuntimeEnv(request));
}

export async function POST(request: Request): Promise<Response> {
  return handleInterrogateWebRequest(request, resolveRuntimeEnv(request));
}
