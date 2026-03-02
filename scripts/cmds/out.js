const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "out",
    aliases: ["out"],
    version: "2.0",
    author: "xalman",
    countDown: 5,
    role: 2,
    shortDescription: "bot will leave gc",
    longDescription: "",
    category: "admin",
    guide: {
      vi: "{pn} [tid,blank]",
      en: "{pn} [tid,blank]"
    }
  },

  onStart: async function ({ api, event, args, message }) {

    const allowedUID = "61583129938292"; 
    if (event.senderID !== allowedUID) {
      return api.sendMessage("❌ You are not allowed to use this command!", event.threadID);
    }

    var id;
    if (!args.join(" ")) {
      id = event.threadID;
    } else {
      id = parseInt(args.join(" "));
    }

    const leaveMessage = 
` 𝐥𝐞𝐟𝐭 𝐟𝐫𝐨𝐦 𝐭𝐡𝐞 𝐠𝐫𝐨𝐮𝐩..!🦆💨`;

    return api.sendMessage(leaveMessage, id, () => 
      api.removeUserFromGroup(api.getCurrentUserID(), id)
    );
  }
        }
