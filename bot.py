import os
import asyncio
import json
import random
import string
import sqlite3
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
token_path = os.path.join(BASE_DIR, "token.txt")

# Перевіряємо, чи існує файл token.txt
if os.path.exists(token_path):
    with open(token_path, "r", encoding="utf-8") as f:
        TOKEN = f.read().strip()
else:
    # Якщо файлу немає, використовуємо твій старий бойовий токен
    TOKEN = "ТВІЙ_ОСНОВНИЙ_БОЙОВИЙ_ТОКЕН_ТУТ"
ADMIN_IDS = [7898484797, 5844872531, 249944251]

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Додали нову кнопку в клавіатуру
main_kb = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="🔑 Додати ключ"), KeyboardButton(text="📋 База ключів")],
        [KeyboardButton(text="🧹 Видалити заблоковані"), KeyboardButton(text="➕ Згенерувати ключі")],
        [KeyboardButton(text="⛔ Заблокувати ключ"), KeyboardButton(text="🔄 Скинути HWID")] # Нова кнопка
    ],
    resize_keyboard=True
)


# Стан для очікування вводу ключа
class BanKeyStates(StatesGroup):
    waiting_for_key = State()

class BanKeyStates(StatesGroup):
    waiting_for_key = State()


# Обробник натискання на кнопку в меню
@dp.message(F.text == "⛔ Заблокувати ключ")
async def prompt_ban_key(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return
    await message.answer("Введіть ключ, який потрібно заблокувати:")
    await state.set_state(BanKeyStates.waiting_for_key)


class ResetHwidStates(StatesGroup):
    waiting_for_key = State()


@dp.message(F.text == "🔄 Скинути HWID")
async def prompt_reset_hwid(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.answer("Введіть ключ, для якого потрібно скинути прив'язку до пристрою:")
    await state.set_state(ResetHwidStates.waiting_for_key)


@dp.message(ResetHwidStates.waiting_for_key)
async def process_reset_hwid(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    key_to_reset = message.text.strip()

    # Використовуємо функцію reset_hwid, яку ми додали в database.py минулого разу
    if database.reset_hwid(key_to_reset):
        await message.answer(f"✅ Прив'язку до пристрою для ключа <code>{key_to_reset}</code> успішно скинуто!",
                             parse_mode="HTML")
    else:
        await message.answer("❌ Такого ключа не знайдено в базі.")
    await state.clear()

@dp.message(F.text == "🧹 Видалити заблоковані")
async def delete_banned_keys(message: types.Message):
    if not is_admin(message.from_user.id): return

    conn = sqlite3.connect('/root/alpha/admin_panel.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM keys WHERE is_banned = 1')
    count = cursor.rowcount
    conn.commit()
    conn.close()

    await message.answer(f"✅ Успішно видалено {count} заблокованих ключів.")

@dp.message(F.text == "➕ Згенерувати ключі")
async def prompt_gen_keys(message: types.Message, state: FSMContext):
    await message.answer("Скільки ключів згенерувати?")
    await state.set_state(GenerateStates.waiting_for_count)

class GenerateStates(StatesGroup):
    waiting_for_count = State()

@dp.message(GenerateStates.waiting_for_count)
async def process_gen_keys(message: types.Message, state: FSMContext):
    try:
        count = int(message.text)
    except ValueError:
        await message.answer("Введіть число!")
        return

    generated = []
    for _ in range(count):
        # Генеруємо рандомний ключ (наприклад, довжиною 16 символів)
        new_key = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        if database.add_key(new_key):  # add_key у нас уже вміє записувати в базу
            generated.append(new_key)

    # Відправляємо всі ключі одним текстом
    await message.answer(f"✅ Згенеровано {len(generated)} ключів:\n\n" + "\n".join(generated))
    await state.clear()

# Обробник самого тексту ключа
@dp.message(BanKeyStates.waiting_for_key)
async def process_ban_key(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return

    key_to_ban = message.text.strip()

    if database.ban_key(key_to_ban):
        await message.answer(
            f"✅ Ключ <code>{key_to_ban}</code> успішно заблоковано!\nСкрипт зупиниться при наступній перевірці.",
            parse_mode="HTML")
    else:
        await message.answer("❌ Такого ключа не знайдено в базі.")

    await state.clear()

class AdminStates(StatesGroup):
    waiting_for_key = State()


def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


@dp.message(CommandStart())
async def command_start_handler(message: types.Message):
    if not is_admin(message.from_user.id):
        return
    await message.answer("👋 Привіт, Адміне! Головне меню:", reply_markup=main_kb)


# Реакція на натискання кнопки "Додати ключ"
@dp.message(F.text == "🔑 Додати ключ")
async def btn_add_key_handler(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return
    await message.answer("Напиши новий ключ (наприклад: HjurRhfiIU7Mpp):")
    await state.set_state(AdminStates.waiting_for_key)


# Реакція на введення тексту ключа
@dp.message(AdminStates.waiting_for_key)
async def save_new_key(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return

    new_key = message.text.strip()
    success = database.add_key(new_key)

    if success:
        await message.answer(f"✅ Ключ `{new_key}` успішно додано до бази!", parse_mode="Markdown")
    else:
        await message.answer(f"⚠️ Помилка! Ключ `{new_key}` вже існує в базі.")

    await state.clear()


# НОВА ФУНКЦІЯ: Реакція на кнопку "База ключів"
@dp.message(F.text == "📋 База ключів")
async def btn_view_db_handler(message: types.Message):
    if not is_admin(message.from_user.id):
        return

    keys = database.get_all_keys()

    if not keys:
        await message.answer("📭 База порожня. Додай перший ключ!")
        return

    response = "📊 **Ваша база ключів:**\n\n"

    for key, is_banned, profiles_json in keys:
        # Визначаємо статус
        status = "🔴 Заблокований" if is_banned else "🟢 Активний"

        # Декодуємо список анкет з тексту в нормальний список Python
        try:
            profiles = json.loads(profiles_json)
        except json.JSONDecodeError:
            profiles = []

        # Форматуємо список анкет для красивого виводу
        if profiles:
            profiles_text = ", ".join(str(p) for p in profiles)
        else:
            profiles_text = "Немає активних"

        # Збираємо повідомлення
        response += f"🔑 **Ключ:** `{key}`\n"
        response += f"ℹ️ **Статус:** {status}\n"
        response += f"📄 **Анкети ({len(profiles)} шт):** {profiles_text}\n"
        response += "➖➖➖➖➖➖➖➖➖➖\n"

    await message.answer(response, parse_mode="Markdown")


async def main():
    database.init_db()
    print("Бот ...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())