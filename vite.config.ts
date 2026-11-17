import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import {
  executeServerRephrase,
  resolveServerFlashProvider
} from "./src/server/rephrase-handler.js";

function readRequestBody(req: IncomingMessage, maxBytes = 16_384): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function flashRephraseDevPlugin(env: Record<string, string | undefined>): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const pathname = req.url?.split("?")[0];
    if (pathname !== "/api/rephrase") {
      next();
      return;
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
      const provider = resolveServerFlashProvider(env);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          configured: Boolean(provider),
          provider: provider?.provider ?? null,
          model: provider?.model ?? null
        })
      );
      return;
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end(JSON.stringify({ status: "ERROR", error: "METHOD_NOT_ALLOWED" }));
      return;
    }

    try {
      const rawText = await readRequestBody(req);
      const parsed = JSON.parse(rawText) as unknown;
      const result = await executeServerRephrase(parsed, env);
      res.statusCode = result.status;
      res.end(JSON.stringify(result.body));
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ status: "ERROR", error: "MALFORMED_JSON" }));
    }
  };

  return {
    name: "gate0-flash-rephrase-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const mergedEnv: Record<string, string | undefined> = { ...fileEnv, ...process.env };

  return {
    plugins: [react(), flashRephraseDevPlugin(mergedEnv)],
    base: "./",
    build: {
      outDir: "dist",
      emptyOutDir: true
    },
    server: {
      port: 5173
    }
  };
});
