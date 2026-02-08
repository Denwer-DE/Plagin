(function () {
    'use strict';

    // 1. Добавляем пункт в настройки Lampa
    Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'main') {
            var field = $(`<div class="settings-folder selector" data-component="dlna_server">
                <div class="settings-folder__icon">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg>
                </div>
                <div class="settings-folder__name">DLNA Сервер</div>
            </div>`);
            
            field.on('hover:enter', function () {
                Lampa.Settings.update(); // Очищаем текущее окно настроек
                
                var ip_value = Lampa.Storage.get('dlna_server_ip', '');
                
                var item = $(`<div class="settings-param selector">
                    <div class="settings-param__name">IP Адрес сервера</div>
                    <div class="settings-param__value">${ip_value || 'Не указан'}</div>
                    <div class="settings-param__descr">Введите IP и порт (напр. 192.168.1.50:8895)</div>
                </div>`);

                item.on('hover:enter', function () {
                    Lampa.Input.edit({
                        value: ip_value,
                        title: 'IP адрес DLNA',
                        free: true,
                        placeholder: '192.168.1.10:8895'
                    }, function (new_val) {
                        if (new_val) {
                            Lampa.Storage.set('dlna_server_ip', new_val);
                            item.find('.settings-param__value').text(new_val);
                        }
                    });
                });

                e.body.find('.settings-list').html(item);
                Lampa.Controller.focus(e.body.find('.settings-list'));
            });

            e.body.find('.settings-list').append(field);
        }
    });

    // 2. Основной компонент плагина
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
            
            if (!ip) {
                this.showError("IP адрес не задан. Перейдите в Настройки -> DLNA Сервер");
                return;
            }

            if (window.cub && window.cub.dlna) {
                this.drawLoading("Подключение к " + ip + "...");
                window.cub.dlna.browse(ip, '/', function (items) {
                    _this.drawFolder(items, ip);
                }, function () {
                    _this.showError("Ошибка подключения к " + ip + ". Проверьте IP и работу CUB.");
                });
            } else {
                this.showError("Необходим плагин CUB для работы с локальной сетью.");
            }
        };

        this.drawFolder = function (elems, ip) {
            this.activity.loader(false);
            scroll.clear();
            scroll.reset();

            if (!elems || elems.length === 0) {
                scroll.append(new Lampa.Empty({ descr: "Папка пуста" }).render(true));
            } else {
                elems.forEach(function (element) {
                    var is_folder = element.type === 'folder' || element.itemType === 'FOLDER';
                    var item = Lampa.Template.js(is_folder ? 'client_dlna_folder' : 'client_dlna_file');
                    
                    item.find('.client-dlna-device__name, .client-dlna-file__name').text(element.title);
                    
                    item.on('hover:enter', function () {
                        if (is_folder) {
                            _this.drawLoading("Загрузка...");
                            window.cub.dlna.browse(ip, element.id, function (next) {
                                _this.drawFolder(next, ip);
                            });
                        } else {
                            var video = {
                                title: element.title,
                                url: element.url || element.itemUri,
                                quality: 'DLNA'
                            };
                            Lampa.Player.play(video);
                            Lampa.Player.playlist([video]);
                        }
                    });
                    item.on('hover:focus', function () { scroll.update(item); });
                    scroll.append(item);
                });
            }
            this.drawHead(ip);
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

        this.drawHead = function (ip) {
            head.empty();
            head.append('<div class="client-dlna-head__device"><span>DLNA: ' + (ip || 'Нет IP') + '</span></div>');
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                invisible: true,
                toggle: function () {
                    Lampa.Controller.collectionSet(html);
                    Lampa.Controller.collectionFocus(false, html);
                },
                up: function () { Lampa.Controller.toggle('head'); },
                left: function () { Lampa.Controller.toggle('menu'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () { return html; };
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    // Регистрация плагина
    if (!window.plugin_client_dnla) {
        window.plugin_client_dnla = true;
        Lampa.Component.add('client_dnla', Component);
        
        var add = function () {
            var btn = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg></div><div class="menu__text">DLNA</div></li>');
            btn.on('hover:enter', function () {
                Lampa.Activity.push({ title: 'DLNA', component: 'client_dnla' });
            });
            $('.menu .menu__list').eq(0).append(btn);
        };

        if (window.appready) add();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') add(); });
    }
})();
