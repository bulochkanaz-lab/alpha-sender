
// Допоміжна функція для отримання активних анкет (щоб відправити їх на сервер)
async function getActiveProfiles() {

    try {

        let token = localStorage.getItem('token');

        if (!token) return [];

        token = token.replace(/^"|"$/g, '');



        const response = await fetch("https://alpha.date/api/operator/profiles", {

            method: "GET",

            headers: { "authorization": `Bearer ${token}` }

        });

        const data = await response.json();

        const profiles = Array.isArray(data) ? data : (data.response || data.data || []);



// Повертаємо масив ID лише онлайн анкет

        return profiles.filter(p => p.online === 1).map(p => p.external_id);

    } catch (error) {

        return [];

    }

}



// Функція для створення UI завантажувача

function injectLoaderUI() {

    if (document.getElementById('alpha-loader-overlay')) return;



    const overlay = document.createElement('div');

    overlay.id = 'alpha-loader-overlay';

    overlay.style.cssText = `

position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;

background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(4px);

z-index: 999999; display: none; align-items: center; justify-content: center;

`;



    const modal = document.createElement('div');

    modal.style.cssText = `

background: #ffffff; border-radius: 12px; display: flex; flex-direction: column;

color: #333333; width: 320px; font-family: 'Segoe UI', Tahoma, sans-serif;

box-shadow: 0 10px 30px rgba(0,100,200,0.15); border: 1px solid #e1e8ed; overflow: hidden;

`;



    modal.innerHTML = `

<div style="background: #f5f8fa; padding: 15px 20px; border-bottom: 1px solid #e1e8ed; display: flex; justify-content: space-between; align-items: center;">

<h3 style="margin: 0; color: #1976d2; font-size: 16px;">🔐 Активація Alpha Sender</h3>

<span id="loaderCloseBtn" style="cursor: pointer; font-size: 24px; color: #999; line-height: 1; font-weight: bold;">&times;</span>

</div>

<div style="padding: 20px; text-align: center;">

<p id="loaderStatusMsg" style="font-size: 13px; color: #666; margin-bottom: 15px;">Введіть ваш унікальний ключ доступу.</p>

<input type="text" id="loaderKeyInput" placeholder="Ваш ключ..." style="width: 100%; box-sizing: border-box; padding: 10px; border-radius: 5px; border: 1px solid #ccc; margin-bottom: 15px; text-align: center; font-weight: bold;">

<button id="loaderSubmitBtn" style="width: 100%; padding: 12px; background: #1976d2; color: white; border: none; border-radius: 5px; font-weight: bold; font-size: 14px; cursor: pointer;">Перевірити та Запустити</button>

</div>

`;



    overlay.appendChild(modal);

    document.body.appendChild(overlay);



    document.getElementById('loaderCloseBtn').onclick = () => overlay.style.display = 'none';

    document.getElementById('loaderSubmitBtn').onclick = () => {

        const key = document.getElementById('loaderKeyInput').value.trim();

        if(key) authenticateAndLoad(key);

    };

}



// Інтеграція кнопки в меню сайту

function injectLoaderButton() {

    const menuList = document.querySelector('[data-testid="bottom-menu-list"]');

    if (menuList && !document.getElementById('alpha-loader-menu-btn') && !document.getElementById('alpha-sender-menu-btn')) {

        const settingBtn = document.createElement('div');

        settingBtn.id = 'alpha-loader-menu-btn';



        const firstItem = menuList.querySelector('div');

        settingBtn.className = firstItem ? firstItem.className.split(' ')[0] : 'BottomMenu_clmn_1_bottom_menu_item__4xtik';



        settingBtn.innerText = '⚙️ Setting';

        settingBtn.style.cursor = 'pointer';



        settingBtn.onclick = () => {

            const overlay = document.getElementById('alpha-loader-overlay');

            if (overlay) overlay.style.display = 'flex';

        };



        menuList.appendChild(settingBtn);

    }

}



// Знищення UI завантажувача після успішного входу
function destroyLoaderUI() {
    const overlay = document.getElementById('alpha-loader-overlay');
    const btn = document.getElementById('alpha-loader-menu-btn');
    if (overlay) overlay.remove();
    if (btn) btn.remove();

    // ДОДАНО: Зупиняємо цикл створення старої кнопки
    if (window.loaderIntervalId) {
        clearInterval(window.loaderIntervalId);
    }
}



