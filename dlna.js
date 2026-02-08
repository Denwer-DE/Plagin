function startPlugin() {
    // Регистрация плагина  
    window.plugin_client_dnla = true;

    // Добавление локализации  
    Lampa.Lang.add({
        client_dlna_search_device: {
            ru: 'Поиск устройств',
            en: 'Device search',
            uk: 'Пошук пристроїв',
            be: 'Пошук прылад',
            zh: '设备搜索',
            pt: 'Pesquisa de dispositivos',
        },
        client_dlna_nosuport: {
            ru: 'Ваш виджет не поддерживается, обновите виджет на новую версию',
            en: 'Your widget is not supported, update the widget to a newer version',
            uk: 'Віджет не підтримується, оновіть віджет на нову версію',
            be: 'Ваш віджэт не падтрымліваецца, абнавіце віджэт на новую версію',
            zh: '不支持您的小部件，请将小部件更新到较新版本',
            pt: 'Seu widget não é compatível, atualize o widget para uma versão mais recente',
        },
        client_dlna_all_device: {
            ru: 'Все устройства',
            en: 'All devices',
            uk: 'Усі пристрої',
            be: 'Усе прылады',
            zh: '所有设备',
            pt: 'Todos os dispositivos',
        },
    });

    // Добавление настроек  
    addSettings();

    // Загрузка сохраненного IP адреса  
    const savedIP = localStorage.getItem('dlna_ip');
    if (savedIP) {
        connectToServer(savedIP);
    } else {
        console.log('IP адрес медиасервера не установлен.');
    }

    // Логика для добавления кнопки в меню  
    addMenuButton();
}

function addSettings() {
    Lampa.Settings.add('client_dlna', {
        title: 'DLNA IP',
        template: `
            <div class="dlna-settings">
                <div class="icon">
                    <svg viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z"/>
                        <circle cx="160" cy="250" r="60" fill="currentColor"/>
                        <circle cx="320" cy="150" r="60" fill="currentColor"/>
                        <circle cx="320" cy="350" r="60" fill="currentColor"/>
                        <path fill="currentColor" d="M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z"/>
                    </svg>
                </div>
                <label for="dlna-ip">Введите IP адрес медиасервера:</label>
                <input type="text" id="dlna-ip" placeholder="http://192.168.1.1" />
                <button id="save-dlna-ip">Сохранить</button>
            </div>
        `,
        onSave: function() {
            const ip = document.getElementById('dlna-ip').value;
            localStorage.setItem('dlna_ip', ip); // Сохраняем введенный IP в localStorage  
            console.log('DLNA IP сохранен:', ip);
        },
    });
}

function connectToServer(ip) {
    // Проверьте, начинается ли IP с http:// или https:// и добавьте http:// по умолчанию  
    if (!ip.startsWith('http://') && !ip.startsWith('https://')) {
        ip = 'http://' + ip;
    }

    // Логика подключения к медиасерверу  
    console.log('Подключение к медиасерверу по адресу:', ip);
}

function addMenuButton() {
    let button = $(`<li class="menu__item selector">
        <div class="menu__ico">
            <svg viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0Zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z"/>
                <circle cx="160" cy="250" r="60" fill="currentColor"/>
                <circle cx="320" cy="150" r="60" fill="currentColor"/>
                <circle cx="320" cy="350" r="60" fill="currentColor"/>
                <path fill="currentColor" d="M35 135h270v30H35zm175.782 100h270v30h-270zM35 335h270v30H35z"/>
            </svg>
        </div>
        <div class="menu__text">DLNA</div>
    </li>`);

    button.on('hover:enter', function () {
        Lampa.Activity.push({
            url: '',
            title: 'DLNA',
            component: 'client_dnla',
            page: 1,
        });
    });

    $('.menu .menu__list').eq(0).append(button);
}

if (!window.plugin_client_dnla) startPlugin();