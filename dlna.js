(function () {
    'use strict';

    function Component(object) {
        var html = Lampa.Template.js('client_dlna_main');
        var head = html.find('.client-dlna-main__head');
        var body = html.find('.client-dlna-main__body');
        var scroll, tree;
        var _this = this;

        this.create = function () {
            this.activity.loader(false);
            scroll = new Lampa.Scroll({ mask: true, over: true });
            scroll.minus(head);
            body.append(scroll.render(true));

            this.renderList();
        };

        // Функция добавления нового IP
        this.addManualServer = function() {
            Lampa.Input.edit({
                value: '',
                title: 'Введите IP сервера и порт',
                free: true,
                placeholder: 'Напр: 192.168.1.50:8895'
            }, function(new_ip) {
                if (new_ip) {
                    var saved = Lampa.Storage.get('custom_dlna_ips', '[]');
                    if (saved.indexOf(new_ip) === -1) {
                        saved.push(new_ip);
                        Lampa.Storage.set('custom_dlna_ips', saved);
                        _this.renderList();
                    }
                }
            });
        };

        // Удаление сервера из списка (через долгое нажатие или отдельную логику)
        this.removeServer = function(ip) {
            var saved = Lampa.Storage.get('custom_dlna_ips', '[]');
            saved = saved.filter(function(item) { return item !== ip; });
            Lampa.Storage.set('custom_dlna_ips', saved);
            this.renderList();
        };

        this.renderList = function() {
            scroll.clear();
            scroll.reset();

            // Кнопка добавления (всегда первая)
            var addBtn = Lampa.Template.js('client_dlna_device');
            addBtn.find('.client-dlna-device__name').text('Добавить медиасервер');
            addBtn.find('.client-dlna-device__ip').text('Нажмите для ввода IP адреса');
            addBtn.on('hover:enter', this.addManualServer.bind(this));
            scroll.append(addBtn);

            // Рендерим сохраненные серверы
            var saved = Lampa.Storage.get('custom_dlna_ips', '[]');
            saved.forEach(function (ip) {
                var item = Lampa.Template.js('client_dlna_device');
                item.find('.client-dlna-device__name').text('DLNA Сервер');
                item.find('.client-dlna-device__ip').text(ip);

                item.on('hover:enter', function () {
                    _this.connectToServer(ip);
                });

                // Удаление по нажатию "Меню" или длительному удержанию (опционально)
                item.on('hover:long', function() {
                    _this.removeServer(ip);
                    Lampa.Noty.show("Сервер удален");
                });

                item.on('hover:focus', function () { scroll.update(item); });
                scroll.append(item);
            });

            this.drawHead();
            this.start();
        };

        this.connectToServer = function(ip) {
            if (window.cub && window.cub.dlna) {
                _this.drawLoading("Подключение к " + ip + "...");
                // Пытаемся зайти сразу в корень через CUB Bridge по прямому адресу
                window.cub.dlna.browse(ip, '/', function(items) {
                    _this.drawFolder(items, ip);
                }, function() {
                    Lampa.Noty.show("Не удалось подключиться к " + ip);
                    _this.renderList();
                });
            } else {
                Lampa.Noty.show("Для работы по IP необходим установленный CUB");
            }
        };

        this.drawFolder = function (elems, ip) {
            this.activity.loader(false);
            scroll.clear();
            scroll.reset();

            if (!elems || elems.length === 0) {
                scroll.append(new Lampa.Empty({ descr: "Папка пуста или доступ запрещен" }).render(true));
            } else {
                elems.forEach(function (element) {
                    var is_folder = element.type === 'folder' || element.itemType === 'FOLDER';
                    var item = Lampa.Template.js(is_folder ? 'client_dlna_folder' : 'client_dlna_file');
                    
                    item.find('.client-dlna-device__name, .client-dlna-file__name').text(element.title);
                    
                    item.on('hover:enter', function () {
                        if (is_folder) {
                            window.cub.dlna.browse(ip, element.id, function(next) {
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
            this.drawHead();
            this.start();
        };

        this.drawLoading = function (text) {
            scroll.clear();
            var load = Lampa.Template.js('client_dlna_loading');
            load.find('.client-dlna-loading__title').text(text);
            scroll.append(load);
        };

        this.drawHead = function () {
            head.empty();
            head.append('<div class="client-dlna-head__device"><span>DLNA Manual IP</span></div>');
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
                back: function() { 
                    if (tree) _this.renderList(); // Если мы в папке, вернуться к списку IP
                    else Lampa.Activity.backward(); 
                }
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () { return html; };
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    if (!window.plugin_client_dnla) {
        window.plugin_client_dnla = true;
        Lampa.Component.add('client_dnla', Component);
        
        var add = function() {
            var btn = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v9H2V6m18 2H4v5h16V8M9 19h6v2H9v-2z"/></svg></div><div class="menu__text">DLNA (IP)</div></li>');
            btn.on('hover:enter', function () {
                Lampa.Activity.push({ title: 'DLNA', component: 'client_dnla' });
            });
            $('.menu .menu__list').eq(0).append(btn);
        };

        if (window.appready) add();
            else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') add(); });
    }
})();
