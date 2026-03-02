module.exports = {
    config: {
        name: "catbox",
        aliases: ["cb"],
        version: "6.7",
        author: "xalman",
        countDown: 5,
        role: 0,
        category: "media",
        guide: { en: "{pn} [reply/image/video]" }
    },

    onStart: async function ({ event, api, message }) {
        const axios = require("axios");
        const fs = require("fs-extra");
        const FormData = require("form-data");
        const path = require("path");

        const { messageReply, messageID } = event;
        const attachment = messageReply?.attachments[0] || event.attachments[0];
        
        if (!attachment) {
            return message.reply("⚠️ দয়া করে একটি ছবি বা ভিডিওতে রিপ্লাই দিন!");
        }

        api.setMessageReaction("⏳", messageID, () => {}, true);

        const ext = attachment.type === "video" ? ".mp4" : (attachment.type === "animated_image" ? ".gif" : ".jpg");
        const tempPath = path.join(__dirname, `nx_temp_${Date.now()}${ext}`);

        try {
            const github_raw_url = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";
            const configRes = await axios.get(github_raw_url);
            const base_url = configRes.data.catbox;

            if (!base_url) throw new Error("API URL not found in GitHub config.");
            
            const nx_api_url = base_url.endsWith('/upload') ? base_url : `${base_url.replace(/\/$/, "")}/upload`;

            const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
            fs.writeFileSync(tempPath, Buffer.from(response.data));

            const form = new FormData();
            form.append("fileToUpload", fs.createReadStream(tempPath));

            const uploadRes = await axios.post(nx_api_url, form, {
                headers: { ...form.getHeaders() },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            
            api.setMessageReaction("✅", messageID, () => {}, true);
            return message.reply(uploadRes.data);

        } catch (err) {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return message.reply("❌ Error: " + (err.response?.data || err.message));
        }
    }
};
