const axios = require("axios");

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "4.6",
    author: "xalman",
    countDown: 5,
    role: 0,
    description: "Play a random quiz from an external API",
    category: "games",
    guide: "Type {pn} to start or {pn} list to see total questions"
  },

  onStart: async function ({ event, message, args }) {
    const { senderID } = event;
    const RAW_LINK = "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json";

    try {
      const rawRes = await axios.get(RAW_LINK);
      const API_URL = rawRes.data.quiz;
      
      const res = await axios.get(`${API_URL}/mcq`);
      const questions = res.data;

      if (args[0] === "list") {
        return message.reply(`📊 *QUIZ STATISTICS*\n━━━━━━━━━━━━━━━\n🔹 Total Questions: ${questions.length}\n━━━━━━━━━━━━━━━\n💡 Type /quiz to play.`);
      }

      const quiz = questions[Math.floor(Math.random() * questions.length)];

      const msgText = `📝 *Question:* ${quiz.question}\n\n` +
                  `🅰️ ${quiz.options.A}\n` +
                  `🅱️ ${quiz.options.B}\n` +
                  `©️ ${quiz.options.C}\n` +
                  `Ⓓ ${quiz.options.D}\n\n` +
                  `⏳ Reply to this message with the correct option.`;

      return message.reply(msgText, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: senderID,
          quizID: quiz.id,
          apiUrl: API_URL
        });
      });

    } catch (e) {
      console.error(e);
      return message.reply("❌ Failed to fetch data from the server.");
    }
  },

  onReply: async function ({ event, Reply, message, usersData, api }) {
    const { senderID, body } = event;

    if (senderID !== Reply.author) {
      return message.reply("⚠️ This is not your quiz! Type /quiz to start your own.");
    }

    const userAnswer = body.trim().toUpperCase();
    const validOptions = ["A", "B", "C", "D"];

    if (!validOptions.includes(userAnswer)) return;

    try {
      const res = await axios.post(`${Reply.apiUrl}/submit`, {
        userID: senderID,
        id: Reply.quizID,
        option: userAnswer
      });

      api.unsendMessage(Reply.messageID).catch(() => {});
      global.GoatBot.onReply.delete(Reply.messageID);

      if (res.data.correct) {
        const reward = 500;
        const userData = await usersData.get(senderID);
        const currentMoney = parseInt(userData.money || "0");
        const newMoney = currentMoney + reward;
        
        await usersData.set(senderID, { money: newMoney.toString() });

        return message.reply(`✅ Correct Answer!\n💰 You received: $${reward}\n🏦 Current Balance: $${newMoney}`);
      } else {
        return message.reply(`❌ Wrong Answer!\n📖 The correct answer was: ${res.data.correctOption}`);
      }

    } catch (e) {
      console.error(e);
      return message.reply("❌ Error submitting your answer. Please try again.");
    }
  }
};
