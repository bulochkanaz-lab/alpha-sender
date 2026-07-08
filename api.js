// ==========================================
// API ФУНКЦІЇ (Зв'язок із серверами alpha.date)
// ==========================================

async function getAllProfiles(token) {
    try {
        const response = await fetch("https://alpha.date/api/operator/profiles", {
            method: "GET",
            headers: getHeaders(token),
        });
        const data = await response.json();
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

async function sendHeartbeatToServer(profilesList = []) {
    const currentKey = window._alphaPhantom.alphaKey || localStorage.getItem('alphaAccessKey');
    if (!currentKey) return;

    const d = new Date();
    const todayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const stats = JSON.parse(localStorage.getItem("alphaStats_" + todayKey) || '{"invites": 0, "letters": 0}');

    window.dispatchEvent(new CustomEvent("AlphaPing", {
        detail: {
            key: currentKey,
            profiles: profilesList.map(p => p.id),
            stats_invites: stats.invites,
            stats_letters: stats.letters
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
        // updatePopup викликається з ui.js
        if(typeof updatePopup === 'function') updatePopup(`Шукаю мужиків (Сторінка ${page})...`);

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

            const chatUids = list.map(item => item.chat_uid).filter(uid => uid);

            let messagesData = [];
            if (chatUids.length > 0) {
                const lastMsgResponse = await fetch("https://alpha.date/api/chatList/lastMessage", {
                    method: "POST",
                    headers: getHeaders(token),
                    body: JSON.stringify({ chat_uid: chatUids })
                });
                const lastMsgJson = await lastMsgResponse.json();

                messagesData = lastMsgJson.response || lastMsgJson.data || [];
                if (!Array.isArray(messagesData) && typeof messagesData === 'object') {
                    messagesData = Object.values(messagesData);
                }
            }

            list.forEach((item) => {
                let externalId = null;
                const chatUid = item.chat_uid;
                const msg = messagesData.find(m => m.chat_uid === chatUid);

                if (msg) {
                    if (Number(msg.is_male) === 1) {
                        externalId = msg.sender_external_id;
                    } else {
                        externalId = msg.recipient_external_id;
                    }
                }

                if (!externalId) {
                    externalId = item.male_id;
                }

                if (externalId && !allClients.some((c) => c.id === externalId)) {
                    allClients.push({ id: externalId, chat_uid: chatUid });
                }
            });

            if(typeof updatePopup === 'function') updatePopup(`Збір мужиків (Сторінка ${page})... Знайдено: ${allClients.length}`);
            page++;
            await sleep(500);

        } catch (error) {
            //console.error("❌ Помилка при зборі сторінки", page, error);
            hasMore = false;
        }
    }

    return allClients;
}

async function isDuplicateInHistory(token, chatUid, textToCheck) {
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
       return false;
    }
}

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

       return messages.map((m) =>
          String(m.message_content || "").trim().toLowerCase()
       );
    } catch (error) {
       return [];
    }
}

function formatAttachmentsForMail(rawAttachments, imageMap) {
    if (!rawAttachments || rawAttachments.length === 0) return [];

    return rawAttachments.reduce((acc, att) => {
       const realId = imageMap[att.link];

       if (realId) {
          const fileName = att.link.split("/").pop() || "image.jpg";
          acc.push({
             id: realId,
             link: att.link,
             message_type: att.attachment_type || "SENT_IMAGE",
             title: fileName,
          });
       }
       return acc;
    }, []);
}

async function sendLetter(token, profileId, recipientId, template, imageMap) {
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
       return (response.ok && data.status === true);
    } catch (error) {
       return false;
    }
}

