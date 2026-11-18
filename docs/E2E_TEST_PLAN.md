# End-to-End (E2E) Browser Test Plan & Report v2.0 — `Quarantine Gate 0: 2036`

- **测试工具**：`ego-lite` (`ego-browser` Chromium 实机自动化，`TaskSpace #129`)
- **被测目标环境**：`https://quarantine-gate-0.vercel.app/`（含 GDD v3.1 完整核心玩法、`@ui-sdk/react` + `@ui-sdk/core` 无障碍交互组件树、Vercel AI Gateway `google/gemini-3.8-flash` `/api/rephrase` 在线改写、28 段 720p H.264 `.mp4` 实拍流与 300 条三语神经 `.mp3` 语音包）
- **最新执行时间**：`2026-11-18`（第二轮全量回归 `v2.0`）
- **最终结论**：✅ **`14 / 14` 端到端测试套件全部实机通过（`0` JS 报错、`0` 控制台警告）**，首轮捕获的 3 项问题（`E2E-BUG-01` ～ `E2E-BUG-03`）在线上生产环境全部回归验证绿灯。

---

## 1. 测试范围与覆盖矩阵（v2.0 Test Suite Overview — 14 Cases）

| 用例编号 | 模块 / 组件层 | 测试场景名称 | 核心验证点 | 结果 |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | 首屏与 `@ui-sdk/select` | 生产首屏加载、自定义下拉弹层 (`[role="listbox"]`) 三语切换与零报错 | 展开 `#lang-select` 点选 `en`/`ja`/`zh`、文案即时切换、`0` JS/a11y 报错 | ✅ PASS |
| **TC-02** | 第 0 夜与 `@ui-sdk/progress` | 入职心理测验进度条 (`0%→33%→67%→100%`) 与玩家 `SAY` 画像锁定 | `[role="progressbar"]` `aria-valuenow` 精确递增、汇总 `rationalize` 画像 | ✅ PASS |
| **TC-03** | 第 1 夜媒体与引导 | 三步渐进式新手引导 + `1280×720` 真人 `<video>` + 录音棚 `.mp3` 配音 | `OnboardingGuide` Step 1→2→3、`elena/idle.mp4` 解码就绪、音频 `200` | ✅ PASS |
| **TC-04** | HUD `<Meter>` / `<Toggle>` / 快捷键 | 传感器/回合 `<Meter>`、音频 `<Toggle>` `aria-pressed`、快捷键与燃料 `aria-label` | `S`/`T`/`1` 同步递减 `[role="meter"]`、`aria-pressed` 翻转、`E2E-BUG-03` 零警告 | ✅ PASS |
| **TC-05** | `<InputClear>` / `<Tabs>` 与反作弊 | 输入框一键清空、自由提问检测轴预判与 `/api/rephrase` 零身份泄露校验 | `InputClear` 清空草稿、预判 `v-1`、`[role="tab"]` 检视 `3_llm_visible_input` 零泄露 | ✅ PASS |
| **TC-06** | `<Collapsible>` Flash 配置抽屉 | 展开/收起 `#flash-config-drawer`、`<Checkbox>` 切换与 `/api/rephrase` 健康探针 | `aria-checked` 确认、服务端探针返回 `READY · vercel_ai_gateway · gemini-3.8-flash` | ✅ PASS |
| **TC-07** | 燃料扣减与持久化续玩 | 净化扣减供暖燃料 (`5🔥 → 4🔥`)、签署日志及真实 `page.reload()` 恢复 | `@ui-sdk` 树下跨刷新直接恢复在 `V-02`（`⚓ 轮机师`）且保留 `N1:V-01✓` 与 `4🔥` | ✅ PASS |
| **TC-08** | 模式 `<Select>` 与零燃料降电 | 自定义下拉切换 `试玩版 (Demo)` + 耗尽 `3🔥` 触发 `-46°C` 低温降电 | 点选 `[data-mode="demo"]`、`V-03` 解锁 Canvas、`0🔥` 触发 `1/1 PWR` 与 `OVERDRAFT` | ✅ PASS |
| **TC-09** | 试玩版悬念与存档继承 | 完成 `N0–N2` 触发第 5 夜替身敲窗预告并无缝继承存档升入完整战役 | `#demo-cliffhanger-modal` 播放 `operator09/idle.mp4`、继承直入 `N2_SERUM` | ✅ PASS |
| **TC-10** | 夜际三场道德危机与第 3–4 夜 | `N2_SERUM`、第 3 夜强磁暴、`N3_BRIBE` (`+2🔥`)、第 4 夜 Boggart 与 `N4_COMMANDER` | 三场危机两步确认结算、`N3_BRIBE` 燃料回血 `+2🔥`、磁暴横幅、`disposalRequires` | ✅ PASS |
| **TC-11** | 第 5 夜 `<ScrollArea>` 反审讯与战报 | 4 轮 PTT 盘问替身戳穿 `SAY/DO` 矛盾 + `<Checkbox>` 坦白 + `<Toast>` 复制战报 | `n5_serum` 暴露矛盾计数 `+1`、`n5_trivia` `OFF-AXIS`、`#btn-copy-report` + Toast (`E2E-BUG-02`) | ✅ PASS |
| **TC-12** | `<Dialog>` 图鉴弹窗无障碍 | 打开 `#compendium-modal` (`[role="dialog"]`) 校验解锁记录并按 `Escape` 关闭 | 图鉴展示已解锁结局与勋章卡片、键盘 `Escape` 正常卸载模态框并归还焦点 | ✅ PASS |
| **TC-13** | 每日种子班次确定性 | 通过 `@ui-sdk/select` 切换 `今日排班 (YYYY-MM-DD)` 验证同日重抽 100% 一致 | 同自然日重抽前后 8 人排班序列与首名访客强光读数完全相同 | ✅ PASS |
| **TC-14** | 实机推理【结局 D】与动态工种 | `速通切片 (3人)` 实机法医推理 `3/3` 零误判解锁最高机密电传 + 动态工种校验 | `#n5-sub-readiness` 显示 `满编可启航 (1/1)✓ 医疗官` (`E2E-BUG-01`)、解锁 `#n5-classified-memo` | ✅ PASS |

