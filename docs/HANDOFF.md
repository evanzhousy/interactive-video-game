# Project Handoff — `Quarantine Gate 0: 2036`（零号隔离窗）

- **最后更新时间**：`2026-11-17`
- **游戏独立仓库**：`https://github.com/evanzhousy/interactive-video-game`（主分支 `main`）
- **上游人格引擎仓库**：`https://github.com/evanzhousy/ordamor`（`schemaVersion: 6`，当前保持干净未改动）
- **在线试玩地址（GitHub Pages 自动部署）**：`https://evanzhousy.github.io/interactive-video-game/`
- **一键 Colab AI 视频生成工作台**：`https://colab.research.google.com/github/evanzhousy/interactive-video-game/blob/main/notebooks/gate0_ai_video_studio.ipynb`

---

## 1. 当前总体进展（已完成并上线）

项目已完成从“Ordamor 引擎接入验证”到“**5 夜全流程 8 幸存者可通关线上版本 + 28 张 35mm AI 真人实拍关键帧 + I2V 视频与语音量产工具链**”的闭环落地，所有测试（7 个测试文件 / 21 项断言）与线上 CI / Pages 构建全部绿灯通过。

### 1.1 Ordamor `schemaVersion: 6` 核心引擎与五夜战役（100% 完成）
- **上游同步机制**：`src/ordamor/{constants,types,derive,crystal}.ts` 由 `pnpm sync:ordamor`（`scripts/sync-ordamor.ts`）从 `evanzhousy/ordamor/src/persona/` 原样同步，严格遵守 **Ordamor 三条红线**（游戏状态不入 `PersonaProfile`、13 个封闭价值词元不增删、全部档案通过结构不变量校验 `test/ordamor-invariants.test.ts`）。
- **8 名完整幸存者档案（`src/game/visitors/`，支持中/英/日三语）**：
  - **Night 1（基础言行差 `neverWon`）**：`V-01` Elena Vance（急诊分诊护士）、`V-02` Leo Sato（低温管线学徒）。
  - **Night 2（MindCrystal 价值弧解锁 + 次级冲突 `v-2`）**：`V-03` Arthur Sterling（配给审计官）、`V-04` Marcus Chen（深潜安保指挥官）。
  - **Night 3（极地地磁暴屏蔽光学/热成像传感器 + 反直觉 `own_it` 活人签名）**：`V-05` Ana Ribeiro（饱和潜水焊工，`own_it`）、`V-06` Dr. Ingrid Solberg（认知心理学家）。
  - **Night 4（高阶拟态体 + 处置签名 `sig-1` + Boggart 前提剥夺陷阱 `disposalRequires`）**：`V-07` Dr. Lin Mei（P4 病毒学家）、`V-08` Hannah Weiss（深海通讯加密员）。
- **Night 5 终局自我审计 + 多周目归档**：
  - `src/game/night5.ts` + `src/ui/components/Night5Audit.tsx`：窗外出现 99.98% 面部匹配的 `#09` 替身背诵玩家入职 `SAY` 宣言，对比玩家 4 夜真实排班日志 `DO` 结算 **7 大结局**。
  - `src/game/storage.ts` + `src/ui/components/CompendiumModal.tsx`：`localStorage` 跨刷新自动存档续玩（`gate0.shift.v1`）+ **7 结局 / 6 项审讯勋章图鉴**（`gate0.meta.v1`）+ 桌面端战术快捷键（`1`–`5`、`S`、`T`、`[` / `]`）。

### 1.2 35mm AI 真人实拍视觉层与双模视频管线（已完成架构与关键帧，待跑 `.mp4` 资产）
- **明确技术选型**：**放弃 Three.js 3D 人脸建模**（避免心理审讯近景恐怖谷），全面采用 **35mm 胶片级 AI 真人实拍关键帧 + 图生视频（I2V）模型**（对齐 `ordamor` 的 `1280×720 30fps H.264` 实拍路线，配合双层防爆玻璃 + 墙装对讲机实现 **Zero-Lip-Sync 零口型穿帮**）。
- **已内置 28 张同演员、同机位 35mm AI 真人电影帧（零外部密钥即可在线流畅游玩）**：
  - `public/portraits/{elena,leo,arthur,marcus,ana,ingrid,linmei,hannah,operator09}.jpg`：9 张基础防爆窗实拍底片；
  - `public/portraits/reactions/{slug}_{flinch,lean_in}.jpg`：16 张同演员微表情反应帧（戳中矛盾时的惊惧斜视后缩 `flinch`、急切贴窗按手掌自辩 `lean_in`）；
  - `public/portraits/reactions/chamber_{purge,admit,whiteout}.jpg`：3 张同机位实景结局帧（`1,100°C` 波纹钢闸焚化烈焰、绿灯气闸低温蒸汽放行、`-46°C` 极夜暴风雪白盲）。
  - 已修复 React 19 `<StrictMode>` 下 `display: "none"` 导致真人图被隐藏并退化为 2D 简笔剪影的渲染 Bug（`src/ui/components/ViewportCanvas.tsx`、`src/ui/components/Night5Audit.tsx`）。
