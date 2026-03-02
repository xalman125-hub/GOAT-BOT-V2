const axios = require("axios");

module.exports = {
  config: {
    name: "meme",
    version: "1.5.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Get random meme ",
    longDescription: "Get a random meme and total meme Number",
    category: "fun",
    guide: "{pn} [list (optional)]"
  },

  onStart: async function ({ api, message, args }) {
    const { messageID } = message;
    const githubRawUrl = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";

    try {
      const fetchApis = await axios.get(githubRawUrl);
      const memeApiBase = fetchApis.data.meme;
      
      if (args[0] === "list") {
        const listRes = await axios.get(`${memeApiBase}/meme/list`);
        const total = listRes.data.total_memes;
        
        api.setMessageReaction("🐸", messageID, () => {}, true);
        return message.reply(`d⃝j⃝j⃝s⃝j⃝d⃝j⃝d⃝j⃝d⃝j⃝j⃝d⃝j⃝d⃝j⃝j⃝d⃝\n📊 total memes ${total} \nd⃝j⃝j⃝s⃝j⃝d⃝j⃝d⃝j⃝d⃝j⃝j⃝d⃝j⃝d⃝j⃝j⃝d⃝`);
      }
      
      const res = await axios.get(`${memeApiBase}/meme`);
      const memeUrl = res.data.meme;

      const imageStream = await axios.get(memeUrl, {
        responseType: "stream",
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Referer': 'https://imgur.com/'
        }
      });

      api.setMessageReaction("🐸", messageID, () => {}, true);

      return message.reply({
        body: "🐸Here is your random meme🌬️!",
        attachment: imageStream.data
      });

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("❌ api error");
    }
  }
};
