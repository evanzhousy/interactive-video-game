import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { handleGenerateVisitorsWebRequest } from "./src/server/generate-visitors-handler.js";
import { handleInterrogateWebRequest } from "./src/server/interrogate-handler.js";
import {
  executeServerRephrase,
  resolveServerFlashProvider
} from "./src/server/rephrase-handler.js";
import { handleStudioStateWebRequest } from "./src/server/studio-state-handler.js";

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
    if (pathname === "/studio" || pathname === "/studio/") {
      req.url = "/studio.html";
      next();
      return;
    }
    if (pathname === "/api/studio-state") {
      try {
        const method = req.method ?? "GET";
        const body = method === "POST" ? await readRequestBody(req, 65_536) : undefined;
        const webReq = new Request(`http://localhost:5173${req.url ?? "/api/studio-state"}`, {
          method,
          headers: {
            "content-type": String(req.headers["content-type"] ?? "application/json"),
            ...(req.headers.origin ? { origin: String(req.headers.origin) } : {})
          },
          body
        });
        const webRes = await handleStudioStateWebRequest(webReq, env);
        res.statusCode = webRes.status;
        webRes.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        res.end(await webRes.text());
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "MALFORMED_REQUEST" }));
      }
      return;
    }
    if (pathname === "/api/generate-visitors") {
      try {
        const method = req.method ?? "GET";
        const body = method === "POST" ? await readRequestBody(req, 16_384) : undefined;
        const webReq = new Request(`http://localhost:5173${req.url ?? "/api/generate-visitors"}`, {
          method,
          headers: {
            "content-type": String(req.headers["content-type"] ?? "application/json")
          },
          body
        });
        const webRes = await handleGenerateVisitorsWebRequest(webReq, env);
        res.statusCode = webRes.status;
        webRes.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        res.end(await webRes.text());
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "MALFORMED_REQUEST" }));
      }
      return;
    }

    if (pathname === "/api/interrogate") {
      try {
        const method = req.method ?? "GET";
        const body =
          method === "POST" ? await readRequestBody(req, 65_536) : undefined;
        const webReq = new Request(`http://localhost:5173${req.url ?? "/api/interrogate"}`, {
          method,
          headers: {
            "content-type": String(req.headers["content-type"] ?? "application/json")
          },
          body
        });
        const webRes = await handleInterrogateWebRequest(webReq, env);
        res.statusCode = webRes.status;
        webRes.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        if (!webRes.body) {
          res.end();
          return;
        }
        const reader = webRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ status: "ERROR", error: "MALFORMED_REQUEST" }));
      }
      return;
    }

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
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL("./index.html", import.meta.url)),
          studio: fileURLToPath(new URL("./studio.html", import.meta.url))
        },
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) {
              return "vendor-react";
            }
            if (id.includes("node_modules/@ui-sdk") || id.includes("node_modules/@floating-ui")) {
              return "vendor-ui-sdk";
            }
            if (id.includes("/src/game/") || id.includes("/src/ordamor/")) {
              return "game-engine";
            }
            return undefined;
          }
        }
      }
    },
    server: {
      port: 5173
    }
  };
});
