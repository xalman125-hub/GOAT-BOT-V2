const axios = require("axios");

module.exports = {
  config: {
    name: "gif",
    version: "1.0.1",
    role: 0,
    author: "xalman",
    description: "Sends a random anime GIF",
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

      const res = await axios.get(`${apiBaseUrl}/gif`);
      const gifUrl = res.data.url;
      const attachment = await axios.get(gifUrl, { responseType: "stream" });

      return api.sendMessage({
        body: `Anime GIF (${res.data.category})! 🎬`,
        attachment: attachment.data
      }, event.threadID, (err) => {
        if (!err) {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      }, event.messageID);

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("Failed to fetch GIF.", event.threadID);
    }
  }
};
