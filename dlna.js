(function () {
    'use strict';

    function startPlugin() {
        // Добавляем раздел в настройки Лампы
        Lampa.SettingsApi.add({
            title: 'DLNA IP',
            component: 'dlna_settings',
            // Используем текстовую иконку или стандартный класс, если SVG вызывает ошибку
            icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-10-7h9v6h-9z" fill="white"/></svg>',
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
                    var value = Lampa.Storage.get(item.name, item.default || '');
                    var html = Lampa.Template.get('settings_field', item);

                    // Устанавливаем текущее значение
                    if (item.type === 'select') {
                        html.find('.settings-param__value').text(item.values[value] || item.values[item.default]);
                    } else {
                        html.find('.settings-param__value').text(value || item.placeholder);
                    }

                    html.on('hover:enter', function () {
                        if (item.type === 'select') {
                            Lampa.Select.show({
                                title: item.title,
                                items: [
                                    { title: 'HTTP', value: 'http' },
                                    { title: 'HTTPS', value: 'https' }
                                ],
                                onSelect: function (sel) {
                                    Lampa.Storage.set(item.name, sel.value);
                                    Lampa.Noty.show('Протокол изменен');
                                    html.find('.settings-param__value').text(sel.title);
                                }
                            });
                        } else {
                            Lampa.Input.edit({
                                value: Lampa.Storage.get(item.name, ''),
                                title: item.title
                            }, function (new_value) {
                                Lampa.Storage.set(item.name, new_value);
                                Lampa.Noty.show('Сохранено');
                                html.find('.settings-param__value').text(new_value || item.placeholder);
                            });
                        }
                    });
                    body.append(html);
                });
            }
        });
    }

    // Безопасный запуск
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                startPlugin();
            }
        });
    }
})();
