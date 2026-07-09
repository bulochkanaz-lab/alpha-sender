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
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import database_fs as database

# Просто вставляєш сюди токен, який дав BotFather для нового бота
BOT_TOKEN = "8859229937:AAGUEp0yHfxmdqxnKHVehxv4TiXaDcIxe4g"

ADMIN_IDS = [7898484797, 8502175321]

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Клавіатура
main_kb = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text="🔑 Додати ключ", callback_data="btn_add"),
         InlineKeyboardButton(text="📋 База ключів", callback_data="btn_view")],
        [InlineKeyboardButton(text="🗑 Видалити ключі", callback_data="btn_del"),
         InlineKeyboardButton(text="➕ Згенерувати ключі", callback_data="btn_gen")],
        [InlineKeyboardButton(text="⛔ Забл. / Розбл.", callback_data="btn_ban"),
         InlineKeyboardButton(text="🔄 Скинути ID", callback_data="btn_reset_id")],
        [InlineKeyboardButton(text="🧨 Скинути ВСІ прив'язки", callback_data="btn_reset_all")],
        [InlineKeyboardButton(text="💣 ВИДАЛИТИ ВСЮ БАЗУ", callback_data="btn_del_all")]
    ]
)


# ==========================================
# УСІ СТАНИ (FSM)
# ==========================================
class ToggleBanStates(StatesGroup):
    waiting_for_key = State()

class KeysViewStates(StatesGroup):
    viewing = State()


class DeleteKeysStates(StatesGroup):
    waiting_for_keys = State()


class ResetHwidStates(StatesGroup):
    waiting_for_key = State()


class GenerateStates(StatesGroup):
    waiting_for_count = State()


class AdminStates(StatesGroup):
    waiting_for_key = State()

class DeleteAllStates(StatesGroup):
    waiting_for_pass = State()


# ==========================================
# ДОПОМІЖНІ ФУНКЦІЇ
# ==========================================
def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


@dp.message(CommandStart())
async def command_start_handler(message: types.Message):
    if not is_admin(message.from_user.id): return
    await message.answer("👋 Привіт, Адміне! Головне меню:", reply_markup=main_kb)


