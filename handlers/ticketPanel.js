const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const config = require('../config');
const { createPanelEmbed, createErrorEmbed } = require('../utils/embeds');
const fs = require('fs');
const path = require('path');

// Arquivo para armazenar dados do painel
const PANEL_DATA_FILE = path.join(__dirname, '..', 'data', 'panel.json');

/**
 * Salva informações do painel para atualização dinâmica
 */
function savePanelData(channelId, messageId) {
    try {
        const dataDir = path.dirname(PANEL_DATA_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(PANEL_DATA_FILE, JSON.stringify({ channelId, messageId }, null, 2));
        return true;
    } catch (error) {
        console.error('[PANEL DATA] Erro ao salvar:', error);
        return false;
    }
}

/**
 * Carrega informações do painel
 */
function loadPanelData() {
    try {
        if (fs.existsSync(PANEL_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(PANEL_DATA_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('[PANEL DATA] Erro ao carregar:', error);
    }
    return null;
}

/**
 * Cria os componentes do painel (select menu)
 */
function createPanelComponents() {
    const currentConfig = config.loadConfig();

    // Criar opções do Select Menu baseado nas categorias do config
    const selectOptions = currentConfig.categories.map(category => ({
        label: category.label,
        value: category.value,
        description: category.description,
        emoji: category.emoji
    }));

    // Se não houver categorias, adicionar uma opção padrão
    if (selectOptions.length === 0) {
        selectOptions.push({
            label: '⚠️ Nenhuma categoria',
            value: 'none',
            description: 'Configure as categorias primeiro',
            emoji: '⚠️'
        });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_select_category')
        .setPlaceholder('📁 Selecione uma categoria...')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(selectOptions);

    return [new ActionRowBuilder().addComponents(selectMenu)];
}

/**
 * Atualiza o painel de tickets existente
 */
async function updateTicketPanel(client) {
    try {
        const panelData = loadPanelData();
        if (!panelData) return false;

        const channel = await client.channels.fetch(panelData.channelId).catch(() => null);
        if (!channel) return false;

        const message = await channel.messages.fetch(panelData.messageId).catch(() => null);
        if (!message) return false;

        await message.edit({
            embeds: [createPanelEmbed()],
            components: createPanelComponents()
        });

        console.log('[PANEL] Painel atualizado dinamicamente!');
        return true;
    } catch (error) {
        console.error('[PANEL UPDATE ERROR]', error);
        return false;
    }
}

/**
 * Cria o painel de suporte com Select Menu
 */
async function sendTicketPanel(interaction) {
    try {
        // Verificar permissões
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                embeds: [createErrorEmbed('Você não tem permissão para usar este comando!')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Enviar painel
        const message = await interaction.channel.send({
            embeds: [createPanelEmbed()],
            components: createPanelComponents()
        });

        // Salvar dados do painel para atualização dinâmica
        savePanelData(interaction.channel.id, message.id);

        await interaction.reply({
            content: `${config.emojis?.success || '✅'} Painel de suporte enviado! Ele será atualizado automaticamente quando você alterar as configurações.`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('[TICKET PANEL ERROR]', error);
        await interaction.reply({
            embeds: [createErrorEmbed('Ocorreu um erro ao enviar o painel de suporte.')],
            flags: MessageFlags.Ephemeral
        }).catch(() => { });
    }
}

module.exports = {
    sendTicketPanel,
    updateTicketPanel,
    loadPanelData,
    createPanelComponents
};
