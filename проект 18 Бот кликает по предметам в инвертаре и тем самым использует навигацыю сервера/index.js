const mineflayer = require('mineflayer');
const inventoryViewer = require('mineflayer-web-inventory');

const bot = mineflayer.createBot({
  host: 'mc.funtime.su',
  username: 'goma3445',
  version: '1.20'
});

inventoryViewer(bot, { port: 3007 });

bot.once('spawn', () => {
  console.log('Бот подключился к серверу.');
  setTimeout(() => {
    equipAndUseCompass();
  }, 3000);
});

bot.on('message', (message) => {
  console.log(message.toAnsi());
});

async function equipAndUseCompass() {
  try {
    const compass = bot.inventory.items().find(item => item.name.includes('compass'));

    if (!compass) {
      console.log('Компас не найден в инвентаре.');
      return;
    }

    await bot.equip(compass, 'hand');
    console.log('Компас взят в руку.');

    // Выполняем правый клик по компасу
    bot.activateItem();
    console.log('Правый клик по компасу выполнен.');

    // Ждем 1 секунду
    setTimeout(() => {
      clickOnInventorySlot(12); // Кликаем по 12-му слоту (индексация с 0, поэтому 11)
    }, 1000);
  } catch (err) {
    console.log('Ошибка при использовании компаса:', err);
  }
}

function clickOnInventorySlot(slot) {
  bot.clickWindow(slot, 0, 0); // Левая кнопка мыши по указанному слоту
  console.log(`Клик по ${slot + 1}-му слоту в инвентаре выполнен.`);
  setTimeout(() => {
    bot.clickWindow(20, 0, 0);
    console.log(`Клик по 20-му слоту в инвентаре выполнен.`);
  }, 1000);
  setTimeout(() => {
    bot.clickWindow(29, 0, 0);
    console.log(`Клик по 28-му слоту в инвентаре выполнен.`);
  }, 2000);
}

bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
