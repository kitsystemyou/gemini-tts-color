"""Gemini TTS の音声定義メタデータ。"""

from typing import List, Dict, Any

VOICE_LIST: List[Dict[str, Any]] = [
    {"name": "Zephyr", "trait": "Bright", "category": "Energetic", "gender_hint": "Neutral/Higher", "desc": "明るく快活な響き"},
    {"name": "Puck", "trait": "Upbeat", "category": "Energetic", "gender_hint": "Male/Playful", "desc": "軽快で陽気、親しみやすい"},
    {"name": "Charon", "trait": "Informative", "category": "Professional", "gender_hint": "Male/Deep", "desc": "落ち着きがあり情報伝達に最適"},
    {"name": "Kore", "trait": "Firm", "category": "Professional", "gender_hint": "Female/Clear", "desc": "芯があり明瞭で聞き取りやすい"},
    {"name": "Fenrir", "trait": "Excitable", "category": "Energetic", "gender_hint": "Male/Energetic", "desc": "エネルギッシュで感情表現豊か"},
    {"name": "Leda", "trait": "Youthful", "category": "Gentle", "gender_hint": "Female/Youthful", "desc": "若々しく透明感のある声"},
    {"name": "Orus", "trait": "Firm", "category": "Professional", "gender_hint": "Male/Firm", "desc": "力強く安定感のあるアナウンス向け"},
    {"name": "Aoede", "trait": "Breezy", "category": "Gentle", "gender_hint": "Female/Breezy", "desc": "爽やかで軽やかな語り口"},
    {"name": "Callirrhoe", "trait": "Easy-going", "category": "Casual", "gender_hint": "Female/Relaxed", "desc": "おおらかでリラックスした雰囲気"},
    {"name": "Autonoe", "trait": "Bright", "category": "Energetic", "gender_hint": "Female/Bright", "desc": "華やかで明るいトーン"},
    {"name": "Enceladus", "trait": "Breathy", "category": "Expressive", "gender_hint": "Male/Breathy", "desc": "息遣いが感じられる繊細な声"},
    {"name": "Iapetus", "trait": "Clear", "category": "Professional", "gender_hint": "Male/Clear", "desc": "明瞭で筋道の通ったクリアな響き"},
    {"name": "Umbriel", "trait": "Easy-going", "category": "Casual", "gender_hint": "Male/Relaxed", "desc": "気さくで落ち着いた自然体な語り"},
    {"name": "Algieba", "trait": "Smooth", "category": "Gentle", "gender_hint": "Female/Smooth", "desc": "滑らかで耳馴染みの良い声色"},
    {"name": "Despina", "trait": "Smooth", "category": "Gentle", "gender_hint": "Female/Smooth", "desc": "上品で柔らかくスムーズな語り"},
    {"name": "Erinome", "trait": "Clear", "category": "Professional", "gender_hint": "Female/Clear", "desc": "透き通った明瞭なトーン"},
    {"name": "Algenib", "trait": "Gravelly", "category": "Expressive", "gender_hint": "Male/Gravelly", "desc": "ハスキーで渋みのある魅力的な声"},
    {"name": "Rasalgethi", "trait": "Informative", "category": "Professional", "gender_hint": "Male/Intellectual", "desc": "知的で解説・ナレーション向け"},
    {"name": "Laomedeia", "trait": "Upbeat", "category": "Energetic", "gender_hint": "Female/Upbeat", "desc": "前向きで朗らかなトーン"},
    {"name": "Achernar", "trait": "Soft", "category": "Gentle", "gender_hint": "Female/Soft", "desc": "柔らかく包み込むような語り口"},
    {"name": "Alnilam", "trait": "Firm", "category": "Professional", "gender_hint": "Male/Firm", "desc": "堂々とした落ち着きのある声"},
    {"name": "Schedar", "trait": "Even", "category": "Professional", "gender_hint": "Neutral/Calm", "desc": "フラットで安定した聞きやすいトーン"},
    {"name": "Gacrux", "trait": "Mature", "category": "Professional", "gender_hint": "Male/Mature", "desc": "成熟した深みと重厚感のある響き"},
    {"name": "Pulcherrima", "trait": "Forward", "category": "Energetic", "gender_hint": "Female/Forward", "desc": "はつらつとして前向きなトーン"},
    {"name": "Achird", "trait": "Friendly", "category": "Casual", "gender_hint": "Male/Friendly", "desc": "親しみやすく温かい語り口"},
    {"name": "Zubenelgenubi", "trait": "Casual", "category": "Casual", "gender_hint": "Male/Casual", "desc": "気軽でカジュアルな日常会話向け"},
    {"name": "Vindemiatrix", "trait": "Gentle", "category": "Gentle", "gender_hint": "Female/Gentle", "desc": "優しく穏やかな癒し系の声"},
    {"name": "Sadachbia", "trait": "Lively", "category": "Energetic", "gender_hint": "Female/Lively", "desc": "躍動感があり生き生きとしたトーン"},
    {"name": "Sadaltager", "trait": "Knowledgeable", "category": "Professional", "gender_hint": "Male/Scholarly", "desc": "博識で説得力のある解説トーン"},
    {"name": "Sulafat", "trait": "Warm", "category": "Gentle", "gender_hint": "Female/Warm", "desc": "温もりがあり親密な印象の声"},
]

VOICE_NAMES = [v["name"] for v in VOICE_LIST]
