(function () {
  'use strict';

  if (typeof window.lampa_settings == 'undefined') {
    window.lampa_settings = {};
  }

  // Initialize nested objects if they don't exist
  if (typeof window.lampa_settings.disable_features == 'undefined') {
    window.lampa_settings.disable_features = {};
  }

  if (typeof window.lampa_settings.developer == 'undefined') {
    window.lampa_settings.developer = {};
  }

  // Apply settings
  window.lampa_settings.dcma = false;
  window.lampa_settings.services = false;  // This will disable shots, sport, and tsarea plugins
  window.lampa_settings.disable_features.dmca = true;
  window.lampa_settings.disable_features.ads = true;
  window.lampa_settings.disable_features.trailers = true;
  window.lampa_settings.developer.ads = false;
  window.lampa_settings.developer.enabled = true;

  function overrideDcmaCheck() {
    // Override the dcma check function to always return false
    if (typeof Lampa !== 'undefined' && Lampa.Utils) {
      Lampa.Utils.dcma = function () { return false; };
    }
  }

  function init() {
    if (typeof Lampa !== 'undefined' && Lampa.Storage) {
      Lampa.Storage.set('developer_enabled', 'true');
      overrideDcmaCheck();
    } else {
      // Wait for Lampa to load
      if (window.appready) {
        if (typeof Lampa !== 'undefined' && Lampa.Storage) {
          Lampa.Storage.set('developer_enabled', 'true');
        }
        overrideDcmaCheck();
      } else {
        // Listen for app ready event
        if (typeof Lampa !== 'undefined' && Lampa.Listener) {
          Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
              if (Lampa.Storage) {
                Lampa.Storage.set('developer_enabled', 'true');
              }
              overrideDcmaCheck();
            }
          });
        }
        // Also try to override immediately if Utils is available
        overrideDcmaCheck();
      }
    }
  }

  init();

})();
