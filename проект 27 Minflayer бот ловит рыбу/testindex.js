const mineflayer = require('mineflayer');
const inventoryViewer = require('mineflayer-web-inventory')
// Создание бота
const bot = mineflayer.createBot({
  host: 'localhost', // IP сервера
  port: 3333,        // Порт сервера
  username: 'FishingBot', // Имя пользователя
  version: '1.20'    // Версия Minecraft
});

inventoryViewer(bot, { port: 3007 })

bot.once('spawn', async () => {
  console.log('Бот подключился!');

  try {
    // Берём удочку в руку
    const fishingRod = bot.inventory.items().find(item => item.name.includes('fishing_rod'));
    if (!fishingRod) {
      console.log('Удочка не найдена в инвентаре.');
      return;
    }

    await bot.equip(fishingRod, 'hand');
    console.log('Удочка экипирована.');

    // Начинаем ловить рыбу
    startFishing();
  } catch (error) {
    console.error('Ошибка при экипировке удочки:', error);
  }
});

async function startFishing() {
  console.log('Начинаем ловлю рыбы...');
  await bot.fish((err) => {
    if (err) {
      console.error('Ошибка при ловле рыбы:', err);
      return;
    }
    console.log('Успешно поймана рыба!');

    // Запускаем рыбалку заново
    setTimeout(startFishing, 2000); // Перерыв перед повторной ловлей
  });

}

// Обработка ошибок
bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
