const axios = require("axios");
const fs = require("fs-extra");
module.exports = {
  config: {
    name: "pair",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Get to know your partner",
    },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "LOVE",
    guide: {
      en: "{pn} [tag someone or leave blank]",
    }
  },
  onStart: async function ({ api, args, message, event, threadsData, usersData }) {
    const { loadImage, createCanvas } = require("canvas");
    let pathImg = __dirname + "/assets/background.png";
    let pathAvt1 = __dirname + "/assets/any.png";
    let pathAvt2 = __dirname + "/assets/avatar.png";

    const botID = api.getCurrentUserID();
    let id1 = event.senderID;
    let id2;

    if (Object.keys(event.mentions).length > 0) {
      id2 = Object.keys(event.mentions)[0];
      if (id2 == id1 || id2 == botID) return message.reply("You cannot pair with yourself or bot!");
    } else {
      const ThreadInfo = await api.getThreadInfo(event.threadID);
      const all = ThreadInfo.userInfo;
      let gender1;
      for (let c of all) {
        if (c.id == id1) gender1 = c.gender;
      }
      let candidates = [];
      for (let u of all) {
        if (u.id !== id1 && u.id !== botID) {
          if (gender1 == "MALE" && u.gender == "FEMALE") candidates.push(u.id);
          else if (gender1 == "FEMALE" && u.gender == "MALE") candidates.push(u.id);
          else if (!gender1 || (gender1 != "MALE" && gender1 != "FEMALE")) candidates.push(u.id);
        }
      }
      if (candidates.length == 0) return message.reply("No suitable match found.");
      id2 = candidates[Math.floor(Math.random() * candidates.length)];
    }

    let name1 = await usersData.getName(id1);
    let name2 = await usersData.getName(id2);

    const compatibilityRates = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
    let randomRate = Math.random() < 0.9 ? (Math.floor(Math.random() * 100) + 1) : compatibilityRates[Math.floor(Math.random() * compatibilityRates.length)];
    
    const backgrounds = [
      "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg"
    ];

    let getAvtmot = (
      await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvtmot, "utf-8"));

    let getAvthai = (
      await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathAvt2, Buffer.from(getAvthai, "utf-8"));

    let getbackground = (
      await axios.get(backgrounds[0], { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathImg, Buffer.from(getbackground, "utf-8"));

    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt2);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 111, 175, 330, 330);
    ctx.drawImage(baseAvt2, 1018, 173, 330, 330);
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    return api.sendMessage({
      body: `『💗』Congratulations ${name1}『💗』\n『❤️』Looks like your destiny brought you together with ${name2}『❤️』\n『🔗』Your link percentage is ${randomRate}%『🔗』`,
      mentions: [
        { tag: `${name1}`, id: id1 },
        { tag: `${name2}`, id: id2 }
      ],
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => fs.unlinkSync(pathImg), event.messageID);
  }
};
