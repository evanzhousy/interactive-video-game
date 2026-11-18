# Project Handoff — `Quarantine Gate 0: 2036`（零号隔离窗）

- **最后更新时间**：`2026-11-18`
- **游戏独立仓库**：`https://github.com/evanzhousy/interactive-video-game`（主分支 `main`）
- **上游人格引擎仓库**：`https://github.com/evanzhousy/ordamor`（`schemaVersion: 6`，当前保持干净未改动）
- **在线生产地址（Vercel · 含 `/api/rephrase` 自由提问改写）**：`https://quarantine-gate-0.vercel.app`
- **在线静态镜像（GitHub Pages · 已跨域直连 Vercel 改写接口）**：`https://evanzhousy.github.io/interactive-video-game/`
- **一键 Colab AI 视频生成工作台**：`https://colab.research.google.com/github/evanzhousy/interactive-video-game/blob/main/notebooks/gate0_ai_video_studio.ipynb`

---

## 1. 当前总体进展（已完成并上线）

项目已完成从“Ordamor 引擎接入验证”到“**5 夜全流程 8 幸存者完整玩法版（含夜际道德危机、供暖燃料与潜艇关键工种经济、第 5 夜 4 轮反审讯替身交互、每日排班与试玩版模式）+ 28 段 720p 真人动态视频 + 300 条录音棚级三语神经语音包 + Vercel 云端自由提问改写 + Tauri v2 Steam 三端打包管线**”的闭环落地，所有测试（7 个测试文件 / 24 项断言）与线上 CI / Pages / Vercel 构建全部绿灯通过。

### 1.1 Ordamor `schemaVersion: 6` 核心引擎与五夜战役（100% 完成）
- **上游同步机制**：`src/ordamor/{constants,types,derive,crystal}.ts` 由 `pnpm sync:ordamor`（`scripts/sync-ordamor.ts`）从 `evanzhousy/ordamor/src/persona/` 原样同步，严格遵守 **Ordamor 三条红线**（游戏状态不入 `PersonaProfile`、13 个封闭价值词元不增删、全部档案通过结构不变量校验 `test/ordamor-invariants.test.ts`）。
- **8 名完整幸存者档案（`src/game/visitors/`，支持中/英/日三语）**：
  - **Night 1（基础言行差 `neverWon` + 三步渐进式新手引导）**：`V-01` Elena Vance（急诊分诊外科主任，内置 `OnboardingGuide` 实时高亮引导对比 `neverWon` 与 `[o-01]`）、`V-02` Leo Sato（低温管线学徒）。
  - **Night 2（MindCrystal 价值弧解锁 + 次级冲突 `v-2`）**：`V-03` Arthur Sterling（配给审计官）、`V-04` Marcus Chen（深潜安保指挥官）。
  - **Night 3（极地地磁暴屏蔽光学/热成像传感器 + 反直觉 `own_it` 活人签名）**：`V-05` Ana Ribeiro（饱和潜水焊工，`own_it`）、`V-06` Dr. Ingrid Solberg（认知心理学家）。
  - **Night 4（高阶拟态体 + 处置签名 `sig-1` + Boggart 前提剥夺陷阱 `disposalRequires`）**：`V-07` Dr. Lin Mei（低温生物学家）、`V-08` Hannah Weiss（维生系统技术员）。
- **夜际道德危机、供暖燃料与潜艇关键工种经济（`src/game/crises.ts` + `src/game/economy.ts` + `src/ui/components/CrisisModal.tsx`）**：
  - **3 场夜际玩家真实 `DO` 危机**：`N2_SERUM`（最后一支低温血清留给自己或打给底舱学徒）、`N3_BRIBE`（副站长霍尔姆塞入 `+2🔥` 黑市高热燃料换取抹除事故日志）、`N4_COMMANDER`（潜艇解缆前基地长追责电传）。
  - **反“全员烧死”双轨经济**：每次 `PURGE` 消耗 `1🔥` 岗亭供暖燃料，燃料归零触发 `-46°C` 低温降电（传感器由 `2⚡` 降至 `1⚡`，强行透支净化降至 `0⚡`）；撤离潜艇「鹦鹉螺0号」追踪存活人类名额与三大核心岗位（**医疗官 / 轮机师 / 深潜员**），随机排班算法保证每局均涵盖关键工种真人。
