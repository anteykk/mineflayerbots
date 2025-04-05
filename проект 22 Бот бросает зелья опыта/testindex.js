const mineflayer = require('mineflayer');
const inventoryViewer = require('mineflayer-web-inventory');


const bot = mineflayer.createBot({
  host: 'localhost',
  port: 3333,
  username: 'test',
  version: '1.20'
});


inventoryViewer(bot, { port: 3007 });

bot.once('spawn', () => {
  console.log('Зашел');

  const items = bot.inventory.items();
  console.log(items)
  for(let elem of items){
   // console.log(elem.nbt, elem.slot)
  }

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return; // Игнорируем свои сообщения

    // Функция для нахождения предмета в инвентаре
    const findItemInInventory = (name) => {
      return bot.inventory.items().find(item => item.name === name);
    };

    if (message.toLowerCase() === 'go') {
      console.log('Получена команда "go"');

      // Находим зелье опыта в инвентаре
      const experiencePotion = findItemInInventory('experience_bottle');

      if (experiencePotion) {
        try {
          // Экипируем зелье опыта в руку
          await bot.equip(experiencePotion, 'hand');
          console.log('Экипировал зелье опыта');

          // Бросаем зелье опыта под ноги
          bot.lookAt(bot.entity.position.offset(0, -1, 0), true)
          bot.activateItem();
        } catch (err) {
          console.error('Ошибка при экипировке или использовании зелья опыта:', err);
        }
      } else {
        console.log('Зелье опыта не найдено в инвентаре');
      }
    }

    if (message.toLowerCase() === 'kek') {
      console.log('Получена команда "kek"');

      // Находим зелье "splash water bottle" в инвентаре
      const splashWaterBottle = findItemInInventory('splash_potion');

      if (splashWaterBottle) {
        try {
          // Экипируем зелье "splash water bottle" в руку
          await bot.equip(splashWaterBottle, 'hand');
          console.log('Экипировал зелье "splash water bottle"');

          // Бросаем зелье "splash water bottle" под ноги
          bot.lookAt(bot.entity.position.offset(0, -1, 0), true)
            bot.activateItem();
            console.log('Бросил зелье "splash water bottle" под ноги');
          
        } catch (err) {
          console.error('Ошибка при экипировке или использовании зелья "splash water bottle":', err);
        }
      } else {
        console.log('Зелье "splash water bottle" не найдено в инвентаре');
      }
    }
  });
});

bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
