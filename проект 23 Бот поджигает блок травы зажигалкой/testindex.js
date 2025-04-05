const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3'); // Импортируем Vec3
let mcData;

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 3333,
  username: 'test',
  version: '1.20'
});



bot.once('spawn', async () => {
  console.log('Зашел');

  mcData = require('minecraft-data')(bot.version)

  // Функция для нахождения предмета в инвентаре
  const findItemInInventory = (name) => {
    return bot.inventory.items().find(item => item.name === name);
  };

  // Позиция блока, который нужно поджечь (через блок от себя)
  const targetPosition = bot.entity.position.offset(2, -1, 0); // Воздушный блок над травой на 2 блока впереди


  // Находим зажигалку в инвентаре
  const flintAndSteel = findItemInInventory('flint_and_steel');



  try {
    // Экипируем зажигалку
    await bot.equip(flintAndSteel, 'hand');
    console.log('Зажигалка экипирована');

    // Бот смотрит на блок, который нужно поджечь
    await bot.lookAt(targetPosition, true);


  

 
    await bot.placeBlock(bot.blockAt(targetPosition), new Vec3(0, 1, 0));
    console.log('Зажигалка использована');
  } catch (err) {
    console.error('Ошибка при использовании зажигалки:', err);
  }
});

bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
