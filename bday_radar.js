// ==========================================
// MODULE: bday_radar.js (Радар Днів Народження)
// ==========================================

(function() {
    // 1. Додаємо стилі для миготливого кружка
    const style = document.createElement('style');
    style.innerHTML = `
    :root { --bday-color: #ff3b30; }
    .alpha-bday-dot {
        display: inline-block; width: 8px; height: 8px; background-color: var(--bday-color);
        border-radius: 50%; margin-left: 6px; vertical-align: middle; cursor: help;
        animation: alpha-pulse-dot 1.5s infinite;
    }
    .alpha-bday-num {
        display: inline-flex; align-items: center; justify-content: center;
        background-color: var(--bday-color); color: white; font-size: 10px; font-weight: bold;
        border-radius: 10px; padding: 1px 6px; margin-left: 6px; vertical-align: middle; cursor: help;
        animation: alpha-pulse-num 2s infinite;
    }
    @keyframes alpha-pulse-dot {
        0% { box-shadow: 0 0 0 0 var(--bday-color); }
        70% { box-shadow: 0 0 0 6px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
    }
    @keyframes alpha-pulse-num {
        0% { transform: scale(0.95); }
        50% { transform: scale(1.05); }
        100% { transform: scale(0.95); }
    }
    `;
    document.head.appendChild(style);

    function getBdaySettings() {
        const def = { enabled: true, type: "dot", stages: [{d:30, c:"#ffeb3b"}, {d:14, c:"#ff9800"}, {d:7, c:"#ff3b30"}] };
        try { return JSON.parse(localStorage.getItem("alpha_bday_config")) || def; } catch(e) { return def; }
    }

    function getDaysToBirthday(birthdateStr) {
        if (!birthdateStr) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const bdate = new Date(birthdateStr); bdate.setFullYear(today.getFullYear());
        let diffDays = Math.ceil((bdate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            bdate.setFullYear(today.getFullYear() + 1);
            diffDays = Math.ceil((bdate - today) / (1000 * 60 * 60 * 24));
        }
        return diffDays;
    }

    function injectBirthdayDot(userName, diffDays) {
        const settings = getBdaySettings();
        if (!settings.enabled) return;

        // Шукаємо правильний етап (колір) в залежності від днів
        let activeStage = null;
        for (let stage of settings.stages) {
            if (diffDays <= stage.d) activeStage = stage; // Оскільки вони відсортовані від більшого до меншого (30 -> 14 -> 7)
        }
        if (!activeStage) return; // Якщо днів більше, ніж максимальний етап — виходимо

        const nameElements = document.querySelectorAll('div[data-testid="man-name"]');
        nameElements.forEach(el => {
            if (el.textContent.toLowerCase().includes(userName.toLowerCase())) {
                if (!el.querySelector('.alpha-bday-dot') && !el.querySelector('.alpha-bday-num')) {
                    const elNode = document.createElement('span');
                    elNode.style.setProperty('--bday-color', activeStage.c); // Динамічний колір

                    if (settings.type === 'number') {
                        elNode.className = 'alpha-bday-num';
                        elNode.innerText = diffDays === 0 ? "Сьогодні!" : diffDays;
                    } else {
                        elNode.className = 'alpha-bday-dot';
                    }

                    elNode.title = `Днів до свята: ${diffDays}`;
                    el.appendChild(elNode);
                }
            }
        });
    }

    // 4. Спільна функція обробки даних (щоб не дублювати код)
    function processUserData(data) {
        if (data && data.status && Array.isArray(data.response)) {
            // Чекаємо 2 секунди, поки сайт відмалює контакти
            setTimeout(() => {
                data.response.forEach(user => {
                    const daysTo = getDaysToBirthday(user.birthdate);
                    if (daysTo !== null) {
                        injectBirthdayDot(user.name, daysTo);
                    }
                });
            }, 2000);
        }
    }

    // ==========================================
    // ПЕРЕХОПЛЮВАЧ №1: FETCH
    // ==========================================
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        try {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            if (url.includes('/api/chatList/userDetail')) {
                const clone = response.clone();
                clone.json().then(data => processUserData(data)).catch(() => {});
            }
        } catch(e) {}
        return response;
    };

    // ==========================================
    // ПЕРЕХОПЛЮВАЧ №2: XMLHttpRequest (XHR / Axios)
    // ==========================================
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this.addEventListener('load', function() {
            if (typeof url === 'string' && url.includes('/api/chatList/userDetail')) {
                try {
                    const data = JSON.parse(this.responseText);
                    processUserData(data);
                } catch (e) {}
            }
        });
        return originalXHR.apply(this, [method, url, ...rest]);
    };

    console.log("🛡️ [Радар ДН] Подвійний перехоплювач успішно активовано!");

    // ==========================================
    // 🥷 МАСКУВАННЯ ПЕРЕХОПЛЮВАЧІВ (.toString spoofing)
    // ==========================================
    const originalToString = Function.prototype.toString;
    Function.prototype.toString = function() {
        if (this === window.fetch) {
            return "function fetch() { [native code] }";
        }
        if (this === window.XMLHttpRequest.prototype.open) {
            return "function open() { [native code] }";
        }
        return originalToString.call(this);
    };

})();