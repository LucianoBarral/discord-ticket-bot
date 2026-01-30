@echo off
chcp 65001 >nul
title 📦 Instalação - Sistema de Tickets Discord

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║           INSTALAÇÃO DO SISTEMA DE TICKETS                    ║
echo ║                   Discord.js v14+                             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js em: https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js encontrado!
echo.

echo [2/3] Instalando dependências...
echo.
call npm install
echo.

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Falha ao instalar dependências!
    echo Verifique sua conexão com a internet.
    echo.
    pause
    exit /b 1
)

echo [3/3] Verificando arquivo .env...
if not exist ".env" (
    echo.
    echo ⚠️  Arquivo .env não encontrado!
    echo Criando arquivo .env de exemplo...
    echo.
    (
        echo # Configuração do Bot Discord
        echo # Obtenha seu token em: https://discord.com/developers/applications
        echo.
        echo DISCORD_TOKEN=SEU_TOKEN_AQUI
        echo GUILD_ID=ID_DO_SERVIDOR
    ) > .env
    echo ✅ Arquivo .env criado! Edite-o com suas credenciais.
) else (
    echo ✅ Arquivo .env encontrado!
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║              ✅ INSTALAÇÃO CONCLUÍDA!                         ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  Próximos passos:                                             ║
echo ║  1. Edite o arquivo .env com seu token e guild ID            ║
echo ║  2. Execute start.bat para iniciar o bot                     ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
pause
