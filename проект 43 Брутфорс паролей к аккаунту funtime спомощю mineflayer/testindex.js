const mineflayer = require('mineflayer');
const FlayerCaptcha = require('FlayerCaptcha'); // Плагин для обработки капч на основе изображений (например, от сервера BotFilter)
const fs = require('fs-extra') // Расширенная версия fs для удобной работы с файлами
const { keyAPI } = require('./setting') // Импорт ключа API для сервиса разгадывания капч
const { commonPasswords } = require('./acc') // База паролей
let { SocksClient: socks } = require('socks')
let crypto = require('crypto') // Модуль для генерации случайных данных (используется для имен файлов)
const { resolve } = require('path'); // Функция для создания абсолютного пути к файлам



// --------------------------------------------------------------------------------
// КОНФИГУРАЦИЯ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// --------------------------------------------------------------------------------

// Создаем абсолютный путь к папке, где будут сохраняться изображения капч
const captchaDir = resolve(process.cwd(), 'captcha')

let bot; // Объект Mineflayer бота
let captcha; // Объект плагина FlayerCaptcha
let switchSucces = true; // Флаг, управляющий попытками разгадать начальную капчу (BotFilter)
let log = false; // Флаг, становится true, когда BotFilter пройден успешно
let commonPasswordsIndex = 0; // Индекс пароля который сейчас перебираеться из массива всех паролей к текущему аккаунту

// --------------------------------------------------------------------------------
// ЛОГИКА ОПРЕДЕЛЕНИЯ НАПРАВЛЕНИЯ ВЗГЛЯДА
// --------------------------------------------------------------------------------

/*
 * Эти Map и объект используются для сопоставления углов обзора бота (yaw и pitch) 
 * с направлениями, которые используются сервером BotFilter (viewDirection).
 * * BotFilter часто требует, чтобы бот смотрел на капчу, которая "смотрит" на него.
 * Если бот смотрит на север (north), капча должна иметь направление "south".
 */

// Карта для сопоставления округленных углов (yaw, pitch) с внутренним направлением
const directions = new Map([
    // [Округленный Yaw и Pitch, Направление] -> Зависит от версии Minecraft и настройки FlayerCaptcha
    ['3 2', 'up'],      // up (Yaw ~3, Pitch ~2)
    ['3 -2', 'down'],   // down (Yaw ~3, Pitch ~-2)
    ['3 0', 'south'],   // south
    ['2 0', 'west'],    // west
    ['0 0', 'north'],   // north 
    ['5 0', 'east'],    // east
]);

// Объект для получения противоположного направления (капча должна смотреть в противоположную сторону)
const directions2 = { 'up': 'down', 'down': 'up', 'south': 'north', 'west': 'east', 'north': 'south', 'east': 'west' };

/**
 * Получает противоположное направление, на которое смотрит бот.
 * @param {number} yaw Угол рыскания (горизонтальный)
 * @param {number} pitch Угол тангажа (вертикальный)
 * @returns {string} Направление, которое должна иметь капча, чтобы быть "правильной".
 */
function getViewDirection(yaw, pitch) {
    // Создаем ключ, округляя углы до целых чисел
    const key = `${Math.round(yaw)} ${Math.round(pitch)}`;
    // Сначала получаем направление, на которое смотрит бот (directions.get(key)),
    // а затем находим противоположное направление (directions2[...]).
    return directions2[directions.get(key)];
}


// --------------------------------------------------------------------------------
// ГЛАВНАЯ ФУНКЦИЯ ЗАПУСКА
// --------------------------------------------------------------------------------
/*
                        host: `192.104.242.158`,
                        port: 4145,

                        Работают на  ENDERIX
                        host: `157.173.201.10`,
                        port: 1080,    
                        host: `144.124.227.90`,
                        port: 10808,                                            

*/