- **已就绪的 40 段动态 `.mp4` 生成管线（二选一随时运行）**：
  1. **Colab 一键工作台**（`notebooks/gate0_ai_video_studio.ipynb`）：支持 **Google AI Studio (`veo-3.0-generate-001`)** 首尾帧锚定生成，或 **Colab 免费 T4 GPU 开源 `Lightricks/LTX-Video`** 零 API 费用渲染，一键导出至 Google Drive `MyDrive/quarantine-gate-0-videos/`，再由 `pnpm media:pull-drive`（`scripts/pull-gdrive-videos.ts`）自动拉回仓库。
  2. **本地/云端 Node 批处理 CLI**（`scripts/generate-videos.ts` / `pnpm media:videos`）：原生支持 **Google Veo (`GEMINI_API_KEY`)**、**Fal.ai Kling 2.0 / Wan 2.1 (`FAL_KEY`)**、**Runway Gen-4 Turbo (`RUNWAYML_API_SECRET`)**，自动经 `ffmpeg` 归一化为 `1280×720 30fps H.264 +faststart` 静音视频。只要 `public/videos/{slug}/{idle,flinch,lean_in,admit,purge}.mp4` 落盘，前端 `ViewportCanvas` 自动从关键帧叠化升级为连续 `<video>` 动态流（左上角角标切换为 `CAM-01 // LIVE I2V STREAM`）。

### 1.3 零剧透在线 Flash 自由提问改写与部署架构（100% 完成）
- **防剧透改写边界**：`src/game/stance.ts`（`buildRephraseInput`）、`src/game/rephrase.ts`、`src/server/rephrase-handler.ts` 与 `api/rephrase.ts` 在类型层与服务端双重阻断 `isMimic` / `defectMode` / `lineKey`（夹带即返回 HTTP `400`），超时或离线 100% 无缝回退至确定性台词。
- **双平台在线部署（严禁启动本地常驻开发服务器）**：
  - **GitHub Pages**：每次推送到 `main` 由 `.github/workflows/pages.yml` 在约 30 秒内自动构建并发布至 `https://evanzhousy.github.io/interactive-video-game/`；
  - **Vercel**：`vercel.json` + `api/rephrase.ts` 已就绪，支持一键导入启用 `/api/rephrase` 云端免配 Key 自由提问改写。

---

## 2. 下一步待办事项（Next Steps 优先级清单）

接手本项目的开发者或 Agent 请按以下优先级推进：

### Priority 1（最高优）：产出并合入 40 段真实 AI 动态监控视频（`public/videos/{slug}/*.mp4`）
目前 `ViewportCanvas` 已具备自动检测与无缝播放 `<video>` 的能力，仅缺渲染后的 `.mp4` 文件：
1. **推荐先拿 `V-01`（Elena，5 段视频）做首轮样片验证**，确认呼吸幅度、眼神微表情和零口型效果后，再全量跑完 `V-01` ~ `V-08`（共 40 段）：
   - **路径 A（Colab / AI Studio）**：打开 [`notebooks/gate0_ai_video_studio.ipynb`](../notebooks/gate0_ai_video_studio.ipynb)，选 `PROVIDER = 'veo'`（在 Colab Secrets 导入 AI Studio 的 `GEMINI_API_KEY`）或 `PROVIDER = 'ltx_gpu'`（切免费 `T4 GPU`），运行后保存到 Google Drive `MyDrive/quarantine-gate-0-videos/`；随后在 Agent 环境中运行：
     ```bash
     pnpm media:pull-drive
     ```
   - **路径 B（直接用 API Key 在命令行生成）**：提供 `GEMINI_API_KEY`（需开启计费以调用 Veo）、`FAL_KEY` 或 `RUNWAYML_API_SECRET`：
     ```bash
     # 先试跑 V-01 的 5 个片段（带尾帧锚定）
     GEMINI_API_KEY=... pnpm media:videos -- --visitor V-01 --with-end-frame
     # 效果满意后跑完全部 40 个片段
     GEMINI_API_KEY=... pnpm media:videos -- --with-end-frame
     ```
