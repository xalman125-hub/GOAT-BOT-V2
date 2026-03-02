const axios = require("axios");

const userCooldown = new Map();
const requestQueue = [];
let isProcessing = false;

const COOLDOWN = 30000;
const MAX_RETRY = 3;

module.exports = {
  config: {
    name: "poli",
    version: "6.0",
    author: "xalman",
    role: 0,
    shortDescription: "Professional Pollination AI",
    category: "ai"
  },

  onStart: async function ({ api, event, args }) {

    if (!args[0]) {
      return api.sendMessage(
        "⚠️ Example:\n/poli cute anime girl | style=anime",
        event.threadID,
        event.messageID
      );
    }

    const now = Date.now();
    const lastUsed = userCooldown.get(event.senderID);

    if (lastUsed && now - lastUsed < COOLDOWN) {
      const timeLeft = Math.ceil((COOLDOWN - (now - lastUsed)) / 1000);
      return api.sendMessage(
        `⏳ Please wait ${timeLeft}s before next image.`,
        event.threadID,
        event.messageID
      );
    }

    userCooldown.set(event.senderID, now);

    requestQueue.push({ api, event, args });

    if (!isProcessing) processQueue();
  }
};

async function processQueue() {
  if (requestQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;

  const { api, event, args } = requestQueue.shift();

  try {
    api.setMessageReaction("🎨", event.messageID, () => {}, true);

    const fullInput = args.join(" ");
    const parts = fullInput.split("|").map(p => p.trim());

    let prompt = parts[0];
    let style = "";

    parts.slice(1).forEach(option => {
      if (option.startsWith("style="))
        style = option.replace("style=", "").trim();
    });

    const styles = {
      anime: "anime style, vibrant colors",
      realistic: "ultra realistic, 8k photography",
      cyberpunk: "cyberpunk, neon lights"
    };

    if (styles[style]) {
      prompt += `, ${styles[style]}`;
    }

    const encodedPrompt = encodeURIComponent(prompt);

    // 🔥 RANDOM SEED ADD
    const randomSeed = Math.floor(Math.random() * 99999999);

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodedPrompt}` +
      `?seed=${randomSeed}`;

    let attempt = 0;
    let response;

    while (attempt < MAX_RETRY) {
      try {
        response = await axios({
          method: "GET",
          url: imageUrl,
          responseType: "stream"
        });

        const contentType = response.headers["content-type"];
        if (contentType && contentType.includes("text/html")) {
          throw new Error("Rate limit detected");
        }

        break;
      } catch (err) {
        attempt++;
        if (attempt >= MAX_RETRY) throw err;

        const delay = 10000 * attempt;
        await api.sendMessage(
          `⏳ Retrying in ${delay / 1000}s (Attempt ${attempt}/${MAX_RETRY})`,
          event.threadID
        );
        await new Promise(res => setTimeout(res, delay));
      }
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    await api.sendMessage(
      {
        body: `🖼️ Generated Image\n\n🎯 ${prompt}\n🌱 Seed: ${randomSeed}`,
        attachment: response.data
      },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    await api.sendMessage(
      "❌ Image generation failed after multiple retries.",
      event.threadID,
      event.messageID
    );
  }

  processQueue();
}
