const axios = require('axios');

module.exports = {
  config: {
    name: "prompt",
    aliases: ["p"],
    version: "3.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Get prompt from image",
    longDescription: "Reply to an image to get a detailed prompt using dynamic API link from GitHub config.",
    category: "ai",
    guide: "{pn} reply to an image"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, messageReply, type } = event;

    if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("Please reply to an image to get a prompt!", threadID, messageID);
    }

    const imageUrl = messageReply.attachments[0].url;
    
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      const configRes = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
      const apiBaseUrl = configRes.data.prompt;

      if (!apiBaseUrl) throw new Error("API Link not found in GitHub config!");

      const response = await axios.post(`${apiBaseUrl}/api/prompt`, {
        imageUrl: imageUrl
      });

      if (response.data && response.data.prompt) {
        const result = response.data.prompt;
        
        api.setMessageReaction("✅", messageID, () => {}, true);

        return api.sendMessage(`✨ Generated Prompt ✨\n\n${result}`, threadID, messageID);
      } else {
        throw new Error("Invalid response from Prompt API");
      }

    } catch (error) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
