const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Templates de Embeds reutilizáveis
 */

// Embed do Painel de Suporte
function createPanelEmbed() {
    const currentConfig = config.loadConfig(); // Carregar config atualizado
    const panelTexts = currentConfig.panelTexts || {};
    const description = (panelTexts.description || "Bem-vindo à **Central de Suporte** do {serverName}!")
        .replace('{serverName}', currentConfig.texts.serverName);

    return new EmbedBuilder()
        .setColor(currentConfig.colors.primary)
        .setAuthor({
            name: `${currentConfig.emojis.ticket} Central de Suporte`,
            iconURL: currentConfig.images.thumbnail
        })
        .setTitle(panelTexts.title || '📬 Abrir um Ticket de Suporte')
        .setDescription(
            `${description}\n\n` +
            `${currentConfig.emojis.category} ${panelTexts.selectInfo || '**Selecione uma categoria abaixo** para abrir seu ticket.'}\n\n` +
            `> ${currentConfig.emojis.warning} ${panelTexts.warning || 'Antes de abrir um ticket, verifique se sua dúvida não foi respondida em nossos canais de informação.'}`
        )
        .setImage(currentConfig.images.banner)
        .setThumbnail(currentConfig.images.thumbnail)
        .addFields(
            {
                name: panelTexts.instructionsTitle || '📋 Instruções',
                value:
                    '```\n' +
                    (panelTexts.instructions || '1. Escolha a categoria do seu problema\n2. Preencha o formulário com detalhes\n3. Aguarde nossa equipe responder') +
                    '\n```',
                inline: false
            },
            {
                name: panelTexts.scheduleTitle || '⏰ Horário de Atendimento',
                value: `\`${panelTexts.schedule || 'Segunda a Sexta: 09h às 18h'}\``,
                inline: true
            },
            {
                name: panelTexts.responseTitle || '⚡ Tempo de Resposta',
                value: `\`${panelTexts.responseTime || 'Até 24 horas úteis'}\``,
                inline: true
            }
        )
        .setFooter({
            text: currentConfig.texts.footerText,
            iconURL: currentConfig.images.footer
        })
        .setTimestamp();
}

