# Project Handoff — `Quarantine Gate 0: 2036`（零号隔离窗）

- **最后更新时间**：`2026-11-17`
- **游戏独立仓库**：`https://github.com/evanzhousy/interactive-video-game`（主分支 `main`）
- **上游人格引擎仓库**：`https://github.com/evanzhousy/ordamor`（`schemaVersion: 6`，当前保持干净未改动）
- **在线生产地址（Vercel · 含 `/api/rephrase` 自由提问改写）**：`https://quarantine-gate-0.vercel.app`
- **在线静态镜像（GitHub Pages · 已跨域直连 Vercel 改写接口）**：`https://evanzhousy.github.io/interactive-video-game/`
- **一键 Colab AI 视频生成工作台**：`https://colab.research.google.com/github/evanzhousy/interactive-video-game/blob/main/notebooks/gate0_ai_video_studio.ipynb`

---

## 1. 当前总体进展（已完成并上线）

项目已完成从“Ordamor 引擎接入验证”到“**5 夜全流程 8 幸存者可通关线上版本 + 28 张 35mm AI 真人实拍关键帧 + 300 条录音棚级三语神经语音包 + Vercel 云端免配 Key 自由提问改写 + Tauri v2 Steam 三端打包管线**”的闭环落地，所有测试（7 个测试文件 / 21 项断言）与线上 CI / Pages / Vercel 构建全部绿灯通过。

### 1.1 Ordamor `schemaVersion: 6` 核心引擎与五夜战役（100% 完成）
- **上游同步机制**：`src/ordamor/{constants,types,derive,crystal}.ts` 由 `pnpm sync:ordamor`（`scripts/sync-ordamor.ts`）从 `evanzhousy/ordamor/src/persona/` 原样同步，严格遵守 **Ordamor 三条红线**（游戏状态不入 `PersonaProfile`、13 个封闭价值词元不增删、全部档案通过结构不变量校验 `test/ordamor-invariants.test.ts`）。
- **8 名完整幸存者档案（`src/game/visitors/`，支持中/英/日三语）**：
  - **Night 1（基础言行差 `neverWon` + 三步渐进式新手引导）**：`V-01` Elena Vance（急诊分诊外科主任，内置 `OnboardingGuide` 实时高亮引导对比 `neverWon` 与 `[o-01]`）、`V-02` Leo Sato（低温管线学徒）。
  - **Night 2（MindCrystal 价值弧解锁 + 次级冲突 `v-2`）**：`V-03` Arthur Sterling（配给审计官）、`V-04` Marcus Chen（深潜安保指挥官）。
  - **Night 3（极地地磁暴屏蔽光学/热成像传感器 + 反直觉 `own_it` 活人签名）**：`V-05` Ana Ribeiro（饱和潜水焊工，`own_it`）、`V-06` Dr. Ingrid Solberg（认知心理学家）。
  - **Night 4（高阶拟态体 + 处置签名 `sig-1` + Boggart 前提剥夺陷阱 `disposalRequires`）**：`V-07` Dr. Lin Mei（低温生物学家）、`V-08` Hannah Weiss（维生系统技术员）。
- **Night 5 终局自我审计 + 多周目归档**：
  - `src/game/night5.ts` + `src/ui/components/Night5Audit.tsx`：窗外出现 99.98% 面部匹配的 `#09` 替身（带 `<video>` 动态流挂载与专属神经配音），背诵玩家入职 `SAY` 宣言，对比玩家 4 夜真实排班日志 `DO` 结算 **7 大结局**。
  - `src/game/storage.ts` + `src/ui/components/CompendiumModal.tsx`：`localStorage` 跨刷新自动存档续玩（`gate0.shift.v1`）+ **7 结局 / 6 项审讯勋章图鉴**（`gate0.compendium.v1`）+ 桌面端战术快捷键（`1`–`5`、`S`、`T`、`[` / `]`）。

### 1.2 视听资产现状（28 张 35mm 电影帧 + 300 条三语神经语音 + 16 段 720p 真人动态 `.mp4` 已上线，双 Google Drive 资产库已同步）
- **28 张同演员、同机位 35mm AI 真人电影帧（已内置）**：
  - `public/portraits/{elena,leo,arthur,marcus,ana,ingrid,linmei,hannah,operator09}.jpg`（9 张底片）+ `public/portraits/reactions/{slug}_{flinch,lean_in}.jpg`（16 张微表情反应帧）+ `public/portraits/reactions/chamber_{purge,admit,whiteout}.jpg`（3 张实景结局帧）。
- **300 条三语对讲机录音棚级神经语音包（✅ 已全量落盘 `public/audio/{zh,en,ja}/`）**：
  - 覆盖 8 名幸存者全部探针分支（264 条）+ 第 5 夜 `operator09` 替身全部入职宣言镜像变体（36 条），经 `scripts/synthesize-edge-tts.py` 按角色国籍/性别/语速分轨演绎并由 `ffmpeg` 统一母带处理（`300–3500Hz` 对讲滤波 + `-16 LUFS` 响度对齐，`24kHz 48kbps` 共 `16 MB`）。
  - `src/game/audio.ts` 已同步加入可选的 **`-46°C` 极地超低频暴风雪底噪 + 潜艇/前哨站金属舱壁热胀冷缩应力呻吟声**（顶部栏 `🌨️ AMB: ON/OFF` 独立开关）。
