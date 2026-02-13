(function () {
    'use strict';
    
    // Удаляем кнопку Shots из меню
    function removeMenuButton() {
        // Ищем и удаляем кнопку с иконкой Shots
        $('.menu__item').each(function() {
            if ($(this).find('use[*|href="#sprite-shots"]').length > 0) {
                $(this).remove();
            }
        });
    }
    
    // Удаляем секцию Shots с главного экрана
    Lampa.Listener.follow('activity', function (e) {
        if (e.type == 'start' || e.type == 'render') {
            setTimeout(removeMenuButton, 100);
            
            // Удаляем блок Shots с главного экрана
            $('.content__rows .card--row').each(function() {
                let title = $(this).find('.card--row__title').text();
                if (title === 'Shots') {
                    $(this).remove();
                }
            });
        }
    });
    
    // Удаляем Shots из закладок
    Lampa.Listener.follow('render', function (e) {
        setTimeout(function() {
            // Удаляем секции из закладок (избранное и созданное)
            $('.content__rows .card--row').each(function() {
                let title = $(this).find('.card--row__title').text();
                if (title.includes('shots') || 
                    title.includes('Избранные шоты') || 
                    title.includes('Созданные шоты')) {
                    $(this).remove();
                }
            });
            
            removeMenuButton();
        }, 100);
    });
    
})();
