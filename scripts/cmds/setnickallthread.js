module.exports = {
  config: {
    name: "setallnick",
    version: "1.0.0",
    role: 2,
    author: "xalman",
    description: "set  bot nickname all group",
    category: "admin",
    guide: "{pn} [নেকনেম]",
    countDown: 5
  },

  onStart: async function ({ api, event, args }) {
    const newNickname = args.join(" ");
    if (!newNickname) return api.sendMessage("please enter any name example: !setallnick MyBot", event.threadID);

    const allThreads = await api.getThreadList(100, null, ["INBOX"]);
    let successCount = 0;
    let failCount = 0;

    api.sendMessage(`changing all thread started...`, event.threadID);

    for (const thread of allThreads) {
      if (thread.isGroup) {
        try {

          const botID = api.getCurrentUserID();
          await api.changeNickname(newNickname, thread.threadID, botID);
          successCount++;
        } catch (error) {
          failCount++;
        }
      }
    }

    return api.sendMessage(
      `✅ success!\n\n🔹 successfully changed: ${successCount} \n❌ failed: ${failCount} `,
      event.threadID
    );
  }
};
