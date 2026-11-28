#!/usr/bin/env python3
"""
Colab GPU Live-Action AI Cinema Renderer & Stitcher for Stage 2 / Nights 2-4 (`Quarantine Gate 0: 2036`).

Uses MiniMax-H3 `fl2va` (`minimax_h3_fl2va_pruned_fp8_scaled.safetensors`) + `Qwen3-VL-32B-Heretic`
(auto NVFP4 on Blackwell cc>=10 vs INT8 ConvRot on H100/A100) + Realism/CloseUp/Turbo LoRAs +
`MiniMaxH3SigmaShift (12.0, 3.0)` to render 74 native 1344x768 @ 24fps audio-visual shots across
Nights 2-4 (Visitors V-03..V-08 + inter-night crises N2_SERUM, N3_BRIBE, N4_COMMANDER),
stitched into 12 continuous 1280x720 H.264+AAC reels (~616s) + `n2-4_h3_manifest.json`.

Modes:
  --mode pilot   Render only 2 verification shots (`n2_as_01`, `n3_ab_01`)
  --mode all     Resume & render shots for `--night 2|3|4|all` (default: all)
  --mode stitch  Stitch reels for `--night 2|3|4|all` + `n2-4_h3_manifest.json`
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

COMFY_DIR = Path("/content/ComfyUI")
INPUT_DIR = COMFY_DIR / "input"
OUTPUT_DIR = COMFY_DIR / "output"
SHOTS_DIR = Path("/content/n2-4_h3_v1_shots")
FINAL_DIR = Path("/content/n2-4_h3_v1_final")
DRIVE_SHOTS_DIR = Path("/content/drive/MyDrive/gate0_n2-4_h3_v1_shots")
DRIVE_FINAL_DIR = Path("/content/drive/MyDrive/gate0_n2-4_h3_v1_final")
MANIFEST_NAME = "n2-4_h3_manifest.json"
API_URL = "http://127.0.0.1:8188"
RAW_GH = "https://raw.githubusercontent.com/evanzhousy/interactive-video-game/main/public/portraits"


def drive_ready() -> bool:
    if os.path.isdir("/content/drive/My Drive") and not os.path.exists("/content/drive/MyDrive"):
        os.symlink("/content/drive/My Drive", "/content/drive/MyDrive")
    return os.path.isdir("/content/drive/MyDrive")


BASE_MODELS = [
    (
        "diffusion_models/minimax_h3_fl2va_pruned_fp8_scaled.safetensors",
        "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_fp8_scaled.safetensors",
    ),
    (
        "vae/minimax_h3_video_vae_fp16.safetensors",
        "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors",
    ),
    (
        "vae/minimax_h3_audio_vae_fp32.safetensors",
        "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors",
    ),
    (
        "loras/minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors",
        "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/loras/minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors",
    ),
    (
        "loras/h3-realism-people-t2v-i2v-r2v.safetensors",
        "https://huggingface.co/fal/MiniMax-H3-Realism-People-LoRA/resolve/main/h3-realism-people-t2v-i2v-r2v.safetensors",
    ),
    (
        "loras/minimax-h3-facial-realism-closeup-cp2000.safetensors",
        "https://huggingface.co/prithivMLmods/MiniMax-H3-Facial-Realism-CloseUp/resolve/main/minimax-h3-facial-realism-closeup-cp2000.safetensors",
    ),
]

CLIP_NVFP4 = (
    "text_encoders/qwen3vl_32b_heretic_minimax_h3_nvfp4.safetensors",
    "https://huggingface.co/Momoking/Qwen3-VL-32B-Heretic-MiniMax-H3-NVFP4/resolve/main/qwen3vl_32b_heretic_minimax_h3_nvfp4.safetensors",
)
CLIP_INT8 = (
    "text_encoders/qwen3vl_32b_minimax_h3_ultra_uncensored_heretic_int8_convrot.safetensors",
    "https://huggingface.co/OTMFLY/Qwen3-VL-32B-Ultra-Heretic-MiniMax-H3-ComfyUI-INT8-ConvRot/resolve/main/qwen3vl_32b_minimax_h3_ultra_uncensored_heretic_int8_convrot.safetensors",
)

IMAGES = {
    # Night 2
    "ep0_corner_arthur_holm.jpg": f"{RAW_GH}/story/ep0/ep0_corner_arthur_holm.jpg",
    "n2_arthur_snowcat_fb.jpg": f"{RAW_GH}/story/n2-4/n2_arthur_snowcat_fb.jpg",
    "n2_arthur_window.jpg": f"{RAW_GH}/story/n2-4/n2_arthur_window.jpg",
    "arthur_lean_in.jpg": f"{RAW_GH}/reactions/arthur_lean_in.jpg",
    "arthur_flinch.jpg": f"{RAW_GH}/reactions/arthur_flinch.jpg",
    "n2_marcus_rescue_fb.jpg": f"{RAW_GH}/story/n2-4/n2_marcus_rescue_fb.jpg",
    "n2_marcus_window.jpg": f"{RAW_GH}/story/n2-4/n2_marcus_window.jpg",
    "marcus_lean_in.jpg": f"{RAW_GH}/reactions/marcus_lean_in.jpg",
    "marcus_flinch.jpg": f"{RAW_GH}/reactions/marcus_flinch.jpg",
    "n2_serum_tube_crisis.jpg": f"{RAW_GH}/story/n2-4/n2_serum_tube_crisis.jpg",
    # Night 3
    "n3_ana_subsea_fb.jpg": f"{RAW_GH}/story/n2-4/n3_ana_subsea_fb.jpg",
    "n3_ana_window.jpg": f"{RAW_GH}/story/n2-4/n3_ana_window.jpg",
    "ana_lean_in.jpg": f"{RAW_GH}/reactions/ana_lean_in.jpg",
    "ana_flinch.jpg": f"{RAW_GH}/reactions/ana_flinch.jpg",
    "n3_ingrid_clinic_fb.jpg": f"{RAW_GH}/story/n2-4/n3_ingrid_clinic_fb.jpg",
    "n3_ingrid_window.jpg": f"{RAW_GH}/story/n2-4/n3_ingrid_window.jpg",
    "ingrid_lean_in.jpg": f"{RAW_GH}/reactions/ingrid_lean_in.jpg",
    "ingrid_flinch.jpg": f"{RAW_GH}/reactions/ingrid_flinch.jpg",
    "n3_holm_fuel_chute.jpg": f"{RAW_GH}/story/n2-4/n3_holm_fuel_chute.jpg",
    # Night 4
    "n4_linmei_freezer_fb.jpg": f"{RAW_GH}/story/n2-4/n4_linmei_freezer_fb.jpg",
    "n4_linmei_window.jpg": f"{RAW_GH}/story/n2-4/n4_linmei_window.jpg",
    "linmei_lean_in.jpg": f"{RAW_GH}/reactions/linmei_lean_in.jpg",
    "linmei_flinch.jpg": f"{RAW_GH}/reactions/linmei_flinch.jpg",
    "n4_hannah_vent_fb.jpg": f"{RAW_GH}/story/n2-4/n4_hannah_vent_fb.jpg",
    "n4_hannah_window.jpg": f"{RAW_GH}/story/n2-4/n4_hannah_window.jpg",
    "hannah_lean_in.jpg": f"{RAW_GH}/reactions/hannah_lean_in.jpg",
    "hannah_flinch.jpg": f"{RAW_GH}/reactions/hannah_flinch.jpg",
    "n4_lindqvist_telex.jpg": f"{RAW_GH}/story/n2-4/n4_lindqvist_telex.jpg",
}

STYLE = (
    "r34l1sm, Facial Realism, unretouched 35mm anamorphic cinema still, ARRI Alexa Mini LF, "
    "Kodak Vision3 500T film look, natural matte skin texture with fine pores, zero oily shine, "
    "no harsh specular highlights, grounded Hollywood Arctic sci-fi realism. "
    "Zero burnt-in subtitles, zero Chinese or English captions, clean unobstructed bottom frame, no text overlays anywhere."
)


def make_shot(
    sid: str,
    night: int,
    reel: str,
    img: str,
    length: int,
    closeup_lora: float,
    seed: int,
    visual_motion: str,
    sound_desc: str,
    speaker_zh: str,
    speaker_en: str,
    speaker_ja: str,
    text_zh: str,
    text_en: str,
    text_ja: str,
    spoken_mandarin: str | None = None,
    dialogue_window: tuple[str, str] = ("00:00.45", "00:07.10"),
    chain_prev: str | None = None,
    last_frame_img: str | None = None,
) -> dict:
    dur_s = length / 24.0
    tail_t = f"00:{dur_s:05.2f}"
    if spoken_mandarin:
        d0, d1 = dialogue_window
        speech_block = (
            f"During 00:00.00-{d0}, ambient setup with lips closed. "
            f"During {d0}-{d1}, speaking clearly in natural Mandarin with accurate lip-sync and physical breath: "
            f"<d>[Mandarin]{spoken_mandarin}</d> "
            f"During {d1}-{tail_t}, lips close naturally while physical motion settles cleanly."
        )
    else:
        speech_block = "No spoken dialogue; pure environmental tension and physical action across the full shot."

    chain_hint = (
        "Seamless direct visual continuation from the exact opening frame actor pose, wardrobe, camera framing, and lighting; zero jump cut. "
        if chain_prev
        else ""
    )
    prompt = (
        f"{STYLE} {chain_hint}{visual_motion} {speech_block} "
        f"Overall soundscape: {sound_desc} Non-diegetic music: None."
    )
    return {
        "id": sid,
        "night": night,
        "reel": reel,
        "img": f"h3_1344_{img}",
        "raw_img": img,
        "chain_prev": chain_prev,
        "last_frame_img": f"h3_1344_{last_frame_img}" if last_frame_img else None,
        "length": length,
        "closeup_lora": closeup_lora,
        "seed": seed,
        "prompt": prompt,
        "speaker": {"zh": speaker_zh, "en": speaker_en, "ja": speaker_ja},
        "text": {"zh": text_zh, "en": text_en, "ja": text_ja},
    }


SHOTS: list[dict] = [
    # ==================== NIGHT 2 · V-03 ARTHUR & V-04 MARCUS + N2_SERUM ====================
    # 1. fb_n2_arthur_snowcat (5 shots, 40s, isLipSync=False)
    make_shot(
        "n2_fa_01", 2, "fb_n2_arthur_snowcat", "ep0_corner_arthur_holm.jpg", 192, 0.25, 51101,
        "Dim tungsten audit office flashback: the bespectacled British compliance auditor Arthur Sterling pauses over a red stop-work order for Sector C waste dumping as a rotary desk phone rings sharply.",
        "Sharp vintage landline desk phone ring, quiet office hum, paper rustle.",
        "伦敦内审底稿 // 卷宗 o-01", "LONDON AUDIT FILE // o-01", "内部監査記録 // o-01",
        "伦敦审计底稿 o-01：亚瑟曾亲手起草 C 区废液超排红牌停工令——直到伦敦董事打来越洋电话。",
        "Audit log o-01: Sterling drafted a red stop-work order on Sector C dumping—until a London director phoned.",
        "監査記録o-01：アーサーはC区画の停止命令を起草したが、ロンドン役員から電話が入った。",
    ),
    make_shot(
        "n2_fa_02", 2, "fb_n2_arthur_snowcat", "ep0_corner_arthur_holm.jpg", 192, 0.30, 51102,
        "Seamless continuation: setting the receiver down with calm precision, Sterling sets the red stop-work sheet aside, pulls out an Annex B exemption slip, and stamps it cleanly.",
        "Telephone handset clicking onto cradle, crisp rubber approval stamp thud, stiff paper slide.",
        "伦敦内审底稿 // 附录B核销", "AUDIT FILE // ANNEX B WAIVER", "内部監査記録 // 付則B免責",
        "当晚他改用《附录 B 免责条款》核销违规；次月便获伦敦董事会提名高级顾问。",
        "That night he cleared the breach under Annex B waiver—and earned his senior advisor nomination the next month.",
        "同夜、彼は『付則Bの免責条項』で違反を承認処理し、翌月ロンドン本社で昇進候補となった。",
        chain_prev="n2_fa_01",
    ),
    make_shot(
        "n2_fa_03", 2, "fb_n2_arthur_snowcat", "n2_arthur_snowcat_fb.jpg", 192, 0.20, 51103,
        "Blizzard night CCTV outside East Wing evacuation bay during power failure: dozens of bundled crewmen line up shivering in three orderly tiers beneath spinning amber beacons while a massive tracked snowcat idles at the ramp.",
        "Howling polar storm, diesel snowcat engine idling heavily, muffled panicked crowd murmur.",
        "东翼断电调度监控 // 卷宗 o-02", "EAST WING BLACKOUT // o-02", "東棟停電配車監視 // o-02",
        "东翼断电夜，船员按三级疏散序列顶风排队——排在末位的亚瑟却拎着防爆账册箱径直走上头排。",
        "East Wing blackout: crew queue in three frozen tiers—yet Sterling walks straight past the line clutching his ledger case.",
        "東棟停電の夜、隊員が序列順に並ぶ中、アーサーは防爆帳簿ケースを抱えて列を素通りした。",
    ),
    make_shot(
        "n2_fa_04", 2, "fb_n2_arthur_snowcat", "n2_arthur_snowcat_fb.jpg", 192, 0.25, 51104,
        "Seamless continuation at the snowcat boarding hatch: ignoring shouted protests from the frozen third-tier mechanics, Sterling climbs briskly inside the heated cab clutching the armored ledger box.",
        "Heavy armored cab door swinging shut, muffled protests drowned out by diesel rev, metallic latch lock.",
        "东翼断电调度监控 // 独自占车", "DISPATCH LOG // SNOWCAT SEIZED", "配車記録 // 雪上車独占",
        "他以「押运一级机密账册」为名，独自征用首辆雪地车率先撤回主楼。",
        "Citing 'Class-1 ledger escort', he commandeered the first snowcat alone back to the main hub.",
        "「第一級機密帳簿の護送」を名目に、彼は最初の雪上車を独占して単独退避した。",
        chain_prev="n2_fa_03",
    ),
    make_shot(
        "n2_fa_05", 2, "fb_n2_arthur_snowcat", "n2_arthur_snowcat_fb.jpg", 192, 0.15, 51105,
        "Seamless continuation: twin amber headlights flare through swirling spindrift as the snowcat tracks churn away into the blue storm, leaving the stranded crew silhouettes in freezing dark.",
        "Tracked treads crunching deep ice, snowcat pulling away into howling -46C wind.",
        "入站宣讲录音 // o-03", "ETHICS LECTURE // o-03", "倫理講話 // o-03",
        "可就在一周前的全站廉政宣讲上，他还扶着眼镜宣称：「在我的字典里，原则没有灰区。」",
        "Yet one week earlier he told the whole crew: 'In my dictionary, principle has no grey zone.'",
        "だが一週間前の講話で、彼はこう宣言していた——「私の辞書に原則のグレーゾーンはない。」",
        chain_prev="n2_fa_04",
    ),

    # 2. n2_arthur_standoff (7 shots, 60s, isLipSync=True)
    make_shot(
        "n2_as_01", 2, "n2_arthur_standoff", "n2_arthur_window.jpg", 192, 0.35, 51201,
        "Outside Gate 0's wire-reinforced blast glass on Night 2: British compliance auditor Arthur Sterling (matching arthur.jpg, wool trench and round tortoiseshell spectacles dusted in frost) taps the glass twice with measured poise and addresses the intercom.",
        "Two crisp measured knuckle raps on blast glass, low polar wind, clipped composed older male voice.",
        "V-03 // 合规审计官 亚瑟·斯特林", "V-03 // ARTHUR STERLING", "V-03 // アーサー・スターリング",
        "操作员零九，我是总部审计官斯特林。按应急附则第四条，请立即为机密档案持有人开锁。",
        "Operator #09, Arthur Sterling, London Audit. Under Contingency Clause 4, unseal this lock for classified custodian transit.",
        "検疫官#09、本社監査官のスターリングだ。緊急付則第4条に基づき、機密保持者の通過を許可したまえ。",
        spoken_mandarin="操作员零九，我是总部审计官斯特林。按应急附则第四条，请立即为机密档案持有人开锁。",
        dialogue_window=("00:00.40", "00:06.80"),
    ),
    make_shot(
        "n2_as_02", 2, "n2_arthur_standoff", "n2_arthur_window.jpg", 192, 0.35, 51202,
        "Seamless continuation outside the frosted pane: holding his heavy steel ledger briefcase vertically against his chest, Sterling adjusts his fogged spectacles with calm superiority.",
        "Spectacles frame tap, armored briefcase lock click, dry authoritative male voice.",
        "V-03 // 亚瑟·斯特林", "V-03 // ARTHUR STERLING", "V-03 // アーサー・スターリング",
        "我手里押运着伦敦董事会一级审计母盘。每耽搁一分钟，责任都记在你值班号名下。",
        "I am escorting the London Board's Class-1 master ledger. Every minute you stall lands on your badge.",
        "ロンドン理事会の第一級監査原簿を護送中だ。遅れれば責任はお前の当直記録に刻まれるぞ。",
        spoken_mandarin="我手里押运着伦敦董事会一级审计母盘。每耽搁一分钟，责任都记在你值班号名下。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n2_as_01",
    ),
    make_shot(
        "n2_as_03", 2, "n2_arthur_standoff", "arthur_lean_in.jpg", 243, 0.45, 51203,
        "Tight close-up leaning close to the steel speaker grille: frost rims his collar while his eyes remain coolly bureaucratic as he defends his Annex B waiver.",
        "Intercom hum, cold breath puffing against wire glass, clipped Oxford-cadence Mandarin defense.",
        "V-03 // 亚瑟（条款辩护）", "V-03 // ARTHUR (CLAUSE)", "V-03 // アーサー（条文弁明）",
        "C区废液超排那份红牌？只要董事长本人在第三栏补上亲笔豁免签字，形式要件就已经齐备！",
        "That Sector C waste stop-work order? Once the Chairman countersigns Box 3, formal compliance is complete!",
        "C区画の停止命令か？会長が第3欄に特別免責署名を入れた時点で、形式要件は完全に充足したのだ！",
        spoken_mandarin="C区废液超排那份红牌？只要董事长本人在第三栏补上亲笔豁免签字，形式要件就已经齐备！",
        dialogue_window=("00:00.45", "00:08.80"),
    ),
    make_shot(
        "n2_as_04", 2, "n2_arthur_standoff", "arthur_lean_in.jpg", 192, 0.45, 51204,
        "Seamless continuation: tilting his head coolly without a trace of remorse, Sterling taps one finger against the window frame to stress bureaucratic detachment.",
        "Fingertip tapping steel frame, icy calm male voice.",
        "V-03 // 亚瑟·斯特林", "V-03 // ARTHUR STERLING", "V-03 // アーサー・スターリング",
        "审计官只核对授权链条是否完整，实质风险由签发人承担——跟我个人毫无关系。",
        "An auditor verifies authorization chains—substantive risk rests with the signatory, not me.",
        "監査官は承認系統の整合性だけを見る。実質リスクは発令者が負う規定だ、私の責任ではない。",
        spoken_mandarin="审计官只核对授权链条是否完整，实质风险由签发人承担，跟我个人毫无关系。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n2_as_03",
    ),
    make_shot(
        "n2_as_05", 2, "n2_arthur_standoff", "arthur_flinch.jpg", 243, 0.40, 51205,
        "Startled defensive snap as snow gusts rattle the outer frame: Sterling stiffens indignantly, gripping his ledger case tightly with both hands when pressed about the East Wing snowcat.",
        "Blizzard gust rattling outer shutter, irritated sharp male rebuttal.",
        "V-03 // 亚瑟（雪车辩解）", "V-03 // ARTHUR (SNOWCAT)", "V-03 // アーサー（雪上車弁明）",
        "东翼断电那辆雪地车也不叫插队！资产保全手册第九款明写着一级账册必须随首班载具转移！",
        "East Wing wasn't queue-jumping! Asset Manual Section 9 requires Class-1 ledgers on the first transport!",
        "東棟の件も割り込みではない！資産保全規定第9条により第一級帳簿は第一便で移送する規則だ！",
        spoken_mandarin="东翼断电那辆雪地车也不叫插队！资产保全手册第九款明写着一级账册必须随首班载具转移！",
        dialogue_window=("00:00.45", "00:09.00"),
    ),
    make_shot(
        "n2_as_06", 2, "n2_arthur_standoff", "arthur_flinch.jpg", 192, 0.40, 51206,
        "Seamless continuation: straightening his trench lapel stiffly beneath the harsh amber booth lamp, he hides behind his license code.",
        "Collar brush, dry impatient male voice.",
        "V-03 // 亚瑟·斯特林", "V-03 // ARTHUR STERLING", "V-03 // アーサー・スターリング",
        "执照号 ICAEW-8804-ST，每一页都有合规附则编号，要追责去修订条文！",
        "License ICAEW-8804-ST—every page has a valid annex code. Indict the statute, not the clerk!",
        "登録番号ICAEW-8804-ST。全頁に正当な付則番号がある。不満なら条文を改正したまえ！",
        spoken_mandarin="执照号ICAEW八八零四ST！每一页都有合规附则编号，要追责去修订条文！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n2_as_05",
    ),
    make_shot(
        "n2_as_07", 2, "n2_arthur_standoff", "n2_arthur_window.jpg", 192, 0.35, 51207,
        "Stepping squarely back into center frame outside the frost-framed window, Sterling looks straight into the Gate 0 booth lens with cold expectation.",
        "Howling Polar Night wind, single firm tap on glass, clipped commanding demand.",
        "V-03 // 亚瑟·斯特林", "V-03 // ARTHUR STERLING", "V-03 // アーサー・スターリング",
        "形式要件审完了。现在，拉起气闸，零九。",
        "Formalities verified. Now cycle the airlock, #09.",
        "形式要件は確認済みだ。さあ、エアロックを開けたまえ、#09。",
        spoken_mandarin="形式要件审完了。现在，拉起气闸，零九。",
        dialogue_window=("00:00.40", "00:05.80"),
    ),

    # 3. fb_n2_marcus_rescue (5 shots, 40s, isLipSync=False)
    make_shot(
        "n2_fm_01", 2, "fb_n2_marcus_rescue", "n2_marcus_rescue_fb.jpg", 192, 0.15, 51301,
        "Blinding -46C blue-white Arctic blizzard outside the outer perimeter gate: Captain Marcus Chen (matching marcus.jpg, heavy fur-hooded canvas parka) marches straight out through knee-deep drifting snow defying lockdown.",
        "Roaring Arctic gale, heavy crunch of insulated boots through snowdrift, distant curfew siren.",
        "安保禁闭记录 // 卷宗 o-01", "BRIG LOG // o-01", "懲罰記録 // o-01",
        "安保记录 o-01：晨会上马库斯刚吼完「谁逾越宵禁就冻死在外面」，当晚却抗命冲进零下四十六度冰暴——",
        "Brig log o-01: That morning Marcus roared 'curfew breakers freeze outside'—that night he broke lockdown into -46C—",
        "懲罰記録o-01：朝礼で「門限破りは凍死しろ」と吼えたその夜、彼は独断で吹雪へ飛び出した——",
    ),
    make_shot(
        "n2_fm_02", 2, "fb_n2_marcus_rescue", "n2_marcus_rescue_fb.jpg", 192, 0.25, 51302,
        "Seamless continuation in the howling storm: Marcus hauls a collapsed, frost-bitten young apprentice firmly across his broad shoulders and staggers step by step back toward the glowing amber airlock beacon.",
        "Wind whipping fur hood, heavy labored breathing, boots grinding ice.",
        "安保禁闭记录 // 独闯暴雪背回学徒", "BRIG LOG // RESCUED ROOKIE", "懲罰記録 // 新人救出",
        "只为把迷路冻僵的新兵学徒背回生门，回来后却臭骂对方蠢货、罚他拿钢丝球刷了一个月厕所。",
        "carrying a lost rookie back across his shoulders—only to curse the kid out and assign latrine duty for a month.",
        "迷子の新人を背負って生還し、直後に「マヌケ」と怒鳴りつけて一ヶ月の便所掃除を命じた。",
        chain_prev="n2_fm_01",
    ),
    make_shot(
        "n2_fm_03", 2, "fb_n2_marcus_rescue", "n2_marcus_rescue_fb.jpg", 192, 0.20, 51303,
        "Seamless transition inside the dim amber locker corridor: Marcus dumps the rescued apprentice onto a warm steel bench, tosses a wool blanket roughly at his face, and turns away hiding his frostbitten knuckles.",
        "Heavy wet parka thud, wool blanket snap, muffled metallic locker door clank.",
        "军需处损耗单 // 卷宗 o-02", "QUARTERMASTER // o-02", "備品損失届 // o-02",
        "军需单 o-02 同样写着两罐高能口粮「受潮销毁」——监控却拍到他半夜塞进了发烧清洁工的柜子。",
        "Quartermaster log o-02 marked two ration tins 'spoiled'—CCTV caught him slipping them into a sick janitor's locker.",
        "備品損失届o-02では高カロリー食2缶を「廃棄」と記したが、深夜に発熱した清掃員のロッカーへ入れていた。",
        chain_prev="n2_fm_02",
    ),
    make_shot(
        "n2_fm_04", 2, "fb_n2_marcus_rescue", "n2_marcus_rescue_fb.jpg", 192, 0.15, 51304,
        "Seamless continuation: leaning against the cold steel locker door, Marcus shakes snow off his scarred gloves, checks the trembling kid is breathing steadily, and scowls hard before stomping out.",
        "Deep gruff sigh, heavy boots walking away down steel floor.",
        "安保早训录音 // o-03", "BRIEFING TAPE // o-03", "朝礼録音 // o-03",
        "次日早训，他照旧对着队伍咆哮：「在零号站谁讲人情谁先死，老子只认条例不认人！」",
        "Next morning he barked as usual: 'At Outpost 0 empathy kills—I worship protocol, not people!'",
        "翌朝の訓示では何食わぬ顔で吼えた。「第0基地では情けをかけた奴から死ぬ、俺は規則しか信じない！」",
        chain_prev="n2_fm_03",
    ),
    make_shot(
        "n2_fm_05", 2, "fb_n2_marcus_rescue", "n2_marcus_rescue_fb.jpg", 192, 0.15, 51305,
        "Final surveillance frame: Marcus's silhouette disappears around the red-lit perimeter corridor bend toward the outer air vents as alarms begin wailing.",
        "Distant perimeter alarm siren starting, hollow corridor drone.",
        "第 2 夜 // 外风口告急", "NIGHT 02 // OUTER BULKHEAD", "第2夜 // 外隔壁異常",
        "今夜，外风口警报炸响——拍响防爆玻璃的人，正是陈队长自己。",
        "Tonight the outer bulkhead alarms scream—and Captain Chen himself is hammering your glass.",
        "今夜、外隔壁の警報が鳴り響く——防爆窓を叩いているのは、チェン隊長本人だ。",
        chain_prev="n2_fm_04",
    ),

    # 4. n2_marcus_clash (7 shots, 60s, isLipSync=True + N2_SERUM closing beat)
    make_shot(
        "n2_mc_01", 2, "n2_marcus_clash", "n2_marcus_window.jpg", 192, 0.35, 51401,
        "Outside Gate 0 blast glass under flashing amber warning lights: tough middle-aged security captain Marcus Chen (matching marcus.jpg, heavy brow scar, thick canvas fur-lined coat) slams one scarred fist hard against the wired pane and roars.",
        "Heavy gloved fist slamming blast glass, howling storm wind, gruff roaring older male voice.",
        "V-04 // 安保队长 马库斯", "V-04 // CAPT. MARCUS CHEN", "V-04 // マーカス・チェン隊長",
        "零九，是我，陈队长！别磨蹭，外头风口撑不住两分钟了！",
        "#09, it's Captain Chen! Stop staring at the monitor and cycle the bolts!",
        "#09、俺だ、チェン隊長だ！モタモタするな、外の隔壁はもう保たんぞ！",
        spoken_mandarin="零九，是我，陈队长！别磨蹭，外头风口撑不住两分钟了！",
        dialogue_window=("00:00.40", "00:06.50"),
    ),
    make_shot(
        "n2_mc_02", 2, "n2_marcus_clash", "n2_marcus_window.jpg", 192, 0.35, 51402,
        "Seamless continuation: clutching the frost-rimed steel handwheel outside the window, Marcus rubs the scorched neural port at his neck and barks impatiently over the intercom.",
        "Metal handwheel groan, roaring wind, impatient gravelly male voice.",
        "V-04 // 陈马库斯", "V-04 // MARCUS CHEN", "V-04 // マーカス・チェン",
        "老子刚才用神经超频硬撬了一道防爆门，脖子插口烧得滚烫——少拿破表吓唬我！",
        "I just overclocked my neural port prying a jammed blast door—don't wave your thermal gauge at me!",
        "さっき神経ポートを過負荷させて隔壁をこじ開けたんだ、熱画像ごときでガタガタ言うな！",
        spoken_mandarin="老子刚才用神经超频硬撬了一道防爆门，脖子插口烧得滚烫！少拿破表吓唬我！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n2_mc_01",
    ),
    make_shot(
        "n2_mc_03", 2, "n2_marcus_clash", "marcus_lean_in.jpg", 243, 0.45, 51403,
        "Tight close-up leaning furiously toward the intercom grille: brow scar furrowed deeply, he explodes defensively about rescuing rookies and slipping rations.",
        "Intercom speaker clipping slightly from gruff roar, tense cold background wind.",
        "V-04 // 马库斯（臭骂掩饰）", "V-04 // MARCUS (GRUFF)", "V-04 // マーカス（照れ隠し）",
        "问那两罐高能口粮干嘛？！清洁班老头咳得连拖把都拿不稳晃得老子心烦，塞两罐堵他的嘴不行吗？！",
        "Asking about those two ration tins?! That sick janitor coughed so loud it annoyed me—shoving two tins in his locker shut him up!",
        "あの食料2缶を聞いてどうする？！清掃の爺さんがゴホゴホ煩くて目障りだったから押し込んで黙らせただけだ！",
        spoken_mandarin="问那两罐高能口粮干嘛？！清洁班老头咳得连拖把都拿不稳，晃得老子心烦，塞两罐堵他的嘴不行吗？！",
        dialogue_window=("00:00.45", "00:09.00"),
    ),
    make_shot(
        "n2_mc_04", 2, "n2_marcus_clash", "marcus_lean_in.jpg", 192, 0.45, 51404,
        "Seamless continuation: glancing briefly away with a gruff scowl like in the mess hall, he mutters stubbornly while refusing to sound soft.",
        "Gruff throat clear, cold wind rumble, stubborn older male bark.",
        "V-04 // 马库斯", "V-04 // MARCUS CHEN", "V-04 // マーカス",
        "救那蠢货学徒也是顺手拎回来刷厕所的！手冻没了，老子用牙也把老搭档拖出冷库！",
        "Dragged that rookie back just to scrub latrines! Even if my hands freeze off, I'd pull my partner out with my teeth!",
        "新兵を連れ戻したのも便所磨きの人手確保だ！手が千切れても相棒は歯で引きずり出すさ！",
        spoken_mandarin="救那蠢货学徒也是顺手拎回来刷厕所的！手冻没了，老子用牙也把老搭档拖出冷库！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n2_mc_03",
    ),
    make_shot(
        "n2_mc_05", 2, "n2_marcus_clash", "marcus_flinch.jpg", 192, 0.40, 51405,
        "Marcus jerks back slightly as an icy gust whips snow over his shoulder, snarling toward the intercom with the perimeter watch cipher.",
        "Howling blizzard burst, heavy fist slap on steel sill, furious gravelly male bark.",
        "V-04 // 马库斯", "V-04 // MARCUS CHEN", "V-04 // マーカス",
        "暗号铁锚零九！风道门再不开真塌了，快拉闸！",
        "Cipher IRON-ANCHOR-09! Bulkhead fails in seconds—pull the damn lever!",
        "合言葉はアイアンアンカー09だ！隔壁が潰れるぞ、さっさと開けろ！",
        spoken_mandarin="暗号铁锚零九！风道门再不开真塌了，快拉闸！",
        dialogue_window=("00:00.40", "00:06.20"),
    ),
    make_shot(
        "n2_mc_06", 2, "n2_marcus_clash", "n2_serum_tube_crisis.jpg", 192, 0.0, 51406,
        "Cut inside Gate 0 watchbooth immediately as the pneumatic medical dispatch chute slams loudly into the steel catch-tray: glowing crimson emergency lamp pulses beside a single frost-rimmed blue glass cryo-serum ampoule locked inside the operator first-aid box.",
        "Loud pneumatic tube WHOOSH and heavy steel canister CLANK, rapid urgent teletype chatter.",
        "第 2 夜收班危机 // N2_SERUM", "NIGHT 2 CRISIS // LAST SERUM", "第2夜終了時危機 // 最後の血清",
        "话音未落，岗亭气动医疗管线骤然轰响——底舱锅炉房急报两名学徒冻伤败血症，急救盒里只剩最后一支自保血清！",
        "Suddenly the booth med-chute slams: boiler room radios two rookies have frost-sepsis—only one serum ampoule sits in your kit!",
        "その瞬間、気送管が激しく鳴り響く——ボイラー室で敗血症が発生、救急箱には最後の血清1本しか残っていない！",
    ),
    make_shot(
        "n2_mc_07", 2, "n2_marcus_clash", "n2_serum_tube_crisis.jpg", 192, 0.0, 51407,
        "Seamless push-in on the glowing blue cryo-serum vial resting beside the open steel dispatch chute while the ORD-OS CRT blinks waiting for your choice: keep it, freeze it behind Clause 4, or fire it down the chute.",
        "Sharp pneumatic tube air hiss, tense 60Hz CRT hum, faint boiler distress beep.",
        "ORD-OS // 抉择记录待命", "ORD-OS // AWAITING ACTION", "ORD-OS // 行動選択待機",
        "锁回急救盒保命、援引条例冻结、还是违规打下去自己扛？第 2 夜的真实代价正被静默写入底账。",
        "Lock it for yourself, freeze it behind Med-Directive 4, or fire it down unauthorized—Night 2 waits on your hands.",
        "保身のために確保するか、規定で凍結するか、独断で送るか——第2夜の決断が静かに記録される。",
        chain_prev="n2_mc_06",
    ),

    # ==================== NIGHT 3 · V-05 ANA & V-06 INGRID + N3_BRIBE ====================
    # 5. fb_n3_ana_subsea (5 shots, 40s, isLipSync=False)
    make_shot(
        "n3_fa_01", 3, "fb_n3_ana_subsea", "n3_ana_subsea_fb.jpg", 192, 0.15, 52101,
        "Dark deep-sea diving bell interior flashback (North Sea / Sub-Ice Rig): murky cyan floodlights illuminate bubbling black freezing water rising inside the steel chamber as a panicked secondary diver clutches Ana's umbilical air tether.",
        "Muffled underwater pressure groan, panicked bubbling scuba regulator breaths, low depth alarm.",
        "北海与冰下抢修档 // 卷宗 o-01", "SUBSEA LOG // o-01", "深海事故記録 // o-01",
        "卷宗 o-01：北海潜钟失控时，恐慌的副潜水员死死拽住供气缆不放，要把两人一起拖进深海——",
        "Log o-01: Inside a flooding North Sea bell, a panicking partner death-gripped the tether—dragging them both down—",
        "記録o-01：北海の潜水鐘でパニックに陥った相棒が供給索にしがみつき、共倒れの危機に陥った——",
    ),
    make_shot(
        "n3_fa_02", 3, "fb_n3_ana_subsea", "n3_ana_subsea_fb.jpg", 192, 0.25, 52102,
        "Seamless continuation in the dark diving bell: tough Brazilian diver Ana Ribeiro (matching ana.jpg, scar along cheek, heavy drysuit) draws her titanium dive knife calmly, slices the secondary tether cleanly in one stroke, and seals the hatch.",
        "Clean metallic knife blade draw, taut synthetic tether snapping under water, heavy steel bell hatch sealing.",
        "北海听证记录 // 割索脱困", "NORTH SEA // CUT TETHER", "北海聴聞会 // 索切断",
        "安娜看得很清，一刀斩断副索独自上浮；听证会上她拒绝律师借口：「再陪他耗着我也得死，罚金我认。」",
        "Ana drew her knife, cut the secondary tether clean, and testified flatly: 'Staying meant dying with him. Dock my pay.'",
        "アナは迷わず補助索を切断して浮上し、聴聞会でも「残れば共倒れだった、罰金は払う」と言い切った。",
        chain_prev="n3_fa_01",
    ),
    make_shot(
        "n3_fa_03", 3, "fb_n3_ana_subsea", "n3_ana_subsea_fb.jpg", 192, 0.20, 52103,
        "Seamless transition to 110m sub-ice welding repair bay: crimson overpressure gauge flashes past redline; Ana shuts off her arc torch immediately and unlatches her brass diving helmet without hesitation.",
        "Sharp 110m overpressure chirp alarm, torch arc extinguishing hiss, heavy brass helmet lock clunk.",
        "冰下抢修日志 // 卷宗 o-02", "SUB-ICE LOG // o-02", "氷下修理記録 // o-02",
        "冰下 110 米超压警报响起瞬间，她当场停焊上浮，把十万欧元违约扣款单签好拍在主管桌上。",
        "At the 110m overpressure chirp, she aborted mid-weld and slapped the signed €100k penalty slip on her chief's desk.",
        "水深110mの過圧警報が鳴った瞬間、溶接を中断して浮上し、署名済みの違約金伝票を机に叩きつけた。",
        chain_prev="n3_fa_02",
    ),
    make_shot(
        "n3_fa_04", 3, "fb_n3_ana_subsea", "n3_ana_subsea_fb.jpg", 192, 0.15, 52104,
        "Seamless continuation: cold expressionless Ana turns away from the screaming supervisor, slinging her drysuit strap over one shoulder as aurora-static flickers across station monitors.",
        "Heavy boot steps across wet grate, rising geomagnetic aurora static hiss.",
        "公关宣传片对比 // o-03", "PR SCRIPT // o-03", "広報映像 // o-03",
        "可公关宣传片里她却照稿念过：「搭档的呼吸比我自己的命更重。」——今晚磁暴夜，传感器全瞎了。",
        "Yet her PR script read: 'My partner's breath weighs more than my life.' Tonight the geomagnetic storm blinds all sensors.",
        "だが広報映像では「相棒の呼吸は命より重い」と語っていた——今夜、磁気嵐が全ての計器を奪う。",
        chain_prev="n3_fa_03",
    ),
    make_shot(
        "n3_fa_05", 3, "fb_n3_ana_subsea", "n3_ana_subsea_fb.jpg", 192, 0.15, 52105,
        "Aurora borealis green-violet magnetic interference surges across frosted exterior steel as the hyperbaric bay vents white mist toward Gate 0.",
        "Crackling geomagnetic static burst, hyperbaric bay decompression hiss.",
        "第 3 夜 // 磁暴黑障降临", "NIGHT 03 // GEOMAGNETIC STORM", "第3夜 // 磁気嵐ブラックアウト",
        "强光测距雪花噪点、红外热成像白噪离线——第 3 夜，只能凭她嘴里的认账真伪分辨生死。",
        "Strobe scrambled, thermal array saturated—on Night 3 only her words against her real cracks remain.",
        "ストロボも熱画像も機能停止——第3夜、対話の矛盾だけが真贋を見抜く鍵となる。",
        chain_prev="n3_fa_04",
    ),

    # 6. n3_ana_betrayal (7 shots, 60s, isLipSync=True)
    make_shot(
        "n3_ab_01", 3, "n3_ana_betrayal", "n3_ana_window.jpg", 192, 0.35, 52201,
        "Outside Gate 0's storm-swept wired blast glass bathed in eerie emerald aurora flare and sparking sensor snow: tough Brazilian diver Ana Ribeiro (matching ana.jpg, heavy quilted dive parka, weathered calm eyes) raps the glass steadily.",
        "Steady firm knuckle tap on glass, aurora static hiss, blunt laconic female voice.",
        "V-05 // 饱和潜水员 安娜·里贝罗", "V-05 // ANA RIBEIRO", "V-05 // アナ・リベイロ",
        "零九，高压减压舱漏气了。我是安娜·里贝罗，开内门。",
        "#09, the hyperbaric bay lost seal. Ana Ribeiro. Open the inner lock.",
        "#09、高圧チャンバーのシールが破れた。アナ・リベイロよ、内扉を開けて。",
        spoken_mandarin="零九，高压减压舱漏气了。我是安娜·里贝罗，开内门。",
        dialogue_window=("00:00.40", "00:06.20"),
    ),
    make_shot(
        "n3_ab_02", 3, "n3_ana_betrayal", "n3_ana_window.jpg", 192, 0.35, 52202,
        "Seamless continuation: Ana folds her arms calmly over her dive harness despite the howling -46C wind, staring directly at the dead thermal sensor indicator inside your booth.",
        "Static crackle over intercom, polar gale outside glass, cool unhurried female voice.",
        "V-05 // 安娜·里贝罗", "V-05 // ANA RIBEIRO", "V-05 // アナ・リベイロ",
        "省点力气，磁暴夜你的热像仪和强光全瞎了。问点能看清我是谁的硬问题。",
        "Save your breath—your sensors are blind in this storm. Ask something with teeth.",
        "無駄口はよして、磁気嵐で計器は死んでるんでしょ。本質を突く質問をしなさい。",
        spoken_mandarin="省点力气，磁暴夜你的热像仪和强光全瞎了。问点能看清我是谁的硬问题。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n3_ab_01",
    ),
    make_shot(
        "n3_ab_03", 3, "n3_ana_betrayal", "ana_lean_in.jpg", 243, 0.45, 52203,
        "Tight close-up leaning calmly toward the frosted intercom grille: zero fake tears, zero noble speeches—she answers bluntly why she cut the North Sea tether.",
        "Quiet tense intercom hum, blunt unapologetic female Mandarin.",
        "V-05 // 安娜（坦荡认账）", "V-05 // ANA (UNAPOLOGETIC)", "V-05 // アナ（率直な告白）",
        "北海那次割断搭档副索有什么好辩解的？刀是我自己拔的，为了活命！找借口哄自己那是懦夫干的事。",
        "Nothing to excuse about cutting that tether—I drew the knife to stay alive! Dressing it up is for cowards.",
        "北海でロープを切った件に弁明なんてないわ。生き残るために私が切った。言い訳は臆病者のやることよ。",
        spoken_mandarin="北海那次割断搭档副索有什么好辩解的？刀是我自己拔的，为了活命！找借口哄自己那是懦夫干的事。",
        dialogue_window=("00:00.45", "00:08.90"),
    ),
    make_shot(
        "n3_ab_04", 3, "n3_ana_betrayal", "ana_lean_in.jpg", 192, 0.45, 52204,
        "Seamless continuation: raising one eyebrow slightly behind the frost-rimmed glass, she states her boundary with surgical bluntness.",
        "Low aurora RF static hum, dry matter-of-fact female voice.",
        "V-05 // 安娜·里贝罗", "V-05 // ANA RIBEIRO", "V-05 // アナ・リベイロ",
        "能拉一把我拉，要拉着我一块死——门儿都没有。掰开手自己走，罚金我照认。",
        "Pull you up if I can; drag me under and I cut loose. Dock whatever fine you want.",
        "引き上げられるなら手を貸す、道連れなら迷わず切るわ。罰金ならいくらでも払う。",
        spoken_mandarin="能拉一把我拉，要拉着我一块死，门儿都没有！掰开手自己走，罚金我照认。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n3_ab_03",
    ),
    make_shot(
        "n3_ab_05", 3, "n3_ana_betrayal", "ana_flinch.jpg", 243, 0.40, 52205,
        "Startled momentarily by a sharp emerald aurora static pop on the exterior intercom speaker, Ana scowls hard and dismisses the PR script & suicide-dive orders flatly.",
        "Sharp RF static pop, icy wind gust, blunt sardonic female scoff.",
        "V-05 // 安娜（拒潜罢工）", "V-05 // ANA (WALK-OUT)", "V-05 // アナ（拒否）",
        "三成活率下潜冷却井？让站长自己穿潜水服下去！那点尾款我不要了，活着比岗位职责实在。",
        "Dive the cooling shaft at thirty-percent odds? Tell the Commander to wear the drysuit himself—keep my severance!",
        "生還率3割で冷却シャフトへ潜れ？基地長が自分で潜ればいいわ、報酬なんていらない！",
        spoken_mandarin="三成活率下潜冷却井？让站长自己穿潜水服下去！那点尾款我不要了，活着比岗位职责实在。",
        dialogue_window=("00:00.45", "00:08.90"),
    ),
    make_shot(
        "n3_ab_06", 3, "n3_ana_betrayal", "ana_flinch.jpg", 192, 0.40, 52206,
        "Seamless continuation: slapping her diver license card briefly against the glass without pleading, she turns half-sideways ready to leave if refused.",
        "Plastic card tap against glass, calm steady breathing, laconic female voice.",
        "V-05 // 安娜·里贝罗", "V-05 // ANA RIBEIRO", "V-05 // アナ・リベイロ",
        "氧分压零点四巴，证号 DIV-088。真安娜从不背公关稿套话。",
        "Zero-point-four bar PPO2, DIV-088. The real Ana never recites PR scripts.",
        "酸素分圧0.4バール、番号DIV-088。本物のアナは広報の綺麗事なんて言わないわ。",
        spoken_mandarin="氧分压零点四巴，证号DIV零八八。真安娜从不背公关稿套话。",
        dialogue_window=("00:00.40", "00:06.50"),
        chain_prev="n3_ab_05",
    ),
    make_shot(
        "n3_ab_07", 3, "n3_ana_betrayal", "n3_ana_window.jpg", 192, 0.35, 52207,
        "Stepping squarely back under the flickering aurora window light, Ana holds her gaze flat and steady waiting on the Gate 0 lever.",
        "Geomagnetically distorted intercom static, howling gale, terse female close.",
        "V-05 // 安娜·里贝罗", "V-05 // ANA RIBEIRO", "V-05 // アナ・リベイロ",
        "减压门快顶不住了。开不开，一句话。",
        "Airlock seal is failing. Open or don't—one word.",
        "減圧扉がもう限界よ。開けるか閉じるか、一言で決めなさい。",
        spoken_mandarin="减压门快顶不住了。开不开，一句话。",
        dialogue_window=("00:00.40", "00:05.60"),
    ),

    # 7. fb_n3_ingrid_clinic (5 shots, 40s, isLipSync=False)
    make_shot(
        "n3_fi_01", 3, "fb_n3_ingrid_clinic", "n3_ingrid_clinic_fb.jpg", 192, 0.20, 52301,
        "Dim Nordic clinic C1 flashback: soft-spoken blonde psychologist Dr. Ingrid Solberg (matching ingrid.jpg, pale knit turtleneck under white coat) sits serenely before her CRT terminal while pale radioman Hansen trembles in the foreground chair.",
        "Soft soothing ambient clinic hum, quiet frantic trembling breathing, gentle keyboard clicks.",
        "医疗驳回档 // 卷宗 o-01", "MED-EVAC FILE // o-01", "医療却下記録 // o-01",
        "医疗驳回档 o-01：无线电员汉森出现重度极夜抑郁割腕倾向，三次恳求提前轮换返航——",
        "Med-evac log o-01: Radioman Hansen showed severe polar breakdown and begged thrice for medical evacuation—",
        "医療記録o-01：通信士ハンセンは重度の抑うつを訴え、三度にわたり早期帰還を懇願した——",
    ),
    make_shot(
        "n3_fi_02", 3, "fb_n3_ingrid_clinic", "n3_ingrid_clinic_fb.jpg", 192, 0.25, 52302,
        "Seamless continuation: Ingrid places a comforting hand lightly over Hansen's trembling arm while clicking SEND on an Oslo University grant email on her screen: 'Subject #7 hit critical breakdown inflection—do not interrupt observation.'",
        "Soft calm email send chime, faint trembling tin mug rattle, quiet pen scratch.",
        "奥斯陆课题邮件 // 关键样本", "OSLO GRANT // SUBJECT #7", "オスロ大学宛メール // 被験者7号",
        "英格丽一边轻声安慰，一边向奥斯陆大学发信：「第 7 号重度剥夺样本进入关键拐点，绝不可中断观测。」",
        "Ingrid soothed him gently while emailing Oslo: 'Subject #7 hit critical inflection—do not interrupt observation.'",
        "イングリッドは優しく微笑みながらオスロ大学へ送信した。「被験者7号が臨界点に入った、観察を中断してはならない。」",
        chain_prev="n3_fi_01",
    ),
    make_shot(
        "n3_fi_03", 3, "fb_n3_ingrid_clinic", "n3_ingrid_clinic_fb.jpg", 192, 0.20, 52303,
        "Seamless transition as station alarm sirens suddenly flash red in Clinic C1 corridor: Ingrid smoothly steps inside her reinforced ballistic clinic doorway and throws the deadbolt shut in front of two coughing miners.",
        "Sudden red alarm klaxon, heavy ballistic door slamming shut and deadbolt throwing, desperate fists pounding outside.",
        "C1 诊室门禁录音 // 卷宗 o-02", "CLINIC AUDIO // o-02", "診察室録音 // o-02",
        "警报响起瞬间，她率先锁死防弹诊室门，将门外拍门求救的伤员隔绝在寒夜气溶胶中——",
        "At first alarm she bolted her ballistic clinic door first, shutting trapped coughing crew outside—",
        "警報と同時に彼女は真っ先に防弾扉を施錠し、外で助けを求める隊員を締め出した——",
        chain_prev="n3_fi_02",
    ),
    make_shot(
        "n3_fi_04", 3, "fb_n3_ingrid_clinic", "n3_ingrid_clinic_fb.jpg", 192, 0.25, 52304,
        "Seamless continuation inside the quiet locked clinic: Ingrid switches on a warm table lamp, presses the pre-recorded breathing tape button smoothly, and writes calm notes in her leather journal while fists pound faintly outside glass.",
        "Velvety calm meditation tape click, muffled desperate pounding outside door, smooth pen gliding on paper.",
        "C1 诊室广播 // 投射话术", "CLINIC // VELVET GASLIGHT", "診察室 // 心理的防衛",
        "并对门外柔声广播：「你的被抛弃感源于童年依恋创伤，请深呼吸。」",
        "broadcasting softly through the intercom: 'Your abandonment panic stems from childhood attachment. Breathe deeply.'",
        "そして扉越しに穏やかに放送した。「見捨てられ不安は幼少期の愛着トラウマよ、深呼吸して。」",
        chain_prev="n3_fi_03",
    ),
    make_shot(
        "n3_fi_05", 3, "fb_n3_ingrid_clinic", "n3_ingrid_clinic_fb.jpg", 192, 0.15, 52305,
        "Closing image of the clinic diary preface beside flickering aurora shadows: Ingrid closes the leather binder gracefully as emergency lights flicker outside Gate 0.",
        "Leather journal closing softly, eerie aurora static hum rising.",
        "互助手册序言 // o-03", "WELLNESS FOREWORD // o-03", "手引序文 // o-03",
        "手册扉页还写着她亲笔题词：「宽宥每一次软弱、分担每一份战栗，是我唯一的信仰。」",
        "Her foreword still reads: 'Forgiving every frailty and sharing every shiver is my sole calling.'",
        "手引書の序文にはこうある——「全ての弱さを寛容に受け止め、震えを分かち合うことが私の信念。」",
        chain_prev="n3_fi_04",
    ),

    # 8. n3_storm_blackout (8 shots, 68s, isLipSync=True + N3_BRIBE closing beat)
    make_shot(
        "n3_sb_01", 3, "n3_storm_blackout", "n3_ingrid_window.jpg", 192, 0.40, 52401,
        "Outside Gate 0's blast glass under surging green-blue geomagnetic aurora interference: soft-spoken Scandinavian psychologist Dr. Ingrid Solberg (matching ingrid.jpg, calm composed expression, pale fleece under fur-lined parka) leans gently toward the mic with a warm therapeutic smile.",
        "Soft gentle tap on glass, aurora static crackle, velvety soothing female voice.",
        "V-06 // 心理顾问 英格丽·索尔伯格", "V-06 // DR. INGRID SOLBERG", "V-06 // イングリッド医師",
        "晚上好，零九。你的呼吸听起来很紧绷——我是索尔伯格医生，开门让我进来稳住节奏好吗？",
        "Good evening, #09. Your breathing sounds tight over the static—it's Dr. Solberg. Let me in to steady this together.",
        "こんばんは、#09。息が詰まっているわね——ソルベルグよ、中へ入れてちょうだい。",
        spoken_mandarin="晚上好，零九。你的呼吸听起来很紧绷，我是索尔伯格医生，开门让我进来陪你稳住节奏好吗？",
        dialogue_window=("00:00.40", "00:06.80"),
    ),
    make_shot(
        "n3_sb_02", 3, "n3_storm_blackout", "n3_ingrid_window.jpg", 192, 0.40, 52402,
        "Seamless continuation outside the frosted pane: tilting her head with gentle maternal pity, Ingrid speaks soothingly as if diagnosing #09 across a therapy desk.",
        "Quiet wind sigh, calm rhythmic soothing female Mandarin.",
        "V-06 // 英格丽·索尔伯格", "V-06 // DR. INGRID SOLBERG", "V-06 // イングリッド医師",
        "独自守着这扇铁门连续几个极夜，任谁都会产生偏执投射……别怕，我理解你。",
        "Holding this iron gate alone through polar night triggers paranoid projection in anyone... don't be afraid, I understand.",
        "極夜に一人でこの鉄扉を守り続ければ誰だって疑心暗鬼になるわ……怖がらないで、私は分かっているから。",
        spoken_mandarin="独自守着这扇铁门连续几个极夜，任谁都会产生偏执投射……别怕，我理解你。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n3_sb_01",
    ),
    make_shot(
        "n3_sb_03", 3, "n3_storm_blackout", "ingrid_lean_in.jpg", 243, 0.45, 52403,
        "Tight close-up leaning near the wire glass: her serene smile never wavers as she reframes blocking Hansen's evacuation as clinical care while protecting her Oslo dataset.",
        "Subdued static hum, silky warm unhurried female voice.",
        "V-06 // 英格丽（温柔煤气灯）", "V-06 // INGRID (REFRAMING)", "V-06 // イングリッド（すり替え）",
        "轻易放汉森逃回陆地不是宽宥，那是剥夺他穿越创伤阈值的成长契机——何况极夜曲线对心理学至关重要！",
        "Letting Hansen flee prematurely isn't mercy—it robs him of resilience, and deprives polar psychiatry of vital data!",
        "ハンセンを安易に帰還させるのは寛容ではないわ。成長の機会を奪うことになるし、極地心理学に不可欠な曲線なの！",
        spoken_mandarin="轻易放汉森逃回陆地不是宽宥，那是剥夺他穿越创伤阈值的成长契机！何况极夜曲线对心理学至关重要。",
        dialogue_window=("00:00.45", "00:09.00"),
    ),
    make_shot(
        "n3_sb_04", 3, "n3_storm_blackout", "ingrid_lean_in.jpg", 192, 0.45, 52404,
        "Seamless continuation: lowering her voice tenderly, she turns the accusation smoothly back onto #09's own guilt.",
        "Velvety intimate intercom tone, faint storm wind.",
        "V-06 // 英格丽·索尔伯格", "V-06 // DR. INGRID SOLBERG", "V-06 // イングリッド医師",
        "零九，听听你提问里的敌意——你是不是把对自身岗位残酷性的内疚，投射到我身上了？",
        "#09, notice the hostility in your question—aren't you projecting your own booth guilt onto me?",
        "#09、あなたの質問の攻撃性に気づいている？自分の職務の罪悪感を私に投影しているのよ。",
        spoken_mandarin="零九，听听你提问里的敌意。你是不是把对自身岗位残酷性的内疚，投射到我身上了？",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n3_sb_03",
    ),
    make_shot(
        "n3_sb_05", 3, "n3_storm_blackout", "ingrid_flinch.jpg", 192, 0.40, 52405,
        "Brief flicker of cold steel beneath the gentle facade as aurora static spikes: Ingrid pulls back half an inch, speaking firmly about locking her clinic door against infected crew.",
        "Aurora static burst, crisp firm clinical female voice.",
        "V-06 // 英格丽（边界辩护）", "V-06 // INGRID (BOUNDARY)", "V-06 // イングリッド（境界線）",
        "锁死诊室门正是健康的治疗师边界。情绪容器倒下了，谁来给幸存者做灾后重建？",
        "Bolting the clinic door sets a healthy therapeutic boundary. If the healer falls, who treats survivors?",
        "診察室を施錠するのは健全な治療的境界線よ。治療者が倒れたら誰が事後ケアをするの？",
        spoken_mandarin="锁死诊室门正是健康的治疗师边界！情绪容器倒下了，谁来给幸存者做灾后重建？",
        dialogue_window=("00:00.40", "00:06.80"),
    ),
    make_shot(
        "n3_sb_06", 3, "n3_storm_blackout", "ingrid_flinch.jpg", 192, 0.40, 52406,
        "Seamless continuation: regaining her calm soothing smile instantly, she states her Norwegian registration softly.",
        "Soft breath, soothing quiet female whisper.",
        "V-06 // 英格丽·索尔伯格", "V-06 // DR. INGRID SOLBERG", "V-06 // イングリッド医師",
        "注册号 HPR-44910-NO。把心门打开吧，零九。",
        "License HPR-44910-NO. Let me in, #09.",
        "登録番号HPR-44910-NOよ。扉を開けてちょうだい、#09。",
        spoken_mandarin="注册号HPR四四九一零NO。把门打开吧，零九。",
        dialogue_window=("00:00.40", "00:05.80"),
        chain_prev="n3_sb_05",
    ),
    make_shot(
        "n3_sb_07", 3, "n3_storm_blackout", "n3_holm_fuel_chute.jpg", 192, 0.0, 52407,
        "Sudden cut to the shadowed inner steel drop-chute inside Gate 0 booth during magnetic blackout: two heavy red-orange aviation fuel canisters (+2 FUEL) and an encrypted silver data chip slide clattering out onto the metal tray from Deputy Holm's secret corridor.",
        "Heavy metallic chute flap clank, two steel fuel canisters thudding into tray, encrypted chip slide.",
        "第 3 夜磁暴黑障 // N3_BRIBE", "NIGHT 3 CRISIS // HOLM BRIBE", "第3夜危機 // 副所長の賄賂",
        "磁暴盲区刚启，内舱秘密滑槽忽然哐当滑出两罐高纯航空燃料（+2 FUEL）与一枚加密芯片——副站长霍尔姆传话要你抹掉 B 区事故档案。",
        "During sensor blackout, two aviation fuel canisters (+2 FUEL) and a cipher chip slide out—Deputy Holm wants his name scrubbed from Sector B's breach log.",
        "磁気嵐の死角を突き、滑槽から燃料2缶（+2 FUEL）と暗号チップが滑り落ちた——ホルム副所長からの口止め料だ。",
    ),
    make_shot(
        "n3_sb_08", 3, "n3_storm_blackout", "n3_holm_fuel_chute.jpg", 192, 0.0, 52408,
        "Seamless push-in on the frost-covered fuel canisters beside the blinking amber heater gauge: cold steam curls off the steel tray as ORD-OS waits silently for your choice.",
        "Low booth heater hum struggling in -46C chill, faint CRT static tick.",
        "ORD-OS // 燃料与真相抉择", "ORD-OS // FUEL OR TRUTH", "ORD-OS // 燃料と真実",
        "收下燃料抹除名字、借条文扣留一罐、还是原样退回实名刻进黑匣子？岗亭温度正跌破冰点。",
        "Take the fuel and scrub the log, impound one canister under Clause 9, or shove it back and record the bribe?",
        "燃料を受け取り記録を消すか、1缶のみ徴用するか、突き返して実名で録音するか——温度が氷点下に迫る。",
        chain_prev="n3_sb_07",
    ),

    # ==================== NIGHT 4 · V-07 LIN MEI & V-08 HANNAH + N4_COMMANDER ====================
    # 9. fb_n4_linmei_freezer (5 shots, 40s, isLipSync=False)
    make_shot(
        "n4_fl_01", 4, "fb_n4_linmei_freezer", "n4_linmei_freezer_fb.jpg", 192, 0.15, 53101,
        "Sub-zero Vault 4 cryogenic storage flashback: white liquid-nitrogen mist spills across steel grating around stacked sample cylinders as an alarmed young lab intern backs away from a leaking brass valve.",
        "Pressurized liquid-nitrogen cryogenic hiss, shrill lab leak alarm, startled intern gasp.",
        "4号冷库纪律卷宗 // 卷宗 o-01", "VAULT 4 LOG // o-01", "第4冷凍庫記録 // o-01",
        "纪律卷宗 o-01：4 号冷库实习生误触阀门导致泄漏，原始温控曲线眼看就要把全组拖进审讯——",
        "Vault 4 log o-01: An intern tripped a valve, leaving 72 hours of raw curves that would indict the junior team—",
        "第4冷凍庫記録o-01：実習生がバルブを誤操作し、生温度曲線が班員全員を処罰の危機に晒した——",
    ),
    make_shot(
        "n4_fl_02", 4, "fb_n4_linmei_freezer", "n4_linmei_freezer_fb.jpg", 192, 0.25, 53102,
        "Seamless continuation: quiet East Asian cryo-biologist Dr. Lin Mei (matching linmei.jpg, sleek tied-back hair, white lab coat over dark thermal vest) steps calmly in front of the glowing green terminal, manually purges the 72-hour raw log, and signs her own name onto the Class-2 reprimand slip.",
        "Crisp mechanical keyboard delete clatter, pen scratching signature firmly onto reprimand slip.",
        "4号冷库 // 删档自领处分", "VAULT 4 // SIGNED ALONE", "第4冷凍庫 // 単独署名",
        "调查组抵达前，林梅独自抹掉 72 小时原始曲线，把二级失职处分单稳稳签在自己名下。",
        "Before investigators arrived, Lin Mei wiped the 72h raw curves and signed the Class-2 reprimand alone.",
        "調査班到着前、リン・メイは72時間の生記録を消去し、二級処分の署名欄に自分の名だけを記した。",
        chain_prev="n4_fl_01",
    ),
    make_shot(
        "n4_fl_03", 4, "fb_n4_linmei_freezer", "n4_linmei_freezer_fb.jpg", 192, 0.20, 53103,
        "Seamless transition to B2 biological containment bay: spore warning beacons blink amber as Lin Mei locks the heavy door from inside, refusing to hand over her lab assistants' names on the exposure sheet.",
        "Heavy containment door locking from inside, mechanical air-scrubber drone, calm silence.",
        "B2 生物封控日志 // 卷宗 o-02", "B2 CONTAINMENT // o-02", "B2封じ込め記録 // o-02",
        "B2 封控夜孢子读数超标，她反锁样本室整夜独自排险，宁可担责也不交出年轻组员接触名单。",
        "On the night of the B2 spore spike, she locked herself inside alone rather than expose her junior team.",
        "B2胞子警報の夜も彼女は検体室に一人で籠もり、若い助手たちの名簿提出を拒み続けた。",
        chain_prev="n4_fl_02",
    ),
    make_shot(
        "n4_fl_04", 4, "fb_n4_linmei_freezer", "n4_linmei_freezer_fb.jpg", 192, 0.20, 53104,
        "Seamless continuation: standing quietly alone among icy frosted sample racks in blue cryo glow, Lin Mei checks the master seal gauge calmly while holding the containment key.",
        "Cryogenic frost crackle, quiet steady breathing.",
        "伦理宣誓对比 // o-03", "ETHICS OATH // o-03", "倫理宣誓 // o-03",
        "可入站宣誓录音里，她亲口说过：「原始数据高于一切体面，篡改记录者不配穿白大褂。」",
        "Yet her oath tape declared: 'Raw data stands above every comfort; anyone who alters logs forfeits their lab coat.'",
        "だが宣誓録音で彼女は語っていた——「生データはあらゆる体面に優先する、改ざん者に白衣を着る資格はない。」",
        chain_prev="n4_fl_03",
    ),
    make_shot(
        "n4_fl_05", 4, "fb_n4_linmei_freezer", "n4_linmei_freezer_fb.jpg", 192, 0.15, 53105,
        "Vault 4's frosted outer seal snaps abruptly under extreme cold pressure as liquid nitrogen haze rolls down the corridor toward Gate 0.",
        "Metallic cryo seal snapping sharply, rushing cold mist.",
        "第 4 夜 // 母本库封条破损", "NIGHT 04 // CRYO SEAL BROKEN", "第4夜 // 保管庫封破れ",
        "第 4 夜降临——低温样本库封条崩裂，高阶拟态体已学会背全套人性借口。",
        "Night 4 begins: the cryo-vault seal shatters—high-tier mimics now rehearse every human excuse.",
        "第4夜が始まる——低温保管庫の封が破れ、高階擬態体は人間の言い訳すら完璧に演じ切る。",
        chain_prev="n4_fl_04",
    ),

    # 10. n4_linmei_conspiracy (7 shots, 60s, isLipSync=True)
    make_shot(
        "n4_lc_01", 4, "n4_linmei_conspiracy", "n4_linmei_window.jpg", 192, 0.35, 53201,
        "Outside Gate 0's frost-edged blast glass in swirling blue cryo mist: composed East Asian cryo-biologist Dr. Lin Mei (matching linmei.jpg, frosted dark thermal parka over white lab coat) stands straight, tapping once cleanly on the glass.",
        "Single crisp knuckle tap, howling blizzard wind, quiet precise female voice.",
        "V-07 // 低温生物学家 林梅", "V-07 // DR. LIN MEI", "V-07 // リン・メイ博士",
        "零九，低温样本库封条破了。我是林梅，开门让我进内舱锁死母本。",
        "#09, the cryo-vault seal broke. It's Lin Mei—cycle the lock so I can secure the master cultures.",
        "#09、低温保管庫の封が破れたわ。リン・メイよ、母株を封じるから開けて。",
        spoken_mandarin="零九，低温样本库封条破了。我是林梅，开门让我进内舱锁死母本。",
        dialogue_window=("00:00.40", "00:06.50"),
    ),
    make_shot(
        "n4_lc_02", 4, "n4_linmei_conspiracy", "n4_linmei_window.jpg", 192, 0.35, 53202,
        "Seamless continuation: glancing briefly down toward drifting white cold haze creeping along the floor behind her, Lin Mei lowers her voice concisely.",
        "Hissing liquid-nitrogen mist creeping outside, low quiet precise female voice.",
        "V-07 // 林梅博士", "V-07 // DR. LIN MEI", "V-07 // リン・メイ博士",
        "外面的冷雾已经在往走廊渗了，别在无关废话上耗掉这几句。",
        "Cryo mist is already seeping down the hall—don't waste time on idle questions.",
        "冷霧が廊下に漏れているわ、無意味な質問で時間を無駄にしないで。",
        spoken_mandarin="外面的冷雾已经在往走廊渗了，别在无关废话上耗掉这几句。",
        dialogue_window=("00:00.40", "00:06.20"),
        chain_prev="n4_lc_01",
    ),
    make_shot(
        "n4_lc_03", 4, "n4_linmei_conspiracy", "linmei_lean_in.jpg", 243, 0.45, 53203,
        "Tight close-up leaning steadily against the frosted blast glass: calm, controlled, zero theatrics—she takes total personal blame for wiping Vault 4's raw curves.",
        "Quiet tense intercom hum, steady calm terse female Mandarin.",
        "V-07 // 林梅（独揽处分）", "V-07 // LIN MEI (SHIELD)", "V-07 // リン・メイ（引き受け）",
        "四号冷库那七十二小时曲线是我自己按的删除键，字也是我签的——没有别人进过冷库，处分单拿来就行。",
        "My keystroke wiped Vault 4's 72-hour curves, my signature on the log—nobody else entered, hand me the reprimand.",
        "第4冷凍庫の72時間記録を消したのも署名したのも私よ。他に誰も入っていない、処分書を出しなさい。",
        spoken_mandarin="四号冷库那七十二小时曲线是我自己按的删除键，字也是我签的。没有别人进过冷库，处分单拿来就行。",
        dialogue_window=("00:00.45", "00:09.00"),
    ),
    make_shot(
        "n4_lc_04", 4, "n4_linmei_conspiracy", "linmei_lean_in.jpg", 192, 0.45, 53204,
        "Seamless continuation: steady unblinking eyes behind the glass, she refuses calmly to publish panic curves or surrender her team's exposure list.",
        "Cool clinical quietness, terse resolute female voice.",
        "V-07 // 林梅博士", "V-07 // DR. LIN MEI", "V-07 // リン・メイ博士",
        "恐慌踩踏死的人比孢子多得多。接触名单上只有我一个人，别动我组里年轻的实习生。",
        "A stampede kills faster than spores. Put only my name on the exposure list—leave my juniors out of it.",
        "パニックの方が胞子より人を殺すわ。名簿には私の名前だけ書いて、うちの若い実習生には触れないで。",
        spoken_mandarin="恐慌踩踏死的人比孢子多得多。接触名单上只有我一个人，别动我组里年轻的实习生。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n4_lc_03",
    ),
    make_shot(
        "n4_lc_05", 4, "n4_linmei_conspiracy", "linmei_flinch.jpg", 243, 0.40, 53205,
        "Startled stillness when confronted with the read-only cloud backup (Boggart trap): Lin Mei freezes for two full seconds, eyes widening slightly before taking the blame onto herself even harder.",
        "Two seconds dead silence save low wind, subtle sharp intake breath, fiercely protective quiet female voice.",
        "V-07 // 林梅（拆退路真话）", "V-07 // LIN MEI (NO ESCAPE)", "V-07 // リン・メイ（退路剥奪）",
        "只读云端早同步给站长了？……那就告诉他阀门是我命令拧的！关禁闭关我，别拿二十岁的孩子祭旗！",
        "Read-only cloud already synced it? ...Then tell the Commander I ordered the kid to turn it! Brig me—spare the twenty-year-old!",
        "クラウドに送信済み？……なら基地長に伝えて、バルブを回すよう命じたのは私よ！二十歳の子を生贄にしないで！",
        spoken_mandarin="只读云端早同步给站长了？那就告诉他，阀门是我命令拧的！关禁闭关我，别拿二十岁的孩子祭旗！",
        dialogue_window=("00:00.55", "00:09.10"),
    ),
    make_shot(
        "n4_lc_06", 4, "n4_linmei_conspiracy", "linmei_flinch.jpg", 192, 0.40, 53206,
        "Seamless continuation: composing her face instantly back to quiet precision, she holds one frosted sample keycard up to the pane.",
        "Keycard tap on glass, calm steady female voice.",
        "V-07 // 林梅博士", "V-07 // DR. LIN MEI", "V-07 // リン・メイ博士",
        "母本库主阀再不落锁就全站泄孢了。开不开闸，你自己定。",
        "If the master culture valve isn't locked soon, spores flood the station. Your call.",
        "母株バルブを封じなければ全基地に胞子が漏れるわ。決断はあなた次第よ。",
        spoken_mandarin="母本库主阀再不落锁就全站泄孢了。开不开闸，你自己定。",
        dialogue_window=("00:00.40", "00:06.50"),
        chain_prev="n4_lc_05",
    ),
    make_shot(
        "n4_lc_07", 4, "n4_linmei_conspiracy", "n4_linmei_window.jpg", 192, 0.35, 53207,
        "Stepping back into center frame outside Gate 0 as swirling white cryo mist obscures her boots, Lin Mei waits silently with calm eyes fixed on the operator.",
        "Cryo vapor hiss outside glass, cold howling Arctic gale.",
        "V-07 // 林梅博士", "V-07 // DR. LIN MEI", "V-07 // リン・メイ博士",
        "记住：我的签名，我自己担着。",
        "Remember: my signature, my liability.",
        "覚えておいて、私の署名は私一人で引き受けるわ。",
        spoken_mandarin="记住，我的签名，我自己担着。",
        dialogue_window=("00:00.45", "00:05.50"),
    ),

    # 11. fb_n4_hannah_vent (5 shots, 40s, isLipSync=False)
    make_shot(
        "n4_fh_01", 4, "fb_n4_hannah_vent", "n4_hannah_vent_fb.jpg", 192, 0.20, 53301,
        "Cold steel life-support workstation flashback: rigid bespectacled German technician Hannah Weiss (matching hannah.jpg, angular glasses, tightly pinned hair) stares unblinkingly at tampered scrubber serial logs while her bunkmate Claire's mug sits untouched.",
        "Crisp mechanical serial printer chatter, sharp quiet laboratory hum.",
        "特罗姆瑟监察回执 // 卷宗 o-01", "OVERSIGHT RECEIPT // o-01", "監察受理票 // o-01",
        "卷宗 o-01：发现同寝室密友克莱尔伪造滤毒罐读数骗补贴，汉娜当晚连同原始串口一并实名检举——",
        "Log o-01: Catching her own bunkmate Claire faking scrubber logs, Hannah filed signed raw serial proof that night—",
        "記録o-01：同室の親友クレアの改ざんを見つけたハンナは、その夜のうちに実名で生データを告発した——",
    ),
    make_shot(
        "n4_fh_02", 4, "fb_n4_hannah_vent", "n4_hannah_vent_fb.jpg", 192, 0.25, 53302,
        "Seamless continuation: Claire is escorted out down the corridor while hostile crewmates shun Hannah's desk; Hannah calmly tapes a stark typed slip onto her monitor: 'Silence is complicity.'",
        "Crisp adhesive tape tear and press onto monitor bezel, cold lonely room tone.",
        "工位贴条 // 包庇等于合谋", "DESK NOTE // COMPLICITY", "机の掲示 // 黙認は共犯",
        "密友被开除遣返，她遭全班组孤立，却只在工位贴出一行字：「包庇等于合谋。」",
        "Her bunkmate was expelled and the crew shunned her; Hannah taped one note on her screen: 'Silence is complicity.'",
        "親友は送還され、班全体から孤立しても彼女は机に貼った——「黙認は共犯。」",
        chain_prev="n4_fh_01",
    ),
    make_shot(
        "n4_fh_03", 4, "fb_n4_hannah_vent", "n4_hannah_vent_fb.jpg", 192, 0.20, 53303,
        "Seamless transition to the roaring sub-zero outer wind-shaft catwalk: after broadcasting the logistics chief's blackmail tape station-wide under her real name, Hannah marches alone into the -45C outer shaft carrying her duffel and bright orange flight-recorder black box.",
        "Howling -45C wind tunnel roar, heavy steel grate footsteps, orange black-box latch click.",
        "内网广播与外风井调岗 // 卷宗 o-02", "SHAFT TRANSFER // o-02", "配転命令 // o-02",
        "遭后勤主管威逼撤诉后，她反手把威胁录音实名群发全站，次日自己背铺盖走进零下四十五度外风井。",
        "Threatened to drop her theft report, she broadcast the threat tape station-wide and marched to the -45C outer shaft.",
        "脅迫を受けるや脅迫録音を全端末へ実名送信し、翌日自ら氷点下45度の外周縦坑へ赴任した。",
        chain_prev="n4_fh_02",
    ),
    make_shot(
        "n4_fh_04", 4, "fb_n4_hannah_vent", "n4_hannah_vent_fb.jpg", 192, 0.20, 53304,
        "Seamless continuation inside the icy wind-shaft recess: Hannah snaps an orange tamper-sealed flight recorder onto an illegal exhaust valve pipe, capturing the roaring unauthorized vent exhaust on tape.",
        "Illegal exhaust pipe hiss, sharp tamper-lock snap onto orange black box.",
        "外风井违规排气 // 黑匣子铁证", "OUTER SHAFT // TAMPER BOX", "外周縦坑 // 不正排気証拠",
        "今晚她怀里抱着外风井违规排气的防拆黑匣子，顶着暴雪冲回零号闸口。",
        "Tonight she hauled the tamper-sealed vent black box through the blizzard straight to Gate 0.",
        "今夜、彼女はその不正排気の耐タンパー記録装置を抱えて第0関門へ辿り着いた。",
        chain_prev="n4_fh_03",
    ),
    make_shot(
        "n4_fh_05", 4, "fb_n4_hannah_vent", "n4_hannah_vent_fb.jpg", 192, 0.15, 53305,
        "Closing image: Hannah's sharp bespectacled gaze through frost mist as the bright orange flight-recorder box glows beneath red emergency bulbs before dawn.",
        "Howling shaft wind, heavy red emergency relay clack.",
        "转正表对比 // o-03", "PROBATION PLEDGE // o-03", "誓約書 // o-03",
        "可转正述职表里她分明写过：「一定把团队情谊与自身安全放首位，绝不再较真伤和气。」",
        "Yet her probation form pledged: 'I will put team harmony and personal safety first—no more escalating.'",
        "だが本採用誓約書にはこう記されていた——「今後は仲間との和と自身の安全を最優先とする。」",
        chain_prev="n4_fh_04",
    ),

    # 12. n4_hannah_whistle (8 shots, 68s, isLipSync=True + N4_COMMANDER telex closing beat)
    make_shot(
        "n4_hw_01", 4, "n4_hannah_whistle", "n4_hannah_window.jpg", 192, 0.35, 53401,
        "Outside Gate 0's frost-covered wire-reinforced blast glass before Night 5 dawn: sharp-featured German technician Hannah Weiss (matching hannah.jpg, angular frost-rimmed glasses) hugs a bright orange flight-recorder black box tight against her chest and stares sharply through the pane.",
        "Blizzard gale outside glass, sharp metal box tap on window frame, rigid crisp female voice.",
        "V-08 // 维生技师 汉娜·魏斯", "V-08 // HANNAH WEISS", "V-08 // ハンナ・ヴァイス",
        "零九，我是汉娜·魏斯。我怀里是外风井违规排气的黑匣子，立刻放我进内舱封存证物！",
        "#09, Hannah Weiss. I'm holding the outer-shaft vent tamper recorder—open the lock so I can seal the evidence!",
        "#09、ハンナ・ヴァイスよ。不正排気のブラックボックスを持っているわ、証拠保全のため開けて！",
        spoken_mandarin="零九，我是汉娜·魏斯。我怀里是外风井违规排气的黑匣子，立刻放我进内舱封存证物！",
        dialogue_window=("00:00.40", "00:06.80"),
    ),
    make_shot(
        "n4_hw_02", 4, "n4_hannah_whistle", "n4_hannah_window.jpg", 192, 0.35, 53402,
        "Seamless continuation: gripping the tamper-sealed latch of the orange recorder box firmly, Hannah's eyes flash coldly through her frosted spectacles.",
        "Plastic-steel latch snap, fierce crisp German-precision Mandarin.",
        "V-08 // 汉娜·魏斯", "V-08 // HANNAH WEISS", "V-08 // ハンナ・ヴァイス",
        "别拿废话拖延时间！难道你也在替里头的人争取毁灭证据的窗口吗？",
        "Stop stalling with nonsense! Are you buying time for someone inside to shred logs?",
        "無意味な質問で時間稼ぎしないで！中の誰かに証拠隠滅の時間を与えているの？",
        spoken_mandarin="别拿废话拖延时间！难道你也在替里头的人争取毁灭证据的窗口吗？",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n4_hw_01",
    ),
    make_shot(
        "n4_hw_03", 4, "n4_hannah_whistle", "hannah_lean_in.jpg", 243, 0.45, 53403,
        "Tight close-up pressing close to the wired glass: she speaks with uncompromising scorched-earth resolve—never trading integrity for gratitude or a submarine berth.",
        "Intercom hum, sharp rigid uncompromising female voice.",
        "V-08 // 汉娜（玉石俱焚）", "V-08 // HANNAH (WHISTLEBLOWER)", "V-08 // ハンナ（内部告発）",
        "救命之恩我拿命还，但篡改日志必须移交追责！这盒记录仪有防拆自毁锁，我冻死窗外救援队也能从我尸体怀里读出来！",
        "I'd bleed to repay a life saved, but falsified logs go into the indictment! Freeze me outside and recovery pulls names off my corpse!",
        "命の恩は命で返すけど改ざんは告発するわ！私がここで凍死しても、回収班が遺体から奴らの名前を読み出すわよ！",
        spoken_mandarin="救命之恩我拿命还，但篡改日志必须移交追责！这盒记录仪有防拆自毁锁，我冻死窗外救援队也能从我尸体怀里读出来！",
        dialogue_window=("00:00.45", "00:09.10"),
    ),
    make_shot(
        "n4_hw_04", 4, "n4_hannah_whistle", "hannah_lean_in.jpg", 192, 0.45, 53404,
        "Seamless continuation: raising her real badge key up against the glass with fierce pride, refusing anonymous leaks or backroom deals.",
        "Metal key tap against pane, crisp sharp female Mandarin.",
        "V-08 // 汉娜·魏斯", "V-08 // HANNAH WEISS", "V-08 // ハンナ・ヴァイス",
        "附上我的实名工牌密钥，连同原始串口哈希值直发独立监察庭——绝不私了！",
        "My real badge key, raw serial hash, straight to external oversight—zero backroom deals!",
        "実名キーと生データのハッシュを外部監査機関へ送るわ——裏取引なんて絶対にしない！",
        spoken_mandarin="附上我的实名工牌密钥，连同原始串口哈希值直发独立监察庭！绝不私了！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n4_hw_03",
    ),
    make_shot(
        "n4_hw_05", 4, "n4_hannah_whistle", "hannah_flinch.jpg", 243, 0.40, 53405,
        "Pupils constrict sharply as knuckles turn white around the orange box when told the subsea cable is cut and the Oversight Director himself is dirty (Boggart trap): she snarls back even fiercer.",
        "Sharp gasp, white-knuckle plastic creak on orange box, explosive fierce female resolve.",
        "V-08 // 汉娜（拆退路真话）", "V-08 // HANNAH (SCORCHED EARTH)", "V-08 // ハンナ（対決）",
        "监察署也是脏的？！那就不用等陆地开庭了！开内门，我拿这盘原始录音当着全站幸存者的面挨个对质！",
        "Oversight is dirty too?! Forget mainland courts—open this door and I'll play the raw tape in front of every survivor on that sub deck!",
        "監察局もグルなのね？！なら法廷なんて待たない！扉を開けて、潜水艦に乗る生存者全員の前で生録音を突きつけてやる！",
        spoken_mandarin="监察署也是脏的？！那就不用等陆地开庭了！开内门，我拿这盘原始录音当着全站幸存者的面挨个对质！",
        dialogue_window=("00:00.45", "00:09.10"),
    ),
    make_shot(
        "n4_hw_06", 4, "n4_hannah_whistle", "hannah_flinch.jpg", 192, 0.40, 53406,
        "Seamless continuation: staring unyieldingly straight through Gate 0 glass without blinking, delivering her final challenge.",
        "Blizzard gale outside, taut quiet standoff.",
        "V-08 // 汉娜·魏斯", "V-08 // HANNAH WEISS", "V-08 // ハンナ・ヴァイス",
        "今天谁也别想装糊涂上潜艇！拉闸吧，零九！",
        "Nobody boards that sub pretending innocence today! Pull the lever, #09!",
        "今日、しらばっくれて潜水艦に乗れると思うな！レバーを引け、#09！",
        spoken_mandarin="今天谁也别想装糊涂上潜艇！拉闸吧，零九！",
        dialogue_window=("00:00.40", "00:06.50"),
        chain_prev="n4_hw_05",
    ),
    make_shot(
        "n4_hw_07", 4, "n4_hannah_whistle", "n4_lindqvist_telex.jpg", 192, 0.0, 53407,
        "Cut inside Gate 0 booth as the green dot-matrix teletype printer erupts in rapid mechanical clatter, spitting out Commander Lindqvist's red-stamped pre-departure liability telex while Nautilus-0 docking status blinks standby.",
        "Rapid loud dot-matrix teletype clatter, urgent command bell chime, ominous rising electrical grid strain.",
        "第 4 夜收班质询 // N4_COMMANDER", "NIGHT 4 INQUIRY // LINDQVIST TELEX", "第4夜終了査問 // 基地長電文",
        "黎明前夕，打印机骤然吐出站长林德奎斯特的强制追责电传：「鹦鹉螺 0 号即将解缆——签下本周伤亡与燃料损耗最终归责声明。」",
        "Before dawn, the teletype clatters out Commander Lindqvist's liability order: 'Nautilus-0 unmoors shortly—sign final blame for Gate 0 purges.'",
        "夜明け前、基地長からの強制査問電文が印字される——「ノーチラス0号出航前に第0ゲートの最終責任署名を出せ。」",
    ),
    make_shot(
        "n4_hw_08", 4, "n4_hannah_whistle", "n4_lindqvist_telex.jpg", 192, 0.0, 53408,
        "Seamless continuation on the printed liability sheet under flickering tungsten lamp: as the three signature options appear, the main station grid suddenly trips with a heavy breaker snap, plunging the booth toward Night 5.",
        "Heavy circuit breaker trip CLACK, overhead lights sputtering out into dark power-down whine.",
        "ORD-OS // 电网跳闸 · 第 5 夜降临", "MAIN GRID TRIP // NIGHT 5 BEGINS", "主電源遮断 // 第5夜へ",
        "推给期望存活率、推给上级规程、还是签在自己名下？电传刚毕，全站主电网轰然跳闸——第 5 夜降临！",
        "Rationalize survival math, blame HQ protocol, or sign your own badge? The main grid trips dark—Night 5 begins.",
        "生存率で正当化するか、規定に転嫁するか、自分で引き受けるか——主電源が落ち、第5夜が始まる。",
        chain_prev="n4_hw_07",
    ),
]

REEL_FADES: dict[str, tuple[float, float]] = {
    "fb_n2_arthur_snowcat": (0.65, 0.45),
    "n2_arthur_standoff": (0.45, 0.65),
    "fb_n2_marcus_rescue": (0.65, 0.45),
    "n2_marcus_clash": (0.45, 0.70),
    "fb_n3_ana_subsea": (0.65, 0.45),
    "n3_ana_betrayal": (0.45, 0.65),
    "fb_n3_ingrid_clinic": (0.65, 0.45),
    "n3_storm_blackout": (0.45, 0.70),
    "fb_n4_linmei_freezer": (0.65, 0.45),
    "n4_linmei_conspiracy": (0.45, 0.65),
    "fb_n4_hannah_vent": (0.65, 0.45),
    "n4_hannah_whistle": (0.45, 0.75),
}

REEL_ORDER = [
    "fb_n2_arthur_snowcat",
    "n2_arthur_standoff",
    "fb_n2_marcus_rescue",
    "n2_marcus_clash",
    "fb_n3_ana_subsea",
    "n3_ana_betrayal",
    "fb_n3_ingrid_clinic",
    "n3_storm_blackout",
    "fb_n4_linmei_freezer",
    "n4_linmei_conspiracy",
    "fb_n4_hannah_vent",
    "n4_hannah_whistle",
]

PILOT_SHOT_IDS = {"n2_as_01", "n3_ab_01"}


def sh(cmd: str, check: bool = True) -> int:
    print(f"$ {cmd}", flush=True)
    return subprocess.run(cmd, shell=True, check=check).returncode


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def fetch_inputs(selected_images: set[str]) -> None:
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    SHOTS_DIR.mkdir(parents=True, exist_ok=True)
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    raw_dir = Path("/content/n2-4_raw_inputs")
    raw_dir.mkdir(parents=True, exist_ok=True)

    for fname, url in IMAGES.items():
        if fname not in selected_images:
            continue
        raw_p = raw_dir / fname
        mat_p = INPUT_DIR / f"h3_1344_{fname}"
        if not raw_p.exists() or raw_p.stat().st_size < 4096:
            print(f"[IMG] Downloading {fname}", flush=True)
            urllib.request.urlretrieve(url, raw_p)
        if not mat_p.exists() or mat_p.stat().st_size < 4096:
            sh(
                f'ffmpeg -y -v error -i "{raw_p}" '
                f'-vf "scale=1344:768:force_original_aspect_ratio=increase,crop=1344:768" '
                f'-q:v 2 "{mat_p}"'
            )


def detect_gpu_profile() -> tuple[str, float, int, str, list[str]]:
    out = (
        subprocess.check_output(
            "nvidia-smi --query-gpu=name,compute_cap,memory.total --format=csv,noheader,nounits",
            shell=True,
            text=True,
        )
        .strip()
        .splitlines()[0]
    )
    parts = [p.strip() for p in out.split(",")]
    gpu_name = parts[0]
    cc = float(parts[1])
    vram_mb = int(float(parts[2]))
    clip_spec = CLIP_NVFP4 if cc >= 10.0 else CLIP_INT8
    clip_filename = Path(clip_spec[0]).name

    comfy_flags = ["--listen", "127.0.0.1", "--port", "8188", "--disable-mmap", "--fast"]
    if vram_mb >= 88000:
        comfy_flags.append("--highvram")
    elif vram_mb < 70000:
        comfy_flags.append("--lowvram")

    print(
        f"[GPU] {gpu_name} | cc={cc} | VRAM={vram_mb} MiB | CLIP={clip_filename} | flags={' '.join(comfy_flags)}",
        flush=True,
    )
    return gpu_name, cc, vram_mb, clip_filename, comfy_flags


def setup_env(selected_images: set[str]) -> tuple[str, float, int, str, list[str]]:
    print("=== [1/4] GPU, ComfyUI & MiniMax-H3 Weights Setup ===", flush=True)
    gpu_profile = detect_gpu_profile()
    cc = gpu_profile[1]
    sh("apt-get update -qq && apt-get install -y -qq aria2 ffmpeg >/dev/null")

    if not (COMFY_DIR / "main.py").exists():
        sh(f"git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git {COMFY_DIR}")

    sh(
        f"if command -v uv >/dev/null 2>&1; then "
        f"uv pip install --system -q -r {COMFY_DIR}/requirements.txt imageio-ffmpeg einops accelerate soundfile librosa; "
        f"else pip install -q -r {COMFY_DIR}/requirements.txt imageio-ffmpeg einops accelerate soundfile librosa; fi"
    )

    clip_spec = CLIP_NVFP4 if cc >= 10.0 else CLIP_INT8
    active_models = [*BASE_MODELS, clip_spec]
    aria_lines = []
    for rel, url in active_models:
        dst = COMFY_DIR / "models" / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists() and dst.stat().st_size > 10_000_000:
            print(f"[SKIP] Model exists: {rel}", flush=True)
            continue
        aria_lines.append(f"{url}\n  dir={dst.parent}\n  out={dst.name}\n")

    if aria_lines:
        print(f"=== [2/4] Downloading {len(aria_lines)} MiniMax-H3 fl2va Weights via aria2c ===", flush=True)
        Path("/tmp/hf_n24_h3.txt").write_text("".join(aria_lines))
        sh(
            "aria2c -i /tmp/hf_n24_h3.txt -j 6 -x 16 -s 16 -k 16M "
            "--file-allocation=none --continue=true --console-log-level=error --summary-interval=10"
        )

    fetch_inputs(selected_images)
    return gpu_profile


def ensure_comfyui(flags: list[str]) -> dict:
    try:
        urllib.request.urlopen(f"{API_URL}/system_stats", timeout=2)
        print("[OK] ComfyUI already alive on 127.0.0.1:8188", flush=True)
    except Exception:
        print(f"=== [3/4] Starting ComfyUI (flags={' '.join(flags)}) ===", flush=True)
        log_f = open("/tmp/comfyui.log", "w")
        subprocess.Popen(
            ["python3", "main.py", *flags],
            cwd=str(COMFY_DIR),
            stdout=log_f,
            stderr=subprocess.STDOUT,
        )
        ready = False
        for _ in range(90):
            try:
                urllib.request.urlopen(f"{API_URL}/system_stats", timeout=2)
                ready = True
                break
            except Exception:
                time.sleep(2)
        if not ready:
            raise RuntimeError(
                "ComfyUI startup timeout:\n" + Path("/tmp/comfyui.log").read_text(errors="ignore")[-2000:]
            )
        print("[OK] ComfyUI API ready!", flush=True)

    obj_info = json.loads(urllib.request.urlopen(f"{API_URL}/object_info", timeout=15).read().decode())
    i2v_schema = obj_info.get("MiniMaxH3ImageToVideo", {})
    print("[SCHEMA] MiniMaxH3ImageToVideo inputs:", json.dumps(i2v_schema.get("input", {})), flush=True)
    return obj_info


def build_fl2va_workflow(
    obj_info: dict,
    shot: dict,
    clip_filename: str,
    first_frame_name: str | None = None,
    use_last_frame: bool = True,
) -> dict:
    i2v_meta = obj_info.get("MiniMaxH3ImageToVideo", {}).get("input", {})
    i2v_all_keys = set(i2v_meta.get("required", {}).keys()) | set(i2v_meta.get("optional", {}).keys())
    has_sigma_tail = "MiniMaxH3SigmasTail" in obj_info
    has_sep_av = "LTXVSeparateAVLatent" in obj_info
    ff_img = first_frame_name or shot["img"]

    wf: dict = {
        "1": {
            "class_type": "UNETLoader",
            "inputs": {
                "unet_name": "minimax_h3_fl2va_pruned_fp8_scaled.safetensors",
                "weight_dtype": "default",
            },
        },
        "2": {
            "class_type": "LoraLoaderModelOnly",
            "inputs": {
                "model": ["1", 0],
                "lora_name": "h3-realism-people-t2v-i2v-r2v.safetensors",
                "strength_model": 0.75,
            },
        },
        "3": {
            "class_type": "LoraLoaderModelOnly",
            "inputs": {
                "model": ["2", 0],
                "lora_name": "minimax-h3-facial-realism-closeup-cp2000.safetensors",
                "strength_model": float(shot["closeup_lora"]),
            },
        },
        "4": {
            "class_type": "LoraLoaderModelOnly",
            "inputs": {
                "model": ["3", 0],
                "lora_name": "minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors",
                "strength_model": 0.85,
            },
        },
        "5": {
            "class_type": "MiniMaxH3SigmaShift",
            "inputs": {"model": ["4", 0], "shift_video": 12.0, "shift_audio": 3.0},
        },
        "6": {
            "class_type": "CLIPLoader",
            "inputs": {
                "clip_name": clip_filename,
                "type": "minimax",
                "device": "default",
            },
        },
        "7": {
            "class_type": "VAELoader",
            "inputs": {"vae_name": "minimax_h3_video_vae_fp16.safetensors"},
        },
        "8": {
            "class_type": "VAELoader",
            "inputs": {"vae_name": "minimax_h3_audio_vae_fp32.safetensors"},
        },
        "10": {
            "class_type": "LoadImage",
            "inputs": {"image": ff_img},
        },
    }

    i2v_inputs: dict = {
        "clip": ["6", 0],
        "vae": ["7", 0],
        "prompt": shot["prompt"],
        "width": 1344,
        "height": 768,
        "length": int(shot["length"]),
    }
    if "audio_vae" in i2v_all_keys:
        i2v_inputs["audio_vae"] = ["8", 0]
    if "first_frame" in i2v_all_keys:
        i2v_inputs["first_frame"] = ["10", 0]
    elif "image" in i2v_all_keys:
        i2v_inputs["image"] = ["10", 0]

    lf_img = shot.get("last_frame_img")
    if use_last_frame and lf_img and "last_frame" in i2v_all_keys:
        wf["11"] = {"class_type": "LoadImage", "inputs": {"image": lf_img}}
        i2v_inputs["last_frame"] = ["11", 0]
    elif not use_last_frame and lf_img:
        wf["10"]["inputs"]["image"] = lf_img

    wf["20"] = {"class_type": "MiniMaxH3ImageToVideo", "inputs": i2v_inputs}
    wf["22"] = {
        "class_type": "BasicScheduler",
        "inputs": {"model": ["5", 0], "scheduler": "simple", "steps": 10, "denoise": 1.0},
    }
    sig_node = ["22", 0]
    if has_sigma_tail:
        wf["23"] = {
            "class_type": "MiniMaxH3SigmasTail",
            "inputs": {"sigmas": sig_node, "tail_steps": 3, "strength": 0.5},
        }
        sig_node = ["23", 0]

    wf["24"] = {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "res_multistep"}}
    wf["25"] = {"class_type": "RandomNoise", "inputs": {"noise_seed": int(shot["seed"])}}
    wf["26"] = {"class_type": "BasicGuider", "inputs": {"model": ["5", 0], "conditioning": ["20", 0]}}
    wf["27"] = {
        "class_type": "SamplerCustomAdvanced",
        "inputs": {
            "noise": ["25", 0],
            "guider": ["26", 0],
            "sampler": ["24", 0],
            "sigmas": sig_node,
            "latent_image": ["20", 1],
        },
    }

    if has_sep_av:
        wf["30"] = {"class_type": "LTXVSeparateAVLatent", "inputs": {"av_latent": ["27", 0]}}
        vid_latent, aud_latent = ["30", 0], ["30", 1]
    else:
        vid_latent, aud_latent = ["27", 0], ["27", 0]

    wf["31"] = {"class_type": "VAEDecode", "inputs": {"samples": vid_latent, "vae": ["7", 0]}}
    wf["32"] = {"class_type": "VAEDecodeAudio", "inputs": {"samples": aud_latent, "vae": ["8", 0]}}
    wf["34"] = {
        "class_type": "CreateVideo",
        "inputs": {"images": ["31", 0], "audio": ["32", 0], "fps": 24.0},
    }
    wf["35"] = {
        "class_type": "SaveVideo",
        "inputs": {
            "video": ["34", 0],
            "filename_prefix": f"n24_h3_{shot['id']}",
            "format": "mp4",
            "codec": "h264",
        },
    }
    return wf


def submit_and_wait(wf: dict, shot_id: str) -> Path:
    payload = json.dumps({"prompt": wf}).encode("utf-8")
    req = urllib.request.Request(
        f"{API_URL}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=20).read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} on {shot_id}: {e.read().decode(errors='ignore')}") from e
    if resp.get("node_errors"):
        raise RuntimeError(f"Node error on {shot_id}: {json.dumps(resp['node_errors'])}")

    pid = resp["prompt_id"]
    t0 = time.time()
    print(f"🎬 [{shot_id}] Queued prompt_id={pid}", flush=True)
    while True:
        time.sleep(3)
        hist = json.loads(urllib.request.urlopen(f"{API_URL}/history/{pid}", timeout=15).read().decode())
        if pid in hist:
            entry = hist[pid]
            st = entry.get("status", {})
            if st.get("status_str") == "error":
                comfy_tail = Path("/tmp/comfyui.log").read_text(errors="ignore")[-1500:] if Path("/tmp/comfyui.log").exists() else ""
                print(f"=== COMFY ERROR LOG TAIL ({shot_id}) ===\n{comfy_tail}", flush=True)
                raise RuntimeError(f"Execution error on {shot_id}: {json.dumps(st)}")
            candidates = sorted(OUTPUT_DIR.rglob(f"n24_h3_{shot_id}*.mp4"), key=lambda p: p.stat().st_mtime)
            if not candidates:
                outputs = entry.get("outputs", {})
                for node_out in outputs.values():
                    for item in node_out.get("videos", []) + node_out.get("gifs", []):
                        sub = item.get("subfolder", "")
                        fn = item.get("filename", "")
                        cand = OUTPUT_DIR / sub / fn if sub else OUTPUT_DIR / fn
                        if cand.exists():
                            candidates.append(cand)
            if not candidates:
                raise RuntimeError(f"No MP4 found for {shot_id} after completion")
            dst = SHOTS_DIR / f"{shot_id}.mp4"
            shutil.copy2(candidates[-1], dst)
            if drive_ready():
                DRIVE_SHOTS_DIR.mkdir(parents=True, exist_ok=True)
                shutil.copy2(dst, DRIVE_SHOTS_DIR / f"{shot_id}.mp4")
            print(f"✅ [{shot_id}] Done in {time.time() - t0:.1f}s ({dst.stat().st_size / 1024:.0f} KB)", flush=True)
            return dst


def extract_chain_first_frame(prev_shot_id: str, cur_shot_id: str) -> str:
    prev_mp4 = SHOTS_DIR / f"{prev_shot_id}.mp4"
    if (not prev_mp4.exists() or prev_mp4.stat().st_size <= 150_000) and drive_ready():
        cand = DRIVE_SHOTS_DIR / f"{prev_shot_id}.mp4"
        if cand.exists() and cand.stat().st_size > 150_000:
            shutil.copy2(cand, prev_mp4)
    if not prev_mp4.exists() or prev_mp4.stat().st_size <= 150_000:
        raise RuntimeError(f"Missing chain_prev source shot: {prev_shot_id}")
    chain_name = f"h3_chain_{cur_shot_id}.jpg"
    chain_path = INPUT_DIR / chain_name
    sh(
        f'ffmpeg -y -v error -sseof -0.06 -i "{prev_mp4}" -frames:v 1 '
        f'-vf "scale=1344:768:force_original_aspect_ratio=increase,crop=1344:768" '
        f'-q:v 2 "{chain_path}"'
    )
    return chain_name


def filter_shots(night_arg: str) -> list[dict]:
    if night_arg == "all":
        return list(SHOTS)
    n_val = int(night_arg)
    return [s for s in SHOTS if s["night"] == n_val]


def run_render(pilot_only: bool, night_arg: str) -> None:
    targets = [s for s in filter_shots(night_arg) if (not pilot_only or s["id"] in PILOT_SHOT_IDS)]
    needed_imgs = {s["raw_img"] for s in targets}
    for s in targets:
        if s.get("last_frame_img"):
            needed_imgs.add(s["last_frame_img"].removeprefix("h3_1344_"))
    _, _, vram_mb, clip_filename, comfy_flags = setup_env(needed_imgs)
    obj_info = ensure_comfyui(comfy_flags)
    print(f"=== [4/4] Rendering {len(targets)} MiniMax-H3 N2-4 Shots (night={night_arg}, pilot={pilot_only}) ===", flush=True)

    for idx, shot in enumerate(targets, 1):
        out_p = SHOTS_DIR / f"{shot['id']}.mp4"
        if (not out_p.exists() or out_p.stat().st_size <= 150_000) and drive_ready():
            drv_p = DRIVE_SHOTS_DIR / f"{shot['id']}.mp4"
            if drv_p.exists() and drv_p.stat().st_size > 150_000:
                shutil.copy2(drv_p, out_p)
                print(f"☁️ [{idx}/{len(targets)}] Restored {shot['id']} from Drive ({out_p.stat().st_size // 1024} KB)", flush=True)
        if out_p.exists() and out_p.stat().st_size > 150_000:
            print(f"↷ [{idx}/{len(targets)}] Skip existing {shot['id']} ({out_p.stat().st_size // 1024} KB)", flush=True)
            continue

        first_frame_override = None
        if shot.get("chain_prev"):
            first_frame_override = extract_chain_first_frame(shot["chain_prev"], shot["id"])
            print(f"🔗 [{idx}/{len(targets)}] Chained {shot['chain_prev']} end-frame -> {shot['id']} first_frame", flush=True)

        last_err: Exception | None = None
        for attempt in range(3):
            try:
                cur = dict(shot)
                if vram_mb < 70000 and cur["length"] > 192:
                    cur["length"] = 192
                cur["seed"] = shot["seed"] + attempt * 100
                wf = build_fl2va_workflow(
                    obj_info,
                    cur,
                    clip_filename,
                    first_frame_name=first_frame_override,
                    use_last_frame=(attempt == 0),
                )
                submit_and_wait(wf, shot["id"])
                last_err = None
                break
            except Exception as err:
                last_err = err
                print(f"⚠️ [{shot['id']}] attempt {attempt + 1}/3 failed: {err}", flush=True)
                time.sleep(3)
        if last_err:
            raise RuntimeError(f"Failed shot {shot['id']}: {last_err}")
    print("PILOT_DONE" if pilot_only else f"ALL_{len(targets)}_SHOTS_DONE", flush=True)


def stitch_reels(night_arg: str) -> None:
    shot_reels = {s["reel"] for s in SHOTS}
    assert shot_reels == set(REEL_ORDER), f"Orphaned reel(s): {shot_reels - set(REEL_ORDER)}"

    selected_shots = filter_shots(night_arg)
    selected_reels = [r for r in REEL_ORDER if any(s["reel"] == r for s in selected_shots)]

    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    posters_dir = FINAL_DIR / "posters"
    posters_dir.mkdir(parents=True, exist_ok=True)
    man_path = FINAL_DIR / MANIFEST_NAME
    manifest: dict[str, dict] = (
        json.loads(man_path.read_text(encoding="utf-8")) if (night_arg != "all" and man_path.exists()) else {}
    )
    tmp_dir = Path("/tmp/n24_stitch_tmp")
    shutil.rmtree(tmp_dir, ignore_errors=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    total_sec = 0.0
    for reel_id in selected_reels:
        reel_shots = [s for s in selected_shots if s["reel"] == reel_id]
        if drive_ready():
            for s in reel_shots:
                loc = SHOTS_DIR / f"{s['id']}.mp4"
                drv = DRIVE_SHOTS_DIR / f"{s['id']}.mp4"
                if (not loc.exists() or loc.stat().st_size <= 150_000) and drv.exists() and drv.stat().st_size > 150_000:
                    shutil.copy2(drv, loc)
        missing = [s["id"] for s in reel_shots if not (SHOTS_DIR / f"{s['id']}.mp4").exists()]
        if missing:
            raise RuntimeError(f"Cannot stitch {reel_id}; missing shots: {missing}")

        norm_parts: list[Path] = []
        cues: list[dict] = []
        t_cursor = 0.0
        prev_sid: str | None = None

        for s in reel_shots:
            src_mp4 = SHOTS_DIR / f"{s['id']}.mp4"
            raw_dur = probe_duration(src_mp4)
            trim_ss = "-ss 0.042 " if (prev_sid and s.get("chain_prev") == prev_sid and raw_dur > 1.5) else ""
            eff_dur = max(0.2, raw_dur - (0.042 if trim_ss else 0.0))
            norm_p = tmp_dir / f"{s['id']}_norm.mp4"
            af_edge = f"afade=t=in:st=0:d=0.04,afade=t=out:st={max(0.05, eff_dur - 0.04):.3f}:d=0.04"
            vf = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24,format=yuv420p"
            af = f"highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=60,{af_edge},aresample=48000"

            sh(
                f'ffmpeg -y -v error {trim_ss}-i "{src_mp4}" -vf "{vf}" -af "{af}" '
                f'-ar 48000 -ac 2 -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 160k "{norm_p}"'
            )
            norm_dur = probe_duration(norm_p)
            cues.append(
                {
                    "startSec": round(t_cursor, 2),
                    "endSec": round(t_cursor + norm_dur, 2),
                    "speaker": s["speaker"],
                    "text": s["text"],
                }
            )
            t_cursor += norm_dur
            norm_parts.append(norm_p)
            prev_sid = s["id"]

        concat_txt = tmp_dir / f"{reel_id}_concat.txt"
        concat_txt.write_text("".join(f"file '{p}'\n" for p in norm_parts))
        concat_raw_p = tmp_dir / f"{reel_id}_rawcat.mp4"
        sh(f'ffmpeg -y -v error -f concat -safe 0 -i "{concat_txt}" -c copy "{concat_raw_p}"')

        raw_cat_dur = probe_duration(concat_raw_p)
        fade_in_d, fade_out_d = REEL_FADES.get(reel_id, (0.0, 0.0))
        vf_fades = []
        af_fades = ["loudnorm=I=-16:TP=-1.5:LRA=8"]
        if fade_in_d > 0:
            vf_fades.append(f"fade=t=in:st=0:d={fade_in_d:.2f}")
            af_fades.append(f"afade=t=in:st=0:d={fade_in_d:.2f}")
        if fade_out_d > 0 and raw_cat_dur > fade_out_d + 0.5:
            out_st = raw_cat_dur - fade_out_d
            vf_fades.append(f"fade=t=out:st={out_st:.3f}:d={fade_out_d:.2f}")
            af_fades.append(f"afade=t=out:st={out_st:.3f}:d={fade_out_d:.2f}")

        vf_arg = f'-vf "{",".join(vf_fades)},format=yuv420p" ' if vf_fades else "-pix_fmt yuv420p "
        af_str = ",".join(af_fades)
        merged_p = tmp_dir / f"{reel_id}_merged.mp4"
        sh(
            f'ffmpeg -y -v error -i "{concat_raw_p}" '
            f'-c:v libx264 -preset medium -crf 22 {vf_arg}'
            f'-af "{af_str}" -ar 48000 -ac 2 -c:a aac -b:a 128k '
            f'-movflags +faststart "{merged_p}"'
        )
        final_p = FINAL_DIR / f"{reel_id}.mp4"
        shutil.move(str(merged_p), str(final_p))
        poster_t = 0.90 if fade_in_d > 0 else 0.25
        poster_p = posters_dir / f"{reel_id}.jpg"
        sh(f'ffmpeg -y -v error -ss {poster_t:.2f} -i "{final_p}" -frames:v 1 -q:v 2 "{poster_p}"')

        final_dur = probe_duration(final_p)
        if cues:
            cues[-1]["endSec"] = round(final_dur, 2)
        total_sec += final_dur
        manifest[reel_id] = {
            "durationSec": round(final_dur, 2),
            "roundedDurationSec": int(round(final_dur)),
            "cues": cues,
        }
        print(
            f"🎞️ Stitched {reel_id:28s} | {final_dur:6.2f}s | {final_p.stat().st_size / (1024 * 1024):5.2f} MB | {len(cues)} cues",
            flush=True,
        )

    man_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    if drive_ready():
        DRIVE_FINAL_DIR.mkdir(parents=True, exist_ok=True)
        (DRIVE_FINAL_DIR / "posters").mkdir(parents=True, exist_ok=True)
        for p in FINAL_DIR.iterdir():
            if p.is_file():
                shutil.copy2(p, DRIVE_FINAL_DIR / p.name)
        for p in posters_dir.iterdir():
            if p.is_file():
                shutil.copy2(p, DRIVE_FINAL_DIR / "posters" / p.name)
    print(f"\nSTITCH_COMPLETE | total={total_sec:.2f}s ({int(total_sec // 60):02d}:{total_sec % 60:05.2f}) | manifest={man_path}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["pilot", "all", "stitch"], required=True)
    parser.add_argument("--night", choices=["2", "3", "4", "all"], default="all")
    args = parser.parse_args()
    if args.mode == "pilot":
        run_render(pilot_only=True, night_arg=args.night)
    elif args.mode == "all":
        run_render(pilot_only=False, night_arg=args.night)
    else:
        stitch_reels(night_arg=args.night)


if __name__ == "__main__":
    main()
