(function () {
    'use strict';
    
    function init() {
        // Удаляем кнопку Shots из меню
        function removeMenuButton() {
            Lampa.$('.menu__item').each(function() {
                if (Lampa.$(this).find('use[*|href="#sprite-shots"]').length > 0) {
                    Lampa.$(this).remove();
                }
            });
        }
        
        // Удаляем секцию Shots с главного экрана
        Lampa.Listener.follow('activity', function (e) {
            if (e.type == 'start' || e.type == 'render') {
                setTimeout(removeMenuButton, 100);
                
                // Удаляем блок Shots с главного экрана
                Lampa.$('.content__rows .card--row').each(function() {
                    var title = Lampa.$(this).find('.card--row__title').text();
                    if (title === 'Shots') {
                        Lampa.$(this).remove();
                    }
                });
            }
        });
        
        // Удаляем Shots из закладок
        Lampa.Listener.follow('render', function (e) {
            setTimeout(function() {
                // Удаляем секции из закладок (избранное и созданное)
                Lampa.$('.content__rows .card--row').each(function() {
                    var title = Lampa.$(this).find('.card--row__title').text();
                    if (title.includes('shots') || 
                        title.includes('Избранные шоты') || 
                        title.includes('Созданные шоты')) {
                        Lampa.$(this).remove();
                    }
                });
                
                removeMenuButton();
            }, 100);
        });
    }
    
    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') init();
        });
    }
    
})();
