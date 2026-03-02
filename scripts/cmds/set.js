module.exports = {
  config: {
    name: "set",
    aliases: ["ap"],
    version: "3.0",
    author: "Loid Butter | modified by xalman",
    role: 0,
    shortDescription: {
      en: "Set money or exp for a user"
    },
    longDescription: {
      en: "Set money or exp using UID, reply, or mention"
    },
    category: "economy",
    guide: {
      en: "{pn}set [money|exp] [amount] [uid(optional)]"
    }
  },

  onStart: async function ({ args, event, api, usersData }) {

    const ADMIN = ["61583129938292", "61582662637419"];
    if (!ADMIN.includes(event.senderID)) {
      return api.sendMessage(
        "age owner level e asho broo 🌬️",
        event.threadID,
        event.messageID
      );
    }

    const type = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);

    if (!type || isNaN(amount)) {
      return api.sendMessage(
        "❌ Usage: set [money|exp] [amount] [uid(optional)]",
        event.threadID
      );
    }

    let targetUser;

    if (args[2] && /^\d+$/.test(args[2])) {
      targetUser = args[2];

    } else if (event.type === "message_reply") {
      targetUser = event.messageReply.senderID;

    } else if (Object.keys(event.mentions).length > 0) {
      targetUser = Object.keys(event.mentions)[0];

    } else {
      targetUser = event.senderID;
    }

    if (targetUser === api.getCurrentUserID()) {
      return api.sendMessage("🤖 You cannot modify bot data.", event.threadID);
    }

    const userData = await usersData.get(targetUser);
    if (!userData) {
      return api.sendMessage("❌ User not found.", event.threadID);
    }

    const name = await usersData.getName(targetUser);

    if (type === "money") {
      await usersData.set(targetUser, {
        money: amount,
        exp: userData.exp || 0,
        data: userData.data || {}
      });

      return api.sendMessage(
        `✅ Money set to ${amount}\n👤 User: ${name}`,
        event.threadID
      );
    }

    if (type === "exp") {
      await usersData.set(targetUser, {
        money: userData.money || 0,
        exp: amount,
        data: userData.data || {}
      });

      return api.sendMessage(
        `✅ EXP set to ${amount}\n👤 User: ${name}`,
        event.threadID
      );
    }

    return api.sendMessage(
      "❌ Invalid type. Use money or exp only.",
      event.threadID
    );
  }
};
