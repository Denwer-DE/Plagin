(function () {
    'use strict';

    function startPlugin() {
        if (window.plugin_client_dnla_ready) return;
        window.plugin_client_dnla_ready = true;

        // 1. Локализация
        Lampa.Lang.add({
            client_dlna_name: { ru: 'DLNA Браузер', en: 'DLNA Browser' },
            client_dlna_empty: { ru: 'Устройства не найдены', en: 'No devices found' },
        });

        // 2. Правильная структура компонента для Lampa
        Lampa.Component.add('client_dnla', function (object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({mask: true, over: true});
            var items = [];
            var html = $('<div></div>');
            var body = $('<div class="category-full"></div>');
            
            // Этот метод Lampa вызывает автоматически при старте
            this.start = function () {
                var _this = this;

                // Убираем лоадер
                this.activity.loader(false);

                // Сообщаем, что здесь пусто (так как мы отвязались от поиска Tizen)
                var empty = $('<div class="empty">' + Lampa.Lang.translate('client_dlna_empty') + '</div>');
                body.append(empty);
                
                scroll.append(body);
                html.append(scroll.render());

                // Даем знать Lampa, что компонент готов к отображению
                if (this.onReady) this.onReady(html);
            };

            // Обязательный метод для отображения содержимого
            this.render = function () {
                return html;
            };

            this.pause = function () {};
            this.stop = function () {};
            
            // Очистка памяти при закрытии
            this.destroy = function () {
                network.clear();
                scroll.destroy();
                if (html) html.remove();
                items = null;
            };
        });

        // 3. Добавление кнопки в меню
        function addMenuButton() {
            var button = $(`<li class="menu__item selector">
                <div class="menu__ico">
                    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M256 0C114.8 0 0 114.8 0 256s114.8 256 256 256 256-114.8 256-256S397.2 0 256 0zm0 472c-119.3 0-216-96.7-216-216S136.7 40 256 40s216 96.7 216 216-96.7 216-216 216z"/>
                        <circle cx="256" cy="256" r="80" fill="currentColor" />
                    </svg>
                </div>
                <div class="menu__text">DLNA</div>
            </li>`);

            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'DLNA',
                    component: 'client_dnla',
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(button);
        }

        if (window.appready) addMenuButton();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addMenuButton();
            });
        }
    }

    if (typeof Lampa !== 'undefined') startPlugin();
})();
