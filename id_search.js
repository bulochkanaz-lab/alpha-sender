// ==========================================
// Модуль: ID Search (Пошук по дублікатах)
// ==========================================

(function() {
    // 1. Допоміжна функція для "сну" (Jitter - імітація людини)
    const sleep = (min, max) => {
        const ms = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    // Універсальний шукач токена (перевіряє найпопулярніші ключі в Local Storage)
    function getSiteToken() {
        // Якщо токен лежить десь інде, ти завжди зможеш сюди додати правильний ключ
        return localStorage.getItem('token') ||
               localStorage.getItem('access_token') ||
               localStorage.getItem('auth_token') ||
               localStorage.getItem('jwt') ||
               "";
    }

    // 2. Функція запиту до API
    async function fetchChatsForId(userId) {
        const url = 'https://alpha.date/api/chatList/chatListByUserID';
        const payload = {
            user_id: "",
            chat_uid: false,
            page: 1,
            freeze: false,
            limits: null,
            ONLINE_STATUS: 0,
            CHAT_TYPE: "DEFAULT",
            SEARCH: String(userId),
            blockedByMan: 0,
            blockedByWoman: 0,
            showHidden: 0
        };

        const token = getSiteToken();

        if (!token) {
            console.error("[ID Search] Токен не знайдено! Перевір Local Storage.");
            return [];
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // 👇 БЕРЕМО АВТОРИЗАЦІЮ ЯК У SMART_SEARCH 👇
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data && data.status && data.response) {
                return data.response;
            }
        } catch (error) {
            console.error(`[ID Search] Помилка пошуку для ID ${userId}:`, error);
        }
        return [];
    }

    // 3. Рендер чату в ліве меню
    function renderChatBlock(chatData) {
        const chatListContainer = document.querySelector('[data-testid="chat-list"] > div');
        if (!chatListContainer) return;

        // Щоб не дублювати чати, які вже є в списку
        if (document.querySelector(`[data-testid="${chatData.chat_uid}"]`)) return;

        const chatHtml = `
        <div class="styles_clmn_2_chat_block_item__P6pxX styles_in_active__OJkLa" data-testid="${chatData.chat_uid}">
            <div class="styles_item_left_left__PUWD0 adb-chat-left-icons">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.99879 1.3423C1.82416 1.3423 1.65668 1.41167 1.5332 1.53515C1.40972 1.65864 1.34035 1.82611 1.34035 2.00074V9.33704L2.7657 7.91169C2.83516 7.84223 2.92936 7.80321 3.02759 7.80321H9.20043C9.37506 7.80321 9.54254 7.73384 9.66602 7.61036C9.7895 7.48688 9.85887 7.3194 9.85887 7.14477V2.00074C9.85887 1.82611 9.7895 1.65864 9.66602 1.53515C9.54254 1.41167 9.37506 1.3423 9.20043 1.3423H1.99879ZM1.00942 1.01137C1.27182 0.748975 1.6277 0.601562 1.99879 0.601562H9.20043C9.57152 0.601562 9.9274 0.748975 10.1898 1.01137C10.4522 1.27377 10.5996 1.62965 10.5996 2.00074V7.14477C10.5996 7.51586 10.4522 7.87174 10.1898 8.13414C9.9274 8.39654 9.57152 8.54395 9.20043 8.54395H3.18101L1.23187 10.4931C1.12595 10.599 0.966643 10.6307 0.828245 10.5734C0.689847 10.516 0.599609 10.381 0.599609 10.2312V2.00074C0.599609 1.62965 0.747022 1.27377 1.00942 1.01137Z" stroke="#6D9BA8" stroke-width="0.5"></path></svg>
            </div>
            <div class="styles_clmn_2_chat_block_item_left__8KCVx adb-chat-section-left">
                <!-- Заглушка -->
                <img alt="" class="styles_clmn_2_chat_block_item_left_photo__phMom" src="/static/media/profile_img_empty.0b3d6665cd1c1b51de71.jpg">
            </div>
            <div class="styles_clmn_2_chat_block_item_middle__CInYn adb-chat-section-middle">
                <div class="styles_clmn_2_chat_block_item_middle_top__ZcfwH">
                    <div class="styles_clmn_2_chat_block_item_middle_name__tLfnE notranslate" translate="no" lang="en">ID: ${chatData.male_id}</div>
                    <div class="styles_clmn_2_chat_block_item_middle_time__Y4gAN">
                        <span>${new Date(chatData.updated_at).toLocaleDateString('uk-UA')}</span>
                    </div>
                </div>
                <div class="styles_clmn_2_chat_block_item_middle_text__K1Z2U ">Знайдено дублікат (Анкета: ${chatData.female_id})</div>
            </div>
        </div>`;

        chatListContainer.insertAdjacentHTML('afterbegin', chatHtml);
    }

    // 4. Логіка обробки натискання
    async function handleSearchAllDuplicates(idsArray, btnElement) {
        if (!idsArray || idsArray.length === 0) return;

        btnElement.innerText = "Шукаємо...";
        btnElement.style.pointerEvents = "none";
        btnElement.style.opacity = "0.7";

        console.log(`[ID Search] Починаємо пошук для ${idsArray.length} акаунтів...`);

        // Послідовний запит із затримкою
        for (const id of idsArray) {
            console.log(`[ID Search] Запит для ID: ${id}`);

            const chats = await fetchChatsForId(id);

            if (chats.length > 0) {
                console.log(`[ID Search] Знайдено ${chats.length} чатів для ${id}`);
                chats.forEach(chat => renderChatBlock(chat));
            }

            // Засинаємо на випадковий час від 700 до 1800 мс (імітуємо людину)
            await sleep(700, 1800);
        }

        console.log("[ID Search] Всі запити завершено!");
        btnElement.innerText = "Знайдено!";
        setTimeout(() => {
            btnElement.innerText = "Знайти всі чати";
            btnElement.style.pointerEvents = "auto";
            btnElement.style.opacity = "1";
        }, 3000);
    }

    // 5. Спостерігач за вікном
    function injectDuplicateButton() {
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const duplicatesContainer = document.querySelector('.styles_chat_head_complain_nav__qSuBe.styles_duplicates__XDN2H');

                    if (duplicatesContainer && !document.getElementById('alpha-search-all-dupes')) {
                        const links = duplicatesContainer.querySelectorAll('.styles_chat-head-complain-link__6nydS');
                        const ids = Array.from(links).map(a => a.innerText.trim());

                        if (ids.length > 0) {
                            const searchBtn = document.createElement('div');
                            searchBtn.id = 'alpha-search-all-dupes';
                            searchBtn.innerText = 'Знайти всі чати';
                            searchBtn.style.cssText = `
                                margin-top: 10px;
                                padding: 8px;
                                background: #6D9BA8;
                                color: white;
                                text-align: center;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                font-weight: bold;
                                transition: 0.2s;
                            `;

                            searchBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                handleSearchAllDuplicates(ids, searchBtn);
                            });

                            duplicatesContainer.appendChild(searchBtn);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    injectDuplicateButton();

})();