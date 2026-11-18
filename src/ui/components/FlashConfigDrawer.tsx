import { Button } from "@ui-sdk/react/button";
import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import { Collapsible, CollapsiblePanel } from "@ui-sdk/react/collapsible";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input";
import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputToggle
} from "@ui-sdk/react/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@ui-sdk/react/select";
import { useState } from "react";
import { tl } from "../../game/i18n.js";
import { VERCEL_PRODUCTION_REPHRASE_URL } from "../../game/rephrase.js";
import type { FlashRephraseConfig, FlashTransportMode, Locale } from "../../game/types.js";
import { CheckIcon, ChevronDownIcon, ClearIcon } from "./Icons.js";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Locale;
  config: FlashRephraseConfig;
  onChange: (next: FlashRephraseConfig) => void;
}

const TRANSPORT_ITEMS: Array<{ value: FlashTransportMode; label: string }> = [
  {
    value: "server_proxy",
    label: "Server Proxy (/api/rephrase · Vercel / Vite .env)"
  },
  {
    value: "custom_endpoint",
    label: "Custom OpenAI-Compatible Endpoint (/v1/chat/completions)"
  }
];

export function FlashConfigDrawer({ open, onOpenChange, lang, config, onChange }: Props) {
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
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsiblePanel>
        <section className="panel flash-drawer" id="flash-config-drawer">
          <div className="viewport-header" style={{ marginBottom: "10px" }}>
            <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
              ⚡ FLASH ONLINE FREE-TEXT REPHRASE LAYER (ZERO IDENTITY LEAKAGE)
            </span>
            <Button className="ctrl-btn" onClick={() => onOpenChange(false)}>
              {tl({ zh: "收起面板", en: "Close", ja: "閉じる" }, lang)}
            </Button>
          </div>

          <div className="flash-drawer-grid">
            <label className="flash-check-row" htmlFor="flash-enable-checkbox">
              <Checkbox
                id="flash-enable-checkbox"
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  onChange({ ...config, enabled: Boolean(checked) })
                }
              >
                <CheckboxIndicator>
                  <CheckIcon />
                </CheckboxIndicator>
              </Checkbox>
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

            <label className="flash-check-row" htmlFor="flash-freetext-only-checkbox">
              <Checkbox
                id="flash-freetext-only-checkbox"
                checked={config.freeTextOnly}
                onCheckedChange={(checked) =>
                  onChange({ ...config, freeTextOnly: Boolean(checked) })
                }
              >
                <CheckboxIndicator>
                  <CheckIcon />
                </CheckboxIndicator>
              </Checkbox>
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
              <Select<FlashTransportMode>
                items={TRANSPORT_ITEMS}
                value={config.mode}
                onValueChange={(next) => {
                  if (next) onChange({ ...config, mode: next });
                }}
              >
                <SelectLabel>
                  {tl({ zh: "传输模式:", en: "Transport:", ja: "接続モード:" }, lang)}
                </SelectLabel>
                <SelectTrigger id="flash-mode-select" className="ctrl-select">
                  <SelectValue />
                  <ChevronDownIcon />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value} label={item.label}>
                      {item.label}
                      <SelectItemIndicator>
                        <CheckIcon />
                      </SelectItemIndicator>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {config.mode === "server_proxy" ? (
                <Button
                  className="ctrl-btn amber"
                  pendingAnnouncement="Checking endpoint"
                  onClick={checkServerProxy}
                >
                  {tl(
                    { zh: "检测服务端状态", en: "Check /api/rephrase", ja: "サーバー状態確認" },
                    lang
                  )}
                </Button>
              ) : null}
            </div>

            {config.mode === "custom_endpoint" ? (
              <div className="flash-custom-grid">
                <Field>
                  <FieldLabel>Endpoint URL</FieldLabel>
                  <InputGroup className="ask-input-group">
                    <Input
                      id="flash-endpoint-input"
                      type="text"
                      className="ask-input"
                      placeholder="Endpoint URL (e.g. https://ai-gateway.vercel.sh/v1/chat/completions)"
                      value={config.endpointUrl}
                      onValueChange={(endpointUrl) => onChange({ ...config, endpointUrl })}
                    />
                    <InputClear aria-label="Clear endpoint URL">
                      <ClearIcon />
                    </InputClear>
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel>Model</FieldLabel>
                  <InputGroup className="ask-input-group">
                    <Input
                      id="flash-model-input"
                      type="text"
                      className="ask-input"
                      placeholder="Model (e.g. google/gemini-3.8-flash)"
                      value={config.model}
                      onValueChange={(model) => onChange({ ...config, model })}
                    />
                    <InputClear aria-label="Clear model">
                      <ClearIcon />
                    </InputClear>
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel>API Key (memory only)</FieldLabel>
                  <PasswordInput
                    data-agent-secret=""
                    value={config.apiKey}
                    autoComplete="off"
                    onValueChange={(apiKey) => onChange({ ...config, apiKey })}
                  >
                    <PasswordInputControl
                      id="flash-apikey-input"
                      placeholder="API Key (optional for local gateway, held in memory only)"
                    />
                    <PasswordInputToggle
                      aria-label={tl(
                        { zh: "显示/隐藏密钥", en: "Show or hide API key", ja: "APIキーを表示" },
                        lang
                      )}
                    />
                  </PasswordInput>
                </Field>
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
      </CollapsiblePanel>
    </Collapsible>
  );
}
