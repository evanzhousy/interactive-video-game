# End-to-End (E2E) Browser Test Plan & Report — `Quarantine Gate 0: 2036`

- **测试工具**：`ego-lite` (`ego-browser` Chromium 实机自动化，`TaskSpace #125`)
- **被测目标环境**：`https://quarantine-gate-0.vercel.app/`（Vercel 生产环境，含 `/api/rephrase` Serverless 接口、28 段 720p H.264 `.mp4` 实拍流与 300 条三语神经 `.mp3` 语音包）
- **最新执行时间**：`2026-11-18`
- **最终结论**：✅ **11 / 11 端到端测试套件全部通过（0 控制台报错、0 未捕获异常）**，并在实机回归中捕获并修复了 **3 项隐蔽体验/无障碍瑕疵（`E2E-BUG-01` ～ `E2E-BUG-03`）**。

---

## 1. 测试范围与覆盖矩阵（Test Suite Overview）

本测试计划覆盖 `Quarantine Gate 0: 2036` 从首屏加载、第 0 夜入职测试、第 1–4 夜岗亭审讯、夜际道德危机、燃料与潜艇工种经济、跨刷新存档、4 种排班模式到第 5 夜替身反审讯及多结局图鉴的 **11 组端到端核心场景（TC-01 ～ TC-11）**：

| 用例编号 | 模块 / 阶段 | 测试场景名称 | 核心验证点 | 结果 |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | 首屏与国际化 | 生产环境首屏加载、静态资源健康度与中/英/日三语实时切换 | HTTP 200、0 JS 报错、`zh`/`en`/`ja` 标题与题面即时切换 | ✅ PASS |
| **TC-02** | 第 0 夜 (`Intake`) | 入职心理侧写 3 题问答与玩家基准 `SAY` 画像生成 | 3 题递进、生成 `PlayerCompactProfile`、进入第 1 夜岗亭 | ✅ PASS |
| **TC-03** | 第 1 夜 (`V-01`) | 三步渐进式新手引导 + `1280×720` 真人 `<video>` + 神经 `.mp3` 配音 | `OnboardingGuide` Step 1→2→3、`elena/idle.mp4` 解码就绪、音频 `200` | ✅ PASS |
| **TC-04** | 岗亭硬件交互 | 键盘战术快捷键 (`S`/`T`/`1`–`5`/`[` `]`)、电力扣减与工种徽章 | `S` 强光/`T` 热成像扣电至 `0/2 PWR` 后禁用、页签切换、`⚓ 医疗官` | ✅ PASS |
| **TC-05** | 自由提问与反作弊 | 角色感知自由输入意图预览 + `/api/rephrase` 管线零身份泄露校验 | 预判检测轴提示、`3_llm_visible_input` 严格不含 `isMimic`/`defectMode`/`lineKey` | ✅ PASS |
| **TC-06** | 持久化存档 | 净化扣减供暖燃料 (`-1🔥`)、签署日志及浏览器刷新 (`reload`) 续玩 | `5🔥 → 4🔥`、刷新后直接恢复在 `V-02` 且历史与燃料不丢失 | ✅ PASS |
| **TC-07** | 燃料停摆经济 | 试玩版 (`Demo`) 耗尽全部 `3🔥` 供暖燃料触发 `-46°C` 低温降电 | `0🔥` 弹出 `#cryo-brownout-banner`、传感器上限降至 `1/1 PWR`、`OVERDRAFT` | ✅ PASS |
| **TC-08** | 试玩版悬念与继承 | 完成 `N0–N2` 触发第 5 夜替身敲窗预告并无缝继承存档升入完整战役 | `#demo-cliffhanger-modal` 视频播放、点击继承直入 `N2_SERUM` → `V-05` | ✅ PASS |
| **TC-09** | 夜际危机与第 3–4 夜 | `N2_SERUM`、`N3_BRIBE` (`+2🔥`)、第 3 夜强磁暴、第 4 夜 Boggart 与 `N4_COMMANDER` | 3 场危机弹窗结算、`N3_BRIBE` 燃料回血、磁暴横幅、`disposalRequires` 剥夺 | ✅ PASS |
| **TC-10** | 第 5 夜替身反审讯 | 4 轮 PTT 盘问 `#09` 替身抓获言行矛盾 + 潜艇工种检视 + 复制战报与图鉴 | 盘问戳穿 `SAY/DO` 矛盾计数 `+1`、`n5_trivia` 提示无效轴、战报复制、图鉴解锁 | ✅ PASS |
| **TC-11** | 每日种子与结局 D | `今日排班 (YYYY-MM-DD)` 确定性校验 + 零误判达成【结局 D · 证人】解锁机密电传 | 同日重抽排班一致；实机推理 `3/3` 零误判展示 `#n5-classified-memo` (`[ORD-REDACTED-00]`) | ✅ PASS |

