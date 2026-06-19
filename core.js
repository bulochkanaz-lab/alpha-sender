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

async function fetchLeadProfileAndLog(manId, chatUid) {
    console.log(`[Дебаг Збирача] Почали збір досьє для ID: ${manId}`);
    try {
        let token = localStorage.getItem('token');
        if (!token) {
            console.warn(`[Дебаг Збирача] Немає токена в localStorage`);
            return;
        }
        token = token.replace(/^"|"$/g, '');
        console.log(`[Дебаг Збирача] Токен отримано`);

        const url = `https://alpha.date/api/operator/myProfile?user_id=${manId}&activeProfile=false`;
        console.log(`[Дебаг Збирача] Робимо запит на: ${url}`);

        const res = await fetch(url, {
            headers: { "authorization": `Bearer ${token}` }
        });
        console.log(`[Дебаг Збирача] Відповідь від alpha.date, status: ${res.status}`);

        const data = await res.json();
        console.log(`[Дебаг Збирача] data.status = ${data.status}`);

        if (data.status && data.user_info) {
            const info = data.user_info;

            const age = info.user_detail?.age || 0;
            const country = info.user_detail?.country_name || "Unknown";
            const photo = info.user_detail?.photo_link || "";
            const bio = info.user_reference?.summary || "";

            let interests = "Not Specified";
            if (info.user_hobby && info.user_hobby.length > 0) {
                interests = info.user_hobby.map(h => h.name || "").join(", ");
            }

            console.log("[Аналітика] Досьє зібрано! Відправляємо на сервер.");
            console.log(`[Дебаг Збирача] Данні: age=${age}, country=${country}, interests=${interests}`);

            const currentKey = window.alphaKey || localStorage.getItem('alphaAccessKey');
            if (!currentKey) {
                console.warn(`[Дебаг Збирача] Немає access_key`);
                return;
            }

            console.log(`[Дебаг Збирача] Диспатчимо AlphaAnalyticsLog з chat_uid=${chatUid}`);

            window.dispatchEvent(new CustomEvent("AlphaAnalyticsLog", {
                detail: {
                    access_key: currentKey,
                    action: "reply",
                    chat_uid: chatUid,
                    profile_id: String(manId),
                    lead_age: age,
                    lead_country: country,
                    lead_interests: interests,
                    lead_bio: bio,
                    lead_photo: photo
                }
            }));
        } else {
            console.warn(`[Дебаг Збирача] Немає data.user_info або status=false`);
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