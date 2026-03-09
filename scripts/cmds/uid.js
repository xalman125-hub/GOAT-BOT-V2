const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "uid",
    version: "4.1",
    author: "xalman",
    countDown: 3,
    role: 0,
    description: "Get User ID with upgraded UI",
    category: "info",
    guide: "{pn} [tag/reply/link]"
  },

  onStart: async function ({ event, usersData, api, args }) {
    const { threadID, senderID, messageID, mentions, messageReply, type } = event;
    let targetID;

    try {
      // Determine target ID from input
      if (type == "message_reply") {
        targetID = messageReply.senderID;
      } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else if (args.length > 0) {
        const input = args[0];
        if (input.includes("facebook.com") || input.includes("fb.com")) {
          try {
            const res = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`);
            targetID = res.data.id || (await axios.get(`https://api.vyturex.com/fblink?url=${encodeURIComponent(input)}`)).data.id;
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

      // Canvas settings
      const width = 1200, height = 500;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a031e');
      bgGrad.addColorStop(1, '#1a052b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Random stars
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(0, 255, 255, 0.3)" : "rgba(255, 0, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Header box
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2ff';
      ctx.fillStyle = "rgba(0, 242, 255, 0.1)";
      ctx.fillRect(width / 4, 20, width / 2, 70);
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 4, 20, width / 2, 70);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 45px "Courier New"';
      ctx.fillStyle = '#00f2ff';
      ctx.textAlign = 'center';
      ctx.fillText('USER IDENTIFICATION', width / 2, 70);

      // Info boxes
      const info = [
        { l: "FULL NAME", v: name.toUpperCase() },
        { l: "FACEBOOK ID (UID)", v: String(targetID) },
        { l: "GENDER STATUS", v: gender }
      ];

      ctx.textAlign = 'left';
      info.forEach((item, i) => {
        const x = 450, y = 140 + i * 110;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0055';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 700, 85);
        ctx.shadowBlur = 0;
        ctx.font = '12px Monaco';
        ctx.fillStyle = '#ff0055';
        ctx.fillText(item.l, x + 15, y + 25);
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.v, x + 15, y + 65);
      });

      // Avatar
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      try {
        const avatarImg = await loadImage(avatarUrl);
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f2ff';
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(225, 295, 160, 0, Math.PI * 2); // Circular frame
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(avatarImg, 65, 135, 320, 320);
        ctx.restore();
      } catch (e) {
        // Fallback if avatar fails
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(225, 295, 160, 0, Math.PI * 2);
        ctx.fill();
      }

      // Save and send
      const cachePath = path.join(__dirname, 'cache', `uid_${targetID}.png`);
      await fs.ensureDir(path.join(__dirname, 'cache'));
      await fs.writeFile(cachePath, canvas.toBuffer());

      api.sendMessage({
        body: `${targetID}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
    }
  }
};