# ==========================================
# ЛОГІКА ДОДАВАННЯ КЛЮЧА
# ==========================================
@dp.message(F.text == "🔑 Додати ключ")
async def btn_add_key_handler(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.answer("Напиши новий ключ (наприклад: Obsidian):")
    await state.set_state(AdminStates.waiting_for_key)


@dp.message(AdminStates.waiting_for_key)
async def save_new_key(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    new_key = message.text.strip()
    success = database.add_key(new_key)

    if success:
        await message.answer(f"✅ Ключ `{new_key}` успішно додано до бази!", parse_mode="Markdown")
    else:
        await message.answer(f"⚠️ Помилка! Ключ `{new_key}` вже існує в базі.")
    await state.clear()


# ==========================================
# ЛОГІКА БЛОКУВАННЯ / РОЗБЛОКУВАННЯ
# ==========================================
@dp.message(F.text == "⛔ Заблокувати/Розблокувати")
async def prompt_toggle_ban(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.answer("Введіть ключ, щоб змінити його статус:")
    await state.set_state(ToggleBanStates.waiting_for_key)


# ==========================================
# ЛОГІКА МАСОВОГО СКИДАННЯ ПРИВ'ЯЗОК
# ==========================================
@dp.message(F.text == "🧨 Скинути ВСІ прив'язки")
async def process_reset_all_hwids(message: types.Message):
    if not is_admin(message.from_user.id): return

    updated_count = database.reset_all_licenses()
    await message.answer(
        f"✅ Масове скидання успішне!\nЛіцензії та сесії скасовано для <b>{updated_count}</b> ключів.",
        parse_mode="HTML"
    )

# ==========================================
# ЛОГІКА СКИНУТИ ПРИВ'ЯЗКУ (ID ОПЕРАТОРА)
# ==========================================
@dp.message(F.text == "🔄 Скинути прив'язку (ID)")
async def prompt_reset_hwid(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.answer("Введіть ключ, для якого потрібно скинути профіль оператора та сесію:")
    await state.set_state(ResetHwidStates.waiting_for_key)


@dp.message(ResetHwidStates.waiting_for_key)
async def process_reset_hwid(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    key_to_reset = message.text.strip()

    if database.reset_license(key_to_reset):
        await message.answer(f"✅ Прив'язку та поточну сесію для ключа <code>{key_to_reset}</code> успішно скинуто!",
                             parse_mode="HTML")
    else:
        await message.answer("❌ Такого ключа не знайдено в базі.")
    await state.clear()


# ==========================================
# ЛОГІКА МАСОВОГО ВИДАЛЕННЯ
# ==========================================
@dp.message(F.text == "🗑 Видалити ключі")
async def prompt_delete_keys(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.answer("Надішліть ключі для видалення (через пробіл або з нового рядка):")
    await state.set_state(DeleteKeysStates.waiting_for_keys)


@dp.message(DeleteKeysStates.waiting_for_keys)
async def process_delete_keys(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    keys_to_delete = message.text.split()

    if not keys_to_delete:
        await message.answer("⚠️ Ви не ввели жодного ключа. Спробуйте ще раз.")
        return

    deleted_count = database.delete_keys(keys_to_delete)
    await message.answer(f"✅ Успішно видалено {deleted_count} ключів із {len(keys_to_delete)} запитаних.")
    await state.clear()


# ==========================================
# ЯДЕРНА КНОПКА (ОЧИЩЕННЯ ВСІЄЇ БАЗИ)
# ==========================================
@dp.callback_query(F.data == "btn_del_all")
async def prompt_delete_all(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return

    await update_main_menu(
        state,
        callback.message.chat.id,
        "⚠️ <b>УВАГА! Це незворотна дія!</b>\nДля підтвердження повного очищення бази ключів введіть пароль:",
        cancel_kb
    )
    # Використовуємо наш новий ізольований стан
    await state.set_state(DeleteAllStates.waiting_for_pass)
    await callback.answer()


@dp.message(DeleteAllStates.waiting_for_pass)
async def process_delete_all_pass(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.delete()

    # Строга перевірка пароля
    if message.text.strip() != "Uypp09":
        await state.set_state(None)
        await update_main_menu(state, message.chat.id,
                               "❌ Невірний пароль! Масове видалення скасовано.\n\n👋 <b>Головне меню:</b>")
        return

    # Якщо пароль правильний — виконуємо очищення
    # ПЕРЕКОНАЙСЯ, ЩО ТУТ ВИКЛИКАЄТЬСЯ ПРАВИЛЬНА БАЗА (наприклад, database_fs, якщо вона так імпортована)
    deleted_count = database.delete_all_keys()

    await state.set_state(None)
    await update_main_menu(
        state,
        message.chat.id,
        f"🗑 <b>Успіх!</b> Всі ключі ({deleted_count} шт.) були назавжди видалені з бази.\n\n👋 <b>Головне меню:</b>"
    )

# ==========================================
# ЛОГІКА ГЕНЕРАЦІЇ КЛЮЧІВ
# ==========================================
@dp.message(F.text == "➕ Згенерувати ключі")
async def prompt_gen_keys(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.answer("Скільки ключів згенерувати?")
    await state.set_state(GenerateStates.waiting_for_count)


@dp.message(GenerateStates.waiting_for_count)
async def process_gen_keys(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    try:
        count = int(message.text)
    except ValueError:
        await message.answer("Введіть число!")
        return

    generated = []
    for _ in range(count):
        new_key = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        if database.add_key(new_key):
            generated.append(new_key)

    await message.answer(f"✅ Згенеровано {len(generated)} ключів:\n\n" + "\n".join(generated))
    await state.clear()


# ==========================================
# БАЗА КЛЮЧІВ
# ==========================================
@dp.message(F.text == "📋 База ключів")
async def btn_view_db_handler(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return

    await state.clear()                    # ← примусово чистимо попередній state
    await show_keys_page(message, state, page=0)

async def show_keys_page(message_or_callback, state: FSMContext, page: int):
    """Показує одну сторінку ключів (створює або редагує повідомлення)"""
    limit = 10
    offset = page * limit

    total_keys = database.get_keys_count()
    keys = database.get_keys_page(limit=limit, offset=offset)

    if not keys:
        text = "📭 База порожня."
        keyboard = None
    else:
        text = f"📊 **База ключів** (сторінка {page + 1} з {(total_keys + limit - 1) // limit})\n\n"

        for key, is_banned, profiles_json in keys:
            status = "🔴 Заблокований" if is_banned else "🟢 Активний"
            try:
                profiles = json.loads(profiles_json) if profiles_json else []
            except (json.JSONDecodeError, TypeError):
                profiles = []

            profiles_text = ", ".join(str(p) for p in profiles) if profiles else "Немає активних"

            text += (
                f"🔑 **Ключ:** `{key}`\n"
                f"ℹ️ **Статус:** {status}\n"
                f"📄 **Анкети ({len(profiles)} шт):** {profiles_text}\n"
                "➖➖➖➖➖➖➖➖➖➖\n"
            )

        # Створюємо Inline клавіатуру пагінації
        keyboard = get_pagination_keyboard(page, total_keys, limit)

    if isinstance(message_or_callback, types.Message):
        # Перше повідомлення
        await message_or_callback.answer(text, parse_mode="Markdown", reply_markup=keyboard)
    else:
        # Редагування існуючого повідомлення (при натисканні кнопок)
        await message_or_callback.message.edit_text(text, parse_mode="Markdown", reply_markup=keyboard)

    await state.set_state(KeysViewStates.viewing)
    await state.update_data(current_page=page)

def get_pagination_keyboard(current_page: int, total_keys: int, limit: int):
    total_pages = (total_keys + limit - 1) // limit
    buttons = []

    if current_page > 0:
        buttons.append(InlineKeyboardButton(text="◀️ Назад", callback_data=f"keys_page:{current_page - 1}"))

    if current_page < total_pages - 1:
        buttons.append(InlineKeyboardButton(text="Далі ▶️", callback_data=f"keys_page:{current_page + 1}"))

    row = buttons if buttons else []
    keyboard = InlineKeyboardMarkup(inline_keyboard=[row])

    # Додаємо кнопку закриття
    keyboard.inline_keyboard.append([
        InlineKeyboardButton(text="❌ Закрити", callback_data="keys_close")
    ])

    return keyboard

@dp.callback_query(F.data.startswith("keys_page:"))
async def keys_pagination_handler(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id):
        await callback.answer("⛔ Доступ заборонено", show_alert=True)
        return

    page = int(callback.data.split(":")[1])
    await show_keys_page(callback, state, page=page)
    await callback.answer()


@dp.callback_query(F.data == "keys_close")
async def keys_close_handler(callback: types.CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.delete()
    await callback.answer()

async def main():
    database.init_db()
    print("Бот запущено...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())