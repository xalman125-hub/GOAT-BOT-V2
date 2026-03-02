const axios = require("axios");
const apiJsonUrl = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json"; 

module.exports.config = {
  name: "font",
  aliases: ["fnt", "ft"],
  version: "3.2",
  role: 0,
  countDowns: 5,
  author: "xalman",
  category: "general",
  guide: { en: "[number] [text] or list" }
};

module.exports.onStart = async function ({ message, args, api, event }) {
  const { threadID, messageID } = event;

  const sendReaction = (emoji) => {
    api.setMessageReaction(emoji, messageID, () => {}, true);
  };

  if (!args.length) return message.reply("Usage: font <number> <text> or font list");

  sendReaction("⏳");

  try {
    const apiListResponse = await axios.get(apiJsonUrl);
    const apiList = apiListResponse.data; 
    const fontApi = apiList.font;

    if (args[0].toLowerCase() === "list") {
      const exampleText = "xalman";
      const fontListRaw = await axios.get(`${fontApi}/api/font/list`);
      const fontNumbers = fontListRaw.data.replace("Available Font Styles:", "").trim().split(", ").map(n => parseInt(n));

      let replyText = "Available Font Styles:\n\n";

      for (const number of fontNumbers) {
        try {
          const response = await axios.post(`${fontApi}/api/font`, { number, text: exampleText });
          const converted = response.data.converted || exampleText;
          replyText += `${number}: ${converted}\n`;
        } catch {
          replyText += `${number}: Error\n`;
        }
      }

      sendReaction("✅"); 
      return message.reply(replyText);
    }

    const [numberStr, ...textParts] = args;
    const number = parseInt(numberStr, 10);
    let text = textParts.join(" ");
    
    if (!text || isNaN(number)) {
      sendReaction("❌");
      return message.reply("Invalid usage. Format: font <number> <text>");
    }

    try {
      const response = await axios.post(`${fontApi}/api/font`, { number, text });
      const converted = response.data.converted || text;
      
      sendReaction("✅");
      return message.reply(converted);
    } catch {
      sendReaction("❌");
      return message.reply("Error processing your request.");
    }

  } catch (err) {
    console.log(err); 
    sendReaction("⚠️");
    return message.reply("Error fetching API list ");
  }
};
