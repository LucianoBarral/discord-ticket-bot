@echo off
chcp 65001 >nul
title 🎫 Sistema de Tickets - Discord Bot

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║           SISTEMA DE SUPORTE/TICKET PROFISSIONAL              ║
echo ║                   Discord.js v14+                             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo ❌ Dependências não instaladas!
    echo Execute instalacao.bat primeiro.
    echo.
    pause
    exit /b 1
)

:: Verificar se .env existe
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado!
    echo Execute instalacao.bat primeiro ou crie o arquivo .env
    echo.
    pause
    exit /b 1
)

echo 🚀 Iniciando o bot...
echo.
echo ─────────────────────────────────────────────────────────────────
echo.

node index.js

echo.
echo ─────────────────────────────────────────────────────────────────
echo.
echo ⚠️  O bot foi encerrado.
echo.
pause