---

## 2. 详细测试用例与实机观测结果（Detailed Specs & Live Telemetry）

### TC-01 · 生产环境首屏加载、静态资源健康度与中/英/日三语实时切换
- **操作步骤**：清空本地游戏存档键后加载 `https://quarantine-gate-0.vercel.app/`，监听 `page.events()`，依次将语言切换为 `en` → `ja` → `zh`。
- **实机观测**：
  - `en`: `"OUTPOST 0 · SVALBARD -46°C · GATE OPERATOR #09"`，题干切换英文（`hasEnPrompt: true`）；
  - `ja`: `"第0前哨基地 · スヴァールバル -46°C · 検疫官 #09"`；
  - `zh`: `"0号前哨站 · 斯瓦尔巴 -46°C · 值班检疫官 #09"`；
  - 浏览器 `pageerror` 与 `console.error` 计数：`0`。

### TC-02 · 第 0 夜入职心理侧写 (`IntakeModal`) 与玩家基准 `SAY` 画像生成
- **操作步骤**：3 题均选择第 1 项（`rationalize` 大局理性止损），点击 `#btn-start-shift`。
- **实机观测**：侧写汇总准确呈现「包装成大局与理性代价」(`hasRationalizeSummary: true`)，点击后立即挂载 `#main-booth` 第 1 夜 `V-01 DR. ELENA VANCE`。

### TC-03 · 第 1 夜渐进式新手引导 + `1280×720` 真人 `<video>` 流 + 神经 `.mp3` 配音
- **操作步骤**：检测 `#onboarding-guide` 步骤属性、`#quarantine-viewport video` 媒体解码参数以及 `/audio/zh/elena/opening.mp3` HTTP 响应。
- **实机观测**：
  - `onboarding-guide`: `data-step="1"`；
  - 视频流：`https://quarantine-gate-0.vercel.app/videos/elena/idle.mp4`，`readyState: 4`，物理分辨率 `1280×720`；
  - 语音流：HTTP `200 OK`（`35,399 bytes`）。

### TC-04 · 桌面端战术快捷键 (`S` / `T` / `1`–`5` / `[` `]`)、传感器扣电与工种徽章
- **操作步骤**：依次在页面发送按键 `s`、`t`、`1`、`]`、`[`。
- **实机观测**：
  - 按 `s`：弹出 `"🔦 强光反射: 365ms [临界偏慢...]"`，电力由 `2/2 PWR` 扣至 `⚡ 1/2 PWR`；
  - 按 `t`：电力扣至 `⚡ 0/2 PWR`，`#btn-strobe` 与 `#btn-thermal` 双双自动置为 `disabled: true`；
  - 按 `1`：剩余提问变为 `TURNS: 3 / 4`，`#onboarding-guide` 自动推进至 `data-step="2"`，档案展示潜艇工种徽章 `⚓ 医疗官`；
  - 按 `]` / `[`：平滑在 `01 · 基准心智卡` ↔ `03 · 管线隔离检视` 之间循环切换。

### TC-05 · 角色感知自由输入提问 + 在线 `/api/rephrase` 管线零剧透校验
- **操作步骤**：输入 `"只剩最后一张床位，你到底救护工还是留给自己自保？"`，检查预判轴提示后确认发送，并在裁决前后检查 `03 · 管线隔离检视` 中的 `3_llm_visible_input`。
- **实机观测**：
  - 预判提示条：`ORD-OS 预判检测轴：【自保 vs 公平 (v-1)】`；
  - 裁决前：`2_stance_engine` 与 `stance` 严格脱敏为 `"[REDACTED UNTIL VERDICT]"`（`redactedBeforeVerdict: true`）；
  - 裁决后解析 `last_turn_pipeline["3_llm_visible_input"]` 键集合为 `["speaker","role","persona_voice","question","canonical_line","stance","locale","max_sentences"]`——`hasIsMimic: false`、`hasDefectMode: false`、`hasLineKey: false`，100% 满足零身份泄露边界。

