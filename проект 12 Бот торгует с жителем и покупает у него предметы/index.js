/*
 * Даже боты иногда хотят торговать.
 *
 * Поэтому мы создали пример, который демонстрирует, насколько просто
 * найти жителя и провести торговлю.
 *
 * Вы можете попросить бота торговать с жителем, показать жителей в радиусе
 * и показать доступные сделки жителя, отправив сообщение в чат.
 */
const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')

console.log('Commands :\n' +
  '  show villagers\n' +
  '  show inventory\n' +
  '  show trades <id>\n' +
  '  trade <id> <trade> [<times>]')

// Этап 1: Создаем бота и подключаем его к серверу Minecraft
const bot = mineflayer.createBot({
  host: `localhost`,
  port: `3333`,
  username: `TradeBot`,
  version: '1.20'
})

// Этап 2: Включаем просмотр инвентаря через веб-интерфейс
inventoryViewer(bot, { port: 3007 })

// Этап 3: Обработка команд из чата
bot.on('chat', (username, message) => {
  if (username === bot.username) return // Игнорируем сообщения от самого бота
  const command = message.split(' ')
  switch (true) {
    case message === 'show villagers':
      showVillagers() // Показываем всех жителей поблизости
      break
    case message === 'show inventory':
      showInventory() // Показываем инвентарь бота
      break
    case /^show trades [0-9]+$/.test(message):
      showTrades(command[2]) // Показываем сделки жителя по ID
      break
    case /^trade [0-9]+ [0-9]+( [0-9]+)?$/.test(message):
      trade(command[1], command[2], command[3]) // Выполняем торговую сделку с жителем по ID
      break
  }
})

// Этап 4: Функции для выполнения команд
function showVillagers () {
  // Находим всех жителей в мире
  const villagers = Object.keys(bot.entities).map(id => bot.entities[id]).filter(e => e.entityType === bot.registry.entitiesByName.villager.id)
  // Фильтруем жителей, которые находятся в радиусе 3 блоков от бота
  const closeVillagersId = villagers.filter(e => bot.entity.position.distanceTo(e.position) < 3).map(e => e.id)
  bot.chat(`found ${villagers.length} villagers`)
  bot.chat(`villager(s) you can trade with: ${closeVillagersId.join(', ')}`)
}

function showInventory () {
  // Показываем инвентарь бота
  bot.inventory.slots
    .filter(item => item).forEach((item) => {
      bot.chat(stringifyItem(item))
    })
}

async function showTrades (id) {
  // Показываем сделки жителя
  const e = bot.entities[id]
  switch (true) {
    case !e:
      bot.chat(`cant find entity with id ${id}`)
      break
    case e.entityType !== bot.registry.entitiesByName.villager.id:
      bot.chat('entity is not a villager')
      break
    case bot.entity.position.distanceTo(e.position) > 3:
      bot.chat('villager out of reach')
      break
    default: {
      const villager = await bot.openVillager(e)
      villager.close()
      stringifyTrades(villager.trades).forEach((trade, i) => {
        bot.chat(`${i + 1}: ${trade}`)
      })
    }
  }
}

async function trade (id, index, count) {
  // Выполняем торговую сделку с жителем
  const e = bot.entities[id]
  switch (true) {
    case !e:
      bot.chat(`cant find entity with id ${id}`)
      break
    case e.entityType !== bot.registry.entitiesByName.villager.id:
      bot.chat('entity is not a villager')
      break
    case bot.entity.position.distanceTo(e.position) > 3:
      bot.chat('villager out of reach')
      break
    default: {
      const villager = await bot.openVillager(e)
      const trade = villager.trades[index - 1]
      count = count || trade.maximumNbTradeUses - trade.nbTradeUses
      switch (true) {
        case !trade:
          villager.close()
          bot.chat('trade not found')
          break
        case trade.disabled:
          villager.close()
          bot.chat('trade is disabled')
          break
        case trade.maximumNbTradeUses - trade.nbTradeUses < count:
          villager.close()
          bot.chat('cant trade that often')
          break
        case !hasResources(villager.slots, trade, count):
          villager.close()
          bot.chat('dont have the resources to do that trade')
          break
        default:
          bot.chat('starting to trade')
          try {
            await bot.trade(villager, index - 1, count)
            bot.chat(`traded ${count} times`)
          } catch (err) {
            bot.chat('an error occurred while trying to trade')
            console.log(err)
          }
          villager.close()
      }
    }
  }

  function hasResources (window, trade, count) {
    // Проверяем, достаточно ли ресурсов для выполнения сделки
    const first = enough(trade.inputItem1, count)
    const second = !trade.inputItem2 || enough(trade.inputItem2, count)
    return first && second

    function enough (item, count) {
      let c = 0
      window.forEach((element) => {
        if (element && element.type === item.type && element.metadata === item.metadata) {
          c += element.count
        }
      })

      // c >= item.count * count              - item.count значения являеться undefined
      return true
    }
  }
}

// Функции для преобразования сделок и предметов в строки для вывода в чат
function stringifyTrades (trades) {
  return trades.map((trade) => {
    let text = stringifyItem(trade.inputItem1)
    if (trade.inputItem2) text += ` & ${stringifyItem(trade.inputItem2)}`
    if (trade.disabled) text += ' x '; else text += ' » '
    text += stringifyItem(trade.outputItem)
    return `(${trade.nbTradeUses}/${trade.maximumNbTradeUses}) ${text}`
  })
}

function stringifyItem (item) {
  if (!item) return 'nothing'
  let text = `${item.count} ${item.displayName}`
  if (item.nbt && item.nbt.value) {
    const ench = item.nbt.value.ench
    const StoredEnchantments = item.nbt.value.StoredEnchantments
    const Potion = item.nbt.value.Potion
    const display = item.nbt.value.display

    if (Potion) text += ` of ${Potion.value.replace(/_/g, ' ').split(':')[1] || 'unknown type'}`
    if (display) text += ` named ${display.value.Name.value}`
    if (ench || StoredEnchantments) {
      text += ` enchanted with ${(ench || StoredEnchantments).value.value.map((e) => {
        const lvl = e.lvl.value
        const id = e.id.value
        return bot.registry.enchantments[id].displayName + ' ' + lvl
      }).join(' ')}`
    }
  }
  return text
}
