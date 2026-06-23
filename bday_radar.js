// ==========================================
// MODULE: bday_radar.js (Радар Днів Народження)
// ==========================================

(function() {
    // 1. Додаємо стилі для миготливого кружка
    const style = document.createElement('style');
    style.innerHTML = `
    .alpha-bday-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: #ff3b30;
        border-radius: 50%;
        margin-left: 6px;
        box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
        animation: alpha-pulse 1.5s infinite;
        vertical-align: middle;
        cursor: help;
    }
    @keyframes alpha-pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 59, 48, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
    }
    `;
    document.head.appendChild(style);

    // 2. Логіка розрахунку днів
    function isBirthdaySoon(birthdateStr) {
        if (!birthdateStr) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bdate = new Date(birthdateStr);
        bdate.setFullYear(today.getFullYear());

        let diffTime = bdate - today;
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            bdate.setFullYear(today.getFullYear() + 1);
            diffTime = bdate - today;
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return diffDays >= 0 && diffDays <= 7;
    }

    // 3. Ін'єкція в HTML
    function injectBirthdayDot(userName) {
        const nameElements = document.querySelectorAll('div[data-testid="man-name"]');
        nameElements.forEach(el => {
            // Шукаємо ім'я і перевіряємо, чи немає там вже кружка
            if (el.textContent.toLowerCase().includes(userName.toLowerCase())) {
                if (!el.querySelector('.alpha-bday-dot')) {
                    console.log(`🎂 [Радар ДН] Знайдено іменинника: ${userName}! Малюємо кружок.`);
                    const dot = document.createElement('span');
                    dot.className = 'alpha-bday-dot';
                    dot.title = 'День народження протягом тижня!';
                    el.appendChild(dot);
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
                    if (isBirthdaySoon(user.birthdate)) {
                        injectBirthdayDot(user.name);
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
})();