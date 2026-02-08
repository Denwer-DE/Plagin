(function () {
    window.plugin_test_dlna = true;

    var manifest = {
        type: 'plugin',
        version: 'test',
        name: 'DLNA Test',
        component: 'dlna_test'
    };

    Lampa.Manifest.plugins = manifest;

    Lampa.Template.add('dlna_test_main', '<div style="padding:50px;text-align:center;font-size:20px;">DLNA Test<br>Если вы видите это — плагин загрузился без script error</div>');

    var Comp = {
        create: function () {
            this.activity.html(Lampa.Template.get('dlna_test_main'));
            this.activity.toggle();
        },
        start: function () {},
        render: function () { return this.activity.html(); },
        destroy: function () {}
    };

    Lampa.Component.add(manifest.component, Comp);

    function addBtn() {
        var btn = $('<li class="menu__item selector"><div class="menu__text">DLNA Test</div></li>');
        btn.on('hover:enter', () => Lampa.Activity.push({component: 'dlna_test'}));
        $('.menu .menu__list').eq(0).append(btn);
    }

    if (window.appready) addBtn();
    else Lampa.Listener.follow('app', e => { if (e.type == 'ready') addBtn(); });
})();