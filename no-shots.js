(function () {
  'use strict';

  // Сообщаем Lampa, что shots "уже загружен"
  // и поэтому встроенный сервис не стартует
  window.plugin_shots_ready = true;

  // Необязательно, но полезно — включаем TV-интерфейс
  Lampa.Platform.tv();

})();
