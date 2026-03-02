// rp_animated_rankup.js
const deltaNext = global.GoatBot.configCommands.envCommands.rank.deltaNext;
const expToLevel = exp => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);

const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");
const GIFEncoder = require("gifencoder");
const axios = require("axios");

module.exports = {
  config: {
    name: "rankup",
    version: "4.0",
    author: "Xalman | GPT-5",
    countDown: 3,
    role: 0,
    description: { en: "Animated neon GIF rankup card" },
    category: "rank",
    guide: { en: "{pn} [on | off]" },
    envConfig: { deltaNext: 5 }
  },

  langs: {
    en: {
      syntaxError: "Syntax error, only use {pn} on or {pn} off",
      turnedOn: "✅ Rankup notification turned ON (Auto Rank Card enabled)",
      turnedOff: "❌ Rankup notification turned OFF"
    }
  },

  onStart: async function ({ message, event, threadsData, args, getLang }) {
    if (!["on", "off"].includes(args[0]))
      return message.reply(getLang("syntaxError"));

    await threadsData.set(event.threadID, args[0] == "on", "settings.sendRankupMessage");
    return message.reply(args[0] == "on" ? getLang("turnedOn") : getLang("turnedOff"));
  },

  onChat: async function ({ threadsData, usersData, event, message }) {
    const threadData = await threadsData.get(event.threadID);
    const sendRankupMessage = threadData.settings.sendRankupMessage;
    if (!sendRankupMessage) return;

    const userData = await usersData.get(event.senderID);
    const { exp } = userData;
    const currentLevel = expToLevel(exp);
    const prevLevel = expToLevel(Math.max(0, exp - 1));

    if (currentLevel <= prevLevel) return;

    // ---------- Setup ----------
    const width = 1280;
    const height = 376;
    const frames = 18;            // number of frames in GIF
    const delay = 60;            // ms per frame
    const bgList = [
      "https://i.postimg.cc/SQBksHNY/tbtnx210.jpg",
      "https://i.postimg.cc/hGnhtBdb/20251118-065432.png",
      "https://i.postimg.cc/W33Ndbb8/20251118-065418.png",
      "https://i.postimg.cc/WbrkNSyJ/20251118-065121.png"
    ];
    const bgUrl = bgList[Math.floor(Math.random() * bgList.length)];

    // ---------- Load remote images safely ----------
    let avatarImage, bgImage;
    // UPDATED: Use usersData.getAvatarUrl for more reliable avatar loading
    const avatarURL = await usersData.getAvatarUrl(event.senderID); 

    try {
      const avatarRes = await axios.get(avatarURL, { responseType: "arraybuffer", timeout: 8000 });
      const avatarBuf = Buffer.from(avatarRes.data, "binary");
      avatarImage = await Canvas.loadImage(avatarBuf);
    } catch (e) {
      console.log("Avatar load failed, using fallback.", e && e.message);
      avatarImage = await Canvas.loadImage("https://i.ibb.co/ZTq5wq6/default-avatar.png");
    }

    try {
      const bgRes = await axios.get(bgUrl, { responseType: "arraybuffer", timeout: 8000 });
      const bgBuf = Buffer.from(bgRes.data, "binary");
      bgImage = await Canvas.loadImage(bgBuf);
    } catch (e) {
      console.log("Background load failed, using solid color.", e && e.message);
      // create small solid color canvas as fallback
      const tmp = Canvas.createCanvas(width, height);
      const tctx = tmp.getContext("2d");
      tctx.fillStyle = "#0f172a";
      tctx.fillRect(0, 0, width, height);
      bgImage = tmp;
    }

    // ---------- Prepare GIF encoder ----------
    const encoder = new GIFEncoder(width, height);
    const tmpFilename = `rankup_${event.senderID}_${Date.now()}.gif`;
    const tmpPath = path.join(__dirname, tmpFilename);

    // Create write stream from encoder
    const writeStream = fs.createWriteStream(tmpPath);
    encoder.createReadStream().pipe(writeStream);

    encoder.start();
    encoder.setRepeat(0); // 0 = loop forever
    encoder.setDelay(delay);
    encoder.setQuality(10);

    // shared canvas for drawing frames
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // optional: register a nicer font if available (uncomment and provide font file)
    // Canvas.registerFont(path.join(__dirname, "assets", "font", "BeVietnamPro-SemiBold.ttf"), { family: "BeVietnam" });

    // ---------- Animation frames ----------
    for (let i = 0; i < frames; i++) {
      // clear
      ctx.clearRect(0, 0, width, height);

      // draw background (cover)
      ctx.drawImage(bgImage, 0, 0, width, height);

      // subtle dark overlay for contrast
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, width, height);

      // Animated neon border parameters
      const t = i / frames; // 0..1
      const glowAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI * 2)); // pulsating alpha
      const glowWidth = 6 + 8 * Math.abs(Math.sin(t * Math.PI * 2)); // pulsating thickness
      const hueShift = Math.floor(180 + 80 * Math.sin(t * Math.PI * 2)); // hue change

      // neon rectangle (rounded)
      const rx = 10, ry = 10, rw = width - 20, rh = height - 20;
      // shadow (glow)
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, rx, ry, rw, rh, 26);
      ctx.closePath();
      ctx.shadowBlur = 30 + glowWidth;
      ctx.shadowColor = `hsla(${hueShift}, 100%, 60%, ${glowAlpha})`;
      ctx.lineWidth = glowWidth;
      ctx.strokeStyle = `hsla(${hueShift}, 100%, 60%, ${0.7 * glowAlpha})`;
      ctx.stroke();
      ctx.restore();

      // inner subtle border
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, rx + 6, ry + 6, rw - 12, rh - 12, 20);
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.stroke();
      ctx.restore();

      // draw avatar with white ring and neon outer ring
      const avatarX = 40, avatarY = 120, avatarSize = 160;
      // neon halo behind avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 12, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,0.02)`;
      ctx.fill();
      ctx.shadowBlur = 30 + glowWidth;
      ctx.shadowColor = `hsla(${(hueShift + 40) % 360}, 100%, 60%, ${0.65 * glowAlpha})`;
      ctx.fill();
      ctx.restore();

      // avatar circle clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // drop username
      ctx.font = "bold 36px Sans";
      ctx.fillStyle = "#ffffff";
      // name may be long — trim if necessary
      const displayName = typeof userData.name === "string" ? userData.name : (userData.name || "User");
      const nameToShow = displayName.length > 26 ? displayName.slice(0, 23) + "..." : displayName;
      ctx.fillText(nameToShow, 240, 170);

      // level text
      ctx.font = "28px Sans";
      ctx.fillStyle = "#dffcf0";
      ctx.fillText(`🎯 Level ${currentLevel}`, 240, 215);

      // XP bar (static look, you can calculate real xp% if you want)
      const barX = 240, barY = 240, barW = 880 - 240, barH = 18;
      // background bar
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRectFill(ctx, barX, barY, barW, barH, 10);
      // animated fill length (for effect)
      const fillPct = 0.4 + 0.45 * Math.abs(Math.cos(t * Math.PI * 2)); // just animation; replace with real %
      const fillW = Math.max(6, Math.floor(barW * fillPct));
      // gradient fill
      const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      grad.addColorStop(0, `hsla(${hueShift},100%,60%,1)`);
      grad.addColorStop(1, `hsla(${(hueShift + 60) % 360},100%,60%,1)`);
      ctx.fillStyle = grad;
      roundRectFill(ctx, barX + 2, barY + 2, fillW - 4, barH - 4, 8);

      // subtle particle dots near right for motion
      for (let p = 0; p < 6; p++) {
        const px = barX + barW - 10 - (p * 10) - (i * 3 % 30);
        const py = barY + (Math.sin((i + p) / 2) * 6) + 6;
        ctx.beginPath();
        ctx.arc(px, py, 2 + (p % 2), 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${0.06 + p * 0.02})`;
        ctx.fill();
      }

      // small congratulations text
      ctx.font = "30px Sans";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Congratulations! You've reached level ${currentLevel}`, 240, 290);

      // Add the drawn frame to GIF
      encoder.addFrame(ctx);
    } // end frames loop

    encoder.finish();

    // wait for file to be fully written
    await new Promise((res, rej) => {
      writeStream.on("finish", res);
      writeStream.on("error", rej);
    });

    // send and cleanup
    try {
      await message.reply({
        body: `🎉 Congratulations ${userData.name}!\nYou've reached level ${currentLevel}!`,
        attachment: fs.createReadStream(tmpPath)
      });
    } catch (e) {
      console.log("Send rankup GIF failed:", e && e.message);
      // fallback: send static PNG
      const fallbackCanvas = Canvas.createCanvas(width, height);
      const fctx = fallbackCanvas.getContext("2d");
      fctx.drawImage(bgImage, 0, 0, width, height);
      fctx.drawImage(avatarImage, 40, 120, 160, 160);
      // Draw minimal text on fallback
      fctx.fillStyle = "#ffffff";
      fctx.font = "bold 36px Sans";
      fctx.fillText(userData.name || "User", 240, 170);
      fctx.font = "28px Sans";
      fctx.fillText(`Level ${currentLevel}`, 240, 215);

      const fallbackPath = path.join(__dirname, `rankup_fallback_${Date.now()}.png`);
      fs.writeFileSync(fallbackPath, fallbackCanvas.toBuffer());
      await message.reply({ body: `🎉 ${userData.name}`, attachment: fs.createReadStream(fallbackPath) });
      await fs.remove(fallbackPath).catch(()=>{});
    } finally {
      // cleanup gif file
      await fs.remove(tmpPath).catch(()=>{});
    }
  }
};

// ---------- helper drawing funcs ----------
function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function roundRectFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
	}
