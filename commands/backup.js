const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { createSuccessEmbed, createErrorEmbed } = require('../utils/embeds');

const dataDir = path.join(__dirname, '..', 'data');

/**
 * Exporta todas as configurações do bot
 */
async function executeExport(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Coletar todos os dados
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            guildId: interaction.guild.id,
            guildName: interaction.guild.name,
            data: {}
        };

        // Lista de arquivos para exportar
        const filesToExport = [
            'settings.json',
            'stats.json',
            'feedback.json',
            'panel.json'
        ];

        for (const file of filesToExport) {
            const filePath = path.join(dataDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    exportData.data[file] = JSON.parse(content);
                } catch (e) {
                    console.log(`[EXPORT] Erro ao ler ${file}:`, e.message);
                }
            }
        }

        // Criar arquivo JSON
        const exportJson = JSON.stringify(exportData, null, 2);
        const fileName = `ticket-bot-backup-${interaction.guild.id}-${Date.now()}.json`;
        const attachment = new AttachmentBuilder(Buffer.from(exportJson), { name: fileName });

        await interaction.editReply({
            embeds: [createSuccessEmbed(
                `📤 **Backup exportado com sucesso!**\n\n` +
                `📁 Arquivo: \`${fileName}\`\n` +
                `📊 Dados incluídos:\n` +
                `• Configurações do bot\n` +
                `• Estatísticas de tickets\n` +
                `• Feedbacks recebidos\n` +
                `• Dados do painel\n\n` +
                `⚠️ Guarde este arquivo para importar em outro servidor!`
            )],
            files: [attachment]
        });

    } catch (error) {
        console.error('[EXPORT ERROR]', error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Erro ao exportar configurações.')]
        }).catch(() => { });
    }
}

/**
 * Importa configurações do bot
 */
async function executeImport(interaction) {
    try {
        const attachment = interaction.options.getAttachment('arquivo');

        if (!attachment) {
            return await interaction.reply({
                embeds: [createErrorEmbed('Por favor, anexe um arquivo de backup válido.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Verificar extensão
        if (!attachment.name.endsWith('.json')) {
            return await interaction.reply({
                embeds: [createErrorEmbed('O arquivo deve ser um JSON exportado pelo bot.')],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Baixar arquivo
        const response = await fetch(attachment.url);
        const jsonText = await response.text();

        let importData;
        try {
            importData = JSON.parse(jsonText);
        } catch (e) {
            return await interaction.editReply({
                embeds: [createErrorEmbed('Arquivo JSON inválido ou corrompido.')]
            });
        }

        // Validar estrutura
        if (!importData.version || !importData.data) {
            return await interaction.editReply({
                embeds: [createErrorEmbed('Este arquivo não parece ser um backup válido do bot.')]
            });
        }

        // Criar diretório data se não existir
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Importar cada arquivo
        const imported = [];
        for (const [fileName, content] of Object.entries(importData.data)) {
            try {
                const filePath = path.join(dataDir, fileName);

                // Atualizar IDs de canais e roles para null (devem ser reconfigurados)
                if (fileName === 'settings.json' && content.channels) {
                    content.channels.logs = null;
                    content.channels.ticketCategory = null;
                }
                if (fileName === 'settings.json' && content.roles) {
                    content.roles.staff = null;
                }
                // Limpar dados do painel (canal diferente)
                if (fileName === 'panel.json') {
                    content.channelId = null;
                    content.messageId = null;
                }

                fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
                imported.push(fileName);
            } catch (e) {
                console.log(`[IMPORT] Erro ao salvar ${fileName}:`, e.message);
            }
        }

        await interaction.editReply({
            embeds: [createSuccessEmbed(
                `📥 **Backup importado com sucesso!**\n\n` +
                `📊 Dados importados:\n` +
                imported.map(f => `• \`${f}\``).join('\n') + `\n\n` +
                `⚠️ **Importante:**\n` +
                `• Os canais e cargos foram resetados\n` +
                `• Use \`/config\` para reconfigurar\n` +
                `• Use \`/setup-ticket\` para criar novo painel\n\n` +
                `📁 Origem: ${importData.guildName || 'Desconhecido'}\n` +
                `📅 Data do backup: ${new Date(importData.exportDate).toLocaleString('pt-BR')}`
            )]
        });

        // Atualizar painel de tickets automaticamente
        try {
            const { refreshPanel } = require('../handlers/configPanel');
            await refreshPanel(interaction.client);
        } catch (e) {
            // Panel não existe ainda
        }

    } catch (error) {
        console.error('[IMPORT ERROR]', error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Erro ao importar configurações.')]
        }).catch(() => { });
    }
}

module.exports = {
    exportCommand: new SlashCommandBuilder()
        .setName('export')
        .setDescription('📤 Exporta todas as configurações do bot para backup')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .toJSON(),

    importCommand: new SlashCommandBuilder()
        .setName('import')
        .setDescription('📥 Importa configurações de um backup')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addAttachmentOption(option =>
            option.setName('arquivo')
                .setDescription('Arquivo JSON de backup exportado')
                .setRequired(true)
        )
        .toJSON(),

    executeExport,
    executeImport
};
