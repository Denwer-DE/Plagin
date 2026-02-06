(function () {
    'use strict';

    Lampa.Platform.tv();

    var DEFAULT_SERVER = 'lampa.mx';

    var icon_server_redirect = `
    <svg width="80" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zm0 4c0 1.1 3.6 2 8 2s8-.9 8-2v2c0 1.1-3.6 2-8 2s-8-.9-8-2v-2zm0 6c0 1.1 3.6 2 8 2s8-.9 8-2v2c0 1.1-3.6 2-8 2s-8-.9-8-2v-2z"/>
      <path fill="currentColor" d="M18 1v3h-3l1.1-1.1a7 7 0 00-10.2 1l-1.5-1a9 9 0 0113.2-1.2L18 1zm0 22v-3h3l-1.1 1.1a7 7 0 01-10.2-1l-1.5 1a9 9 0 0013.2 1.2L18 23z"/>
    </svg>`;

    function normalizeServer(server) {
        if (!server) return '';
        return server.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }

    function getServer() {
        return normalizeServer(Lampa.Storage.get('location_server', DEFAULT_SERVER)) || DEFAULT_SERVER;
    }

    function redirectToServer(server) {
        var currentHost = window.location.host;
        if (currentHost !== server && server) {
            // Используем относительный протокол //, чтобы не конфликтовать с https
            window.location.href = window.location.protocol + '//' + server;
        }
    }

    function changeServer() {
        var current = getServer();
        
        // Используем Lampa.Input — это самый надежный способ вызвать клавиатуру
        Lampa.Input.edit({
            title: 'Укажите ваш сервер',
            value: current,
            free: true // Позволяет вводить любой текст
        }, function (new_value) {
            if (new_value) {
                var cleanValue = normalizeServer(new_value);
                Lampa.Storage.set('location_server', cleanValue);
                redirectToServer(cleanValue);
            }
        });
    }

    function startMe() {
        // Добавляем небольшую задержку, чтобы избежать циклической ошибки при старте
        setTimeout(function() {
            redirectToServer(getServer());
        }, 500);
    }

    // Регистрация в настройках
    Lampa.SettingsApi.addComponent({
        component: 'location_redirect',
        name: 'Смена сервера',
        icon: icon_server_redirect
    });

    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: {
            name: 'change_server',
            type: 'button'
        },
        field: {
            name: 'Укажите ваш сервер',
            description: 'Текущий: ' + getServer()
        },
        onChange: changeServer
    });

    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startMe();
        });
    }
})();