- **零 API 扣费的 Google AI Studio 网页端动态视频渲染器（`scripts/render-aistudio-web.mjs`）与 16 段 `1280×720` `.mp4` 已上线（全战役 100% 启用 `CAM-01 // LIVE I2V STREAM`）**：
  - 通过 `ego-browser` 驱动 `public@tfsharedspace.com` 账号下的 AI Studio 网页版 `Gemini Omni 1.2 Flash` + `Gemini Omni 1.1 Flash` 自动梯队（强制校验 `"No API key selected"` 确保 `$0` API 额度消耗），已完成 **16 段实机监控 `.mp4`** 渲染并合入 `public/videos/`：
    - **全员 9/9 待机呼吸流（100% 覆盖第 1–5 夜全部角色）**：`{elena,leo,arthur,marcus,ana,ingrid,linmei,hannah,operator09}/idle.mp4`；
    - **第 1 夜全套反应动作（100% 覆盖）**：`elena/{flinch,lean_in}.mp4` + `leo/{flinch,lean_in}.mp4`；
    - **全角色与第 5 夜共享实景处决/放行/暴风雪动态流（100% 覆盖）**：`chamber/{admit,purge,whiteout}.mp4`。
  - **双 Google Drive 云端资产归档已同步**：
    - `public@tfsharedspace.com` 网盘：`quarantine-gate-0-videos`（`1sB2OSIXVflmYK2aJ4MkkKYMv_UeL2c9l`）与 `quarantine-gate-0-assets`（`1Jld4N9lhQO9HEp5hLRNuiZdmm26oMeLg`）；
    - `evanzhousyforward@gmail.com` 网盘（5 TB 存储）：`My Drive/quarantine-gate-0-assets/`（`https://drive.google.com/drive/u/1/folders/1LMtTlhmflgoIHmaQmG3JvFsw_D6BKUNT`）。

### 1.3 在线 Flash 自由提问改写与三端发行管线（✅ 已全部打通）
- **Vercel 生产部署与 GitHub Pages 跨域共享**：
  - 已关联 GitHub 仓库并部署至 `https://quarantine-gate-0.vercel.app`（Node 24 Serverless `/api/rephrase` + Vercel OIDC / AI Gateway 支持）。
  - `api/rephrase.ts` 已支持 `OPTIONS` 预检与 `https://evanzhousy.github.io` / Tauri CORS 放行；`src/game/rephrase.ts`（`resolveInitialFlashConfig`）在线上环境默认开启 `⚡ Flash: ON` 并将 GitHub Pages 请求直连至 Vercel 生产网关。
- **Steam 桌面端（Tauri v2）跨平台打包**：
  - `tauri/` 已补齐完整 Rust 工程（`Cargo.toml`、`build.rs`、`src/main.rs`、`capabilities/default.json`、全尺寸 `.icns`/`.ico`/`.png` 图标），并配置 `.github/workflows/tauri-release.yml` 支持一键产出 macOS Universal `.dmg`、Windows `.exe`/`.msi` 与 Linux / Steam Deck `.AppImage`。

---

## 2. 下一步待办事项（Next Steps 优先级清单）

### Priority 1（可选增量）：AI Studio 每日免费网页配额刷新后补齐 `V-03`~`V-08` 的 12 段 `flinch` / `lean_in` 动态反应流
目前第 1–5 夜全体 9 名角色的 `idle.mp4` 待机流、第 1 夜全套反应流及全员 `admit`/`purge`/`whiteout` 结局流均已上线（`V-03`~`V-08` 在提问瞬间自动平滑叠化 35mm 同演员微表情关键帧）。待太平洋时间午夜 AI Studio 网页端每日免费额度重置后，直接运行：
```bash
ego-browser nodejs < scripts/render-aistudio-web.mjs
```
脚本会自动跳过已落盘的 16 段视频，依次通过 `Gemini Omni 1.2 Flash` -> `Gemini Omni 1.1 Flash`（`$0` API 扣费）一口气补完最后 12 段微表情片段。

### Priority 2：校验或按需配置 Vercel AI Gateway / Gemini 生产密钥
- 仓库已上线 `https://quarantine-gate-0.vercel.app` 并支持 `x-vercel-oidc-token`（Vercel AI Gateway）自动透传；若需固定使用独立 Gemini Key 或自定义网关配额，可在 Vercel 项目后台 `Settings -> Environment Variables` 添加 `GEMINI_API_KEY` 或 `AI_GATEWAY_API_KEY`（未配置或超额时系统 0 阻塞自动回退至预审台词）。

### Priority 3：触发首轮 Tauri v2 Steam Playtest 桌面安装包构建与实机冒烟
- 在 GitHub Actions 页面手动触发 **`Steam Desktop Build (Tauri v2)`**（或推送 `v0.2.0` 标签），下载生成的 Windows `.exe`、macOS `.dmg` 与 Steam Deck `.AppImage` 进行全屏分辨率（`1280×800` / `1440×900`）及离线通关实机验证。

---

## 3. 接手开发速查与工作流约束（Constraints）

1. **不要启动本地常驻开发服务器**：严禁运行常驻 `pnpm dev` / `vite preview`，所有验证以 `pnpm build` 本地静态门禁 + 推送 `main` 触发 **GitHub Pages 与 Vercel 自动部署**为准。
2. **提交前必跑门禁**：
   ```bash
   pnpm build   # 依次执行 tsc --noEmit && vitest run && vite build
   ```
3. **严守 Ordamor 三条红线与零剧透边界**：详见 [`AGENTS.md`](../AGENTS.md)。任何新增幸存者或改动档案必须通过 `test/ordamor-invariants.test.ts`，任何改动自由提问链路必须通过 `test/rephrase.test.ts`。
