(function () {
    'use strict';

    // Сохраняем настройки в переменную для быстрого доступа
    var getIP = function() {
        return Lampa.Storage.get('dlna_server_ip', '');
    };

    // Функция отрисовки внутреннего меню настроек
    function renderDLNASettings(body) {
        body.empty();
        var ip_value = getIP();
        
        // Создаем элемент настройки вручную без шаблонов для стабильности
        var item = $('<div class="settings-param selector">' +
                        '<div class="settings-param__name">IP Адрес сервера</div>' +
                        '<div class="settings-param__value">' + (ip_value || 'Не указан') + '</div>' +
                        '<div class="settings-param__descr">Введите IP и порт (например, 192.168.1.50:8895)</div>' +
                     '</div>');

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
                    ip_value = new_val;
                }
            });
        });

        body.append(item);
        Lampa.Controller.focus(body);
    }

    // Принудительное внедрение в меню настроек
    var injectInterval = setInterval(function() {
        var settingsList = $('.settings-list');
        if (settingsList.length && !settingsList.find('[data-component="dlna_ip_settings"]').length) {
            
            var dlna_btn = $('<div class="settings-folder selector" data-component="dlna_ip_settings">' +
                                '<div class="settings-folder__icon">' +
                                    '<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg>' +
                                '</div>' +
                                '<div class="settings-folder__name">DLNA IP</div>' +
                             '</div>');
            
            dlna_btn.on('hover:enter', function () {
                // Очищаем текущий вид настроек и рисуем наше меню
                var body = settingsList;
                renderDLNASettings(body);
            });

            // Пытаемся вставить после пункта "Плеер" или "Парсер"
            var target = settingsList.find('[data-component="player"], [data-component="parser"]').last();
            if (target.length) target.after(dlna_btn);
            else settingsList.append(dlna_btn);
            
            Lampa.Controller.update();
        }
    }, 500);

    // Основной компонент DLNA (меню слева)
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
            var ip = getIP();
            if (!ip) return this.showError("Укажите IP в Настройки -> DLNA IP");

            if (window.cub && window.cub.dlna) {
                this.drawLoading("Загрузка...");
                window.cub.dlna.browse(ip, '/', function (items) {
                    _this.drawFolder(items, ip);
                }, function () {
                    _this.showError("Сервер " + ip + " не отвечает.");
                });
            } else {
                this.showError("Установите плагин CUB.");
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

    // Регистрация плагина в левом меню
    if (!window.plugin_client_dnla) {
        window.plugin_client_dnla = true;
        Lampa.Component.add('client_dnla', Component);
        var add = function () {
            var btn = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg></div><div class="menu__text">DLNA</div></li>');
            btn.on('hover:enter', function () { Lampa.Activity.push({ title: 'DLNA', component: 'client_dnla' }); });
            $('.menu .menu__list').eq(0).append(btn);
        };
        if (window.appready) add();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') add(); });
    }
})();
