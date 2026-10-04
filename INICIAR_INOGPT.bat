@echo off
title inoGPT
if not exist node_modules (
  echo Instalando componentes necesarios...
  call npm install
)
if not exist .env (
  copy .env.example .env >nul
  echo.
  echo FALTA CONFIGURAR TU CLAVE API.
  echo Abre el archivo .env y coloca tu OPENAI_API_KEY.
  echo Despues vuelve a ejecutar este archivo.
  pause
  exit /b
)
start "" http://localhost:3000
npm start
