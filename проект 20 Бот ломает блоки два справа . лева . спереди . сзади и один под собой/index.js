const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'localhost', // Укажите ваш сервер
  port: 3333,       // Укажите порт вашего сервера
  username: 'BlockBreakerBot', // Имя пользователя вашего бота
  version: '1.20'    // Укажите версию Minecraft
});

bot.once('spawn', () => {
  console.log('Бот подключился к серверу.');
  breakBlocks();
});

async function breakBlocks() {
  try {
    // Ломаем два блока перед ботом
    for (let index = 0; index <= 1; index++) {
      const position = bot.entity.position.offset(1, index, 0); // Позиция перед ботом
      const block = bot.blockAt(position);

      if (block && block.name !== 'air') {
        await bot.dig(block); // Ломаем блок
        console.log(`Блок на позиции X: ${position.x}, Y: ${position.y}, Z: ${position.z} сломан.`);
        await bot.waitForTicks(10); // Пауза между ломанием блоков
      }
    }

    // Ломаем два блока сзади бота
    for (let index = 0; index <= 1; index++) {
      const position = bot.entity.position.offset(-1, index, 0); // Позиция сзади бота
      const block = bot.blockAt(position);

      if (block && block.name !== 'air') {
        await bot.dig(block); // Ломаем блок
        console.log(`Блок на позиции X: ${position.x}, Y: ${position.y}, Z: ${position.z} сломан.`);
        await bot.waitForTicks(10); // Пауза между ломанием блоков
      }
    }

    // Ломаем два блока слева от бота
    for (let index = 0; index <= 1; index++) {
      const position = bot.entity.position.offset(0, index, 1); // Позиция слева от бота
      const block = bot.blockAt(position);

      if (block && block.name !== 'air') {
        await bot.dig(block); // Ломаем блок
        console.log(`Блок на позиции X: ${position.x}, Y: ${position.y}, Z: ${position.z} сломан.`);
        await bot.waitForTicks(10); // Пауза между ломанием блоков
      }
    }

    // Ломаем два блока справа от бота
    for (let index = 0; index <= 1; index++) {
      const position = bot.entity.position.offset(0, index, -1); // Позиция справа от бота
      const block = bot.blockAt(position);

      if (block && block.name !== 'air') {
        await bot.dig(block); // Ломаем блок
        console.log(`Блок на позиции X: ${position.x}, Y: ${position.y}, Z: ${position.z} сломан.`);
        await bot.waitForTicks(10); // Пауза между ломанием блоков
      }
    }

    // Ломаем блок под ботом
    const positionBelow = bot.entity.position.offset(0, -1, 0); // Позиция под ботом
    const blockBelow = bot.blockAt(positionBelow);

    if (blockBelow && blockBelow.name !== 'air') {
      await bot.dig(blockBelow); // Ломаем блок
      console.log(`Блок под ботом на позиции X: ${positionBelow.x}, Y: ${positionBelow.y}, Z: ${positionBelow.z} сломан.`);
      await bot.waitForTicks(10); // Пауза между ломанием блоков
    }

    console.log('Блоки перед, сзади, слева, справа и под ботом сломаны.');
  } catch (err) {
    console.log('Ошибка при ломании блоков:', err);
  }
}

bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
