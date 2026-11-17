import {
  executeServerRephrase,
  resolveServerFlashProvider
} from "../src/server/rephrase-handler.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export async function GET(): Promise<Response> {
  const provider = resolveServerFlashProvider(process.env);
  return new Response(
    JSON.stringify({
      ok: true,
      configured: Boolean(provider),
      provider: provider?.provider ?? null,
      model: provider?.model ?? null
    }),
    { status: 200, headers: JSON_HEADERS }
  );
}

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ status: "ERROR", error: "MALFORMED_JSON" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const result = await executeServerRephrase(rawBody, process.env);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: JSON_HEADERS
  });
}

export async function handleRephraseFetch(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return GET();
  }
  if (request.method === "POST") {
    return POST(request);
  }
  return new Response(
    JSON.stringify({ status: "ERROR", error: "METHOD_NOT_ALLOWED" }),
    { status: 405, headers: JSON_HEADERS }
  );
}

export default { fetch: handleRephraseFetch };
