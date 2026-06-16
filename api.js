// ==========================================
// API ФУНКЦІЇ (Зв'язок із серверами alpha.date)
// ==========================================

async function getAllProfiles(token) {
    try {
        const response = await fetch("https://alpha.date/api/operator/profiles", {
            method: "GET",
            headers: getHeaders(token),
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

async function getProfileGallery(token, profileId) {
    try {
        const response = await fetch(`https://alpha.date/api/files/images?external_id=${profileId}`, {
            method: "GET",
            headers: getHeaders(token),
        });
        const data = await response.json();
        return data.images.reduce((acc, file) => {
            if (file.link && file.id) acc[file.link] = String(file.id);
            return acc;
        }, {});
    } catch (error) {
        return {};
    }
}

function extractArray(data) {
    return Array.isArray(data) ? data : data?.response || data?.data || [];
}

async function getTemplates(token, profileId) {
    return await fetchTemplates(token, profileId, "Letter");
}

async function getInviteTemplates(token, profileId) {
    return await fetchTemplates(token, profileId, "Chat");
}

async function fetchTemplates(token, profileId, mailType) {
    try {
        const response = await fetch(`https://alpha.date/api/sender/inviteList?external_id=${profileId}&mail_type=${mailType}`, {
            method: "GET",
            headers: getHeaders(token),
        });
        return extractArray(await response.json());
    } catch (error) {
        return [];
    }
}

async function sendHeartbeatToServer(profilesList = []) {
    const currentKey = window.alphaKey || localStorage.getItem('alphaAccessKey');
    if (!currentKey) return;

    const d = new Date();
    const todayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const stats = JSON.parse(localStorage.getItem("alphaStats_" + todayKey) || '{"invites": 0, "letters": 0}');

    window.dispatchEvent(new CustomEvent("AlphaPing", {
        detail: {
            key: currentKey,
            profiles: profilesList.map(p => p.id),
            stats_invites: stats.invites,
            stats_letters: stats.letters
        }
    }));
}

async function getExternalIdsFromLastMessage(token, chatUids) {
    try {
        const response = await fetch("https://alpha.date/api/chatList/lastMessage", {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify({ chat_uid: chatUids }),
        });
        return await response.json();
    } catch (error) {
        return [];
    }
}

async function collectAllMen(token, profileId) {
    let allClients = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && isRunning) {
        // updatePopup викликається з ui.js
        if(typeof updatePopup === 'function') updatePopup(`Шукаю мужиків (Сторінка ${page})...`);

        const bodyData = {
            user_id: String(profileId),
            chat_uid: false,
            page: page,
            freeze: true,
            limits: null,
            ONLINE_STATUS: 1,
            SEARCH: "",
            CHAT_TYPE: "CHANCE",
            showHidden: 0,
            blockedByWoman: 0,
            blockedByMan: 0,
        };

        try {
            const response = await fetch("https://alpha.date/api/chatList/chatListByUserID", {
                method: "POST",
                headers: getHeaders(token),
                body: JSON.stringify(bodyData),
            });
            const data = await response.json();
            const list = data.response || [];

            if (list.length === 0) {
                hasMore = false;
                break;
            }

            const chatUids = list.map(item => item.chat_uid).filter(uid => uid);

            let messagesData = [];
            if (chatUids.length > 0) {
                const lastMsgResponse = await fetch("https://alpha.date/api/chatList/lastMessage", {
                    method: "POST",
                    headers: getHeaders(token),
                    body: JSON.stringify({ chat_uid: chatUids })
                });
                const lastMsgJson = await lastMsgResponse.json();

                messagesData = lastMsgJson.response || lastMsgJson.data || [];
                if (!Array.isArray(messagesData) && typeof messagesData === 'object') {
                    messagesData = Object.values(messagesData);
                }
            }

            list.forEach((item) => {
                let externalId = null;
                const chatUid = item.chat_uid;
                const msg = messagesData.find(m => m.chat_uid === chatUid);

                if (msg) {
                    if (Number(msg.is_male) === 1) {
                        externalId = msg.sender_external_id;
                    } else {
                        externalId = msg.recipient_external_id;
                    }
                }

                if (!externalId) {
                    externalId = item.male_id;
                }

                if (externalId && !allClients.some((c) => c.id === externalId)) {
                    allClients.push({ id: externalId, chat_uid: chatUid });
                }
            });

            if(typeof updatePopup === 'function') updatePopup(`Збір мужиків (Сторінка ${page})... Знайдено: ${allClients.length}`);
            page++;
            await sleep(500);

        } catch (error) {
            console.error("❌ Помилка при зборі сторінки", page, error);
            hasMore = false;
        }
    }

    return allClients;
}

async function isDuplicateInHistory(token, chatUid, textToCheck) {
    if (!chatUid || !textToCheck) return false;

    try {
       const response = await fetch("https://alpha.date/api/chatList/chatHistory", {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify({ chat_id: chatUid, page: 1 }),
       });

       const data = await response.json();
       const messages = data.response || data.data || [];

       if (!Array.isArray(messages)) return false;

       const normalizedText = String(textToCheck).trim().toLowerCase();

       for (let i = 0; i < messages.length; i++) {
          const msgContent = messages[i].message_content || "";
          if (String(msgContent).trim().toLowerCase() === normalizedText) {
             return true;
          }
       }
       return false;
    } catch (error) {
       return false;
    }
}

async function getRecentHistoryTexts(token, chatUid) {
    if (!chatUid) return [];

    try {
       const response = await fetch("https://alpha.date/api/chatList/chatHistory", {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify({ chat_id: chatUid, page: 1 }),
       });

       const data = await response.json();
       const messages = data.response || data.data || [];

       if (!Array.isArray(messages)) return [];

       return messages.map((m) =>
          String(m.message_content || "").trim().toLowerCase()
       );
    } catch (error) {
       return [];
    }
}

function formatAttachmentsForMail(rawAttachments, imageMap) {
    if (!rawAttachments || rawAttachments.length === 0) return [];

    return rawAttachments.reduce((acc, att) => {
       const realId = imageMap[att.link];

       if (realId) {
          const fileName = att.link.split("/").pop() || "image.jpg";
          acc.push({
             id: realId,
             link: att.link,
             message_type: att.attachment_type || "SENT_IMAGE",
             title: fileName,
          });
       }
       return acc;
    }, []);
}

async function sendLetter(token, profileId, recipientId, template, imageMap) {
    const formattedAttachments = formatAttachmentsForMail(template.attachments, imageMap);

    const bodyData = {
       user_id: Number(profileId),
       recipients: [recipientId],
       message_content: template.message_content,
       message_type: template.message_type || "SENT_TEXT",
       attachments: formattedAttachments,
       parent_mail_id: null,
       is_send_email: false,
    };

    try {
       const response = await fetch("https://alpha.date/api/mailbox/mail", {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify(bodyData),
       });

       const data = await response.json();
       return (response.ok && data.status === true);
    } catch (error) {
       return false;
    }
}

async function disableProfile(profileId) {
    let token = localStorage.getItem("token");
    if (!token) return false;
    token = token.replace(/^"|"$/g, "");

    let operatorId = null;

    try {
        let base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }

        const decoded = JSON.parse(atob(base64));
        operatorId = decoded.id;
    } catch (e) {
        console.error("Помилка парсингу токена:", e);
        return false;
    }

    if (!operatorId) return false;

    const bodyData = {
        "external_id": Number(profileId),
        "operator_id": Number(operatorId),
        "status": 0
    };

    try {
        const response = await fetch("https://alpha.date/api/operator/setProfileOnline", {
            method: "POST",
            headers: getHeaders(token),
            body: JSON.stringify(bodyData)
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function sendInvite(token, profileId, recipientId, template, chatUid) {
    const man = Number(recipientId);
    const woman = Number(profileId);

    const payload = {
       sender_id: woman,
       recipient_id: man,
       message_content: template.message_content,
       message_type: template.message_type || "SENT_TEXT",
       filename: "",
       chance: true
    };

    try {
       const response = await fetch("https://alpha.date/api/chat/message", {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify(payload)
       });

       const data = await response.json();

       if (response.ok && data.status === true) {
          return true;
       } else {
          const backupPayload = { ...payload, chat_uid: chatUid };
          delete backupPayload.chance;

          const backupResponse = await fetch("https://alpha.date/api/chat/message", {
              method: "POST", headers: getHeaders(token), body: JSON.stringify(backupPayload)
          });
          const backupData = await backupResponse.json();

          if (backupResponse.ok && backupData.status === true) {
              console.log(`✅ [УСПІХ-КЛАСИКА] Інвайт залетів до ${man}!`);
              return true;
          } else {
              return false;
          }
       }
    } catch (error) {
       return false;
    }
}