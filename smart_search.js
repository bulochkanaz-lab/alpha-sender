// smart_search.js - Модуль розумного пошуку по чату

class SmartSearch {
    constructor() {
        this.modal = null;
        this.chatId = null;
        this.token = null;
        this.allMessages = []; // Тут зберігатимемо всю історію після викачування
        this.init();
    }

    init() {
        this.modal = document.createElement("div");
        this.modal.id = "alpha-smart-search-modal";

        this.modal.style.cssText = `
            position: fixed; top: 10%; left: 50%; transform: translateX(-50%);
            width: 400px; height: 80vh; max-height: 700px;
            background: #ffffff; z-index: 9999999; display: none;
            flex-direction: column; border-radius: 12px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.2); font-family: sans-serif;
            border: 1px solid #e0e0e0; overflow: hidden;
        `;

        this.modal.innerHTML = `
            <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee; background: #f9f9f9;">
                <input type="text" id="alpha-search-input" placeholder="Шукати в чаті..." style="
                    flex-grow: 1; padding: 10px 15px; border: 1px solid #ccc;
                    border-radius: 20px; outline: none; font-size: 14px;
                ">
                <span id="alpha-search-close" style="
                    margin-left: 15px; cursor: pointer; font-size: 24px; color: #888; font-weight: bold; line-height: 1;
                ">&times;</span>
            </div>

            <div id="alpha-search-results" style="
                flex-grow: 1; overflow-y: auto; padding: 15px; background: #fff;
                display: flex; flex-direction: column; gap: 10px;
            ">
                <div style="text-align: center; color: #999; margin-top: 50px; font-size: 14px;">
                    Введіть слово або виберіть медіа для пошуку
                </div>
            </div>

            <div style="display: flex; padding: 10px; border-top: 1px solid #eee; background: #f9f9f9; gap: 10px; justify-content: space-between;">
                <button id="btn-search-text" style="flex: 1; padding: 10px; cursor: pointer; border: none; background: #e3f2fd; color: #1976d2; border-radius: 8px; font-weight: bold;">Текст</button>
                <button id="btn-search-photo" style="flex: 1; padding: 10px; cursor: pointer; border: none; background: #f3e5f5; color: #7b1fa2; border-radius: 8px; font-weight: bold;">Фото</button>
                <button id="btn-search-video" style="flex: 1; padding: 10px; cursor: pointer; border: none; background: #e8f5e9; color: #388e3c; border-radius: 8px; font-weight: bold;">Відео</button>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.attachEvents();
    }

    attachEvents() {
        // Закриття
        this.modal.querySelector('#alpha-search-close').addEventListener('click', () => this.close());

        // Клік на кнопку "Текст" (або натискання Enter в полі вводу)
        const handleSearch = () => {
            const query = this.modal.querySelector('#alpha-search-input').value;
            this.startTextSearch(query);
        };

        this.modal.querySelector('#btn-search-text').addEventListener('click', handleSearch);
        this.modal.querySelector('#alpha-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        // Заглушка для фото
        this.modal.querySelector('#btn-search-photo').addEventListener('click', () => {
            const resultsDiv = this.modal.querySelector('#alpha-search-results');
            resultsDiv.innerHTML = `<div style="text-align:center; color:#7b1fa2;">Тут буде сітка з фотографіями...</div>`;
        });
    }

    // Відкриваємо вікно і ОДРАЗУ приймаємо chatId та токен від payload.js
    open(chatId, token) {
        this.chatId = chatId;
        this.token = token;
        this.allMessages = []; // Скидаємо стару історію перед новим пошуком

        // Очищаємо вікно до початкового стану
        this.modal.querySelector('#alpha-search-results').innerHTML = `
            <div style="text-align: center; color: #999; margin-top: 50px; font-size: 14px;">
                Введіть слово або виберіть медіа для пошуку
            </div>
        `;
        this.modal.querySelector('#alpha-search-input').value = "";

        this.modal.style.display = "flex";
        this.modal.querySelector('#alpha-search-input').focus();
    }

    close() {
        this.modal.style.display = "none";
    }

    // --- ФУНКЦІЯ ЗАВАНТАЖЕННЯ ІСТОРІЇ ---
    async fetchAllMessages() {
        const url = "https://alpha.date/api/chatList/chatHistory";
        let page = 1;
        let hasMore = true;
        this.allMessages = [];

        const resultsDiv = this.modal.querySelector('#alpha-search-results');
        resultsDiv.innerHTML = `<div style="text-align:center; color:#1976d2; margin-top:50px;">⏳ Завантажуємо історію чату...</div>`;

        while (hasMore && page <= 50) { // Запобіжник на 50 сторінок (це ~1000-2000 повідомлень)
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${this.token}` // Використовуємо наш збережений токен
                    },
                    body: JSON.stringify({ chat_id: this.chatId, page: page })
                });

                const data = await response.json();

                if (data.status === true && data.response && data.response.length > 0) {
                    this.allMessages = this.allMessages.concat(data.response);
                    page++;
                    resultsDiv.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px;">⏳ Завантажено сторінок: ${page - 1}...</div>`;
                } else {
                    hasMore = false;
                }
            } catch (error) {
                console.error(`❌ Помилка завантаження сторінки ${page}:`, error);
                hasMore = false;
            }
        }
        return this.allMessages;
    }

    // --- ЛОГІКА ТЕКСТОВОГО ПОШУКУ ---
    async startTextSearch(query) {
        if (!query.trim()) return;

        // Якщо історію ще не викачано для цього чату - викачуємо її один раз
        if (this.allMessages.length === 0) {
            await this.fetchAllMessages();
        }

        const resultsDiv = this.modal.querySelector('#alpha-search-results');
        resultsDiv.innerHTML = ""; // Очищаємо екран завантаження

        // Фільтруємо текстові повідомлення, які підходять під наш розумний пошук
        // (fuzzyMatch ми підключимо сюди на наступному кроці)
        const found = this.allMessages.filter(msg => {
            if (!msg.message_content || msg.message_type !== "SENT_TEXT") return false;
            return msg.message_content.toLowerCase().includes(query.toLowerCase()); // Поки звичайний пошук для тесту
        });

        if (found.length === 0) {
            resultsDiv.innerHTML = `<div style="text-align:center; color:#999; margin-top:30px;">Нічого не знайдено за запитом "${query}"</div>`;
            return;
        }

        // Відображаємо знайдені повідомлення в нашому міні-чаті
        found.forEach(msg => {
            const msgBox = document.createElement('div');

            // Визначаємо сторону (анкета чи чоловік)
            const isMan = msg.is_male === 1;

            msgBox.style.cssText = `
                padding: 10px;
                border-radius: 8px;
                max-width: 80%;
                font-size: 13px;
                line-height: 1.4;
                margin-bottom: 5px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                align-self: ${isMan ? 'flex-end' : 'flex-start'};
                background-color: ${isMan ? '#e3f2fd' : '#f5f5f5'};
                color: ${isMan ? '#0d47a1' : '#333'};
            `;

            // Красиво форматуємо дату створення
            const date = new Date(msg.date_created).toLocaleDateString('uk-UA', {hour: '2-digit', minute:'2-digit'});

            msgBox.innerHTML = `
                <div style="font-weight:bold; font-size:11px; margin-bottom:3px; color: #777;">
                    ${isMan ? 'Клієнт' : 'Анкета'} • <span style="font-weight:normal;">${date}</span>
                </div>
                <div>${msg.message_content}</div>
            `;
            resultsDiv.appendChild(msgBox);
        });
    }
}

// Глобальна змінна
window.alphaSmartSearch = new SmartSearch();