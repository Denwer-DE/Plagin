(function () {
    'use strict';

    Lampa.Plugins.add('online_mod_custom', function (api) {
        
        // 1. Настройка отображения в меню "Онлайн"
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name == 'online') {
                var container = e.body;
                
                // Удаляем визуально другие источники из настроек, если они отрисовались
                container.find('.settings-param').each(function() {
                    var title = $(this).find('.settings-param__name').text();
                    var hide_list = ['Kodik', 'VideoCDN', 'Collaps', 'Tabus', 'Seasonvar'];
                    if (hide_list.some(v => title.includes(v))) $(this).remove();
                });

                // Создаем подменю HD-Rezka
                var rezka_item = e.component.add({
                    title: 'HD-Rezka',
                    descr: 'Настройки авторизации и зеркала',
                    type: 'submenu',
                    search: false
                }, function () {
                    e.component.add({
                        title: 'Зеркало HD-Rezka',
                        name: 'rezka_host',
                        type: 'input',
                        placeholder: 'Напр: https://hdrezka.ag',
                        default: 'https://hdrezka.ag'
                    });
                    e.component.add({
                        title: 'Логин (Email)',
                        name: 'rezka_login',
                        type: 'input',
                        placeholder: 'Введите почту'
                    });
                    e.component.add({
                        title: 'Пароль',
                        name: 'rezka_password',
                        type: 'input',
                        input: 'password',
                        placeholder: 'Введите пароль'
                    });
                });

                // Добавление значка HD
                var icon = $('<div class="settings-param__icon">HD</div>');
                icon.css({
                    'background': '#ed7014', // Фирменный оранжевый Rezka
                    'color': '#fff',
                    'padding': '2px 5px',
                    'border-radius': '4px',
                    'font-size': '0.7em',
                    'font-weight': 'bold',
                    'display': 'inline-block',
                    'margin-right': '10px',
                    'line-height': '1'
                });
                rezka_item.find('.settings-param__name').prepend(icon);
            }
        });

        // 2. Логика фильтрации выдачи источников
        // Перехватываем создание компонента онлайн-просмотра
        Lampa.Component.add('online', function (object) {
            var original_create = this.create;
            
            this.create = function () {
                // В этом блоке фильтруем источники перед отрисовкой в карточке фильма
                if (object.search_results) {
                    object.search_results = object.search_results.filter(function(source) {
                        var name = source.name ? source.name.toLowerCase() : '';
                        return name.indexOf('rezka') > -1 || name.indexOf('filmix') > -1;
                    });
                }
                return original_create.apply(this, arguments);
            };
        });
    });

    // 3. Совместимость с парсером (фильтрация на уровне запросов)
    // Ограничиваем список активных балансеров только двумя
    window.online_mod_sources = ['filmix', 'rezka'];

})();
