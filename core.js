// ==========================================
// ГЛОБАЛЬНІ ЗМІННІ ТА СТАН БОТА
// ==========================================
let isRunning = false;
let botLoopTimer = null;

// Змінні для автовідповідача
let currentSelectedProfile = null;
let currentSelectedTab = "like";
let currentWinkPhrase = "default";
const winkPhrases = [
    { id: "default", text: "✨ Стандартна (на будь-яку іншу)" },
    { id: "Send a wink 😉", text: "Send a wink 😉" },
    { id: "I would like to know more about you!", text: "I would like to know more about you!" },
    { id: "Tell me more about yourself", text: "Tell me more about yourself" },
    { id: "How is your day going?", text: "How is your day going?" },
    { id: "What are you up to?", text: "What are you up to?" },
    { id: "Don't you mind talking a bit?", text: "Don't you mind talking a bit?" }
];

// Глобальна пам'ять для захисту від дублів в автовідповідачі
const autoReplyLocks = new Set();

// ==========================================
// СЛОВНИК ПЕРЕКЛАДІВ
// ==========================================
const alphaDict = {
    ua: {
        title: "⚙ Alpha Sender Pro",
        tabSettings: "Розсилка",
        tabInvites: "Інвайти",
        tabLetters: "Листи",
        tabWinks: "Вінки/Лайки",
        tabVip: "Повідомлення",
        tabStats: "Статистика",

        delayLabel: "Затримка між відправками (сек):",
        phaseDelayLabel: "Пауза між Інвайтами та Листами (хв):",
        breakTimeLabel: "Глобальна перерва між циклами (хв):",
        inviteModeLabel: "Режим відправки інвайтів:",
        modeBatch: "Усі разом",
        modeLoop: "По одному на коло",
        useSiteToggleLabel: "Інвайти/Листи з сендеру",
        btnStart: "▶ Почати розсилку",
        btnStop: "⏹ Зупинити",
        statusLabel: "Статус:",
        statusWaiting: "Очікування...",
        profileLabel: "Анкета:",

        invitesProfileLabel: "Оберіть анкету для Інвайтів:",
        loadingProfiles: "Завантаження анкет...",
        invitesPlaceholder: "Введіть текст вашого інвайту...",
        invitesSaveBtn: "💾 Зберегти Інвайт",
        invitesEmpty: "Оберіть анкету, щоб додати інвайти",

        lettersProfileLabel: "Оберіть анкету для Листів:",
        lettersPlaceholder: "Введіть текст вашого листа...",
        lettersSaveBtn: "💾 Зберегти Лист",
        lettersEmpty: "Оберіть анкету, щоб додати листи",

        respProfileLabel: "Оберіть анкету:",
        respTabLike: "Лайки",
        respTabWink: "Вінки",
        respPlaceholder: "Введіть текст відповіді...",
        respSaveBtn: "Зберегти текст",
        respSpeedLabel: "Швидкість відповіді (сек):",
        respSpeedSub: "Час \"імітації друку\" перед відправкою",
        respEmpty: "Оберіть анкету, щоб додати тексти",

        statsInvitesLabel: "Надіслано інвайтів",
        statsLettersLabel: "Надіслано листів",

        vipTitle: "Онлайн повідомлення",
        vipSub: "Сповіщення про вхід працюють завжди. Авто-вимкнення анкети можна налаштувати для кожного мужика окремо.",
        vipRulesLabel: "(Мужик ➔ Анкета):",
        vipAddRuleBtn: "➕ Додати мужика",

        galleryTitle: "Виберіть фото для листа",
        galleryConfirmBtn: "Готово",
        dynSelectProfile: "-- Оберіть анкету --",
        dynNoInvites: "Ще немає інвайтів",
        dynNoLetters: "Ще немає листів",
        dynNoMessages: "Ще немає повідомлень",
        dynNoRules: "Ще немає жодного правила",
        dynAutoDisable: "🔌 Вимкнути анкету, якщо він зайде"
    },
    ru: {
        title: "⚙ Alpha Sender Pro",
        tabSettings: "Рассылка",
        tabInvites: "Инвайты",
        tabLetters: "Письма",
        tabWinks: "Винки/Лайки",
        tabVip: "Уведомления",
        tabStats: "Статистика",

        delayLabel: "Задержка между отправками (сек):",
        phaseDelayLabel: "Пауза между Инвайтами и Письмами (мин):",
        breakTimeLabel: "Глобальный перерыв между циклами (мин):",
        inviteModeLabel: "Режим отправки инвайтов:",
        modeBatch: "Все вместе",
        modeLoop: "По одному на круг",
        useSiteToggleLabel: "Инвайты/Письма с сендера",
        btnStart: "▶ Начать рассылку",
        btnStop: "⏹ Остановить",
        statusLabel: "Статус:",
        statusWaiting: "Ожидание...",
        profileLabel: "Анкета:",

        invitesProfileLabel: "Выберите анкету для Инвайтов:",
        loadingProfiles: "Загрузка анкет...",
        invitesPlaceholder: "Введите текст вашего инвайта...",
        invitesSaveBtn: "💾 Сохранить Инвайт",
        invitesEmpty: "Выберите анкету, чтобы добавить инвайты",

        lettersProfileLabel: "Выберите анкету для Писем:",
        lettersPlaceholder: "Введите текст вашего письма...",
        lettersSaveBtn: "💾 Сохранить Письмо",
        lettersEmpty: "Выберите анкету, чтобы добавить письма",

        respProfileLabel: "Выберите анкету:",
        respTabLike: "Лайки",
        respTabWink: "Винки",
        respPlaceholder: "Введите текст ответа...",
        respSaveBtn: "Сохранить текст",
        respSpeedLabel: "Скорость ответа (сек):",
        respSpeedSub: "Время \"имитации печати\" перед отправкой",
        respEmpty: "Выберите анкету, чтобы добавить тексты",

        statsInvitesLabel: "Отправлено инвайтов",
        statsLettersLabel: "Отправлено писем",

        vipTitle: "Онлайн уведомления",
        vipSub: "Уведомления о входе работают всегда. Авто-отключение анкеты можно настроить для каждого мужчины отдельно.",
        vipRulesLabel: "(Мужик ➔ Анкета):",
        vipAddRuleBtn: "➕ Добавить мужика",

        galleryTitle: "Выберите фото для письма",
        galleryConfirmBtn: "Готово",
        dynSelectProfile: "-- Выберите анкету --",
        dynNoInvites: "Еще нет инвайтов",
        dynNoLetters: "Еще нет писем",
        dynNoMessages: "Еще нет сообщений",
        dynNoRules: "Еще нет ни одного правила",
        dynAutoDisable: "🔌 Выключить анкету, если он зайдет"
    }
};

