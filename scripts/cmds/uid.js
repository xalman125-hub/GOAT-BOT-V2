const { createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "uid",
    version: "5.0",
    author: "xalman",
    countDown: 3,
    role: 0,
    description: "Get User ID with simple clean design",
    category: "info",
    guide: "{pn} [tag/reply/link]"
  },

  onStart: async function ({ event, usersData, api, args }) {
    const { threadID, senderID, messageID, mentions, messageReply, type } = event;
    let targetID;

    try {
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

      let userData;
      try {
        userData = await usersData.get(targetID);
      } catch (err) {
        userData = { name: "Facebook User", gender: 0 };
      }

      const name = userData.name || "Facebook User";
      const gender = userData.gender == 2 ? "MALE" : userData.gender == 1 ? "FEMALE" : "UNKNOWN";

      const width = 600, height = 400;
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

      // Underline
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 70);
      ctx.lineTo(width - 100, 70);
      ctx.stroke();

      // Labels and values
      ctx.font = 'bold 20px "Arial"';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';

      ctx.fillText('FULL NAME', 80, 140);
      ctx.font = '20px "Arial"';
      ctx.fillStyle = '#000000';
      ctx.fillText(name.length > 25 ? name.substring(0,22)+'...' : name, 80, 175);

      ctx.font = 'bold 20px "Arial"';
      ctx.fillStyle = '#333333';
      ctx.fillText('FACEBOOK ID (UID)', 80, 230);
      ctx.font = '20px "Arial"';
      ctx.fillStyle = '#000000';
      ctx.fillText(targetID, 80, 265);

      ctx.font = 'bold 20px "Arial"';
      ctx.fillStyle = '#333333';
      ctx.fillText('GENDER STATUS', 80, 320);
      ctx.font = '20px "Arial"';
      ctx.fillStyle = '#000000';
      ctx.fillText(gender, 80, 355);

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
