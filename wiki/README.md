# Quarantine Gate 0 — Engineering Wiki

Internal technical playbooks and operational notes for `Quarantine Gate 0: 2036` (`零号隔离窗`).

## Guides

- [Google Colab Remote MCP & Google Drive Playbook](./colab-mcp-remote-and-gdrive.md) — How we connect Antigravity to Google's managed Colab Remote MCP (`https://colaboratory.googleapis.com/mcp`) via an auto-refreshing local Stdio bridge, manage remote GPU runtimes & HTTP file transfers, and operate multi-account Google Drive (`gdrive` CLI) for idempotent media sync and archival.

## Team Agent Runbooks

- [Cinematographer Agent Runbook](./team/cinematographer.md) — 摄影师 Agent 作业手册：涵盖参考片逆向拆解、Three.js 3D 空间预演（Blocking）、“90% 精修首尾帧 (`fl2va`) + 10% 完整白膜视频”决策矩阵、Cheat Point 遮挡转场与连续性 QA Gate 规范。

## Related Project Docs

- [`docs/GDD.md`](../docs/GDD.md) — Game Design Document & narrative/mechanic architecture
- [`docs/HANDOFF.md`](../docs/HANDOFF.md) — Project status, live URLs, and development constraints
- [`docs/E2E_TEST_PLAN.md`](../docs/E2E_TEST_PLAN.md) — Live Chromium (`ego-lite`) E2E test plan & telemetry
- [`docs/TRAILER_STORYBOARD.md`](../docs/TRAILER_STORYBOARD.md) — Official 60s launch trailer storyboard v2.0
