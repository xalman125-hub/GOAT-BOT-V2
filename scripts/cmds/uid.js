const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "uid",
		version: "4.0",
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

			if (type == "message_reply") {
				targetID = messageReply.senderID;
			}

			else if (Object.keys(mentions).length > 0) {
				targetID = Object.keys(mentions)[0];
			}

			else if (args.length > 0) {

				const input = args[0];

				if (input.includes("facebook.com") || input.includes("fb.com")) {

					try {

						const res1 = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`);

						if (res1.data && res1.data.id) {
							targetID = res1.data.id;
						}

						else {

							const res2 = await axios.get(`https://api.vyturex.com/fblink?url=${encodeURIComponent(input)}`);

							targetID = res2.data.id;

						}

					} catch (e) {

						if (global.utils && global.utils.findUid) {
							targetID = await global.utils.findUid(input);
						}

						else {
							return api.sendMessage("❌ Error: Could not extract UID from this link.", threadID, messageID);
						}

					}

				}

				else {
					targetID = input;
				}

			}

			else {
				targetID = senderID;
			}

			if (!targetID) return api.sendMessage("❌ User not found!", threadID, messageID);

			let userData;

			try {
				userData = await usersData.get(targetID);
			}

			catch {
				userData = { name: "Facebook User", gender: 0 };
			}

			const name = userData.name || "Facebook User";
			const gender = userData.gender == 2 ? "MALE" : userData.gender == 1 ? "FEMALE" : "UNKNOWN";

			const width = 1200;
			const height = 500;

			const canvas = Canvas.createCanvas(width, height);
			const ctx = canvas.getContext("2d");

			// ===== Background =====

			const bg = ctx.createLinearGradient(0, 0, width, height);
			bg.addColorStop(0, "#0f0c29");
			bg.addColorStop(0.5, "#302b63");
			bg.addColorStop(1, "#24243e");

			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);

			ctx.strokeStyle = "rgba(0,255,255,0.05)";
			ctx.lineWidth = 1;

			for (let x = 0; x < width; x += 60) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();
			}

			for (let y = 0; y < height; y += 60) {
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
			}

			for (let i = 0; i < 7; i++) {

				const x = Math.random() * width;
				const y = Math.random() * height;
				const r = 80 + Math.random() * 120;

				const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
				glow.addColorStop(0, "rgba(0,255,255,0.12)");
				glow.addColorStop(1, "transparent");

				ctx.fillStyle = glow;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, Math.PI * 2);
				ctx.fill();

			}

			ctx.fillStyle = "rgba(255,255,255,0.03)";
			ctx.fillRect(420, 120, 740, 300);

			ctx.strokeStyle = "rgba(0,255,255,0.3)";
			ctx.lineWidth = 2;
			ctx.strokeRect(420, 120, 740, 300);

			// ===== Title =====

			ctx.font = "bold 50px Courier New";
			ctx.fillStyle = "#00f2ff";
			ctx.textAlign = "center";
			ctx.fillText("USER IDENTIFICATION", width / 2, 80);

			// ===== Info =====

			const info = [
				{ l: "FULL NAME", v: name.toUpperCase() },
				{ l: "FACEBOOK UID", v: String(targetID) },
				{ l: "GENDER", v: gender }
			];

			ctx.textAlign = "left";

			info.forEach((item, i) => {

				const x = 450;
				const y = 150 + i * 90;

				ctx.strokeStyle = "#ff0055";
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, 650, 70);

				ctx.font = "14px Monaco";
				ctx.fillStyle = "#ff0055";
				ctx.fillText(item.l, x + 15, y + 25);

				ctx.font = "bold 26px sans-serif";
				ctx.fillStyle = "#ffffff";
				ctx.fillText(item.v, x + 15, y + 55);

			});

			// ===== Avatar =====

			const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

			try {

				const avatarImg = await Canvas.loadImage(avatarUrl);

				ctx.save();
				ctx.beginPath();
				ctx.arc(225, 295, 170, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();

				ctx.drawImage(avatarImg, 55, 125, 340, 340);
				ctx.restore();

				ctx.strokeStyle = "#00f2ff";
				ctx.lineWidth = 6;
				ctx.shadowBlur = 20;
				ctx.shadowColor = "#00f2ff";

				ctx.beginPath();
				ctx.arc(225, 295, 175, 0, Math.PI * 2);
				ctx.stroke();

			}

			catch {

				ctx.fillStyle = "#333";
				ctx.fillRect(50, 120, 350, 350);

			}

			const cachePath = path.join(__dirname, "cache", `uid_${targetID}.png`);

			fs.ensureDirSync(path.join(__dirname, "cache"));

			fs.writeFileSync(cachePath, canvas.toBuffer());

			api.sendMessage(
				{
					body: `${targetID}`,
					attachment: fs.createReadStream(cachePath)
				},
				threadID,
				() => {
					if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
				},
				messageID
			);

		}

		catch (e) {

			api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);

		}

	}
};
