const axios = require('axios');
const FormData = require('form-data');

module.exports = {
    config: {
        name: "imgup",
        aliases: ["freeimage", "freeimgup", "freeimg"],
        version: "2.1.0",
        author: "xalman",
        countDown: 5,
        role: 0,
        shortDescription: "Upload image to free hosting",
        longDescription: "Uploads a replied image using the GitHub JSON configuration for free hosting.",
        category: "utility",
        guide: {
            en: "{pn} [reply to an image]"
        }
    },

    onStart: async function ({ api, event, message }) {
        const { threadID, messageID, type, messageReply } = event;
        if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
            return message.reply("❌ Please reply to an image to upload.");
        }

        const imageUrl = messageReply.attachments[0].url;

        try {
            api.setMessageReaction("🕑", messageID, (err) => {}, true);

            const githubRaw = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";
            const configRes = await axios.get(githubRaw);

            let baseUrl = configRes.data.freeimg; 
            if (!baseUrl) throw new Error("FreeImg API URL not found in config.");

            const endpoint = `${baseUrl.replace(/\/$/, "")}/upload-free`;
            const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageRes.data);
            const form = new FormData();
            form.append('image', buffer, { filename: 'xalman_free_upload.jpg' });
            const response = await axios.post(endpoint, form, {
                headers: form.getHeaders()
            });

            if (response.data && response.data.success) {
                api.setMessageReaction("✅", messageID, (err) => {}, true);
                return message.reply(`${response.data.url}`);
            } else {
                throw new Error("Server failed to return a valid URL.");
            }

        } catch (error) {
            console.error(error);
            api.setMessageReaction("❌", messageID, (err) => {}, true);
            
            let errorMsg = error.message;
            if (error.response && error.response.status === 404) {
                errorMsg = "Free hosting server not found (404).";
            }
            return message.reply(`⚠️ Error: ${errorMsg}`);
        }
    }
};