// Embed de Boas-vindas do Ticket
function createWelcomeEmbed(user, category, subject, description, customFields = []) {
    const currentConfig = config.loadConfig();
    const categoryInfo = currentConfig.categories.find(c => c.value === category) || { label: category, emoji: '📁' };

    const baseFields = [
        {
            name: `${currentConfig.emojis.user} Usuário`,
            value: `${user.tag}\n\`${user.id}\``,
            inline: true
        },
        {
            name: `${currentConfig.emojis.clock} Aberto em`,
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true
        },
        {
            name: '\u200b',
            value: '\u200b',
            inline: true
        },
        {
            name: '📌 Assunto',
            value: `\`\`\`${subject}\`\`\``,
            inline: false
        },
        {
            name: '📝 Descrição',
            value: `\`\`\`${description}\`\`\``,
            inline: false
        }
    ];

    // Adicionar campos personalizados
    for (const field of customFields) {
        baseFields.push({
            name: `📋 ${field.label}`,
            value: `\`${field.value}\``,
            inline: true
        });
    }

    return new EmbedBuilder()
        .setColor(currentConfig.colors.success)
        .setAuthor({
            name: `${currentConfig.emojis.ticket} Ticket Aberto`,
            iconURL: currentConfig.images.thumbnail
        })
        .setTitle(`${categoryInfo.label}`)
        .setDescription(
            `Olá ${user}! Bem-vindo ao seu ticket de suporte.\n\n` +
            `> Nossa equipe foi notificada e responderá em breve.\n` +
            `> Por favor, aguarde pacientemente.`
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(baseFields)
        .setFooter({
            text: `${currentConfig.texts.footerText} • Use os botões abaixo para ações`,
            iconURL: currentConfig.images.footer
        })
        .setTimestamp();
}

// Embed de Ticket Fechado
function createClosedEmbed(closedBy, openedBy, category, ticketId) {
    const currentConfig = config.loadConfig();
    return new EmbedBuilder()
        .setColor(currentConfig.colors.danger)
        .setAuthor({
            name: `${currentConfig.emojis.close} Ticket Fechado`,
            iconURL: currentConfig.images.thumbnail
        })
        .setTitle('📋 Informações do Ticket')
        .setDescription(`O ticket foi encerrado e a transcrição foi salva.`)
        .addFields(
            {
                name: `${currentConfig.emojis.user} Aberto por`,
                value: `${openedBy.tag}\n\`${openedBy.id}\``,
                inline: true
            },
            {
                name: `${currentConfig.emojis.staff} Fechado por`,
                value: `${closedBy.tag}\n\`${closedBy.id}\``,
                inline: true
            },
            {
                name: `${currentConfig.emojis.category} Categoria`,
                value: `\`${category}\``,
                inline: true
            },
            {
                name: `${currentConfig.emojis.ticket} ID do Ticket`,
                value: `\`${ticketId}\``,
                inline: true
            },
            {
                name: `${currentConfig.emojis.clock} Fechado em`,
                value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                inline: true
            }
        )
        .setFooter({
            text: currentConfig.texts.footerText,
            iconURL: currentConfig.images.footer
        })
        .setTimestamp();
}

// Embed de Log
function createLogEmbed(ticketData) {
    const currentConfig = config.loadConfig();
    return new EmbedBuilder()
        .setColor(currentConfig.colors.info)
        .setAuthor({
            name: `${currentConfig.emojis.transcript} Log de Ticket`,
            iconURL: currentConfig.images.thumbnail
        })
        .setTitle(`Ticket: ${ticketData.channelName}`)
        .addFields(
            {
                name: `${currentConfig.emojis.user} Aberto por`,
                value: `<@${ticketData.openedBy.id}>\n\`${ticketData.openedBy.tag}\``,
                inline: true
            },
            {
                name: `${currentConfig.emojis.staff} Fechado por`,
                value: `<@${ticketData.closedBy.id}>\n\`${ticketData.closedBy.tag}\``,
                inline: true
            },
            {
                name: `${currentConfig.emojis.category} Categoria`,
                value: `\`${ticketData.category}\``,
                inline: true
            },
            {
                name: `${currentConfig.emojis.clock} Duração`,
                value: `\`${ticketData.duration || 'N/A'}\``,
                inline: true
            }
        )
        .setFooter({
            text: `ID: ${ticketData.ticketId} • ${currentConfig.texts.footerText}`,
            iconURL: currentConfig.images.footer
        })
        .setTimestamp();
}

// Embed de Erro
function createErrorEmbed(message) {
    const currentConfig = config.loadConfig();
    return new EmbedBuilder()
        .setColor(currentConfig.colors.danger)
        .setDescription(`${currentConfig.emojis.error} ${message}`)
        .setFooter({ text: currentConfig.texts.footerText });
}

// Embed de Sucesso
function createSuccessEmbed(message) {
    const currentConfig = config.loadConfig();
    return new EmbedBuilder()
        .setColor(currentConfig.colors.success)
        .setDescription(`${currentConfig.emojis.success} ${message}`)
        .setFooter({ text: currentConfig.texts.footerText });
}

// Embed do Painel de Staff
function createStaffPanelEmbed() {
    const currentConfig = config.loadConfig();
    return new EmbedBuilder()
        .setColor(currentConfig.colors.warning)
        .setAuthor({
            name: `${currentConfig.emojis.staff} Painel de Staff`,
            iconURL: currentConfig.images.thumbnail
        })
        .setDescription(
            `**Opções disponíveis para a equipe:**\n\n` +
            `🔒 **Fechar Ticket** - Encerra o ticket atual\n` +
            `📑 **Salvar Transcrição** - Gera um arquivo HTML da conversa\n` +
            `🔔 **Notificar Usuário** - Menciona o usuário do ticket`
        )
        .setFooter({ text: currentConfig.texts.footerText });
}

module.exports = {
    createPanelEmbed,
    createWelcomeEmbed,
    createClosedEmbed,
    createLogEmbed,
    createErrorEmbed,
    createSuccessEmbed,
    createStaffPanelEmbed
};
