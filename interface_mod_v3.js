(function () {
    'use strict';

    function InterfaceModV3() {
        var _this = this;

        // 1. Стилизация: объединяем стили оригинала и наши новые кнопки
        var style = `
            <style>
                /* Стили из оригинала v3 */
                .full-start__buttons { display: flex; flex-wrap: wrap; gap: 10px; }
                .full-start__button { margin-right: 0 !important; }
                
                /* Наши новые кнопки */
                .button--online.focus { 
                    background-color: #28a745 !important; 
                    border-color: #28a745 !important;
                }
                .button--torrents.focus { 
                    background-color: #ff9800 !important; 
                    border-color: #ff9800 !important;
                }
                
                /* Иконки (псевдоэлементы) */
                .button--online span::before { content: '▶  '; }
                .button--torrents span::before { content: '🧲  '; }
            </style>
        `;

        this.init = function () {
            $('body').append(style);

            // Слушаем событие отрисовки карточки
            Lampa.Listener.follow('full', function (e) {
                if (e.type == 'complite') {
                    _this.modifyInterface(e);
                }
            });
        };

        this.modifyInterface = function (e) {
            var container = e.element.find('.full-start__buttons');
            var data = e.object;

            if (container.length) {
                // Очищаем стандартные кнопки, чтобы заменить их своими
                container.empty();

                // Создаем кнопку ОНЛАЙН
                var btnOnline = $('<div class="full-start__button selector button--online"><span>Онлайн</span></div>');
                
                // Создаем кнопку ТОРРЕНТЫ
                var btnTorrents = $('<div class="full-start__button selector button--torrents"><span>Торренты</span></div>');

                // Логика для Онлайн (вызов стандартного компонента online)
                btnOnline.on('hover:enter', function () {
                    Lampa.Component.add('online', {
                        object: data,
                        card: data
                    });
                });

                // Логика для Торрентов (вызов стандартного компонента torrents)
                btnTorrents.on('hover:enter', function () {
                    Lampa.Component.add('torrents', {
                        object: data,
                        card: data
                    });
                });

                // Добавляем кнопки в контейнер
                container.append(btnOnline);
                container.append(btnTorrents);

                // Если в оригинале v3 были дополнительные кнопки (Трейлеры и т.д.), 
                // можно добавить их обратно здесь:
                this.appendExtraButtons(container, data);

                // Обновляем навигацию (контроллер), чтобы фокус работал корректно
                Lampa.Controller.enable('full');
            }
        };

        this.appendExtraButtons = function(container, data) {
            // Кнопка Трейлер (если нужно сохранить функционал оригинала)
            var trailer = $('<div class="full-start__button selector"><span>Трейлер</span></div>');
            trailer.on('hover:enter', function() {
                Lampa.Player.runTrailer(data);
            });
            container.append(trailer);
        };
    }

    // Запуск плагина
    if (window.appready) {
        var mod = new InterfaceModV3();
        mod.init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                var mod = new InterfaceModV3();
                mod.init();
            }
        });
    }
})();
