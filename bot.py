import os
import asyncio
import json
import random
import string
from aiogram import types
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
token_path = os.path.join(BASE_DIR, "token.txt")

if os.path.exists(token_path):
    with open(token_path, "r", encoding="utf-8") as f:
        BOT_TOKEN = f.read().strip()
else:
    BOT_TOKEN = "8994271135:AAGbLxX2z4g2dXeio2oYvjwMhphSKau9H34"

ADMIN_IDS = [7898484797, 5844872531, 249944251]

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# ==========================================
# INLINE КЛАВІАТУРИ
# ==========================================
main_kb = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text="🔑 Додати ключ", callback_data="btn_add"),
         InlineKeyboardButton(text="📋 База ключів", callback_data="btn_view")],
        [InlineKeyboardButton(text="🗑 Видалити ключі", callback_data="btn_del"),
         InlineKeyboardButton(text="➕ Згенерувати ключі", callback_data="btn_gen")],
        [InlineKeyboardButton(text="⛔ Заблокувати / Розблокувати", callback_data="btn_ban")],
        [InlineKeyboardButton(text="🔄 Скинути прив'язку (ID)", callback_data="btn_reset_id")],
        [InlineKeyboardButton(text="🧨 Скинути ВСІ прив'язки", callback_data="btn_reset_all")]
    ]
)

cancel_kb = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text="❌ Скасувати", callback_data="btn_cancel")]
    ]
)


# ==========================================
# УСІ СТАНИ (FSM)
# ==========================================
class AdminStates(StatesGroup):
    waiting_for_key = State()
    waiting_for_ban = State()
    waiting_for_reset_id = State()
    waiting_for_delete = State()
    waiting_for_gen = State()
    viewing_keys = State()


# ==========================================
# ДОПОМІЖНІ ФУНКЦІЇ
# ==========================================
def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


async def update_main_menu(state: FSMContext, chat_id: int, text: str, markup=main_kb):
    """Оновлює головне повідомлення, щоб не засмічувати чат"""
    data = await state.get_data()
    msg_id = data.get("main_msg_id")

    if msg_id:
        try:
            await bot.edit_message_text(text=text, chat_id=chat_id, message_id=msg_id, reply_markup=markup,
                                        parse_mode="HTML")
            return
        except Exception:
            pass  # Якщо повідомлення видалено або не змінилося

    # Якщо оновити не вдалося, відправляємо нове і запам'ятовуємо його ID
    msg = await bot.send_message(chat_id, text, reply_markup=markup, parse_mode="HTML")
    await state.update_data(main_msg_id=msg.message_id)


