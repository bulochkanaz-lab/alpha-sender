console.log("🛠 [Локатор SPY] Спроба підключення до матриці...");

const OrigWebSocket = window.WebSocket;

window.WebSocket = function(url, protocols) {
    console.log("🌐 [Локатор SPY] Сайт створює з'єднання:", url);
    const ws = new OrigWebSocket(url, protocols);

    ws.addEventListener('message', function(event) {
        if (typeof event.data === 'string' && event.data.startsWith('42[')) {

            // 🔥 РОЗУМНИЙ ФІЛЬТР: Пропускаємо тільки корисні події
            if (
                event.data.includes('"counters_profile_') ||
                event.data.includes('"user_online"') ||
                event.data.includes('"liked"') ||
                event.data.includes('"message"')
            ) {
                // console.log("🎯 [Локатор SPY] ЗЛОВИЛИ ЦІЛЬ:", event.data.substring(0, 120) + "...");
                window.dispatchEvent(new CustomEvent('AlphaSocketMessage', { detail: event.data }));
            }
        }
    });
    return ws;
};

window.WebSocket.prototype = OrigWebSocket.prototype;
console.log("🕵️‍♂️ [Локатор SPY] Шпигун успішно сидить у засідці (Розумний фільтр УВІМКНЕНО)!");
