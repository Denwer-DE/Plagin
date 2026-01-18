(function () {
    'use strict';

    Lampa.Platform.tv();

    // SVG иконка
    var icon_server_redirect = `
    <svg width="80" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zm0 4c0 1.1 3.6 2 8 2s8-.9 8-2v2c0 1.1-3.6 2-8 2s-8-.9-8-2v-2zm0 6c0 1.1 3.6 2 8 2s8-.9 8-2v2c0 1.1-3.6 2-8 2s-8-.9-8-2v-2z"/>
      <path fill="currentColor" d="M18 1v3h-3l1.1-1.1a7 7 0 00-10.2 1l-1.5-1a9 9 0 0113.2-1.2L18 1zm0 22v-3h3l-1.1 1.1a7 7 0 01-10.2-1l-1.5 1a9 9 0 0013.2 1.2L18 23z"/>
    </svg>`;

    function startMe() {
        if (window.location.search != '?redirect=1') {
            if (window.location.hostname != Lampa.Storage.get('location_server')) {
                if (Lampa.Storage.get('location_server') != '-' && Lampa.Storage.get('location_server') != '') {
                    window.location.href = 'http://' + Lampa.Storage.get('location_server') + '?redirect=1';
                }
            }
        } else {
            Lampa.Storage.set('location_server', '-');
        }
    }

    Lampa.SettingsApi.addComponent({
        component: 'location_redirect',
        name: 'Смена сервера',
        icon: icon_server_redirect
    });

    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: {
            name: 'location_server',
            type: 'select',
            values: {
                '-': 'Текущий',
                'lampa.byskaz.ru': 'lampa.byskaz.ru',
                'ua.byskaz.ru': 'ua.byskaz.ru',
                'lampa.mx': 'lampa.mx',
                'yumata.github.io': 'yumata.github.io',
                'khuyampa.best': 'khuyampa.best'
                
            },
            default: '-'
        },
        field: {
            name: 'Выберите домен Lampa'
        },
        onChange: function () {
            startMe();
        }
    });

    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startMe();
        });
    }

})();