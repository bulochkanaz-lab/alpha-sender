// smart_search.js - Модуль розумного пошуку по чату та листам
class SmartSearch {
    constructor() {
        this.modal = null;
        this.chatId = null;
        this.token = null;

        // Розділяємо пам'ять
        this.chatMessages = [];
        this.mailMessages = [];
        this.chatLoaded = false;
        this.mailLoaded = false;

        this.currentTab = 'chat'; // 'chat' або 'mail'

        this.highlights = [];
        this.currentHighlightIndex = -1;
        this.isGalleryOpen = false;

        this.init();
    }

    init() {
        this.modal = document.createElement("div");
        this.modal.id = "alpha-smart-search-modal";

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
                <span id="alpha-search-close" style="margin-left: 20px; cursor: pointer; font-size: 28px; color: #888; font-weight: bold; line-height: 1;">&times;</span>
            </div>

            <div style="display: flex; background: #eceff1; border-bottom: 1px solid #ccc;">
                <button id="tab-btn-chat" class="alpha-tab-btn" style="
                    flex: 1; padding: 12px; border: none; background: #fff; font-weight: bold;
                    font-size: 15px; cursor: pointer; border-bottom: 3px solid #1976d2; color: #1976d2;
                ">💬 Чат</button>
                <button id="tab-btn-mail" class="alpha-tab-btn" style="
                    flex: 1; padding: 12px; border: none; background: transparent; font-weight: bold;
                    font-size: 15px; cursor: pointer; border-bottom: 3px solid transparent; color: #555;
                ">✉️ Листи (Завантажити)</button>
            </div>

            <div id="alpha-internal-loader" style="display: none; padding: 20px; text-align: center; color: #1976d2; font-weight: bold; background: #e3f2fd;">
                ⏳ Завантаження історії... (<span id="alpha-loader-percent">0</span>%)
            </div>

            <div id="alpha-search-results" style="
                flex-grow: 1; overflow-y: auto; padding: 20px; background: #fff;
                display: flex; flex-direction: column; gap: 12px;
            "></div>

            <div style="padding: 15px; border-top: 1px solid #eee; background: #f5f6f8; text-align: center;">
                <button id="btn-search-media" style="
                    padding: 12px 30px; cursor: pointer; border: none;
                    background: #1976d2; color: #fff; border-radius: 8px;
                    font-weight: bold; font-size: 15px; transition: background 0.2s;
                ">Шукати Контент у поточній вкладці</button>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.attachEvents();
    }

    attachEvents() {
        this.modal.querySelector('#alpha-search-close').addEventListener('click', () => this.close());

        this.modal.querySelector('#alpha-search-input').addEventListener('input', (e) => {
            if (this.isGalleryOpen) this.renderMessages();
            this.highlightText(e.target.value);
        });

        this.modal.querySelector('#btn-search-up').addEventListener('click', () => this.navigateHighlights(-1));
        this.modal.querySelector('#btn-search-down').addEventListener('click', () => this.navigateHighlights(1));

        this.modal.querySelector('#btn-search-media').addEventListener('click', () => {
            if (this.isGalleryOpen) this.renderMessages();
            else this.openGallery();
        });

        // Перемикання вкладок
        this.modal.querySelector('#tab-btn-chat').addEventListener('click', () => this.switchTab('chat'));
        this.modal.querySelector('#tab-btn-mail').addEventListener('click', () => this.switchTab('mail'));
    }

    // --- ГОЛОВНА ТОЧКА ВХОДУ (Тут ми вказуємо, звідки відкрили) ---
    // initialTab може бути 'chat' або 'mail'
    openWithContext(chatId, token, initialTab = 'chat') {
        this.chatId = chatId;
        this.token = token;

        // Скидаємо стан
        this.chatMessages = [];
        this.mailMessages = [];
        this.chatLoaded = false;
        this.mailLoaded = false;
        this.modal.querySelector('#alpha-search-input').value = "";

        this.modal.style.display = "flex";

        // Запускаємо перемикання на ту вкладку, з якої викликали
        this.switchTab(initialTab);
        this.modal.querySelector('#alpha-search-input').focus();
    }

    close() {
        this.modal.style.display = "none";
    }

