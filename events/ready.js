const { ActivityType } = require('discord.js');
const config = require('../config');

// Mapeamento de tipos de atividade
const activityTypeMap = {
    'Playing': ActivityType.Playing,
    'Streaming': ActivityType.Streaming,
    'Listening': ActivityType.Listening,
    'Watching': ActivityType.Watching,
    'Competing': ActivityType.Competing
};

/**
 * Atualiza a presença do bot com base nas configurações
 */
function updateBotPresence(client) {
    try {
        const botConfig = config.bot || {};
        const activityType = activityTypeMap[botConfig.activityType] || ActivityType.Watching;
        const activityText = botConfig.activityText || 'Sistema de Suporte';
        const activityEmoji = botConfig.activityEmoji || '🎫';
        const status = botConfig.status || 'online';

        client.user.setPresence({
            activities: [{
                name: `${activityEmoji} ${activityText}`,
                type: activityType
            }],
            status: status
        });
    } catch (error) {
        console.error('[PRESENCE] Erro ao atualizar presença:', error);
    }
}

module.exports = {
    name: 'clientReady',
    once: true,
    execute(client) {
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║          SISTEMA DE TICKETS - DISCORD BOT                     ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  🤖 Bot: ${client.user.tag.padEnd(47)}║`);
        console.log(`║  🌐 Servidores: ${String(client.guilds.cache.size).padEnd(42)}║`);
        console.log(`║  👥 Usuários: ${String(client.users.cache.size).padEnd(44)}║`);
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  ✅ Sistema de Tickets carregado com sucesso!                 ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');

        // Definir status do bot usando as configurações
        updateBotPresence(client);
    },
    updateBotPresence
};
