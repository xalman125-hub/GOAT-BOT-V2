const canvas = require("canvas");
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
		description: "Get User ID with upgraded UI",
		category: "info",
		guide: "{pn} [tag/reply/link]"
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
						const res = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`);
						targetID = res.data.id;
					} catch {
						if (global.utils?.findUid)
							targetID = await global.utils.findUid(input);
					}
				} 
				else {
					targetID = input;
				}
			} 
			else {
				targetID = senderID;
			}

			if (!targetID)
				return api.sendMessage("❌ UID not found!", threadID, messageID);

			let userData;
			try {
				userData = await usersData.get(targetID);
			} catch {
				userData = { name: "Facebook User", gender: 0 };
			}

			const name = userData.name || "Facebook User";
			const gender =
				userData.gender == 2 ? "MALE" :
				userData.gender == 1 ? "FEMALE" : "UNKNOWN";

			const width = 1200;
			const height = 500;

			const canvas = Canvas.createCanvas(width, height);
			const ctx = canvas.getContext("2d");

			// Background
			const bgGrad = ctx.createLinearGradient(0, 0, width, height);
			bgGrad.addColorStop(0, "#0a031e");
			bgGrad.addColorStop(1, "#1a052b");
			ctx.fillStyle = bgGrad;
			ctx.fillRect(0, 0, width, height);

			// Grid
			ctx.strokeStyle = "rgba(0,255,255,0.05)";
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

			// Title
			ctx.font = "bold 45px Courier New";
			ctx.fillStyle = "#00f2ff";
			ctx.textAlign = "center";
			ctx.fillText("USER IDENTIFICATION", width / 2, 70);

			// Info
			const info = [
				{ l: "FULL NAME", v: name.toUpperCase() },
				{ l: "FACEBOOK ID (UID)", v: String(targetID) },
				{ l: "GENDER STATUS", v: gender }
			];

			ctx.textAlign = "left";

			info.forEach((item, i) => {
				const x = 450;
				const y = 140 + i * 110;

				ctx.strokeStyle = "#ff0055";
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, 700, 85);

				ctx.font = "12px Monaco";
				ctx.fillStyle = "#ff0055";
				ctx.fillText(item.l, x + 15, y + 25);

				ctx.font = "bold 30px sans-serif";
				ctx.fillStyle = "#ffffff";
				ctx.fillText(item.v, x + 15, y + 65);
			});

			// Avatar
			const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

			try {
				const avatarImg = await Canvas.loadImage(avatarUrl);

				ctx.save();
				ctx.beginPath();
				ctx.arc(225, 295, 160, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();

				ctx.drawImage(avatarImg, 65, 135, 320, 320);
				ctx.restore();
			}
			catch {
				ctx.fillStyle = "#333";
				ctx.beginPath();
				ctx.arc(225, 295, 160, 0, Math.PI * 2);
				ctx.fill();
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
				() => fs.unlinkSync(cachePath),
				messageID
			);
		}
		catch (e) {
			api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
		}
	}
};
