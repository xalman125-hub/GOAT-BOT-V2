const axios = require("axios");

module.exports = {
  config: {
    name: "waifu",
    version: "1.0.1",
    role: 0,
    author: "xalman",
    description: "Sends a random waifu image",
    category: "anime",
    guide: "{pn}",
    countDown: 5
  },

  onStart: async function ({ api, event }) {
    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const githubRawUrl = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";
      const githubRes = await axios.get(githubRawUrl);
      const apiBaseUrl = githubRes.data.meme; 

      const res = await axios.get(`${apiBaseUrl}/waifu`);
      const imageUrl = res.data.url;
      const attachment = await axios.get(imageUrl, { responseType: "stream" });

      return api.sendMessage({
        body: "Here is your waifu! ✨",
        attachment: attachment.data
      }, event.threadID, (err) => {
        if (!err) {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      }, event.messageID);

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("Failed to fetch waifu image.", event.threadID);
    }
  }
};
