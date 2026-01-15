(function () {
  'use strict';

  if (typeof window.lampa_settings == 'undefined') {
    window.lampa_settings = {};
  }

  if (typeof window.lampa_settings.services == 'undefined') {
    window.lampa_settings.services = {};
  }

  // Регистрируем параметр в настройках
  Lampa.Settings.add({
    name: 'shots_enable',
    type: 'toggle',
    default: true,
    title: 'Включить Shots'
  });

  // Добавляем отдельный пункт в меню настроек
  Lampa.Settings.listener.follow('open', function (e) {
    if (e.name == 'main') {
      e.body.find('[data-name="shots_enable"]').parent()
        .before('<div class="settings__title">Shots</div>');
    }
  });

  // Проверяем значение
  var shots_enabled = Lampa.Settings.get('shots_enable');

  // Если выключено — отключаем сервис
  if (!shots_enabled) {
    window.lampa_settings.services.shots = false;
  }

  // TV режим
  Lampa.Platform.tv();

})();
