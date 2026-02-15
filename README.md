# 🎫 Sistema de Tickets para Discord

<div align="center">

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Um bot de tickets completo, moderno e altamente customizável para servidores Discord**

[Instalação](#-instalação) •
[Comandos](#-comandos) •
[Configuração](#️-configuração) •
[Funcionalidades](#-funcionalidades)

</div>

---

## ✨ Funcionalidades

### 🎫 Sistema de Tickets
- ✅ Criação de tickets por categorias personalizadas
- ✅ Modal com assunto e descrição do problema
- ✅ Limite de tickets por usuário configurável
- ✅ Sistema de claim (reivindicação) de tickets
- ✅ Organização automática de tickets em categorias (pendentes/em atendimento)
- ✅ Transcrição HTML completa das conversas
- ✅ Logs detalhados de todas as ações

### 📊 Dashboard de Estatísticas
- ✅ Total de tickets abertos/fechados
- ✅ Taxa de resolução
- ✅ Sistema de avaliação (1-5 estrelas)
- ✅ Média de satisfação dos usuários

### ⚙️ Painel de Configuração Completo
- ✅ Configuração via Discord (sem editar código!)
- ✅ Personalização de cores, textos e imagens
- ✅ Configuração de canais e cargos
- ✅ Perfil do bot (status e atividade)
- ✅ Categorias de suporte personalizáveis
- ✅ Sistema de backup/restore de configurações

### 🔒 Segurança
- ✅ Verificação de permissões em todas as ações
- ✅ Token protegido via variáveis de ambiente
- ✅ Validação de entrada de dados
- ✅ Logs de auditoria

---

## 📋 Requisitos

- [Node.js](https://nodejs.org/) v18.0.0 ou superior
- Um [Bot Discord](https://discord.com/developers/applications) criado
- Permissões de Administrador no servidor

---

## 🚀 Instalação

### 1️⃣ Clone ou baixe o projeto

```bash
git clone https://github.com/LucianoBarral/discord-ticket-bot.git
cd discord-ticket-bot
```

### 2️⃣ Instale as dependências

```bash
npm install
```

### 3️⃣ Configure as variáveis de ambiente

Copie o arquivo de exemplo e edite com suas credenciais:

```bash
copy .env.example .env
```

Edite o arquivo `.env`:

```env
DISCORD_TOKEN=seu_token_do_bot_aqui
GUILD_ID=id_do_seu_servidor
```

### 4️⃣ Inicie o bot

```bash
npm start
```

Ou use o arquivo `start.bat` no Windows.

---

## 💻 Comandos

| Comando | Descrição | Permissão |
|---------|-----------|-----------|
| `/setup-ticket` | Envia o painel de tickets no canal atual | Administrador |
| `/config` | Abre o painel de configuração completo | Gerenciar Servidor |
| `/stats` | Exibe estatísticas do sistema de tickets | Gerenciar Servidor |
| `/import` | Importa configurações de um arquivo JSON | Gerenciar Servidor |

---

## ⚙️ Configuração

### Acessando o Painel de Configuração

Digite `/config` em qualquer canal para abrir o painel de configuração:

```
📋 Opções disponíveis:

🔧 Canais & Cargos     - Configure canais de logs, categorias e cargo de staff
🎨 Cores               - Personalize as cores dos embeds
🖼️ Imagens             - Configure banner, thumbnail e footer
📝 Textos              - Edite nome do servidor e textos do footer
📬 Textos do Painel    - Personalize completamente o painel de tickets
🤖 Perfil do Bot       - Configure status e atividade do bot
🎫 Tickets             - Limite de tickets e feedback
📁 Categorias          - Gerencie as categorias de suporte, etc.
💾 Exportar            - Exporte todas as configurações
📥 Importar            - Importe configurações de backup
🔄 Resetar             - Restaure as configurações padrão
```

### Categorias de Suporte

O bot vem com 5 categorias padrão que podem ser personalizadas:

| Categoria | Emoji |
|-----------|-------|
| 💰 Financeiro | 💰 |
| ❓ Dúvidas Gerais | ❓ |
| ⚠️ Denúncias | ⚠️ |
| 🛠️ Suporte Técnico | 🛠️ |
| 💼 Parcerias | 💼 |

---

## 📁 Estrutura do Projeto

```
📦 discord-ticket-bot
├── 📂 commands/          # Comandos slash
│   ├── backup.js         # Comando de import
│   └── stats.js          # Estatísticas
├── 📂 events/            # Eventos do Discord
│   ├── interactionCreate.js
│   └── ready.js
├── 📂 handlers/          # Handlers de funcionalidades
│   ├── configPanel.js    # Painel de configuração
│   ├── ticketActions.js  # Ações dos tickets
│   ├── ticketModal.js    # Modais de criação
│   ├── ticketPanel.js    # Painel de tickets
│   └── transcript.js     # Transcrições HTML
├── 📂 utils/             # Utilitários
│   └── embeds.js         # Templates de embeds
├── 📂 data/              # Dados persistentes (auto-gerado)
│   ├── settings.json     # Configurações
│   ├── stats.json        # Estatísticas
│   └── feedback.json     # Avaliações
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore
├── config.js             # Configuração principal
├── index.js              # Arquivo principal
├── package.json
└── README.md
```

---

## 🎨 Personalização

### Cores Disponíveis

| Tipo | Uso | Padrão |
|------|-----|--------|
| Primary | Embeds principais | `#5865F2` |
| Success | Mensagens de sucesso | `#57F287` |
| Warning | Avisos | `#FEE75C` |
| Danger | Erros e fechamentos | `#ED4245` |
| Info | Informações | `#5865F2` |

### Imagens Configuráveis

- **Banner**: Imagem grande no topo do painel
- **Thumbnail**: Imagem pequena no canto
- **Footer**: Ícone no rodapé dos embeds

---

## 📊 Sistema de Feedback

Quando um ticket é fechado, o usuário recebe uma mensagem privada (DM) solicitando avaliação:

- ⭐ 1 a 5 estrelas
- 💬 Comentário opcional

As avaliações são armazenadas e exibidas no comando `/stats`.

---

## 🔄 Backup e Restore

### Exportar Configurações
1. Acesse `/config`
2. Clique em "💾 Exportar/Importar"
3. Clique em "📤 Exportar Configurações"
4. O bot enviará um arquivo JSON com todas as configurações

### Importar Configurações
1. Use o comando `/import`
2. Anexe o arquivo JSON de backup
3. As configurações serão restauradas automaticamente

---

## 🛠️ Suporte

Encontrou um bug ou tem uma sugestão? Abra uma issue no GitHub!

---

## 📜 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

**Feito com ❤️ para a comunidade Discord**

</div>
