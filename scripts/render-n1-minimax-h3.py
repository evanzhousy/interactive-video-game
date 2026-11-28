#!/usr/bin/env python3
"""
Colab GPU Live-Action AI Cinema Renderer & Stitcher for Stage 1 / Night 1 (`Quarantine Gate 0: 2036`).

Uses MiniMax-H3 `fl2va` (`minimax_h3_fl2va_pruned_fp8_scaled.safetensors`) + `Qwen3-VL-32B-Heretic`
(auto NVFP4 on Blackwell cc>=10 vs INT8 ConvRot on H100/A100) + Realism/CloseUp/Turbo LoRAs +
`MiniMaxH3SigmaShift (12.0, 3.0)` to render 52 native 1344x768 @ 24fps audio-visual shots,
stitched into 14 continuous 1280x720 H.264+AAC reels (~428s) + `n1_h3_manifest.json`.

Modes:
  --mode pilot   Render only 2 verification shots (`n1_ek_02`, `n1_la_01`)
  --mode all     Resume & render all 52 shots (skips valid existing MP4 > 150 KB)
  --mode stitch  Stitch all 52 shots into 14 final 1280x720 reels + `n1_h3_manifest.json`
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
SHOTS_DIR = Path("/content/n1_h3_v1_shots")
FINAL_DIR = Path("/content/n1_h3_v1_final")
DRIVE_SHOTS_DIR = Path("/content/drive/MyDrive/gate0_n1_h3_v1_shots")
DRIVE_FINAL_DIR = Path("/content/drive/MyDrive/gate0_n1_h3_v1_final")
MANIFEST_NAME = "n1_h3_manifest.json"
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
    "fb_elena_cabin3.jpg": f"{RAW_GH}/story/fb_elena_cabin3.jpg",
    "n1_elena_frost_window.jpg": f"{RAW_GH}/story/n1/n1_elena_frost_window.jpg",
    "elena_lean_in.jpg": f"{RAW_GH}/reactions/elena_lean_in.jpg",
    "elena_flinch.jpg": f"{RAW_GH}/reactions/elena_flinch.jpg",
    "chamber_admit.jpg": f"{RAW_GH}/reactions/chamber_admit.jpg",
    "n1_corridor_admit_frost.jpg": f"{RAW_GH}/story/n1_corridor_admit_frost.jpg",
    "chamber_purge.jpg": f"{RAW_GH}/reactions/chamber_purge.jpg",
    "n1_corridor_purge_duct.jpg": f"{RAW_GH}/story/n1_corridor_purge_duct.jpg",
    "fb_leo_powerbay.jpg": f"{RAW_GH}/story/fb_leo_powerbay.jpg",
    "n1_leo_frost_window.jpg": f"{RAW_GH}/story/n1/n1_leo_frost_window.jpg",
    "leo_lean_in.jpg": f"{RAW_GH}/reactions/leo_lean_in.jpg",
    "leo_flinch.jpg": f"{RAW_GH}/reactions/leo_flinch.jpg",
    "n1_leo_toolbox_check.jpg": f"{RAW_GH}/story/n1_leo_toolbox_check.jpg",
    "leo.jpg": f"{RAW_GH}/leo.jpg",
    "n1_corridor_aftermath.jpg": f"{RAW_GH}/story/n1_corridor_aftermath.jpg",
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
    # ================= 1. fb_elena_cabin3 (4 shots, 32s, isLipSync=False) =================
    make_shot(
        "fb_ec_01", "fb_elena_cabin3", "fb_elena_cabin3.jpg", 192, 0.15, 41101,
        "Archival surveillance footage inside Sector B Cabin 3 during decompression emergency: red warning beacons pulse across frosted steel bulkheads as analog pressure needles plummet and white mist hisses through ceiling pipe joints.",
        "Decompression klaxon alarm, hissing high-pressure air leak, metallic bulkhead groaning.",
        "一周前 // 3号舱监控录像", "ONE WEEK AGO // CABIN 3 CAM", "一週間前 // 第3区画監視映像",
        "一周前 · B区 3 号舱突发减压漏气，主气压表指针急速跌落红区——",
        "One week ago · Sector B Cabin 3 suffers sudden decompression; pressure gauges plunge into the red—",
        "一週間前・B区画第3室で突如減圧事故が発生、気圧計が急降下する——",
    ),
    make_shot(
        "fb_ec_02", "fb_elena_cabin3", "fb_elena_cabin3.jpg", 192, 0.25, 41102,
        "Seamless continuation inside Cabin 3: the stern brunette Chief Surgeon in rimless glasses and white coat clutches her cryo-sample box tightly, turns calmly away from the two panicked orderlies hammering the outer porthole, and reaches for the manual inner bulkhead wheel.",
        "Frantic muffled pounding on armored steel hatch, rushing air roar, heavy ratchet latch turning.",
        "一周前 // 3号舱内闸监控", "ONE WEEK AGO // INNER BULKHEAD", "一週間前 // 内隔壁カメラ",
        "门外两名护工拍窗求援，首席外科艾琳娜却抱紧样本盒，冷静伸手拉下内闸锁扣。",
        "Two orderlies pound outside the porthole while Dr. Elena Vance clutches her samples and reaches for the inner hatch latch.",
        "外で助手2名が窓を叩く中、エレナ医師は検体箱を抱えて冷静に内扉のロックへ手を伸ばす。",
        chain_prev="fb_ec_01",
    ),
    make_shot(
        "fb_ec_03", "fb_elena_cabin3", "fb_elena_cabin3.jpg", 192, 0.25, 41103,
        "Direct seamless continuation as the heavy inner blast wheel locks solid: blinding freezing decompression vapor swallows the corridor beyond the porthole while Elena stands stone-faced inside under pulsing crimson strobes.",
        "Heavy pneumatic lock slam sealing off corridor roar, muffled choking silence behind thick glass, steady crimson strobe click.",
        "一周前 // 3号舱封锁完成", "ONE WEEK AGO // HATCH SEALED", "一週間前 // 隔壁封鎖",
        "气密锁死瞬间，门外两名护工被狂暴低温失压吞没；门内的她呼吸平稳得像在算账。",
        "The bulkhead seals shut; decompression engulfs the two orderlies outside while Elena's breathing stays ice-cold inside.",
        "ロックが完了した瞬間、外の助手2名は急減圧に飲まれる——扉の内の彼女の呼吸は氷のように冷静だった。",
        chain_prev="fb_ec_02",
    ),
    make_shot(
        "fb_ec_04", "fb_elena_cabin3", "fb_elena_cabin3.jpg", 192, 0.30, 41104,
        "Seamless continuation in the quieted blood-red steel cabin: Elena sets the silver sample canister down, pulls a sterile gauze square from her coat pocket, and methodically wipes frost off her rimless glasses without looking back at the porthole.",
        "Quiet eerie airlock stillness, soft cloth wiping glasses, distant muffled klaxon fading.",
        "3号舱事故调查卷宗 // o-01", "CABIN 3 INQUIRY // LOG o-01", "第3区画調査記録 // o-01",
        "事后调查报告只留下一行冷冰冰的结语：「保全全站唯一主刀医师，系理性必要。」",
        "Her official inquiry report reads one cold line: 'Preserving the station's sole surgeon was rationally necessary.'",
        "事後報告書に残された一文：「基地唯一の執刀医の保全は合理的に必要であった。」",
        chain_prev="fb_ec_03",
    ),

    # ================= 2. n1_elena_knock (6 shots, 52s, lipSync) =================
    make_shot(
        "n1_ek_01", "n1_elena_knock", "n1_elena_frost_window.jpg", 192, 0.25, 41201,
        "Looking outward through Gate 0's frost-framed wire-reinforced blast glass into howling -46C cyan polar night: Dr. Elena Vance stumbles out of blinding snow squalls in a frost-caked parka over her lab coat and slams her gloved fist sharply against the cold glass.",
        "Roaring -46C Arctic blizzard gale, three urgent heavy gloved knocks on reinforced blast glass, breathless gasp.",
        "第 1 夜 00:12 // 0号闸外防爆窗", "NIGHT 01 · 00:12 // GATE 0 GLASS", "第1夜 00:12 // 第0関門防爆窓",
        "第 1 夜凌晨，暴雪扯裂外环供暖管线。防爆窗外骤然响起三记急促拍窗声——",
        "Night 1, 00:12: heating lines rupture in the Outer Ring. Three desperate knocks slam against Gate 0's blast glass—",
        "第1夜00:12、外環の暖房管が破裂。吹雪の中から防爆窓を激しく叩く音が響く——",
    ),
    make_shot(
        "n1_ek_02", "n1_elena_knock", "n1_elena_frost_window.jpg", 192, 0.40, 41202,
        "Seamless continuation outside the frost-rimed Gate 0 blast window: the stern brunette surgeon leans close to the wired intercom speaker, white frost clinging to her collar and eyebrows, shouting urgently over the storm.",
        "Crackling intercom static, howling polar wind outside, breathless sharp clinical female voice.",
        "V-01 // 艾琳娜·万斯医生", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "值班员！我是外科主任艾琳娜·万斯，外走廊的供暖管全炸了！",
        "Watchstander! Dr. Elena Vance, Chief Surgeon—the outer corridor heating lines just blew!",
        "当直官！主任外科医のエレナ・ヴァンスよ、外廊下の暖房管が全部破裂したわ！",
        spoken_mandarin="值班员！我是外科主任艾琳娜·万斯，外走廊的供暖管全炸了！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n1_ek_01",
    ),
    make_shot(
        "n1_ek_03", "n1_elena_knock", "n1_elena_frost_window.jpg", 243, 0.40, 41203,
        "Seamless continuation at the frosted blast pane: biting her chattering teeth back into fierce composure, Elena presses one gloved palm hard against the icy wire glass as snow lashes her shoulders.",
        "Wind gust slamming blast frame, shivering breath over open intercom mic, urgent clipped female voice.",
        "V-01 // 艾琳娜·万斯医生", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "外头已经跌破零下三十度！再不开门放我进去，我就冻死在这儿了！",
        "It's dropping past minus thirty out here! Open the door or I'll freeze to death at your glass!",
        "外はもう氷点下三十度よ！早く開けないとこの扉の前で凍死するわ！",
        spoken_mandarin="外头已经跌破零下三十度！再不开门放我进去，我就冻死在这儿了！",
        dialogue_window=("00:00.40", "00:08.20"),
        chain_prev="n1_ek_02",
    ),
    make_shot(
        "n1_ek_04", "n1_elena_knock", "n1_elena_frost_window.jpg", 192, 0.35, 41204,
        "Direct seamless continuation outside the dark storm-swept window: Elena whips a sharp sideways glance into the blinding black-blue corridor behind her where an emergency lamp flickers out, then snaps back to the mic.",
        "Distant metallic clang down dark outer corridor, surging blizzard wind, tense hurried female voice.",
        "V-01 // 艾琳娜·万斯医生", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "B区走廊全疯了，背后通风口有东西在靠近！",
        "Sector B went insane—there's something moving near the vents right behind me!",
        "B区画の通路は壊滅したの、後ろの換気口から何かが近づいてるわ！",
        spoken_mandarin="B区走廊全疯了！背后通风口有东西在靠近！",
        dialogue_window=("00:00.40", "00:06.20"),
        chain_prev="n1_ek_03",
    ),
    make_shot(
        "n1_ek_05", "n1_elena_knock", "n1_elena_frost_window.jpg", 192, 0.40, 41205,
        "Seamless continuation: raising her chin behind rimless frosted glasses with cold surgical authority, Elena taps her medical badge against the reinforced glass twice.",
        "Two sharp plastic badge taps on thick glass, intercom hum, commanding impatient female voice.",
        "V-01 // 艾琳娜·万斯医生", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "工号 MED-0419！站里三十个伤员只有我能主刀，别在那儿发愣！",
        "Badge MED-0419! Thirty patients inside only have me to operate—stop staring!",
        "職員番号 MED-0419！基地の負傷者三十人を執刀できるのは私だけよ、突っ立ってないで！",
        spoken_mandarin="工号MED零四一九！站里三十个伤员只有我能主刀，别在那儿发愣！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n1_ek_04",
    ),
    make_shot(
        "n1_ek_06", "n1_elena_knock", "n1_elena_frost_window.jpg", 243, 0.45, 41206,
        "Seamless continuation tight on Elena leaning straight into the intercom grille: snow crystals swirl in the cyan glare behind her as she delivers her impatient ultimatum.",
        "Intercom static burst, blizzard howl, icy authoritative female ultimatum.",
        "V-01 // 艾琳娜·万斯医生", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "值班员，别让我再说一遍——立刻把零号气密闸打开！",
        "Officer, don't make me repeat myself—cycle Gate Zero's airlock NOW!",
        "検疫官、二度言わせないで——今すぐ第0エアロックを開けなさい！",
        spoken_mandarin="值班员，别让我再说一遍！立刻把零号气密闸打开！",
        dialogue_window=("00:00.45", "00:08.00"),
        chain_prev="n1_ek_05",
    ),

    # ================= 3. n1_elena_react_intercom (5 shots, 42s, lipSync) =================
    make_shot(
        "n1_ei_01", "n1_elena_react_intercom", "elena_lean_in.jpg", 192, 0.45, 41301,
        "Tight medium close-up across the scarred steel intercom counter: Elena leans sharply forward, eyes cold and unflinching behind frosted rimless glasses as she snaps back at your Cabin 3 accusation.",
        "Sharp intercom click, tense booth silence outside storm hiss, cold defensive female voice.",
        "V-01 // 艾琳娜（对讲辩解）", "V-01 // ELENA (INTERCOM)", "V-01 // エレナ（弁明）",
        "你现在跟我翻三号舱的旧账？当时失压只剩十秒！",
        "You're bringing up Cabin 3 right now?! We had ten seconds before total blowout!",
        "今ここで第3区画の件を蒸し返すの？あの時、減圧まで残り10秒しかなかったのよ！",
        spoken_mandarin="你现在跟我翻三号舱的旧账？当时失压只剩十秒！",
        dialogue_window=("00:00.40", "00:06.50"),
    ),
    make_shot(
        "n1_ei_02", "n1_elena_react_intercom", "elena_lean_in.jpg", 192, 0.45, 41302,
        "Seamless continuation: Elena holds her chin steady without flinching, speaking with razor-sharp clinical precision as frost flakes melt under the amber booth lamp.",
        "Crisp quiet intercom acoustics, razor-sharp clinical female Mandarin.",
        "V-01 // 艾琳娜（对讲辩解）", "V-01 // ELENA (INTERCOM)", "V-01 // エレナ（弁明）",
        "我反锁内门是为了保住站里唯一的手术医生，不是因为我怕死！",
        "I locked that hatch to save the station's sole surgeon—not because I was scared!",
        "内扉をロックしたのは唯一の執刀医を守るためよ、死を恐れたからじゃない！",
        spoken_mandarin="我反锁内门是为了保住站里唯一的手术医生！不是因为我怕死！",
        dialogue_window=("00:00.40", "00:06.70"),
        chain_prev="n1_ei_01",
    ),
    make_shot(
        "n1_ei_03", "n1_elena_react_intercom", "elena_lean_in.jpg", 243, 0.45, 41303,
        "Seamless continuation: leaning closer so her breath clouds the blast glass edge, Elena counts on two gloved fingers coldly as if lecturing an intern.",
        "Soft gloved finger tap, cold wind outside, icy rational female voice.",
        "V-01 // 艾琳娜（对讲辩解）", "V-01 // ELENA (INTERCOM)", "V-01 // エレナ（弁明）",
        "门外那两名护工已经来不及拉回来了——如果我也死在里头，B区三十个伤员谁来清创缝合？！",
        "Those two orderlies were already lost—if I died with them, who sutures thirty patients in Sector B?!",
        "外の助手2人はもう間に合わなかった。私まで死んだらB区画30人を誰が縫合するの？！",
        spoken_mandarin="门外那两名护工已经来不及拉回来了！如果我也死在里头，B区三十个伤员谁来清创缝合？！",
        dialogue_window=("00:00.45", "00:08.80"),
        chain_prev="n1_ei_02",
    ),
    make_shot(
        "n1_ei_04", "n1_elena_react_intercom", "elena_lean_in.jpg", 192, 0.45, 41304,
        "Direct seamless continuation: her eyes narrow slightly behind her glasses, devoid of guilt, delivering her surgical worldview coldly into the mic.",
        "Steady 60Hz console hum, cold unemotional female surgeon voice.",
        "V-01 // 艾琳娜（对讲辩解）", "V-01 // ELENA (INTERCOM)", "V-01 // エレナ（弁明）",
        "愧疚是最无能的情绪。外科医生的职责是算清存活率账本。",
        "Guilt is for amateurs, Officer. A surgeon's only duty is balancing the survival ledger.",
        "罪悪感なんて無能な感情よ。外科医の仕事は生存率の帳尻を合わせることだけ。",
        spoken_mandarin="愧疚是最无能的情绪。外科医生的职责，是算清存活率账本。",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="n1_ei_03",
    ),
    make_shot(
        "n1_ei_05", "n1_elena_react_intercom", "elena_lean_in.jpg", 192, 0.45, 41305,
        "Seamless continuation: straightening slightly and staring dead into the Gate 0 booth lens, she lays down her cold final challenge.",
        "Sharp intercom mic release click, cold wind rumble, stern female challenge.",
        "V-01 // 艾琳娜（对讲辩解）", "V-01 // ELENA (INTERCOM)", "V-01 // エレナ（弁明）",
        "那是最冷酷但唯一的止损！现在决定权在你手里，拉闸还是看着我冻死？",
        "It was brutal, optimal triage! Your move, #09—pull the lever or watch me freeze.",
        "あれが唯一の合理的な損切りよ！決断はあなた次第、開けるのそれとも見殺しにするの？",
        spoken_mandarin="那是最冷酷但唯一的止损！现在决定权在你手里，拉闸还是看着我冻死？",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n1_ei_04",
    ),

    # ================= 4. n1_elena_react_strobe (5 shots, 42s, lipSync) =================
    make_shot(
        "n1_es_01", "n1_elena_react_strobe", "elena_flinch.jpg", 192, 0.40, 41401,
        "Harsh clinical strobe beam fires straight across Gate 0's blast glass: Elena flinches sharply sideways throwing one gloved hand up to shield her rimless glasses as her pupils constrict and frost lashes tremble.",
        "Loud high-voltage halogen strobe relay snap, sharp intake gasp, angry startled female yell.",
        "V-01 // 艾琳娜（强光应激）", "V-01 // ELENA (STROBE)", "V-01 // エレナ（閃光反応）",
        "把该死的强光关掉！你想照瞎我的眼睛吗？！",
        "Kill that damn strobe! Are you trying to blind me?!",
        "その忌々しいライトを消しなさい！目を潰す気なの？！",
        spoken_mandarin="把该死的强光关掉！你想照瞎我的眼睛吗？！",
        dialogue_window=("00:00.45", "00:06.20"),
    ),
    make_shot(
        "n1_es_02", "n1_elena_react_strobe", "elena_flinch.jpg", 192, 0.40, 41402,
        "Seamless continuation under pulsing white strobe glare: squinting fiercely through her gloved fingers, Elena drops her hand slightly and glares furiously back at the booth camera.",
        "Buzzing xenon strobe ballast, fierce agitated female voice.",
        "V-01 // 艾琳娜（强光应激）", "V-01 // ELENA (STROBE)", "V-01 // エレナ（閃光反応）",
        "我不是外头那些没瞳孔反应的怪物——去翻我的药房配给记录！",
        "I am NOT one of those things outside—check my pharmacy records!",
        "私は外の化け物じゃないわ——薬局の配給記録を調べなさい！",
        spoken_mandarin="我不是外头那些没瞳孔反应的怪物！去翻我的药房配给记录！",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="n1_es_01",
    ),
    make_shot(
        "n1_es_03", "n1_elena_react_strobe", "elena_flinch.jpg", 243, 0.40, 41403,
        "Seamless continuation as the strobe dims to cold cyan wash: shaking frost from her sleeve, Elena snaps forward with defiant honesty about her pharmacy ration log.",
        "Strobe power-down click, blizzard wind, sharp unapologetic female confession.",
        "V-01 // 艾琳娜（强光应激）", "V-01 // ELENA (STROBE)", "V-01 // エレナ（閃光反応）",
        "对，抗生素紧缺时我是把自己的预防用药排在重伤钻井工前面——因为我活着才能保住手术台！",
        "Yes, I put my own antibiotics ahead of injured drillers—because my hands keep the OR alive!",
        "ええ、抗生物質不足の時は自分の予防投与を優先したわ。私が生き残らなきゃ手術台が動かないからよ！",
        spoken_mandarin="对，抗生素紧缺时我是把自己的预防用药排在重伤钻井工前面！因为我活着才能保住手术台！",
        dialogue_window=("00:00.45", "00:08.90"),
        chain_prev="n1_es_02",
    ),
    make_shot(
        "n1_es_04", "n1_elena_react_strobe", "elena_flinch.jpg", 192, 0.40, 41404,
        "Seamless continuation: blinking rapidly to clear afterimages while pressing closer to the intercom, her voice sharp and impatient.",
        "Quiet tense intercom hum, rapid cold breathing, clipped irritated female voice.",
        "V-01 // 艾琳娜（强光应激）", "V-01 // ELENA (STROBE)", "V-01 // エレナ（閃光反応）",
        "眼底还点着散瞳药水呢，别拿破灯瞎晃了——我真是人！",
        "I have mydriatic drops in my chart anyway—stop waving that lamp, I'm human!",
        "カルテに散瞳薬の記録もあるはずよ！ライトで遊ぶのはやめて、私は人間よ！",
        spoken_mandarin="眼底还点着散瞳药水呢，别拿破灯瞎晃了！我真是人！",
        dialogue_window=("00:00.40", "00:06.40"),
        chain_prev="n1_es_03",
    ),
    make_shot(
        "n1_es_05", "n1_elena_react_strobe", "elena_flinch.jpg", 192, 0.40, 41405,
        "Direct seamless continuation: slamming both palms flat on the frosted sill below the window, Elena stares into the booth demanding immediate clearance.",
        "Heavy dull thud on steel sill, rising storm wind, commanding female demand.",
        "V-01 // 艾琳娜（强光应激）", "V-01 // ELENA (STROBE)", "V-01 // エレナ（閃光反応）",
        "真伪仪看完了没有？再耗下去就等着给我收尸吧！",
        "Done playing with your scanner? Stall any longer and you're bagging my corpse!",
        "検査は終わった？これ以上引き延ばすなら私の遺体袋を用意しなさい！",
        spoken_mandarin="真伪仪看完了没有？再耗下去就等着给我收尸吧！",
        dialogue_window=("00:00.40", "00:06.50"),
        chain_prev="n1_es_04",
    ),

    # ================= 5. n1_elena_outcome_admit (3 shots, 24s, lipSync) =================
    make_shot(
        "n1_ea_01", "n1_elena_outcome_admit", "chamber_admit.jpg", 192, 0.0, 41501,
        "Inside Gate 0 airlock threshold: emerald green CLEARANCE indicator lamps switch on, heavy steel locking bolts retract with a forceful pneumatic hiss, and the armored inner bulkhead door swings open into warm amber corridor light.",
        "Heavy steel deadbolt clunk, sharp pressurized airlock hiss, green clearance chime.",
        "第 1 夜裁决 // 内闸开启 · 放行艾琳娜", "VERDICT // ADMITTED ELENA", "裁定 // エレナ通過許可",
        "你拉下了放行拉杆。内舱气压锁泄压开启，绿灯亮起。",
        "You pull the admit lever. Hydraulic bolts retract under green clearance lamps.",
        "通過レバーを引く。緑灯が点灯し、内扉のロックが解除される。",
    ),
    make_shot(
        "n1_ea_02", "n1_elena_outcome_admit", "elena_lean_in.jpg", 192, 0.45, 41502,
        "Medium close-up just inside the warm amber station threshold: Elena steps out of the drifting white frost vapor shaking snow from her shoulders, glancing coldly back toward the booth window as she speaks.",
        "Boots stepping onto warm dry steel decking, fading airlock hiss, composed cool female voice.",
        "V-01 // 艾琳娜·万斯（进舱后）", "V-01 // DR. VANCE INSIDE", "V-01 // エレナ（入室後）",
        "算你识相。医疗室需要马上封锁独立供电——",
        "Smart call. Medbay needs immediate power isolation right now—",
        "賢明な判断ね。これから医務室を独立電源で封鎖するわ——",
        spoken_mandarin="算你识相。医疗室需要马上封锁独立供电。",
        dialogue_window=("00:00.45", "00:06.40"),
    ),
    make_shot(
        "n1_ea_03", "n1_elena_outcome_admit", "elena_lean_in.jpg", 192, 0.45, 41503,
        "Seamless continuation as Elena turns half-way down the inner corridor: she adjusts her rimless glasses calmly and delivers a chilly parting order before walking out of frame.",
        "Crisp boot steps receding down riveted steel corridor, cool quiet female warning.",
        "V-01 // 艾琳娜·万斯（进舱后）", "V-01 // DR. VANCE INSIDE", "V-01 // エレナ（入室後）",
        "把门盯紧了，天亮前别让任何人进 B 区打扰我。",
        "Watch that door—and don't let anyone near Sector B to disturb me until dawn.",
        "扉を見張っていて。夜明けまでB区画には誰も近づけさせないで。",
        spoken_mandarin="把门盯紧了，天亮前别让任何人进B区打扰我。",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="n1_ea_02",
    ),

    # ================= 6. n1_corridor_aftermath_admit (3 shots, 24s, isLipSync=False) =================
    make_shot(
        "n1_ca_01", "n1_corridor_aftermath_admit", "n1_corridor_admit_frost.jpg", 192, 0.0, 41601,
        "High-angle CCTV feed down Sector B Medbay corridor twenty minutes later: overhead cold fluorescent ceiling tubes flicker erratically in unison, casting harsh strobing shadows across the wet steel walls and locked medbay door.",
        "60Hz fluorescent ballast buzz and flicker, distant hollow ventilation rumble, ominous silence.",
        "二十分钟后 // B区医疗走廊监控", "20 MIN LATER // MEDBAY CORRIDOR CAM", "20分後 // B区画廊下監視",
        "二十分钟后，B 区医疗走廊整排荧光灯骤然同步闪烁，温度计读数反常暴跌——",
        "Twenty minutes later, Sector B medbay corridor lights strobe erratically as hallway sensors plunge—",
        "20分後、B区画廊下の蛍光灯が一斉に明滅し、廊下の気温が急低下し始める——",
    ),
    make_shot(
        "n1_ca_02", "n1_corridor_aftermath_admit", "n1_corridor_admit_frost.jpg", 192, 0.0, 41602,
        "Seamless slow push-in along the flickering steel hallway toward the sealed medbay door: unnatural white rime frost crystallizes outward from the bottom door seam across the steel floor grating.",
        "Crackling ice crystal expansion on steel floor, erratic fluorescent buzz, faint slow scraping behind steel door.",
        "B区医疗门缝 // 异常寒霜外渗", "MEDBAY SEAL // CREEPING FROST", "医務室扉 // 異常な霜",
        "厚重门缝底下悄然渗出一层诡异白霜，沿着钢板地格缓缓向走廊蔓延。",
        "Thick rime frost creeps eerily out from beneath the sealed medbay door across the steel floor.",
        "重厚な扉の隙間から不気味な白い霜が音もなく廊下へと滲み出してくる。",
        chain_prev="n1_ca_01",
    ),
    make_shot(
        "n1_ca_03", "n1_corridor_aftermath_admit", "n1_corridor_admit_frost.jpg", 192, 0.0, 41603,
        "Direct seamless continuation holding steadily on the frosted medbay door handle: the stainless lever subtly twitches downward twice from the inside as if something is silently testing the lock.",
        "Sharp faint metallic latch test click-click from inside locked room, flickering neon hum.",
        "B区医疗走廊监控 // 门内异响", "MEDBAY CAM // HANDLE TWITCH", "廊下監視 // ドアノブの異変",
        "门把手从里面极轻地咔嗒试探了两下——究竟是谁，刚才走进了医疗室？",
        "The steel handle twitches twice from inside, testing the latch—what exactly did you just let into Medbay?",
        "内側からドアノブが二度小さく鳴った——先ほど中に入れたのは、本当に人間だったのか？",
        chain_prev="n1_ca_02",
    ),

    # ================= 7. n1_elena_outcome_purge (3 shots, 24s, isLipSync=False) =================
    make_shot(
        "n1_ep_01", "n1_elena_outcome_purge", "chamber_purge.jpg", 192, 0.0, 41701,
        "Inside Gate 0 observation frame: heavy steel outer and inner shutters slam shut locking the vestibule tight as twin amber-red thermal fuel valves unlock and overhead igniter nozzles spark violently.",
        "Heavy blast shutters locking shut, crimson purge klaxon siren, sharp gas valve solenoid hiss.",
        "第 1 夜裁决 // 启动 1,100°C 高温净化", "VERDICT // THERMAL PURGE", "裁定 // 高温焼却起動",
        "你拉下净化总闸。隔离舱双门锁死，头顶高压燃料喷嘴骤然点火！",
        "You pull the purge lever. Both blast shutters lock as overhead thermal nozzles ignite!",
        "焼却レバーを引く。前後シャッターが閉鎖され、天井の燃料ノズルが一斉に点火する！",
    ),
    make_shot(
        "n1_ep_02", "n1_elena_outcome_purge", "chamber_purge.jpg", 192, 0.0, 41702,
        "Seamless continuation behind the armored glass: blinding 1,100C orange-white plasma flames roar downward filling the entire steel chamber in violent swirling firelight, vibrating the observation pane.",
        "Deafening 1,100C furnace blast roar, metallic chamber reverberation, intense crackling inferno.",
        "0号隔离窗 // 燃料 -1 FUEL", "GATE 0 FURNACE // -1 FUEL", "第0関門 // 燃料 -1 FUEL",
        "1,100°C 烈焰在防爆玻璃后轰鸣吞没了一切，供暖燃料随之消耗一格。",
        "1,100°C flames engulf the chamber behind armored glass, burning 1 bar of station fuel.",
        "1,100°Cの白熱の炎がガラスの向こうを焼き尽くし、暖房燃料を1目盛り消費した。",
        chain_prev="n1_ep_01",
    ),
    make_shot(
        "n1_ep_03", "n1_elena_outcome_purge", "chamber_purge.jpg", 192, 0.0, 41703,
        "Direct seamless continuation as the thermal jets cut off: thick black smoke curls upward past glowing red-hot blackened steel walls while amber cooling fans whirr to life.",
        "Fuel cutoff clunk, cooling exhaust fan spooling up, crackling hot steel ticks.",
        "0号隔离窗 // 冷却排烟", "GATE 0 // COOLING CYCLE", "第0関門 // 冷却排煙",
        "喷嘴切断，余烬在焦黑钢壁上噼啪作响，排烟扇嗡鸣启动。",
        "Jets cut out; embers tick against blackened steel as exhaust fans spin up.",
        "炎が収まり、焦げた鋼壁が熱で軋む中、排煙ファンが唸りを上げる。",
        chain_prev="n1_ep_02",
    ),

    # ================= 8. n1_corridor_aftermath_purge (3 shots, 24s, isLipSync=False) =================
    make_shot(
        "n1_cp_01", "n1_corridor_aftermath_purge", "n1_corridor_purge_duct.jpg", 192, 0.0, 41801,
        "Dim riveted inner station corridor immediately outside Gate 0: wisps of gray purge smoke drift slowly under amber emergency bulbs while the overhead brushed-steel ventilation duct sits still and silent.",
        "Exhaust fan winding down into dead quiet corridor hum, faint metallic thermal cooling ticks.",
        "站内走廊 // 炉壁冷却", "INNER CORRIDOR // AFTER PURGE", "駅内廊下 // 焼却直後",
        "净化炉刚停火，走廊里只剩排烟余响与头顶冰冷的铁皮通风管。",
        "As the furnace falls silent, only lingering smoke and overhead steel air ducts fill the corridor.",
        "焼却炉が静まり、廊下には排煙の残響と頭上の冷たい鉄製ダクトだけが残る。",
    ),
    make_shot(
        "n1_cp_02", "n1_corridor_aftermath_purge", "n1_corridor_purge_duct.jpg", 192, 0.0, 41802,
        "Seamless slow upward tilt locking onto the overhead square riveted steel ventilation grille: suddenly, THREE sharp unmistakable metallic knocks ring down from deep inside the ceiling shaft, shaking fine frost dust off the grate!",
        "Dead silence broken by THREE crisp loud metallic knocks inside overhead steel air duct (CLANG-CLANG-CLANG), dust falling.",
        "走廊顶部通风管 // 三声金属敲击！", "AIR DUCT // THREE METALLIC KNOCKS!", "天井ダクト // 3度の金属音！",
        "炉壁刚凉透，头顶通风管深处骤然传来三声清脆金属叩响——",
        "The moment the furnace cools, three sharp metallic knocks echo from inside the ceiling duct—",
        "炉壁が冷え切った瞬間、天井ダクトの奥から3度の鋭い金属音が響き渡った——",
        chain_prev="n1_cp_01",
    ),
    make_shot(
        "n1_cp_03", "n1_corridor_aftermath_purge", "n1_corridor_purge_duct.jpg", 192, 0.0, 41803,
        "Direct seamless continuation holding tense on the trembling ceiling vent grille: tiny frost specks drift down through amber emergency light as faint scraping recedes along the shaft toward the outer ring.",
        "Faint receding metallic scraping inside duct shaft, tense low booth hum.",
        "走廊顶部通风管 // 同伙回应", "AIR DUCT // ECHOING RESPONSE", "天井ダクト // 何かの気配",
        "仿佛窗外黑暗里还有别的同伴，正沿着通风管道悄然回应刚才那场火光……",
        "As if something else out in the dark answered the blast from inside the ductwork...",
        "まるで外の闇に潜む別の何かが、今の炎に呼応してダクトを伝ってきたかのように……",
        chain_prev="n1_cp_02",
    ),

    # ================= 9. fb_leo_powerbay (3 shots, 24s, isLipSync=False) =================
    make_shot(
        "fb_lp_01", "fb_leo_powerbay", "fb_leo_powerbay.jpg", 192, 0.15, 41901,
        "CCTV security feed inside Power Bay 2 two hours ago: blinding blue-white electrical arcs erupt across the high-voltage manifold panel as thick dark smoke and scalding white steam burst across steel catwalks.",
        "Explosive electrical arc crackle, sheared steam pipe roar, industrial power-down alarm.",
        "两小时前 // 2号动力舱监控", "2 HOURS AGO // POWER BAY 2 CAM", "2時間前 // 第2動力室監視",
        "两小时前，2 号动力舱主配电柜突发高压电弧爆闪，黑烟与蒸汽瞬间吞没通道——",
        "Two hours ago in Power Bay 2, high-voltage arcs burst across the manifold as smoke floods the bay—",
        "2時間前、第2動力室で高圧アーク放電が炸裂し、黒煙と蒸気が通路を埋め尽くした——",
    ),
    make_shot(
        "fb_lp_02", "fb_leo_powerbay", "fb_leo_powerbay.jpg", 192, 0.25, 41902,
        "Seamless continuation inside smoky Power Bay 2: young 22-year-old East Asian apprentice mechanic Leo Sato (matching leo.jpg) lunges across the deck, snatches up a heavy white-and-orange thermal tool chest with trembling hands, and sprints alone toward the blizzard hatch.",
        "Heavy clatter of tool chest latch, panicked running boots on steel grating, roaring electrical sparks behind.",
        "两小时前 // 莱奥抱箱独逃", "2 HOURS AGO // LEO BOLTS ALONE", "2時間前 // レオ単独脱出",
        "浓烟翻涌间，实习机械师莱奥一把抱起白色工具箱，头也不回冲向应急风雪闸门。",
        "Through swirling smoke, apprentice Leo Sato snatches his white tool chest and sprints for the storm hatch alone.",
        "濃煙の中、見習い整備士レオは白い工具箱を抱え、振り返らず吹雪のハッチへ飛び出した。",
        chain_prev="fb_lp_01",
    ),
    make_shot(
        "fb_lp_03", "fb_leo_powerbay", "fb_leo_powerbay.jpg", 192, 0.15, 41903,
        "Direct seamless continuation: the emergency storm hatch bangs wide into howling -46C cyan night snow as Leo disappears outside carrying the chest, leaving the dark spark-lit generator bay behind him.",
        "Heavy hatch slamming open into roaring polar gale, dying generator whine.",
        "2号动力舱监控 // 孤身入雪", "POWER BAY 2 // INTO THE STORM", "第2動力室 // 吹雪の中へ",
        "风闸在暴雪呼啸中甩开又合上——为什么整个动力舱，只有他一个人跑了出来？",
        "The storm hatch bangs into the blizzard—why did only Leo run out of Power Bay 2 alive?",
        "ハッチが吹雪の中へ開く——なぜ動力室から飛び出してきたのは、彼一人だけだったのか？",
        chain_prev="fb_lp_02",
    ),

    # ================= 10. n1_leo_arrival_main (5 shots, 44s, lipSync, Ep0 callback) =================
    make_shot(
        "n1_la_01", "n1_leo_arrival_main", "n1_leo_frost_window.jpg", 192, 0.35, 42001,
        "Outside Gate 0's frost-framed wire-reinforced blast glass in -46C blue snow squalls: young East Asian mechanic Leo Sato (matching leo.jpg, knit beanie and grease-smudged parka) stumbles up clutching a heavy white tool chest and bangs urgently on the glass.",
        "Howling blizzard wind, urgent hurried knocks on blast glass, chattering breathless young male voice.",
        "V-02 // 实习机械师 佐藤莱奥", "V-02 // LEO SATO", "V-02 // 佐藤レオ",
        "零九哥！是我，动力舱的莱奥！发电机房冒黑烟了，快放我进来！",
        "Bro #09! It's me, Leo from Engine Bay! Generator room's smoking—let me in!",
        "#09さん！俺です、動力室のレオです！発電室が黒煙だらけなんだ、早く開けて！",
        spoken_mandarin="零九哥！是我，动力舱的莱奥！发电机房冒黑烟了，快放我进来！",
        dialogue_window=("00:00.40", "00:06.60"),
    ),
    make_shot(
        "n1_la_02", "n1_leo_arrival_main", "n1_leo_frost_window.jpg", 192, 0.35, 42002,
        "Seamless continuation outside the frosted pane: hoisting the bulky white-and-orange tool chest slightly higher into the amber window light, Leo talks fast while shivering violently in the gale.",
        "Heavy plastic tool chest bumping glass, wind whistling past intercom, fast anxious young male voice.",
        "V-02 // 佐藤莱奥", "V-02 // LEO SATO", "V-02 // 佐藤レオ",
        "我把二号舱整箱备用减压阀都扛过来了，手快冻僵了！",
        "I hauled the whole spare thermal valve kit from Bay 2—my hands are freezing off!",
        "第2動力室の予備バルブ一式を持ってきたんです、手が凍えそうで！",
        spoken_mandarin="我把二号舱整箱备用减压阀都扛过来了！手快冻僵了！",
        dialogue_window=("00:00.40", "00:06.50"),
        chain_prev="n1_la_01",
    ),
    make_shot(
        "n1_la_03", "n1_leo_arrival_main", "leo_lean_in.jpg", 243, 0.45, 42003,
        "Intimate close-up leaning eagerly right against the wired glass: dropping his loud shouting into an anxious pleading tone like the mess hall whisper, Leo widens his eyes toward #09.",
        "Subdued blizzard roar outside glass, earnest pleading young male whisper over intercom.",
        "V-02 // 莱奥（压低嗓音提醒）", "V-02 // LEO (WHISPERING)", "V-02 // レオ（小声で）",
        "哥，食堂那晚您答应过我的——我离三个月转正评估就差最后这一个月了！",
        "Bro, remember what you promised in the mess hall? I'm just one month shy of my three-month probation pass!",
        "先輩、食堂の夜に約束したでしょ——本採用まであと1ヶ月だけなんです！",
        spoken_mandarin="哥，食堂那晚您答应过我的！我离三个月转正评估，就差最后这一个月了！",
        dialogue_window=("00:00.45", "00:08.50"),
    ),
    make_shot(
        "n1_la_04", "n1_leo_arrival_main", "leo_lean_in.jpg", 192, 0.45, 42004,
        "Seamless continuation tight on Leo's earnest oil-smudged face at the glass: glancing nervously behind him before smiling weakly with an eager-to-please promise.",
        "Intercom hum, quiet anxious young male plea.",
        "V-02 // 佐藤莱奥", "V-02 // LEO SATO", "V-02 // 佐藤レオ",
        "二号舱灶台夜里还给您温着姜茶呢，千万别在工头面前点我名儿……",
        "I kept hot ginger tea warming on Bay 2's stove for you—just please don't name me to the foreman...",
        "第2区画のストーブにはまだ生姜湯を温めてますから、班長の前で名指しだけは勘弁を……",
        spoken_mandarin="二号舱灶台夜里还给您温着姜茶呢！千万别在工头面前点我名儿！",
        dialogue_window=("00:00.40", "00:06.70"),
        chain_prev="n1_la_03",
    ),
    make_shot(
        "n1_la_05", "n1_leo_arrival_main", "n1_leo_frost_window.jpg", 243, 0.35, 42005,
        "Pulling back slightly to medium framing outside the frosted pane: Leo jerks a terrified glance back down the blizzard-choked corridor where a faint silhouette flickers, then pleads urgently into the mic.",
        "Distant eerie metallic echo down dark outer hallway, howling wind, panicked fast young male voice.",
        "V-02 // 佐藤莱奥", "V-02 // LEO SATO", "V-02 // 佐藤レオ",
        "外头走廊尽头有脚步声——连老周的口音都能学！快拉闸放我进去啊哥！",
        "There are footsteps down the hall—something out here even mimics Old Zhou's voice! Open up, man!",
        "通路の奥から足音がする——老周さんの声まで真似してるんです！早く開けてくださいよ！",
        spoken_mandarin="外头走廊尽头有脚步声！连老周的口音都能学！快拉闸放我进去啊哥！",
        dialogue_window=("00:00.45", "00:08.60"),
    ),

    # ================= 11. n1_leo_react_intercom (4 shots, 34s, lipSync) =================
    make_shot(
        "n1_li_01", "n1_leo_react_intercom", "leo_lean_in.jpg", 192, 0.45, 42101,
        "Close-up against the frosted intercom grille: startled by your sharp question about Power Bay 2, Leo waves one gloved hand frantically and explains in rapid breathless Mandarin.",
        "Intercom click, urgent nervous fast young male defense.",
        "V-02 // 莱奥（急辩）", "V-02 // LEO (REBUTTAL)", "V-02 // レオ（急弁）",
        "液压总阀崩的时候浓烟冲满整间机房，是老师傅喊我抱着备用箱先往外冲的！",
        "Smoke flooded Bay 2 when the main valve sheared—the chief yelled for me to haul the spare kit out first!",
        "油圧バルブが飛んだ時、部屋中が煙で埋まって親方が俺に工具箱を持って先に出ろって叫んだんです！",
        spoken_mandarin="液压总阀崩的时候浓烟冲满整间机房，是老师傅喊我抱着备用箱先往外冲的！",
        dialogue_window=("00:00.40", "00:06.80"),
    ),
    make_shot(
        "n1_li_02", "n1_leo_react_intercom", "leo_lean_in.jpg", 192, 0.45, 42102,
        "Seamless continuation at the glass: Leo's eyes dart sideways nervously as he insists he would never abandon or sell out his crewmates.",
        "Quiet booth hum, cold wind outside glass, earnest defensive young male voice.",
        "V-02 // 莱奥（急辩）", "V-02 // LEO (REBUTTAL)", "V-02 // レオ（急弁）",
        "我真没扔下谁！平时前辈私拉电线我都自掏津贴换粗电缆替他遮掩，怎么可能卖队友？",
        "I didn't ditch anybody! I even bought heavy cable out of my own stipend to cover for my mentor!",
        "誰も見捨ててません！普段だって先輩の違法配線を自腹で直して庇ってきたのに！",
        spoken_mandarin="我真没扔下谁！平时前辈私拉电线我都自掏津贴替他遮掩，怎么可能卖队友？",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="n1_li_01",
    ),
    make_shot(
        "n1_li_03", "n1_leo_react_intercom", "leo_lean_in.jpg", 243, 0.45, 42103,
        "Seamless continuation: flushing deeply with embarrassment while lowering his voice close to the mic, Leo blurts out his real weakness—terrified of being exposed in front of the foreman.",
        "Nervous swallow, muffled storm wind, flustered low hurried young male confession.",
        "V-02 // 莱奥（压低嗓音）", "V-02 // LEO (FLUSTERED)", "V-02 // レオ（赤面して）",
        "就算真手潮拧坏过二号阀……我也连熬三晚偷偷帮老周绕线圈赔罪了，实在不敢让工头扣我转正啊！",
        "Even when I stripped Valve 2, I snuck in three nights to rewind Old Zhou's motor—I just can't blow my probation!",
        "第2バルブを壊した時も、三晩こっそり老周さんのモーターを直して償ったんです——職長にだけは言えない！",
        spoken_mandarin="就算真手潮拧坏过二号阀……我也连熬三晚偷偷帮老周绕线圈赔罪了，实在不敢让工头扣我转正啊！",
        dialogue_window=("00:00.45", "00:08.90"),
        chain_prev="n1_li_02",
    ),
    make_shot(
        "n1_li_04", "n1_leo_react_intercom", "leo_lean_in.jpg", 192, 0.45, 42104,
        "Seamless continuation: grabbing his collar tightly against the cold, Leo looks straight through the glass pleading desperately.",
        "Teeth chattering lightly, intercom static, urgent young male plea.",
        "V-02 // 佐藤莱奥", "V-02 // LEO SATO", "V-02 // 佐藤レオ",
        "别问了哥，等进了门我把二号配电箱从头给您擦亮，快开门吧！",
        "Stop grilling me, man—once I'm in I'll scrub every relay in Bay 2 spotless, just open the door!",
        "もう勘弁してくださいよ、中に入ったら配電盤をピカピカに磨きますから、早く開けて！",
        spoken_mandarin="别问了哥！等进了门我把二号配电箱从头给您擦亮，快开门吧！",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="n1_li_03",
    ),

    # ================= 12. n1_leo_react_toolbox (4 shots, 34s, dual-frame bridge) =================
    make_shot(
        "n1_lt_01", "n1_leo_react_toolbox", "leo_flinch.jpg", 192, 0.40, 42201,
        "Startled at first by your intercom order, Leo nods rapidly with frost-red cheeks and grabs both handles of his heavy white tool chest to lift it up toward the blast glass.",
        "Heavy plastic-and-steel tool chest scraping off icy grating, hurried breath, eager young male voice.",
        "V-02 // 莱奥（举箱核验）", "V-02 // LEO (TOOLBOX)", "V-02 // レオ（工具箱確認）",
        "好好好，我举起来！您透过防爆窗仔细看——",
        "Okay, okay, lifting it right up! Look close through the glass—",
        "分かりました、持ち上げます！ガラス越しによく見てください——",
        spoken_mandarin="好好好，我举起来！您透过防爆窗仔细看！",
        dialogue_window=("00:00.40", "00:06.20"),
    ),
    make_shot(
        "n1_lt_02", "n1_leo_react_toolbox", "leo_flinch.jpg", 192, 0.25, 42202,
        "Seamless continuous downward tilt and push-in from Leo's shivering face onto his gloved hands heaving the heavy scorched white tool chest right against the frosted blast glass and popping open the charred metal latches to reveal the glowing brass valve inside.",
        "Loud metallic latch snap open, heavy chest thumping gently against thick glass, breathless young male exertion.",
        "V-02 // 焦黑工具箱贴窗", "SCORCHED TOOL CHEST // LATCH", "焦げた工具箱 // 留め金",
        "箱扣刚才被高压电弧熏黑了，我掰开盖子给您核验里头的备件！",
        "Arc flash scorched the latch black—let me pop the lid so you can inspect the parts inside!",
        "留め金がアーク放電で焦げてるんです、蓋を開けて中身を見せますから！",
        spoken_mandarin="箱扣刚才被高压电弧熏黑了，我掰开盖子给您核验里头的备件！",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="n1_lt_01",
        last_frame_img="n1_leo_toolbox_check.jpg",
    ),
    make_shot(
        "n1_lt_03", "n1_leo_react_toolbox", "n1_leo_toolbox_check.jpg", 243, 0.30, 42203,
        "Direct seamless continuation in close-up through the frost-framed blast glass: holding the open white tool chest steady so the brass thermal pressure valve sits clearly visible beside blackened arc-scorch marks while Leo points urgently with a gloved thumb.",
        "Frost crunching along chest rim, rattling brass valve inside foam tray, earnest rapid young male explanation.",
        "V-02 // 备用黄铜减压阀特写", "BRASS THERMAL VALVE // CLOSE-UP", "真鍮製減圧バルブ // 近接",
        "看，备用黄铜减压阀真在里面！刚才冲出风闸太急，唯独那把大扳手滑掉在门外雪地里了——",
        "Look—the brass thermal valve is right inside! I just dropped the torque wrench by the vent hatch running out—",
        "見てください、予備の真鍮バルブは本物です！ただ焦ってレンチだけハッチの外に落としちゃって——",
        spoken_mandarin="看，备用黄铜减压阀真在里面！刚才冲出风闸太急，唯独那把大扳手滑掉在门外雪地里了。",
        dialogue_window=("00:00.45", "00:08.90"),
        chain_prev="n1_lt_02",
    ),
    make_shot(
        "n1_lt_04", "n1_leo_react_toolbox", "n1_leo_toolbox_check.jpg", 192, 0.35, 42204,
        "Seamless continuation at the frosted window: closing one side of the charred lid slightly so his anxious eyes peer directly over the rim at #09, begging desperately.",
        "Plastic lid creak, howling blizzard behind, urgent pleading young male voice.",
        "V-02 // 佐藤莱奥（窗前近景）", "V-02 // LEO SATO", "V-02 // 佐藤レオ",
        "焦痕和阀门型号全对得上！信得过兄弟就快拉闸放我进去吧！",
        "Scorch marks and valve serial both match—trust me and open the lock!",
        "焦げ跡もバルブの型番も全部一致してるでしょ！頼みますから早く入れてください！",
        spoken_mandarin="焦痕和阀门型号全对得上！信得过兄弟就快拉闸放我进去吧！",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="n1_lt_03",
    ),

    # ================= 13. n1_leo_outcome_admit (2 shots, 14s, lipSync) =================
    make_shot(
        "n1_lo_01", "n1_leo_outcome_admit", "chamber_admit.jpg", 192, 0.0, 42301,
        "Inside Gate 0 airlock threshold: green clearance lamps illuminate, locking bolts slide open with a crisp pneumatic hiss, and young Leo rushes gratefully into the warm corridor clutching his white tool chest.",
        "Airlock bolts retracting, green clearance chime, heavy boots hurrying inside, relieved breathless young male thanks.",
        "V-02 // 莱奥进舱后", "V-02 // LEO ADMITTED", "V-02 // レオ入室後",
        "谢了兄弟！备用阀放这儿了，您真够意思！",
        "Thanks pal! Spare valve kit is right here—you saved my skin!",
        "助かりました！予備パーツはここに置きます、本当に恩に着ます！",
        spoken_mandarin="谢了兄弟！备用阀放这儿了，您真够意思！",
        dialogue_window=("00:01.10", "00:06.50"),
    ),
    make_shot(
        "n1_lo_02", "n1_leo_outcome_admit", "leo.jpg", 141, 0.40, 42302,
        "Warm medium close-up inside the riveted station hallway: Leo pauses halfway down the corridor looking back over his shoulder with an awkward sheepish grin and drops his voice nervously.",
        "Quiet corridor hum, awkward chuckling intake breath, hushed nervous young male whisper.",
        "V-02 // 佐藤莱奥", "V-02 // LEO SATO", "V-02 // 佐藤レオ",
        "别告诉站长我把扳手弄丢了，姜茶今晚给您温着！",
        "Just don't tell the Commander I dropped my wrench—ginger tea's waiting tonight!",
        "隊長にはレンチを落としたこと内緒にしてくださいね、生姜湯は今夜温めておきますから！",
        spoken_mandarin="别告诉站长我把扳手弄丢了，姜茶今晚给您温着！",
        dialogue_window=("00:00.35", "00:05.10"),
    ),

    # ================= 14. n1_cliffhanger_shadow (2 shots, 14s, isLipSync=False) =================
    make_shot(
        "n1_cs_01", "n1_cliffhanger_shadow", "n1_corridor_aftermath.jpg", 192, 0.0, 42401,
        "03:00 AM surveillance feed from Inner Corridor Cam 07: the long riveted steel passageway sits empty and cold beneath humming fluorescent tubes, one mid-corridor lamp sputtering erratically into darkness.",
        "Eerie 03:00 shift bell chime in distance, buzzing sputtering fluorescent bulb, cold lonely ventilation drone.",
        "03:00 // 内舱长廊 7 号监控", "03:00 // INNER CORRIDOR CAM 07", "03:00 // 内廊下監視 07",
        "凌晨三点，换班钟声刚过，内舱长廊 7 号监控的走廊灯突然咔嗒频闪——",
        "03:00 AM: just before shift bell, Inner Corridor Cam 07 catches an overhead lamp flickering wildly—",
        "午前3時、交代の鐘の直前、第7監視カメラの廊下灯が激しく明滅し始めた——",
    ),
    make_shot(
        "n1_cs_02", "n1_cliffhanger_shadow", "n1_corridor_aftermath.jpg", 141, 0.0, 42402,
        "Direct seamless continuation on the flickering corridor camera: during a single strobe flash, a tall motionless parka-clad silhouette stands dead still at the far end of the corridor staring directly toward Gate 0 before the lamp snaps dark.",
        "Sharp electrical lamp pop, deep ominous sub-bass cinema drone, dead quiet.",
        "第 1 夜片尾悬念 // 走廊黑影", "NIGHT 1 FINALE // CORRIDOR SHADOW", "第1夜終盤 // 廊下の影",
        "一个很高的人影站在走廊尽头一动不动盯着岗亭方向——明晚，更危险的访客要敲门了。",
        "A tall motionless figure stands at the corridor's far end staring straight at Gate 0. Worse arrivals knock tomorrow.",
        "廊下の突き当たりに背の高い人影が立ち尽くし、第0関門を真っ直ぐ見つめている——明日、さらなる訪問者が来る。",
        chain_prev="n1_cs_01",
    ),
]

REEL_FADES: dict[str, tuple[float, float]] = {
    "fb_elena_cabin3": (0.65, 0.45),
    "n1_elena_knock": (0.45, 0.0),
    "n1_elena_react_intercom": (0.0, 0.55),
    "n1_elena_react_strobe": (0.0, 0.55),
    "n1_elena_outcome_admit": (0.55, 0.45),
    "n1_corridor_aftermath_admit": (0.45, 0.70),
    "n1_elena_outcome_purge": (0.55, 0.45),
    "n1_corridor_aftermath_purge": (0.45, 0.70),
    "fb_leo_powerbay": (0.65, 0.45),
    "n1_leo_arrival_main": (0.45, 0.0),
    "n1_leo_react_intercom": (0.0, 0.55),
    "n1_leo_react_toolbox": (0.0, 0.55),
    "n1_leo_outcome_admit": (0.55, 0.45),
    "n1_cliffhanger_shadow": (0.45, 0.75),
}

REEL_ORDER = [
    "fb_elena_cabin3",
    "n1_elena_knock",
    "n1_elena_react_intercom",
    "n1_elena_react_strobe",
    "n1_elena_outcome_admit",
    "n1_corridor_aftermath_admit",
    "n1_elena_outcome_purge",
    "n1_corridor_aftermath_purge",
    "fb_leo_powerbay",
    "n1_leo_arrival_main",
    "n1_leo_react_intercom",
    "n1_leo_react_toolbox",
    "n1_leo_outcome_admit",
    "n1_cliffhanger_shadow",
]

PILOT_SHOT_IDS = {"n1_ek_02", "n1_la_01"}


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
    raw_dir = Path("/content/n1_raw_inputs")
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
        Path("/tmp/hf_n1_h3.txt").write_text("".join(aria_lines))
        sh(
            "aria2c -i /tmp/hf_n1_h3.txt -j 6 -x 16 -s 16 -k 16M "
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
            "filename_prefix": f"n1_h3_{shot['id']}",
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
            candidates = sorted(OUTPUT_DIR.rglob(f"n1_h3_{shot_id}*.mp4"), key=lambda p: p.stat().st_mtime)
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
    print(f"=== [4/4] Rendering {len(targets)} MiniMax-H3 N1 Shots (pilot={pilot_only}) ===", flush=True)
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
    tmp_dir = Path("/tmp/n1_stitch_tmp")
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
