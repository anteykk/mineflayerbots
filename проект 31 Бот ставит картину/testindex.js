const mineflayer = require('mineflayer');
const Vec3 = require('vec3');
const mcData = require('minecraft-data')('1.20');

const bot = mineflayer.createBot({
  host: 'localhost', // или ваш сервер
  port: 3333,       // порт сервера
  username: 'PaintingBot',
  version: '1.20'
});

// Глобально перехватываем ошибки Promise, связанные с таймаутом события blockUpdate
process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.message && reason.message.includes("did not fire")) {
    console.log("Игнорирую ошибку blockUpdate таймаута: " + reason.message);
  } else {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  }
});

bot.once('spawn', async () => {
  // Немного подождем, чтобы бот загрузился
  await bot.waitForTicks(20);
  try {
    await hangPainting();
  } catch (err) {
    bot.chat('Ошибка при вешании картины.');
    console.error(err);
  }
});

async function hangPainting() {
  // Ищем в инвентаре предмет, имя которого содержит "painting".
  // Убедитесь, что у бота есть картинка (например, через /give).
  const paintingItem = bot.inventory.items().find(item =>
    item.name.toLowerCase().includes('painting')
  );

  if (!paintingItem) {
    bot.chat('У меня нет картины в инвентаре!');
    return;
  }

  // Экипируем картину в руку
  try {
    await bot.equip(paintingItem, 'hand');
    bot.chat('Картина экипирована.');
  } catch (err) {
    bot.chat(`Не могу экипировать картину: ${err.message}`);
    return;
  }

  // Ищем подходящий блок в пределах 5 блоков.
  // В данном примере ищем каменный блок. Его можно заменить, если уверены, что рядом он есть.
  const targetBlock = bot.findBlock({
    matching: mcData.blocksByName.stone.id,
    maxDistance: 5
  });

  if (!targetBlock) {
    bot.chat('Не нашел подходящий блок для вешания картины.');
    return;
  }

  // Выбираем грань, на которую повесим картину.
  // В этом примере выбран вектор (0, 0, 1) – то есть, картина будет прикреплена к стороне блока,
  // направленной по положительному направлению оси Z.
  const faceVector = new Vec3(0, 0, 1);

  bot.chat(`Пытаюсь повесить картину на блок ${targetBlock.position} (грань: ${faceVector}).`);

  try {
    await placePainting(targetBlock, faceVector);
    bot.chat('Картина повешена!');
  } catch (err) {
    bot.chat(`Не удалось повесить картину: ${err.message}`);
    console.error(err);
  }
}

// Оборачиваем bot.placeBlock в async функцию.
// Если выбрасывается ошибка, содержащая "did not fire", считаем, что картина создана.
async function placePainting(targetBlock, faceVector) {
  try {
    await new Promise((resolve, reject) => {
      bot.placeBlock(targetBlock, faceVector, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  } catch (err) {
    if (err.message && err.message.includes("did not fire")) {
      // Таймаут события blockUpdate – для картин он может не отправляться,
      // поэтому рассматриваем это как успешное размещение.
      return;
    } else {
      throw err;
    }
  }
}

bot.on('error', err => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