// ==========================================
// ДОПОМІЖНІ ФУНКЦІЇ (Утиліти)
// ==========================================
function t(key) {
    const lang = localStorage.getItem("alphaLang") || "ua";
    return alphaDict[lang] && alphaDict[lang][key] ? alphaDict[lang][key] : key;
}

function getSessionId() {
    let sessionId = localStorage.getItem("alphaSessionId") || generateSessionId();
    return sessionId;
}

function generateSessionId() {
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    localStorage.setItem("alphaSessionId", sessionId);
    return sessionId;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getHeaders(token) {
    return {
        accept: "application/json, text/plain, */*",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
    };
}

// ==========================================
// СТАТИСТИКА
// ==========================================
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadDailyStats() {
    const key = "alphaStats_" + getTodayKey();
    const stats = JSON.parse(localStorage.getItem(key) || '{"invites": 0, "letters": 0}');
    updateStatsUI(stats);
}

function updateStatsUI(stats) {
    const invEl = document.getElementById("uiStatsInvites");
    const letEl = document.getElementById("uiStatsLetters");
    if (invEl) invEl.innerText = stats.invites;
    if (letEl) letEl.innerText = stats.letters;
}

function incrementStat(type) {
    const key = "alphaStats_" + getTodayKey();
    const stats = JSON.parse(localStorage.getItem(key) || '{"invites": 0, "letters": 0}');
    stats[type]++;
    localStorage.setItem(key, JSON.stringify(stats));
    loadDailyStats();
}

// ==========================================
// МОДУЛЬ ДНІВ НАРОДЖЕННЯ (З ДЕБАГОМ)
// ==========================================

const style = document.createElement('style');
style.innerHTML = `
.alpha-bday-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #ff3b30;
    border-radius: 50%;
    margin-left: 6px;
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
    animation: alpha-pulse 1.5s infinite;
    vertical-align: middle;
    cursor: help;
}
@keyframes alpha-pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 59, 48, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
}
`;
document.head.appendChild(style);

function isBirthdaySoon(birthdateStr, userName) {
    if (!birthdateStr) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bdate = new Date(birthdateStr);
    bdate.setFullYear(today.getFullYear());

    let diffTime = bdate - today;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        bdate.setFullYear(today.getFullYear() + 1);
        diffTime = bdate - today;
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const isSoon = diffDays >= 0 && diffDays <= 7;

    // ЛОГІЮЄМО ТІЛЬКИ ТИХ, У КОГО СВЯТО (щоб не спамити)
    if (isSoon) {
        console.log(`🎂 [Дебаг ДН] Мужик: ${userName}. Дата: ${birthdateStr}. Днів до свята: ${diffDays}`);
    }

    return isSoon;
}

function injectBirthdayDot(userName) {
    console.log(`🔍 [Дебаг ДН] Шукаємо в HTML мужика: "${userName}"`);
    const nameElements = document.querySelectorAll('div[data-testid="man-name"]');

    if (nameElements.length === 0) {
        console.log(`❌ [Дебаг ДН] Не знайдено жодного елемента 'data-testid="man-name"'. Можливо, сайт ще не відмалював їх?`);
        return;
    }

    let found = false;
    nameElements.forEach(el => {
        const text = el.textContent;
        // Використовуємо toLowerCase(), щоб уникнути проблем з регістром (Peter vs peter)
        if (text.toLowerCase().includes(userName.toLowerCase())) {
            found = true;
            if (!el.querySelector('.alpha-bday-dot')) {
                console.log(`✅ [Дебаг ДН] Вбудовуємо кружок для ${userName} у текст: "${text}"`);
                const dot = document.createElement('span');
                dot.className = 'alpha-bday-dot';
                dot.title = 'День народження протягом тижня!';
                el.appendChild(dot);
            } else {
                console.log(`⚠️ [Дебаг ДН] Кружок для ${userName} вже є, пропускаємо.`);
            }
        }
    });

    if (!found) {
        console.log(`❌ [Дебаг ДН] Елементи знайдені, але серед них немає тексту з іменем: "${userName}"`);
    }
}

// ПЕРЕХОПЛЮВАЧ
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);

    try {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        if (url.includes('/api/chatList/userDetail') || url.includes('/chatList')) {
            console.log(`🌐 [Дебаг ДН] ПЕРЕХОПЛЕНО ЗАПИТ: ${url}`);
            const clone = response.clone();

            clone.json().then(data => {
                const count = (data && data.response) ? data.response.length : 0;
                console.log(`📦 [Дебаг ДН] Отримано JSON. Людей у списку: ${count}`);

                if (data && data.status && Array.isArray(data.response)) {
                    // ЗБІЛЬШИВ ЗАТРИМКУ ДО 2 СЕКУНД (можливо сайт довго малює HTML)
                    setTimeout(() => {
                        console.log(`⏳ [Дебаг ДН] Починаємо пошук іменинників...`);
                        data.response.forEach(user => {
                            if (isBirthdaySoon(user.birthdate, user.name)) {
                                injectBirthdayDot(user.name);
                            }
                        });
                    }, 2000);
                }
            }).catch(err => {
                console.error("❌ [Дебаг ДН] Помилка розпаковки JSON:", err);
            });
        }
    } catch(e) {
        console.error("❌ [Дебаг ДН] Помилка перехоплювача:", e);
    }

    return response;
};

