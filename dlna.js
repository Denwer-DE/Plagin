function startPlugin() {
    if (window.plugin_client_dnla) return;
    window.plugin_client_dnla = true;

    // Локализация (оставляем как было)
    Lampa.Lang.add({
        client_dlna_search_device: {
            ru: 'Поиск устройств',
            en: 'Device search'
        },
        client_dlna_nosuport: {
            ru: 'Ваш виджет не поддерживается, обновите виджет на новую версию',
            en: 'Your widget is not supported, update the widget to a newer version'
        },
        client_dlna_all_device: {
            ru: 'Все устройства',
            en: 'All devices'
        }
    });

    const manifest = {
        type: 'plugin',
        version: '1.2.0',
        name: 'DLNA',
        description: 'Просмотр DLNA по указанному IP',
        component: 'client_dnla'
    };

    // Шаблоны (без изменений)
    Lampa.Template.add('client_dlna_main', `
        <div class="client-dlna-main">
            <div class="client-dlna-main__head client-dlna-head"></div>
            <div class="client-dlna-main__body"></div>
        </div>
    `);

    Lampa.Template.add('client_dlna_loading', `
        <div class="client-dlna-loading">
            <div class="client-dlna-loading__title">Загрузка...</div>
            <div class="client-dlna-loading__loader">
                <div class="broadcast__scan"><div></div></div>
            </div>
        </div>
    `);

    Lampa.Template.add('client_dlna_folder', `
        <div class="client-dlna-device selector">
            <div class="client-dlna-device__body">
                <div class="client-dlna-device__icon">
                    <svg viewBox="0 0 408 408" xmlns="http://www.w3.org/2000/svg">
                        <path d="M372 88.661H206.32l-33-39.24a5.001 5.001 0 0 0-4-1.8H36c-19.956.198-36.023 16.443-36 36.4v240c-.001 19.941 16.06 36.163 36 36.36h336c19.94-.197 36.001-16.419 36-36.36v-199c.001-19.941-16.06-36.162-36-36.36z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="client-dlna-device__name"></div>
            </div>
        </div>
    `);

    Lampa.Template.add('client_dlna_file', `
        <div class="client-dlna-file selector">
            <div class="client-dlna-file__body">
                <div class="client-dlna-file__icon">
                    <svg viewBox="0 0 477.867 477.867" xmlns="http://www.w3.org/2000/svg">
                        <path d="M238.933 0C106.974 0 0 106.974 0 238.933s106.974 238.933 238.933 238.933 238.933-106.974 238.933-238.933C477.726 107.033 370.834.141 238.933 0zm100.624 246.546a17.068 17.068 0 0 1-7.662 7.662v.085L195.362 322.56c-8.432 4.213-18.682.794-22.896-7.638a17.061 17.061 0 0 1-1.8-7.722V170.667c-.004-9.426 7.633-17.07 17.059-17.075a17.068 17.068 0 0 1 7.637 1.8l136.533 68.267c8.436 4.204 11.867 14.451 7.662 22.887z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="client-dlna-file__name"></div>
                <div class="client-dlna-file__size"></div>
            </div>
        </div>
    `);

    // Пустые стили (чтобы не было ошибок парсинга @@include)
    Lampa.Template.add(manifest.component + '_style', `<style></style>`);

    // Настройка в меню Lampa → DLNA IP
    Lampa.Settings.add('dlna', {
        component: 'dlna',
        title: 'DLNA IP',
        subtitle: 'IP-адрес DLNA-сервера (пример: 192.168.1.100:8200)',
        icon: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z"/>
            <circle cx="160" cy="250" r="60" fill="currentColor"/>
            <circle cx="320" cy="150" r="60" fill="currentColor"/>
            <circle cx="320" cy="350" r="60" fill="currentColor"/>
            <path fill="currentColor" d="M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z"/>
        </svg>`,
        component: 'dlna',
        params: [{
            id: 'dlna_server_address',
            type: 'input',
            name: 'Адрес сервера',
            placeholder: '192.168.1.100:8200',
            value: Lampa.Storage.get('dlna_server_address', '')
        }]
    });

    // Сохранение при изменении
    Lampa.Settings.listener.follow('change', function(e) {
        if (e.name === 'dlna') {
            const val = e.body.find('[data-id="dlna_server_address"]').val().trim();
            Lampa.Storage.set('dlna_server_address', val);
        }
    });

    // Добавление кнопки в боковое меню
    function addMenuButton() {
        const button = $(`
            <li class="menu__item selector">
                <div class="menu__ico">
                    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z"/>
                        <circle cx="160" cy="250" r="60" fill="currentColor"/>
                        <circle cx="320" cy="150" r="60" fill="currentColor"/>
                        <circle cx="320" cy="350" r="60" fill="currentColor"/>
                        <path fill="currentColor" d="M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z"/>
                    </svg>
                </div>
                <div class="menu__text">${manifest.name}</div>
            </li>
        `);

        button.on('hover:enter', () => {
            Lampa.Activity.push({
                url: '',
                title: manifest.name,
                component: manifest.component,
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(button);
        $('body').append(Lampa.Template.get(manifest.component + '_style', {}, true));
    }

    // Простая функция для размера файла (на случай, если Lampa.Utils.bytesToSize нет)
    function bytesToSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Сам компонент как объект
    const DlnaComponent = {
        init: function() {
            this.activity = Lampa.Activity.active();
            this.head = $('.client-dlna-head', this.activity.elem);
            this.body = $('.client-dlna-main__body', this.activity.elem);
            this.path = [{ id: '0', title: 'Root' }];
            this.load();
        },

        load: function() {
            const server = Lampa.Storage.get('dlna_server_address', '').trim();
            if (!server) {
                this.body.html('<div style="padding: 30px; text-align: center; color: #ccc;">Укажите адрес DLNA-сервера в настройках → DLNA IP</div>');
                return;
            }

            // Обычно control URL выглядит так (minidlna, jellyfin, emby, plex и др.)
            const control_url = `http://${server}/upnp/control/ContentDirectory/1`;

            const object_id = this.path[this.path.length - 1].id;

            this.showLoading();

            this.browse(control_url, object_id, (items) => {
                this.hideLoading();
                this.renderItems(items);
            }, (err) => {
                this.hideLoading();
                this.body.html(`<div style="padding: 30px; text-align: center; color: #e74c3c;">Ошибка подключения:<br>${err}</div>`);
            });
        },

        browse: function(control_url, object_id, success, error) {
            const soap = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
      <ObjectID>${object_id}</ObjectID>
      <BrowseFlag>BrowseDirectChildren</BrowseFlag>
      <Filter>*</Filter>
      <StartingIndex>0</StartingIndex>
      <RequestedCount>200</RequestedCount>
      <SortCriteria></SortCriteria>
    </u:Browse>
  </s:Body>
</s:Envelope>`;

            fetch(control_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset="utf-8"',
                    'SOAPACTION': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
                },
                body: soap
            })
            .then(r => r.text())
            .then(xml => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, 'text/xml');
                const resultNode = doc.querySelector('Result');
                if (!resultNode) throw new Error('Нет Result в ответе');

                const didl = parser.parseFromString(resultNode.textContent, 'text/xml');
                const items = [];

                didl.querySelectorAll('container, item').forEach(node => {
                    const isFolder = node.tagName === 'container';
                    const titleNode = node.querySelector('dc\\:title, title');
                    const title = titleNode ? titleNode.textContent : 'Без названия';

                    const item = {
                        id: node.getAttribute('id'),
                        title: title,
                        type: isFolder ? 'FOLDER' : 'VIDEO'
                    };

                    if (!isFolder) {
                        const res = node.querySelector('res');
                        if (res) {
                            item.url = res.textContent.trim();
                            item.size = parseInt(res.getAttribute('size') || 0, 10);
                        }
                    }

                    items.push(item);
                });

                success(items);
            })
            .catch(err => error(err.message || 'Неизвестная ошибка'));
        },

        renderItems: function(items) {
            this.body.empty();

            items.forEach(item => {
                const template = item.type === 'FOLDER' ? 'client_dlna_folder' : 'client_dlna_file';
                const elem = Lampa.Template.get(template, {});

                $('.client-dlna-device__name, .client-dlna-file__name', elem).text(item.title);

                if (item.type === 'VIDEO' && item.size) {
                    $('.client-dlna-file__size', elem).text(bytesToSize(item.size));
                }

                elem.on('hover:enter', () => {
                    if (item.type === 'FOLDER') {
                        this.path.push({ id: item.id, title: item.title });
                        this.load();
                    } else if (item.url) {
                        Lampa.Player.play({
                            url: item.url,
                            title: item.title
                        });
                    }
                });

                this.body.append(elem);
            });
        },

        showLoading: function() {
            this.body.html(Lampa.Template.get('client_dlna_loading'));
        },

        hideLoading: function() {
            // будет перезаписано renderItems
        }
    };

    // Регистрация компонента
    Lampa.Component.add(manifest.component, DlnaComponent);

    // Добавляем кнопку в меню после готовности приложения
    if (window.appready) {
        addMenuButton();
    } else {
        Lampa.Listener.follow('app', e => {
            if (e.type === 'ready') addMenuButton();
        });
    }

    // Обработка кнопки "Назад"
    Lampa.Listener.follow('back', () => {
        if (Lampa.Activity.active().component === manifest.component) {
            if (DlnaComponent.path && DlnaComponent.path.length > 1) {
                DlnaComponent.path.pop();
                DlnaComponent.load();
                return false; // блокируем стандартный back
            }
        }
    });
}

startPlugin();