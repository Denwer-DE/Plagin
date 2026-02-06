(function () {
    'use strict';

    function startPlugin() {
        Lampa.Plugins.add('online_mod_custom', function (api) {
            try {
                // --- 1. Настройки ---
                Lampa.Settings.listener.follow('open', function (e) {
                    if (e.name == 'main') {
                        var component = e.component;
                        
                        // Добавляем пункт в главное меню в общем стиле (без цветов)
                        component.add({
                            title: 'Online Duo',
                            descr: 'Авторизация HD-Rezka и Filmix',
                            type: 'submenu',
                            icon: 'web', // Используем стандартную иконку из пака Lampa
                            search: false
                        }, function () {
                            // Настройки Rezka
                            component.add({
                                title: 'HD-Rezka: Зеркало',
                                name: 'rezka_host',
                                type: 'input',
                                placeholder: 'https://hdrezka.ag',
                                default: 'https://hdrezka.ag'
                            });
                            component.add({
                                title: 'HD-Rezka: Логин',
                                name: 'rezka_login',
                                type: 'input',
                                placeholder: 'Email'
                            });
                            component.add({
                                title: 'HD-Rezka: Пароль',
                                name: 'rezka_password',
                                type: 'input',
                                input: 'password',
                                placeholder: 'Пароль'
                            });
                            
                            component.add({ title: '', type: 'static' }); // Разделитель

                            // Настройки Filmix
                            component.add({
                                title: 'Filmix: Зеркало',
                                name: 'filmix_host',
                                type: 'input',
                                placeholder: 'http://filmix.ac',
                                default: 'http://filmix.ac'
                            });
                            component.add({
                                title: 'Filmix: API Токен',
                                name: 'filmix_token',
                                type: 'input',
                                placeholder: 'Ваш токен'
                            });
                        });
                    }

                    // Скрытие лишних источников
                    if (e.name == 'online') {
                        setTimeout(function() {
                            e.body.find('.settings-param').each(function() {
                                var title = $(this).find('.settings-param__name').text().toLowerCase();
                                var allowed = ['rezka', 'filmix', 'назад'];
                                var is_allowed = allowed.some(function(v) { return title.indexOf(v) > -1; });
                                if (!is_allowed) $(this).hide();
                            });
                        }, 20);
                    }
                });

                // --- 2. Фильтрация источников ---
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

                // --- 3. Кнопка в карточке ---
                Lampa.Listener.follow('full', function (e) {
                    if (e.type == 'complite') {
                        var container = e.body.find('.full-start__buttons');
                        if (container.length && container.find('.button--online-custom').length === 0) {
                            // Обычная системная кнопка
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
    }

    if (window.Lampa) startPlugin();
    else {
        var timer = setInterval(function(){
            if (window.Lampa) {
                clearInterval(timer);
                startPlugin();
            }
        }, 200);
    }
})();