function joni3(indexPass) {
    try {
        console.log(`Создаю подключения к боту`)

        // 'play.funtime.su'
        // 'mc5.enderix.ru'
        let hs = 'play.funtime.su';

        // Инициализация Mineflayer бота
        bot = mineflayer.createBot({
            host: hs,
            username: 'jjjjmgfg43FFFFD',
            version: '1.20',
            hideErrors: true,
            connect: (client) => {
                console.log('Попытка подключения к прокси...');
                socks.createConnection({
                    proxy: {

                        host: `23.26.71.145`,
                        port: 5628,
                        type: 5, // тип прокси
                        userId: `pixchpkh`,
                        password: `rj083rotb85p`
                        /*
                        host: `192.104.242.158`,
                        port: 4145,      
                        type: 5, // тип прокси
                        /*
                        /*
                        host: `31.59.20.176`,
                        port: 6754,
                        type: 5, // тип прокси
                        userId: `pixchpkh`,
                        password: `rj083rotb85p`
                        */
                    },
                    command: 'connect',
                    destination: {
                        host: hs,
                        port: 25565
                    },
                }, (err, info) => {
                    if (err) {
                        console.error('Ошибка соединения с прокси:', err);
                        return;
                    }
                    console.log(`Соединение бота с прокси установлено.`);
                    client.setSocket(info.socket);
                    client.emit('connect');
                });
            }
        })


        captcha = new FlayerCaptcha(bot); // Инициализация плагина капчи

        // ------------------------------------
        // ОБРАБОТЧИК СОБЫТИЯ КАПЧИ (FlayerCaptcha)
        // Срабатывает, когда сервер отправляет изображение капчи
        // ------------------------------------
        captcha.on('imageReady', async ({ data, image }) => {
            const viewDirection = data.viewDirection // Направление, в которое "смотрит" капча


            // Проверка фильтра: если направление взгляда бота не совпадает с ожидаемым (противоположным) 
            // направлением капчи, игнорируем эту попытку (возвращаемся).
            if (getViewDirection(bot.entity.yaw, bot.entity.pitch) != viewDirection) return

            console.log(`КАРТИНКА ПРОШЛА ФИЛЬТР FlayerCaptcha`)

            //  Сохраняем правильную капчу с уникальным именем
            const randomFilename = `captcha_${crypto.randomBytes(8).toString('hex')}.png`;
            const outputPath = resolve(captchaDir, randomFilename)

            await image.toFile(outputPath); // Сохраняем файл на диск
            console.log(`Captcha saved as ${outputPath}`);

            // ------------------------------------------
            // Отправка файла на внешний API для разгадывания
            let solvedCaptcha = stripBeforeDigits(await sendAPI(outputPath))

            console.log(`BARE-API solved - ${solvedCaptcha}`)
            bot.chat(`${solvedCaptcha}`) // Отправляем разгаданный ответ в чат
            // ------------------------------------------

            /**
             * Удаляет все символы в начале строки до первой цифры (очистка от лишнего текста).
             * @param {string} input Строка ответа API.
             * @returns {string} Только цифры (ответ капчи).
             */
            function stripBeforeDigits(input) {
                return input.replace(/^.*?(?=\d)/, '');
            }


        });








        // ------------------------------------
        // ОБРАБОТЧИК ВХОДЯЩИХ СООБЩЕНИЙ (Чат)
        // ------------------------------------
          let o4 = true;
        bot.on('message', async (message) => {

            console.log(message.toAnsi()) // Вывод сообщения в консоль с форматированием

            // Если получено сообщение об успешном прохождении BotFilter
            if (message == `BotFilter >> Проверка пройдена, приятной игры`) {
                log = true; // Устанавливаем флаг успешного прохождения
                console.log(`log = ${log}`)
            }

            // Если получено сообщение о необходимости регистрации

            if (message == `[✾] Зарегистрируйтесь ↝ /reg <Пароль>`) {
                console.log(`!!!!АККАУНТ НЕ ЗАРЕГИСТРИРОВАН!!!`)
                // bot.chat(`/reg 1234 1234`) // Выполняем команду регистрации
            }

          
            if (message == `[✾] Войдите в игру ↝ /login <Пароль>` && o4) {
                o4 = false;
                console.log(`АККАУНТ ЗАРЕГИСТРИРОВАН `)
                

                bot.chat(`/login ${commonPasswords[indexPass]}`);
                console.log(`Пробую: ${commonPasswords[indexPass]}`);
                indexPass++



            }

            if (message == `[✾] Успешная авторизация! Приятной игры!`) {
                log = true; // Отключаю переподключения к серверу если бот авторизовался
            }


            // --- БЛОК ЛОГИКИ ПОВТОРНОГО РАЗГАДЫВАНИЯ/ПЕРЕПОДКЛЮЧЕНИЯ ---

            // Если флаг switchSucces = false, пропускаем этот блок (чтобы не спамить)
            if (!switchSucces) return

            try {

                switchSucces = false; // Блокируем повторный вход в этот блок



                //! Устанавливаем таймер для проверки, смог ли бот авторизоваться
                setTimeout(() => {
                    if (log == true) return // Если log == true (BotFilter пройден), выходим

                    // Если BotFilter не пройден за 4 секунды:
                    console.log(`БОТ НЕ СМОГ АВТОРИЗОВАТЬСЯ, ПЕРЕПОДКЛЮЧЕНИЯ`)

                    // Очищаем все обработчики событий (чтобы избежать дублирования)
                    bot.removeAllListeners('success');
                    bot.removeAllListeners('chat');

                    // Отключаем бота
                    bot.end()



                    switchSucces = true; // Сбрасываем флаг для следующей попытки
                    joni3(indexPass) // Перезапуск функции для повторного подключения
                }, 60000);


            } catch (error) {
                console.log(error)
            }

        });

    } catch (error) {
        console.log(error)
    }

}


