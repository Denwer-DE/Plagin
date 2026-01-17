// Название плагина: Shots (Превью при наведении)
(function(){
    this.shots = function(api){
        var shots = {};
        var data = [];
        var id = api.getContainer();
        var view = false;
        var p;

        // Инициализация при готовности плеера
        api.on('ready', function(){
            p = document.getElementById(id);
            // Проверка наличия данных о кадрах в конфиге
            if(api.getConfig('shots')){
                shots.load(api.getConfig('shots'));
            }
        });

        // Загрузка данных из VTT или JSON
        shots.load = function(url){
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function(){
                if(xhr.readyState == 4 && xhr.status == 200){
                    shots.parse(xhr.responseText);
                }
            };
            xhr.send();
        };

        // Парсинг (разбор) данных о времени и координатах кадра
        shots.parse = function(t){
            // Здесь происходит обработка строк файла (таймкоды и координаты картинки)
            var l = t.split('\n');
            for(var i=0; i<l.length; i++){
                if(l[i].indexOf('-->') != -1){
                    var time = l[i].split(' --> ');
                    var file = l[i+1];
                    if(file){
                        data.push({
                            start: shots.sec(time[0]),
                            end: shots.sec(time[1]),
                            img: file
                        });
                    }
                }
            }
        };

        // Вспомогательная функция перевода времени в секунды
        shots.sec = function(hms){
            var a = hms.split(':');
            return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2] || 0);
        };

        // Логика отрисовки окна превью при движении мыши по шкале
        api.on('mousemove', function(e){
            if(data.length > 0 && e.target == 'progress'){
                var time = e.time;
                var find = data.find(function(item){
                    return time >= item.start && time <= item.end;
                });

                if(find){
                    shots.show(find, e.x, e.y);
                }
            } else {
                shots.hide();
            }
        });
        
        // ... далее следуют функции создания DOM-элементов и CSS-стилей для всплывающего окошка
    };
})();