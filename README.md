# Alpha Sender Pro

Потужне Chrome-розширення для автоматизації роботи на платформі **alpha.date**.  
Дозволяє керувати великою кількістю анкет, розсилати інвайти та листи, автоматично відповідати на вінки/лайки та збирати детальну аналітику.

## Мета проєкту

Автоматизувати рутинні дії максимально "по-людськи", щоб уникати shadowban'ів та блокувань.  
Проєкт складається з захищеного розширення, модульного JavaScript payload та серверної частини для валідації ключів і збору статистики.

## Високорівнева архітектура
┌─────────────────────┐
│   Chrome Extension  │
│  (background + content)
│                     │
│  • UI для введення ключа
│  • Отримання payload
│  • Розшифровка + ін'єкція
│  • Пересилання аналітики
└──────────┬──────────┘
│
▼
┌─────────────────────┐
│   Injected Payload  │ (MAIN world)
│  (spy.js + modular JS)
│                     │
│  core.js  │ api.js │ ui.js
│  sender.js│ radar.js
│                     │
│  • Розсилка
│  • Автовідповідач (вінки/лайки)
│  • Збір аналітики (smartUid)
│  • Відправка CustomEvent
└──────────┬──────────┘
│ CustomEvent("AlphaAnalyticsLog")
▼
content.js → background.js → Backend (FastAPI)


**Основні компоненти:**
- **Extension** — завантажує, розшифровує та інжектить код
- **Payload** — працює безпосередньо на сторінці alpha.date
- **Backend** — валідація ключів, роздача payload, прийом аналітики
- **Admin Dashboard** (`alpha-admin/`) — перегляд ключів та статистики

---

Хочеш, щоб я одразу дав **наступну частину** (наприклад, "Repository Structure" + опис папок)?

Або спочатку створи файл `README.md` з тим, що я дав вище, і потім скажеш «продовжуй»?

Також можу зробити структуру більш детальною або, навпаки, стислішою — як тобі зручніше.

## Repository Structure

alpha-sender/
├── extension/                 # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js          # Основна логіка: отримання payload, розшифровка, ін'єкція, аналітика
│   ├── content.js             # UI завантажувача + переадресація подій у background
│   └── spy.js                 # Інжектиться в MAIN world (тут працює весь payload)
│
├── alpha-admin/               # Vue 3 + Vite адмін-панель (дашборд)
│   └── src/                   # Компоненти, stores, views
│
├── core.js                    # Глобальні змінні, smartUid, wasChatInvited, logInviteAnalytics
├── api.js                     # Робота з API alpha.date (sendInvite, sendLetter тощо)
├── ui.js                      # Інтерфейс розширення (вкладки, модалки)
├── sender.js                  # Логіка розсилки інвайтів та листів
├── radar.js                   # Автовідповідач на вінки/лайки + детекція відповідей
├── smart_search.js            # Допоміжні функції пошуку
│
├── server.py                  # FastAPI сервер (валідація ключів, видача payload, аналітика)
├── database.py / database_fs.py
├── bot.py / bot_fs.py
│
├── payload.js / payload-fs.js # Резервні монолітні версії (на випадок серйозних поломок)
└── README.md


### Основні гілки

| Гілка     | Призначення                          | Статус          |
|-----------|--------------------------------------|-----------------|
| `master`  | Продакшн версія                      | Стабільна       |
| `test`    | Активна розробка та тестування       | Основна для роботи |
| `redesign`| Експериментальна чиста версія        | Менш активна    |

**Важливо:**  
Уся активна розробка ведеться на гілці **`test`**.  
`master` чіпаємо тільки після ретельного тестування.

## Payload Modules

Після рефакторингу вся логіка розширення розділена на окремі модулі. Сервер склеює їх у правильному порядку і віддає браузеру.

### Порядок завантаження модулів (server.py)

