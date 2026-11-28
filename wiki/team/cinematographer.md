# Cinematographer Agent Runbook（摄影师 Agent 作业手册）

本手册规范 `Quarantine Gate 0: 2036`（`零号隔离窗`）在剧情片（EP0 / Stage 1–3）与预告片（Trailer）制作中的**空间调度、机位设计、3D 空间预演（Pre-viz）、关键帧与运镜控制、以及跨镜头连续性审查**标准流程。

---

## 核心铁律（Operating Principles）

1. **空间先行，拒绝纯 Prompt 盲抽**：固定高频场景（斯瓦尔巴停机坪、公共食堂、审讯隔离窗、站内走廊、值班室）必须先在 3D 空间确认 180° 轴线、人物站位、门窗位置与机位焦段，再进入出图与视频生成。
2. **90% 精修首尾帧 + 10% 白膜视频原则**：日常对白、心理博弈与常规推拉摇移镜头，只从 3D 预演导出首尾帧精修为写实图后喂给 `MiniMax-H3 fl2va`；**仅在**复杂穿行、大幅绕拍（如 180° 环绕）或一镜到底高光镜头中，才输出完整白膜/深度预演视频。
3. **零白膜质感污染（Sim-to-Real Guardrail）**：严禁只喂“白膜参考视频 + 人物参考图”裸奔生成成片。无论走 `fl2va` 还是 V2V / R2V 控制流，都**必须使用精修 35mm 写实首帧**锁定光影基调、冷暖色温、皮肤/布料材质与人脸一致性。

---

## 端到端摄影工作流（End-to-End Pipeline）

```mermaid
flowchart LR
    Input["剧本 / 参考片 MP4"] --> S1["阶段 1: 参考片逆向拆解 & Beat 节拍表"]
    S1 --> S2["阶段 2: Three.js 3D 空间预演 (Blocking & Cam POV)"]
    S2 --> Decision{"镜头复杂度判断"}
    Decision -->|"常规镜头 90% (对白 / 推拉摇移)"| PathA["导出首尾白膜图 -> 精修 35mm 写实首尾帧"]
    Decision -->|"复杂运镜 10% (绕拍 / 穿行 / Oner)"| PathB["K 平滑运镜 -> 精修写实首帧 + 白膜/深度视频"]
    PathA --> GenA["MiniMax-H3 fl2va (MiniMaxH3ImageToVideo)"]
    PathB --> GenB["V2V / 运动控制流 (须带写实首帧锚定)"]
    GenA --> Chain["阶段 4: chain_prev 分段接镜 & Cheat Point 擦除转场"]
    GenB --> Chain
    Chain --> QA["阶段 5: 双屏同步审片 + audit-campaign-continuity.py QA Gate"]
```

---

## 阶段一：参考片逆向拆解（Reverse-Engineering & Beat Sheet）

当需要复刻高难度电影运镜节奏（参考 *Disclosure Day* 70.4s Oner 逆向拆解法）时，摄影师 Agent 不应凭感觉手写 `push_in / pan_right` 或机械切分固定 5 秒卡点，而应先对参考实拍 MP4 进行**结构化 Beat 拆解**：

### 1.1 标准 Beat 节拍表 Schema

| 字段 | 说明 | 示例（参考长镜头拆解） |
| :--- | :--- | :--- |
| `Beat ID` | 节拍编号与简短动作命名 | `5. Crane Boom` |
| `时间与时长` | 起止时间戳与持续秒数 / 帧数（24fps） | `00:18.5 – 00:22.5`（4s / 96f） |
| `机位/设备与交接` | 物理摄影机载体与切换方式 | 手持跟拍 → 3.6m 摇臂升起 |
| `焦段与景别` | 估算焦段、画幅比例与景别变化 | 中全景，35mm / 2.39:1 宽银幕 |
| `空间位移` | 演员走位与机位移动距离/角度 | 演员俯身躲避，机位升至 3.6m 俯拍水罐与车队 |
| `Cheat Point 遮挡点` | 用于掩护切镜或设备交接的前景擦除物 | 栅栏立柱 / 车尾箱 / 敞开车门 |
| `对白/音效窗口` | 对应 `dialogue_window` 与环境音提示 | `00:00.45–00:06.80` 喘息与风声 |

