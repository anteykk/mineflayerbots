const mineflayer = require('mineflayer')
const mcData = require('minecraft-data')('1.20')
const { Vec3 } = require('vec3')

let bot = mineflayer.createBot({
  host: 'localhost',
  port: '3333',
  username: 'test',
  version: '1.20'
})

bot.once('spawn', () => {
  bot.chat('Готов к работе!')
  checkAndCraft()
})

function checkAndCraft() {
  const wood = bot.inventory.items().find(item => ['oak_planks', 'birch_planks', 'spruce_planks'].includes(item.name))
  if (wood) {
    bot.chat(`Дерево для строительства найдено: ${wood.name}`)
    placeBlock(wood)
  } else {
    craftPlanks()
  }
}

function craftPlanks() {
  const logs = bot.inventory.items().find(item => ['oak_log', 'birch_log', 'spruce_log'].includes(item.name))
  if (logs) {
    bot.chat(`Создаю доски из ${logs.name}`)
    const recipe = bot.recipesFor(mcData.itemsByName.oak_planks.id, null, 1, null)[0]
    let k4 = bot.craft(recipe, 1, null)
    k4.then((err) => {
      if (err) {
        bot.chat('Ошибка при создании досок')
        console.error(err)
        return
      }
      bot.chat('Создано доски, теперь ставлю блок...')
      checkAndCraft() // Повторить проверку после крафта
    })
  } else {
    bot.chat('Нет подходящих материалов для крафта досок')
  }
}

function placeBlock(block) {

  
  let i5 =  bot.equip(block, 'hand')
  i5.then((err)=>{
    if (err) {
      bot.chat('Не удалось экипировать блок')
      console.error(err)
      return
    }
    const target = bot.blockAt(bot.entity.position.offset(0, -1, 1)) // Блок перед ботом

    
    let rr0 = bot.placeBlock(target, new Vec3(0, 1, 0))
    rr0.then((err)=>{
      if (err) {
        bot.chat('Ошибка при установке блока')
        console.error(err)
        return
      }
      bot.chat('Блок успешно установлен!')
    })
  })
}


bot.on('error', (err) => {
  console.error(`Ошибка: ${err}`)
})

bot.on('end', () => {
  console.log('Соединение с сервером потеряно')
})
