const axios = require('axios');
const fs = require('fs');
const path = require('path');

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "video",
    aliases: ["videosong", "searchsong"],
    version: "2.0.0",
    author: "Nazrul + Edited by ChatGPT",
    countDowns: 20,
    role: 0,
    description: "Search or Download YouTube Videos",
    category: "Media",
    guide: {
      en: "use {pn} song songName or YouTube link"
    }
  },

  onStart: async function ({ api, event, args }) {
    const songQuery = args.join(" ").trim();
    const isUrl = songQuery.startsWith('https://') || songQuery.startsWith('http://');

    if (isUrl) {
      await this.downloadVideo(api, event, songQuery);
    } else if (songQuery.length > 0) {
      await this.searchSong(api, event, songQuery);
    } else {
      api.sendMessage("🎵 Please provide a Song Name or YouTube URL!", event.threadID, event.messageID);
    }
  },

  downloadVideo: async function (api, event, videoUrl, videoTitle = "Unknown", videoDuration = "Unknown") {
    try {
      const res = await axios.get(`${await baseApiUrl()}/nazrul/ytMp4?url=${encodeURIComponent(videoUrl)}`);
      const videoData = res.data;

      if (!videoData.d_url) {
        throw new Error('Download link not found!');
      }

      const videoPath = path.resolve(__dirname, 'video.mp4');
      const writer = fs.createWriteStream(videoPath);
      const videoStream = (await axios.get(videoData.d_url, { responseType: 'stream' })).data;

      videoStream.pipe(writer);

      writer.on('finish', async () => {
        await api.sendMessage({
          body: `🎬 Here's your Video Song!\n\n♡ Title: ${videoData.title}\n♡ Duration: ${videoDuration}`,
          attachment: fs.createReadStream(videoPath)
        }, event.threadID, () => fs.unlinkSync(videoPath), event.messageID);
      });

      writer.on('error', (error) => {
        console.error('Error downloading the video:', error);
        api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
      });
    } catch (error) {
      console.error('An error occurred:', error.message);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  },

  searchSong: async function (api, event, query) {
    if (!query) {
      return api.sendMessage("🎵 Please provide a Song Name!", event.threadID, event.messageID);
    }

    try {
      const res = await axios.get(`${await baseApiUrl()}/nazrul/ytSearch?query=${encodeURIComponent(query)}`);
      const searchData = res.data;

      if (!searchData || searchData.length === 0) {
        throw new Error('No results found for your query!');
      }

      const maxResults = Math.min(searchData.length, 10);
      let replyMessage = "✅ Here are the top 10 search results:\n\n";
      const attachments = [];
      const attachmentPaths = [];

      for (let i = 0; i < maxResults; i++) {
        const song = searchData[i];
        replyMessage += `♡ Song No. #${i + 1}:\n`;
        replyMessage += `👑 Title: ${song.title}\n`;
        replyMessage += `🔖 Duration: ${song.timestamp}\n`;

        const thumbnailPath = path.resolve(__dirname, `thumbnail_${i + 1}.jpg`);
        const writer = fs.createWriteStream(thumbnailPath);
        const thumbnailStream = (await axios.get(song.thumbnail, { responseType: 'stream' })).data;

        thumbnailStream.pipe(writer);
        await new Promise((resolve) => writer.on('finish', resolve));

        attachments.push(fs.createReadStream(thumbnailPath));
        attachmentPaths.push(thumbnailPath);
      }

      api.sendMessage(
        {
          body: replyMessage,
          attachment: attachments
        },
        event.threadID,
        (error, info) => {
          if (!error) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              searchData: searchData,
              attachmentPaths
            });
          }
        },
        event.messageID
      );

    } catch (error) {
      console.error('An error occurred:', error.message);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    try {
      const { searchData, attachmentPaths } = Reply;
      const choice = parseInt(event.body.trim()) - 1;

      if (isNaN(choice) || choice < 0 || choice >= searchData.length) {
        return api.sendMessage("🎵 Invalid choice. Please reply with a valid number.", event.threadID, event.messageID);
      }

      const selectedSong = searchData[choice];
      const videoUrl = selectedSong.url;

      api.unsendMessage(Reply.messageID);

      if (attachmentPaths) {
        attachmentPaths.forEach((thumbnailPath) => {
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
        });
      }

      await this.downloadVideo(api, event, videoUrl, selectedSong.title, selectedSong.timestamp);
    } catch (error) {
      console.error('An error occurred:', error.message);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
