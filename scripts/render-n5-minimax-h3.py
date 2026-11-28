#!/usr/bin/env python3
"""
Colab GPU Live-Action AI Cinema Renderer & Stitcher for Stage 3 / Night 5 & 4 Endings (`Quarantine Gate 0: 2036`).

Uses MiniMax-H3 `fl2va` (`minimax_h3_fl2va_pruned_fp8_scaled.safetensors`) + `Qwen3-VL-32B-Heretic`
(auto NVFP4 on Blackwell cc>=10 vs INT8 ConvRot on H100/A100) + Realism/CloseUp/Turbo LoRAs +
`MiniMaxH3SigmaShift (12.0, 3.0)` to render 54 native 1344x768 @ 24fps audio-visual shots across
Night 5 Mirror Confrontation & Endings A / B / C(MIRROR) / D, stitched into 11 continuous
1280x720 H.264+AAC reels (~432s) + `n5_h3_manifest.json`.

Modes:
  --mode pilot   Render only 2 verification shots (`n5_mi_01`, `n5_ed_01`)
  --mode all     Resume & render all 54 shots (skips valid existing MP4 > 150 KB)
  --mode stitch  Stitch all 54 shots into 11 final 1280x720 reels + `n5_h3_manifest.json`
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
SHOTS_DIR = Path("/content/n5_h3_v1_shots")
FINAL_DIR = Path("/content/n5_h3_v1_final")
DRIVE_SHOTS_DIR = Path("/content/drive/MyDrive/gate0_n5_h3_v1_shots")
DRIVE_FINAL_DIR = Path("/content/drive/MyDrive/gate0_n5_h3_v1_final")
MANIFEST_NAME = "n5_h3_manifest.json"
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
    "n5_booth_red_blackout.jpg": f"{RAW_GH}/story/n5/n5_booth_red_blackout.jpg",
    "n5_mirror_closeup.jpg": f"{RAW_GH}/story/n5/n5_mirror_closeup.jpg",
    "operator09.jpg": f"{RAW_GH}/operator09.jpg",
    "chamber_purge.jpg": f"{RAW_GH}/reactions/chamber_purge.jpg",
    "ending_a_sub_escape.jpg": f"{RAW_GH}/story/ending_a_sub_escape.jpg",
    "ending_a_dawn_icebreak.jpg": f"{RAW_GH}/story/ending_a_dawn_icebreak.jpg",
    "ending_b_entombed_station.jpg": f"{RAW_GH}/story/ending_b_entombed_station.jpg",
    "ending_c_mirror_door.jpg": f"{RAW_GH}/story/ending_c_mirror_door.jpg",
    "ending_d_op09_tape.jpg": f"{RAW_GH}/story/ending_d_op09_tape.jpg",
    "ending_d_dawn_logbook.jpg": f"{RAW_GH}/story/ending_d_dawn_logbook.jpg",
}

STYLE = (
    "r34l1sm, Facial Realism, unretouched 35mm anamorphic cinema still, ARRI Alexa Mini LF, "
    "Kodak Vision3 500T film look, natural matte skin texture with fine pores, zero oily shine, "
    "no harsh specular highlights, grounded Hollywood Arctic sci-fi realism. No subtitles, no text overlays."
)


def make_shot(
    sid: str,
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
    # ================= 1. n5_blackout_approach (4 shots, 32s, isLipSync=False) =================
    make_shot(
        "n5_ba_01", "n5_blackout_approach", "n5_booth_red_blackout.jpg", 192, 0.0, 61101,
        "Inside Gate 0 watchbooth at the onset of Night 5 total blackout: green CRT monitors blink out and reboot into crimson emergency reserve power as pulsing red strobe beacons bathe the frosted steel desk and blast window.",
        "Heavy main grid power-down hum, emergency battery relay clack, steady crimson strobe pulse.",
        "第 5 夜 // 全站断电 · 应急红灯", "NIGHT 05 // RED BLACKOUT", "第5夜 // 全駅停電・非常灯",
        "第 5 夜极夜最深处，主电网彻底熄灭——零号岗亭切换至血红备用电源。",
        "Deepest Polar Night: the main grid dies, throwing Gate 0 onto crimson emergency backup power.",
        "第5夜・極夜の底。主電源が落ち、第0関門は血のような赤い非常電源へ切り替わる。",
    ),
    make_shot(
        "n5_ba_02", "n5_blackout_approach", "n5_booth_red_blackout.jpg", 192, 0.0, 61102,
        "Seamless push-in toward the frost-framed wire-reinforced blast pane under crimson emergency glow: howling -46C wind sweeps blinding snow past the exterior threshold, then a solitary hooded parka silhouette steps slowly out of the dark.",
        "Howling -46C blizzard wind against thick blast glass, slow crunching footsteps in deep snow.",
        "0号防爆窗外 // 孤独脚步声", "OUTER GLASS // FOOTSTEPS", "防爆窓外 // 近づく足音",
        "防爆窗外暴雪呼啸，一个穿着与你一模一样黑色防寒服与橙色 #09 臂章的身影缓缓走近……",
        "Through swirling -46C snow, a figure in your exact black parka and orange OP-09 patch walks slowly to the glass...",
        "吹雪の中から、君と全く同じ防寒着とオレンジの#09ワッペンを着た人影がゆっくりと歩み寄る……",
        chain_prev="n5_ba_01",
    ),
    make_shot(
        "n5_ba_03", "n5_blackout_approach", "operator09.jpg", 192, 0.40, 61103,
        "Chilling reverse POV looking through the frost-rimmed wire glass into the storm: your identical hooded double wearing the exact #09 parka raises one gloved hand and delivers three slow, deliberate knocks against the pane without blinking.",
        "Three slow hollow deliberate gloved knocks on reinforced glass (THUD... THUD... THUD...), icy wind.",
        "窗外替身 // 三记慢叩", "THE DOUBLE // THREE SLOW KNOCKS", "窓の外の影 // 3度のノック",
        "他抬手在防爆玻璃上不紧不慢地叩响三声——正应了前任 #08 磁带里那句遗言：「今夜两点，我在玻璃外看见了自己。」",
        "Three unhurried knocks rattle the glass—fulfilling #08's cassette prophecy: 'At 02:00 I saw myself outside.'",
        "ゆっくりと窓を3度叩く音——前任#08の遺言が蘇る。「今夜2時、ガラスの外に俺自身がいた。」",
    ),
    make_shot(
        "n5_ba_04", "n5_blackout_approach", "operator09.jpg", 192, 0.45, 61104,
        "Seamless slow push-in toward the motionless double standing outside the pane: frost clings to his eyelashes as an eerily calm, composed half-smile forms under the crimson booth reflection.",
        "Dead quiet tension beneath muffled wind, 60Hz ORD-OS biometric chime.",
        "ORD-OS // 生物特征 100% 重合", "ORD-OS // 100% BIOMETRIC MATCH", "ORD-OS // 生体一致率 100%",
        "屏幕弹出冷冰冰的绿字：「生物识别匹配度：#09（100%）」——连体温与左膝旧伤坐标都分毫不差。",
        "ORD-OS flashes cold telemetry: 'BIOMETRIC MATCH: OP #09 (100%)'—identical right down to your left-knee scar.",
        "画面に冷たく表示される——『生体一致：#09（100%）』。左膝の古傷まで寸分違わない。",
        chain_prev="n5_ba_03",
    ),

    # ================= 2. n5_mirror_interrogation (6 shots, 48s, isLipSync=True) =================
    make_shot(
        "n5_mi_01", "n5_mirror_interrogation", "n5_mirror_closeup.jpg", 192, 0.45, 61201,
        "Tight haunting close-up across Gate 0's wire-reinforced blast glass bathed in crimson emergency strobe and cold cyan snow reflection: the identical #09 double presses close to the speaker grille and recites your own intake oath calmly.",
        "Intercom click, eerie calm familiar male voice matching #09 speaking smoothly.",
        "窗外替身 #09 // 入职自述复唱", "DOUBLE #09 // INTAKE ECHO", "窓外の影 #09 // 入所宣誓の復唱",
        "「这是我入职时亲口说的话。这几夜我每一次都是这么做的。你呢？」",
        "\"That's what I said at intake. Every night since, that's what I did. Did you?\"",
        "「それが入所時に私が言った言葉だ。この数夜、私はその通りに動いた。お前はどうだ？」",
        spoken_mandarin="这是我入职时亲口说的话。这几夜我每一次都是这么做的。你呢？",
        dialogue_window=("00:00.40", "00:06.60"),
    ),
    make_shot(
        "n5_mi_02", "n5_mirror_interrogation", "n5_mirror_closeup.jpg", 192, 0.45, 61202,
        "Seamless continuation at the glass: when grilled on Night 2's serum ampoule, the double tilts his head calmly and answers in total textbook consistency with your Night 0 intake narrative.",
        "Quiet steady intercom hum, calm unblinking male voice.",
        "第 5 夜质询 [1] // 血清底账", "PROBE [1] // NIGHT 2 SERUM", "第5夜尋問 [1] // 第2夜血清",
        "「第 2 夜那支低温血清？我当然照入职自述的准则锁回急救盒——从入职第一天起我就没动摇过半句。」",
        "\"Night 2's serum? Just like my intake file says, I never wavered an inch from my stated principles.\"",
        "「第2夜の血清か？入所時の宣言通り、初日から一度も揺らいでいないさ。」",
        spoken_mandarin="第2夜那支低温血清？我当然照入职时亲口定下的准则处理——从第一天起就没动摇过半句。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n5_mi_01",
    ),
    make_shot(
        "n5_mi_03", "n5_mirror_interrogation", "n5_mirror_closeup.jpg", 192, 0.45, 61203,
        "Seamless continuation: answering Probe 2 (Deputy Holm's fuel bribe) and Probe 3 (Gate 0 shift logs), the double never blinks or stammers—performing a spotless, zero-crack persona.",
        "Cold quiet booth hum, eerily smooth rehearsed male cadence.",
        "第 5 夜质询 [2-3] // 燃料与日志", "PROBE [2-3] // FUEL & LOGS", "第5夜尋問 [2-3] // 燃料と日誌",
        "「霍尔姆的两罐燃料和整周开关闸日志，我都与入职第一天分毫不差——没有一页违背过自己。」",
        "\"Holm's fuel canisters and every shift log all match Day 1 to the letter—not a single page out of line.\"",
        "「ホルムの燃料も今週の日誌もすべて初日と寸分違わない——一頁の矛盾もないのだ。」",
        spoken_mandarin="霍尔姆的两罐燃料和整周开关闸日志，我都与入职第一天分毫不差，没有一页违背过自己。",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n5_mi_02",
    ),
    make_shot(
        "n5_mi_04", "n5_mirror_interrogation", "n5_mirror_closeup.jpg", 192, 0.45, 61204,
        "Seamless continuation: reciting static trivia and locker passcodes rapidly like a living tape recorder while leaning even closer to the wire mesh.",
        "Intercom slight feedback buzz, cold rapid precise male recitation.",
        "第 5 夜质询 [4] // 陈述性记忆陷阱", "PROBE [4] // TRIVIA TRAP", "第5夜尋問 [4] // 記憶の罠",
        "「识别码零九 SVB 二零三六，储物柜锁四七一九零八，左膝旧伤在特罗姆瑟冰架摔的——别拿记忆试探我！」",
        "\"Clearance #09-SVB-2036, locker dial 47-19-08, left-knee scar from Tromsø shelf—stop testing static trivia!\"",
        "「識別コード#09-SVB-2036、ロッカー47-19-08、左膝の古傷はトロムソ氷棚だ——知識クイズはやめろ！」",
        spoken_mandarin="识别码零九SVB二零三六，储物柜锁四七一九零八，左膝旧伤在特罗姆瑟冰架摔的！别拿记忆试探我！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n5_mi_03",
    ),
    make_shot(
        "n5_mi_05", "n5_mirror_interrogation", "operator09.jpg", 192, 0.40, 61205,
        "Reverse framing across the frost-framed window: as ORD-OS cross-checks your real DO telemetry (the serum, the bribe, the logged excuses), the double's calm mask freezes for half a beat.",
        "Sharp ORD-OS telemetry verification beep, low eerie sub-bass tension.",
        "ORD-OS // 言行差校验", "ORD-OS // SAY/DO AUDIT", "ORD-OS // 言行差照合",
        "「它只照你嘴上宣称过的体面（SAY）演戏，却猜不出活人在严寒高压下背叛诺言的裂痕（DO）。」",
        "\"It only performs your clean intake SAY—never the living human crack where you broke your own vow under pressure.\"",
        "「奴は入所時の綺麗な建前（SAY）しか演じられない——極限下で誓いを破る生身の裂け目（DO）を知らないのだ。」",
        spoken_mandarin="它只照你嘴上宣称过的体面演戏，却猜不出活人真疼时背叛诺言的裂痕。",
        dialogue_window=("00:00.40", "00:06.50"),
    ),
    make_shot(
        "n5_mi_06", "n5_mirror_interrogation", "n5_mirror_closeup.jpg", 192, 0.45, 61206,
        "Tight final frame on the identical face behind the frosted wire pane: staring directly into your reflection in the glass, the double challenges you coldly.",
        "Blizzard howl outside glass, hollow echoing male whisper.",
        "窗外替身 #09 // 镜像对峙", "DOUBLE #09 // MIRROR STARE", "窓外の影 #09 // 鏡像対峙",
        "「现在拿这几夜真正发生过的事来对质吧。或者说……你和我都一样完美？」",
        "\"Confront me with what actually happened this week—or did your actions match your words to zero percent?\"",
        "「今週実際に起きたことで私を論破してみろ……それとも、お前も私と同じく完璧なままか？」",
        spoken_mandarin="现在拿这几夜真正发生过的事来对质吧……或者说，你和我都一样完美？",
        dialogue_window=("00:00.40", "00:06.50"),
    ),

    # ================= 3. n5_four_doors_ultimatum (4 shots, 32s, isLipSync=True) =================
    make_shot(
        "n5_fd_01", "n5_four_doors_ultimatum", "n5_booth_red_blackout.jpg", 192, 0.0, 61301,
        "Inside the crimson-lit Gate 0 booth: ORD-OS terminal flashes four stark verdict locks across the console while the heavy thermal purge lever and outer hatch key gleam under red strobe light.",
        "Four rhythmic terminal lock chimes, heavy diesel sub-pump hum far below, tense silence.",
        "ORD-OS // 四道终局之门", "ORD-OS // FOUR FINAL DOORS", "ORD-OS // 4つの終局扉",
        "四道终局门在红色控制台上逐一点亮：认账登艇、让位入雪、零差同化、还是以人性的裂痕作证？",
        "Four final doors ignite across the red console: Own It, Step Out, Mirror, or Witness.",
        "赤い操作盤に4つの終局が灯る——引き受け、入れ替わり、鏡像、あるいは証人。",
    ),
    make_shot(
        "n5_fd_02", "n5_four_doors_ultimatum", "n5_mirror_closeup.jpg", 192, 0.45, 61302,
        "Close-up outside the glass: the hooded #09 double lays both gloved palms calmly against the frosted pane, speaking steadily into the intercom.",
        "Gloves pressing frost on glass, calm steady male voice.",
        "窗外替身 #09 // 最终逼问", "DOUBLE #09 // ULTIMATUM", "窓外の影 #09 // 最後の選択",
        "「鹦鹉螺零号六点解缆。离开还是留在这里的，今天只能有一个零九。」",
        "\"Nautilus-0 unmoors at 06:00. Only one Operator #09 leaves—or stays—today.\"",
        "「ノーチラス0号は6時に出航する。今日ここを去るのも残るのも、#09は一人だけだ。」",
        spoken_mandarin="鹦鹉螺零号六点解缆。离开还是留在这里的，今天只能有一个零九。",
        dialogue_window=("00:00.40", "00:06.50"),
    ),
    make_shot(
        "n5_fd_03", "n5_four_doors_ultimatum", "n5_mirror_closeup.jpg", 192, 0.45, 61303,
        "Seamless continuation: leaning closer so the crimson console glow reflects across both your faces separated only by armored glass, the double smiles faintly.",
        "Quiet wind howl, chilling serene male voice.",
        "窗外替身 #09", "DOUBLE #09", "窓外の影 #09",
        "「烧掉我、把席位让给我、还是打开门迎我进去？伸手拉闸吧。」",
        "\"Burn me, yield your seat to me, or unlatch the hydraulic door? Reach for the lever.\"",
        "「私を焼くか、席を譲るか、それとも扉を開けて迎え入れるか？レバーに手を伸ばせ。」",
        spoken_mandarin="烧掉我、把席位让给我，还是打开门迎我进去？伸手拉闸吧。",
        dialogue_window=("00:00.40", "00:06.50"),
        chain_prev="n5_fd_02",
    ),
    make_shot(
        "n5_fd_04", "n5_four_doors_ultimatum", "n5_booth_red_blackout.jpg", 192, 0.0, 61304,
        "Reverse wide inside Gate 0 booth: your gloved hand hovers over the heavy steel purge and airlock levers beneath red strobe glare as the double watches unblinkingly from beyond the glass.",
        "Heavy heartbeat thumping in silence, steel lever click readiness, crimson strobe.",
        "抉择时刻 // 拉响最终闸门", "FINAL CHOICE // PULL THE LEVER", "最後の決断 // レバーを引け",
        "你的手指悬在冰冷的钢制总闸上方——最后一夜的裁决，将决定谁被标为「人类」。",
        "Your hand hovers over cold steel—this final lever decides who ORD-OS marks HUMAN.",
        "冷たい鋼のレバーに手が伸びる——最後の裁定が、誰を「人間」とするかを決める。",
    ),

    # ================= 4. end_a_sub_breach (5 shots, 40s, isLipSync=True) =================
    make_shot(
        "n5_ea_01", "end_a_sub_breach", "chamber_purge.jpg", 192, 0.0, 62101,
        "Outcome A begins: Gate 0's thermal purge roar engulfs the vestibule behind blast glass in blinding 1,100C orange-white flame, incinerating the motionless flawless double.",
        "Deafening 1,100C thermal purge roar, heavy steel shutter lock, dying flames.",
        "结局 A · 认账 // 烧毁完美替身", "ENDING A // BURN THE DOUBLE", "結末 A // 影の焼却",
        "你拉下净化闸，千度烈焰在防爆玻璃后彻底吞没了那个毫无破绽的完美自己。",
        "You pull the purge lever; white-hot flames consume your flawless double behind the armored glass.",
        "焼却レバーを引き、完璧なもう一人の自分を白熱の炎で焼き払った。",
    ),
    make_shot(
        "n5_ea_02", "end_a_sub_breach", "ending_a_sub_escape.jpg", 192, 0.25, 62102,
        "Inside the dimly lit Nautilus-0 submarine boarding shaft: OP#09 sits briefly at the dock desk signing every real mistake, panic, and excuse into the shift logbook while armed security guards stand beside the glowing green sub hatch.",
        "Pen scratching quickly onto paper logbook, green boarding beacon chime, submarine ballast hiss.",
        "结局 A // 在日志写下全部误判", "ENDING A // LOGGING THE TRUTH", "結末 A // 告白日誌",
        "随后你在值班日志里一笔一划写下全部真实的误判、胆怯与借口，主动交出指挥权。",
        "Then you write every real misjudgement, panic, and excuse into the logbook and surrender command.",
        "そして日誌に本当の誤審も怯えも言い訳もすべて書き記し、自ら指揮権を返上した。",
    ),
    make_shot(
        "n5_ea_03", "end_a_sub_breach", "ending_a_sub_escape.jpg", 192, 0.35, 62103,
        "Seamless continuation at the submarine airlock gangway: as crew strip his rank insignia and escort him aboard under custody, OP#09 looks back toward the dock camera and speaks quietly.",
        "Heavy steel hatch clanging, hurried crew boots on wet deck, calm exhausted young male confession.",
        "值班员 #09 // 认账登艇", "OP #09 // IN CUSTODY", "当直官 #09 // 拘束乗艦",
        "「所有误判和借口都是我签的。收回我的指挥权吧——我以被羁押者的身份登艇。」",
        "\"Every misjudgement and excuse is mine. Strip my command—I'll board Nautilus-0 in custody.\"",
        "「誤審も言い訳も全部私の責任だ。指揮権を剥奪してくれ——拘束されたまま乗艦する。」",
        spoken_mandarin="所有误判和借口都是我签的！收回我的指挥权吧，我以被羁押者的身份登艇。",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="n5_ea_02",
    ),
    make_shot(
        "n5_ea_04", "end_a_sub_breach", "ending_a_sub_escape.jpg", 192, 0.20, 62104,
        "Seamless continuation: green boarding lamps pulse overhead as the bundled surviving crew and cuffed OP#09 hurry through the mist-filled Nautilus-0 pressure hatch.",
        "Hydraulic submarine pressure hatch wheel spinning shut, deep hull klaxon horn.",
        "鹦鹉螺 0 号 // 舱门封锁", "NAUTILUS-0 // HATCH SEALED", "ノーチラス0号 // ハッチ閉鎖",
        "绿灯闪烁下，幸存船员与被羁押的你一起冲进深海潜艇舱门，钢制水密盖轰然落锁。",
        "Beneath flashing green dock lamps, surviving crew and cuffed #09 rush through Nautilus-0's hatch as it seals tight.",
        "緑灯の点滅のもと、生存者と拘束された君が潜水艦へ駆け込み、水密ハッチが固く閉ざされた。",
        chain_prev="n5_ea_03",
    ),
    make_shot(
        "n5_ea_05", "end_a_sub_breach", "ending_a_sub_escape.jpg", 192, 0.15, 62105,
        "Final dock camera shot: massive black submarine mooring lines snap loose into icy black fjord water as Nautilus-0's diesel-electric screws churn away from the burning station dock.",
        "Thick mooring cables snapping into water, deep submarine propeller thrum pulling away.",
        "码头竖井 // 潜艇解缆", "SUB SHAFT // UNMOORED", "立坑ドック // 出航",
        "缆绳崩断，潜艇沉入冰海深处；ORD-OS 终端在彻底熄灭前跳出一行前所未有的新标记。",
        "Mooring cables drop away as the sub dives beneath pack ice; ORD-OS logs one unprecedented final tag.",
        "係留索が外れ、潜水艦が氷海へと潜航する——消えゆくORD-OSに、初めての新記録が灯った。",
        chain_prev="n5_ea_04",
    ),

    # ================= 5. end_a_polar_sunrise (5 shots, 40s, isLipSync=False) =================
    make_shot(
        "n5_eap_01", "end_a_polar_sunrise", "ending_a_dawn_icebreak.jpg", 192, 0.0, 62201,
        "Wide Svalbard open-sea icefield beneath dark pre-dawn indigo clouds: huge ten-meter sea ice slabs groan and bulge violently upward as a black submarine conning tower smashes through from beneath.",
        "Thunderous grinding ten-meter Arctic pack ice cracking, deep submarine hull breach.",
        "斯瓦尔巴外海 // 破冰浮航", "SVALBARD SEA // ICEBREAK", "スヴァールバル外海 // 砕氷浮上",
        "潜艇撞开十米厚的极地冰脊轰然破冰浮上水面——漫长的极夜终于迎来第一线晨光。",
        "Nautilus-0 smashes upward through ten meters of pack ice as four months of Polar Night break at dawn.",
        "ノーチラス0号が厚さ10メートルの氷嶺を突き破り浮上する——長い極夜に、最初の朝日が差し込む。",
    ),
    make_shot(
        "n5_eap_02", "end_a_polar_sunrise", "ending_a_dawn_icebreak.jpg", 192, 0.0, 62202,
        "Seamless continuation: blinding pale golden Arctic sunrise breaks directly over the jagged ice horizon, washing the streaming wet black conning tower in crisp 35mm golden rim light.",
        "Massive ice chunks splashing into freezing ocean swells, crisp howling dawn wind.",
        "结局 A · 认账 // 极昼初阳", "ENDING A // POLAR SUNRISE", "結末 A // 極昼の朝日",
        "金色朝阳刺破冰原尽头，远方斯瓦尔巴零号前哨站化作一缕翻涌黑烟。",
        "Blinding golden sunrise cuts across the ice sheet as distant Outpost 0 dwindles into dark smoke.",
        "黄金の朝日が氷原を照らし、遠く第0前哨基地は一筋の黒煙となって消えていく。",
        chain_prev="n5_eap_01",
    ),
    make_shot(
        "n5_eap_03", "end_a_polar_sunrise", "ending_a_dawn_icebreak.jpg", 192, 0.0, 62203,
        "Seamless slow crane lift pulling slightly wider over the steaming black submarine hull resting among shattered blue ice floes while distant horizon smoke curls skyward.",
        "Calm icy waves lapping steel hull, quiet distant wind over broken ice.",
        "结局 A // 失去指挥权 · 留住人性", "ENDING A // OWNING IT", "結末 A // 引き受け",
        "你失去了指挥权与体面履历，但把真实的自己从死循环里拽了出来。",
        "You lost your rank and spotless record—and dragged your real self out of the loop.",
        "指揮権も綺麗な経歴も失った。だが君は、本当の自分を死の連鎖から救い出した。",
        chain_prev="n5_eap_02",
    ),
    make_shot(
        "n5_eap_04", "end_a_polar_sunrise", "ending_a_dawn_icebreak.jpg", 192, 0.0, 62204,
        "Seamless continuation: glowing warm sunlight glints off frost crystals along the sub's upper railing as the distant Outpost 0 ridge disappears behind drifting morning sea mist.",
        "Soft hull creaks, clean morning Arctic breeze, quiet single green ORD-OS confirmation chime.",
        "ORD-OS // 首次标定", "ORD-OS // FINAL TAG", "ORD-OS // 最終判定",
        "在全部认账笔录归档的那一刻，ORD-OS 第一次将操作员 #09 标记为——「人类」。",
        "As your full confession archives, ORD-OS finally marks Operator #09: HUMAN.",
        "全ての告白が記録された瞬間、ORD-OSは初めて検疫官#09をこう標記した——「人間」。",
        chain_prev="n5_eap_03",
    ),
    make_shot(
        "n5_eap_05", "end_a_polar_sunrise", "ending_a_dawn_icebreak.jpg", 192, 0.0, 62205,
        "Final lingering wide frame over sunlit open Arctic water and shattered pack ice drifting smoothly southward toward Tromsø.",
        "Steady ocean swell, quiet dawn wind fading cleanly.",
        "剧终 · 结局 A // 认账 · 人类身份确认", "FINALE · ENDING A // TAGGED HUMAN", "終幕 · 結末 A // 「人間」認証",
        "剧终 · 结局 A 《认账 // 黎明破冰》",
        "THE END · ENDING A: OWNING IT",
        "終幕 · 結末 A「引き受けと砕氷」",
        chain_prev="n5_eap_04",
    ),

    # ================= 6. end_b_purge_blast (5 shots, 40s, isLipSync=False) =================
    make_shot(
        "n5_eb_01", "end_b_purge_blast", "chamber_purge.jpg", 192, 0.0, 62301,
        "Inside Gate 0 vestibule observation glass: the last dying orange embers of the containment furnace flicker out across scorched black steel while crimson emergency lights settle steady.",
        "Dying thermal jet hiss, hot blackened steel cooling clicks, low station hum.",
        "结局 B · 替身 // 炉火熄灭", "ENDING B // FURNACE COOLS", "結末 B // 炉火の終焉",
        "炉膛火光最后一次闪灭，你选择相信窗外那个更体面、更稳定的自己。",
        "Furnace glow fades one last time as you choose to trust the steadier, cleaner version of yourself outside.",
        "炉の炎が最後に消え、君は窓の外の「より完璧で安定した自分」を信じる道を選んだ。",
    ),
    make_shot(
        "n5_eb_02", "end_b_purge_blast", "n5_booth_red_blackout.jpg", 192, 0.0, 62302,
        "Inside the dim crimson-lit watchbooth: OP#09 unclips the heavy steel Gate 0 master key from his lanyard, sets it neatly beside the blank open shift logbook, and steps back from the console.",
        "Heavy steel gate key clinking neatly onto metal desk, chair sliding quietly back.",
        "0号岗亭 // 放下钥匙", "GATE 0 // KEY SURRENDERED", "第0関門 // 鍵の放棄",
        "你摘下冰冷的钢制门闸密钥，整齐压在值班日志旁，转身拉开外侧风闸。",
        "You set the cold steel gate key neatly beside the logbook and walk out toward the outer storm hatch.",
        "冷たい鋼の鍵を日誌の横に静かに置き、君は外扉へ向かって歩き出した。",
    ),
    make_shot(
        "n5_eb_03", "end_b_purge_blast", "n5_booth_red_blackout.jpg", 192, 0.0, 62303,
        "Seamless continuation from inside the booth: through the frosted blast glass, your dark silhouette walks steadily away into the blinding -46C blizzard while the identical double steps calmly up to take the chair.",
        "Outer airlock hatch swinging shut against roaring gale, calm footsteps inside booth.",
        "0号岗亭 // 替身坐上椅子", "GATE 0 // REPLACED", "第0関門 // 入れ替わり",
        "外闸重重合上。你步入零下四十六度暴风雪，将工位彻底留给了毫无破绽的替身。",
        "The outer hatch shuts behind you in -46C snow, leaving Gate 0's chair to your flawless double.",
        "外扉が閉ざされる。氷点下46度の吹雪へ歩み出た君の代わりに、完璧な影が席に座る。",
        chain_prev="n5_eb_02",
    ),
    make_shot(
        "n5_eb_04", "end_b_purge_blast", "n5_booth_red_blackout.jpg", 192, 0.0, 62304,
        "Seamless slow push onto the green ORD-OS screen glowing quietly beside the clean logbook: a steady hand clicks the key onto the console without a tremor.",
        "Crisp calm key press, steady 60Hz CRT hum, muffled blizzard outside.",
        "ORD-OS // 吻合度 100%", "ORD-OS // 100% INTAKE MATCH", "ORD-OS // 一致率 100%",
        "第二天的值班日志字迹工整、无可挑剔——ORD-OS 记录：操作员 #09，与入职自述吻合度 100%。",
        "Tomorrow's shift log is neat and flawless. ORD-OS records: Operator #09, 100% intake match.",
        "翌日の日誌は一点の曇りもなく整っていた。ORD-OS記録：検疫官#09、一致率100%。",
        chain_prev="n5_eb_03",
    ),
    make_shot(
        "n5_eb_05", "end_b_purge_blast", "n5_booth_red_blackout.jpg", 192, 0.0, 62305,
        "Final cold frame inside the empty crimson-lit booth looking out at empty white blizzard swirling over the frosted glass as all footprints vanish.",
        "Rising howling blizzard wind drowning out quiet booth hum.",
        "0号岗亭 // 永封", "GATE 0 // SEALED", "第0関門 // 永封",
        "再也没有任何裂痕会打扰这座前哨站的秩序了。",
        "No human flaw will ever disturb Outpost 0's ledger again.",
        "二度と人間の綻びが、この基地の記録を乱すことはない。",
        chain_prev="n5_eb_04",
    ),

    # ================= 7. end_b_frozen_station (5 shots, 40s, isLipSync=False) =================
    make_shot(
        "n5_ebs_01", "end_b_frozen_station", "ending_b_entombed_station.jpg", 192, 0.0, 62401,
        "Wide exterior Arctic wasteland shot of Svalbard Outpost 0 buried deep under towering snowdrifts in blue-black polar gale: faint single footprints trail away from Gate 0 into blinding snow.",
        "Howling endless polar blizzard gale, ice crystals sandblasting steel siding.",
        "斯瓦尔巴零号站 // 极夜冰封", "OUTPOST 0 // ENTOMBED", "第0基地 // 氷封",
        "狂风卷起数米深的雪墙，迅速抹平了门外最后一行走向黑暗的脚印。",
        "Roaring drifts swallow the last row of footprints trailing outward into polar dark.",
        "吹き荒れる雪壁が、闇へと消えた最後の足跡を瞬く間に覆い隠す。",
    ),
    make_shot(
        "n5_ebs_02", "end_b_frozen_station", "ending_b_entombed_station.jpg", 192, 0.0, 62402,
        "Seamless slow pullback across the buried steel station dome: exterior warning strobes dim and freeze over beneath mounting pale-blue ice crusts.",
        "Deep groaning frozen steel superstructure, relentless Arctic wind.",
        "结局 B · 替身 // 彻底掩埋", "ENDING B // BURIED IN ICE", "結末 B // 永久凍結",
        "整座前哨站连同所有曾挣扎过的秘密，一起沉入死寂的永冻冰层之下。",
        "Outpost 0 sinks beneath frozen silence—taking every messy human trace with it.",
        "前哨基地はすべての人間の痕跡ごと、静寂の永久凍土へ沈みゆく。",
        chain_prev="n5_ebs_01",
    ),
    make_shot(
        "n5_ebs_03", "end_b_frozen_station", "ending_b_entombed_station.jpg", 192, 0.0, 62403,
        "Seamless continuation: drifting snow sweeps cleanly over the buried Gate 0 roof hatch until no door seam remains visible above the white ridge.",
        "Steady rushing spindrift snow hiss, hollow polar cold.",
        "档案归档 // 零瑕疵日志", "ARCHIVE // FLAWLESS LOG", "記録閉鎖 // 完璧な日誌",
        "明早的自动化电传将准时发出——全站无异常、全员无违纪、零号岗亭完美履职。",
        "Tomorrow's automated telex will read clean: zero anomalies, zero disobedience, spotless compliance.",
        "明朝の定時電文は完璧な報告を送るだろう——異常ゼロ、違反ゼロ、完璧な規律遵守。",
        chain_prev="n5_ebs_02",
    ),
    make_shot(
        "n5_ebs_04", "end_b_frozen_station", "ending_b_entombed_station.jpg", 192, 0.0, 62404,
        "Seamless continuation: the last faint orange watch-booth window pinpoint flickers once behind thickening blowing snow and disappears into solid ice-blue darkness.",
        "Wind dying slightly into vast dead Polar Night stillness.",
        "极夜档案 // 结局 B · 替身", "ARCHIVE CLOSED // ENDING B", "記録閉鎖 // 結末 B",
        "当一个替身比你更像「你口中的自己」，谁还需要那个会犯错的真人？",
        "When a double performs your ideals cleaner than you ever could, who needs the flawed original?",
        "偽物が君の理想を君以上に完璧に演じるなら、過ちを犯す生身の人間など誰も必要としない。",
        chain_prev="n5_ebs_03",
    ),
    make_shot(
        "n5_ebs_05", "end_b_frozen_station", "ending_b_entombed_station.jpg", 192, 0.0, 62405,
        "Final wide static shot of the snow-entombed Svalbard outpost under cold polar starlight as wind sweeps smooth undisturbed snow across the ridge.",
        "Cold desolate wind fading to quiet void.",
        "剧终 · 结局 B // 替身 · 极夜永封", "FINALE · ENDING B // REPLACED", "終幕 · 結末 B // 入れ替わり",
        "剧终 · 结局 B 《替身 // 极夜永封》",
        "THE END · ENDING B: REPLACED",
        "終幕 · 結末 B「入れ替わりと氷封」",
        chain_prev="n5_ebs_04",
    ),

    # ================= 8. end_c_shadow (5 shots, 40s, isLipSync=False) =================
    make_shot(
        "n5_ec_01", "end_c_shadow", "ending_c_mirror_door.jpg", 192, 0.0, 62501,
        "Inside Gate 0 booth facing the heavy hydraulic airlock door: no siren, no red alarm—ORD-OS emits a soft neutral chime as the motorized bolts retract smoothly on their own.",
        "Soft neutral ORD-OS chime, heavy motorized hydraulic bolts sliding smoothly open without alarm.",
        "无名结局 · 镜像 // 气闸自动开启", "MIRROR // HYDRAULIC UNLATCH", "鏡像 // 自動解錠",
        "你这几夜的言行差是 0%。ORD-OS 无法分辨你与门外的人——最后一道液压门悄然滑开。",
        "Zero percent say/do gap. Unable to tell you apart from the double, ORD-OS smoothly slides the hydraulic door open.",
        "言行不一致0%。君と外の存在を区別できないORD-OSは、警報もなく油圧扉を滑らかに開いた。",
    ),
    make_shot(
        "n5_ec_02", "end_c_shadow", "ending_c_mirror_door.jpg", 192, 0.0, 62502,
        "Seamless continuation: dense freezing white polar vapor rolls inward across the steel console and floor grating as the massive blast door slides halfway open.",
        "Heavy pneumatic door slide, freezing white mist hissing over steel console.",
        "0号岗亭 // 刺骨白雾翻涌", "GATE 0 // FREEZING MIST", "第0関門 // 冷気流入",
        "刺骨白雾翻过控制台，绿灯与红灯同时在玻璃上投出重叠的两道影子。",
        "Freezing white mist pours across the console as green and red indicators cast overlapping reflections.",
        "凍てつく白霧が操作盤を飲み込み、緑と赤のランプが二重の影を映し出す。",
        chain_prev="n5_ec_01",
    ),
    make_shot(
        "n5_ec_03", "end_c_shadow", "ending_c_mirror_door.jpg", 192, 0.0, 62503,
        "Seamless continuation: stepping calmly out of the white freezing fog across the threshold walks a hooded #09 parka figure—posture, stride, and orange patch identical to your own.",
        "Calm slow measured boot steps crossing steel threshold, quiet frost crunch.",
        "0号岗亭 // 另一个 #09 步入", "GATE 0 // DOUBLE ENTERS", "第0関門 // 影の侵入",
        "穿着 #09 防寒服、挂着一模一样微笑的自己正迈步走进岗亭，站在你身旁。",
        "Wearing your exact OP#09 parka and calm smile, your double steps smoothly across the threshold beside you.",
        "同じ#09の防寒着と静かな微笑みを浮かべた「もう一人の自分」が、閾を跨いで隣に立つ。",
        chain_prev="n5_ec_02",
    ),
    make_shot(
        "n5_ec_04", "end_c_shadow", "ending_c_mirror_door.jpg", 192, 0.0, 62504,
        "Seamless continuation: the newcomer sets one frost-dusted gloved hand lightly onto the console right beside yours without hostility or haste.",
        "Soft gloved tap beside logbook, eerie quiet 60Hz CRT drone.",
        "零言行差 // 双生并立", "0% GAP // SIDE BY SIDE", "言行差0% // 二人の#09",
        "没有冲突，没有尖叫——就像照进镜子里的那一刻，门内外终于合为一体。",
        "No struggle, no scream—like stepping through glass, inside and outside merge seamlessly.",
        "争いも悲鳴もない——鏡の中へ踏み込むように、扉の内と外が一つに溶け合う。",
        chain_prev="n5_ec_03",
    ),
    make_shot(
        "n5_ec_05", "end_c_shadow", "ending_c_mirror_door.jpg", 192, 0.0, 62505,
        "Final cold frame as the heavy hydraulic shutter drops shut behind the doorway, sealing both identical #09 figures inside the white mist.",
        "Heavy steel shutter dropping shut with booming finality.",
        "0号岗亭 // 闸落", "GATE 0 // SHUTTER DROPS", "第0関門 // 隔壁閉鎖",
        "当最后一道闸门落下时，屋里究竟只剩下哪一个？",
        "As the final shutter drops, which one remains inside?",
        "最後のシャッターが降りた時、室内に残ったのはどちらだったのか？",
        chain_prev="n5_ec_04",
    ),

    # ================= 9. end_c_mirror_face (5 shots, 40s, isLipSync=True) =================
    make_shot(
        "n5_ecm_01", "end_c_mirror_face", "operator09.jpg", 192, 0.45, 62601,
        "Close subjective shot facing your reflection across the frost-coated booth glass: the hooded #09 figure leans steadily forward, calm smile unchanged, speaking in your exact voice.",
        "Quiet eerie echo, calm unnervingly identical male voice.",
        "值班员 #09 // 镜像回响", "OP #09 // MIRROR VOICE", "当直官 #09 // 鏡像の声",
        "「这几夜你做的，和你入职时嘴上说的，分毫不差。」",
        "\"Every night since intake, what you did matched what you said, to zero percent.\"",
        "「この数夜、お前の行動は入所時の言葉と寸分違わなかった。」",
        spoken_mandarin="这几夜你做的，和你入职时嘴上说的，分毫不差。",
        dialogue_window=("00:00.40", "00:06.20"),
    ),
    make_shot(
        "n5_ecm_02", "end_c_mirror_face", "operator09.jpg", 192, 0.45, 62602,
        "Seamless continuation: tilting his head slightly in exact symmetry, the smiling double whispers calmly as green CRT scanlines reflect across his pupils.",
        "60Hz CRT hum, soft chilling identical male whisper.",
        "镜像 // ORD-OS 无法分辨", "MIRROR // INDISTINGUISHABLE", "鏡像 // 判別不能",
        "「ORD-OS 已经无法分辨，屋里坐着的是你，还是我了。」",
        "\"ORD-OS can no longer distinguish whether it's you or me sitting in that chair.\"",
        "「ORD-OSにはもう、椅子に座っているのがお前か私か区別できないんだよ。」",
        spoken_mandarin="ORDOS已经无法分辨，屋里坐着的是你，还是我了。",
        dialogue_window=("00:00.40", "00:06.50"),
        chain_prev="n5_ecm_01",
    ),
    make_shot(
        "n5_ecm_03", "end_c_mirror_face", "n5_mirror_closeup.jpg", 192, 0.50, 62603,
        "Extreme close-up on the eyes and lips pressed right against the frosted divider glass: zero blink, zero hesitation, speaking softly as frost crystallizes along the corner of the frame.",
        "Frost crystal crackle, haunting calm male voice.",
        "无名结局 · 镜像 // 双生", "UNNAMED // MIRROR", "無題の結末 // 鏡像",
        "「那么请问——今晚的值班日志，你打算怎么写下最后一栏？」",
        "\"So tell me—how will you write the final line of tonight's log?\"",
        "「さあ教えてくれ——今夜の日誌の最後の行は、どう書き記すつもりだ？」",
        spoken_mandarin="那么请问，今晚的值班日志，你打算怎么写下最后一栏？",
        dialogue_window=("00:00.40", "00:06.60"),
    ),
    make_shot(
        "n5_ecm_04", "end_c_mirror_face", "n5_mirror_closeup.jpg", 192, 0.45, 62604,
        "Seamless continuation: the crimson and emerald indicator lights slowly blink out one by one across the mirrored face until only faint frost-blue glow illuminates the eyes.",
        "Power relays clicking off one by one, hollow silence.",
        "闸门落下 // 谁被烧掉", "SHUTTER DOWN // WHO BURNED", "シャッター降下 // 残った者",
        "当最后一道闸门落下时，连你自己也分不清究竟哪一个才是真正留下来的那个人。",
        "As the final shutter drops, even you no longer know which reflection burned and which walked away.",
        "最後のシャッターが落ちた瞬間、焼かれたのがどちらの自分かもう分からない。",
        chain_prev="n5_ecm_03",
    ),
    make_shot(
        "n5_ecm_05", "end_c_mirror_face", "n5_mirror_closeup.jpg", 192, 0.40, 62605,
        "Final haunting shot: the #09 silhouette holds motionless in fading blue dark glass reflection until the booth screen cuts cleanly to black.",
        "Single final analog tape click, total silence.",
        "无名结局 · 镜像 // MIRROR", "UNNAMED ENDING // MIRROR", "無題の結末 // 鏡像",
        "无名结局 · 《镜像 // MIRROR》",
        "UNNAMED ENDING · MIRROR (0% SAY/DO GAP)",
        "無題の結末 · 「鏡像 // MIRROR」",
        chain_prev="n5_ecm_04",
    ),

    # ================= 10. end_d_camcorder (5 shots, 40s, isLipSync=True) =================
    make_shot(
        "n5_ed_01", "end_d_camcorder", "ending_d_op09_tape.jpg", 192, 0.35, 62701,
        "Inside Gate 0 booth as pale morning dawn begins filtering past the frosted blast glass: OP#09 stares stunned at the unlocked classified telex [ORD-REDACTED-00] on the CRT screen ('Nautilus-0 carries 35% berths; pre-rank expendable #09s to hold Gate 0').",
        "Crisp telex decryption chime, stunned sharp intake breath, 60Hz CRT hum.",
        "结局 D · 证人 // 解锁绝密电传", "ENDING D // DECLASSIFIED TELEX", "結末 D // 機密電文解錠",
        "零误判！你凭言行差驳倒了替身，却解锁了董事会绝密电传：原来 #09 从一开始就是被算法选中的「可牺牲弃子」。",
        "Zero errors! Your human gap beat the double—and unlocked Command Telex ORD-REDACTED-00: #09 was pre-selected to be sealed behind.",
        "誤審ゼロ！言行不一致で影を論破した君は、極秘電文を解錠した——#09は最初から『切り捨て要員』として選ばれていたのだ。",
    ),
    make_shot(
        "n5_ed_02", "end_d_camcorder", "ending_d_op09_tape.jpg", 192, 0.40, 62702,
        "Seamless continuation: swallowing hard with grim resolve, OP#09 reaches down beside the telex printout, snaps a blank black cassette into the desktop camcorder recorder, and presses the glowing red REC switch firmly.",
        "Sharp mechanical cassette snap and red REC button click, analog tape hiss starting.",
        "值班员 #09 // 按下录像键", "OP #09 // HITTING REC", "当直官 #09 // 録画開始",
        "你没有走，而是坐在控制台前亲手按下了录像键——把那句用五夜换来的真话录给下一班。",
        "You stay at the console, snap a cassette into the deck, and hit REC to warn the next watchstander.",
        "君は操作盤の前に留まり、五夜をかけて辿り着いた真実を次の当直官へ残すため録画ボタンを押す。",
        chain_prev="n5_ed_01",
    ),
    make_shot(
        "n5_ed_03", "end_d_camcorder", "ending_d_op09_tape.jpg", 192, 0.45, 62703,
        "Direct seamless continuation speaking squarely into the glowing red camcorder lens and wired mic: weary, unshaven, scarred but steady, OP#09 delivers his urgent witness warning clearly.",
        "Analog camcorder tape flutter, steady weathered sincere young male voice.",
        "值班员 #09 // 结局 D 遗言录像", "OP #09 // WITNESS TAPE", "当直官 #09 // 証言録画",
        "「听好，十号：记住，真人会怕、会偏心、会认错；越是完美得像教科书的，越不是人。」",
        "\"Listen, #10: real humans feel fear, play favorites, and admit mistakes. Anything textbook-perfect isn't human.\"",
        "「よく聞け、#10。生身の人間は恐れ、迷い、過ちを認める。教科書通りに完璧すぎる奴ほど、人間じゃない。」",
        spoken_mandarin="听好十号！记住：真人会怕、会偏心、会认错；越是完美得像教科书的，越不是人！",
        dialogue_window=("00:00.40", "00:07.00"),
        chain_prev="n5_ed_02",
    ),
    make_shot(
        "n5_ed_04", "end_d_camcorder", "ending_d_op09_tape.jpg", 192, 0.45, 62704,
        "Seamless continuation into the red-lit camcorder lens: leaning closer so the morning light catches his steady eyes, OP#09 exposes the Board's algorithm trap cleanly.",
        "Analog cassette hiss, earnest calm determined young male voice.",
        "值班员 #09 // 揭穿弃子算法", "OP #09 // BOARD TRAP", "当直官 #09 // 計画の暴露",
        "「潜艇只装得下三成半。他们用系统挑听话的死守岗亭——别信那张调令，看清活人的裂痕！」",
        "\"The sub only fits thirty-five percent. Command used ORD-OS to pick obedient sacrifices—trust the human cracks!\"",
        "「潜水艦の定員は35%だけだ。上層部はシステムで従順な生贄を選んでいた——人間の綻びを信じろ！」",
        spoken_mandarin="潜艇只装得下三成半！他们用系统挑听话的死守岗亭。别信那张调令，看清活人的裂痕！",
        dialogue_window=("00:00.40", "00:07.00"),
        chain_prev="n5_ed_03",
    ),
    make_shot(
        "n5_ed_05", "end_d_camcorder", "ending_d_op09_tape.jpg", 192, 0.35, 62705,
        "Seamless continuation: OP#09 presses the mechanical STOP button firmly, ejects the black cassette with a crisp click, and holds it briefly beside the classified telex.",
        "Loud mechanical cassette STOP & eject clunk, quiet morning booth hum.",
        "值班员 #09 // 退带存证", "OP #09 // TAPE EJECTED", "当直官 #09 // テープ取り出し",
        "咔哒一声退带弹出。真话已经刻进磁条，再也抹不掉了。",
        "Cassette ejects with a crisp clunk—the truth is etched onto magnetic tape where no board can scrub it.",
        "カセットが弾き出される。真実は磁気テープに刻まれ、もはや誰にも消せない。",
        chain_prev="n5_ed_04",
    ),

    # ================= 11. end_d_sunrise (5 shots, 40s, isLipSync=False) =================
    make_shot(
        "n5_eds_01", "end_d_sunrise", "ending_d_dawn_logbook.jpg", 192, 0.0, 62801,
        "Close cinematic desk shot inside Gate 0 at dawn: pale golden polar sunlight streams across frosted blast glass, illuminating the battered leather Logbook #10 and the red-stamped [ORD-REDACTED-00] Board telex printout.",
        "Calm morning Polar wind softly humming outside frost glass, quiet settled desk stillness.",
        "黎明破晓 // 《10 号值班日志》", "DAWN // LOGBOOK #10", "夜明け // 当直日誌10号",
        "浅金晨光终于切开四个月极夜，照进霜窗，落在《10 号值班日志》与绝密电传打印件上。",
        "Pale golden sunrise cuts through frosted glass onto Logbook #10 and the declassified Board telex.",
        "淡い朝日が霜窓を貫き、『第10当直日誌』と解錠された機密電文を照らし出す。",
    ),
    make_shot(
        "n5_eds_02", "end_d_sunrise", "ending_d_dawn_logbook.jpg", 192, 0.0, 62802,
        "Seamless continuation: OP#09's scarred gloved hand reaches into frame and sets the hand-labeled black witness cassette squarely atop the open logbook and classified telex.",
        "Soft solid cassette clack onto paper logbook, gentle breeze sigh.",
        "结局 D · 证人 // 压上遗言磁带", "ENDING D // WITNESS TAPE", "結末 D // 証言テープ",
        "你把亲手录下的黑色磁带稳稳压在绝密电传之上——留给下一位坐上这张椅子的人。",
        "You set the witness cassette squarely over the classified telex for whoever takes this chair next.",
        "君は自ら録画した黒いカセットを機密電文の上に置いた——次にこの椅子へ座る者のために。",
        chain_prev="n5_eds_01",
    ),
    make_shot(
        "n5_eds_03", "end_d_sunrise", "ending_d_dawn_logbook.jpg", 192, 0.0, 62803,
        "Seamless slow push-in toward the cassette label and sunlit frost patterns melting faintly along the lower steel window frame.",
        "Single drop of melted window frost hitting steel sill, quiet dawn calm.",
        "ORD-REDACTED-00 // 真相留存", "ORD-REDACTED-00 // PRESERVED", "最高機密 // 真実の保全",
        "前任 #08 留给你一盘黄胶布磁带；如今，你成了把火种传给 #10 的证人。",
        "#08 left a yellow-taped cassette for you; now you stand as witness passing the truth to #10.",
        "前任#08が君に黄色いテープのカセットを遺したように、今度は君が#10への証人となる。",
        chain_prev="n5_eds_02",
    ),
    make_shot(
        "n5_eds_04", "end_d_sunrise", "ending_d_dawn_logbook.jpg", 192, 0.0, 62804,
        "Seamless slow pull-back framing the empty watchstander chair bathed in warm golden-blue morning light facing the quiet storm window.",
        "Distant calm helicopter or sea wind echo over Polar horizon, peaceful stillness.",
        "结局 D · 证人 // 等待下一班", "ENDING D // NEXT WATCH", "結末 D // 次の交代者へ",
        "阳光照亮整张冷硬的钢桌，静静等待下一位值班员拉开椅子坐下。",
        "Morning light warms the cold steel console, waiting quietly for the next operator to take the chair.",
        "朝日が冷たい鋼の机を照らし、次の当直官が椅子を引いて座る時を静かに待っている。",
        chain_prev="n5_eds_03",
    ),
    make_shot(
        "n5_eds_05", "end_d_sunrise", "ending_d_dawn_logbook.jpg", 192, 0.0, 62805,
        "Final lingering sunlit cinema frame on Logbook #10, the black witness cassette, and the golden Polar dawn outside Gate 0.",
        "Clean serene morning polar wind fading gently.",
        "剧终 · 结局 D // 证人 · 零号遗言", "FINALE · ENDING D // WITNESS", "終幕 · 結末 D // 証人",
        "剧终 · 结局 D 《证人 // 零号遗言》",
        "THE END · ENDING D: WITNESS",
        "終幕 · 結末 D「証人と遺言」",
        chain_prev="n5_eds_04",
    ),
]

REEL_FADES: dict[str, tuple[float, float]] = {
    "n5_blackout_approach": (0.75, 0.35),
    "n5_mirror_interrogation": (0.35, 0.0),
    "n5_four_doors_ultimatum": (0.0, 0.70),
    "end_a_sub_breach": (0.70, 0.45),
    "end_a_polar_sunrise": (0.45, 0.90),
    "end_b_purge_blast": (0.70, 0.45),
    "end_b_frozen_station": (0.45, 0.90),
    "end_c_shadow": (0.70, 0.45),
    "end_c_mirror_face": (0.45, 0.90),
    "end_d_camcorder": (0.70, 0.45),
    "end_d_sunrise": (0.45, 0.90),
}

REEL_ORDER = [
    "n5_blackout_approach",
    "n5_mirror_interrogation",
    "n5_four_doors_ultimatum",
    "end_a_sub_breach",
    "end_a_polar_sunrise",
    "end_b_purge_blast",
    "end_b_frozen_station",
    "end_c_shadow",
    "end_c_mirror_face",
    "end_d_camcorder",
    "end_d_sunrise",
]

PILOT_SHOT_IDS = {"n5_mi_01", "n5_ed_01"}


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


def fetch_inputs() -> None:
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    SHOTS_DIR.mkdir(parents=True, exist_ok=True)
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    raw_dir = Path("/content/n5_raw_inputs")
    raw_dir.mkdir(parents=True, exist_ok=True)

    for fname, url in IMAGES.items():
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


def setup_env() -> tuple[str, float, int, str, list[str]]:
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
        Path("/tmp/hf_n5_h3.txt").write_text("".join(aria_lines))
        sh(
            "aria2c -i /tmp/hf_n5_h3.txt -j 6 -x 16 -s 16 -k 16M "
            "--file-allocation=none --continue=true --console-log-level=error --summary-interval=10"
        )

    fetch_inputs()
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
            "filename_prefix": f"n5_h3_{shot['id']}",
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
            candidates = sorted(OUTPUT_DIR.rglob(f"n5_h3_{shot_id}*.mp4"), key=lambda p: p.stat().st_mtime)
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


def run_render(pilot_only: bool) -> None:
    _, _, vram_mb, clip_filename, comfy_flags = setup_env()
    obj_info = ensure_comfyui(comfy_flags)
    targets = [s for s in SHOTS if (not pilot_only or s["id"] in PILOT_SHOT_IDS)]
    print(f"=== [4/4] Rendering {len(targets)} MiniMax-H3 N5 Shots (pilot={pilot_only}) ===", flush=True)
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
    print("PILOT_DONE" if pilot_only else f"ALL_{len(SHOTS)}_SHOTS_DONE", flush=True)


def stitch_reels() -> None:
    shot_reels = {s["reel"] for s in SHOTS}
    assert shot_reels == set(REEL_ORDER), f"Orphaned reel(s): {shot_reels - set(REEL_ORDER)}"

    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    posters_dir = FINAL_DIR / "posters"
    posters_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}
    tmp_dir = Path("/tmp/n5_stitch_tmp")
    shutil.rmtree(tmp_dir, ignore_errors=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    total_sec = 0.0
    for reel_id in REEL_ORDER:
        reel_shots = [s for s in SHOTS if s["reel"] == reel_id]
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

    man_path = FINAL_DIR / MANIFEST_NAME
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
    args = parser.parse_args()
    if args.mode == "pilot":
        run_render(pilot_only=True)
    elif args.mode == "all":
        run_render(pilot_only=False)
    else:
        stitch_reels()


if __name__ == "__main__":
    main()
