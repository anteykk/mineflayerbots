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

// Этап 3: Действия при заходе бота в игровой мир
bot.once('spawn', async () => {
  bot.chat('Привет! Я бот для крафта и установки верстака.');

  // Шаг 3.1: Проверяем наличие дубовых досок
  const planksCount = countItemsInInventory('oak_planks', bot);
  if (planksCount < 4) {
    bot.chat('Недостаточно дубовых досок для крафта верстака.');
    return;
  }

  // Шаг 3.2: Проверяем наличие верстака в инвентаре
  const workbenchID = mcData.itemsByName['crafting_table'].id;
  const workbenchCount = countItemsInInventory('crafting_table', bot);

  if (workbenchCount < 1) {
    // Шаг 3.3: Крафтим верстак
    const workbenchRecipe = bot.recipesFor(workbenchID, null, 1, null)[0];
    if (workbenchRecipe) {
      await bot.craft(workbenchRecipe, 1, null);
      bot.chat('Создал верстак.');
    } else {
      bot.chat('Не удалось найти рецепт для крафта верстака.');
      return;
    }
  }

  // Шаг 3.4: Устанавливаем верстак
  await placeWorkbench(bot, workbenchID);
  bot.chat('Установил верстак перед собой.');

  // Шаг 3.5: Крафтим и устанавливаем печь
  await craftAndPlaceFurnace(bot);

  // Шаг 3.6: Загружаем уголь и железную руду в печь
  await fuelAndSmelt(bot);
});

// Этап 4: Подсчет предметов в инвентаре
function countItemsInInventory(itemName, bot) {
  const items = bot.inventory.items().filter(item => item.name === itemName);
  return items.reduce((total, item) => total + item.count, 0);
}

// Этап 5: Установка верстака
async function placeWorkbench(bot, workbenchID) {
  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 1));
  const workbenchItem = bot.inventory.items().find(item => item.type === workbenchID);

  if (workbenchItem && referenceBlock) {
    try {
      await bot.equip(workbenchItem, 'hand');
      await bot.placeBlock(referenceBlock, vec3(0, 1, 0));
    } catch (err) {
      console.log(`Ошибка при установке верстака: ${err.message}`);
    }
  } else {
    bot.chat('Не удалось найти верстак в инвентаре или блок для установки.');
  }
}

// Этап 6: Крафт и установка печи
async function craftAndPlaceFurnace(bot) {
  const furnaceID = mcData.itemsByName['furnace'].id;

  // Шаг 6.1: Проверяем наличие булыжников
  const cobblestoneCount = countItemsInInventory('cobblestone', bot);
  if (cobblestoneCount < 8) {
    bot.chat('Недостаточно булыжников для крафта печи.');
    return;
  }

  // Шаг 6.2: Находим верстак поблизости
  const workbench = bot.findBlock({
    matching: mcData.blocksByName['crafting_table'].id,
    maxDistance: 6
  });

  if (!workbench) {
    bot.chat('Верстак не найден поблизости.');
    return;
  }

  // Шаг 6.3: Крафтим печь
  const furnaceRecipe = bot.recipesFor(furnaceID, null, 1, workbench)[0];
  if (furnaceRecipe) {
    await bot.craft(furnaceRecipe, 1, workbench);
    bot.chat('Создал печь.');

    // Шаг 6.4: Устанавливаем печь
    const furnaceItem = bot.inventory.items().find(item => item.type === furnaceID);
    const referenceBlock = bot.blockAt(bot.entity.position.offset(2, 0, 0));

    if (furnaceItem && referenceBlock) {
      try {
        await bot.equip(furnaceItem, 'hand');
        await bot.placeBlock(referenceBlock, vec3(0, 1, 0));
        bot.chat('Установил печь.');
      } catch (err) {
        console.log(`Ошибка при установке печи: ${err.message}`);
      }
    } else {
      bot.chat('Не удалось найти печь в инвентаре или блок для установки.');
    }
  } else {
    bot.chat('Не удалось найти рецепт для крафта печи.');
  }
}

// Этап 7: Загрузка печи углем и железной рудой
async function fuelAndSmelt(bot) {
  const furnace = bot.findBlock({
    matching: mcData.blocksByName['furnace'].id,
    maxDistance: 6
  });

  if (!furnace) {
    bot.chat('Печь не найдена поблизости.');
    return;
  }

  bot.once('windowOpen', async (furnaceWindow) => {
    try {
      // Шаг 7.1: Поиск слотов угля и железной руды
      const findCoalSlot = (inventory, name) => {
        for (let i = 0; i < inventory.length; i++) {
          const item = inventory[i];
          if (item && item.name === name) return item.slot;
        }
        return null;
      };

      const coalSlot = findCoalSlot(furnaceWindow.slots, 'coal');
      const ironSlot = findCoalSlot(furnaceWindow.slots, 'iron_ore');

      // Шаг 7.2: Перемещаем предметы в печь
      if (coalSlot !== null && ironSlot !== null) {
        await bot.moveSlotItem(coalSlot, 1);
        await bot.moveSlotItem(ironSlot, 0);
        bot.chat('Загрузил печь углем и железной рудой.');
      } else {
        bot.chat('Не удалось найти нужные предметы.');
      }
    } catch (err) {
      bot.chat(`Ошибка при загрузке печи: ${err.message}`);
    }
  });

  // Шаг 7.3: Активируем блок печи
  bot.activateBlock(furnace);
}