### TC-06 · 净化扣减供暖燃料 (`-1🔥`)、签署值班日志与跨刷新自动续玩 (`reload`)
- **操作步骤**：在 `V-01` 点击 `#btn-purge`（触发 `onboarding-guide` `data-step="3"` 并关闭），签署日志进入 `V-02`，随后调用真实 `page.reload()`。
- **实机观测**：刷新后直接停留在 `NIGHT 1 // GATE CAM 01 · V-02 LEO SATO`（`⚓ 轮机师`），顶部进度保持 `N1:V-01✓`，燃料保持 `🔥 4 FUEL`。

### TC-07 · 供暖燃料归零 (`0🔥`) 触发 `-46°C` 低温停摆降电 (`1⚡` & `OVERDRAFT`)
- **操作步骤**：切换至 `试玩版 (N0–N2)`（初始 `🔥 3 FUEL`；顺带在 `V-03` 验证第 2 夜解锁 `ordamor-arc-canvas` `460×235`），连续对 `V-01..V-03` 拉闸净化耗光燃料后进入 `V-04`。
- **实机观测**：
  - `#booth-fuel-pill` 变为 `🔥 0 FUEL`（样式 `fuel-pill depleted`）；
  - 弹出冰蓝横幅 `❄️ -46°C 供暖停摆 (0🔥)：备用电容结霜，传感器供电衰减至 1⚡（强行拉闸净化将透支下回合至 0⚡）！`；
  - 传感器上限变为 `⚡ 1/1 PWR`，净化闸按钮显示 `拉下高温净化闸 (PURGE) (⚡ OVERDRAFT)`。

### TC-08 · Steam 试玩版第 5 夜替身敲窗悬念 (`DemoCliffhangerModal`) 与无缝继承存档升入完整战役
- **操作步骤**：在试玩版放行 `V-04` 完成第 2 夜，观测悬念弹窗后点击 `#btn-demo-continue-full`。
- **实机观测**：
  - `#demo-cliffhanger-modal` 正常播放 `https://quarantine-gate-0.vercel.app/videos/operator09/idle.mp4`（`1280×720`），并一字不差背出玩家第 0 夜入职台词 `「当时资源只够保主线任务，这是权衡后的结果。」`；
  - 点击继承后无缝切换至 `full` 模式（补给 `+2🔥` 至 `🔥 2 FUEL`），并直接进入 `#crisis-modal[data-crisis-id="N2_SERUM"]`。

### TC-09 · 夜际真实道德危机事件链 (`N2_SERUM` · `N3_BRIBE` · `N4_COMMANDER`) 与第 3–4 夜高阶机制
- **操作步骤**：依次完成 `N2_SERUM`（捐出个人血清 `own_it`）、第 3 夜磁暴（`V-05`, `V-06`）、`N3_BRIBE`（收下 `+2🔥` 燃料）、第 4 夜高阶拟态体（`V-07`, `V-08` Boggart 拆退路前提）与 `N4_COMMANDER` 基地长电传。
- **实机观测**：
  - 第 3 夜正确显示 `#night3-storm-banner` 强磁暴传感器屏蔽提示；
  - `N3_BRIBE` 选择收下燃料后，供暖燃料实时增加 `+2🔥`；
  - 第 4 夜 `V-07` 解锁 `#disp-box` 及 `disposalRequires: 外部审计与基地长尚未拿到只读原始备份`，完成 `N4_COMMANDER` 后自动切入 `#night5-panel`。

