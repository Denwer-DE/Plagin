(function () {
    'use strict';

    Lampa.Plugins.add('online_mod_custom', function (api) {
        try {
            // --- 1. Настройки (Интерфейс в стиле Lampa) ---
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name == 'main') {
                    var component = e.component;
                    
                    component.add({
                        title: 'ONLINE',
                        descr: 'Настройки Rezka и Filmix',
                        type: 'submenu',
                        icon: 'web', // Системная иконка в стиле настроек на скриншоте
                        search: false
                    }, function () {
                        // Блок HD-Rezka
                        component.add({
                            title: 'Зеркало HD-Rezka',
                            name: 'rezka_host',
                            type: 'input',
                            placeholder: 'https://hdrezka.ag',
                            default: 'https://hdrezka.ag'
                        });
                        component.add({
                            title: 'Логин HD-Rezka',
                            name: 'rezka_login',
                            type: 'input',
                            placeholder: 'Введите почту'
                        });
                        component.add({
                            title: 'Пароль HD-Rezka',
                            name: 'rezka_password',
                            type: 'input',
                            input: 'password',
                            placeholder: 'Введите пароль'
                        });

                        component.add({ title: '', type: 'static' }); // Визуальный разделитель

                        // Блок Filmix
                        component.add({
                            title: 'Зеркало Filmix',
                            name: 'filmix_host',
                            type: 'input',
                            placeholder: 'http://filmix.ac',
                            default: 'http://filmix.ac'
                        });
                        component.add({
                            title: 'Токен Filmix',
                            name: 'filmix_token',
                            type: 'input',
                            placeholder: 'Введите API токен'
                        });
                    });
                }

                // Скрытие всех лишних источников в разделе "Онлайн"
                if (e.name == 'online') {
                    setTimeout(function() {
                        e.body.find('.settings-param').each(function() {
                            var title = $(this).find('.settings-param__name').text().toLowerCase();
                            // Оставляем только нужное
                            var allowed = ['rezka', 'filmix', 'назад'];
                            var is_allowed = allowed.some(function(v) { return title.indexOf(v) > -1; });
                            if (!is_allowed) {
                                $(this).hide();
                            }
                        });
                    }, 30);
                }
            });

            // --- 2. Фильтрация выдачи ---
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

            // --- 3. Кнопка "ОНЛАЙН" в карточке фильма ---
            Lampa.Listener.follow('full', function (e) {
                if (e.type == 'complite') {
                    var container = e.body.find('.full-start__buttons');
                    
                    if (container.length && container.find('.button--online-custom').length === 0) {
                        var button = $('<div class="button--replay full-start__button selector button--online-custom"><i class="icons__play"></i><span>ОНЛАЙН</span></div>');
                        
                        button.on('hover:enter', function () {
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
})();

