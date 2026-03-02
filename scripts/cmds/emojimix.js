const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "emojimix",
    version: "12.0.0",
    author: "xalman",
    countDown: 2,
    role: 0,
    description: "Emoji Mix",
    category: "entertainment",
    guide: { bn: "{pn} [emoji1] [emoji2]" }
};

module.exports.onStart = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    if (args.length < 2) return api.sendMessage("⚠️ ২টি ইমোজি দিন!", threadID, messageID);

    try {
        api.setMessageReaction("⌛", messageID, () => {}, true);

        const { data } = await axios.get("https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json");
        const BASE_URL = (data.mixmean || data.mixmean).replace(/\/$/, "");

        const res = await axios.get(`${BASE_URL}/mix?e1=${encodeURIComponent(args[0])}&e2=${encodeURIComponent(args[1])}`, { responseType: "arraybuffer" });
        
        const cachePath = path.join(__dirname, "cache", `mix_${Date.now()}.png`);
        if (!fs.existsSync(path.dirname(cachePath))) fs.mkdirSync(path.dirname(cachePath), { recursive: true });
        fs.writeFileSync(cachePath, Buffer.from(res.data, "utf-8"));

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage({ body: `✨ Mix Success`, attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath), messageID);
    } catch (e) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ error no mix png `, threadID, messageID);
    }
};