// ==========================================
// АНАЛІТИКА ТА ПАМ'ЯТЬ (БРОНЬОВАНІ КЛЮЧІ)
// ==========================================
function logInviteAnalytics(text, actionType, chatUid = "") {
    console.log(`[Дебаг Аналітика] logInviteAnalytics викликано. action=${actionType}, chatUid=${chatUid}`);

    const currentKey = window.alphaKey || localStorage.getItem('alphaAccessKey');
    if (!currentKey) {
        console.warn(`[Дебаг Аналітика] Немає access_key — не відправляємо`);
        return;
    }

    console.log(`[Дебаг Аналітика] Диспатчимо AlphaAnalyticsLog (action=${actionType})`);

    window.dispatchEvent(new CustomEvent("AlphaAnalyticsLog", {
        detail: {
            access_key: currentKey,
            invite_text: text || "",
            action: actionType,
            chat_uid: chatUid
        }
    }));
}

function markChatAsInvited(chatUid) {
    if (!chatUid) return;
    try {
        let invited = JSON.parse(localStorage.getItem('alpha_recent_invites') || '[]');
        if (!invited.includes(chatUid)) {
            invited.push(chatUid);
            if (invited.length > 1500) {
                invited.shift();
            }
            localStorage.setItem('alpha_recent_invites', JSON.stringify(invited));
        }
    } catch (e) {}
}

function wasChatInvited(chatUid) {
    if (!chatUid) return false;
    try {
        let invited = JSON.parse(localStorage.getItem('alpha_recent_invites') || '[]');
        return invited.includes(chatUid);
    } catch (e) {
        return false;
    }
}

