(function () {
  'use strict';

  var config = {
    version: '1.0.0',
    name: 'Remove Ads'
  };

  function init() {
    if (window.Lampa && Lampa.Player && Lampa.Player.play) {
      var originalPlay = Lampa.Player.play;
      Lampa.Player.play = function (object) {
        object.iptv = true;

        if (object.vast_url) delete object.vast_url;
        if (object.vast_msg) delete object.vast_msg;

        console.log('Remove Ads', 'Ad URLs removed from player object');
        return originalPlay.apply(this, arguments);
      };
      console.log('Remove Ads', 'Configuration plugin loaded, version:', config.version);
      console.log('Remove Ads', 'Player hook initialized successfully');
    } else {
      setTimeout(init, 500);
    }
  }

  init();

})();