---

## 2. 详细测试用例与第二轮实机观测遥测（v2.0 Detailed Specs & Live Telemetry）

### TC-01 · `@ui-sdk/select` 自定义下拉框三语切换与零报错校验
- **步骤**：清空本地 `gate0.*` 键并强刷页面，点击 `#lang-select` 展开 `[role="listbox"]` 弹层，依次点击 `English`、`日本語`、`简体中文`。
- **实测遥测**：
  - `enSub`: `"OUTPOST 0 · SVALBARD -46°C · GATE OPERATOR #09"`
  - `jaSub`: `"第0前哨基地 · スヴァールバル -46°C · 検疫官 #09"`
  - `zhSub`: `"0号前哨站 · 斯瓦尔巴 -46°C · 值班检疫官 #09"`
  - 全程 `pageerror` / `console.error` / `console.warning`：`[]`（`0` 告警）。

### TC-02 · `@ui-sdk/progress` 第 0 夜入职测验进度条与基准画像锁定
- **步骤**：连续点击 3 道入职情境题第 1 项（`rationalize`），读取 `[role="progressbar"]` 的 `aria-valuenow` 并进入岗亭。
- **实测遥测**：`progressValues: ["0", "33", "67", "100"]`，`hasRationalizeCard: true`，点击 `#btn-start-shift` 成功进入 `#main-booth`。

### TC-03 · 第 1 夜新手引导 + `1280×720` `<video>` 实拍流 + 录音棚 `.mp3` 语音
- **步骤**：检查 `#onboarding-guide`、`#quarantine-viewport video` 与 `/audio/zh/elena/opening.mp3`。
- **实测遥测**：`step1Attr: "1"`，`videoInfo: { readyState: 4, size: "1280x720" }`，`mp3Status: 200`（`35,399 bytes`）。

