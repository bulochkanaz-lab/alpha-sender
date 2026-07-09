// ==========================================
// МОТОР РОЗСИЛКИ (Логіка циклів, інвайти, листи)
// ==========================================

function startWaitCountdown(resumeTime) {
    clearInterval(botLoopTimer);

    botLoopTimer = setInterval(() => {
       if (!isRunning) {
          clearInterval(botLoopTimer);
          return;
       }

       const left = resumeTime - Date.now();

       if (left <= 0) {
          clearInterval(botLoopTimer);
          localStorage.setItem("alphaBotState", "running");
          startSendingProcess();
       } else {
          const min = Math.floor(left / 60000);
          const sec = Math.floor((left % 60000) / 1000);
          if (typeof updatePopup === 'function') updatePopup(`Перерва: ${min}хв ${sec}с`, false, "Очікування...");
       }
    }, 1000);
}

async function startSendingProcess() {
    let token = localStorage.getItem("token");

    if (!token) {
       if (typeof updatePopup === 'function') updatePopup("Помилка: Токен не знайдено!", true);
       isRunning = false;
       return;
    }

    token = token.replace(/^"|"$/g, "");

    const settings = JSON.parse(localStorage.getItem("alphaBotSettings") || "{}");
    const useAllProfiles = settings.useAllProfiles !== undefined ? settings.useAllProfiles : true;
    const singleProfileId = settings.profileId || "";

    const uiDelayEl = document.getElementById("uiDelay");
    const uiPhaseEl = document.getElementById("uiPhaseDelay");
    const uiBreakEl = document.getElementById("uiBreakTime");

    const delaySeconds = uiDelayEl && uiDelayEl.value !== "" ? parseInt(uiDelayEl.value) : 4;
    const phaseDelayMinutes = uiPhaseEl && uiPhaseEl.value !== "" ? parseInt(uiPhaseEl.value) : 2;
    const breakTimeMinutes = uiBreakEl && uiBreakEl.value !== "" ? parseInt(uiBreakEl.value) : 10;

    let profilesToProcess = [];

    if (useAllProfiles) {
       if (typeof updatePopup === 'function') updatePopup("Пошук онлайн анкет...", false, "Підготовка...");

       const allProfiles = await getAllProfiles(token);

       if (!isRunning) return;

       if (allProfiles.length === 0) {
          if (typeof updatePopup === 'function') updatePopup("Не знайдено онлайн-анкет!", true);
          isRunning = false;
          return;
       }

       profilesToProcess = allProfiles.map((p) => ({ id: p.external_id, name: p.name }));
    } else {
       profilesToProcess = [{ id: singleProfileId, name: "Ручне введення" }];
    }

    sendHeartbeatToServer(profilesToProcess);

    if (window.alphaHeartbeatInterval) {
        clearInterval(window.alphaHeartbeatInterval);
    }
    window.alphaHeartbeatInterval = setInterval(() => {
        if (isRunning) {
            localStorage.setItem("alphaLockTime", Date.now().toString());
            sendHeartbeatToServer(profilesToProcess);
        } else {
            sendHeartbeatToServer([]);
            clearInterval(window.alphaHeartbeatInterval);
        }
    }, 20000);

    let startIndex = parseInt(localStorage.getItem("alphaCurrentPIndex") || "0");

    for (let pIndex = startIndex; pIndex < profilesToProcess.length; pIndex++) {
       localStorage.setItem("alphaCurrentPIndex", pIndex.toString());
       if (!isRunning) break;

       const currentProfile = profilesToProcess[pIndex];
       const profileNameDisplay = `${currentProfile.name} (${currentProfile.id})`;

       if (typeof updatePopup === 'function') updatePopup(`Збір бази...`, false, profileNameDisplay);

       const useSiteTpl = localStorage.getItem("alphaUseSiteTemplates") !== "false";
       let inviteTemplates = [];
       let letterTemplates = [];

       if (!useSiteTpl) {
          inviteTemplates = JSON.parse(localStorage.getItem(`alpha_invites_${currentProfile.id}`) || "[]");
          letterTemplates = JSON.parse(localStorage.getItem(`alpha_letters_${currentProfile.id}`) || "[]");

          if (inviteTemplates.length === 0 && letterTemplates.length === 0) {
             if (typeof updatePopup === 'function') updatePopup(`Пропуск (немає текстів)`, false, profileNameDisplay);
             await sleep(2000);
             continue;
          }
       } else {
          inviteTemplates = await getInviteTemplates(token, currentProfile.id);
          letterTemplates = await getTemplates(token, currentProfile.id);
       }

       if (!isRunning) break;

       const clientsList = await collectAllMen(token, currentProfile.id);
       const imageMap = await getProfileGallery(token, currentProfile.id);

       if (!isRunning) break;

       if (clientsList.length === 0) continue;

       const hasInvites = inviteTemplates && inviteTemplates.length > 0;
       const hasLetters = letterTemplates && letterTemplates.length > 0;

       // ==========================================
       // ФАЗА 1: ІНВАЙТИ
       // ==========================================
       if (hasInvites) {
          if (typeof updatePopup === 'function') updatePopup(`Розсилка інвайтів...`, false, profileNameDisplay);

          const inviteMode = settings.inviteMode || "batch";

          for (let i = 0; i < clientsList.length; i++) {
             if (!isRunning) break;

             const client = clientsList[i];
             const historyTexts = await getRecentHistoryTexts(token, client.chat_uid);

             if (!useSiteTpl) {
                // --- КАСТОМНІ ТЕКСТИ (Власні інвайти) ---
                if (inviteMode === "batch") {
                   let sentCount = 0;

                   for (let t = 0; t < inviteTemplates.length; t++) {
                      if (!isRunning) break;

                      const template = inviteTemplates[t];
                      const normalizedText = String(template.message_content).trim().toLowerCase();

                      if (!historyTexts.includes(normalizedText)) {
                         const success = await sendInvite(token, currentProfile.id, client.id, template, client.chat_uid);

                         if (success) {
                             incrementStat("invites");
                             if (typeof updatePopup === 'function') updatePopup(`Інвайти йдуть...`, false, profileNameDisplay);
                             sentCount++;

                             // --- БРОНЬОВАНИЙ КЛЮЧ ---
                             const targetManId = String(client.external_id || client.user_id || client.id);
                             const myProfileId = String(currentProfile.id); // Використовуємо реальний ID
                             const smartUid = `${myProfileId}_${targetManId}`;

                             logInviteAnalytics(template.message_content, "sent", smartUid);
                             markChatAsInvited(smartUid);
                             //console.log(`🛠 [Дебаг Відправки BATCH] Ключ: ${smartUid}`);
                         }

                         if (t < inviteTemplates.length - 1 && isRunning) await sleep(2000);
                      }
                   }

                   if (sentCount > 0 && i < clientsList.length - 1 && isRunning) {
                      await sleep(delaySeconds * 1000);
                   }
                } else {
                   // --- РЕЖИМ: LOOP ---
                   let templateToSend = null;

                   for (let t = 0; t < inviteTemplates.length; t++) {
                      const normalizedText = String(inviteTemplates[t].message_content).trim().toLowerCase();

                      if (!historyTexts.includes(normalizedText)) {
                         templateToSend = inviteTemplates[t];
                         break;
                      }
                   }

                   if (templateToSend) {
                      const success = await sendInvite(token, currentProfile.id, client.id, templateToSend, client.chat_uid);

                      if (success) {
                          incrementStat("invites");
                          if (typeof updatePopup === 'function') updatePopup(`Інвайти йдуть...`, false, profileNameDisplay);

                          // --- БРОНЬОВАНИЙ КЛЮЧ ---
                          const targetManId = String(client.external_id || client.user_id || client.id);
                          const myProfileId = String(currentProfile.id);
                          const smartUid = `${myProfileId}_${targetManId}`;

                          logInviteAnalytics(templateToSend.message_content, "sent", smartUid);
                          markChatAsInvited(smartUid);
                          //e.log(`🛠 [Дебаг Відправки LOOP] Ключ: ${smartUid}`);
                      }

                      if (i < clientsList.length - 1 && isRunning) await sleep(delaySeconds * 1000);
                   }
                }
             } else {
                // --- ШАБЛОНИ З САЙТУ ---
                let templateToSend = null;

                for (let t = 0; t < inviteTemplates.length; t++) {
                   const normalizedText = String(inviteTemplates[t].message_content).trim().toLowerCase();

                   if (!historyTexts.includes(normalizedText)) {
                      templateToSend = inviteTemplates[t];
                      break;
                   }
                }

                if (templateToSend) {
                   const success = await sendInvite(token, currentProfile.id, client.id, templateToSend, client.chat_uid);

                   if (success) {
                      incrementStat("invites");
                      if (typeof updatePopup === 'function') updatePopup(`Інвайти йдуть...`, false, profileNameDisplay);

                      // --- БРОНЬОВАНИЙ КЛЮЧ ---
                      const targetManId = String(client.external_id || client.user_id || client.id);
                      const myProfileId = String(currentProfile.id);
                      const smartUid = `${myProfileId}_${targetManId}`;

                      logInviteAnalytics(templateToSend.message_content, "sent", smartUid);
                      markChatAsInvited(smartUid);
                      //e.log(`🛠 [Дебаг Відправки SITE_TPL] Ключ: ${smartUid}`);
                   }

                   if (i < clientsList.length - 1 && isRunning) await sleep(delaySeconds * 1000);
                }
             }
          }
       }

       if (!isRunning) break;

       // ==========================================
       // ПАУЗА МІЖ ІНВАЙТАМИ ТА ЛИСТАМИ
       // ==========================================
       if (hasInvites && hasLetters && phaseDelayMinutes > 0 && clientsList.length > 0) {
          let waitTimeMs = phaseDelayMinutes * 60 * 1000;

          while (waitTimeMs > 0 && isRunning) {
             const min = Math.floor(waitTimeMs / 60000);
             const sec = Math.floor((waitTimeMs % 60000) / 1000);
             if (typeof updatePopup === 'function') updatePopup(`Пауза: ${min}хв ${sec}с`, false, profileNameDisplay);
             await sleep(1000);
             waitTimeMs -= 1000;
          }
       }

       if (!isRunning) break;

       // ==========================================
       // ФАЗА 2: ЛИСТИ (Строга послідовність + Анти-дубль)
       // ==========================================
       if (hasLetters) {
          if (typeof updatePopup === 'function') updatePopup(`Розсилка листів...`, false, profileNameDisplay);

          for (let i = 0; i < clientsList.length; i++) {
             if (!isRunning) break;

             const client = clientsList[i];

             // 1. Завантажуємо історію чату (або беремо вже завантажену, якщо Фаза 1 її стягнула)
             const historyTexts = await getRecentHistoryTexts(token, client.chat_uid);
             let templateToSend = null;

             // 2. Йдемо по списку листів строго ПО ПОРЯДКУ
             for (let t = 0; t < letterTemplates.length; t++) {
                 const normalizedText = String(letterTemplates[t].message_content).trim().toLowerCase();

                 // 3. Локальна перевірка: чи є такий текст в історії?
                 if (!historyTexts.includes(normalizedText)) {
                     templateToSend = letterTemplates[t];
                     break; // Знайшли унікальний текст - зупиняємо пошук
                 }
             }

             // Якщо всі доступні листи вже були відправлені - йдемо до наступного чоловіка
             if (!templateToSend) continue;

             // 4. Відправляємо гарантовано унікальний лист
             const success = await sendLetter(token, currentProfile.id, client.id, templateToSend, imageMap);

             if (success) {
                incrementStat("letters");
                if (typeof updatePopup === 'function') updatePopup(`Листи йдуть...`, false, profileNameDisplay);
             }

             if (i < clientsList.length - 1 && isRunning) await sleep(delaySeconds * 1000);
          }
       }

       // ==========================================
       // ПЕРЕХІД ДО НАСТУПНОЇ АНКЕТИ
       // ==========================================
       if (pIndex < profilesToProcess.length - 1 && isRunning) {
          if (typeof updatePopup === 'function') updatePopup(`Наступна анкета...`, false, profileNameDisplay);

          // Зчитуємо актуальні налаштування з пам'яті прямо перед паузою
          const currentSettings = JSON.parse(localStorage.getItem("alphaBotSettings") || "{}");

          // Беремо значення profileDelay (якщо не знайдено - 30 сек)
          const profileDelaySec = currentSettings.profileDelay !== undefined ? currentSettings.profileDelay : 30;

          await sleep(profileDelaySec * 1000);
       }
    }

    if (isRunning) {
        localStorage.removeItem("alphaCurrentPIndex");
        if (typeof updatePopup === 'function') updatePopup(`Перерва ${breakTimeMinutes} хв...`, false, t("statusWaiting"));
        const resumeTime = Date.now() + breakTimeMinutes * 60 * 1000;
        localStorage.setItem("alphaBotState", "waiting");
        localStorage.setItem("alphaBotResumeTime", resumeTime.toString());
        startWaitCountdown(resumeTime);
    }
}