async function disableProfile(profileId) {
    let token = localStorage.getItem("token");
    if (!token) return false;
    token = token.replace(/^"|"$/g, "");

    let operatorId = null;

    try {
        let base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }

        const decoded = JSON.parse(atob(base64));
        operatorId = decoded.id;
    } catch (e) {
        //e.error("Помилка парсингу токена:", e);
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
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function simulateCheckClick(token) {
    try {
        await fetch("https://alpha.date/api/operator/checkClick", {
            method: "GET",
            headers: getHeaders(token)
        });
    } catch (e) {
        // Ігноруємо помилки мережі, щоб не зупиняти розсилку
    }
}

// ==========================================
// СИСТЕМА ПРОГРІВУ ТА ІМІТАЦІЇ ЛЮДИНИ
// ==========================================

async function simulateChatOpen(token, chatUid) {
    if (!chatUid) return; // Якщо це абсолютно новий мужик, історії ще немає

    try {
        // 1. Імітуємо клік на діалог (завантаження опцій чату)
        await fetch("https://alpha.date/api/chatList/chatOptions", {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify({ chat_id: chatUid })
        });

        // Мікро-пауза: людина чекає, поки відмалюється вікно (200-400 мс)
        await sleep(Math.floor(Math.random() * (400 - 200 + 1)) + 200);

        // 2. Імітуємо завантаження історії повідомлень на екран
        await fetch("https://alpha.date/api/chatList/chatHistory", {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify({ chat_id: chatUid, page: 1 })
        });
    } catch (e) {
        // Ігноруємо помилки, щоб не зупиняти головний цикл
    }
}

async function simulateCheckClick(token) {
    try {
        await fetch("https://alpha.date/api/operator/checkClick", {
            method: "GET",
            headers: getHeaders(token)
        });
    } catch (e) { }
}

function getDynamicDelay(textLength) {
    // 1. Базова затримка: час реакції (клік у поле, підготовка до введення)
    // Людина завжди витрачає на це від 1 до 1.5 секунди
    const baseDelay = Math.floor(Math.random() * (1500 - 1000 + 1)) + 1000;

    // 2. Час на роботу з текстом (друкування або візуальна перевірка після вставки)
    // Даємо 15 мілісекунд на кожен символ.
    // Короткий інвайт (50 симв.) = +750 мс. Довгий лист (300 симв.) = +4.5 сек.
    const typingTime = textLength * 15;

    // 3. Фактор хаосу (Jitter)
    // Математична похибка від 0 до 500 мілісекунд, щоб зламати алгоритми
    const jitter = Math.floor(Math.random() * 500);

    return baseDelay + typingTime + jitter;
}

async function sendInvite(token, profileId, recipientId, template, chatUid) {
    const man = Number(recipientId);
    const woman = Number(profileId);

    // ==========================================
    // 1. ПОВНИЙ ЛАНЦЮЖОК ПРОГРІВУ (Анти-Shadowban)
    // ==========================================
    if (chatUid) {
        // Людина відкриває існуючий чат (завантажує історію та опції)
        await simulateChatOpen(token, chatUid);
    }

    // Людина клікає мишкою в поле вводу тексту
    await simulateCheckClick(token);

    // ==========================================
    // 2. АЛГОРИТМІЧНА ІМІТАЦІЯ ДРУКУ (Динамічний таймінг)
    // ==========================================
    const textLength = template.message_content ? template.message_content.length : 0;
    const humanDelay = getDynamicDelay(textLength);
    await sleep(humanDelay);

    // ==========================================
    // 3. ФОРМУВАННЯ ПРАВИЛЬНОГО ПАКЕТУ
    // ==========================================
    const payload = {
        sender_id: woman,
        recipient_id: man,
        message_content: template.message_content,
        message_type: template.message_type || "SENT_TEXT",
        filename: ""
    };

    if (chatUid) {
        payload.chat_uid = chatUid;
    } else {
        payload.chance = true;
    }

    try {
        // ==========================================
        // 4. ФІНАЛЬНИЙ ПОСТРІЛ
        // ==========================================
        const response = await fetch("https://alpha.date/api/chat/message", {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return (response.ok && data.status === true);

    } catch (error) {
        return false;
    }
}


// =====================================================
// МАСОВЕ ЗАВАНТАЖЕННЯ ФОТО В ГАЛЕРЕЮ (Bulk Gallery Upload)
// =====================================================

// Функція-помічник для імітації їхнього 32-значного хеш-коду (як 671dfc5d59cfb2ea3ca2176307a62543)
function generateHexHash() {
    return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// =====================================================
// ОНОВЛЕНА ФУНКЦІЯ ЗАВАНТАЖЕННЯ (З потрійним клонуванням)
// =====================================================

async function uploadSinglePhoto(token, externalId, file, onProgress = null) {
    // Витягуємо оригінальне ім'я та розширення
    const fileExt = file.name.split('.').pop().toLowerCase() || 'png';
    const rawFileName = file.name.replace(/\.[^/.]+$/, "") || 'image';

    // Генеруємо ОДИН спільний хеш для всіх 3 версій файлу
    const fileHash = generateHexHash();

    // Три префікси, які вимагає сайт
    const prefixes = ["w-250-h-250-", "w-1920-h-1280-", ""];
    let finalCdnLink = "";

    try {
        const headers = getHeaders(token);
        delete headers['content-type']; // Важливо для FormData

        // 1. ЗАВАНТАЖУЄМО 3 КОПІЇ (Імітуємо нарізку сайту)
        for (const prefix of prefixes) {
            const newFileName = `${prefix}${fileHash}.${fileExt}`;

            const formData = new FormData();
            formData.append('file', file); // Відправляємо те саме оригінальне фото
            formData.append('newFileName', newFileName);
            formData.append('fileName', rawFileName);
            formData.append('dir', String(externalId));
            formData.append('bucketName', 'chats-images.cdndate.net');

            const uploadRes = await fetch('https://alpha.date/api/v3/click-history/aws/generate-link', {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const uploadData = await uploadRes.json();

            if (!uploadData.status || !uploadData.success || !uploadData.data) {
                return { success: false, filename: file.name, error: `Сервер відхилив копію: ${prefix}` };
            }

            // Якщо це оригінал (префікс ""), зберігаємо його лінк для фінальної реєстрації
            if (prefix === "") {
                finalCdnLink = uploadData.data.link;
            }
        }

        // 2. РЕЄСТРУЄМО ФОТО В ГАЛЕРЕЇ
        // Реєструвати потрібно лише 1 раз, використовуючи посилання на оригінал
        const registerRes = await fetch('https://alpha.date/api/files/image', {
            method: 'POST',
            headers: getHeaders(token), // Тут повертаємо стандартні хедери з content-type
            body: JSON.stringify({
                external_id: Number(externalId),
                filename: file.name,
                link: finalCdnLink
            })
        });

        const registerData = await registerRes.json();

        if (registerData.status) {
            if (onProgress) onProgress(file.name, true);
            return { success: true, filename: file.name, imageId: registerData.image?.id };
        } else {
            return { success: false, filename: file.name, error: 'Не вдалося закріпити фото в галереї' };
        }

    } catch (error) {
        //console.error('[BulkUpload] Помилка:', error);
        return { success: false, filename: file.name, error: error.message };
    }
}

// =====================================================
// ФУНКЦІЯ ЗАВАНТАЖЕННЯ ВІДЕО
// =====================================================
async function uploadSingleVideo(token, externalId, file, onProgress = null) {
    const fileExt = file.name.split('.').pop().toLowerCase() || 'mp4';
    const rawFileName = file.name.replace(/\.[^/.]+$/, "") || 'video';
    const fileHash = generateHexHash();
    const newFileName = `${fileHash}.${fileExt}`;

    try {
        const headers = getHeaders(token);
        delete headers['content-type']; // Важливо для FormData

        // 1. ЗАВАНТАЖУЄМО ВІДЕО НА AWS
        const formData = new FormData();
        formData.append('file', file);
        formData.append('newFileName', newFileName);
        formData.append('fileName', rawFileName);
        formData.append('dir', String(externalId));
        formData.append('bucketName', 'chats-videos'); // Бакет для відео!

        const uploadRes = await fetch('https://alpha.date/api/v3/video_converter/new-video-convert', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const uploadData = await uploadRes.json();

        if (!uploadData.status || !uploadData.success || !uploadData.data) {
            return { success: false, filename: file.name, error: 'Сервер відхилив відео' };
        }

        const cdnLink = uploadData.data.link;
        const serverFilename = uploadData.filename || rawFileName; // Сервер повертає змінене ім'я

        // 2. РЕЄСТРУЄМО ВІДЕО В ГАЛЕРЕЇ
        const registerRes = await fetch('https://alpha.date/api/files/video', {
            method: 'POST',
            headers: getHeaders(token), // Повертаємо стандартні хедери
            body: JSON.stringify({
                external_id: Number(externalId),
                filename: serverFilename,
                link: cdnLink
            })
        });

        const registerData = await registerRes.json();

        // 3. ГЕНЕРУЄМО МІНІАТЮРУ (THUMBNAIL) ЩОБ НЕ БУЛО СІРОГО ФОНУ
        if (registerData.status) {
            try {
                await fetch('https://alpha.date/api/v3/video_converter', {
                    method: 'POST',
                    headers: getHeaders(token),
                    body: JSON.stringify({
                        type: "link",
                        data: cdnLink
                    })
                });
            } catch (thumbErr) {
                //console.warn("[BulkUpload] Помилка генерації прев'ю відео, але відео завантажено", thumbErr);
            }

            if (onProgress) onProgress(file.name, true);
            return { success: true, filename: file.name, videoId: registerData.video?.id };
        } else {
            return { success: false, filename: file.name, error: 'Не вдалося закріпити відео в галереї' };
        }

    } catch (error) {
        //console.error('[BulkUpload] Помилка завантаження відео:', error);
        return { success: false, filename: file.name, error: error.message };
    }
}

// =====================================================
// РОЗУМНИЙ МАСОВИЙ ЗАГРУЗЧИК (ФОТО + ВІДЕО)
// =====================================================
async function bulkUploadMedia(token, externalId, files, onProgress = null, onFileError = null) {
    let uploaded = 0;
    const total = files.length;

    for (let i = 0; i < total; i++) {
        const file = files[i];
        let result;

        // Перевіряємо тип файлу: відео чи фото?
        if (file.type.startsWith('video/')) {
            result = await uploadSingleVideo(token, externalId, file);
        } else {
            result = await uploadSinglePhoto(token, externalId, file);
        }

        if (result.success) {
            uploaded++;
            if (onProgress) onProgress(uploaded, total);
        } else {
            if (onFileError) onFileError(result.filename, result.error);
        }

        // Пауза 800мс
        if (i < total - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    return { uploaded, total };
}