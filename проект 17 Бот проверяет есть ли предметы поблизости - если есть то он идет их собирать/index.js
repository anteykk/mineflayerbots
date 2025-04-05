const mineflayer = require('mineflayer');
const { pathfinder, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
  host: 'localhost',  // Адрес сервера
  port: 3333,        // Порт сервера (по умолчанию 25565)
  username: 'DiamondHunter', // Имя бота
  version: '1.20'     // Версия Minecraft
});

bot.loadPlugin(pathfinder);

bot.once('spawn', () => {
  console.log('Бот подключился к серверу.');
  pickUpItems(bot);
});


   




async function pickUpItems(bot, radius = 5) {
  
  const items = Object.values(bot.entities).filter(entity => {
    const distance = Math.floor(bot.entity.position.distanceTo(entity.position));
    return entity.name === 'item' && distance <= radius;
  });

  for (let item of items) {
    // Подходим к предмету и подбираем его
    console.log(item.position);
    bot.pathfinder.setGoal(new goals.GoalBlock(item.position.x, item.position.y, item.position.z));
    console.log(`Есть предмет, который должен подобрать бот, объявляю промис и жду выполнения goal_reached`);

    await new Promise((resolve) => {
      bot.once('goal_reached', async () => {
        bot.chat(`Подобрал предмет c id: ${item.metadata[8].itemId}`);
        resolve();
      });
    });
  }
}

bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
