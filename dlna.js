(function () {
    'use strict';

    function startPlugin() {
        // 1. Добавляем раздел в настройки
        Lampa.SettingsApi.add({
            title: 'DLNA IP',
            component: 'dlna_settings',
            // Та самая иконка из левого меню
            icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z" fill="white"/></svg>',
            onRender: function (body) {
                var items = [
                    {
                        title: 'Протокол',
                        name: 'dlna_protocol',
                        type: 'select',
                        values: { 'http': 'HTTP', 'https': 'HTTPS' },
                        default: 'http'
                    },
                    {
                        title: 'IP адрес',
                        name: 'dlna_server_ip',
                        type: 'input',
                        placeholder: '192.168.x.x'
                    },
                    {
                        title: 'Порт',
                        name: 'dlna_server_port',
                        type: 'input',
                        placeholder: '8895'
                    }
                ];

                items.forEach(function (item) {
                    var html = Lampa.Template.get('settings_field', item);
                    var value = Lampa.Storage.get(item.name, item.default || '');

                    if (item.type === 'select') {
                        html.find('.settings-param__value').text(item.values[value] || item.values[item.default]);
                    } else {
                        html.find('.settings-param__value').text(value || item.placeholder);
                    }

                    html.on('hover:enter', function () {
                        if (item.type === 'select') {
                            Lampa.Select.show({
                                title: item.title,
                                items: Object.keys(item.values).map(function(k){ return {title: item.values[k], value: k} }),
                                onSelect: function (sel) {
                                    Lampa.Storage.set(item.name, sel.value);
                                    Lampa.Settings.update();
                                }
                            });
                        } else {
                            Lampa.Input.edit({
                                value: Lampa.Storage.get(item.name, ''),
                                title: item.title
                            }, function (new_value) {
                                Lampa.Storage.set(item.name, new_value);
                                Lampa.Settings.update();
                            });
                        }
                    });
                    body.append(html);
                });
            }
        });

        // 2. Логика формирования ссылки для работы с файлами
        Lampa.Component.add('dlna_browser', function (object) {
            this.create = function () {
                var proto = Lampa.Storage.get('dlna_protocol', 'http');
                var ip = Lampa.Storage.get('dlna_server_ip', '');
                var port = Lampa.Storage.get('dlna_server_port', '');
                
                if (!ip) {
                    return $('<div><div class="empty">Укажите IP в настройках DLNA</div></div>');
                }

                var host = proto + '://' + ip + (port ? ':' + port : '');
                console.log('DLNA Host:', host);

                // Здесь Лампа будет пытаться открыть ваш медиасервер
                // Для каждого сервера (Plex, HMS и т.д.) путь к XML разный
                return $('<div><div class="empty">Подключено к: ' + host + '</div></div>');
            };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
