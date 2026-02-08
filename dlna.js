(function () {
    'use strict';

    // --- ЛОГИКА НАСТРОЕК (как в Shots) ---
    function initSettings() {
        // Добавляем раздел в список настроек
        Lampa.Settings.add({
            name: 'dlna_server_settings',
            type: 'list',
            title: 'DLNA IP',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg>'
        });

        // Слушатель открытия раздела
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name == 'dlna_server_settings') {
                e.body.empty();
                
                var ip_value = Lampa.Storage.get('dlna_server_ip', '');
                
                // Создаем параметр ввода
                var item = Lampa.Template.js('settings_param');
                item.find('.settings-param__name').text('IP Адрес сервера');
                item.find('.settings-param__value').text(ip_value || 'Не указан');
                item.find('.settings-param__descr').text('Укажите адрес вашего сервера (например, 192.168.1.50:8895)');

                item.on('hover:enter', function () {
                    Lampa.Input.edit({
                        value: ip_value,
                        title: 'IP адрес DLNA',
                        free: true,
                        placeholder: '192.168.1.10:8895'
                    }, function (new_val) {
                        if (new_val) {
                            // Авто-подстановка http://
                            if (new_val.indexOf('http') !== 0) new_val = 'http://' + new_val;
                            
                            Lampa.Storage.set('dlna_server_ip', new_val);
                            item.find('.settings-param__value').text(new_val);
                            ip_value = new_val;
                        }
                    });
                });

                e.body.append(item);
                Lampa.Controller.focus(e.body);
            }
        });
    }

    // --- ОСНОВНОЙ КОМПОНЕНТ ---
    function Component(object) {
        var html = Lampa.Template.js('client_dlna_main');
        var head = html.find('.client-dlna-main__head');
        var body = html.find('.client-dlna-main__body');
        var scroll;
        var _this = this;

        this.create = function () {
            this.activity.loader(false);
            scroll = new Lampa.Scroll({ mask: true, over: true });
            scroll.minus(head);
            body.append(scroll.render(true));
            this.connect();
        };

        this.connect = function () {
            var ip = Lampa.Storage.get('dlna_server_ip', '');
            if (!ip) return this.showError("Укажите IP в Настройки -> DLNA IP");

            if (window.cub && window.cub.dlna) {
                this.drawLoading("Загрузка...");
                window.cub.dlna.browse(ip, '/', function (items) {
                    _this.drawFolder(items, ip);
                }, function () {
                    _this.showError("Сервер " + ip + " не отвечает.");
                });
            } else {
                this.showError("Необходим плагин CUB.");
            }
        };

        this.drawFolder = function (elems, ip) {
            this.activity.loader(false);
            scroll.clear(); scroll.reset();
            if (!elems || !elems.length) {
                scroll.append(new Lampa.Empty({ descr: "Пусто" }).render(true));
            } else {
                elems.forEach(function (element) {
                    var is_folder = element.type === 'folder' || element.itemType === 'FOLDER';
                    var item = Lampa.Template.js(is_folder ? 'client_dlna_folder' : 'client_dlna_file');
                    item.find('.client-dlna-device__name, .client-dlna-file__name').text(element.title);
                    item.on('hover:enter', function () {
                        if (is_folder) {
                            _this.drawLoading("Ждите...");
                            window.cub.dlna.browse(ip, element.id, function (next) { _this.drawFolder(next, ip); });
                        } else {
                            var video = { title: element.title, url: element.url || element.itemUri, quality: 'DLNA' };
                            Lampa.Player.play(video);
                            Lampa.Player.playlist([video]);
                        }
                    });
                    item.on('hover:focus', function () { scroll.update(item); });
                    scroll.append(item);
                });
            }
            this.drawHead();
            this.start();
        };

        this.showError = function (txt) {
            scroll.clear();
            scroll.append(new Lampa.Empty({ descr: txt }).render(true));
            this.start();
        };

        this.drawLoading = function (text) {
            scroll.clear();
            var load = Lampa.Template.js('client_dlna_loading');
            load.find('.client-dlna-loading__title').text(text);
            scroll.append(load);
        };

        this.drawHead = function () {
            head.empty().append('<div class="client-dlna-head__device"><span>DLNA</span></div>');
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                invisible: true,
                toggle: function () { Lampa.Controller.collectionSet(html); Lampa.Controller.collectionFocus(false, html); },
                up: function () { Lampa.Controller.toggle('head'); },
                left: function () { Lampa.Controller.toggle('menu'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () { return html; };
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    // --- ИНИЦИАЛИЗАЦИЯ (в стиле Shots) ---
    function init() {
        initSettings(); // Инициализируем настройки

        Lampa.Component.add('client_dnla', Component); // Добавляем компонент

        // Добавляем кнопку в меню
        Lampa.Menu.addButton({
            title: 'DLNA',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg>',
            onSelect: function() {
                Lampa.Activity.push({ title: 'DLNA', component: 'client_dnla' });
            }
        });
    }

    // Ждем готовности приложения
    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') init();
        });
    }

})();
