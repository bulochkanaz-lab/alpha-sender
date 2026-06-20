// ==========================================
// UI ІНТЕРФЕЙС (Візуал, кнопки, модальні вікна)
// ==========================================

function updatePopup(statusText, finished = false, currentProfileName = null) {
    const statusEl = document.getElementById("uiStatusText");
    const profileEl = document.getElementById("uiCurrentProfile");
    const startBtn = document.getElementById("uiStartBtn");
    const stopBtn = document.getElementById("uiStopBtn");

    if (statusEl) statusEl.innerText = statusText;
    if (profileEl && currentProfileName) profileEl.innerText = currentProfileName;
    if (finished && startBtn && stopBtn) {
        startBtn.style.display = "block";
        stopBtn.style.display = "none";
    }
}

function showVipNotification(name, id) {
    const popup = document.createElement("div");
    popup.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; background: #ffffff;
        border-left: 5px solid #ff9800; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        padding: 15px 20px; border-radius: 8px; z-index: 9999999;
        font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; flex-direction: column; gap: 5px;
        transform: translateX(150%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    `;
    popup.innerHTML = `
        <div style="font-size: 15px; font-weight: bold; color: #333;">‼️УВАГА‼️</div>
        <div style="font-size: 13px; color: #666;"><b>${name}</b> (${id}) щойно зайшов на сайт.</div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => (popup.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
       popup.style.transform = "translateX(150%)";
       setTimeout(() => popup.remove(), 400);
    }, 8000);
}

