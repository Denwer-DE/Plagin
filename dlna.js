(function () {
    'use strict';

    function Component(object) {
        var html = Lampa.Template.js('torrserve_client_main'),
            head = html.find('.torrserve_client-main__head'),
            body = html.find('.torrserve_client-main__body');
        var listener_id, server, scroll, tree, image;

        this.create = function () {
            this.activity.loader(true);
            server = Lampa.Storage.get('torrserve_server');

            if (server && server.trim() !== '') {
                scroll = new Lampa.Scroll({ mask: true, over: true });
                scroll.minus(head);
                body.append(scroll.render(true));

                tree = {
                    device: { name: server },
                    tree: [{ title: "Торренты", id: "root", hash: null }]
                };

                this.displayFolder();
            } else {
                var empty = new Lampa.Empty({
                    descr: Lampa.Lang.translate('torrserve_client_no_address')
                });
                html.empty().append(empty.render(true));
                this.start = empty.start;
            }

            this.activity.loader(false);
        };

        this.drawLoading = function (text) {
            scroll.clear();
            scroll.reset();
            Lampa.Controller.clear();
            var load = Lampa.Template.js('torrserve_client_loading');
            load.find('.torrserve_client-loading__title').text(text);
            scroll.append(load);
        };

        this.getProxyURL = function (url) {
            var proxy = Lampa.Storage.get('torrserve_proxy');
            if (proxy) {
                if (!proxy.startsWith('http')) proxy = 'http://' + proxy;
                url = proxy + (proxy.endsWith('/') ? '' : '/') + url;
            }
            return url;
        };

        this.drawFolder = function (elems) {
            var _this = this;
            scroll.clear();
            scroll.reset();

            var folders = elems.filter(a => a.type === 'folder');
            var files   = elems.filter(a => a.type === 'file');

            folders.forEach(function (element) {
                var item = $(`
                    <div class="torrserve_client-folder selector">
                        <div class="torrserve_client-folder__icon">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                        </div>
                        <div class="torrserve_client-folder__name">${element.title}</div>
                    </div>
                `);

                item.on('hover:enter', function () {
                    tree.tree.push(element);
                    _this.displayFolder();
                });

                item.on('hover:focus', function () {
                    scroll.update(item);
                });

                scroll.append(item);
            });

            if (files.length) {
                var spl = $('<div class="torrserve_client-main__split">' + Lampa.Lang.translate('title_files') + '</div>');
                scroll.append(spl);

                files.forEach(function (element) {
                    var icon = '';
                    if (element.mime?.startsWith('video')) {
                        icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>';
                    } else if (element.mime?.startsWith('image')) {
                        icon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                    } else if (element.mime?.startsWith('audio')) {
                        icon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
                    }

                    var add = '';
                    if (element.length) add += Lampa.Utils.bytesToSize(element.length) + ' ';
                    if (element.path) add += element.path.split('/').pop();

                    var item = $(`
                        <div class="torrserve_client-file selector">
                            <div class="torrserve_client-file__icon">${icon}</div>
                            <div class="torrserve_client-file__info">
                                <div class="torrserve_client-file__name">${element.title || element.path?.split('/').pop() || 'Файл'}</div>
                                <div class="torrserve_client-file__size">${add}</div>
                            </div>
                        </div>
                    `);

                    item.on('hover:enter', function () {
                        if (element.mime?.startsWith('image')) {
                            var img = $('<img>').attr('src', _this.getProxyURL(element.url))
                                .css({ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, zIndex: 1000, background: 'black' });
                            $('body').append(img);
                            image = img[0];
                            return;
                        }

                        var video = {
                            title: element.title || element.path?.split('/').pop(),
                            url: _this.getProxyURL(element.url)
                        };
                        Lampa.Player.play(video);
                        Lampa.Player.playlist([video]);
                    });

                    item.on('hover:focus', function () {
                        scroll.update(item);
                    });

                    scroll.append(item);
                });
            }

            this.drawHead();
            this.activity.toggle();
        };

        this.drawHead = function () {
            head.empty();
            var nav = [];
            var device_item = $('<div class="torrserve_client-head__device">')
                .html('<svg viewBox="0 0 128 128" fill="currentColor"><!-- твой SVG иконки устройства --></svg><span>' + tree.device.name + '</span>');
            nav.push(device_item);

            tree.tree.forEach(function (folder, i) {
                if (i === 0) return; // пропускаем root
                var folder_item = $('<div class="torrserve_client-head__folder">').text(folder.title);
                nav.push(folder_item);
            });

            nav.forEach((el, i) => {
                if (i > 0) {
                    head.append($('<div class="torrserve_client-head__split">'));
                }
                head.append(el);
            });
        };

        this.displayFolder = function () {
            var _this = this;
            var current = tree.tree[tree.tree.length - 1];
            this.drawLoading(Lampa.Lang.translate('loading'));

            var base = tree.device.name;
            if (!base.endsWith('/')) base += '/';

            if (current.id === "root") {
                fetch(_this.getProxyURL(base + 'torrents'))
                    .then(r => { if (!r.ok) throw r; return r.json(); })
                    .then(data => {
                        var items = (data || []).map(t => ({
                            title: t.title || t.hash.slice(0,10) + '...',
                            type: 'folder',
                            hash: t.hash
                        }));
                        _this.drawFolder(items);
                    })
                    .catch(e => {
                        console.log('TorrServe error:', e);
                        _this.drawFolder([]);
                    });
            } else {
                fetch(_this.getProxyURL(base + 'torrents/' + current.hash))
                    .then(r => { if (!r.ok) throw r; return r.json(); })
                    .then(torrent => {
                        if (torrent?.files) {
                            var files = torrent.files.map((f, idx) => {
                                var path = f.path.join('/');
                                return {
                                    title: path.split('/').pop(),
                                    path: path,
                                    type: 'file',
                                    url: base + 'stream/' + current.hash + '/' + encodeURIComponent(path) + '?index=' + idx + '&play',
                                    mime: f.mime || '',
                                    length: f.length || 0
                                };
                            });
                            _this.drawFolder(files);
                        } else {
                            _this.drawFolder([]);
                        }
                    })
                    .catch(() => {
                        // Добавляем торрент, если не найден
                        fetch(_this.getProxyURL(base + 'torrents'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ link: current.title, save: false })
                        })
                        .then(r => r.json())
                        .then(resp => {
                            current.hash = resp.hash || resp.infohash;
                            _this.displayFolder();
                        })
                        .catch(e => {
                            console.log('Add torrent error:', e);
                            _this.drawFolder([]);
                        });
                    });
            }
        };

        this.back = function () {
            if (image) {
                $(image).remove();
                image = null;
                return;
            }
            if (tree.tree.length > 1) {
                tree.tree.pop();
                this.displayFolder();
            } else {
                Lampa.Activity.backward();
            }
        };

        this.background = function () {
            Lampa.Background.immediately('data:image/png;base64,...'); // твой base64 или оставь как есть
        };

        this.start = function () {
            if (Lampa.Activity.active()?.activity !== this.activity) return;
            this.background();
            // ... остальной код контроллера без изменений ...
        };

        this.render = () => html;
        this.destroy = () => { if (scroll) scroll.destroy(); html.remove(); };
    }

    // ────────────────────────────────────────────────
    // Шаблоны теперь встроены, без зависимости от DLNA
    // ────────────────────────────────────────────────

    function startPlugin() {
        if (window.plugin_torrserve_client) return;
        window.plugin_torrserve_client = true;

        Lampa.Lang.add({
            torrserve_client_no_address: {
                ru: 'Введите адрес TorrServer в настройках',
                en: 'Enter TorrServer address in settings',
                uk: 'Введіть адресу TorrServer у налаштуваннях'
            }
        });

        var manifest = {
            type: 'plugin',
            version: '1.0.3-fixed',
            name: 'TorrServe Client Fixed',
            description: 'TorrServer MatriX клиент (без DLNA зависимости)',
            component: 'torrserve_client'
        };

        Lampa.Manifest.plugins = manifest; // или Lampa.Plugins.add(manifest); в новых версиях

        // Встроенные шаблоны (минимальные, но рабочие)
        Lampa.Template.add('torrserve_client_main', `
            <div class="torrserve_client-main">
                <div class="torrserve_client-main__head torrserve_client-head"></div>
                <div class="torrserve_client-main__body"></div>
            </div>
        `);

        Lampa.Template.add('torrserve_client_loading', `
            <div class="torrserve_client-loading">
                <div class="torrserve_client-loading__title"></div>
                <div class="torrserve_client-loading__loader">
                    <div class="broadcast__scan"><div></div></div>
                </div>
            </div>
        `);

        // Стили — можно взять из старого или добавить свои
        // Lampa.Template.add(manifest.component + '_style', `... твои CSS ...`);

        function add() {
            Lampa.SettingsApi.addComponent({
                component: 'torrserve_client_config',
                name: 'TorrServe',
                icon: `<svg>...</svg>` // твой SVG
            });

            Lampa.SettingsApi.addParam({
                component: 'torrserve_client_config',
                param: { name: 'torrserve_server', type: 'input', default: '' },
                field: { name: 'Адрес TorrServer', description: 'Например, http://192.168.1.100:8090' }
            });

            Lampa.SettingsApi.addParam({
                component: 'torrserve_client_config',
                param: { name: 'torrserve_proxy', type: 'input', default: '' },
                field: { name: 'Прокси (опционально)', description: 'Например, http://192.168.1.125:9118/proxy' }
            });

            // Кнопка в меню
            var button = $(`
                <li class="menu__item selector">
                    <div class="menu__ico">...</div>
                    <div class="menu__text">${manifest.name}</div>
                </li>
            `);
            button.on('hover:enter', () => {
                Lampa.Activity.push({ component: manifest.component, page: 1 });
            });
            $('.menu .menu__list').first().append(button);

            // Если есть стили — $('body').append(Lampa.Template.get(manifest.component + '_style'));
        }

        Lampa.Component.add(manifest.component, Component);

        if (window.appready) add();
        else Lampa.Listener.follow('app', e => { if (e.type === 'ready') add(); });
    }

    startPlugin();
})();