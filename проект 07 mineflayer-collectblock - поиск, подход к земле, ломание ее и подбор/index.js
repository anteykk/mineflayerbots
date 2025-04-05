const mineflayer = require('mineflayer')
const collectBlock = require('mineflayer-collectblock').plugin
const inventoryViewer = require('mineflayer-web-inventory')

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 3333,
  username: 'test',
  version: '1.20'
})

bot.loadPlugin(collectBlock)
inventoryViewer(bot, {port: 3007})

let mcData
bot.once('spawn', () => {
  mcData = require('minecraft-data')(bot.version)
  startDigging()
})


async function startDigging(){

  let blockName = `grass_block`;
  let count = 1

  const blockType = mcData.blocksByName[blockName]
  if (!blockType) {
    console.log(`Блока с таким типом не существует`)
    return
  }

  const blocks = bot.findBlocks({
    matching: blockType.id,
    maxDistance: 64,
    count: count
  })

  if (blocks.length === 0) {
    bot.chat("Я не нашел этого блока поблизости")
    return
  }

  const targets = []
  for (let i = 0; i < Math.min(blocks.length, count); i++) {
    targets.push(bot.blockAt(blocks[i]))
  }

  bot.chat(`Нашол ${targets.length} ${blockName}(s)`)


  try {
    await bot.collectBlock.collect(targets)
    //! Данная надпись выводиться когда блок уже собран поскольку ранее стоит "await" который ожидает когда блок подбереться
    bot.chat('Подобрал блок')

    startDigging()

    return;
  } catch (err) {
    // An error occurred, report it.
    bot.chat(err.message)
    console.log(err)
  }

}

