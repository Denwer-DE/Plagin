(function () {
    'use strict';

    function startPlugin() {
        if (window.plugin_client_dnla_ready) return;
        window.plugin_client_dnla_ready = true;

        // 1. Локализация
        Lampa.Lang.add({
            client_dlna_name: { ru: 'DLNA Браузер', en: 'DLNA Browser' },
            client_dlna_empty: { ru: 'Устройства не найдены', en: 'No devices found' },
            client_dlna_help: { ru: 'Поиск локальных медиа-серверов в вашей сети', en: 'Searching for local media servers' }
        });

        // 2. Создаем внутренний компонент вместо внешнего component.js
        function DLNAComponent(object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({mask: true, over: true});
            var items = [];
            var html = $('<div></div>');
            var body = $('<div class="category-full"></div>');
            
            this.create = function () {
                var _this = this;

                // Обработка кнопки "Назад"
                this.activity.loader(true);
                
                // Рендерим пустой список или эмуляцию
                this.build();

                return this.render();
            };

            this.build = function () {
                var _this = this;
                this.activity.loader(false);

                // Если мы на Tizen, здесь должна быть логика поиска устройств
                // На других ОС просто показываем сообщение, что поиск завершен
                var empty = $('<div class="empty">' + Lampa.Lang.translate('client_dlna_empty') + '</div>');
                body.append(empty);
                
                scroll.append(body);
                html.append(scroll.render());
            };

            this.render = function () {
                return html;
            };

            this.pause = function () {};
            this.stop = function () {};
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                html.remove();
                items = null;
            };
        }

        // 3. Регистрация компонента в системе Lampa
        Lampa.Component.add('client_dnla', DLNAComponent);

        // 4. Добавление кнопки в меню
        function addMenuButton() {
            var manifest = {
                name: 'DLNA',
                component: 'client_dnla',
            };

            var button = $(`<li class="menu__item selector">
                <div class="menu__ico">
                    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="256" cy="256" r="200" stroke="currentColor" stroke-width="30" fill="none" />
                        <circle cx="256" cy="256" r="60" fill="currentColor" />
                    </svg>
                </div>
                <div class="menu__text">${manifest.name}</div>
            </li>`);

            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: manifest.name,
                    component: manifest.component,
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(button);
        }

        // Запуск при готовности приложения
        if (window.appready) addMenuButton();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenuButton();
            });
        }
    }

    // Инициализация
    if (typeof Lampa !== 'undefined') {
        startPlugin();
    }
})();
