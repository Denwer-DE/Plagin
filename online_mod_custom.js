(function () {
    'use strict';

    Lampa.Plugins.add('online_mod_custom', function (api) {
        try {
            // --- 1. Настройки (Интерфейс авторизации) ---
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name == 'main') {
                    var component = e.component;
                    
                    var main_item = component.add({
                        title: 'ONLINE',
                        descr: 'Настройки Rezka и Filmix',
                        type: 'submenu',
                        search: false
                    }, function () {
                        // Подменю Rezka
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

                        // Подменю Filmix
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

                    if (main_item) {
                        var nameField = main_item.find('.settings-param__name');
                        if (nameField.length > 0) {
                            nameField.prepend('<span style="background: #2ecc71; color: #fff; padding: 2px 5px; border-radius: 4px; font-size: 0.7em; font-weight: bold; margin-right: 10px;">MOD</span>');
                        }
                    }
                }

                // Скрываем лишние источники в настройках стандартного раздела "Онлайн"
                if (e.name == 'online') {
                    var hide_list = ['Kodik', 'VideoCDN', 'Collaps', 'Tabus', 'Seasonvar', 'Lampa'];
                    setTimeout(function() {
                        e.body.find('.settings-param').each(function() {
                            var title = $(this).find('.settings-param__name').text();
                            if (hide_list.some(function(v) { return title.indexOf(v) > -1; })) {
                                $(this).hide();
                            }
                        });
                    }, 50);
                }
            });

            // --- 2. Фильтрация выдачи (Только Rezka и Filmix) ---
            Lampa.Component.add('online', function (object) {
                var original_create = this.create;
                this.create = function () {
                    if (object && object.search_results) {
                        object.search_results = object.search_results.filter(function(source) {
                            var name = (source.name || '').toLowerCase();
                            return name.indexOf('rezka') > -1 || name.indexOf('filmix') > -1;
                        });
                    }
                    return original_create.apply(this, arguments);
                };
            });

            // --- 3. Кнопка в карточке фильма ---
            Lampa.Listener.follow('full', function (e) {
                if (e.type == 'complite') {
                    var container = e.body.find('.full-start__buttons');
                    
                    // Проверка, чтобы кнопка не дублировалась
                    if (container.find('.button--online-custom').length === 0) {
                        // Переименовано в ОНЛАЙН по вашему запросу
                        var button = $('<div class="button--replay full-start__button selector button--online-custom"><span>ОНЛАЙН</span></div>');
                        
                        button.on('hover:enter', function () {
                            // Вызов стандартного компонента с нашей фильтрацией
                            Lampa.Component.item('online', {
                                movie: e.data.movie,
                                search_results: []
                            });
                        });

                        container.append(button);
                    }
                }
            });

        } catch (err) {
            console.log('Online Mod Error:', err);
        }
    });

    window.online_mod_sources = ['filmix', 'rezka'];
})();
