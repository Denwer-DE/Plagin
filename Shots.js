(function () {
    'use strict';

    /**
     * Плагин для отключения всех функций плагина Shots в Lampa
     * Удаляет кадры из фильмов, API запросы к TMDB, и все элементы интерфейса
     */

    var Plugin = {
        name: 'Disable Shots',
        version: '1.0.0',
        description: 'Полностью отключает плагин Shots и все его элементы',
        author: 'Custom'
    };

    // Функция для удаления shots из интерфейса
    function removeShots() {
        try {
            // Удаляем все элементы shots из DOM
            var shotsElements = document.querySelectorAll('.full-start__shots, .full-start-new__shots, [class*="shots"]');
            shotsElements.forEach(function(el) {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });

            // Удаляем стили связанные с shots
            var styleSheets = document.styleSheets;
            for (var i = 0; i < styleSheets.length; i++) {
                try {
                    var rules = styleSheets[i].cssRules || styleSheets[i].rules;
                    if (rules) {
                        for (var j = rules.length - 1; j >= 0; j--) {
                            var rule = rules[j];
                            if (rule.selectorText && rule.selectorText.indexOf('shots') !== -1) {
                                styleSheets[i].deleteRule(j);
                            }
                        }
                    }
                } catch (e) {
                    // Cross-origin stylesheet, пропускаем
                }
            }
        } catch (e) {
            console.log('[Disable Shots] Error removing shots elements:', e);
        }
    }

    // Перехватываем и блокируем компонент Shots
    function disableShotsComponent() {
        try {
            // Пытаемся найти и отключить компонент
            if (typeof Lampa !== 'undefined') {
                // Блокируем создание компонента Shots
                if (Lampa.Component) {
                    var originalAdd = Lampa.Component.add;
                    Lampa.Component.add = function(name, component) {
                        if (name === 'shots' || (typeof name === 'string' && name.toLowerCase().indexOf('shot') !== -1)) {
                            console.log('[Disable Shots] Blocked component:', name);
                            return;
                        }
                        return originalAdd.apply(this, arguments);
                    };
                }

                // Блокируем Template для shots
                if (Lampa.Template) {
                    var originalGet = Lampa.Template.get;
                    Lampa.Template.get = function(name, data) {
                        if (name && typeof name === 'string' && name.indexOf('shots') !== -1) {
                            console.log('[Disable Shots] Blocked template:', name);
                            return $('<div></div>');
                        }
                        return originalGet.apply(this, arguments);
                    };
                }

                // Блокируем Activity для shots
                if (Lampa.Activity) {
                    var originalPush = Lampa.Activity.push;
                    Lampa.Activity.push = function(params) {
                        if (params && params.component === 'shots') {
                            console.log('[Disable Shots] Blocked activity for shots');
                            return;
                        }
                        return originalPush.apply(this, arguments);
                    };
                }
            }
        } catch (e) {
            console.log('[Disable Shots] Error disabling shots component:', e);
        }
    }

    // Блокируем API запросы к TMDB для получения кадров
    function blockShotsAPI() {
        try {
            // Перехватываем сетевые запросы
            if (typeof Lampa !== 'undefined' && Lampa.Api) {
                var originalGet = Lampa.Api.get;
                Lampa.Api.get = function(method, params, successCallback, errorCallback) {
                    // Блокируем запросы на получение images/кадров
                    if (method && (
                        method.indexOf('/images') !== -1 || 
                        method.indexOf('images') !== -1 ||
                        (params && params.append_to_response && params.append_to_response.indexOf('images') !== -1)
                    )) {
                        console.log('[Disable Shots] Blocked API request:', method);
                        // Возвращаем пустой ответ
                        if (typeof successCallback === 'function') {
                            successCallback({images: {backdrops: [], posters: []}});
                        }
                        return;
                    }
                    return originalGet.apply(this, arguments);
                };
            }

            // Блокируем через XMLHttpRequest если Lampa.Api не сработает
            if (typeof window.XMLHttpRequest !== 'undefined') {
                var originalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url) {
                    if (url && typeof url === 'string' && (
                        url.indexOf('images') !== -1 || 
                        url.indexOf('/images') !== -1
                    )) {
                        console.log('[Disable Shots] Blocked XHR request:', url);
                        // Делаем фейковый запрос к пустому эндпоинту
                        arguments[1] = 'data:text/plain,';
                    }
                    return originalOpen.apply(this, arguments);
                };
            }

            // Блокируем через fetch API
            if (typeof window.fetch !== 'undefined') {
                var originalFetch = window.fetch;
                window.fetch = function(url, options) {
                    if (url && typeof url === 'string' && (
                        url.indexOf('images') !== -1 ||
                        url.indexOf('/images') !== -1
                    )) {
                        console.log('[Disable Shots] Blocked fetch request:', url);
                        return Promise.resolve(new Response(JSON.stringify({images: {backdrops: [], posters: []}}), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                    }
                    return originalFetch.apply(this, arguments);
                };
            }
        } catch (e) {
            console.log('[Disable Shots] Error blocking shots API:', e);
        }
    }

    // Очищаем данные shots из хранилища
    function clearShotsData() {
        try {
            // Очищаем localStorage
            if (typeof localStorage !== 'undefined') {
                var keysToRemove = [];
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf('shots') !== -1) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(function(key) {
                    localStorage.removeItem(key);
                });
            }

            // Очищаем через Lampa.Storage если доступно
            if (typeof Lampa !== 'undefined' && Lampa.Storage) {
                var storage = Lampa.Storage.get('shots');
                if (storage) {
                    Lampa.Storage.set('shots', {});
                }
            }
        } catch (e) {
            console.log('[Disable Shots] Error clearing shots data:', e);
        }
    }

    // Мониторинг изменений в DOM и удаление shots элементов
    function observeDOM() {
        try {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (var i = 0; i < mutation.addedNodes.length; i++) {
                            var node = mutation.addedNodes[i];
                            if (node.nodeType === 1) { // Element node
                                // Проверяем класс элемента
                                if (node.className && typeof node.className === 'string' && 
                                    node.className.indexOf('shots') !== -1) {
                                    node.parentNode.removeChild(node);
                                    console.log('[Disable Shots] Removed dynamically added shots element');
                                }
                                // Проверяем вложенные элементы
                                var shotsChildren = node.querySelectorAll('[class*="shots"]');
                                shotsChildren.forEach(function(child) {
                                    if (child && child.parentNode) {
                                        child.parentNode.removeChild(child);
                                    }
                                });
                            }
                        }
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (e) {
            console.log('[Disable Shots] Error setting up DOM observer:', e);
        }
    }

    // Добавляем настройки плагина
    function addSettings() {
        try {
            if (typeof Lampa !== 'undefined' && Lampa.Settings) {
                Lampa.Settings.listener.follow('open', function(e) {
                    if (e.name === 'main') {
                        Lampa.SettingsApi.addComponent({
                            component: 'disable_shots',
                            name: Plugin.name,
                            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 10.59L15.59 7L17 8.41L13.41 12L17 15.59L15.59 17L12 13.41L8.41 17L7 15.59L10.59 12L7 8.41L8.41 7L12 10.59Z" fill="currentColor"/></svg>'
                        });

                        Lampa.SettingsApi.addParam({
                            component: 'disable_shots',
                            param: {
                                name: 'disable_shots_info',
                                type: 'static',
                                default: '<div style="padding: 1em; opacity: 0.7;">Плагин Shots полностью отключен. Все кадры из фильмов и связанные элементы интерфейса удалены. Для включения удалите этот плагин.</div>'
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.log('[Disable Shots] Error adding settings:', e);
        }
    }

    // Инициализация плагина
    function init() {
        console.log('[Disable Shots] Plugin initializing...');
        
        // Применяем все методы отключения
        disableShotsComponent();
        blockShotsAPI();
        clearShotsData();
        removeShots();
        observeDOM();
        addSettings();

        // Периодически очищаем shots элементы (на случай если что-то пропустили)
        setInterval(function() {
            removeShots();
        }, 5000);

        console.log('[Disable Shots] Plugin initialized successfully');
    }

    // Запуск при загрузке Lampa
    if (window.Lampa) {
        init();
    } else {
        // Ждем загрузки Lampa
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 1000);
        });
    }

    // Экспорт плагина для Lampa
    if (typeof Lampa !== 'undefined' && Lampa.Plugins) {
        Lampa.Plugins.add({
            component: 'disable_shots',
            name: Plugin.name,
            version: Plugin.version,
            description: Plugin.description,
            author: Plugin.author
        });
    }

})();
