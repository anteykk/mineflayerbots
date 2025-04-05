const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

const botCount = 15
const bots = []

for (let i = 1; i <= botCount; i++) {
  const bot = mineflayer.createBot({
    host: 'kenamen2.aternos.me',
    port: 64964,
    username: `Bot${i}`,
    version: '1.20'
  })
  bot.loadPlugin(pvp)
  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    giveItems(bot, i)

    setTimeout(() => {
      equipArmor(bot)
    }, 2000) // Задержка 2 секунды для получения предметов и надевания брони

    setInterval(() => {
      const hostileMobs = [
        'Zombie',
        'Skeleton',
        'Spider',
        'Creeper',
        'Enderman',
        'Witch',
        'Slime',
        'Magma Cube',
        'Wither Skeleton',
        'Husk',
        'Stray',
        'Drowned',
        'Phantom',
        'Blaze',
        'Ghast',
        'Vindicator',
        'Evoker',
        'Pillager',
        'Ravager',
        'Vex',
        'Guardian',
        'Elder Guardian',
        'Shulker',
        'Endermite',
        'Silverfish',
        'Piglin',
        'Piglin Brute',
        'Zombified Piglin',
        'Hoglin',
        'Zoglin'
      ]

      const entities = Object.values(bot.entities).filter(entity => 
        hostileMobs.includes(entity.displayName) && 
        bot.entity.position.distanceTo(entity.position) < 15
      )

      if (entities.length > 0) {
        entities.forEach(async entity => {
          const distance = bot.entity.position.distanceTo(entity.position)
          if (distance > 5) {
            await equipBowAndShoot(bot, entity)
          } else {
            await equipSword(bot)
            bot.pvp.attack(entity)
          }
        })
      }
    }, 1000) // Проверяем каждую секунду на наличие враждебных мобов

    bot.on('stoppedAttacking', () => {
     // bot.chat('Я больше не атакую.')
    })

    bot.on('death', () => {
      bot.chat('Меня убили!')
    })

    bot.on('respawn', () => {
      bot.chat('Я возродился!')
      giveItems(bot, i)
      setTimeout(() => {
        equipArmor(bot)
      }, 2000) // Задержка 2 секунды для получения предметов и надевания брони
    })
  })

  bot.on('chat', (username, message) => {
    if (message === 'stop') {
      bot.pvp.stop()
      bot.chat('Остановил атаку.')
    }
  })

  bots.push(bot)
}

function giveItems(bot, i) {
  bot.chat(`/give Bot${i} iron_helmet{amount:1}`)
  bot.chat(`/give Bot${i} iron_chestplate{amount:1}`)
  bot.chat(`/give Bot${i} iron_leggings{amount:1}`)
  bot.chat(`/give Bot${i} iron_boots{amount:1}`)
  bot.chat(`/give Bot${i} iron_sword{amount:1}`)
  bot.chat(`/give Bot${i} bow{amount:1}`)
  bot.chat(`/give Bot${i} arrow{amount:64}`)
}

//! Одеваю броню если она в инвентаре у бота
async function equipArmor(bot) {
  const armorTypes = {
    helmet: 'head',
    chestplate: 'torso',
    leggings: 'legs',
    boots: 'feet'
  }

  for (const [armorType, slotType] of Object.entries(armorTypes)) {
    const armor = bot.inventory.items().find(item => item.name.includes(armorType))
    if (armor) {
      try {
        await bot.equip(armor, slotType)
        bot.chat(`Надел ${armorType}`)
      } catch (err) {
        bot.chat(`Не смог надеть ${armorType}: ${err.message}`)
      }
    }
  }
}

//! Бот экипирует меч
async function equipSword(bot) {
  const sword = bot.inventory.items().find(item => item.name.includes('sword'))
  if (sword) {
    try {
      await bot.equip(sword, 'hand')
    } catch (err) {
      // bot.chat(`Не смог взять меч: ${err.message}`)
    }
  } else {
    bot.chat('Меча в инвентаре нет')
  }
}

//! Бот экипирует лук и стреляет
async function equipBowAndShoot(bot, entity) {
  const bow = bot.inventory.items().find(item => item.name.includes('bow'))
  const arrows = bot.inventory.items().find(item => item.name.includes('arrow'))
  if (bow && arrows) {
    try {
      await bot.equip(bow, 'hand')
      await bot.lookAt(entity.position.offset(0, entity.height / 2, 0))
      bot.activateItem() // Натягивание стрелы
      setTimeout(() => {
        bot.deactivateItem() // Выпуск стрелы
      //  bot.chat('Стреляю из лука')
      }, 1000) // Таймаут в 1000 мс для выпуска стрелы
    } catch (err) {
      bot.chat(`Не смог использовать лук: ${err.message}`)
    }
  } else {
   // bot.chat('Лука или стрел нет в инвентаре')
  }
}
