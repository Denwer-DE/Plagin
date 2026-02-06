(function () {
    'use strict';

    // Вспомогательные функции из online_mod.js
    var Utils = {
        randomHex: function(len) {
            var chars = '0123456789abcdef';
            var str = '';
            for (var i = 0; i < len; i++) str += chars[Math.floor(Math.random() * chars.length)];
            return str;
        },
        filmixToken: function(dev_id, token) {
            return '?user_dev_id=' + dev_id + '&user_dev_name=Xiaomi&user_dev_token=' + token + '&user_dev_vendor=Xiaomi&user_dev_os=14&user_dev_apk=2.2.0&app_lang=ru-rRU';
        }
    };

    // --- ИСТОЧНИК 1: HD-Rezka ---
    function RezkaSource(component, _object) {
        var network = new Lampa.Reguest();
        var mirror = Lampa.Storage.get('online_mod_rezka2_mirror', 'https://hdrezka.ag');

        this.search = function (object, kinopoisk_id) {
            var url = mirror + '/search/?do=search&subaction=search&story=' + encodeURIComponent(object.movie.title);
            network.silent(url, function (html) {
                // Вставьте сюда логику парсинга из online_mod.js (функция rezka2FillCookie и поиск)
                component.loading(false);
                component.append(Lampa.Template.get('online_mod', {title: 'HD-Rezka: ' + object.movie.title}));
            }, function() {
                component.empty();
            });
        };
    }

    // --- ИСТОЧНИК 2: Filmix ---
    function FilmixSource(component, _object) {
        var network = new Lampa.Reguest();
        var token = Lampa.Storage.get('filmix_token', '');
        var dev_token = Utils.filmixToken(Utils.randomHex(16), token || 'default_token');

        this.search = function (object, kinopoisk_id) {
            var url = 'http://filmixapp.vip/api/v2/search' + dev_token + '&story=' + encodeURIComponent(object.movie.title);
            network.silent(url, function (json) {
                if (json && json.length) {
                    component.loading(false);
                    json.forEach(function(item) {
                        component.append(Lampa.Template.get('online_mod', {title: 'Filmix: ' + item.name}));
                    });
                } else component.empty();
            }, function() {
                component.empty();
            });
        };
    }

    // --- ГЛАВНЫЙ КОМПОНЕНТ ПЛАГИНА ---
    function PluginComponent(object) {
        var _this = this;
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer(object);
        
        this.create = function() {
            return scroll.render();
        };

        this.prepare = function() {
            var balanser = Lampa.Storage.get('plugin_preferred_source', 'rezka');
            var source = (balanser === 'rezka') ? new RezkaSource(this, object) : new FilmixSource(this, object);
            source.search(object, object.movie.id);
        };

        this.append = function(item) {
            scroll.append(item);
        };

        this.loading = function(status) {
            // Управление индикатором загрузки
        };

        this.empty = function() {
            scroll.append(Lampa.Template.get('list_empty'));
        };
    }

    // --- РЕГИСТРАЦИЯ И НАСТРОЙКИ ---
    function startPlugin() {
        // Добавляем кнопку в карточку фильма
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var button = $('<div class="full-start__button selector view--online"><span>Смотреть (Rezka/Filmix)</span></div>');
                button.on('hover:enter', function () {
                    Lampa.Activity.push({
                        title: 'Выбор источника',
                        component: 'plugin_online',
                        movie: e.data.movie
                    });
                });
                $('.full-start__buttons', e.context).append(button);
            }
        });

        // Регистрация компонента
        Lampa.Component.add('plugin_online', PluginComponent);

        // Настройки авторизации и источников
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name == 'online_mod') {
                e.body.find('.settings-list').append('<div class="settings-param title">Настройки Источников</div>');
                
                // Переключатель источника
                var source_select = Lampa.Template.get('settings_field_select', {
                    name: 'plugin_preferred_source',
                    title: 'Источник по умолчанию',
                    descr: 'Выберите сервис для поиска'
                });
                e.body.find('.settings-list').append(source_select);

                // Поля авторизации Rezka
                e.body.find('.settings-list').append(Lampa.Template.get('settings_field', {
                    name: 'online_mod_rezka2_name',
                    title: 'Логин HD-Rezka',
                    descr: 'Введите ваш email'
                }));

                // Поля авторизации Filmix
                e.body.find('.settings-list').append(Lampa.Template.get('settings_field', {
                    name: 'filmix_token',
                    title: 'Токен Filmix (PRO)',
                    descr: 'Введите токен из настроек профиля Filmix'
                }));
            }
        });
    }

    // Запуск
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') startPlugin();
    });

})();