```js
modules = [
    "smart_search.js",   // Допоміжні функції пошуку
    "core.js",           // Фундамент
    "api.js",            // Робота з API сайту
    "ui.js",             // Інтерфейс
    "sender.js",         // Двигун розсилки
    "radar.js"           // Автовідповідач + аналітика
]

Модуль,Відповідальність,Ключові функції
smart_search.js,Допоміжні утиліти для пошуку та роботи з даними сайту,—
core.js,"Глобальні змінні, система smartUid, збереження інвайтів у пам'яті, базова аналітика","wasChatInvited(), markChatAsInvited(), logInviteAnalytics(), fetchLeadProfileAndLog()"
api.js,Всі запити до API alpha.date,"sendInvite(), sendLetter(), getAllProfiles(), getTemplates()"
ui.js,"Побудова інтерфейсу розширення (вкладки, модалки, сповіщення)","Створення UI, робота з шаблонами, відображення статистики"
sender.js,Основна логіка розсилки інвайтів та листів,"startSendingProcess(), collectAllMen(), batch/loop режими"
radar.js,"Реальний час: автовідповідач на вінки/лайки, детекція відповідей на інвайти, VIP-радар","handleAutoReply(), слухач AlphaSocketMessage, збір досьє при відповіді"

Важливі концепції

• smartUid — стабільний ідентифікатор чату у форматі ${profileId}_${manId}. Використовується для точного відстеження інвайтів і відповідей.
• CustomEvent AlphaAnalyticsLog — подія, через яку payload передає дані аналітики у content.js → background.js → бекенд.
• MAIN world — весь payload виконується в контексті сторінки (spy.js), тому має повний доступ до localStorage сайту, WebSocket-подій та DOM.

Чому саме така структура?

• Легше підтримувати та дебагувати (зміни в radar.js не зачіпають sender.js).
• Сервер може динамічно змінювати порядок або додавати нові модулі.
• Зручніше тестувати окремі частини функціоналу.

## Backend (Python + FastAPI)

Серверна частина розташована в корені репозиторію і відповідає за:

- Валідацію ліцензійних ключів + прив’язку до HWID
- Формування та шифрування JavaScript payload
- Приймання аналітики від розширення
- Надання даних для адмін-панелі

### Основний файл

- `server.py` — FastAPI додаток

### Ключові ендпоінти

| Метод | Endpoint                        | Опис |
|-------|----------------------------------|------|
| POST  | `/auth`                         | Валідація ключа + HWID, повертає список активних анкет |
| GET   | `/get_payload`                  | Повертає зашифрований JS payload (залежить від `team` — `alpha` або `fs`) |
| POST  | `/api/analytics/log_invite`     | Приймає дані про надіслані інвайти та відповіді |
| POST  | `/heartbeat`                    | Періодичний пінг від розширення |
| GET   | `/admin/keys`                   | Список ключів + статистика (для дашборду) |
| GET   | `/admin/global_stats`           | Топ текстів за конверсією |
| GET   | `/admin/leads`                  | Останні зібрані ліди |

### Шифрування payload

Payload формується так:
1. Сервер читає модулі у визначеному порядку (`smart_search.js` → `core.js` → ... → `radar.js`)
2. Склеює їх в один великий рядок
3. Шифрує через **AES-GCM** (ключ = SHA-256 від `access_key`)
4. Повертає Base64-рядок (`nonce + ciphertext`)

### База даних (SQLite)

Основні таблиці:

- `keys` — ліцензійні ключі, HWID, статуси, pending_config
- `invite_analytics` — кількість надісланих інвайтів і відповідей по кожному ключу
- `leads_analytics` — детальна інформація про чоловіків, на яких відповіли (вік, країна, інтереси, біо, фото)
- `pending_invites` — тимчасове зберігання інформації про надіслані інвайти (для коректного підрахунку відповідей)

### Команди (team)

- `alpha` — основна команда
- `fs` — команда друга (використовує `payload-fs.js` та окрему базу)

### Запуск

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

Для продакшену зазвичай використовується systemctl або pm2.

## Chrome Extension

Розширення написане під **Manifest V3** і складається з кількох частин, які працюють у різних контекстах браузера.

### Структура файлів

extension/
├── manifest.json
├── background.js      # Service Worker (фоновий скрипт)
├── content.js         # Content Script (звичайний)
└── spy.js             # Content Script у MAIN world


### manifest.json

- **Background**: `background.js` (Service Worker)
- **Content Scripts**:
  - `spy.js` — інжектиться в **`MAIN` world** на `document_start` (має доступ до `window`, `localStorage` сайту та WebSocket-подій)
  - `content.js` — виконується у звичайному content world на `document_end`

### Як працює завантаження payload

1. Користувач відкриває сайт `alpha.date`
2. `content.js` показує кнопку «Setting» і модальне вікно для введення ключа
3. Після введення ключа:
   - `content.js` надсилає `chrome.runtime.sendMessage({ action: "validateAndLoad", key, profiles })`
4. `background.js`:
   - Робить запит на `/auth`
   - Отримує `/get_payload`
   - Розшифровує payload за допомогою **AES-GCM** (ключ = SHA-256 від accessKey)
   - Інжектить розшифрований код у вкладку через `chrome.debugger.attach` + `Runtime.evaluate`
5. Код виконується в контексті сторінки (`spy.js` + модулі)

### Основні ролі компонентів

| Файл            | Контекст          | Основні задачі |
|-----------------|-------------------|----------------|
| `background.js` | Service Worker    | Отримання та розшифровка payload, ін'єкція коду, відправка аналітики та heartbeat на бекенд |
| `content.js`    | Content Script    | UI завантажувача, слухач `AlphaAnalyticsLog` та `AlphaPing`, переадресація повідомлень у background |
| `spy.js`        | MAIN world        | Точка входу для всього payload (`core.js`, `radar.js` тощо) |

### Аналітика (повний ланцюжок)

Payload (radar.js / core.js)
↓ dispatchEvent("AlphaAnalyticsLog", { detail })
content.js
↓ chrome.runtime.sendMessage({ action: "sendAnalytics", data })
background.js
↓ fetch POST на /api/analytics/log_invite
Backend (FastAPI)
↓ Збереження в таблиці invite_analytics та leads_analytics


### Важливі технічні моменти

- Для ін'єкції коду в сторінку використовується **`chrome.debugger`** (не `chrome.scripting.executeScript`), бо потрібно виконувати код у контексті сторінки з доступом до `window`.
- `content.js` і `background.js` спілкуються через `chrome.runtime.sendMessage`.
- Події `AlphaAnalyticsLog` та `AlphaPing` передаються з MAIN world → content world → background.

### Переваги такої архітектури

- Payload виконується в контексті сайту (має доступ до токенів, WebSocket, localStorage)
- Фоновий скрипт має повні права на HTTP-запити (обходить CORS)
- Код payload захищений шифруванням на сервері

## Development Workflow

### Основне правило

**Уся активна розробка ведеться на гілці `test`.**

- `master` — тільки стабільна продакшн-версія
- `test` — робоча гілка (тут тестуємо все нове)
- `redesign` — експериментальна гілка (рідко використовується)

### Типовий процес роботи

1. **Створити feature-гілку** від `test`:
   ```bash
   git checkout test
   git pull origin test
   git checkout -b feature/fix-auto-reply-winks
   
