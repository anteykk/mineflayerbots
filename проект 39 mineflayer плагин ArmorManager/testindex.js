const armorManager = require("mineflayer-armor-manager");
const mineflayer = require("mineflayer");

const bot = mineflayer.createBot({
  username: "Player",
  host: "localhost",
  port: 3333,
  version: false
});

bot.loadPlugin(armorManager);

bot.once("spawn", () => bot.armorManager.equipAll(), console.log(`ЗАСПАВНИЛСЯ`));