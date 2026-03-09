const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "uid",
    version: "6.1",
    author: "xalman",
    countDown: 3,
    role: 0,
    description: "Get User ID with profile picture",
    category: "info",
    guide: "{pn} [tag/reply/link]"
  },

  onStart: async function ({ event, usersData, api, args }) {
    const { threadID, senderID, messageID, mentions, messageReply, type } = event;
    let targetID;

    try {
      // Determine target ID (same as before)
      if (type == "message_reply") {
        targetID = messageReply.senderID;
      } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else if (args.length > 0) {
        const input = args[0];
        if (input.includes("facebook.com") || input.includes("fb.com")) {
          try {
            const res = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`, { timeout: 5000 });
            targetID = res.data.id || (await axios.get(`https://api.vyturex.com/fblink?url=${encodeURIComponent(input)}`, { timeout: 5000 })).data.id;
          } catch (e) {
            if (global.utils && global.utils.findUid) targetID = await global.utils.findUid(input);
          }
        } else {
          targetID = input;
        }
      } else {
        targetID = senderID;
      }

      if (!targetID) return api.sendMessage("❌ UID not found!", threadID, messageID);

      // Get user info
      let userData;
      try {
        userData = await usersData.get(targetID);
      } catch (err) {
        userData = { name: "Facebook User", gender: 0 };
      }

      const name = userData.name || "Facebook User";
      const gender = userData.gender == 2 ? "MALE" : userData.gender == 1 ? "FEMALE" : "UNKNOWN";

      // Canvas setup
      const width = 700, height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Header
      ctx.font = 'bold 30px "Arial"';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('USER IDENTIFICATION', width / 2, 50);

      // Line under header
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 70);
      ctx.lineTo(width - 100, 70);
      ctx.stroke();

      // Profile picture (square with four corners)
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      try {
        // ইউজার এজেন্ট সহ axios দিয়ে ছবি আনা
        const avatarResponse = await axios.get(avatarUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
          },
          timeout: 5000
        });
        const avatarImg = await loadImage(Buffer.from(avatarResponse.data));
        
        // Draw square image (no rounding)
        ctx.drawImage(avatarImg, 50, 100, 180, 180);
        // Optional border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 100, 180, 180);
      } catch (e) {
        // Fallback gray square
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(50, 100, 180, 180);
        ctx.strokeStyle = '#aaaaaa';
        ctx.strokeRect(50, 100, 180, 180);
      }

      // Text labels (right side)
      ctx.font = 'bold 20px "Arial"';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';

      ctx.fillText('FULL NAME', 270, 150);
      ctx.font = '20px "Arial"';
      ctx.fillStyle = '#000000';
      ctx.fillText(name.length > 25 ? name.substring(0,22)+'...' : name, 270, 185);

      ctx.font = 'bold 20px "Arial"';
      ctx.fillStyle = '#333333';
      ctx.fillText('FACEBOOK ID (UID)', 270, 250);
      ctx.font = '20px "Arial"';
      ctx.fillStyle = '#000000';
      ctx.fillText(targetID, 270, 285);

      ctx.font = 'bold 20px "Arial"';
      ctx.fillStyle = '#333333';
      ctx.fillText('GENDER STATUS', 270, 350);
      ctx.font = '20px "Arial"';
      ctx.fillStyle = '#000000';
      ctx.fillText(gender, 270, 385);

      // Save and send
      const cachePath = path.join(__dirname, 'cache', `uid_${targetID}.png`);
      await fs.ensureDir(path.join(__dirname, 'cache'));
      await fs.writeFile(cachePath, canvas.toBuffer());

      api.sendMessage({
        body: `✅ UID: ${targetID}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
    }
  }
};
