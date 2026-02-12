import { createClient } from '@supabase/supabase-js';
import { AppData, StudentProfile, CompetencyLevel, AppSettings, PointThresholds, LessonProgress } from './types';

// ===========================================
// ✅ CONFIGURATION SUPABASE (VIA .ENV.LOCAL)
// ===========================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("⚠️ Supabase credentials manquants dans .env.local !");
}

// Création du client unique
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- TYPES DE LA BASE DE DONNÉES (MAPPING) ---

// On définit ici à quoi ressemblent les données BRUTES venant de Supabase
// "gjj_app.profiles"
export interface DBProfile {
    id: string; // UUID
    display_name: string;
    belt_rank: string;
    role: string;
}

// "gjj_app.progress"
export interface DBProgress {
    user_id: string; // UUID
    technique_id: string;
    variation_id: string;
    video_count: number;
    training_count: number;
    drill_count: number;
    is_planned: boolean;
    notes: string | null;
    last_practiced: string | null; // ISO Date string
}

// "gjj_app.history"
export interface DBHistory {
    id: string;
    user_id: string;
    technique_id: string;
    variation_id: string;
    activity_type: 'video' | 'training' | 'drill';
    created_at: string;
}

// --- FONCTIONS UTILITAIRES POUR CONVERTIR LES DONNÉES ---

// Convertir les lignes de la DB (DBProgress[]) vers le format de l'App (LessonProgress)
export const convertDBProgressToAppFormat = (dbProgress: DBProgress[]): Record<string, LessonProgress> => {
    const progressMap: Record<string, LessonProgress> = {};

    dbProgress.forEach(row => {
        // Si la leçon n'existe pas encore dans la map, on l'initialise
        if (!progressMap[row.technique_id]) {
            progressMap[row.technique_id] = {
                techniqueId: row.technique_id,
                variations: {}
            };
        }

        // On ajoute la variation
        progressMap[row.technique_id].variations[row.variation_id] = {
            id: row.variation_id,
            videoCount: row.video_count,
            trainingCount: row.training_count,
            drillCount: row.drill_count,
            isPlanned: row.is_planned,
            notes: row.notes || undefined,
            lastPracticed: row.last_practiced ? new Date(row.last_practiced).getTime() : undefined,
            history: [] // L'historique sera chargé séparément ou à la demande pour alléger
        };
    });

    return progressMap;
};
