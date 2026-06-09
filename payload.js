let isRunning = false;
let botLoopTimer = null;

// СЛОВНИК ПЕРЕКЛАДІВ
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

function updatePopup(statusText, finished = false, currentProfileName = null) {
    const statusEl = document.getElementById("uiStatusText");
    const profileEl = document.getElementById("uiCurrentProfile");
    const startBtn = document.getElementById("uiStartBtn");
    const stopBtn = document.getElementById("uiStopBtn");

    if (statusEl) statusEl.innerText = statusText;
    if (profileEl && currentProfileName) profileEl.innerText = currentProfileName;
    if (finished && startBtn && stopBtn) {
        startBtn.style.display = "block";
        stopBtn.style.display = "none";
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getHeaders(token) {
    return {
        accept: "application/json, text/plain, */*",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
    };
}

async function getAllProfiles(token) {
    try {
        const response = await fetch("https://alpha.date/api/operator/profiles", {
            method: "GET",
            headers: getHeaders(token),
        });
        const data = await response.json();
        // Повертаємо всі анкети без фільтрації
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

async function getProfileGallery(token, profileId) {
    try {
        const response = await fetch(`https://alpha.date/api/files/images?external_id=${profileId}`, {
            method: "GET",
            headers: getHeaders(token),
        });
        const data = await response.json();
        return data.images.reduce((acc, file) => {
            if (file.link && file.id) acc[file.link] = String(file.id);
            return acc;
        }, {});
    } catch (error) {
        return {};
    }
}

function extractArray(data) {
    return Array.isArray(data) ? data : data?.response || data?.data || [];
}

async function getTemplates(token, profileId) {
    return await fetchTemplates(token, profileId, "Letter");
}

async function getInviteTemplates(token, profileId) {
    return await fetchTemplates(token, profileId, "Chat");
}

async function fetchTemplates(token, profileId, mailType) {
    try {
        const response = await fetch(`https://alpha.date/api/sender/inviteList?external_id=${profileId}&mail_type=${mailType}`, {
            method: "GET",
            headers: getHeaders(token),
        });
        return extractArray(await response.json());
    } catch (error) {
        return [];
    }
}

// Оновлена функція Heartbeat (Пінг)
async function sendHeartbeatToServer(profilesList = []) {
    const currentKey = window.alphaKey || localStorage.getItem('alphaAccessKey');
    if (!currentKey) return;

    // Кидаємо подію в межах сторінки, щоб її спіймав content.js
    window.dispatchEvent(new CustomEvent("AlphaPing", {
        detail: {
            key: currentKey,
            profiles: profilesList.map(p => p.id)
        }
    }));
}

async function getExternalIdsFromLastMessage(token, chatUids) {
    try {
        const response = await fetch("https://alpha.date/api/chatList/lastMessage", {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify({ chat_uid: chatUids }),
        });
        return await response.json();
    } catch (error) {
        return [];
    }
}

async function collectAllMen(token, profileId) {
    let allClients = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && isRunning) {
        updatePopup(`Шукаю мужиків (Сторінка ${page})...`);

        const bodyData = {
            user_id: String(profileId),
            chat_uid: false,
            page: page,
            freeze: true,
            limits: null,
            ONLINE_STATUS: 1,
            SEARCH: "",
            CHAT_TYPE: "CHANCE",
            showHidden: 0,
            blockedByWoman: 0,
            blockedByMan: 0,
        };

        try {
            // 1. Отримуємо список "коротких" мужиків
            const response = await fetch("https://alpha.date/api/chatList/chatListByUserID", {
                method: "POST",
                headers: getHeaders(token),
                body: JSON.stringify(bodyData),
            });
            const data = await response.json();
            const list = data.response || [];

            if (list.length === 0) {
                hasMore = false;
                break;
            }

            // 2. Збираємо всі chat_uid з цієї сторінки в один масив
            const chatUids = list.map(item => item.chat_uid).filter(uid => uid);

            // 3. Робимо ОДИН масовий запит за останніми повідомленнями
            let messagesData = [];
            if (chatUids.length > 0) {
                const lastMsgResponse = await fetch("https://alpha.date/api/chatList/lastMessage", {
                    method: "POST",
                    headers: getHeaders(token),
                    body: JSON.stringify({ chat_uid: chatUids }) // Передаємо масив
                });
                const lastMsgJson = await lastMsgResponse.json();

                // Сайт може повернути масив або об'єкт, нормалізуємо це
                messagesData = lastMsgJson.response || lastMsgJson.data || [];
                if (!Array.isArray(messagesData) && typeof messagesData === 'object') {
                    messagesData = Object.values(messagesData);
                }
            }

            // 4. З'єднуємо коротких мужиків з їхніми довгими ID (external_id)
            list.forEach((item) => {
                let externalId = null;
                const chatUid = item.chat_uid;

                // Шукаємо повідомлення для цього чату
                const msg = messagesData.find(m => m.chat_uid === chatUid);

                if (msg) {
                    // Твоя золота логіка зі старих архівів!
                    if (Number(msg.is_male) === 1) {
                        externalId = msg.sender_external_id;
                    } else {
                        externalId = msg.recipient_external_id;
                    }
                }

                // Фолбек: якщо чат АБСОЛЮТНО порожній і немає lastMessage
                if (!externalId) {
                    externalId = item.male_id;
                }

                if (externalId && !allClients.some((c) => c.id === externalId)) {
                    allClients.push({ id: externalId, chat_uid: chatUid });
                }
            });

            updatePopup(`Збір мужиків (Сторінка ${page})... Знайдено: ${allClients.length}`);
            page++;
            await sleep(500);

        } catch (error) {
            console.error("❌ Помилка при зборі сторінки", page, error);
            hasMore = false;
        }
    }

    return allClients;
}


// ==========================================

// АНТИ-СПАМ: Читання історії чату

// ==========================================

async function isDuplicateInHistory(token, chatUid, textToCheck) {
	// 🔥 Захист: якщо тексту немає, пропускаємо перевірку

	if (!chatUid || !textToCheck) return false;

	try {
		const response = await fetch("https://alpha.date/api/chatList/chatHistory", {
			method: "POST",
			headers: getHeaders(token),

			body: JSON.stringify({ chat_id: chatUid, page: 1 }),
		});

		const data = await response.json();

		const messages = data.response || data.data || [];

		if (!Array.isArray(messages)) return false;

		const normalizedText = String(textToCheck).trim().toLowerCase();

		for (let i = 0; i < messages.length; i++) {
			const msgContent = messages[i].message_content || "";

			if (String(msgContent).trim().toLowerCase() === normalizedText) {
				return true;
			}
		}

		return false;
	} catch (error) {
		// console.error("❌ Помилка при перевірці історії чату:", error);

		return false;
	}
}

// ==========================================
// АНТИ-СПАМ: Швидке читання останніх повідомлень
// ==========================================

async function getRecentHistoryTexts(token, chatUid) {
	if (!chatUid) return [];

	try {
		const response = await fetch("https://alpha.date/api/chatList/chatHistory", {
			method: "POST",
			headers: getHeaders(token),

			body: JSON.stringify({ chat_id: chatUid, page: 1 }),
		});

		const data = await response.json();

		const messages = data.response || data.data || [];

		if (!Array.isArray(messages)) return [];

		// Повертаємо всі тексти маленькими літерами для точного порівняння

		return messages.map((m) =>
			String(m.message_content || "")
				.trim()
				.toLowerCase(),
		);
	} catch (error) {
		return [];
	}
}

function formatAttachmentsForMail(rawAttachments, imageMap) {
	if (!rawAttachments || rawAttachments.length === 0) return [];

	return rawAttachments.reduce((acc, att) => {
		const realId = imageMap[att.link];

		// Додаємо фото ТІЛЬКИ якщо знайшли його реальний ID в галереї

		if (realId) {
			const fileName = att.link.split("/").pop() || "image.jpg";

			acc.push({
				id: realId,

				link: att.link,

				message_type: att.attachment_type || "SENT_IMAGE",

				title: fileName,
			});
		} else {
			// console.warn(`⚠️ Пропущено фото (немає в галереї): ${att.link}`);
		}

		return acc;
	}, []);
}

async function sendLetter(token, profileId, recipientId, template, imageMap) {
	// 🔥 Передаємо imageMap у форматер

	const formattedAttachments = formatAttachmentsForMail(template.attachments, imageMap);

	const bodyData = {
		user_id: Number(profileId),

		recipients: [recipientId],

		message_content: template.message_content,

		message_type: template.message_type || "SENT_TEXT",

		attachments: formattedAttachments,

		parent_mail_id: null,

		is_send_email: false,
	};

	try {
		const response = await fetch("https://alpha.date/api/mailbox/mail", {
			method: "POST",

			headers: getHeaders(token),

			body: JSON.stringify(bodyData),
		});

		const data = await response.json();

		if (response.ok && data.status === true) {
			return true;
		} else {
			// console.warn(`⚠️ Відмова для ID ${recipientId}. Причина:`, data);

			return false;
		}
	} catch (error) {
		// console.error(`❌ Критична помилка fetch при відправці:`, error);

		return false;
	}
}

// ==========================================
// ЕКСТРЕНЕ ВИМКНЕННЯ АНКЕТИ (БЕЗПЕЧНИЙ ПАРСИНГ)
// ==========================================
async function disableProfile(profileId) {
    let token = localStorage.getItem("token");
    if (!token) return false;
    token = token.replace(/^"|"$/g, "");

    let operatorId = null;

    // Дістаємо operator_id прямо з JWT токена
    try {
        let base64Url = token.split('.')[1];
        // Виправляємо символи для стандартного Base64
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Додаємо вирівнювання (=), якщо його не вистачає
        while (base64.length % 4) {
            base64 += '=';
        }

        const decoded = JSON.parse(atob(base64));
        operatorId = decoded.id;
    } catch (e) {
        console.error("Помилка парсингу токена:", e);
        return false;
    }

    if (!operatorId) return false;

    const bodyData = {
        "external_id": Number(profileId),
        "operator_id": Number(operatorId),
        "status": 0
    };

    try {
        const response = await fetch("https://alpha.date/api/operator/setProfileOnline", {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        // Сервер може віддати status: true, або просто відповісти 200 OK
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function sendInvite(token, profileId, recipientId, template, chatUid) {
    const man = Number(recipientId);
    const woman = Number(profileId);

    const payload = {
       sender_id: woman,
       recipient_id: man, // 🔥 ТЕПЕР ТУТ ЛЕТИТЬ ДОВГИЙ EXTERNAL ID!
       message_content: template.message_content,
       message_type: template.message_type || "SENT_TEXT",
       filename: "",
       chance: true
    };

    try {
       const response = await fetch("https://alpha.date/api/chat/message", {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify(payload)
       });

       const data = await response.json();

       if (response.ok && data.status === true) {
          console.log(`✅ [УСПІХ] Інвайт залетів до мужика ${man}!`);
          return true;
       } else {
          // Якщо раптом сайт скаже, що чат уже занадто розвинений для Шансу
          console.warn(`🛑 ВІДМОВА З CHANCE (Мужик: ${man}). Пробуємо класику...`);

          const backupPayload = { ...payload, chat_uid: chatUid };
          delete backupPayload.chance;

          const backupResponse = await fetch("https://alpha.date/api/chat/message", {
              method: "POST", headers: getHeaders(token), body: JSON.stringify(backupPayload)
          });
          const backupData = await backupResponse.json();

          if (backupResponse.ok && backupData.status === true) {
              console.log(`✅ [УСПІХ-КЛАСИКА] Інвайт залетів до ${man}!`);
              return true;
          } else {
              console.error(`❌ ПОСТРІЛ НЕ ВДАВСЯ:`, backupData);
              return false;
          }
       }
    } catch (error) {
       console.error(`❌ Критична помилка fetch:`, error);
       return false;
    }
}

// Головна логіка (Інвайти + Листи + Розумні таймери + АНТИСПАМ)

async function startSendingProcess() {
	// 🔥 ПЕРЕВІРКА СТАТУСУ КЛЮЧА 🔥

	let token = localStorage.getItem("token");

	if (!token) {
		// ...

		updatePopup("Помилка: Токен не знайдено!", true);

		isRunning = false;

		return;
	}

	token = token.replace(/^"|"$/g, "");

	const settings = JSON.parse(localStorage.getItem("alphaBotSettings") || "{}");

	const useAllProfiles = settings.useAllProfiles !== undefined ? settings.useAllProfiles : true;

	const singleProfileId = settings.profileId || "";

	// 🔥 Читаємо цифри ПРЯМО з меню, щоб 0 працював ідеально

	const uiDelayEl = document.getElementById("uiDelay");

	const uiPhaseEl = document.getElementById("uiPhaseDelay");

	const uiBreakEl = document.getElementById("uiBreakTime");

	// Якщо поле порожнє або там текст - ставимо дефолтні. Якщо там 0 - буде 0.

	const delaySeconds = uiDelayEl && uiDelayEl.value !== "" ? parseInt(uiDelayEl.value) : 4;

	const phaseDelayMinutes = uiPhaseEl && uiPhaseEl.value !== "" ? parseInt(uiPhaseEl.value) : 2;

	const breakTimeMinutes = uiBreakEl && uiBreakEl.value !== "" ? parseInt(uiBreakEl.value) : 10;

	let profilesToProcess = [];

	if (useAllProfiles) {
		updatePopup("Пошук онлайн анкет...", false, "Підготовка...");

		const allProfiles = await getAllProfiles(token);

		if (!isRunning) return;

		if (allProfiles.length === 0) {
			updatePopup("Не знайдено онлайн-анкет!", true);
			isRunning = false;
			return;
		}

		profilesToProcess = allProfiles.map((p) => ({ id: p.external_id, name: p.name }));
	} else {
		profilesToProcess = [{ id: singleProfileId, name: "Ручне введення" }];
	}

	// --- ПОЧАТОК НОВОГО КОДУ ---
    // Відправляємо список анкет одразу при старті розсилки
    sendHeartbeatToServer(profilesToProcess);

    // Запускаємо таймер: відправляти "я живий" кожні 60 секунд
    if (window.alphaHeartbeatInterval) {
        clearInterval(window.alphaHeartbeatInterval);
    }
    window.alphaHeartbeatInterval = setInterval(() => {
        if (isRunning) {
            sendHeartbeatToServer(profilesToProcess);
        } else {
            // Якщо бот зупинений - відправляємо порожній список, щоб в Telegram показало "Немає активних"
            sendHeartbeatToServer([]);
            clearInterval(window.alphaHeartbeatInterval);
        }
    }, 60000);
    // --- КІНЕЦЬ НОВОГО КОДУ ---

	for (let pIndex = 0; pIndex < profilesToProcess.length; pIndex++) {
		if (!isRunning) break;

		const currentProfile = profilesToProcess[pIndex];

		const profileNameDisplay = `${currentProfile.name} (${currentProfile.id})`;

		updatePopup(`Збір бази...`, false, profileNameDisplay);

		// --- РОЗУМНА ЛОГІКА ШАБЛОНІВ (З резервним планом) ---

		const useSiteTpl = localStorage.getItem("alphaUseSiteTemplates") !== "false";

		let inviteTemplates = [];

		let letterTemplates = [];

		if (!useSiteTpl) {
			// Беремо кастомні тексти з пам'яті

			const localInvites = JSON.parse(localStorage.getItem(`alpha_invites_${currentProfile.id}`) || "[]");

			const localLetters = JSON.parse(localStorage.getItem(`alpha_letters_${currentProfile.id}`) || "[]");

			// Якщо є свої - беремо їх. Якщо порожньо - робимо запит до сайту (Гнучкий режим)

			inviteTemplates = localInvites.length > 0 ? localInvites : await getInviteTemplates(token, currentProfile.id);

			letterTemplates = localLetters.length > 0 ? localLetters : await getTemplates(token, currentProfile.id);

			// if (localInvites.length === 0) console.log(`⚠️ Для ${currentProfile.name} немає кастомних інвайтів. Взято з сайту.`);

			// if (localLetters.length === 0) console.log(`⚠️ Для ${currentProfile.name} немає кастомних листів. Взято з сайту.`);
		} else {
			// Стандартний режим: беремо тільки з сайту

			inviteTemplates = await getInviteTemplates(token, currentProfile.id);

			letterTemplates = await getTemplates(token, currentProfile.id);
		}

		// ----------------------------------------------------

		if (!isRunning) break;

		// 🔥 ДОДАЄМО ЛОКАТОР ДЛЯ ЛИСТІВ 🔥

		const invCount = inviteTemplates ? inviteTemplates.length : 0;

		const letCount = letterTemplates ? letterTemplates.length : 0;

		//console.log(`📋 [Анкета ${currentProfile.name}] Знайдено шаблонів: Інвайти = ${invCount}, Листи = ${letCount}`);

		const clientsList = await collectAllMen(token, currentProfile.id);

		const imageMap = await getProfileGallery(token, currentProfile.id);

		if (!isRunning) break;

		// Далі код іде без змін, починаючи з:

		// if (clientsList.length === 0) { ...

		if (clientsList.length === 0) {
			// console.warn(`⚠️ Немає клієнтів для ${profileNameDisplay}. Пропускаємо.`);

			continue;
		}

		const hasInvites = inviteTemplates && inviteTemplates.length > 0;

		const hasLetters = letterTemplates && letterTemplates.length > 0;

		// ==========================================

		// ФАЗА 1: ІНВАЙТИ

		// ==========================================

		// ==========================================

		// ФАЗА 1: ІНВАЙТИ

		// ==========================================

		if (hasInvites) {
			updatePopup(`Розсилка інвайтів...`, false, profileNameDisplay);

			// Читаємо режим розсилки з пам'яті

			const inviteMode = settings.inviteMode || "batch";

			for (let i = 0; i < clientsList.length; i++) {
				if (!isRunning) break;

				const client = clientsList[i];

				// Отримуємо історію чату ОДИН РАЗ (читаємо першу сторінку)

				const historyTexts = await getRecentHistoryTexts(token, client.chat_uid);

				if (!useSiteTpl) {
					// --- КАСТОМНІ ТЕКСТИ (Власні інвайти) ---

					if (inviteMode === "batch") {
						// РЕЖИМ: Відправляти пачкою (Всі підряд, яких ще немає в історії)

						let sentCount = 0;

						for (let t = 0; t < inviteTemplates.length; t++) {
							if (!isRunning) break;

							const template = inviteTemplates[t];

							const normalizedText = String(template.message_content).trim().toLowerCase();

							// Якщо тексту ще немає в історії — відправляємо

							if (!historyTexts.includes(normalizedText)) {
								const success = await sendInvite(token, currentProfile.id, client.id, template, client.chat_uid);

								if (success) {
									incrementStat("invites");

									updatePopup(`Інвайти йдуть...`, false, profileNameDisplay);

									sentCount++;
								}

								// Маленька пауза 2 сек між інвайтами в пачці (щоб виглядати як людина)

								if (t < inviteTemplates.length - 1 && isRunning) await sleep(2000);
							}
						}

						// Глобальна пауза перед наступним чоловіком

						if (sentCount > 0 && i < clientsList.length - 1 && isRunning) {
							await sleep(delaySeconds * 1000);
						}
					} else {
						// РЕЖИМ: По одному на коло (Шукаємо ПЕРШИЙ невідправлений текст)

						let templateToSend = null;

						for (let t = 0; t < inviteTemplates.length; t++) {
							const normalizedText = String(inviteTemplates[t].message_content).trim().toLowerCase();

							if (!historyTexts.includes(normalizedText)) {
								templateToSend = inviteTemplates[t]; // Знайшли текст, якого ще немає!

								break; // Зупиняємо пошук, беремо тільки його
							}
						}

						if (templateToSend) {
							const success = await sendInvite(token, currentProfile.id, client.id, template, client.chat_uid);

							if (success) {
								incrementStat("invites");

								updatePopup(`Інвайти йдуть...`, false, profileNameDisplay);
							}

							if (i < clientsList.length - 1 && isRunning) await sleep(delaySeconds * 1000);
						} else {
							// console.log(`⏩ Пропуск Інвайту для ${client.id}: всі ваші інвайти вже відправлені раніше!`);
						}
					}
				} else {
					// --- ШАБЛОНИ З САЙТУ (Стандартний рандомний режим) ---

					const randomTemplate = inviteTemplates[Math.floor(Math.random() * inviteTemplates.length)];

					const normalizedText = String(randomTemplate.message_content).trim().toLowerCase();

					if (historyTexts.includes(normalizedText)) {
						//(`⏩ Пропуск Інвайту для ${client.id}: такий текст вже є в історії!`);

						continue;
					}

					const success = await sendInvite(token, currentProfile.id, client.id, template, client.chat_uid);

					if (success) {
						incrementStat("invites");

						updatePopup(`Інвайти йдуть...`, false, profileNameDisplay);
					}

					if (i < clientsList.length - 1 && isRunning) await sleep(delaySeconds * 1000);
				}
			}
		}

		if (!isRunning) break;

		// ==========================================

		// ПАУЗА МІЖ ІНВАЙТАМИ ТА ЛИСТАМИ

		// ==========================================

		if (hasInvites && hasLetters && phaseDelayMinutes > 0 && clientsList.length > 0) {
			let waitTimeMs = phaseDelayMinutes * 60 * 1000;

			while (waitTimeMs > 0 && isRunning) {
				const min = Math.floor(waitTimeMs / 60000);

				const sec = Math.floor((waitTimeMs % 60000) / 1000);

				updatePopup(`Пауза: ${min}хв ${sec}с`, false, profileNameDisplay);

				await sleep(1000);

				waitTimeMs -= 1000;
			}
		}

		if (!isRunning) break;

		// ==========================================

		// ФАЗА 2: ЛИСТИ

		// ==========================================

		if (hasLetters) {
			updatePopup(`Розсилка листів...`, false, profileNameDisplay);

			for (let i = 0; i < clientsList.length; i++) {
				if (!isRunning) break;

				const client = clientsList[i];

				const randomTemplate = letterTemplates[Math.floor(Math.random() * letterTemplates.length)];

				// 🔥 АНТИ-СПАМ ПЕРЕВІРКА 🔥

				const isDuplicate = await isDuplicateInHistory(token, client.chat_uid, randomTemplate.message_content);

				if (isDuplicate) {
					// console.log(`⏩ Пропуск Листа для ${client.id}: такий текст вже є в історії!`);

					continue;
				}

				const success = await sendLetter(token, currentProfile.id, client.id, randomTemplate, imageMap);

				if (success) {
					incrementStat("letters");

					updatePopup(`Листи йдуть...`, false, profileNameDisplay);
				}

				if (i < clientsList.length - 1 && isRunning) await sleep(delaySeconds * 1000);
			}
		}

		if (pIndex < profilesToProcess.length - 1 && isRunning) {
			updatePopup(`Наступна анкета...`, false, profileNameDisplay);

			await sleep(3000);
		}
	}

	if (isRunning) {
		updatePopup(`Перерва ${breakTimeMinutes} хв...`, false, t("statusWaiting"));

		const resumeTime = Date.now() + breakTimeMinutes * 60 * 1000;

		localStorage.setItem("alphaBotState", "waiting");

		localStorage.setItem("alphaBotResumeTime", resumeTime.toString());

		startWaitCountdown(resumeTime);
	}
}

// Функція глобального таймера

function startWaitCountdown(resumeTime) {
	clearInterval(botLoopTimer);

	botLoopTimer = setInterval(() => {
		if (!isRunning) {
			clearInterval(botLoopTimer);

			return;
		}

		const left = resumeTime - Date.now();

		if (left <= 0) {
			clearInterval(botLoopTimer);

			localStorage.setItem("alphaBotState", "running");

			startSendingProcess(); // Запуск нового кола без аргументів!
		} else {
			const min = Math.floor(left / 60000);

			const sec = Math.floor((left % 60000) / 1000);

			updatePopup(`Перерва: ${min}хв ${sec}с`, false, "Очікування...");
		}
	}, 1000);
}

// ==========================================
// ЗМІННІ ДЛЯ АВТОВІДПОВІДАЧА
// ==========================================

let currentSelectedProfile = null;
let currentSelectedTab = "like";

// Винесли сюди, щоб усі функції "бачили" ці дані
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

// ==========================================
// ВІЗУАЛЬНИЙ ІНТЕРФЕЙС ТА ІНТЕГРАЦІЯ В МЕНЮ (ОНОВЛЕНИЙ DASHBOARD)
// ==========================================
function injectBotUI() {
    if (document.getElementById("alpha-sender-overlay")) return;

    // 1. ІНЖЕКТИМО CSS
    const styles = `
        #alpha-sender-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px); z-index: 999999; display: none; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, sans-serif; }

        /* Головне вікно */
        .alpha-modal { width: 85vw; max-width: 1100px; height: 85vh; background: #ffffff; border-radius: 12px; display: flex; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.3); }

        /* Бокове меню (Sidebar) */
        .alpha-sidebar { width: 240px; background: #f8f9fa; border-right: 1px solid #e1e8ed; display: flex; flex-direction: column; flex-shrink: 0; }
        .alpha-sidebar-header { padding: 20px; border-bottom: 1px solid #e1e8ed; }
        .alpha-lang-switch { display: flex; gap: 12px; margin-top: 15px; font-size: 18px; user-select: none; }
        .alpha-nav { display: flex; flex-direction: column; padding: 15px 0; overflow-y: auto; flex-grow: 1; }
        .alpha-nav-btn { padding: 14px 20px; cursor: pointer; color: #555; font-weight: 600; font-size: 14px; display: flex; align-items: center; border-left: 4px solid transparent; transition: 0.2s; }
        .alpha-nav-btn:hover { background: #eef2f5; }
        .alpha-nav-btn.active { background: #e3f2fd; color: #1976d2; border-left-color: #1976d2; }

        /* Робоча область */
        .alpha-content { flex: 1; display: flex; flex-direction: column; background: #ffffff; position: relative; overflow: hidden; }
        .alpha-topbar { padding: 15px 25px; border-bottom: 1px solid #e1e8ed; display: flex; justify-content: space-between; align-items: center; background: #fff; z-index: 10; }
        .alpha-status-badges { display: flex; gap: 15px; font-size: 13px; background: #f5f8fa; padding: 8px 15px; border-radius: 6px; border: 1px solid #e1e8ed; }
        .alpha-close { cursor: pointer; font-size: 26px; color: #999; line-height: 1; font-weight: bold; transition: 0.2s; }
        .alpha-close:hover { color: #333; }

        /* Контент вкладок */
        .alpha-tab-area { padding: 25px; overflow-y: auto; flex: 1; }

        /* Форми та інпути */
        .alpha-row { display: flex; gap: 20px; margin-bottom: 20px; }
        .alpha-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .alpha-label { font-size: 12px; color: #666; font-weight: bold; }
        .alpha-input, .alpha-select, .alpha-textarea { width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #ccc; font-size: 13px; box-sizing: border-box; outline: none; transition: 0.2s; font-family: inherit; }
        .alpha-input:focus, .alpha-select:focus, .alpha-textarea:focus { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,0.1); }
        .alpha-textarea { height: 120px; resize: vertical; }

        /* Кнопки */
        .alpha-btn-primary { width: 100%; padding: 14px; background: #1976d2; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; }
        .alpha-btn-primary:hover { background: #1565c0; }
        .alpha-btn-danger { width: 100%; padding: 14px; background: #d32f2f; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; }
        .alpha-btn-success { width: 100%; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }

        /* Тогл (Перемикач) */
        .alpha-toggle-wrapper { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e1e8ed; margin-bottom: 20px; }
        .alpha-toggle-track { position: relative; width: 44px; height: 24px; flex-shrink: 0; background-color: #ccc; border-radius: 24px; transition: .3s; }
        .alpha-toggle-knob { position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .alpha-toggle-track.active { background-color: #4caf50; }
        .alpha-toggle-track.active .alpha-toggle-knob { left: 23px; }

        /* Внутрішні таби (Лайки/Вінки) */
        .alpha-subtabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .alpha-subtab { flex: 1; text-align: center; padding: 10px; cursor: pointer; font-weight: bold; font-size: 13px; color: #666; transition: 0.2s; }
        .alpha-subtab.active { color: #1976d2; border-bottom: 2px solid #1976d2; margin-bottom: -2px; }

        /* Списки збереженого */
        .alpha-list-item { display: flex; justify-content: space-between; align-items: flex-start; background: #f9f9f9; padding: 12px; border-radius: 6px; border: 1px solid #eee; margin-bottom: 8px; font-size: 13px; }

        /* Глобальний селектор анкет */
        .alpha-global-selector { position: relative; width: 280px; user-select: none; }
        .alpha-gs-btn { display: flex; align-items: center; gap: 12px; padding: 6px 12px; background: #f8f9fa; border: 1px solid #cdd5df; border-radius: 8px; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .alpha-gs-btn:hover { background: #fff; border-color: #1976d2; }
        .alpha-gs-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; background: #e1e8ed; flex-shrink: 0; border: 1px solid #ccc; }
        .alpha-gs-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .alpha-gs-name { font-size: 14px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
        .alpha-gs-id { font-size: 11px; color: #888; margin-top: 2px; }
        .alpha-gs-arrow { font-size: 12px; color: #999; transition: transform 0.3s; }

        /* Випадаюче меню селектора */
        .alpha-gs-dropdown { position: absolute; top: 100%; left: 0; width: 100%; margin-top: 8px; background: #fff; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid #e1e8ed; z-index: 9999; display: none; flex-direction: column; max-height: 450px; overflow: hidden; }
        .alpha-gs-search { padding: 10px; border-bottom: 1px solid #eee; background: #fdfdfd; }
        .alpha-gs-search input { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box; transition: 0.2s; }
        .alpha-gs-search input:focus { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,0.1); }
        .alpha-gs-list { overflow-y: auto; flex: 1; padding: 5px 0; }
        .alpha-gs-item { display: flex; align-items: center; gap: 12px; padding: 10px 15px; cursor: pointer; transition: 0.15s; border-left: 3px solid transparent; }
        .alpha-gs-item:hover { background: #f5f8fa; border-left-color: #1976d2; }
        .alpha-gs-item.active { background: #e3f2fd; border-left-color: #1976d2; }
        .alpha-gs-item-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e1e8ed; }

        /* Двопанельний режим Вінок (Master-Detail) */
        .alpha-md-container { display: flex; flex: 1; overflow: hidden; border: 1px solid #e1e8ed; border-radius: 8px; margin-top: 15px; }
        .alpha-wink-sidebar { width: 230px; background: #fafafa; border-right: 1px solid #e1e8ed; display: none; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
        .alpha-wink-content { flex: 1; display: flex; flex-direction: column; padding: 15px; background: #fff; overflow-y: auto; }
        .alpha-wp-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; cursor: pointer; border-bottom: 1px solid #e1e8ed; transition: 0.2s; }
        .alpha-wp-item:hover { background: #f0f4f8; }
        .alpha-wp-item.active { background: #e3f2fd; border-left: 4px solid #1976d2; padding-left: 8px; }
        .alpha-wp-text { font-size: 12px; color: #333; line-height: 1.4; flex: 1; margin-right: 10px; }
        .alpha-wp-badge { font-size: 10px; font-weight: bold; background: #e1e8ed; color: #666; padding: 3px 7px; border-radius: 12px; }
        .alpha-wp-badge.has-items { background: #4caf50; color: white; }
    `;

    const styleEl = document.createElement("style");
    styleEl.id = "alpha-core-styles";
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // 2. СТВОРЮЄМО КАРКАС
    const overlay = document.createElement("div");
    overlay.id = "alpha-sender-overlay";

    overlay.innerHTML = `
        <div class="alpha-modal">
            <div class="alpha-sidebar">
                <div class="alpha-sidebar-header">
                    <h3 data-lang="title" style="margin: 0; color: #1976d2; font-size: 18px;">⚙ Alpha Sender Pro</h3>
                    <div style="font-size: 11px; color: #999; font-style: italic; margin-top: 2px;">Fire Snakes</div>
                    <div class="alpha-lang-switch">
                        <span id="langUaBtn" style="cursor: pointer; opacity: 1;" title="Українська">🇺🇦</span>
                        <span id="langRuBtn" style="cursor: pointer; opacity: 0.4;" title="Русский">🇷🇺</span>
                    </div>
                </div>

                <div class="alpha-nav">
                    <div id="tabBtnSettings" data-lang="tabSettings" class="alpha-nav-btn active">🚀 Розсилка</div>
                    <div id="tabBtnInvites" data-lang="tabInvites" class="alpha-nav-btn" style="display: none;">📩 Інвайти</div>
                    <div id="tabBtnLetters" data-lang="tabLetters" class="alpha-nav-btn" style="display: none;">📝 Листи</div>
                    <div id="tabBtnWinks" data-lang="tabWinks" class="alpha-nav-btn">😉 Вінки/Лайки</div>
                    <div id="tabBtnVip" data-lang="tabVip" class="alpha-nav-btn">🚨 VIP Радар</div>
                    <div id="tabBtnStats" data-lang="tabStats" class="alpha-nav-btn">📊 Статистика</div>
                </div>
            </div>

            <div class="alpha-content">
                <div class="alpha-topbar">
                    <div class="alpha-global-selector" id="alphaGlobalSelector">
                        <div class="alpha-gs-btn" id="alphaGsBtn">
                            <img src="https://via.placeholder.com/40" class="alpha-gs-avatar" id="alphaGsAvatar">
                            <div class="alpha-gs-info">
                                <div class="alpha-gs-name" id="alphaGsName">Оберіть анкету</div>
                                <div class="alpha-gs-id" id="alphaGsId">Для налаштування текстів</div>
                            </div>
                            <div class="alpha-gs-arrow" id="alphaGsArrow">▼</div>
                        </div>

                        <div class="alpha-gs-dropdown" id="alphaGsDropdown">
                            <div class="alpha-gs-search">
                                <input type="text" id="alphaGsSearchInput" placeholder="Пошук за ім'ям або ID...">
                            </div>
                            <div class="alpha-gs-list" id="alphaGsList">
                                </div>
                        </div>
                    </div>

                    <div class="alpha-status-badges">
                        <div><span data-lang="statusLabel">Бот:</span> <span id="uiStatusText" data-lang="statusWaiting" style="color: #666; font-weight: bold;">Очікування...</span></div>
                        <div style="width: 1px; background: #ccc; margin: 0 10px;"></div>
                        <div><span>В роботі:</span> <span id="uiCurrentProfile" style="color: #1976d2; font-weight: bold;">-</span></div>
                    </div>
                    <span id="uiCloseBtn" class="alpha-close">&times;</span>
                </div>

                <div class="alpha-tab-area">

                    <div id="tabContentSettings">
                        <label class="alpha-toggle-wrapper">
                            <div><div data-lang="useSiteToggleLabel" style="font-size: 14px; font-weight: bold; color: #333;">Інвайти/Листи з сендеру</div></div>
                            <div id="uiToggleTrack" class="alpha-toggle-track active">
                                <input type="checkbox" id="uiUseSiteToggle" checked style="display: none;">
                                <div id="uiToggleKnob" class="alpha-toggle-knob"></div>
                            </div>
                        </label>

                        <div class="alpha-row">
                            <div class="alpha-col">
                                <label data-lang="delayLabel" class="alpha-label">Затримка відправок (сек):</label>
                                <input type="number" id="uiDelay" class="alpha-input" value="4" min="1">
                            </div>
                            <div class="alpha-col">
                                <label data-lang="phaseDelayLabel" class="alpha-label">Пауза Інвайти/Листи (хв):</label>
                                <input type="number" id="uiPhaseDelay" class="alpha-input" value="2" min="0">
                            </div>
                            <div class="alpha-col">
                                <label data-lang="breakTimeLabel" class="alpha-label">Глобальна перерва (хв):</label>
                                <input type="number" id="uiBreakTime" class="alpha-input" value="10" min="5" max="60">
                            </div>
                        </div>

                        <div class="alpha-col" style="margin-bottom: 25px;">
                            <label data-lang="inviteModeLabel" class="alpha-label">Режим відправки інвайтів:</label>
                            <select id="uiInviteMode" class="alpha-select">
                                <option value="batch" data-lang="modeBatch">Усі разом</option>
                                <option value="loop" data-lang="modeLoop">По одному на коло</option>
                            </select>
                        </div>

                        <button id="uiStartBtn" data-lang="btnStart" class="alpha-btn-primary">▶ Почати розсилку</button>
                        <button id="uiStopBtn" data-lang="btnStop" class="alpha-btn-danger" style="display: none;">⏹ Зупинити</button>
                    </div>

                    <div id="tabContentInvites" style="display: none;">
                        <select id="invitesProfileSelect" style="display: none;"></select>
                        <div id="invitesWorkArea" style="display: none; flex-direction: column;">
                            <textarea id="invitesMessageInput" data-lang="invitesPlaceholder" class="alpha-textarea" placeholder="Текст інвайту..." style="margin-bottom: 15px;"></textarea>
                            <button id="invitesSaveBtn" data-lang="invitesSaveBtn" class="alpha-btn-success" style="margin-bottom: 20px;">💾 Зберегти Інвайт</button>
                            <div id="invitesSavedList" style="display: flex; flex-direction: column; max-height: 350px; overflow-y: auto;"></div>
                        </div>
                        <div id="invitesEmptyState" data-lang="invitesEmpty" style="text-align: center; color: #999; margin-top: 40px;">Оберіть анкету зверху, щоб додати інвайти</div>
                    </div>

                    <div id="tabContentLetters" style="display: none;">
                        <select id="lettersProfileSelect" style="display: none;"></select>
                        <div id="lettersWorkArea" style="display: none; flex-direction: column;">
                            <textarea id="lettersMessageInput" data-lang="lettersPlaceholder" class="alpha-textarea" placeholder="Текст листа..." style="margin-bottom: 15px;"></textarea>
                            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                                <button id="lettersGalleryBtn" style="width: 50px; border-radius: 6px; border: 1px solid #ccc; background: #f8f9fa; cursor: pointer; font-size: 20px; transition: .2s;">📷</button>
                                <button id="lettersSaveBtn" data-lang="lettersSaveBtn" class="alpha-btn-success">💾 Зберегти Лист</button>
                            </div>
                            <div id="lettersSavedList" style="display: flex; flex-direction: column; max-height: 300px; overflow-y: auto;"></div>
                        </div>
                        <div id="lettersEmptyState" data-lang="lettersEmpty" style="text-align: center; color: #999; margin-top: 40px;">Оберіть анкету зверху, щоб додати листи</div>
                    </div>

                    <div id="tabContentWinks" style="display: none; flex-direction: column; height: 100%;">
                        <select id="respProfileSelect" style="display: none;"></select>
                        <div id="respTabsArea" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
                            <div class="alpha-subtabs" style="margin-bottom: 0;">
                                <div id="respTabLike" data-lang="respTabLike" class="alpha-subtab active">Лайки</div>
                                <div id="respTabWink" data-lang="respTabWink" class="alpha-subtab">Вінки</div>
                            </div>

                            <div class="alpha-md-container">
                                <div class="alpha-wink-sidebar" id="winkSidebar">
                                    </div>

                                <div class="alpha-wink-content">
                                    <div class="alpha-row" style="margin-bottom: 15px;">
                                        <div class="alpha-col" style="flex: 2;">
                                            <textarea id="respMessageInput" data-lang="respPlaceholder" class="alpha-textarea" placeholder="Введіть текст відповіді..." style="height: 95px;"></textarea>
                                        </div>
                                        <div class="alpha-col" style="flex: 1; border-left: 1px solid #eee; padding-left: 15px;">
                                            <label data-lang="respSpeedLabel" class="alpha-label">Швидкість (сек):</label>
                                            <input type="number" id="respSpeedInput" class="alpha-input" value="3" min="0" max="10">
                                            <button id="respSaveBtn" data-lang="respSaveBtn" class="alpha-btn-success" style="margin-top: auto;">Зберегти текст</button>
                                        </div>
                                    </div>

                                    <div style="font-weight: bold; margin: 10px 0; font-size: 13px; color: #555;" id="respListTitle">Збережені лайки:</div>
                                    <div id="respSavedList" style="display: flex; flex-direction: column; flex: 1; overflow-y: auto; padding-right: 5px;"></div>
                                </div>
                            </div>
                        </div>
                        <div id="respEmptyState" data-lang="respEmpty" style="text-align: center; color: #999; margin-top: 40px;">Оберіть анкету зверху, щоб додати тексти</div>
                    </div>

                    <div id="tabContentVip" style="display: none;">
                        <div style="padding: 20px; background: #fff3e0; border: 1px solid #ffe0b2; border-radius: 8px; margin-bottom: 25px;">
                            <div data-lang="vipTitle" style="font-size: 15px; font-weight: bold; color: #e65100;">🚨 VIP Сповіщення</div>
                            <div data-lang="vipSub" style="font-size: 13px; color: #666; margin-top: 5px;">Сповіщення про вхід працюють завжди. Авто-вимкнення анкети можна налаштувати для кожного мужика окремо.</div>
                        </div>
                        <div id="vipRulesArea" style="display: flex; flex-direction: column;">
                            <div data-lang="vipRulesLabel" style="font-size: 13px; font-weight: bold; color: #666; margin-bottom: 10px;">Налаштовані правила (Мужик ➔ Анкета):</div>
                            <div id="vipRulesList" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 10px;"></div>
                            <button id="vipAddRuleBtn" data-lang="vipAddRuleBtn" style="padding: 14px; background: #f0f4f8; color: #1976d2; border: 1px dashed #1976d2; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 20px; transition: 0.2s;">➕ Додати мужика</button>
                        </div>
                    </div>

                    <div id="tabContentStats" style="display: none;">
                        <div class="alpha-row">
                            <div class="alpha-col" style="background: #fff3e0; padding: 25px; border-radius: 8px; border: 1px solid #ffe0b2; text-align: center;">
                                <div data-lang="statsInvitesLabel" style="font-size: 13px; color: #e65100; font-weight: bold; text-transform: uppercase;">Надіслано інвайтів</div>
                                <div id="uiStatsInvites" style="font-size: 36px; font-weight: bold; color: #f57c00; margin-top: 10px;">0</div>
                            </div>
                            <div class="alpha-col" style="background: #e8f5e9; padding: 25px; border-radius: 8px; border: 1px solid #c8e6c9; text-align: center;">
                                <div data-lang="statsLettersLabel" style="font-size: 13px; color: #1b5e20; font-weight: bold; text-transform: uppercase;">Надіслано листів</div>
                                <div id="uiStatsLetters" style="font-size: 36px; font-weight: bold; color: #2e7d32; margin-top: 10px;">0</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    // Створюємо приховану Галерею (як і було)
    const galleryModal = document.createElement("div");
    galleryModal.id = "alpha-gallery-modal";
    galleryModal.style.cssText = `position: fixed; top: 5%; left: 5%; width: 90vw; height: 90vh; background: rgba(255,255,255,0.98); z-index: 9999999; display: none; flex-direction: column; padding: 25px; box-sizing: border-box; border-radius: 12px; box-shadow: 0 15px 50px rgba(0,0,0,0.3);`;
    galleryModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h4 data-lang="galleryTitle" style="margin: 0; color: #1976d2; font-size: 22px;">Виберіть фото для листа</h4>
            <span id="closeGalleryBtn" style="cursor: pointer; font-size: 36px; color: #999; line-height: 1;">&times;</span>
        </div>
        <div id="galleryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; overflow-y: auto; flex-grow: 1; margin-bottom: 20px; align-content: start;"></div>
        <button id="confirmGalleryBtn" data-lang="galleryConfirmBtn" class="alpha-btn-success" style="font-size: 16px; padding: 15px;">Готово</button>
    `;

    overlay.appendChild(galleryModal);
    document.body.appendChild(overlay);

    // ==========================================
    // ЛОГІКА JAVASCRIPT ДЛЯ ІНТЕРФЕЙСУ
    // ==========================================

    // 1. Оновлена логіка вкладок (тепер працює через класи)
    const tabs = [
       { btn: document.getElementById("tabBtnSettings"), content: document.getElementById("tabContentSettings") },
       { btn: document.getElementById("tabBtnInvites"), content: document.getElementById("tabContentInvites") },
       { btn: document.getElementById("tabBtnLetters"), content: document.getElementById("tabContentLetters") },
       { btn: document.getElementById("tabBtnWinks"), content: document.getElementById("tabContentWinks") },
       { btn: document.getElementById("tabBtnVip"), content: document.getElementById("tabContentVip") },
       { btn: document.getElementById("tabBtnStats"), content: document.getElementById("tabContentStats") }
    ];

    function switchMainTab(activeTabBtn) {
       tabs.forEach((tab) => {
          tab.btn.classList.remove("active");
          tab.content.style.display = "none";
       });
       activeTabBtn.classList.add("active");
       const activeTab = tabs.find((t) => t.btn === activeTabBtn);

       if (activeTab) {
           // 🔥 Фікс: Для вінок повертаємо flex, для інших - стандартний block
           if (activeTab.content.id === "tabContentWinks") {
               activeTab.content.style.display = "flex";
           } else {
               activeTab.content.style.display = "block";
           }
       }
    }

    tabs[0].btn.onclick = () => switchMainTab(tabs[0].btn);
    tabs[1].btn.onclick = () => switchMainTab(tabs[1].btn);
    tabs[2].btn.onclick = () => switchMainTab(tabs[2].btn);
    tabs[3].btn.onclick = () => { switchMainTab(tabs[3].btn); if(typeof loadProfilesForUI === "function") loadProfilesForUI(); };
    tabs[4].btn.onclick = async () => {
        switchMainTab(tabs[4].btn);
        if(typeof loadProfilesForUI === "function") await loadProfilesForUI();
        if(typeof window.renderVipRules === "function") window.renderVipRules();
    };
    tabs[5].btn.onclick = () => switchMainTab(tabs[5].btn);

    // 2. Оновлена логіка ПОВЗУНКА (Тумблера)
    const toggleInput = document.getElementById("uiUseSiteToggle");
    const toggleTrack = document.getElementById("uiToggleTrack");

    function updateToggleVisuals(isSite) {
       if (isSite) {
          toggleTrack.classList.add("active");
          tabs[1].btn.style.display = "none";
          tabs[2].btn.style.display = "none";
          if (tabs[1].content.style.display === "block" || tabs[2].content.style.display === "block") {
             switchMainTab(tabs[0].btn);
          }
       } else {
          toggleTrack.classList.remove("active");
          tabs[1].btn.style.display = "flex"; // Важливо: flex для сайдбару
          tabs[2].btn.style.display = "flex";
          if (typeof loadProfilesForUI === "function") loadProfilesForUI();
       }
    }

    const savedUseSite = localStorage.getItem("alphaUseSiteTemplates");
    if (savedUseSite === "false") {
       toggleInput.checked = false;
       updateToggleVisuals(false);
    }

    toggleInput.onchange = (e) => {
       const isChecked = e.target.checked;
       localStorage.setItem("alphaUseSiteTemplates", isChecked);
       updateToggleVisuals(isChecked);
    };

    // ==========================================
    // ВІДНОВЛЕНІ ОБРОБНИКИ ПОДІЙ (ЯКІ БУЛИ ПРОПУЩЕНІ)
    // ==========================================

    // --- Логіка галереї (Відкрити/Закрити) ---
    const galleryBtn = document.getElementById("lettersGalleryBtn");
    if(galleryBtn) galleryBtn.onclick = () => (galleryModal.style.display = "flex");
    const closeGal = document.getElementById("closeGalleryBtn");
    if(closeGal) closeGal.onclick = () => (galleryModal.style.display = "none");
    const confGal = document.getElementById("confirmGalleryBtn");
    if(confGal) confGal.onclick = () => (galleryModal.style.display = "none");

    // --- Логіка Вінки/Лайки (Master-Detail) ---

    // Функція малювання бокової панелі з бейджами
    window.renderWinkSidebar = function() {
        const sidebar = document.getElementById("winkSidebar");
        if(!sidebar) return;
        sidebar.innerHTML = "";

        if(!currentSelectedProfile) return;

        const customKey = `resp_${currentSelectedProfile}_wink_custom`;
        const defKey = `resp_${currentSelectedProfile}_wink`;
        const customWinks = JSON.parse(localStorage.getItem(customKey) || "{}");
        const defWinks = JSON.parse(localStorage.getItem(defKey) || "[]");

        winkPhrases.forEach(wp => {
            const count = wp.id === "default" ? defWinks.length : (customWinks[wp.id] ? customWinks[wp.id].length : 0);

            const item = document.createElement("div");
            item.className = `alpha-wp-item ${currentWinkPhrase === wp.id ? 'active' : ''}`;
            item.innerHTML = `
                <div class="alpha-wp-text">${wp.text}</div>
                <div class="alpha-wp-badge ${count > 0 ? 'has-items' : ''}">${count}</div>
            `;
            item.onclick = () => {
                currentWinkPhrase = wp.id;
                window.renderWinkSidebar(); // Оновлюємо підсвітку
                renderSavedMessages();      // Оновлюємо тексти справа
            };
            sidebar.appendChild(item);
        });
    };

    // Перемикання вкладок
    const tabLike = document.getElementById("respTabLike");
    const tabWink = document.getElementById("respTabWink");
    const winkSidebar = document.getElementById("winkSidebar");

    if(tabLike && tabWink) {
        tabLike.onclick = () => {
            currentSelectedTab = "like";
            tabLike.classList.add("active");
            tabWink.classList.remove("active");
            winkSidebar.style.display = "none"; // Ховаємо фрази
            if(typeof renderSavedMessages === "function") renderSavedMessages();
        };

        tabWink.onclick = () => {
            currentSelectedTab = "wink";
            currentWinkPhrase = "default"; // Скидаємо на стандартну при переході
            tabWink.classList.add("active");
            tabLike.classList.remove("active");
            winkSidebar.style.display = "flex"; // Показуємо фрази
            window.renderWinkSidebar();
            if(typeof renderSavedMessages === "function") renderSavedMessages();
        };
    }

    const respProfSel = document.getElementById("respProfileSelect");
    if (respProfSel) {
        respProfSel.addEventListener("change", (e) => {
            currentSelectedProfile = e.target.value;
            if (currentSelectedProfile) {
                document.getElementById("respTabsArea").style.display = "flex";
                document.getElementById("respEmptyState").style.display = "none";
                if(currentSelectedTab === "wink") window.renderWinkSidebar();
                if(typeof renderSavedMessages === "function") renderSavedMessages();
            } else {
                document.getElementById("respTabsArea").style.display = "none";
                document.getElementById("respEmptyState").style.display = "block";
            }
        });
    }

    // Збереження тексту
    const respSave = document.getElementById("respSaveBtn");
    if(respSave) {
        respSave.onclick = () => {
            const text = document.getElementById("respMessageInput").value.trim();
            if (!text || !currentSelectedProfile) return;

            if (currentSelectedTab === "wink" && currentWinkPhrase !== "default") {
                const key = `resp_${currentSelectedProfile}_wink_custom`;
                let savedObj = JSON.parse(localStorage.getItem(key) || "{}");
                if (!savedObj[currentWinkPhrase]) savedObj[currentWinkPhrase] = [];
                savedObj[currentWinkPhrase].push(text);
                localStorage.setItem(key, JSON.stringify(savedObj));
            } else {
                const key = `resp_${currentSelectedProfile}_${currentSelectedTab}`;
                let saved = JSON.parse(localStorage.getItem(key) || "[]");
                saved.push(text);
                localStorage.setItem(key, JSON.stringify(saved));
            }

            document.getElementById("respMessageInput").value = "";
            if(currentSelectedTab === "wink") window.renderWinkSidebar();
            if(typeof renderSavedMessages === "function") renderSavedMessages();
        };
    }

    // --- Логіка ІНВАЙТІВ ---
    const invProfSel = document.getElementById("invitesProfileSelect");
    if (invProfSel) {
        invProfSel.addEventListener("change", (e) => {
            if (e.target.value) {
                document.getElementById("invitesWorkArea").style.display = "flex";
                document.getElementById("invitesEmptyState").style.display = "none";
                if(typeof renderCustomInvites === "function") renderCustomInvites();
            } else {
                document.getElementById("invitesWorkArea").style.display = "none";
                document.getElementById("invitesEmptyState").style.display = "block";
            }
        });
    }

    const invSave = document.getElementById("invitesSaveBtn");
    if (invSave) {
        invSave.onclick = () => {
            const text = document.getElementById("invitesMessageInput").value.trim();
            const profileId = document.getElementById("invitesProfileSelect").value;
            if (!text || !profileId) return;
            const key = `alpha_invites_${profileId}`;
            let saved = JSON.parse(localStorage.getItem(key) || "[]");
            saved.push({ message_content: text, message_type: "SENT_TEXT" });
            localStorage.setItem(key, JSON.stringify(saved));
            document.getElementById("invitesMessageInput").value = "";
            if(typeof renderCustomInvites === "function") renderCustomInvites();
        };
    }

    // --- Логіка ЛИСТІВ ---
    const letProfSel = document.getElementById("lettersProfileSelect");
    if(letProfSel) {
        letProfSel.addEventListener("change", async (e) => {
            const profileId = e.target.value;
            if (profileId) {
                document.getElementById("lettersWorkArea").style.display = "flex";
                document.getElementById("lettersEmptyState").style.display = "none";
                const galleryGrid = document.getElementById("galleryGrid");
                galleryGrid.innerHTML = '<span style="color: #666; font-size: 12px; grid-column: 1 / -1; text-align: center;">Завантаження фото...</span>';
                let token = localStorage.getItem("token");
                if (token) {
                    token = token.replace(/^"|"$/g, "");
                    const imageMap = await getProfileGallery(token, profileId);
                    galleryGrid.innerHTML = "";
                    window.selectedCustomImages = [];
                    document.getElementById("lettersGalleryBtn").innerHTML = "📷";
                    if (Object.keys(imageMap).length === 0) {
                        galleryGrid.innerHTML = '<span style="color: #999; font-size: 12px; grid-column: 1 / -1; text-align: center;">У цієї анкети немає фото.</span>';
                    } else {
                        for (const [link, id] of Object.entries(imageMap)) {
                            const img = document.createElement("img");
                            img.src = link;
                            img.dataset.id = id;
                            img.style.cssText = `width: 100%; height: 80px; object-fit: cover; border-radius: 5px; cursor: pointer; border: 3px solid transparent; transition: .2s; box-sizing: border-box;`;
                            img.onclick = () => {
                                const idx = window.selectedCustomImages.findIndex((imgObj) => imgObj.id === id);
                                if (idx > -1) {
                                    window.selectedCustomImages.splice(idx, 1);
                                    img.style.borderColor = "transparent";
                                    img.style.opacity = "1";
                                } else {
                                    window.selectedCustomImages.push({ id: id, link: link });
                                    img.style.borderColor = "#4caf50";
                                    img.style.opacity = "0.8";
                                }
                                const btn = document.getElementById("lettersGalleryBtn");
                                const count = window.selectedCustomImages.length;
                                btn.style.position = "relative";
                                btn.innerHTML = count > 0 ? `📷<span style="position: absolute; top: -5px; right: -5px; background: #f44336; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">${count}</span>` : "📷";
                            };
                            galleryGrid.appendChild(img);
                        }
                    }
                    if(typeof renderCustomLetters === "function") renderCustomLetters();
                }
            } else {
                document.getElementById("lettersWorkArea").style.display = "none";
                document.getElementById("lettersEmptyState").style.display = "block";
            }
        });
    }

    const letSave = document.getElementById("lettersSaveBtn");
    if(letSave) {
        letSave.onclick = () => {
            const text = document.getElementById("lettersMessageInput").value.trim();
            const profileId = document.getElementById("lettersProfileSelect").value;
            if (!text || !profileId) return;
            const key = `alpha_letters_${profileId}`;
            let saved = JSON.parse(localStorage.getItem(key) || "[]");
            const attachments = window.selectedCustomImages ? [...window.selectedCustomImages] : [];
            saved.push({ message_content: text, message_type: "SENT_TEXT", attachments: attachments });
            localStorage.setItem(key, JSON.stringify(saved));
            document.getElementById("lettersMessageInput").value = "";
            window.selectedCustomImages = [];
            document.getElementById("lettersGalleryBtn").innerHTML = "📷";
            const galleryGrid = document.getElementById("galleryGrid");
            if (galleryGrid) {
                const imgs = galleryGrid.getElementsByTagName("img");
                for (let img of imgs) {
                    img.style.borderColor = "transparent";
                    img.style.opacity = "1";
                }
            }
            if (typeof renderCustomLetters === "function") renderCustomLetters();
        };
    }

    // --- Логіка VIP РАДАРУ ---
    const vipAddBtn = document.getElementById("vipAddRuleBtn");
    if (vipAddBtn) {
        vipAddBtn.onclick = () => {
            let rules = JSON.parse(localStorage.getItem("alphaVipRules") || "[]");
            rules.push({ vip_id: "", profile_id: "", auto_disable: false });
            localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            if(typeof window.renderVipRules === "function") window.renderVipRules();
        };
    }

    window.renderVipRules = function() {
        const vipRulesList = document.getElementById("vipRulesList");
        if(!vipRulesList) return;
        vipRulesList.innerHTML = "";
        let rules = JSON.parse(localStorage.getItem("alphaVipRules") || "[]");

        if (rules.length === 0) {
            vipRulesList.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block;">' + t("dynNoRules") + '</span>';
            return;
        }

        const profileOptionsHtml = document.getElementById("respProfileSelect").innerHTML || '<option value="">' + t("dynSelectProfile") + '</option>';

        rules.forEach((rule, index) => {
            const container = document.createElement("div");
            container.style.cssText = `display: flex; flex-direction: column; gap: 8px; background: #f9f9f9; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px;`;

            const topRow = document.createElement("div");
            topRow.style.cssText = `display: flex; gap: 10px; align-items: center;`;

            const inputVip = document.createElement("input");
            inputVip.type = "text";
            inputVip.placeholder = "ID мужика";
            inputVip.value = rule.vip_id || "";
            inputVip.className = "alpha-input";
            inputVip.style.cssText = `width: 90px; padding: 6px; font-size: 12px;`;
            inputVip.oninput = (e) => {
                rules[index].vip_id = e.target.value.trim();
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            };

            const arrow = document.createElement("span");
            arrow.innerHTML = "➔";
            arrow.style.color = "#999";

            const selectProfile = document.createElement("select");
            selectProfile.innerHTML = profileOptionsHtml;
            selectProfile.value = rule.profile_id || "";
            selectProfile.className = "alpha-select";
            selectProfile.style.cssText = `flex: 1; padding: 6px; font-size: 12px;`;
            selectProfile.onchange = (e) => {
                rules[index].profile_id = e.target.value;
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            };

            const delBtn = document.createElement("span");
            delBtn.innerHTML = "❌";
            delBtn.style.cssText = `cursor: pointer; font-size: 14px; margin-left: 5px;`;
            delBtn.onclick = () => {
                rules.splice(index, 1);
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
                window.renderVipRules();
            };

            topRow.appendChild(inputVip);
            topRow.appendChild(arrow);
            topRow.appendChild(selectProfile);
            topRow.appendChild(delBtn);

            const bottomRow = document.createElement("label");
            bottomRow.style.cssText = `display: flex; align-items: center; gap: 5px; font-size: 11px; color: #555; cursor: pointer;`;

            const autoDisableCheckbox = document.createElement("input");
            autoDisableCheckbox.type = "checkbox";
            autoDisableCheckbox.checked = rule.auto_disable === true;
            autoDisableCheckbox.onchange = (e) => {
                rules[index].auto_disable = e.target.checked;
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            };

            bottomRow.appendChild(autoDisableCheckbox);
            bottomRow.appendChild(document.createTextNode(t("dynAutoDisable")));

            container.appendChild(topRow);
            container.appendChild(bottomRow);
            vipRulesList.appendChild(container);
        });
    };

    // --- ГЛОБАЛЬНИЙ СЕЛЕКТОР АНКЕТ: Анімація відкриття ---
    const gsBtn = document.getElementById("alphaGsBtn");
    if (gsBtn) {
        gsBtn.onclick = () => {
            const dp = document.getElementById("alphaGsDropdown");
            const arr = document.getElementById("alphaGsArrow");
            const searchInput = document.getElementById("alphaGsSearchInput");
            if (dp.style.display === "flex") {
                dp.style.display = "none";
                arr.style.transform = "rotate(0deg)";
            } else {
                dp.style.display = "flex";
                arr.style.transform = "rotate(180deg)";
                if (searchInput) searchInput.focus();
            }
        };
    }

    document.addEventListener("click", (e) => {
        const selectorBlock = document.getElementById("alphaGlobalSelector");
        if (selectorBlock && !selectorBlock.contains(e.target)) {
            const dp = document.getElementById("alphaGsDropdown");
            const arr = document.getElementById("alphaGsArrow");
            if (dp && dp.style.display === "flex") {
                dp.style.display = "none";
                if(arr) arr.style.transform = "rotate(0deg)";
            }
        }
    });

    // ==========================================
    // ЛОГІКА МУЛЬТИМОВНОСТІ
    // ==========================================
    const langUaBtn = document.getElementById("langUaBtn");
    const langRuBtn = document.getElementById("langRuBtn");

    function applyTranslations(lang) {
        localStorage.setItem("alphaLang", lang);

        langUaBtn.style.opacity = lang === "ua" ? "1" : "0.4";
        langRuBtn.style.opacity = lang === "ru" ? "1" : "0.4";

        document.querySelectorAll("[data-lang]").forEach(el => {
            const key = el.getAttribute("data-lang");
            if (alphaDict[lang] && alphaDict[lang][key]) {
                if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                    el.placeholder = alphaDict[lang][key];
                } else {
                    el.innerText = alphaDict[lang][key];
                }
            }
        });
    }

    langUaBtn.onclick = () => applyTranslations("ua");
    langRuBtn.onclick = () => applyTranslations("ru");

    // Відновлюємо мову відразу при відкритті
    applyTranslations(localStorage.getItem("alphaLang") || "ua");

	document.getElementById("uiCloseBtn").onclick = () => (overlay.style.display = "none");

	document.getElementById("uiStartBtn").onclick = () => {
		if (isRunning) return;

		isRunning = true;

		const delay = parseInt(document.getElementById("uiDelay").value);
		const phaseDelay = parseInt(document.getElementById("uiPhaseDelay").value);
		const breakTime = parseInt(document.getElementById("uiBreakTime").value);
		const inviteMode = document.getElementById("uiInviteMode") ? document.getElementById("uiInviteMode").value : "batch";
		localStorage.setItem("alphaBotSettings", JSON.stringify({ delay, phaseDelay, breakTime, inviteMode }));
		localStorage.setItem("alphaBotState", "running");
		document.getElementById("uiStartBtn").style.display = "none";
		document.getElementById("uiStopBtn").style.display = "block";
		updatePopup("Запуск...", false);
		startSendingProcess();
	};

	document.getElementById("uiStopBtn").onclick = () => {
		isRunning = false;
		clearInterval(botLoopTimer);
		localStorage.setItem("alphaBotState", "stopped");
		updatePopup("Зупинено", true, "-");
	};

	checkBotMemory();
	loadDailyStats();
	loadProfilesForUI();
}

// ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ АВТОВІДПОВІДАЧА

async function loadProfilesForUI() {
    if (window.profilesLoadedForUI) return; // Завантажуємо лише один раз

    let token = localStorage.getItem("token");
    if (!token) return;
    token = token.replace(/^"|"$/g, "");

    const profiles = await getAllProfiles(token);

    const listEl = document.getElementById("alphaGsList");
    const searchInput = document.getElementById("alphaGsSearchInput");
    if (!listEl) return;

    listEl.innerHTML = "";

    // 1. Заповнюємо невидимі оригінальні селектори (для підкапотної логіки)
    const respSel = document.getElementById("respProfileSelect");
    const invSel = document.getElementById("invitesProfileSelect");
    const letSel = document.getElementById("lettersProfileSelect");

    [respSel, invSel, letSel].forEach(sel => {
        if(sel) {
            sel.innerHTML = '<option value="">--</option>';
            profiles.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.external_id;
                opt.innerText = p.name;
                sel.appendChild(opt);
            });
        }
    });

    // 2. Будуємо КРАСИВИЙ список з фотографіями та статусом Онлайн/Офлайн
    profiles.forEach(p => {
        const item = document.createElement("div");
        item.className = "alpha-gs-item";
        item.dataset.id = String(p.external_id);
        item.dataset.name = p.name.toLowerCase();

        const photoUrl = p.photo_link || "https://via.placeholder.com/40";
        const ageText = p.age ? `(${p.age} р.)` : "";

        // Визначаємо статус
        const isOnline = p.online === 1;
        const statusColor = isOnline ? "#4caf50" : "#999"; // Зелений або Сірий
        const statusText = isOnline ? "Онлайн" : "Офлайн";
        const opacity = isOnline ? "1" : "0.6"; // Офлайн анкети робимо напівпрозорими

        item.innerHTML = `
            <div style="position: relative; flex-shrink: 0;">
                <img src="${photoUrl}" class="alpha-gs-item-img" style="opacity: ${opacity};">
                <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: ${statusColor}; border: 2px solid #fff; border-radius: 50%;"></span>
            </div>
            <div class="alpha-gs-info" style="opacity: ${opacity};">
                <div class="alpha-gs-name">${p.name} <span style="color:#aaa; font-size:11px; font-weight:normal;">${ageText}</span></div>
                <div class="alpha-gs-id">ID: ${p.external_id} <span style="color:${statusColor}; font-weight:bold; margin-left:5px; font-size: 10px;">• ${statusText}</span></div>
            </div>
        `;

        // ЛОГІКА КЛІКУ ПО АНКЕТІ
        item.onclick = () => {
            // Оновлюємо візуал Головної Кнопки
            document.getElementById("alphaGsAvatar").src = photoUrl;
            document.getElementById("alphaGsName").innerText = p.name;
            document.getElementById("alphaGsId").innerText = `ID: ${p.external_id}`;

            // Ховаємо меню
            document.getElementById("alphaGsDropdown").style.display = "none";
            document.getElementById("alphaGsArrow").style.transform = "rotate(0deg)";

            // Підсвічуємо активну
            document.querySelectorAll(".alpha-gs-item").forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            // Програмно перемикаємо всі старі приховані селектори
            [respSel, invSel, letSel].forEach(sel => {
                if(sel && sel.value !== String(p.external_id)) {
                    sel.value = p.external_id;
                    sel.dispatchEvent(new Event("change"));
                }
            });
        };

        listEl.appendChild(item);
    });

    // 3. Логіка Пошуку (Фільтрація на льоту)
    if (searchInput) {
        searchInput.oninput = (e) => {
            const val = e.target.value.toLowerCase().trim();
            document.querySelectorAll(".alpha-gs-item").forEach(item => {
                const name = item.dataset.name;
                const id = item.dataset.id;
                if (name.includes(val) || id.includes(val)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        };
    }

    window.profilesLoadedForUI = true;
    if (typeof updateProfileColors === "function") updateProfileColors();
}

// --- МАЛЮЄМО КНОПКУ ПОШУКУ ТА ВІШАЄМО КЛІК ---
function injectSearchButton() {
    const chatHeaders = document.querySelectorAll('.styles_chat_head__ao7Ds');

    chatHeaders.forEach(header => {
        if (header.querySelector('.alpha-search-mockup')) return;

        const middleBlock = header.querySelector('.styles_chat_head_middle__D14pE');
        if (!middleBlock) return;

        const searchContainer = document.createElement('div');
        searchContainer.className = 'alpha-search-mockup';

        // Внутрішня структура з прогрес-баром (зелений фон, який буде рости)
        searchContainer.innerHTML = `
            <div class="alpha-progress-fill" style="position: absolute; top: 0; left: 0; height: 100%; width: 0%; background: #e3f2fd; border-radius: 6px; transition: width 0.3s ease; z-index: 0;"></div>
            <img src="https://cdn-icons-png.flaticon.com/512/751/751463.png" alt="search" style="width: 13px; height: 13px; margin-right: 6px; opacity: 0.5; position: relative; z-index: 1;">
            <span class="alpha-search-text" style="font-size: 13px; color: #555; position: relative; z-index: 1;">Завантажити історію</span>
        `;

        Object.assign(searchContainer.style, {
            display: 'flex', alignItems: 'center', alignSelf: 'center', position: 'relative',
            margin: '0 15px', padding: '5px 8px', overflow: 'hidden',
            backgroundColor: '#ffffff', borderRadius: '6px',
            border: '1px solid #e2e2e2', cursor: 'pointer', transition: 'all 0.2s ease'
        });

        // Стан нашої кнопки
        let isLoaded = false;
        let isLoading = false;

        searchContainer.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            const match = window.location.href.match(/\/(chat|letter)\/([a-z0-9\-]+)/);
            const currentChatId = match ? match[2] : null;
            const currentChatId = match ? match[1] : null;

            if (!currentChatId || !window.alphaSmartSearch) return;

            const textSpan = searchContainer.querySelector('.alpha-search-text');
            const progressFill = searchContainer.querySelector('.alpha-progress-fill');

            // Якщо ми вже завантажили історію САМЕ ДЛЯ ЦЬОГО чату — просто показуємо вікно
            if (isLoaded && window.alphaSmartSearch.chatId === currentChatId) {
                window.alphaSmartSearch.modal.style.display = "flex";
                return;
            }

            // Якщо це перший клік або ми перейшли в інший чат — запускаємо нашу "дверну ручку"
            window.alphaSmartSearch.openWithContext(currentChatId, token, 'chat');

            // Миттєво міняємо дизайн кнопки на "активний"
            isLoaded = true;
            textSpan.innerText = "Відкрити пошук";
            textSpan.style.color = "#1976d2";
            textSpan.style.fontWeight = "bold";
            progressFill.style.background = "#bbdefb";
            progressFill.style.width = "100%";
        });

        middleBlock.insertAdjacentElement('afterend', searchContainer);
    });
}

setInterval(injectSearchButton, 2000);

// Заміни початок функції renderSavedMessages на це:
function renderSavedMessages() {
    if (!currentSelectedProfile) return;
    const listEl = document.getElementById("respSavedList");
    if(!listEl) return;
    listEl.innerHTML = "";

    let saved = [];
    let isCustomWink = false;
    let storageKey = "";

    if (currentSelectedTab === "wink" && currentWinkPhrase !== "default") {
        isCustomWink = true;
        storageKey = `resp_${currentSelectedProfile}_wink_custom`;
        const customObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
        saved = customObj[currentWinkPhrase] || [];
        document.getElementById("respListTitle").innerText = `Відповіді на: ${currentWinkPhrase}`;
    } else {
        storageKey = `resp_${currentSelectedProfile}_${currentSelectedTab}`;
        saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        document.getElementById("respListTitle").innerText = currentSelectedTab === "like" ? "Збережені відповіді на Лайки:" : "Стандартні відповіді (Вінки):";
    }

    if (saved.length === 0) {
       listEl.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block; margin-top: 10px;">Ще немає відповідей</span>';
       return;
    }

    saved.forEach((text, index) => {
       const item = document.createElement("div");
       item.style.cssText = `background: #f9f9f9; border: 1px solid #e0e0e0; padding: 8px 12px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;`;

       const textSpan = document.createElement("span");
       textSpan.innerText = text;
       textSpan.style.cssText = `font-size: 12px; color: #333; flex: 1; word-break: break-word;`;

       const delBtn = document.createElement("span");
       delBtn.innerHTML = "❌";
       delBtn.style.cssText = `cursor: pointer; font-size: 12px; margin-left: 10px; opacity: 0.7; transition: 0.2s;`;

       delBtn.onclick = () => {
          if (isCustomWink) {
              const obj = JSON.parse(localStorage.getItem(storageKey) || "{}");
              if (obj[currentWinkPhrase]) {
                  obj[currentWinkPhrase].splice(index, 1);
                  localStorage.setItem(storageKey, JSON.stringify(obj));
              }
          } else {
              const arr = JSON.parse(localStorage.getItem(storageKey) || "[]");
              arr.splice(index, 1);
              localStorage.setItem(storageKey, JSON.stringify(arr));
          }
          if(currentSelectedTab === "wink") window.renderWinkSidebar();
          renderSavedMessages();
       };

       item.appendChild(textSpan);
       item.appendChild(delBtn);
       listEl.appendChild(item);
    });

    if(typeof updateProfileColors === "function") updateProfileColors();
}

// --- ВІДОБРАЖЕННЯ КАСТОМНИХ ІНВАЙТІВ ---

function renderCustomInvites() {
	const profileId = document.getElementById("invitesProfileSelect").value;

	const listEl = document.getElementById("invitesSavedList");

	listEl.innerHTML = "";

	if (!profileId) return;

	const key = `alpha_invites_${profileId}`;

	let saved = JSON.parse(localStorage.getItem(key) || "[]");

	if (saved.length === 0) {
		listEl.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block;">' + t("dynNoInvites") + '</span>';

		return;
	}

	saved.forEach((item, index) => {
		const div = document.createElement("div");

		div.style.cssText = `background: #f9f9f9; border: 1px solid #e0e0e0; padding: 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;`;

		// Додаємо нумерацію для наочності

		const textSpan = document.createElement("span");

		textSpan.innerText = `${index + 1}. ${item.message_content}`;

		textSpan.style.cssText = `font-size: 12px; color: #333; flex: 1; word-break: break-word;`;

		// Контейнер для кнопок управління

		const controlsDiv = document.createElement("div");

		controlsDiv.style.cssText = `display: flex; align-items: center; gap: 8px; margin-left: 10px;`;

		// Кнопка ВГОРУ (не показуємо для першого елемента)

		if (index > 0) {
			const upBtn = document.createElement("span");

			upBtn.innerHTML = "↑";

			upBtn.style.cssText = `color: #1976d2; cursor: pointer; font-size: 16px; font-weight: bold; padding: 0 4px;`;

			upBtn.onclick = () => {
				// Міняємо місцями поточний і попередній

				[saved[index - 1], saved[index]] = [saved[index], saved[index - 1]];

				localStorage.setItem(key, JSON.stringify(saved));

				renderCustomInvites();
			};

			controlsDiv.appendChild(upBtn);
		}

		// Кнопка ВНИЗ (не показуємо для останнього елемента)

		if (index < saved.length - 1) {
			const downBtn = document.createElement("span");

			downBtn.innerHTML = "↓";

			downBtn.style.cssText = `color: #1976d2; cursor: pointer; font-size: 16px; font-weight: bold; padding: 0 4px;`;

			downBtn.onclick = () => {
				// Міняємо місцями поточний і наступний

				[saved[index], saved[index + 1]] = [saved[index + 1], saved[index]];

				localStorage.setItem(key, JSON.stringify(saved));

				renderCustomInvites();
			};

			controlsDiv.appendChild(downBtn);
		}

		// Кнопка ВИДАЛИТИ

		const delBtn = document.createElement("span");

		delBtn.innerHTML = "&times;";

		delBtn.style.cssText = `color: #d32f2f; cursor: pointer; font-size: 18px; font-weight: bold; margin-left: 4px; line-height: 1;`;

		delBtn.onclick = () => {
			saved.splice(index, 1);

			localStorage.setItem(key, JSON.stringify(saved));

			renderCustomInvites();
		};

		controlsDiv.appendChild(delBtn);

		div.appendChild(textSpan);

		div.appendChild(controlsDiv);

		listEl.appendChild(div);
	});

	if (typeof updateProfileColors === "function") updateProfileColors();
}

// --- ВІДОБРАЖЕННЯ КАСТОМНИХ ЛИСТІВ ---

function renderCustomLetters() {
	const profileId = document.getElementById("lettersProfileSelect").value;

	const listEl = document.getElementById("lettersSavedList");

	listEl.innerHTML = "";

	if (!profileId) return;

	const key = `alpha_letters_${profileId}`;

	let saved = JSON.parse(localStorage.getItem(key) || "[]");

	if (saved.length === 0) {
		listEl.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block;">' + t("dynNoLetters") + '</span>';

		return;
	}

	saved.forEach((item, index) => {
		const div = document.createElement("div");

		div.style.cssText = `background: #f9f9f9; border: 1px solid #e0e0e0; padding: 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: flex-start;`;

		const contentDiv = document.createElement("div");

		contentDiv.style.cssText = `display: flex; flex-direction: column; flex: 1;`;

		const textSpan = document.createElement("span");

		textSpan.innerText = item.message_content;

		textSpan.style.cssText = `font-size: 12px; color: #333; word-break: break-word; margin-bottom: 4px;`;

		contentDiv.appendChild(textSpan);

		// Якщо є фотографії, додаємо красиву примітку

		if (item.attachments && item.attachments.length > 0) {
			const attSpan = document.createElement("span");

			attSpan.innerText = `📎 Прикріплено фото (${item.attachments.length})`;

			attSpan.style.cssText = `font-size: 10px; color: #1976d2; font-weight: bold;`;

			contentDiv.appendChild(attSpan);
		}

		const delBtn = document.createElement("span");

		delBtn.innerHTML = "&times;";

		delBtn.style.cssText = `color: #d32f2f; cursor: pointer; font-size: 18px; font-weight: bold; margin-left: 10px; line-height: 1;`;

		delBtn.onclick = () => {
			saved.splice(index, 1);

			localStorage.setItem(key, JSON.stringify(saved));

			renderCustomLetters();
		};

		div.appendChild(contentDiv);

		div.appendChild(delBtn);

		listEl.appendChild(div);
	});

	updateProfileColors();
}

// ==========================================

// КОЛЬОРОВЕ МАРКУВАННЯ АНКЕТ

// ==========================================

function updateProfileColors() {
	// 1. Інвайти (Зелений, якщо є)

	const invSelect = document.getElementById("invitesProfileSelect");

	if (invSelect) {
		Array.from(invSelect.options).forEach((opt) => {
			if (!opt.value) return;

			const saved = JSON.parse(localStorage.getItem(`alpha_invites_${opt.value}`) || "[]");

			opt.style.color = saved.length > 0 ? "#4caf50" : "#000";

			opt.style.fontWeight = saved.length > 0 ? "bold" : "normal";
		});
	}

	// 2. Листи (Зелений, якщо є)

	const letSelect = document.getElementById("lettersProfileSelect");

	if (letSelect) {
		Array.from(letSelect.options).forEach((opt) => {
			if (!opt.value) return;

			const saved = JSON.parse(localStorage.getItem(`alpha_letters_${opt.value}`) || "[]");

			opt.style.color = saved.length > 0 ? "#4caf50" : "#000";

			opt.style.fontWeight = saved.length > 0 ? "bold" : "normal";
		});
	}

	// 3. Вінки/Лайки (Зелений = обидва, Жовтий = одне)

	const respSelect = document.getElementById("respProfileSelect");

	if (respSelect) {
		Array.from(respSelect.options).forEach((opt) => {
			if (!opt.value) return;

			const likes = JSON.parse(localStorage.getItem(`resp_${opt.value}_like`) || "[]");

			const winks = JSON.parse(localStorage.getItem(`resp_${opt.value}_wink`) || "[]");

			if (likes.length > 0 && winks.length > 0) {
				opt.style.color = "#4caf50"; // Зелений

				opt.style.fontWeight = "bold";
			} else if (likes.length > 0 || winks.length > 0) {
				opt.style.color = "#ff9800"; // Жовтий

				opt.style.fontWeight = "bold";
			} else {
				opt.style.color = "#000";

				opt.style.fontWeight = "normal";
			}
		});
	}
}

// ==========================================

// ПАМ'ЯТЬ БОТА (ВІДНОВЛЕННЯ ПІСЛЯ F5)

// ==========================================

function checkBotMemory() {
	const state = localStorage.getItem("alphaBotState");

	if (state === "running" || state === "waiting") {
		const settings = JSON.parse(localStorage.getItem("alphaBotSettings") || "{}");

		if (settings.delay !== undefined) {
			document.getElementById("uiDelay").value = settings.delay;

			// 🔥 ВИПРАВЛЕНО БАГ З НУЛЕМ: Тепер 0 це повноцінна цифра, а не порожнеча

			document.getElementById("uiPhaseDelay").value = settings.phaseDelay !== undefined ? settings.phaseDelay : 2;

			document.getElementById("uiBreakTime").value = settings.breakTime || 10;

			const modeEl = document.getElementById("uiInviteMode");

			if (modeEl && settings.inviteMode) modeEl.value = settings.inviteMode;
		}

		document.getElementById("uiStartBtn").style.display = "none";

		document.getElementById("uiStopBtn").style.display = "block";

		isRunning = true;

		if (state === "waiting") {
			const resumeTime = parseInt(localStorage.getItem("alphaBotResumeTime") || "0");

			if (Date.now() >= resumeTime) {
				localStorage.setItem("alphaBotState", "running");

				startSendingProcess();
			} else {
				startWaitCountdown(resumeTime);
			}
		} else {
			startSendingProcess();
		}
	}
}

// ==========================================

// ІНТЕГРАЦІЯ В МЕНЮ САЙТУ (АЛГОРИТМ ШПИГУНА)

// ==========================================

function injectMenuButton() {
	const menuList = document.querySelector('[data-testid="bottom-menu-list"]');

	if (menuList && !document.getElementById("alpha-sender-menu-btn")) {
		const settingBtn = document.createElement("div");

		settingBtn.id = "alpha-sender-menu-btn";

		const firstItem = menuList.querySelector("div");

		settingBtn.className = firstItem ? firstItem.className.split(" ")[0] : "BottomMenu_clmn_1_bottom_menu_item__4xtik";

		settingBtn.innerText = "⚙  Setting";

		settingBtn.style.cursor = "pointer";

		settingBtn.onclick = () => {
			const overlay = document.getElementById("alpha-sender-overlay");

			if (overlay) overlay.style.display = "flex";
		};

		menuList.appendChild(settingBtn);
	}
}

injectBotUI();

setInterval(injectMenuButton, 500);

// Функція для малювання нативного пуш-повідомлення VIP Радару

function showVipNotification(name, id) {
	const popup = document.createElement("div");

	popup.style.cssText = `

position: fixed; bottom: 30px; right: 30px; background: #ffffff;

border-left: 5px solid #ff9800; box-shadow: 0 5px 15px rgba(0,0,0,0.2);

padding: 15px 20px; border-radius: 8px; z-index: 9999999;

font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; flex-direction: column; gap: 5px;

transform: translateX(150%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

`;

	popup.innerHTML = `

<div style="font-size: 15px; font-weight: bold; color: #333;">‼️УВАГА‼️</div>

<div style="font-size: 13px; color: #666;"><b>${name}</b> (${id}) щойно зайшов на сайт.</div>

`;

	document.body.appendChild(popup);

	// Анімація виїзду

	setTimeout(() => (popup.style.transform = "translateX(0)"), 100);

	// Ховаємо і видаляємо через 8 секунд

	setTimeout(() => {
		popup.style.transform = "translateX(150%)";

		setTimeout(() => popup.remove(), 400);
	}, 8000);
}

// Функція для красивих системних сповіщень (замість alert)
function showSystemAlert(title, text, color = "#4caf50") {
    const popup = document.createElement("div");
    popup.style.cssText = `
        position: fixed; bottom: 100px; right: 30px; background: #ffffff;
        border-left: 5px solid ${color}; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        padding: 15px 20px; border-radius: 8px; z-index: 9999999;
        font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; flex-direction: column; gap: 5px;
        transform: translateX(150%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    `;
    popup.innerHTML = `
        <div style="font-size: 15px; font-weight: bold; color: #333;">${title}</div>
        <div style="font-size: 13px; color: #666;">${text}</div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => (popup.style.transform = "translateX(0)"), 100);
    // Висить 12 секунд, щоб працівник точно встиг прочитати
    setTimeout(() => {
       popup.style.transform = "translateX(150%)";
       setTimeout(() => popup.remove(), 400);
    }, 12000);
}

// ==========================================
// ЛОГІКА АВТОВІДПОВІДАЧА ТА VIP-РАДАРУ (З ДЕБАГОМ)
// ==========================================
window.addEventListener("AlphaSocketMessage", async function (e) {
    const rawData = e.detail;

    try {
       const parsed = JSON.parse(rawData.substring(2));
       if (!Array.isArray(parsed) || parsed.length < 2) return;

       const eventName = parsed[0];
       const payload = parsed[1];

       // 🎯 VIP РАДАР
       if (eventName === "user_online" || (payload && (payload.action === "user_online" || payload.type === "user_online"))) {
          //console.log("🛠️ [Дебаг Радара] 1. Це подія онлайну! Payload:", payload);

          let onlineId = null;
          let clientName = "Важливий клієнт";

          // Бронебійний сканер
          function extractVipData(obj) {
              if (!obj || typeof obj !== 'object') return;
              if (obj.external_id && !onlineId) {
                  onlineId = String(obj.external_id);
                  if (obj.name) clientName = obj.name;
              }
              if (!onlineId) {
                  Object.values(obj).forEach(val => extractVipData(val));
              }
          }
          extractVipData(payload);

          //console.log("🛠️ [Дебаг Радара] 2. Знайдений ID мужика:", onlineId);

          if (onlineId) {
             const rules = JSON.parse(localStorage.getItem("alphaVipRules") || "[]");
             //console.log("🛠️ [Дебаг Радара] 3. Правила в пам'яті бота:", rules);

             const matchedRules = rules.filter(r => String(r.vip_id) === onlineId);
             //console.log("🛠️ [Дебаг Радара] 4. Збігів знайдено:", matchedRules.length);

             if (matchedRules.length > 0) {
                //console.log("🛠️ [Дебаг Радара] 5. БІНГО! Виводимо пуш і перевіряємо вимкнення.");
                showVipNotification(clientName, onlineId);

                for (const rule of matchedRules) {
                    if (rule.auto_disable === true) {
                        //console.log(`🛠️ [Дебаг Радара] 6. Вимикаємо анкету ${rule.profile_id}`);
                        disableProfile(rule.profile_id).then(success => {
                            if(success) {
                                showSystemAlert("🔌 Анкета вимкнена", `Анкету <b>${rule.profile_id}</b> переведено в офлайн.`, "#f44336");
                            } else {
                                showSystemAlert("⚠️ Помилка вимкнення", `Не вдалося вимкнути анкету <b>${rule.profile_id}</b>.`, "#ff9800");
                            }
                        });
                    } else {
                        //console.log(`🛠️ [Дебаг Радара] 6. Галочка авто-вимкнення НЕ стоїть для анкети ${rule.profile_id}`);
                    }
                }
             } else {
                 //console.log("🛠️ [Дебаг Радара] ❌ Цей мужик є онлайн, але його ID немає у ваших правилах!");
             }
          } else {
              //console.log("🛠️ [Дебаг Радара] ❌ Не змогли витягнути ID з Payload!");
          }
       }

       if (!isRunning) return; // 🛑 Блокуємо розсилку та автовідповідач, якщо на паузі

       // ==========================================
       // 🛑 УВАГА: Далі йде автовідповідач (Лайки/Вінки).
       // Він МАЄ блокуватися, якщо бот зупинений!
       if (!isRunning) return;

       // ==========================================
       // РОЗУМНИЙ АВТОВІДПОВІДАЧ (Лайки / Кастомні Вінки)
       // ==========================================
       const womanId = payload.external_id;
       let manId = null;

       if (payload.message_object && payload.message_object.sender_external_id) {
          manId = payload.message_object.sender_external_id;
       } else if (payload.notification_object && payload.notification_object.sender_external_id) {
          manId = payload.notification_object.sender_external_id;
       }

       if (!manId || !womanId) return;

       // Витягуємо тип та сам текст повідомлення
       const msgType = (payload.message_object && payload.message_object.message_type)
                    || (payload.notification_object && payload.notification_object.message_type);

       const msgContent = (payload.message_object && payload.message_object.message_content)
                       || (payload.notification_object && payload.notification_object.message_content)
                       || "";

       const winkTypes = ["SENT_WINK"];
       const likeTypes = ["liked"];

       const isWink = (payload.action === "message" && winkTypes.includes(msgType));
       const isLike = (likeTypes.includes(payload.action) || (payload.action === "message" && likeTypes.includes(msgType)));

       if (isLike) {
          await handleAutoReply(womanId, manId, "like", "");
       } else if (isWink) {
          // Передаємо конкретний текст вінки у функцію (прибираємо зайві пробіли)
          await handleAutoReply(womanId, manId, "wink", msgContent.trim());
       }

    } catch (err) {
       // Ігноруємо невалідний JSON
    }
});

// 🔥 Глобальна пам'ять для захисту від дублів
const autoReplyLocks = new Set();

async function handleAutoReply(profileId, manId, type, exactText = "") {
    const lockKey = `${profileId}_${manId}_${type}`;
    if (autoReplyLocks.has(lockKey)) return;

    autoReplyLocks.add(lockKey);
    setTimeout(() => autoReplyLocks.delete(lockKey), 60000);

    let savedTexts = [];

    // 1. Спроба знайти КАСТОМНУ відповідь під конкретний текст вінки
    if (type === "wink" && exactText !== "") {
        try {
            // Очікуємо, що в localStorage лежить об'єкт (словник) із фразами
            const customWinks = JSON.parse(localStorage.getItem(`resp_${profileId}_wink_custom`) || "{}");

            // Якщо мужик прислав "How is your day going?", перевіряємо, чи є для цього масив відповідей
            if (customWinks[exactText] && customWinks[exactText].length > 0) {
                savedTexts = customWinks[exactText];
            }
        } catch(e) {}
    }

    // 2. Якщо кастомної відповіді не знайшлось (або це лайк), беремо СТАНДАРТНУ
    if (savedTexts.length === 0) {
        const key = `resp_${profileId}_${type}`;
        savedTexts = JSON.parse(localStorage.getItem(key) || "[]");
    }

    // Якщо взагалі нічого немає — ігноруємо
    if (savedTexts.length === 0) return;

    const randomText = savedTexts[Math.floor(Math.random() * savedTexts.length)];
    const speedSec = parseInt(localStorage.getItem("alphaBotReplySpeed") || "3");
    const delayMs = speedSec * 1000 + Math.floor(Math.random() * 1000);

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await sendAutoMessage(profileId, manId, randomText);
}

// Функція sendAutoMessage залишається без змін...

async function sendAutoMessage(profileId, manId, text) {
	let token = localStorage.getItem("token");

	if (!token) return;

	token = token.replace(/^"|"$/g, "");

	const bodyData = {
		sender_id: Number(profileId),

		recipient_id: Number(manId),

		message_content: text,

		message_type: "SENT_TEXT",

		filename: "",

		chance: true,
	};

	try {
		const response = await fetch("https://alpha.date/api/chat/message", {
			method: "POST",

			headers: getHeaders(token), // Функція getHeaders вже є у твоєму файлі вище

			body: JSON.stringify(bodyData),
		});

		const data = await response.json();

		if (response.ok && data.status === true) {
			// console.log(`✅ УСПІХ! Автовідповідь надіслана: "${text}"`);
		}
	} catch (error) {
		//console.error("Помилка автовідповіді", error);
	}
}
