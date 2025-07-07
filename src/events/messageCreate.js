const { Events } = require('discord.js');
const { logger } = require('../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Log messages for debugging
        logger.debug(`Message from ${message.author.tag} in #${message.channel.name}: ${message.content}`);

        // Example: Respond to mentions
        if (message.mentions.has(client.user)) {
            await message.reply('👋 Hello! Use `/help` to see what I can do!');
        }

        // Example: Auto-react to specific keywords
        if (message.content.toLowerCase().includes('good bot')) {
            await message.react('❤️');
        }

        // Add more message handling logic here
    },
};
