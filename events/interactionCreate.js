const config = require('../config');
const { sendTicketPanel, updateTicketPanel } = require('../handlers/ticketPanel');
const { handleCategorySelect, handleModalSubmit } = require('../handlers/ticketModal');
const { handleSaveTranscript } = require('../handlers/transcript');
const {
    handleCloseTicket,
    handleConfirmClose,
    handleCancelClose,
    handleStaffPanel,
    handleNotifyUser,
    handleClaimTicket,
    handleFeedback
} = require('../handlers/ticketActions');
const {
    sendConfigPanel,
    handleChannelsConfig,
    handleRolesConfig,
    handleTextsConfig,
    handleColorsConfig,
    handleImagesConfig,
    handleCategoriesConfig,
    handleAddCategoryModal,
    handleRemoveCategoryMenu,
    handleEmojisConfig,
    handleEditEmojisModal,
    handlePreviewTicket,
    handleResetConfig,
    handleBotConfig,
    handlePanelTextsConfig,
    handlePanelMainTextsModal,
    handlePanelScheduleModal,
    handlePanelInstructionsModal,
    handleExportConfig,
    handleImportConfig,
    createErrorEmbed,
    createSuccessEmbed
} = require('../handlers/configPanel');
const { updateBotPresence } = require('./ready');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

