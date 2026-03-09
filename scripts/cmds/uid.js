const Canvas = require("canvas");
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
		description: "Get User ID with 3-Layer System UI",
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
						const res = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`);
						targetID = res.data.id || (await axios.get(`https://api.vyturex.com/fblink?url=${encodeURIComponent(input)}`)).data.id;
					} catch(e) {
						if (global.utils && global.utils.findUid) targetID = await global.utils.findUid(input);
					}
				} else { targetID = input; }
			} else { targetID = senderID; }

			if (!targetID) return api.sendMessage("❌ UID not found!", threadID, messageID);

			let userData;
			try { userData = await usersData.get(targetID); } catch (err) { userData = { name: "Facebook User", gender: 0 }; }

			const name = (userData.name || "Facebook User").toUpperCase();
			const gender = userData.gender == 2 ? "MALE" : userData.gender == 1 ? "FEMALE" : "UNKNOWN";
			
			const width = 1200, height = 550;
			const canvas = Canvas.createCanvas(width, height);
			const ctx = canvas.getContext('2d');

			const bgGrad = ctx.createLinearGradient(0, 0, width, height);
			bgGrad.addColorStop(0, '#0a031e');
			bgGrad.addColorStop(1, '#1a052b');
			ctx.fillStyle = bgGrad;
			ctx.fillRect(0, 0, width, height);

			ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
			ctx.lineWidth = 1;
			for (let i = 0; i < width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
			for (let i = 0; i < height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

			for (let i = 0; i < 50; i++) {
				ctx.fillStyle = Math.random() > 0.5 ? "rgba(0, 255, 255, 0.4)" : "rgba(255, 0, 85, 0.4)";
				ctx.beginPath();
				ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2.5, 0, Math.PI * 2);
				ctx.fill();
			}

			ctx.shadowBlur = 20; ctx.shadowColor = '#00f2ff';
			ctx.fillStyle = "rgba(0, 242, 255, 0.15)";
			ctx.roundRect(width / 4, 30, width / 2, 70, 15);
			ctx.fill();
			ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 3;
			ctx.stroke();
			
			ctx.shadowBlur = 0;
			ctx.font = 'bold 40px sans-serif'; ctx.fillStyle = '#00f2ff'; ctx.textAlign = 'center';
			ctx.fillText('IDENTITY VERIFIED', width / 2, 80);

			const info = [
				{ l: "FULL NAME", v: name },
				{ l: "USER ID (UID)", v: String(targetID) },
				{ l: "GENDER STATUS", v: gender }
			];

			ctx.textAlign = 'left';
			info.forEach((item, i) => {
				const x = 480, y = 150 + i * 120;
				ctx.shadowBlur = 15; ctx.shadowColor = '#ff0055';
				ctx.fillStyle = "rgba(255, 0, 85, 0.05)";
				ctx.roundRect(x, y, 650, 95, 10);
				ctx.fill();
				ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 2;
				ctx.stroke();
				
				ctx.shadowBlur = 0;
				ctx.font = 'bold 14px Monospace'; ctx.fillStyle = '#ff0055';
				ctx.fillText(item.l, x + 20, y + 30);
				ctx.font = 'bold 32px sans-serif'; ctx.fillStyle = '#ffffff';
				ctx.fillText(item.v, x + 20, y + 75);
			});

			const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
			try {
				const avatarImg = await Canvas.loadImage(avatarUrl);
				ctx.save();
				ctx.shadowBlur = 30; ctx.shadowColor = '#00f2ff';
				ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 10;
				ctx.beginPath();
				ctx.arc(240, 310, 175, 0, Math.PI * 2);
				ctx.stroke();
				ctx.clip();
				ctx.drawImage(avatarImg, 65, 135, 350, 350);
				ctx.restore();
			} catch(e) {
				ctx.fillStyle = "#222";
				ctx.beginPath(); ctx.arc(240, 310, 175, 0, Math.PI * 2); ctx.fill();
			}

			const cachePath = path.join(__dirname, 'cache', `uid_${targetID}.png`);
			fs.ensureDirSync(path.join(__dirname, 'cache'));
			fs.writeFileSync(cachePath, canvas.toBuffer());
			
			api.sendMessage({ 
				body: `${targetID}`,
				attachment: fs.createReadStream(cachePath) 
			}, threadID, () => { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); }, messageID);

		} catch (e) { api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID); }
	}
};
