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
        var target = normalizeServer(server);
        if (target && currentHost !== target) {
            window.location.href = window.location.protocol + '//' + target;
        }
    }

    function changeServer() {
        var current = getServer();
        
        // Используем расширенные параметры Lampa.Input для Android
        Lampa.Input.edit({
            title: 'Введите адрес сервера',
            value: current,
            free: true,
            nosave: true // Важно для Android: заставляет плагин просто вернуть текст, а не пытаться сохранить его в свои настройки
        }, function (new_value) {
            if (new_value && new_value !== current) {
                var cleanValue = normalizeServer(new_value);
                Lampa.Storage.set('location_server', cleanValue);
                
                // Даем визуальное подтверждение и перезагружаем
                Lampa.Noty.show('Сервер изменен на: ' + cleanValue);
                setTimeout(function(){
                    redirectToServer(cleanValue);
                }, 1000);
            }
        });
    }

    function startMe() {
        var saved = Lampa.Storage.get('location_server', '');
        if (saved) {
            redirectToServer(saved);
        }
    }

    // Регистрация компонента
    Lampa.SettingsApi.addComponent({
        component: 'location_redirect',
        name: 'Смена сервера',
        icon: icon_server_redirect
    });

    // Кнопка в настройках
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: {
            name: 'change_server',
            type: 'button'
        },
        field: {
            name: 'Указать адрес вручную',
            description: 'Текущий адрес: ' + getServer()
        },
        onChange: changeServer
    });

    // Запуск проверки при загрузке
    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startMe();
        });
    }
})();

