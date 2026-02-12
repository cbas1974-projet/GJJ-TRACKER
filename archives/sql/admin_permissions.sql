-- ==============================================================================
-- 🛡️ PERMISSIONS ADMINISTRATEUR GJJ-TRACKER
-- ==============================================================================
-- Ce script ajoute des politiques RLS pour permettre aux administrateurs 
-- de voir et modifier les données de tous les élèves.
--
-- PRÉREQUIS : La colonne 'role' doit exister dans la table 'profiles'.
-- Si elle n'existe pas, exécutez d'abord :
--   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'VOTRE_EMAIL_ICI';
-- ==============================================================================

-- 1. Autoriser les admins à VOIR tous les progrès
CREATE POLICY "Admins can view all progress" 
ON public.progress FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  OR user_id = auth.uid()
);

-- 2. Autoriser les admins à MODIFIER tous les progrès
CREATE POLICY "Admins can update all progress" 
ON public.progress FOR UPDATE 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  OR user_id = auth.uid()
);

-- 3. Autoriser les admins à INSÉRER des progrès pour n'importe quel élève
CREATE POLICY "Admins can insert progress for any student"
ON public.progress FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  OR user_id = auth.uid()
);

-- 4. Autoriser les admins à VOIR tous les profils
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  OR id = auth.uid()
);

-- 5. Autoriser les admins à VOIR tout l'historique
CREATE POLICY "Admins can view all history"
ON public.history FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  OR user_id = auth.uid()
);

-- 6. Autoriser les admins à INSÉRER dans l'historique pour n'importe quel élève
CREATE POLICY "Admins can insert history for any student"
ON public.history FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  OR user_id = auth.uid()
);

-- ==============================================================================
-- ⚠️ INSTRUCTIONS D'UTILISATION :
-- 1. Copiez tout ce texte dans l'éditeur SQL de Supabase.
-- 2. Cliquez sur RUN.
-- 3. Si une politique avec le même nom existe déjà, supprimez-la d'abord
--    avec : DROP POLICY "nom_de_la_politique" ON public.nom_de_la_table;
-- ==============================================================================
