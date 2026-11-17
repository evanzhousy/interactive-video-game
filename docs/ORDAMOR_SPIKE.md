# Ordamor 技术验证与 Schema 对齐报告（基于 `evanzhousy/ordamor` 源码与实测）

已完整检视 [`evanzhousy/ordamor`](https://github.com/evanzhousy/ordamor/blob/main/README.md) 仓库（引擎 [`src/persona/`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/types.ts)、5 个现有应用 [`apps/`](https://github.com/evanzhousy/ordamor/blob/main/apps/README.md)、95 份线上模板 `templates/`、14 份非名人档案与 6 组预注册对照实验 `eval/`）。

好消息是：**上一轮审核担心的所有未知项（P0-4），仓库里已经跑过严格的预注册对照实验，有现成的硬数据。** 更重要的是，源码里藏着三个可以直接放进客户端、零延迟、零成本运行的确定性模块，以及一个能直接升级 Night 4 玩法的原语（`disposalRequires`）。

---

## 一、W1 硬闸门验证结果（全部有实测数据）

| 验证项 | 实测数据（来自 `ordamor/eval/` 与源码） | 结论 | 对《Gate 0》架构的决定 |
| :--- | :--- | :--- | :--- |
| **1. 实时单句延迟** | `create` 平均 **9.4 分钟**（[`RESULTS-2.md`](https://github.com/evanzhousy/ordamor/blob/main/eval/bare-audit-control/RESULTS-2.md#L76-L80)）或 **170–488 秒**（[`affinity/README.md`](https://github.com/evanzhousy/ordamor/blob/main/apps/affinity/README.md#L197)）；`audit` 平均 **2.9 分钟 / 次**；默认超时 `240s`（[`README.md`](https://github.com/evanzhousy/ordamor/blob/main/README.md#L46)）。[`app-design.md`](https://github.com/evanzhousy/ordamor/blob/main/wiki/product/persona-profiling/app-design.md#L20) 明确写明：*“没有任何配置能让它逐句出结果”*。 | ❌ **绝不能在玩家每次提问时调引擎** | 引擎 `create / audit / simulate` **只在开发期离线运行**（生产角色档案与校验台词库）；运行时用纯前端确定性函数 |
| **2. 单句出戏/立场校验准确率** | [`bare-audit-control/RESULTS-2.md`](https://github.com/evanzhousy/ordamor/blob/main/eval/bare-audit-control/RESULTS-2.md#L15-L24)（12 个模型不认识的新人物，84 次审计）：引擎 `inversion` 误报 **0/36**，但检出仅 **18/48**（平衡准确率 **0.688**），细微漂移检出 **12/36**；直接问裸模型平衡准确率 **0.899**，细微检出 **33/36**，且标「出戏」时两轮合计 **0/48 误报**，耗时仅 1/4。 | ⚠️ **在线单句校验不要走引擎 `audit`** | 原因已查明：引擎纪律要求“不确定就标 `boundary`”，把看见的出戏也降级了。开发期先用引擎建档（零改动锚定 `v-N`/`sig-N`），再用轻量结构化判卷做台词筛查 |
| **3. 角色卡扮演稳定性与模型选型** | [`card-durability-control-2/RESULTS.md`](https://github.com/evanzhousy/ordamor/blob/main/eval/card-durability-control-2/RESULTS.md#L11-L24)：① `gemini-3.8-flash` 480 轮仅 **10 条出戏（97.9% 在戏内）**，远稳于 Haiku（10.6% 出戏）；② 引擎卡缺「日常细节与原话口吻」；③ 在「惯用退路前提不成立」的轮次，弱模型会**硬套旧借口**（Haiku 仅 25/48 通过，Flash 41/48）。 | ✅ **在线改写层首选 Flash 级模型**，且角色数据必须补齐口吻（`voice`）与日常细节 | 同时启发了第 4 夜的高阶玩法：**拆掉退路前提（见第三节）** |
| **4. 多语种能力** | [`src/persona/agent.ts`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/agent.ts#L61) 第 9 条纪律写死 `全部输出使用中文`。 | ⚠️ **引擎本体是中文单语** | 开发期用中文在引擎内完成 8 名角色建档，再将结构化字段与预生成台词翻译校对为 3 语（Demo）/ 9 语（正式版） |

> [!IMPORTANT]
> **一句话定调**：这组实测彻底证明 v3 把架构反转为**「离线用 Ordamor 生产档案与台词库 + 客户端跑确定性推导 + 在线可选轻量改写」**是唯一正确的工程路线。事实上，`ordamor` 仓库里现有的 `standup`、`boggart`、`loop` 和 `affinity` 示范页也全都采用了**「本地生成提交进仓库，线上只播放、零模型调用」**的模式（见 [`apps/boggart/README.md`](https://github.com/evanzhousy/ordamor/blob/main/apps/boggart/README.md#L48)）。

---

## 二、严格遵守 `apps/README.md` 三条红线与真实 Schema 对齐

[`apps/README.md`](https://github.com/evanzhousy/ordamor/blob/main/apps/README.md#L36-L45) 规定了所有基于 Ordamor 构建的应用不能破的三条红线。此前我们在没看源码时自造了 10 个价值词（`self_pres`、`achieve`、`fame`），**违反了红线 2**，现已全部对齐：

### 1. 封闭价值词表：固定 13 词 × 3 大家族（来自 [`constants.ts`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/constants.ts#L225-L277) 与 [`crystal.ts`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/crystal.ts#L29-L43)）

| 家族（圆盘弧段） | Token（严禁改名） | 官方中文标签 | 官方释义（`VALUE_GLOSS`） |
| :--- | :--- | :--- | :--- |
| **`self` 自我** | `security` | 自保 | 存续（替代旧原型的 `self_pres`） |
| **`self` 自我** | `status` | 名声 | 在他人眼中的位置（替代旧原型的 `fame`） |
| **`self` 自我** | `achievement` | 成就 | 做成，赢（替代旧原型的 `achieve`） |
| **`self` 自我** | `autonomy` | 自主 | 不被他人决定 |
| **`bond` 关系** | `loyalty` | 忠诚 | 对特定的人或群体的义务 |
| **`bond` 关系** | `duty` | 本分 | 所处位置要求的 |
| **`bond` 关系** | `care` | 关怀 | 减少具体的人的痛苦 |
| **`bond` 关系** | `mercy` | 宽宥 | 对已犯错者放手 |
| **`rule` 规则** | `justice` | 追责 | 惩罚，追究 |
| **`rule` 规则** | `fairness` | 公平 | 按同一标准对待 |
| **`rule` 规则** | `truth` | 真相 | 事实本身，哪怕对自己不利 |
| **`rule` 规则** | `principle` | 原则 | 无论位置如何都不做的事 |
| **`rule` 规则** | `order` | 秩序 | 可预期，不失控 |

> 之前第二轮审核指出的 `原则`、`宽宥`、`追责` 不在词表里，是因为我们漏掉了这 3 个官方词；对齐全部 13 个官方词后，V-03 Arthur（`principle`）、V-06 Ingrid（`mercy`）、V-08 Hannah（`justice`）全部原生合法。

### 2. 结构不变量对齐（`schemaVersion: 6`）
我们对仓库全部 **95 份真实模板**跑了统计校验：
- 94/95 份有活跃排序（中位数 **6 条/人**）；91/95 份有处置签名与核心内核；**68/95（71.6%）的人物存在至少一个「挂在嘴上却从未赢过」的价值（`neverWon`）**；122/620 条排序带有已观察到的反转条件 `flipsWhen`。
- 游戏内每名幸存者的档案严格遵守 [`constants.ts`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/constants.ts#L325-L332) 的硬门槛：
  - `MIN_SIGNATURE_INSTANCES = 2`：每条 `sig-N` 至少引用 2 条 `ValueOrdering`（`v-1`, `v-2`），只发生一次的不叫签名。
  - `MIN_CORE_ORDERINGS = 2`：每条 `coreThread` 至少由 2 条排序支撑，写成「他在维持的状态」而非性格形容词，且必填可证伪的 `refutedBy`。
  - `canonicalValuePair`：`pair` 按词表顺序存储，`evidence` 全部指向纯事实观察 `o-N`。

---

## 三、从源码挖出的 3 个零延迟客户端武器（直接进游戏）

这三个模块在 `ordamor` 里本来就是**纯 TypeScript、零外部依赖、零模型调用**，可以直接在浏览器或 Tauri 客户端里毫秒级运行：

### 1. [`src/persona/derive.ts`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/derive.ts#L12-L52) — `justificationGap(profile)` 双向言行差
引擎把言行差拆成了两个正交方向，比我们之前单一的 `say` 标签精准得多：
- **`neverWon`（嘴上常提、从未赢过）**：例如 Elena 嘴上挂着 `fairness / care`，但实际一次都没赢过 → **低阶伪人最爱踩的坑**。
- **`silent`（实际主宰、绝口不提）**：例如 Elena 从不承认 `security`，Marcus 从不承认 `care` → **真人在压力下真正守住的底牌**。

### 2. [`src/persona/crystal.ts`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/crystal.ts#L29-L117) + [`MindCrystal.tsx`](https://github.com/evanzhousy/ordamor/blob/main/apps/persona/web/MindCrystal.tsx) — 心智晶体与 `sharedPairs`
- 圆盘按 `self（自我）`、`bond（关系）`、`rule（规则）` 三个家族分成三段弧线，一眼就能看出一个人整体倒向「保自己」「顾关系」还是「守规则」。
- `sharedPairs(first, second)` 原生支持两份档案同盘叠图对比——正好直接驱动每名访客的**裁决复盘叠图**与 **Night 5 玩家 vs 窗外替身**的终局对比。

### 3. [`apps/boggart/web/escapes.ts`](https://github.com/evanzhousy/ordamor/blob/main/apps/boggart/web/escapes.ts#L34-L63) — Boggart「拆退路前提」升级为 Night 4 高阶审讯机制！
源码里的 [`ValueOrdering.disposalRequires`](https://github.com/evanzhousy/ordamor/blob/main/src/persona/types.ts#L78) 记录了「他惯用的开脱借口需要什么前提才能成立」，而 Boggart 应用的核心算法就是**把 `disposalRequires` 拿走，看他没了退路之后露出什么**。
- 这完美解决了高阶伪人的审讯深度问题：
  - 普通两难问题下，高阶伪人已经学会了宿主的价值选择甚至口头禅。
  - 玩家在 Night 4 构造**「拆前提追问」（Boggart Trap）**——拿走宿主借口成立的前提（例如对 Elena 说：*“自动驾驶潜艇不需要医生，基地也没别人了，只剩你和学徒，谁上？”*；对 Marcus 说：*“没有新兵犯错给你骂，救他纯粹是你自己违规，你还救吗？”*）。
  - **伪人会硬套旧借口**（正如 `card-durability-control-2` 第 23–26 轮实测到的模型硬套现象，在没有病人的前提下仍搬出“为了救全站伤员”），而**真人没了台阶，会直接暴露赤裸内核或触发 `flipsWhen` / `refutedBy`**。

---

## 四、工程落地建议：复用 `ordamor` 还是独立仓库？

看了 [`apps/README.md`](https://github.com/evanzhousy/ordamor/blob/main/apps/README.md#L17-L45) 和 [`apps/affinity/README.md`](https://github.com/evanzhousy/ordamor/blob/main/apps/affinity/README.md#L45-L54) 后，有两个非常干净的工程选项：

1. **方案 A（推荐先做 Demo 验证）：作为 `ordamor` 的第 6 个应用 `apps/gate0/` + Tauri 薄壳打包 Steam**
   - 直接 `import { VALUE_TOKENS, VALUE_LABELS } from "../../../src/persona/constants"`、`crystal.ts`、`derive.ts`、`escapes.ts`，**零代码复制、零词表漂移**，天然遵守三条红线。
   - 玩家侧写照搬 `apps/affinity/web/local.ts` 的成熟隐私架构（纯本机 `localStorage` + 一键删除，服务端零落库）。
   - 既能在 `ordamor.com/app/gate0` 给内测玩家/主播一键试玩，也能用 Tauri v2 直接把同一份前端静态产物打包成 Windows / macOS / Steam Deck 原生客户端上架 Steam。
2. **方案 B（完全独立游戏仓库）**
   - 新建独立仓库 `quarantine-gate-0`，把 `src/persona/{constants,types,derive,crystal}.ts` 与 `apps/boggart/web/escapes.ts` 作为只读子模块或定时同步包引入，离线脚本调 `ordamor` 生成 JSON 角色资产。品牌与商业账目物理隔离最彻底。
