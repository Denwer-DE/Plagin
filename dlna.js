(function () {
    'use strict';

    function Component(object) {
        var html = Lampa.Template.get('client_dlna_main'),
            head = html.find('.client-dlna-main__head'),
            body = html.find('.client-dlna-main__body');
        var scroll, path = [{ id: '0', title: 'Root' }];

        this.create = function () {
            this.activity.loader(true);

            scroll = new Lampa.Scroll({ mask: true, over: true });
            scroll.minus(head);
            body.append(scroll.render(true));

            this.drawHead();
            this.browse('0');

            this.activity.loader(false);
            this.activity.toggle();
        };

        this.browse = function (objectId) {
            var addr = Lampa.Storage.get('dlna_server_ip', '').trim();
            if (!addr) {
                this.showError(Lampa.Lang.translate('client_dlna_nosuport') + '. Укажите IP:порт в настройках.');
                return;
            }

            if (!addr.startsWith('http://')) addr = 'http://' + addr;

            // Типичные пути controlURL — можно расширить под ваш сервер
            var possiblePaths = [
                '/upnp/control/ContentDirectory/1',
                '/ctl/ContentDir',
                '/ContentDirectory/control',
                '/cds/control',
                '/ContentDir_control'
            ];

            // Для простоты берём первый путь — если не работает, добавьте нужный вручную
            var controlUrl = addr + possiblePaths[0];

            this.drawLoading(Lampa.Lang.translate('client_dlna_search_device'));

            var soap = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
<ObjectID>${objectId}</ObjectID>
<BrowseFlag>BrowseDirectChildren</BrowseFlag>
<Filter>*</Filter>
<StartingIndex>0</StartingIndex>
<RequestedCount>200</RequestedCount>
<SortCriteria></SortCriteria>
</u:Browse>
</s:Body>
</s:Envelope>`;

            fetch(controlUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset="utf-8"',
                    'SOAPACTION': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
                },
                body: soap
            })
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(xml => {
                var parser = new DOMParser();
                var doc = parser.parseFromString(xml, 'text/xml');

                var fault = doc.querySelector('faultstring');
                if (fault) throw new Error(fault.textContent || 'SOAP fault');

                var resultNode = doc.querySelector('Result');
                if (!resultNode) throw new Error('No Result in response');

                var didl = parser.parseFromString(resultNode.textContent, 'text/xml');
                var elems = [];

                didl.querySelectorAll('container, item').forEach(node => {
                    var isFolder = node.tagName.toLowerCase() === 'container';
                    var titleNode = node.querySelector('dc\\:title, title');
                    var title = titleNode ? titleNode.textContent.trim() : 'Без названия';
                    var id = node.getAttribute('id');

                    var entry = {
                        title: title,
                        id: id,
                        itemType: isFolder ? 'FOLDER' : 'VIDEO'
                    };

                    if (!isFolder) {
                        var res = node.querySelector('res');
                        if (res) {
                            entry.itemUri = res.textContent.trim();
                            entry.fileSize = parseInt(res.getAttribute('size') || 0, 10);
                            entry.extension = res.getAttribute('protocolInfo')?.split(':')[2] || '';
                        }
                    }

                    elems.push(entry);
                });

                this.drawFolder(elems);
            })
            .catch(e => {
                this.showError('Ошибка: ' + e.message + '<br>Проверьте IP:порт и путь controlURL');
            });
        };

        this.drawLoading = function (text) {
            scroll.clear();
            var load = Lampa.Template.get('client_dlna_loading');
            load.find('.client-dlna-loading__title').text(text || 'Загрузка...');
            scroll.append(load);
        };

        this.showError = function (msg) {
            scroll.clear();
            scroll.append('<div style="padding:30px;text-align:center;color:#ff4444;font-size:1.2em;">' + msg + '</div>');
        };

        this.drawFolder = function (elems) {
            scroll.clear();

            var folders = elems.filter(a => a.itemType === 'FOLDER');
            var files = elems.filter(a => a.itemType === 'VIDEO');

            folders.forEach(element => {
                var item = Lampa.Template.get('client_dlna_folder');
                item.find('.client-dlna-device__name').text(element.title);
                item.on('hover:enter', () => {
                    path.push({ id: element.id, title: element.title });
                    this.drawHead();
                    this.browse(element.id);
                });
                item.on('hover:focus', () => scroll.update(item));
                scroll.append(item);
            });

            if (files.length) {
                var spl = $('<div class="client-dlna-main__split">' + Lampa.Lang.translate('title_files') + '</div>');
                scroll.append(spl);

                files.forEach(element => {
                    var item = Lampa.Template.get('client_dlna_file');
                    item.find('.client-dlna-file__name').text(element.title);
                    if (element.fileSize) {
                        item.find('.client-dlna-file__size').text(Lampa.Utils.bytesToSize(element.fileSize));
                    }
                    item.on('hover:enter', () => {
                        if (element.itemUri) {
                            var video = { title: element.title, url: element.itemUri };
                            Lampa.Player.play(video);
                            Lampa.Player.playlist([video]);
                        }
                    });
                    item.on('hover:focus', () => scroll.update(item));
                    scroll.append(item);
                });
            }

            this.drawHead();
        };

        this.drawHead = function () {
            head.empty();
            path.forEach((p, i) => {
                if (i > 0) {
                    head.append('<div class="client-dlna-head__split"> → </div>');
                }
                head.append('<span>' + p.title + '</span>');
            });
        };

        this.back = function () {
            if (path.length > 1) {
                path.pop();
                this.drawHead();
                this.browse(path[path.length - 1].id);
            } else {
                Lampa.Activity.backward();
            }
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up: () => Navigator.move('up'),
                down: () => Navigator.move('down'),
                left: () => Navigator.move('left'),
                right: () => Navigator.move('right'),
                back: this.back.bind(this)
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            if (scroll) scroll.destroy();
            html.remove();
        };
    }

    function startPlugin() {
        window.plugin_client_dnla = true;

        Lampa.Lang.add({
            client_dlna_search_device: {
                ru: 'Поиск устройств',
                en: 'Device search'
            },
            client_dlna_nosuport: {
                ru: 'Укажите IP:порт медиасервера в настройках',
                en: 'Specify media server IP:port in settings'
            },
            client_dlna_all_device: {
                ru: 'Все устройства',
                en: 'All devices'
            }
        });

        var manifest = {
            type: 'plugin',
            version: '1.0.0-vidaa-android',
            name: 'DLNA',
            description: 'DLNA по IP для VIDAA, Android и других платформ',
            component: 'client_dnla'
        };

        Lampa.Manifest.plugins = manifest;

        // Шаблоны — копия из оригинала (можно адаптировать)
        Lampa.Template.add('client_dlna_main', `
            <div class="client-dlna-main">
                <div class="client-dlna-main__head client-dlna-head"></div>
                <div class="client-dlna-main__body"></div>
            </div>
        `);

        Lampa.Template.add('client_dlna_loading', `
            <div class="client-dlna-loading">
                <div class="client-dlna-loading__title"></div>
                <div class="broadcast__scan"><div></div></div>
            </div>
        `);

        Lampa.Template.add('client_dlna_device', `
            <div class="client-dlna-device selector">
                <div class="client-dlna-device__body">
                    <div class="client-dlna-device__icon">
                        <svg>...</svg> <!-- оставьте как в оригинале или упростите -->
                    </div>
                    <div class="client-dlna-device__name"></div>
                    <div class="client-dlna-device__ip"></div>
                </div>
            </div>
        `);

        Lampa.Template.add('client_dlna_folder', `
            <div class="client-dlna-device selector">
                <div class="client-dlna-device__body">
                    <div class="client-dlna-device__icon">📁</div>
                    <div class="client-dlna-device__name"></div>
                </div>
            </div>
        `);

        Lampa.Template.add('client_dlna_file', `
            <div class="client-dlna-file selector">
                <div class="client-dlna-file__body">
                    <div class="client-dlna-file__icon">🎥</div>
                    <div class="client-dlna-file__name"></div>
                    <div class="client-dlna-file__size"></div>
                </div>
            </div>
        `);

        Lampa.Template.add(manifest.component + '_style', `
            <style>
                /* Возьмите стили из оригинального плагина или упростите */
                .client-dlna-head { display: flex; flex-wrap: wrap; padding: 10px; background: #111; color: #ddd; }
                .client-dlna-head__split { margin: 0 8px; opacity: 0.6; }
                .client-dlna-device, .client-dlna-file { padding: 12px; }
                .client-dlna-main__split { padding: 15px; font-size: 1.3em; color: #aaa; }
            </style>
        `);

        // Настройки — ручной ввод IP:порт
        Lampa.Settings.add('dlna', {
            title: 'DLNA',
            subtitle: 'Медиасервер в локальной сети',
            component: 'dlna',
            fields: [{
                name: 'dlna_server_ip',
                type: 'input',
                title: 'IP:порт сервера',
                placeholder: '192.168.1.100:8200',
                default: ''
            }]
        });

        function addButton() {
            var btn = $('<li class="menu__item selector"><div class="menu__text">DLNA</div></li>');
            btn.on('hover:enter', () => {
                Lampa.Activity.push({
                    url: '',
                    title: manifest.name,
                    component: manifest.component,
                    page: 1
                });
            });
            $('.menu .menu__list').eq(0).append(btn);
            $('body').append(Lampa.Template.get(manifest.component + '_style', {}, true));
        }

        Lampa.Component.add(manifest.component, Component);

        if (window.appready) addButton();
        else {
            Lampa.Listener.follow('app', e => {
                if (e.type === 'ready') addButton();
            });
        }
    }

    if (!window.plugin_client_dnla) startPlugin();
})();