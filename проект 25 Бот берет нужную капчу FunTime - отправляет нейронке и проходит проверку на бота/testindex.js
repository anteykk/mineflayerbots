const mineflayer = require('mineflayer');
const FlayerCaptcha = require('FlayerCaptcha');
const fs = require('fs-extra')
const { keyAPI } = require('./setting')



let bot;
let captcha;
let switchSucces = true;
let log = false;

function joni3(){
  try {
    console.log(`Создаю подключения к боту`)
   
    bot = mineflayer.createBot({
      host: 'play.funtime.su',
      username: 'gggbenmen3350101',
      version: '1.20'
    })
    captcha = new FlayerCaptcha(bot);
    captcha.on('success', async (image, viewDirection) => {
      // Генерация случайного названия для файла
      const randomFilename = `captcha.png`;
      await image.toFile(randomFilename);
      console.log(`Captcha saved as ${randomFilename}`);
    });  


    bot.on('message', async (message) => {
      
      console.log(message.toAnsi())
      if(message == `BotFilter >> Проверка пройдена, приятной игры`){
        log = true;
        console.log(`log = ${log}`)
      }

      if(!switchSucces) return
      try {
        console.log(`Кординаты X = ${bot.entity.position.x}`)
        if(bot.entity.position.x == 5 || Math.floor(bot.entity.position.x) == 8 || bot.entity.position.x == `7.61518253506068` || bot.entity.position.x == `5.749508098103957` || bot.entity.position.x == `8.7`){
          console.log(`ПРАВЕЛЬНАЯ КАПЧЯ`)
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
      } else {
          console.log(`НЕ ПРАВЕЛЬНАЯ КАПЧЯ`)
          bot.removeAllListeners('success');
          bot.removeAllListeners('chat');
          bot.end()
          setTimeout(() => {
            joni3()
          }, 5000);
      }
    
      
      } catch (error) {
        console.log(error)
      }
    
    });    
  
  } catch (error) {
    console.log(error)
  }

}


joni3()




bot.on('spawn', () => {
  
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






