const mineflayer = require('mineflayer'); // Импортируем библиотеку mineflayer
const vec3 = require('vec3'); // Импортируем библиотеку vec3
const inventoryViewer = require('mineflayer-web-inventory'); // Импортируем библиотеку для просмотра инвентаря через веб-интерфейс

// Этап 1: Создаем бота
const bot = mineflayer.createBot({
  host: 'localhost', // IP-адрес сервера Minecraft
  port: 3333,       // Порт сервера Minecraft
  username: 'BedBot', // Имя пользователя для бота
  version: '1.20'    // Версия Minecraft
});

// Этап 2: Включаем просмотр инвентаря через веб-интерфейс
inventoryViewer(bot, { port: 3007 });



// Этап 3: Действия при заходе бота в игровой мир
bot.once('spawn', async () => {
  bot.chat('Привет! Я бот, который ставит кровать, спит на ней и затем ломает её.');

  // Шаг 3.1: Проверяем наличие кровати в инвентаре
  const bed = bot.inventory.items().find(item => item.name.includes('bed'));
  if (!bed) {
    bot.chat('Не удалось найти кровать в инвентаре.');
    return;
  }

  // Шаг 3.2: Ставим кровать
  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 1));
  if (!referenceBlock) {
    bot.chat('Не удалось найти подходящий блок для размещения кровати.');
    return;
  }

  try {
    await bot.equip(bed, 'hand');
    await bot.placeBlock(referenceBlock, vec3(0, 1, 0));
    bot.chat('Кровать установлена.');
  } catch (err) {
    bot.chat(`Ошибка при установке кровати: ${err.message}`);
    return;
  }

  // Шаг 3.3: Ложимся спать
  const bedBlock = bot.blockAt(referenceBlock.position.offset(0, 1, 0));

  setTimeout( async() => {
    try {
      await bot.sleep(bedBlock);
      bot.chat('Бот лег спать.');
    } catch (err) {
      console.log(`Ошибка при попытке лечь спать: ${err.message}`);
      return;
    }    
  }, 5000);


  // Шаг 3.4: Ждем пробуждения
  bot.on('wake', async () => {
    bot.chat('Бот проснулся.');

    // Шаг 3.5: Ломаем кровать
    try {
      await bot.dig(bedBlock);
      bot.chat('Кровать сломана.');
    } catch (err) {
      bot.chat(`Ошибка при попытке сломать кровать: ${err.message}`);
    }
  });
});
