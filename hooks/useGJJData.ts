import { useState, useEffect, useCallback } from 'react';
import { supabase, DBProgress, convertDBProgressToAppFormat } from '../supabaseClient';
import { AppData, LessonProgress, VariationProgress, StudentProfile, DrillStatus, ConnectionOverride, PlannedCombo } from '../types';
import { DEFAULT_DATA } from '../initialData';

export const useGJJData = () => {
    const [appData, setAppData] = useState<AppData>(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    const loginAsGuest = useCallback(() => {
        setUser({ id: 'guest', email: 'demo@guest.local', role: 'admin', isGuest: true });
        setAppData(DEFAULT_DATA);
        setLoading(false);
    }, []);

    // 1. Initialisation
    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);

                // Si on est déjà en mode invité, on ne fait rien
                if (user?.isGuest) {
                    setLoading(false);
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);

                if (session?.user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    const { data: progress } = await supabase.from('progress').select('*').eq('user_id', session.user.id);
                    // Charger l'historique des drills/sims si nécessaire, pour l'instant on garde ça simple ou on ajoutera une table dédiée plus tard
                    // Pour ce MVP, drillStatus et customConnections sont stockés localement ou on devra créer des tables pour eux.
                    // NOTE: Le plan initial ne couvrait que 'progress'. Pour 'drillStatus' et 'customConnections', 
                    // on va utiliser le localStorage pour l'instant EN ATTENDANT une migration complète, 
                    // ou on simule pour que l'app ne plante pas.

                    if (progress) {
                        const progressMap = convertDBProgressToAppFormat(progress as DBProgress[]);

                        setAppData(prev => ({
                            ...prev,
                            activeStudentId: session.user.id,
                            students: [{
                                ...prev.students[0], // On garde la structure de base (settings, etc)
                                id: session.user.id,
                                name: profile?.display_name || session.user.email || 'Étudiant',
                                progress: progressMap,
                                // TODO: Persister ces champs dans Supabase (jsonb ?)
                                drillStatus: {},
                                customConnections: {},
                                plannedCombos: []
                            }]
                        }));
                    }
                }
            } catch (err: any) {
                console.error("Erreur chargement:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (_event === 'SIGNED_IN') initData();
            if (_event === 'SIGNED_OUT') setAppData(DEFAULT_DATA);
        });

        initData();
        return () => subscription.unsubscribe();
    }, []);

    // 2. Update Progress (Main)
    const updateProgress = useCallback(async (lessonId: string, variationId: string, updates: Partial<VariationProgress>) => {
        if (!user) return;

        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === user.id);
            if (studentIndex === -1) return prev;
            const newStudents = [...prev.students];
            const currentStudent = newStudents[studentIndex];
            const currentLesson = currentStudent.progress[lessonId] || { techniqueId: lessonId, variations: {} };
            const currentVar = currentLesson.variations[variationId] || { id: variationId, videoCount: 0, trainingCount: 0, drillCount: 0 };
            const updatedVar = { ...currentVar, ...updates };

            newStudents[studentIndex] = {
                ...currentStudent,
                progress: {
                    ...currentStudent.progress,
                    [lessonId]: {
                        ...currentLesson,
                        variations: { ...currentLesson.variations, [variationId]: updatedVar }
                    }
                }
            };
            return { ...prev, students: newStudents };
        });

        if (user.isGuest) return;

        const payload: any = {
            user_id: user.id,
            technique_id: lessonId,
            variation_id: variationId,
            updated_at: new Date().toISOString()
        };
        if (updates.videoCount !== undefined) payload.video_count = updates.videoCount;
        if (updates.trainingCount !== undefined) payload.training_count = updates.trainingCount;
        if (updates.drillCount !== undefined) payload.drill_count = updates.drillCount;
        if (updates.isPlanned !== undefined) payload.is_planned = updates.isPlanned;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        if (updates.lastPracticed !== undefined) payload.last_practiced = new Date(updates.lastPracticed).toISOString();

        await supabase.from('progress').upsert(payload);

        if (updates.history && updates.history.length > 0) {
            await supabase.from('history').insert({
                user_id: user.id,
                technique_id: lessonId,
                variation_id: variationId,
                activity_type: updates.history[0].type
            });
        }
    }, [user]);

    // 3. Drill Status (Simulations) - LOCAL ONLY FOR NOW (TODO: Add table)
    const updateDrillStatus = useCallback((drillId: string, status: Partial<DrillStatus>) => {
        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === prev.activeStudentId);
            if (studentIndex === -1) return prev;
            const newStudents = [...prev.students];
            const currentStudent = newStudents[studentIndex];

            const currentStatus = currentStudent.drillStatus[drillId] || { id: drillId, history: [] };
            const newStatus = { ...currentStatus, ...status };

            newStudents[studentIndex] = {
                ...currentStudent,
                drillStatus: { ...currentStudent.drillStatus, [drillId]: newStatus }
            };
            return { ...prev, students: newStudents };
        });
    }, []);

    // 4. Custom Connections - LOCAL ONLY FOR NOW
    const updateCustomConnection = useCallback((techId: string, connection: ConnectionOverride | undefined) => {
        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === prev.activeStudentId);
            if (studentIndex === -1) return prev;
            const newStudents = [...prev.students];
            const currentStudent = newStudents[studentIndex];

            const newConnections = { ...currentStudent.customConnections };
            if (connection) {
                newConnections[techId] = connection;
            } else {
                delete newConnections[techId];
            }

            newStudents[studentIndex] = {
                ...currentStudent,
                customConnections: newConnections
            };
            return { ...prev, students: newStudents };
        });
    }, []);

    // 5. Reset Lesson
    const resetLesson = useCallback(async (lessonId: string) => {
        if (!user) return;

        // Optimistic UI
        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === user.id);
            if (studentIndex === -1) return prev;
            const newStudents = [...prev.students];
            const currentStudent = newStudents[studentIndex];

            const newProgress = { ...currentStudent.progress };
            delete newProgress[lessonId]; // Remove local progress

            newStudents[studentIndex] = { ...currentStudent, progress: newProgress };
            return { ...prev, students: newStudents };
        });

        if (user.isGuest) return;

        // Supabase Delete
        await supabase.from('progress')
            .delete()
            .eq('user_id', user.id)
            .eq('technique_id', lessonId);

    }, [user]);

    // 6. Planned Combos - LOCAL ONLY FOR NOW
    const updatePlannedCombos = useCallback((combos: PlannedCombo[]) => {
        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === prev.activeStudentId);
            if (studentIndex === -1) return prev;
            const newStudents = [...prev.students];
            newStudents[studentIndex] = {
                ...newStudents[studentIndex],
                plannedCombos: combos
            };
            return { ...prev, students: newStudents };
        });
    }, []);

    // 7. Settings & Profile
    const updateSettings = useCallback((settings: any) => {
        setAppData(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
        // TODO: Persist settings in DB
    }, []);

    const updateProfile = useCallback(async (name: string, belt: string) => {
        if (!user) return;

        // Optimistic
        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === prev.activeStudentId);
            if (studentIndex === -1) return prev;
            const newStudents = [...prev.students];
            newStudents[studentIndex] = { ...newStudents[studentIndex], name, belt };
            return { ...prev, students: newStudents };
        });

        if (user.isGuest) return;

        await supabase.from('profiles').update({ display_name: name, belt_rank: belt }).eq('id', user.id);
    }, [user]);

    return {
        appData,
        updateProgress,
        updateDrillStatus,
        updateCustomConnection,
        resetLesson,
        updatePlannedCombos,
        updateSettings,
        updateProfile,
        loginAsGuest,
        loading,
        error,
        user,
        setAppData
    };
};
