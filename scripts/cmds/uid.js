const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "uid",
		version: "2.5",
		author: "xalman",
		countDown: 3,
		role: 0,
		description: "Get User ID and info in a stylish card",
		category: "info",
		guide: "{pn} [tag/reply/link/none]"
	},

	onStart: async function ({ event, usersData, api, args }) {
		const { threadID, senderID, messageID, mentions, messageReply, type } = event;
		
		let targetID;

		try {
			// ১. রিপ্লাই চেক
			if (type == "message_reply") {
				targetID = messageReply.senderID;
			} 
			// ২. মেনশন চেক
			else if (Object.keys(mentions).length > 0) {
				targetID = Object.keys(mentions)[0];
			} 
			// ৩. লিঙ্ক থেকে আইডি বের করা
			else if (args.length > 0) {
				const input = args[0];
				if (input.includes("facebook.com") || input.includes("fb.com")) {
					try {
						// লিঙ্ক থেকে UID বের করার জন্য API
						const res = await axios.get(`https://api.vyturex.com/fblink?url=${encodeURIComponent(input)}`);
						targetID = res.data.id;
					} catch(e) {
						return api.sendMessage("❌ Invalid Facebook link or unable to fetch UID.", threadID, messageID);
					}
				} else {
					targetID = input;
				}
			} 
			else {
				targetID = senderID;
			}

			// ৪. ডেটা সংগ্রহ
			const userData = await usersData.get(targetID);
			const name = userData.name || "Unknown User";
			const gender = userData.gender == 2 ? "MALE" : userData.gender == 1 ? "FEMALE" : "UNKNOWN";
			
			const width = 1200, height = 500;
			const canvas = Canvas.createCanvas(width, height);
			const ctx = canvas.getContext('2d');

			ctx.fillStyle = "#0d1117";
			ctx.fillRect(0, 0, width, height);

			ctx.strokeStyle = "rgba(0, 242, 255, 0.05)";
			ctx.lineWidth = 1;
			for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
			for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

			ctx.font = 'bold 50px Courier New';
			ctx.fillStyle = '#00f2ff';
			ctx.textAlign = 'center';
			ctx.fillText('USER IDENTIFICATION', width / 2, 80);

			// ৩টি বক্স রাখা হয়েছে (Verified Database রিমুভ করা হয়েছে)
			const info = [
				{ l: "FULL NAME", v: name.toUpperCase() },
				{ l: "FACEBOOK ID (UID)", v: targetID },
				{ l: "GENDER STATUS", v: gender }
			];

			ctx.textAlign = 'left';
			info.forEach((item, i) => {
				const x = 450, y = 140 + i * 100; // স্পেসিং বাড়ানো হয়েছে
				ctx.strokeStyle = '#ff0055';
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, 700, 80);
				
				ctx.font = '14px Monaco'; ctx.fillStyle = '#ff0055';
				ctx.fillText(item.l, x + 15, y + 25);
				ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#ffffff';
				ctx.fillText(item.v, x + 15, y + 60);
			});

			const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
			try {
				const avatarImg = await Canvas.loadImage(avatarUrl);
				ctx.shadowBlur = 20; ctx.shadowColor = '#ff0055';
				ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
				ctx.strokeRect(50, 120, 350, 350);
				ctx.drawImage(avatarImg, 55, 125, 340, 340);
			} catch(e) {
				ctx.fillStyle = "#333";
				ctx.fillRect(50, 120, 350, 350);
			}

			const cachePath = path.join(__dirname, 'cache', `${targetID}_uid.png`);
			fs.ensureDirSync(path.join(__dirname, 'cache'));
			fs.writeFileSync(cachePath, canvas.toBuffer());
			
			// টেক্সট পরিবর্তন করা হয়েছে
			api.sendMessage({ 
				body: `${targetID}`,
				attachment: fs.createReadStream(cachePath) 
			}, threadID, () => fs.unlinkSync(cachePath), messageID);

		} catch (e) { 
			api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID); 
		}
	}
};
