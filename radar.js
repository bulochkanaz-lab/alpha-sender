// ==========================================
// РАДАР (Слухач сокетів, Автовідповідач, VIP-радар)
// ==========================================

// ==================== ОНОВЛЕНА ВЕРСІЯ З ДЕТАЛЬНИМ ЛОГУВАННЯМ ====================

async function sendAutoMessage(profileId, manId, text, chatUid = null) {
    //console.log(`[ДЕБАГ][sendAutoMessage] Старт. profileId=${profileId}, manId=${manId}`);

    let token = localStorage.getItem("token");
    if (!token) {
        //console.warn(`[ДЕБАГ][sendAutoMessage] Токен відсутній у localStorage`);
        return false;
    }
    token = token.replace(/^"|"$/g, "");
    //console.log(`[ДЕБАГ][sendAutoMessage] Токен отримано (довжина: ${token.length})`);

    // Логуємо, чи існує getHeaders
    if (typeof getHeaders !== 'function') {
        //console.error(`[ДЕБАГ][sendAutoMessage] ПОМИЛКА: getHeaders не є функцією!`);
        return false;
    }

    let headers;
    try {
        headers = getHeaders(token);
        //console.log(`[ДЕБАГ][sendAutoMessage] Заголовки отримано від getHeaders`);
    } catch (e) {
        //console.error(`[ДЕБАГ][sendAutoMessage] ПОМИЛКА при виклику getHeaders:`, e);
        return false;
    }

    const payload = {
        sender_id: Number(profileId),
        recipient_id: Number(manId),
        message_content: text,
        message_type: "SENT_TEXT",
        filename: "",
        chat_uid: chatUid
    };

    //console.log(`[ДЕБАГ][sendAutoMessage] Підготовлено payload:`, payload);

    try {
        //console.log(`[ДЕБАГ][sendAutoMessage] Виконую fetch...`);
        const response = await fetch("https://alpha.date/api/chat/message", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        //console.log(`[ДЕБАГ][sendAutoMessage] Fetch завершено. status=${response.status}, ok=${response.ok}`);

        let data;
        try {
            data = await response.json();
            //console.log(`[ДЕБАГ][sendAutoMessage] Відповідь сервера (JSON):`, data);
        } catch (jsonErr) {
            const text = await response.text();
            //console.error(`[ДЕБАГ][sendAutoMessage] Не вдалося розпарсити JSON. Текст відповіді:`, text);
            return false;
        }

        const success = response.ok && data.status === true;
        //console.log(`[ДЕБАГ][sendAutoMessage] Результат: ${success ? 'УСПІХ' : 'НЕУСПІХ'}`);
        return success;

    } catch (error) {
        //console.error(`[ДЕБАГ][sendAutoMessage] ПОМИЛКА під час fetch:`, error);
        return false;
    }
}


async function handleAutoReply(profileId, manId, type, exactText = "", chatUid = null) {
    //console.log(`[ДЕБАГ] handleAutoReply викликано. profileId: ${profileId}, manId: ${manId}, type: ${type}`);

    const lockKey = `${profileId}_${manId}_${type}`;
    if (autoReplyLocks.has(lockKey)) {
        //console.log(`[ДЕБАГ] Блок! Цей мужик вже щойно отримав відповідь (захист від спаму).`);
        return;
    }

    autoReplyLocks.add(lockKey);
    setTimeout(() => autoReplyLocks.delete(lockKey), 60000);

    let savedTexts = [];

    // 1. Кастомна відповідь на вінку
    if (type === "wink" && exactText !== "") {
        try {
            const customWinks = JSON.parse(localStorage.getItem(`resp_${profileId}_wink_custom`) || "{}");
            if (customWinks[exactText] && customWinks[exactText].length > 0) {
                savedTexts = customWinks[exactText];
                //console.log(`[ДЕБАГ] Знайдено кастомні тексти для цієї вінки:`, savedTexts);
            }
        } catch(e) {}
    }

    // 2. Стандартна відповідь
    if (savedTexts.length === 0) {
        const key = `resp_${profileId}_${type}`;
        savedTexts = JSON.parse(localStorage.getItem(key) || "[]");
        //console.log(`[ДЕБАГ] Шукаємо тексти в пам'яті за ключем: ${key}. Знайшли:`, savedTexts);
    }

    if (savedTexts.length === 0) {
        //e.log(`[ДЕБАГ] Відміна: у пам'яті немає жодного збереженого тексту для ${type}!`);
        return;
    }

    const randomText = savedTexts[Math.floor(Math.random() * savedTexts.length)];
    //console.log(`[ДЕБАГ] Вибрано текст: "${randomText}". Робимо паузу для імітації друку...`);

    const speedSec = parseInt(localStorage.getItem("alphaBotReplySpeed") || "3");
    const delayMs = speedSec * 1000 + Math.floor(Math.random() * 1000);

    await sleep(delayMs);

    //console.log(`[ДЕБАГ] Стріляємо повідомленням на сервер! chatUid=${chatUid}`);

    const result = await sendAutoMessage(profileId, manId, randomText, chatUid);
    //console.log(`[ДЕБАГ] Результат відправки автовідповідача: ${result ? 'УСПІШНО' : 'НЕ УСПІШНО'}`);
}

// ==========================================
// ГОЛОВНИЙ СЛУХАЧ СОКЕТІВ
// ==========================================
window.addEventListener("AlphaSocketMessage", async function (e) {
    const rawData = e.detail;

    try {
       const parsed = JSON.parse(rawData.substring(2));
       if (!Array.isArray(parsed) || parsed.length < 2) return;

       const eventName = parsed[0];
       const payload = parsed[1];

       // 🎯 VIP РАДАР (Перехоплення Онлайну)
       if (eventName === "user_online" || (payload && (payload.action === "user_online" || payload.type === "user_online"))) {
          let onlineId = null;
          let clientName = "Важливий клієнт";

          function extractVipData(obj) {
              if (!obj || typeof obj !== 'object') return;
              if (obj.external_id && !onlineId) {
                  onlineId = String(obj.external_id);
                  if (obj.name) clientName = obj.name;
              }
              if (!onlineId) {
                  Object.values(obj).forEach(val => extractVipData(val));
              }
          }
          extractVipData(payload);

          if (onlineId) {
             const rules = JSON.parse(localStorage.getItem("alphaVipRules") || "[]");
             const matchedRules = rules.filter(r => String(r.vip_id) === onlineId);

             if (matchedRules.length > 0) {
                // Викликаємо функцію з ui.js
                if (typeof showVipNotification === 'function') showVipNotification(clientName, onlineId);

                for (const rule of matchedRules) {
                    if (rule.auto_disable === true) {
                        disableProfile(rule.profile_id).then(success => {
                            if(success) {
                                if (typeof showSystemAlert === 'function') showSystemAlert("🔌 Анкета вимкнена", `Анкету <b>${rule.profile_id}</b> переведено в офлайн.`, "#f44336");
                            } else {
                                if (typeof showSystemAlert === 'function') showSystemAlert("⚠️ Помилка вимкнення", `Не вдалося вимкнути анкету <b>${rule.profile_id}</b>.`, "#ff9800");
                            }
                        });
                    }
                }
             }
          }
       }

       // ==========================================
       // РОЗУМНИЙ АВТОВІДПОВІДАЧ ТА ЗБІР АНАЛІТИКИ
       // ==========================================

       // ID анкети беремо з сокета (щоб точно знати, якій анкеті прилетіло)
       const womanId = payload.external_id || localStorage.getItem('profile_id');
       let manId = null;

       if (payload.message_object && payload.message_object.sender_external_id) {
          manId = payload.message_object.sender_external_id;
       } else if (payload.notification_object && payload.notification_object.sender_external_id) {
          manId = payload.notification_object.sender_external_id;
       }

       // Якщо немає обох ID, зупиняємось
       if (!manId || !womanId) return;

       const msgType = (payload.message_object && payload.message_object.message_type)
                    || (payload.notification_object && payload.notification_object.message_type);

       const msgContent = (payload.message_object && payload.message_object.message_content)
                       || (payload.notification_object && payload.notification_object.message_content)
                       || "";

       const winkTypes = ["SENT_WINK"];
       const likeTypes = ["liked"];

       const isWink = (payload.action === "message" && winkTypes.includes(msgType));
       const isLike = (likeTypes.includes(payload.action) || (payload.action === "message" && likeTypes.includes(msgType)));

       // Додаємо пастку для відповідача
       if (isWink || isLike) {
           //console.log(`🛠 [Пастка Відповідача] Action: ${payload.action}, MsgType: ${msgType}, Текст: "${msgContent}"`);
       }

       // Витягуємо chat_uid з різних місць payload (сайт може віддавати в різних об'єктах)
       let chatUid = null;
       if (payload.chat_list_object && payload.chat_list_object.chat_uid) {
          chatUid = payload.chat_list_object.chat_uid;
       } else if (payload.message_object && payload.message_object.chat_uid) {
          chatUid = payload.message_object.chat_uid;
       } else if (payload.notification_object && payload.notification_object.chat_uid) {
          chatUid = payload.notification_object.chat_uid;
       }

       if (isLike) {
          await handleAutoReply(womanId, manId, "like", "", chatUid);
       } else if (isWink) {
          await handleAutoReply(womanId, manId, "wink", msgContent.trim(), chatUid);
       } else if (payload.action === "message" && msgType === "SENT_TEXT") {

          //console.log("🛠 [Дебаг Радара] ЗЛОВИЛИ ТЕКСТ! Payload:", payload);

          const myProfileId = String(womanId);
          const targetManId = String(manId);

          //console.log(`🛠 [Дебаг Радара] Анкета: ${myProfileId}, Мужик: ${targetManId}`);

          if (targetManId && targetManId !== "undefined") {
             const smartUid = `${myProfileId}_${targetManId}`;
             const inMemory = wasChatInvited(smartUid);
             //console.log(`🛠 [Дебаг Радара] Шукаємо ключ [${smartUid}] у пам'яті ->`, inMemory);

             if (inMemory) {
                 //console.log("🎯 [Радар] Відповідь на наш інвайт! Збираємо досьє...");
                 fetchLeadProfileAndLog(targetManId, smartUid);
             } else {
                 //console.log("🕵️‍♂️ [Радар] Звичайна переписка. Кидаємо сліпий сигнал.");
                 logInviteAnalytics(null, "reply", smartUid);
             }
          } else {
             //console.log("❌ [Дебаг Радара] НЕ ЗНАЙДЕНО manId у пакеті сокета!");
          }
       }

    } catch (err) {
       // Ігноруємо невалідний JSON
    }
});