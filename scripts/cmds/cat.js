const axios = require("axios");

module.exports = {
  config: {
    name: "cat",
    version: "3.0",
    role: 0,
    author: "xalman",
    description: "Sends 4 random cat images",
    category: "image",
    guide: "{pn}",
    countDown: 3
  },

  onStart: async function ({ api, event }) {
    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const githubRawUrl = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";
      const githubRes = await axios.get(githubRawUrl);
      const apiBaseUrl = githubRes.data.meme; 

      const attachments = [];

      for (let i = 0; i < 4; i++) {
        const catRes = await axios.get(`${apiBaseUrl}/cat`);
        const imageUrl = catRes.data.url;
        const imgStream = await axios.get(imageUrl, { responseType: "stream" });
        attachments.push(imgStream.data);
      }

      return api.sendMessage({
        body: "Here are 4 cute cats for you! 🐾",
        attachment: attachments
      }, event.threadID, (err) => {
        if (!err) {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      }, event.messageID);

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("Failed to fetch images.", event.threadID);
    }
  }
};
