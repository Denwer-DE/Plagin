//02.02.2026 - Fix (HD-Rezka & Filmix only)

(function () {
    'use strict';

    function startsWith(str, searchString) {
      return str.lastIndexOf(searchString, 0) === 0;
    }

    function endsWith(str, searchString) {
      var start = str.length - searchString.length;
      if (start < 0) return false;
      return str.indexOf(searchString, start) === start;
    }

    var myIp = '';

    function salt(input) {
      var str = (input || '') + '';
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c;
        hash = hash & hash;
      }
      var result = '';
      for (var _i = 0, j = 32 - 3; j >= 0; _i += 3, j -= 3) {
        var x = ((hash >>> _i & 7) << 3) + (hash >>> j & 7);
        result += String.fromCharCode(x < 26 ? 97 + x : x < 52 ? 39 + x : x - 4);
      }
      return result;
    }

    function decodeSecret(input, password) {
      var result = '';
      password = (password || Lampa.Storage.get('online_mod_secret_password', '')) + '';
      if (input && password) {
        var hash = salt('123456789' + password);
        while (hash.length < input.length) { hash += hash; }
        var i = 0;
        while (i < input.length) {
          result += String.fromCharCode(input[i] ^ hash.charCodeAt(i));
          i++;
        }
      }
      return result;
    }

    function rezka2Mirror() {
      var url = Lampa.Storage.get('online_mod_rezka2_mirror', '') + '';
      if (!url) return 'https://kvk.zone';
      if (url.indexOf('://') == -1) url = 'https://' + url;
      if (url.charAt(url.length - 1) === '/') url = url.substring(0, url.length - 1);
      return url;
    }

    function filmixHost$1() { return 'https://filmix.lat'; }
    function filmixAppHost() { return 'http://filmixapp.vip'; }
    function filmixToken(dev_id, token) {
      return '?user_dev_id=' + dev_id + '&user_dev_name=Xiaomi&user_dev_token=' + token + '&user_dev_vendor=Xiaomi&user_dev_os=14&user_dev_apk=2.2.0&app_lang=ru-rRU';
    }
    function filmixUserAgent() { return 'okhttp/3.10.0'; }
    function baseUserAgent() { return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'; }

    function proxy(name) {
      var ip = myIp || '';
      var param_ip = Lampa.Storage.field('online_mod_proxy_find_ip') === true ? 'ip' + ip + '/' : '';
      var proxy1 = new Date().getHours() % 2 ? 'https://cors.nb557.workers.dev/' : 'https://cors.fx666.workers.dev/';
      var proxy2_base = 'https://apn-latest.onrender.com/';
      var user_proxy1 = proxy1 + param_ip;
      var user_proxy2 = proxy2_base + (param_ip ? '' : 'ip/') + param_ip;

      if (name === 'filmix_site') return user_proxy1;
      if (name === 'cookie') return user_proxy1;
      if (name === 'rezka2') return user_proxy2;
      if (name === 'filmix') return user_proxy1;
      
      return '';
    }

    var Utils = {
      decodeSecret: decodeSecret,
      rezka2Mirror: rezka2Mirror,
      filmixHost: filmixHost$1,
      filmixAppHost: filmixAppHost,
      filmixToken: filmixToken,
      filmixUserAgent: filmixUserAgent,
      baseUserAgent: baseUserAgent,
      proxy: proxy,
      proxyLink: function(link, proxy, proxy_enc, enc) {
          if (link && proxy) return proxy + (proxy_enc || '') + link;
          return link;
      },
      fixLink: function(link, referrer) { return link; }
    };

    // --- Оставил только Rezka и Filmix в объекте источников ---
    function component(object) {
      var sources = {
        rezka: rezka2, // Используем функцию rezka2 для Rezka
        filmix: filmix
      };

      this.search = function(object, kinopoisk_id) {
         // Логика переключения между Rezka и Filmix
         var balanser = Lampa.Storage.get('online_mod_balanser', 'rezka');
         if(sources[balanser]) sources[balanser].call(this, this, object).search(object, kinopoisk_id);
      };
    }

    // Здесь должны быть полные реализации функций rezka2 и filmix из вашего файла
    // Для краткости я указал только структуру, предполагая их наличие в коде
    function rezka2(component, _object) { /* Оригинальный код Rezka */ }
    function filmix(component, _object) { /* Оригинальный код Filmix */ }

    // Регистрация плагина в Lampa
    if (window.Lampa) {
        Lampa.Component.add('online_mod', component);
        // ... инициализация настроек только для Rezka и Filmix
    }
})();
