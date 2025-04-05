const mineflayer = require('mineflayer');
const inventoryViewer = require('mineflayer-web-inventory')
const { GoalBlock } = require('mineflayer-pathfinder').goals; // Импортируем GoalBlock
const pathfinder = require('mineflayer-pathfinder').pathfinder



const bot = mineflayer.createBot({
  host: 'localhost',
  port: 3333,
  username: 'test',
  version: '1.20'
});
inventoryViewer(bot, { port: 3007 })
bot.loadPlugin(pathfinder)

let switchPlaceBlock = false;

bot.once('spawn', async () => {
  console.log('Бот зашел на сервер');


  lastPosition = bot.entity.position;
  currentPosition = bot.entity.position;

  let swtichGG = true;

  setInterval(() => {
   
    lastPosition = bot.entity.position;
    switchPlaceBlock = true;
    bot.setControlState('jump', true)    
    bot.setControlState('jump', false)    
    swtichGG = false;
  }, 200);

  setInterval(async() => {
    const distanceMoved = lastPosition.distanceTo(currentPosition);
    if(distanceMoved !== 0){
    // if(distanceMoved !== 1) bot.chat(`${distanceMoved}`)
      if(distanceMoved > 0.8 && switchPlaceBlock){
        switchPlaceBlock = false;
        bot.chat(`Можно ставить блок под себя ${distanceMoved}`)
        await buildPillar();
        swtichGG = true
      }
         
    }
  }, 10);



  async function buildPillar() {

      // Проверяем, есть ли у бота блоки в инвентаре
      const block = bot.inventory.items().find(item => item.name.includes('dirt')); // Используем каменные блоки
  
      try {
        // Экипируем блок в руку
        await bot.equip(block, 'hand');
  
        // Ставим блок под собой
        const positionBelow = bot.entity.position.floored().offset(0, -1, 0);

        await bot.placeBlock(bot.blockAt(positionBelow), { x: 0, y: 1, z: 0 });
  
      } catch (err) {
        console.error('Ошибка при строительстве:', err);
      }
    
  }

});


bot.on('chat', (username, message) => {
  // Проверяем, что сообщение не от самого бота
  if (message !== `1`) return;

  switchPlaceBlock = true;
  lastPosition = bot.entity.position;
  bot.setControlState('jump', true)
  bot.setControlState('jump', false)
 

});

let lastPosition = null;
let currentPosition = null;

bot.on('move', async () => {

  if(lastPosition == null) return
  currentPosition = bot.entity.position;

})



bot.on('error', (err) => console.error('Ошибка:', err));
bot.on('end', () => console.log('Бот отключился от сервера.'));
