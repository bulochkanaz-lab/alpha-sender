// ==========================================
// MODULE: bday_radar.js (Радар Днів Народження)
// ==========================================

(function() {
    // 1. Додаємо стилі
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
            if (el.textContent.toLowerCase().includes(userName.toLowerCase())) {
                if (!el.querySelector('.alpha-bday-dot')) {
                    const dot = document.createElement('span');
                    dot.className = 'alpha-bday-dot';
                    dot.title = 'День народження протягом тижня!';
                    el.appendChild(dot);
                }
            }
        });
    }

    // 4. Ізольований перехоплювач Fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

            // Фільтруємо запити, які можуть містити список людей
            if (url.includes('/chatList') || url.includes('/userDetail')) {
                const clone = response.clone();

                clone.json().then(data => {
                    // РОЗУМНА ПЕРЕВІРКА: чи є в цьому масиві поле birthdate?
                    if (data && data.status && Array.isArray(data.response) && data.response.length > 0) {
                        if (data.response[0].birthdate !== undefined) {
                            // Якщо це реально список людей з датами - чекаємо 2 сек і малюємо
                            setTimeout(() => {
                                data.response.forEach(user => {
                                    if (isBirthdaySoon(user.birthdate)) {
                                        injectBirthdayDot(user.name);
                                    }
                                });
                            }, 2000);
                        }
                    }
                }).catch(() => {}); // Тихий ігнор
            }
        } catch(e) {} // Тихий ігнор

        return response;
    };
})();