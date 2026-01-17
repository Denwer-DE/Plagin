(function () {
  'use strict';

  if (typeof window.lampa_settings == 'undefined') {
    window.lampa_settings = {};
  }

  window.lampa_settings.services = false;  // This will disable shots, sport, and tsarea plugins

  Lampa.Platform.tv();

})();