// Helper para atualizar painel após mudanças de config
async function refreshPanel(client) {
    try {
        await updateTicketPanel(client);
    } catch (e) {
        console.error('[REFRESH PANEL]', e);
    }
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            // ═══════════════════════════════════════════════════════════
            // SLASH COMMANDS
            // ═══════════════════════════════════════════════════════════
            if (interaction.isChatInputCommand()) {
                if (interaction.commandName === 'setup-ticket') {
                    return await sendTicketPanel(interaction);
                }
                if (interaction.commandName === 'config') {
                    return await sendConfigPanel(interaction, false);
                }
                if (interaction.commandName === 'stats') {
                    const statsCommand = require('../commands/stats');
                    return await statsCommand.execute(interaction);
                }
                if (interaction.commandName === 'import') {
                    const { executeImport } = require('../commands/backup');
                    return await executeImport(interaction);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // SELECT MENUS - STRING
            // ═══════════════════════════════════════════════════════════
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'ticket_select_category') {
                    return await handleCategorySelect(interaction);
                }
                // Remover categoria
                if (interaction.customId === 'config_select_remove_category') {
                    const categoryValue = interaction.values[0];
                    const currentConfig = config.loadConfig();
                    currentConfig.categories = currentConfig.categories.filter(c => c.value !== categoryValue);
                    config.saveConfig(currentConfig);
                    // Volta para a tela de categorias com select resetado
                    refreshPanel(interaction.client);
                    return await handleCategoriesConfig(interaction);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // SELECT MENUS - CHANNEL
            // ═══════════════════════════════════════════════════════════
            if (interaction.isChannelSelectMenu()) {
                if (interaction.customId === 'config_set_logs_channel') {
                    const channelId = interaction.values[0];
                    config.updateConfig('channels.logs', channelId);
                    // Volta para a tela de canais com select resetado
                    return await handleChannelsConfig(interaction);
                }
                if (interaction.customId === 'config_set_ticket_category') {
                    const categoryId = interaction.values[0];
                    config.updateConfig('channels.ticketCategory', categoryId);
                    // Volta para a tela de canais com select resetado
                    return await handleChannelsConfig(interaction);
                }
                if (interaction.customId === 'config_set_claimed_category') {
                    const categoryId = interaction.values[0];
                    config.updateConfig('channels.claimedTicketCategory', categoryId);
                    // Volta para a tela de canais com select resetado
                    return await handleChannelsConfig(interaction);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // SELECT MENUS - ROLE
            // ═══════════════════════════════════════════════════════════
            if (interaction.isRoleSelectMenu()) {
                if (interaction.customId === 'config_set_staff_role') {
                    const roleId = interaction.values[0];
                    config.updateConfig('roles.staff', roleId);
                    // Volta para a tela de cargos com select resetado
                    return await handleRolesConfig(interaction);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // MODALS
            // ═══════════════════════════════════════════════════════════
            if (interaction.isModalSubmit()) {
                // Modal de ticket
                if (interaction.customId.startsWith('ticket_modal_')) {
                    return await handleModalSubmit(interaction);
                }

                // Modal de importação
                if (interaction.customId === 'config_modal_import') {
                    const jsonText = interaction.fields.getTextInputValue('import_json');

                    try {
                        const importData = JSON.parse(jsonText);

                        if (!importData.version || !importData.data) {
                            return await interaction.reply({
                                embeds: [createErrorEmbed('JSON inválido. Use um backup exportado pelo bot.')],
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const fs = require('fs');
                        const path = require('path');
                        const dataDir = path.join(__dirname, '..', 'data');

                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }

                        const imported = [];
                        for (const [fileName, content] of Object.entries(importData.data)) {
                            try {
                                const filePath = path.join(dataDir, fileName);

                                // Resetar IDs
                                if (fileName === 'settings.json' && content.channels) {
                                    content.channels.logs = null;
                                    content.channels.ticketCategory = null;
                                    content.channels.claimedTicketCategory = null;
                                }
                                if (fileName === 'settings.json' && content.roles) {
                                    content.roles.staff = null;
                                }
                                if (fileName === 'panel.json') {
                                    content.channelId = null;
                                    content.messageId = null;
                                }

                                fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
                                imported.push(fileName);
                            } catch (e) { }
                        }

                        const successEmbed = new EmbedBuilder()
                            .setColor('#57F287')
                            .setDescription(
                                `✅ **Backup importado!**\n\n` +
                                `Arquivos: ${imported.map(f => `\`${f}\``).join(', ')}\n\n` +
                                `⚠️ Use \`/config\` para configurar canais e cargos.`
                            );

                        await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                        return;

                    } catch (e) {
                        return await interaction.reply({
                            embeds: [createErrorEmbed('Erro ao processar JSON. Verifique o formato.')],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                // Modal de textos
                if (interaction.customId === 'config_modal_texts') {
                    const serverName = interaction.fields.getTextInputValue('config_server_name');
                    const footerText = interaction.fields.getTextInputValue('config_footer_text');

                    config.updateConfig('texts.serverName', serverName);
                    config.updateConfig('texts.footerText', footerText);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Textos atualizados com sucesso!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }

                // Modal de cores
                if (interaction.customId === 'config_modal_colors') {
                    const primary = interaction.fields.getTextInputValue('config_color_primary');
                    const success = interaction.fields.getTextInputValue('config_color_success');
                    const danger = interaction.fields.getTextInputValue('config_color_danger');
                    const warning = interaction.fields.getTextInputValue('config_color_warning');
                    const info = interaction.fields.getTextInputValue('config_color_info');

                    // Validar formato hex
                    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
                    const colors = [primary, success, danger, warning, info];

                    for (const color of colors) {
                        if (!hexRegex.test(color)) {
                            return await interaction.reply({
                                embeds: [createErrorEmbed(`Formato inválido: \`${color}\`\nUse o formato #RRGGBB`)],
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    }

                    config.updateConfig('colors.primary', primary);
                    config.updateConfig('colors.success', success);
                    config.updateConfig('colors.danger', danger);
                    config.updateConfig('colors.warning', warning);
                    config.updateConfig('colors.info', info);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Cores atualizadas com sucesso!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }

                // Modal de imagens
                if (interaction.customId === 'config_modal_images') {
                    const banner = interaction.fields.getTextInputValue('config_image_banner') || '';
                    const thumbnail = interaction.fields.getTextInputValue('config_image_thumbnail') || '';
                    const footer = interaction.fields.getTextInputValue('config_image_footer') || '';

                    config.updateConfig('images.banner', banner);
                    config.updateConfig('images.thumbnail', thumbnail);
                    config.updateConfig('images.footer', footer);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Imagens atualizadas com sucesso!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }

                // Modal de adicionar categoria
                if (interaction.customId === 'config_modal_add_category') {
                    const label = interaction.fields.getTextInputValue('category_label');
                    const value = interaction.fields.getTextInputValue('category_value').toLowerCase().replace(/\s/g, '_');
                    const description = interaction.fields.getTextInputValue('category_description');
                    const emoji = interaction.fields.getTextInputValue('category_emoji');

                    const currentConfig = config.loadConfig();

                    // Verificar se já existe
                    if (currentConfig.categories.some(c => c.value === value)) {
                        return await interaction.reply({
                            embeds: [createErrorEmbed('Já existe uma categoria com esse ID!')],
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    currentConfig.categories.push({
                        label: label,
                        value,
                        description,
                        emoji
                    });

                    config.saveConfig(currentConfig);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription(`✅ Categoria **${emoji} ${label}** adicionada com sucesso!`);

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }

                // Modal de emojis
                if (interaction.customId === 'config_modal_emojis') {
                    const ticket = interaction.fields.getTextInputValue('emoji_ticket');
                    const close = interaction.fields.getTextInputValue('emoji_close');
                    const success = interaction.fields.getTextInputValue('emoji_success');
                    const error = interaction.fields.getTextInputValue('emoji_error');
                    const warning = interaction.fields.getTextInputValue('emoji_warning');

                    config.updateConfig('emojis.ticket', ticket);
                    config.updateConfig('emojis.close', close);
                    config.updateConfig('emojis.success', success);
                    config.updateConfig('emojis.error', error);
                    config.updateConfig('emojis.warning', warning);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Emojis atualizados com sucesso!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }

                // Modal de configuração do bot
                if (interaction.customId === 'config_modal_bot') {
                    const activityText = interaction.fields.getTextInputValue('bot_activity_text');
                    const activityEmoji = interaction.fields.getTextInputValue('bot_activity_emoji');
                    const activityType = interaction.fields.getTextInputValue('bot_activity_type');
                    const status = interaction.fields.getTextInputValue('bot_status');

                    // Validar tipo de atividade
                    const validTypes = ['Playing', 'Watching', 'Listening', 'Competing', 'Streaming'];
                    if (!validTypes.includes(activityType)) {
                        return await interaction.reply({
                            embeds: [createErrorEmbed(`Tipo inválido! Use: ${validTypes.join(', ')}`)],
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    // Validar status
                    const validStatus = ['online', 'idle', 'dnd', 'invisible'];
                    if (!validStatus.includes(status)) {
                        return await interaction.reply({
                            embeds: [createErrorEmbed(`Status inválido! Use: ${validStatus.join(', ')}`)],
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    config.updateConfig('bot.activityText', activityText);
                    config.updateConfig('bot.activityEmoji', activityEmoji);
                    config.updateConfig('bot.activityType', activityType);
                    config.updateConfig('bot.status', status);

                    // Atualizar presença do bot imediatamente
                    updateBotPresence(interaction.client);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Configurações do bot atualizadas!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    return;
                }

                // Modal de textos principais do painel
                if (interaction.customId === 'config_modal_panel_main') {
                    const title = interaction.fields.getTextInputValue('panel_title');
                    const description = interaction.fields.getTextInputValue('panel_description');
                    const selectInfo = interaction.fields.getTextInputValue('panel_select_info');
                    const warning = interaction.fields.getTextInputValue('panel_warning');

                    config.updateConfig('panelTexts.title', title);
                    config.updateConfig('panelTexts.description', description);
                    config.updateConfig('panelTexts.selectInfo', selectInfo);
                    config.updateConfig('panelTexts.warning', warning);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Textos do painel atualizados!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }

                // Modal de instruções do painel
                if (interaction.customId === 'config_modal_panel_instructions') {
                    const instructionsTitle = interaction.fields.getTextInputValue('panel_instructions_title');
                    const instructions = interaction.fields.getTextInputValue('panel_instructions');

                    config.updateConfig('panelTexts.instructionsTitle', instructionsTitle);
                    config.updateConfig('panelTexts.instructions', instructions);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Instruções do painel atualizadas!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }

                // Modal de horário e resposta do painel
                if (interaction.customId === 'config_modal_panel_schedule') {
                    const scheduleTitle = interaction.fields.getTextInputValue('panel_schedule_title');
                    const schedule = interaction.fields.getTextInputValue('panel_schedule');
                    const responseTitle = interaction.fields.getTextInputValue('panel_response_title');
                    const responseTime = interaction.fields.getTextInputValue('panel_response_time');

                    config.updateConfig('panelTexts.scheduleTitle', scheduleTitle);
                    config.updateConfig('panelTexts.schedule', schedule);
                    config.updateConfig('panelTexts.responseTitle', responseTitle);
                    config.updateConfig('panelTexts.responseTime', responseTime);

                    const successEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setDescription('✅ Horário e resposta atualizados!');

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                    refreshPanel(interaction.client);
                    return;
                }
            }

            // ═══════════════════════════════════════════════════════════
            // BUTTONS
            // ═══════════════════════════════════════════════════════════
            if (interaction.isButton()) {
                const customId = interaction.customId;

                // ─── CONFIG BUTTONS ───
                if (customId === 'config_channels') return await handleChannelsConfig(interaction);
                if (customId === 'config_roles') return await handleRolesConfig(interaction);
                if (customId === 'config_texts') return await handleTextsConfig(interaction);
                if (customId === 'config_colors') return await handleColorsConfig(interaction);
                if (customId === 'config_images') return await handleImagesConfig(interaction);
                if (customId === 'config_categories') return await handleCategoriesConfig(interaction);
                if (customId === 'config_add_category') return await handleAddCategoryModal(interaction);
                if (customId === 'config_remove_category') return await handleRemoveCategoryMenu(interaction);
                if (customId === 'config_emojis') return await handleEmojisConfig(interaction);
                if (customId === 'config_edit_emojis') return await handleEditEmojisModal(interaction);
                if (customId === 'config_preview') return await handlePreviewTicket(interaction);
                if (customId === 'config_reset') return await handleResetConfig(interaction);
                if (customId === 'config_bot') return await handleBotConfig(interaction);
                if (customId === 'config_panel_texts') return await handlePanelTextsConfig(interaction);
                if (customId === 'config_panel_main_texts') return await handlePanelMainTextsModal(interaction);
                if (customId === 'config_panel_instructions') return await handlePanelInstructionsModal(interaction);
                if (customId === 'config_panel_schedule') return await handlePanelScheduleModal(interaction);
                if (customId === 'config_export') return await handleExportConfig(interaction);
                if (customId === 'config_import') return await handleImportConfig(interaction);

                if (customId === 'config_confirm_reset') {
                    const fs = require('fs');
                    const path = require('path');
                    const configFile = path.join(__dirname, '..', 'data', 'settings.json');
                    try {
                        if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
                    } catch (e) { }

                    const currentConfig = config.loadConfig();
                    const successEmbed = new EmbedBuilder()
                        .setColor(currentConfig.colors?.success || '#57F287')
                        .setDescription('✅ Configurações resetadas para os valores padrão!')
                        .setFooter({ text: currentConfig.texts?.footerText || 'Sistema de Tickets' });

                    const backButton = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('config_back_main')
                            .setLabel('Voltar ao Menu')
                            .setEmoji('⬅️')
                            .setStyle(ButtonStyle.Primary)
                    );

                    await interaction.update({ embeds: [successEmbed], components: [backButton] });
                    refreshPanel(interaction.client);
                    return;
                }

                if (customId === 'config_back_main') {
                    return await sendConfigPanel(interaction, true);
                }

                // ─── TICKET BUTTONS ───
                if (customId.startsWith('ticket_close_')) {
                    const parts = customId.split('_');
                    const ticketId = parts[2];
                    const openerId = parts[3];
                    const category = parts[4];
                    return await handleCloseTicket(interaction, ticketId, openerId, category);
                }

                if (customId.startsWith('ticket_confirm_close_')) {
                    const parts = customId.split('_');
                    const ticketId = parts[3];
                    const openerId = parts[4];
                    const category = parts[5];
                    return await handleConfirmClose(interaction, ticketId, openerId, category);
                }

                if (customId === 'ticket_cancel_close') {
                    return await handleCancelClose(interaction);
                }

                if (customId.startsWith('ticket_staff_')) {
                    const ticketId = customId.split('_')[2];
                    return await handleStaffPanel(interaction, ticketId);
                }

                if (customId.startsWith('ticket_transcript_')) {
                    return await handleSaveTranscript(interaction);
                }

                if (customId.startsWith('ticket_notify_')) {
                    const ticketId = customId.split('_')[2];
                    return await handleNotifyUser(interaction, ticketId);
                }

                if (customId.startsWith('ticket_claim_')) {
                    const ticketId = customId.split('_')[2];
                    return await handleClaimTicket(interaction, ticketId);
                }

                // ─── FEEDBACK BUTTONS ───
                if (customId.startsWith('feedback_')) {
                    const parts = customId.split('_');
                    const rating = parts[1];
                    const ticketId = parts[2];
                    return await handleFeedback(interaction, rating, ticketId);
                }
            }

        } catch (error) {
            console.error('[INTERACTION ERROR]', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setDescription('❌ Ocorreu um erro ao processar sua solicitação.');

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                }
            } catch (e) {
                console.error('[ERROR RESPONSE FAILED]', e);
            }
        }
    }
};
