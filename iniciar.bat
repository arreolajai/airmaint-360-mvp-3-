@echo off
title AIRMAINT 360 MVP - Servidor Local
echo ========================================================
echo   AIRMAINT 360 MVP - Control de Mantenimiento
echo ========================================================
echo.
echo Verificando dependencias...
call npm install
echo.
echo Iniciando servidor de desarrollo...
echo Abre tu navegador en la direccion que aparecera a continuacion:
echo.
call npm run dev
pause