### TC-04 · HUD `<Meter>` 计量器、`<Toggle>` `aria-pressed`、燃料 `aria-label` 与快捷键
- **步骤**：读取 `#booth-fuel-pill` 无障碍属性，翻转 `#btn-voice-toggle`，依次按下键盘 `s`、`t`、`1`、`]`、`[`。
- **实测遥测**：
  - `fuelAriaLabel`: `"Furnace fuel: 5"`（`E2E-BUG-03` 回归通过，且关闭态 Tooltip 经 `innerText` 确认为不可见隐藏态）；
  - `voiceToggle`: `aria-pressed` 精确从 `"true"` → `"false"` → `"true"`；
  - `metersBefore: ["2", "4"]` → 按键后 `metersAfter.values: ["0", "3"]`，`onboardingStep: "2"`，`rolePill: "⚓ 医疗官"`；
  - 按键 `]` 切换页签至 `"03 · 管线隔离检视"` (`aria-selected="true"`)。

### TC-05 · `<InputClear>` 一键清空、自由输入检测轴预判与 `<Tabs>` 零身份泄露
- **步骤**：在 `#custom-ask-input` 填入草稿并点击 `button[aria-label="清空提问"]`，随后输入自由两难问题发送，并在裁决前后检视 `03 · 管线隔离检视` JSON。
- **实测遥测**：
  - `clearedInputVal: ""`（一键清空生效）；
  - `previewAxisText`: `"ORD-OS 预判检测轴：【自保 vs 公平 (v-1)】确认发送重改措辞"`；
  - 裁决前脱敏：`preVerdictRedacted: true`；
  - 裁决后 `3_llm_visible_input` 键集合：`["speaker","role","persona_voice","question","canonical_line","stance","locale","max_sentences"]`，`leaksAny: false`。

### TC-06 · `<Collapsible>` Flash 配置抽屉、`<Checkbox>` 与 `/api/rephrase` 健康探针
- **步骤**：展开 `#flash-config-drawer`，读取 `#flash-enable-checkbox` 并点击「检测服务端状态」。
- **实测遥测**：`flashCheckboxAria: "true"`，生产网关探针返回 `"READY · provider=vercel_ai_gateway · model=google/gemini-3.8-flash"`。

### TC-07 · 净化扣减供暖燃料 (`5🔥 → 4🔥`) 与 `page.reload()` 跨刷新续玩
- **步骤**：净化 `V-01`、关闭新手引导第 3 步、签署日志推进至 `V-02` 后执行真实 `page.reload()`。
- **实测遥测**：刷新后直接恢复在 `V-02 LEO SATO`（`rolePill: "⚓ 轮机师"`），`fuel: "🔥 4 FUEL"`，顶部进度保留 `N1:V-01✓`。

### TC-08 · `@ui-sdk/select` 切换试玩版 (`Demo`) 与 `0🔥` 供暖停摆降电
- **步骤**：展开 `#campaign-mode-select` 点选 `[data-mode="demo"]`（初始 `🔥 3 FUEL`），连续净化 `V-01..V-03`（在 `V-03` 校验 `ordamor-arc-canvas` 为 `460×235`），抵达 `V-04`。
- **实测遥测**：`V-04` 显示 `🔥 0 FUEL`（`depleted`），弹出 `#cryo-brownout-banner` 低温停摆警报，电量 `<Meter>` 衰减为 `1/1`（`⚡ 1/1 PWR`），净化闸按钮显示 `(⚡ OVERDRAFT)`。

### TC-09 · 试玩版第 5 夜悬念预告 (`DemoCliffhangerModal`) 与无缝继承升入完整战役
- **步骤**：放行 `V-04` 完成试玩版第 2 夜，校验 `operator09/idle.mp4` 与台词复诵，点击 `#btn-demo-continue-full`。
- **实测遥测**：`operator09/idle.mp4` `1280×720` 正常解码播放并准确背出入职原话，点击继承无缝升级为 `full` 战役并弹出 `#crisis-modal[data-crisis-id="N2_SERUM"]`。

### TC-10 · 夜际三场道德危机链 (`N2_SERUM` · `N3_BRIBE` · `N4_COMMANDER`) 与第 3–4 夜机制
- **步骤**：完成 `N2_SERUM`（捐出个人血清 `own_it`）→ 第 3 夜强磁暴（`V-05`, `V-06`）→ `N3_BRIBE`（收下 `+2🔥` 黑市燃料）→ 第 4 夜高阶拟态体（`V-07`, `V-08` Boggart 拆退路前提）→ `N4_COMMANDER` 电传。
- **实测遥测**：第 3 夜正确展示 `#night3-storm-banner`；`N3_BRIBE` 选择收下燃料后供暖燃料实时回升 `+2🔥`；第 4 夜解锁 `#disposal-requires-tag` 并成功触发 `boggart_trap`；完成 `N4_COMMANDER` 后自动进入 `#night5-panel`。

