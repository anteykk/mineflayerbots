const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder')
//const mineflayerViewer = require('prismarine-viewer').mineflayer

let bot;


// Функция для создания нового бота
function createBot() {


  bot = mineflayer.createBot({
    host: 'mc.mineblaze.net', // minecraft server ip
    port: '25565',
    username: 'amaterasu1', // minecraft username
    version: '1.20'               // ВЕРСИЮ УКАЗЫВАТЬ ОБЯЗАТЕЛЬНО! ИЛИ БУДЕТ ОШИБОК И ВЫЛЕТОВ ОБЕСПЕЧЕН
  })



  bot.loadPlugin(pathfinder)


  // Индекс текущей перебираемой цели из массива goals
  let currentGoalIndex = 0

  // Состояния когда бот подключен к серверу
  let isConnected = true

  //! 1. Настраиваем кординаты по которым будет идти бот
  const goals = [
    { x: 0, y: 0, z: 21 }, // Первая цель
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 2 } // Вторая цель
  ]


  bot.once('spawn', () => {

    //! 2. Логинюсь на сервере при спауне  и создаю возможность ходить по кординатам
    bot.chat('/login 1234 1234')
    const defaultMove = new Movements(bot)
    bot.pathfinder.setMovements(defaultMove)
    
    //! 3. Запускаю повторяющеюся функцыю через setTimeOut для хождения по кординатам
    moveToNextGoal()
  }) 

  function dm1() {
    if (!isConnected) return // Если нет соединения, прекратить выполнение
    console.log('ЗАПУЩЕНЫ СТРИБКИ')
    bot.setControlState('jump', true)

  }

  function moveToNextGoal() {

    //! 4. Проверяю - прошел ли бот все заданные пути из моего массива
    if (currentGoalIndex >= goals.length) {
      console.log('Все цели достигнуты')
      //! 9. Когда бот пройдет по всем нужным блокам - он начнет прыгать чтобе его не кикнуло
      dm1()
      return
    }

    //! 5. Получаю текущие кардинаты бота
    const startPosition = bot.entity.position
    //! 6. Задаю количество блоков которые должен пройти бот и тем самым формирую кординаты цели
    const target = startPosition.offset(goals[currentGoalIndex].x, goals[currentGoalIndex].y, goals[currentGoalIndex].z)
    console.log(`Пытаюсь достичь цели ${currentGoalIndex + 1}: ${target}`)

    //! 7. Приказываю боту следовать к кординатам ранее установленой цели
    bot.pathfinder.setGoal(new GoalBlock(target.x, target.y, target.z))

    //! 8. Когда бот достигнет цели - сработает одноразовое события .once('goal_reached' и бот начнет следовать следующей цели из массива goals
    bot.once('goal_reached', () => {
      currentGoalIndex++
      
  
        setTimeout(() => {
          moveToNextGoal()
        }, 100) // Задержка в 0.1 секунды перед движением к следующей цели
      
    })
  }

  bot.on('message', (message) => {

    //! 10. Если в чате будет сообщения с арифметическим примером то мой бот его спомощю регулярок найдет и решит, после напишет ответ в чат
    const containsChatGame = /Chat Game/.test(message)
    if (containsChatGame) {
      console.log(`ПРИМЕР - ${message}`)
      
      const str = message.toString()
      const regex = /(\d+)\s*([+\-*/])\s*(\d+)/
      const match = str.match(regex)
      if (match) {
        const num1 = Number(match[1])
        const operator = match[2]
        const num2 = Number(match[3])
        
        let answer
        if (operator === '+') {
          answer = num1 + num2
        } else if (operator === '-') {
          answer = num1 - num2
        } else if (operator === '*') {
          answer = num1 * num2
        } else if (operator === '/') {
          answer = num1 / num2
        }
        bot.chat(`${answer}`)
        console.log(`Ответ - ${answer}`)
      }
    }
    console.log(message.toAnsi())
  })


  bot.on('end', () => {
    console.log('Соединение потеряно, пытаюсь переподключиться...')
    isConnected = false
    bot.setControlState('jump', false)
    setTimeout(createBot, 10000) // Попытка переподключения через 10 секунд
  })

  bot.on('error', (err) => {
    console.log(`Ошибка: ${err.message}`)
  })

  //! Когда бот перейдет из лобби в другой мир - я сбрасываю текущие действия чтобе он мог дальше нормально выполнять команды
  bot.on('respawn', () => {
    console.log('Бот перешел в другой мир')
    bot.pathfinder.setGoal(null)
    bot.emit('goal_reached', { goal: bot.pathfinder.goal }) // Вручную вызвать событие goal_reached
  })

 

}

// Запуск бота
createBot()

