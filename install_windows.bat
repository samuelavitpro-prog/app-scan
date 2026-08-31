@echo off
chcp 65001 > nul
cls
title Installation et Démarrage - Locasyst Pro (Windows 10 / 11)

echo ==========================================================
echo        🚀 INSTALLATEUR LOCASYST PRO - WINDOWS 10 / 11
echo ==========================================================
echo.

:: 1. Détection de Windows et de l'architecture
echo [1/4] Vérification de votre environnement Windows...
if defined PROCESSOR_ARCHITEW6432 (
    echo System: Windows 64-bit (Emulé sur %PROCESSOR_ARCHITECTURE%)
) else (
    echo Architecture: %PROCESSOR_ARCHITECTURE% (Windows 10 / 11)
)
echo.

:: 2. Vérification de la présence de Node.js
echo [2/4] Vérification de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERREUR : Node.js n'est pas installé sur votre ordinateur.
    echo.
    echo 👉 Pour utiliser Locasyst Pro sur Windows 10 ou 11 :
    echo    1. Téléchargez la version LTS sur : https://nodejs.org/
    echo    2. Lancez l'installateur Windows (.msi)
    echo    3. Relancez ensuite ce fichier 'install_windows.bat'.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo ✅ Node.js détecté : %NODE_VER%
echo.

:: 3. Installation des dépendances npm
echo [3/4] Installation et mise à jour des dépendances...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors de l'installation des dépendances npm.
    pause
    exit /b %errorlevel%
)
echo ✅ Dépendances installées avec succès.
echo.

:: 4. Création du lanceur rapide sur le Bureau Windows
echo [4/4] Configuration du raccourci...
set "CURRENT_DIR=%~dp0"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "LAUNCHER_BAT=%DESKTOP_DIR%\Lancer Locasyst Pro.bat"

if exist "%DESKTOP_DIR%" (
    (
        echo @echo off
        echo cd /d "%CURRENT_DIR%"
        echo title Locasyst Pro
        echo start http://localhost:3000
        echo npm run dev
    ) > "%LAUNCHER_BAT%"
    echo ✅ Raccourci créé sur votre Bureau : "Lancer Locasyst Pro.bat"
)
echo.

echo ==========================================================
echo   ✅ Locasyst Pro est prêt à fonctionner !
echo   🌐 Ouverture de l'application : http://localhost:3000
echo ==========================================================
echo.

:: Démarrage du navigateur et du serveur local
start http://localhost:3000
npm run dev
