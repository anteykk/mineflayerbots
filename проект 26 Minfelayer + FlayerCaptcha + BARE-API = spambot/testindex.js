const mineflayer = require('mineflayer');
const FlayerCaptcha = require('FlayerCaptcha');
const fs = require('fs-extra')
const { keyAPI } = require('./setting')
const inventoryViewer = require('mineflayer-web-inventory');


let bot;
let captcha;
let switchSucces = true;
let log = false;

//  т.к. игрок смотрит на правильную капчу, а она на него, то:
//  Пример: Когда игрок смотрит в сторону north, капча будет же направлена на south
const directions = new Map([
  ['3 2', 'up'],      //  up > down
  ['3 -2', 'down'],   //  down > up
  ['3 0', 'south'],   //  south > north
  ['2 0', 'west'],    //  west > east
  ['0 0', 'north'],   //  north > south
  ['5 0', 'east'],    //  east > west
]);

const directions2 = { 'up': 'down', 'down': 'up', 'south': 'north', 'west': 'east', 'north': 'south', 'east': 'west' };

function getViewDirection(yaw, pitch) {
  const key = `${Math.round(yaw)} ${Math.round(pitch)}`;
  return directions2[directions.get(key)];
}


function joni3(){
  try {
    console.log(`Создаю подключения к боту`)
   
    bot = mineflayer.createBot({
      host: 'play.funtime.su',
      username: 'jjjjmmmk3',
      version: '1.20'
    })

    inventoryViewer(bot, { port: 3007 });
    captcha = new FlayerCaptcha(bot);
    captcha.on('success', async (image, viewDirection) => {

        console.log(`ПОЛУЧИЛ КАРТИНКУ`)
        // Пропускам не правильные капчи
        if (getViewDirection(bot.entity.yaw, bot.entity.pitch) != viewDirection) return
        console.log(`КАРТИНКА ПРОШЛА ФИЛЬТР`)
        //  Сохраняем правильную капчу
        await image.toFile('captcha.png');
        console.log('Captcha saved');
    });  


    bot.on('message', async (message) => {
      
      console.log(message.toAnsi())
      if(message == `BotFilter >> Проверка пройдена, приятной игры`){
        log = true;
        console.log(`log = ${log}`)


      }

      if(message == `[✾] Зарегистрируйтесь ↝ /reg <Пароль>`){
        bot.chat(`/reg 1234 1234`)
      }

      if(message == `[✾] Успешная регистрация! Приятной игры!`){
        console.log(`ЗАШЕЛ В ОСНОВНОЕ ЛОББИ`)
        await bot.waitForTicks(220); // 1 секунда = 20 тиков (1 сек * 20 тиков/сек)
        const item = bot.inventory.slots[40];
        // Помещаем предмет в "руку" бота
        await bot.equip(item, 'hand');
        // Нажимаем правой кнопкой мыши для использования предмета
        bot.activateItem();
        console.log(`Нажал на компас`)
        await bot.waitForTicks(20); // 1 секунда = 20 тиков (1 сек * 20 тиков/сек)
        await bot.clickWindow(12, 0, 0);
        await bot.waitForTicks(20); // 1 секунда = 20 тиков (1 сек * 20 тиков/сек)
        await bot.clickWindow(20, 0, 0);
        await bot.waitForTicks(20); // 1 секунда = 20 тиков (1 сек * 20 тиков/сек)
        await bot.clickWindow(29, 0, 0);
        await bot.waitForTicks(20);
        bot.chat(`!Всем ку`)
      }

      if(!switchSucces) return
      try {
     
          switchSucces = false;
          let solvedCaptcha = await sendAPI(`./captcha.png`);
          console.log(solvedCaptcha)
          bot.chat(`${solvedCaptcha}`)

          setTimeout(() => {
            if(log == true) return
            console.log(`НЕ ПРАВЕЛЬНО РАЗГАДАНАЯ КАПЧЯ`)
            bot.removeAllListeners('success');
            bot.removeAllListeners('chat');
            bot.end()
            switchSucces = true;
            joni3()
          }, 4000);

    
      
      } catch (error) {
        console.log(error)
      }
    
    });    
  
  } catch (error) {
    console.log(error)
  }

}


joni3()




bot.on('spawn', (mes) => {

  console.log(`БОТ ЗАСПАВНИЛСЯ`)
})
    
    
    
    
    
    
    
async function sendAPI(filePath) {
  const site = "http://5.42.211.111";
  
  try {
      const base64Image = await fs.readFile(filePath).then(buffer => buffer.toString('base64'));

      const postData = new URLSearchParams({
          key: keyAPI,
          method: "base64",
          body: base64Image
      });

      const postResponse = await fetch(`${site}/in.php`, {
          method: "POST",
          body: postData
      });
      const postText = await postResponse.text();
      const captcha_id = postText.split("|")[1].split("\n")[0];

      await new Promise(resolve => setTimeout(resolve, 800));

      const getData = new URLSearchParams({
          key: keyAPI,
          action: "get",
          id: captcha_id
      });

      const getResponse = await fetch(`${site}/res.php?${getData}`);
      const getText = await getResponse.text();
      
      let answer = getText.split("|")[1].split("\n")[0] || getText.split("|")[1];
      
      return answer;
      
  } catch (error) {
      console.error('API Error:', error);
      throw error;
  }
}






