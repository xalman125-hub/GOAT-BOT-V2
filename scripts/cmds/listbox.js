module.exports = {
	config: {
		name: "listbox",
		aliases: ["grouplist", "listgroup"],
		author: "xalman",
		version: "2.0",
		cooldowns: 5,
		role: 2,
		shortDescription: { en: "List all groups with pagination." },
		longDescription: { en: "List all group chats the bot is in with 10 groups per page." },
		category: "owner",
		guide: { en: "{p}{n} [page_number]" }
	},

	onStart: async function ({ api, event, args, commandName }) {
		try {
			const allThreads = await api.getThreadList(100, null, ['INBOX']);
			const filteredList = allThreads.filter(group => group.isGroup && group.threadName);

			if (filteredList.length === 0) {
				return api.sendMessage('No group chats found.', event.threadID);
			}

			const page = parseInt(args[0]) || 1;
			const limit = 10;
			const totalPages = Math.ceil(filteredList.length / limit);

			const msg = getPageMessage(filteredList, page, limit, totalPages);

			return api.sendMessage(msg, event.threadID, (err, info) => {
				if (err) return;
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					author: event.senderID,
					allGroups: filteredList,
					page: page
				});
			}, event.messageID);

		} catch (error) {
			console.error("Error in listbox:", error);
			api.sendMessage("Error fetching group list.", event.threadID);
		}
	},

	onReply: async function ({ api, event, Reply, commandName }) {
		const { author, allGroups, page, messageID } = Reply;
		
		if (event.senderID !== author) return;

		let newPage = page;
		const input = event.body.trim().toLowerCase();

		if (input === "next") {
			newPage = page + 1;
		} else if (input === "back") {
			newPage = page - 1;
		} else if (!isNaN(input)) {
			newPage = parseInt(input);
		} else {
			return;
		}

		const limit = 10;
		const totalPages = Math.ceil(allGroups.length / limit);

		if (newPage > totalPages || newPage < 1) {
			return api.sendMessage(`Invalid page! Please choose between 1 and ${totalPages}`, event.threadID, event.messageID);
		}

		const msg = getPageMessage(allGroups, newPage, limit, totalPages);

		api.unsendMessage(messageID);

		return api.sendMessage(msg, event.threadID, (err, info) => {
			if (err) return;
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				author: event.senderID,
				allGroups: allGroups,
				page: newPage
			});
		}, event.messageID);
	}
};

function getPageMessage(groups, page, limit, totalPages) {
	const start = (page - 1) * limit;
	const end = start + limit;
	const pagedGroups = groups.slice(start, end);

	let message = `╭──────╮\n│ 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓\n├──────┤\n`;
	pagedGroups.forEach((group, index) => {
		message += `│${start + index + 1}. ${group.threadName}\n│𝐓𝐈𝐃: ${group.threadID}\n├──────┤\n`;
	});
	message += `│ Page: ${page}/${totalPages}\n╰──────╯\n\n💡 Reply with:\n"next" - Next page\n"back" - Previous page\n"number" - Jump to page`;
	return message;
}
