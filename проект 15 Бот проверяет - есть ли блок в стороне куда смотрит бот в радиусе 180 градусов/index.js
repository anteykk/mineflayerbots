const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'localhost', // Укажите ваш сервер
  port: 3333,       // Укажите порт вашего сервера
  username: 'CoordinateBot', // Имя пользователя вашего бота
  version: '1.20'    // Укажите версию Minecraft
});

bot.once('spawn', () => {
  console.log('Бот подключился к серверу.');


    const { x, y, z } = bot.entity.position;
    const direction = getDirection(bot.entity.pitch, bot.entity.yaw);

    console.log(`Текущие координаты бота: X: ${x}, Y: ${y}, Z: ${z}`);
    console.log(`Бот смотрит на: ${direction}`);
    bot.chat(`Текущие координаты бота: X: ${x}, Y: ${y}, Z: ${z}`);
    bot.chat(`Бот смотрит на: ${direction}`);

    const blueWoolBlock = findBlueWoolInFOV();

    if (blueWoolBlock) {
      console.log(`Блок "синей шерсти" найден в поле зрения на координатах: X: ${blueWoolBlock.position.x}, Y: ${blueWoolBlock.position.y}, Z: ${blueWoolBlock.position.z}`);
      bot.chat(`Блок "синей шерсти" найден в поле зрения на координатах: X: ${blueWoolBlock.position.x}, Y: ${blueWoolBlock.position.y}, Z: ${blueWoolBlock.position.z}`);
    } else {
      console.log('Блок "синей шерсти" не найден в поле зрения.');
      bot.chat('Блок "синей шерсти" не найден в поле зрения.');
    }

});

function getDirection(pitch, yaw) {
  const directions = [];
  if (pitch < -Math.PI / 4) {
    directions.push('up');
  } else if (pitch > Math.PI / 4) {
    directions.push('down');
  }

  if (yaw >= -Math.PI / 4 && yaw < Math.PI / 4) {
    directions.push('south');
  } else if (yaw >= Math.PI / 4 && yaw < 3 * Math.PI / 4) {
    directions.push('west');
  } else if (yaw >= -3 * Math.PI / 4 && yaw < -Math.PI / 4) {
    directions.push('east');
  } else {
    directions.push('north');
  }

  return directions.join(' ');
}

function findBlueWoolInFOV() {
  const maxDistance = 100; // Максимальное расстояние для поиска блока
  const fovAngle = Math.PI; // Поле зрения 180 градусов (π радиан)
  const blocks = bot.findBlocks({
    matching: block => block.name === 'blue_wool',
    maxDistance: maxDistance,
    count: 1000 // Максимальное количество блоков для поиска
  });

  console.log(blocks)

  const botYaw = bot.entity.yaw;
  const botPitch = bot.entity.pitch;

  for (const pos of blocks) {
    const dx = pos.x - bot.entity.position.x;
    const dy = pos.y - bot.entity.position.y;
    const dz = pos.z - bot.entity.position.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const angleYaw = Math.atan2(dz, dx) - botYaw;
    const anglePitch = Math.asin(dy / distance) - botPitch;

    if (Math.abs(angleYaw) <= fovAngle / 2 && Math.abs(anglePitch) <= fovAngle / 2) {
      return bot.blockAt(pos);
    }
  }

  return null;
}

bot.on('error', (err) => {
  console.error('Ошибка: ', err);
});

bot.on('end', () => {
  console.log('Бот отключился от сервера.');
});