    // --- ЛОГІКА ВКАЛОДОК ТА ДОЗАВАНТАЖЕННЯ ---
    async switchTab(tabName) {
        this.currentTab = tabName;

        // Оновлюємо дизайн вкладок
        const btnChat = this.modal.querySelector('#tab-btn-chat');
        const btnMail = this.modal.querySelector('#tab-btn-mail');

        if (tabName === 'chat') {
            btnChat.style.background = "#fff"; btnChat.style.borderBottom = "3px solid #1976d2"; btnChat.style.color = "#1976d2";
            btnMail.style.background = "transparent"; btnMail.style.borderBottom = "3px solid transparent"; btnMail.style.color = "#555";
            if (!this.chatLoaded) await this.downloadChatHistory();
        } else {
            btnMail.style.background = "#fff"; btnMail.style.borderBottom = "3px solid #1976d2"; btnMail.style.color = "#1976d2";
            btnChat.style.background = "transparent"; btnChat.style.borderBottom = "3px solid transparent"; btnChat.style.color = "#555";
            if (!this.mailLoaded) await this.downloadMailHistory();
        }

        // Оновлюємо текст на кнопках вкладок (щоб прибрати слово "Завантажити" якщо вже завантажено)
        btnChat.innerText = this.chatLoaded ? "💬 Чат" : "💬 Чат (Завантажити)";
        btnMail.innerText = this.mailLoaded ? "✉️ Листи" : "✉️ Листи (Завантажити)";

        this.renderMessages();

        // Якщо було введено текст - одразу шукаємо по новій вкладці
        const searchVal = this.modal.querySelector('#alpha-search-input').value;
        if (searchVal) this.highlightText(searchVal);
    }

    updateInternalProgress(percent) {
        this.modal.querySelector('#alpha-internal-loader').style.display = "block";
        this.modal.querySelector('#alpha-loader-percent').innerText = percent;
    }

    hideInternalProgress() {
        this.modal.querySelector('#alpha-internal-loader').style.display = "none";
    }

