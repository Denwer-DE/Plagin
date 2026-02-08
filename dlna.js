(function () {
    'use strict';

    function Component(object) {
        var html = Lampa.Template.js('client_dlna_main');
        var head = html.find('.client-dlna-main__head');
        var body = html.find('.client-dlna-main__body');
        var scroll, deviceFinder, listener_id, tree;
        var _this = this;

        this.create = function () {
            this.activity.loader(true);
            
            // Инициализация скролла для плавной работы на Vidaa/Android
            scroll = new Lampa.Scroll({ mask: true, over: true });
            scroll.minus(head);
            body.append(scroll.render(true));

            this.initDiscovery();
        };

        this.initDiscovery = function() {
            // 1. Пытаемся использовать нативный API Samsung (Tizen)
            try {
                var provider = window.serviceProvider || (window.webapis && window.webapis.allshare && window.webapis.allshare.serviceconnector.getServiceProvider());
                if (provider) {
                    deviceFinder = provider.getDeviceFinder();
                    listener_id = deviceFinder.addDeviceDiscoveryListener({
                        ondeviceadded: function() { _this.drawDevices(); },
                        ondeviceremoved: function() { _this.drawDevices(); }
                    });
                    this.drawDevices();
                    return;
                }
            } catch (e) {
                console.log('DLNA', 'Samsung API not available');
            }

            // 2. Если мы на Vidaa, LG или Android — используем CUB Bridge
            if (window.cub && window.cub.dlna) {
                this.drawLoading("Поиск устройств (CUB Bridge)...");
                window.cub.dlna.list(function(devices) {
                    _this.renderList(devices, true);
                }, function() {
                    _this.showError("Не удалось найти устройства через CUB.");
                });
            } else {
                // Если нет ни Tizen API, ни CUB
                this.showError("DLNA не поддерживается. Для Vidaa/LG установите расширение CUB в настройках Lampa.");
            }
        };

        this.drawDevices = function () {
            var devices = [];
            try { 
                devices = deviceFinder.getDeviceList("MEDIAPROVIDER") || []; 
            } catch (e) {}
            this.renderList(devices, false);
        };

        this.renderList = function(devices, isCub) {
            this.activity.loader(false);
            scroll.clear();
            scroll.reset();

            if (devices && devices.length) {
                devices.forEach(function (element) {
                    var item = Lampa.Template.js('client_dlna_device');
                    item.find('.client-dlna-device__name').text(element.name);
                    item.find('.client-dlna-device__ip').text(element.ipAddress || 'DLNA Device');

                    item.on('hover:enter', function () {
                        if (isCub) {
                            _this.drawLoading("Загрузка папок...");
                            window.cub.dlna.browse(element.id, '/', function(items) {
                                _this.drawFolder(items, element.id);
                            });
                        } else {
                            tree = { device: element, tree: [element.rootFolder] };
                            _this.displayFolder();
                        }
                    });

                    item.on('hover:focus', function () { scroll.update(item); });
                    scroll.append(item);
                });
                this.start();
            } else {
                this.drawLoading("Поиск активных серверов...");
            }
            this.drawHead();
        };

        this.displayFolder = function () {
            var device = tree.device;
            var folder = tree.tree[tree.tree.length - 1];
            this.drawLoading("Чтение папки...");
            device.browse(folder, 0, 500, function(items) {
                _this.drawFolder(items);
            }, function() {
                Lampa.Noty.show("Ошибка доступа");
                _this.back();
            });
        };

        this.drawFolder = function (elems, cubDeviceId) {
            this.activity.loader(false);
            scroll.clear();
            scroll.reset();

            elems.forEach(function (element) {
                var is_folder = element.type === 'folder' || element.itemType === 'FOLDER';
                var item = Lampa.Template.js(is_folder ? 'client_dlna_folder' : 'client_dlna_file');
                
                item.find('.client-dlna-device__name, .client-dlna-file__name').text(element.title);
                
                item.on('hover:enter', function () {
                    if (is_folder) {
                        if (cubDeviceId) {
                            window.cub.dlna.browse(cubDeviceId, element.id, function(next) {
                                _this.drawFolder(next, cubDeviceId);
                            });
                        } else {
                            tree.tree.push(element);
                            _this.displayFolder();
                        }
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
            this.drawHead();
            this.start();
        };

        this.showError = function(txt) {
            this.activity.loader(false);
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
            head.empty();
            var title = tree ? tree.device.name : "DLNA Universal";
            head.append('<div class="client-dlna-head__device"><span>' + title + '</span></div>');
        };

        this.back = function () {
            if (tree && tree.tree.length > 1) {
                tree.tree.pop();
                this.displayFolder();
            } else {
                Lampa.Activity.backward();
            }
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
                back: this.back.bind(this)
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () { return html; };
        this.destroy = function () {
            if (listener_id && deviceFinder) deviceFinder.removeDeviceDiscoveryListener(listener_id);
            scroll.destroy();
            html.remove();
        };
    }

    // Регистрация плагина в системе Lampa
    if (!window.plugin_client_dnla) {
        window.plugin_client_dnla = true;
        Lampa.Component.add('client_dnla', Component);
        
        var add = function() {
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
