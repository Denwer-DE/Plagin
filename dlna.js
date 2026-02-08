(function () {
    'use strict';

    function Component(object) {
        var html = Lampa.Template.get('client_dlna_main');
        var head = html.find('.client-dlna-main__head');
        var body = html.find('.client-dlna-main__body');
        var scroll, path = [{ id: '0', title: 'Root' }], control_url;

        this.create = function () {
            this.activity.loader(true);
            scroll = new Lampa.Scroll({ mask: true, over: true });
            scroll.minus(head);
            body.append(scroll.render(true));
            this.tryConnect();
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.tryConnect = function () {
            var addr = Lampa.Storage.get('dlna_ip_port', '').trim();
            if (!addr) {
                this.showMessage(Lampa.Lang.translate('dlna_no_ip'));
                return;
            }
            if (!addr.startsWith('http://')) addr = 'http://' + addr;

            // Типичные controlURL пути для разных серверов
            var paths = [
                '/upnp/control/ContentDirectory/1',
                '/ctl/ContentDir',
                '/ContentDirectory/control',
                '/upnp/control/ContentDir',
                '/cds/control',
                '/ContentDir_control'
            ];

            var tried = 0;
            var self = this;

            function tryPath() {
                if (tried >= paths.length) {
                    self.showMessage(Lampa.Lang.translate('dlna_no_control'));
                    return;
                }
                var url = addr + paths[tried++];
                self.showLoading(Lampa.Lang.translate('dlna_trying') + ' ' + paths[tried-1]);

                var test_soap = `<?xml version="1.0"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
<ObjectID>0</ObjectID>
<BrowseFlag>BrowseDirectChildren</BrowseFlag>
<Filter>*</Filter>
<StartingIndex>0</StartingIndex>
<RequestedCount>1</RequestedCount>
<SortCriteria></SortCriteria>
</u:Browse>
</s:Body>
</s:Envelope>`;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/xml; charset="utf-8"',
                        'SOAPAction': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
                    },
                    body: test_soap
                }).then(function(res) {
                    if (!res.ok) throw new Error('HTTP error');
                    return res.text();
                }).then(function(xml) {
                    if (xml.indexOf('Result') > -1) {
                        control_url = url;
                        self.loadFolder();
                    } else {
                        tryPath();
                    }
                }).catch(tryPath);
            }

            tryPath();
        };

        this.loadFolder = function () {
            var obj_id = path[path.length - 1].id;
            this.showLoading();

            var soap = `<?xml version="1.0"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
<ObjectID>${obj_id}</ObjectID>
<BrowseFlag>BrowseDirectChildren</BrowseFlag>
<Filter>*</Filter>
<StartingIndex>0</StartingIndex>
<RequestedCount>500</RequestedCount>
<SortCriteria></SortCriteria>
</u:Browse>
</s:Body>
</s:Envelope>`;

            fetch(control_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset="utf-8"',
                    'SOAPAction': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
                },
                body: soap
            }).then(function(res) {
                if (!res.ok) throw new Error('HTTP error');
                return res.text();
            }).then(function(xml) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(xml, 'text/xml');
                var result = doc.querySelector('Result').textContent;
                var didl = parser.parseFromString(result, 'text/xml');
                var items = [];

                didl.querySelectorAll('container, item').forEach(function(node) {
                    var isFolder = node.tagName === 'container';
                    var titleNode = node.querySelector('title');
                    var title = titleNode ? titleNode.textContent : 'Untitled';
                    var id = node.getAttribute('id');
                    var entry = { id: id, title: title, type: isFolder ? 'FOLDER' : 'VIDEO' };

                    if (!isFolder) {
                        var res = node.querySelector('res');
                        if (res) {
                            entry.url = res.textContent;
                            entry.size = parseInt(res.getAttribute('size') || 0);
                        }
                    }
                    items.push(entry);
                });

                this.renderItems(items);
            }.bind(this)).catch(function(e) {
                this.showMessage(Lampa.Lang.translate('dlna_error') + ': ' + e.message);
            }.bind(this));
        };

        this.renderItems = function (items) {
            scroll.clear();
            items.forEach(function(it) {
                var tpl = it.type === 'FOLDER' ? 'client_dlna_folder' : 'client_dlna_file';
                var el = Lampa.Template.get(tpl);
                el.find('.client-dlna-device__name, .client-dlna-file__name').text(it.title);
                if (it.size) el.find('.client-dlna-file__size').text(Lampa.Utils.bytesToSize(it.size));

                var self = this;
                el.on('hover:enter', function() {
                    if (it.type === 'FOLDER') {
                        path.push({ id: it.id, title: it.title });
                        self.drawHead();
                        self.loadFolder();
                    } else if (it.url) {
                        Lampa.Player.play({ url: it.url, title: it.title });
                    }
                });
                el.on('hover:focus', function() { scroll.update(el); });
                scroll.append(el);
            });
        };

        this.drawHead = function () {
            head.empty();
            path.forEach(function(p, i) {
                if (i > 0) head.append('<span> / </span>');
                head.append('<span>' + p.title + '</span>');
            });
        };

        this.showLoading = function () {
            scroll.clear();
            scroll.append(Lampa.Template.get('client_dlna_loading'));
        };

        this.showMessage = function (msg) {
            scroll.clear();
            scroll.append('<div style="padding:20px;text-align:center;">' + msg + '</div>');
        };

        this.back = function () {
            if (path.length > 1) {
                path.pop();
                this.drawHead();
                this.loadFolder();
            } else {
                Lampa.Activity.backward();
            }
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up: function() { Navigator.move('up'); },
                down: function() { Navigator.move('down'); },
                left: function() { Navigator.move('left'); },
                right: function() { Navigator.move('right'); },
                back: this.back.bind(this)
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            scroll.destroy();
            html.remove();
        };
    }

    function startPlugin() {
        window.plugin_client_dnla = true;

        Lampa.Lang.add({
            dlna_no_ip: { ru: 'Укажите IP:порт медиасервера', en: 'Enter media server IP:port' },
            dlna_trying: { ru: 'Пробуем путь...', en: 'Trying path...' },
            dlna_no_control: { ru: 'Не найден DLNA сервис', en: 'DLNA service not found' },
            dlna_error: { ru: 'Ошибка подключения', en: 'Connection error' }
        });

        var manifest = {
            type: 'plugin',
            version: '1.0.0',
            name: 'DLNA',
            description: 'Просмотр DLNA в локальной сети',
            component: 'client_dlna'
        };
        Lampa.Manifest.plugins = manifest;

        // Шаблоны (простые, универсальные)
        Lampa.Template.add('client_dlna_main', '<div class="client-dlna-main"><div class="client-dlna-main__head"></div><div class="client-dlna-main__body"></div></div>');
        Lampa.Template.add('client_dlna_loading', '<div style="padding:20px;text-align:center;">Загрузка...</div>');
        Lampa.Template.add('client_dlna_folder', '<div class="selector"><div style="padding:10px;">📁 <span class="client-dlna-device__name"></span></div></div>');
        Lampa.Template.add('client_dlna_file', '<div class="selector"><div style="padding:10px;">🎥 <span class="client-dlna-file__name"></span> <span class="client-dlna-file__size"></span></div></div>');

        // Настройки для ввода IP
        Lampa.Settings.add('dlna', {
            title: 'DLNA',
            subtitle: 'Медиасервер в локальной сети',
            icon: '📡',
            params: [{
                id: 'dlna_ip_port',
                type: 'input',
                name: 'IP:порт',
                placeholder: '192.168.1.100:8200',
                value: Lampa.Storage.get('dlna_ip_port', '')
            }]
        });

        Lampa.Settings.listener.follow('change', function (e) {
            if (e.name == 'dlna') {
                Lampa.Storage.set('dlna_ip_port', e.body.find('[data-id="dlna_ip_port"]').val());
            }
        });

        function addButton() {
            var button = $('<li class="menu__item selector"><div class="menu__ico">📡</div><div class="menu__text">DLNA</div></li>');
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

        Lampa.Component.add(manifest.component, Component);

        if (window.appready) addButton();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') addButton();
            });
        }
    }

    if (!window.plugin_client_dnla) startPlugin();
})();