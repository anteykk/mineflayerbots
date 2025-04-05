const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const inventoryViewer = require('mineflayer-web-inventory')

const bot = mineflayer.createBot({
  host: 'localhost', // Укажите ваш сервер
  port: 3333,       // Укажите порт вашего сервера
  username: 'MilkBot', // Имя пользователя вашего бота
  version: '1.20'    // Укажите версию Minecraft
});

bot.loadPlugin(pathfinder);
inventoryViewer(bot, { port: 3007 })

bot.once('spawn', () => {
  console.log('Бот подключился к серверу.');

  // Обработчик команды для начала доения
  bot.on('chat', (username, message) => {
    if (message === 'milk') {
      startMilking();
    }
  });
});

async function startMilking() {
  try {
    // Берем ведро в руку
    const bucket = bot.inventory.items().find(item => item.name === 'bucket');
    if (!bucket) {
      console.log('Нет пустого ведра в инвентаре.');
      return;
    }
    await bot.equip(bucket, 'hand');

    // Находим ближайшую корову
    const cow = bot.nearestEntity(entity => entity.displayName === 'Cow');
    if (!cow) {
      console.log('Рядом нет коров.');
      return;
    }

    // Двигаемся к корове
    const movements = new Movements(bot, bot.pathfinder);
    bot.pathfinder.setMovements(movements);
    const goal = new goals.GoalNear(cow.position.x, cow.position.y, cow.position.z, 1);
    bot.pathfinder.setGoal(goal);

    // Ожидаем достижения цели
    bot.once('goal_reached', async () => {
      try {
        // Доение коровы
        await bot.activateEntity(cow);
        console.log('Корова подоена.');
      } catch (err) {
        console.log('Ошибка при доении коровы: ', err);
      }
    });
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
