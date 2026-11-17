import { useState } from "react";
import { tl } from "../../game/i18n.js";
import { VERCEL_PRODUCTION_REPHRASE_URL } from "../../game/rephrase.js";
import type { FlashRephraseConfig, FlashTransportMode, Locale } from "../../game/types.js";

interface Props {
  lang: Locale;
  config: FlashRephraseConfig;
  onChange: (next: FlashRephraseConfig) => void;
  onClose: () => void;
}

export function FlashConfigDrawer({ lang, config, onChange, onClose }: Props) {
  const [probeStatus, setProbeStatus] = useState<string | null>(null);

  const checkServerProxy = async () => {
    const targetUrl = config.proxyPath || "/api/rephrase";
    setProbeStatus(`Checking ${targetUrl}...`);
    try {
      let res = await fetch(targetUrl, { method: "GET" });
      if ((res.status === 404 || res.status === 405) && targetUrl !== VERCEL_PRODUCTION_REPHRASE_URL) {
        res = await fetch(VERCEL_PRODUCTION_REPHRASE_URL, { method: "GET" });
      }
      if (!res.ok) {
        setProbeStatus(`HTTP ${res.status} (static host — switch to Custom Endpoint or deploy on Vercel)`);
        return;
      }
      const data = (await res.json()) as {
        configured?: boolean;
        provider?: string | null;
        model?: string | null;
      };
      if (data.configured) {
        setProbeStatus(`READY · provider=${data.provider} · model=${data.model}`);
      } else {
        setProbeStatus(
          "UNCONFIGURED (no API key in server env — falls back cleanly to pre-written canonical lines)"
        );
      }
    } catch {
      setProbeStatus("UNREACHABLE (offline — automatic canonical fallback active)");
    }
  };

  return (
    <section className="panel flash-drawer" id="flash-config-drawer">
      <div className="viewport-header" style={{ marginBottom: "10px" }}>
        <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
          ⚡ FLASH ONLINE FREE-TEXT REPHRASE LAYER (ZERO IDENTITY LEAKAGE)
        </span>
        <button type="button" className="ctrl-btn" onClick={onClose}>
          {tl({ zh: "收起面板", en: "Close", ja: "閉じる" }, lang)}
        </button>
      </div>

      <div className="flash-drawer-grid">
        <label className="flash-check-row">
          <input
            id="flash-enable-checkbox"
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
          />
          <span>
            {tl(
              {
                zh: "启用在线 Flash 台词改写（针对玩家自由提问重塑措辞，超时/断网 0 阻塞自动回退）",
                en: "Enable live Flash line rephrasing (adapts canonical stance line to player wording; instant fallback on timeout/offline)",
                ja: "Flashオンライン台詞改稿を有効化（自由入力に合わせて言い回しを調整・タイムアウト時は即座にフォールバック）"
              },
              lang
            )}
          </span>
        </label>

        <label className="flash-check-row">
          <input
            id="flash-freetext-only-checkbox"
            type="checkbox"
            checked={config.freeTextOnly}
            onChange={(e) => onChange({ ...config, freeTextOnly: e.target.checked })}
          />
          <span>
            {tl(
              {
                zh: "仅对自由输入问题调用 Flash（推荐：预设芯片保持 0ms 瞬时响应）",
                en: "Invoke Flash on typed free-text questions only (preset chips stay 0ms instant)",
                ja: "自由入力の質問のみFlashを使用（定型チップは0ms即時応答を維持）"
              },
              lang
            )}
          </span>
        </label>

        <div className="flash-field-row">
          <label htmlFor="flash-mode-select">
            {tl({ zh: "传输模式:", en: "Transport:", ja: "接続モード:" }, lang)}
          </label>
          <select
            id="flash-mode-select"
            className="ctrl-select"
            value={config.mode}
            onChange={(e) => onChange({ ...config, mode: e.target.value as FlashTransportMode })}
          >
            <option value="server_proxy">Server Proxy (/api/rephrase · Vercel / Vite .env)</option>
            <option value="custom_endpoint">Custom OpenAI-Compatible Endpoint (/v1/chat/completions)</option>
          </select>

          {config.mode === "server_proxy" ? (
            <button type="button" className="ctrl-btn amber" onClick={checkServerProxy}>
              {tl({ zh: "检测服务端状态", en: "Check /api/rephrase", ja: "サーバー状態確認" }, lang)}
            </button>
          ) : null}
        </div>

        {config.mode === "custom_endpoint" ? (
          <div className="flash-custom-grid">
            <input
              id="flash-endpoint-input"
              type="text"
              className="ask-input"
              placeholder="Endpoint URL (e.g. https://ai-gateway.vercel.sh/v1/chat/completions)"
              value={config.endpointUrl}
              onChange={(e) => onChange({ ...config, endpointUrl: e.target.value })}
            />
            <input
              id="flash-model-input"
              type="text"
              className="ask-input"
              placeholder="Model (e.g. google/gemini-3.8-flash)"
              value={config.model}
              onChange={(e) => onChange({ ...config, model: e.target.value })}
            />
            <input
              id="flash-apikey-input"
              type="password"
              className="ask-input"
              placeholder="API Key (optional for local gateway, held in memory only)"
              value={config.apiKey}
              onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
            />
          </div>
        ) : null}

        {probeStatus ? <div className="flash-status-pill">{probeStatus}</div> : null}

        <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {tl(
            {
              zh: "🔒 管线红线校验：LlmRephraseInput 严禁包含 isMimic / defectMode / lineKey；生成结果经长度、语种与防出戏校验后才上屏。",
              en: "🔒 Anti-Leakage Guard: `isMimic`, `defectMode`, and `lineKey` are stripped by construction and rejected with HTTP 400 if smuggled.",
              ja: "🔒 漏洩防止ガード：`isMimic` / `defectMode` は構造的に排除され、不正送信時は HTTP 400 で拒否されます。"
            },
            lang
          )}
        </div>
      </div>
    </section>
  );
}
