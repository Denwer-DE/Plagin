(function () {
    'use strict';

    // 1. Создаем компонент для содержимого настроек
    Lampa.Component.add('dlna_ip_component', function (object) {
        var _this = this;
        this.create = function () {
            var ip_value = Lampa.Storage.get('dlna_server_ip', '');
            
            var item = Lampa.Template.js('settings_param');
            item.find('.settings-param__name').text('IP Адрес сервера');
            item.find('.settings-param__value').text(ip_value || 'Не указан');
            item.find('.settings-param__descr').text('Введите IP и порт (напр. 192.168.1.50:8895)');

            item.on('hover:enter', function () {
                Lampa.Input.edit({
                    value: ip_value,
                    title: 'IP адрес DLNA',
                    free: true,
                    placeholder: '192.168.1.10:8895'
                }, function (new_val) {
                    if (new_val) {
                        if (new_val.indexOf('http') !== 0) new_val = 'http://' + new_val;
                        Lampa.Storage.set('dlna_server_ip', new_val);
                        item.find('.settings-param__value').text(new_val);
                    }
                });
            });

            this.append(item);
        };
        this.render = function () { return '<div></div>'; };
        this.destroy = function () {};
    });

    // 2. ПРИНУДИТЕЛЬНОЕ ВНЕДРЕНИЕ (Циклическая проверка)
    // Этот таймер проверяет наличие меню настроек каждые 100мс
    setInterval(function(){
        var settingsList = $('.settings-list');
        // Если нашли список настроек и там еще нет нашего пункта
        if (settingsList.length && !settingsList.find('[data-component="dlna_ip_component"]').length) {
            var field = $('<div class="settings-folder selector" data-component="dlna_ip_component">' +
                '<div class="settings-folder__icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg></div>' +
                '<div class="settings-folder__name">DLNA IP</div>' +
            '</div>');

            field.on('hover:enter', function () {
                Lampa.Settings.main('dlna_ip_component');
            });

            // Вставляем в самое начало списка, чтобы точно увидеть
            settingsList.prepend(field);
            
            // Сообщаем контроллеру, что появились новые элементы для выбора
            if(Lampa.Controller.enabled().name == 'settings') {
                Lampa.Controller.update();
            }
        }
    }, 100);

    // 3. Основной экран DLNA
    function Component(object) {
        var html = Lampa.Template.js('client_dlna_main');
        var scroll;
        var _this = this;

        this.create = function () {
            this.activity.loader(false);
            scroll = new Lampa.Scroll({ mask: true, over: true });
            html.find('.client-dlna-main__body').append(scroll.render(true));
            this.connect();
        };

        this.connect = function () {
            var ip = Lampa.Storage.get('dlna_server_ip', '');
            if (!ip) {
                scroll.append(new Lampa.Empty({ descr: "Укажите IP в Настройки -> DLNA IP" }).render(true));
                this.start();
                return;
            }

            if (window.cub && window.cub.dlna) {
                window.cub.dlna.browse(ip, '/', function (items) {
                    _this.drawFolder(items, ip);
                }, function () {
                    scroll.clear();
                    scroll.append(new Lampa.Empty({ descr: "Ошибка связи с " + ip }).render(true));
                    _this.start();
                });
            }
        };

        this.drawFolder = function (elems, ip) {
            scroll.clear(); scroll.reset();
            if(!elems) return;
            elems.forEach(function (element) {
                var is_folder = element.type === 'folder' || element.itemType === 'FOLDER';
                var item = Lampa.Template.js(is_folder ? 'client_dlna_folder' : 'client_dlna_file');
                item.find('.client-dlna-device__name, .client-dlna-file__name').text(element.title);
                item.on('hover:enter', function () {
                    if (is_folder) {
                        window.cub.dlna.browse(ip, element.id, function (next) { _this.drawFolder(next, ip); });
                    } else {
                        Lampa.Player.play({ title: element.title, url: element.url || element.itemUri });
                    }
                });
                item.on('hover:focus', function () { scroll.update(item); });
                scroll.append(item);
            });
            this.start();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(html); Lampa.Controller.collectionFocus(false, html); },
                left: function () { Lampa.Controller.toggle('menu'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () { return html; };
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    // 4. Регистрация в Меню
    function start() {
        if (!window.plugin_dlna_manual_ready) {
            window.plugin_dlna_manual_ready = true;
            Lampa.Component.add('client_dnla', Component);

            var btn = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg></div><div class="menu__text">DLNA</div></li>');
            btn.on('hover:enter', function () {
                Lampa.Activity.push({ title: 'DLNA', component: 'client_dnla' });
            });
            $('.menu .menu__list').eq(0).append(btn);
        }
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') start(); });

})();
