const mineflayer = require('mineflayer');
const mcData = require('minecraft-data')('1.20');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 3333,
  username: 'EnchanterBot',
  version: '1.20'
});

bot.once('spawn', () => {
  bot.chat('Запускаю зачарование...');
  startAnvilProcess();
});

// Функция для поиска первого пустого слота
function firstEmptySlot() {
  for (let i = 0; i < bot.inventory.slots.length; i++) {
    if (!bot.inventory.slots[i]) return i;
  }
  return null;
}

async function startAnvilProcess() {
  // Ищем ближайшую наковальню
  const anvilBlock = bot.findBlock({
    matching: mcData.blocksByName.anvil.id,
    maxDistance: 6
  });
  if (!anvilBlock) {
    return bot.chat('Наковальня не найдена.');
  }

  let anvilWindow;
  try {
    // Открываем интерфейс наковальни
    anvilWindow = await bot.openAnvil(anvilBlock);
  } catch (err) {
    return bot.chat(`Не удалось открыть наковальню: ${err.message}`);
  }

  // Ждем немного для корректного открытия окна
  await bot.waitForTicks(20);

  // Ищем необходимые предметы в инвентаре
  const ironSword = bot.inventory.items().find(i =>
    i.name === 'iron_sword' || i.name === 'minecraft:iron_sword'
  );
  const enchantedBook = bot.inventory.items().find(i =>
    i.name.includes('enchanted_book')
  );
  if (!ironSword || !enchantedBook) {
    anvilWindow.close();
    return bot.chat('Нужны меч и книга для зачарования.');
  }

  try {
    bot.chat('Начинаю комбинировать предметы...');
    // Метод combine перемещает входные предметы (меч и книгу) в соответствующие слоты наковальни
    await anvilWindow.combine(ironSword, enchantedBook);

    // Ждем, чтобы сервер рассчитала результат зачарования
    await bot.waitForTicks(20);

    bot.chat('Комбинация выполнена, забираю результат...');
    // Кликаем по результату (обычно слот 2) для того чтобы "подобрать" зачарованный меч
    await bot.clickWindow(2, 0, 0); // подбираем результат (на курсор)
    await bot.waitForTicks(5);

    // Перекладываем предмет с курсора в первый свободный слот в инвентаре
    const freeSlot = firstEmptySlot();
    if (freeSlot != null) {
      await bot.clickWindow(freeSlot, 0, 0);
      await bot.waitForTicks(5);
    }
    
    bot.chat('Готово — зачарованный предмет в инвентаре!');
  } catch (err) {
    bot.chat(`Ошибка зачарования: ${err.message}`);
    console.error(`Ошибка зачарования: ${err.message}`);
  } finally {
    anvilWindow.close();
  }
}

bot.on('experience', () => {
  console.log(`Уровень: ${bot.experience.level}`);
});
bot.on('error', err => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