- **Night 5 终局 4 轮反审讯替身交互 + 多周目模式（`src/game/night5.ts` + `src/ui/components/Night5Audit.tsx`）**：
  - 玩家拥有 **4 轮 PTT 对讲机会**直接盘问防爆窗外的 `#09` 替身（第 2 夜血清、第 3 夜燃料贿赂、开关闸日志签字、以及工牌密码陷阱），当场戳穿替身按入职 `SAY` 编造的记忆漏洞；达成 **结局 D · 证人** 时额外解锁 `[ORD-REDACTED-00]` 斯瓦尔巴最高机密电传，并支持一键复制值班战报卡。
  - 支持 **4 种排班模式**：`完整战役 (8人)`、`今日排班 (YYYY-MM-DD 全球同种子)`、`试玩版 (N0–N2 + 第5夜悬念预告，支持无缝继承存档进入正篇)` 与 `速通切片 (3人)`。
  - `src/game/intent.ts` 已升级角色档案感知型自由输入意图分类（融合 `evidenceCards` 词条、`disposalRequires` 否定检测与 13 价值词元词典）。

### 1.2 视听资产现状（28 张 35mm 电影帧 + 300 条三语神经语音 + 全量 28 段 720p 真人动态 `.mp4` 已满配上线，`public@tfsharedspace.com` 网盘统一归档）
- **28 张同演员、同机位 35mm AI 真人电影帧（已内置）**：
  - `public/portraits/{elena,leo,arthur,marcus,ana,ingrid,linmei,hannah,operator09}.jpg`（9 张底片）+ `public/portraits/reactions/{slug}_{flinch,lean_in}.jpg`（16 张微表情反应帧）+ `public/portraits/reactions/chamber_{purge,admit,whiteout}.jpg`（3 张实景结局帧）。
- **300 条三语对讲机录音棚级神经语音包（✅ 已全量落盘 `public/audio/{zh,en,ja}/`）**：
  - 覆盖 8 名幸存者全部探针分支（264 条）+ 第 5 夜 `operator09` 替身全部入职宣言镜像变体（36 条），经 `scripts/synthesize-edge-tts.py` 按角色国籍/性别/语速分轨演绎并由 `ffmpeg` 统一母带处理（`300–3500Hz` 对讲滤波 + `-16 LUFS` 响度对齐，`24kHz 48kbps` 共 `16 MB`）。
  - `src/game/audio.ts` 已同步加入可选的 **`-46°C` 极地超低频暴风雪底噪 + 潜艇/前哨站金属舱壁热胀冷缩应力呻吟声**（顶部栏 `🌨️ AMB: ON/OFF` 独立开关）。
- **全量 28 段 `1280×720` 真人动态 `.mp4` 已 100% 满配上线（`$0` API 扣费渲染）**：
  - 通过 `scripts/render-aistudio-web.mjs` 驱动 `public@tfsharedspace.com` 账号下的 AI Studio 网页版 `Gemini Omni 1.2 Flash` + `Gemini Omni 1.1 Flash`（强制校验 `"No API key selected"` 确保 `$0` API 额度消耗）：
    - **全员 9/9 待机呼吸流**：`{elena,leo,arthur,marcus,ana,ingrid,linmei,hannah,operator09}/idle.mp4`；
    - **全员 16/16 审讯微表情反应流**：`{elena,leo,arthur,marcus,ana,ingrid,linmei,hannah}/{flinch,lean_in}.mp4`；
    - **全角色与第 5 夜共享实景处决/放行/暴风雪动态流（3/3）**：`chamber/{admit,purge,whiteout}.mp4`。
