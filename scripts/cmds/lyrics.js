const axios = require("axios");

module.exports = {
  config: {
    name: "lyrics",
    version: "2.2.0",
    author: "xalman",
    role: 0,
    category: "music"
  },

  onStart: async function ({ api, event, args }) {
    const songName = args.join(" ");
    if (!songName) return api.sendMessage("❌ Please provide a song name. Example: /lyrics hamqadam", event.threadID, event.messageID);

    api.sendMessage(`🔍 Searching for "${songName}"...`, event.threadID, event.messageID);

    try {
      const apiRes = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
      const lyricsApiBase = apiRes.data.lyrics;

      const res = await axios.get(`${lyricsApiBase}/lyrics`, {
        params: { song: songName },
        timeout: 20000 
      });
      
      if (res.data && res.data.status) {
        let { title, artist, album, lyrics } = res.data;

        const msg = `╭───────────────╮\n` +
                    `   🎵  ━━  𝗟𝗬𝗥𝗜𝗖𝗦  ━━  🎵\n` +
                    `╰───────────────╯\n\n` +
                    `🎧 𝗧𝗶𝘁𝗹𝗲  : ${title}\n` +
                    `👤 𝗔𝗿𝘁𝗶𝘀𝘁 : ${artist}\n` +
                    `💿 𝗔𝗹𝗯𝘂𝗺 : ${album || 'N/A'}\n` +
                    `━━━━━━━━━━━━━━━━━\n\n` +
                    `📜 𝗟𝘆𝗿𝗶𝗰𝘀:\n\n${lyrics}\n\n` +
                    `━━━━━━━━━━━━━━━━━\n` +
                    `✨ Author: xalman\n` +
                    `🛡️ Version:2.2.0`;
        
        return api.sendMessage(msg, event.threadID, event.messageID);
      } else {
        return api.sendMessage("❌ Sorry, no lyrics found for this song.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error(error);
      return api.sendMessage(`⚠️ Error: ${error.message}. Please try again later.`, event.threadID, event.messageID);
    }
  }
};
