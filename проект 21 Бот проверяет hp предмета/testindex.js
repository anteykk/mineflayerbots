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
  // Подождем немного, чтобы инвентарь бота был загружен
 
    const durability = checkHPItem('wooden_shovel');
    if (durability !== null) {
      console.log(`Текущая прочность деревянной лопаты: ${durability}/60`);
    } else {
      console.log('Деревянная лопата не найдена в инвентаре.');
    }
 
});

// Проверка hp предмета
function checkHPItem(name) {
  const targetItem = bot.inventory.items().find(item => item.name === name);
  if (!targetItem) {
    return null; // Возвращаем null, если предмет не найден
  }
  const maxDurability = bot.registry.items[targetItem.type].maxDurability;
  const currentDurability = maxDurability - targetItem.durabilityUsed;
  return currentDurability;
}

bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
