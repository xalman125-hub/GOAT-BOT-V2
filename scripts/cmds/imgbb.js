const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

module.exports = {
  config: {
    name: "imgbb",
    aliases: ["i", "ibb", "upload"],
    version: "3.2",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Convert image to link",
    longDescription: "Uploads a replied image to ImgBB and returns a direct link.",
    category: "image"
  },

  onStart: async function ({ api, event, message }) {
    const { messageID, type, messageReply } = event;

    if (
      type !== "message_reply" ||
      !messageReply.attachments ||
      messageReply.attachments.length === 0
    ) {
      return message.reply("❌ Please reply to an image or gif.");
    }

    const attachment = messageReply.attachments[0];

    if (
      !attachment.type ||
      !["photo", "animated_image"].includes(attachment.type)
    ) {
      return message.reply("❌ Only image or gif files are supported.");
    }

    const imageUrl = attachment.url;

    let fileExt = path.extname(imageUrl.split("?")[0]);
    if (!fileExt) {
      fileExt = attachment.type === "animated_image" ? ".gif" : ".jpg";
    }

    const fileName = `xalman_upload${fileExt}`;

    try {
      api.setMessageReaction("🕑", messageID, () => {}, true);

      const githubLink =
        "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";
      const configRes = await axios.get(githubLink);
      const apiBaseUrl = configRes.data.imgbb;

      if (!apiBaseUrl) throw new Error("ImgBB API URL not found.");

      const finalEndpoint = `${apiBaseUrl.replace(/\/$/, "")}/upload`;

      const imageRes = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });

      const buffer = Buffer.from(imageRes.data);

      const form = new FormData();
      form.append("image", buffer, { filename: fileName });

      const response = await axios.post(finalEndpoint, form, {
        headers: form.getHeaders(),
        timeout: 60000
      });

      if (response.data?.url) {
        api.setMessageReaction("✅", messageID, () => {}, true);
        return message.reply(
          `${response.data.url}`
        );
      }

      throw new Error("Upload failed.");

    } catch (error) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply(`⚠️ Error:\n${error.message}`);
    }
  }
};
