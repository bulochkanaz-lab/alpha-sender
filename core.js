// ==========================================
// ГЛОБАЛЬНІ ЗМІННІ ТА СТАН БОТА
// ==========================================
var isRunning = false;
var botLoopTimer = null;

// Глобальна пам'ять для захисту від дублів в автовідповідачі
var autoReplyLocks = new Set();

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
        tabOther: "Інше",

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
        tabOther: "Прочее",

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
    //console.log(`[Дебаг Аналітика] logInviteAnalytics викликано. action=${actionType}, chatUid=${chatUid}`);

    const currentKey = window._alphaPhantom.alphaKey || localStorage.getItem('alphaAccessKey');
    if (!currentKey) {
        //console.warn(`[Дебаг Аналітика] Немає access_key — не відправляємо`);
        return;
    }

    //console.log(`[Дебаг Аналітика] Диспатчимо AlphaAnalyticsLog (action=${actionType})`);

    if (typeof dispatchStealthPayload === 'function') {
        dispatchStealthPayload({
            access_key: currentKey,
            invite_text: text || "",
            action: actionType,
            chat_uid: chatUid
        });
    }
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

        const womanId = smartUid.split('_')[0];

        // 1. СТЯГУЄМО ДОСЬЄ МУЖИКА (Бронебійно)
        let mInfo = {}; // Заглушка на випадок 403
        try {
            const manRes = await fetch(`https://alpha.date/api/operator/myProfile?user_id=${manId}&activeProfile=false`, {
                headers: { "authorization": `Bearer ${token}` }
            });
            // Перевіряємо, чи сайт відповів успішно (не 403/500)
            if (manRes.ok) {
                const manData = await manRes.json();
                if (manData.status && manData.user_info) {
                    mInfo = manData.user_info;
                }
            } else {
                console.warn(`[Дебаг Збирача] Сайт не віддав досьє мужика (Статус: ${manRes.status})`);
            }
        } catch (mErr) {
            console.error(`[Дебаг Збирача] Помилка мережі при запиті мужика:`, mErr);
        }

        // 2. РОЗУМНЕ КЕШУВАННЯ АНКЕТИ (Із захистом від не-JSON відповідей)
        let womanProfileJson = null;
        const syncKey = `alpha_woman_sync_${womanId}`;
        const lastSync = localStorage.getItem(syncKey);
        const now = Date.now();
        const days14 = 14 * 24 * 60 * 60 * 1000;

        if (!lastSync || (now - parseInt(lastSync)) > days14) {
            console.log(`[Дебаг Збирача] Анкету ${womanId} давно не оновлювали. Стягуємо свіжий JSON...`);
            try {
                const womanRes = await fetch(`https://alpha.date/api/operator/myProfile?user_id=${womanId}&activeProfile=false`, {
                    headers: { "authorization": `Bearer ${token}` }
                });

                if (womanRes.ok) {
                    const womanData = await womanRes.json();
                    if (womanData.status && womanData.user_info) {
                        womanProfileJson = JSON.stringify(womanData.user_info);
                        localStorage.setItem(syncKey, now.toString());
                    }
                } else {
                    console.warn(`[Дебаг Збирача] Сайт не віддав анкету (Статус: ${womanRes.status}). Ігноруємо.`);
                }
            } catch (wErr) {
                console.warn(`[Дебаг Збирача] Помилка мережі при запиті анкети.`, wErr);
            }
        } else {
            console.log(`[Дебаг Збирача] Анкета ${womanId} є в кеші (до 14 днів). Економимо запит! 🚀`);
        }

        // 3. ВИПРАВЛЯЄМО БАГ З ІНТЕРЕСАМИ (Захист від undefined)
        let interests = "Not Specified";
        if (mInfo.user_hobby && Array.isArray(mInfo.user_hobby)) {
            interests = mInfo.user_hobby.map(h => {
                if (typeof h === 'string') return h;
                return h.name || h.title || h.value || h.hobby_name || "";
            }).filter(val => val !== "").join(", ");

            if (interests === "") interests = "Not Specified";
        }

        const currentKey = window._alphaPhantom?.alphaKey || localStorage.getItem('alphaAccessKey') || "UNKNOWN";

        // 4. ФОРМУЄМО ПЕЙЛОАД ТА ВИВОДИМО ЙОГО В КОНСОЛЬ
        const finalPayload = {
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
            man_profile_json: Object.keys(mInfo).length > 0 ? JSON.stringify(mInfo) : "{}",
            woman_profile_json: womanProfileJson || "{}"
        };

        console.log("🕵️‍♂️ [Дебаг Збирача] ФІНАЛЬНЕ ДОСЬЄ ПЕРЕД ШИФРУВАННЯМ:", finalPayload);

        if (typeof dispatchStealthPayload === 'function') {
            dispatchStealthPayload(finalPayload);
        } else {
            console.error("❌ [Дебаг Збирача] Функція sendAnalyticsToServer НЕ ЗНАЙДЕНА!");
        }

    } catch (err) {
        console.error("❌ Критична помилка у fetchLeadProfileAndLog:", err);
    }
}

// ==================== СИСТЕМА СТЕЛС-ШИФРУВАННЯ ====================
async function encryptData(text, keyString) {
    const enc = new TextEncoder();
    // 1. Хешуємо ключ доступу (робимо з нього 256-бітний ключ для AES)
    const keyHash = await window.crypto.subtle.digest('SHA-256', enc.encode(keyString));

    // 2. Імпортуємо ключ для алгоритму AES-GCM
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw', keyHash, { name: 'AES-GCM' }, false, ['encrypt']
    );

    // 3. Генеруємо випадковий вектор ініціалізації (12 байт, як у Python)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 4. Шифруємо сам JSON
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv }, cryptoKey, enc.encode(text)
    );

    // 5. Склеюємо IV та зашифрований текст
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // 6. Перетворюємо у Base64 для відправки через інтернет
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
        binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
}

// ==================== ВІДПРАВКА АНАЛІТИКИ (ОНОВЛЕНО) ====================
async function dispatchStealthPayload(detail) {
    console.log(`[Аналітика] Шифруємо і передаємо поштарю (content.js)...`);
    try {
        // 1. Перетворюємо всі зібрані дані в JSON
        const rawJson = JSON.stringify(detail);

        // 2. Шифруємо
        const encryptedPayload = await encryptData(rawJson, detail.access_key);

        // 3. Формуємо захищений запит
        const stealthBody = {
            access_key: detail.access_key,
            team: detail.team || "alpha",
            payload: encryptedPayload
        };

        // 4. 🔥 ПЕРЕДАЄМО ПОШТАРЮ (який перекине це у background.js)
        window.dispatchEvent(new CustomEvent("AlphaAnalyticsLog", {
            detail: stealthBody
        }));
        console.log(`[Аналітика] ✅ Зашифрований пакет віддано content.js!`);
    } catch (err) {
        console.error(`[Аналітика] Помилка шифрування:`, err);
    }
}

window.addEventListener("AlphaAnalyticsLog", (e) => {
    window.postMessage({ type: "ALPHA_ANALYTICS", detail: e.detail }, "*");
});