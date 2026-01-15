(function () {
  'use strict';

  if (typeof window.lampa_settings == 'undefined') {
    window.lampa_settings = {};
  }

  // Если массива сервисов ещё нет — создаём
  if (typeof window.lampa_settings.services == 'undefined') {
    window.lampa_settings.services = {};
  }

  // Отключаем только shots
  window.lampa_settings.services.shots = false;

  // Оставляем TV-интерфейс
  Lampa.Platform.tv();

})();