# ==========================================
# СТАРТ ТА СКАСУВАННЯ
# ==========================================
@dp.message(CommandStart())
async def command_start_handler(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await state.clear()

    # Видаляємо команду /start з чату
    await message.delete()

    msg = await message.answer("👋 <b>Головне меню адміністратора:</b>\nОберіть дію нижче:", reply_markup=main_kb,
                               parse_mode="HTML")
    await state.update_data(main_msg_id=msg.message_id)


@dp.callback_query(F.data == "btn_cancel")
async def cancel_handler(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    await state.set_state(None)  # Очищаємо стан, але зберігаємо data (main_msg_id)
    await update_main_menu(state, callback.message.chat.id, "🚫 <i>Дію скасовано.</i>\n\n👋 <b>Головне меню:</b>")
    await callback.answer("Скасовано")


# ==========================================
# ЛОГІКА ДОДАВАННЯ КЛЮЧА
# ==========================================
@dp.callback_query(F.data == "btn_add")
async def btn_add_key_handler(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    await update_main_menu(state, callback.message.chat.id,
                           "✍️ Надішліть новий ключ (наприклад: <code>Obsidian</code>):", cancel_kb)
    await state.set_state(AdminStates.waiting_for_key)
    await callback.answer()


@dp.message(AdminStates.waiting_for_key)
async def save_new_key(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.delete()  # Видаляємо текст користувача з чату

    new_key = message.text.strip()
    if not new_key:
        await update_main_menu(state, message.chat.id, "⚠️ Ключ не може бути порожнім.\n✍️ Спробуйте ще раз:",
                               cancel_kb)
        return

    success = database.add_key(new_key)
    text = f"✅ Ключ <code>{new_key}</code> успішно додано!" if success else f"⚠️ Помилка! Ключ <code>{new_key}</code> вже існує."

    await state.set_state(None)
    await update_main_menu(state, message.chat.id, text + "\n\n👋 <b>Головне меню:</b>")


# ==========================================
# ЛОГІКА БЛОКУВАННЯ / РОЗБЛОКУВАННЯ
# ==========================================
@dp.callback_query(F.data == "btn_ban")
async def prompt_toggle_ban(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    await update_main_menu(state, callback.message.chat.id, "⛔ Введіть ключ, щоб змінити його статус:", cancel_kb)
    await state.set_state(AdminStates.waiting_for_ban)
    await callback.answer()


@dp.message(AdminStates.waiting_for_ban)
async def process_toggle_ban(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.delete()

    key_to_toggle = message.text.strip()
    success, new_status = database.toggle_ban_key(key_to_toggle)

    if success:
        status_text = "🔴 ЗАБЛОКОВАНО" if new_status == "banned" else "🟢 РОЗБЛОКОВАНО"
        text = f"{status_text}! Доступ для ключа <code>{key_to_toggle}</code> змінено."
    else:
        text = "❌ Такого ключа не знайдено в базі."

    await state.set_state(None)
    await update_main_menu(state, message.chat.id, text + "\n\n👋 <b>Головне меню:</b>")


# ==========================================
# ЛОГІКА СКИДАННЯ ПРИВ'ЯЗОК
# ==========================================
@dp.callback_query(F.data == "btn_reset_all")
async def process_reset_all_hwids(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return

    updated_count = database.reset_all_licenses()
    text = f"✅ Масове скидання успішне!\nЛіцензії скасовано для <b>{updated_count}</b> ключів."

    await update_main_menu(state, callback.message.chat.id, text + "\n\n👋 <b>Головне меню:</b>")
    await callback.answer()


@dp.callback_query(F.data == "btn_reset_id")
async def prompt_reset_hwid(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    await update_main_menu(state, callback.message.chat.id, "🔄 Введіть ключ, для якого потрібно скинути сесію:",
                           cancel_kb)
    await state.set_state(AdminStates.waiting_for_reset_id)
    await callback.answer()


@dp.message(AdminStates.waiting_for_reset_id)
async def process_reset_hwid(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.delete()

    key_to_reset = message.text.strip()
    if database.reset_license(key_to_reset):
        text = f"✅ Прив'язку для ключа <code>{key_to_reset}</code> успішно скинуто!"
    else:
        text = "❌ Такого ключа не знайдено в базі."

    await state.set_state(None)
    await update_main_menu(state, message.chat.id, text + "\n\n👋 <b>Головне меню:</b>")


# ==========================================
# ЛОГІКА МАСОВОГО ВИДАЛЕННЯ
# ==========================================
@dp.callback_query(F.data == "btn_del")
async def prompt_delete_keys(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    await update_main_menu(state, callback.message.chat.id, "🗑 Надішліть ключі для видалення (через пробіл):",
                           cancel_kb)
    await state.set_state(AdminStates.waiting_for_delete)
    await callback.answer()


@dp.message(AdminStates.waiting_for_delete)
async def process_delete_keys(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.delete()

    keys_to_delete = [k.strip() for k in message.text.split() if k.strip()]
    if not keys_to_delete:
        await update_main_menu(state, message.chat.id, "⚠️ Ви не ввели жодного коректного ключа. Спробуйте ще:",
                               cancel_kb)
        return

    deleted_count = database.delete_keys(keys_to_delete)
    text = f"✅ Успішно видалено <b>{deleted_count}</b> ключів із <b>{len(keys_to_delete)}</b> запитаних."

    await state.set_state(None)
    await update_main_menu(state, message.chat.id, text + "\n\n👋 <b>Головне меню:</b>")


@dp.message(Command("delete_all"))
async def handle_delete_all(message: types.Message):
    # ЗАХИСТ: Перевіряємо, чи це взагалі адмін пише
    if not is_admin(message.from_user.id):
        return

    # Розбиваємо повідомлення на слова: ["/delete_all", "Uypp09"]
    args = message.text.split()

    # Перевіряємо, чи передали пароль взагалі
    if len(args) < 2:
        await message.reply(
            "⚠️ Обережно! Це небезпечна зона.\n"
            "Щоб видалити всі ключі, введіть команду з паролем:\n"
            "Приклад: <code>/delete_all ваш_пароль</code>",
            parse_mode="HTML"
        )
        return

    password = args[1]

    # Строга перевірка пароля
    if password != "Uypp09":
        await message.reply("❌ Невірний пароль! Масове видалення скасовано.")
        return

    # Якщо пароль правильний — виконуємо очищення
    deleted_count = database.delete_all_keys()

    await message.reply(f"🗑 <b>Успіх!</b> Всі ключі ({deleted_count} шт.) були назавжди видалені з бази.", parse_mode="HTML")

# ==========================================
# ЛОГІКА ГЕНЕРАЦІЇ КЛЮЧІВ
# ==========================================
@dp.callback_query(F.data == "btn_gen")
async def prompt_gen_keys(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    await update_main_menu(state, callback.message.chat.id, "➕ Скільки ключів згенерувати? (Введіть число):", cancel_kb)
    await state.set_state(AdminStates.waiting_for_gen)
    await callback.answer()


@dp.message(AdminStates.waiting_for_gen)
async def process_gen_keys(message: types.Message, state: FSMContext):
    if not is_admin(message.from_user.id): return
    await message.delete()

    try:
        count = int(message.text.strip())
        if count <= 0 or count > 500: raise ValueError
    except ValueError:
        await update_main_menu(state, message.chat.id, "⚠️ Введіть коректне число від 1 до 500:", cancel_kb)
        return

    generated = []
    for _ in range(count):
        new_key = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        if database.add_key(new_key):
            generated.append(f"<code>{new_key}</code>")

    response_text = f"✅ Згенеровано <b>{len(generated)}</b> ключів:\n\n" + "\n".join(generated)
    if len(response_text) > 4000:
        response_text = "✅ Ключі успішно згенеровано та додано в базу."

    await state.set_state(None)
    await update_main_menu(state, message.chat.id, response_text + "\n\n👋 <b>Головне меню:</b>")


# ==========================================
# БАЗА КЛЮЧІВ (З ПАГІНАЦІЄЮ)
# ==========================================
@dp.callback_query(F.data == "btn_view")
async def btn_view_db_handler(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    await show_keys_page(state, callback.message.chat.id, page=0)
    await callback.answer()


async def show_keys_page(state: FSMContext, chat_id: int, page: int):
    limit = 10
    offset = page * limit
    total_keys = database.get_keys_count()
    keys = database.get_keys_page(limit=limit, offset=offset)

    if not keys:
        text = "📭 База порожня."
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="🔙 Назад у меню", callback_data="btn_cancel")]])
    else:
        text = f"📊 <b>База ключів</b> (сторінка {page + 1} з {(total_keys + limit - 1) // limit})\n\n"
        for key, is_banned, profiles_json in keys:
            status = "🔴 Заблок." if is_banned else "🟢 Актив."
            try:
                profiles = json.loads(profiles_json) if profiles_json else []
            except:
                profiles = []

            profiles_text = ", ".join(str(p) for p in profiles) if profiles else "Немає"
            text += f"🔑 <code>{key}</code> | {status} | 📄 {len(profiles)} анк.\n"

        keyboard = get_pagination_keyboard(page, total_keys, limit)

    await state.set_state(AdminStates.viewing_keys)
    await update_main_menu(state, chat_id, text, keyboard)


def get_pagination_keyboard(current_page: int, total_keys: int, limit: int):
    total_pages = (total_keys + limit - 1) // limit
    buttons = []

    if current_page > 0:
        buttons.append(InlineKeyboardButton(text="◀️ Назад", callback_data=f"keys_page:{current_page - 1}"))
    if current_page < total_pages - 1:
        buttons.append(InlineKeyboardButton(text="Далі ▶️", callback_data=f"keys_page:{current_page + 1}"))

    row = buttons if buttons else []
    keyboard = InlineKeyboardMarkup(inline_keyboard=[row])

    # Кнопка повернення в головне меню замість просто "Закрити"
    keyboard.inline_keyboard.append([InlineKeyboardButton(text="🔙 Повернутися в меню", callback_data="btn_cancel")])
    return keyboard


@dp.callback_query(F.data.startswith("keys_page:"))
async def keys_pagination_handler(callback: types.CallbackQuery, state: FSMContext):
    if not is_admin(callback.from_user.id): return
    page = int(callback.data.split(":")[1])
    await show_keys_page(state, callback.message.chat.id, page=page)
    await callback.answer()


async def main():
    database.init_db()
    print("Бот запущено (Режим 'App-like')...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())