    // --- ЗАВАНТАЖЕННЯ ЧАТУ ---
    async downloadChatHistory() {
        this.modal.querySelector('#alpha-search-results').innerHTML = ""; // Очищаємо екран
        this.updateInternalProgress(0);

        let page = 1; let hasMore = true;
        while (hasMore && page <= 500) {
            try {
                const response = await fetch("https://alpha.date/api/chatList/chatHistory", {
                    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.token}` },
                    body: JSON.stringify({ chat_id: this.chatId, page: page })
                });
                const data = await response.json();
                if (data.status === true && data.response && data.response.length > 0) {
                    this.chatMessages = this.chatMessages.concat(data.response);
                    page++;
                    this.updateInternalProgress(Math.min(Math.floor(95 * (1 - Math.pow(0.9, page))), 95));
                } else {
                    hasMore = false;
                }
            } catch (e) { hasMore = false; }
        }
        this.chatMessages.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));
        this.chatLoaded = true;
        this.hideInternalProgress();
    }

    // --- ЗАВАНТАЖЕННЯ ЛИСТІВ ---
    async downloadMailHistory() {
        this.modal.querySelector('#alpha-search-results').innerHTML = "";
        this.updateInternalProgress(0);

        let page = 1; let hasMore = true;
        while (hasMore && page <= 500) {
            try {
                const response = await fetch("https://alpha.date/api/mailbox/mails", {
                    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.token}` },
                    body: JSON.stringify({ chat_uid: this.chatId, page: page })
                });
                const data = await response.json();
                const mailsList = data.response?.mails || [];

                if (mailsList.length > 0) {
                    mailsList.forEach(m => {
                        const mailObj = m.mail;
                        if (!mailObj) return;
                        const isMale = String(mailObj.sender_id) === String(mailObj.male_id) ? 1 : 0;
                        if (mailObj.message_content) {
                            this.mailMessages.push({
                                date_created: mailObj.date_created, message_type: "SENT_TEXT",
                                message_content: mailObj.message_content, is_male: isMale
                            });
                        }
                        if (m.attachments) {
                            Object.values(m.attachments).forEach(att => {
                                this.mailMessages.push({
                                    date_created: mailObj.date_created, message_type: att.message_type || "SENT_IMAGE",
                                    message_content: att.link || att.file_url, message_thumb: att.link || att.file_url,
                                    is_male: isMale
                                });
                            });
                        }
                    });
                    page++;
                    this.updateInternalProgress(Math.min(page * 5, 95));
                } else {
                    hasMore = false;
                }
            } catch (e) { hasMore = false; }
        }
        this.mailMessages.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));
        this.mailLoaded = true;
        this.hideInternalProgress();
    }

    // --- РЕНДЕР (Дивиться, яка вкладка активна) ---
    renderMessages() {
        this.isGalleryOpen = false;
        const mediaBtn = this.modal.querySelector('#btn-search-media');
        mediaBtn.innerText = "Шукати Контент у поточній вкладці";
        mediaBtn.style.background = "#1976d2";

        const resultsDiv = this.modal.querySelector('#alpha-search-results');
        resultsDiv.innerHTML = "";

        // Вибираємо масив залежно від вкладки
        const activeMessages = this.currentTab === 'chat' ? this.chatMessages : this.mailMessages;

        if (activeMessages.length === 0) {
            resultsDiv.innerHTML = `<div style="text-align:center; padding: 40px; color: #999;">Історія порожня.</div>`;
            return;
        }

        activeMessages.forEach((msg, index) => {
            if (!msg.message_type) return;

            let contentHtml = "";
            if (msg.message_type === "SENT_TEXT" && msg.message_content) {
                contentHtml = `<div class="alpha-msg-text">${msg.message_content}</div>`;
            } else if (msg.message_type === "SENT_IMAGE") {
                const imgSrc = msg.message_thumb || msg.message_content;
                if (!imgSrc) return;
                contentHtml = `<div style="margin-top: 5px;"><img src="${imgSrc}" loading="lazy" style="max-width: 250px; max-height: 250px; border-radius: 6px; border: 1px solid #ddd; object-fit: cover;"></div>`;
            } else if (msg.message_type === "SENT_VIDEO") {
                const thumbSrc = msg.thumb_link || "https://via.placeholder.com/250x250?text=Відео";
                contentHtml = `<div style="margin-top: 5px; position: relative; display: inline-block; cursor: pointer;"><img src="${thumbSrc}" loading="lazy" style="max-width: 250px; max-height: 250px; border-radius: 6px; border: 1px solid #ddd; object-fit: cover; filter: brightness(0.7);"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px; opacity: 0.9;">▶️</div></div>`;
            } else if (msg.message_type === "SENT_AUDIO") {
                const audioSrc = msg.message_content;
                if (!audioSrc) return;
                contentHtml = `<div style="margin-top: 5px; display: flex; flex-direction: column; gap: 5px;"><span style="font-size: 11px; color: #888;">🎵 Голосове повідомлення</span><audio controls preload="none" src="${audioSrc}" style="max-width: 250px; height: 35px; outline: none;"></audio></div>`;
            } else return;

            const msgBox = document.createElement('div');
            msgBox.id = `alpha-msg-${index}`;
            const isMan = msg.is_male === 1;

            msgBox.style.cssText = `
                padding: 12px 16px; border-radius: 8px; max-width: 85%; font-size: 14px; line-height: 1.5;
                background-color: #f5f6f8; border: 1px solid #e0e0e0;
                align-self: ${isMan ? 'flex-start' : 'flex-end'}; color: #333; position: relative;
            `;

            const date = new Date(msg.date_created).toLocaleDateString('uk-UA', {hour: '2-digit', minute:'2-digit'});
            msgBox.innerHTML = `<div style="font-weight:bold; font-size:12px; margin-bottom:5px; color: #888;">${isMan ? '👨 Мужик' : '👩 Анкета'} <span style="font-weight:normal; margin-left:10px;">${date}</span></div>${contentHtml}`;
            resultsDiv.appendChild(msgBox);
        });

        setTimeout(() => { resultsDiv.scrollTop = resultsDiv.scrollHeight; }, 100);
    }

    // --- ГАЛЕРЕЯ МЕДІА ---
    openGallery() {
        this.isGalleryOpen = true;
        const mediaBtn = this.modal.querySelector('#btn-search-media');
        mediaBtn.innerText = "⬅️ Повернутися";
        mediaBtn.style.background = "#757575";

        const resultsDiv = this.modal.querySelector('#alpha-search-results');
        resultsDiv.innerHTML = "";

        const activeMessages = this.currentTab === 'chat' ? this.chatMessages : this.mailMessages;
        const mediaMsgs = activeMessages.map((msg, index) => ({msg, index})).filter(item => ["SENT_IMAGE", "SENT_VIDEO", "SENT_AUDIO"].includes(item.msg.message_type));

        if (mediaMsgs.length === 0) {
            resultsDiv.innerHTML = `<div style="text-align:center; color:#999; margin-top:50px; font-size: 15px;">Немає медіафайлів.</div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; padding: 5px;`;

        mediaMsgs.forEach(item => {
            const isVideo = item.msg.message_type === "SENT_VIDEO";
            const isAudio = item.msg.message_type === "SENT_AUDIO";
            let thumbSrc = isVideo ? (item.msg.thumb_link || "https://via.placeholder.com/250x250?text=Відео") : isAudio ? "https://via.placeholder.com/250x250/e3f2fd/1976d2?text=Audio" : (item.msg.message_thumb || item.msg.message_content);

            const thumbDiv = document.createElement('div');
            thumbDiv.style.cssText = `position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid transparent; aspect-ratio: 1; background: #f5f6f8; display: flex; align-items: center; justify-content: center;`;
            thumbDiv.innerHTML = `<img src="${thumbSrc}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; ${(isVideo || isAudio) ? 'filter: brightness(0.7);' : ''}">${isVideo ? '<div style="position: absolute; font-size: 30px; opacity: 0.9;">▶️</div>' : ''}${isAudio ? '<div style="position: absolute; font-size: 40px; opacity: 0.9;">🎵</div>' : ''}`;

            thumbDiv.onclick = () => {
                this.renderMessages();
                setTimeout(() => {
                    const targetBlock = this.modal.querySelector(`#alpha-msg-${item.index}`);
                    if (targetBlock) {
                        targetBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetBlock.style.boxShadow = "0 0 20px rgba(25, 118, 210, 0.4)";
                        setTimeout(() => { targetBlock.style.boxShadow = "none"; }, 2000);
                    }
                }, 100);
            };
            grid.appendChild(thumbDiv);
        });
        resultsDiv.appendChild(grid);
    }

    highlightText(query) {
        const resultsDiv = this.modal.querySelector('#alpha-search-results');
        const textBlocks = resultsDiv.querySelectorAll('.alpha-msg-text');
        this.highlights = []; this.currentHighlightIndex = -1;

        textBlocks.forEach(block => {
            let originalText = block.innerHTML.replace(/<mark[^>]*>|<\/mark>/gi, '');
            block.innerHTML = originalText;
            if (query.trim().length >= 2) {
                const regex = new RegExp(`(${query})`, 'gi');
                if (regex.test(originalText)) {
                    block.innerHTML = originalText.replace(regex, `<mark class="alpha-highlight" style="background-color: #1976d2; color: #fff; border-radius: 3px; padding: 0 2px;">$1</mark>`);
                }
            }
        });
        this.highlights = Array.from(resultsDiv.querySelectorAll('.alpha-highlight'));
        this.updateCounter();
        if (this.highlights.length > 0) this.navigateHighlights(1);
    }

    navigateHighlights(direction) {
        if (this.highlights.length === 0) return;
        if (this.currentHighlightIndex >= 0) this.highlights[this.currentHighlightIndex].style.border = "none";
        this.currentHighlightIndex += direction;
        if (this.currentHighlightIndex >= this.highlights.length) this.currentHighlightIndex = 0;
        if (this.currentHighlightIndex < 0) this.currentHighlightIndex = this.highlights.length - 1;

        const targetEl = this.highlights[this.currentHighlightIndex];

        targetEl.style.border = "2px solid #ff9800";
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.updateCounter();
    }

    updateCounter() {
        const countSpan = this.modal.querySelector('#alpha-search-count');
        countSpan.innerText = this.highlights.length === 0 ? "0 / 0" : `${this.currentHighlightIndex + 1} / ${this.highlights.length}`;
    }
}

window.alphaSmartSearch = new SmartSearch();