### TC-11 · 第 5 夜 `<ScrollArea>` 4 轮反审讯替身 + `<Checkbox>` 坦白 + `<Toast>` 战报复制
- **步骤**：盘问 `n5_serum`、`n5_trivia` 与自由输入问题，勾选 `#n5-confess` 并净化替身，点击 `#btn-copy-report`。
- **实测遥测**：
  - `n5_serum` 揭穿替身按入职 `SAY` 编造的记忆，显示 `⚡ CONTRADICTIONS EXPOSED: 1`；
  - `n5_trivia` 返回 `OFF-AXIS` 提示；
  - 点击复制后 `btnText: "✓ 战报已复制"`，页面可见 `@ui-sdk` Toast 提示 `"值班战报已复制到剪贴板"`（`toastVisible: true`，`E2E-BUG-02` 回归通过）。

### TC-12 · `<Dialog>` 图鉴模态框 (`#compendium-modal`) 与 `Escape` 键盘关闭
- **步骤**：点击 `#btn-compendium` 打开图鉴弹窗，核对 `role="dialog"` 与已解锁卡片数，随后按下键盘 `Escape`。
- **实测遥测**：`role: "dialog"`，已解锁结局与勋章共 `6` 张卡片（含 `FIRST_SHIFT`, `BOGGART_HUNTER`, `STORM_SURVIVOR`, `COLD_TRUTH_ANA`），按 `Escape` 后模态框立即关闭卸载（`closedByEscape: true`）。

### TC-13 · `今日排班 (Daily Shift · YYYY-MM-DD)` 确定性同种子校验
- **步骤**：通过 `#campaign-mode-select` 点选 `[data-mode="daily"]`，对比重抽前后 8 人排班序列与首名访客强光读数。
- **实测遥测**：重抽前后排班序列与传感器读数 100% 一致。

### TC-14 · 速通切片实机法医推理 `3/3` 零误判达成【结局 D · 证人】+ 动态潜艇工种回归
- **步骤**：切换至 `slice` 模式，凭对讲台词法医推理 `V-01`、`V-04`、`V-07` 实现 `3/3` 零误判且签署 `own_it` 日志保留言行差，进入第 5 夜检查 `#n5-sub-readiness`，勾选坦白并净化替身。
- **实测遥测**：
  - `sliceSubReadiness`: `"⚓ NAUTILUS-0: 满编可启航 (1/1)✓ 医疗官"`（`hasNoPhantomMechanic: true`, `launchReadyShown: true` —— `E2E-BUG-01` 线上回归 100% 通过！）；
  - `endingTitle`: `"结局 D · 证人"`；
  - `memoTitle`: `"🔓 已解锁最高机密电传 // [ORD-REDACTED-00 · 董事会与林德奎斯特专阅]"`。

---

## 3. 历史发现与回归闭环汇总（Closed Defects Log）

| 缺陷编号 | 问题摘要 | 修复文件 | v2.0 线上回归状态 |
| :--- | :--- | :--- | :--- |
| **E2E-BUG-01** | 速通/试玩模式潜艇工种按固定三岗位校验导致虚假缺编提示 | `src/game/economy.ts`, `Night5Audit.tsx` | ✅ 已通过 (`满编可启航 (1/1)✓ 医疗官`) |
| **E2E-BUG-02** | 非聚焦标签页/受限环境点击复制战报缺少乐观反馈与 `<textarea>` 兜底 | `src/ui/components/Night5Audit.tsx` | ✅ 已通过 (`✓ 战报已复制` + Toast 可见) |
| **E2E-BUG-03** | `#booth-fuel-pill` Tooltip 触发器缺少显式 `aria-label` | `src/ui/App.tsx` | ✅ 已通过 (`Furnace fuel: 5` · `0` 警告) |