2. **注意仓库体积控制**：单段 4–5 秒 `720p H.264 (CRF 21–23)` 约 `0.8–1.5 MB`，40 段合计约 `40–55 MB`，可直接放入 GitHub Pages（上限 1 GB）或按需编码同目录 `.webm` 以进一步压缩体积。
3. **补充 Night 5 替身动态视频（可选加分项）**：为 `operator09.jpg` 增加一段 `public/videos/operator09/idle.mp4` 并在 `Night5Audit.tsx` 挂载循环 `<video>`。

### Priority 2：预渲染录音棚级三语对讲机语音包（`public/audio/{zh,en,ja}/{slug}/*.mp3`）
目前游戏使用浏览器 Web Speech API + Web Audio 对讲机带通滤波/静电噪点合成语音，不同操作系统自带音色存在差异：
1. 配置 `OPENAI_API_KEY`（或兼容 TTS 端点 `TTS_API_KEY` + `TTS_BASE_URL`），运行：
   ```bash
   # 可先按单语种生成，例如只跑中文语音（88 条）：
   TTS_LOCALE=zh OPENAI_API_KEY=... pnpm media:tts
   # 或全量生成中/英/日共 264 条对讲机语音：
   OPENAI_API_KEY=... pnpm media:tts
   ```
2. 落盘至 `public/audio/{locale}/{slug}/{lineId}.mp3` 后，`src/game/audio.ts`（`speakIntercomLine`）会自动优先加载真人级 `.mp3` 并实时叠加对讲机 PTT 咔哒声与极地电流声。

### Priority 3：接入 Vercel 生产域名以默认开启 `/api/rephrase` 在线自由提问
GitHub Pages 为纯静态托管，玩家若在 GitHub Pages 开启 `⚡ Flash: ON` 需在右上角抽屉填入自定义网关；若部署到 Vercel：
1. 访问 `https://vercel.com/new/clone?repository-url=https://github.com/evanzhousy/interactive-video-game` 导入仓库；
2. 在 Vercel 环境变量中配置 `AI_GATEWAY_API_KEY` 或 `GEMINI_API_KEY`；
3. 如需让 GitHub Pages 前端也共享同一服务端改写接口，可在 `api/rephrase.ts` 增加对 `https://evanzhousy.github.io` 的 CORS 放行头，并将默认端点指向 Vercel 生产 URL。

### Priority 4：试玩体验打磨与 Steam 桌面端（Tauri v2）发行封装
1. **首局引导优化**：在 Night 1 `V-01`（Elena）首次审讯时增加简短的“对讲机审讯教学高亮提示”（提示玩家对比右侧档案的 `justificationGap.neverWon` 与左侧探针回答），降低新玩家上手门槛。
2. **音效氛围增强**：在 `src/game/audio.ts` 中增加可选的极地暴风雪低频环境底噪（`-46°C` 风声循环 + 潜艇金属舱壁微弱应力声）。
3. **Tauri v2 桌面端打包**：基于 `tauri/tauri.conf.json` 增加 GitHub Actions 跨平台打包工作流（Windows `.exe` / macOS `.dmg` / Linux `.AppImage`），为 Steam Playtest Demo 做准备。

---

## 3. 接手开发速查与工作流约束（Constraints）

1. **不要启动本地常驻开发服务器**：用户明确要求**不使用本地预览服务器**，所有验证以 `pnpm build` 本地静态门禁 + 推送 `main` 触发 **GitHub Pages 在线部署**（或 Vercel）为准。
2. **提交前必跑门禁**：
   ```bash
   pnpm build   # 依次执行 tsc --noEmit && vitest run && vite build
   ```
3. **严守 Ordamor 三条红线与零剧透边界**：详见 [`AGENTS.md`](../AGENTS.md)。任何新增幸存者或改动档案必须通过 `test/ordamor-invariants.test.ts`，任何改动自由提问链路必须通过 `test/rephrase.test.ts`。
