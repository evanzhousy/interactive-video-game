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
import type { FlashRephraseConfig, FlashTransportMode, Locale } from "../../game/types.js";
import { BoltPowerIcon, CheckIcon, ChevronDownIcon, ClearIcon, LockSealIcon } from "./Icons.js";

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
    label: "ORD-OS Station Relay (Default)"
  },
  {
    value: "custom_endpoint",
    label: "Custom Relay Endpoint (/v1/chat/completions)"
  }
];

export function FlashConfigDrawer({ open, onOpenChange, lang, config, onChange }: Props) {
  const [probeStatus, setProbeStatus] = useState<string | null>(null);

  const checkServerProxy = async () => {
    const targetUrl = "/api/interrogate";
    setProbeStatus(`Checking ${targetUrl}...`);
    try {
      const res = await fetch(targetUrl, { method: "GET" });
      if (!res.ok) {
        setProbeStatus(`HTTP ${res.status} (deploy on Vercel or run pnpm dev with AI_GATEWAY_API_KEY)`);
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
          `UNCONFIGURED (no AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN — deterministic fallback active · target=${data.model ?? "anthropic/claude-sonnet-5.5"})`
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
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--amber-crt)",
                fontWeight: 700
              }}
            >
              <BoltPowerIcon />{" "}
              {tl(
                {
                  zh: "CH-01 实时对讲链路配置",
                  en: "CH-01 LIVE INTERCOM RELAY CONFIG",
                  ja: "CH-01 リアルタイム対話回線設定"
                },
                lang
              )}
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
                    zh: "启用实时动态自由对讲（断网时自动切换本地档案语音）",
                    en: "Enable live dynamic intercom responses (automatic offline fallback)",
                    ja: "リアルタイム動的応答を有効化（オフライン時は自動切替）"
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
                    zh: "仅自由输入调用（预设芯片保持 0ms 响应）",
                    en: "Free-text only (preset probes remain 0ms)",
                    ja: "自由入力のみ使用（定型は0ms維持）"
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
                    { zh: "检测对讲链路", en: "Check Comms Relay", ja: "通信回線を確認" },
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

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.73rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)"
              }}
            >
              <LockSealIcon />
              <span>
                {tl(
                  {
                    zh: "通信加密 // CH-01 仅传输当前频道通话内容，不读取站内隔离底档",
                    en: "ENCRYPTED // CH-01 RELAY ISOLATED FROM QUARANTINE TRUTH RECORDS",
                    ja: "暗号化 // CH-01 回線は隔離機密記録から完全分離されています"
                  },
                  lang
                )}
              </span>
            </div>
          </div>
        </section>
      </CollapsiblePanel>
    </Collapsible>
  );
}
