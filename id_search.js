// ==========================================
// Модуль: ID Search (React-Гіпноз)
// ==========================================

(function() {
    // 1. Допоміжна функція для "сну" (Jitter - імітація людини)
    const sleep = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

    // Стан для нашого перехоплювача
    let duplicateState = {
        isActive: false,
        ids: [],
        onComplete: null
    };

    // 2. Перехоплювач (Monkey-patching) window.fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] ? args[0].url : '');

        // Якщо це запит пошуку чатів І ми активували перехоплювач
        if (duplicateState.isActive && url.includes('/api/chatList/chatListByUserID')) {
            console.log("🪄 [React-Гіпноз] Перехоплено запит React. Починаємо магію...");

            duplicateState.isActive = false; // Одразу вимикаємо, щоб наші власні запити йшли нормально

            const fetchOptions = args[1] || {};
            let parsedBody = {};
            try { parsedBody = JSON.parse(fetchOptions.body || '{}'); } catch(e) {}

            let allCombinedChats = [];

            // Проходимось по всіх ID з Jitter'ом
            for (let i = 0; i < duplicateState.ids.length; i++) {
                const currentId = duplicateState.ids[i];
                console.log(`[ID Search] Запит для ID: ${currentId} (${i + 1} з ${duplicateState.ids.length})`);

                // Підміняємо ID у пейлоаді
                parsedBody.SEARCH = String(currentId);
                const currentOptions = {
                    ...fetchOptions,
                    body: JSON.stringify(parsedBody)
                };

                try {
                    // Використовуємо ОРИГІНАЛЬНИЙ фетч з усіма заголовками та токенами React
                    const res = await originalFetch.call(window, url, currentOptions);
                    const data = await res.json();

                    if (data && data.status && data.response) {
                        // Додаємо знайдені чати до загального списку
                        allCombinedChats = allCombinedChats.concat(data.response);
                    }
                } catch (error) {
                    console.error(`[ID Search] Помилка для ${currentId}:`, error);
                }

                // Jitter: спимо перед наступним запитом (крім останнього)
                if (i < duplicateState.ids.length - 1) {
                    await sleep(700, 1800);
                }
            }

            console.log(`🪄 [React-Гіпноз] Всі запити виконано! Віддаємо Реакту масив з ${allCombinedChats.length} чатів.`);

            // Викликаємо колбек, щоб повернути кнопку в нормальний стан
            if (duplicateState.onComplete) duplicateState.onComplete();

            // 🔥 НАЙГОЛОВНІШЕ: Повертаємо Реакту підроблений Response
            return new Response(JSON.stringify({
                status: true,
                response: allCombinedChats
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Всі інші запити пропускаємо без змін
        return originalFetch.apply(this, args);
    };

    // 3. Функція імітації вводу та натискання для React
    function triggerReactHypnosis(idsArray, btnElement) {
        // Знаходимо інпут пошуку сайту
        const searchInput = document.querySelector('input[data-testid="idOrName"]');
        if (!searchInput) {
            alert("Не знайдено поле пошуку на сайті! Відкрийте панель чатів.");
            return;
        }

        // Знаходимо кнопку лупи поруч з інпутом
        const searchButton = searchInput.nextElementSibling;

        btnElement.innerText = "🪄 Гіпнотизуємо React...";
        btnElement.style.pointerEvents = "none";
        btnElement.style.opacity = "0.7";

        // Активуємо наш перехоплювач
        duplicateState.isActive = true;
        duplicateState.ids = idsArray;
        duplicateState.onComplete = () => {
            btnElement.innerText = "✅ Готово!";
            setTimeout(() => {
                btnElement.innerText = "Знайти всі чати";
                btnElement.style.pointerEvents = "auto";
                btnElement.style.opacity = "1";
            }, 3000);
        };

        // Секретна техніка React: міняємо значення інпуту через нативний setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(searchInput, idsArray[0]);

        // Симулюємо події, щоб React "побачив", що ми ввели текст
        console.log("🛠 [Дебаг] Інпут знайдено:", searchInput);
        console.log("🛠 [Дебаг] Кнопка знайдена:", searchButton);

        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Симулюємо натискання Enter прямо в інпуті (найбільш надійний спосіб для React)
        const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter'
        });
        searchInput.dispatchEvent(enterEvent);

        if (searchButton && searchButton.tagName.toLowerCase() === 'button') {
            console.log("🛠 [Дебаг] Пробуємо клікнути по кнопці...");
            searchButton.click();
            // Деякі React-кнопки реагують на mousedown/mouseup
            searchButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            searchButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }
    }

    // 4. Інжектор нашої кнопки під дублікатами
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
                                background: linear-gradient(135deg, #6D9BA8 0%, #4a7480 100%);
                                color: white;
                                text-align: center;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                font-weight: bold;
                                transition: 0.2s;
                                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                            `;

                            searchBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                triggerReactHypnosis(ids, searchBtn);
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