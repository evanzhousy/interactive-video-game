#!/usr/bin/env python3
"""
Colab G4 (96GB Blackwell) Live-Action AI Cinema Renderer & Stitcher for Episode 0 (`Quarantine Gate 0: 2036`).

Uses MiniMax-H3 `fl2va` (`minimax_h3_fl2va_pruned_fp8_scaled.safetensors`) + `Qwen3-VL-32B-Heretic-NVFP4` +
Realism/CloseUp/Turbo LoRAs + `MiniMaxH3SigmaShift (12.0, 3.0)` to turn all 16 Episode 0 35mm cinema keyframes
into 46 native 1344x768 @ 24fps audio-visual shots, stitched into 11 continuous 1280x720 H.264+AAC reels (~06:45-07:15).

Modes:
  --mode pilot   Render only 2 verification shots (`a1_02`, `a2c_02`)
  --mode all     Resume & render all 46 shots (skips valid existing MP4 > 150 KB)
  --mode stitch  Stitch all 46 shots into 11 final 1280x720 reels + `ep0_h3_manifest.json`
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
CN_DIR = COMFY_DIR / "custom_nodes"
INPUT_DIR = COMFY_DIR / "input"
OUTPUT_DIR = COMFY_DIR / "output"
SHOTS_DIR = Path("/content/ep0_h3_v2_out")
FINAL_DIR = Path("/content/ep0_h3_v2_final")
V1_DRIVE_SHOTS_DIR = Path("/content/drive/MyDrive/gate0_ep0_h3_shots")
DRIVE_SHOTS_DIR = Path("/content/drive/MyDrive/gate0_ep0_h3_v2_shots")
DRIVE_FINAL_DIR = Path("/content/drive/MyDrive/gate0_ep0_h3_v2_final")
API_URL = "http://127.0.0.1:8188"


def drive_ready() -> bool:
    if os.path.isdir("/content/drive/My Drive") and not os.path.exists("/content/drive/MyDrive"):
        os.symlink("/content/drive/My Drive", "/content/drive/MyDrive")
    return os.path.isdir("/content/drive/MyDrive")
RAW_GH = "https://raw.githubusercontent.com/evanzhousy/interactive-video-game/main/public/portraits"

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
    "ep0_heli_arrival.jpg": f"{RAW_GH}/story/ep0_heli_arrival.jpg",
    "ep0_helipad_ship_reverse.jpg": f"{RAW_GH}/story/ep0/ep0_helipad_ship_reverse.jpg",
    "ep0_helipad_marcus_grab.jpg": f"{RAW_GH}/story/ep0/ep0_helipad_marcus_grab.jpg",
    "ep0_crew_dinner.jpg": f"{RAW_GH}/story/ep0_crew_dinner.jpg",
    "ep0_canteen_wide_v2.jpg": f"{RAW_GH}/story/ep0/ep0_canteen_wide_v2.jpg",
    "ep0_canteen_leo_thor.jpg": f"{RAW_GH}/story/ep0/ep0_canteen_leo_thor.jpg",
    "ep0_canteen_leo_biscuit.jpg": f"{RAW_GH}/story/ep0/ep0_canteen_leo_biscuit.jpg",
    "ep0_canteen_marcus_stew.jpg": f"{RAW_GH}/story/ep0/ep0_canteen_marcus_stew.jpg",
    "ep0_canteen_elena_scalpel.jpg": f"{RAW_GH}/story/ep0/ep0_canteen_elena_scalpel.jpg",
    "ep0_corner_arthur_holm.jpg": f"{RAW_GH}/story/ep0/ep0_corner_arthur_holm.jpg",
    "ep0_corner_arthur_canteen.jpg": f"{RAW_GH}/story/ep0/ep0_corner_arthur_canteen.jpg",
    "ep0_corner_ana.jpg": f"{RAW_GH}/story/ep0/ep0_corner_ana.jpg",
    "ep0_corner_ingrid.jpg": f"{RAW_GH}/story/ep0/ep0_corner_ingrid.jpg",
    "ep0_corner_linmei_hannah.jpg": f"{RAW_GH}/story/ep0/ep0_corner_linmei_hannah.jpg",
    "prequel_icecore_breach.jpg": f"{RAW_GH}/story/prequel_icecore_breach.jpg",
    "ep0_briefing_topology.jpg": f"{RAW_GH}/story/ep0/ep0_briefing_topology.jpg",
    "prologue_01_handover.jpg": f"{RAW_GH}/story/prologue_01_handover.jpg",
    "ep0_lonely_watch.jpg": f"{RAW_GH}/story/ep0_lonely_watch.jpg",
    "ep0_op08_handover_booth.jpg": f"{RAW_GH}/story/ep0/ep0_op08_handover_booth.jpg",
    "ep0_inner_door_knock.jpg": f"{RAW_GH}/story/ep0/ep0_inner_door_knock.jpg",
    "ep0_empty_booth.jpg": f"{RAW_GH}/story/ep0_empty_booth.jpg",
    "ep0_override_cut_seal.jpg": f"{RAW_GH}/story/ep0/ep0_override_cut_seal.jpg",
    "ep0_op08_tape_booth.jpg": f"{RAW_GH}/story/ep0/ep0_op08_tape_booth.jpg",
    "operator09.jpg": f"{RAW_GH}/operator09.jpg",
    "prologue_03.jpg": f"{RAW_GH}/story/prologue_03.jpg",
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
    reuse_v1: bool = False,
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
        "reuse_v1": reuse_v1,
        "length": length,
        "closeup_lora": closeup_lora,
        "seed": seed,
        "prompt": prompt,
        "speaker": {"zh": speaker_zh, "en": speaker_en, "ja": speaker_ja},
        "text": {"zh": text_zh, "en": text_en, "ja": text_ja},
    }


SHOTS: list[dict] = [
    # ================= 1. ep0_sc00a1_arrival =================
    make_shot(
        "a1_01", "ep0_sc00a1_arrival", "ep0_heli_arrival.jpg", 243, 0.0, 30101,
        "Wide aerial establishing shot over frozen Svalbard ridge at twilight (-46C). A massive olive Mi-26 heavy Arctic chopper hovers down blasting thick spindrift snow across the icy steel helipad while a dark black-hulled icebreaker blows three deep horns and fades into freezing sea fog at the fjord mouth.",
        "Thundering twin Mi-26 helicopter rotor wash, howling -46C Arctic wind, three distant deep low icebreaker foghorn blasts.",
        "字幕卡 // 2036.10.14", "TITLE CARD // OCT 14, 2036", "字幕 // 2036.10.14",
        "2036.10.14 · 斯瓦尔巴零号站（78°13'N）· 室外 -46°C · 距离极夜还有 12 天（最后一班补给船鸣笛远去）",
        "OCT 14, 2036 · SVALBARD OUTPOST 0 (78°13'N) · -46°C · 12 DAYS TO POLAR NIGHT",
        "2036.10.14 · スヴァールバル第0基地（北緯78°13'）· 屋外 -46°C · 極夜まで12日",
        reuse_v1=True,
    ),
    make_shot(
        "a1_02", "ep0_sc00a1_arrival", "ep0_helipad_marcus_grab.jpg", 192, 0.30, 30102,
        "Handheld medium shot on the wind-lashed helipad under spinning amber airlock beacon: the frostbitten fur-hooded security captain hauling the stumbling recruit upright by his collar as the recruit's carbon-fiber left knee brace slips on icy grating. The captain turns toward him and barks gruffly over the wind.",
        "Roaring blizzard gale, helicopter turbine spooling down, gruff middle-aged male voice barking sharply over wind.",
        "V-04 // 安保队长 马库斯", "CAPTAIN MARCUS CHEN", "警備隊長 マーカス",
        "特罗姆瑟那帮文职没教过你下冰坡先锁紧左膝碳纤护带？往里滚——",
        "Didn't those Tromsø desk jockeys teach you to lock your left carbon knee brace on ice? Get inside—",
        "トロムソの事務屋は氷坂で左膝のカーボン装具を締めろと教えなかったのか？中へ入れ——",
        spoken_mandarin="特罗姆瑟那帮文职没教过你下冰坡先锁紧左膝碳纤护带？往里滚！",
        dialogue_window=("00:00.45", "00:06.80"),
        reuse_v1=True,
    ),
    make_shot(
        "a1_03", "ep0_sc00a1_arrival", "ep0_helipad_marcus_grab.jpg", 141, 0.30, 31103,
        "Continuing directly from the previous gesture on the freezing helipad: the gruff fur-hooded captain shoves the recruit firmly toward the glowing amber hydraulic airlock doorway, knocking frost off his shoulder as wind whips snow past.",
        "Heavy insulated boot thuds on steel deck, hydraulic airlock hum, sharp commanding male voice.",
        "V-04 // 安保队长 马库斯", "CAPTAIN MARCUS CHEN", "警備隊長 マーカス",
        "暖风外闸两分钟后泄压！",
        "The heated outer airlock depressurizes in two minutes!",
        "暖房外門はあと2分で減圧するぞ！",
        spoken_mandarin="暖风外闸两分钟后泄压！",
        dialogue_window=("00:00.45", "00:04.20"),
        chain_prev="a1_02",
    ),
    make_shot(
        "a1_04", "ep0_sc00a1_arrival", "ep0_helipad_ship_reverse.jpg", 192, 0.15, 31104,
        "Over-the-shoulder reverse shot from right beside the open steel airlock threshold: looking past the frost-dusted black parka recruit (#09) silhouette—while the olive Mi-26 helicopter remains landed solidly on the helipad behind him with rotors slowing—he pulls up his collar staring out at the vanishing black supply ship steaming into freezing fjord mist and calls back earnestly.",
        "Cold freezing intake breath, howling polar wind whistling past open airlock seal, dying turbine whine, earnest young male voice shouting back.",
        "新任值班员 // 主角 #09", "INCOMING OPERATOR #09", "新任当直官 // #09",
        "刚才那班船……四个月内不会再回来了吧？",
        "That supply ship... won't be back for four months, will it?",
        "さっきの補給船……4ヶ月は戻ってこないんですよね？",
        spoken_mandarin="刚才那班船，四个月内不会再回来了吧？",
        dialogue_window=("00:00.50", "00:05.80"),
    ),
    make_shot(
        "a1_05", "ep0_sc00a1_arrival", "ep0_helipad_marcus_grab.jpg", 243, 0.30, 31105,
        "Continuing directly inside the open amber airlock threshold from a1_03: the fur-hooded captain shakes crushed snow off his glove, grabs the heavy steel hatch wheel, scoffs bluntly at the recruit, and jerks his thumb inside toward the warm station corridor.",
        "Clank of heavy steel wheel turning, crisp wind fading behind airlock threshold, gruff gravelly male voice.",
        "V-04 // 安保队长 马库斯", "CAPTAIN MARCUS CHEN", "警備隊長 マーカス",
        "想回家就现在顺着尾桨爬回去。赶紧去食堂找莱奥领块热饼干把身子暖过来——",
        "Want to go home? Climb onto the tail rotor now. Go find Leo in the mess hall for a hot biscuit—",
        "帰りたければ今すぐ尾翼にしがみつけ。食堂へ行ってレオから温かいビスケットを貰って温まれ——",
        spoken_mandarin="想回家就现在顺着尾桨爬回去！赶紧去食堂找莱奥领块热饼干把身子暖过来！",
        dialogue_window=("00:00.45", "00:08.50"),
        chain_prev="a1_03",
    ),
    make_shot(
        "a1_06", "ep0_sc00a1_arrival", "ep0_helipad_marcus_grab.jpg", 243, 0.30, 31106,
        "Direct seamless continuation inside the amber-lit airlock chamber as the heavy blast hatch swings shut behind them: the captain gives one final blunt warning before turning down the steel station corridor.",
        "Heavy pneumatic airlock hatch sealing shut cutting off the -46C wind, deep gruff male warning.",
        "V-04 // 安保队长 马库斯", "CAPTAIN MARCUS CHEN", "警備隊長 マーカス",
        "记住，站里暖气全靠主泵硬顶着，今天顶缺口就剩你一个，外头零下四十六度可不等人！",
        "Station heat runs on one main pump alone—you're our only relief man left, and minus forty-six waits for nobody!",
        "基地の暖房は主ポンプ一本頼みだ。今日の穴埋めはお前一人。零下46度は待ってくれんぞ！",
        spoken_mandarin="记住，站里暖气全靠主泵硬顶着！今天顶缺口就剩你一个，外头零下四十六度可不等人！",
        dialogue_window=("00:00.45", "00:08.60"),
        chain_prev="a1_05",
    ),

    # ================= 2. ep0_sc00a2_canteen_crew =================
    make_shot(
        "a2c_01", "ep0_sc00a2_canteen_crew", "ep0_canteen_wide_v2.jpg", 192, 0.05, 31201,
        "Warm atmospheric establishing slow dolly down the riveted brushed-steel mess hall lit by warm amber cage sodium sconces. Condensation coats the frosted circular portholes while nine bundled Arctic crewmates sit along steel benches ladling steaming golden soup into battered aluminum bowls.",
        "Heavy airtight door thud closing off polar storm, warm indoor canteen hum, faint spoons against aluminum bowls, rising soup steam.",
        "2036.10.14 // 公共食堂 · 封站前最后一顿热汤", "MESS HALL // BEFORE LOCKDOWN", "公共食堂 // 最後の温かな食事",
        "厚重气密外门隔断了室外 -46°C 狂风。昏黄防爆钠灯下，全站老少挤在暖气食堂里喝着封站前最后一次热汤……",
        "Thick airtight doors seal out the -46C gale. Beneath amber sodium lights, the whole station huddles for one last shared hot soup...",
        "重い気密扉が-46°Cの嵐を遮断する。温かいナトリウム灯の下、全基地の仲間たちが最後の熱いスープを囲んでいた……",
    ),
    make_shot(
        "a2c_02", "ep0_sc00a2_canteen_crew", "ep0_canteen_leo_thor.jpg", 243, 0.30, 30202,
        "Warm medium group shot at the canteen steel table: the smiling 22-year-old East Asian apprentice mechanic leans in flicking free a frozen collar zipper with a small hex wrench while the older bearded welder on his side chuckles over a steaming soup bowl and calls out teasingly.",
        "Warm canteen room tone, tiny metallic zipper click, hearty older bearded welder teasing loudly in Mandarin.",
        "焊工 // 老周", "WELDER ZHOU", "溶接工・老周",
        "新来的，别信莱奥这副热心肠！上个月二号液压阀手轮滑丝是谁偷偷找别人替工？",
        "Hey rookie, don't buy Leo's eager-beaver act! Who stripped Valve 2's handwheel last month and quietly swapped shifts?",
        "新入り、レオのお人好し面に騙されるな！先月2番油圧弁を潰してこっそり代打を頼んだのは誰だ？",
        spoken_mandarin="新来的，别信莱奥这副热心肠！上个月二号液压阀手轮滑丝，是谁偷偷找别人替工？",
        dialogue_window=("00:00.50", "00:08.50"),
        reuse_v1=True,
    ),
    make_shot(
        "a2c_03", "ep0_sc00a2_canteen_crew", "ep0_canteen_leo_thor.jpg", 192, 0.35, 31203,
        "Seamless continuation from the previous canteen reaction: the young 22-year-old mechanic raises his head in playful indignation with a small hex wrench in hand, waving toward the bearded welder as crewmates chuckle nearby.",
        "Light metallic clatter, cheerful bustling mess hall chatter, energetic young male Mandarin protest.",
        "V-02 // 实习机械师 莱奥", "V-02 // LEO SATO", "V-02 // レオ・サトウ",
        "周师兄您可别泼脏水，那是密封圈自己不耐寒——",
        "Hey Zhou, stop slinging mud—that gasket cracked from the freeze on its own!",
        "周さん、濡れ衣ですよ！パッキンが寒さで勝手に割れたんです——",
        spoken_mandarin="周师兄您可别泼脏水！那是密封圈自己不耐寒！",
        dialogue_window=("00:00.40", "00:06.20"),
        chain_prev="a2c_02",
    ),
    make_shot(
        "a2c_04", "ep0_sc00a2_canteen_crew", "ep0_canteen_leo_thor.jpg", 192, 0.35, 31204,
        "Seamless continuation of the young East Asian mechanic at the table: he taps his fist lightly onto his chest and raises his chin proudly so the table hears his solemn boast.",
        "Hollow thump on quilted thermal vest against canteen table hum, earnest young male boasting clearly.",
        "V-02 // 实习机械师 莱奥", "V-02 // LEO SATO", "V-02 // レオ・サトウ",
        "再说我莱奥一条底线：搞砸了零件我第一个站出来认，绝不叫同班兄弟替我背锅！",
        "And you know my one rule: break a part, I step up first—never letting a crewmate take the fall!",
        "それに俺の流儀は一つ、ミスしたら真っ先に名乗り出る。仲間に泥は被せません！",
        spoken_mandarin="再说我莱奥一条底线：搞砸了零件我第一个站出来认，绝不叫同班兄弟替我背锅！",
        dialogue_window=("00:00.45", "00:06.80"),
        chain_prev="a2c_03",
    ),
    make_shot(
        "a2c_05", "ep0_sc00a2_canteen_crew", "ep0_canteen_leo_thor.jpg", 243, 0.25, 31205,
        "Continuing smoothly from the lively canteen group table, panning right toward the orange-coverall Scandinavian driller as he pours amber liquor into the quiet weathered watchstander's tin mug and grins warmly.",
        "Liquid pouring cleanly into tin mug, warm laughter, hearty older male voice.",
        "资深钻井工 // 托尔·伯格", "DRILLER // THOR BERG", "掘削員 // トール・ベルグ",
        "我下个月回奥斯陆看我小女儿索菲亚买琴——对了零八，上回打赌那两盒红双喜别忘了欠账！",
        "Next month I fly home to Oslo to buy my little girl Sofia a piano—hey #08, don't forget those two packs of Double Happiness!",
        "来月オスロへ帰って娘のソフィアにピアノを買うんだ——おい#08、賭けの紅双喜2箱、忘れるなよ！",
        spoken_mandarin="我下个月回奥斯陆看我小女儿索菲亚买琴！对了零八，上回打赌那两盒红双喜别忘了欠账！",
        dialogue_window=("00:00.50", "00:08.60"),
        chain_prev="a2c_04",
    ),
    make_shot(
        "a2c_06", "ep0_sc00a2_canteen_crew", "ep0_canteen_leo_biscuit.jpg", 243, 0.45, 30206,
        "Intimate tight close-up across the scratched stainless steel table: the young mechanic's bright grin abruptly drops into tense earnest anxiety as crewmates blur behind him. His oil-smudged fingers discreetly slide half a ration biscuit across the metal while speaking in a hushed low whisper.",
        "Soft scraping of ration biscuit across steel, background canteen chatter subdued, low anxious hushed male whisper.",
        "V-02 // 莱奥（压低嗓音）", "LEO SATO (WHISPERING)", "レオ（小声で）",
        "……哥，我离三个月转正评估就差一个月。真哪晚干活笨手笨脚捅了小漏子，",
        "...Hey, I'm one month shy of my three-month probation pass. If I ever mess up some small job on night shift,",
        "……先輩、本採用まであと1ヶ月なんです。もし夜勤で俺がヘマをしても、",
        spoken_mandarin="哥，我离三个月转正评估就差一个月……真哪晚干活笨手笨脚捅了小漏子……",
        dialogue_window=("00:00.55", "00:08.40"),
        reuse_v1=True,
    ),
    make_shot(
        "a2c_07", "ep0_sc00a2_canteen_crew", "ep0_canteen_leo_biscuit.jpg", 192, 0.45, 31207,
        "Direct seamless continuation of the hushed close-up across the table: keeping his voice low and glancing nervously back toward the kitchen counter, the young mechanic finishes whispering his secret plea and gently withdraws his fingers from the ration biscuit.",
        "Hushed urgent young male whisper, faint distant kettle hum.",
        "V-02 // 莱奥（压低嗓音）", "LEO SATO (WHISPERING)", "レオ（小声で）",
        "您可别当着工头大喇叭点我名儿，二号舱灶台夜里总温着姜茶。",
        "don't call me out over the foreman's PA... I keep hot ginger tea warming on Bay 2's stove every night.",
        "班長の前で名指しだけは勘弁を。第2区画のストーブには毎晩生姜湯を温めてますから。",
        spoken_mandarin="您可别当着工头大喇叭点我名儿……二号舱灶台夜里总温着姜茶。",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="a2c_06",
    ),

    # ================= 3. ep0_sc00a2_canteen_clash =================
    make_shot(
        "a2m_01", "ep0_sc00a2_canteen_clash", "ep0_canteen_marcus_stew.jpg", 243, 0.30, 30301,
        "Medium shot at the mess hall table: the tough middle-aged security captain in a soup-splashed heavy canvas jacket slams one heavy palm onto the table and roars furiously at the startled teenage apprentice holding an overturned ladle.",
        "Sharp heavy slap on metal table causing nearby spoons to jump, furious gruff roaring male voice.",
        "V-04 // 马库斯（拍桌怒吼）", "MARCUS CHEN (ROARING)", "マーカス（一喝）",
        "长没长眼？！连续熬夜端热锅扣三天淡水配额——滚去三号厕所拿钢丝球刷一个月！",
        "Watch where you're stepping! Spilling soup docks three days' fresh water—take steel wool to Latrine 3 for a whole month!",
        "目がついてるのか？！水配給3日分カットだ——第3トイレへ行って1ヶ月スチールウールで磨いてこい！",
        spoken_mandarin="长没长眼？！连续熬夜端热锅扣三天淡水配额！滚去三号厕所拿钢丝球刷一个月！",
        dialogue_window=("00:00.45", "00:08.70"),
        reuse_v1=True,
    ),
    make_shot(
        "a2m_02", "ep0_sc00a2_canteen_clash", "ep0_canteen_marcus_stew.jpg", 243, 0.30, 31302,
        "Direct seamless continuation at the table: looking awkwardly away with a gruff scowl as the teary apprentice clutches the ladle, the captain firmly presses his own steaming stainless stew bowl into the boy's hands and mutters under his breath.",
        "Heavy scrape of hot steel bowl across mess table, faint sizzling soup aroma, rough muttered low male grumble.",
        "V-04 // 马库斯（别开眼神低骂）", "MARCUS CHEN (MUTTERING)", "マーカス（小声で）",
        "端走吃了再刷！冻发烧了占床位，艾琳娜大夫明天真能让你抽签等死！",
        "Take mine, eat it first, then scrub! Catch a fever and hog a bunk, and Dr. Vance will draw lots over your life tomorrow!",
        "これ持って食ってから磨け！凍えて熱出してベッドを塞いだら、エレナ医師は明日にでも籤引きで切り捨てるぞ！",
        spoken_mandarin="端走吃了再刷！冻发烧了占床位，艾琳娜大夫明天真能让你抽签等死！",
        dialogue_window=("00:00.50", "00:08.50"),
        chain_prev="a2m_01",
    ),
    make_shot(
        "a2m_03", "ep0_sc00a2_canteen_clash", "ep0_canteen_elena_scalpel.jpg", 141, 0.45, 30303,
        "Close medium shot at the side edge of the mess hall table: the stone-faced clinical female surgeon sets stainless hemostat forceps into a metal kidney tray with a sharp metallic clink while methodically wiping her rimless glasses with sterile gauze.",
        "Crisp metallic clink of surgical forceps dropping into stainless kidney tray, quiet mess hall background.",
        "V-01 // 首席外科 艾琳娜", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "老陈嘴臭心软。",
        "Old Chen barks loud and caves soft.",
        "チェン隊長は口が悪いだけ。",
        spoken_mandarin="老陈嘴臭心软。",
        dialogue_window=("00:00.80", "00:04.20"),
        reuse_v1=True,
    ),
    make_shot(
        "a2m_04", "ep0_sc00a2_canteen_clash", "ep0_canteen_elena_scalpel.jpg", 192, 0.45, 31304,
        "Seamless continuation of the female surgeon holding her clean rimless glasses: looking steadily across the table, she speaks calmly in crisp clinical Mandarin without raising her voice.",
        "Clean quiet acoustic room presence, crisp composed female surgeon voice.",
        "V-01 // 首席外科 艾琳娜", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "但在 B 区手术台上，唯有抽签与绝对公平才配叫文明，",
        "But on Sector B's operating table, only triage lots and blind fairness qualify as civilization—",
        "でもB区の手術台では、抽選と絶対的公平だけが文明よ——",
        spoken_mandarin="但在B区手术台上，唯有抽签与绝对公平才配叫文明。",
        dialogue_window=("00:00.40", "00:06.60"),
        chain_prev="a2m_03",
    ),
    make_shot(
        "a2m_05", "ep0_sc00a2_canteen_clash", "ep0_canteen_elena_scalpel.jpg", 192, 0.45, 31305,
        "Seamless continuation of the stern female surgeon: folding the sterile gauze pad down beside her steel tray, she delivers her chilling conclusion with cold steady eyes.",
        "Crisp cloth fold sound, icy clinical female voice.",
        "V-01 // 首席外科 艾琳娜", "V-01 // DR. ELENA VANCE", "V-01 // エレナ・ヴァンス医師",
        "人情填不饱三十张病床的止痛针。",
        "sentiment never stretches morphine across thirty beds.",
        "情けは30床分の鎮痛剤を増やしてはくれないのよ。",
        spoken_mandarin="人情，填不饱三十张病床的止痛针。",
        dialogue_window=("00:00.45", "00:06.40"),
        chain_prev="a2m_04",
    ),

    # ================= 4. ep0_sc00a2_canteen_corners =================
    make_shot(
        "a2k_01", "ep0_sc00a2_canteen_corners", "ep0_corner_arthur_canteen.jpg", 243, 0.35, 31401,
        "Shadowed stainless corner booth inside the same warm amber riveted mess hall: the bespectacled British auditor signs the pale blue 3,800m engineering change slip opposite the Scandinavian deputy, folds the blue carbon duplicate briskly into his inner coat pocket, and speaks dryly.",
        "Crisp ballpoint pen scratching signature, paper fold into coat pocket, muted canteen murmur, dry clipped male voice.",
        "V-03 // 行政审计 亚瑟（会签 3,800m 变更单）", "V-03 // ARTHUR STERLING", "V-03 // アーサー・スターリング",
        "形式要件审完了——出事按签字人追溯。",
        "Formal requirements verified. If anything goes wrong, liability traces strictly to the signatory.",
        "形式要件は確認済みだ——問題が起きれば署名者へ遡及する。",
        spoken_mandarin="形式要件审完了——出事，按签字人追溯。",
        dialogue_window=("00:00.60", "00:07.80"),
    ),
    make_shot(
        "a2k_02", "ep0_sc00a2_canteen_corners", "ep0_corner_ana.jpg", 192, 0.35, 30402,
        "Quiet dim table corner: the tough Brazilian female diver sits expressionless, tucking a crisp banking penalty receipt smoothly into her thick dive logbook as a bookmark and sliding the glossy station safety pamphlet away across brushed steel.",
        "Crisp paper slip sliding into logbook, dull slide across steel, blunt laconic female voice.",
        "V-05 // 高压潜水员 安娜", "V-05 // ANA RIBEIRO", "V-05 // アナ・リベイロ",
        "字签在上面了。",
        "My signature's already on the €100,000 penalty slip.",
        "署名は10万ユーロの罰金領収書にあるだろ。",
        spoken_mandarin="字，签在上面了。",
        dialogue_window=("00:01.00", "00:05.20"),
        reuse_v1=True,
    ),
    make_shot(
        "a2k_03", "ep0_sc00a2_canteen_corners", "ep0_corner_ingrid.jpg", 192, 0.40, 30403,
        "Dim sodium corner booth: the soft-spoken blonde psychologist places a tin water mug into the pale violently trembling hands of the exhausted radio operator while covertly lowering her eyes to cross out a medical box on the foreground clipboard.",
        "Rattling tin mug in trembling hands, subtle pen scratch on clipboard, velvety soothing female whisper.",
        "V-06 // 心理医生 英格丽（悄改汉森评估）", "V-06 // DR. INGRID SOLBERG", "V-06 // イングリッド医師",
        "只是极夜前嗜睡焦虑，撑撑就过去了。（悄划掉返航建议，改勾心理适应性极佳）",
        "Just pre-polar-night fatigue. Hang in there... (quietly scratches out evacuation and checks FIT FOR DUTY)",
        "極夜前の軽い不安よ。少し耐えれば落ち着くわ。（密かに帰還勧告を消し適性優に丸）",
        spoken_mandarin="只是极夜前嗜睡焦虑，撑撑就过去了。",
        dialogue_window=("00:00.45", "00:06.20"),
        reuse_v1=True,
    ),
    make_shot(
        "a2k_04", "ep0_sc00a2_canteen_corners", "ep0_corner_linmei_hannah.jpg", 192, 0.30, 30404,
        "Left half near frosty porthole: the quiet East Asian cryo-biologist kneels wiping spilled chemical buffer off the linoleum floor and calmly signs the accountability slip beside the apologetic intern.",
        "Cloth wiping linoleum floor, calm quiet female voice.",
        "V-07 // 低温生物 林梅", "V-07 // DR. LIN MEI", "V-07 // リン・メイ博士",
        "去休息吧，四号冷库别碰。",
        "Go rest. Don't touch Vault 4.",
        "休みなさい。第4冷凍庫には触れないで。",
        spoken_mandarin="去休息吧，四号冷库别碰。",
        dialogue_window=("00:00.80", "00:05.80"),
        reuse_v1=True,
    ),
    make_shot(
        "a2k_05", "ep0_sc00a2_canteen_corners", "ep0_corner_linmei_hannah.jpg", 243, 0.35, 31405,
        "Seamless rightward pan to the icy window table beside the same porthole: the strict bespectacled German life-support technician pushes away an offered ceramic cocoa mug five centimeters without glancing up from her logbook and replies sharply.",
        "Ceramic cocoa mug sliding across brushed steel table, pen click, sharp crisp female voice.",
        "V-08 // 维生技师 汉娜（拒绝克莱尔补贴）", "V-08 // HANNAH WEISS", "V-08 // ハンナ・ヴァイス",
        "克莱尔：老滤芯读数放宽十格，补贴咱俩分？ 汉娜：不用。原始串口已锁定。",
        "Claire: Pad the old canister log by ten ticks? Hannah: No. Raw serial port is already locked.",
        "クレア「古い数値少し緩めない？」ハンナ「結構。シリアル生データは固定済みよ。」",
        spoken_mandarin="不用。原始串口已锁定。",
        dialogue_window=("00:04.20", "00:08.50"),
        chain_prev="a2k_04",
    ),

    # ================= 5. prequel_icecore_breach =================
    make_shot(
        "a3b_01", "prequel_icecore_breach", "prequel_icecore_breach.jpg", 192, 0.0, 30501,
        "Shaking subterranean drilling control rig under -280m permafrost floor: analog manifold gauges redline violently upward past 340 into 490 bar as superheated rock tremors shake steel catwalks and three green console CRT monitors simultaneously snap blood-red.",
        "Subterranean bedrock groaning rumble, screeching metal overpressure relief hiss, rising low industrial tremor.",
        "第 14 天 02:14 // 3,800m 古生代基岩主井", "DAY 14 · 02:14 // 3,800M BEDROCK RIG", "14日目 02:14 // 地下3,800m掘削室",
        "第 14 天 02:14 · 钻头穿透 280 米永冻层跌入 3,800 米超热液空腔，压力表自 340 bar 瞬间顶爆 490 bar！",
        "DAY 14 · 02:14 · Bit pierces 280m permafrost into a 3,800m thermal brine cavity—pressure spikes from 340 to 490 bar!",
        "14日目 02:14 · 3,800mの熱水空洞に突入。井圧が340→490barへ急騰！",
        reuse_v1=True,
    ),
    make_shot(
        "a3b_02", "prequel_icecore_breach", "prequel_icecore_breach.jpg", 192, 0.0, 31502,
        "Direct continuous escalation of the industrial blowout: scalding white high-pressure steam erupts denser across steel decking under pulsing blood-red emergency strobe lights as dual hydraulic BOP manifolds shudder violently.",
        "Explosive superheated steam blowout roar, hydraulic valve lockup shriek, shattering glass overhead, pulsing crimson klaxon siren.",
        "第 14 天 02:16 // BOP 防喷器卡死 · 蒸汽倒灌", "DAY 14 · 02:16 // BOP VALVES JAMMED", "14日目 02:16 // 防噴装置ロック",
        "两套防喷器（BOP）液压阀死卡！超高温高压蒸汽倒灌全廊，灯管轰碎切入血红应急灯——",
        "Dual BOP hydraulic valves jam shut! Superheated steam surges backwards, shattering overhead lamps into red emergency glare!",
        "防噴装置の油圧弁が固着！高圧蒸気が逆流し照明が砕け、全廊下が赤い非常灯へ切り替わる！",
        chain_prev="a3b_01",
    ),
    make_shot(
        "a3b_03", "prequel_icecore_breach", "prequel_icecore_breach.jpg", 192, 0.0, 31503,
        "Seamless continuation inside the steam-choked crimson-lit rig cavern: sparks shower down from the overhead PA loudspeaker horn above the steel gangway while a frantic distorted voice screams evacuation orders.",
        "Roaring steam leaks, distorted crackling PA horn alarm, frantic shouted male Mandarin voice over industrial klaxon.",
        "钻井公频 // 紧急失真通讯", "DRILL RIG PA // EMERGENCY", "掘削室無線 // 緊急通信",
        "平衡舱锁扣爆了！托尔和老孙冲进回风道了——封外闸！",
        "Balance lock blew! Thor and Lao Sun ran into the return duct—seal the outer gate!",
        "均衡室のロックが吹き飛んだ！トールと老孫が還気坑に飛び込んだ——外門を閉じろ！",
        spoken_mandarin="平衡舱锁扣爆了！托尔和老孙冲进回风道了！封外闸！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="a3b_02",
    ),
    make_shot(
        "a3b_04", "prequel_icecore_breach", "prequel_icecore_breach.jpg", 192, 0.0, 31504,
        "Direct continuation as thick ribbed steel bulkhead doors drop rapidly down into the steam-filled corridor under pulsing crimson strobes, slamming shut in a shower of sparks.",
        "Heavy hydraulic blast door slamming shut on steel floor, subsiding steam hiss, distant echoing emergency klaxon.",
        "第 14 天 02:19 // 全站一级物理封锁", "DAY 14 · 02:19 // LEVEL-1 LOCKDOWN", "14日目 02:19 // 第1種物理封鎖",
        "平衡闸门轰然落下，托尔·伯格与老孙生死未卜……站长下令物理切断中枢与八座外环孤舱间的恒温外廊。",
        "Blast doors slam down; Thor Berg and Lao Sun vanish. The Commander orders outer connecting corridors physically severed.",
        "隔離扉が落下しトールと老孫は行方不明に。所長は中枢と外環8区画の連絡路遮断を下令した。",
        chain_prev="a3b_03",
    ),

    # ================= 6. prologue_01_main =================
    make_shot(
        "a3m_01", "prologue_01_main", "ep0_briefing_topology.jpg", 243, 0.15, 31601,
        "Locked steady medium-wide camera across the glowing 3D holographic outpost map in the cold steel command room (NO extreme facial close-up; keep full table and standing commander framed cleanly): stern graying commander Lindqvist points down at the central hub cluster while trainees listen silently.",
        "Sterile ventilation hum, crisp glowing holographic scan pulse, cold authoritative older male voice.",
        "站长 林德奎斯特 // 立体拓扑简报", "COMMANDER LINDQVIST", "リンドクヴィスト所長",
        "听清楚全站拓扑：食堂、母本库、宿舍与码头竖井合称中枢主站；",
        "Memorize station topology: Mess hall, Specimen Vault, crew bunks, and Sub Shaft form the Central Hub;",
        "基地構造を叩き込め。食堂・母本庫・宿舎・潜水艦立坑が中枢主駅だ；",
        spoken_mandarin="听清楚全站拓扑：食堂、母本库、宿舍与码头竖井合称中枢主站。",
        dialogue_window=("00:00.55", "00:08.50"),
    ),
    make_shot(
        "a3m_02", "prologue_01_main", "ep0_briefing_topology.jpg", 243, 0.20, 31602,
        "Seamless continuation across the glowing holographic outpost map: staying in medium framing above the table, the stern commander sweeps one gloved finger around the eight isolated cyan outer pods as their radial corridor lines blink red and go dark.",
        "Low ominous hologram pulse tone, cool echoing concrete room acoustics, commanding older male voice.",
        "站长 林德奎斯特 // 外环断流指令", "COMMANDER LINDQVIST", "リンドクヴィスト所長",
        "外围 B 区医疗、二号动力、行政、安保风道、潜水舱、通讯舱、四号冷库与外风井八座孤舱外廊昨晚已物理断流，五夜内供暖将逐一枯竭。",
        "Last night the eight outer pods—Medbay, Bay 2, Admin, Security, Dive Bay, Comms, Vault 4, Exhaust—lost corridor power; heating fails in five nights.",
        "外環8孤立区画への連絡通路は昨夜物理遮断され、5夜以内に暖房が順次停止する。",
        spoken_mandarin="外围B区医疗、二号动力、行政、安保、潜水、通讯、冷库与外风井八座孤舱昨晚已断流，五夜内供暖枯竭。",
        dialogue_window=("00:00.40", "00:09.20"),
        chain_prev="a3m_01",
    ),
    make_shot(
        "a3m_03", "prologue_01_main", "ep0_briefing_topology.jpg", 243, 0.25, 31603,
        "Smooth slow push-in toward the commander beside the lone amber-glowing Gate 0 chokepoint on the map: he raises his gaze steadily onto the foreground watchstander and speaks with icy authority.",
        "Cold quiet briefing room hum, severe older male authoritative voice.",
        "站长 林德奎斯特 // 零号闸铁律", "COMMANDER LINDQVIST", "リンドクヴィスト所長",
        "你守的零号闸是外环进入中枢的唯一气密口——核验未过严禁开内闸，违者按叛逃论处。",
        "Gate 0 is the sole airlock from the Outer Ring into the Hub—open without clearance and it's desertion.",
        "第0関門は外環から中枢への唯一の空気閘だ——確認なしで内扉を開ければ反逆罪とみなす。",
        spoken_mandarin="你守的零号闸是外环进入中枢的唯一气密口。核验未过严禁开内闸，违者按叛逃论处。",
        dialogue_window=("00:00.45", "00:08.90"),
        chain_prev="a3m_02",
    ),
    make_shot(
        "a3m_04", "prologue_01_main", "prologue_01_handover.jpg", 192, 0.30, 30604,
        "Inside the dimly lit steel watch booth briefing desk: the stern commander presses down a heavy analog tape recorder button with a sharp mechanical click and flips open the thick Tromsø personnel transfer dossier.",
        "Sharp metallic cassette record switch click, stiff manila paper pages turning, stern calm older male voice.",
        "站长 林德奎斯特 // 人事档案开启", "COMMANDER LINDQVIST", "リンドクヴィスト所長",
        "托尔两人仍失踪在零下四十六度井区。接掌零号位前复核最后一栏旧账：",
        "Thor and Sun remain missing out in the minus-46 shaft. Before taking Gate 0, confirm your old file:",
        "トールたち2名は零下46度の坑区で行方不明のままだ。着任前に過去記録の最終確認をする：",
        spoken_mandarin="托尔两人仍失踪在零下四十六度井区。接掌零号位前，复核最后一栏旧账：",
        dialogue_window=("00:00.45", "00:06.80"),
        reuse_v1=True,
    ),
    make_shot(
        "a3m_05", "prologue_01_main", "prologue_01_handover.jpg", 192, 0.35, 31605,
        "Seamless continuation across the briefing desk with the glowing red REC switch engaged: tapping one stamped line in the open Tromsø dossier, the commander delivers the sharp interrogation prompt quietly.",
        "Quiet analog tape transport hiss, pen tapping dossier gently, calm cold older male interrogation.",
        "站长 林德奎斯特 // 抉择点 01", "COMMANDER LINDQVIST // DECISION 01", "リンドクヴィスト所長 // 決断 01",
        "过去你们小组漏报隐患连累同事受伤，复盘会上你当时怎么说的？",
        "When your old team missed a hazard and got a colleague injured, what did you say at the review board?",
        "以前お前の班が危険を見落とし同僚が負傷した時、監査の場で何と答えた？",
        spoken_mandarin="过去你们小组漏报隐患连累同事受伤，复盘会上，你当时怎么说的？",
        dialogue_window=("00:00.45", "00:06.80"),
        chain_prev="a3m_04",
    ),

    # ================= 7. ep0_lonely_watch =================
    make_shot(
        "b1_01", "ep0_lonely_watch", "ep0_op08_handover_booth.jpg", 243, 0.35, 31701,
        "Deep night 02:40 inside cramped Gate 0 steel watchbooth: pale, gaunt, prematurely gray-haired older watchstander #08 thrusts the metal logbook clipboard across to foreground #09 with trembling fingers, speaking hoarsely as emerald CRTs flicker beside them.",
        "60Hz CRT flyback hum, muffled -46C wind outside thick glass, hoarse trembling exhausted male whisper.",
        "前任值班员 #08 // 第 16 天 02:40", "OPERATOR #08 // 02:40 HANDOVER", "前任当直官 #08 // 02:40",
        "#09……剩下的下半夜交给你了，别多问，天亮前替我盯住这扇门。",
        "#09... take the rest of the night shift. Don't ask why—watch that blast door for me till dawn.",
        "#09……残りの夜番は任せた。何も聞かず夜明けまでこの扉を見張ってくれ。",
        spoken_mandarin="零九，剩下的下半夜交给你了。别多问，天亮前替我盯住这扇门。",
        dialogue_window=("00:00.55", "00:08.50"),
    ),
    make_shot(
        "b1_02", "ep0_lonely_watch", "ep0_op08_handover_booth.jpg", 192, 0.35, 31702,
        "Seamless continuation inside the dim green-lit booth: refusing to turn around toward the frosted outer blast window behind him, pale gray-haired #08 leans closer and drops his voice to a harsh urgent warning.",
        "CRT hum and muffled polar wind gusts, urgent cracked older male warning.",
        "前任值班员 #08", "OPERATOR #08", "前任当直官 #08",
        "记住——别靠太近盯着那块防爆玻璃，也别单凭熟人嗓门拉开关。",
        "Remember—keep back from that blast glass, and never pull the lever just on a familiar voice.",
        "いいか——防爆ガラスに顔を近づけるな。馴染みの声だけでレバーを引くなよ。",
        spoken_mandarin="记住！别靠太近盯着那块防爆玻璃，也别单凭熟人嗓门拉开关！",
        dialogue_window=("00:00.40", "00:06.80"),
        chain_prev="b1_01",
    ),
    make_shot(
        "b1_03", "ep0_lonely_watch", "ep0_op08_handover_booth.jpg", 192, 0.25, 31703,
        "Direct seamless continuation in the booth: #08's trembling left hand drops the blue plastic pen onto the console desk while the foreground young watchstander #09 asks anxiously.",
        "Plastic pen clattering lightly onto metal desk, quiet tense room tone, earnest young male voice.",
        "主角 #09", "OPERATOR #09", "主角 #09",
        "老前辈，你手抖得连签字笔都捏不住了——到底外头出什么事了？",
        "Wait—your hands are shaking so badly you can't hold a pen. What happened out there?",
        "先輩、手が震えてペンも握れてないじゃないですか——外で何が起きたんです？",
        spoken_mandarin="老前辈，你手抖得连签字笔都捏不住了……到底外头出什么事了？",
        dialogue_window=("00:00.45", "00:06.60"),
        chain_prev="b1_02",
    ),
    make_shot(
        "b1_04", "ep0_lonely_watch", "ep0_op08_handover_booth.jpg", 141, 0.30, 31704,
        "Seamless continuation: avoiding eye contact, pale half-gray #08 rises stiffly, speaks flatly over his shoulder, and retreats quickly out the shadowed exit leaving #09 alone facing the frosted blast window.",
        "Flat defeated male voice, heavy central-corridor door pneumatic latch clicking shut.",
        "前任值班员 #08", "OPERATOR #08", "前任当直官 #08",
        "按表盯住就是。天亮你就什么都懂了。",
        "Just watch the gauges. You'll understand everything at dawn.",
        "計器通りに監視していろ。夜が明けたら何もかも分かる。",
        spoken_mandarin="按表盯住就是。天亮你就什么都懂了。",
        dialogue_window=("00:00.40", "00:04.80"),
        chain_prev="b1_03",
    ),

    # ================= 8. prologue_02_main =================
    make_shot(
        "b2_01", "prologue_02_main", "ep0_lonely_watch.jpg", 192, 0.25, 30801,
        "Inside Gate 0 booth at 04:15 AM after 20 straight hours awake: exhausted eyelids heavy in dim green CRT glow, the watchstander slumps slightly forward resting his chin over the warm humming console as amber panel lamps softly pulse.",
        "Drowsy low-pass booth fan hum fading quietly, slow heavy breathing, faint amber console alert chirp near 04:15.",
        "第 16 天 04:15 // 连续清醒满 20 小时", "DAY 16 · 04:15 // 20 HOURS AWAKE", "16日目 04:15 // 連続覚醒20時間",
        "替发烧室友汉森连顶白班后你已连续清醒满 20 小时，头一歪抵着温热控制台合上了眼……",
        "After covering sick Hansen's entire day shift, twenty straight hours awake pull your head down onto the warm console...",
        "発熱したハンセンの代務から連続20時間。眠気に抗えず、温かい操作盤に額を落としたその瞬間——",
        reuse_v1=True,
    ),
    make_shot(
        "b2_02", "prologue_02_main", "ep0_inner_door_knock.jpg", 141, 0.0, 30802,
        "Sudden jarring POV turn inside the dark watchbooth toward the heavy riveted inner-corridor blast door leading back into the central hub: crimson-amber warning strobes ignite behind the small square wire-reinforced mesh window as a gloved fist slams three sharp deafening knocks against the wired glass!",
        "Sudden amber alarm chime, THREE loud unmistakable heavy gloved raps on wired steel door glass!",
        "第 16 天 04:15 // 内侧走廊门小窗三响！", "INNER CORRIDOR WINDOW // THREE KNOCKS!", "内側廊下小窓 // 3度の衝撃！",
        "管道报警灯骤然闪红！你身后的中枢内侧走廊门小窗猛然传来三记沉重叩响！",
        "Pipeline sirens flash red! Behind you, three heavy gloved knocks slam against the inner corridor wired glass!",
        "警報灯が赤く点滅！背後の内側廊下ドアの小窓が3度強く叩かれる！",
        reuse_v1=True,
    ),
    make_shot(
        "b2_03", "prologue_02_main", "ep0_inner_door_knock.jpg", 243, 0.20, 31803,
        "Direct seamless continuation facing the wired glass square of the inner steel blast door: lit by pulsing amber corridor strobes through frost-edged wire glass, the stern night supervisor presses close to the grate and barks indignantly into the booth.",
        "Flashing corridor alarm buzzer, muffled stern older male supervisor shouting indignantly through wired door glass.",
        "值班主管 // 内侧走廊门小窗", "SHIFT SUPERVISOR // INNER DOOR", "当直監督 // 内側廊下小窓",
        "零号门灯跳黄三分钟没消警！#09，你刚才在值班台底下睡过去了？！",
        "Gate Zero's amber alert flashed three whole minutes unacknowledged! #09, were you asleep under the console?!",
        "第0関門の黄灯が3分も鳴りっぱなしだぞ！#09、お前まさか居眠りしていたのか？！",
        spoken_mandarin="零号门灯跳黄三分钟没消警！零九，你刚才在值班台底下睡过去了？！",
        dialogue_window=("00:00.50", "00:08.50"),
        chain_prev="b2_02",
    ),

    # ================= 9. ep0_empty_booth =================
    make_shot(
        "c1_01", "ep0_empty_booth", "ep0_empty_booth.jpg", 192, 0.0, 30901,
        "Cold slow pan across the deserted Gate 0 security booth at 07:00 dawn: #08's open locker hangs completely empty, a half-full mug of coffee sits frozen stiff beside blank green CRT terminal logs reading zero normal gate openings.",
        "Hollow 07:00 station shift bell, quiet dead air inside deserted booth, faint metallic locker door rattle.",
        "第 17 天 07:00 // #08 储物柜全空 · 日志归零", "DAY 17 · 07:00 // LOCKER BARE · LOG: 0", "17日目 07:00 // ロッカー空 · 記録0",
        "早钟响过，前任 #08 个人储物柜全空，主机显示零号气密闸及内门正常开关次数 = 0。",
        "Morning bell rings. #08's personal locker stands empty; primary airlock logs read ZERO normal gate openings.",
        "朝の鐘が鳴る。前任#08のロッカーは完全に空、通常開閉記録はゼロのまま。",
        reuse_v1=True,
    ),
    make_shot(
        "c1_02", "ep0_empty_booth", "ep0_empty_booth.jpg", 243, 0.0, 31902,
        "Smooth single-take camera tilt pushing down from the deserted steel console desk lip into the dark underside panel illuminated by stark tungsten worklight, landing directly on the recessed manual mechanical override box with its snipped copper wire seal and black cassette taped in torn yellow electrical tape.",
        "Eerie tense low industrial bass, crisp peel sound of yellow electric tape tearing off cold steel, mechanical cassette deck clunk.",
        "手动越权面板 // 断铅越权 · 黄色胶布磁带", "MANUAL OVERRIDE // SNIPPED SEAL & TAPE", "手動オーバーライド盤 // 鉛封切断",
        "「手动机械越权面板」铜丝铅封被硬生生剪断、越权日志清空！钢台底沿用黄色电工胶布粘着一盘黑磁带——",
        "On the manual override box, the copper lead seal hangs freshly snipped and wiped! Beneath the desk lip sticks a black cassette in yellow tape.",
        "手動オーバーライド盤の銅線鉛封がペンチで切断され記録が消去されている——台の裏には黄色テープで貼られた黒いカセットが！",
        chain_prev="c1_01",
        last_frame_img="ep0_override_cut_seal.jpg",
    ),

    # ================= 10. prequel_op08_warning =================
    make_shot(
        "c2_01", "prequel_op08_warning", "ep0_op08_tape_booth.jpg", 243, 0.45, 32001,
        "Tight haunting 02:30 cassette playback inside the dark CRT-lit Gate 0 booth: pale, gaunt, half-gray-haired watchstander #08 holds the brushed-metal wired handheld mic close to his lips in cold terror, whispering urgently straight into the lens.",
        "Analog cassette hiss, low 50Hz deck flutter, pale exhausted hoarse male voice trembling.",
        "前任值班员 #08 // 02:30 磁带遗言", "OPERATOR #08 // 02:30 TAPE", "前任当直官 #08 // 02:30 遺言",
        "#09，别凭熟人声开门。昨晚失踪的托尔就站在闸室里，连欠我两盒红双喜、给女儿索菲亚买琴都一字不差背得出。",
        "#09, never open for a familiar voice. Missing Thor stood in the lock reciting Sofia's piano and those two packs of Double Happiness word-for-word!",
        "#09、馴染みの声で開けるな。行方不明のトールが昨夜関門に立ち、ソフィアのピアノも紅双喜2箱の貸しも暗唱してみせた！",
        spoken_mandarin="零九，别凭熟人声开门。昨晚失踪的托尔就站在闸室里，连欠我两盒红双喜、给女儿索菲亚买琴都一字不差背得出！",
        dialogue_window=("00:00.40", "00:09.10"),
    ),
    make_shot(
        "c2_02", "prequel_op08_warning", "ep0_op08_tape_booth.jpg", 243, 0.45, 32002,
        "Seamless continuation of pale half-gray #08 leaning closer over the spinning cassette reels: his eyes widen and tremble as he stresses the chilling rule distinguishing real human pain from bloodless bio mimicry.",
        "Analog cassette tape hiss and flutter, urgent desperate older male warning.",
        "前任值班员 #08 // SAY / DO GAP 铁律", "OPERATOR #08 // THE SAY/DO CRACK", "前任当直官 #08 // 鉄則",
        "记住：它们只照你嘴上宣称过的体面人设（SAY）去演，却不知道活人真疼时背叛诺言的裂痕（DO）。和自我介绍分毫不差的，不是人。",
        "Listen: they only perform the respectable self you CLAIM (SAY)—never the crack where a real human betrays their own vow when it hurts (DO). Anything matching its bio is NOT human.",
        "奴らは口先の建前（SAY）だけを演じ、痛みに負けて誓いを破る裂け目（DO）を知らない。自己紹介と寸分違わぬ奴は、人間じゃない。",
        spoken_mandarin="记住：它们只照你嘴上宣称过的体面人设去演，却不知道活人真疼时背叛诺言的裂痕。和自我介绍分毫不差的，不是人！",
        dialogue_window=("00:00.40", "00:09.20"),
        chain_prev="c2_01",
    ),
    make_shot(
        "c2_03", "prequel_op08_warning", "operator09.jpg", 192, 0.40, 32003,
        "Chilling subjective smash-cut looking out through Gate 0's frost-framed wire-reinforced blast glass into blinding snow squalls: a motionless hooded duplicate wearing an identical winter parka with an orange OP-09 patch stands smiling unblinkingly through the ice as #08's trembling cassette voice delivers his final terrified warning, ending in a sharp mechanical tape-stop click.",
        "Terrified trembling final warning over cassette hiss, muffled blizzard wind against glass, abrupt mechanical tape stop clunk and sudden silence.",
        "前任值班员 #08 // 绝笔警句", "OPERATOR #08 // FINAL WARNING", "前任当直官 #08 // 最期の警告",
        "今晚两点我在玻璃外看见了自己，出去确认。若我从外门回来，别开！",
        "Tonight at two I saw myself outside the glass. Going out to check. If I come back through the outer door—do NOT open!",
        "今夜2時、ガラスの外に俺自身がいた。確かめに出る。外扉から俺が戻ってきても——絶対に開けるな！",
        spoken_mandarin="今晚两点我在玻璃外看见了自己，出去确认。若我从外门回来，别开！",
        dialogue_window=("00:00.40", "00:06.80"),
    ),

    # ================= 11. prologue_03_main =================
    make_shot(
        "c3_01", "prologue_03_main", "prologue_03.jpg", 192, 0.0, 31101,
        "Through Gate 0's storm-battered blast pane at 23:55, a blinding -46C blizzard squall violently snaps the steel exterior satellite antenna mast sideways in showering sparks before darkness swallows the floodlights, leaving only a single green teletype glow inside.",
        "Metallic satellite mast snapping violently in howling gale, burst of RF static cutoff, single clean green teletype ping.",
        "第 17 天 23:55 // 主天线扯断 · 鹦鹉螺 0 号", "DAY 17 · 23:55 // ANTENNA SNAPPED", "17日目 23:55 // アンテナ破断",
        "屋外 -46°C 暴雪扯断主天线，全站对外彻底断联——唯余屏幕底行绿字：「码头铠装硬线联通：鹦鹉螺 0 号（06:00 待命）」。",
        "The -46C blizzard snaps the main antenna. Only one armored dock hardwire survives: 'NAUTILUS-0 (06:00 STANDBY)'.",
        "吹雪が主アンテナを引きちぎり全線孤立。画面最下段にだけ緑の文字『ノーチラス0号（06:00 待機）』。",
        reuse_v1=True,
    ),
    make_shot(
        "c3_02", "prologue_03_main", "prologue_03.jpg", 192, 0.0, 32102,
        "Direct seamless continuation pushing slowly inward across the frosted booth console: an icy heavy steel gate key rests coldly beside green hardwire status reflections against the blizzard-lashed blast pane, waiting in dead Polar Night stillness for the first knock.",
        "Howling blizzard outside steel pane fading beneath resonant ominous low brass cinema hold.",
        "抉择点 03 // 最后艇席独白", "DECISION 03 // LAST SUBMARINE SEAT", "決断 03 // 最後の潜水艦席",
        "冰冷的钢制密钥压在你掌心。想起往昔只剩最后一个艇位却留给自己的那一夜，你对自己低声说：",
        "The cold steel gate key presses into your palm. Remembering that night when only one submarine seat remained and you kept it for yourself, you whisper:",
        "冷たい鋼の鍵が掌に食い込む。ただ一席残された脱出枠を自分に選んだあの夜を思い出し、呟く——",
        chain_prev="c3_01",
    ),
]

REEL_FADES: dict[str, tuple[float, float]] = {
    "ep0_sc00a1_arrival": (0.0, 0.65),
    "ep0_sc00a2_canteen_crew": (0.60, 0.0),
    "ep0_sc00a2_canteen_clash": (0.0, 0.0),
    "ep0_sc00a2_canteen_corners": (0.0, 0.80),
    "prequel_icecore_breach": (0.70, 0.80),
    "prologue_01_main": (0.70, 0.60),
    "ep0_lonely_watch": (0.65, 0.75),
    "prologue_02_main": (0.70, 0.65),
    "ep0_empty_booth": (0.70, 0.35),
    "prequel_op08_warning": (0.35, 0.75),
    "prologue_03_main": (0.75, 0.0),
}

REEL_ORDER = [
    "ep0_sc00a1_arrival",
    "ep0_sc00a2_canteen_crew",
    "ep0_sc00a2_canteen_clash",
    "ep0_sc00a2_canteen_corners",
    "prequel_icecore_breach",
    "prologue_01_main",
    "ep0_lonely_watch",
    "prologue_02_main",
    "ep0_empty_booth",
    "prequel_op08_warning",
    "prologue_03_main",
]

PILOT_SHOT_IDS = {"a1_02", "a2c_02"}


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
    raw_dir = Path("/content/ep0_raw_inputs")
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
        Path("/tmp/hf_ep0_h3.txt").write_text("".join(aria_lines))
        sh(
            "aria2c -i /tmp/hf_ep0_h3.txt -j 6 -x 16 -s 16 -k 16M "
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
        # Fallback if dual-frame bridge rejected: open straight on target macro frame
        wf["10"]["inputs"]["image"] = lf_img

    wf["20"] = {
        "class_type": "MiniMaxH3ImageToVideo",
        "inputs": i2v_inputs,
    }

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
            "filename_prefix": f"ep0_h3_{shot['id']}",
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
            # Locate newest matching file under OUTPUT_DIR
            candidates = sorted(OUTPUT_DIR.rglob(f"ep0_h3_{shot_id}*.mp4"), key=lambda p: p.stat().st_mtime)
            if not candidates:
                # Fallback search outputs metadata
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
        for d in (DRIVE_SHOTS_DIR, V1_DRIVE_SHOTS_DIR):
            cand = d / f"{prev_shot_id}.mp4"
            if cand.exists() and cand.stat().st_size > 150_000:
                shutil.copy2(cand, prev_mp4)
                break
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
    print(f"=== [4/4] Rendering {len(targets)} MiniMax-H3 v2 Shots (pilot={pilot_only}) ===", flush=True)
    for idx, shot in enumerate(targets, 1):
        out_p = SHOTS_DIR / f"{shot['id']}.mp4"
        if (not out_p.exists() or out_p.stat().st_size <= 150_000) and drive_ready():
            drv_p = DRIVE_SHOTS_DIR / f"{shot['id']}.mp4"
            if drv_p.exists() and drv_p.stat().st_size > 150_000:
                shutil.copy2(drv_p, out_p)
                print(f"☁️ [{idx}/{len(targets)}] Restored {shot['id']} from v2 Drive ({out_p.stat().st_size // 1024} KB)", flush=True)
            elif shot.get("reuse_v1"):
                v1_p = V1_DRIVE_SHOTS_DIR / f"{shot['id']}.mp4"
                if v1_p.exists() and v1_p.stat().st_size > 150_000:
                    shutil.copy2(v1_p, out_p)
                    DRIVE_SHOTS_DIR.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(v1_p, drv_p)
                    print(f"♻️ [{idx}/{len(targets)}] Reused v1 anchor {shot['id']} ({out_p.stat().st_size // 1024} KB)", flush=True)
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
    print("PILOT_DONE" if pilot_only else "ALL_46_SHOTS_DONE", flush=True)


def stitch_reels() -> None:
    shot_reels = {s["reel"] for s in SHOTS}
    assert shot_reels == set(REEL_ORDER), f"Orphaned reel(s): {shot_reels - set(REEL_ORDER)}"

    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    posters_dir = FINAL_DIR / "posters"
    posters_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}
    tmp_dir = Path("/tmp/ep0_stitch_tmp")
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
            # Trim 1 duplicate boundary frame (42ms @ 24fps) when directly chaining from previous shot in same reel
            trim_ss = "-ss 0.042 " if (prev_sid and s.get("chain_prev") == prev_sid and raw_dur > 1.5) else ""
            eff_dur = max(0.2, raw_dur - (0.042 if trim_ss else 0.0))
            norm_p = tmp_dir / f"{s['id']}_norm.mp4"
            af_edge = f"afade=t=in:st=0:d=0.04,afade=t=out:st={max(0.05, eff_dur - 0.04):.3f}:d=0.04"
            if reel_id == "prequel_op08_warning":
                vf = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24,eq=saturation=0.65:contrast=1.10,drawgrid=w=1280:h=4:t=1:c=black@0.20,vignette=PI/4,format=yuv420p"
                af = f"highpass=f=300,lowpass=f=3400,acompressor=threshold=-18dB:ratio=4:attack=3:release=50,{af_edge},aresample=48000"
            else:
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
            f"🎞️ Stitched {reel_id:26s} | {final_dur:6.2f}s | {final_p.stat().st_size / (1024 * 1024):5.2f} MB | {len(cues)} cues",
            flush=True,
        )

    man_path = FINAL_DIR / "ep0_h3_manifest.json"
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