- **Google Drive 云端资产归档（统一绑定 `public@tfsharedspace.com` · 20 TB）**：
  - `quarantine-gate-0-videos`（ID: `1sB2OSIXVflmYK2aJ4MkkKYMv_UeL2c9l`）：按角色子目录存放全套 `.mp4`，可通过 `pnpm media:pull-drive` 拉回或 `pnpm media:push-drive` 幂等推送更新；
  - `quarantine-gate-0-assets`（ID: `1Jld4N9lhQO9HEp5hLRNuiZdmm26oMeLg`）：存放 `quarantine-gate-0-full-assets.zip` 全量打包备份（视频 + 底片 + 三语配音 + `media-manifest.json`）。

### 1.3 在线 Flash 自由提问改写与三端发行管线（✅ 已全部打通）
- **Vercel 生产部署与 GitHub Pages 跨域共享**：
  - 已关联 GitHub 仓库并部署至 `https://quarantine-gate-0.vercel.app`（Node 24 Serverless `/api/rephrase` + Vercel OIDC / AI Gateway 支持）。
  - `api/rephrase.ts` 已支持 `OPTIONS` 预检与 `https://evanzhousy.github.io` / Tauri CORS 放行；`src/game/rephrase.ts`（`resolveInitialFlashConfig`）在线上环境默认开启 `⚡ Flash: ON` 并将 GitHub Pages 请求直连至 Vercel 生产网关。
- **Steam 桌面端（Tauri v2）跨平台打包**：
  - `tauri/` 已补齐完整 Rust 工程（`Cargo.toml`、`build.rs`、`src/main.rs`、`capabilities/default.json`、全尺寸 `.icns`/`.ico`/`.png` 图标），并配置 `.github/workflows/tauri-release.yml` 支持一键产出 macOS Universal `.dmg`、Windows `.exe`/`.msi` 与 Linux / Steam Deck `.AppImage`。

---

## 2. 下一步待办事项（Next Steps 优先级清单）

### Priority 1：触发首轮 Tauri v2 Steam Playtest 桌面安装包构建与商店物料准备
- 在 GitHub Actions 手动触发 **`Steam Desktop Build (Tauri v2)`**（或推送 `v0.2.0` 标签），下载生成的 Windows `.exe`、macOS `.dmg` 与 Steam Deck `.AppImage` 进行全屏分辨率（`1280×800` / `1440×900`）及离线通关实机验证；
- 录制 60 秒 Steam 预告片 / 制作商店胶囊图（Capsule Art）与 5 张实机截图（可用已有的 HyperFrames 技能管线直接从实拍视频与 UI 合成）。

### Priority 2：校验或按需配置 Vercel AI Gateway / Gemini 生产密钥
- 仓库已上线 `https://quarantine-gate-0.vercel.app` 并支持 `x-vercel-oidc-token`（Vercel AI Gateway）自动透传；若需固定使用独立 Gemini Key 或自定义网关配额，可在 Vercel 项目后台 `Settings -> Environment Variables` 添加 `GEMINI_API_KEY` 或 `AI_GATEWAY_API_KEY`（未配置或超额时系统 0 阻塞自动回退至预审台词）。

---

## 3. 接手开发速查与工作流约束（Constraints）

1. **不要启动本地常驻开发服务器**：严禁运行常驻 `pnpm dev` / `vite preview`，所有验证以 `pnpm build` 本地静态门禁 + 推送 `main` 触发 **GitHub Pages 与 Vercel 自动部署**为准。
2. **提交前必跑门禁**：
   ```bash
   pnpm build   # 依次执行 tsc --noEmit && vitest run && vite build
   ```
3. **严守 Ordamor 三条红线与零剧透边界**：详见 [`AGENTS.md`](../AGENTS.md)。任何新增幸存者或改动档案必须通过 `test/ordamor-invariants.test.ts`，任何改动自由提问链路必须通过 `test/rephrase.test.ts`。
