const fetch = require('node-fetch');
const fs = require('fs-extra');

module.exports = {
    config: {
        name: "animegirl",
        version: "1.4",
        author: "SiAM VAI AR BOU RAE I LOVE U 🤭",
        countDown: 5,
        role: 2,
        shortDescription: {
            en: "Generate high-quality anime images based on tags [NSFW Available]",
        },
        longDescription: {
            en: "This command generates a high-quality anime image based on user input tags.",
        },
        category: "image",
        guide: {
            en: "Usage: {pn} <tag>\nTags: \n\nmaid, waifu, marin-kitagawa, mori-calliope, raiden-shogun, oppai, selfies, uniform\nNSFW: ass, hentai, milf, oral, paizuri, ecchi, ero.",
        }
    },

    onStart: async function ({ message, args }) {
        const availableTags = [
            "maid", "waifu", "marin-kitagawa", "mori-calliope", 
            "raiden-shogun", "oppai", "selfies", "uniform",
            "ass", "hentai", "milf", "oral", "paizuri", "ecchi", "ero"
        ];

        const tag = args[0];
        if (!tag) {
            return message.reply(
                "❌ | Please specify a tag!\n\nAvailable Tags:\n\n✨ SFW: maid, waifu, marin-kitagawa, mori-calliope, raiden-shogun, oppai, selfies, uniform\n🔞 NSFW: ass, hentai, milf, oral, paizuri, ecchi, ero."
            );
        }

        if (!availableTags.includes(tag.toLowerCase())) {
            return message.reply(
                `⚠️ | Invalid Tag: ${tag}\n\nAvailable Tags:\n\n✨ SFW: maid, waifu, marin-kitagawa, mori-calliope, raiden-shogun, oppai, selfies, uniform\n🔞 NSFW: ass, hentai, milf, oral, paizuri, ecchi, ero.`
            );
        }

        try {
            const response = await fetch(`https://api.waifu.im/search/?included_tags=${tag}`);
            if (response.status !== 200) {
                return message.reply("❌ | Failed to retrieve the image. Please try again.");
            }

            const data = await response.json();
            const image = data.images[0];

            if (!image) {
                return message.reply("⚠️ | No image found for the given tag.");
            }

            const imageResponse = await fetch(image.url);
            const buffer = await imageResponse.buffer();

            const filePath = `${tag}_anime.jpg`;
            fs.writeFileSync(filePath, buffer);

            await message.reply({
                body: `\n┏━━━━━━💭━━━━━━┓\n┃ 😌 𝐇𝐨𝐰 𝐢𝐬 𝐬𝐡𝐞?\n┃ 🏷 𝐈𝐦𝐚𝐠𝐞 𝐓𝐚𝐠: ${tag} 😌🥵\n┗━━━━━━━━━━━━━━━┛`,
                attachment: fs.createReadStream(filePath)
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            message.reply("❌ | An error occurred while fetching the image.");
        }
    }
};