2. Зробити зміни (payload, extension, backend)
3. Протестувати:
  • Зміни в payload → оновити файли на гілці test → перезапустити тестовий сервер (порт 8001)
  • Зміни в extension/ → перезавантажити розширення в Chrome (chrome://extensions)
  • Зміни в backend → перезапустити uvicorn / systemctl
4. Запушити:
git add .
git commit -m "fix: improve wink auto-reply logging"
git push origin feature/fix-auto-reply-winks

5. Зробити Pull Request на test (або напряму запушити в test, якщо працюєш сам)
6. Після успішного тестування — змержити в test, а потім (коли все стабільно) — в master.

Як оновлювати payload на тестовому сервері

1. Змінити потрібні файли (core.js, radar.js тощо) на гілці test
2. Запушити зміни:Bash

git push origin test

3. На тестовому сервері (Hetzner)

cd /path/to/alpha_test
git pull origin test
# Якщо змінили server.py — перезапустити процес
systemctl restart alpha-test   # або pm2 restart ...

Як тестувати розширення локально

Зміни в extension/ → зайти на chrome://extensions/
Увімкнути Developer mode
Натиснути Load unpacked і вибрати папку extension/
Після кожної зміни натискати кнопку Reload біля розширення

Корисні команди

# Перейти на тестову гілку
git checkout test

# Створити нову фічу
git checkout -b feature/your-feature-name

# Подивитися статус
git status

# Додати всі зміни
git add .

# Закомітити
git commit -m "feat: add detailed analytics logging"

# Запушити
git push origin feature/your-feature-name

Поради

Завжди пиши зрозумілі коміти (feat:, fix:, refactor:, docs:)
Перед мержем в test — перевір, щоб усе працювало на тестовому сервері
Якщо ламаєш щось важливе — краще створити окрему гілку
README.md оновлюй разом зі значними змінами

## Known Issues & TODO

### Поточні проблеми (Known Issues)

- **Аналітика відповідей** — дані збираються і відправляються на бекенд, але відображення в адмін-панелі (`alpha-admin`) ще не повністю реалізоване або потребує доопрацювання.
- **Ін'єкція через `chrome.debugger`** — працює, але є потенційні проблеми зі стабільністю при великій кількості вкладок.
- **Відсутність детального логування** в деяких місцях ланцюжка аналітики (виправляється поступово).

### Плани на майбутнє (TODO)

- [ ] Повністю стабілізувати автовідповідач на вінки та лайки
- [ ] Покращити відображення статистики та лідів в адмін-панелі (`alpha-admin`)
- [ ] Додати більше детального логування по всьому ланцюжку (від payload до бекенду)
- [ ] Реалізувати мультимедійні розсилки (аудіо/відео в листах)
- [ ] Додати генерацію текстів через AI (з урахуванням профілю чоловіка та анкети)
- [ ] Покращити захист від shadowban'ів (більш природні затримки, рандомізація поведінки)
- [ ] Створити зручніший інтерфейс для керування шаблонами відповідей
- [ ] Документація + приклади використання (цей README)
- [ ] Рефакторинг та оптимізація коду (де потрібно)

### Пріоритети на найближчий час

1. Стабілізація авто-відповідача на вінки/лайки + перевірка `chat_uid`
2. Налагодження повноцінного збору та відображення аналітики відповідей
3. Покращення логування для швидкого дебагу

### Якщо щось зламалося

1. Перевір, на якій гілці ти працюєш (`test` чи `master`)
2. Переконайся, що оновив файли на тестовому сервері (`git pull`)
3. Перезавантаж розширення в Chrome
4. Подивіся логи в консолі браузера (вкладка **Console**) та в `background.js` (через DevTools розширення)
