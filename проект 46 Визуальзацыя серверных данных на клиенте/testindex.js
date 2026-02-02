const mineflayer = require('mineflayer');
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

// --- НАСТРОЙКА БОТА ---
const bot = mineflayer.createBot({
    host: 'localhost', // Укажи IP сервера
    username: 'StatsBot',
    version: '1.20',
    port: 3333
});

// --- НАСТРОЙКА EXPRESS И HANDLEBARS ---
const app = express();

let mesM = [];

bot.on('message', async (message) => {
    console.log(message.toAnsi())
    mesM.push(message.toAnsi())
})

app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Главная страница
app.get('/', (req, res) => {
    // Получаем количество игроков из объекта bot.players
    const onlineCount = Object.keys(bot.players).length;
    res.render('index', { count: onlineCount, server: `locallhost:3333`, j4: mesM });
});

app.listen(3003, () => console.log('📊 Статистика доступна на http://localhost:3003'));