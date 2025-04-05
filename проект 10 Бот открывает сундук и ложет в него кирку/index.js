const mineflayer = require('mineflayer'); // 1. Импортируем библиотеку mineflayer
const mcData = require('minecraft-data')('1.20'); // 2. Импортируем данные Minecraft для версии 1.20
const vec3 = require('vec3'); // 3. Импортируем библиотеку vec3
const inventoryViewer = require('mineflayer-web-inventory'); // 4. Импортируем библиотеку для просмотра инвентаря через веб-интерфейс

// Этап 1: Создаем бота
const bot = mineflayer.createBot({
  host: 'localhost', // IP-адрес сервера Minecraft
  port: 3333,       // Порт сервера Minecraft
  username: 'CraftBot', // Имя пользователя для бота
  version: '1.20'    // Версия Minecraft
});

// Этап 2: Включаем просмотр инвентаря через веб-интерфейс
inventoryViewer(bot, { port: 3007 });





// Этап 8: Поиск и открытие сундука
async function findAndOpenChest(bot) {
  const chest = bot.findBlock({
    matching: mcData.blocksByName['chest'].id,
    maxDistance: 4
  });

  if (!chest) {
    bot.chat('Сундук не найден поблизости.');
    return;
  }

  bot.once('windowOpen', async (chestWindow) => {
    try {
      bot.chat('Открыл сундук.');
      await bot.moveSlotItem(33, 0);
      // Здесь можно добавить код для взаимодействия с сундуком
      //chestWindow.close();
    } catch (err) {
      bot.chat(`Ошибка при открытии сундука: ${err.message}`);
    }
  });

  bot.activateBlock(chest);
}

// Пример использования findAndOpenChest
bot.once('spawn', async () => {
  bot.chat('Привет! Я бот для поиска сундука.');
  await findAndOpenChest(bot);
});
