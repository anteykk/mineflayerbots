const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder'); 
const { Vec3 } = require('vec3');
const mcData = require('minecraft-data')('1.20');

let bot = mineflayer.createBot({
  host: 'localhost',
  port: '3333',
  username: 'test',
  version: '1.20'
});

bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
  const defaultMove = new Movements(bot);
  bot.pathfinder.setMovements(defaultMove);
  bot.chat('Готов рубить деревья!');
  startChopping();
});

function startChopping() {
  const treeBlock = findNearestTree();
  
  if (!treeBlock) {
    bot.chat('Дерево не найдено. Проверяю снова...');
    setTimeout(startChopping, 5000); // Повторить попытку через 5 секунд
    return;
  }
  
  const distance = treeBlock.position.distanceTo(bot.entity.position);
  const heightDifference = treeBlock.position.y - bot.entity.position.y;
  bot.chat(`Нашел ${treeBlock.name} на расстоянии ${distance.toFixed(2)} блоков и высоте ${heightDifference} блоков.`);

  if (distance > 4 && heightDifference < 4 ) {
    bot.chat('Подхожу к дереву...');
    moveToTree(treeBlock);
  } else if (heightDifference > 1) {
    bot.chat('Дерево слишком высоко. Строю под собой блоки...');
    buildPillar(treeBlock, heightDifference);
  } else {
    bot.chat('Начинаю рубить дерево!');
    chopTree(treeBlock);
  }
}

function findNearestTree() {
  const logNames = ['oak_log', 'birch_log', 'spruce_log']; // Названия логов дерева
  const range = 16; // Максимальная дистанция поиска
  return bot.findBlock({
    matching: block => logNames.includes(block.name),
    maxDistance: range
  });
}

function moveToTree(treeBlock) {
  // Удаляем предыдущие слушатели, чтобы избежать утечек памяти
  bot.removeAllListeners('goal_reached');
  bot.removeAllListeners('path_update');
  bot.removeAllListeners('goal_timeout');

  const goal = new GoalNear(treeBlock.position.x, treeBlock.position.y, treeBlock.position.z, 4);
  bot.pathfinder.setGoal(goal);

  bot.once('goal_reached', () => {
    bot.chat('Подошел к дереву. Начинаю рубить.');
    chopTree(treeBlock);
  });

  bot.once('path_update', (r) => {
    if (r.status === 'noPath') {
      bot.chat('Не могу найти путь к дереву, повторяю попытку...');
      setTimeout(startChopping, 5000); // Повторить попытку через 5 секунд
    }
  });

  bot.once('goal_timeout', () => {
    bot.chat('Превышено время на поиск пути.');
    setTimeout(startChopping, 5000); // Повторить попытку через 5 секунд
  });
}

// Функция для постройки башни под ботом, используя любые блоки из инвентаря
function buildPillar(treeBlock, heightDifference) {
  let blocksToPlace = heightDifference - 1;
  
  // Находим любой блок, который можно использовать для строительства
  const buildingBlock = bot.inventory.items().find(item => mcData.blocks[item.type].material === 'solid');
  
  
  if (!buildingBlock) {
    bot.chat('Нет блоков для строительства.');
    setTimeout(startChopping, 5000);
    return;
  }

  const buildNext = () => {
    if (blocksToPlace > 0) {
      const target = bot.blockAt(bot.entity.position.offset(0, -1, 0));
      bot.equip(buildingBlock, 'hand', (err) => {
        if (err) {
          bot.chat('Не удалось экипировать блок для строительства.');
          setTimeout(startChopping, 5000);
          return;
        }
        bot.placeBlock(target, new Vec3(0, 1, 0), (err) => {
          if (err) {
            bot.chat('Не удалось поставить блок.');
            setTimeout(startChopping, 5000);
            return;
          }
          blocksToPlace--;
          bot.chat(`Поставил блок. Осталось ${blocksToPlace}`);
          buildNext();
        });
      });
    } else {
      bot.chat('Достаточно высоко. Начинаю рубить дерево.');
      chopTree(treeBlock);
    }
  };

  buildNext();
}

function chopTree(treeBlock) {
  let km5 = bot.dig(treeBlock);
  km5.then(async (err) => {
    if (err) {
      bot.chat('Не удалось срубить дерево.');
      setTimeout(startChopping, 5000); // Повторить попытку через 5 секунд
      return;
    }
    bot.chat('Срубил дерево.');
    setTimeout(startChopping, 100); // Переход к следующему дереву через 0.1 секунды
  }).catch((err) => {
    console.log('ОШИБКА ПРИ РУБКЕ ДЕРЕВА');
    console.log(err);
    setTimeout(startChopping, 100);
  });
}

bot.on('error', (err) => {
  console.error(`Ошибка: ${err}`);
});

bot.on('end', () => {
  console.log('Соединение с сервером потеряно');
});