// ГОЛОВНА ЛОГІКА ЗАВАНТАЖУВАЧА (Оновлена для роботи з background.js)
async function authenticateAndLoad(accessKey) {
    const btn = document.getElementById('loaderSubmitBtn');
    const statusMsg = document.getElementById('loaderStatusMsg');

    if(btn) {
        btn.innerText = "Зв'язок з ядром...";
        btn.disabled = true;
        btn.style.background = "#999";
    }

    try {
        // 1. Отримуємо список анкет (це має робитися тут, бо тут є localStorage сайту)
        const activeProfiles = await getActiveProfiles();

        // 2. Відправляємо наказ нашому фоновому процесу (background.js)
        chrome.runtime.sendMessage({
            action: "validateAndLoad",
            key: accessKey,
            profiles: activeProfiles
        }, (response) => {

            // Якщо background.js не відповідає або сталася помилка з'єднання
            if (chrome.runtime.lastError) {
                if(statusMsg) {
                    statusMsg.style.color = "red";
                    statusMsg.innerText = "❌ Помилка зв'язку з фоновим процесом.";
                }
                resetLoaderButton(btn);
                return;
            }

            // Обробляємо відповідь від нашого background.js
            if (response && response.status === "success") {
                // Зберігаємо ключ
                localStorage.setItem('alphaAccessKey', accessKey);
                // Знищуємо UI. Далі запуск коду бере на себе background.js!
                destroyLoaderUI();
            } else if (response && (response.status === 403 || response.status === "banned")) {
                if(statusMsg) {
                    statusMsg.style.color = "red";
                    statusMsg.innerText = "⛔️ Ваш ключ заблоковано адміністратором!";
                }
                localStorage.removeItem('alphaAccessKey');
                resetLoaderButton(btn);
            } else {
                if(statusMsg) {
                    statusMsg.style.color = "red";
                    // ДОДАНО: Читаємо message, яке прислав background.js від сервера
                    statusMsg.innerText = `⚠️ ${response.message || "Помилка перевірки доступу"}`;
                }
                // Якщо помилка HWID або заблоковано, краще видалити збережений ключ
                localStorage.removeItem('alphaAccessKey');
                resetLoaderButton(btn);
            }
        });

    } catch (error) {
        if(statusMsg) {
            statusMsg.style.color = "red";
            statusMsg.innerText = "❌ Внутрішня помилка інтерфейсу.";
        }
        resetLoaderButton(btn);
    }
}

// Допоміжна функція для відновлення кнопки
function resetLoaderButton(btn) {
    if(btn) {
        btn.innerText = "Перевірити та Запустити";
        btn.disabled = false;
        btn.style.background = "#1976d2";
    }
}



// Ініціалізація
injectLoaderUI();
// ДОДАНО: Зберігаємо ID інтервалу у глобальну змінну, щоб потім його зупинити
window.loaderIntervalId = setInterval(injectLoaderButton, 500);

// Автоматична перевірка: ...



// Автоматична перевірка: якщо ключ вже збережений, пробуємо завантажити скрипт без відкриття меню

const savedKey = localStorage.getItem('alphaAccessKey');

if (savedKey) {

    document.getElementById('loaderKeyInput').value = savedKey;

    authenticateAndLoad(savedKey);

}

window.addEventListener("AlphaPing", (e) => {
    const data = e.detail;
    try {
        // Перевіряємо, чи не знищено контекст розширення
        if (!chrome || !chrome.runtime || !chrome.runtime.id) throw new Error("Context Invalidated");

        chrome.runtime.sendMessage({
            action: "sendPing",
            key: data.key,
            profiles: data.profiles,
            stats_invites: data.stats_invites, // <-- ДОДАЛИ
            stats_letters: data.stats_letters
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Фон не відповів:", chrome.runtime.lastError.message);
                window.dispatchEvent(new CustomEvent("AlphaBackgroundCrash"));
            }
        });
    } catch (err) {
        console.error("Критична втрата фону:", err);
        window.dispatchEvent(new CustomEvent("AlphaBackgroundCrash"));
    }
});

// Слухач для відправки аналітики (щоб обійти блокування HTTPS)
window.addEventListener("AlphaAnalyticsLog", (e) => {
    const data = e.detail;

    console.log("[Content] Отримано AlphaAnalyticsLog. action:", data?.action, "chat_uid:", data?.chat_uid);

    try {
        if (!chrome || !chrome.runtime || !chrome.runtime.id) {
            console.warn("[Content] chrome.runtime недоступний");
            return;
        }

        chrome.runtime.sendMessage({
            action: "sendAnalytics",
            data: data
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("[Content] Помилка sendMessage:", chrome.runtime.lastError.message);
            } else {
                console.log("[Content] Аналітика успішно відправлена у background");
            }
        });
    } catch (err) {
        console.error("[Content] Помилка відправки аналітики у фон:", err);
    }
});

// Слухаємо відповідь від фону (якщо ключ заблокували)
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "banned") {
        localStorage.removeItem('alphaAccessKey');
        alert("⛔️ Ваш ключ доступу або пристрій був заблокований адміністратором.");
        location.reload();
    }
});