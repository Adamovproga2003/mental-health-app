import random
import re
from functools import lru_cache
from typing import Optional

try:
    import pymorphy2
    _morph = pymorphy2.MorphAnalyzer(lang="uk")
    PYMORPHY_AVAILABLE = True
    print("[emotion_analyzer] pymorphy2 (uk) initialized OK")
except Exception as e:
    _morph = None
    PYMORPHY_AVAILABLE = False
    print(f"[emotion_analyzer] pymorphy2 not available: {e}")

MOOD_TIPS: dict[str, list[str]] = {
    "Happy": [
        "Продовжуйте плекати те, що приносить вам радість.",
        "Поділіться своєю позитивною енергією з кимось поруч.",
        "Використайте цей момент, щоб зробити щось, що відкладали.",
        "Запишіть три речі, за які ви вдячні сьогодні.",
        "Відзначте своє досягнення — ви заслуговуєте на це.",
        "Дозвольте цій радості надихнути вас на нову ціль.",
    ],
    "Sad": [
        "Дозвольте собі відчути смуток — це нормально і природно.",
        "Зверніться до друга або запишіть свої думки.",
        "Спробуйте коротку прогулянку, щоб змінити настрій.",
        "Подбайте про себе: тепла їжа, відпочинок, улюблена музика.",
        "Пам'ятайте: цей стан тимчасовий, і завтра може бути інакше.",
        "М'яка фізична активність — йога або розтяжка — допоможе тілу розслабитись.",
    ],
    "Angry": [
        "Зробіть кілька глибоких вдихів перед тим, як реагувати.",
        "Фізична активність допоможе зняти напругу.",
        "Визначте, яка ваша потреба зараз не задоволена.",
        "Напишіть про свої почуття — не надсилайте, просто виразіть.",
        "Вийдіть на свіже повітря і порахуйте до десяти.",
        "Спитайте себе: чи буде це важливо через рік?",
    ],
    "Fear": [
        "Назвіть те, чого боїтесь — усвідомлення зменшує страх.",
        "Зосередьтеся на тому, що зараз у вашій владі.",
        "Спробуйте дихальну вправу 4-7-8 для заспокоєння.",
        "Поговоріть з кимось, кому довіряєте, про свою тривогу.",
        "Розбийте велику проблему на маленькі кроки.",
        "Нагадайте собі про час, коли ви вже долали щось схоже.",
    ],
    "Surprise": [
        "Дайте собі хвилину, щоб обробити те, що сталося.",
        "Цікавість — це корисно. Дослідіть, що вас здивувало.",
        "Запитайте себе: що нового ця ситуація відкриває?",
        "Поділіться своїм здивуванням з кимось — разом легше осмислити.",
        "Прийміть несподіване як можливість для росту.",
    ],
}

# Keywords stored as lemmas (normal forms).
# pymorphy2 will reduce any inflected form to these before matching.
KEYWORDS: dict[str, set[str]] = {
    "Happy": {
        # lemmas
        "щасливий", "радість", "радісний", "чудовий", "веселий", "задоволений",
        "кохати", "любити", "любов", "посмішка", "сміятися", "сміх",
        "прекрасний", "добре", "класний", "крутий", "відмінний",
        "захоплення", "натхнення", "вдячний", "радіти", "тішитися",
        # common inflected forms (fallback when pymorphy2 unavailable)
        "щаслива", "щасливо", "радий", "рада", "раді",
        "радію", "радіє", "радіємо", "радістю", "радощі",
        "люблю", "любить", "кохаю", "посміхаюся", "тішуся",
        # English
        "happy", "joy", "great", "wonderful", "excited", "love", "amazing",
        "smile", "laugh", "fantastic", "excellent", "grateful",
    },
    "Sad": {
        # lemmas
        "сумний", "смуток", "сумувати", "скучати", "нудьгувати",
        "плакати", "сльоза", "горе", "горювати", "самотній",
        "боляче", "біль", "депресія", "пригнічений", "нещасний",
        "журба", "розчарований", "втомитися", "важко", "засмучений",
        "відчай", "відчайдушний", "безнадія", "безнадійний", "зневіра",
        # common inflected forms
        "сумно", "сумна", "сумую", "сумує", "сумуємо",
        "скучаю", "скучає", "нудьгую", "нудьгує",
        "плачу", "плаче", "плачемо", "сльози",
        "самотньо", "розчарована", "втомився", "втомилася",
        "відчаю", "відчаї", "відчаєм",
        # English
        "sad", "unhappy", "depressed", "cry", "tear", "grief", "lonely",
        "hurt", "pain", "disappointed", "tired", "despair",
    },
    "Angry": {
        # lemmas
        "злий", "злість", "злитися", "гнів", "гніватися", "роздратований",
        "ненавидіти", "ненависть", "дратувати", "лютий", "лютувати",
        "обурений", "несправедливо", "злобний", "лють", "лютість",
        # common inflected forms
        "зла", "злюся", "злиться", "гніваюся", "гнівається",
        "ненавиджу", "ненавидить", "дратує", "дратуєш",
        "лютую", "лютує", "обурена", "роздратована",
        "люттю", "люті",
        # English
        "angry", "mad", "furious", "rage", "hate", "annoyed", "frustrated", "upset",
    },
    "Fear": {
        # lemmas
        "страх", "страшний", "боятися", "тривога", "тривожний",
        "нервувати", "нервовий", "переживати", "панікувати", "паніка",
        "хвилюватися", "хвилювання", "небезпека", "стрес", "лякатися",
        # common inflected forms
        "страшно", "страшить", "боюся", "боюсь", "боїться", "боїмось",
        "тривожно", "тривожна", "нервую", "нервує",
        "переживаю", "переживає", "панікую", "панікує",
        "хвилююся", "хвилюється", "лякаюся", "лякається",
        # English
        "fear", "scared", "anxious", "anxiety", "worry", "nervous", "afraid", "panic", "stress",
    },
    "Surprise": {
        # lemmas
        "здивований", "здивування", "несподіваний", "неймовірний", "шокований",
        "шок", "неочікуваний", "неочікувано",
        # common inflected forms
        "здивована", "здивовано", "несподівано", "неймовірно", "шокована",
        "вау", "wow",
        "шоку", "шоком", "неочікувана", "неочікуваним",
        # English
        "surprised", "shocked", "unexpected", "astonished", "amazed", "shock",
    },
}