joni3(0) // Первый запуск функции для подключения


// ------------------------------------
// ОБРАБОТЧИК СОБЫТИЯ SPAWN
// ------------------------------------
bot.on('spawn', (mes) => {

    console.log(`БОТ ЗАСПАВНИЛСЯ`)
})







// --------------------------------------------------------------------------------
// ФУНКЦИЯ ВЗАИМОДЕЙСТВИЯ С ВНЕШНИМ API КАПЧИ
// --------------------------------------------------------------------------------
/**
 * Отправляет изображение капчи на внешний API для разгадывания и получает ответ.
 * @param {string} filePath Путь к файлу изображения капчи.
 * @returns {Promise<string>} Разгаданный текст капчи.
 */
async function sendAPI(filePath) {
    const site = "http://5.42.211.111"; // Адрес внешнего API

    try {
        // 1. Чтение файла и преобразование в Base64
        const base64Image = await fs.readFile(filePath).then(buffer => buffer.toString('base64'));

        // 2. Подготовка данных для POST-запроса (отправка капчи)
        const postData = new URLSearchParams({
            key: keyAPI,
            method: "base64",
            body: base64Image
        });

        // 3. Отправка POST-запроса
        const postResponse = await fetch(`${site}/in.php`, {
            method: "POST",
            body: postData
        });

        const postText = await postResponse.text();
        // Извлечение ID капчи из ответа API (например, OK|1234567)
        const captcha_id = postText.split("|")[1].split("\n")[0];

        // 4. Ожидание, пока API решит капчу
        await new Promise(resolve => setTimeout(resolve, 800));

        // 5. Подготовка данных для GET-запроса (получение результата)
        const getData = new URLSearchParams({
            key: keyAPI,
            action: "get",
            id: captcha_id
        });

        // 6. Отправка GET-запроса
        const getResponse = await fetch(`${site}/res.php?${getData}`);
        const getText = await getResponse.text();

        // 7. Извлечение ответа из полученного текста
        let answer = getText.split("|")[1].split("\n")[0] || getText.split("|")[1];

        return answer; // Возвращаем разгаданный ответ

    } catch (error) {
        console.error('API Error:', error);
        throw error; // Проброс ошибки для обработки выше
    }
}