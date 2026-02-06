(function () {
    'use strict';

    Lampa.Plugins.add('online_mod_custom', function (api) {
        
        // 1. Добавление единого пункта "ONLINE" в главный список настроек
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name == 'main') {
                var component = e.component;

                // Создаем один общий пункт меню
                var main_item = component.add({
                    title: 'ONLINE',
                    descr: 'Настройки авторизации Rezka и Filmix',
                    type: 'submenu',
                    search: false
                }, function () {
                    // --- Вложенное меню для HD-Rezka ---
                    component.add({
                        title: 'HD-Rezka',
                        descr: 'Зеркало и данные входа',
                        type: 'submenu',
                        search: false
                    }, function () {
                        component.add({
                            title: 'Зеркало HD-Rezka',
                            name: 'rezka_host',
                            type: 'input',
                            placeholder: 'Напр: https://hdrezka.ag',
                            default: 'https://hdrezka.ag'
                        });
                        component.add({
                            title: 'Логин (Email)',
                            name: 'rezka_login',
                            type: 'input',
                            placeholder: 'Введите почту'
                        });
                        component.add({
                            title: 'Пароль',
                            name: 'rezka_password',
                            type: 'input',
                            input: 'password',
                            placeholder: 'Введите пароль'
                        });
                    });

                    // --- Вложенное меню для Filmix ---
                    component.add({
                        title: 'Filmix',
                        descr: 'Токен и зеркало Filmix',
                        type: 'submenu',
                        search: false
                    }, function () {
                        component.add({
                            title: 'Filmix Token',
                            name: 'filmix_token',
                            type: 'input',
                            placeholder: 'Введите API токен'
                        });
                        component.add({
                            title: 'Зеркало Filmix',
                            name: 'filmix_host',
                            type: 'input',
                            placeholder: 'Напр: http://filmix.ac',
                            default: 'http://filmix.ac'
                        });
                    });
                });

                // Добавляем иконку для главного пункта "ONLINE"
                var icon = $('<div class="settings-param__icon">MOD</div>');
                icon.css({
                    'background': '#2ecc71', // Зеленый цвет для выделения
                    'color': '#fff',
                    'padding': '2px 5px',
                    'border-radius': '4px',
                    'font-size': '0.7em',
                    'font-weight': 'bold',
                    'display': 'inline-block',
                    'margin-right': '10px',
                    'line-height': '1'
                });
                main_item.find('.settings-param__name').prepend(icon);
            }

            // Удаляем стандартные источники из раздела "Онлайн кинотеатры", чтобы не дублировались
            if (e.name == 'online') {
                setTimeout(function() {
                    e.body.find('.settings-param').each(function() {
                        var title = $(this).find('.settings-param__name').text();
                        var hide_list = ['Kodik', 'VideoCDN', 'Collaps', 'Tabus', 'Seasonvar', 'Lampa'];
                        if (hide_list.some(v => title.includes(v))) $(this).remove();
                    });
                }, 10);
            }
        });

        // 2. Логика фильтрации: в выдаче только Rezka и Filmix
        Lampa.Component.add('online', function (object) {
            var original_create = this.create;
            this.create = function () {
                if (object.search_results && Array.isArray(object.search_results)) {
                    object.search_results = object.search_results.filter(function(source) {
                        var name = (source.name || '').toLowerCase();
                        return name.includes('rezka') || name.includes('filmix');
                    });
                }
                return original_create.apply(this, arguments);
            };
        });
    });

    window.online_mod_sources = ['filmix', 'rezka'];
})();
