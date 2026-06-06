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
        return Array.isArray(data) ? data.filter((p) => p.online === 1) : [];
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
            user_id: "",
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

            const validChats = list.filter((item) => item.letter_limit > 0 && item.male_block === 0 && item.female_block === 0 && item.hide_chat === 0 && item.status === 1);
            const chatUids = validChats.map((item) => item.chat_uid).filter((uid) => uid);

            if (chatUids.length > 0) {
                const lastMessagesData = await getExternalIdsFromLastMessage(token, chatUids);
                const lastMessagesArray = lastMessagesData.response || lastMessagesData;

                if (Array.isArray(lastMessagesArray)) {
                    lastMessagesArray.forEach((msg) => {
                        const { sender_external_id, recipient_external_id, is_male, chat_uid } = msg;
                        const manId = is_male === 1 ? sender_external_id : recipient_external_id;
                        const womanId = is_male === 1 ? recipient_external_id : sender_external_id;

                        if (womanId == profileId && manId && !allClients.some((c) => c.id === manId)) {
                            allClients.push({ id: manId, chat_uid });
                        }
                    });
                }
            }

            updatePopup(`Збір мужиків (Сторінка ${page})... Знайдено: ${allClients.length}`);
            page++;
            await sleep(500);
        } catch (error) {
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

async function sendInvite(token, profileId, recipientId, template) {
	const bodyData = {
		sender_id: Number(profileId),

		recipient_id: Number(recipientId),

		message_content: template.message_content,

		message_type: template.message_type || "SENT_TEXT",

		filename: "",

		chance: true,
	};

	try {
		const response = await fetch("https://alpha.date/api/chat/message", {
			method: "POST",

			headers: getHeaders(token),

			body: JSON.stringify(bodyData),
		});

		const data = await response.json();

		if (response.ok && data.status === true) {
			return true;
		} else {
			// console.warn(`⚠️ Відмова інвайту для ID ${recipientId}:`, data);

			return false;
		}
	} catch (error) {
		// console.error(`❌ Помилка fetch при відправці інвайту:`, error);

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
								const success = await sendInvite(token, currentProfile.id, client.id, template);

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
							const success = await sendInvite(token, currentProfile.id, client.id, templateToSend);

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

					const success = await sendInvite(token, currentProfile.id, client.id, randomTemplate);

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

// ==========================================

// ВІЗУАЛЬНИЙ ІНТЕРФЕЙС ТА ІНТЕГРАЦІЯ В МЕНЮ

// ==========================================

function injectBotUI() {

	if (document.getElementById("alpha-sender-overlay")) return;

	const overlay = document.createElement("div");

	overlay.id = "alpha-sender-overlay";

	overlay.style.cssText = `

position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;

background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(4px);

z-index: 999999; display: none; align-items: center; justify-content: center;

`;

	const modal = document.createElement("div");

	modal.style.cssText = `

background: #ffffff; border-radius: 12px; display: flex; flex-direction: column;

color: #333333; width: 500px; /* РОЗШИРЕНО ДО 500px */

font-family: 'Segoe UI', Tahoma, sans-serif; position: relative;

box-shadow: 0 10px 30px rgba(0,100,200,0.15); border: 1px solid #e1e8ed; overflow: hidden;

`;

	modal.innerHTML = `
<div style="background: #f5f8fa; padding: 15px 20px; border-bottom: 1px solid #e1e8ed; display: flex; justify-content: space-between; align-items: center;">
    <h3 data-lang="title" style="margin: 0; color: #1976d2; font-size: 18px;">⚙ Alpha Sender Pro</h3>
    <span style="font-size: 11px; color: #999; font-style: italic; opacity: 0.8;">Fire Snakes</span>
    <div style="display: flex; align-items: center; gap: 15px;">
        <div style="display: flex; gap: 10px; font-size: 18px; user-select: none;">
            <span id="langUaBtn" style="cursor: pointer; opacity: 1; transition: 0.2s;" title="Українська">🇺🇦</span>
            <span id="langRuBtn" style="cursor: pointer; opacity: 0.4; transition: 0.2s;" title="Русский">🇷🇺</span>
        </div>
        <span id="uiCloseBtn" style="cursor: pointer; font-size: 24px; color: #999; line-height: 1; font-weight: bold;">&times;</span>
    </div>
</div>

<div style="display: flex; border-bottom: 1px solid #e1e8ed; background: #fff;">
<div id="tabBtnSettings" data-lang="tabSettings" style="flex: 1; text-align: center; padding: 12px 0px; cursor: pointer; font-weight: bold; color: #1976d2; border-bottom: 2px solid #1976d2; font-size: 11px;">Розсилка</div>
<div id="tabBtnInvites" data-lang="tabInvites" style="flex: 1; text-align: center; padding: 12px 0px; cursor: pointer; font-weight: bold; color: #666; border-bottom: 2px solid transparent; font-size: 11px; display: none;">Інвайти</div>
<div id="tabBtnLetters" data-lang="tabLetters" style="flex: 1; text-align: center; padding: 12px 0px; cursor: pointer; font-weight: bold; color: #666; border-bottom: 2px solid transparent; font-size: 11px; display: none;">Листи</div>
<div id="tabBtnWinks" data-lang="tabWinks" style="flex: 1; text-align: center; padding: 12px 0px; cursor: pointer; font-weight: bold; color: #666; border-bottom: 2px solid transparent; font-size: 11px;">Вінки/Лайки</div>
<div id="tabBtnVip" data-lang="tabVip" style="flex: 1; text-align: center; padding: 12px 0px; cursor: pointer; font-weight: bold; color: #666; border-bottom: 2px solid transparent; font-size: 11px;">Повідомлення</div>
<div id="tabBtnStats" data-lang="tabStats" style="flex: 1; text-align: center; padding: 12px 0px; cursor: pointer; font-weight: bold; color: #666; border-bottom: 2px solid transparent; font-size: 11px;">Статистика</div>
</div>

<div style="padding: 20px; max-height: 60vh; overflow-y: auto;">

<div id="tabContentSettings">
<div style="margin-bottom: 12px;">
<label data-lang="delayLabel" style="font-size: 12px; color: #666; font-weight: 600;">Затримка між відправками (сек):</label>
<input type="number" id="uiDelay" value="4" min="1" style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-top: 4px;">
</div>
<div style="margin-bottom: 12px;">
<label data-lang="phaseDelayLabel" style="font-size: 12px; color: #666; font-weight: 600;">Пауза між Інвайтами та Листами (хв):</label>
<input type="number" id="uiPhaseDelay" value="2" min="0" style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-top: 4px;">
</div>
<div style="margin-bottom: 15px;">
<label data-lang="breakTimeLabel" style="font-size: 12px; color: #666; font-weight: 600;">Глобальна перерва між циклами (хв):</label>
<input type="number" id="uiBreakTime" value="10" min="5" max="60" style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-top: 4px;">
</div>

<div style="margin-bottom: 15px;">
<label data-lang="inviteModeLabel" style="font-size: 12px; color: #666; font-weight: 600;">Режим відправки інвайтів:</label>
<select id="uiInviteMode" style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-top: 4px;">
<option value="batch" data-lang="modeBatch">Усі разом</option>
<option value="loop" data-lang="modeLoop">По одному на коло</option>
</select>
</div>

<div style="margin-bottom: 15px; border-top: 1px solid #eee; padding-top: 15px;">
<label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e1e8ed;">
<div>
<div data-lang="useSiteToggleLabel" style="font-size: 13px; font-weight: bold; color: #333;">Інвайти/Листи з сендеру</div>
</div>
<div style="position: relative; width: 44px; height: 24px; flex-shrink: 0;">
<input type="checkbox" id="uiUseSiteToggle" checked style="opacity: 0; width: 0; height: 0; position: absolute;">
<span id="uiToggleBg" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #4caf50; border-radius: 24px; transition: .3s;"></span>
<span id="uiToggleKnob" style="position: absolute; height: 18px; width: 18px; left: 23px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
</div>
</label>
</div>

<button id="uiStartBtn" data-lang="btnStart" style="width: 100%; padding: 12px; background: #1976d2; color: white; border: none; border-radius: 5px; font-weight: bold; font-size: 14px; cursor: pointer; margin-bottom: 10px;">▶ Почати розсилку</button>
<button id="uiStopBtn" data-lang="btnStop" style="width: 100%; padding: 12px; background: #d32f2f; color: white; border: none; border-radius: 5px; font-weight: bold; font-size: 14px; cursor: pointer; display: none; margin-bottom: 10px;">⏹ Зупинити</button>

<div style="padding: 10px; background: #f5f8fa; border-radius: 5px; font-size: 13px; border: 1px solid #e1e8ed;">
<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span data-lang="statusLabel">Статус:</span> <span id="uiStatusText" data-lang="statusWaiting" style="color: #666;">Очікування...</span></div>
<div style="display: flex; justify-content: space-between;"><span data-lang="profileLabel">Анкета:</span> <span id="uiCurrentProfile" style="color: #1976d2; font-weight: bold;">-</span></div>
</div>
</div>

<div id="tabContentInvites" style="display: none;">
<div style="margin-bottom: 15px;">
<label data-lang="invitesProfileLabel" style="font-size: 12px; font-weight: bold; color: #666;">Оберіть анкету для Інвайтів:</label>
<select id="invitesProfileSelect" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ccc; margin-top: 4px;">
<option value="" data-lang="loadingProfiles">Завантаження анкет...</option>
</select>
</div>
<div id="invitesWorkArea" style="display: none; flex-direction: column;">
<textarea id="invitesMessageInput" data-lang="invitesPlaceholder" placeholder="Введіть текст вашого інвайту..." style="width: 100%; height: 80px; box-sizing: border-box; padding: 10px; border-radius: 5px; border: 1px solid #ccc; resize: none; margin-bottom: 10px; font-size: 13px;"></textarea>
<button id="invitesSaveBtn" data-lang="invitesSaveBtn" style="width: 100%; padding: 10px; background: #4caf50; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; margin-bottom: 15px;">💾 Зберегти Інвайт</button>
<div id="invitesSavedList" style="display: flex; flex-direction: column; gap: 8px; max-height: 150px; overflow-y: auto;"></div>
</div>
<div id="invitesEmptyState" data-lang="invitesEmpty" style="padding: 20px; text-align: center; color: #999; font-size: 13px;">Оберіть анкету, щоб додати інвайти</div>
</div>

<div id="tabContentLetters" style="display: none;">
<div style="margin-bottom: 15px;">
<label data-lang="lettersProfileLabel" style="font-size: 12px; font-weight: bold; color: #666;">Оберіть анкету для Листів:</label>
<select id="lettersProfileSelect" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ccc; margin-top: 4px;">
<option value="" data-lang="loadingProfiles">Завантаження анкет...</option>
</select>
</div>
<div id="lettersWorkArea" style="display: none; flex-direction: column;">
<textarea id="lettersMessageInput" data-lang="lettersPlaceholder" placeholder="Введіть текст вашого листа..." style="width: 100%; height: 80px; box-sizing: border-box; padding: 10px; border-radius: 5px; border: 1px solid #ccc; resize: none; margin-bottom: 10px; font-size: 13px;"></textarea>
<div style="display: flex; gap: 10px; margin-bottom: 15px;">
<button id="lettersGalleryBtn" style="width: 45px; height: 45px; background: #f0f4f8; border: 1px solid #cdd5df; border-radius: 8px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: .2s;">📷</button>
<button id="lettersSaveBtn" data-lang="lettersSaveBtn" style="flex: 1; height: 45px; background: #4caf50; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">💾 Зберегти Лист</button>
</div>
<div id="lettersSavedList" style="display: flex; flex-direction: column; gap: 8px; max-height: 150px; overflow-y: auto;"></div>
</div>
<div id="lettersEmptyState" data-lang="lettersEmpty" style="padding: 20px; text-align: center; color: #999; font-size: 13px;">Оберіть анкету, щоб додати листи</div>
</div>

<div id="tabContentWinks" style="display: none;">
    <div style="margin-bottom: 15px;">
        <label data-lang="respProfileLabel" style="font-size: 12px; font-weight: bold; color: #666;">Оберіть анкету:</label>
        <select id="respProfileSelect" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ccc; margin-top: 4px;">
            <option value="" data-lang="loadingProfiles">Завантаження анкет...</option>
        </select>
    </div>

    <div id="respTabsArea" style="display: none; flex-direction: column;">
        <div style="display: flex; border-bottom: 1px solid #eee; margin-bottom: 10px;">
            <div id="respTabLike" data-lang="respTabLike" style="flex: 1; text-align: center; padding: 8px; cursor: pointer; color: #1976d2; border-bottom: 2px solid #1976d2; font-weight: bold; font-size: 13px;">Лайки</div>
            <div id="respTabWink" data-lang="respTabWink" style="flex: 1; text-align: center; padding: 8px; cursor: pointer; color: #666; border-bottom: 2px solid transparent; font-weight: bold; font-size: 13px;">Вінки</div>
        </div>

        <!-- 🔥 НОВИЙ БЛОК: Вибір конкретної вінки (прихований за замовчуванням, показується тільки на вкладці Вінки) -->
        <div id="respWinkTypeContainer" style="display: none; margin-bottom: 10px;">
            <label style="font-size: 12px; font-weight: bold; color: #666;">На яку фразу відповідаємо?</label>
            <select id="respWinkPhraseSelect" style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ccc; margin-top: 4px; font-size: 12px;">
                <option value="default">✨ Стандартна (На будь-яку іншу вінку)</option>
                <option value="I would like to know more about you!">I would like to know more about you!</option>
                <option value="Tell me more about yourself">Tell me more about yourself</option>
                <option value="How is your day going?">How is your day going?</option>
                <option value="What are you up to?">What are you up to?</option>
                <option value="Don't you mind talking a bit?">Don't you mind talking a bit?</option>
            </select>
        </div>
        <!-- ========================================== -->

        <textarea id="respMessageInput" data-lang="respPlaceholder" placeholder="Введіть текст відповіді..." style="width: 100%; height: 70px; box-sizing: border-box; padding: 10px; border-radius: 5px; border: 1px solid #ccc; resize: none; margin-bottom: 10px;"></textarea>
        <button id="respSaveBtn" data-lang="respSaveBtn" style="padding: 10px; background: #4caf50; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; margin-bottom: 15px;">Зберегти текст</button>

        <div id="respSavedList" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 150px; overflow-y: auto;"></div>

        <div style="border-top: 1px solid #eee; padding-top: 15px;">
            <label data-lang="respSpeedLabel" style="font-size: 12px; color: #666; font-weight: 600;">Швидкість відповіді (сек):</label>
            <input type="number" id="respSpeedInput" value="3" min="0" max="10" style="width: 100%; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-top: 4px;">
            <small data-lang="respSpeedSub" style="color: #999; font-size: 11px;">Час "імітації друку" перед відправкою</small>
        </div>
    </div>

    <div id="respEmptyState" data-lang="respEmpty" style="padding: 20px; text-align: center; color: #999; font-size: 13px;">Оберіть анкету, щоб додати тексти</div>
</div>

<div id="tabContentStats" style="display: none;">
<div style="padding: 15px; background: #fff3e0; border-radius: 8px; border: 1px solid #ffe0b2; text-align: center; margin-bottom: 12px;">
<div data-lang="statsInvitesLabel" style="font-size: 12px; color: #e65100; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Надіслано інвайтів</div>
<div id="uiStatsInvites" style="font-size: 28px; font-weight: bold; color: #f57c00;">0</div>
</div>
<div style="padding: 15px; background: #e8f5e9; border-radius: 8px; border: 1px solid #c8e6c9; text-align: center;">
<div data-lang="statsLettersLabel" style="font-size: 12px; color: #1b5e20; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Надіслано листів</div>
<div id="uiStatsLetters" style="font-size: 28px; font-weight: bold; color: #2e7d32;">0</div>
</div>
</div>

<div id="tabContentVip" style="display: none;">
    <div style="padding: 15px; background: #fff3e0; border: 1px solid #ffe0b2; border-radius: 8px; margin-bottom: 15px;">
        <div data-lang="vipTitle" style="font-size: 14px; font-weight: bold; color: #e65100;">уведомления</div>
        <div data-lang="vipSub" style="font-size: 12px; color: #666; margin-top: 5px;">Сповіщення про вхід працюють завжди. Авто-вимкнення анкети можна налаштувати для кожного мужика окремо.</div>
    </div>
    <div id="vipRulesArea" style="display: flex; flex-direction: column; gap: 10px;">
        <div data-lang="vipRulesLabel" style="font-size: 12px; font-weight: bold; color: #666; margin-bottom: 5px;">(Мужик ➔ Анкета):</div>
        <div id="vipRulesList" style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto; padding-right: 5px;"></div>
        <button id="vipAddRuleBtn" data-lang="vipAddRuleBtn" style="padding: 12px; background: #f0f4f8; color: #1976d2; border: 1px dashed #1976d2; border-radius: 5px; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 13px; transition: 0.2s;">➕ Додати мужика</button>
    </div>
</div>
</div>
`;

	// --- Створюємо приховану Галерею ---

	const galleryModal = document.createElement("div");

	galleryModal.id = "alpha-gallery-modal";

	galleryModal.style.cssText = `

position: fixed; top: 5%; left: 5%; width: 90vw; height: 90vh;

background: rgba(255,255,255,0.98); z-index: 9999999; display: none;

flex-direction: column; padding: 20px; box-sizing: border-box;

border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);

`;

	galleryModal.innerHTML = `
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
<h4 data-lang="galleryTitle" style="margin: 0; color: #1976d2; font-size: 20px;">Виберіть фото для листа</h4>
<span id="closeGalleryBtn" style="cursor: pointer; font-size: 32px; color: #999; font-weight: bold; line-height: 1;">&times;</span>
</div>
<div id="galleryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; overflow-y: auto; flex-grow: 1; margin-bottom: 15px;">
</div>
<button id="confirmGalleryBtn" data-lang="galleryConfirmBtn" style="padding: 15px; background: #4caf50; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer;">Готово</button>
`;

	// ДОДАЄМО В OVERLAY, А НЕ В MODAL!

	overlay.appendChild(galleryModal);

	overlay.appendChild(modal);

	document.body.appendChild(overlay);

	// ==========================================

	// ЛОГІКА JAVASCRIPT ДЛЯ ІНТЕРФЕЙСУ

	// ==========================================

	// 1. Логіка вкладок ГОЛОВНОГО меню

	const tabs = [
       { btn: document.getElementById("tabBtnSettings"), content: document.getElementById("tabContentSettings") },
       { btn: document.getElementById("tabBtnInvites"), content: document.getElementById("tabContentInvites") },
       { btn: document.getElementById("tabBtnLetters"), content: document.getElementById("tabContentLetters") },
       { btn: document.getElementById("tabBtnWinks"), content: document.getElementById("tabContentWinks") },
       { btn: document.getElementById("tabBtnVip"), content: document.getElementById("tabContentVip") }, // ДОДАНО
       { btn: document.getElementById("tabBtnStats"), content: document.getElementById("tabContentStats") }
    ];

    function switchMainTab(activeTabBtn) {
       tabs.forEach((tab) => {
          tab.btn.style.color = "#666"; tab.btn.style.borderBottomColor = "transparent";
          tab.content.style.display = "none";
       });
       activeTabBtn.style.color = "#1976d2"; activeTabBtn.style.borderBottomColor = "#1976d2";
       const activeTab = tabs.find((t) => t.btn === activeTabBtn);
       if (activeTab) activeTab.content.style.display = "block";
    }

    tabs[0].btn.onclick = () => switchMainTab(tabs[0].btn);
    tabs[1].btn.onclick = () => switchMainTab(tabs[1].btn);
    tabs[2].btn.onclick = () => switchMainTab(tabs[2].btn);
    tabs[3].btn.onclick = () => { switchMainTab(tabs[3].btn); loadProfilesForUI(); };
    // Обробник нової вкладки:
    // Обробник нової вкладки (ЗМІНЕНО: додано async та await)
    tabs[4].btn.onclick = async () => {
        switchMainTab(tabs[4].btn);
        await loadProfilesForUI(); // Спочатку чекаємо анкети з сервера
        window.renderVipRules();   // БЕЗПЕЧНИЙ ВИКЛИК
    };
    tabs[5].btn.onclick = () => switchMainTab(tabs[5].btn);

	// 2. Логіка ПОВЗУНКА (Тумблера)

	const toggleInput = document.getElementById("uiUseSiteToggle");

	const toggleBg = document.getElementById("uiToggleBg");

	const toggleKnob = document.getElementById("uiToggleKnob");

	const toggleTitle = document.getElementById("toggleTextTitle");

	const toggleSub = document.getElementById("toggleTextSub");

	function updateToggleVisuals(isSite) {
		if (isSite) {
			toggleBg.style.backgroundColor = "#4caf50";

			toggleKnob.style.left = "23px";

			tabs[1].btn.style.display = "none"; // Ховаємо Інвайти

			tabs[2].btn.style.display = "none"; // Ховаємо Листи

			if (tabs[1].content.style.display === "block" || tabs[2].content.style.display === "block") {
				switchMainTab(tabs[0].btn);
			}
		} else {
			toggleBg.style.backgroundColor = "#ccc";

			toggleKnob.style.left = "3px";

			tabs[1].btn.style.display = "block"; // Показуємо Інвайти

			tabs[2].btn.style.display = "block"; // Показуємо Листи

			if (typeof loadProfilesForUI === "function") loadProfilesForUI();
		}
	}

	// Відновлюємо стан з пам'яті

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

	// 3. Логіка галереї (Відкрити/Закрити)

	document.getElementById("lettersGalleryBtn").onclick = () => (galleryModal.style.display = "flex");

	document.getElementById("closeGalleryBtn").onclick = () => (galleryModal.style.display = "none");

	document.getElementById("confirmGalleryBtn").onclick = () => (galleryModal.style.display = "none");

	// ==========================================
// 4. ОНОВЛЕНИЙ КОД: Вінки/Лайки та Кастомні відповіді
// ==========================================

const tabLike = document.getElementById("respTabLike");
const tabWink = document.getElementById("respTabWink");
const winkTypeContainer = document.getElementById("respWinkTypeContainer");
const winkPhraseSelect = document.getElementById("respWinkPhraseSelect");

tabLike.onclick = () => {
    currentSelectedTab = "like";

    tabLike.style.color = "#1976d2";
    tabLike.style.borderBottomColor = "#1976d2";
    tabWink.style.color = "#666";
    tabWink.style.borderBottomColor = "transparent";

    // Ховаємо вибір конкретної фрази, бо це лайки
    if (winkTypeContainer) winkTypeContainer.style.display = "none";

    renderSavedMessages();
};

tabWink.onclick = () => {
    currentSelectedTab = "wink";

    tabWink.style.color = "#1976d2";
    tabWink.style.borderBottomColor = "#1976d2";
    tabLike.style.color = "#666";
    tabLike.style.borderBottomColor = "transparent";

    // Показуємо вибір конкретної фрази для вінок
    if (winkTypeContainer) winkTypeContainer.style.display = "block";

    renderSavedMessages();
};

// Оновлюємо список відповідей, якщо перемкнули фразу у випадаючому списку
if (winkPhraseSelect) {
    winkPhraseSelect.addEventListener("change", () => {
        renderSavedMessages();
    });
}

document.getElementById("respProfileSelect").addEventListener("change", (e) => {
    currentSelectedProfile = e.target.value;

    if (currentSelectedProfile) {
       document.getElementById("respTabsArea").style.display = "flex";
       document.getElementById("respEmptyState").style.display = "none";
       renderSavedMessages();
    } else {
       document.getElementById("respTabsArea").style.display = "none";
       document.getElementById("respEmptyState").style.display = "block";
    }
});

// --- Збереження тексту Вінки/Лайки ---
document.getElementById("respSaveBtn").onclick = () => {
    const text = document.getElementById("respMessageInput").value.trim();

    if (!text || !currentSelectedProfile) return;

    // Перевіряємо, чи це кастомна вінка
    if (currentSelectedTab === "wink" && winkPhraseSelect && winkPhraseSelect.value !== "default") {
        const phrase = winkPhraseSelect.value;
        const key = `resp_${currentSelectedProfile}_wink_custom`;

        // Дістаємо об'єкт (словник) замість масиву
        let savedObj = JSON.parse(localStorage.getItem(key) || "{}");
        if (!savedObj[phrase]) savedObj[phrase] = []; // Створюємо масив для цієї фрази, якщо його ще нема

        savedObj[phrase].push(text);
        localStorage.setItem(key, JSON.stringify(savedObj));

    } else {
        // Зберігаємо ЛАЙК або СТАНДАРТНУ вінку (як звичайний масив)
        const key = `resp_${currentSelectedProfile}_${currentSelectedTab}`;
        let saved = JSON.parse(localStorage.getItem(key) || "[]");

        saved.push(text);
        localStorage.setItem(key, JSON.stringify(saved));
    }

    document.getElementById("respMessageInput").value = "";
    renderSavedMessages();
};

// --- ВІДМАЛЬОВКА ТА ВИДАЛЕННЯ ЗБЕРЕЖЕНИХ ПОВІДОМЛЕНЬ ---
function renderSavedMessages() {
    const list = document.getElementById("respSavedList");
    if (!list) return;
    list.innerHTML = "";

    if (!currentSelectedProfile) return;

    let texts = [];
    let isCustomWink = false;
    let selectedPhrase = "";
    let storageKey = "";

    if (currentSelectedTab === "wink" && winkPhraseSelect && winkPhraseSelect.value !== "default") {
        // Завантажуємо кастомні вінки
        isCustomWink = true;
        selectedPhrase = winkPhraseSelect.value;
        storageKey = `resp_${currentSelectedProfile}_wink_custom`;
        const customObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
        texts = customObj[selectedPhrase] || [];
    } else {
        // Завантажуємо лайки або стандартні вінки
        storageKey = `resp_${currentSelectedProfile}_${currentSelectedTab}`;
        texts = JSON.parse(localStorage.getItem(storageKey) || "[]");
    }

    if (texts.length === 0) {
        list.innerHTML = `<div style="text-align:center; color:#999; font-size:12px; margin-top:10px;">Ще немає збережених відповідей</div>`;
        return;
    }

    texts.forEach((text, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.style.cssText = "display: flex; justify-content: space-between; background: #f9f9f9; padding: 8px; border-radius: 4px; border: 1px solid #eee; font-size: 13px; align-items: center;";

        const textSpan = document.createElement("span");
        textSpan.textContent = text;
        textSpan.style.flex = "1";
        textSpan.style.marginRight = "10px";

        const delBtn = document.createElement("button");
        delBtn.textContent = "❌";
        delBtn.style.cssText = "background: none; border: none; cursor: pointer; font-size: 12px; opacity: 0.7;";

        // Логіка видалення
        delBtn.onclick = () => {
            if (isCustomWink) {
                const obj = JSON.parse(localStorage.getItem(storageKey) || "{}");
                if (obj[selectedPhrase]) {
                    obj[selectedPhrase].splice(index, 1);
                    localStorage.setItem(storageKey, JSON.stringify(obj));
                }
            } else {
                const arr = JSON.parse(localStorage.getItem(storageKey) || "[]");
                arr.splice(index, 1);
                localStorage.setItem(storageKey, JSON.stringify(arr));
            }
            renderSavedMessages();
        };

        itemDiv.appendChild(textSpan);
        itemDiv.appendChild(delBtn);
        list.appendChild(itemDiv);
    });
}

// --- Збереження швидкості відповіді ---
const speedInput = document.getElementById("respSpeedInput");
if (speedInput) {
    speedInput.addEventListener("input", (e) => {
       localStorage.setItem("alphaBotReplySpeed", e.target.value);
    });

    const savedSpeed = localStorage.getItem("alphaBotReplySpeed");
    if (savedSpeed) speedInput.value = savedSpeed;
}

	// --- Логіка вибору анкети для ІНВАЙТІВ ---

	document.getElementById("invitesProfileSelect").addEventListener("change", (e) => {
		if (e.target.value) {
			document.getElementById("invitesWorkArea").style.display = "flex";

			document.getElementById("invitesEmptyState").style.display = "none";

			// ОСЬ ЦЕЙ КРОК 3: Малюємо збережені інвайти при виборі анкети!

			renderCustomInvites();
		} else {
			document.getElementById("invitesWorkArea").style.display = "none";

			document.getElementById("invitesEmptyState").style.display = "block";
		}
	});

	// --- Логіка вибору анкети для ЛИСТІВ ---

	document.getElementById("lettersProfileSelect").addEventListener("change", async (e) => {
		// ДОДАНО: async

		const profileId = e.target.value;

		if (profileId) {
			document.getElementById("lettersWorkArea").style.display = "flex";

			document.getElementById("lettersEmptyState").style.display = "none";

			// ==========================================

			// МАГІЯ ГАЛЕРЕЇ: Завантажуємо фото анкети

			// ==========================================

			const galleryGrid = document.getElementById("galleryGrid");

			galleryGrid.innerHTML = '<span style="color: #666; font-size: 12px; grid-column: 1 / -1; text-align: center;">Завантаження фото...</span>';

			let token = localStorage.getItem("token");

			if (token) {
				token = token.replace(/^"|"$/g, "");

				// Викликаємо нашу готову функцію, яка парсить сайт!

				const imageMap = await getProfileGallery(token, profileId);

				galleryGrid.innerHTML = ""; // Очищаємо напис "Завантаження..."

				window.selectedCustomImages = []; // Масив для вибраних фоток

				document.getElementById("lettersGalleryBtn").innerHTML = "📷"; // Скидаємо кнопку

				if (Object.keys(imageMap).length === 0) {
					galleryGrid.innerHTML = '<span style="color: #999; font-size: 12px; grid-column: 1 / -1; text-align: center;">У цієї анкети немає фото.</span>';
				} else {
					// Малюємо кожну фотографію у сітці

					for (const [link, id] of Object.entries(imageMap)) {
						const img = document.createElement("img");

						img.src = link;

						img.dataset.id = id;

						img.style.cssText = `width: 100%; height: 80px; object-fit: cover; border-radius: 5px; cursor: pointer; border: 3px solid transparent; transition: .2s; box-sizing: border-box;`;

						// Логіка кліку по фотографії (Виділення)

						img.onclick = () => {
							const idx = window.selectedCustomImages.findIndex((imgObj) => imgObj.id === id);

							if (idx > -1) {
								// Знімаємо виділення

								window.selectedCustomImages.splice(idx, 1);

								img.style.borderColor = "transparent";

								img.style.opacity = "1";
							} else {
								// Додаємо виділення

								window.selectedCustomImages.push({ id: id, link: link });

								img.style.borderColor = "#4caf50"; // Зелена рамка

								img.style.opacity = "0.8";
							}

							// Оновлюємо іконку кнопки 📷 (малюємо червоний кружечок з цифрою)

							const btn = document.getElementById("lettersGalleryBtn");

							const count = window.selectedCustomImages.length;

							btn.style.position = "relative";

							btn.innerHTML =
								count > 0
									? `📷<span style="position: absolute; top: -5px; right: -5px; background: #f44336; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">${count}</span>`
									: "📷";
						};

						galleryGrid.appendChild(img);
					}
				}

				renderCustomLetters();
			}
		} else {
			document.getElementById("lettersWorkArea").style.display = "none";

			document.getElementById("lettersEmptyState").style.display = "block";
		}
	});

	// ==========================================

	// ЗБЕРЕЖЕННЯ КАСТОМНИХ ІНВАЙТІВ ТА ЛИСТІВ

	// ==========================================

	document.getElementById("invitesSaveBtn").onclick = () => {
		const text = document.getElementById("invitesMessageInput").value.trim();

		const profileId = document.getElementById("invitesProfileSelect").value;

		if (!text || !profileId) return;

		const key = `alpha_invites_${profileId}`;

		let saved = JSON.parse(localStorage.getItem(key) || "[]");

		// Зберігаємо у такому ж форматі, як віддає сайт

		saved.push({ message_content: text, message_type: "SENT_TEXT" });

		localStorage.setItem(key, JSON.stringify(saved));

		document.getElementById("invitesMessageInput").value = "";

		if (typeof renderCustomInvites === "function") renderCustomInvites();
	};

	document.getElementById("lettersSaveBtn").onclick = () => {
		const text = document.getElementById("lettersMessageInput").value.trim();

		const profileId = document.getElementById("lettersProfileSelect").value;

		if (!text || !profileId) return;

		const key = `alpha_letters_${profileId}`;

		let saved = JSON.parse(localStorage.getItem(key) || "[]");

		// Беремо фотки, які ми виділили зеленою рамкою

		const attachments = window.selectedCustomImages ? [...window.selectedCustomImages] : [];

		// Зберігаємо лист разом з фотографіями

		saved.push({ message_content: text, message_type: "SENT_TEXT", attachments: attachments });

		localStorage.setItem(key, JSON.stringify(saved));

		// Очищаємо поле та скидаємо галерею

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

	// ==========================================
    // ЛОГІКА VIP РАДАРУ (ПУЛЬТ) - ЧИСТИЙ ВАРІАНТ
    // ==========================================
    const vipRulesList = document.getElementById("vipRulesList");

    document.getElementById("vipAddRuleBtn").onclick = () => {
        let rules = JSON.parse(localStorage.getItem("alphaVipRules") || "[]");
        rules.push({ vip_id: "", profile_id: "", auto_disable: false });
        localStorage.setItem("alphaVipRules", JSON.stringify(rules));
        window.renderVipRules();
    };

    window.renderVipRules = function() {
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

            // Верхній ряд: ID -> Анкета -> Видалити
            const topRow = document.createElement("div");
            topRow.style.cssText = `display: flex; gap: 10px; align-items: center;`;

            const inputVip = document.createElement("input");
            inputVip.type = "text";
            inputVip.placeholder = "ID мужика";
            inputVip.value = rule.vip_id || "";
            inputVip.style.cssText = `width: 90px; padding: 6px; border-radius: 4px; border: 1px solid #ccc; font-size: 12px;`;
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
            selectProfile.style.cssText = `flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #ccc; font-size: 12px;`;
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

            // Нижній ряд: Чекбокс авто-вимкнення
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

    // ==========================================
    // ЛОГІКА МУЛЬТИМОВНОСТІ
    // ==========================================
    const langUaBtn = document.getElementById("langUaBtn");
    const langRuBtn = document.getElementById("langRuBtn");

    function applyTranslations(lang) {
        localStorage.setItem("alphaLang", lang); // Зберігаємо вибір

        // Виділяємо активний прапорець (інший робимо напівпрозорим)
        langUaBtn.style.opacity = lang === "ua" ? "1" : "0.4";
        langRuBtn.style.opacity = lang === "ru" ? "1" : "0.4";

        // Пробігаємося по всіх елементах з міткою data-lang
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
}

// ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ АВТОВІДПОВІДАЧА

async function loadProfilesForUI() {
	const selectEl = document.getElementById("respProfileSelect");

	if (selectEl.options.length > 1) return; // Вже завантажено

	let token = localStorage.getItem("token");

	if (!token) return;

	token = token.replace(/^"|"$/g, "");

	selectEl.innerHTML = '<option value="">Завантаження...</option>';

	const profiles = await getAllProfiles(token); // Беремо анкети з сервера

	// 1. Спочатку заповнюємо головний список

	selectEl.innerHTML = '<option value="">' + t("dynSelectProfile") + '</option>';

	profiles.forEach((p) => {
		const opt = document.createElement("option");

		opt.value = p.external_id;

		opt.innerText = `${p.name} (${p.external_id})`;

		selectEl.appendChild(opt);
	});

	// 2. І тільки ТЕПЕР, коли він повний, копіюємо його в інші вкладки!

	const invitesSelect = document.getElementById("invitesProfileSelect");

	if (invitesSelect) invitesSelect.innerHTML = selectEl.innerHTML;

	const lettersSelect = document.getElementById("lettersProfileSelect");

	if (lettersSelect) lettersSelect.innerHTML = selectEl.innerHTML;

	updateProfileColors();
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
            const match = window.location.href.match(/\/chat\/([a-z0-9\-]+)/);
            const currentChatId = match ? match[1] : null;

            if (!currentChatId || !window.alphaSmartSearch) return;

            const textSpan = searchContainer.querySelector('.alpha-search-text');
            const progressFill = searchContainer.querySelector('.alpha-progress-fill');

            // ЕТАП 2: Якщо вже завантажено, просто відкриваємо меню
            if (isLoaded) {
                window.alphaSmartSearch.open();
                return;
            }

            // ЕТАП 1: Якщо ще не завантажено, починаємо викачувати
            if (!isLoading) {
                isLoading = true;
                textSpan.innerText = "Завантаження...";

                // Передаємо функцію зворотного зв'язку, щоб smartSearch оновлював наш прогрес-бар
                await window.alphaSmartSearch.preloadHistory(currentChatId, token, (percent) => {
                    progressFill.style.width = `${percent}%`;
                });

                isLoading = false;
                isLoaded = true;
                textSpan.innerText = "Відкрити пошук";
                textSpan.style.color = "#1976d2";
                textSpan.style.fontWeight = "bold";
                progressFill.style.background = "#bbdefb"; // Робимо фон більш контрастним
                progressFill.style.width = "100%";
            }
        });

        middleBlock.insertAdjacentElement('afterend', searchContainer);
    });
}

setInterval(injectSearchButton, 2000);

function renderSavedMessages() {
	if (!currentSelectedProfile) return;

	const listEl = document.getElementById("respSavedList");

	listEl.innerHTML = "";

	const key = `resp_${currentSelectedProfile}_${currentSelectedTab}`;

	let saved = JSON.parse(localStorage.getItem(key) || "[]");

	if (saved.length === 0) {
		listEl.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block;">' + t("dynNoMessages") + '</span>';

		return;
	}

	saved.forEach((text, index) => {
		const item = document.createElement("div");

		item.style.cssText = `background: #f9f9f9; border: 1px solid #e0e0e0; padding: 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;`;

		const textSpan = document.createElement("span");

		textSpan.innerText = text;

		textSpan.style.cssText = `font-size: 12px; color: #333; flex: 1; word-break: break-word;`;

		const delBtn = document.createElement("span");

		delBtn.innerHTML = "&times;";

		delBtn.style.cssText = `color: #d32f2f; cursor: pointer; font-size: 18px; font-weight: bold; margin-left: 10px; line-height: 1;`;

		delBtn.onclick = () => {
			saved.splice(index, 1);

			localStorage.setItem(key, JSON.stringify(saved));

			renderSavedMessages();
		};

		item.appendChild(textSpan);

		item.appendChild(delBtn);

		listEl.appendChild(item);
	});

	updateProfileColors();
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
