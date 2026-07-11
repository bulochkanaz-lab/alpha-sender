// ==========================================
// Модуль: ID Search (Пошук по дублікатах)
// ==========================================

(function() {
    // 1. Допоміжна функція для "сну" (Jitter)
    const sleep = (min, max) => {
        const ms = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, ms));
    };

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
            SEARCH: String(userId), // Передаємо ID сюди
            blockedByMan: 0,
            blockedByWoman: 0,
            showHidden: 0
        };

        try {
            // Використовуємо поточний токен сайту, який у нас лежить в localStorage або куках.
            // Зазвичай фетч в розширенні підтягує куки автоматично, якщо робити його так:
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data && data.status && data.response) {
                return data.response; // Повертаємо масив чатів
            }
        } catch (error) {
            console.error(`[ID Search] Помилка пошуку для ID ${userId}:`, error);
        }
        return [];
    }

    // 3. Рендер чату в ліве меню
    function renderChatBlock(chatData) {
        // Знаходимо контейнер, куди будемо вставляти[cite: 2]
        const chatListContainer = document.querySelector('[data-testid="chat-list"] > div');
        if (!chatListContainer) return;

        // Перевіряємо чи такий чат вже не відмальований
        if (document.querySelector(`[data-testid="${chatData.chat_uid}"]`)) return;

        // Створюємо блок згідно з оригінальною версткою сайту[cite: 2]
        const chatHtml = `
        <div class="styles_clmn_2_chat_block_item__P6pxX styles_in_active__OJkLa" data-testid="${chatData.chat_uid}">
            <div class="styles_item_left_left__PUWD0 adb-chat-left-icons">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.99879 1.3423C1.82416 1.3423 1.65668 1.41167 1.5332 1.53515C1.40972 1.65864 1.34035 1.82611 1.34035 2.00074V9.33704L2.7657 7.91169C2.83516 7.84223 2.92936 7.80321 3.02759 7.80321H9.20043C9.37506 7.80321 9.54254 7.73384 9.66602 7.61036C9.7895 7.48688 9.85887 7.3194 9.85887 7.14477V2.00074C9.85887 1.82611 9.7895 1.65864 9.66602 1.53515C9.54254 1.41167 9.37506 1.3423 9.20043 1.3423H1.99879ZM1.00942 1.01137C1.27182 0.748975 1.6277 0.601562 1.99879 0.601562H9.20043C9.57152 0.601562 9.9274 0.748975 10.1898 1.01137C10.4522 1.27377 10.5996 1.62965 10.5996 2.00074V7.14477C10.5996 7.51586 10.4522 7.87174 10.1898 8.13414C9.9274 8.39654 9.57152 8.54395 9.20043 8.54395H3.18101L1.23187 10.4931C1.12595 10.599 0.966643 10.6307 0.828245 10.5734C0.689847 10.516 0.599609 10.381 0.599609 10.2312V2.00074C0.599609 1.62965 0.747022 1.27377 1.00942 1.01137Z" stroke="#6D9BA8" stroke-width="0.5"></path></svg>
            </div>
            <div class="styles_clmn_2_chat_block_item_left__8KCVx adb-chat-section-left">
                <!-- Заглушка для фото чоловіка -->
                <img alt="" class="styles_clmn_2_chat_block_item_left_photo__phMom" src="/static/media/profile_img_empty.0b3d6665cd1c1b51de71.jpg">
            </div>
            <div class="styles_clmn_2_chat_block_item_middle__CInYn adb-chat-section-middle">
                <div class="styles_clmn_2_chat_block_item_middle_top__ZcfwH">
                    <div class="styles_clmn_2_chat_block_item_middle_name__tLfnE notranslate" translate="no" lang="en">ID: ${chatData.male_id}</div>
                    <div class="styles_clmn_2_chat_block_item_middle_time__Y4gAN">
                        <div class="undefined "></div><span>Оновлено</span>
                    </div>
                </div>
                <div class="styles_clmn_2_chat_block_item_middle_text__K1Z2U ">Знайдено дублікат (Анкета: ${chatData.female_id})</div>
            </div>
        </div>`;

        // Вставляємо на самий початок списку
        chatListContainer.insertAdjacentHTML('afterbegin', chatHtml);
    }

    // 4. Логіка обробки натискання на нашу кнопку
    async function handleSearchAllDuplicates(idsArray, btnElement) {
        if (!idsArray || idsArray.length === 0) return;

        btnElement.innerText = "Шукаємо...";
        btnElement.style.pointerEvents = "none";
        btnElement.style.opacity = "0.7";

        console.log(`[ID Search] Починаємо пошук для ${idsArray.length} акаунтів...`);

        // Той самий цикл for...of, який зупиняється на sleep()
        for (const id of idsArray) {
            console.log(`[ID Search] Шукаємо чати для ID: ${id}`);

            const chats = await fetchChatsForId(id);

            if (chats.length > 0) {
                console.log(`[ID Search] Знайдено ${chats.length} чатів для ${id}`);
                // Рендеримо кожен знайдений чат
                chats.forEach(chat => renderChatBlock(chat));
            }

            // Рандомізований Jitter: спимо від 600 до 1500 мілісекунд перед наступним фетчем
            await sleep(600, 1500);
        }

        console.log("[ID Search] Пошук завершено!");
        btnElement.innerText = "Знайдено!";
        setTimeout(() => {
            btnElement.innerText = "Знайти всі чати";
            btnElement.style.pointerEvents = "auto";
            btnElement.style.opacity = "1";
        }, 3000);
    }

    // 5. Інжектор кнопки (MutationObserver)
    function injectDuplicateButton() {
        // Слідкуємо за появою меню зі списком дублікатів
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.addedNodes.length) {
                    // Шукаємо контейнер дублікатів, який щойно з'явився
                    const duplicatesContainer = document.querySelector('.styles_chat_head_complain_nav__qSuBe.styles_duplicates__XDN2H');

                    if (duplicatesContainer && !document.getElementById('alpha-search-all-dupes')) {
                        // Збираємо всі ID з посилань
                        const links = duplicatesContainer.querySelectorAll('.styles_chat-head-complain-link__6nydS');
                        const ids = Array.from(links).map(a => a.innerText.trim());

                        if (ids.length > 0) {
                            // Створюємо нашу кнопку
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

                            // Додаємо подію кліку
                            searchBtn.addEventListener('click', (e) => {
                                e.stopPropagation(); // Щоб меню не закрилося при кліку
                                handleSearchAllDuplicates(ids, searchBtn);
                            });

                            // Вставляємо кнопку в самий низ віконця
                            duplicatesContainer.appendChild(searchBtn);
                        }
                    }
                }
            }
        });

        // Запускаємо спостерігач на весь body
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Запускаємо інжектор при старті
    injectDuplicateButton();

})();