function showSystemAlert(title, text, color = "#4caf50") {
    const popup = document.createElement("div");
    popup.style.cssText = `
        position: fixed; bottom: 100px; right: 30px; background: #ffffff;
        border-left: 5px solid ${color}; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        padding: 15px 20px; border-radius: 8px; z-index: 9999999;
        font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; flex-direction: column; gap: 5px;
        transform: translateX(150%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    `;
    popup.innerHTML = `
        <div style="font-size: 15px; font-weight: bold; color: #333;">${title}</div>
        <div style="font-size: 13px; color: #666;">${text}</div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => (popup.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
       popup.style.transform = "translateX(150%)";
       setTimeout(() => popup.remove(), 400);
    }, 12000);
}

function injectBotUI() {
    if (document.getElementById("alpha-sender-overlay")) return;

    const styles = `
        #alpha-sender-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px); z-index: 999999; display: none; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, sans-serif; }
        .alpha-modal { width: 85vw; max-width: 1100px; height: 85vh; background: #ffffff; border-radius: 12px; display: flex; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.3); }
        .alpha-sidebar { width: 240px; background: #f8f9fa; border-right: 1px solid #e1e8ed; display: flex; flex-direction: column; flex-shrink: 0; }
        .alpha-sidebar-header { padding: 20px; border-bottom: 1px solid #e1e8ed; }
        .alpha-lang-switch { display: flex; gap: 12px; margin-top: 15px; font-size: 18px; user-select: none; }
        .alpha-nav { display: flex; flex-direction: column; padding: 15px 0; overflow-y: auto; flex-grow: 1; }
        .alpha-nav-btn { padding: 14px 20px; cursor: pointer; color: #555; font-weight: 600; font-size: 14px; display: flex; align-items: center; border-left: 4px solid transparent; transition: 0.2s; }
        .alpha-nav-btn:hover { background: #eef2f5; }
        .alpha-nav-btn.active { background: #e3f2fd; color: #1976d2; border-left-color: #1976d2; }
        .alpha-content { flex: 1; display: flex; flex-direction: column; background: #ffffff; position: relative; overflow: hidden; }
        .alpha-topbar { padding: 15px 25px; border-bottom: 1px solid #e1e8ed; display: flex; justify-content: space-between; align-items: center; background: #fff; z-index: 10; }
        .alpha-status-badges { display: flex; gap: 15px; font-size: 13px; background: #f5f8fa; padding: 8px 15px; border-radius: 6px; border: 1px solid #e1e8ed; }
        .alpha-close { cursor: pointer; font-size: 26px; color: #999; line-height: 1; font-weight: bold; transition: 0.2s; }
        .alpha-close:hover { color: #333; }
        .alpha-tab-area { padding: 25px; overflow-y: auto; flex: 1; }
        .alpha-row { display: flex; gap: 20px; margin-bottom: 20px; }
        .alpha-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .alpha-label { font-size: 12px; color: #666; font-weight: bold; }
        .alpha-input, .alpha-select, .alpha-textarea { width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #ccc; font-size: 13px; box-sizing: border-box; outline: none; transition: 0.2s; font-family: inherit; }
        .alpha-input:focus, .alpha-select:focus, .alpha-textarea:focus { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,0.1); }
        .alpha-textarea { height: 120px; resize: vertical; }
        .alpha-btn-primary { width: 100%; padding: 14px; background: #1976d2; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; }
        .alpha-btn-primary:hover { background: #1565c0; }
        .alpha-btn-danger { width: 100%; padding: 14px; background: #d32f2f; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; }
        .alpha-btn-success { width: 100%; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .alpha-toggle-wrapper { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e1e8ed; margin-bottom: 20px; }
        .alpha-toggle-track { position: relative; width: 44px; height: 24px; flex-shrink: 0; background-color: #ccc; border-radius: 24px; transition: .3s; }
        .alpha-toggle-knob { position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .alpha-toggle-track.active { background-color: #4caf50; }
        .alpha-toggle-track.active .alpha-toggle-knob { left: 23px; }
        .alpha-subtabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
        .alpha-subtab { flex: 1; text-align: center; padding: 10px; cursor: pointer; font-weight: bold; font-size: 13px; color: #666; transition: 0.2s; }
        .alpha-subtab.active { color: #1976d2; border-bottom: 2px solid #1976d2; margin-bottom: -2px; }
        .alpha-global-selector { position: relative; width: 280px; user-select: none; }
        .alpha-gs-btn { display: flex; align-items: center; gap: 12px; padding: 6px 12px; background: #f8f9fa; border: 1px solid #cdd5df; border-radius: 8px; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .alpha-gs-btn:hover { background: #fff; border-color: #1976d2; }
        .alpha-gs-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; background: #e1e8ed; flex-shrink: 0; border: 1px solid #ccc; }
        .alpha-gs-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .alpha-gs-name { font-size: 14px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
        .alpha-gs-id { font-size: 11px; color: #888; margin-top: 2px; }
        .alpha-gs-arrow { font-size: 12px; color: #999; transition: transform 0.3s; }
        .alpha-gs-dropdown { position: absolute; top: 100%; left: 0; width: 100%; margin-top: 8px; background: #fff; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid #e1e8ed; z-index: 9999; display: none; flex-direction: column; max-height: 450px; overflow: hidden; }
        .alpha-gs-search { padding: 10px; border-bottom: 1px solid #eee; background: #fdfdfd; }
        .alpha-gs-search input { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box; transition: 0.2s; }
        .alpha-gs-list { overflow-y: auto; flex: 1; padding: 5px 0; }
        .alpha-gs-item { display: flex; align-items: center; gap: 12px; padding: 10px 15px; cursor: pointer; transition: 0.15s; border-left: 3px solid transparent; }
        .alpha-gs-item:hover { background: #f5f8fa; border-left-color: #1976d2; }
        .alpha-gs-item.active { background: #e3f2fd; border-left-color: #1976d2; }
        .alpha-gs-item-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e1e8ed; }
        .alpha-md-container { display: flex; flex: 1; overflow: hidden; border: 1px solid #e1e8ed; border-radius: 8px; margin-top: 15px; }
        .alpha-wink-sidebar { width: 230px; background: #fafafa; border-right: 1px solid #e1e8ed; display: none; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
        .alpha-wink-content { flex: 1; display: flex; flex-direction: column; padding: 15px; background: #fff; overflow-y: auto; }
        .alpha-wp-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; cursor: pointer; border-bottom: 1px solid #e1e8ed; transition: 0.2s; }
        .alpha-wp-item:hover { background: #f0f4f8; }
        .alpha-wp-item.active { background: #e3f2fd; border-left: 4px solid #1976d2; padding-left: 8px; }
        .alpha-wp-text { font-size: 12px; color: #333; line-height: 1.4; flex: 1; margin-right: 10px; }
        .alpha-wp-badge { font-size: 10px; font-weight: bold; background: #e1e8ed; color: #666; padding: 3px 7px; border-radius: 12px; }
        .alpha-wp-badge.has-items { background: #4caf50; color: white; }
    `;

    const styleEl = document.createElement("style");
    styleEl.id = "alpha-core-styles";
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    const overlay = document.createElement("div");
    overlay.id = "alpha-sender-overlay";

    overlay.innerHTML = `
        <div class="alpha-modal">
            <div class="alpha-sidebar">
                <div class="alpha-sidebar-header">
                    <h3 data-lang="title" style="margin: 0; color: #1976d2; font-size: 18px;">⚙ Alpha Sender Pro</h3>
                    <div style="font-size: 11px; color: #999; font-style: italic; margin-top: 2px;">Vibro v1</div>
                    <div class="alpha-lang-switch">
                        <span id="langUaBtn" style="cursor: pointer; opacity: 1;" title="Українська">🇺🇦</span>
                        <span id="langRuBtn" style="cursor: pointer; opacity: 0.4;" title="Русский">🇷🇺</span>
                    </div>
                </div>

                <div class="alpha-nav">
                    <div id="tabBtnSettings" data-lang="tabSettings" class="alpha-nav-btn active">🚀 Розсилка</div>
                    <div id="tabBtnInvites" data-lang="tabInvites" class="alpha-nav-btn" style="display: none;">📩 Інвайти</div>
                    <div id="tabBtnLetters" data-lang="tabLetters" class="alpha-nav-btn" style="display: none;">📝 Листи</div>
                    <div id="tabBtnWinks" data-lang="tabWinks" class="alpha-nav-btn">😉 Вінки/Лайки</div>
                    <div id="tabBtnVip" data-lang="tabVip" class="alpha-nav-btn">Повідомлення</div>
                    <div id="tabBtnGallery" class="alpha-nav-btn">Галерея</div>
                    <div id="tabBtnStats" data-lang="tabStats" class="alpha-nav-btn">📊 Статистика</div>
                </div>
            </div>

            <div class="alpha-content">
                <div class="alpha-topbar">
                    <div class="alpha-global-selector" id="alphaGlobalSelector">
                        <div class="alpha-gs-btn" id="alphaGsBtn">
                            <img src="https://via.placeholder.com/40" class="alpha-gs-avatar" id="alphaGsAvatar">
                            <div class="alpha-gs-info">
                                <div class="alpha-gs-name" id="alphaGsName">Оберіть анкету</div>
                                <div class="alpha-gs-id" id="alphaGsId">Для налаштування текстів</div>
                            </div>
                            <div class="alpha-gs-arrow" id="alphaGsArrow">▼</div>
                        </div>

                        <div class="alpha-gs-dropdown" id="alphaGsDropdown">
                            <div class="alpha-gs-search">
                                <input type="text" id="alphaGsSearchInput" placeholder="Пошук за ім'ям або ID...">
                            </div>
                            <div class="alpha-gs-list" id="alphaGsList"></div>
                        </div>
                    </div>

                    <div class="alpha-status-badges">
                        <div><span data-lang="statusLabel">Бот:</span> <span id="uiStatusText" data-lang="statusWaiting" style="color: #666; font-weight: bold;">Очікування...</span></div>
                        <div style="width: 1px; background: #ccc; margin: 0 10px;"></div>
                        <div><span>В роботі:</span> <span id="uiCurrentProfile" style="color: #1976d2; font-weight: bold;">-</span></div>
                    </div>
                    <span id="uiCloseBtn" class="alpha-close">&times;</span>
                </div>

                <div class="alpha-tab-area">
                    <div id="tabContentSettings">
                        <label class="alpha-toggle-wrapper">
                            <div><div data-lang="useSiteToggleLabel" style="font-size: 14px; font-weight: bold; color: #333;">Інвайти/Листи з сендеру</div></div>
                            <div id="uiToggleTrack" class="alpha-toggle-track active">
                                <input type="checkbox" id="uiUseSiteToggle" checked style="display: none;">
                                <div id="uiToggleKnob" class="alpha-toggle-knob"></div>
                            </div>
                        </label>

                        <div class="alpha-row">
                            <div class="alpha-col">
                                <label data-lang="delayLabel" class="alpha-label">Затримка відправок (сек):</label>
                                <input type="number" id="uiDelay" class="alpha-input" value="4" min="1">
                            </div>
                            <div class="alpha-col">
                                <label data-lang="phaseDelayLabel" class="alpha-label">Пауза Інвайти/Листи (хв):</label>
                                <input type="number" id="uiPhaseDelay" class="alpha-input" value="2" min="0">
                            </div>
                            <div class="alpha-col">
                                <label data-lang="breakTimeLabel" class="alpha-label">Глобальна перерва (хв):</label>
                                <input type="number" id="uiBreakTime" class="alpha-input" value="10" min="5" max="60">
                            </div>
                        </div>

                        <div class="alpha-col" style="margin-bottom: 25px;">
                            <label data-lang="inviteModeLabel" class="alpha-label">Режим відправки інвайтів:</label>
                            <select id="uiInviteMode" class="alpha-select">
                                <option value="batch" data-lang="modeBatch">Усі разом</option>
                                <option value="loop" data-lang="modeLoop">По одному на коло</option>
                            </select>
                        </div>

                        <button id="uiStartBtn" data-lang="btnStart" class="alpha-btn-primary">▶ Почати розсилку</button>
                        <button id="uiStopBtn" data-lang="btnStop" class="alpha-btn-danger" style="display: none;">⏹ Зупинити</button>
                    </div>

                    <div id="tabContentInvites" style="display: none;">
                        <select id="invitesProfileSelect" style="display: none;"></select>
                        <div id="invitesWorkArea" style="display: none; flex-direction: column;">
                            <textarea id="invitesMessageInput" data-lang="invitesPlaceholder" class="alpha-textarea" placeholder="Текст інвайту..." style="margin-bottom: 15px;"></textarea>
                            <button id="invitesSaveBtn" data-lang="invitesSaveBtn" class="alpha-btn-success" style="margin-bottom: 20px;">💾 Зберегти Інвайт</button>
                            <div id="invitesSavedList" style="display: flex; flex-direction: column; max-height: 350px; overflow-y: auto;"></div>
                        </div>
                        <div id="invitesEmptyState" data-lang="invitesEmpty" style="text-align: center; color: #999; margin-top: 40px;">Оберіть анкету зверху, щоб додати інвайти</div>
                    </div>

                    <div id="tabContentLetters" style="display: none;">
                        <select id="lettersProfileSelect" style="display: none;"></select>
                        <div id="lettersWorkArea" style="display: none; flex-direction: column;">
                            <textarea id="lettersMessageInput" data-lang="lettersPlaceholder" class="alpha-textarea" placeholder="Текст листа..." style="margin-bottom: 15px;"></textarea>
                            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                                <button id="lettersGalleryBtn" style="width: 50px; border-radius: 6px; border: 1px solid #ccc; background: #f8f9fa; cursor: pointer; font-size: 20px; transition: .2s;">📷</button>
                                <button id="lettersSaveBtn" data-lang="lettersSaveBtn" class="alpha-btn-success">💾 Зберегти Лист</button>
                            </div>
                            <div id="lettersSavedList" style="display: flex; flex-direction: column; max-height: 300px; overflow-y: auto;"></div>
                        </div>
                        <div id="lettersEmptyState" data-lang="lettersEmpty" style="text-align: center; color: #999; margin-top: 40px;">Оберіть анкету зверху, щоб додати листи</div>
                    </div>

                    <div id="tabContentWinks" style="display: none; flex-direction: column; height: 100%;">
                        <select id="respProfileSelect" style="display: none;"></select>
                        <div id="respTabsArea" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
                            <div class="alpha-subtabs" style="margin-bottom: 0;">
                                <div id="respTabLike" data-lang="respTabLike" class="alpha-subtab active">Лайки</div>
                                <div id="respTabWink" data-lang="respTabWink" class="alpha-subtab">Вінки</div>
                            </div>
                            <div class="alpha-md-container">
                                <div class="alpha-wink-sidebar" id="winkSidebar"></div>
                                <div class="alpha-wink-content">
                                    <div class="alpha-row" style="margin-bottom: 15px;">
                                        <div class="alpha-col" style="flex: 2;">
                                            <textarea id="respMessageInput" data-lang="respPlaceholder" class="alpha-textarea" placeholder="Введіть текст відповіді..." style="height: 95px;"></textarea>
                                        </div>
                                        <div class="alpha-col" style="flex: 1; border-left: 1px solid #eee; padding-left: 15px;">
                                            <label data-lang="respSpeedLabel" class="alpha-label">Швидкість (сек):</label>
                                            <input type="number" id="respSpeedInput" class="alpha-input" value="3" min="0" max="10">
                                            <button id="respSaveBtn" data-lang="respSaveBtn" class="alpha-btn-success" style="margin-top: auto;">Зберегти текст</button>
                                        </div>
                                    </div>
                                    <div style="font-weight: bold; margin: 10px 0; font-size: 13px; color: #555;" id="respListTitle">Збережені лайки:</div>
                                    <div id="respSavedList" style="display: flex; flex-direction: column; flex: 1; overflow-y: auto; padding-right: 5px;"></div>
                                </div>
                            </div>
                        </div>
                        <div id="respEmptyState" data-lang="respEmpty" style="text-align: center; color: #999; margin-top: 40px;">Оберіть анкету зверху, щоб додати тексти</div>
                    </div>

                    <div id="tabContentVip" style="display: none;">
                        <div style="padding: 20px; background: #fff3e0; border: 1px solid #ffe0b2; border-radius: 8px; margin-bottom: 25px;">
                            <div data-lang="vipTitle" style="font-size: 15px; font-weight: bold; color: #e65100;">🚨 VIP Сповіщення</div>
                            <div data-lang="vipSub" style="font-size: 13px; color: #666; margin-top: 5px;">Сповіщення про вхід працюють завжди. Авто-вимкнення анкети можна налаштувати для кожного мужика окремо.</div>
                        </div>
                        <div id="vipRulesArea" style="display: flex; flex-direction: column;">
                            <div data-lang="vipRulesLabel" style="font-size: 13px; font-weight: bold; color: #666; margin-bottom: 10px;">Налаштовані правила (Мужик ➔ Анкета):</div>
                            <div id="vipRulesList" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 10px;"></div>
                            <button id="vipAddRuleBtn" data-lang="vipAddRuleBtn" style="padding: 14px; background: #f0f4f8; color: #1976d2; border: 1px dashed #1976d2; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 20px; transition: 0.2s;">➕ Додати мужика</button>
                        </div>
                    </div>

                    <div id="tabContentGallery" style="display: none;">
                        <!-- Тут буде весь інтерфейс завантаження фото -->
                        <div style="padding: 20px;">
                            <h3 style="margin-bottom: 20px; color: #1976d2;">📷 Завантаження фото в галерею</h3>

                            <!-- Тут пізніше додамо селектор файлів, drag&drop, прогрес тощо -->
                            <div id="galleryDropZone" style="border: 2px dashed #1976d2; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 20px; background: #f8f9fa; cursor: pointer;">
                                <div style="font-size: 48px; margin-bottom: 10px;">📁</div>
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">Перетягніть фото сюди</div>
                                <div style="color: #666; margin-bottom: 15px;">або</div>
                                <button id="gallerySelectBtn" class="alpha-btn-primary" style="width: auto; padding: 12px 30px;">Обрати файли</button>
                                <input type="file" id="galleryFileInput" multiple accept="image/*" style="display: none;">
                            </div>

                            <!-- Прогрес -->
                            <div id="galleryProgressContainer" style="display: none; margin-bottom: 20px;">
                                <div style="margin-bottom: 8px; font-weight: bold;" id="galleryProgressText">Завантажено 0 з 0</div>
                                <div style="background: #e0e0e0; border-radius: 6px; height: 10px; overflow: hidden;">
                                    <div id="galleryProgressBar" style="height: 100%; background: #4caf50; width: 0%; transition: width 0.3s;"></div>
                                </div>
                            </div>

                            <!-- Лог помилок -->
                            <div id="galleryErrorLog" style="display: none; background: #fff3e0; border: 1px solid #ffe0b2; border-radius: 8px; padding: 15px; max-height: 200px; overflow-y: auto;">
                                <div style="font-weight: bold; margin-bottom: 10px; color: #e65100;">Помилки завантаження:</div>
                                <div id="galleryErrorList"></div>
                            </div>

                            <button id="galleryUploadBtn" class="alpha-btn-primary" style="margin-top: 20px; display: none;">▶ Почати завантаження</button>
                        </div>
                    </div>

                    <div id="tabContentStats" style="display: none;">
                        <div class="alpha-row">
                            <div class="alpha-col" style="background: #fff3e0; padding: 25px; border-radius: 8px; border: 1px solid #ffe0b2; text-align: center;">
                                <div data-lang="statsInvitesLabel" style="font-size: 13px; color: #e65100; font-weight: bold; text-transform: uppercase;">Надіслано інвайтів</div>
                                <div id="uiStatsInvites" style="font-size: 36px; font-weight: bold; color: #f57c00; margin-top: 10px;">0</div>
                            </div>
                            <div class="alpha-col" style="background: #e8f5e9; padding: 25px; border-radius: 8px; border: 1px solid #c8e6c9; text-align: center;">
                                <div data-lang="statsLettersLabel" style="font-size: 13px; color: #1b5e20; font-weight: bold; text-transform: uppercase;">Надіслано листів</div>
                                <div id="uiStatsLetters" style="font-size: 36px; font-weight: bold; color: #2e7d32; margin-top: 10px;">0</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const galleryModal = document.createElement("div");
    galleryModal.id = "alpha-gallery-modal";
    galleryModal.style.cssText = `position: fixed; top: 5%; left: 5%; width: 90vw; height: 90vh; background: rgba(255,255,255,0.98); z-index: 9999999; display: none; flex-direction: column; padding: 25px; box-sizing: border-box; border-radius: 12px; box-shadow: 0 15px 50px rgba(0,0,0,0.3);`;
    galleryModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h4 data-lang="galleryTitle" style="margin: 0; color: #1976d2; font-size: 22px;">Виберіть фото для листа</h4>
            <span id="closeGalleryBtn" style="cursor: pointer; font-size: 36px; color: #999; line-height: 1;">&times;</span>
        </div>
        <div id="galleryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; overflow-y: auto; flex-grow: 1; margin-bottom: 20px; align-content: start;"></div>
        <button id="confirmGalleryBtn" data-lang="galleryConfirmBtn" class="alpha-btn-success" style="font-size: 16px; padding: 15px;">Готово</button>
    `;

    overlay.appendChild(galleryModal);
    document.body.appendChild(overlay);

    setupUIEvents(overlay, galleryModal);
}

function setupUIEvents(overlay, galleryModal) {
    const tabs = [
       { btn: document.getElementById("tabBtnSettings"), content: document.getElementById("tabContentSettings") },
       { btn: document.getElementById("tabBtnInvites"), content: document.getElementById("tabContentInvites") },
       { btn: document.getElementById("tabBtnLetters"), content: document.getElementById("tabContentLetters") },
       { btn: document.getElementById("tabBtnWinks"), content: document.getElementById("tabContentWinks") },
       { btn: document.getElementById("tabBtnVip"), content: document.getElementById("tabContentVip") },
       { btn: document.getElementById("tabBtnGallery"), content: document.getElementById("tabContentGallery") },
       { btn: document.getElementById("tabBtnStats"), content: document.getElementById("tabContentStats") } // (це тепер індекс 6)
    ];

    function switchMainTab(activeTabBtn) {
       tabs.forEach((tab) => {
          tab.btn.classList.remove("active");
          tab.content.style.display = "none";
       });
       activeTabBtn.classList.add("active");
       const activeTab = tabs.find((t) => t.btn === activeTabBtn);
       if (activeTab) {
           if (activeTab.content.id === "tabContentWinks") activeTab.content.style.display = "flex";
           else activeTab.content.style.display = "block";
       }
    }

    // Оновлюємо прив'язку кліків з урахуванням нових індексів:
    tabs[0].btn.onclick = () => switchMainTab(tabs[0].btn);
    tabs[1].btn.onclick = () => switchMainTab(tabs[1].btn);
    tabs[2].btn.onclick = () => switchMainTab(tabs[2].btn);
    tabs[3].btn.onclick = () => { switchMainTab(tabs[3].btn); loadProfilesForUI(); };
    tabs[4].btn.onclick = async () => { switchMainTab(tabs[4].btn); await loadProfilesForUI(); renderVipRules(); };
    tabs[5].btn.onclick = () => switchMainTab(tabs[5].btn);
    tabs[6].btn.onclick = () => switchMainTab(tabs[6].btn);

    const toggleInput = document.getElementById("uiUseSiteToggle");
    const toggleTrack = document.getElementById("uiToggleTrack");

    function updateToggleVisuals(isSite) {
       if (isSite) {
          toggleTrack.classList.add("active");
          tabs[1].btn.style.display = "none";
          tabs[2].btn.style.display = "none";
          if (tabs[1].content.style.display === "block" || tabs[2].content.style.display === "block") switchMainTab(tabs[0].btn);
       } else {
          toggleTrack.classList.remove("active");
          tabs[1].btn.style.display = "flex";
          tabs[2].btn.style.display = "flex";
          loadProfilesForUI();
       }
    }

    const savedUseSite = localStorage.getItem("alphaUseSiteTemplates");
    if (savedUseSite === "false") {
       toggleInput.checked = false;
       updateToggleVisuals(false);
    }

    toggleInput.onchange = (e) => {
       const isChecked = e.target.checked;
       localStorage.setItem("alphaUseSiteTemplates", isChecked);
       updateToggleVisuals(isChecked);
    };

    const galleryBtn = document.getElementById("lettersGalleryBtn");
    if(galleryBtn) galleryBtn.onclick = () => (galleryModal.style.display = "flex");
    const closeGal = document.getElementById("closeGalleryBtn");
    if(closeGal) closeGal.onclick = () => (galleryModal.style.display = "none");
    const confGal = document.getElementById("confirmGalleryBtn");
    if(confGal) confGal.onclick = () => (galleryModal.style.display = "none");

    window.renderWinkSidebar = function() {
        const sidebar = document.getElementById("winkSidebar");
        if(!sidebar) return;
        sidebar.innerHTML = "";
        if(!currentSelectedProfile) return;

        const customKey = `resp_${currentSelectedProfile}_wink_custom`;
        const defKey = `resp_${currentSelectedProfile}_wink`;
        const customWinks = JSON.parse(localStorage.getItem(customKey) || "{}");
        const defWinks = JSON.parse(localStorage.getItem(defKey) || "[]");

        winkPhrases.forEach(wp => {
            const count = wp.id === "default" ? defWinks.length : (customWinks[wp.id] ? customWinks[wp.id].length : 0);
            const item = document.createElement("div");
            item.className = `alpha-wp-item ${currentWinkPhrase === wp.id ? 'active' : ''}`;
            item.innerHTML = `<div class="alpha-wp-text">${wp.text}</div><div class="alpha-wp-badge ${count > 0 ? 'has-items' : ''}">${count}</div>`;
            item.onclick = () => {
                currentWinkPhrase = wp.id;
                window.renderWinkSidebar();
                renderSavedMessages();
            };
            sidebar.appendChild(item);
        });
    };

    const tabLike = document.getElementById("respTabLike");
    const tabWink = document.getElementById("respTabWink");
    const winkSidebar = document.getElementById("winkSidebar");

    if(tabLike && tabWink) {
        tabLike.onclick = () => {
            currentSelectedTab = "like";
            tabLike.classList.add("active");
            tabWink.classList.remove("active");
            winkSidebar.style.display = "none";
            renderSavedMessages();
        };
        tabWink.onclick = () => {
            currentSelectedTab = "wink";
            currentWinkPhrase = "default";
            tabWink.classList.add("active");
            tabLike.classList.remove("active");
            winkSidebar.style.display = "flex";
            window.renderWinkSidebar();
            renderSavedMessages();
        };
    }

    const respProfSel = document.getElementById("respProfileSelect");
    if (respProfSel) {
        respProfSel.addEventListener("change", (e) => {
            currentSelectedProfile = e.target.value;
            if (currentSelectedProfile) {
                document.getElementById("respTabsArea").style.display = "flex";
                document.getElementById("respEmptyState").style.display = "none";
                if(currentSelectedTab === "wink") window.renderWinkSidebar();
                renderSavedMessages();
            } else {
                document.getElementById("respTabsArea").style.display = "none";
                document.getElementById("respEmptyState").style.display = "block";
            }
        });
    }

    const respSave = document.getElementById("respSaveBtn");
    if(respSave) {
        respSave.onclick = () => {
            const text = document.getElementById("respMessageInput").value.trim();
            if (!text || !currentSelectedProfile) return;

            if (currentSelectedTab === "wink" && currentWinkPhrase !== "default") {
                const key = `resp_${currentSelectedProfile}_wink_custom`;
                let savedObj = JSON.parse(localStorage.getItem(key) || "{}");
                if (!savedObj[currentWinkPhrase]) savedObj[currentWinkPhrase] = [];
                savedObj[currentWinkPhrase].push(text);
                localStorage.setItem(key, JSON.stringify(savedObj));
            } else {
                const key = `resp_${currentSelectedProfile}_${currentSelectedTab}`;
                let saved = JSON.parse(localStorage.getItem(key) || "[]");
                saved.push(text);
                localStorage.setItem(key, JSON.stringify(saved));
            }

            document.getElementById("respMessageInput").value = "";
            if(currentSelectedTab === "wink") window.renderWinkSidebar();
            renderSavedMessages();
        };
    }

    const invProfSel = document.getElementById("invitesProfileSelect");
    if (invProfSel) {
        invProfSel.addEventListener("change", (e) => {
            if (e.target.value) {
                document.getElementById("invitesWorkArea").style.display = "flex";
                document.getElementById("invitesEmptyState").style.display = "none";
                renderCustomInvites();
            } else {
                document.getElementById("invitesWorkArea").style.display = "none";
                document.getElementById("invitesEmptyState").style.display = "block";
            }
        });
    }

    const invSave = document.getElementById("invitesSaveBtn");
    if (invSave) {
        invSave.onclick = () => {
            const text = document.getElementById("invitesMessageInput").value.trim();
            const profileId = document.getElementById("invitesProfileSelect").value;
            if (!text || !profileId) return;
            const key = `alpha_invites_${profileId}`;
            let saved = JSON.parse(localStorage.getItem(key) || "[]");
            saved.push({ message_content: text, message_type: "SENT_TEXT" });
            localStorage.setItem(key, JSON.stringify(saved));
            document.getElementById("invitesMessageInput").value = "";
            renderCustomInvites();
        };
    }

    const letProfSel = document.getElementById("lettersProfileSelect");
    if(letProfSel) {
        letProfSel.addEventListener("change", async (e) => {
            const profileId = e.target.value;
            if (profileId) {
                document.getElementById("lettersWorkArea").style.display = "flex";
                document.getElementById("lettersEmptyState").style.display = "none";
                const galleryGrid = document.getElementById("galleryGrid");
                galleryGrid.innerHTML = '<span style="color: #666; font-size: 12px; grid-column: 1 / -1; text-align: center;">Завантаження фото...</span>';
                let token = localStorage.getItem("token");
                if (token) {
                    token = token.replace(/^"|"$/g, "");
                    const imageMap = await getProfileGallery(token, profileId);
                    galleryGrid.innerHTML = "";
                    window.selectedCustomImages = [];
                    document.getElementById("lettersGalleryBtn").innerHTML = "📷";
                    if (Object.keys(imageMap).length === 0) {
                        galleryGrid.innerHTML = '<span style="color: #999; font-size: 12px; grid-column: 1 / -1; text-align: center;">У цієї анкети немає фото.</span>';
                    } else {
                        for (const [link, id] of Object.entries(imageMap)) {
                            const img = document.createElement("img");
                            img.src = link;
                            img.dataset.id = id;
                            img.style.cssText = `width: 100%; height: 80px; object-fit: cover; border-radius: 5px; cursor: pointer; border: 3px solid transparent; transition: .2s; box-sizing: border-box;`;
                            img.onclick = () => {
                                const idx = window.selectedCustomImages.findIndex((imgObj) => imgObj.id === id);
                                if (idx > -1) {
                                    window.selectedCustomImages.splice(idx, 1);
                                    img.style.borderColor = "transparent";
                                    img.style.opacity = "1";
                                } else {
                                    window.selectedCustomImages.push({ id: id, link: link });
                                    img.style.borderColor = "#4caf50";
                                    img.style.opacity = "0.8";
                                }
                                const btn = document.getElementById("lettersGalleryBtn");
                                const count = window.selectedCustomImages.length;
                                btn.style.position = "relative";
                                btn.innerHTML = count > 0 ? `📷<span style="position: absolute; top: -5px; right: -5px; background: #f44336; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">${count}</span>` : "📷";
                            };
                            galleryGrid.appendChild(img);
                        }
                    }
                    renderCustomLetters();
                }
            } else {
                document.getElementById("lettersWorkArea").style.display = "none";
                document.getElementById("lettersEmptyState").style.display = "block";
            }
        });
    }

    const letSave = document.getElementById("lettersSaveBtn");
    if(letSave) {
        letSave.onclick = () => {
            const text = document.getElementById("lettersMessageInput").value.trim();
            const profileId = document.getElementById("lettersProfileSelect").value;
            if (!text || !profileId) return;
            const key = `alpha_letters_${profileId}`;
            let saved = JSON.parse(localStorage.getItem(key) || "[]");
            const attachments = window.selectedCustomImages ? [...window.selectedCustomImages] : [];
            saved.push({ message_content: text, message_type: "SENT_TEXT", attachments: attachments });
            localStorage.setItem(key, JSON.stringify(saved));
            document.getElementById("lettersMessageInput").value = "";
            window.selectedCustomImages = [];
            document.getElementById("lettersGalleryBtn").innerHTML = "📷";
            const galleryGrid = document.getElementById("galleryGrid");
            if (galleryGrid) {
                const imgs = galleryGrid.getElementsByTagName("img");
                for (let img of imgs) {
                    img.style.borderColor = "transparent";
                    img.style.opacity = "1";
                }
            }
            renderCustomLetters();
        };
    }

    const vipAddBtn = document.getElementById("vipAddRuleBtn");
    if (vipAddBtn) {
        vipAddBtn.onclick = () => {
            let rules = JSON.parse(localStorage.getItem("alphaVipRules") || "[]");
            rules.push({ vip_id: "", profile_id: "", auto_disable: false });
            localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            window.renderVipRules();
        };
    }

    window.renderVipRules = function() {
        const vipRulesList = document.getElementById("vipRulesList");
        if(!vipRulesList) return;
        vipRulesList.innerHTML = "";
        let rules = JSON.parse(localStorage.getItem("alphaVipRules") || "[]");

        if (rules.length === 0) {
            vipRulesList.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block;">' + t("dynNoRules") + '</span>';
            return;
        }

        const profileOptionsHtml = document.getElementById("respProfileSelect").innerHTML || '<option value="">' + t("dynSelectProfile") + '</option>';

        rules.forEach((rule, index) => {
            const container = document.createElement("div");
            container.style.cssText = `display: flex; flex-direction: column; gap: 8px; background: #f9f9f9; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px;`;

            const topRow = document.createElement("div");
            topRow.style.cssText = `display: flex; gap: 10px; align-items: center;`;

            const inputVip = document.createElement("input");
            inputVip.type = "text";
            inputVip.placeholder = "ID мужика";
            inputVip.value = rule.vip_id || "";
            inputVip.className = "alpha-input";
            inputVip.style.cssText = `width: 90px; padding: 6px; font-size: 12px;`;
            inputVip.oninput = (e) => {
                rules[index].vip_id = e.target.value.trim();
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            };

            const arrow = document.createElement("span");
            arrow.innerHTML = "➔";
            arrow.style.color = "#999";

            const selectProfile = document.createElement("select");
            selectProfile.innerHTML = profileOptionsHtml;
            selectProfile.value = rule.profile_id || "";
            selectProfile.className = "alpha-select";
            selectProfile.style.cssText = `flex: 1; padding: 6px; font-size: 12px;`;
            selectProfile.onchange = (e) => {
                rules[index].profile_id = e.target.value;
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            };

            const delBtn = document.createElement("span");
            delBtn.innerHTML = "❌";
            delBtn.style.cssText = `cursor: pointer; font-size: 14px; margin-left: 5px;`;
            delBtn.onclick = () => {
                rules.splice(index, 1);
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
                window.renderVipRules();
            };

            topRow.appendChild(inputVip);
            topRow.appendChild(arrow);
            topRow.appendChild(selectProfile);
            topRow.appendChild(delBtn);

            const bottomRow = document.createElement("label");
            bottomRow.style.cssText = `display: flex; align-items: center; gap: 5px; font-size: 11px; color: #555; cursor: pointer;`;

            const autoDisableCheckbox = document.createElement("input");
            autoDisableCheckbox.type = "checkbox";
            autoDisableCheckbox.checked = rule.auto_disable === true;
            autoDisableCheckbox.onchange = (e) => {
                rules[index].auto_disable = e.target.checked;
                localStorage.setItem("alphaVipRules", JSON.stringify(rules));
            };

            bottomRow.appendChild(autoDisableCheckbox);
            bottomRow.appendChild(document.createTextNode(t("dynAutoDisable")));

            container.appendChild(topRow);
            container.appendChild(bottomRow);
            vipRulesList.appendChild(container);
        });
    };

    const gsBtn = document.getElementById("alphaGsBtn");
    if (gsBtn) {
        gsBtn.onclick = () => {
            const dp = document.getElementById("alphaGsDropdown");
            const arr = document.getElementById("alphaGsArrow");
            const searchInput = document.getElementById("alphaGsSearchInput");
            if (dp.style.display === "flex") {
                dp.style.display = "none";
                arr.style.transform = "rotate(0deg)";
            } else {
                dp.style.display = "flex";
                arr.style.transform = "rotate(180deg)";
                if (searchInput) searchInput.focus();
            }
        };
    }

    document.addEventListener("click", (e) => {
        const selectorBlock = document.getElementById("alphaGlobalSelector");
        if (selectorBlock && !selectorBlock.contains(e.target)) {
            const dp = document.getElementById("alphaGsDropdown");
            const arr = document.getElementById("alphaGsArrow");
            if (dp && dp.style.display === "flex") {
                dp.style.display = "none";
                if(arr) arr.style.transform = "rotate(0deg)";
            }
        }
    });

    const langUaBtn = document.getElementById("langUaBtn");
    const langRuBtn = document.getElementById("langRuBtn");

    function applyTranslations(lang) {
        localStorage.setItem("alphaLang", lang);
        langUaBtn.style.opacity = lang === "ua" ? "1" : "0.4";
        langRuBtn.style.opacity = lang === "ru" ? "1" : "0.4";
        document.querySelectorAll("[data-lang]").forEach(el => {
            const key = el.getAttribute("data-lang");
            if (alphaDict[lang] && alphaDict[lang][key]) {
                if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                    el.placeholder = alphaDict[lang][key];
                } else {
                    el.innerText = alphaDict[lang][key];
                }
            }
        });
    }

    langUaBtn.onclick = () => applyTranslations("ua");
    langRuBtn.onclick = () => applyTranslations("ru");
    applyTranslations(localStorage.getItem("alphaLang") || "ua");

    document.getElementById("uiCloseBtn").onclick = () => (overlay.style.display = "none");

    document.getElementById("uiStartBtn").onclick = () => {
       if (isRunning) return;
       isRunning = true;
       localStorage.removeItem("alphaCurrentPIndex");

       const delay = parseInt(document.getElementById("uiDelay").value);
       const phaseDelay = parseInt(document.getElementById("uiPhaseDelay").value);
       const breakTime = parseInt(document.getElementById("uiBreakTime").value);
       const inviteMode = document.getElementById("uiInviteMode") ? document.getElementById("uiInviteMode").value : "batch";
       localStorage.setItem("alphaBotSettings", JSON.stringify({ delay, phaseDelay, breakTime, inviteMode }));
       localStorage.setItem("alphaBotState", "running");
       document.getElementById("uiStartBtn").style.display = "none";
       document.getElementById("uiStopBtn").style.display = "block";
       updatePopup("Запуск...", false);
       if (typeof startSendingProcess === 'function') startSendingProcess();
    };

    document.getElementById("uiStopBtn").onclick = () => {
       isRunning = false;
       clearInterval(botLoopTimer);
       localStorage.setItem("alphaBotState", "stopped");
       updatePopup("Зупинено", true, "-");
       localStorage.removeItem("alphaLockTime");
    };

    checkBotMemory();
    loadDailyStats();
    loadProfilesForUI();

    // ==================== ЛОГІКА ВКЛАДКИ ГАЛЕРЕЯ ====================
    const galleryDropZone = document.getElementById('galleryDropZone');
    const galleryFileInput = document.getElementById('galleryFileInput');
    const gallerySelectBtn = document.getElementById('gallerySelectBtn');
    const galleryUploadBtn = document.getElementById('galleryUploadBtn');
    const galleryProgressContainer = document.getElementById('galleryProgressContainer');
    const galleryProgressText = document.getElementById('galleryProgressText');
    const galleryProgressBar = document.getElementById('galleryProgressBar');
    const galleryErrorLog = document.getElementById('galleryErrorLog');
    const galleryErrorList = document.getElementById('galleryErrorList');

    let gallerySelectedFiles = [];

    // Функція оновлення UI після вибору файлів
    function updateGalleryUI() {
        if (gallerySelectedFiles.length > 0) {
            galleryUploadBtn.style.display = 'block';
            galleryDropZone.style.borderColor = '#4caf50';
            galleryDropZone.style.background = '#e8f5e9';
        } else {
            galleryUploadBtn.style.display = 'none';
            galleryDropZone.style.borderColor = '#1976d2';
            galleryDropZone.style.background = '#f8f9fa';
        }
    }

    // Обробка вибраних файлів
    function handleGalleryFiles(files) {
        gallerySelectedFiles = Array.from(files);
        updateGalleryUI();

        // Сховати попередні помилки
        galleryErrorLog.style.display = 'none';
        galleryErrorList.innerHTML = '';
    }

    // Drag & Drop
    if (galleryDropZone) {
        galleryDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            galleryDropZone.style.background = '#e3f2fd';
            galleryDropZone.style.borderColor = '#1976d2';
        });

        galleryDropZone.addEventListener('dragleave', () => {
            updateGalleryUI();
        });

        galleryDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            handleGalleryFiles(e.dataTransfer.files);
        });

        // Клік по зоні = відкрити вибір файлів
        galleryDropZone.addEventListener('click', () => {
            galleryFileInput.click();
        });
    }

    // Кнопка "Обрати файли"
        if (gallerySelectBtn && galleryFileInput) {
            gallerySelectBtn.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                galleryFileInput.click();
            });

            galleryFileInput.addEventListener('change', () => {
                if (galleryFileInput.files.length > 0) {
                    handleGalleryFiles(galleryFileInput.files);
                }
            });
        }
        // ТУТ ДУЖКУ ВИДАЛИЛИ

        // Кнопка "Почати завантаження"
        if (galleryUploadBtn) {
            galleryUploadBtn.addEventListener('click', async () => {
                if (gallerySelectedFiles.length === 0) return;

                // Отримуємо поточну анкету з глобального селектора
                const currentProfileId = window.currentSelectedProfileId ||
                                        document.getElementById('alphaGsId')?.textContent?.replace(/\D/g, '');

                if (!currentProfileId) {
                    alert('Спочатку оберіть анкету у верхньому селекторі');
                    return;
                }

                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Токен не знайдено. Спочатку авторизуйтесь.');
                    return;
                }

                // Підготовка UI
                galleryUploadBtn.style.display = 'none';
                galleryProgressContainer.style.display = 'block';
                galleryErrorLog.style.display = 'none';
                galleryErrorList.innerHTML = '';
                galleryProgressText.textContent = `Завантажено 0 з ${gallerySelectedFiles.length}`;
                galleryProgressBar.style.width = '0%';

                let uploadedCount = 0;
                const totalFiles = gallerySelectedFiles.length;

                // Функція оновлення прогресу
                const onProgress = (done, total) => {
                    uploadedCount = done;
                    galleryProgressText.textContent = `Завантажено ${done} з ${total}`;
                    const percent = Math.round((done / total) * 100);
                    galleryProgressBar.style.width = `${percent}%`;
                };

                // Функція для помилок
                const onFileError = (filename, errorMsg) => {
                    galleryErrorLog.style.display = 'block';
                    const errorItem = document.createElement('div');
                    errorItem.style.cssText = 'margin-bottom: 6px; font-size: 13px; color: #c62828;';
                    errorItem.innerHTML = `❌ <b>${filename}</b>: ${errorMsg}`;
                    galleryErrorList.appendChild(errorItem);
                };

                try {
                    const result = await bulkUploadPhotos(
                        token.replace(/^"|"$/g, ''),
                        currentProfileId,
                        gallerySelectedFiles,
                        onProgress,
                        onFileError
                    );

                    // Після завершення
                    setTimeout(() => {
                        alert(`Завантаження завершено!\nУспішно: ${result.uploaded} з ${result.total}`);

                        // Скидаємо стан
                        gallerySelectedFiles = [];
                        galleryUploadBtn.style.display = 'none';
                        galleryProgressContainer.style.display = 'none';
                        galleryDropZone.style.borderColor = '#1976d2';
                        galleryDropZone.style.background = '#f8f9fa';
                    }, 800);

                } catch (err) {
                    console.error('[Галерея] Критична помилка:', err);
                    alert('Сталася помилка під час завантаження. Дивіться консоль.');
                }
            });
        }
} // <========= ПЕРЕНЕСЛИ СЮДИ (Тепер вона правильно закриває всю функцію setupUIEvents)

async function loadProfilesForUI() {
    if (window.profilesLoadedForUI) return;

    let token = localStorage.getItem("token");
    if (!token) return;
    token = token.replace(/^"|"$/g, "");

    const profiles = await getAllProfiles(token);

    const listEl = document.getElementById("alphaGsList");
    const searchInput = document.getElementById("alphaGsSearchInput");
    if (!listEl) return;

    listEl.innerHTML = "";

    const respSel = document.getElementById("respProfileSelect");
    const invSel = document.getElementById("invitesProfileSelect");
    const letSel = document.getElementById("lettersProfileSelect");

    [respSel, invSel, letSel].forEach(sel => {
        if(sel) {
            sel.innerHTML = '<option value="">--</option>';
            profiles.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.external_id;
                opt.innerText = p.name;
                sel.appendChild(opt);
            });
        }
    });

    profiles.forEach(p => {
        const item = document.createElement("div");
        item.className = "alpha-gs-item";
        item.dataset.id = String(p.external_id);
        item.dataset.name = p.name.toLowerCase();

        const photoUrl = p.photo_link || "https://via.placeholder.com/40";
        const ageText = p.age ? `(${p.age} р.)` : "";

        const isOnline = p.online === 1;
        const statusColor = isOnline ? "#4caf50" : "#999";
        const statusText = isOnline ? "Онлайн" : "Офлайн";
        const opacity = isOnline ? "1" : "0.6";

        item.innerHTML = `
            <div style="position: relative; flex-shrink: 0;">
                <img src="${photoUrl}" class="alpha-gs-item-img" style="opacity: ${opacity};">
                <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: ${statusColor}; border: 2px solid #fff; border-radius: 50%;"></span>
            </div>
            <div class="alpha-gs-info" style="opacity: ${opacity};">
                <div class="alpha-gs-name">${p.name} <span style="color:#aaa; font-size:11px; font-weight:normal;">${ageText}</span></div>
                <div class="alpha-gs-id">ID: ${p.external_id} <span style="color:${statusColor}; font-weight:bold; margin-left:5px; font-size: 10px;">• ${statusText}</span></div>
            </div>
        `;

        item.onclick = () => {
            document.getElementById("alphaGsAvatar").src = photoUrl;
            document.getElementById("alphaGsName").innerText = p.name;
            document.getElementById("alphaGsId").innerText = `ID: ${p.external_id}`;

            document.getElementById("alphaGsDropdown").style.display = "none";
            document.getElementById("alphaGsArrow").style.transform = "rotate(0deg)";

            document.querySelectorAll(".alpha-gs-item").forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            [respSel, invSel, letSel].forEach(sel => {
                if(sel && sel.value !== String(p.external_id)) {
                    sel.value = p.external_id;
                    sel.dispatchEvent(new Event("change"));
                }
            });
        };
        listEl.appendChild(item);
    });

    if (searchInput) {
        searchInput.oninput = (e) => {
            const val = e.target.value.toLowerCase().trim();
            document.querySelectorAll(".alpha-gs-item").forEach(item => {
                const name = item.dataset.name;
                const id = item.dataset.id;
                if (name.includes(val) || id.includes(val)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        };
    }

    window.profilesLoadedForUI = true;
    updateProfileColors();
}

function renderSavedMessages() {
    if (!currentSelectedProfile) return;
    const listEl = document.getElementById("respSavedList");
    if(!listEl) return;
    listEl.innerHTML = "";

    let saved = [];
    let isCustomWink = false;
    let storageKey = "";

    if (currentSelectedTab === "wink" && currentWinkPhrase !== "default") {
        isCustomWink = true;
        storageKey = `resp_${currentSelectedProfile}_wink_custom`;
        const customObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
        saved = customObj[currentWinkPhrase] || [];
        document.getElementById("respListTitle").innerText = `Відповіді на: ${currentWinkPhrase}`;
    } else {
        storageKey = `resp_${currentSelectedProfile}_${currentSelectedTab}`;
        saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        document.getElementById("respListTitle").innerText = currentSelectedTab === "like" ? "Збережені відповіді на Лайки:" : "Стандартні відповіді (Вінки):";
    }

    if (saved.length === 0) {
       listEl.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block; margin-top: 10px;">Ще немає відповідей</span>';
       return;
    }

    saved.forEach((text, index) => {
       const item = document.createElement("div");
       item.style.cssText = `background: #f9f9f9; border: 1px solid #e0e0e0; padding: 8px 12px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;`;

       const textSpan = document.createElement("span");
       textSpan.innerText = text;
       textSpan.style.cssText = `font-size: 12px; color: #333; flex: 1; word-break: break-word;`;

       const delBtn = document.createElement("span");
       delBtn.innerHTML = "❌";
       delBtn.style.cssText = `cursor: pointer; font-size: 12px; margin-left: 10px; opacity: 0.7; transition: 0.2s;`;

       delBtn.onclick = () => {
          if (isCustomWink) {
              const obj = JSON.parse(localStorage.getItem(storageKey) || "{}");
              if (obj[currentWinkPhrase]) {
                  obj[currentWinkPhrase].splice(index, 1);
                  localStorage.setItem(storageKey, JSON.stringify(obj));
              }
          } else {
              const arr = JSON.parse(localStorage.getItem(storageKey) || "[]");
              arr.splice(index, 1);
              localStorage.setItem(storageKey, JSON.stringify(arr));
          }
          if(currentSelectedTab === "wink") window.renderWinkSidebar();
          renderSavedMessages();
       };
       item.appendChild(textSpan);
       item.appendChild(delBtn);
       listEl.appendChild(item);
    });

    updateProfileColors();
}

function renderCustomInvites() {
    const profileId = document.getElementById("invitesProfileSelect").value;
    const listEl = document.getElementById("invitesSavedList");
    listEl.innerHTML = "";

    if (!profileId) return;

    const key = `alpha_invites_${profileId}`;
    let saved = JSON.parse(localStorage.getItem(key) || "[]");

    if (saved.length === 0) {
       listEl.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block;">' + t("dynNoInvites") + '</span>';
       return;
    }

    saved.forEach((item, index) => {
       const div = document.createElement("div");
       div.style.cssText = `background: #f9f9f9; border: 1px solid #e0e0e0; padding: 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;`;

       const textSpan = document.createElement("span");
       textSpan.innerText = `${index + 1}. ${item.message_content}`;
       textSpan.style.cssText = `font-size: 12px; color: #333; flex: 1; word-break: break-word;`;

       const controlsDiv = document.createElement("div");
       controlsDiv.style.cssText = `display: flex; align-items: center; gap: 8px; margin-left: 10px;`;

       if (index > 0) {
          const upBtn = document.createElement("span");
          upBtn.innerHTML = "↑";
          upBtn.style.cssText = `color: #1976d2; cursor: pointer; font-size: 16px; font-weight: bold; padding: 0 4px;`;
          upBtn.onclick = () => {
             [saved[index - 1], saved[index]] = [saved[index], saved[index - 1]];
             localStorage.setItem(key, JSON.stringify(saved));
             renderCustomInvites();
          };
          controlsDiv.appendChild(upBtn);
       }

       if (index < saved.length - 1) {
          const downBtn = document.createElement("span");
          downBtn.innerHTML = "↓";
          downBtn.style.cssText = `color: #1976d2; cursor: pointer; font-size: 16px; font-weight: bold; padding: 0 4px;`;
          downBtn.onclick = () => {
             [saved[index], saved[index + 1]] = [saved[index + 1], saved[index]];
             localStorage.setItem(key, JSON.stringify(saved));
             renderCustomInvites();
          };
          controlsDiv.appendChild(downBtn);
       }

       const delBtn = document.createElement("span");
       delBtn.innerHTML = "&times;";
       delBtn.style.cssText = `color: #d32f2f; cursor: pointer; font-size: 18px; font-weight: bold; margin-left: 4px; line-height: 1;`;
       delBtn.onclick = () => {
          saved.splice(index, 1);
          localStorage.setItem(key, JSON.stringify(saved));
          renderCustomInvites();
       };

       controlsDiv.appendChild(delBtn);
       div.appendChild(textSpan);
       div.appendChild(controlsDiv);
       listEl.appendChild(div);
    });

    updateProfileColors();
}

function renderCustomLetters() {
    const profileId = document.getElementById("lettersProfileSelect").value;
    const listEl = document.getElementById("lettersSavedList");
    listEl.innerHTML = "";

    if (!profileId) return;

    const key = `alpha_letters_${profileId}`;
    let saved = JSON.parse(localStorage.getItem(key) || "[]");

    if (saved.length === 0) {
       listEl.innerHTML = '<span style="color: #aaa; font-size: 12px; text-align: center; display: block;">' + t("dynNoLetters") + '</span>';
       return;
    }

    saved.forEach((item, index) => {
       const div = document.createElement("div");
       div.style.cssText = `background: #f9f9f9; border: 1px solid #e0e0e0; padding: 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: flex-start;`;

       const contentDiv = document.createElement("div");
       contentDiv.style.cssText = `display: flex; flex-direction: column; flex: 1;`;

       const textSpan = document.createElement("span");
       textSpan.innerText = item.message_content;
       textSpan.style.cssText = `font-size: 12px; color: #333; word-break: break-word; margin-bottom: 4px;`;
       contentDiv.appendChild(textSpan);

       if (item.attachments && item.attachments.length > 0) {
          const attSpan = document.createElement("span");
          attSpan.innerText = `📎 Прикріплено фото (${item.attachments.length})`;
          attSpan.style.cssText = `font-size: 10px; color: #1976d2; font-weight: bold;`;
          contentDiv.appendChild(attSpan);
       }

       const delBtn = document.createElement("span");
       delBtn.innerHTML = "&times;";
       delBtn.style.cssText = `color: #d32f2f; cursor: pointer; font-size: 18px; font-weight: bold; margin-left: 10px; line-height: 1;`;
       delBtn.onclick = () => {
          saved.splice(index, 1);
          localStorage.setItem(key, JSON.stringify(saved));
          renderCustomLetters();
       };

       div.appendChild(contentDiv);
       div.appendChild(delBtn);
       listEl.appendChild(div);
    });

    updateProfileColors();
}

function updateProfileColors() {
    const invSelect = document.getElementById("invitesProfileSelect");
    if (invSelect) {
       Array.from(invSelect.options).forEach((opt) => {
          if (!opt.value) return;
          const saved = JSON.parse(localStorage.getItem(`alpha_invites_${opt.value}`) || "[]");
          opt.style.color = saved.length > 0 ? "#4caf50" : "#000";
          opt.style.fontWeight = saved.length > 0 ? "bold" : "normal";
       });
    }

    const letSelect = document.getElementById("lettersProfileSelect");
    if (letSelect) {
       Array.from(letSelect.options).forEach((opt) => {
          if (!opt.value) return;
          const saved = JSON.parse(localStorage.getItem(`alpha_letters_${opt.value}`) || "[]");
          opt.style.color = saved.length > 0 ? "#4caf50" : "#000";
          opt.style.fontWeight = saved.length > 0 ? "bold" : "normal";
       });
    }

    const respSelect = document.getElementById("respProfileSelect");
    if (respSelect) {
       Array.from(respSelect.options).forEach((opt) => {
          if (!opt.value) return;
          const likes = JSON.parse(localStorage.getItem(`resp_${opt.value}_like`) || "[]");
          const winks = JSON.parse(localStorage.getItem(`resp_${opt.value}_wink`) || "[]");
          if (likes.length > 0 && winks.length > 0) {
             opt.style.color = "#4caf50";
             opt.style.fontWeight = "bold";
          } else if (likes.length > 0 || winks.length > 0) {
             opt.style.color = "#ff9800";
             opt.style.fontWeight = "bold";
          } else {
             opt.style.color = "#000";
             opt.style.fontWeight = "normal";
          }
       });
    }
}

function checkBotMemory() {
    const state = localStorage.getItem("alphaBotState");
    if (state === "running" || state === "waiting") {
       const settings = JSON.parse(localStorage.getItem("alphaBotSettings") || "{}");
       if (settings.delay !== undefined) {
          document.getElementById("uiDelay").value = settings.delay;
          document.getElementById("uiPhaseDelay").value = settings.phaseDelay !== undefined ? settings.phaseDelay : 2;
          document.getElementById("uiBreakTime").value = settings.breakTime || 10;
          const modeEl = document.getElementById("uiInviteMode");
          if (modeEl && settings.inviteMode) modeEl.value = settings.inviteMode;
       }
       document.getElementById("uiStartBtn").style.display = "none";
       document.getElementById("uiStopBtn").style.display = "block";
       isRunning = true;

       if (state === "waiting") {
          const resumeTime = parseInt(localStorage.getItem("alphaBotResumeTime") || "0");
          if (Date.now() >= resumeTime) {
             localStorage.setItem("alphaBotState", "running");
             if (typeof startSendingProcess === 'function') startSendingProcess();
          } else {
             if (typeof startWaitCountdown === 'function') startWaitCountdown(resumeTime);
          }
       } else {
          if (typeof startSendingProcess === 'function') startSendingProcess();
       }
    }
}

function injectMenuButton() {
    const menuList = document.querySelector('[data-testid="bottom-menu-list"]');
    if (menuList && !document.getElementById("alpha-sender-menu-btn")) {
       const settingBtn = document.createElement("div");
       settingBtn.id = "alpha-sender-menu-btn";
       const firstItem = menuList.querySelector("div");
       settingBtn.className = firstItem ? firstItem.className.split(" ")[0] : "BottomMenu_clmn_1_bottom_menu_item__4xtik";
       settingBtn.innerText = "⚙  Setting";
       settingBtn.style.cursor = "pointer";
       settingBtn.onclick = () => {
          const overlay = document.getElementById("alpha-sender-overlay");
          if (overlay) overlay.style.display = "flex";
       };
       menuList.appendChild(settingBtn);
    }
}

function injectSearchButton() {
    const chatHeaders = document.querySelectorAll('.styles_chat_head__ao7Ds');
    chatHeaders.forEach(header => {
        if (header.querySelector('.alpha-search-mockup')) return;
        const middleBlock = header.querySelector('.styles_chat_head_middle__D14pE');
        if (!middleBlock) return;

        const searchContainer = document.createElement('div');
        searchContainer.className = 'alpha-search-mockup';
        searchContainer.innerHTML = `
            <div class="alpha-progress-fill" style="position: absolute; top: 0; left: 0; height: 100%; width: 0%; background: #e3f2fd; border-radius: 6px; transition: width 0.3s ease; z-index: 0;"></div>
            <img src="https://cdn-icons-png.flaticon.com/512/751/751463.png" alt="search" style="width: 13px; height: 13px; margin-right: 6px; opacity: 0.5; position: relative; z-index: 1;">
            <span class="alpha-search-text" style="font-size: 13px; color: #555; position: relative; z-index: 1;">Завантажити історію</span>
        `;
        Object.assign(searchContainer.style, {
            display: 'flex', alignItems: 'center', alignSelf: 'center', position: 'relative',
            margin: '0 15px', padding: '5px 8px', overflow: 'hidden',
            backgroundColor: '#ffffff', borderRadius: '6px',
            border: '1px solid #e2e2e2', cursor: 'pointer', transition: 'all 0.2s ease'
        });

        let isLoaded = false;

        searchContainer.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            const match = window.location.href.match(/\/chat\/([a-z0-9\-]+)/);
            const currentChatId = match ? match[1] : null;

            if (!currentChatId || !window.alphaSmartSearch) return;

            const textSpan = searchContainer.querySelector('.alpha-search-text');
            const progressFill = searchContainer.querySelector('.alpha-progress-fill');

            if (isLoaded && window.alphaSmartSearch.chatId === currentChatId) {
                window.alphaSmartSearch.modal.style.display = "flex";
                return;
            }

            window.alphaSmartSearch.openWithContext(currentChatId, token, 'chat');
            isLoaded = true;
            textSpan.innerText = "Відкрити пошук";
            textSpan.style.color = "#1976d2";
            textSpan.style.fontWeight = "bold";
            progressFill.style.background = "#bbdefb";
            progressFill.style.width = "100%";
        });
        middleBlock.insertAdjacentElement('afterend', searchContainer);
    });
}

// Ловимо екстрену зупинку від лоадера
window.addEventListener("AlphaBackgroundCrash", () => {
    if (isRunning) {
        document.getElementById("uiStopBtn").click();
        showSystemAlert("⚠️ Збій розширення", "Зв'язок з ядром втрачено (можливо через сторонні розширення). Розсилку безпечно зупинено.", "#f44336");
    }
});

// ==========================================
// ЗАПУСК ІНТЕРФЕЙСУ (Після завантаження всіх файлів)
// ==========================================
setTimeout(() => {
    injectBotUI();
    setInterval(injectMenuButton, 500);
    setInterval(injectSearchButton, 2000);
}, 200);