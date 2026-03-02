module.exports = {
  config: {
    name: "spin",
    version: "1.0",
    author: "T A N J I L",
    shortDescription: {
      en: "Spin and win game",
    },
    longDescription: {
      en: "Try your luck in this spin game!",
    },
    category: "Game",
  },
  langs: {
    en: {
      invalid_amount: "Enter a valid and positive amount to have a chance to win.",
      not_enough_money: "Check your balance if you have that amount.",
      spin_message: "Spinning...",
      win_message: "Congratulations! You won $%1!",
      lose_message: "Oops! You lost $%1. Better luck next time!",
      jackpot_message: "JACKPOT! You won $%1 with three %2 symbols!",
    },
  },
  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    if (amount > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    const chance = Math.random(); // 0.0 - 1.0
    let isWin = chance < 0.6; // 60% chance to win

    const slots = ["💚", "💛", "💙"];
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    const winnings = calculateWinnings(slot1, slot2, slot3, amount, isWin);

    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data,
    });

    const messageText = getSpinResultMessage(slot1, slot2, slot3, winnings, getLang, amount);
    return message.reply(messageText);
  },
};

function calculateWinnings(slot1, slot2, slot3, betAmount, isWin) {
  if (!isWin) {
    return -betAmount;
  }

  if (slot1 === "💙" && slot2 === "💙" && slot3 === "💙") {
    return betAmount * 10;
  }

  if (slot1 === slot2 && slot2 === slot3) {
    return betAmount * 4;
  } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
    return betAmount * 2;
  } else {
    return -betAmount;
  }
}

function getSpinResultMessage(slot1, slot2, slot3, winnings, getLang, amount) {
  const result = `╭──• SPIN •──╮\n│\n│   💰 Amount: $${amount}\n│\n├──────────────\n│   🎰 Result: [ ${slot1} | ${slot2} | ${slot3} ]\n╰──────────────╯`;

  if (winnings > 0) {
    if (slot1 === "💙" && slot2 === "💙" && slot3 === "💙") {
      return `${getLang("jackpot_message", winnings, "💙")}\n${result}`;
    } else {
      return `${getLang("win_message", winnings)}\n${result}`;
    }
  } else {
    return `${getLang("lose_message", -winnings)}\n${result}`;
  }
}
