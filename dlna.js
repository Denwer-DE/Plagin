(function () {
  'use strict';

  const DLNA_IP_KEY = 'dlna_manual_ip';
  const CORS = 'https://cors.isomorphic-git.org/';

  function getDLNAIP() {
    return Lampa.Storage.get(DLNA_IP_KEY, '');
  }

  function setDLNAIP(v) {
    Lampa.Storage.set(DLNA_IP_KEY, v);
  }

  function buildURL(ip) {
    if (!ip) return '';
    if (!ip.startsWith('http')) ip = 'http://' + ip;
    return ip;
  }

  function browseDLNA(base, objectId, success, error) {
    const body =
`<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
 s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
<ObjectID>${objectId}</ObjectID>
<BrowseFlag>BrowseDirectChildren</BrowseFlag>
<Filter>*</Filter>
<StartingIndex>0</StartingIndex>
<RequestedCount>100</RequestedCount>
<SortCriteria></SortCriteria>
</u:Browse>
</s:Body>
</s:Envelope>`;

    fetch(CORS + base + '/ctl/ContentDir', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPAction': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
      },
      body
    })
      .then(r => r.text())
      .then(success)
      .catch(error);
  }

  function VirtualDevice(ip) {
    const base = buildURL(ip);

    this.name = 'DLNA (' + ip + ')';
    this.ipAddress = ip;
    this.rootFolder = { isRootFolder: true, id: '0', title: 'Root' };

    this.browse = function (folder, index, max, ok, fail) {
      browseDLNA(base, folder.id || '0', function (xml) {
        // минимальный парсер
        const items = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        doc.querySelectorAll('container').forEach(c => {
          items.push({
            itemType: 'FOLDER',
            title: c.querySelector('title')?.textContent || 'Folder',
            id: c.getAttribute('id'),
            isRootFolder: false
          });
        });

        doc.querySelectorAll('item').forEach(i => {
          items.push({
            itemType: 'VIDEO',
            title: i.querySelector('title')?.textContent || 'Video',
            itemUri: i.querySelector('res')?.textContent || '',
            fileSize: parseInt(i.querySelector('res')?.getAttribute('size') || 0)
          });
        });

        ok(items);
      }, fail);
    };
  }

  function Component(object) {
    var html = Lampa.Template.js('client_dlna_main'),
      head = html.find('.client-dlna-main__head'),
      body = html.find('.client-dlna-main__body');

    var scroll, tree;

    this.create = function () {
      this.activity.loader(true);

      scroll = new Lampa.Scroll({ mask: true, over: true });
      scroll.minus(head);
      body.append(scroll.render(true));

      this.drawDevices();
      this.activity.loader(false);
    };

    this.drawDevices = function () {
      scroll.clear();
      scroll.reset();

      const ip = getDLNAIP();
      if (!ip) {
        this.drawLoading('Укажите DLNA IP в настройках');
        return;
      }

      const device = new VirtualDevice(ip);
      const item = Lampa.Template.js('client_dlna_device');
      item.find('.client-dlna-device__name').text(device.name);
      item.find('.client-dlna-device__ip').text(device.ipAddress);

      item.on('hover:enter', () => {
        tree = { device, tree: [device.rootFolder] };
        this.displayFolder();
      });

      item.on('hover:focus', () => scroll.update(item));
      scroll.append(item);

      this.drawHead();
      this.activity.toggle();
    };

    this.drawLoading = function (text) {
      scroll.clear();
      var load = Lampa.Template.js('client_dlna_loading');
      load.find('.client-dlna-loading__title').text(text);
      scroll.append(load);
    };

    this.displayFolder = function () {
      const device = tree.device;
      const folder = tree.tree[tree.tree.length - 1];

      this.drawLoading(Lampa.Lang.translate('loading'));

      device.browse(folder, 0, 100,
        this.drawFolder.bind(this),
        () => Lampa.Noty.show('Ошибка DLNA')
      );
    };

    this.drawFolder = function (items) {
      scroll.clear();
      scroll.reset();

      items.forEach(el => {
        if (el.itemType === 'FOLDER') {
          var item = Lampa.Template.js('client_dlna_folder');
          item.find('.client-dlna-device__name').text(el.title);
          item.on('hover:enter', () => {
            tree.tree.push(el);
            this.displayFolder();
          });
          scroll.append(item);
        } else {
          var item = Lampa.Template.js('client_dlna_file');
          item.find('.client-dlna-file__name').text(el.title);
          item.on('hover:enter', () => {
            Lampa.Player.play({ title: el.title, url: el.itemUri });
          });
          scroll.append(item);
        }
      });

      this.drawHead();
      this.activity.toggle();
    };

    this.drawHead = function () {
      head.empty();
      var el = document.createElement('div');
      el.className = 'client-dlna-head__device';
      el.innerHTML = '<span>DLNA</span>';
      head.append(el);
    };

    this.back = function () {
      if (tree && tree.tree.length > 1) {
        tree.tree.pop();
        this.displayFolder();
      } else {
        tree = null;
        this.drawDevices();
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
    this.destroy = () => html.remove();
  }

  // ⚙️ НАСТРОЙКА С ИКОНКОЙ DLNA
  Lampa.SettingsApi.addParam({
    component: 'client_dnla',
    param: {
      name: 'DLNA IP',
      type: 'input',
      placeholder: '192.168.1.10:8200'
    },
    field: {
      name: '