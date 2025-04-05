


const mineflayer = require('mineflayer')
// npm install mineflayer-pvp
const pvp = require('mineflayer-pvp').plugin
// npm install mineflayer-pathfinder
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
// npm install mineflayer-armor-manager
const armorManager = require('mineflayer-armor-manager')

const bot = mineflayer.createBot({
  host: 'uaru.aternos.host', // minecraft server ip
  port: `49014`,
  username: 'test', // minecraft username
})

// Подключаем плагины к боту
bot.loadPlugin(pvp);
bot.loadPlugin(armorManager);
bot.loadPlugin(pathfinder);


let guardPos = null

function guardArea (pos) {
  // Клонируем позицию на которой игрок попросил подойти к нему
  guardPos = pos.clone()

  // Если бот не вступил нискем в pvp то проходит проверку
  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

// Функция дающая команду прекратить преследования
function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

// Задаемм пемещения бота в указанные кардинаты
function moveToGuardPos () {
  const mcData = require('minecraft-data')(bot.version)
  
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  // Приказываем боту отправиться на эти кординаты
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}


// Ивент physicTick запускает функцию в себе 16 раз в секунду, в этом функции спомощю фильтра мы указываем боту намасть на ммоба
bot.on('physicTick', () => {
  //if (!guardPos) return
  
  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
                      e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?

  const entity = bot.nearestEntity(filter)
  if (entity) {
    // Приказывает боту атаковать моба если он в предела 16 блоков
    bot.pvp.attack(entity)
  }
})


// Если у бота в инвентаре будет мечь - то он его возьмет в руку
bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

// Бот атакует игрока который написал в чате "убей меня"
bot.on('chat', (username, message) => {

  // Указываем боту что он к нас подошол
  if (message === 'guard') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('I will guard that location.')
    // Передаем картинаты игрока 
    guardArea(player.entity.position)
  }


 
  if (message === 'убей меня') {
    // Получаем информацию об опеределенном игроке
    const player = bot.players[username]
    

    if (!player) {
      bot.chat("Я не вижу тебя.")
      return
    }

    bot.chat('Готовься к сражению!')
    // Спомощю метода .attack (плагина pvp) приказываемм боту атаковать игрока
    bot.pvp.attack(player.entity)
  }

  // Приказываем боту больше никого не атаковать
  if (message === 'стой') {
    bot.chat('Я больше не буду никого атаковать.')
    bot.pvp.attack(null)
  }

})
















// Авторизоваться на сервере
/*
bot.on('login', () => {
    bot.chat("/login 1234");
  });
  */



// Читать все сообщения из чата
/*
bot.on('message', async (jsonMsg) =>{
    //console.log(jsonMsg.extra)
    let text = [];
    for(let elem of jsonMsg.extra){
        text.push(elem.text)
    }
    text = text.join(``);
    console.log(text)

    if(text == `Ⓛ   (Крестьянин) kaka1 сказал(а) давай`){
        bot.chat("ХУЙНЯ СЕРВЕР");
    }

    if(text == `Ⓛ   (Крестьянин) kaka1 сказал(а) pvp`){
        console.log(`ПРИККАЗ АТАКОВАТЬ ИГРА`)
       
    }


})
*/



// Выводить причину кика в консоль
bot.on('kicked', (reason) => {
    console.log(reason)
  });

