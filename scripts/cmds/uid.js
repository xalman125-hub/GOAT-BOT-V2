const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "uid",
        version: "5.0",
        author: "xalman",
        countDown: 2,
        role: 0,
        description: "Next-Gen UID Identification Card",
        category: "info",
        guide: "{pn} [tag/reply/profile link ]"
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
                    const res = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`);
                    targetID = res.data.id;
                } else { targetID = input; }
            } else { targetID = senderID; }

            if (!targetID) return api.sendMessage("❌ UID not found!", threadID, messageID);

            const userData = await usersData.get(targetID) || { name: "Facebook User", gender: 0 };
            const name = (userData.name || "Unknown User").toUpperCase();
            const gender = userData.gender == 2 ? "MALE" : userData.gender == 1 ? "FEMALE" : "NON-BINARY";
            
            const width = 1200, height = 600;
            const canvas = Canvas.createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#020205');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 50) {
                for (let j = 0; j < height; j += 50) {
                    ctx.strokeRect(i, j, 48, 48);
                }
            }

            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.roundRect(50, 50, 1100, 500, 30);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.stroke();

            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            try {
                const avatarImg = await Canvas.loadImage(avatarUrl);
                ctx.save();
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#00d4ff';
                ctx.beginPath();
                ctx.arc(280, 300, 180, 0, Math.PI * 2);
                ctx.closePath();
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#00d4ff';
                ctx.stroke();
                ctx.clip();
                ctx.drawImage(avatarImg, 100, 120, 360, 360);
                ctx.restore();
            } catch(e) { 
                ctx.fillStyle = "#333";
                ctx.beginPath(); ctx.arc(280, 300, 180, 0, Math.PI * 2); ctx.fill();
            }

            ctx.shadowBlur = 0;
            const startX = 520;

            ctx.font = 'italic bold 25px Arial';
            ctx.fillStyle = '#00d4ff';
            ctx.fillText('NETWORK ACCESS GRANTED // ID CARD', startX, 120);

            ctx.font = 'bold 70px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(name.length > 15 ? name.substring(0, 15) + '..' : name, startX, 210);

            const drawLabel = (label, value, y) => {
                ctx.font = '16px Monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillText(label, startX, y);
                ctx.font = '35px Monospace';
                ctx.fillStyle = '#00ffcc';
                ctx.fillText(value, startX, y + 40);
            };

            drawLabel("SYSTEM_UID_SERIAL", targetID, 280);
            drawLabel("BIOLOGICAL_MARKER", gender, 380);
            drawLabel("ACCESS_LEVEL", targetID.length > 10 ? "LEVEL_03 [VETERAN]" : "LEVEL_01 [CITIZEN]", 480);

            const cachePath = path.join(__dirname, 'cache', `uid_v5_${targetID}.png`);
            fs.ensureDirSync(path.join(__dirname, 'cache'));
            fs.writeFileSync(cachePath, canvas.toBuffer());
            
            api.sendMessage({ 
                body: `✅ Identity Verified for: ${name}`,
                attachment: fs.createReadStream(cachePath) 
            }, threadID, () => { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); }, messageID);

        } catch (e) { 
            api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID); 
        }
    }
};
