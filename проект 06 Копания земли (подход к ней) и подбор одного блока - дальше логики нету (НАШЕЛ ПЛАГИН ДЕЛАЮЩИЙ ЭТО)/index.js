const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
const mcData = require('minecraft-data')('1.20')


const bot = mineflayer.createBot({
  host: 'localhost',
  port: 3333,
  username: 'test'
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-collectblock').plugin)


bot.once('spawn', () => {
  const defaultMove = new Movements(bot, mcData)
  bot.pathfinder.setMovements(defaultMove)
  bot.chat('Готов копать землю!')
  startDigging()
})

function startDigging() {
  const grass = findDirtBlock()
  if (grass) {
    const distance = grass.position.distanceTo(bot.entity.position)
    if (distance <= 3) {
      collectItems(() => chopTree(grass))
    } else {
      bot.chat('Подхожу к земле...')
      moveToGrass(grass)
    }
  } else {
    bot.chat('Нет блока земли для копания в радиусе 10 блоков')
    setTimeout(startDigging, 1000) // Через 1 секунду проверяем снова
  }
}

function moveToGrass(grass) {
  bot.removeAllListeners('goal_reached')
  const goal = new GoalNear(grass.position.x, grass.position.y, grass.position.z, 3)
  bot.pathfinder.setGoal(goal)
  bot.once('goal_reached', () => {
    bot.chat('Подошел к земле. Начинаю копать.')
    collectItems(() => chopTree(grass))
  })
}

function findDirtBlock() {
  const logNames = ['dirt', 'grass_block', 'coarse_dirt']
  const range = 10 // Максимальная дистанция поиска
  return bot.findBlock({
    matching: block => logNames.includes(block.name),
    maxDistance: range
  })
}

function chopTree(grass) {
  bot.chat(`Нашел блок земли на (${grass.position.x}, ${grass.position.y}, ${grass.position.z}) в радиусе 3-х блоков. Начинаю копать!`)
  let t5 = bot.dig(grass)
  t5.then(() => {
    setTimeout(startDigging, 100) // Через 0.1 секунду начинаем ломать следующий блок
  }).catch((err) => {
    console.log('Ошибка при копании:', err)
  })
}

function collectItems(callback) {
  // Выводим информацию о всех сущностях, используя entity.displayName вместо устаревшего objectType
  const allEntities = Object.values(bot.entities)
  


  // Ищем предметы по displayName
  const items = allEntities.filter(entity => {
    if(entity.type === 'other' && entity.displayName === 'Item'){
      return entity.type === 'other' && entity.displayName === 'Item' && bot.entity.position.distanceTo(entity.position) <= 5
    }
  })



  bot.chat(`Найдено сущностей: ${allEntities.length}, из них предметов: ${items.length}`)
 

  if (items.length > 0) {
    const item = items[0]
    bot.chat(`Иду к предмету на (${item.position.x}, ${item.position.y}, ${item.position.z}) на разстоянии ${Math.floor(bot.entity.position.distanceTo(item.position))} блоков`)

    const goal = new GoalNear(item.position.x, item.position.y, item.position.z, 1)
    bot.pathfinder.setGoal(goal)

    bot.once('goal_reached', () => {
      bot.chat('Подобрал предмет')
      /*
          bot.collectBlock.collect(item, err => {
            if (err) {
              bot.chat('Не удалось подобрать предмет')
              console.error(err)
            } else {
              bot.chat('Подобрал предмет')
              collectItems(callback) // Продолжаем собирать оставшиеся предметы
            }
          })
       */

    })
  } else {
    bot.chat('Предметов для сбора не найдено.')
    callback() // Все предметы собраны, продолжаем выполнение
  }
}

bot.on('error', (err) => {
  console.error('Ошибка:', err)
})

bot.on('end', () => {
  console.log('Соединение с сервером потеряно')
})
