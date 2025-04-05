

const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder')

const RANGE_GOAL = 1 // Радиус в который должен попасть бот при движении к игроку

const bot = mineflayer.createBot({
    host: 'localhost', // minecraft server ip
    port: `3333`,
    username: 'test', // minecraft username
  })
  bot.loadPlugin(pathfinder)


  bot.once('spawn', () => {
    const defaultMove = new Movements(bot)
  
    bot.on('chat', (username, message) => {
      if (username === bot.username) return
      // 1. Если ктото написал в чат "come"
      if (message !== 'come') return
      // 2. Проверка на то - есть ли рядом игрок с никнеймом который написал слово "come"
      const target = bot.players[username]?.entity
      // 3. Если игрока с этим ником нету в радиусе бота - то он пишет это в чат
      if (!target) {
        bot.chat("I don't see you !")
        return
      }
      // 4. Получаю кординаты игрока к которому должен идти бот по x/y/z
      const { x: playerX, y: playerY, z: playerZ } = target.position
      
      // 5. Отправляю бота к игроку
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalNear(playerX, playerY, playerZ, RANGE_GOAL))
    })
  })



  bot.on('kicked', (info)=>{
    console.log(`Бота кикнули из сервера ${info}`)
  })
  bot.on('error', console.log)