@echo off
TITLE GJJ-TRACKER - Démarrage
COLOR 0A
CLS

ECHO ========================================================
ECHO          GJJ-TRACKER - SYSTEME DE DEMARRAGE
ECHO ========================================================
ECHO.
ECHO [1/2] BACKEND (Supabase)
ECHO       Statut : HEBERGE (Cloud)
ECHO       Info   : Connecte a https://enkwnelkwlvlyjvbwyzq.supabase.co
ECHO       Etat   : ACTIF (Pas de terminal local necessaire)
ECHO.
ECHO [2/2] FRONTEND (Vite + React)
ECHO       Action : Demarrage du serveur de developpement...
ECHO.
ECHO ========================================================
ECHO.
ECHO L'application va s'ouvrir automatiquement dans votre navigateur.
ECHO Appuyez sur Ctrl+C pour arreter le serveur.
ECHO.

:: Ouvre le navigateur après une petite pause pour laisser Vite démarrer
TIMEOUT /T 3 >NOUL
START "" "http://localhost:5174"

:: Lance le serveur
npm run dev
PAUSE
