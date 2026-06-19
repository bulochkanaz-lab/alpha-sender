// Виправлена функція: збираємо тільки те, що доступно у Service Worker
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

// Функція дешифрування Payload'у на льоту
// Функція дешифрування Payload'у на льоту
async function decryptPayload(combinedB64, accessKey) {
    // 1. Створюємо ключ
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(accessKey));
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyMaterial, 'AES-GCM', false, ['decrypt']
    );

    // 2. Декодуємо Base64
    const decodeB64 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
    const combined = decodeB64(combinedB64);

    // 3. Розділяємо Nonce (перші 12 байт) і Ciphertext (все інше)
    const nonce = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // 4. Розшифровуємо
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
    console.log("[Background] Отримано sendAnalytics. action:", request.data?.action, "chat_uid:", request.data?.chat_uid);

    const backendUrl = 'http://178.105.190.180:8001/api/analytics/log_invite';

    fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.data)
    })
        .then(res => res.json().catch(() => ({})))
        .then(result => {
            console.log("[Background] Відповідь бекенду на аналітику:", result);
        })
        .catch(err => {
            console.error("[Background] Помилка відправки аналітики на бекенд:", err);
        });

    sendResponse({ status: "ok" });
    return true;
}

    if (request.action === "validateAndLoad") {
        const SERVER_URL = "http://178.105.190.180:8001"; // ТЕСТОВИЙ СЕРВЕР

        // Спочатку отримуємо HWID, а потім робимо запит
        getOrGenerateHWID().then(hwid => {
            // Крок 1. Авторизація
            fetch(`${SERVER_URL}/auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    access_key: request.key,
                    profiles: request.profiles,
                    hwid: hwid,
                    //team: "fs"
                })
            })
                .then(res => res.json())
                .then(async data => {
                    if (data.status === "success") {
                        try {
                            // Крок 2. Отримуємо зашифрований код
                            const payloadRes = await fetch(`${SERVER_URL}/get_payload?key=${request.key}&hwid=${hwid}`); // ДОДАНО &team=fs
                            const combinedB64 = await payloadRes.text();

                            // Крок 3. ДЕШИФРУВАННЯ КОДУ У ПАМ'ЯТІ
                            const decryptedCode = await decryptPayload(combinedB64, request.key);

                            const tabId = sender.tab.id;
                            chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
                                if (chrome.runtime.lastError && !chrome.runtime.lastError.message.includes("already attached")) {
                                    console.error("Помилка дебаггера:", chrome.runtime.lastError.message);
                                    sendResponse({ status: "error", message: "Помилка запуску ядра" });
                                    return;
                                }

                                // Передаємо hwid та ключ глобально
                                const safeCode = `(() => { 
                                    window.alphaHWID = "${hwid}"; 
                                    window.alphaKey = "${request.key}";
                                    \n${decryptedCode}\n
                                })();`;

                                chrome.debugger.sendCommand({ tabId: tabId }, "Runtime.evaluate", {
                                    expression: safeCode
                                }, (result) => {
                                    if (result && result.exceptionDetails) {
                                        console.error("Помилка в Payload:", result.exceptionDetails);
                                    }
                                    chrome.debugger.detach({ tabId: tabId });
                                    sendResponse({ status: "success" });
                                });
                            });
                        } catch (decryptError) {
                            console.error("Помилка Payload:", decryptError);
                            sendResponse({ status: "error", message: "Помилка цілісності коду" });
                        }
                    } else {
                        sendResponse({ status: data.status || "error", message: data.message });
                    }
                })
                .catch(err => {
                    console.error("Помилка з'єднання фону з сервером:", err);
                    sendResponse({ status: "error", message: "Сервер недоступний" });
                });
        });

        return true;
    }
});