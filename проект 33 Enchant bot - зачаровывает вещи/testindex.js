const mineflayer = require('mineflayer');



const bot = mineflayer.createBot({
  host: 'localhost',
  port: 3333,
  username: 'Enchanter',
  version: '1.20'
});





bot.once('spawn', () => {
  bot.chat('Бот запущен. Ищу стол зачарования...');
  startEnchanting();
});

async function startEnchanting() {


  await bot.waitForChunksToLoad()
  let blocks = {"enchant_table": bot.blockAt(bot.findBlocks({"matching": bot.registry.blocksByName["enchanting_table"].id})[0])}
  
  
 
let window = await bot.openEnchantmentTable(blocks["enchant_table"])
  enchant_list_sword = [13, 18, 17]
  while(true){

   
    let items = {
                "item": window.findInventoryItem("iron_pickaxe"),
                "lapis": window.findInventoryItem("lapis_lazuli"),
            }

 
        if (items["item"] && items["lapis"] != null && bot.experience["level"] > 30){
                await bot.waitForTicks(60);
                window.putLapis(items["lapis"])
                await bot.waitForTicks(60);
                window.putTargetItem(items["item"])
                await bot.waitForTicks(60);
                console.log(window.enchantments)
                await bot.waitForTicks(60);
                window.enchant(0)   
                console.log(`succes enchant`)
        } 
  }

  

}
