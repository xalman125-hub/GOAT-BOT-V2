const { createCanvas, loadImage } = require('canvas');
const moment = require("moment-timezone");
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "gcinfo",
    aliases: ["groupinfo", "gcscan", "gcstats"],
    version: "11.5",
    author: "Xalman",
    role: 0,
    shortDescription: "Colorized graphical group analysis",
    longDescription: "Creates a colorful stylish image with group details and analytics.",
    category: "utility",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async ({ api, event, message }) => {
    const { threadID, messageID } = event;

    try {
      const loading = await api.sendMessage("⏳ Please wait...", threadID);
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const info = await api.getThreadInfo(threadID);
      const { threadName, participantIDs, userInfo, adminIDs, messageCount, approvalMode, isGroup, createTime, imageSrc } = info;

      if (!isGroup) return message.reply("⚠️ This command only works in groups.");

      let dateCreated = "N/A (Hidden by FB)";
      if (createTime && createTime > 1262304000000) {
        dateCreated = moment(Number(createTime)).tz("Asia/Dhaka").format("DD MMMM, YYYY");
      }

      let male = 0, female = 0, unknown = 0;
      for (const user of userInfo) {
        if (user.gender === "MALE" || user.gender === 2) male++;
        else if (user.gender === "FEMALE" || user.gender === 1) female++;
        else unknown++;
      }

      const total = participantIDs.length;
      const mPct = total > 0 ? (male / total * 100).toFixed(1) : 0;
      const fPct = total > 0 ? (female / total * 100).toFixed(1) : 0;

      const canvas = createCanvas(800, 1000);
      const ctx = canvas.getContext('2d');

      const bgUrl = "https://i.ibb.co/3YsJ3zHw/ca04b16ed6a4.jpg";
      const background = await loadImage(bgUrl);
      ctx.drawImage(background, 0, 0, 800, 1000);

      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
      ctx.roundRect(40, 40, 720, 920, 30).fill();

      if (imageSrc) {
        try {
          const avatarImg = await loadImage(imageSrc);
          ctx.save();
          ctx.beginPath();
          ctx.arc(400, 180, 85, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatarImg, 315, 95, 170, 170);
          ctx.restore();
          
          ctx.strokeStyle = "#00FF7F";
          ctx.lineWidth = 6;
          ctx.stroke();
        } catch (e) { console.log(e); }
      }

      ctx.textAlign = "center";
      const gradient = ctx.createLinearGradient(0, 0, 800, 0);
      gradient.addColorStop(0, "#00dbde");
      gradient.addColorStop(1, "#fc00ff");
      ctx.fillStyle = gradient;
      ctx.font = "bold 48px Arial";
      ctx.fillText("GROUP MASTER INFO", 400, 330);

      ctx.textAlign = "left";
      let y = 410;
      const drawInfo = (label, value, color) => {
        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(label + ":", 80, y);
        ctx.font = "26px Arial";
        ctx.fillStyle = color || "#00FFFF";
        ctx.fillText(value, 340, y);
        y += 52;
      };

      drawInfo("Group Name", (threadName || "Unnamed").substring(0, 20), "#FFFFFF");
      drawInfo("Group ID", threadID, "#00FF00");
      drawInfo("Created on", dateCreated, "#FF8C00");
      drawInfo("Total Members", total, "#FFFFFF");
      drawInfo("Admins", adminIDs.length, "#FF0000");
      drawInfo("Messages", messageCount || "N/A", "#ADFF2F");
      drawInfo("Approval", approvalMode ? "Enabled" : "Disabled", "#00BFFF");

      y += 35;
      ctx.fillStyle = "#FF1493";
      ctx.font = "bold 35px Arial";
      ctx.fillText("📊 GENDER ANALYTICS", 80, y);
      
      y += 65;
      ctx.font = "bold 25px Arial";
      ctx.fillStyle = "#00BFFF";
      ctx.fillText(`BOYS: ${male} (${mPct}%)`, 80, y);
      ctx.fillStyle = "#222"; 
      ctx.fillRect(80, y + 15, 640, 22);
      ctx.fillStyle = "#00BFFF"; 
      ctx.fillRect(80, y + 15, (mPct / 100) * 640, 22);

      y += 95;
      ctx.fillStyle = "#FF69B4";
      ctx.fillText(`GIRLS: ${female} (${fPct}%)`, 80, y);
      ctx.fillStyle = "#222";
      ctx.fillRect(80, y + 15, 640, 22);
      ctx.fillStyle = "#FF69B4";
      ctx.fillRect(80, y + 15, (fPct / 100) * 640, 22);

      ctx.textAlign = "center";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#FFFFFF";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px Arial";
      ctx.fillText("POWERED BY XALMAN 🙂", 400, 930);
      ctx.shadowBlur = 0;

      const cachePath = path.join(__dirname, "cache", `${threadID}_color.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(cachePath, buffer);

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
      console.error(e);
      return message.reply("❌ Error occurred.");
    }
  }
};
