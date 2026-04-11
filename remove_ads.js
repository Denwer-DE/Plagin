// === Комбинированный анти-рекламный плагин для Lampa (lmp + ads) ===
// Адаптировано специально для обычной lampa.mx против видео-преролла
// Работает как один плагин

(function() {
    'use strict';

    console.log('[AntiAd Combined] Запуск комбинированного плагина...');

    // ====================== ЧАСТЬ 1: lmp.js — имитация Premium ======================
    try {
        // Простая и стабильная имитация премиум-статуса
        if (typeof Lampa !== 'undefined' && Lampa.Account) {
            Lampa.Account.hasPremium = function() { return true; };
            console.log('[AntiAd Combined] Premium имитирован успешно');
        } else {
            // Альтернативный способ через localStorage / глобальные флаги
            window.__lampa_premium__ = true;
            if (window.Lampa && Lampa.Settings) {
                Lampa.Settings.set('account_premium', true);
            }
            console.log('[AntiAd Combined] Premium имитирован (альтернативный метод)');
        }
    } catch(e) {
        console.warn('[AntiAd Combined] Ошибка в lmp-части:', e);
    }

    // ====================== ЧАСТЬ 2: ads.js — блокировка видео-рекламы ======================
    try {
        // Перехват создания видео-элементов (блокировка преролла)
        document.createElement = new Proxy(document.createElement, {
            apply(target, thisArg, args) {
                if (args[0] && args[0].toLowerCase() === "video") {
                    console.log('[AntiAd Combined] Перехвачено создание видео (возможно реклама)');

                    let fakeVideo = target.apply(thisArg, args);

                    // Блокируем воспроизведение рекламы
                    const originalPlay = fakeVideo.play;
                    fakeVideo.play = function() {
                        console.log('[AntiAd Combined] Рекламное видео заблокировано!');
                        setTimeout(() => {
                            fakeVideo.ended = true;
                            fakeVideo.dispatchEvent(new Event('ended'));
                            fakeVideo.dispatchEvent(new Event('pause'));
                        }, 300);
                        return Promise.resolve();
                    };

                    return fakeVideo;
                }
                return target.apply(thisArg, args);
            }
        });

        // Очистка всех рекламных таймеров
        function clearAdTimers() {
            console.log('[AntiAd Combined] Очистка рекламных таймеров...');
            let id = setTimeout(() => {}, 0);
            while (id--) {
                clearTimeout(id);
                clearInterval(id);
            }
        }

        // Запускаем очистку сразу и после загрузки
        clearAdTimers();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', clearAdTimers);
        } else {
            clearAdTimers();
        }

        console.log('[AntiAd Combined] Блокировка рекламы в плеере активирована');
    } catch(e) {
        console.warn('[AntiAd Combined] Ошибка в ads-части:', e);
    }

    // ====================== Финализация ======================
    console.log('[AntiAd Combined] Плагин полностью загружен. Видео-реклама должна быть заблокирована.');

    // Дополнительно: принудительно скрываем возможные рекламные оверлеи
    setTimeout(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .ad-overlay, .premium-banner, [class*="ad"], [class*="premium"] { 
                display: none !important; 
            }
        `;
        document.head.appendChild(style);
    }, 1000);

})();