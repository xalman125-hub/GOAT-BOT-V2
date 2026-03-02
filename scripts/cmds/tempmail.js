const axios = require("axios");

module.exports = {
  config: {
    name: "tempmail",
    aliases: ["tm"],
    version: "5.1",
    author: "xalman",
    countDown: 5,
    role: 0,
    category: "tools"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;
    const action = args[0]?.toLowerCase();
    const JSON_URL = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";

    try {
      const userData = await usersData.get(senderID) || {};
      const balance = userData.money || 0;

      if (!action) {
        return api.sendMessage(
`✉️ TEMP-MAIL PRO
━━━━━━━━━━━━━━━━━━
➜ tm gen (Cost: 100 Coins)
➜ tm check <email> (Free)

💰 Your Balance: ${balance} Coins`,
          threadID,
          messageID
        );
      }

      let API_BASE;
      try {
        const configRes = await axios.get(JSON_URL);
        API_BASE = configRes?.data?.tm;
      } catch {
        return api.sendMessage("❌ Failed to load API config.", threadID, messageID);
      }

      if (!API_BASE) {
        return api.sendMessage("❌ API Base not found in JSON.", threadID, messageID);
      }

      if (action === "gen") {
        if (balance < 100) {
          return api.sendMessage(
`❌ 100 Coins required!
💰 Your Balance: ${balance}`,
            threadID,
            messageID
          );
        }

        const res = await axios.get(`${API_BASE}/gen`);

        if (!res.data?.status || !res.data?.email) {
          return api.sendMessage("❌ Mail generate failed.", threadID, messageID);
        }

        await usersData.set(senderID, {
          ...userData,
          money: balance - 100
        });

        return api.sendMessage(
`✅ EMAIL GENERATED

📧 Address: ${res.data.email}
━━━━━━━━━━━━━━━━━━
💸 -100 Coins deducted

💡 Use:
tm check ${res.data.email}`,
          threadID,
          messageID
        );
      }

      if (action === "check") {
        const email = args[1];
        if (!email) {
          return api.sendMessage(
"⚠️ Please provide an email.\nExample: tm check example@domain.com",
            threadID,
            messageID
          );
        }

        const res = await axios.get(
          `${API_BASE}/check?email=${encodeURIComponent(email)}`
        );

        if (!res.data?.status) {
          return api.sendMessage(`📭 Inbox empty for:\n${email}`, threadID, messageID);
        }

        const messages = res.data.messages || [];

        if (!messages.length) {
          return api.sendMessage("📭 Inbox is empty (0 messages).", threadID, messageID);
        }

        let text = `📩 INBOX - ${email}\nTotal Messages: ${messages.length}\n`;

        messages.forEach((m, i) => {
          const cleanBody = (m.body || "No content")
            .replace(/<\/?[^>]+(>|$)/g, "")
            .trim()
            .slice(0, 500);

          text += `\n━━━━━━━━━━━━━━━\n`;
          text += `#️⃣ ${i + 1}\n`;
          text += `👤 From: ${m.from?.name || "Unknown"} (${m.from?.address || "N/A"})\n`;
          text += `📝 Subject: ${m.subject || "No Subject"}\n`;
          text += `✉️ Message:\n${cleanBody}\n`;
        });

        return api.sendMessage(text, threadID, messageID);
      }

      return api.sendMessage(
"⚠️ Invalid command!\nUse:\n➜ tm gen\n➜ tm check <email>",
        threadID,
        messageID
      );

    } catch (err) {
      console.error("TM ERROR:", err);
      return api.sendMessage("❌ Unexpected error occurred.", threadID, messageID);
    }
  }
};
