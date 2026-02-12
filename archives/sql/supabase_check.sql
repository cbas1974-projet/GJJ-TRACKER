-- 🕵️ SCRIPT D'INVESTIGATION SUPABASE
-- Copiez ce script dans l'éditeur SQL de Supabase et cliquez sur RUN.
-- Il va lister tous les SCHÉMAS et TABLES existants pour que vous puissiez voir ce qu'il y a.

SELECT 
    schemaname as "Schéma (Dossier)",
    tablename as "Table (Fichier)",
    tableowner as "Propriétaire"
FROM 
    pg_catalog.pg_tables
WHERE 
    schemaname NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage', 'realtime', 'pgsodium', 'vault', 'graphql_public')
ORDER BY 
    schemaname, tablename;

-- Explication des Schémas par défaut que vous verrez peut-être :
-- public : C'est le dossier par défaut où tout va si on ne précise rien.
-- auth, storage : C'est interne à Supabase (utilisateurs, fichiers). Ne pas toucher.
