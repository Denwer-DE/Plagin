(function () {
    'use strict';

    function Component(object) {
      var html = Lampa.Template.js('torrserve_client_main'),
          head = html.find('.torrserve_client-main__head'),
          body = html.find('.torrserve_client-main__body');
      var listener_id, server, scroll, tree, image;

      this.create = function () {
        this.activity.loader(true);
        server = Lampa.Storage.get('torrserve_server');

        if (server !== undefined && server !== null && server !== '') {
          scroll = new Lampa.Scroll({
            mask: true,
            over: true
          });
          scroll.minus(head);
          body.append(scroll.render(true));
          tree = {
            device: {name: server},
            tree: [{title:"Торренты", id: "root", hash: null}]
          };
          this.displayFolder();
        } else {
          var empty = new Lampa.Empty({
            descr: Lampa.Lang.translate('torrserve_client_no_address')
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
        var load = Lampa.Template.js('torrserve_client_loading');
        load.find('.torrserve_client-loading__title').text(text);
        scroll.append(load);
      };

      // Прокси оставляем для совместимости (если нужен обход CORS)
      this.getProxyURL = function (url) {
        var proxy = Lampa.Storage.get('torrserve_proxy');
        if (proxy) {
          if (proxy.indexOf('http') === -1) proxy = 'http://' + proxy;  
          url = proxy + (proxy.endsWith('/') ? '' : '/') + url;
        }
        return url;        
      }

      this.drawFolder = function (elems) {
        var _this2 = this;

        scroll.clear();
        scroll.reset();
        var folders = elems.filter(function (a) { return a.type === 'folder'; });
        var files   = elems.filter(function (a) { return a.type === 'file'; });

        folders.forEach(function (element) {
          var item = Lampa.Template.js('torrserve_client_folder');
          item.find('.torrserve_client-device__name').text(element.title);
          item.on('hover:enter', function () {
            tree.tree.push(element);
            _this2.displayFolder();
          });
          item.on('hover:focus', function () {
            scroll.update(item);
          });
          scroll.append(item);
        });

        if (files.length) {
          var spl = document.createElement('div');
          spl.addClass('torrserve_client-main__split');
          spl.text(Lampa.Lang.translate('title_files'));
          scroll.append(spl);
          files.forEach(function (element) {
            var item = Lampa.Template.js('torrserve_client_file');
            var icon = '';
            if(element.mime && element.mime.startsWith('video')) {
              icon = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 477.867 477.867" xml:space="preserve"><path d="M238.933 0C106.974 0 0 106.974 0 238.933s106.974 238.933 238.933 238.933 238.933-106.974 238.933-238.933C477.726 107.033 370.834.141 238.933 0zm100.624 246.546a17.068 17.068 0 0 1-7.662 7.662v.085L195.362 322.56c-8.432 4.213-18.682.794-22.896-7.638a17.061 17.061 0 0 1-1.8-7.722V170.667c-.004-9.426 7.633-17.07 17.059-17.075a17.068 17.068 0 0 1 7.637 1.8l136.533 68.267c8.436 4.204 11.867 14.451 7.662 22.887z" fill="currentColor"></path></svg>';
            }
            if(element.mime && element.mime.startsWith('image')) {
              icon ='<svg fill="currentColor" height="800px" width="800px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 489.4 489.4" xml:space="preserve"><g><g><path d="M0,437.8c0,28.5,23.2,51.6,51.6,51.6h386.2c28.5,0,51.6-23.2,51.6-51.6V51.6c0-28.5-23.2-51.6-51.6-51.6H51.6  C23.1,0,0,23.2,0,51.6C0,51.6,0,437.8,0,437.8z M437.8,464.9H51.6c-14.9,0-27.1-12.2-27.1-27.1v-64.5l92.8-92.8l79.3,79.3  c4.8,4.8,12.5,4.8,17.3,0l143.2-143.2l107.8,107.8v113.4C464.9,452.7,452.7,464.9,437.8,464.9z M51.6,24.5h386.2  c14.9,0,27.1,12.2,27.1,27.1v238.1l-99.2-99.1c-4.8-4.8-12.5-4.8-17.3,0L205.2,333.8l-79.3-79.3c-4.8-4.8-12.5-4.8-17.3,0  l-84.1,84.1v-287C24.5,36.7,36.7,24.5,51.6,24.5z"/><path d="M151.7,196.1c34.4,0,62.3-28,62.3-62.3s-28-62.3-62.3-62.3s-62.3,28-62.3,62.3S117.3,196.1,151.7,196.1z M151.7,96  c20.9,0,37.8,17,37.8,37.8s-17,37.8-37.8,37.8s-37.8-17-37.8-37.8S130.8,96,151.7,96z"/></g></g></svg>';
            }
            if (element.mime && element.mime.startsWith('audio')) {
              icon = '<svg height="800px" width="800px" version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><style type="text/css"></style><g><path fill="currentColor" d="M378.409,0H208.294h-13.175l-9.314,9.314L57.016,138.102l-9.314,9.314v13.176v265.513  c0,47.361,38.528,85.896,85.896,85.896h244.811c47.36,0,85.888-38.535,85.888-85.896V85.895C464.298,38.528,425.769,0,378.409,0z  M432.493,426.104c0,29.877-24.214,54.092-54.084,54.092H133.598c-29.878,0-54.092-24.215-54.092-54.092V160.591h83.717  c24.885,0,45.07-20.179,45.07-45.07V31.804h170.116c29.87,0,54.084,24.214,54.084,54.091V426.104z"/><path fill="currentColor" d="M288.59,223.362c-22.63-10.927-41.75-35.596-41.75-35.596v16.429V324.36  c-7.062-2.598-15.417-3.365-24.029-1.704c-20.674,3.972-34.908,20.283-31.801,36.412c3.107,16.136,22.382,25.988,43.052,22.001  c18.356-3.533,31.605-16.786,32.174-31.015h0.112V246.626c59.377,7.254,49.623,49.281,45.517,61.604  C346.085,269.898,328.287,242.521,288.59,223.362z"/></g></svg>';
            }
            var add = '';
            if (element.length) add += Lampa.Utils.bytesToSize(element.length) + ' ';
            if (element.path) add += element.path.split('/').pop(); // имя файла
            item.find('.torrserve_client-file__icon').html(icon);
            item.find('.torrserve_client-file__name').text(element.title || element.path.split('/').pop());
            item.find('.torrserve_client-file__size').text(add);

            item.on('hover:enter', function () {
              if(element.mime && element.mime.startsWith('image')) {
                var img = document.createElement('img');
                img.src = _this2.getProxyURL(element.url);
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.position = 'absolute';
                img.style.top = '0';
                img.style.left = '0';
                img.style.zIndex = '1000';
                img.style.backgroundColor = 'black';
                img.style.cursor = 'pointer';
                var body = document.getElementsByTagName('body')[0];
                body.append(img);
                image = img;
                return;
              }
              var video = {
                title: element.title || element.path.split('/').pop(),
                url: _this2.getProxyURL(element.url)
              };
              Lampa.Player.play(video);
              Lampa.Player.playlist([video]);
            });
            item.on('hover:focus', function () {
              scroll.update(item);
            });
            scroll.append(item);
          });
        }

        this.drawHead();
        this.activity.toggle();
      };

      this.drawHead = function () {
        head.empty();
        var nav = [];
        var device_item = document.createElement('div');
        device_item.addClass('torrserve_client-head__device');
        var icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 128 128\" xml:space=\"preserve\">\n                <path d=\"M111.7 57.1V22.2c0-1.1-.5-2.3-1.4-2.9h-.1c-.6-.4-1.2-.6-2-.6H30.9c-2 0-3.5 1.5-3.5 3.5v31.9h34.9c2.8 0 5.1 2.4 5.1 5.2v15.5h27.5V61.4c0-2.4 1.9-4.2 4.2-4.2h12.6z\" fill=\"currentColor\"></path>\n                <path d=\"M96.8 67.6H128v33.2H96.8zM67.3 86.1h27.5v-9.2H67.3zM65.1 59.3c0-1.8-1.3-3.1-3-3.1h-56c-1.7 0-3 1.4-3 3.1v41.9h62zM0 106.1c0 1.7 1.3 3.1 3.1 3.1h62.2c1.7 0 3.1-1.3 3.1-3.1v-2.9H0zM125.8 59.3H99c-1.2 0-2.2.9-2.2 2.2v4.1H128v-4.1c0-1.3-.9-2.2-2.2-2.2zm-9.4 4.1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1h7.9c.6 0 1 .4 1 1 .1.6-.3 1-1 1zm3.8 0h-.4c-.6 0-1-.4-1-1s.4-1 1-1h.4c.6 0 1 .4 1 1s-.4 1-1 1zM96.8 107.1c0 1.2.9 2.2 2.2 2.2h26.8c1.2 0 2.2-1 2.2-2.2V103H96.8zm11.6-2h7.9c.6 0 1 .4 1 1s-.4 1-1 1h-7.9c-.6 0-1-.4-1-1s.4-1 1-1zM81.7 93.7H78v-5.6H67.3v7.6h14.3c.6 0 1-.4 1-1 .1-.6-.3 1-.9-1z\" fill=\"currentColor\"></path>\n            </svg>";
        icon += '<span>' + tree.device.name + '</span>';
        device_item.html(icon);
        nav.push(device_item);
        tree.tree.forEach(function (folder) {
          if (folder.isRootFolder) return;
          var folder_item = document.createElement('div');
          folder_item.text(folder.title);
          folder_item.addClass('torrserve_client-head__folder');
          nav.push(folder_item);
        });

        for (var i = 0; i < nav.length; i++) {
          if (i > 0) {
            var spl = document.createElement('div');
            spl.addClass('torrserve_client-head__split');
            head.append(spl);
          }
          head.append(nav[i]);
        }
      };

      this.displayFolder = function () {
        var _this3 = this;
        var current = tree.tree[tree.tree.length - 1];
        this.drawLoading(Lampa.Lang.translate('loading'));

        var base = tree.device.name;
        if (!base.endsWith('/')) base += '/';

        if (current.id === "root") {
          // Список торрентов
          $.ajax({
            url: _this3.getProxyURL(base + 'torrents'),
            type: "GET",
            dataType: "json",
            success: function(data) {
              var items = (data || []).map(function(t) {
                return {
                  title: t.title || t.hash.slice(0,10) + '...',
                  type: 'folder',
                  hash: t.hash
                };
              });
              _this3.drawFolder(items);
            },
            error: function() {
              console.log('TorrServe', "Не удалось загрузить список торрентов");
              _this3.drawFolder([]);
            }
          });
        } else {
          // Файлы внутри торрента — если не загружен, добавляем
          var hash = current.hash;
          $.ajax({
            url: _this3.getProxyURL(base + 'torrents/' + hash),
            type: "GET",
            dataType: "json",
            success: function(torrent) {
              if (torrent && torrent.files) {
                var files = torrent.files.map(function(f, idx) {
                  var path = f.path.join('/');
                  var mime = f.mime || '';
                  return {
                    title: path.split('/').pop(),
                    path: path,
                    type: 'file',
                    url: base + 'stream/' + hash + '/' + encodeURIComponent(path) + '?index=' + idx + '&play',
                    mime: mime,
                    length: f.length || 0
                  };
                });
                _this3.drawFolder(files);
              } else {
                _this3.drawFolder([]);
              }
            },
            error: function() {
              // Возможно торрент не добавлен — добавляем (предполагаем, что current.title — это magnet или url)
              $.ajax({
                url: _this3.getProxyURL(base + 'torrents'),
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ link: current.title, save: false }), // save: false — не сохранять на диск
                success: function(resp) {
                  current.hash = resp.hash || resp.infohash;
                  _this3.displayFolder(); // перезагружаем
                },
                error: function() {
                  console.log('TorrServe', "Ошибка добавления торрента");
                  _this3.drawFolder([]);
                }
              });
            }
          });
        }
      };

      this.back = function () {
        if (image) {
          image.remove();
          image = false;
          return;
        }
        if (tree && tree.tree.length > 1) {
          tree.tree.pop();
          this.displayFolder();
        } else {
          Lampa.Activity.backward();
        }
      };

      this.background = function () {
        Lampa.Background.immediately('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAZCAYAAABD2GxlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHASURBVHgBlZaLrsMgDENXxAf3/9XHFdXNZLm2YZHQymPk4CS0277v9+ffrut62nEcn/M8nzb69cxj6le1+75f/RqrZ9fatm3F9wwMR7yhawilNke4Gis/7j9srQbdaVFBnkcQ1WrfgmIIBcTrvgqqsKiTzvpOQbUnAykVW4VVqZXyyDllYFSKx9QaVrO7nGJIB63g+FAq/xhcHWBYdwCsmAtvFZUKE0MlVZWCT4idOlyhTp3K35R/6Nzlq0uBnsKWlEzgSh1VGJxv6rmpXMO7EK+XWUPnDFRWqitQFeY2UyZVryuWlI8ulLgGf19FooAUwC9gCWLcwzWPb7Wa60qdlZxjx6ooUuUqVQsK+y1VoAJyBeJAVsLJeYmg/RIXdG2kPhwYPBUQQyYF0XC8lwP3MTCrYAXB88556peCbUUZV7WccwkUQfCZC4PXdA5hKhSVhythZqjZM0J39w5m8BRadKAcrsIpNZsLIYdOqcZ9hExhZ1MH+QL+ciFzXzmYhZr/M6yUUwp2dp5U4naZDwAF5JRSefdScJZ3SkU0nl8xpaAy+7ml1EqvMXSs1HRrZ9bc3eZUSXmGa/mdyjbmqyX7A9RaYQa9IRJ0AAAAAElFTkSuQmCC');
      };

      this.start = function () {
        if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;
        this.background();
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

      this.pause = function () {};
      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        if (scroll) scroll.destroy();
        html.remove();
      };
    }

    function startPlugin() {
      window.plugin_torrserve_client = true;
      Lampa.Lang.add({
        torrserve_client_no_address: {
          ru: 'Введите адрес TorrServer в настройках',
          en: 'Enter TorrServer address in settings',
          uk: 'Введіть адресу TorrServer у налаштуваннях'
        }
      });
      var manifest = {
        type: 'plugin',
        version: '1.0.2',
        name: 'TorrServe Client',
        description: 'TorrServer MatriX клиент для Lampa',
        component: 'torrserve_client'
      };

      Lampa.Manifest.plugins = manifest;
      // Шаблоны — меняем классы на torrserve_client_*
      Lampa.Template.add('torrserve_client_main', "\n        <div class=\"torrserve_client-main\">\n            <div class=\"torrserve_client-main__head torrserve_client-head\"></div>\n            <div class=\"torrserve_client-main__body\"></div>\n        </div>\n    ");
      Lampa.Template.add('torrserve_client_loading', "\n        <div class=\"torrserve_client-loading\">\n            <div class=\"torrserve_client-loading__title\"></div>\n            <div class=\"torrserve_client-loading__loader\">\n                <div class=\"broadcast__scan\"><div></div></div>\n            </div>\n        </div>\n    ");
      Lampa.Template.add('torrserve_client_folder', Lampa.Template.get('dlna_client_folder').replace(/dlna_client/g, 'torrserve_client'));
      Lampa.Template.add('torrserve_client_file', Lampa.Template.get('dlna_client_file').replace(/dlna_client/g, 'torrserve_client'));
      Lampa.Template.add(manifest.component + '_style', Lampa.Template.get('synology_dlna_client_style', {}, true).replace(/dlna_client/g, 'torrserve_client'));

      function add() {
        Lampa.SettingsApi.addComponent({
          component: 'torrserve_client_config',
          name: 'TorrServe',
          icon: "<svg viewBox=\"0 0 512 512\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentColor\" d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z\"></path><circle cx=\"160\" cy=\"250\" r=\"60\" fill=\"currentColor\"></circle><circle cx=\"320\" cy=\"150\" r=\"60\" fill=\"currentColor\"></circle><circle cx=\"320\" cy=\"350\" r=\"60\" fill=\"currentColor\"></circle><path fill=\"currentColor\" d=\"M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z\"></path></svg>"
        });
        Lampa.SettingsApi.addParam({
          component: 'torrserve_client_config',
          param: {
            name: 'torrserve_server',
            type: 'input',
            placeholder: '',
            values: '',
            default: ''
          },
          field: {
            name: 'Адрес TorrServer',
            description: 'Например, http://192.168.1.100:8090'
          }
        });
        Lampa.SettingsApi.addParam({
          component: 'torrserve_client_config',
          param: {
            name: 'torrserve_proxy',
            type: 'input',
            placeholder: '',
            values: '',
            default: ''
          },
          field: {
            name: 'Адрес прокси (опционально)',
            description: 'Например, http://192.168.1.125:9118/proxy'
          }
        });        
        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n            " +
            "    <svg viewBox=\"0 0 512 512\" xml:space=\"preserve\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentColor\" d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z\"/>\n                    <circle cx=\"160\" cy=\"250\" r=\"60\" fill=\"currentColor\"/>\n                    <circle cx=\"320\" cy=\"150\" r=\"60\" fill=\"currentColor\"/>\n                    <circle cx=\"320\" cy=\"350\" r=\"60\" fill=\"currentColor\"/><path fill=\"currentColor\" d=\"M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z\"/></svg>\n            </div>\n            <div class=\"menu__text\">".concat(manifest.name, "</div>\n        </li>"));
        button.on('hover:enter', function () {
          Lampa.Activity.push({
            url: '',
            title: manifest.name,
            component: manifest.component,
            page: 1
          });
        });
        $('.menu .menu__list').eq(0).append(button);
        $('body').append(Lampa.Template.get(manifest.component + '_style', {}, true));
      }
      Lampa.Component.add(manifest.component, Component);
      if (window.appready) add();else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }

    if (!window.plugin_torrserve_client) startPlugin();

})();