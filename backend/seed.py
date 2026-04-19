#!/usr/bin/env python3
"""
Seed script — fills the DB with demo data for admin@gmail.com.

Local Docker:   docker compose exec backend python seed.py
Railway CLI:    railway run --service backend python seed.py
"""
import asyncio
import os
from datetime import datetime, timezone, timedelta

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.models.user import User
from app.models.mood import MoodLog, JournalEntry

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://mental:mental_pass@localhost:5432/mental_health",
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


def ago(days: int, hour: int = 10) -> datetime:
    d = datetime.now(timezone.utc) - timedelta(days=days)
    return d.replace(hour=hour, minute=0, second=0, microsecond=0)


MOOD_LOGS = [
    dict(days=0,  hour=9,  score=8, emoji="😊", label="Happy",     note="Чудовий день! Пробіг 5 км і провів час з родиною",           tags=["Спорт", "Сімʼя"],        emotions={"Happy": 0.85, "Surprise": 0.15}),
    dict(days=1,  hour=10, score=7, emoji="🙂", label="Good",      note="Продуктивний день на роботі, закрив усі задачі",             tags=["Робота"],                emotions={"Happy": 0.60}),
    dict(days=2,  hour=21, score=6, emoji="🙂", label="Good",      note="Трохи втомився, але впорався з дедлайном вчасно",            tags=["Робота", "Сон"],         emotions={"Happy": 0.35, "Sad": 0.25}),
    dict(days=3,  hour=18, score=9, emoji="😁", label="Very Happy", note="Похід у гори — відчуваю себе на вершині світу!",            tags=["Спорт", "Природа"],      emotions={"Happy": 0.90, "Surprise": 0.30}),
    dict(days=4,  hour=20, score=7, emoji="🙂", label="Good",      note="Затишна вечеря з родиною, давно так не сміявся",            tags=["Сімʼя"],                 emotions={"Happy": 0.70}),
    dict(days=5,  hour=11, score=5, emoji="😐", label="Neutral",   note="Важкий день, задачі накопичились і часу не вистачає",       tags=["Робота", "Стрес"],       emotions={"Fear": 0.40, "Sad": 0.35}),
    dict(days=6,  hour=15, score=6, emoji="🙂", label="Good",      note="Читав нову книгу, приходить натхнення поступово",           tags=["Навчання"],              emotions={"Happy": 0.50, "Surprise": 0.20}),
    dict(days=7,  hour=8,  score=8, emoji="😊", label="Happy",     note="Тренування в залі + здорова їжа весь день — ідеально",      tags=["Спорт", "Здоровʼя"],     emotions={"Happy": 0.75}),
    dict(days=8,  hour=14, score=7, emoji="🙂", label="Good",      note="Вихідний день з сімʼєю у парку, сонце і тепло",            tags=["Сімʼя", "Природа"],      emotions={"Happy": 0.65}),
    dict(days=9,  hour=17, score=4, emoji="😕", label="Sad",       note="Непорозуміння з колегою, важко зосередитись на роботі",     tags=["Робота", "Стрес"],       emotions={"Angry": 0.45, "Fear": 0.30, "Sad": 0.40}),
    dict(days=10, hour=12, score=7, emoji="🙂", label="Good",      note="Написав нову секцію диплому — є прогрес і задоволення",     tags=["Навчання", "Творчість"], emotions={"Happy": 0.60, "Surprise": 0.20}),
    dict(days=11, hour=7,  score=8, emoji="😊", label="Happy",     note="Ранковий біг 7 км на світанку — неймовірно бадьорить",      tags=["Спорт"],                 emotions={"Happy": 0.80}),
    dict(days=12, hour=9,  score=5, emoji="😐", label="Neutral",   note="Не виспався через пізній вечір, день пройшов мляво",        tags=["Сон"],                   emotions={"Sad": 0.30, "Happy": 0.25}),
    dict(days=13, hour=16, score=7, emoji="🙂", label="Good",      note="Пікнік на свіжому повітрі з друзями, гарний настрій",      tags=["Сімʼя", "Природа"],      emotions={"Happy": 0.70, "Surprise": 0.15}),
    dict(days=14, hour=10, score=6, emoji="🙂", label="Good",      note="Звичайний день, все в нормі, без сюрпризів",                tags=["Робота"],                emotions={"Happy": 0.45}),
    dict(days=15, hour=19, score=7, emoji="🙂", label="Good",      note="Медитація вранці допомогла зосередитись на головному",      tags=["Здоровʼя", "Навчання"],  emotions={"Happy": 0.55, "Surprise": 0.10}),
    dict(days=16, hour=9,  score=9, emoji="😁", label="Very Happy", note="Отримав відмінну оцінку за курсову — не очікував!",        tags=["Навчання"],              emotions={"Happy": 0.95, "Surprise": 0.60}),
    dict(days=17, hour=20, score=6, emoji="🙂", label="Good",      note="Готував вечерю для родини — приємно турбуватись про близьких", tags=["Сімʼя"],              emotions={"Happy": 0.55}),
    dict(days=18, hour=11, score=4, emoji="😕", label="Sad",       note="Застуда на носі, погано себе почуваю, залишаюсь вдома",     tags=["Здоровʼя", "Сон"],      emotions={"Sad": 0.50, "Fear": 0.20}),
    dict(days=19, hour=8,  score=7, emoji="🙂", label="Good",      note="Вийшов на пробіжку вперше за тиждень — як оновився",        tags=["Спорт"],                 emotions={"Happy": 0.65, "Surprise": 0.15}),
]

