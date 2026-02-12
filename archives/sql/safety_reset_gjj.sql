-- ==============================================================================
-- 🛡️ SCRIPT DE RÉINITIALISATION SÉCURISÉE (GJJ-TRACKER)
-- Ce script vide UNIQUEMENT les données de progression de ce projet.
-- Vos autres tables et projets Supabase ne seront PAS affectés.
-- ==============================================================================

-- 1. Vide la table des progrès techniques
TRUNCATE TABLE public.progress CASCADE;

-- 2. Vide la table de l'historique d'entraînement
TRUNCATE TABLE public.history CASCADE;

-- NOTE : La table 'profiles' n'est PAS touchée pour préserver vos informations de compte
-- et éviter tout conflit avec d'autres projets partageant la même base.

-- FIN DU SCRIPT
-- Copiez ce texte dans l'éditeur SQL de Supabase et cliquez sur RUN.
