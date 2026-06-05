// smart_search.js - Модуль розумного пошуку по чату

class SmartSearch {
    constructor() {
        this.modal = null;
        this.chatId = null;
        this.token = null;
        this.allMessages = [];
        this.highlights = []; // Зберігаємо всі знайдені елементи для стрілочок
        this.currentHighlightIndex = -1; // Поточне виділене слово
        this.init();
    }

    init() {
        this.modal = document.createElement("div");
        this.modal.id = "alpha-smart-search-modal";

        // Робимо вікно ВЕЛИКИМ і просторим
        this.modal.style.cssText = `
            position: fixed; top: 5vh; left: 50%; transform: translateX(-50%);
            width: 800px; max-width: 90vw; height: 90vh;
            background: #ffffff; z-index: 9999999; display: none;
            flex-direction: column; border-radius: 12px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.3); font-family: sans-serif;
            border: 1px solid #e0e0e0; overflow: hidden;
        `;

        this.modal.innerHTML = `
            <div style="display: flex; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee; background: #f5f6f8;">
                <input type="text" id="alpha-search-input" placeholder="Введіть слово для пошуку..." style="
                    flex-grow: 1; padding: 12px 20px; border: 1px solid #ccc;
                    border-radius: 20px; outline: none; font-size: 15px;
                ">

                <div style="display: flex; gap: 5px; margin-left: 15px;">
                    <button id="btn-search-up" style="padding: 8px 15px; cursor: pointer; border: 1px solid #ccc; background: #fff; border-radius: 6px; font-weight: bold;">↑</button>
                    <button id="btn-search-down" style="padding: 8px 15px; cursor: pointer; border: 1px solid #ccc; background: #fff; border-radius: 6px; font-weight: bold;">↓</button>
                </div>

                <span id="alpha-search-count" style="margin-left: 15px; font-size: 13px; color: #888;">0 / 0</span>

                <span id="alpha-search-close" style="
                    margin-left: 20px; cursor: pointer; font-size: 28px; color: #888; font-weight: bold; line-height: 1;
                ">&times;</span>
            </div>

            <div id="alpha-search-results" style="
                flex-grow: 1; overflow-y: auto; padding: 20px; background: #fff;
                display: flex; flex-direction: column; gap: 12px;
            ">
                </div>

            <div style="padding: 15px; border-top: 1px solid #eee; background: #f5f6f8; text-align: center;">
                <button id="btn-search-media" style="
                    padding: 12px 30px; cursor: pointer; border: none;
                    background: #1976d2; color: #fff; border-radius: 8px;
                    font-weight: bold; font-size: 15px; transition: background 0.2s;
                ">Шукати Контент (Фото / Відео / Аудіо)</button>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.attachEvents();
    }

    attachEvents() {
        this.modal.querySelector('#alpha-search-close').addEventListener('click', () => this.close());

        // Живий пошук при введенні тексту
        this.modal.querySelector('#alpha-search-input').addEventListener('input', (e) => {
            this.highlightText(e.target.value);
        });

        // Навігація стрілочками
        this.modal.querySelector('#btn-search-up').addEventListener('click', () => this.navigateHighlights(-1));
        this.modal.querySelector('#btn-search-down').addEventListener('click', () => this.navigateHighlights(1));

        // Кнопка медіа (заглушка під твій operatorMedia JSON)
        this.modal.querySelector('#btn-search-media').addEventListener('click', () => {
            alert("Тут ми підключимо викачку через operatorMedia!");
        });
    }

    // --- ЕТАП 1: ВИКАЧКА ІСТОРІЇ (Оновлено з сортуванням) ---
    async preloadHistory(chatId, token, progressCallback) {
        this.chatId = chatId;
        this.token = token;
        this.allMessages = [];

        const url = "https://alpha.date/api/chatList/chatHistory";
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 50) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ chat_id: this.chatId, page: page })
                });

                const data = await response.json();

                if (data.status === true && data.response && data.response.length > 0) {
                    this.allMessages = this.allMessages.concat(data.response);
                    page++;
                    progressCallback(Math.min(page * 5, 95));
                } else {
                    hasMore = false;
                }
            } catch (error) {
                console.error(`Помилка сторінки ${page}:`, error);
                hasMore = false;
            }
        }
        progressCallback(100);

        // ГОЛОВНИЙ ФІКС: Сортуємо ВСІ повідомлення за датою (від найстарішого до найновішого)
        this.allMessages.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));

        this.renderAllMessages();
    }

    // --- МАЛЮЄМО ВСІ ПОВІДОМЛЕННЯ (ТЕКСТ + МЕДІА) ---
    renderAllMessages() {
        const resultsDiv = this.modal.querySelector('#alpha-search-results');
        resultsDiv.innerHTML = "";

        this.allMessages.forEach(msg => {
            // Пропускаємо порожні повідомлення
            if (!msg.message_type) return;

            let contentHtml = "";

            // 1. Якщо це ТЕКСТ
            if (msg.message_type === "SENT_TEXT" && msg.message_content) {
                contentHtml = `<div class="alpha-msg-text">${msg.message_content}</div>`;
            }
            // 2. Якщо це ФОТО
            else if (msg.message_type === "SENT_IMAGE") {
                // Використовуємо прев'ю (message_thumb), якщо є, інакше оригінал
                const imgSrc = msg.message_thumb || msg.message_content;
                if (!imgSrc) return;

                // Атрибут loading="lazy" - це наша магія оптимізації!
                contentHtml = `
                    <div style="margin-top: 5px;">
                        <img src="${imgSrc}" loading="lazy" style="max-width: 250px; max-height: 250px; border-radius: 6px; border: 1px solid #ddd; object-fit: cover;">
                    </div>
                `;
            }
            // 3. Якщо це ВІДЕО
            else if (msg.message_type === "SENT_VIDEO") {
                const thumbSrc = msg.thumb_link || "https://via.placeholder.com/250x250?text=Відео";

                contentHtml = `
                    <div style="margin-top: 5px; position: relative; display: inline-block; cursor: pointer;" title="Відкрити відео">
                        <img src="${thumbSrc}" loading="lazy" style="max-width: 250px; max-height: 250px; border-radius: 6px; border: 1px solid #ddd; object-fit: cover; filter: brightness(0.7);">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px; opacity: 0.9;">▶️</div>
                    </div>
                `;
            }
            // Якщо якийсь інший тип (аудіо/стікери) - поки пропускаємо
            else {
                return;
            }

            const msgBox = document.createElement('div');
            const isMan = msg.is_male === 1;

            msgBox.style.cssText = `
                padding: 12px 16px; border-radius: 8px; max-width: 85%;
                font-size: 14px; line-height: 1.5;
                background-color: #f5f6f8; border: 1px solid #e0e0e0;
                align-self: ${isMan ? 'flex-start' : 'flex-end'};
                color: #333; position: relative;
            `;

            const date = new Date(msg.date_created).toLocaleDateString('uk-UA', {hour: '2-digit', minute:'2-digit'});

            msgBox.innerHTML = `
                <div style="font-weight:bold; font-size:12px; margin-bottom:5px; color: #888;">
                    ${isMan ? '👨 Клієнт' : '👩 Анкета'} <span style="font-weight:normal; margin-left:10px;">${date}</span>
                </div>
                ${contentHtml}
            `;
            resultsDiv.appendChild(msgBox);
        });

        // Скролимо в самий низ
        // Використовуємо setTimeout, щоб дати браузеру частку секунди на прорахунок висоти картинок
        setTimeout(() => {
            resultsDiv.scrollTop = resultsDiv.scrollHeight;
        }, 100);
    }

    // --- ЕТАП 2: ВІДКРИТТЯ ВІКНА ---
    open() {
        this.modal.style.display = "flex";
        this.modal.querySelector('#alpha-search-input').focus();
    }

    close() {
        this.modal.style.display = "none";
    }

    // --- ЛОГІКА ЖИВОГО ПОШУКУ І ПІДСВІТКИ (Твоє побажання 3-Б і 4) ---
    highlightText(query) {
        const resultsDiv = this.modal.querySelector('#alpha-search-results');
        const textBlocks = resultsDiv.querySelectorAll('.alpha-msg-text');

        this.highlights = [];
        this.currentHighlightIndex = -1;

        // Знімаємо старе виділення і ставимо нове
        textBlocks.forEach(block => {
            // Очищаємо від старих <mark>
            let originalText = block.innerHTML.replace(/<mark[^>]*>|<\/mark>/gi, '');
            block.innerHTML = originalText;

            if (query.trim().length >= 2) {
                const regex = new RegExp(`(${query})`, 'gi');
                if (regex.test(originalText)) {
                    // Заміняємо знайдений текст на синій блок
                    block.innerHTML = originalText.replace(regex, `<mark class="alpha-highlight" style="background-color: #1976d2; color: #fff; border-radius: 3px; padding: 0 2px;">$1</mark>`);
                }
            }
        });

        // Збираємо всі створені елементи <mark> в масив для стрілочок
        this.highlights = Array.from(resultsDiv.querySelectorAll('.alpha-highlight'));
        this.updateCounter();

        // Якщо щось знайшли - одразу стрибаємо до першого результату
        if (this.highlights.length > 0) {
            this.navigateHighlights(1);
        }
    }

    navigateHighlights(direction) {
        if (this.highlights.length === 0) return;

        // Знімаємо червоний контур з попереднього активного слова
        if (this.currentHighlightIndex >= 0) {
            this.highlights[this.currentHighlightIndex].style.border = "none";
        }

        // Рухаємо індекс
        this.currentHighlightIndex += direction;
        if (this.currentHighlightIndex >= this.highlights.length) this.currentHighlightIndex = 0;
        if (this.currentHighlightIndex < 0) this.currentHighlightIndex = this.highlights.length - 1;

        const targetEl = this.highlights[this.currentHighlightIndex];

        // Виділяємо поточне слово (щоб розуміти, де ми зараз)
        targetEl.style.border = "2px solid #ff9800";

        // Плавний скрол до цього слова!
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.updateCounter();
    }

    updateCounter() {
        const countSpan = this.modal.querySelector('#alpha-search-count');
        if (this.highlights.length === 0) {
            countSpan.innerText = "0 / 0";
        } else {
            countSpan.innerText = `${this.currentHighlightIndex + 1} / ${this.highlights.length}`;
        }
    }
}

window.alphaSmartSearch = new SmartSearch();