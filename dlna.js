(function () {
  'use strict';

  const STORAGE_KEY = 'dlna_ip';

  function Component(object) {
    let html = Lampa.Template.js('client_dlna_main'),
        head = html.find('.client-dlna-main__head'),
        body = html.find('.client-dlna-main__body'),
        scroll,
        tree,
        server_ip;

    function fakeDevice(ip) {
      return {
        name: 'DLNA @ ' + ip,
        ipAddress: ip,
        rootFolder: { isRootFolder: true, title: 'Root' },
        browse: function (folder, start, count, success, error) {
          fetch('http://' + ip + ':8200/browse')
            .then(r => r.json())
            .then(success)
            .catch(error);
        }
      };
    }

    this.create = function () {
      server_ip = Lampa.Storage.get(STORAGE_KEY, '');

      scroll = new Lampa.Scroll({ mask: true, over: true });
      body.append(scroll.render(true));

      if (!server_ip) {
        this.drawError('DLNA IP не задан в настройках');
        return;
      }

      tree = {
        device: fakeDevice(server_ip),
        tree: [fakeDevice(server_ip).rootFolder]
      };

      this.drawDevices();
    };

    this.drawError = function (text) {
      scroll.clear();
      let empty = new Lampa.Empty({ descr: text });
      scroll.append(empty.render(true));
      this.start = empty.start.bind(empty);
    };

    this.drawDevices = function () {
      scroll.clear();
      let item = Lampa.Template.js('client_dlna_device');
      item.find('.client-dlna-device__name').text(tree.device.name);
      item.find('.client-dlna-device__ip').text(tree.device.ipAddress);
      item.on('hover:enter', () => this.displayFolder());
      scroll.append(item);
      this.drawHead();
    };

    this.displayFolder = function () {
      let device = tree.device;
      let folder = tree.tree[tree.tree.length - 1];

      scroll.clear();
      let load = Lampa.Template.js('client_dlna_loading');
      load.find('.client-dlna-loading__title').text('Загрузка...');
      scroll.append(load);

      device.browse(folder, 0, 50, this.drawFolder.bind(this), () => {
        this.drawError('Ошибка доступа к DLNA');
      });
    };

    this.drawFolder = function (items) {
      scroll.clear();
      items.forEach(el => {
        let tpl = el.itemType === 'VIDEO'
          ? Lampa.Template.js('client_dlna_file')
          : Lampa.Template.js('client_dlna_folder');

        tpl.find('.client-dlna-device__name, .client-dlna-file__name')
          .text(el.title);

        tpl.on('hover:enter', () => {
          if (el.itemType === 'VIDEO') {
            Lampa.Player.play({ title: el.title, url: el.itemUri });
          } else {
            tree.tree.push(el);
            this.displayFolder();
          }
        });

        scroll.append(tpl);
      });

      this.drawHead();
    };

    this.drawHead = function () {
      head.empty();
      let d = document.createElement('div');
      d.className = 'client-dlna-head__device';
      d.innerHTML = '<svg viewBox="0 0 128 128"></svg><span>' +
        tree.device.name + '</span>';
      head.append(d);
    };

    this.back = function () {
      if (tree.tree.length > 1) {
        tree.tree.pop();
        this.displayFolder();
      } else {
        Lampa.Activity.backward();
      }
    };

    this.start = function () {
      Lampa.Controller.add('content', {
        toggle: () => {
          Lampa.Controller.collectionSet(html);
          Lampa.Controller.collectionFocus(false, html);
        },
        back: this.back.bind(this)
      });
      Lampa.Controller.toggle('content');
    };

    this.render = () => html;
    this.destroy = () => scroll && scroll.destroy();
  }

  function startPlugin() {
    Lampa.Settings.add({
      name: 'dlna',
      label: 'DLNA',
      icon: '<svg viewBox="0 0 512 512"></svg>',
      items: [{
        name: STORAGE_KEY,
        type: 'input',
        value: Lampa.Storage.get(STORAGE_KEY, ''),
        placeholder: '192.168.1.100',
        description: 'IP DLNA сервера',
        onchange: v => Lampa.Storage.set(STORAGE_KEY, v.trim())
      }]
    });

    Lampa.Component.add('client_dnla', Component);

    let btn = $(`<li class="menu__item selector">
      <div class="menu__ico"><svg viewBox="0 0 512 512"></svg></div>
      <div class="menu__text">DLNA</div>
    </li>`);

    btn.on('hover:enter', () => {
      Lampa.Activity.push({
        title: 'DLNA',
        component: 'client_dnla'
      });
    });

    $('.menu .menu__list').eq(0).append(btn);
  }

  if (!window.plugin_client_dnla) {
    window.plugin_client_dnla = true;
    startPlugin();
  }

})();