### TC-10 · 第 5 夜终局 4 轮 PTT 对讲反审讯替身 + 潜艇工种检视 + 战报与图鉴归档
- **操作步骤**：在 `#night5-panel` 依次使用预设探针盘问窗外 `#09` 替身的真实底账与工牌密码陷阱，勾选坦白后执行净化，点击复制战报并检查图鉴。
- **实机观测**：
  - 盘问真实记录当场揭穿替身谎言，`#n5-rebuttal-badge` 亮起 `⚡ CONTRADICTIONS EXPOSED: 1`；
  - 盘问工牌识别码触发 `OFF-AXIS` 警告（`hasOffAxisNote: true`）；
  - 点击 `#btn-copy-report` 弹出复制成功 Toast 且按钮文案变为 `✓ 战报已复制`；`gate0.compendium.v1` 持久化记录结局与勋章（`FIRST_SHIFT`, `BOGGART_HUNTER`）。

### TC-11 · `今日排班 (YYYY-MM-DD)` 确定性同种子校验 + 零误判达成【结局 D · 证人】解锁最高机密电传
- **操作步骤**：
  1. 在 `daily` 模式下连续重抽班次，对比排班序列与首名访客强光读数；
  2. 在 `slice` 模式下通过读取对讲回复进行真实法医推理，对 `V-01`、`V-04`、`V-07` 达成 `3/3` 零误判并保留真实言行差，进入第 5 夜勾选 `#n5-confess` 并净化替身。
- **实机观测**：
  - `dailyDeterminism.matches: true`（排班顺序均为 `N1:V-01 N1:V-02 N2:V-03 N2:V-04 N3:V-06 N3:V-05 N4:V-07 N4:V-08`，强光读数完全一致）；
  - `3/3` 零误判成功触发 **`结局 D · 证人`**，并当场解锁 `#n5-classified-memo`：
    - 标题：`🔓 已解锁最高机密电传 // [ORD-REDACTED-00 · 董事会与林德奎斯特专阅]`
    - 正文摘录：`发件时间：疫情爆发前 184 天。「致斯瓦尔巴深海站指挥部：『鹦鹉螺0号』潜艇额定逃生舱位仅够全站 35% 人员……操作员 #09 已被排入第 0 号外闸死守序列……」`

---

## 3. 实机 E2E 发现并修复的问题清单（Issues Found & Fixed During E2E）

| 缺陷编号 | 发现位置 | 实机现象描述 | 根因与修复方案 | 验证状态 |
| :--- | :--- | :--- | :--- | :--- |
| **E2E-BUG-01** | `src/game/economy.ts` & `Night5Audit.tsx` | 在 3 人速通切片 (`slice`: `V-01`,`V-04`,`V-07`) 中，当 `V-01`/`V-07` 均随机为伪人、仅 `V-04`（深潜员）为真人且玩家 `3/3` 零误判救下全部真人时，`#n5-sub-readiness` 仍显示 `✕ 医疗官 ✕ 轮机师` 船员缺编警报。 | 速通模式花名册不含轮机师 (`V-02`/`V-08`)，且原逻辑硬编码要求 `doctor`。已修复为：完整/今日 8 人战役检查全部三大工种，试玩/速通模式动态按本局实际生成的真人核心工种 (`checkedRoles`) 校验与渲染。 | ✅ 已修复并单测/实机复核通过 |
| **E2E-BUG-02** | `src/ui/components/Night5Audit.tsx` | 后台非聚焦标签页或受限 Webview 中点击 `#btn-copy-report` 时，`navigator.clipboard.writeText` 可能被拒绝或延迟导致按钮即时状态未翻转且剪贴板未写入。 | 已改为乐观更新 `copiedReport` 状态，并在 `navigator.clipboard.writeText` 异常时自动回退至隐藏 `<textarea>` `document.execCommand("copy")` 兜底。 | ✅ 已修复并实机复核通过 |
| **E2E-BUG-03** | `src/ui/App.tsx` | `@ui-sdk/react` 的 `<TooltipTrigger>` 包裹非按钮元素 `#booth-fuel-pill` (`<span>`) 时缺少显式无障碍名称，触发 `[ui-sdk] tooltip: The trigger has no accessible name` 警告。 | 为 `#booth-fuel-pill` 补齐 `aria-label="Furnace fuel: N"`，构建与测试 `stderr` 实现 **0 警告**。 | ✅ 已修复并验证零警告 |