JOURNAL_ENTRIES = [
    dict(
        days=1, hour=21,
        title="Перший тиждень з MindCare",
        content="""Вже тиждень веду цей щоденник і помічаю реальні зміни.

Раніше я не звертав уваги на свій емоційний стан — просто жив і реагував на події. Тепер, коли щодня фіксую настрій, починаю бачити закономірності.

Найбільше радує, що спорт дійсно покращує мій настрій. Кожного разу після пробіжки або тренування оцінка настрою вища на 1–2 бали. Це вже не відчуття, а дані.

Хочу продовжувати цей експеримент і подивитися, що ще впливає на моє самопочуття.""",
        sentiment_score=0.72,
        emotions={"Happy": 0.75, "Surprise": 0.30},
        ai_reflection="У вашому записі відчувається справжнє натхнення та бажання пізнати себе глибше. Ваше спостереження про зв'язок між спортом і настроєм — це цінне відкриття, підкріплене вашими власними даними. Продовжуйте фіксувати такі залежності — з часом ви побачите повну картину свого емоційного ритму.",
    ),
    dict(
        days=5, hour=22,
        title="Важкий тиждень на роботі",
        content="""Цей тиждень видався дуже складним.

Дедлайни накопичились, а сили на нулі. Сьогодні посварився з колегою через непорозуміння в задачі — неприємно, але, мабуть, обидва були під тиском.

Відчуваю тривогу і втому одночасно. Важко вимкнути думки про роботу навіть ввечері.

Потрібно знайти спосіб краще відновлюватись. Може, більше гуляти ввечері або спробувати дихальні вправи перед сном?""",
        sentiment_score=-0.48,
        emotions={"Sad": 0.55, "Fear": 0.45, "Angry": 0.35},
        ai_reflection="Ви описуєте стан, який знайомий багатьом — накопичена втома і складність 'вимкнутися' від роботи. Важливо, що ви усвідомлюєте цей стан і вже шукаєте рішення. Ваша ідея з вечірніми прогулянками і дихальними вправами дуже слушна — фізична активність і свідоме дихання допомагають перемкнути нервову систему з режиму стресу.",
    ),
    dict(
        days=8, hour=20,
        title="Подяка за маленькі радощі",
        content="""Три речі, за які я вдячний сьогодні:

1. Сонячний ранок і кава на балконі — прості речі, які дають енергію на цілий день.

2. Мама зателефонувала і ми довго розмовляли — давно так не спілкувались, і це наповнило теплом.

3. Знайшов у парку чудове місце для читання — тепер це мій особистий куток спокою.

Іноді потрібно зупинитись і помітити все те добре, що вже є навколо. Воно є завжди — просто не завжди ми його бачимо.""",
        sentiment_score=0.85,
        emotions={"Happy": 0.90, "Surprise": 0.20},
        ai_reflection="Ваш запис випромінює справжню вдячність і присутність у моменті. Ці три деталі — кава, розмова з мамою, місце для читання — здаються простими, але саме вони формують якість нашого дня. Практика вдячності, яку ви описуєте, — один із найефективніших науково підтверджених способів підтримувати емоційне здоровʼя.",
    ),
    dict(
        days=11, hour=23,
        title="Роздуми про баланс",
        content="""Останнім часом думаю про баланс між роботою, навчанням і особистим часом.

Маю дипломну роботу, підробіток і хочу залишати час для спорту та сімʼї. Іноді здається, що 24 годин просто не вистачає.

Але сьогодні зрозумів: справа не в кількості часу, а в якості присутності. Коли я з родиною — я повністю там. Коли працюю — фокусуюсь тільки на задачах.

Можливо, секрет балансу — це не рівномірний розподіл, а усвідомлений вибір, де бути прямо зараз.""",
        sentiment_score=0.15,
        emotions={"Happy": 0.40, "Sad": 0.20, "Surprise": 0.30},
        ai_reflection="Ви сформулювали дуже зрілу думку про баланс. 'Усвідомлений вибір, де бути прямо зараз' — це і є основа психологічного благополуччя. Не намагайтесь охопити все одночасно; натомість давайте собі дозвіл повністю занурюватись у те, що відбувається в цю хвилину.",
    ),
    dict(
        days=13, hour=19,
        title="Маленька перемога",
        content="""Сьогодні захистив проміжний етап дипломної роботи і отримав хороший відгук від наукового керівника.

Здається дрібницею, але для мене це важливо — кілька тижнів напруженої роботи нарешті дали результат.

Ще місяць тому я сумнівався, чи зможу впоратись з таким обсягом. Зараз бачу, що крок за кроком — і все виходить.

Потрібно частіше нагадувати собі про такі моменти, особливо коли стає важко.""",
        sentiment_score=0.78,
        emotions={"Happy": 0.80, "Surprise": 0.45},
        ai_reflection="Вітаю з цим досягненням! Ваше спостереження про сумніви, які ви подолали — надзвичайно цінне. Фіксуйте такі моменти успіху: в складні часи ви зможете повернутись до цього запису і згадати, що справлялись і з більшим викликом. Це ваш особистий доказ власної стійкості.",
    ),
    dict(
        days=17, hour=21,
        title="Що я дізнався про себе за місяць",
        content="""Минув місяць відколи я почав вести цей щоденник і відстежувати настрій.

Ось що я дізнався про себе:

- Мій настрій найвищий після фізичної активності і часу з рідними.
- Робочий стрес без виходу фізичної енергії накопичується і бʼє по настрою.
- Недосипання — мій головний ворог продуктивності.
- Маленькі ритуали (кава вранці, читання перед сном) стабілізують день.

Це більше, ніж я дізнався про себе за попередні роки. Виявляється, щоб зрозуміти себе, треба просто почати спостерігати.""",
        sentiment_score=0.65,
        emotions={"Happy": 0.70, "Surprise": 0.50},
        ai_reflection="Цей підсумковий аналіз — справжній прояв самоусвідомленості. Ви не просто записували події, а зробили висновки і побачили себе з нової точки зору. Особливо цінне спостереження про маленькі ритуали як стабілізатори — це підтверджується і науковими дослідженнями. Продовжуйте цю практику: ви вже на правильному шляху.",
    ),
]


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

    async with AsyncSession() as session:
        # User
        result = await session.execute(select(User).where(User.email == "admin@gmail.com"))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email="admin@gmail.com",
                name="Адмін",
                hashed_password=pwd_context.hash("admin123"),
            )
            session.add(user)
            await session.flush()
            print("✓ Created user  admin@gmail.com  (password: admin123)")
        else:
            print(f"✓ User already exists (id={user.id})")

        # Mood logs
        existing = await session.execute(select(MoodLog).where(MoodLog.user_id == user.id))
        if not existing.scalars().first():
            for m in MOOD_LOGS:
                session.add(MoodLog(
                    user_id=user.id,
                    score=m["score"], emoji=m["emoji"], label=m["label"],
                    note=m["note"], tags=m["tags"], emotions=m["emotions"],
                    created_at=ago(m["days"], m["hour"]),
                ))
            print(f"✓ Inserted {len(MOOD_LOGS)} mood logs")
        else:
            print("⚠ Mood logs already exist — skipping")

        # Journal entries
        existing_j = await session.execute(select(JournalEntry).where(JournalEntry.user_id == user.id))
        if not existing_j.scalars().first():
            for e in JOURNAL_ENTRIES:
                ts = ago(e["days"], e["hour"])
                session.add(JournalEntry(
                    user_id=user.id,
                    title=e["title"], content=e["content"],
                    sentiment_score=e["sentiment_score"],
                    emotions=e["emotions"], ai_reflection=e["ai_reflection"],
                    created_at=ts, updated_at=ts,
                ))
            print(f"✓ Inserted {len(JOURNAL_ENTRIES)} journal entries")
        else:
            print("⚠ Journal entries already exist — skipping")

        await session.commit()

    await engine.dispose()
    print("\n✅ Done!  Login: admin@gmail.com / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
