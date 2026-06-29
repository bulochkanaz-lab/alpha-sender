importScripts('config.js');

// НОВА функція: Генерує або отримує токен сесії
async function getOrGenerateSessionToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['session_token'], function(result) {
            let token = result.session_token;

            if (!token) {
                // Створюємо випадковий UUID для цієї сесії
                token = crypto.randomUUID();
                chrome.storage.local.set({session_token: token});
            }
            resolve(token);
        });
    });
}

async function decryptPayload(combinedB64, accessKey) {
    // 🛡 КРИТИЧНО: Очищаємо ключ ПРИМУСОВО точно так само, як Python!
    const cleanKey = accessKey.replace(/"/g, '').trim();

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(cleanKey));
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyMaterial, 'AES-GCM', false, ['decrypt']
    );

    const decodeB64 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
    const combined = decodeB64(combinedB64);

    const nonce = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce }, cryptoKey, ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "pingSW") {
        sendResponse({ status: "pong" });
        return true;
    }

    // ДОДАЄМО ОБРОБНИК ПІНГУ
    if (request.action === "sendPing") {
        const SERVER_URL = APP_CONFIG.serverUrl; // Краще брати з конфігу!

        getOrGenerateSessionToken().then(token => { // Змінили hwid на token
            fetch(`${SERVER_URL}/heartbeat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    access_key: request.key,
                    session_token: token, // <-- Змінили hwid на session_token
                    profiles: request.profiles,
                    stats_invites: request.stats_invites || 0,
                    stats_letters: request.stats_letters || 0,
                    team: APP_CONFIG.team
                })
            })
                .then(res => res.json())
                .then(data => {
                    // Якщо бан
                    if (data.status === "banned" || data.status === 403) {
                        chrome.tabs.sendMessage(sender.tab.id, { action: "banned" });
                    }
                    // 🔥 НОВЕ: Якщо сесія перервана (хтось інший зайшов)
                    else if (data.status === "session_expired") {
                        chrome.tabs.sendMessage(sender.tab.id, { action: "session_expired", message: data.message });
                    }
                })
                .catch(err => console.error("Помилка фонового пінгу:", err));
            sendResponse({ status: "alive" });
        });
        return true;
    }

    if (request.action === "sendAnalytics") {
        // 🔥 НОВА СТЕЛС-АДРЕСА
        // 🔥 Беремо URL прямо з конфігу
        const targetUrl = APP_CONFIG.serverUrl + '/api/v2/met';

        //console.log(`[🚀 КЛІЄНТ] Відправка аналітики на ${targetUrl}`);

        fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.data)
        })
            .then(async res => {
                const status = res.status;
                const text = await res.text();
                //console.log(`[📥 ВІДПОВІДЬ] Статус: ${status}. Відповідь:`, text);
            })
            .catch(err => console.error("elo", err));

        sendResponse({ status: "ok" });
        return true;
    }

    if (request.action === "validateAndLoad") {
        const SERVER_URL = "http://178.105.190.180:8000";

        getOrGenerateSessionToken().then(token => {
            fetch(`${APP_CONFIG.serverUrl}/auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    access_key: request.key,
                    profiles: request.profiles,
                    session_token: token,
                    team: APP_CONFIG.team
                })
            })
                .then(res => res.json())
                .then(async data => {
                    if (data.status === "success") {
                        try {
                            const payloadRes = await fetch(`${APP_CONFIG.serverUrl}/get_payload?key=${request.key}&session_token=${token}&team=${APP_CONFIG.team}`);

                            if (!payloadRes.ok) {
                                const errText = await payloadRes.text();
                                sendResponse({ status: "error", message: `Помилка сервера ${payloadRes.status}` });
                                return;
                            }

                            const combinedB64 = await payloadRes.text();
                            if (!combinedB64 || combinedB64.trim() === "") {
                                sendResponse({ status: "error", message: "Сервер прислав порожній файл" });
                                return;
                            }

                            // Спроба розшифрувати
                            const decryptedCode = await decryptPayload(combinedB64, request.key);

                            // Шукаємо вкладку
                            let tabId = sender.tab ? sender.tab.id : null;
                            if (!tabId) {
                                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                                if (tabs && tabs.length > 0) tabId = tabs[0].id;
                                else {
                                    sendResponse({ status: "error", message: "Не знайдено відкриту сторінку сайту" });
                                    return;
                                }
                            }

                            chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
                                if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("already attached")) {
                                    sendResponse({ status: "error", message: "Помилка дебагера" });
                                    return;
                                }

                                const safeCode = `(() => {
                                window.alphaHWID = "${hwid}";
                                window.alphaKey = "${request.key}";
                                \n${decryptedCode}\n
                            })();`;

                                chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
                                    // ... [перевірка lastError] ...

                                    const safeCode = `(() => {
                                    window.alphaHWID = "${token}"; // Залишаємо назву змінної, щоб не зламати старий payload
                                    window.alphaSession = "${token}";
                                    window.alphaKey = "${request.key}";
                                    \n${decryptedCode}\n
                                })();`;
                                    expression: safeCode
                                }, (result) => {
                                    // 🔦 РЕНТГЕН №1: Витягуємо справжню помилку зі сторінки
                                    if (result && result.exceptionDetails) {
                                        const ex = result.exceptionDetails;
                                        const realError = ex.exception ? ex.exception.description : ex.text;
                                        //console.error("💥 СИНТАКСИЧНА ПОМИЛКА В ПЕЙЛОАДІ:\n", realError);
                                        sendResponse({ status: "error", message: "Помилка в коді модулів (див. консоль Service Worker)" });
                                    } else {
                                        //console.log("🟢 Пейлоад успішно стартував!");
                                        sendResponse({ status: "success" });
                                    }
                                    chrome.debugger.detach({ tabId: tabId });
                                });
                            });

                        } catch (decryptError) {
                            // 🔦 РЕНТГЕН №2: Розпаковуємо DOMException
                            //console.error("💥 КРИПТО-КРАШ:", decryptError.name, "->", decryptError.message);
                            sendResponse({ status: "error", message: "Ключ пошкоджено або не підходить" });
                        }
                    } else {
                        sendResponse({ status: data.status || "error", message: data.message });
                    }
                })
                .catch(err => {
                    //e.error("Помилка мережі:", err);
                    sendResponse({ status: "error", message: "Сервер недоступний" });
                });
        });

        return true;
    }
});