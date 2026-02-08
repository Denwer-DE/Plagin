(function () {
    'use strict';

    function Component(object) {
      var html = Lampa.Template.js('dlna_client_main'),
          head = html.find('.dlna_client-main__head'),
          body = html.find('.dlna_client-main__body');
      var scroll, torrents = [], server_url, image;

      this.create = function () {
        this.activity.loader(true);
        server_url = Lampa.Storage.get('synology_dlna_server');

        if (server_url && server_url.trim()) {
          if (!server_url.startsWith('http')) server_url = 'http://' + server_url;
          scroll = new Lampa.Scroll({ mask: true, over: true });
          scroll.minus(head);
          body.append(scroll.render(true));
          this.displayTorrents();
        } else {
          var empty = new Lampa.Empty({
            descr: Lampa.Lang.translate('dlna_client_no_address')
          });
          html.empty();
          html.append(empty.render(true));
          this.start = empty.start;
        }

        this.activity.loader(false);
      };

      this.drawLoading = function (text) {
        scroll.clear();
        scroll.reset();
        Lampa.Controller.clear();
        var load = Lampa.Template.js('dlna_client_loading');
        load.find('.dlna_client-loading__title').text(text);
        scroll.append(load);
      };

      this.drawTorrents = function () {
        scroll.clear();
        scroll.reset();

        this.drawHead();

        torrents.forEach((t) => {
          var item = Lampa.Template.js('dlna_client_file');
          var icon = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 477.867 477.867" xml:space="preserve"><path d="M238.933 0C106.974 0 0 106.974 0 238.933s106.974 238.933 238.933 238.933 238.933-106.974 238.933-238.933C477.726 107.033 370.834.141 238.933 0zm100.624 246.546a17.068 17.068 0 0 1-7.662 7.662v.085L195.362 322.56c-8.432 4.213-18.682.794-22.896-7.638a17.061 17.061 0 0 1-1.8-7.722V170.667c-.004-9.426 7.633-17.07 17.059-17.075a17.068 17.068 0 0 1 7.637 1.8l136.533 68.267c8.436 4.204 11.867 14.451 7.662 22.887z" fill="currentColor"></path></svg>';

          item.find('.dlna_client-file__icon').html(icon);
          item.find('.dlna_client-file__name').text(t.title || 'Торрент ' + t.hash.slice(0,12));
          item.find('.dlna_client-file__size').text(t.length ? Lampa.Utils.bytesToSize(t.length) : 'Torrent');

          item.on('hover:enter', () => {
            let file_idx = 0; // первый файл; можно доработать под выбор
            let stream_url = server_url + '/stream/' + t.hash + '/' + file_idx;
            let video = {
              title: t.title || 'DLNA TorrServer',
              url: stream_url
            };
            Lampa.Player.play(video);
            Lampa.Player.playlist([video]);
          });

          item.on('hover:focus', () => scroll.update(item));
          scroll.append(item);
        });

        if (!torrents.length) {
          scroll.append($('<div class="dlna_client-main__split">Нет добавленных торрентов</div>'));
        }

        this.activity.toggle();
      };

      this.drawHead = function () {
        head.empty();
        var nav = [];
        var device_item = document.createElement('div');
        device_item.className = 'dlna_client-head__device';
        var icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 128 128\" xml:space=\"preserve\">\n<path d=\"M111.7 57.1V22.2c0-1.1-.5-2.3-1.4-2.9h-.1c-.6-.4-1.2-.6-2-.6H30.9c-2 0-3.5 1.5-3.5 3.5v31.9h34.9c2.8 0 5.1 2.4 5.1 5.2v15.5h27.5V61.4c0-2.4 1.9-4.2 4.2-4.2h12.6z\" fill=\"currentColor\"></path>\n<path d=\"M96.8 67.6H128v33.2H96.8zM67.3 86.1h27.5v-9.2H67.3zM65.1 59.3c0-1.8-1.3-3.1-3-3.1h-56c-1.7 0-3 1.4-3 3.1v41.9h62zM0 106.1c0 1.7 1.3 3.1 3.1 3.1h62.2c1.7 0 3.1-1.3 3.1-3.1v-2.9H0zM125.8 59.3H99c-1.2 0-2.2.9-2.2 2.2v4.1H128v-4.1c0-1.3-.9-2.2-2.2-2.2zm-9.4 4.1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1h7.9c.6 0 1 .4 1 1 .1.6-.3 1-1 1zm3.8 0h-.4c-.6 0-1-.4-1-1s.4-1 1-1h.4c.6 0 1 .4 1 1s-.4 1-1 1zM96.8 107.1c0 1.2.9 2.2 2.2 2.2h26.8c1.2 0 2.2-1 2.2-2.2V103H96.8zm11.6-2h7.9c.6 0 1 .4 1 1s-.4 1-1 1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1zM81.7 93.7H78v-5.6H67.3v7.6h14.3c.6 0 1-.4 1-1 .1-.6-.3-1-.9-1z\" fill=\"currentColor\"></path>\n</svg>";
        icon += '<span>DLNA TorrServer</span>';
        device_item.innerHTML = icon;
        nav.push(device_item);

        for (var i = 0; i < nav.length; i++) {
          if (i > 0) {
            var spl = document.createElement('div');
            spl.className = 'dlna_client-head__split';
            head.append(spl);
          }
          head.append(nav[i]);
        }
      };

      this.displayTorrents = function () {
        this.drawLoading(Lampa.Lang.translate('loading'));

        $.ajax({
          url: server_url + '/api/v2',
          type: "GET",
          dataType: "json",
          success: (data) => {
            torrents = data || [];
            this.drawTorrents();
          },
          error: () => {
            console.log('DLNA TorrServer', "Ошибка подключения");
            Lampa.Noty.show('Не удалось подключиться к TorrServer');
            this.drawTorrents();
          }
        });
      };

      this.addMagnet = function () {
        Lampa.Input.edit({
          title: 'Magnet-ссылка или хеш торрента',
          value: '',
          free: true
        }, (val) => {
          if (val.trim()) {
            $.ajax({
              url: server_url + '/api/v2',
              type: "POST",
              data: JSON.stringify({ link: val.trim(), save_to: 'cache' }),
              contentType: "application/json",
              success: () => {
                Lampa.Noty.show('Торрент добавлен');
                setTimeout(() => this.displayTorrents(), 2500);
              },
              error: () => Lampa.Noty.show('Ошибка добавления торрента')
            });
          }
        });
      };

      this.back = function () {
        if (image) {
          image.remove();
          image = false;
          return;
        }
        Lampa.Activity.backward();
      };

      this.start = function () {
        if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;
        Lampa.Controller.add('content', {
          invisible: true,
          toggle: function toggle() {
            Lampa.Controller.collectionSet(html);
            Lampa.Controller.collectionFocus(false, html);
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          right: function right() {
            Navigator.move('right');
          },
          down: function down() {
            Navigator.move('down');
          },
          back: this.back.bind(this)
        });
        Lampa.Controller.toggle('content');
      };

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        if (scroll) scroll.destroy();
        html.remove();
      };
    }

    function startPlugin() {
      if (window.plugin_dlna_client) return;
      window.plugin_dlna_client = true;

      Lampa.Lang.add({
        dlna_client_no_address: {
          ru: 'Введите адрес TorrServer в настройках',
          en: 'Enter TorrServer address in settings',
        }
      });

      var manifest = {
        type: 'plugin',
        version: '1.0',
        name: 'DLNA',
        description: 'DLNA клиент для TorrServer Matrix',
        component: 'dlna_client'
      };

      Lampa.Manifest.plugins = manifest;

      // Все шаблоны и стили — копируем из вашего оригинального SynoDLNA кода
      // (вставьте сюда оригинальные Lampa.Template.add('dlna_client_main', ...) и т.д. полностью)
      // Для краткости предполагаем, что они уже есть в Lampa или добавлены ранее; если нет — скопируйте из первого сообщения

      function add() {
        Lampa.SettingsApi.addComponent({
          component: 'dlna_client_config',
          name: 'DLNA',
          icon: "<svg viewBox=\"0 0 512 512\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentColor\" d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z\"></path><circle cx=\"160\" cy=\"250\" r=\"60\" fill=\"currentColor\"></circle><circle cx=\"320\" cy=\"150\" r=\"60\" fill=\"currentColor\"></circle><circle cx=\"320\" cy=\"350\" r=\"60\" fill=\"currentColor\"></circle><path fill=\"currentColor\" d=\"M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z\"></path></svg>"
        });

        Lampa.SettingsApi.addParam({
          component: 'dlna_client_config',
          param: {
            name: 'synology_dlna_server',
            type: 'input',
            placeholder: '',
            default: ''
          },
          field: {
            name: 'Адрес TorrServer',
            description: 'Например, 192.168.1.100:8090'
          }
        });

        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n            " +
            "    <svg viewBox=\"0 0 512 512\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentColor\" d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z\"/>\n                    <circle cx=\"160\" cy=\"250\" r=\"60\" fill=\"currentColor\"/>\n                    <circle cx=\"320\" cy=\"150\" r=\"60\" fill=\"currentColor\"/>\n                    <circle cx=\"320\" cy=\"350\" r=\"60\" fill=\"currentColor\"/><path fill=\"currentColor\" d=\"M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z\"/></svg>\n            </div>\n            <div class=\"menu__text\">DLNA</div>\n        </li>");
        button.on('hover:enter', function () {
          Lampa.Activity.push({
            url: '',
            title: 'DLNA',
            component: 'dlna_client',
            page: 1
          });
        });
        $('.menu .menu__list').eq(0).append(button);
        $('body').append(Lampa.Template.get('dlna_client_style', {}, true));
      }

      Lampa.Component.add('dlna_client', Component);

      if (window.appready) add(); else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }

    if (!window.plugin_dlna_client) startPlugin();

})();