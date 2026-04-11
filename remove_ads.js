(function () {
    'use strict';

    Lampa.Platform.tv();

    function initAdBlock() {
        // CSS-скрытие на случай задержки удаления
        var style = document.createElement('style');
        style.innerHTML = '.ad-server { display: none !important; }';
        document.body.appendChild(style);

        // Удаление при смене активности — только на странице full
        Lampa.Controller.listener.follow('activity', function (e) {
            if (e.name == 'select') {
                setTimeout(function () {
                    if (Lampa.Activity.active().type == 'full') {
                        if (document.querySelector('.ad-server') !== null) {
                            $('.ad-server').remove();
                        }
                    }
                }, 20);
            }
        });
    }

    if (window.lampa_ready) {
        initAdBlock();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                initAdBlock();
            }
        });
    }

})();