const axios = require('axios');

module.exports = {
  config: {
    name: "ss",
    version: "2.1.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    description: "Capture website screenshot using GitHub API Config",
    category: "tools",
    guide: "{pn} <website_name>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const site = args[0];
    const jsonURL = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";

    if (!site) {
      return api.sendMessage("❌ Please provide a website name!", threadID, messageID);
    }

    try {
      const resJSON = await axios.get(jsonURL);
      const apiBaseURL = resJSON.data.ss; 

      if (!apiBaseURL) {
        throw new Error("API URL not found in JSON (Key: 'ss')");
      }

      const finalApiUrl = `${apiBaseURL}/screenshot?url=${encodeURIComponent(site)}`;
      const stream = await global.utils.getStreamFromURL(finalApiUrl);
      
      return api.sendMessage({
        body: `✅ Screenshot for: ${site}`,
        attachment: stream
      }, threadID, messageID);

    } catch (e) {
      return api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
    }
  }
};
