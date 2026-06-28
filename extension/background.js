importScripts('config.js');

async function getHardwareFingerprint() {
    const data = [
        navigator.hardwareConcurrency || 'unknown', // Ядра
        navigator.userAgent || 'unknown',           // Браузер та ОС
        navigator.language || 'unknown',            // Мова системи
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown' // Часовий пояс
    ].join('||');

    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex.substring(0, 16);
}

// ОНОВЛЕНА функція для отримання або створення надійного HWID
async function getOrGenerateHWID() {
    // 1. Отримуємо динамічний відбиток заліза при КОЖНОМУ запуску
    const hwFingerprint = await getHardwareFingerprint();

    // 2. Отримуємо або створюємо статичний UUID профілю браузера
    return new Promise((resolve) => {
        chrome.storage.local.get(['base_uuid'], function(result) {
            let baseUuid = result.base_uuid;

            if (!baseUuid) {
                // Якщо запускаємо вперше - генеруємо унікальний ідентифікатор
                baseUuid = crypto.randomUUID();
                chrome.storage.local.set({base_uuid: baseUuid});
            }

            // 3. Склеюємо відбиток і UUID
            // Наприклад: a1b2c3d4e5f6g7h8_123e4567-e89b-12d3-a456-426614174000
            const finalHWID = `${hwFingerprint}_${baseUuid}`;
            resolve(finalHWID);
        });
    });
}

async function decryptPayload(combinedB64, accessKey) {
    // 🛡️ КРИТИЧНО: Очищаємо ключ ПРИМУСОВО точно так само, як Python!
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
        const SERVER_URL = "http://178.105.190.180:8001";

        getOrGenerateHWID().then(hwid => {
            fetch(`${SERVER_URL}/heartbeat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    access_key: request.key,
                    hwid: hwid,
                    profiles: request.profiles,
                    stats_invites: request.stats_invites || 0, // <-- Додали
                    stats_letters: request.stats_letters || 0  // <-- Додали
                    //team: "fs"
                })
            })
                .then(res => res.json())
                .then(data => {
                    // Якщо сервер відповів, що ключ в бані - кажемо content.js показати Alert
                    if (data.status === "banned" || data.status === 403) {
                        chrome.tabs.sendMessage(sender.tab.id, { action: "banned" });
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

        console.log(`[🚀 КЛІЄНТ] Відправка аналітики на ${targetUrl}`);

        fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.data)
        })
            .then(async res => {
                const status = res.status;
                const text = await res.text();
                console.log(`[📥 ВІДПОВІДЬ] Статус: ${status}. Відповідь:`, text);
            })
            .catch(err => console.error("❌ [КЛІЄНТ] Помилка мережі (Аналітика):", err));

        sendResponse({ status: "ok" });
        return true;
    }

    if (request.action === "validateAndLoad") {
        const SERVER_URL = "http://178.105.190.180:8001";

        getOrGenerateHWID().then(hwid => {
            fetch(`${SERVER_URL}/auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    access_key: request.key,
                    profiles: request.profiles,
                    hwid: hwid
                })
            })
                .then(res => res.json())
                .then(async data => {
                    if (data.status === "success") {
                        try {
                            const payloadRes = await fetch(`${SERVER_URL}/get_payload?key=${request.key}&hwid=${hwid}`);

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

                                chrome.debugger.sendCommand({ tabId: tabId }, "Runtime.evaluate", {
                                    expression: safeCode
                                }, (result) => {
                                    // 🔦 РЕНТГЕН №1: Витягуємо справжню помилку зі сторінки
                                    if (result && result.exceptionDetails) {
                                        const ex = result.exceptionDetails;
                                        const realError = ex.exception ? ex.exception.description : ex.text;
                                        console.error("💥 СИНТАКСИЧНА ПОМИЛКА В ПЕЙЛОАДІ:\n", realError);
                                        sendResponse({ status: "error", message: "Помилка в коді модулів (див. консоль Service Worker)" });
                                    } else {
                                        console.log("🟢 Пейлоад успішно стартував!");
                                        sendResponse({ status: "success" });
                                    }
                                    chrome.debugger.detach({ tabId: tabId });
                                });
                            });

                        } catch (decryptError) {
                            // 🔦 РЕНТГЕН №2: Розпаковуємо DOMException
                            console.error("💥 КРИПТО-КРАШ:", decryptError.name, "->", decryptError.message);
                            sendResponse({ status: "error", message: "Ключ пошкоджено або не підходить" });
                        }
                    } else {
                        sendResponse({ status: data.status || "error", message: data.message });
                    }
                })
                .catch(err => {
                    console.error("Помилка мережі:", err);
                    sendResponse({ status: "error", message: "Сервер недоступний" });
                });
        });

        return true;
    }
});