async function fetchLeadProfileAndLog(manId, smartUid) {
    console.log(`[Дебаг Збирача] Почали збір даних для AI. Мужик: ${manId}, Чат: ${smartUid}`);
    try {
        let token = localStorage.getItem('token');
        if (!token) return;
        token = token.replace(/^"|"$/g, '');

        // Витягуємо ID анкети зі смарт-ключа
        const womanId = smartUid.split('_')[0];

        // 1. СТЯГУЄМО ДОСЬЄ МУЖИКА (Це робимо завжди)
        const manRes = await fetch(`https://alpha.date/api/operator/myProfile?user_id=${manId}&activeProfile=false`, {
            headers: { "authorization": `Bearer ${token}` }
        });
        const manData = await manRes.json();

        // 2. РОЗУМНЕ КЕШУВАННЯ АНКЕТИ (Перевіряємо чи пройшло 14 днів)
        let womanProfileJson = null;
        const syncKey = `alpha_woman_sync_${womanId}`;
        const lastSync = localStorage.getItem(syncKey);
        const now = Date.now();
        const days14 = 14 * 24 * 60 * 60 * 1000; // 14 днів у мілісекундах

        if (!lastSync || (now - parseInt(lastSync)) > days14) {
            console.log(`[Дебаг Збирача] Анкету ${womanId} давно не оновлювали. Стягуємо свіжий JSON...`);
            try {
                const womanRes = await fetch(`https://alpha.date/api/operator/myProfile?user_id=${womanId}&activeProfile=false`, {
                    headers: { "authorization": `Bearer ${token}` }
                });
                const womanData = await womanRes.json();

                if (womanData.status && womanData.user_info) {
                    womanProfileJson = JSON.stringify(womanData.user_info);
                    localStorage.setItem(syncKey, now.toString()); // Записуємо нову дату
                }
            } catch (wErr) {
                console.warn(`[Дебаг Збирача] Не вдалося стягнути досьє анкети`, wErr);
            }
        } else {
            console.log(`[Дебаг Збирача] Анкета ${womanId} є в кеші (до 14 днів). Економимо запит! 🚀`);
        }

        if (manData.status && manData.user_info) {
            const mInfo = manData.user_info;

            // 3. ВИПРАВЛЯЄМО БАГ З ІНТЕРЕСАМИ (прибираємо пусті коми)
            let interests = "Not Specified";
            if (mInfo.user_hobby && Array.isArray(mInfo.user_hobby)) {
                interests = mInfo.user_hobby.map(h => {
                    if (typeof h === 'string') return h;
                    return h.name || h.title || h.value || h.hobby_name || "";
                }).filter(val => val !== "").join(", ");

                if (interests === "") interests = "Not Specified";
            }

            const currentKey = window.alphaKey || localStorage.getItem('alphaAccessKey');

            // 4. ВІДПРАВЛЯЄМО ПАКЕТ НА СЕРВЕР
            window.dispatchEvent(new CustomEvent("AlphaAnalyticsLog", {
                detail: {
                    access_key: currentKey,
                    action: "reply",
                    chat_uid: smartUid,
                    profile_id: String(manId),
                    woman_id: String(womanId),
                    lead_age: mInfo.user_detail?.age || 0,
                    lead_country: mInfo.user_detail?.country_name || "Unknown",
                    lead_interests: interests,
                    lead_bio: mInfo.user_reference?.summary || "",
                    lead_photo: mInfo.user_detail?.photo_link || "",

                    // ШІ Датасет:
                    man_profile_json: JSON.stringify(mInfo),
                    woman_profile_json: womanProfileJson // Буде null, якщо брали з кешу
                }
            }));
        }
    } catch (err) {
        console.error("Помилка збору досьє:", err);
    }
}

// ==================== ВІДПРАВКА АНАЛІТИКИ НА СЕРВЕР ====================
async function sendAnalyticsToServer(detail) {
    console.log(`[Аналітика] Готуємося відправити на бекенд. action=${detail.action}, chat_uid=${detail.chat_uid}`);

    // TODO: заміни на адресу твого тестового сервера (або зроби змінну)
    const backendUrl = "http://твій-test-сервер:8001/api/analytics/log_invite";

    try {
        const res = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(detail)
        });

        const result = await res.json();
        console.log(`[Аналітика] Відповідь від бекенду:`, result);

        if (res.ok && result.status === "success") {
            console.log(`[Аналітика] ✅ Аналітика успішно збережена на сервері`);
        } else {
            console.warn(`[Аналітика] ⚠️ Бекенд повернув помилку`);
        }
    } catch (err) {
        console.error(`[Аналітика] Помилка відправки на бекенд:`, err);
    }
}