### 1.2 逆向拆解的已知局限与复核要求

- 多模态 AI 对参考片的空间大轮廓拆解极快，但常在**局部物理因果与遮挡细节**上出错（例如：摄影机究竟如何贴着障碍物末端滑过形成擦除转场、车门/舱门实拍时的开合状态等）。
- **强制规则**：AI 生成的 Beat 节拍表只是草案，摄影师 Agent **必须将其导入阶段二的 3D 预演场景中做空间还原与物理验证**，确认无穿模和轴线错误后才能锁版进入出图阶段。

---

## 阶段二：3D 空间预演（Three.js Pre-viz & Camera Blocking）

项目仓库 [package.json](file:///Users/evansmacbookpro/Desktop/Projects/interactive-video-game/package.json) 已内置 `three`（`^0.187.0`）依赖。摄影师 Agent 应基于轻量级灰模/白模场景（Greybox）完成机位 Blocking。

### 2.1 轻量白模资产复用规范

- **只需搭一次的场景白模**：按比例放置墙体、门框、隔离玻璃窗、长桌、直升机、栅栏与关键道具（体块即可，无需贴图和精细建模）。
- **低成本 Blocking 原则**：针对 90% 的常规镜头，**无需为人物 K 骨骼动画**，只需在每个 Beat 节点摆好人物站位胶囊体与虚拟摄影机位置即可。

### 2.2 预演视窗与检查模式

参考标准 3D Camera Blocking 模拟器，预演界面应具备以下 5 种检视模式与叠加层：

- **5 种视角模式**：
  1. `Orbit 3D`：上帝视角自由环绕，核对人物、道具与摄影机的三维相对距离。
  2. `Top Map`：正交俯视图，专用于检查 **180° 轴线规则** 与多机位走位交叉。
  3. `Follow Rig`：跟随虚拟摄影机支架运动，检查机位高度变化与空间碰撞。
  4. `Cam POV`：直接切入虚拟摄影机第一视角，预览实际取景构图与摇移透视。
  5. `Director Tour`：按 Beat 时间轴自动巡航播放整场调度。
- **叠加开关与取景器**：
  - 图层开关：`FovCone`（视锥体范围）、`Cam Path`（按 Beat 颜色编码的轨迹样条）、`Actor`（角色轨迹）、`Labels`（距离/时间戳/Cheat Point 标注）。
  - 画中画实时取景框：锁定与成片一致的画幅比例（如 `1344x768` / `16:9` 或 `2.39:1` 变形宽银幕），在任何上帝视角操作时实时看到摄影机实际框选画面。

---

## 阶段三：核心决策矩阵——“只出首尾帧” vs “出完整白膜视频”

摄影师 Agent 在进入渲染前，必须依据本矩阵决定每个镜头采用**路径 A** 还是**路径 B**。

| 对比维度 | 路径 A：只出首尾帧（精修写实后喂 `fl2va`） | 路径 B：完整白膜预演视频（走 V2V / 运动控制流） |
| :--- | :--- | :--- |
| **电影写实感** | **最佳**。模型完全在 35mm 真人影像分布内补间，**零白膜塑料感/CG 贴皮污染**。 | **存在风险**。控制权重过高易带出三维素模质感；权重过低又容易忽略白膜轨迹。 |
| **微表情与口型** | **自然**。有利于 `MiniMax-H3` 自由发挥呼吸、微表情与 `<d>[Mandarin]` 中文口型同步。 | **易僵硬**。若白膜缺少精细面部和肢体表演，帧级绑定会锁死人物的生动感。 |
| **3D 预演成本** | **极低**。只摆机位与站位并截首/尾帧，**不用 K 精细动画**。 | **高**。必须把运镜缓动曲线和人物位移全部 K 顺滑，否则生硬动画会污染成片。 |
| **复杂运镜控制力** | **中等**。5–10 秒推拉摇移与对话极稳；但多障碍物绕拍时模型中间可能“抄近道”。 | **极强**。中间每一帧的路径、绕行方向与遮挡卡点都被严格钉死。 |
| **现有管线兼容性** | **100% 无缝兼容**现有 [render-ep0-minimax-h3.py](file:///Users/evansmacbookpro/Desktop/Projects/interactive-video-game/scripts/render-ep0-minimax-h3.py)（`fl2va` + 原生音频）。 | 需调整 ComfyUI 工作流节点以接入 V2V/Depth 控制，并单独校验音频口型稳定性。 |

### 路径 A：默认主力流（90% 镜头）

- **适用场景**：审讯室对峙、食堂群像对白、走廊推进、单人情绪特写、常规推拉摇移（如 `ep0_sc00a2_*` 系列镜头）。
- **执行步骤**：
  1. 在 3D Pre-viz 中切到 `Cam POV`，截取该镜头**首帧**（及需要锁定终点构图时的**尾帧**）白膜图/深度图。
  2. 结合角色定妆参考图与项目标准 `STYLE` 提示词（`r34l1sm, Facial Realism, unretouched 35mm anamorphic cinema still, ARRI Alexa Mini LF, Kodak Vision3 500T film look, natural matte skin texture...`），垫图精修出**高保真 35mm 写实首尾帧**。
  3. 将写实首帧（`img`）与可选写实尾帧（`last_frame_img`）接入现有 `MiniMax-H3 fl2va` 管线（`minimax_h3_fl2va_pruned_fp8_scaled.safetensors` + `MiniMaxH3ImageToVideo`）。

### 路径 B：高光特殊流（10% 镜头）

- **适用场景**：预告片伪一镜到底（Oner）、大空间穿梭、180° 环绕主角、多障碍物擦肩穿行（必须防止模型中间路径穿模或抄近道）。
- **执行步骤**：
  1. 在 3D Pre-viz 中为摄影机和主体 K 出**平滑且符合真实物理惯性的运动曲线**（严禁生硬匀速直线或抽搐关键帧），导出完整白膜或深度视频。
  2. 同样通过首帧白膜截图，先精修出**高保真 35mm 写实首帧**。
  3. 将**“精修写实首帧 + 完整白膜/深度参考视频 + 人物参考图”**组合送入 V2V / 运动控制工作流。
- **路径 B 的首尾帧判定规则**：
  - **首帧必须保留**：写实首帧负责定调 35mm 胶片质感、冷暖光比（如室外 `-46°C` 冰蓝 vs 室内防爆钠灯暖黄）、服装细节和人脸特征，防止白膜污染画质。
  - **尾帧按需提供**：单镜头硬切（Hard Cut）或自然收尾时**可省略尾帧**（由白膜视频本身锁定终点构图）；仅当下一镜头需要精准接镜或卡死 Cheat Point 遮挡瞬间时，才额外精修尾帧。

---

## 阶段四：跨镜头连续性与 Cheat Point（遮挡转场）规范

### 4.1 `chain_prev` 分段接镜铁律

- 目前 `MiniMax-H3 fl2va` 单段渲染长度通常在 **`141–243` 帧（约 5.9–10.1 秒 @ 24fps）**，连续长戏必须分段生成（例如 [render-ep0-minimax-h3.py](file:///Users/evansmacbookpro/Desktop/Projects/interactive-video-game/scripts/render-ep0-minimax-h3.py) 中的 `a1_02 -> a1_03 -> a1_05 -> a1_06` 接力链）。
- **铁律**：当镜头设置了 `chain_prev` 时，后一段视频的“首帧”**必须直接抽取上一段生成成片的真实最后一帧**，**严禁**重新拿 3D 白膜中间帧再生成一张新首帧去拼接，否则光影色温、人物微表情和衣物褶皱必然跳变。

### 4.2 Cheat Point（遮挡擦除转场）设计

- 借鉴电影长镜头的遮挡技巧（如利用栅栏立柱、车尾箱擦拭过渡），当我们需要跨越 `MiniMax-H3` 的 10 秒时长上限、或在两段异构镜头间制造“伪一镜到底”时，应在 3D Pre-viz 阶段主动设计 **Cheat Point**：
  - 利用前景垂直遮挡物（隔离门框、钢制立柱、铁丝网、走过镜头前的人影、设备箱）在镜头末尾 **0.3–0.5 秒内快速扫过画面形成视觉擦除**。
  - 将“被前景遮挡半屏/全屏的瞬间”作为前镜尾帧与后镜首帧的锚点，AI 补间与剪辑衔接会比纯空镜硬切顺滑得多。

### 4.3 180° 轴线与空间朝向核查

- 所有正反打镜头（如停机坪内外对望 `a1_04` 与 `a1_05`、食堂同桌对切、零号隔离窗审讯员与被检者内外对视）出图前，必须在 3D Pre-viz 的 `Top Map` 模式下核对：
  - 人物视线左右朝向（Look-room）是否符合 180° 轴线；
  - 背景关键地标（如落地的 Mi-26 直升机、食堂圆舷窗、隔离窗编号标牌）是否在反打机位中保持正确的空间左右关系。

---

## 阶段五：审片、QA Gate 与交付 Checklist

### 5.1 双屏同步审片规范

在人工或 Agent 审片时，不应只看静态首尾帧拼图，建议对照参考方法论采用**上下/双屏同步审片**：
- **信息/预演屏**：同步展示当前时间戳所属 Beat ID、`chain_prev` 链接关系、机位与焦段注释、`<d>[Mandarin]` 口型时间窗口（`dialogue_window`）与音轨波形。
- **成片屏**：同步播放合成视频（或 2D 预演版 [build-ep0-pilot.py](file:///Users/evansmacbookpro/Desktop/Projects/interactive-video-game/scripts/build-ep0-pilot.py) / H3 渲染版成片），逐卡核对是否出现“AI 自行抄近道穿模”、口型抢拍、或正反打跳轴。

### 5.2 自动化连续性 QA Gate

每次批量渲染或剪辑合成后，**必须**运行统一连续性检查脚本 [audit-campaign-continuity.py](file:///Users/evansmacbookpro/Desktop/Projects/interactive-video-game/scripts/audit-campaign-continuity.py) 验证以下硬指标：

1. **图谱完整性**：`REEL_ORDER` 与镜头 `reel` 集合完全匹配、Shot ID 唯一、`chain_prev` 引用有效、`IMAGES` 映射合法，且 **0 次同原图回弹（snap-back）**。
2. **媒体规格一致性**：`1280x720` H.264 视频 + `48kHz` 立体声 AAC 音轨、时长吻合，且音频响度满足 `-60 dB < mean_volume < -5 dB`。
3. **视觉首尾帧接触表复核**：逐一检查脚本生成的 `sheet_inter_reel.png` 与 `sheet_intra_part*.png`，对比每一处剪辑点的 `Prev End` 与 `Next Start` 帧。

### 5.3 摄影师 Agent 交付自检清单

- [ ] 复杂场次已完成 3D Pre-viz 摆位，且在 `Top Map` 下确认无 180° 跳轴与背景地标矛盾
- [ ] 每个镜头已明确标注走 **路径 A（90% 精修首尾帧 → `fl2va`）** 还是 **路径 B（10% 精修首帧 + 完整白膜视频 → V2V）**
- [ ] 路径 B 镜头已保留精修 35mm 写实首帧，且 3D 运镜曲线平滑无机械抽搐
- [ ] 所有 `chain_prev` 连续镜头均直接继承前镜成片末帧，未用白膜重绘帧破坏连续性
- [ ] 跨段长镜头已优先设计前景遮挡 **Cheat Point** 辅助自然过渡
- [ ] 已通过 [audit-campaign-continuity.py](file:///Users/evansmacbookpro/Desktop/Projects/interactive-video-game/scripts/audit-campaign-continuity.py) 校验并审阅 `sheet_inter_reel.png` / `sheet_intra_part*.png`
