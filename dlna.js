(function () {
    'use strict';

    function startPlugin() {
        if (window.plugin_client_dnla_ready) return;
        window.plugin_client_dnla_ready = true;

        // --- ХРАНИЛИЩЕ ДАННЫХ ---
        function getDlnaHost() {
            return Lampa.Storage.get('client_dlna_host', '');
        }

        // Автоматическая подстановка протокола для предотвращения блокировок Mixed Content
        function fixProtocol(url) {
            if (!url) return '';
            if (url.indexOf('://') > -1) return url;
            return window.location.protocol + '//' + url.replace(/^\/+/, '');
        }

        // --- КОМПОНЕНТ DLNA (Логика отображения) ---
        function DlnaComponent(object) {
            var network = new Lampa.Reguest();
            var scroll = new Lampa.Scroll({mask: true, over: true});
            var body = $('<div class="category-full"></div>');
            var info = $('<div class="empty"></div>');

            this.create = function () {
                var host = getDlnaHost();
                if (!host) {
                    info.text('Укажите IP медиасервера в настройках DLNA');
                    return info;
                }
                
                var html = $('<div></div>');
                html.append(scroll.render());
                scroll.append(body);
                
                this.refresh();
                return html;
            };

            this.refresh = function() {
                var _this = this;
                body.empty();
                Lampa.Loading.show();

                var targetUrl = fixProtocol(getDlnaHost());

                // Таймаут 8 секунд для ТВ с медленным откликом сети (как VIDAA)
                network.timeout(8000);
                network.native(targetUrl, function(result) {
                    Lampa.Loading.hide();
                    _this.build(result);
                }, function() {
                    Lampa.Loading.hide();
                    body.append('<div class="empty">Не удалось подключиться к <br>'+targetUrl+'<br>Проверьте IP и работу сервера</div>');
                });
            };

            this.build = function(data) {
                Lampa.Noty.show('Соединение с медиасервером установлено');
                body.append('<div class="empty">Сервер найден. Здесь будет список ваших файлов.</div>');
            };

            this.render = function () { return this.create(); };
            this.destroy = function () { network.clear(); scroll.destroy(); };
            this.active = function () { scroll.active(); };
            this.pause = function () {};
        }

        // --- ИНТЕРФЕЙС И НАСТРОЙКИ ---
        let manifest = {
            type: 'plugin',
            version: '1.5.0',
            name: 'DLNA Manual',
            component: 'client_dnla',
        };

        function setupSettings() {
            // Создаем раздел настроек
            Lampa.SettingsApi.addComponent({
                component: 'dlna_manual_settings',
                name: 'DLNA Настройки',
                icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 20h16v-2H4v2zm0-3h16V7H4v10zm0-12v2h16V5H4z"/></svg>'
            });

            // Кнопка ввода IP
            Lampa.SettingsApi.addParam({
                component: 'dlna_manual_settings',
                param: { 
                    name: 'client_dlna_host', 
                    type: 'button' 
                },
                field: {
                    name: 'IP медиасервера',
                    description: getDlnaHost() || 'Например: 192.168.1.15:8080'
                },
                onChange: function() {
                    Lampa.Input.edit({
                        title: 'Введите адрес (IP:Порт)',
                        value: getDlnaHost(),
                        free: true
                    }, function(new_value) {
                        if (new_value) {
                            Lampa.Storage.set('client_dlna_host', new_value.trim());
                            Lampa.Settings.update(); // Обновляет текст в описании кнопки
                            Lampa.Noty.show('Настройки сохранены');
                        }
                    });
                }
            });
        }

        function addMenuButton() {
            let button = $(`<li class="menu__item selector">
                <div class="menu__ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
                </div>
                <div class="menu__text">${manifest.name}</div>
            </li>`);

            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    title: manifest.name,
                    component: manifest.component,
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(button);
        }

        // Регистрация компонента и элементов интерфейса
        Lampa.Component.add(manifest.component, DlnaComponent);
        addMenuButton();
        setupSettings();
    }

    // Инициализация
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
