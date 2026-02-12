import { useState, useEffect, useCallback } from 'react';
import { supabase, DBProgress, convertDBProgressToAppFormat } from '../supabaseClient';
import { AppData, LessonProgress, VariationProgress, StudentProfile, DrillStatus, ConnectionOverride, PlannedCombo } from '../types';
import { DEFAULT_DATA } from '../initialData';

// Type minimal pour la liste des élèves (Admin)
export interface StudentListItem {
    id: string;
    name: string;
    belt?: string;
    email?: string;
}

export const useGJJData = () => {
    const [appData, setAppData] = useState<AppData>(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    // Admin: liste de tous les élèves
    const [allStudents, setAllStudents] = useState<StudentListItem[]>([]);
    // Admin: l'élève actuellement "observé" (peut être différent de l'admin lui-même)
    const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

    const isAdmin = user?.role === 'admin' || user?.isGuest;

    const loginAsGuest = useCallback(() => {
        setUser({ id: 'guest', email: 'demo@guest.local', role: 'admin', isGuest: true });
        setAppData(DEFAULT_DATA);
        setLoading(false);
    }, []);

    // Inscription par email/mot de passe
    const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) return { error: error.message };
            if (data.user) {
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    display_name: name,
                    role: 'student'
                });
            }
            return {};
        } catch (err: any) {
            return { error: err.message };
        }
    }, []);

    // Déconnexion
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setAppData(DEFAULT_DATA);
        setAllStudents([]);
        setViewingStudentId(null);
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
                const currentUser = session?.user || null;

                if (currentUser) {
                    // Charger le profil de l'utilisateur connecté
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();

                    // Fusionner les infos de rôle dans l'objet user
                    const enrichedUser = { ...currentUser, role: profile?.role || 'student' };
                    setUser(enrichedUser);

                    // Si admin, charger la liste de tous les élèves
                    if (profile?.role === 'admin') {
                        const { data: profiles } = await supabase.from('profiles').select('id, display_name, belt_rank, email');
                        if (profiles) {
                            setAllStudents(profiles.map(p => ({
                                id: p.id,
                                name: p.display_name || p.email || 'Sans nom',
                                belt: p.belt_rank,
                                email: p.email
                            })));
                        }
                    }

                    // Charger le progrès de l'utilisateur connecté (ou de l'élève observé)
                    const targetId = currentUser.id;
                    const { data: progress } = await supabase.from('progress').select('*').eq('user_id', targetId);

                    if (progress) {
                        const progressMap = convertDBProgressToAppFormat(progress as DBProgress[]);

                        setAppData(prev => ({
                            ...prev,
                            activeStudentId: targetId,
                            students: [{
                                ...prev.students[0],
                                id: targetId,
                                name: profile?.display_name || currentUser.email || 'Étudiant',
                                progress: progressMap,
                                drillStatus: {},
                                customConnections: {},
                                plannedCombos: []
                            }]
                        }));
                    }
                } else {
                    setUser(null);
                }
            } catch (err: any) {
                console.error("Erreur chargement:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_IN') initData();
            if (_event === 'SIGNED_OUT') {
                setUser(null);
                setAppData(DEFAULT_DATA);
                setAllStudents([]);
                setViewingStudentId(null);
            }
        });

        initData();
        return () => subscription.unsubscribe();
    }, []);

    // Admin: Changer l'élève observé
    const switchStudent = useCallback(async (studentId: string) => {
        if (!user || !isAdmin) return;

        setViewingStudentId(studentId);

        // En mode invité, on ne charge rien de Supabase
        if (user.isGuest) return;

        try {
            // Charger le profil de l'élève
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', studentId).single();
            // Charger le progrès de l'élève
            const { data: progress } = await supabase.from('progress').select('*').eq('user_id', studentId);

            if (progress) {
                const progressMap = convertDBProgressToAppFormat(progress as DBProgress[]);

                setAppData(prev => ({
                    ...prev,
                    activeStudentId: studentId,
                    students: [{
                        id: studentId,
                        name: profile?.display_name || 'Élève',
                        belt: profile?.belt_rank,
                        progress: progressMap,
                        drillStatus: {},
                        customConnections: {},
                        plannedCombos: []
                    }]
                }));
            }
        } catch (err: any) {
            console.error("Erreur changement d'élève:", err);
            setError(err.message);
        }
    }, [user, isAdmin]);

    // 2. Update Progress (Main) - utilise activeStudentId au lieu de user.id
    const updateProgress = useCallback(async (lessonId: string, variationId: string, updates: Partial<VariationProgress>) => {
        if (!user) return;

        const targetUserId = appData.activeStudentId || user.id;

        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === targetUserId);
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
            user_id: targetUserId,
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
                user_id: targetUserId,
                technique_id: lessonId,
                variation_id: variationId,
                activity_type: updates.history[0].type
            });
        }
    }, [user, appData.activeStudentId]);

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

    // 5. Reset Lesson - utilise activeStudentId
    const resetLesson = useCallback(async (lessonId: string) => {
        if (!user) return;

        const targetUserId = appData.activeStudentId || user.id;

        // Optimistic UI
        setAppData(prev => {
            const studentIndex = prev.students.findIndex(s => s.id === targetUserId);
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
            .eq('user_id', targetUserId)
            .eq('technique_id', lessonId);

    }, [user, appData.activeStudentId]);

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
        signUp,
        signOut,
        switchStudent,
        allStudents,
        viewingStudentId,
        isAdmin,
        loading,
        error,
        user,
        setAppData
    };
};
