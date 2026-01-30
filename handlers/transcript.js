const discordTranscripts = require('discord-html-transcripts');
const { MessageFlags } = require('discord.js');
const config = require('../config');
const { createLogEmbed, createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');

/**
 * Gera transcrição HTML do ticket
 */
async function generateTranscript(channel) {
    try {
        const transcript = await discordTranscripts.createTranscript(channel, {
            limit: -1, // Todas as mensagens
            returnType: 'attachment',
            filename: `transcript-${channel.name}.html`,
            saveImages: true,
            poweredBy: false,
            footerText: `Transcript gerado em {date} • ${config.texts.footerText}`
        });

        return transcript;
    } catch (error) {
        console.error('[TRANSCRIPT ERROR]', error);
        return null;
    }
}

/**
 * Envia transcrição para o canal de logs
 */
async function sendTranscriptToLogs(client, ticketData, transcript) {
    try {
        const logsChannel = client.channels.cache.get(config.channels.logs);

        if (!logsChannel) {
            console.error('[LOGS] Canal de logs não encontrado!');
            return false;
        }

        await logsChannel.send({
            embeds: [createLogEmbed(ticketData)],
            files: [transcript]
        });

        return true;
    } catch (error) {
        console.error('[SEND LOGS ERROR]', error);
        return false;
    }
}

/**
 * Salva transcrição (enviado pelo botão)
 */
async function handleSaveTranscript(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.channel;
        const transcript = await generateTranscript(channel);

        if (!transcript) {
            return await interaction.editReply({
                embeds: [createErrorEmbed('Não foi possível gerar a transcrição.')]
            });
        }

        // Enviar para o usuário
        await interaction.editReply({
            embeds: [createSuccessEmbed('Transcrição gerada com sucesso!')],
            files: [transcript]
        });

    } catch (error) {
        console.error('[SAVE TRANSCRIPT ERROR]', error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Erro ao gerar transcrição.')]
        }).catch(() => { });
    }
}

module.exports = {
    generateTranscript,
    sendTranscriptToLogs,
    handleSaveTranscript
};