# Suffix rules for Ukrainian verb forms → infinitive (longest first to avoid partial matches).
# Used as fallback when pymorphy2 is unavailable so inflected forms still match keyword lemmas.
_UK_SUFFIXES: list[tuple[str, str]] = [
    # reflexive past tense
    ("увалася", "уватися"), ("увалась", "уватися"),
    ("увався",  "уватися"), ("увалися", "уватися"), ("увались", "уватися"),
    ("ювалася", "юватися"), ("ювалась", "юватися"),
    ("ювався",  "юватися"), ("ювалися", "юватися"),
    ("ялася",   "ятися"),   ("ялась",   "ятися"),
    ("явся",    "ятися"),   ("ялися",   "ятися"),   ("ялись",   "ятися"),
    ("илася",   "итися"),   ("илась",   "итися"),
    ("ився",    "итися"),   ("илися",   "итися"),   ("ились",   "итися"),
    ("алася",   "атися"),   ("алась",   "атися"),
    ("ався",    "атися"),   ("алися",   "атися"),   ("ались",   "атися"),
    # past tense -увати / -ювати
    ("увала", "увати"), ("ували", "увати"), ("увало", "увати"),
    ("ювала", "ювати"), ("ювали", "ювати"), ("ювало", "ювати"),
    # past tense -яти
    ("яла", "яти"), ("яв", "яти"), ("яли", "яти"), ("яло", "яти"),
    # past tense -ити
    ("ила", "ити"), ("ив", "ити"), ("или", "ити"), ("ило", "ити"),
    # past tense -ати  (keep last — short suffix, broadest match)
    ("ала", "ати"), ("ав", "ати"), ("али", "ати"), ("ало", "ати"),
]


def _fallback_lemmatize(word: str) -> str:
    for suffix, replacement in _UK_SUFFIXES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 2:
            return word[:-len(suffix)] + replacement
    return word


@lru_cache(maxsize=4096)
def _lemmatize(word: str) -> str:
    if PYMORPHY_AVAILABLE and _morph:
        parses = _morph.parse(word)
        if parses:
            return parses[0].normal_form
    return _fallback_lemmatize(word)


def _is_latin(text: str) -> bool:
    latin = sum(1 for c in text if c.isalpha() and ord(c) < 256)
    total = sum(1 for c in text if c.isalpha()) or 1
    return latin / total > 0.8


def analyze_text_emotions(text: str) -> dict[str, float]:
    if not text or not text.strip():
        return {}
    return _keyword_analysis(text)


def _keyword_analysis(text: str) -> dict[str, float]:
    text_lower = text.lower()
    raw_words = re.findall(r"[а-яёіїєґa-z']+", text_lower)

    lemmas = [_lemmatize(w) for w in raw_words]
    total = max(len(lemmas), 1)

    scores: dict[str, float] = {}
    for emotion, kws in KEYWORDS.items():
        count = sum(1 for lem in lemmas if lem in kws)
        # normalize by text length: 1 hit in 10 tokens = 1.0
        scores[emotion] = round(min(count / total * 10, 1.0), 3) if count > 0 else 0.0

    return scores


def dominant_emotion(emotions: dict[str, float]) -> Optional[str]:
    if not emotions:
        return None
    return max(emotions, key=emotions.get)


_DEFAULT_TIPS = [
    "Знайдіть хвилину, щоб прислухатися до себе.",
    "Пам'ятайте: кожне відчуття є тимчасовим.",
    "Турбота про себе — це не розкіш, а необхідність.",
]


def get_tips(emotions: dict[str, float]) -> list[str]:
    ranked = [(e, s) for e, s in sorted(emotions.items(), key=lambda x: -x[1]) if s > 0]
    if not ranked:
        return _DEFAULT_TIPS[:]

    dominant = ranked[0][0]
    pool_d = MOOD_TIPS.get(dominant, [])

    # Two significant emotions → mix: 2 from dominant + 1 from secondary
    if len(ranked) >= 2 and ranked[1][1] >= 0.3:
        secondary = ranked[1][0]
        pool_s = MOOD_TIPS.get(secondary, [])
        tips = random.sample(pool_d, min(2, len(pool_d)))
        leftovers = [t for t in pool_s if t not in tips]
        if leftovers:
            tips.append(random.choice(leftovers))
        return tips

    # Single dominant emotion → 3 random tips from its pool
    return random.sample(pool_d, min(3, len(pool_d)))
