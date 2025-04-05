const mineflayer = require('mineflayer');
const Vec3 = require('vec3').Vec3;

const bot = mineflayer.createBot({
  host: 'localhost', // Укажите ваш сервер
  port: 3333,       // Укажите порт вашего сервера
  username: 'FarmerBot', // Имя пользователя вашего бота
  version: '1.20'    // Укажите версию Minecraft
});



bot.once('spawn', () => {
  console.log('Бот подключился к серверу.');
  startFarming();
});

async function startFarming() {
  try {
    const hoe = bot.inventory.items().find(item => item.name.includes('hoe'));
    const seeds = bot.inventory.items().find(item => item.name.includes('seeds'));

    if (!hoe) {
      console.log('Нет киянки в инвентаре.');
      return;
    }
    if (!seeds) {
      console.log('Нет семян в инвентаре.');
      return;
    }

    for (let dx = -2; dx <= 1; dx++) {
      
        const position = bot.entity.position.offset(dx, -1, -1);
        const block = bot.blockAt(position);

        if (block && (block.name === 'grass_block' || block.name === 'dirt')) {
          await bot.equip(hoe, 'hand'); // Берем киянку в руку
          await bot.activateBlock(block); // Вспахиваем блок
          console.log(`Вспахан блок на позиции: ${position}`);

          await bot.waitForTicks(10); // Пауза после вспахивания

          await bot.equip(seeds, 'hand'); // Берем семена в руку
          await bot.placeBlock(block, new Vec3(0, 1, 0)); // Сажаем семена на вспаханный блок
          console.log(`Семена посажены на позиции: ${position}`);
          await bot.waitForTicks(10); // Пауза после посадки семян
        }
     
    }

    console.log('Посев семян завершен.');
  } catch (err) {
    console.log('Ошибка: ', err);
  }
}

bot.on('error', (err) => {
  console.error('Ошибка: ', err);
});

bot.on('end', () => {
  console.log('Бот отключился от сервера.');
});
